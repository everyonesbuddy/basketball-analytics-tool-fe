import { useState } from "react";
import os, { errorText } from "./api";
import type { Mode } from "./types";

type Outcome = "progress" | "cleared" | "blocked";

/** The framework in three lines, with the mode you're in marked. */
export function ModeReminders({ mode }: { mode: Mode | null }) {
  const rows: [boolean, string, string][] = [
    [mode === "m1", "Mode 1", "Don't have the tool or resource to achieve it? Today's work is getting it."],
    [mode === "m2single", "Mode 2", "Have what you need? Attack the obstacle directly and clear it."],
    [mode === "m2tiered", "Mode 2, a %", "Can't clear it in one action? Clear a % today; a % is a real win."],
  ];
  return (
    <ul className="os-modehints">
      {rows.map(([on, name, text]) => (
        <li key={name} className={on ? "on" : ""}>
          <strong>{name}</strong> {text}
        </li>
      ))}
    </ul>
  );
}

/**
 * The daily check-in, one tap: moved it forward today, or cleared the goal
 * for this period. Optional: the % earned and the next step (shown at the
 * goal's next block). "Stuck" records what's missing (Mode 1).
 */
export default function QuickLog({
  goalId,
  nextStep = "",
  block,
  mode = null,
  date,
  onSaved,
  onCancel,
  compact = false,
}: {
  goalId: string;
  nextStep?: string;
  block?: string;
  mode?: Mode | null;
  date?: string;
  onSaved: (outcome: Outcome) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [next, setNext] = useState(nextStep);
  const [percent, setPercent] = useState("");
  const [stuck, setStuck] = useState(false);
  const [missing, setMissing] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (outcome: Outcome) => {
    setBusy(true);
    setError("");
    try {
      await os.post("/logs", {
        goal: goalId,
        outcome,
        block,
        date,
        percentGained: outcome === "progress" ? Number(percent) || 0 : 0,
        missing: outcome === "blocked" ? missing : undefined,
        nextStep: outcome === "cleared" && next === nextStep ? "" : next,
      });
      onSaved(outcome);
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`os-quicklog${compact ? " os-quicklog--compact" : ""}`}>
      <ModeReminders mode={mode} />
      <div className="os-quicklog__fields">
        <label>
          Next step for next time <span className="os-muted">(optional)</span>
          <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="e.g. Draft the pricing page" maxLength={500} />
        </label>
        <label className="os-narrow">
          % cleared <span className="os-muted">(optional)</span>
          <input type="number" min={0} max={100} step={0.5} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="e.g. 5" />
        </label>
      </div>
      {stuck ? (
        <div className="os-row">
          <input value={missing} onChange={(e) => setMissing(e.target.value)} placeholder="What tool or resource is missing?" autoFocus style={{ flex: 1, minWidth: 200 }} />
          <button className="os-btn os-btn--primary" disabled={busy} onClick={() => send("blocked")}>Save (Mode 1)</button>
          <button className="os-btn" onClick={() => setStuck(false)}>Back</button>
        </div>
      ) : (
        <div className="os-actions">
          <button className="os-btn os-btn--primary" disabled={busy} onClick={() => send("progress")}>Moved it forward today</button>
          <button className="os-btn" disabled={busy} onClick={() => send("cleared")}>Cleared the goal for this period</button>
          <button className="os-link os-small" disabled={busy} onClick={() => setStuck(true)}>Stuck: missing a tool or resource</button>
          {onCancel && <button className="os-btn os-btn--ghost" onClick={onCancel}>Cancel</button>}
        </div>
      )}
      {error && <div className="os-error">{error}</div>}
    </div>
  );
}
