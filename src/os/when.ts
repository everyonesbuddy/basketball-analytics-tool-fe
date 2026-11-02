import { clock } from "./format";
import type { Upcoming } from "./types";

/** "in 25 min", "in 2 h 10 min", or "" when it's more than a day away. */
export const awayText = (min: number) => {
  if (min < 1) return "now";
  if (min < 60) return `in ${min} min`;
  if (min < 24 * 60) return `in ${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}`;
  return "";
};

/** "Monday 6:15 AM" / "Today 12:30 PM (in 40 min)". */
export const whenText = (n: Upcoming) => {
  const away = awayText(n.minutesAway);
  return `${n.day} ${clock(n.start)}${away ? ` (${away})` : ""}`;
};

/** What the next thing is: the goal (and category) or the review. */
export const nextWhat = (n: Upcoming) => (n.review ? "Weekly review" : `${n.category}: ${n.goalTitle || `${n.label} (no goal set)`}`);
