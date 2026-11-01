import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "./api";
import { todayIso } from "./format";
import type { Goal, Mode } from "./types";

/**
 * Log a block with the framework's daily question: do you have what you need
 * today? No → Mode 1 (what's missing, did you get it). Yes → clear it in one
 * go (Mode 2-Single) or chip away (Mode 2-Tiered, with the % gained).
 * Starts from the goal's current mode, so most days it's one tap.
 */
export default function LogForm({ goal, mode: suggested, onSaved, onCancel }: { goal: Goal; mode: Mode | null; onSaved: () => void; onCancel: () => void }) {
  const [have, setHave] = useState<boolean | null>(suggested ? suggested !== "m1" : null);
  const [how, setHow] = useState<"m2single" | "m2tiered" | null>(suggested === "m2single" || suggested === "m2tiered" ? suggested : goal.obstacle.kind === "tiered" ? "m2tiered" : null);
  const [missing, setMissing] = useState(goal.toolNeeded || "");
  const [toolAcquired, setToolAcquired] = useState(false);
  const [percent, setPercent] = useState("");
  const [cleared, setCleared] = useState(false);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mode: Mode | null = have === false ? "m1" : have === true ? how : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mode) return;
    setSaving(true);
    setError("");
    try {
      await os.post("/logs", { goal: goal._id, mode, missing, toolAcquired, percentGained: Number(percent) || 0, cleared, note, date });
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setSaving(false);
    }
  };

  const choice = (on: boolean, label: string, click: () => void, hint?: string) => (
    <button type="button" className={on ? "on" : ""} onClick={click}>
      {label}
      {hint && <small>{hint}</small>}
    </button>
  );

  return (
    <form className="os-form os-form--inline" onSubmit={submit}>
      <div className="os-field">
        <span>Do you have what you need today?</span>
        <div className="os-seg os-seg--big">
          {choice(have === true, "Yes", () => setHave(true))}
          {choice(have === false, "No, something's missing", () => setHave(false), "Mode 1")}
        </div>
      </div>

      {have === false && (
        <>
          <label>
            What's missing
            <input value={missing} onChange={(e) => setMissing(e.target.value)} placeholder="e.g. a gym membership, a list of leads" />
          </label>
          <label className="os-check">
            <input type="checkbox" checked={toolAcquired} onChange={(e) => setToolAcquired(e.target.checked)} /> Got it in this block
          </label>
        </>
      )}

      {have === true && (
        <div className="os-field">
          <span>Clear it in one go, or chip away?</span>
          <div className="os-seg os-seg--big">
            {choice(how === "m2single", "Clear it in one go", () => setHow("m2single"), "Mode 2-Single")}
            {choice(how === "m2tiered", "Chip away", () => setHow("m2tiered"), "Mode 2-Tiered")}
          </div>
        </div>
      )}
      {mode === "m2tiered" && (
        <label className="os-narrow">
          % gained toward the goal
          <input type="number" min={0} max={100} step={0.5} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder={`now ${goal.percent || 0}%`} />
        </label>
      )}
      {mode === "m2single" && (
        <label className="os-check">
          <input type="checkbox" checked={cleared} onChange={(e) => setCleared(e.target.checked)} /> Cleared it (or a milestone)
        </label>
      )}

      {mode && (
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
      )}
      {error && <div className="os-error">{error}</div>}
      <div className="os-actions">
        <button type="submit" className="os-btn os-btn--primary" disabled={saving || !mode}>Log it</button>
        <button type="button" className="os-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
