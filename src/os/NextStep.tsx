import { useState } from "react";
import type { FormEvent } from "react";
import { FiArrowRight } from "react-icons/fi";
import os, { errorText } from "./api";

/** A goal's next step, shown and editable in place (Add / Edit). */
export default function NextStep({ goalId, value, onSaved, label = "Next step" }: { goalId: string; value: string; onSaved: () => void; label?: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const [error, setError] = useState("");
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await os.patch(`/goals/${goalId}`, { nextStep: text.trim() });
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    }
  };
  if (editing) {
    return (
      <form className="os-row os-nextstep-form" onSubmit={save}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="The smallest thing that moves it, e.g. Draft the pricing page" maxLength={500} autoFocus style={{ flex: 1, minWidth: 200 }} />
        <button className="os-btn os-btn--primary" type="submit">Save</button>
        <button className="os-btn" type="button" onClick={() => { setText(value); setEditing(false); }}>Cancel</button>
        {error && <span className="os-small os-bad">{error}</span>}
      </form>
    );
  }
  return (
    <p className="os-now__step">
      <FiArrowRight />
      {value ? (
        <span>
          <strong>{label}:</strong> {value}{" "}
          <button className="os-link os-small" onClick={() => setEditing(true)}>Edit</button>
        </span>
      ) : (
        <span>
          <span className="os-muted">No next step yet. </span>
          <button className="os-link" onClick={() => setEditing(true)}>Add the smallest thing that moves it</button>
        </span>
      )}
    </p>
  );
}
