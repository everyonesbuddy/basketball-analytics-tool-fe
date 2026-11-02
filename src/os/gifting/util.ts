export const usd = (n: number | null | undefined) => (n === null || n === undefined ? "–" : `$${n.toFixed(2)}`);
export const daysTo = (iso: string | null) => (iso ? Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(new Date().toLocaleDateString("en-CA"))) / 86400000) : null);
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const mdText = (md: string | null) => (md ? `${MONTHS[Number(md.slice(0, 2)) - 1]} ${Number(md.slice(3))}` : "");
