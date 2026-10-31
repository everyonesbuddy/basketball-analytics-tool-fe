import type { Category, Mode } from "./types";

export const CATEGORY_COLOR: Record<Category, string> = {
  P1: "#16a34a",
  P2: "#0d9488",
  PF1: "#2563eb",
  PF2: "#7c3aed",
  PC1: "#ea580c",
  PC2: "#db2777",
};

export const MODE_COLOR: Record<Mode, string> = {
  m1: "#b45309",
  m2single: "#2563eb",
  m2tiered: "#16a34a",
};

export const MODE_SHORT: Record<Mode, string> = {
  m1: "Mode 1 · get the tool",
  m2single: "Mode 2-Single · clear it",
  m2tiered: "Mode 2-Tiered · earn a %",
};

/** "06:15" → "6:15 AM" */
export const clock = (hhmm: string): string => {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 24) return "12:00 AM";
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** "2026-11-04" → "Nov 4" (or with the weekday). */
export const shortDate = (d: string, withDay = false): string =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", ...(withDay ? { weekday: "short" } : {}), timeZone: "UTC" });

export const todayIso = (): string => new Date().toLocaleDateString("en-CA");
