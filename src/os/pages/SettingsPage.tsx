import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText, setToken } from "../api";
import { Card, PageHead } from "../Bits";

export default function SettingsPage({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const change = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await os.post("/auth/password", { current, next });
      setCurrent("");
      setNext("");
      setMsg("Password changed.");
    } catch (err) {
      setError(errorText(err, "Couldn't change it."));
    }
  };

  return (
    <div className="os-page">
      <PageHead title="Settings" sub={`Signed in as ${email}`} />
      <Card title="Change password">
        <form className="os-form" onSubmit={change}>
          <label>
            Current password
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </label>
          <label>
            New password (12+ characters)
            <input type="password" autoComplete="new-password" minLength={12} value={next} onChange={(e) => setNext(e.target.value)} required />
          </label>
          {error && <div className="os-error">{error}</div>}
          {msg && <p className="os-ok">{msg}</p>}
          <div className="os-actions">
            <button className="os-btn os-btn--primary" type="submit">Change password</button>
          </div>
        </form>
      </Card>
      <Card title="Sign out">
        <button
          className="os-btn"
          onClick={() => {
            setToken("");
            onSignOut();
          }}
        >
          Sign out of this device
        </button>
      </Card>
    </div>
  );
}
