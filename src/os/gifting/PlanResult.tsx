import { Card } from "../Bits";
import type { GroupResult, HamperOption, HamperResult } from "./types";
import { ideasLink, usd } from "./util";

/** A group plan: totals, packages per group, the shopping list by store, packaging and cautions. */
export function GroupPlanView({ r }: { r: GroupResult }) {
  if (!r.people) return <p className="os-muted">Add how many people you're giving to.</p>;
  // One heading per store ("Walmart"), with the brand beside the item.
  const storeOf = (s: string) => s.replace(/ \(.*\)$/, "");
  const brandOf = (s: string) => (s.match(/\((.*)\)$/) || [])[1];
  const stores = [...new Set(r.shopping.map((s) => storeOf(s.store)))];
  return (
    <div className="os-page">
      <div className="os-stats">
        <div><span>People</span><strong>{r.people}</strong></div>
        <div><span>Total</span><strong>{usd(r.totals.total)}</strong><small>of {usd(r.totals.budget)}</small></div>
        <div className={r.over ? "bad" : "good"}><span>{r.over ? "Over by" : "Left"}</span><strong>{usd(Math.abs(r.totals.left))}</strong></div>
        <div><span>Per person</span><strong>{usd(r.perPerson)}</strong></div>
        <div className={r.weight.fits ? "" : "bad"}><span>Weight</span><strong>{r.weight.lb} lb</strong><small>of {r.weight.capacityLb} lb</small></div>
      </div>
      {r.over && <div className="os-error">Even the simplest packages come to {usd(r.totals.total)}. Raise the budget to about {usd(Math.ceil(r.totals.total / 5) * 5)} or give to fewer people.</div>}
      {r.steps.length > 0 && !r.over && (
        <details className="os-steps">
          <summary>Trimmed to fit your budget. Raise it for fuller packages. What changed</summary>
          <ul>
            {r.steps.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="os-grid2">
        {r.packages.map((p) => (
          <Card key={p.group} title={`${p.groupName} · ${p.count}`} sub={`${p.name} · target ${p.target} · ${usd(p.perPerson)} each`}>
            <ul>
              {p.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <a className="os-small" href={ideasLink(`${p.name} gift bag ideas`)} target="_blank" rel="noreferrer">
              See picture ideas
            </a>
          </Card>
        ))}
      </div>

      <Card title="Shopping list" sub="Multipacks split into single gifts. Prices are planning estimates; check before buying.">
        {stores.map((store) => (
          <div key={store} className="os-shopgroup">
            <h4>{store}</h4>
            <table className="os-table os-table--wide">
              <tbody>
                {r.shopping
                  .filter((s) => storeOf(s.store) === store)
                  .map((s) => (
                    <tr key={s.key}>
                      <td>
                        {s.name}
                        {brandOf(s.store) && <span className="os-muted"> · {brandOf(s.store)}</span>}
                        {s.caution && <div className="os-small os-muted">{s.caution}</div>}
                      </td>
                      <td className="os-num">{s.qty} needed</td>
                      <td className="os-num">{s.packs} × {s.packCount}-pack at {usd(s.packPrice)}</td>
                      <td className="os-num"><strong>{usd(s.cost)}</strong></td>
                      <td className="os-num os-muted">{s.spare ? `${s.spare} spare` : ""}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
        <table className="os-table os-table--wide os-totals">
          <tbody>
            <tr><td>Items</td><td className="os-num">{usd(r.totals.items)}</td></tr>
            <tr><td>Packaging (bags, tissue, ribbon, tags)</td><td className="os-num">{usd(r.totals.packaging)}</td></tr>
            <tr><td>Sales tax allowance</td><td className="os-num">{usd(r.totals.tax)}</td></tr>
            <tr><td><strong>Total</strong></td><td className="os-num"><strong>{usd(r.totals.total)}</strong></td></tr>
          </tbody>
        </table>
      </Card>

      <div className="os-grid2">
        <Card title="Packaging">
          <p>{r.packaging.theme}</p>
          <p className="os-small">Card note: <em>"{r.packaging.note}"</em></p>
          <p className="os-small os-muted">Assembly line: fold all the shirts, sort by person and size, pair socks with clothing, add the extras, bag them, tag with names.</p>
          <a className="os-small" href={ideasLink("kraft paper gift bag black ribbon")} target="_blank" rel="noreferrer">See packaging ideas</a>
        </Card>
        <Card title="Before you fly">
          <ul>
            {r.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function HamperCard({ h, best }: { h: HamperOption; best?: boolean }) {
  return (
    <Card title={h.name} sub={`${usd(h.total)} with tax · ${h.left >= 0 ? `${usd(h.left)} left` : `${usd(-h.left)} over`}`} accent={best ? "#db2777" : undefined}>
      <table className="os-table os-table--wide">
        <tbody>
          <tr><td>{h.container.name}</td><td className="os-num">{usd(h.container.price)}</td></tr>
          {h.items.map((i) => (
            <tr key={i.name}><td>{i.name}</td><td className="os-num">{usd(i.price)}</td></tr>
          ))}
          <tr><td>{h.card.name}</td><td className="os-num">{usd(h.card.price)}</td></tr>
        </tbody>
      </table>
      {h.skipped.length > 0 && <p className="os-small os-muted">With more budget: {h.skipped.join(", ")}.</p>}
      <a className="os-small" href={ideasLink(`${h.name} gift basket`)} target="_blank" rel="noreferrer">
        See picture ideas
      </a>
    </Card>
  );
}

/** One person's hamper: the best fit, tips, and the alternatives. */
export function HamperView({ r }: { r: HamperResult }) {
  return (
    <div className="os-page">
      <HamperCard h={r.best} best />
      <Card title="Make it theirs">
        <ul>
          {r.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>
      {r.alternatives.length > 0 && (
        <>
          <h3 className="os-group__title">Other hampers that fit</h3>
          <div className="os-grid2">
            {r.alternatives.map((a) => (
              <HamperCard key={a.key} h={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
