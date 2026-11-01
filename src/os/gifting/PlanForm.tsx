import { useEffect, useState } from "react";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { GroupPlanView, HamperView } from "./PlanResult";
import type { Group, GroupInputs, GroupResult, HamperResult, OneInputs, Overview } from "./types";

const GROUP_LABEL: Record<Group, string> = { child: "Children", young: "Young adults", adult: "Adults", elder: "Older relatives" };

/**
 * Plan a gift: a group on a budget (like December in Nigeria) or one person's
 * hamper. The suggestion updates as you type; save it to get a checklist.
 */
export default function PlanForm({ data, personId, onSaved }: { data: Overview; personId?: string; onSaved: (id: string) => void }) {
  const person = data.people.find((p) => p._id === personId);
  const [kind, setKind] = useState<"group" | "one">(person ? "one" : "group");
  const [title, setTitle] = useState(person ? `Gift for ${person.name}` : "December in Nigeria");
  const [date, setDate] = useState("");
  const [group, setGroup] = useState<GroupInputs>({ budget: 150, counts: { child: 10, young: 5, adult: 10, elder: 3 }, special: 2, womenShare: 0.5, suitcases: 1 });
  const [one, setOne] = useState<OneInputs>({ budget: 50, relationship: person?.relationship || "mother", likes: person?.likes || "" });
  const [who, setWho] = useState(personId || "");
  const [result, setResult] = useState<GroupResult | HamperResult | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputs = kind === "group" ? group : one;
  const key = JSON.stringify([kind, inputs]);

  // Live preview, a moment after you stop typing.
  useEffect(() => {
    let off = false;
    const t = window.setTimeout(() => {
      os.post("/gifting/plans/preview", { kind, inputs: JSON.parse(key)[1] })
        .then((r) => !off && setResult(r.data.result))
        .catch((err) => !off && setError(errorText(err, "Couldn't work it out.")));
    }, 300);
    return () => {
      off = true;
      window.clearTimeout(t);
    };
  }, [key, kind]);

  const pickPerson = (id: string) => {
    setWho(id);
    const p = data.people.find((x) => x._id === id);
    if (p) {
      setOne({ ...one, relationship: data.config.relationships.some((r) => r.key === p.relationship) ? p.relationship : one.relationship, likes: p.likes || one.likes });
      setTitle(`Gift for ${p.name}`);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await os.post("/gifting/plans", { kind, title, date: date || null, inputs, person: kind === "one" ? who || null : null });
      onSaved(res.data.plan._id);
    } catch (err) {
      setError(errorText(err, "Couldn't save the plan."));
    } finally {
      setSaving(false);
    }
  };

  const n = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <div className="os-page">
      <Card>
        <div className="os-form">
          <div className="os-seg os-seg--big">
            <button type="button" className={kind === "group" ? "on" : ""} onClick={() => { setKind("group"); setResult(null); if (title.startsWith("Gift for")) setTitle("December in Nigeria"); }}>
              A group<small>e.g. 25 people back home</small>
            </button>
            <button type="button" className={kind === "one" ? "on" : ""} onClick={() => { setKind("one"); setResult(null); if (!title.startsWith("Gift for")) setTitle("Gift for…"); }}>
              One person<small>a hamper or gift box</small>
            </button>
          </div>
          <div className="os-grid2">
            <label>
              Name this plan
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
            </label>
            <label className="os-narrow">
              When (optional)
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          {kind === "group" ? (
            <>
              <div className="os-grid4">
                <label>
                  Budget ($)
                  <input type="number" min={0} value={group.budget} onChange={(e) => setGroup({ ...group, budget: n(e.target.value) })} />
                </label>
                {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
                  <label key={g}>
                    {GROUP_LABEL[g]}
                    <input type="number" min={0} value={group.counts[g]} onChange={(e) => setGroup({ ...group, counts: { ...group.counts, [g]: n(e.target.value) } })} />
                  </label>
                ))}
                <label>
                  Special people
                  <input type="number" min={0} value={group.special} onChange={(e) => setGroup({ ...group, special: n(e.target.value) })} />
                  <small>parents, closest family</small>
                </label>
                <label>
                  Women (%)
                  <input type="number" min={0} max={100} value={Math.round(group.womenShare * 100)} onChange={(e) => setGroup({ ...group, womenShare: Math.min(100, n(e.target.value)) / 100 })} />
                </label>
                <label>
                  Suitcases
                  <input type="number" min={1} max={10} value={group.suitcases} onChange={(e) => setGroup({ ...group, suitcases: Math.max(1, n(e.target.value)) })} />
                </label>
              </div>
            </>
          ) : (
            <div className="os-grid4">
              {data.people.length > 0 && (
                <label>
                  For
                  <select value={who} onChange={(e) => pickPerson(e.target.value)}>
                    <option value="">Someone not on my list</option>
                    {data.people.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Relationship
                <select value={one.relationship} onChange={(e) => setOne({ ...one, relationship: e.target.value })}>
                  {data.config.relationships.map((r) => (
                    <option key={r.key} value={r.key}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Budget ($)
                <input type="number" min={0} value={one.budget} onChange={(e) => setOne({ ...one, budget: n(e.target.value) })} />
              </label>
              <label>
                What they love (optional)
                <input value={one.likes} onChange={(e) => setOne({ ...one, likes: e.target.value })} placeholder="e.g. gospel music, tea, Arsenal" />
              </label>
            </div>
          )}
          {error && <ErrorNote text={error} />}
          <div className="os-actions">
            <button className="os-btn os-btn--primary" onClick={save} disabled={saving || !result}>
              Save plan and make a checklist
            </button>
          </div>
        </div>
      </Card>
      {result && (kind === "group" ? <GroupPlanView r={result as GroupResult} /> : "best" in result ? <HamperView r={result as HamperResult} /> : null)}
    </div>
  );
}
