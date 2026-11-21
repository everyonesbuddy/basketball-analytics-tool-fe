import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiClock, FiGift, FiSkipForward } from "react-icons/fi";
import os from "../api";
import { Card, ErrorNote, Loading } from "../Bits";
import { shortDate } from "../format";
import { LogRow } from "./CareTab";
import { useCare } from "./useCare";
import type { CarePrefs, CareView, CircleNext } from "./types";

const ago = (n: CircleNext) => (n.last ? `last gift ${n.since} days ago` : "no gift logged yet");

/** The person up next, with a hamper and a service idea, and what to do about it. */
function NextUp({ n, view, act }: { n: CircleNext; view: CareView; act: ReturnType<typeof useCare>["act"] }) {
  const [mode, setMode] = useState<"" | "plan" | "gave">("");
  const [on, setOn] = useState("");
  const [what, setWhat] = useState(`${n.hamper.name} hamper`);
  const [cost, setCost] = useState(String(Math.round(n.hamper.total)));
  const rel = view.relationships.find((r) => r.key === n.relationship)?.name || n.relationship;
  const log = (status: "planned" | "done" | "skipped", extra: Record<string, unknown> = {}) => act(() => os.post("/gifting/care/log", { kind: "circle", personId: n.personId, title: extra.title || `${n.hamper.name} hamper`, status, ...extra }));
  return (
    <div className="os-idea os-idea--big">
      <div className="os-idea__head">
        <strong>
          <FiGift /> {n.name}
        </strong>
        <span className="os-small os-muted">
          {rel} · {ago(n)}
        </span>
      </div>
      <p className="os-flat">
        <strong>Idea:</strong> a {n.hamper.name.toLowerCase()} hamper, about ${Math.round(n.hamper.total)}
        {n.hamper.items.length > 0 && <span className="os-small os-muted"> ({n.hamper.items.join(", ")})</span>}
      </p>
      {n.service && (
        <p className="os-small os-flat">
          Or a service: {n.service.name.toLowerCase()}, about ${n.service.price}.
        </p>
      )}
      {mode === "plan" ? (
        <div className="os-row">
          <input type="date" value={on} onChange={(e) => setOn(e.target.value)} aria-label="Send it on" />
          <button className="os-btn os-btn--small os-btn--primary" disabled={!on} onClick={() => log("planned", { plannedFor: on })}>
            Save
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => setMode("")}>
            Cancel
          </button>
        </div>
      ) : mode === "gave" ? (
        <div className="os-row">
          <input value={what} onChange={(e) => setWhat(e.target.value)} aria-label="What you gave" style={{ minWidth: 200 }} />
          <input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Cost" style={{ width: 90 }} />
          <button className="os-btn os-btn--small os-btn--primary" onClick={() => log("done", { title: what, cost: Number(cost) || null })}>
            Save
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => setMode("")}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="os-row">
          <Link className="os-btn os-btn--small os-btn--primary" to={`/gifting/new?person=${n.personId}&budget=${view.prefs.circleBudget}`}>
            Build the hamper
          </Link>
          <button className="os-btn os-btn--small" onClick={() => setMode("plan")}>
            <FiClock /> Plan a date
          </button>
          <button className="os-btn os-btn--small" onClick={() => setMode("gave")}>
            <FiCheck /> Gave it
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => log("skipped")} title="Someone else this time; they come back in 2 weeks">
            <FiSkipForward /> Someone else
          </button>
        </div>
      )}
    </div>
  );
}

function Settings({ view, onSave, onPerson }: { view: CareView; onSave: (p: Partial<CarePrefs>) => void; onPerson: (id: string, inCircle: boolean) => void }) {
  const [p, setP] = useState(view.prefs);
  const rels = view.relationships.filter((r) => r.key !== "wife");
  const toggle = (k: string) => setP({ ...p, circleRelationships: p.circleRelationships.includes(k) ? p.circleRelationships.filter((x) => x !== k) : [...p.circleRelationships, k] });
  const inScope = view.people.filter((x) => x._id !== view.prefs.spouseId && x.relationship !== "wife");
  return (
    <Card title="How the circle works" sub="Every few weeks, the person who's gone longest without a gift comes up, with an idea in your budget.">
      <label className="os-check">
        <input type="checkbox" checked={p.circleOn} onChange={(e) => setP({ ...p, circleOn: e.target.checked })} /> Remind me
      </label>
      <div className="os-grid4" style={{ marginTop: 8 }}>
        <label>
          Someone every
          <span className="os-row">
            <input type="number" min={14} max={180} value={p.circleEveryDays} onChange={(e) => setP({ ...p, circleEveryDays: Number(e.target.value) || 45 })} /> days
          </span>
        </label>
        <label>
          Budget each ($)
          <input type="number" min={10} value={p.circleBudget} onChange={(e) => setP({ ...p, circleBudget: Number(e.target.value) || 50 })} />
        </label>
      </div>
      <p className="os-small os-muted os-flat" style={{ marginTop: 12 }}>
        Who's in it
      </p>
      <div className="os-row">
        {rels.map((r) => (
          <button key={r.key} type="button" className={`os-chip ${p.circleRelationships.includes(r.key) ? "os-chip--on" : ""}`} onClick={() => toggle(r.key)}>
            {p.circleRelationships.includes(r.key) && <FiCheck />} {r.name}
          </button>
        ))}
      </div>
      <div className="os-actions">
        <button className="os-btn os-btn--primary" onClick={() => onSave({ circleOn: p.circleOn, circleEveryDays: p.circleEveryDays, circleBudget: p.circleBudget, circleRelationships: p.circleRelationships })}>
          Save
        </button>
      </div>
      {inScope.length > 0 && (
        <>
          <p className="os-small os-muted" style={{ marginTop: 16 }}>
            Untick anyone who shouldn't come up.
          </p>
          <div className="os-grid3">
            {inScope.map((x) => (
              <label key={x._id} className="os-check">
                <input type="checkbox" checked={x.inCircle} onChange={(e) => onPerson(x._id, e.target.checked)} /> {x.name}
                <span className="os-small os-muted"> · {x.last ? `last gift ${shortDate(x.last)}` : "no gift yet"}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/** The gift circle: who's next and what to give, who comes after, and the settings. */
export default function CircleTab({ onPeopleChanged }: { onPeopleChanged?: () => void }) {
  const { view, error, act } = useCare();
  if (!view) return error ? <ErrorNote text={error} /> : <Loading />;
  const c = view.circle;
  const [first, ...after] = c.next;
  const nameOf = (id: string | null) => view.people.find((p) => p._id === id)?.name || "Someone";
  const entries = view.log.filter((e) => e.kind === "circle");
  const status = c.planned ? `Planned: ${nameOf(c.planned.personId)}${c.planned.on ? ` on ${shortDate(c.planned.on, true)}` : ""}` : c.due ? "Due now" : `Next one around ${shortDate(c.nextOn, true)}`;

  return (
    <div className="os-page">
      {error && <ErrorNote text={error} />}
      {c.eligible === 0 ? (
        <Card title="Gift circle">
          <p className="os-flat">
            Add the people you'd like to surprise now and then (friends, uncles, aunts, your parents and in-laws, grandma) on the <Link to="/gifting/people">People tab</Link>. Then
            one comes up here every {c.every} days.
          </p>
        </Card>
      ) : (
        <Card title="Up next" sub={`${status} · every ${c.every} days, about $${c.budget} each`} accent={c.due ? "#db2777" : undefined}>
          {c.planned ? (
            <div className="os-row">
              <span>
                {c.planned.title} for {nameOf(c.planned.personId)}
              </span>
              <button className="os-btn os-btn--small os-btn--primary" onClick={() => act(() => os.patch(`/gifting/care/log/${c.planned!.id}`, { status: "done" }))}>
                <FiCheck /> Sent it
              </button>
            </div>
          ) : (
            first && <NextUp key={first.personId} n={first} view={view} act={act} />
          )}
          {after.length > 0 && (
            <p className="os-small os-muted" style={{ marginTop: 12 }}>
              After them: {after.map((n) => `${n.name} (${ago(n)})`).join(", ")}.
            </p>
          )}
        </Card>
      )}

      <Card title="Circle gifts">
        {entries.length === 0 ? (
          <p className="os-muted os-flat">None yet.</p>
        ) : (
          <ul className="os-list">
            {entries.slice(0, 15).map((e) => (
              <LogRow key={e._id} e={e} who={nameOf(e.personId)} onDone={() => act(() => os.patch(`/gifting/care/log/${e._id}`, { status: "done" }))} onRemove={() => act(() => os.delete(`/gifting/care/log/${e._id}`))} />
            ))}
          </ul>
        )}
      </Card>

      <Settings
        key={JSON.stringify(view.prefs) + view.people.map((p) => p.inCircle).join()}
        view={view}
        onSave={(p) => act(() => os.patch("/gifting/care", p))}
        onPerson={(id, inCircle) =>
          act(async () => {
            await os.patch(`/gifting/people/${id}`, { inCircle });
            onPeopleChanged?.();
            return os.get("/gifting/care");
          })
        }
      />
    </div>
  );
}
