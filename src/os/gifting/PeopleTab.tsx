import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { shortDate } from "../format";
import type { Group, Overview, Person } from "./types";
import { MONTHS, mdText } from "./util";

const TIER: Record<Person["tier"], string> = { close: "Close", thoughtful: "Thoughtful", casual: "Casual" };
const GROUP: Record<Group, string> = { child: "Child", young: "Young adult", adult: "Adult", elder: "Older" };

function MonthDay({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [m, d] = value ? value.split("-") : ["", ""];
  const set = (mm: string, dd: string) => onChange(mm && dd ? `${mm}-${dd.padStart(2, "0")}` : null);
  return (
    <span className="os-row">
      <select value={m} onChange={(e) => set(e.target.value, d || "01")}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, "0")}>{name}</option>
        ))}
      </select>
      <input type="number" min={1} max={31} value={d ? Number(d) : ""} placeholder="Day" onChange={(e) => set(m, e.target.value)} style={{ width: 80 }} />
    </span>
  );
}

function PersonForm({ data, person, onSaved, onCancel }: { data: Overview; person?: Person; onSaved: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    name: person?.name || "",
    relationship: person?.relationship || "friend",
    group: person?.group || ("adult" as Group),
    gender: person?.gender || "",
    tier: person?.tier || "thoughtful",
    birthday: person?.birthday || null,
    other: person?.dates?.[0] || { label: "", md: "" },
    shirt: person?.sizes?.shirt || "",
    shoe: person?.sizes?.shoe || "",
    likes: person?.likes || "",
    notes: person?.notes || "",
  });
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const body = {
      name: f.name,
      relationship: f.relationship,
      group: f.group,
      gender: f.gender || null,
      tier: f.tier,
      birthday: f.birthday,
      dates: f.other.md ? [{ label: f.other.label || "anniversary", md: f.other.md }] : [],
      sizes: { shirt: f.shirt, shoe: f.shoe },
      likes: f.likes,
      notes: f.notes,
    };
    try {
      if (person) await os.patch(`/gifting/people/${person._id}`, body);
      else await os.post("/gifting/people", body);
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    }
  };
  return (
    <form className="os-form" onSubmit={submit}>
      <div className="os-grid4">
        <label>Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus /></label>
        <label>
          Relationship
          <select value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })}>
            {data.config.relationships.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
        </label>
        <label>
          Age group
          <select value={f.group} onChange={(e) => setF({ ...f, group: e.target.value as Group })}>
            {(Object.keys(GROUP) as Group[]).map((g) => <option key={g} value={g}>{GROUP[g]}</option>)}
          </select>
        </label>
        <label>
          How close
          <select value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value as Person["tier"] })}>
            <option value="close">Close (remind me if it's been a while)</option>
            <option value="thoughtful">Thoughtful</option>
            <option value="casual">Casual</option>
          </select>
        </label>
      </div>
      <div className="os-grid4">
        <label>Birthday<MonthDay value={f.birthday} onChange={(v) => setF({ ...f, birthday: v })} /></label>
        <label>Another date (label)<input value={f.other.label} onChange={(e) => setF({ ...f, other: { ...f.other, label: e.target.value } })} placeholder="e.g. anniversary" /></label>
        <label>&nbsp;<MonthDay value={f.other.md || null} onChange={(v) => setF({ ...f, other: { ...f.other, md: v || "" } })} /></label>
        <label>
          For clothing
          <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
            <option value="">–</option>
            <option value="man">Men's</option>
            <option value="woman">Women's</option>
          </select>
        </label>
      </div>
      <div className="os-grid4">
        <label>Shirt size<input value={f.shirt} onChange={(e) => setF({ ...f, shirt: e.target.value })} placeholder="e.g. L" /></label>
        <label>Shoe size<input value={f.shoe} onChange={(e) => setF({ ...f, shoe: e.target.value })} /></label>
        <label style={{ gridColumn: "span 2" }}>What they love<input value={f.likes} onChange={(e) => setF({ ...f, likes: e.target.value })} placeholder="e.g. tea, gospel music, Arsenal" /></label>
      </div>
      {error && <ErrorNote text={error} />}
      <div className="os-actions">
        <button className="os-btn os-btn--primary" type="submit">{person ? "Save" : "Add person"}</button>
        <button className="os-btn" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function LogGift({ person, onSaved, onCancel }: { person: Person; onSaved: () => void; onCancel: () => void }) {
  const [what, setWhat] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await os.post(`/gifting/people/${person._id}/gifts`, { what, cost: cost ? Number(cost) : null, date });
    onSaved();
  };
  return (
    <form className="os-form os-form--inline" onSubmit={submit}>
      <div className="os-grid4">
        <label style={{ gridColumn: "span 2" }}>What you gave<input value={what} onChange={(e) => setWhat(e.target.value)} required autoFocus /></label>
        <label>Cost ($)<input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} /></label>
        <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      <div className="os-actions">
        <button className="os-btn os-btn--primary" type="submit">Log gift</button>
        <button className="os-btn" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/** The people you give to: dates, sizes, what they love, and what you've given. */
export default function PeopleTab({ data, onChanged, onPlan }: { data: Overview; onChanged: () => void; onPlan: (personId: string) => void }) {
  const [view, setView] = useState<string>("");
  const rel = (k: string) => data.config.relationships.find((r) => r.key === k)?.name || k;
  const done = () => {
    setView("");
    onChanged();
  };
  return (
    <div className="os-page">
      {view === "new" ? (
        <Card title="Add someone"><PersonForm data={data} onSaved={done} onCancel={() => setView("")} /></Card>
      ) : (
        <div><button className="os-btn os-btn--primary" onClick={() => setView("new")}>Add someone</button></div>
      )}
      {data.people.length === 0 && <p className="os-muted">Add the people you give to: family, friends, the ones back home. Birthdays and "close" people get reminders.</p>}
      <div className="os-grid2">
        {data.people.map((p) => {
          const last = [...(p.gifts || [])].sort((a, b) => b.date.localeCompare(a.date))[0];
          return (
            <Card key={p._id} title={p.name} sub={`${rel(p.relationship)} · ${GROUP[p.group]} · ${TIER[p.tier]}`}>
              {view === `edit:${p._id}` ? (
                <PersonForm data={data} person={p} onSaved={done} onCancel={() => setView("")} />
              ) : (
                <>
                  <dl className="os-facts">
                    {(p.birthday || p.dates.length > 0) && (
                      <div><dt>Dates</dt><dd>{[p.birthday ? `Birthday ${mdText(p.birthday)}` : "", ...p.dates.map((d) => `${d.label} ${mdText(d.md)}`)].filter(Boolean).join(" · ")}</dd></div>
                    )}
                    {(p.sizes?.shirt || p.sizes?.shoe) && <div><dt>Sizes</dt><dd>{[p.sizes.shirt && `Shirt ${p.sizes.shirt}`, p.sizes.shoe && `Shoe ${p.sizes.shoe}`].filter(Boolean).join(" · ")}</dd></div>}
                    {p.likes && <div><dt>Loves</dt><dd>{p.likes}</dd></div>}
                    <div><dt>Last gift</dt><dd>{last ? `${last.what || "A gift"} · ${shortDate(last.date.slice(0, 10))}` : "None logged yet"}</dd></div>
                  </dl>
                  {view === `log:${p._id}` && <LogGift person={p} onSaved={done} onCancel={() => setView("")} />}
                  {view !== `log:${p._id}` && (
                    <div className="os-actions">
                      <button className="os-btn os-btn--primary" onClick={() => onPlan(p._id)}>Plan a gift</button>
                      <button className="os-btn" onClick={() => setView(`log:${p._id}`)}>Log a gift</button>
                      <button className="os-btn" onClick={() => setView(`edit:${p._id}`)}>Edit</button>
                      <button
                        className="os-btn os-btn--ghost"
                        onClick={async () => {
                          if (!window.confirm(`Remove ${p.name}?`)) return;
                          await os.delete(`/gifting/people/${p._id}`);
                          onChanged();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
