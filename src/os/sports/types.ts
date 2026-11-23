export type Sport = "nba" | "nfl";

export interface Leg {
  eventId: string;
  sport: Sport;
  date: string;
  day?: string;
  matchup: string;
  market: "spread" | "total" | "moneyline" | "future";
  side: string;
  line: number | null;
  odds: number;
  label: string;
  modelProb?: number;
  marketProb?: number;
  prob?: number;
  edge?: number;
  ev?: number;
  confidence?: "low" | "medium" | "high";
  result?: "pending" | "won" | "lost" | "push";
}

export interface Team {
  id: string;
  abbr: string;
  name: string;
  logo: string | null;
  record: string;
  score: number | null;
}

export interface Game {
  id: string;
  sport: Sport;
  date: string;
  day: string;
  name: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  detail: string;
  home: Team;
  away: Team;
  lines: {
    provider: string;
    details: string;
    homeSpread: number | null;
    total: number | null;
    homeMl: number | null;
    awayMl: number | null;
  } | null;
  projection: { margin: number; total: number; games: number } | null;
  legs: Leg[];
}

export interface Parlay {
  legs: Leg[];
  prob: number;
  decimal: number;
  odds: number;
  ev: number;
}

export interface Board {
  sport: Sport;
  name: string;
  games: Game[];
  ideas: Leg[];
  parlays: Parlay[];
  ratings: {
    teams: number;
    league: number;
    table: {
      id: string;
      abbr?: string;
      name?: string;
      rating: number;
      games: number;
      ppg: number;
      oppPpg: number;
    }[];
  };
  problems?: string[];
  disclaimer: string;
}

export interface FuturesView {
  markets: {
    market: string;
    name: string;
    provider: string;
    teams: {
      teamId: string;
      abbr: string;
      name: string;
      logo: string | null;
      odds: number;
      modelProb: number;
      marketProb: number;
      prob: number;
      ev: number;
    }[];
  }[];
  note: string;
}

export interface Bet {
  _id: string;
  kind: "straight" | "parlay" | "future";
  legs: Leg[];
  stake: number;
  odds: number;
  status: "pending" | "won" | "lost" | "push";
  profit: number;
  placedAt: string;
  note: string;
}

export interface Group {
  bets: number;
  won: number;
  lost: number;
  push: number;
  staked: number;
  profit: number;
  roi: number | null;
}

export interface BetsView {
  bets: Bet[];
  record: {
    all: Group;
    byKind: Record<"straight" | "parlay" | "future", Group>;
    byMarket: Record<"spread" | "total" | "moneyline", Group>;
    pending: number;
  };
  stakedThisWeek: number;
  disclaimer: string;
}
