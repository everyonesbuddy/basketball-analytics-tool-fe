import { useState } from "react";
import { useCare } from "./useCare";
import { FiCheck, FiClock, FiExternalLink, FiX } from "react-icons/fi";
import os from "../api";
import { Card, ErrorNote, Loading } from "../Bits";
import { shortDate } from "../format";
import type { CareDue, CareEntry, CareIdea, CareKind, CarePrefs, CareView } from "./types";

const dueText = (d: CareDue, what: string) => {
  if (d.planned) return `Planned: ${d.planned.title} on ${shortDate(d.planned.on, true)}`;
  if (d.due) return d.lastDone ? `Due: last ${what} was ${d.since} days ago` : `Due now`;
  return `Next ${what} around ${shortDate(d.nextOn, true)}`;
};

/** One idea with its actions: plan it for a date, did it, not now, never. */
export function IdeaCard({ idea, kinds, onLog, onNever, big = false, compact = false }: { idea: CareIdea; kinds: Record<CareKind, string>; onLog: (status: "planned" | "done" | "skipped", plannedFor?: string) => void; onNever?: () => void; big?: boolean; compact?: boolean }) {
  const [planning, setPlanning] = useState(false);
  const [on, setOn] = useState("");
  return (
    <div className={`os-idea ${big ? "os-idea--big" : ""}`}>
      <div className="os-idea__head">
        <strong>{idea.title}</strong>
        <span className="os-small os-muted">
          {kinds[idea.kind]} · {idea.price ? `about $${idea.price}` : "free"}
          {idea.lead ? ` · book ${idea.lead} day${idea.lead === 1 ? "" : "s"} ahead` : ""}
          {idea.fits === false ? " · over your budget" : ""}
        </span>
      </div>
      <p className="os-small os-flat">{idea.how}</p>
      {idea.links.length > 0 && (
        <div className="os-row os-small">
          {idea.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
              {l.label} <FiExternalLink />
            </a>
          ))}
        </div>
      )}
      {planning ? (
        <div className="os-row">
          <input type="date" value={on} onChange={(e) => setOn(e.target.value)} aria-label="Plan it for" />
          <button className="os-btn os-btn--small os-btn--primary" disabled={!on} onClick={() => onLog("planned", on)}>
            Save
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => setPlanning(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="os-row">
          <button className="os-btn os-btn--small os-btn--primary" onClick={() => setPlanning(true)}>
            <FiClock /> Plan it
          </button>
          <button className="os-btn os-btn--small" onClick={() => onLog("done")}>
            <FiCheck /> Did it
          </button>
          {!compact && (
            <button className="os-btn os-btn--small os-btn--ghost" onClick={() => onLog("skipped")} title="Suggest something else; this comes back in 2 weeks">
              Not now
            </button>
          )}
          {onNever && !compact && (
            <button className="os-btn os-btn--small os-btn--ghost" onClick={onNever} title="She's not into this; never suggest it">
              Not her thing
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** A planned or done entry, with "done" for a plan and remove. */
export function LogRow({ e, onDone, onRemove, who }: { e: CareEntry; onDone: () => void; onRemove: () => void; who?: string }) {
  const tag = e.status === "done" ? "os-tag--ok" : e.status === "planned" ? "os-tag--warn" : "";
  return (
    <li className="os-row" style={{ justifyContent: "space-between" }}>
      <span>
        <span className={`os-tag ${tag}`}>{e.status === "done" ? "Done" : e.status === "planned" ? `Planned ${e.plannedFor ? shortDate(e.plannedFor.slice(0, 10)) : ""}` : "Skipped"}</span> {who ? `${who}: ` : ""}
        {e.title}
        <span className="os-small os-muted"> · {shortDate(e.date.slice(0, 10))}</span>
      </span>
      <span className="os-row">
        {e.status === "planned" && (
          <button className="os-btn os-btn--small" onClick={onDone}>
            <FiCheck /> Done
          </button>
        )}
        <button className="os-btn os-btn--small os-btn--ghost" onClick={onRemove} aria-label="Remove">
          <FiX />
        </button>
      </span>
    </li>
  );
}

function Settings({ view, onSave }: { view: CareView; onSave: (p: Partial<CarePrefs>) => void }) {
  const [p, setP] = useState(view.prefs);
  const toggle = (k: CareKind) => setP({ ...p, likesKinds: p.likesKinds.includes(k) ? p.likesKinds.filter((x) => x !== k) : [...p.likesKinds, k] });
  const n = (v: string) => Math.max(0, Number(v) || 0);
  return (
    <Card title="What she likes" sub="Her favorite kinds of things come first. Ideas you mark 'Not her thing' are never suggested.">
      <div className="os-grid3">
        <label>
          Who it's for
          <select value={p.spouseId || ""} onChange={(e) => setP({ ...p, spouseId: e.target.value || null })}>
            <option value="">Not in your people yet</option>
            {view.people.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Her name
          <input value={p.spouseName} onChange={(e) => setP({ ...p, spouseName: e.target.value })} placeholder="e.g. Ada" />
        </label>
      </div>
      <p className="os-small os-muted os-flat" style={{ marginTop: 12 }}>
        She likes
      </p>
      <div className="os-row">
        {(Object.keys(view.kinds) as CareKind[]).map((k) => (
          <button key={k} type="button" className={`os-chip ${p.likesKinds.includes(k) ? "os-chip--on" : ""}`} onClick={() => toggle(k)}>
            {p.likesKinds.includes(k) && <FiCheck />} {view.kinds[k]}
          </button>
        ))}
      </div>
      <div className="os-grid4" style={{ marginTop: 12 }}>
        <label>
          Something booked, every
          <span className="os-row">
            <input type="number" min={7} max={120} value={p.bigEveryDays} onChange={(e) => setP({ ...p, bigEveryDays: n(e.target.value) })} /> days
          </span>
        </label>
        <label>
          Up to ($)
          <input type="number" min={0} value={p.budgetBig} onChange={(e) => setP({ ...p, budgetBig: n(e.target.value) })} />
        </label>
        <label>
          A small one, every
          <span className="os-row">
            <input type="number" min={3} max={60} value={p.smallEveryDays} onChange={(e) => setP({ ...p, smallEveryDays: n(e.target.value) })} /> days
          </span>
        </label>
        <label>
          Up to ($)
          <input type="number" min={0} value={p.budgetSmall} onChange={(e) => setP({ ...p, budgetSmall: n(e.target.value) })} />
        </label>
      </div>
      <label style={{ marginTop: 12, display: "block" }}>
        Things she's mentioned wanting
        <textarea rows={3} value={p.wishlist} onChange={(e) => setP({ ...p, wishlist: e.target.value })} placeholder="Write it down the moment she says it: a candle she liked, a restaurant, a book…" />
      </label>
      <div className="os-actions">
        <button className="os-btn os-btn--primary" onClick={() => onSave({ spouseId: p.spouseId, spouseName: p.spouseName, likesKinds: p.likesKinds, budgetBig: p.budgetBig, budgetSmall: p.budgetSmall, bigEveryDays: p.bigEveryDays, smallEveryDays: p.smallEveryDays, wishlist: p.wishlist })}>
          Save
        </button>
      </div>
    </Card>
  );
}

/** For your wife: what to book next, a small gesture, every idea, what she likes, and what you've done. */
export default function CareTab() {
  const { view, error, act } = useCare();
  const [kindFilter, setKindFilter] = useState<CareKind | "all">("all");
  const [showAll, setShowAll] = useState(false);
  if (!view) return error ? <ErrorNote text={error} /> : <Loading />;
  const her = view.prefs.spouseName || "her";
  const log = (idea: CareIdea, status: "planned" | "done" | "skipped", plannedFor?: string) => act(() => os.post("/gifting/care/log", { kind: "care", ideaKey: idea.key, status, plannedFor }));
  const never = (idea: CareIdea) => act(() => os.patch("/gifting/care", { dislikes: [...view.prefs.dislikes, idea.key] }));
  const entries = view.log.filter((e) => e.kind === "care");
  const ideas = view.ideas.filter((i) => !view.prefs.dislikes.includes(i.key) && (kindFilter === "all" || i.kind === kindFilter));

  return (
    <div className="os-page">
      {error && <ErrorNote text={error} />}
      {!view.prefs.spouseName && !view.spouse && (
        <p className="os-muted os-flat">Add her name below (or add her on the People tab as "Wife or partner") so reminders say her name.</p>
      )}
      <div className="os-grid2">
        {(["big", "small"] as const).map((size) => {
          const d = view.due[size];
          const [first, ...more] = view.suggestions[size];
          return (
            <Card
              key={size}
              title={size === "big" ? `Book something for ${her}` : `A small one for ${her}`}
              sub={dueText(d, size === "big" ? "booking" : "gesture")}
              accent={d.due ? "#db2777" : undefined}
            >
              {d.planned ? (
                <div className="os-row">
                  <button className="os-btn os-btn--primary os-btn--small" onClick={() => act(() => os.patch(`/gifting/care/log/${d.planned!.id}`, { status: "done" }))}>
                    <FiCheck /> Done
                  </button>
                  <span className="os-small os-muted">Then the next one comes up in {d.every} days.</span>
                </div>
              ) : first ? (
                <>
                  <IdeaCard idea={first} kinds={view.kinds} big onLog={(s, on) => log(first, s, on)} onNever={() => never(first)} />
                  {more.length > 0 && <p className="os-small os-muted os-flat">Or: {more.map((m) => m.title.toLowerCase()).join("; ")}.</p>}
                </>
              ) : (
                <p className="os-muted">You've done every idea lately. See all ideas below.</p>
              )}
            </Card>
          );
        })}
      </div>

      {view.prefs.wishlist && (
        <Card title="Things she's mentioned wanting">
          <p className="os-flat" style={{ whiteSpace: "pre-wrap" }}>
            {view.prefs.wishlist}
          </p>
        </Card>
      )}

      <Card title="Planned and done" sub="Done ones are also saved on her gift history.">
        {entries.length === 0 ? (
          <p className="os-muted os-flat">Nothing yet. Plan the first one above.</p>
        ) : (
          <ul className="os-list">
            {entries.slice(0, 15).map((e) => (
              <LogRow key={e._id} e={e} onDone={() => act(() => os.patch(`/gifting/care/log/${e._id}`, { status: "done" }))} onRemove={() => act(() => os.delete(`/gifting/care/log/${e._id}`))} />
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Every idea"
        sub={`${view.ideas.length - view.prefs.dislikes.length} ideas. Pick one yourself any time.`}
        right={
          <button className="os-btn os-btn--small" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Hide" : "Show all"}
          </button>
        }
      >
        {showAll && (
        <>
        <div className="os-row" style={{ marginBottom: 12 }}>
          <button className={`os-chip ${kindFilter === "all" ? "os-chip--on" : ""}`} onClick={() => setKindFilter("all")}>
            All
          </button>
          {(Object.keys(view.kinds) as CareKind[]).map((k) => (
            <button key={k} className={`os-chip ${kindFilter === k ? "os-chip--on" : ""}`} onClick={() => setKindFilter(k)}>
              {view.kinds[k]}
            </button>
          ))}
        </div>
        <div className="os-grid3">
          {ideas.map((i) => (
            <IdeaCard key={i.key} idea={i} kinds={view.kinds} compact onLog={(s, on) => log(i, s, on)} />
          ))}
        </div>
        </>
        )}
        {view.prefs.dislikes.length > 0 && (
          <p className="os-small os-muted" style={{ marginTop: 12 }}>
            Not her thing: {view.prefs.dislikes.map((k) => view.ideas.find((i) => i.key === k)?.title || k).join(", ")}.{" "}
            <button className="os-btn os-btn--small os-btn--ghost" onClick={() => act(() => os.patch("/gifting/care", { dislikes: [] }))}>
              Bring them back
            </button>
          </p>
        )}
      </Card>

      <Settings key={JSON.stringify(view.prefs)} view={view} onSave={(p) => act(() => os.patch("/gifting/care", p))} />
    </div>
  );
}
