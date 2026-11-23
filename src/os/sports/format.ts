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
export const legKey = (l: Leg) =>
  `${l.eventId}:${l.market}:${l.side}${l.athleteId ? `:${l.athleteId}:${l.stat}` : ""}`;
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

const signedLine = (x: number) => (x > 0 ? `+${x}` : x === 0 ? "PK" : `${x}`);

/** The pick's label at another line ("PHX +5.5" → "PHX +4.5", "Over 220.5" → "Over 221.5"). */
export function labelAt(l: Leg, line: number) {
  if (l.line === null || l.line === undefined) return l.label;
  if (l.market === "spread")
    return l.label.replace(/\s(?:[+-]?\d+(?:\.\d+)?|PK)$/, ` ${signedLine(line)}`);
  return l.label.replace(String(l.line), String(line));
}

/**
 * What to take at your own book, in words: the price at this line, how far
 * the line can move and still be worth it, and when to skip.
 */
export function shopText(l: Leg) {
  const s = l.shop;
  if (!s) return null;
  const price = s.worstOdds !== null ? odds(s.worstOdds) : null;
  if (l.market === "moneyline")
    return {
      take: `${l.label} at ${price ?? odds(l.odds)} or better`,
      range: null,
      skip: price ? `Worse than ${price}: skip it.` : "Only at this price.",
    };
  const take = `${l.label} at ${price ?? odds(l.odds)} or better`;
  if (s.worstLine === null)
    return {
      take,
      range: null,
      skip: "Only at this line and price, or better. Anything worse: skip it.",
    };
  if (s.worstLine === l.line)
    return {
      take,
      range: null,
      skip: "This number or better only. A worse line isn't worth it.",
    };
  return {
    take,
    range: `Different number at your book? Fine as far as ${labelAt(l, s.worstLine)} at -110.`,
    skip: "A better number is always fine. Past that: skip it.",
  };
}
