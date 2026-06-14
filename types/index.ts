export interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  predictions?: Prediction[];
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: Date;
  round: string | null;
  officialResult: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
  createdAt: Date;
  updatedAt: Date;
  predictions?: Prediction[];
}

export interface Prediction {
  id: string;
  participantId: string;
  matchId: string;
  prediction: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  participant?: Participant;
  match?: Match;
}

export interface ImportHistory {
  id: string;
  fileName: string;
  importedAt: Date;
  totalRecords: number;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  errorMessage: string | null;
}

export interface RuleConfiguration {
  id: string;
  exactScorePoints: number;
  winnerPoints: number;
  drawPoints: number;
  wrongPoints: number;
  updatedAt: Date;
  isActive: boolean;
}

export interface RankingEntry {
  position: number;
  participant: Participant;
  totalScore: number;
  totalHits: number;
  totalErrors: number;
  hitPercentage: number;
  predictions: (Prediction & { match: Match })[];
}

export interface DashboardStats {
  totalParticipants: number;
  totalPredictions: number;
  totalMatches: number;
  totalHits: number;
}

export interface CSVRow {
  timestamp: string;
  name: string;
  email: string;
  [key: string]: string;
}
