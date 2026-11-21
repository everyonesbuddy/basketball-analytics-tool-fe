import { noteName, midiOf, STRINGS, type StringName } from "./theory";

export type DotRole = "now" | "next" | "later" | "hit" | "wrong" | "shape" | "heard";

export interface Dot {
  string: StringName;
  fret: number;
  role: DotRole;
  label?: string;
}

const COLORS: Record<DotRole, { fill: string; stroke: string; text: string }> = {
  now: { fill: "#2563eb", stroke: "#1d4ed8", text: "#fff" },
  next: { fill: "#bfdbfe", stroke: "#60a5fa", text: "#1e3a8a" },
  later: { fill: "#eef2ff", stroke: "#c7d2fe", text: "#64748b" },
  hit: { fill: "#16a34a", stroke: "#15803d", text: "#fff" },
  wrong: { fill: "#dc2626", stroke: "#b91c1c", text: "#fff" },
  shape: { fill: "#fde68a", stroke: "#f59e0b", text: "#78350f" },
  heard: { fill: "#fff", stroke: "#f59e0b", text: "#b45309" },
};

const MARKERS = [3, 5, 7, 9, 15, 17];

/**
 * A 5-string bass neck seen from the front: G on top, low B at the bottom
 * (the way tab and diagrams show it). Dots show what to play; tap a fret to
 * hear it.
 */
export default function Fretboard({ dots = [], frets = 12, names = false, onTap }: { dots?: Dot[]; frets?: number; names?: boolean; onTap?: (s: StringName, fret: number) => void }) {
  const top = STRINGS.slice().reverse(); // G D A E B, top to bottom
  const W = 900;
  const nut = 78;
  const right = 14;
  const rowH = 30;
  const H = rowH * (top.length - 1) + 56;
  const y0 = 22;
  // Frets get a little narrower up the neck, like a real one.
  const scale = (n: number) => 1 - Math.pow(2, -n / 12);
  const fretX = (n: number) => nut + ((W - nut - right) * scale(n)) / scale(frets);
  const centerX = (n: number) => (n === 0 ? nut - 24 : (fretX(n - 1) + fretX(n)) / 2);
  const strY = (s: StringName) => y0 + top.indexOf(s) * rowH;

  return (
    <div className="os-fretboard-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="os-fretboard" role="img" aria-label="Bass fretboard">
      <rect x={nut} y={y0 - 12} width={W - nut - right} height={rowH * (top.length - 1) + 24} rx={4} fill="#3b2a1e" />
      {MARKERS.filter((m) => m <= frets).map((m) => (
        <circle key={m} cx={centerX(m)} cy={y0 + rowH * 2} r={6} fill="#d6c7b0" opacity={0.7} />
      ))}
      {frets >= 12 && (
        <>
          <circle cx={centerX(12)} cy={y0 + rowH * 1} r={6} fill="#d6c7b0" opacity={0.7} />
          <circle cx={centerX(12)} cy={y0 + rowH * 3} r={6} fill="#d6c7b0" opacity={0.7} />
        </>
      )}
      <rect x={nut - 5} y={y0 - 12} width={6} height={rowH * (top.length - 1) + 24} fill="#f5f0e6" />
      {Array.from({ length: frets }, (_, i) => i + 1).map((n) => (
        <line key={n} x1={fretX(n)} x2={fretX(n)} y1={y0 - 12} y2={y0 + rowH * (top.length - 1) + 12} stroke="#c9c9c9" strokeWidth={2} />
      ))}
      {top.map((s, i) => (
        <g key={s}>
          <line x1={nut - 44} x2={W - right} y1={strY(s)} y2={strY(s)} stroke="#d4d4d4" strokeWidth={1.2 + i * 0.55} />
          <text x={6} y={strY(s) + 5} fontSize={15} fontWeight={700} fill="#334155">
            {s}
          </text>
        </g>
      ))}
      {Array.from({ length: frets + 1 }, (_, n) => n).map((n) => (
        <text key={n} x={centerX(n)} y={H - 6} fontSize={11} textAnchor="middle" fill="#94a3b8">
          {n === 0 ? "open" : n}
        </text>
      ))}
      {onTap &&
        top.flatMap((s) =>
          Array.from({ length: frets + 1 }, (_, n) => n).map((n) => (
            <rect
              key={`${s}${n}`}
              x={n === 0 ? 30 : fretX(n - 1)}
              y={strY(s) - rowH / 2}
              width={n === 0 ? nut - 30 : fretX(n) - fretX(n - 1)}
              height={rowH}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => onTap(s, n)}
            >
              <title>{`${s} string, ${n === 0 ? "open" : `fret ${n}`}: ${noteName(midiOf(s, n))}`}</title>
            </rect>
          )),
        )}
      {dots
        .filter((d) => d.fret <= frets)
        .map((d, i) => {
          const c = COLORS[d.role];
          const label = d.label ?? (names ? noteName(midiOf(d.string, d.fret)) : d.fret === 0 ? "0" : String(d.fret));
          return (
            <g key={`${d.string}${d.fret}${d.role}${i}`} style={{ pointerEvents: "none" }}>
              <circle cx={centerX(d.fret)} cy={strY(d.string)} r={d.role === "now" ? 13 : 11} fill={c.fill} stroke={c.stroke} strokeWidth={2} className={d.role === "now" ? "os-dot-now" : undefined} />
              <text x={centerX(d.fret)} y={strY(d.string) + 4} fontSize={11} fontWeight={700} textAnchor="middle" fill={c.text}>
                {label}
              </text>
            </g>
          );
        })}
    </svg>
    </div>
  );
}
