import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "./api";
import { MODE_SHORT, todayIso } from "./format";
import type { Goal, Mode } from "./types";

/** Log a block: the mode you worked in and what came of it. */
export default function LogForm({ goal, mode: suggested, onSaved, onCancel }: { goal: Goal; mode: Mode | null; onSaved: () => void; onCancel: () => void }) {
  const [mode, setMode] = useState<Mode>(suggested || (goal.toolReady ? (goal.obstacle.kind === "tiered" ? "m2tiered" : "m2single") : "m1"));
  const [percent, setPercent] = useState("");
  const [cleared, setCleared] = useState(false);
  const [toolAcquired, setToolAcquired] = useState(false);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await os.post("/logs", { goal: goal._id, mode, percentGained: Number(percent) || 0, cleared, toolAcquired, note, date });
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="os-form os-form--inline" onSubmit={submit}>
      <div className="os-seg">
        {(["m1", "m2single", "m2tiered"] as Mode[]).map((m) => (
          <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
            {MODE_SHORT[m]}
          </button>
        ))}
      </div>
      {mode === "m2tiered" && (
        <label className="os-narrow">
          % gained toward the goal today
          <input type="number" min={0} max={100} step={0.5} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder={`now ${goal.percent || 0}%`} />
        </label>
      )}
      {mode === "m2single" && (
        <label className="os-check">
          <input type="checkbox" checked={cleared} onChange={(e) => setCleared(e.target.checked)} /> Cleared the obstacle (or a milestone)
        </label>
      )}
      {mode === "m1" && (
        <label className="os-check">
          <input type="checkbox" checked={toolAcquired} onChange={(e) => setToolAcquired(e.target.checked)} /> Got the tool{goal.toolNeeded ? ` (${goal.toolNeeded})` : ""}: unlock the goal
        </label>
      )}
      <div className="os-grid2">
        <label>
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you did, what you learned" />
        </label>
        <label className="os-narrow">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      {error && <div className="os-error">{error}</div>}
      <div className="os-actions">
        <button type="submit" className="os-btn os-btn--primary" disabled={saving}>Log it</button>
        <button type="button" className="os-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
