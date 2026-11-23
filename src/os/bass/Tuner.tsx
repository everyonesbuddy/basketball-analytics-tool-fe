import { useEffect, useRef, useState } from "react";
import { FiMic, FiSquare } from "react-icons/fi";
import { Card, ErrorNote } from "../Bits";
import { audio, listen, pluck, type Listener } from "./audio";
import { freqOf, nearest, noteName, OPEN, STRINGS } from "./theory";

/** Tune each string: the closest string, the note you're on, and how far off (in cents). */
export default function Tuner({ sensitivity = 1, onMinutes }: { sensitivity?: number; onMinutes?: (m: number) => void }) {
  const [on, setOn] = useState(false);
  const [freq, setFreq] = useState<number | null>(null);
  const [error, setError] = useState("");
  const ref = useRef<Listener | null>(null);
  const recent = useRef<number[]>([]);
  const started = useRef(0);

  const stop = () => {
    ref.current?.stop();
    ref.current = null;
    setOn(false);
    if (started.current) onMinutes?.((performance.now() - started.current) / 60000);
    started.current = 0;
  };
  useEffect(() => () => ref.current?.stop(), []);

  const start = async () => {
    setError("");
    try {
      audio();
      ref.current = await listen((p) => {
        if (!p || p.clarity < 0.85) return;
        recent.current = [...recent.current.slice(-4), p.freq];
        const sorted = [...recent.current].sort((a, b) => a - b);
        setFreq(sorted[Math.floor(sorted.length / 2)]); // median of the last 5: steadier needle
      }, sensitivity);
      started.current = performance.now();
      setOn(true);
    } catch {
      setError("Allow the microphone to use the tuner.");
    }
  };

  const n = freq ? nearest(freq) : null;
  // The open string closest to what you're playing.
  const closest = freq ? STRINGS.reduce((best, s) => (Math.abs(Math.log2(freq / freqOf(OPEN[s]))) < Math.abs(Math.log2(freq / freqOf(OPEN[best])))) ? s : best, STRINGS[0]) : null;
  const centsOff = freq && closest ? Math.round(1200 * Math.log2(freq / freqOf(OPEN[closest]))) : null;
  const inTune = centsOff !== null && Math.abs(centsOff) <= 5;

  const hint = centsOff === null ? "" : inTune ? "In tune" : Math.abs(centsOff) > 100 ? (centsOff > 0 ? "Way sharp: loosen" : "Way flat: tighten") : centsOff > 0 ? `${centsOff} cents sharp: loosen a little` : `${-centsOff} cents flat: tighten a little`;

  return (
    <Card title="Tuner" sub="Standard 4-string tuning, low to high: E A D G. Play one open string at a time and let it ring.">
      <div className="os-tuner">
        <div className={`os-tuner__display ${inTune ? "ok" : ""} ${on ? "on" : ""}`}>
          {n ? (
            <>
              <strong>{noteName(n.midi)}</strong>
              <span className="os-tuner__hint">{hint}</span>
              <span className="os-small os-muted">{closest} string</span>
            </>
          ) : (
            <span className="os-muted">{on ? "Play an open string…" : "Start the tuner, then pluck a string."}</span>
          )}
        </div>
        <div className="os-tuner__meter" aria-hidden>
          <span className="os-tuner__mid" />
          {centsOff !== null && Math.abs(centsOff) <= 50 && <span className={`os-tuner__needle ${inTune ? "ok" : ""}`} style={{ left: `${50 + centsOff}%` }} />}
        </div>
        <div className="os-tuner__scale" aria-hidden>
          <span>flat</span>
          <span>in tune</span>
          <span>sharp</span>
        </div>
        <div className="os-tuner__strings">
          {STRINGS.map((s) => (
            <button key={s} className={`os-tuner__string ${closest === s ? "on" : ""} ${closest === s && inTune ? "ok" : ""}`} onClick={() => pluck(OPEN[s], audio().currentTime + 0.02, 1.5)} title="Hear this string">
              <strong>{s}</strong>
              <small>{noteName(OPEN[s], true)}</small>
            </button>
          ))}
        </div>
        <span className="os-small os-muted os-tuner__tap">Tap a string to hear what it should sound like.</span>
        <div className="os-row os-tuner__go">
          {on ? (
            <button className="os-btn os-btn--stop" onClick={stop}>
              <FiSquare /> Stop
            </button>
          ) : (
            <button className="os-btn os-btn--primary" onClick={start}>
              <FiMic /> Start tuner
            </button>
          )}
        </div>
        {error && <ErrorNote text={error} />}
      </div>
    </Card>
  );
}
