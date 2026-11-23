import type { BaseKey } from "./types";

export const BASE_NAME: Record<BaseKey, string> = {
  single: "Single",
  double: "Double",
  triple: "Triple",
  homeRun: "Home run",
};
export const BASE_COLOR: Record<BaseKey, string> = {
  single: "#15803d",
  double: "#1d5fd4",
  triple: "#7c3aed",
  homeRun: "#c2410c",
};
/** What each base is for, in a line. */
export const BASE_WHAT: Record<BaseKey, string> = {
  single: "Small, likely gains. Most of your plays.",
  double: "Decent moves, decent odds.",
  triple: "Bigger moves; you'll miss more.",
  homeRun: "Long shots that pay big. Small money only.",
};
/** A hit rate that makes each base worth it, roughly (the bigger the base, the fewer it needs). */
export const BASE_NEEDS: Record<BaseKey, number> = {
  single: 0.55,
  double: 0.45,
  triple: 0.35,
  homeRun: 0.2,
};

export const money = (n: number | null | undefined, digits?: number) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return "–";
  const d = digits ?? (Math.abs(n) >= 1000 ? 0 : Math.abs(n) < 1 ? 4 : 2);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d })}`;
};
export const signed = (n: number | null | undefined, suffix = "%") =>
  n === null || n === undefined ? "–" : `${n > 0 ? "+" : ""}${n}${suffix}`;
export const pctOf = (n: number | null | undefined) =>
  n === null || n === undefined ? "–" : `${Math.round(n * 100)}%`;

/**
 * The score's three parts, the same sums as scoreFor in the backend
 * (utils/os/trading.js); keep the two in step.
 */
export function scoreParts(idea: {
  strength: number;
  rewardRisk: number;
  history: { n: number; hitRate: number | null; avgReturnPct: number | null };
}) {
  const h = idea.history;
  const fit = idea.strength * 0.3;
  const rr = Math.min(idea.rewardRisk, 3) * 8;
  const past =
    h.n >= 5
      ? (h.hitRate ?? 0) * 40 +
        Math.max(-5, Math.min(5, h.avgReturnPct ?? 0)) * 2
      : h.n >= 2
        ? 14
        : 10;
  return { fit: Math.round(fit), rr: Math.round(rr), past: Math.round(past) };
}
