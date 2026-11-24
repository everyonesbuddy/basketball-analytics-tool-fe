export type BaseKey = "single" | "double" | "triple" | "homeRun";
export type Kind = "stock" | "option" | "crypto";

export interface Size {
  maxLoss: number;
  qty: number;
  unit?: string;
  budget?: number;
}

export interface OptionPick {
  /** The base it was picked for, or "budget": the best contract under your max. */
  intent: BaseKey | "budget";
  overBudget?: boolean;
  base: BaseKey;
  note: string;
  contract: string;
  type: "call" | "put";
  strike: number;
  expiration: string;
  days: number;
  bid: number;
  ask: number;
  mid: number;
  cost: number;
  iv: number;
  delta: number;
  openInterest: number;
  volume: number;
  atTarget: number;
  atStop: number;
  gainPct: number;
  lossPct: number;
  breakevenAtExpiry: number;
  size?: Size;
}

export interface Idea {
  id: string;
  symbol: string;
  kind: "stock" | "crypto";
  optionsOnly: boolean;
  setup: string;
  setupName: string;
  style: string;
  direction: "up" | "down";
  strength: number;
  reasons: string[];
  asOf: string;
  price: number;
  entry: number;
  stop: number;
  target: number;
  gainPct: number;
  lossPct: number;
  rewardRisk: number;
  base: BaseKey;
  history: {
    n: number;
    wins: number;
    losses: number;
    timeouts: number;
    hitRate: number | null;
    avgReturnPct: number | null;
  };
  warning: string | null;
  score: number;
  indicators: {
    rsi: number;
    stochK: number;
    macdHist: number;
    atr: number;
    volRatio: number;
    ema50: number;
  };
  options?: OptionPick[];
  optionsError?: string;
  size?: Size;
}

export interface Play {
  _id: string;
  kind: Kind;
  symbol: string;
  underlying: string;
  direction: "up" | "down";
  base: BaseKey;
  setup: string;
  option?: {
    type: "call" | "put" | null;
    strike: number | null;
    expiration: string | null;
  };
  entryPrice: number;
  qty: number;
  target: number | null;
  stop: number | null;
  openedAt: string;
  status: "open" | "closed";
  exitPrice: number | null;
  closedAt: string | null;
  exitReason: string | null;
  lastPrice: number | null;
  lastCheckedAt: string | null;
  hit: "target" | "stop" | null;
  notes: string;
  returnPct: number | null;
}

export interface Group {
  plays: number;
  wins: number;
  hitRate: number | null;
  avgReturnPct: number | null;
  pl: number;
  best: number | null;
  worst: number | null;
}

export interface Settings {
  stocks: string[];
  crypto: string[];
  weeklyRisk: number;
  split: Record<BaseKey, number>;
  minScore: number;
  alerts: boolean;
  /** $ per option contract you'll pay; null = no limit. */
  maxContract: number | null;
}

export interface FindRow {
  symbol: string;
  price: number;
  avgVolume: number;
  fit: {
    n: number;
    wins: number;
    losses: number;
    timeouts: number;
    hitRate: number | null;
    avgReturnPct: number | null;
  };
  atm: { cost: number; strike: number; expiration: string; openInterest: number } | null;
  onList: boolean;
  fitsBudget: boolean | null;
}

export interface FindView {
  kind: "stock" | "crypto";
  maxPrice: number | null;
  maxContract: number | null;
  rows: FindRow[];
  note: string;
}

export interface TradingView {
  settings: Settings;
  bases: { key: BaseKey; name: string; stock: number[]; option: number[] }[];
  scan: {
    at: string | null;
    lastStockScan: string | null;
    lastCryptoScan: string | null;
    skipped: { symbol: string; why: string }[];
    hidden: number;
  };
  ideas: Idea[];
  plays: Play[];
  record: {
    all: Group;
    byBase: Record<BaseKey, Group>;
    byKind: Record<Kind, Group>;
    open: number;
  };
  disclaimer: string;
}
