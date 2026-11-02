import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import os, { errorText } from "./api";
import type { Mode, Outcome } from "./types";

/** What you tapped, said back the same way. */
const OUTCOME_DONE: Record<Outcome, string> = {
  progress: "Moved it forward today",
  cleared: "Cleared for this period",
};

/** What you tapped, with Undo (deletes that check-in). */
export function CheckedIn({ outcome, logId, onUndone }: { outcome: Outcome | null | undefined; logId?: string | null; onUndone?: () => void }) {
  if (!outcome) return null;
  return (
    <span className="os-ok os-checkedin">
      <FiCheck /> {OUTCOME_DONE[outcome]}
      {logId && onUndone && (
        <button
          className="os-link os-small"
          style={{ marginLeft: 6 }}
          onClick={async () => {
            await os.delete(`/logs/${logId}`);
            onUndone();
          }}
        >
          Undo
        </button>
      )}
    </span>
  );
}

/** How to attack a goal today, by where you are with it (the framework's modes). The one you were in last is marked. */
export function ModeReminders({ mode }: { mode: Mode | null }) {
  const rows: [boolean, string, string][] = [
    [mode === "m1", "Missing a tool or resource?", "Today's work is getting it (Mode 1)."],
    [mode === "m2single", "Have what you need?", "Attack the obstacle and clear it (Mode 2)."],
    [mode === "m2tiered", "Too big for one go?", "Clear a % of it today; that's a real win (Mode 2)."],
  ];
  return (
    <div className="os-modehints">
      <span className="os-kicker">How to attack it today</span>
      <ul>
        {rows.map(([on, q, a]) => (
          <li key={q} className={on ? "on" : ""}>
            {q} <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The daily check-in: two buttons, moved it forward today or cleared the
 * goal for this period. `links`: the same two as small links (the timeline).
 */
export default function QuickLog({ goalId, block, date, onSaved, links = false }: { goalId: string; block?: string; date?: string; onSaved: (outcome: Outcome) => void; links?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (outcome: Outcome) => {
    setBusy(true);
    setError("");
    try {
      // Cleared for the period: the goal is done, so its next step is too.
      await os.post("/logs", { goal: goalId, outcome, block, date, ...(outcome === "cleared" ? { nextStep: "" } : {}) });
      onSaved(outcome);
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setBusy(false);
    }
  };

  if (links) {
    return (
      <span className="os-row os-small">
        <button className="os-link" disabled={busy} onClick={() => send("progress")}>Moved it forward today</button>
        <button className="os-link" disabled={busy} onClick={() => send("cleared")}>Cleared for this period</button>
        {error && <span className="os-bad">{error}</span>}
      </span>
    );
  }

  return (
    <div className="os-quicklog">
      <div className="os-actions">
        <button className="os-btn os-btn--primary" disabled={busy} onClick={() => send("progress")}>Moved it forward today</button>
        <button className="os-btn" disabled={busy} onClick={() => send("cleared")}>Cleared the goal for this period</button>
      </div>
      {error && <div className="os-error">{error}</div>}
    </div>
  );
}
