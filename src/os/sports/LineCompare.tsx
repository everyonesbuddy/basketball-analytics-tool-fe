import type { Explain, Game, Leg, PropExplain } from "./types";

const spread = (abbr: string, x: number | null) =>
  x === null ? "–" : `${abbr} ${x > 0 ? `+${x}` : x === 0 ? "PK" : x}`;
const pct = (p: number | null) => (p === null ? "–" : `${Math.round(p * 100)}%`);

/**
 * Our line next to the book's, with the middle line we actually bet from,
 * and a fold with how we got ours and why the two differ.
 */
export function GameLines({ g, open = false }: { g: Game; open?: boolean }) {
  const e: Explain | undefined = g.explain;
  if (!e) return null;
  const H = g.home.abbr;
  return (
    <div className="os-sp-compare">
      <table className="os-sp-compare__table">
        <thead>
          <tr>
            <th />
            <th>Ours</th>
            <th title="Our chance blended half and half with the book's: the line our picks are made from">
              Middle
            </th>
            <th>Book</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Spread</td>
            <td>
              <strong>{spread(H, e.ours.spread)}</strong>
            </td>
            <td>{spread(H, e.middle.spread)}</td>
            <td>{spread(H, e.book.spread)}</td>
          </tr>
          <tr>
            <td>Total</td>
            <td>
              <strong>{e.ours.total}</strong>
            </td>
            <td>{e.middle.total ?? "–"}</td>
            <td>{e.book.total ?? "–"}</td>
          </tr>
          <tr>
            <td>{H} wins</td>
            <td>
              <strong>{pct(e.ours.homeWin)}</strong>
            </td>
            <td>{pct(e.middle.homeWin)}</td>
            <td>{pct(e.book.homeWin)}</td>
          </tr>
        </tbody>
      </table>
      <details className="os-sp-why" open={open}>
        <summary>How we got our line, and why the book's is different</summary>
        <p className="os-sp-why__h">How we got ours</p>
        <ul>
          {e.how.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="os-sp-why__h">Ours vs the book</p>
        <ul>
          {e.why.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** One line for an idea tile: our number vs the book's, with the fold. */
export function LegLines({ l, game }: { l: Leg; game?: Game }) {
  if (l.market === "prop" && l.explain) return <PropLines e={l.explain} />;
  const e = game?.explain;
  if (!e || !game) return null;
  const H = game.home.abbr;
  const ours =
    l.market === "spread"
      ? spread(H, e.ours.spread)
      : l.market === "total"
        ? String(e.ours.total)
        : `${H} ${pct(e.ours.homeWin)}`;
  const book =
    l.market === "spread"
      ? spread(H, e.book.spread)
      : l.market === "total"
        ? String(e.book.total ?? "–")
        : `${H} ${pct(e.book.homeWin)}`;
  return (
    <details className="os-sp-why">
      <summary>
        Our line <strong>{ours}</strong> · book {book}
      </summary>
      <ul>
        {[...e.how, ...e.why].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </details>
  );
}

function PropLines({ e }: { e: PropExplain }) {
  return (
    <details className="os-sp-why">
      <summary>
        Our line <strong>{e.ours}</strong> · book {e.book} · middle {e.middle}
      </summary>
      <ul>
        {[...e.how, ...e.why].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </details>
  );
}
