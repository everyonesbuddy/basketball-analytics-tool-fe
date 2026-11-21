/**
 * 5-string bass basics: strings, notes, frequencies, and the note format
 * lessons are written in. No React here, so it's easy to test.
 *
 * Standard 5-string tuning, low to high: B0 E1 A1 D2 G2.
 */

export const STRINGS = ["B", "E", "A", "D", "G"] as const;
export type StringName = (typeof STRINGS)[number];

/** MIDI number of each open string. */
export const OPEN: Record<StringName, number> = { B: 23, E: 28, A: 33, D: 38, G: 43 };

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const midiOf = (s: StringName, fret: number) => OPEN[s] + fret;
export const freqOf = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
export const noteName = (midi: number, withOctave = false) => `${NAMES[((midi % 12) + 12) % 12]}${withOctave ? Math.floor(midi / 12) - 1 : ""}`;

/** Nearest MIDI note to a frequency, and how far off it is in cents. */
export function nearest(freq: number): { midi: number; cents: number } {
  const exact = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(exact);
  return { midi, cents: Math.round((exact - midi) * 100) };
}

/** One thing to play (or a rest), with its length in beats. */
export interface Step {
  string: StringName | null; // null = rest
  fret: number;
  beats: number;
  midi: number | null;
}

/**
 * Lessons are written as space-separated tokens:
 *   "E5"     E string, 5th fret, one beat
 *   "A3-0.5" A string, 3rd fret, half a beat (an eighth note)
 *   "r-1"    a one-beat rest
 *   "|"      a bar line (ignored; it just makes lessons easier to read)
 */
export function parse(text: string): Step[] {
  const out: Step[] = [];
  for (const tok of text.trim().split(/\s+/)) {
    if (!tok || tok === "|") continue;
    const m = /^([BEADGr])(\d{0,2})(?:-(\d+(?:\.\d+)?))?$/.exec(tok);
    if (!m) throw new Error(`Can't read "${tok}"`);
    const beats = m[3] ? Number(m[3]) : 1;
    if (m[1] === "r") {
      out.push({ string: null, fret: 0, beats, midi: null });
    } else {
      const s = m[1] as StringName;
      const fret = Number(m[2] || 0);
      if (fret > 24) throw new Error(`Fret ${fret} is too high`);
      out.push({ string: s, fret, beats, midi: midiOf(s, fret) });
    }
  }
  return out;
}

/** When each step starts, in beats from the start, and the total length. */
export function timeline(steps: Step[]): { starts: number[]; total: number } {
  const starts: number[] = [];
  let t = 0;
  for (const s of steps) {
    starts.push(t);
    t += s.beats;
  }
  return { starts, total: t };
}

/** How to count a beat position out loud: "1", "&", "e", "a". */
export function countLabel(beatPos: number, beatsPerBar: number): string {
  const inBar = ((beatPos % beatsPerBar) + beatsPerBar) % beatsPerBar;
  const whole = Math.floor(inBar + 1e-6);
  const frac = Math.round((inBar - whole) * 4) / 4;
  if (frac === 0) return String(whole + 1);
  if (frac === 0.5) return "&";
  return frac === 0.25 ? "e" : "a";
}

/**
 * Is what you played the note asked for? Same note counts; the same note
 * an octave off counts too (pitch detection can jump an octave on a bass,
 * and the fret you pressed is what matters here).
 */
export function sameNote(played: number, target: number): "yes" | "octave" | "no" {
  if (played === target) return "yes";
  if (Math.abs(played - target) % 12 === 0 && Math.abs(played - target) <= 12) return "octave";
  return "no";
}
