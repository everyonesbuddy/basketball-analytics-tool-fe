import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "./api";
import { todayIso } from "./format";
import type { Category, CategoryInfo, Goal } from "./types";

/**
 * Set or edit a goal: just the goal. The window is set from the category;
 * what "done" looks like and the obstacle are optional. The mode is decided
 * block by block, when you log.
 */
export default function GoalForm({ category, info, goal, onSaved, onCancel, onDelete }: { category: Category; info?: CategoryInfo; goal?: Goal | null; onSaved: () => void; onCancel: () => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(goal?.title || "");
  const [outcome, setOutcome] = useState(goal?.outcome || "");
  const [obstacleText, setObstacleText] = useState(goal?.obstacle.text || "");
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
      obstacle: { ...(goal?.obstacle || { kind: "single", bounded: null, parallel: null }), text: obstacleText },
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

  return (
    <form className="os-form" onSubmit={submit}>
      <label>
        Goal
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Get a six pack and improve strength" required maxLength={200} autoFocus />
      </label>
      {!goal && info && (
        <p className="os-small os-muted os-flat">
          Runs {info.months === 1 ? "1 month" : `${info.months} months`} from{" "}
          <input type="date" className="os-inline-date" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Window starts" />
        </p>
      )}
      <details className="os-details" open={Boolean(goal?.outcome || goal?.obstacle.text)}>
        <summary>More detail (optional)</summary>
        <div className="os-form" style={{ marginTop: 8 }}>
          <label>
            What "done" looks like
            <input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="e.g. Visible abs and +20 lb on my main lifts" />
          </label>
          <label>
            The obstacle in the way
            <input value={obstacleText} onChange={(e) => setObstacleText(e.target.value)} placeholder="What stands between you and it?" />
          </label>
        </div>
      </details>
      {error && <div className="os-error">{error}</div>}
      <div className="os-actions">
        <button type="submit" className="os-btn os-btn--primary" disabled={saving}>{goal ? "Save" : "Set goal"}</button>
        <button type="button" className="os-btn" onClick={onCancel}>Cancel</button>
        {goal && onDelete && <button type="button" className="os-btn os-btn--ghost" onClick={onDelete} style={{ marginLeft: "auto" }}>Delete goal</button>}
      </div>
    </form>
  );
}
