import type { BaseKey } from "./types";

export const BASE_NAME: Record<BaseKey, string> = { single: "Single", double: "Double", triple: "Triple", homeRun: "Home run" };
export const BASE_COLOR: Record<BaseKey, string> = { single: "#15803d", double: "#1d5fd4", triple: "#7c3aed", homeRun: "#c2410c" };
/** What each base is for, in a line. */
export const BASE_WHAT: Record<BaseKey, string> = {
  single: "Small, likely gains. Most of your plays.",
  double: "Decent moves, decent odds.",
  triple: "Bigger moves; you'll miss more.",
  homeRun: "Long shots that pay big. Small money only.",
};
/** A hit rate that makes each base worth it, roughly (the bigger the base, the fewer it needs). */
export const BASE_NEEDS: Record<BaseKey, number> = { single: 0.55, double: 0.45, triple: 0.35, homeRun: 0.2 };

export const money = (n: number | null | undefined, digits?: number) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return "–";
  const d = digits ?? (Math.abs(n) >= 1000 ? 0 : Math.abs(n) < 1 ? 4 : 2);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d })}`;
};
export const signed = (n: number | null | undefined, suffix = "%") => (n === null || n === undefined ? "–" : `${n > 0 ? "+" : ""}${n}${suffix}`);
export const pctOf = (n: number | null | undefined) => (n === null || n === undefined ? "–" : `${Math.round(n * 100)}%`);
