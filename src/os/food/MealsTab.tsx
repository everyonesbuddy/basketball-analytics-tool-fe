import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { Pics } from "../Pics";
import type { FoodOverview, Slot } from "./types";
import { SLOT_NAME } from "./types";

function Settings({ data, reload }: { data: FoodOverview; reload: () => void }) {
  const s = data.settings;
  const save = async (patch: Partial<typeof s>) => {
    await os.put("/food/settings", patch);
    reload();
  };
  const all = s.cuisines.length === 0;
  const toggleCuisine = (c: string) => {
    const current = all ? data.cuisines : s.cuisines;
    const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c];
    save({ cuisines: next.length === data.cuisines.length ? [] : next });
  };
  return (
    <Card title="What fits your kitchen">
      <div className="os-form">
        <label className="os-check">
          <input type="checkbox" checked={s.noShellfish} onChange={(e) => save({ noShellfish: e.target.checked })} /> Shellfish allergy: no shrimp, crab, lobster, crayfish, periwinkle and the like (fish is fine)
        </label>
        <div className="os-grid4">
          <label>
            Sugar
            <select value={s.sugar} onChange={(e) => save({ sugar: e.target.value as "little" | "none" })}>
              <option value="little">Little (a touch in a sauce is okay)</option>
              <option value="none">None at all</option>
            </select>
          </label>
          <label>
            Corn tortillas
            <select value={s.tortillas ? "yes" : "no"} onChange={(e) => save({ tortillas: e.target.value === "yes" })}>
              <option value="yes">Fine (not bread)</option>
              <option value="no">Count as bread: skip</option>
            </select>
          </label>
          <label>
            Weeknight cooking
            <select value={s.weeknightMax} onChange={(e) => save({ weeknightMax: Number(e.target.value) })}>
              {[20, 30, 45, 60, 90].map((n) => <option key={n} value={n}>{n} min or less</option>)}
            </select>
          </label>
          <label>
            Cook nights a week
            <select value={s.cookNights} onChange={(e) => save({ cookNights: Number(e.target.value) })}>
              {[2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} (order {7 - n})</option>)}
            </select>
          </label>
        </div>
        <div>
          <p className="os-label">Cuisines</p>
          <div className="os-seg">
            {data.cuisines.map((c) => (
              <button key={c} type="button" className={all || s.cuisines.includes(c) ? "on" : ""} onClick={() => toggleCuisine(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AddMeal({ data, reload }: { data: FoodOverview; reload: () => void }) {
  const [f, setF] = useState({ name: "", cuisine: "Nigerian", mins: 30, mode: "both", ingredients: "", link: "", slots: ["lunch", "dinner"] as Slot[] });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    try {
      const r = await os.post("/food/meals", f);
      setWarning(r.data.warning || "");
      setF({ ...f, name: "", ingredients: "", link: "" });
      reload();
    } catch (err) {
      setError(errorText(err, "Couldn't add it."));
    }
  };
  return (
    <Card title="Add your own" sub="A family recipe or a go-to order. It joins the ideas and the week plan.">
      <form className="os-form" onSubmit={submit}>
        <div className="os-grid4">
          <label style={{ gridColumn: "span 2" }}>Meal<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="e.g. Mum's ofe owerri" /></label>
          <label>
            Cuisine
            <select value={f.cuisine} onChange={(e) => setF({ ...f, cuisine: e.target.value })}>
              {[...data.cuisines, "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Cook or order
            <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
              <option value="both">Either</option>
              <option value="cook">Cook</option>
              <option value="order">Order</option>
            </select>
          </label>
          <label>Minutes to cook<input type="number" min={5} value={f.mins} onChange={(e) => setF({ ...f, mins: Number(e.target.value) })} /></label>
          <label style={{ gridColumn: "span 2" }}>Ingredients (comma-separated, for the grocery list)<input value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} placeholder="goat meat, uziza, cocoyam, palm oil" /></label>
          <label>Recipe link (optional)<input type="url" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} /></label>
        </div>
        <div className="os-seg">
          {(["breakfast", "lunch", "dinner"] as Slot[]).map((s) => (
            <button key={s} type="button" className={f.slots.includes(s) ? "on" : ""} onClick={() => setF({ ...f, slots: f.slots.includes(s) ? f.slots.filter((x) => x !== s) : [...f.slots, s] })}>{SLOT_NAME[s]}</button>
          ))}
        </div>
        {error && <ErrorNote text={error} />}
        {warning && <div className="os-error">{warning}</div>}
        <div className="os-actions"><button className="os-btn os-btn--primary">Add meal</button></div>
      </form>
    </Card>
  );
}

/** Every meal by cuisine: like (shows more), hide, add your own; and the settings. */
export default function MealsTab({ data, reload, vote }: { data: FoodOverview; reload: () => void; vote: (key: string, v: "like" | "dislike" | "none") => void }) {
  const likes = new Set(data.settings.likes);
  const hidden = new Set(data.settings.dislikes);
  const byCuisine = [...new Set(data.meals.map((m) => m.cuisine))];
  return (
    <div className="os-page">
      <Settings data={data} reload={reload} />
      <AddMeal data={data} reload={reload} />
      {byCuisine.map((c) => (
        <Card key={c} title={c}>
          <table className="os-table os-table--wide">
            <tbody>
              {data.meals
                .filter((m) => m.cuisine === c)
                .map((m) => (
                  <tr key={m.key} className={hidden.has(m.key) ? "os-muted" : ""}>
                    <td>
                      <strong>{m.name}</strong>
                      <div className="os-small os-muted">{m.slots.map((s) => SLOT_NAME[s]).join(", ")} · {m.mode === "order" ? "order" : `${m.mins} min`}{m.batch ? " · makes leftovers" : ""}</div>
                    </td>
                    <td className="os-num">
                      <span className="os-row os-small" style={{ justifyContent: "flex-end" }}>
                        <Pics q={m.search} label="ideas" />
                        {hidden.has(m.key) ? (
                          <button className="os-link" onClick={() => vote(m.key, "none")}>Show again</button>
                        ) : (
                          <>
                            <button className={`os-link${likes.has(m.key) ? " os-on" : ""}`} onClick={() => vote(m.key, likes.has(m.key) ? "none" : "like")}>{likes.has(m.key) ? "Liked" : "Like"}</button>
                            <button className="os-link" onClick={() => vote(m.key, "dislike")}>Hide</button>
                          </>
                        )}
                        {m.custom && (
                          <button
                            className="os-link"
                            onClick={async () => {
                              if (!window.confirm(`Remove ${m.name}?`)) return;
                              await os.delete(`/food/meals/${m.key.slice(2)}`);
                              reload();
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
