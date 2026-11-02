import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import MealCard from "./MealCard";
import type { FoodOverview, Ideas, Mode, Slot } from "./types";
import { SLOT_NAME } from "./types";

/** Today: for each meal, three to cook or three to order. Tap the one you're having. */
export default function TodayTab({ data, reload, vote }: { data: FoodOverview; reload: () => void; vote: (key: string, v: "like" | "dislike" | "none") => void }) {
  const [ideas, setIdeas] = useState<Ideas>(data.ideas);
  const [seed, setSeed] = useState(0);
  const tonight = data.plans.current?.days.find((d) => d.date === data.date);
  const [modes, setModes] = useState<Record<Slot, Mode>>({ breakfast: "cook", lunch: "cook", dinner: tonight?.mode || "cook" });
  const [error, setError] = useState("");
  const todays = data.recent.filter((r) => r.date === data.date);
  const likes = new Set(data.settings.likes);

  const shuffle = async () => {
    try {
      const r = await os.post("/food/suggest", { seed: seed + 1 });
      setSeed(seed + 1);
      setIdeas(r.data.ideas);
    } catch (err) {
      setError(errorText(err, "Couldn't shuffle."));
    }
  };
  const choose = async (slot: Slot, key: string, mode: Mode) => {
    await os.post("/food/ate", { slot, key, mode });
    reload();
  };

  return (
    <div className="os-page">
      <div className="os-row" style={{ justifyContent: "space-between" }}>
        <p className="os-small os-muted os-flat">No bread, little to no sugar. Pick one for each meal so tomorrow's ideas rotate.</p>
        <button className="os-btn" onClick={shuffle}><FiRefreshCw /> New ideas</button>
      </div>
      {error && <ErrorNote text={error} />}
      {(["breakfast", "lunch", "dinner"] as Slot[]).map((slot) => {
        const had = todays.find((t) => t.slot === slot);
        const mode = modes[slot];
        const planned = slot === "dinner" ? ideas.planned : null;
        const list = ideas.slots[slot][mode].filter((m) => m.key !== planned?.key);
        return (
          <Card
            key={slot}
            title={SLOT_NAME[slot]}
            sub={had ? `Having: ${had.name}${had.mode === "order" ? " (ordered)" : ""}` : slot === "lunch" && ideas.leftovers ? `Easiest: leftovers from last night's ${ideas.leftovers.name}` : undefined}
            right={
              <div className="os-seg">
                {(["cook", "order"] as Mode[]).map((m) => (
                  <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => setModes({ ...modes, [slot]: m })}>{m === "cook" ? "Cook" : "Order"}</button>
                ))}
              </div>
            }
          >
            {planned && (
              <div className="os-planned">
                <span className="os-kicker">On this week's plan{planned.mode === "order" ? " (order night)" : ""}</span>
                <MealCard meal={planned} mode={planned.mode} chosen={had?.key === planned.key} liked={likes.has(planned.key)} onChoose={() => choose("dinner", planned.key, planned.mode)} onVote={(v) => vote(planned.key, v)} />
              </div>
            )}
            <div className="os-grid3">
              {list.map((meal) => (
                <MealCard key={meal.key} meal={meal} mode={mode} chosen={had?.key === meal.key} liked={likes.has(meal.key)} onChoose={() => choose(slot, meal.key, mode)} onVote={(v) => vote(meal.key, v)} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
