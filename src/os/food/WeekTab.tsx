import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote, Progress } from "../Bits";
import { shortDate } from "../format";
import { Pics } from "../Pics";
import type { FoodOverview, GroceryItem, MealPlan, Mode, PlanDay } from "./types";

const MODE_NAME: Record<Mode, string> = { cook: "Cook", order: "Order in" };
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const range = (start: string) => `${shortDate(start)} – ${shortDate(addDays(start, 6))}`;

/** Step 1, editing: dinners day by day (starts from a suggestion; swap anything). */
function Planner({ data, weekStart, start, onSaved, onCancel }: { data: FoodOverview; weekStart: string; start: MealPlan | null; onSaved: () => void; onCancel: () => void }) {
  const [days, setDays] = useState<PlanDay[] | null>(start?.days || null);
  const [seed, setSeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const byKey = new Map(data.meals.map((m) => [m.key, m]));
  const dinners = data.meals.filter((m) => m.slots.includes("dinner") && !data.settings.dislikes.includes(m.key)).sort((a, b) => a.cuisine.localeCompare(b.cuisine) || a.name.localeCompare(b.name));

  useEffect(() => {
    if (start) return;
    let off = false;
    os.post("/food/plan/preview", { weekStart, seed: 0 })
      .then((r) => !off && setDays(r.data.plan.days))
      .catch((err) => !off && setError(errorText(err, "Couldn't suggest dinners.")));
    return () => {
      off = true;
    };
  }, [start, weekStart]);

  const suggest = async (n: number) => {
    setBusy(true);
    setError("");
    try {
      const r = await os.post("/food/plan/preview", { weekStart, seed: n });
      setDays(r.data.plan.days);
      setSeed(n);
    } catch (err) {
      setError(errorText(err, "Couldn't suggest dinners."));
    } finally {
      setBusy(false);
    }
  };
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
    <Card title={`1. Choose dinners for ${range(weekStart)}`} sub={`A suggestion to start: ${data.settings.cookNights} nights cooking, the rest ordering in, weeknights ${data.settings.weeknightMax} min or less. Change any night.`}>
      {error && <ErrorNote text={error} />}
      {!days ? (
        <p className="os-muted">Suggesting dinners…</p>
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
                        <option key={m.key} value={m.key}>{m.name} · {m.cuisine}{m.mode === "order" ? "" : ` · ${m.mins} min`}</option>
                      ))}
                    </select>
                    {meal?.desc && <div className="os-small os-muted">{meal.desc} <Pics q={meal.search} label="ideas" /></div>}
                  </td>
                  <td style={{ width: 190 }}>
                    <div className="os-seg">
                      {(["cook", "order"] as Mode[]).map((m) => (
                        <button key={m} type="button" className={d.mode === m ? "on" : ""} onClick={() => set(i, { mode: m })}>{MODE_NAME[m]}</button>
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
        <button className="os-btn os-btn--primary" disabled={busy || !days} onClick={save}>Save dinners and build the grocery list</button>
        <button className="os-btn" disabled={busy} onClick={() => suggest(seed + 1)}><FiRefreshCw /> Suggest different dinners</button>
        <button className="os-btn os-btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </Card>
  );
}

/** Step 2: the grocery list for the cook nights, by aisle, with ticks. */
function Grocery({ data, plan, onChanged }: { data: FoodOverview; plan: MealPlan; onChanged: () => void }) {
  const [items, setItems] = useState<GroceryItem[]>(plan.grocery);
  const send = async (bought: Record<string, boolean>) => {
    setItems((list) => list.map((x) => (x.name in bought ? { ...x, bought: bought[x.name] } : x)));
    await os.patch(`/food/plan/${plan._id}`, { bought });
    onChanged();
  };
  const toBuy = items.filter((g) => !g.staple);
  const staples = items.filter((g) => g.staple);
  const done = toBuy.filter((g) => g.bought).length;
  const aisleName = new Map(data.aisles.map((a) => [a.key, a.name]));
  const aisles = [...new Set(toBuy.map((g) => g.aisle))];
  const row = (g: GroceryItem) => (
    <label key={g.name} className={`os-groc${g.bought ? " done" : ""}`}>
      <input type="checkbox" checked={g.bought} onChange={() => send({ [g.name]: !g.bought })} />
      <span><strong>{g.name}</strong> <span className="os-small os-muted">for {g.for.join(", ")}</span></span>
    </label>
  );
  return (
    <Card
      title="2. Grocery list"
      sub={`Everything for the ${plan.days.filter((d) => d.mode === "cook").length} nights you're cooking. Tick as you shop.`}
      right={
        <span className="os-row">
          <Progress value={toBuy.length ? (done / toBuy.length) * 100 : 0} color="#16a34a" label={`${done}/${toBuy.length} bought`} />
          {items.some((g) => g.bought) && <button className="os-link os-small" onClick={() => send(Object.fromEntries(items.map((g) => [g.name, false])))}>Clear ticks</button>}
        </span>
      }
    >
      {toBuy.length === 0 && <p className="os-muted">Nothing to buy: every night is ordering in.</p>}
      {aisles.map((a) => (
        <div key={a} className="os-shopgroup">
          <h4>{aisleName.get(a) || a}</h4>
          {toBuy.filter((g) => g.aisle === a).map(row)}
        </div>
      ))}
      {staples.length > 0 && (
        <details className="os-details">
          <summary>Basics to check you have ({staples.map((s) => s.name).join(", ")})</summary>
          {staples.map(row)}
        </details>
      )}
    </Card>
  );
}

/**
 * Meal plan & groceries: pick a week, then 1. its dinners, 2. the grocery
 * list built from them.
 */
export default function WeekTab({ data, reload }: { data: FoodOverview; reload: () => void }) {
  const weekend = ["Sat", "Sun"].includes(data.weekday);
  const [week, setWeek] = useState<string>(weekend && !data.plans.next ? data.nextWeek : data.thisWeek);
  const [editing, setEditing] = useState(false);
  const plan = week === data.thisWeek ? data.plans.current : data.plans.next;
  const byKey = new Map(data.meals.map((m) => [m.key, m]));
  const done = () => {
    setEditing(false);
    reload();
  };
  const remove = async () => {
    if (!plan?._id || !window.confirm(`Delete the dinners and grocery list for ${range(week)}?`)) return;
    await os.delete(`/food/plan/${plan._id}`);
    reload();
  };

  return (
    <div className="os-page">
      <div className="os-seg os-seg--big">
        {[
          [data.thisWeek, "This week", data.plans.current],
          [data.nextWeek, "Next week", data.plans.next],
        ].map(([w, label, p]) => (
          <button key={w as string} type="button" className={week === w ? "on" : ""} onClick={() => { setWeek(w as string); setEditing(false); }}>
            {label as string}
            <small>{range(w as string)} · {p ? "planned" : "not planned"}</small>
          </button>
        ))}
      </div>

      {editing || !plan ? (
        editing ? (
          <Planner key={week} data={data} weekStart={week} start={plan} onSaved={done} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <Card title={`1. Dinners for ${range(week)}`} sub="Not planned yet. Get a suggested week in one tap, swap what you don't fancy, and the grocery list builds itself.">
              <button className="os-btn os-btn--primary" onClick={() => setEditing(true)}>Suggest dinners</button>
            </Card>
            <Card title="2. Grocery list" sub="Plan the dinners first; the list comes from the nights you cook." />
          </>
        )
      ) : (
        <>
          <Card
            title={`1. Dinners for ${range(week)}`}
            right={
              <span className="os-row">
                <button className="os-btn" onClick={() => setEditing(true)}>Change dinners</button>
                <button className="os-btn os-btn--ghost" onClick={remove}>Delete plan</button>
              </span>
            }
          >
            <table className="os-table os-table--wide">
              <tbody>
                {plan.days.map((d) => {
                  const meal = byKey.get(d.key);
                  return (
                    <tr key={d.date} className={d.date === data.date ? "os-today-row" : ""}>
                      <td style={{ width: 90 }}><strong>{d.weekday}</strong><div className="os-small os-muted">{shortDate(d.date)}</div></td>
                      <td>
                        <strong>{meal?.name || d.key}</strong> <span className="os-small os-muted">· {meal?.cuisine} · {d.mode === "order" ? "order in" : "cook"}</span>
                        {d.lunch && <div className="os-small">Next day's lunch: {d.lunch.replace(/^Leftovers: /, "leftovers of ")}</div>}
                      </td>
                      <td style={{ width: 150 }} className="os-num os-small">
                        {d.mode === "order" ? (meal ? <a href={meal.orderUrl} target="_blank" rel="noreferrer">Order nearby</a> : null) : meal ? <Pics q={meal.search} label="recipe ideas" /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.settings.noShellfish && plan.days.some((d) => d.mode === "order") && <p className="os-small os-allergy" style={{ marginTop: 10 }}>Order nights: tell them about the shellfish allergy (crayfish and periwinkle in Nigerian soups, shrimp paste in Thai curries).</p>}
          </Card>
          <Grocery key={plan._id} data={data} plan={plan} onChanged={reload} />
        </>
      )}
    </div>
  );
}
