export type Sport = "nba" | "nfl";

export interface Leg {
  eventId: string;
  sport: Sport;
  date: string;
  day?: string;
  matchup: string;
  market: "spread" | "total" | "moneyline" | "prop" | "future";
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
  /** What to accept at your own book: worst price at this line, worst line at -110. */
  shop?: { worstOdds: number | null; worstLine: number | null } | null;
  // Props
  stat?: string;
  athleteId?: string;
  player?: string;
  team?: string;
  projection?: number;
  recent?: { hits: number; of: number; last5: number[]; games: number };
  warning?: string | null;
  explain?: PropExplain;
}

export interface PropsView {
  sport: Sport;
  stats: Record<string, string>;
  games: { id: string; name: string; date: string; day: string; props: number }[];
  lines: number;
  notPosted?: number;
  ideas: Leg[];
  problems: string[];
  note: string;
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
  explain?: Explain;
  legs: Leg[];
}

/** Our line, the book's, the middle we bet from, how we got ours and why they differ. */
export interface Explain {
  ours: { spread: number; total: number; homeWin: number | null };
  book: { spread: number | null; total: number | null; homeWin: number | null };
  middle: { spread: number | null; total: number | null; homeWin: number | null };
  how: string[];
  why: string[];
}

export interface PropExplain {
  ours: number;
  book: number;
  middle: number;
  how: string[];
  why: string[];
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
    byMarket: Record<"spread" | "total" | "moneyline", Group> & { prop?: Group };
    pending: number;
  };
  stakedThisWeek: number;
  disclaimer: string;
}
