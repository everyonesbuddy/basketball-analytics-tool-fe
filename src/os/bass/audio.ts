/**
 * Sound for the bass trainer, in the browser: a synth bass to hear each
 * lesson, a metronome click, and the microphone to hear you play.
 */
import { freqOf, type Step } from "./theory";
import { detect, downsample, type Pitch } from "./pitch";

let ctx: AudioContext | null = null;

/** One shared AudioContext, started on a tap (browsers require it). */
export function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext({ latencyHint: "interactive" });
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A plucked bass note: saw + triangle through a closing low-pass, with a quick attack and a decay. */
export function pluck(midi: number, when: number, dur: number, volume = 0.5) {
  const c = audio();
  const f = freqOf(midi);
  const out = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(Math.min(2400, f * 14), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(180, f * 3), when + 0.25);
  const end = when + Math.max(0.12, dur * 0.95);
  out.gain.setValueAtTime(0.0001, when);
  out.gain.exponentialRampToValueAtTime(volume, when + 0.008);
  out.gain.exponentialRampToValueAtTime(volume * 0.45, when + 0.18);
  out.gain.setValueAtTime(volume * 0.45, Math.max(when + 0.18, end - 0.05));
  out.gain.exponentialRampToValueAtTime(0.0001, end);
  for (const [type, level] of [["sawtooth", 0.5], ["triangle", 0.9]] as const) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.value = level;
    o.connect(g).connect(filter);
    o.start(when);
    o.stop(end + 0.02);
  }
  filter.connect(out).connect(c.destination);
}

/** A metronome click; louder and higher on beat one. */
export function click(when: number, accent: boolean, volume = 0.35) {
  const c = audio();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = accent ? 1800 : 1200;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(volume * (accent ? 1 : 0.6), when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  o.connect(g).connect(c.destination);
  o.start(when);
  o.stop(when + 0.06);
}

export interface PlayOptions {
  bpm: number;
  beatsPerBar: number;
  countIn: boolean; // one bar of clicks first
  clickOn: boolean;
  notesOn: boolean; // hear the bass part (off when it's your turn, so the mic only hears you)
  loop: boolean;
  /** Called on each animation frame with the step being played (-1 during the count-in) and the beat position. */
  onFrame?: (index: number, beat: number) => void;
  onEnd?: () => void;
}

/**
 * Play a lesson: schedules notes and clicks slightly ahead (so timing is
 * exact) and reports where it is for the moving cursor. Returns a stop
 * function and the time the first note is due (the take's zero).
 */
export function play(steps: Step[], starts: number[], total: number, o: PlayOptions): { stop: () => void; startAt: number } {
  const c = audio();
  const spb = 60 / o.bpm;
  const lead = o.countIn ? o.beatsPerBar : 0;
  const startAt = c.currentTime + 0.12 + lead * spb;
  const length = total * spb;
  let scheduledBeat = -lead; // next click to schedule, in beats from startAt
  let nextStep = 0;
  let loopN = 0;
  let stopped = false;

  const timer = window.setInterval(() => {
    const horizon = c.currentTime + 0.15;
    for (;;) {
      const at = startAt + loopN * length + scheduledBeat * spb;
      if (at > horizon) break;
      if (o.clickOn || scheduledBeat < 0) click(at, ((scheduledBeat % o.beatsPerBar) + o.beatsPerBar) % o.beatsPerBar === 0);
      scheduledBeat += 1;
      if (scheduledBeat >= total) {
        if (!o.loop) break;
        scheduledBeat = 0;
        loopN += 1;
      }
    }
    if (o.notesOn) {
      for (;;) {
        const loopAt = Math.floor(nextStep / steps.length);
        if (!o.loop && loopAt > 0) break;
        const i = nextStep % steps.length;
        const at = startAt + loopAt * length + starts[i] * spb;
        if (at > horizon) break;
        if (steps[i].midi !== null) pluck(steps[i].midi!, at, steps[i].beats * spb);
        nextStep += 1;
      }
    }
  }, 25);

  let raf = 0;
  const frame = () => {
    if (stopped) return;
    const beatNow = (c.currentTime - startAt) / spb;
    if (!o.loop && beatNow >= total + 0.25) {
      stop();
      o.onEnd?.();
      return;
    }
    const inLoop = beatNow < 0 ? beatNow : beatNow % total;
    let idx = -1;
    if (inLoop >= 0) for (let i = 0; i < starts.length; i++) if (starts[i] <= inLoop + 1e-6) idx = i;
    o.onFrame?.(idx, inLoop);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  function stop() {
    stopped = true;
    window.clearInterval(timer);
    cancelAnimationFrame(raf);
  }
  return { stop, startAt };
}

export interface Listener {
  stop: () => void;
}

/**
 * Listen through the microphone and report each detected pitch (or null
 * when quiet) about 30 times a second, with the audio clock time.
 * Echo cancellation and noise suppression are off: they mangle low notes.
 */
export async function listen(onPitch: (p: Pitch | null, t: number) => void, sensitivity = 1): Promise<Listener> {
  const c = audio();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const src = c.createMediaStreamSource(stream);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 500;
  const analyser = c.createAnalyser();
  analyser.fftSize = 4096;
  src.connect(lp).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  const factor = Math.max(1, Math.round(c.sampleRate / 11025));
  const rate = c.sampleRate / factor;
  const minRms = 0.008 / Math.max(0.25, sensitivity);
  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    onPitch(detect(downsample(buf, factor), rate, { minRms }), c.currentTime);
  }, 33);
  return {
    stop: () => {
      window.clearInterval(timer);
      src.disconnect();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
