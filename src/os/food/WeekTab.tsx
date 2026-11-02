import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote, Progress } from "../Bits";
import { shortDate } from "../format";
import { Pics } from "../Pics";
import type { FoodOverview, GroceryItem, MealPlan, Mode, PlanDay } from "./types";

/** Build or edit a week: dinners day by day (swap any), then save to get the grocery list. */
function Planner({ data, weekStart, start, onSaved, onCancel }: { data: FoodOverview; weekStart: string; start: MealPlan | null; onSaved: () => void; onCancel: () => void }) {
  const [days, setDays] = useState<PlanDay[] | null>(start?.days || null);
  const [seed, setSeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const byKey = new Map(data.meals.map((m) => [m.key, m]));
  const dinners = data.meals.filter((m) => m.slots.includes("dinner") && !data.settings.dislikes.includes(m.key)).sort((a, b) => a.cuisine.localeCompare(b.cuisine) || a.name.localeCompare(b.name));

  const suggest = async (n: number) => {
    setBusy(true);
    setError("");
    try {
      const r = await os.post("/food/plan/preview", { weekStart, seed: n });
      setDays(r.data.plan.days);
      setSeed(n);
    } catch (err) {
      setError(errorText(err, "Couldn't plan the week."));
    } finally {
      setBusy(false);
    }
  };
  // A new week starts from a suggestion.
  useEffect(() => {
    if (start) return;
    let off = false;
    os.post("/food/plan/preview", { weekStart, seed: 0 })
      .then((r) => !off && setDays(r.data.plan.days))
      .catch((err) => !off && setError(errorText(err, "Couldn't plan the week.")));
    return () => {
      off = true;
    };
  }, [start, weekStart]);

  const set = (i: number, patch: Partial<PlanDay>) => setDays((d) => (d ? d.map((x, j) => (j === i ? { ...x, ...patch } : x)) : d));
  const save = async () => {
    if (!days) return;
    setBusy(true);
    try {
      await os.post("/food/plan", { weekStart, days });
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
      setBusy(false);
    }
  };

  return (
    <Card title={`Dinners for the week of ${shortDate(weekStart)}`} sub={`${data.settings.cookNights} cook nights; the rest ordered. Weeknights ${data.settings.weeknightMax} min or less. Swap anything.`}>
      {error && <ErrorNote text={error} />}
      {!days ? (
        <p className="os-muted">Planning…</p>
      ) : (
        <table className="os-table os-table--wide">
          <tbody>
            {days.map((d, i) => {
              const meal = byKey.get(d.key);
              return (
                <tr key={d.date}>
                  <td style={{ width: 90 }}><strong>{d.weekday}</strong><div className="os-small os-muted">{shortDate(d.date)}</div></td>
                  <td>
                    <select value={d.key} onChange={(e) => set(i, { key: e.target.value })}>
                      {dinners.map((m) => (
                        <option key={m.key} value={m.key}>{m.cuisine}: {m.name}{m.mode === "order" ? " (order)" : ` (${m.mins} min)`}</option>
                      ))}
                    </select>
                    {meal && <span className="os-small"> <Pics q={meal.search} label="ideas" /></span>}
                  </td>
                  <td style={{ width: 150 }}>
                    <div className="os-seg">
                      {(["cook", "order"] as Mode[]).map((m) => (
                        <button key={m} type="button" className={d.mode === m ? "on" : ""} onClick={() => set(i, { mode: m })}>{m === "cook" ? "Cook" : "Order"}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="os-actions">
        <button className="os-btn os-btn--primary" disabled={busy || !days} onClick={save}>Save and make the grocery list</button>
        <button className="os-btn" disabled={busy} onClick={() => suggest(seed + 1)}><FiRefreshCw /> Suggest another week</button>
        <button className="os-btn os-btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </Card>
  );
}

function Grocery({ data, plan, onChanged }: { data: FoodOverview; plan: MealPlan; onChanged: () => void }) {
  const [items, setItems] = useState<GroceryItem[]>(plan.grocery);
  const tick = async (g: GroceryItem) => {
    const next = items.map((x) => (x.name === g.name ? { ...x, bought: !x.bought } : x));
    setItems(next);
    await os.patch(`/food/plan/${plan._id}`, { bought: { [g.name]: !g.bought } });
    onChanged();
  };
  const toBuy = items.filter((g) => !g.staple);
  const staples = items.filter((g) => g.staple);
  const done = toBuy.filter((g) => g.bought).length;
  const aisleName = new Map(data.aisles.map((a) => [a.key, a.name]));
  const aisles = [...new Set(toBuy.map((g) => g.aisle))];
  const row = (g: GroceryItem) => (
    <label key={g.name} className={`os-groc${g.bought ? " done" : ""}`}>
      <input type="checkbox" checked={g.bought} onChange={() => tick(g)} />
      <span><strong>{g.name}</strong> <span className="os-small os-muted">for {g.for.join(", ")}</span></span>
    </label>
  );
  return (
    <Card title="Grocery list" sub="For the cook nights. Tick as you shop." right={<Progress value={toBuy.length ? (done / toBuy.length) * 100 : 0} color="#16a34a" label={`${done}/${toBuy.length}`} />}>
      {aisles.map((a) => (
        <div key={a} className="os-shopgroup">
          <h4>{aisleName.get(a) || a}</h4>
          {toBuy.filter((g) => g.aisle === a).map(row)}
        </div>
      ))}
      {staples.length > 0 && (
        <details className="os-details">
          <summary>Check you have ({staples.map((s) => s.name).join(", ")})</summary>
          {staples.map(row)}
        </details>
      )}
    </Card>
  );
}

function PlanView({ data, plan, label, onEdit, onChanged }: { data: FoodOverview; plan: MealPlan; label: string; onEdit: () => void; onChanged: () => void }) {
  const byKey = new Map(data.meals.map((m) => [m.key, m]));
  return (
    <>
      <Card title={label} right={<button className="os-btn" onClick={onEdit}>Change</button>}>
        <table className="os-table os-table--wide">
          <tbody>
            {plan.days.map((d) => {
              const meal = byKey.get(d.key);
              return (
                <tr key={d.date} className={d.date === data.date ? "os-today-row" : ""}>
                  <td style={{ width: 90 }}><strong>{d.weekday}</strong><div className="os-small os-muted">{shortDate(d.date)}</div></td>
                  <td>
                    <strong>{meal?.name || d.key}</strong> <span className="os-small os-muted">{meal?.cuisine}</span>
                    {d.lunch && <div className="os-small">Lunch: {d.lunch.replace(/^Leftovers: /, "leftovers from ")}</div>}
                  </td>
                  <td style={{ width: 170 }} className="os-num os-small">
                    {d.mode === "order" ? (meal ? <a href={meal.orderUrl} target="_blank" rel="noreferrer">Order nearby</a> : "Order") : meal ? <Pics q={meal.search} label="recipe ideas" /> : "Cook"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.settings.noShellfish && plan.days.some((d) => d.mode === "order") && <p className="os-small os-allergy" style={{ marginTop: 10 }}>Order nights: tell them about the shellfish allergy (crayfish and periwinkle in Nigerian soups, shrimp paste in Thai curries).</p>}
      </Card>
      {plan.grocery.length > 0 && <Grocery key={plan._id} data={data} plan={plan} onChanged={onChanged} />}
    </>
  );
}

/** This week's dinners and grocery list; plan next week on the weekend. */
export default function WeekTab({ data, reload }: { data: FoodOverview; reload: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const weekend = ["Sat", "Sun"].includes(data.weekday);
  const done = () => {
    setEditing(null);
    reload();
  };
  if (editing) {
    const start = editing === data.thisWeek ? data.plans.current : data.plans.next;
    return <Planner data={data} weekStart={editing} start={start} onSaved={done} onCancel={() => setEditing(null)} />;
  }
  return (
    <div className="os-page">
      {data.plans.current ? (
        <PlanView data={data} plan={data.plans.current} label="This week's dinners" onEdit={() => setEditing(data.thisWeek)} onChanged={reload} />
      ) : (
        <Card title="This week" sub="No plan yet. Two minutes now saves the 'what are we eating?' every night.">
          <button className="os-btn os-btn--primary" onClick={() => setEditing(data.thisWeek)}>Plan this week</button>
        </Card>
      )}
      {data.plans.next ? (
        <PlanView data={data} plan={data.plans.next} label="Next week's dinners" onEdit={() => setEditing(data.nextWeek)} onChanged={reload} />
      ) : (
        <Card title="Next week" sub={weekend ? "It's the weekend: plan next week and shop for it." : "Plan it on the weekend, then shop."}>
          <button className={`os-btn${weekend ? " os-btn--primary" : ""}`} onClick={() => setEditing(data.nextWeek)}>Plan next week</button>
        </Card>
      )}
    </div>
  );
}
