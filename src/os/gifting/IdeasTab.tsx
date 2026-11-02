import { useState } from "react";
import type { FormEvent } from "react";
import { FiExternalLink, FiGift } from "react-icons/fi";
import os, { errorText } from "../api";
import { ErrorNote } from "../Bits";
import type { Overview } from "./types";
import { usd } from "./util";

/** Saved gift ideas: paste a product link and the picture, title and price come with it. */
export default function IdeasTab({ data, onChanged }: { data: Overview; onChanged: () => void }) {
  const [url, setUrl] = useState("");
  const [person, setPerson] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await os.post("/gifting/ideas", { url: url.trim(), person: person || null });
      setUrl("");
      setMsg(res.data.blocked || !res.data.idea.image ? "Saved. That store didn't share its picture or price; you can still open the link." : "Saved.");
      onChanged();
    } catch (err) {
      setError(errorText(err, "Couldn't save that link."));
    } finally {
      setBusy(false);
    }
  };

  const name = (id: string | null) => (id ? data.people.find((p) => p._id === id)?.name : null);

  return (
    <div className="os-page">
      <form className="os-card os-form" onSubmit={add}>
        <div className="os-grid4">
          <label style={{ gridColumn: "span 3" }}>
            Paste a product link
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.target.com/p/…" required />
          </label>
          <label>
            For (optional)
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              <option value="">Anyone</option>
              {data.people.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="os-small os-muted os-flat">The picture, title and price come from the page when the store shares them. Some stores block this; the link still saves.</p>
        {error && <ErrorNote text={error} />}
        {msg && <p className="os-ok">{msg}</p>}
        <div className="os-actions">
          <button className="os-btn os-btn--primary" type="submit" disabled={busy}>{busy ? "Reading the page…" : "Save idea"}</button>
        </div>
      </form>

      {data.ideas.length === 0 && <p className="os-muted">No ideas saved yet.</p>}
      <div className="os-ideas">
        {data.ideas.map((i) => (
          <div key={i._id} className="os-idea">
            <a href={i.url || undefined} target="_blank" rel="noreferrer" className="os-idea__img">
              {i.image ? <img src={i.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <FiGift size={32} />}
            </a>
            <div className="os-idea__body">
              <strong>{i.title}</strong>
              <span className="os-small os-muted">{[i.site, i.price !== null ? usd(i.price) : null, name(i.person) ? `for ${name(i.person)}` : null].filter(Boolean).join(" · ")}</span>
              <div className="os-row">
                {i.url && (
                  <a className="os-small" href={i.url} target="_blank" rel="noreferrer">
                    Open <FiExternalLink />
                  </a>
                )}
                <button
                  className="os-link"
                  onClick={async () => {
                    await os.delete(`/gifting/ideas/${i._id}`);
                    onChanged();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
