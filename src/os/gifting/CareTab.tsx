import { useState } from "react";
import { useCare } from "./useCare";
import { FiCalendar, FiCheck, FiExternalLink, FiHeart, FiX } from "react-icons/fi";
import os from "../api";
import { Card, ErrorNote, Loading } from "../Bits";
import { shortDate } from "../format";
import type { CareDue, CareEntry, CareIdea, CareKind, CarePrefs, CareView } from "./types";

const dueText = (d: CareDue, what: string) => {
  if (d.planned) return `Planned · one every ${d.every} days`;
  if (d.due) return d.lastDone ? `Due: last ${what} was ${d.since} days ago` : `Due now`;
  return `Next ${what} around ${shortDate(d.nextOn, true)}`;
};

/** One idea with its actions: plan it for a date, did it, not now, never. */
export function IdeaCard({ idea, kinds, onLog, onNever, big = false, compact = false }: { idea: CareIdea; kinds: Record<CareKind, string>; onLog: (status: "planned" | "done" | "skipped", plannedFor?: string) => void; onNever?: () => void; big?: boolean; compact?: boolean }) {
  const [planning, setPlanning] = useState(false);
  const [on, setOn] = useState("");
  const meta = [idea.price ? `about $${idea.price}` : "free", idea.lead ? `book ${idea.lead} day${idea.lead === 1 ? "" : "s"} ahead` : ""].filter(Boolean).join(" · ");
  return (
    <div className={`os-care ${big ? "os-care--big" : ""} ${compact ? "os-care--compact" : ""}`}>
      <div className="os-care__head">
        <span className={`os-care__kind os-care__kind--${idea.kind}`}>{kinds[idea.kind]}</span>
        <strong className="os-care__title">{idea.title}</strong>
        <span className="os-small os-muted">
          {meta}
          {idea.fits === false && <span className="os-bad"> · over your budget</span>}
        </span>
      </div>
      <p className="os-care__how">{idea.how}</p>
      {idea.links.length > 0 && (
        <div className="os-care__links">
          {idea.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
              {l.label} <FiExternalLink />
            </a>
          ))}
        </div>
      )}
      {planning ? (
        <div className="os-care__actions">
          <input type="date" className="os-input" value={on} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setOn(e.target.value)} aria-label="Plan it for" autoFocus />
          <button className="os-btn os-btn--small os-btn--primary" disabled={!on} onClick={() => onLog("planned", on)}>
            Save
          </button>
          <button className="os-btn os-btn--small os-btn--ghost" onClick={() => setPlanning(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="os-care__actions">
          <button className="os-btn os-btn--small os-btn--primary" onClick={() => setPlanning(true)}>
            <FiCalendar /> Plan it
          </button>
          <button className="os-btn os-btn--small" onClick={() => onLog("done")}>
            <FiCheck /> Did it
          </button>
          {!compact && (
            <span className="os-care__later">
              <button className="os-link os-link--muted" onClick={() => onLog("skipped")} title="Suggest something else; this comes back in 2 weeks">
                Not now
              </button>
              {onNever && (
                <button className="os-link os-link--muted" onClick={onNever} title="She's not into this; never suggest it">
                  Not her thing
                </button>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** A planned or done entry, with "done" for a plan and remove. */
export function LogRow({ e, onDone, onRemove, who }: { e: CareEntry; onDone: () => void; onRemove: () => void; who?: string }) {
  const planned = e.status === "planned";
  const when = planned && e.plannedFor ? e.plannedFor.slice(0, 10) : e.date.slice(0, 10);
  return (
    <li className={`os-logrow os-logrow--${e.status}`}>
      <span className="os-logrow__date">{shortDate(when)}</span>
      <span className="os-logrow__body">
        <strong>
          {who ? `${who}: ` : ""}
          {e.title}
        </strong>
        <span className="os-small os-muted">{planned ? "Planned" : e.status === "done" ? `Done${e.cost ? ` · $${e.cost}` : ""}` : "Skipped"}</span>
      </span>
      <span className="os-logrow__actions">
        {planned && (
          <button className="os-btn os-btn--small" onClick={onDone}>
            <FiCheck /> Done
          </button>
        )}
        <button className="os-btn os-btn--small os-btn--ghost" onClick={onRemove} aria-label="Remove" title="Remove">
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
      <div className="os-form os-settings">
      <div className="os-grid2">
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
      <div className="os-field">
        She likes
      <div className="os-row">
        {(Object.keys(view.kinds) as CareKind[]).map((k) => (
          <button key={k} type="button" className={`os-chip ${p.likesKinds.includes(k) ? "os-chip--on" : ""}`} onClick={() => toggle(k)}>
            {p.likesKinds.includes(k) && <FiCheck />} {view.kinds[k]}
          </button>
        ))}
      </div>
      </div>
      <div className="os-grid4">
        <label>
          Something booked, every
          <span className="os-suffix">
            <input type="number" min={7} max={120} value={p.bigEveryDays} onChange={(e) => setP({ ...p, bigEveryDays: n(e.target.value) })} />
            <span>days</span>
          </span>
        </label>
        <label>
          Up to
          <span className="os-prefix">
            <span>$</span>
            <input type="number" min={0} value={p.budgetBig} onChange={(e) => setP({ ...p, budgetBig: n(e.target.value) })} />
          </span>
        </label>
        <label>
          A small one, every
          <span className="os-suffix">
            <input type="number" min={3} max={60} value={p.smallEveryDays} onChange={(e) => setP({ ...p, smallEveryDays: n(e.target.value) })} />
            <span>days</span>
          </span>
        </label>
        <label>
          Up to
          <span className="os-prefix">
            <span>$</span>
            <input type="number" min={0} value={p.budgetSmall} onChange={(e) => setP({ ...p, budgetSmall: n(e.target.value) })} />
          </span>
        </label>
      </div>
      <label>
        Things she's mentioned wanting
        <textarea rows={3} value={p.wishlist} onChange={(e) => setP({ ...p, wishlist: e.target.value })} placeholder="Write it down the moment she says it: a candle she liked, a restaurant, a book…" />
      </label>
      <div className="os-actions">
        <button className="os-btn os-btn--primary" onClick={() => onSave({ spouseId: p.spouseId, spouseName: p.spouseName, likesKinds: p.likesKinds, budgetBig: p.budgetBig, budgetSmall: p.budgetSmall, bigEveryDays: p.bigEveryDays, smallEveryDays: p.smallEveryDays, wishlist: p.wishlist })}>
          Save
        </button>
      </div>
      </div>
    </Card>
  );
}

/** One of the two "due" cards: the top idea, with the runners-up a tap away. */
function DueCard({ size, view, her, log, never, act }: { size: "big" | "small"; view: CareView; her: string; log: (idea: CareIdea, status: "planned" | "done" | "skipped", plannedFor?: string) => void; never: (idea: CareIdea) => void; act: ReturnType<typeof useCare>["act"] }) {
  const [pick, setPick] = useState(0);
  const d = view.due[size];
  const list = view.suggestions[size];
  const idea = list[Math.min(pick, list.length - 1)];
  const what = size === "big" ? "booking" : "gesture";
  return (
    <Card title={size === "big" ? `Book something for ${her}` : `A small one for ${her}`} sub={dueText(d, what)} accent={d.due && !d.planned ? "#db2777" : undefined} right={d.due && !d.planned ? <span className="os-tag os-tag--due">Due</span> : undefined}>
      {d.planned ? (
        <div className="os-care os-care--planned">
          <span className="os-care__when">
            <FiCalendar /> {shortDate(d.planned.on, true)}
          </span>
          <strong className="os-care__title">{d.planned.title}</strong>
          <span className="os-small os-muted">When it's done, the next {what} comes up in {d.every} days.</span>
          <div className="os-care__actions">
            <button className="os-btn os-btn--primary os-btn--small" onClick={() => act(() => os.patch(`/gifting/care/log/${d.planned!.id}`, { status: "done" }))}>
              <FiCheck /> Done
            </button>
            <button className="os-link os-link--muted" onClick={() => act(() => os.delete(`/gifting/care/log/${d.planned!.id}`))}>
              Cancel the plan
            </button>
          </div>
        </div>
      ) : idea ? (
        <>
          <IdeaCard key={idea.key} idea={idea} kinds={view.kinds} big={size === "big"} onLog={(s, on) => log(idea, s, on)} onNever={() => never(idea)} />
          {list.length > 1 && (
            <div className="os-care__alts">
              <span className="os-small os-muted">Or</span>
              {list.map((m, i) =>
                i === Math.min(pick, list.length - 1) ? null : (
                  <button key={m.key} className="os-chip" onClick={() => setPick(i)}>
                    {m.title}
                  </button>
                ),
              )}
            </div>
          )}
        </>
      ) : (
        <p className="os-muted os-flat">You've done every idea lately. Pick one from all the ideas below.</p>
      )}
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
        <p className="os-hint">Add her name below (or add her on the People tab as "Wife or partner") so reminders say her name.</p>
      )}
      <div className="os-grid2 os-grid2--top">
        <DueCard size="big" view={view} her={her} log={log} never={never} act={act} />
        <DueCard size="small" view={view} her={her} log={log} never={never} act={act} />
      </div>

      {view.prefs.wishlist && (
        <Card title="Things she's mentioned wanting" sub="Edit the list in her settings at the bottom.">
          <ul className="os-wish">
            {view.prefs.wishlist
              .split("\n")
              .map((w) => w.trim())
              .filter(Boolean)
              .map((w) => (
                <li key={w}>
                  <FiHeart /> {w}
                </li>
              ))}
          </ul>
        </Card>
      )}

      <Card title="Planned and done" sub="Done ones are also saved on her gift history.">
        {entries.length === 0 ? (
          <p className="os-muted os-flat">Nothing yet. Plan the first one above.</p>
        ) : (
          <ul className="os-loglist">
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
        <div className="os-row os-care__filters">
          <button className={`os-chip ${kindFilter === "all" ? "os-chip--on" : ""}`} onClick={() => setKindFilter("all")}>
            All
          </button>
          {(Object.keys(view.kinds) as CareKind[]).map((k) => (
            <button key={k} className={`os-chip ${kindFilter === k ? "os-chip--on" : ""}`} onClick={() => setKindFilter(k)}>
              {view.kinds[k]}
            </button>
          ))}
        </div>
        <div className="os-caregrid">
          {ideas.map((i) => (
            <IdeaCard key={i.key} idea={i} kinds={view.kinds} compact onLog={(s, on) => log(i, s, on)} />
          ))}
        </div>
        </>
        )}
        {view.prefs.dislikes.length > 0 && (
          <p className="os-small os-muted os-care__never">
            Not her thing: {view.prefs.dislikes.map((k) => view.ideas.find((i) => i.key === k)?.title || k).join(", ")}.{" "}
            <button className="os-link" onClick={() => act(() => os.patch("/gifting/care", { dislikes: [] }))}>
              Bring them back
            </button>
          </p>
        )}
      </Card>

      <Settings key={JSON.stringify(view.prefs)} view={view} onSave={(p) => act(() => os.patch("/gifting/care", p))} />
    </div>
  );
}
