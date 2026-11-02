/** "On sale Fri, Nov 6, 10:00 AM" when that's still ahead; "" otherwise. */
export const onsaleText = (iso: string | null) => {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t < Date.now()) return "";
  return `On sale ${new Date(t).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
};
