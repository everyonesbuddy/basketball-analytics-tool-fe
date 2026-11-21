/**
 * Hearing what you play: pitch detection (YIN) tuned for bass, and scoring
 * a take against the lesson. Plain functions, no browser APIs, so they're
 * tested with made-up sound.
 *
 * Bass notes are low (low B is 31 Hz), so the sound is low-passed and
 * downsampled before detection: fewer samples, same notes, much faster.
 */
import { nearest, sameNote } from "./theory";

export interface Pitch {
  freq: number;
  midi: number;
  cents: number;
  clarity: number; // 0..1, how sure
  rms: number; // loudness
}

/** Average groups of `factor` samples (after the low-pass filter in the browser). */
export function downsample(buf: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return buf;
  const out = new Float32Array(Math.floor(buf.length / factor));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += buf[i * factor + j];
    out[i] = s / factor;
  }
  return out;
}

export const rmsOf = (buf: Float32Array) => {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
};

/**
 * YIN pitch detection. Returns null when it's quiet or not a clear note.
 * minF/maxF: the bass range (low B at 31 Hz up to about the 20th fret on G).
 */
export function detect(buf: Float32Array, sampleRate: number, { minF = 28, maxF = 420, threshold = 0.15, minRms = 0.008 } = {}): Pitch | null {
  const rms = rmsOf(buf);
  if (rms < minRms) return null;
  const tauMin = Math.max(2, Math.floor(sampleRate / maxF));
  const tauMax = Math.min(Math.floor(buf.length / 2), Math.ceil(sampleRate / minF));
  const W = buf.length - tauMax;
  if (W <= tauMin) return null;

  // Difference function and its cumulative mean normalized form.
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < W; i++) {
      const diff = buf[i] - buf[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += d[tau];
    cmnd[tau] = running ? (d[tau] * tau) / running : 1;
  }

  // First dip under the threshold (then its lowest point); else the global minimum if it's clear enough.
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 <= tauMax && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    let best = tauMin;
    for (let t = tauMin; t <= tauMax; t++) if (cmnd[t] < cmnd[best]) best = t;
    if (cmnd[best] > 0.35) return null;
    tau = best;
  }

  // Parabolic interpolation for a finer period.
  let better = tau;
  if (tau > 1 && tau < tauMax) {
    const a = cmnd[tau - 1];
    const b = cmnd[tau];
    const c = cmnd[tau + 1];
    const denom = a + c - 2 * b;
    if (denom) better = tau + (a - c) / (2 * denom);
  }
  const freq = sampleRate / better;
  if (freq < minF || freq > maxF) return null;
  const { midi, cents } = nearest(freq);
  return { freq, midi, cents, clarity: Math.max(0, Math.min(1, 1 - cmnd[tau])), rms };
}

/** A heard note: when (seconds on the take's clock) and which. */
export interface Heard {
  t: number;
  midi: number;
}

export interface NoteResult {
  index: number; // which step
  target: number;
  result: "hit" | "octave" | "wrong" | "missed";
  played: number | null;
  offsetMs: number | null; // + late, - early
}

/**
 * Score a take played in time. For each note, look for the target in a
 * window around when it was due (a little early, up to a third of a
 * second late, or the note's length if shorter); a wrong note heard there
 * counts as wrong, nothing heard as missed. `latency` is subtracted from
 * heard times (detection lags the real sound slightly).
 */
export function scoreTake(notes: { t: number; dur: number; midi: number; index: number }[], heard: Heard[], latency = 0.06): { results: NoteResult[]; score: number; stars: number; timing: string } {
  const results: NoteResult[] = notes.map((n) => {
    const from = n.t - 0.12;
    const to = n.t + Math.max(0.12, Math.min(0.35, n.dur * 0.9));
    const inWindow = heard.filter((h) => h.t - latency >= from && h.t - latency <= to);
    const hit = inWindow.find((h) => sameNote(h.midi, n.midi) !== "no");
    if (hit) {
      return { index: n.index, target: n.midi, result: sameNote(hit.midi, n.midi) === "yes" ? "hit" : "octave", played: hit.midi, offsetMs: Math.round((hit.t - latency - n.t) * 1000) };
    }
    if (inWindow.length) {
      // The note heard most in the window.
      const counts = new Map<number, number>();
      for (const h of inWindow) counts.set(h.midi, (counts.get(h.midi) || 0) + 1);
      const played = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return { index: n.index, target: n.midi, result: "wrong", played, offsetMs: null };
    }
    return { index: n.index, target: n.midi, result: "missed", played: null, offsetMs: null };
  });
  const good = results.filter((r) => r.result === "hit" || r.result === "octave");
  const score = notes.length ? Math.round((good.length / notes.length) * 100) : 0;
  const offsets = good.map((r) => r.offsetMs || 0);
  const avg = offsets.length ? offsets.reduce((a, b) => a + b, 0) / offsets.length : 0;
  const timing = !offsets.length ? "" : Math.abs(avg) < 40 ? "Right on the beat." : avg > 0 ? `A little late (about ${Math.round(avg)} ms). Lean into the click.` : `A little early (about ${Math.round(-avg)} ms). Relax and wait for the click.`;
  return { results, score, stars: score >= 90 ? 3 : score >= 75 ? 2 : score >= 50 ? 1 : 0, timing };
}

/**
 * Step mode: advance when the target is heard steadily (a few frames in a
 * row), or report a steady wrong note. `recent` is the latest detected
 * MIDI notes, newest last.
 */
export function steadyNote(recent: (number | null)[], frames = 3): number | null {
  if (recent.length < frames) return null;
  const last = recent.slice(-frames);
  return last.every((m) => m !== null && m === last[0]) ? (last[0] as number) : null;
}
