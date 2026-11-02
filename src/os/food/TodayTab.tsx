import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { Pics } from "../Pics";
import MealCard from "./MealCard";
import type { FoodOverview, Ideas, Meal, Mode, Slot } from "./types";
import { SLOT_NAME } from "./types";

const MODE_NAME: Record<Mode, string> = { cook: "Cook at home", order: "Order in" };

/** Today: for each meal, pick from three ideas to cook or to order. Once picked, it shows as today's meal with Change and Undo. */
export default function TodayTab({ data, reload, vote }: { data: FoodOverview; reload: () => void; vote: (key: string, v: "like" | "dislike" | "none") => void }) {
  const [ideas, setIdeas] = useState<Ideas>(data.ideas);
  const [seed, setSeed] = useState(0);
  const tonight = data.plans.current?.days.find((d) => d.date === data.date);
  const [modes, setModes] = useState<Record<Slot, Mode>>({ breakfast: "cook", lunch: "cook", dinner: tonight?.mode || "cook" });
  const [changing, setChanging] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const todays = data.recent.filter((r) => r.date === data.date);
  const likes = new Set(data.settings.likes);
  const byKey = new Map(data.meals.map((m) => [m.key, m]));

  const shuffle = async () => {
    try {
      const r = await os.post("/food/suggest", { seed: seed + 1 });
      setSeed(seed + 1);
      setIdeas(r.data.ideas);
    } catch (err) {
      setError(errorText(err, "Couldn't get new ideas."));
    }
  };
  const choose = async (slot: Slot, key: string, mode: Mode) => {
    await os.post("/food/ate", { slot, key, mode });
    setChanging({ ...changing, [slot]: false });
    reload();
  };
  const undo = async (id: string) => {
    await os.delete(`/food/ate/${id}`);
    reload();
  };

  return (
    <div className="os-page">
      <Card
        title="What are we eating today?"
        sub={`Three ideas for each meal: cook at home or order in. No bread, little to no sugar${data.settings.noShellfish ? ", no shellfish" : ""}. Pick one and tomorrow's ideas move on.`}
        right={<button className="os-btn" onClick={shuffle}><FiRefreshCw /> Different ideas</button>}
      />
      {error && <ErrorNote text={error} />}
      {(["breakfast", "lunch", "dinner"] as Slot[]).map((slot) => {
        const had = todays.find((t) => t.slot === slot);
        const meal: Meal | undefined = had ? byKey.get(had.key) : undefined;
        const mode = modes[slot];
        const planned = slot === "dinner" ? ideas.planned : null;
        const list = ideas.slots[slot][mode].filter((m) => m.key !== planned?.key);
        const showIdeas = !had || changing[slot];

        return (
          <Card
            key={slot}
            title={had ? `Today's ${SLOT_NAME[slot].toLowerCase()}: ${had.name}` : `${SLOT_NAME[slot]} ideas`}
            sub={
              had
                ? `${had.mode === "order" ? "Ordering in" : "Cooking at home"}${meal?.desc ? ` · ${meal.desc}` : ""}`
                : slot === "lunch" && ideas.leftovers
                  ? `Easiest: leftovers from last night's ${ideas.leftovers.name}.`
                  : undefined
            }
            right={
              had ? (
                <span className="os-row">
                  <button className="os-btn" onClick={() => setChanging({ ...changing, [slot]: !changing[slot] })}>{changing[slot] ? "Keep it" : "Change"}</button>
                  <button className="os-btn os-btn--ghost" onClick={() => undo(had._id)}>Undo</button>
                </span>
              ) : (
                <div className="os-seg">
                  {(["cook", "order"] as Mode[]).map((m) => (
                    <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => setModes({ ...modes, [slot]: m })}>{MODE_NAME[m]}</button>
                  ))}
                </div>
              )
            }
          >
            {had && meal && !changing[slot] && (
              <span className="os-row os-small">
                {had.mode === "order" ? <a href={meal.orderUrl} target="_blank" rel="noreferrer">Order nearby</a> : <Pics q={meal.search} label="recipe ideas" />}
              </span>
            )}
            {showIdeas && (
              <>
                {had && (
                  <div className="os-seg" style={{ marginBottom: 10 }}>
                    {(["cook", "order"] as Mode[]).map((m) => (
                      <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => setModes({ ...modes, [slot]: m })}>{MODE_NAME[m]}</button>
                    ))}
                  </div>
                )}
                {mode === "order" && data.settings.noShellfish && (
                  <p className="os-small os-allergy">Ordering: tell them about the shellfish allergy. Nigerian soups often have crayfish or periwinkle; Thai curries often have shrimp paste.</p>
                )}
                {planned && (
                  <div className="os-planned">
                    <span className="os-kicker">From your meal plan{planned.mode === "order" ? " (order night)" : ""}</span>
                    <MealCard meal={planned} mode={planned.mode} chosen={had?.key === planned.key} liked={likes.has(planned.key)} onChoose={() => choose("dinner", planned.key, planned.mode)} onVote={(v) => vote(planned.key, v)} />
                  </div>
                )}
                <div className="os-grid3">
                  {list.map((m) => (
                    <MealCard key={m.key} meal={m} mode={mode} chosen={had?.key === m.key} liked={likes.has(m.key)} onChoose={() => choose(slot, m.key, mode)} onVote={(v) => vote(m.key, v)} />
                  ))}
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
