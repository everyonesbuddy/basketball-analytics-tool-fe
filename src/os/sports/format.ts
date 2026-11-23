import type { Leg } from "./types";

export const odds = (n: number | null | undefined) =>
  n === null || n === undefined ? "–" : n > 0 ? `+${n}` : `${n}`;
export const pct = (p: number | null | undefined) =>
  p === null || p === undefined ? "–" : `${Math.round(p * 100)}%`;
export const edgePct = (e: number | null | undefined) =>
  e === null || e === undefined
    ? "–"
    : `${e >= 0 ? "+" : ""}${(e * 100).toFixed(1)}%`;
export const decimalOf = (american: number) =>
  american > 0 ? 1 + american / 100 : 1 + 100 / -american;
export const americanOf = (decimal: number) =>
  decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));
export const legKey = (l: Leg) => `${l.eventId}:${l.market}:${l.side}`;
export const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
export const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
export const CONF_LABEL = {
  high: "Strong",
  medium: "Good",
  low: "Lean",
} as const;
