import { useState } from "react";
import type { FormEvent } from "react";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import type { Slot, StyleOverview, WardrobeItem } from "./types";
import { SLOTS, SLOT_LABEL } from "./types";
import { Swatch } from "./OutfitTab";

export function ColorPicker({ colors, value, onChange }: { colors: StyleOverview["guide"]["colors"]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="os-colorpick">
      {Object.entries(colors).map(([k, c]) => (
        <button key={k} type="button" className={value === k ? "on" : ""} onClick={() => onChange(k)} title={c.name}>
          <Swatch hex={c.hex} /> {c.name}
        </button>
      ))}
    </div>
  );
}

/** What you own: a quick list by slot and color, so outfits use your actual pieces. */
export default function WardrobeTab({ data, onChanged }: { data: StyleOverview; onChanged: () => void }) {
  const [slot, setSlot] = useState<Slot>("top");
  const [color, setColor] = useState("black");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const colors = data.guide.colors;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await os.post("/style/wardrobe", { slot, color, name: name.trim() });
      setName("");
      onChanged();
    } catch (err) {
      setError(errorText(err, "Couldn't add that."));
    }
  };
  const patch = async (i: WardrobeItem, body: Partial<WardrobeItem>) => {
    await os.patch(`/style/wardrobe/${i._id}`, body);
    onChanged();
  };

  return (
    <div className="os-page">
      <Card title="Add a piece" sub="Slot and color are all the outfit needs; the name is for you.">
        <form className="os-form" onSubmit={add}>
          <div className="os-seg">
            {SLOTS.map((s) => (
              <button key={s} type="button" className={slot === s ? "on" : ""} onClick={() => setSlot(s)}>{SLOT_LABEL[s]}</button>
            ))}
          </div>
          <ColorPicker colors={colors} value={color} onChange={setColor} />
          <div className="os-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. ${colors[color].name} ${slot === "top" ? "heavyweight tee" : slot === "bottom" ? "straight jeans" : slot === "layer" ? "overshirt" : "minimal sneakers"}`} maxLength={160} style={{ maxWidth: 360 }} />
            <button className="os-btn os-btn--primary" type="submit">Add</button>
          </div>
          {error && <ErrorNote text={error} />}
        </form>
      </Card>
      {data.wardrobe.length === 0 && <p className="os-muted">Nothing here yet. Add pieces above, or tick "I have it" on the Shopping tab's core list.</p>}
      <div className="os-grid4">
        {SLOTS.map((s) => {
          const items = data.wardrobe.filter((w) => w.slot === s);
          return (
            <Card key={s} title={`${SLOT_LABEL[s]} · ${items.filter((i) => i.active).length}`}>
              {items.length === 0 ? (
                <p className="os-small os-muted os-flat">None yet.</p>
              ) : (
                <ul className="os-outfit">
                  {items.map((i) => (
                    <li key={i._id} className={i.active ? "" : "os-muted"}>
                      <Swatch hex={colors[i.color]?.hex || "#999"} title={colors[i.color]?.name} />
                      <span className="os-outfit__what">
                        {i.link ? <a href={i.link} target="_blank" rel="noreferrer">{i.name}</a> : i.name}
                        {!i.active && " (put away)"}
                        <span className="os-row os-small">
                          <button className="os-link" onClick={() => patch(i, { active: !i.active })}>{i.active ? "Put away" : "Bring back"}</button>
                          <button
                            className="os-link"
                            onClick={async () => {
                              if (!window.confirm(`Remove ${i.name}?`)) return;
                              await os.delete(`/style/wardrobe/${i._id}`);
                              onChanged();
                            }}
                          >
                            Remove
                          </button>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
