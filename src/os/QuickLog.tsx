import { useState } from "react";
import os, { errorText } from "./api";
import type { Block } from "./types";

type Outcome = "progress" | "cleared" | "blocked";

/**
 * End-of-block check-in, one tap: moved it forward, cleared it, or stuck.
 * Optionally the next step (shown at the next block) and, for a goal you
 * chip away at, the % earned. Nothing to fill in before you start.
 */
export default function QuickLog({ block, date, onSaved, compact = false }: { block: Block; date?: string; onSaved: () => void; compact?: boolean }) {
  const [next, setNext] = useState(block.nextStep || "");
  const [percent, setPercent] = useState("");
  const [stuck, setStuck] = useState(false);
  const [missing, setMissing] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (outcome: Outcome) => {
    if (!block.goalId) return;
    setBusy(true);
    setError("");
    try {
      await os.post("/logs", {
        goal: block.goalId,
        outcome,
        block: block.start,
        date,
        percentGained: Number(percent) || 0,
        missing: outcome === "blocked" ? missing : undefined,
        nextStep: outcome === "cleared" && next === block.nextStep ? "" : next,
      });
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`os-quicklog${compact ? " os-quicklog--compact" : ""}`}>
      <div className="os-quicklog__fields">
        <label>
          Next step for next time <span className="os-muted">(optional)</span>
          <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="e.g. Draft the pricing page" maxLength={500} />
        </label>
        {block.tiered && (
          <label className="os-narrow">
            % earned <span className="os-muted">(optional)</span>
            <input type="number" min={0} max={100} step={0.5} value={percent} onChange={(e) => setPercent(e.target.value)} />
          </label>
        )}
      </div>
      {stuck ? (
        <div className="os-row">
          <input value={missing} onChange={(e) => setMissing(e.target.value)} placeholder="What's missing? (a tool, info, someone's answer)" autoFocus style={{ flex: 1, minWidth: 200 }} />
          <button className="os-btn os-btn--primary" disabled={busy} onClick={() => send("blocked")}>Save</button>
          <button className="os-btn" onClick={() => setStuck(false)}>Back</button>
        </div>
      ) : (
        <div className="os-actions">
          <button className="os-btn os-btn--primary" disabled={busy} onClick={() => send("progress")}>Moved it forward</button>
          <button className="os-btn" disabled={busy} onClick={() => send("cleared")}>Cleared it</button>
          <button className="os-btn" disabled={busy} onClick={() => setStuck(true)}>Stuck</button>
        </div>
      )}
      {error && <div className="os-error">{error}</div>}
    </div>
  );
}
