"use server";

import { prisma } from "@/lib/prisma";
import { calculatePredictionScore, normalizeTeamName } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RulesConfig {
  id: string;
  exactScorePoints: number;
  winnerPoints: number;
  drawPoints: number;
  wrongPoints: number;
  isActive: boolean;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getActiveRules(): Promise<RulesConfig> {
  let rules = await prisma.ruleConfiguration.findFirst({ where: { isActive: true } });
  if (!rules) {
    rules = await prisma.ruleConfiguration.create({
      data: {
        exactScorePoints: 3,
        winnerPoints: 1,
        drawPoints: 1,
        wrongPoints: 0,
        isActive: true,
      },
    });
  }
  return rules;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [totalParticipants, totalPredictions, totalMatches, hitsResult, imports] =
    await Promise.all([
      prisma.participant.count(),
      prisma.prediction.count(),
      prisma.match.count(),
      prisma.prediction.aggregate({ _sum: { score: true } }),
      prisma.importHistory.findMany({ orderBy: { importedAt: "desc" }, take: 5 }),
    ]);

  return {
    totalParticipants,
    totalPredictions,
    totalMatches,
    totalScore: hitsResult._sum.score ?? 0,
    recentImports: imports,
  };
}

export async function getRankingData() {
  const participants = await prisma.participant.findMany({
    include: {
      predictions: { include: { match: true } },
    },
  });

  const ranking = participants
    .map((p) => {
      const totalScore = p.predictions.reduce((s, pred) => s + pred.score, 0);
      const finished = p.predictions.filter((pr) => pr.match.officialResult !== null);
      const hits = finished.filter((pr) => pr.score > 0).length;
      const errors = finished.length - hits;
      const hitPercentage = finished.length > 0 ? (hits / finished.length) * 100 : 0;

      return {
        id: p.id,
        participant: p,
        totalScore,
        totalHits: hits,
        totalErrors: errors,
        hitPercentage,
        predictions: p.predictions,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || b.totalHits - a.totalHits)
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return ranking;
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function getParticipants() {
  return prisma.participant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { predictions: true } } },
  });
}

export async function getParticipantById(id: string) {
  return prisma.participant.findUnique({
    where: { id },
    include: {
      predictions: {
        include: { match: true },
        orderBy: { match: { matchDate: "asc" } },
      },
    },
  });
}

export async function createParticipant(data: { name: string; email: string }) {
  const existing = await prisma.participant.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email já cadastrado");

  const participant = await prisma.participant.create({ data });
  revalidatePath("/participants");
  revalidatePath("/ranking");
  return participant;
}

export async function updateParticipant(id: string, data: { name: string; email: string }) {
  const participant = await prisma.participant.update({ where: { id }, data });
  revalidatePath("/participants");
  revalidatePath("/ranking");
  return participant;
}

export async function deleteParticipant(id: string) {
  await prisma.participant.delete({ where: { id } });
  revalidatePath("/participants");
  revalidatePath("/ranking");
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function getMatches() {
  return prisma.match.findMany({
    orderBy: { matchDate: "asc" },
    include: { _count: { select: { predictions: true } } },
  });
}

export async function createMatch(data: {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  round?: string;
}) {
  const match = await prisma.match.create({
    data: { ...data, matchDate: new Date(data.matchDate) },
  });
  revalidatePath("/matches");
  return match;
}

export async function updateMatch(
  id: string,
  data: { homeTeam?: string; awayTeam?: string; matchDate?: string; round?: string }
) {
  const match = await prisma.match.update({
    where: { id },
    data: {
      ...data,
      matchDate: data.matchDate ? new Date(data.matchDate) : undefined,
    },
  });
  revalidatePath("/matches");
  return match;
}

export async function setMatchResult(id: string, officialResult: string) {
  const match = await prisma.match.update({
    where: { id },
    data: { officialResult, status: "FINISHED" },
    include: { predictions: true },
  });

  const rules = await getActiveRules();

  await Promise.all(
    match.predictions.map((pred) => {
      const score = calculatePredictionScore(pred.prediction, officialResult, rules);
      return prisma.prediction.update({ where: { id: pred.id }, data: { score } });
    })
  );

  revalidatePath("/matches");
  revalidatePath("/ranking");
  revalidatePath("/dashboard");
  return match;
}

export async function deleteMatch(id: string) {
  await prisma.match.delete({ where: { id } });
  revalidatePath("/matches");
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export async function updatePrediction(id: string, prediction: string) {
  const pred = await prisma.prediction.findUnique({
    where: { id },
    include: { match: true },
  });
  if (!pred) throw new Error("Palpite não encontrado");

  const rules = await getActiveRules();
  const score =
    pred.match.officialResult
      ? calculatePredictionScore(prediction, pred.match.officialResult, rules)
      : 0;

  const updated = await prisma.prediction.update({
    where: { id },
    data: { prediction, score },
  });

  revalidatePath("/participants");
  revalidatePath("/ranking");
  return updated;
}

// ─── Import CSV ───────────────────────────────────────────────────────────────

interface CSVPredictionInput {
  round: string | null;
  homeTeam: string;
  awayTeam: string;
  prediction: string;
}

interface CSVRowInput {
  name: string;
  email: string;
  predictions: CSVPredictionInput[];
}

export async function importCSVData(fileName: string, rows: CSVRowInput[]) {
  const rules = await getActiveRules();
  let totalRecords = 0;
  let matchesCreated = 0;

  try {
    // Carrega todos os jogos existentes e monta um cache normalizado
    // para evitar duplicar jogos já cadastrados (ignorando acentos/maiúsculas).
    const existingMatches = await prisma.match.findMany();
    const matchCache = new Map<string, (typeof existingMatches)[number]>();
    for (const m of existingMatches) {
      matchCache.set(
        `${normalizeTeamName(m.homeTeam)}|${normalizeTeamName(m.awayTeam)}`,
        m
      );
    }

    for (const row of rows) {
      const name = row.name.trim();
      const email = row.email.toLowerCase().trim();
      if (!email) continue;

      let participant = await prisma.participant.findUnique({ where: { email } });
      if (!participant) {
        participant = await prisma.participant.create({ data: { name, email } });
      } else if (name) {
        await prisma.participant.update({ where: { id: participant.id }, data: { name } });
      }

      for (const pred of row.predictions) {
        const cacheKey = `${normalizeTeamName(pred.homeTeam)}|${normalizeTeamName(pred.awayTeam)}`;
        let match = matchCache.get(cacheKey);

        // Jogo ainda não existe — cria automaticamente.
        // Data é um placeholder; o administrador pode ajustar em /matches.
        if (!match) {
          match = await prisma.match.create({
            data: {
              homeTeam: pred.homeTeam,
              awayTeam: pred.awayTeam,
              round: pred.round,
              matchDate: new Date(),
              status: "SCHEDULED",
            },
          });
          matchCache.set(cacheKey, match);
          matchesCreated++;
        }

        const score = match.officialResult
          ? calculatePredictionScore(pred.prediction, match.officialResult, rules)
          : 0;

        await prisma.prediction.upsert({
          where: {
            participantId_matchId: { participantId: participant.id, matchId: match.id },
          },
          create: {
            participantId: participant.id,
            matchId: match.id,
            prediction: pred.prediction,
            score,
          },
          update: { prediction: pred.prediction, score },
        });

        totalRecords++;
      }
    }

    await prisma.importHistory.create({
      data: { fileName, totalRecords, status: "SUCCESS" },
    });

    revalidatePath("/ranking");
    revalidatePath("/dashboard");
    revalidatePath("/import");
    revalidatePath("/matches");

    return { success: true, totalRecords, matchesCreated };
  } catch (error) {
    await prisma.importHistory.create({
      data: {
        fileName,
        totalRecords: 0,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      },
    });
    throw error;
  }
}

export async function getImportHistory() {
  return prisma.importHistory.findMany({ orderBy: { importedAt: "desc" } });
}

export async function deleteImportHistory(id: string) {
  await prisma.importHistory.delete({ where: { id } });
  revalidatePath("/import");
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export async function getRules() {
  return getActiveRules();
}

export async function updateRules(data: {
  exactScorePoints: number;
  winnerPoints: number;
  drawPoints: number;
  wrongPoints: number;
}) {
  const existing = await prisma.ruleConfiguration.findFirst({ where: { isActive: true } });

  let rules: RulesConfig;
  if (existing) {
    rules = await prisma.ruleConfiguration.update({ where: { id: existing.id }, data });
  } else {
    rules = await prisma.ruleConfiguration.create({ data: { ...data, isActive: true } });
  }

  const finishedMatches = await prisma.match.findMany({
    where: { officialResult: { not: null } },
    include: { predictions: true },
  });

  await Promise.all(
    finishedMatches.flatMap((match) =>
      match.predictions.map((pred) => {
        const score = calculatePredictionScore(
          pred.prediction,
          match.officialResult!,
          rules
        );
        return prisma.prediction.update({ where: { id: pred.id }, data: { score } });
      })
    )
  );

  revalidatePath("/rules");
  revalidatePath("/ranking");
  revalidatePath("/dashboard");

  return rules;
}