import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "./api";
import { todayIso } from "./format";
import type { Category, CategoryInfo, Goal } from "./types";

/**
 * Set or edit a goal: the outcome, then the framework's classification of its
 * obstacle (single or tiered; if tiered, bounded and parallel), then the tool
 * check. That decides the goal's mode.
 */
export default function GoalForm({ category, info, goal, onSaved, onCancel }: { category: Category; info?: CategoryInfo; goal?: Goal | null; onSaved: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(goal?.title || "");
  const [outcome, setOutcome] = useState(goal?.outcome || "");
  const [obstacleText, setObstacleText] = useState(goal?.obstacle.text || "");
  const [kind, setKind] = useState<"single" | "tiered">(goal?.obstacle.kind || "single");
  const [bounded, setBounded] = useState<boolean | null>(goal?.obstacle.bounded ?? null);
  const [parallel, setParallel] = useState<boolean | null>(goal?.obstacle.parallel ?? null);
  const [toolReady, setToolReady] = useState(goal?.toolReady ?? false);
  const [toolNeeded, setToolNeeded] = useState(goal?.toolNeeded || "");
  const [start, setStart] = useState(goal?.windowStart || todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      title,
      outcome,
      obstacle: { text: obstacleText, kind, bounded, parallel },
      toolReady,
      toolNeeded: toolReady ? "" : toolNeeded,
      ...(goal ? {} : { category, windowStart: start }),
    };
    try {
      if (goal) await os.patch(`/goals/${goal._id}`, body);
      else await os.post("/goals", body);
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save the goal."));
    } finally {
      setSaving(false);
    }
  };

  const yesNo = (value: boolean | null, set: (v: boolean) => void, yes: string, no: string) => (
    <div className="os-seg">
      <button type="button" className={value === true ? "on" : ""} onClick={() => set(true)}>{yes}</button>
      <button type="button" className={value === false ? "on" : ""} onClick={() => set(false)}>{no}</button>
    </div>
  );

  return (
    <form className="os-form" onSubmit={submit}>
      <label>
        Goal
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call or email 200 potential customers" required maxLength={200} />
      </label>
      <label>
        What "done" looks like
        <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} placeholder="Complete, specific outcome, not ongoing" />
      </label>
      <label>
        The obstacle in the way
        <textarea value={obstacleText} onChange={(e) => setObstacleText(e.target.value)} rows={2} placeholder="What possesses, controls or stands in the way of it?" />
      </label>

      <div className="os-field">
        <span>Can one focused action clear it, or does it recur in capped instances?</span>
        <div className="os-seg">
          <button type="button" className={kind === "single" ? "on" : ""} onClick={() => setKind("single")}>Single: one action clears it</button>
          <button type="button" className={kind === "tiered" ? "on" : ""} onClick={() => setKind("tiered")}>Tiered: earn % per instance</button>
        </div>
      </div>
      {kind === "tiered" && (
        <div className="os-grid2">
          <div className="os-field">
            <span>How many instances are there?</span>
            {yesNo(bounded, setBounded, "Bounded (a set number)", "Unbounded")}
          </div>
          <div className="os-field">
            <span>Can several be worked at once?</span>
            {yesNo(parallel, setParallel, "Parallel (e.g. a team)", "Sequential")}
          </div>
        </div>
      )}

      <div className="os-field">
        <span>Tool check: do you have the tool to attack this obstacle today?</span>
        {yesNo(toolReady, setToolReady, "Yes, I have it", "No, something's missing")}
      </div>
      {!toolReady && (
        <label>
          What's missing (the prerequisite sub-goal)
          <input value={toolNeeded} onChange={(e) => setToolNeeded(e.target.value)} placeholder="e.g. a list of 200 facilities with phone numbers" />
        </label>
      )}

      {!goal && (
        <label className="os-narrow">
          Window starts
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          {info && <small>{info.months === 1 ? "1-month" : `${info.months}-month`} window; the end date is set for you.</small>}
        </label>
      )}

      {error && <div className="os-error">{error}</div>}
      <div className="os-actions">
        <button type="submit" className="os-btn os-btn--primary" disabled={saving}>{goal ? "Save" : "Set goal"}</button>
        <button type="button" className="os-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
