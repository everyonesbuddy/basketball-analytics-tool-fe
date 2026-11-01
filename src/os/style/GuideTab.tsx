import { Card } from "../Bits";
import { Pics } from "../Pics";
import type { Guide, StructureKey } from "./types";
import { SLOT_LABEL } from "./types";
import { Swatch } from "./OutfitTab";

/** The style guide as a page: structures, silhouette, occasions, tonal families and example looks. */
export default function GuideTab({ guide }: { guide: Guide }) {
  const structures = Object.entries(guide.structures) as [StructureKey, Guide["structures"][StructureKey]][];
  return (
    <div className="os-page">
      <div className="os-grid3">
        {structures.map(([k, s]) => (
          <Card key={k} title={s.name} sub={s.short}>
            <p className="os-small os-flat">{s.why}</p>
          </Card>
        ))}
      </div>
      <div className="os-grid2">
        <Card title="Silhouette" sub="The line matters more than the label.">
          <ul>
            {guide.silhouette.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="os-small os-muted os-flat">{guide.tallNote}</p>
        </Card>
        <Card title="By occasion">
          <table className="os-table os-table--wide">
            <tbody>
              {Object.entries(guide.occasions).map(([k, o]) => (
                <tr key={k}>
                  <td><strong>{o.name}</strong></td>
                  <td>{o.structures.map((s) => guide.structures[s].name).join(", ")}</td>
                  <td className="os-muted">{o.shoe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Card title="Tonal families" sub="Shades of one family, head to toe.">
        <div className="os-grid4">
          {Object.entries(guide.tonal).map(([k, t]) => (
            <div key={k} className="os-service">
              <strong>{t.name}</strong>
              <span>
                {t.colors.map((c) => (
                  <Swatch key={c} hex={guide.colors[c].hex} title={guide.colors[c].name} />
                ))}
              </span>
              <span className="os-small os-muted">{t.colors.map((c) => guide.colors[c].name).join(", ")}</span>
              <Pics q={t.search} />
            </div>
          ))}
        </div>
      </Card>
      <Card title="Example looks">
        <div className="os-grid3">
          {guide.looks.map((l) => (
            <div key={l.key} className="os-service">
              <strong>{l.name || (l.structure === "monochrome" && l.family ? guide.tonal[l.family].name : l.pieces.filter(([s]) => s !== "shoe").map(([, , d]) => d).join(", "))}</strong>
              <span className="os-small os-muted">{guide.structures[l.structure].name} · {l.occasions.map((o) => guide.occasions[o].name).join(", ")}</span>
              <ul className="os-outfit os-outfit--tight">
                {l.pieces.map(([slot, color, desc]) => (
                  <li key={slot}>
                    <Swatch hex={guide.colors[color].hex} title={guide.colors[color].name} />
                    <span className="os-outfit__slot">{SLOT_LABEL[slot]}</span>
                    <span className="os-outfit__what">{desc}</span>
                  </li>
                ))}
              </ul>
              <Pics q={l.search} label="See the look" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
