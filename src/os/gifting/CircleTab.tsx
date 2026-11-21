import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiCheck, FiGift, FiShoppingBag, FiSkipForward, FiUsers } from "react-icons/fi";
import os from "../api";
import { Card, ErrorNote, Loading } from "../Bits";
import { shortDate } from "../format";
import { LogRow } from "./CareTab";
import { useCare } from "./useCare";
import type { CareEntry, CarePrefs, CareView, CircleNext } from "./types";

const ago = (n: CircleNext) => (n.last ? `last one ${n.since} days ago` : "not yet");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The kind of person up next (an uncle, a friend…), a hamper and a service idea, and what to do about it. */
function NextUp({ n, view, act }: { n: CircleNext; view: CareView; act: ReturnType<typeof useCare>["act"] }) {
  const [mode, setMode] = useState<"" | "plan" | "gave">("");
  const [on, setOn] = useState("");
  const [who, setWho] = useState("");
  const [what, setWhat] = useState(`${n.hamper.name} hamper`);
  const [cost, setCost] = useState(String(Math.round(n.hamper.total)));
  const log = (status: "planned" | "done" | "skipped", extra: Record<string, unknown> = {}) =>
    act(() => os.post("/gifting/care/log", { kind: "circle", relationship: n.relationship, title: `${n.hamper.name} hamper`, status, ...extra }));
  const whoField = (
    <input className="os-input" value={who} onChange={(e) => setWho(e.target.value)} placeholder={`Who? (optional, e.g. ${n.relationship === "uncle" ? "Uncle Tunde" : n.relationship === "friend" ? "Kemi" : "a name"})`} aria-label="Who (optional)" style={{ flex: "1 1 180px" }} />
  );
  return (
    <div className="os-circle">
      <div className="os-circle__who">
        <span className="os-avatar os-avatar--big">
          <FiUsers />
        </span>
        <span>
          <strong>Surprise {n.phrase}</strong>
          <span className="os-small os-muted">
            {n.name} · {ago(n)}. You pick who.
          </span>
        </span>
      </div>
      <div className="os-circle__idea">
        <span className="os-circle__label">
          <FiGift /> The idea
        </span>
        <strong>
          A {n.hamper.name.toLowerCase()} hamper <span className="os-muted">· about ${Math.round(n.hamper.total)}</span>
        </strong>
        {n.hamper.items.length > 0 && (
          <div className="os-row os-circle__items">
            {n.hamper.items.map((it) => (
              <span key={it} className="os-pill">
                {it}
              </span>
            ))}
          </div>
        )}
        {n.service && (
          <span className="os-small os-muted">
            Or a service instead: {n.service.name.toLowerCase()}, about ${n.service.price}.
          </span>
        )}
      </div>
      {mode === "plan" ? (
        <div className="os-care__actions">
          {whoField}
          <input type="date" className="os-input" value={on} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setOn(e.target.value)} aria-label="Send it on" />
          <button className="os-btn os-btn--small os-btn--primary" disabled={!on} onClick={() => log("planned", { plannedFor: on, who })}>
            Save
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => setMode("")}>
            Cancel
          </button>
        </div>
      ) : mode === "gave" ? (
        <div className="os-care__actions">
          {whoField}
          <input className="os-input" value={what} onChange={(e) => setWhat(e.target.value)} aria-label="What you gave" style={{ flex: "1 1 180px" }} />
          <span className="os-prefix" style={{ width: 110 }}>
            <span>$</span>
            <input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Cost" />
          </span>
          <button className="os-btn os-btn--small os-btn--primary" onClick={() => log("done", { title: what, cost: Number(cost) || null, who })}>
            Save
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => setMode("")}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="os-care__actions">
          <Link className="os-btn os-btn--small os-btn--primary" to={`/gifting/new?relationship=${n.relationship}&budget=${view.prefs.circleBudget}`}>
            <FiShoppingBag /> Build the hamper
          </Link>
          <button className="os-btn os-btn--small" onClick={() => setMode("plan")}>
            <FiCalendar /> Plan a date
          </button>
          <button className="os-btn os-btn--small" onClick={() => setMode("gave")}>
            <FiCheck /> Gave it
          </button>
          <span className="os-care__later">
            <button className="os-link os-link--muted" onClick={() => log("skipped")} title="Someone else this time; this one comes back in 2 weeks">
              <FiSkipForward /> Someone else
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

function Settings({ view, onSave }: { view: CareView; onSave: (p: Partial<CarePrefs>) => void }) {
  const [p, setP] = useState(view.prefs);
  const rels = view.relationships.filter((r) => r.key !== "wife");
  const toggle = (k: string) => setP({ ...p, circleRelationships: p.circleRelationships.includes(k) ? p.circleRelationships.filter((x) => x !== k) : [...p.circleRelationships, k] });
  return (
    <Card title="How the circle works" sub="Every few weeks, one kind of person comes up (your mom, an uncle, a friend…) with a hamper idea in your budget. You pick who. The kind that's gone longest without a gift comes first.">
      <div className="os-form os-settings">
        <label className="os-check">
          <input type="checkbox" checked={p.circleOn} onChange={(e) => setP({ ...p, circleOn: e.target.checked })} /> Remind me when it's time
        </label>
        <div className="os-grid4">
          <label>
            One every
            <span className="os-suffix">
              <input type="number" min={14} max={180} value={p.circleEveryDays} onChange={(e) => setP({ ...p, circleEveryDays: Number(e.target.value) || 45 })} />
              <span>days</span>
            </span>
          </label>
          <label>
            Budget each
            <span className="os-prefix">
              <span>$</span>
              <input type="number" min={10} value={p.circleBudget} onChange={(e) => setP({ ...p, circleBudget: Number(e.target.value) || 50 })} />
            </span>
          </label>
        </div>
        <div className="os-field">
          Who's in it
          <div className="os-row">
            {rels.map((r) => (
              <button key={r.key} type="button" className={`os-chip ${p.circleRelationships.includes(r.key) ? "os-chip--on" : ""}`} onClick={() => toggle(r.key)}>
                {p.circleRelationships.includes(r.key) && <FiCheck />} {r.name}
              </button>
            ))}
          </div>
        </div>
        <div className="os-actions">
          <button className="os-btn os-btn--primary" onClick={() => onSave({ circleOn: p.circleOn, circleEveryDays: p.circleEveryDays, circleBudget: p.circleBudget, circleRelationships: p.circleRelationships })}>
            Save
          </button>
        </div>
      </div>
    </Card>
  );
}

/** The gift circle: which kind of person is next and what to give, what comes after, and the settings. */
export default function CircleTab() {
  const { view, error, act } = useCare();
  if (!view) return error ? <ErrorNote text={error} /> : <Loading />;
  const c = view.circle;
  const [first, ...after] = c.next;
  const relName = (k?: string | null) => view.relationships.find((r) => r.key === k)?.name || "";
  const personName = (id: string | null) => view.people.find((p) => p._id === id)?.name || "";
  const whoOf = (e: Pick<CareEntry, "who" | "relationship" | "personId">) => e.who || personName(e.personId) || relName(e.relationship) || "Someone";
  const entries = view.log.filter((e) => e.kind === "circle");
  const status = c.planned ? `Planned${c.planned.on ? ` for ${shortDate(c.planned.on, true)}` : ""}` : c.due ? "Due now" : `Next one around ${shortDate(c.nextOn, true)}`;

  return (
    <div className="os-page">
      {error && <ErrorNote text={error} />}
      {c.eligible === 0 ? (
        <Card title="Gift circle">
          <p className="os-flat">Pick who's in the circle below (family, friends, colleagues). Then one comes up here every {c.every} days with a gift idea.</p>
        </Card>
      ) : (
        <Card title="Up next" sub={`${status} · every ${c.every} days, about $${c.budget} each`} accent={c.due && !c.planned ? "#db2777" : undefined} right={c.due && !c.planned ? <span className="os-tag os-tag--due">Due</span> : undefined}>
          {c.planned ? (
            <div className="os-care os-care--planned">
              <span className="os-care__when">
                <FiCalendar /> {c.planned.on ? shortDate(c.planned.on, true) : "Planned"}
              </span>
              <strong className="os-care__title">
                {c.planned.title} for {c.planned.who || (c.planned.relationship ? `${relName(c.planned.relationship).toLowerCase()}` : "someone")}
              </strong>
              <div className="os-care__actions">
                <button className="os-btn os-btn--small os-btn--primary" onClick={() => act(() => os.patch(`/gifting/care/log/${c.planned!.id}`, { status: "done" }))}>
                  <FiCheck /> Sent it
                </button>
                <button className="os-link os-link--muted" onClick={() => act(() => os.delete(`/gifting/care/log/${c.planned!.id}`))}>
                  Cancel the plan
                </button>
              </div>
            </div>
          ) : (
            first && <NextUp key={first.relationship} n={first} view={view} act={act} />
          )}
          {after.length > 0 && (
            <div className="os-queue">
              <span className="os-circle__label">After that</span>
              <ol>
                {after.map((n) => (
                  <li key={n.relationship}>
                    <strong>{cap(n.phrase)}</strong>
                    <span className="os-small os-muted">{ago(n)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      )}

      <Card title="Circle gifts">
        {entries.length === 0 ? (
          <p className="os-muted os-flat">None yet. When you give one, it shows here.</p>
        ) : (
          <ul className="os-loglist">
            {entries.slice(0, 15).map((e) => (
              <LogRow key={e._id} e={e} who={whoOf(e)} onDone={() => act(() => os.patch(`/gifting/care/log/${e._id}`, { status: "done" }))} onRemove={() => act(() => os.delete(`/gifting/care/log/${e._id}`))} />
            ))}
          </ul>
        )}
      </Card>

      <Settings key={JSON.stringify(view.prefs)} view={view} onSave={(p) => act(() => os.patch("/gifting/care", p))} />
    </div>
  );
}
