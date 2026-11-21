import { useState } from "react";
import { Card } from "../Bits";
import Fretboard, { type Dot } from "./Fretboard";
import { audio, pluck } from "./audio";
import { midiOf, noteName, STRINGS, type StringName } from "./theory";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** The neck to explore: tap to hear and name any note, or light up every place one note lives. */
export default function Explore() {
  const [last, setLast] = useState<{ s: StringName; f: number } | null>(null);
  const [find, setFind] = useState("");
  const dots: Dot[] = [];
  if (find) for (const s of STRINGS) for (let f = 0; f <= 12; f++) if (noteName(midiOf(s, f)) === find) dots.push({ string: s, fret: f, role: "shape", label: find });
  if (last) dots.push({ string: last.s, fret: last.f, role: "now" });
  return (
    <Card title="Explore the neck" sub="Tap anywhere to hear the note and see its name. Pick a note to see everywhere it lives.">
      <Fretboard
        dots={dots}
        frets={12}
        onTap={(s, f) => {
          setLast({ s, f });
          pluck(midiOf(s, f), audio().currentTime + 0.02, 1.2);
        }}
      />
      <p className="os-flat">{last ? <><strong>{noteName(midiOf(last.s, last.f), true)}</strong> · {last.s} string, {last.f === 0 ? "open" : `fret ${last.f}`}</> : "Tap a fret."}</p>
      <div className="os-row">
        <span className="os-small os-muted">Show every</span>
        {NOTES.map((n) => (
          <button key={n} className={`os-chip ${find === n ? "os-chip--on" : ""}`} onClick={() => setFind(find === n ? "" : n)}>
            {n}
          </button>
        ))}
      </div>
    </Card>
  );
}
