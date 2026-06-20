"use server";

import { prisma } from "@/lib/prisma";
import { calculatePredictionScore, normalizeTeamName } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RulesConfig {
  id: string;
  phase: string;
  exactScorePoints: number;
  winnerPoints: number;
  drawPoints: number;
  wrongPoints: number;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Pega todas as regras e garante que a regra "Padrão" exista
export async function getAllRules(): Promise<RulesConfig[]> {
  let rules = await prisma.ruleConfiguration.findMany({
    orderBy: { phase: "asc" }
  });

  if (rules.length === 0) {
    const defaultRule = await prisma.ruleConfiguration.create({
      data: {
        phase: "Padrão",
        exactScorePoints: 3,
        winnerPoints: 1,
        drawPoints: 1,
        wrongPoints: 0,
      },
    });
    rules.push(defaultRule);
  }
  return rules;
}

// Encontra a regra correta para uma fase específica
export async function getRuleForMatch(matchRound: string | null, rules: RulesConfig[]) {
  if (!matchRound) return rules.find(r => r.phase === "Padrão") || rules[0];

  const specificRule = rules.find(r => r.phase.toLowerCase() === matchRound.toLowerCase());
  if (specificRule) return specificRule;

  return rules.find(r => r.phase === "Padrão") || rules[0];
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

  const rules = await getAllRules();
  const matchRule = await getRuleForMatch(match.round, rules);

  await Promise.all(
    match.predictions.map((pred) => {
      const score = calculatePredictionScore(pred.prediction, officialResult, matchRule);
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

  const rules = await getAllRules();
  const matchRule = await getRuleForMatch(pred.match.round, rules);

  const score =
    pred.match.officialResult
      ? calculatePredictionScore(prediction, pred.match.officialResult, matchRule)
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

export async function importCSVData(
  fileName: string, 
  rows: CSVRowInput[], 
  importPhase?: string // Recebe a fase digitada na tela
) {
  const allRules = await getAllRules();
  let totalRecords = 0;
  let matchesCreated = 0;

  try {
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

        const finalRound = (importPhase && importPhase.trim() !== "") 
          ? importPhase.trim() 
          : pred.round;

        if (!match) {
          match = await prisma.match.create({
            data: {
              homeTeam: pred.homeTeam,
              awayTeam: pred.awayTeam,
              round: finalRound,
              matchDate: new Date(),
              status: "SCHEDULED",
            },
          });
          matchCache.set(cacheKey, match);
          matchesCreated++;
        } else if (finalRound && match.round !== finalRound) {
          // CORREÇÃO: Se o jogo já existe no banco, mas a fase enviada agora for diferente,
          // nós forçamos a atualização da fase do jogo no banco para a fase nova!
          match = await prisma.match.update({
            where: { id: match.id },
            data: { round: finalRound }
          });
          matchCache.set(cacheKey, match);
        }

        const matchRule = await getRuleForMatch(match.round, allRules);

        const score = match.officialResult
          ? calculatePredictionScore(pred.prediction, match.officialResult, matchRule)
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

    // Atualiza o cache de todas as telas (importante para as abas aparecerem na hora)
    revalidatePath("/ranking");
    revalidatePath("/dashboard");
    revalidatePath("/import");
    revalidatePath("/matches");
    revalidatePath("/rules"); 

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
  const rules = await getAllRules();

  // Busca todas as fases (rounds) cadastradas nos jogos
  const distinctRounds = await prisma.match.findMany({
    where: { round: { not: null } },
    distinct: ["round"],
    select: { round: true },
  });

  const defaultRule = rules.find((r) => r.phase === "Padrão") || rules[0];

  // Garante que existe uma regra no banco para cada fase que já existe nos jogos
  for (const m of distinctRounds) {
    if (m.round && !rules.some((r) => r.phase.toLowerCase() === m.round!.toLowerCase())) {
      const newRule = await prisma.ruleConfiguration.create({
        data: {
          phase: m.round,
          exactScorePoints: defaultRule.exactScorePoints,
          winnerPoints: defaultRule.winnerPoints,
          drawPoints: defaultRule.drawPoints,
          wrongPoints: defaultRule.wrongPoints,
        },
      });
      rules.push(newRule);
    }
  }

  return rules;
}

export async function updateRules(
  id: string, // <-- Note que agora recebe o ID da regra específica
  data: {
    exactScorePoints: number;
    winnerPoints: number;
    drawPoints: number;
    wrongPoints: number;
  }
) {
  // Atualiza apenas a regra daquela aba (fase) específica
  const updatedRule = await prisma.ruleConfiguration.update({ 
    where: { id }, 
    data 
  });

  const allRules = await getAllRules();

  // Recalcula apenas os jogos utilizando a regra de suas respectivas fases
  const finishedMatches = await prisma.match.findMany({
    where: { officialResult: { not: null } },
    include: { predictions: true },
  });

  await Promise.all(
    finishedMatches.flatMap((match) => {
      // Identifica a qual regra este jogo pertence
      const matchRule = 
        allRules.find((r) => r.phase.toLowerCase() === (match.round?.toLowerCase() || "")) 
        || allRules.find((r) => r.phase === "Padrão") 
        || allRules[0];

      return match.predictions.map((pred) => {
        const score = calculatePredictionScore(
          pred.prediction,
          match.officialResult!,
          matchRule
        );
        return prisma.prediction.update({ where: { id: pred.id }, data: { score } });
      });
    })
  );

  revalidatePath("/rules");
  revalidatePath("/ranking");
  revalidatePath("/dashboard");

  return updatedRule;
}