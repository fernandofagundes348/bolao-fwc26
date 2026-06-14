import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseScoreResult(result: string): { home: number; away: number } | null {
  const match = result.trim().match(/^(\d+)[x\-:](\d+)$/i);
  if (!match) return null;
  return { home: parseInt(match[1]), away: parseInt(match[2]) };
}

export function calculatePredictionScore(
  prediction: string,
  officialResult: string,
  rules: { exactScorePoints: number; winnerPoints: number; drawPoints: number; wrongPoints: number }
): number {
  const pred = parseScoreResult(prediction);
  const official = parseScoreResult(officialResult);

  if (!pred || !official) return rules.wrongPoints;

  // Exact score
  if (pred.home === official.home && pred.away === official.away) {
    return rules.exactScorePoints;
  }

  // Correct winner
  const predWinner = pred.home > pred.away ? "home" : pred.away > pred.home ? "away" : "draw";
  const officialWinner =
    official.home > official.away ? "home" : official.away > official.home ? "away" : "draw";

  if (predWinner === officialWinner) {
    return predWinner === "draw" ? rules.drawPoints : rules.winnerPoints;
  }

  return rules.wrongPoints;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getOrdinal(n: number): string {
  return `${n}º`;
}

/**
 * Extrai um placar no formato "HxA" a partir de um valor de célula de CSV.
 * Aceita formatos como:
 *  - "2x1", "2X1", "2 x 1", "2x1 " (com espaços extras)
 *  - "México 1 x 0 África do Sul" (placar embutido em texto livre)
 * Retorna null se nenhum placar puder ser identificado.
 */
export function extractScore(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Formato estrito: a célula inteira é o placar (com possíveis espaços)
  const strict = trimmed.match(/^(\d{1,2})\s*[xX\-:]\s*(\d{1,2})$/);
  if (strict) return `${strict[1]}x${strict[2]}`;

  // Formato livre: procura "N x N" em qualquer lugar do texto
  const loose = trimmed.match(/(\d{1,2})\s*[xX]\s*(\d{1,2})/);
  if (loose) return `${loose[1]}x${loose[2]}`;

  return null;
}

/**
 * Normaliza o nome de um time para comparação:
 * remove acentos, espaços extras e diferenças de maiúsculas/minúsculas.
 * Ex: "República da Coreia" -> "republica da coreia"
 */
export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Faz o parsing de um cabeçalho de coluna de jogo do CSV.
 * Ex: "Grupo A: México x África do Sul" -> { round: "Grupo A", homeTeam: "México", awayTeam: "África do Sul" }
 * Ex: "Brasil x Argentina" -> { round: null, homeTeam: "Brasil", awayTeam: "Argentina" }
 * Retorna null se o cabeçalho não corresponder ao padrão "Time A x Time B".
 */
export function parseGameHeader(
  header: string
): { round: string | null; homeTeam: string; awayTeam: string } | null {
  const clean = header.replace(/\r?\n/g, " ").trim();
  if (!clean) return null;

  let round: string | null = null;
  let teamsPart = clean;

  const colonIdx = clean.indexOf(":");
  if (colonIdx !== -1) {
    round = clean.slice(0, colonIdx).trim();
    teamsPart = clean.slice(colonIdx + 1).trim();
  }

  const parts = teamsPart
    .split(/\s+x\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length !== 2) return null;

  return { round, homeTeam: parts[0], awayTeam: parts[1] };
}