import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiHeadphones, FiMic, FiMinus, FiPlay, FiPlus, FiRotateCcw, FiSquare, FiStar } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import Fretboard, { type Dot } from "./Fretboard";
import { LESSONS, LEVELS, prepare, type Lesson } from "./lessons";
import { audio, listen, play, pluck, type Listener } from "./audio";
import { scoreTake, steadyNote, type Heard, type NoteResult } from "./pitch";
import { countLabel, midiOf, noteName, sameNote, type Step } from "./theory";
import type { BassView } from "./types";

type Mode = "idle" | "hear" | "time" | "step";

const where = (s: Step) => (s.string ? `${s.string} string, ${s.fret === 0 ? "open" : `fret ${s.fret}`}` : "rest");

/** The notes as bars on a timeline, with the count under each note and results in color. */
function Rhythm({ lesson, steps, starts, total, current, results }: { lesson: Lesson; steps: Step[]; starts: number[]; total: number; current: number; results: NoteResult[] | null }) {
  const bars = Math.ceil(total / lesson.beatsPerBar - 1e-6);
  const byIndex = new Map((results || []).map((r) => [r.index, r]));
  return (
    <div className="os-rhythm">
      {Array.from({ length: bars }, (_, b) => {
        const from = b * lesson.beatsPerBar;
        return (
          <div key={b} className="os-rhythm__bar">
            {Array.from({ length: lesson.beatsPerBar }, (_, i) => (
              <span key={i} className="os-rhythm__beat" style={{ left: `${(i / lesson.beatsPerBar) * 100}%` }} />
            ))}
            {steps.map((s, i) => {
              if (starts[i] < from - 1e-6 || starts[i] >= from + lesson.beatsPerBar - 1e-6) return null;
              const r = byIndex.get(i);
              const cls = !s.string ? "rest" : r ? r.result : i === current ? "now" : "";
              return (
                <span key={i} className={`os-rhythm__note ${cls}`} style={{ left: `${((starts[i] - from) / lesson.beatsPerBar) * 100}%`, width: `${(s.beats / lesson.beatsPerBar) * 100}%` }} title={s.string ? `${where(s)} · ${noteName(s.midi!)}` : "rest"}>
                  <b>{s.string ? `${s.string}${s.fret}` : "·"}</b>
                  <small>{countLabel(starts[i], lesson.beatsPerBar)}</small>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** A lesson: read the idea, hear it, then play it in time (scored) or step by step. */
export default function LessonPlayer({ lesson, view, onSaved }: { lesson: Lesson; view: BassView | null; onSaved: (v: BassView) => void }) {
  const { steps, starts, total } = useMemo(() => prepare(lesson), [lesson]);
  const [bpm, setBpm] = useState(lesson.bpm);
  const [clickOn, setClickOn] = useState(true);
  const [names, setNames] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [current, setCurrent] = useState(0);
  const [beat, setBeat] = useState<number | null>(null);
  const [results, setResults] = useState<NoteResult[] | null>(null);
  const [summary, setSummary] = useState<{ score: number; stars: number; timing: string } | null>(null);
  const [heardNow, setHeardNow] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const stopRef = useRef<() => void>(() => {});
  const listenerRef = useRef<Listener | null>(null);
  const startedRef = useRef(0);
  const idx = LESSONS.findIndex((l) => l.key === lesson.key);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const record = view?.lessons[lesson.key];

  const stopAll = () => {
    stopRef.current();
    stopRef.current = () => {};
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
    setMode("idle");
    setBeat(null);
    setHeardNow(null);
  };
  // Stop sound and the mic when leaving the lesson (the page remounts this per lesson).
  useEffect(
    () => () => {
      stopRef.current();
      listenerRef.current?.stop();
    },
    [],
  );

  const save = async (body: Record<string, unknown>) => {
    const minutes = (performance.now() - startedRef.current) / 60000;
    try {
      const r = await os.post("/bass/attempt", { lessonKey: lesson.key, bpm, minutes, ...body });
      onSaved(r.data);
    } catch (err) {
      setError(errorText(err, "Couldn't save your result."));
    }
  };

  const firstNote = steps.findIndex((s) => s.string);

  const hear = () => {
    stopAll();
    setMessage("");
    setResults(null);
    setSummary(null);
    setMode("hear");
    const h = play(steps, starts, total, { bpm, beatsPerBar: lesson.beatsPerBar, countIn: true, clickOn, notesOn: true, loop: false, onFrame: (i, b) => (setCurrent(Math.max(0, i)), setBeat(b)), onEnd: () => (setMode("idle"), setBeat(null)) });
    stopRef.current = h.stop;
  };

  const inTime = async () => {
    stopAll();
    setMessage("");
    setError("");
    setResults(null);
    setSummary(null);
    const heard: Heard[] = [];
    let startAt = 0;
    try {
      audio();
      listenerRef.current = await listen((p, t) => {
        setHeardNow(p && p.clarity > 0.8 ? p.midi : null);
        if (p && p.clarity > 0.8 && startAt) heard.push({ t: t - startAt, midi: p.midi });
      }, view?.sensitivity ?? 1);
      setListening(true);
    } catch {
      setError("I need the microphone to hear you. Allow it in your browser (and on iPhone, in Settings → Safari → Microphone).");
      return;
    }
    startedRef.current = performance.now();
    setMode("time");
    const spb = 60 / bpm;
    const h = play(steps, starts, total, {
      bpm,
      beatsPerBar: lesson.beatsPerBar,
      countIn: true,
      clickOn: true,
      notesOn: false,
      loop: false,
      onFrame: (i, b) => (setCurrent(Math.max(0, i)), setBeat(b)),
      onEnd: () => {
        listenerRef.current?.stop();
        listenerRef.current = null;
        setListening(false);
        const notes = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.midi !== null).map(({ s, i }) => ({ t: starts[i] * spb, dur: s.beats * spb, midi: s.midi!, index: i }));
        const r = scoreTake(notes, heard);
        setResults(r.results);
        setSummary({ score: r.score, stars: r.stars, timing: r.timing });
        setMode("idle");
        setBeat(null);
        setHeardNow(null);
        void save({ mode: "time", score: r.score, stars: r.stars });
      },
    });
    startAt = h.startAt;
    stopRef.current = h.stop;
  };

  const stepByStep = async () => {
    stopAll();
    setError("");
    setResults(null);
    setSummary(null);
    let i = firstNote;
    setCurrent(i);
    const recent: (number | null)[] = [];
    let quietSince = true; // a new pluck is needed (silence or a louder attack) before the next note counts
    let lastRms = 0;
    let wrongFrames = 0;
    const done: NoteResult[] = [];
    try {
      audio();
      startedRef.current = performance.now();
      setMode("step");
      setMessage(`Play ${noteName(steps[i].midi!)}: ${where(steps[i])}.`);
      listenerRef.current = await listen((p) => {
        setHeardNow(p && p.clarity > 0.8 ? p.midi : null);
        const rms = p?.rms || 0;
        if (!p || p.clarity < 0.8) {
          recent.push(null);
          if (!p) quietSince = true;
        } else {
          if (rms > lastRms * 1.6 && rms > 0.01) quietSince = true; // a fresh pluck
          recent.push(p.midi);
        }
        lastRms = rms;
        if (recent.length > 12) recent.shift();
        const steady = steadyNote(recent, 3);
        if (steady === null || i < 0) return;
        const target = steps[i].midi!;
        if (sameNote(steady, target) !== "no" && quietSince) {
          done.push({ index: i, target, result: "hit", played: steady, offsetMs: null });
          setResults([...done]);
          quietSince = false;
          wrongFrames = 0;
          recent.length = 0;
          let n = i + 1;
          while (n < steps.length && !steps[n].string) n++;
          if (n >= steps.length) {
            listenerRef.current?.stop();
            listenerRef.current = null;
            setListening(false);
            setMode("idle");
            setMessage("You played the whole thing. Now try it in time with the click.");
            void save({ mode: "step" });
            return;
          }
          i = n;
          setCurrent(n);
          setMessage(`Good. Next: ${noteName(steps[n].midi!)}, ${where(steps[n])}.`);
        } else if (sameNote(steady, target) === "no" && quietSince) {
          // Only a freshly plucked wrong note; not the last right one still ringing.
          wrongFrames += 1;
          if (wrongFrames >= 4) setMessage(`That's ${noteName(steady)}. You want ${noteName(target)}: ${where(steps[i])}.`);
        }
      }, view?.sensitivity ?? 1);
      setListening(true);
    } catch {
      setMode("idle");
      setError("I need the microphone to hear you. Allow it in your browser (and on iPhone, in Settings → Safari → Microphone).");
    }
  };

  // Dots: the note now, the next one, and the rest of this lesson's notes faintly.
  const dots: Dot[] = useMemo(() => {
    const seen = new Set<string>();
    const out: Dot[] = [];
    const nowStep = steps[current];
    let nextIdx = current + 1;
    while (nextIdx < steps.length && !steps[nextIdx].string) nextIdx++;
    const nextStep = steps[nextIdx];
    const resultFor = new Map((results || []).map((r) => [r.index, r]));
    for (let k = 0; k < steps.length; k++) {
      const s = steps[k];
      if (!s.string) continue;
      const id = `${s.string}${s.fret}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ string: s.string, fret: s.fret, role: "later" });
    }
    if (results && mode === "idle" && summary) {
      for (const [k, r] of resultFor) if (r.result === "wrong" || r.result === "missed") out.push({ string: steps[k].string!, fret: steps[k].fret, role: "wrong" });
    }
    if (nextStep?.string && mode !== "idle") out.push({ string: nextStep.string, fret: nextStep.fret, role: "next" });
    if (nowStep?.string) out.push({ string: nowStep.string, fret: nowStep.fret, role: "now" });
    return out;
  }, [steps, current, results, mode, summary]);

  const now = steps[current];
  const level = LEVELS.find((l) => l.level === lesson.level);

  const busy = mode !== "idle";
  const counting = mode === "time" && beat !== null && beat < 0;
  const heardClass = heardNow !== null && now?.midi != null ? (sameNote(heardNow, now.midi) !== "no" ? "ok" : "off") : "";

  return (
    <div className="os-page">
      <div className="os-lessonbar">
        <Link to="/bass" className="os-navlink">
          <FiArrowLeft /> All lessons
        </Link>
        <span className="os-small os-muted">
          Level {lesson.level}: {level?.name} · lesson {idx + 1} of {LESSONS.length}
        </span>
      </div>

      <Card
        title={lesson.title}
        sub={lesson.concept}
        right={
          record ? (
            <span className="os-bass-best" title={`${record.attempts} tries`}>
              <span className="os-stars on">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= record.stars ? "lit" : ""}>
                    ★
                  </span>
                ))}
              </span>
              <small>best {record.best}%</small>
            </span>
          ) : undefined
        }
      >
        <ul className="os-bass-explain">
          {lesson.explain.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        {lesson.tip && (
          <p className="os-bass-tip">
            <strong>Tip</strong> {lesson.tip}
          </p>
        )}
      </Card>

      <div className={`os-card os-bass-stage ${busy ? "busy" : ""}`}>
        <div className="os-bass-now">
          {counting ? (
            <>
              <strong className="os-bass-count">{Math.ceil(-beat!)}</strong>
              <span className="os-muted">Get ready…</span>
            </>
          ) : now?.string ? (
            <>
              <strong>{noteName(now.midi!)}</strong>
              <span>{where(now)}</span>
            </>
          ) : (
            <span className="os-muted">rest</span>
          )}
          {listening && (
            <span className={`os-bass-heard ${heardClass}`}>
              <span className="os-bass-heard__dot" />
              {heardNow !== null ? `Hearing ${noteName(heardNow)}` : "Listening…"}
            </span>
          )}
        </div>
        <Fretboard dots={dots} names={names} frets={Math.min(12, Math.max(7, ...steps.map((s) => s.fret + 2)))} onTap={(s, f) => pluck(midiOf(s, f), audio().currentTime + 0.02, 0.8)} />
        <Rhythm lesson={lesson} steps={steps} starts={starts} total={total} current={mode === "idle" && !results ? -1 : current} results={results} />

        {message && <p className="os-bass-msg">{message}</p>}
        {error && <ErrorNote text={error} />}
        {summary && (
          <div className={`os-bass-result ${summary.stars >= 2 ? "good" : ""}`}>
            <div className="os-bass-result__score">
              <strong>{summary.score}%</strong>
              <span>
                {[1, 2, 3].map((n) => (
                  <FiStar key={n} className={n <= summary.stars ? "on" : ""} />
                ))}
              </span>
            </div>
            <div className="os-bass-result__text">
              <strong>
                {summary.stars === 3
                  ? "Clean. Try it faster, or move on."
                  : summary.stars === 2
                    ? "Good. One more for three stars, or move on."
                    : summary.stars === 1
                      ? "Getting there. Slow it down 10 bpm and go again."
                      : "Do it step by step first, then in time at a slower tempo."}
              </strong>
              {summary.timing && <span>{summary.timing}</span>}
              <span className="os-small os-muted">On the strip: green is right, amber is the right note an octave off, red is wrong or missed (also red on the neck).</span>
              <div className="os-row">
                <button className="os-btn os-btn--small" onClick={inTime}>
                  <FiRotateCcw /> Again
                </button>
                {summary.stars >= 2 && next && (
                  <Link className="os-btn os-btn--small os-btn--primary" to={`/bass/lesson/${next.key}`}>
                    Next: {next.title} <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="os-bass-actions">
          {busy ? (
            <button className="os-btn os-btn--stop" onClick={stopAll}>
              <FiSquare /> Stop
            </button>
          ) : (
            <>
              <button className="os-btn os-btn--primary" onClick={inTime} title="Play along with the click; you get a score">
                <FiPlay /> Play it in time
              </button>
              <button className="os-btn" onClick={stepByStep} title="One note at a time; it waits for you">
                <FiMic /> Step by step
              </button>
              <button className="os-btn os-btn--ghost" onClick={hear}>
                <FiHeadphones /> Hear it
              </button>
            </>
          )}
        </div>
        <div className="os-bass-toolbar">
          <span className="os-bass-tempo">
            <span className="os-small os-muted">Tempo</span>
            <button className="os-btn os-btn--small os-btn--ghost" disabled={busy || bpm <= 40} onClick={() => setBpm(Math.max(40, bpm - 5))} aria-label="Slower">
              <FiMinus />
            </button>
            <input type="range" min={40} max={160} value={bpm} disabled={busy} onChange={(e) => setBpm(Number(e.target.value))} aria-label="Tempo" />
            <button className="os-btn os-btn--small os-btn--ghost" disabled={busy || bpm >= 160} onClick={() => setBpm(Math.min(160, bpm + 5))} aria-label="Faster">
              <FiPlus />
            </button>
            <b>{bpm}</b>
            <span className="os-small os-muted">bpm</span>
            {bpm !== lesson.bpm && !busy && (
              <button className="os-link" onClick={() => setBpm(lesson.bpm)}>
                reset
              </button>
            )}
          </span>
          <label className="os-check os-small">
            <input type="checkbox" checked={clickOn} onChange={(e) => setClickOn(e.target.checked)} /> Click with "Hear it"
          </label>
          <label className="os-check os-small">
            <input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} /> Note names on the neck
          </label>
        </div>
        <p className="os-small os-muted os-flat os-bass-help">
          <FiHeadphones />
          Headphones help: then the mic hears only your bass. Play close to your phone or laptop, or plug into an audio interface.
        </p>
      </div>

      <div className="os-lessonnav">
        {prev ? (
          <Link to={`/bass/lesson/${prev.key}`}>
            <small>
              <FiArrowLeft /> Previous
            </small>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/bass/lesson/${next.key}`} className="next">
            <small>
              Next <FiArrowRight />
            </small>
            {next.title}
          </Link>
        )}
      </div>
    </div>
  );
}
