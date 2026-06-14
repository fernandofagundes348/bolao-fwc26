/**
 * SportsProvider — Camada de integração com APIs esportivas
 *
 * Arquitetura desacoplada: qualquer provider externo (API-Football,
 * SofaScore, ESPN, etc.) pode ser conectado implementando esta interface.
 */

export interface MatchResult {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished";
  matchDate: Date;
}

export interface SportsProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  leagueId?: string;
  season?: string;
}

// ─── Interface contratual ─────────────────────────────────────────────────────

export interface ISportsProvider {
  name: string;
  getMatches(from: Date, to: Date): Promise<MatchResult[]>;
  getMatchResult(externalId: string): Promise<MatchResult | null>;
  syncResults(matchIds: string[]): Promise<MatchResult[]>;
}

// ─── Provider Mock (desenvolvimento / demonstração) ───────────────────────────

export class MockSportsProvider implements ISportsProvider {
  name = "Mock Provider (Demo)";

  async getMatches(_from: Date, _to: Date): Promise<MatchResult[]> {
    // Simula latência de API
    await new Promise((r) => setTimeout(r, 800));

    return [
      {
        externalId: "mock-001",
        homeTeam: "Brasil",
        awayTeam: "Argentina",
        homeScore: 2,
        awayScore: 1,
        status: "finished",
        matchDate: new Date("2026-06-14T18:00:00"),
      },
      {
        externalId: "mock-002",
        homeTeam: "Alemanha",
        awayTeam: "França",
        homeScore: 0,
        awayScore: 0,
        status: "finished",
        matchDate: new Date("2026-06-15T15:00:00"),
      },
      {
        externalId: "mock-003",
        homeTeam: "Espanha",
        awayTeam: "Portugal",
        homeScore: 1,
        awayScore: 2,
        status: "live",
        matchDate: new Date("2026-06-13T21:00:00"),
      },
    ];
  }

  async getMatchResult(externalId: string): Promise<MatchResult | null> {
    await new Promise((r) => setTimeout(r, 400));
    const all = await this.getMatches(new Date(), new Date());
    return all.find((m) => m.externalId === externalId) ?? null;
  }

  async syncResults(_matchIds: string[]): Promise<MatchResult[]> {
    await new Promise((r) => setTimeout(r, 1200));
    return this.getMatches(new Date(), new Date());
  }
}

// ─── Provider API-Football (template pronto para uso) ─────────────────────────

export class APIFootballProvider implements ISportsProvider {
  name = "API-Football";
  private config: SportsProviderConfig;

  constructor(config: SportsProviderConfig) {
    this.config = config;
  }

  async getMatches(from: Date, to: Date): Promise<MatchResult[]> {
    if (!this.config.apiKey) throw new Error("API Key não configurada");

    const url = new URL(`${this.config.baseUrl}/fixtures`);
    url.searchParams.set("league", this.config.leagueId ?? "1");
    url.searchParams.set("season", this.config.season ?? "2026");
    url.searchParams.set("from", from.toISOString().split("T")[0]);
    url.searchParams.set("to", to.toISOString().split("T")[0]);

    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": this.config.apiKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });

    if (!res.ok) throw new Error(`API-Football erro: ${res.status}`);

    const data = await res.json();

    return (data.response ?? []).map((item: Record<string, unknown>) => {
      const fixture = item.fixture as Record<string, unknown>;
      const teams = item.teams as Record<string, Record<string, unknown>>;
      const goals = item.goals as Record<string, number | null>;

      return {
        externalId: String(fixture.id),
        homeTeam: String(teams.home.name),
        awayTeam: String(teams.away.name),
        homeScore: goals.home ?? 0,
        awayScore: goals.away ?? 0,
        status:
          fixture.status === "FT"
            ? "finished"
            : fixture.status === "NS"
            ? "scheduled"
            : "live",
        matchDate: new Date(fixture.date as string),
      } satisfies MatchResult;
    });
  }

  async getMatchResult(externalId: string): Promise<MatchResult | null> {
    if (!this.config.apiKey) throw new Error("API Key não configurada");

    const url = new URL(`${this.config.baseUrl}/fixtures`);
    url.searchParams.set("id", externalId);

    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": this.config.apiKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.response?.length) return null;

    const item = data.response[0];
    const fixture = item.fixture;
    const teams = item.teams;
    const goals = item.goals;

    return {
      externalId: String(fixture.id),
      homeTeam: teams.home.name,
      awayTeam: teams.away.name,
      homeScore: goals.home ?? 0,
      awayScore: goals.away ?? 0,
      status: fixture.status === "FT" ? "finished" : "scheduled",
      matchDate: new Date(fixture.date),
    };
  }

  async syncResults(matchIds: string[]): Promise<MatchResult[]> {
    const results = await Promise.allSettled(
      matchIds.map((id) => this.getMatchResult(id))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<MatchResult> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);
  }
}

// ─── Factory — seleciona provider ativo ───────────────────────────────────────

export function createSportsProvider(): ISportsProvider {
  const providerName = process.env.SPORTS_PROVIDER ?? "mock";

  switch (providerName) {
    case "api-football":
      return new APIFootballProvider({
        apiKey: process.env.API_FOOTBALL_KEY,
        baseUrl: "https://api-football-v1.p.rapidapi.com/v3",
        leagueId: process.env.SPORTS_LEAGUE_ID ?? "1",
        season: process.env.SPORTS_SEASON ?? "2026",
      });

    case "mock":
    default:
      return new MockSportsProvider();
  }
}
