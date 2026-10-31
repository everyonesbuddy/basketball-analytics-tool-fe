import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText, setToken } from "../api";

export default function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await os.post("/auth/login", { email, password });
      setToken(res.data.token);
      onSignedIn();
    } catch (err) {
      setError(errorText(err, "Couldn't sign in."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="os-login">
      <form className="os-card os-form" onSubmit={submit}>
        <h1>Personal OS</h1>
        <p className="os-muted">Goals, schedule, and the rest of life in one place.</p>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="os-error">{error}</div>}
        <button type="submit" className="os-btn os-btn--primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
