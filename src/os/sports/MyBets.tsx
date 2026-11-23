import os from "../api";
import { Card, ErrorNote, Loading } from "../Bits";
import { useLoad } from "../useLoad";
import { money, odds, pct } from "./format";
import type { Bet, BetsView } from "./types";

const STATUS = {
  pending: ["Open", "os-tag"],
  won: ["Won", "os-tag os-tag--ok"],
  lost: ["Lost", "os-tag os-tag--warn"],
  push: ["Push", "os-tag"],
} as const;

function BetRow({ b, reload }: { b: Bet; reload: () => void }) {
  const [label, cls] = STATUS[b.status];
  const settle = async (result: "won" | "lost" | "push") => {
    await os.patch(`/sports/bets/${b._id}`, { result });
    reload();
  };
  return (
    <li className="os-sp-bet">
      <div className="os-sp-bet__main">
        <div>
          <div className="os-row" style={{ gap: 8 }}>
            <span className={cls}>{label}</span>
            <strong>
              {b.kind === "parlay"
                ? `${b.legs.length}-leg parlay`
                : b.legs[0]?.label}
            </strong>
            <span className="os-muted">{odds(b.odds)}</span>
          </div>
          {b.kind === "parlay" && (
            <ul className="os-sp-bet__legs">
              {b.legs.map((l) => (
                <li
                  key={`${l.eventId}:${l.market}:${l.side}`}
                  className={
                    l.result && l.result !== "pending" ? `res-${l.result}` : ""
                  }
                >
                  {l.label}{" "}
                  <span className="os-muted">
                    ({odds(l.odds)}) · {l.matchup}
                  </span>
                  {l.result && l.result !== "pending" && (
                    <span className="os-small"> · {l.result}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <span className="os-small os-muted">
            {b.kind === "parlay" ? "" : `${b.legs[0]?.matchup} · `}placed{" "}
            {new Date(b.placedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="os-sp-bet__nums">
          <span>
            {money(b.stake)} to win{" "}
            {money(
              Math.round(
                b.stake *
                  ((b.odds > 0 ? 1 + b.odds / 100 : 1 + 100 / -b.odds) - 1) *
                  100,
              ) / 100,
            )}
          </span>
          {b.status !== "pending" && (
            <strong
              className={b.profit > 0 ? "os-ok" : b.profit < 0 ? "os-bad" : ""}
            >
              {b.profit > 0 ? "+" : ""}
              {money(b.profit)}
            </strong>
          )}
        </div>
      </div>
      <div className="os-row">
        {b.status === "pending" && (
          <>
            <span className="os-small os-muted">
              {b.kind === "future"
                ? "Settle it when the season's decided:"
                : "Settles itself after the game; or by hand:"}
            </span>
            <button
              className="os-btn os-btn--small"
              onClick={() => settle("won")}
            >
              Won
            </button>
            <button
              className="os-btn os-btn--small"
              onClick={() => settle("lost")}
            >
              Lost
            </button>
            <button
              className="os-btn os-btn--small os-btn--ghost"
              onClick={() => settle("push")}
            >
              Push
            </button>
          </>
        )}
        <button
          className="os-link os-link--muted"
          onClick={async () => {
            if (window.confirm("Delete this bet from your record?")) {
              await os.delete(`/sports/bets/${b._id}`);
              reload();
            }
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

/** The bets you placed: open ones (settled from final scores), and your record. */
export default function MyBets() {
  const { data, error, reload } = useLoad<BetsView>(() =>
    os.get("/sports/bets").then((r) => r.data),
  );
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const r = data.record;
  const open = data.bets.filter((b) => b.status === "pending");
  const done = data.bets.filter((b) => b.status !== "pending");
  return (
    <div className="os-page">
      <div className="os-stats">
        <div>
          <span>Record</span>
          <strong>
            {r.all.won}-{r.all.lost}
            {r.all.push ? `-${r.all.push}` : ""}
          </strong>
          <small>{r.pending} open</small>
        </div>
        <div className={r.all.profit >= 0 ? "good" : "bad"}>
          <span>Profit</span>
          <strong>{money(r.all.profit)}</strong>
          <small>on {money(r.all.staked)} staked</small>
        </div>
        <div
          className={
            r.all.roi !== null ? (r.all.roi >= 0 ? "good" : "bad") : ""
          }
        >
          <span>Return</span>
          <strong>
            {r.all.roi === null ? "–" : `${(r.all.roi * 100).toFixed(1)}%`}
          </strong>
          <small>per dollar bet</small>
        </div>
        <div>
          <span>Straight / parlay</span>
          <strong>
            {r.byKind.straight.won}-{r.byKind.straight.lost} ·{" "}
            {r.byKind.parlay.won}-{r.byKind.parlay.lost}
          </strong>
          <small>
            {money(r.byKind.straight.profit)} · {money(r.byKind.parlay.profit)}
          </small>
        </div>
        <div>
          <span>This week</span>
          <strong>{money(data.stakedThisWeek)}</strong>
          <small>staked</small>
        </div>
      </div>
      <Card
        title="By bet type"
        sub="Where your money actually comes from. A 52.4% hit rate breaks even at -110."
      >
        <table className="os-table os-table--wide">
          <thead>
            <tr>
              <th>Type</th>
              <th className="os-num">Record</th>
              <th className="os-num">Hit rate</th>
              <th className="os-num">Profit</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["Spreads", r.byMarket.spread],
                ["Totals", r.byMarket.total],
                ["Moneylines", r.byMarket.moneyline],
                ["Parlays", r.byKind.parlay],
                ["Futures", r.byKind.future],
              ] as const
            ).map(([name, g]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className="os-num">
                  {g.won}-{g.lost}
                  {g.push ? `-${g.push}` : ""}
                </td>
                <td className="os-num">
                  {g.won + g.lost ? pct(g.won / (g.won + g.lost)) : "–"}
                </td>
                <td
                  className={`os-num ${g.profit > 0 ? "os-ok" : g.profit < 0 ? "os-bad" : ""}`}
                >
                  {money(g.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title={`Open (${open.length})`}>
        {open.length === 0 ? (
          <p className="os-muted os-flat">
            No open bets. Add picks to the slip on the Bets tab after you place
            them.
          </p>
        ) : (
          <ul className="os-sp-bets">
            {open.map((b) => (
              <BetRow key={b._id} b={b} reload={reload} />
            ))}
          </ul>
        )}
      </Card>
      {done.length > 0 && (
        <Card title={`Settled (${done.length})`}>
          <ul className="os-sp-bets">
            {done.slice(0, 60).map((b) => (
              <BetRow key={b._id} b={b} reload={reload} />
            ))}
          </ul>
        </Card>
      )}
      <p className="os-small os-muted">{data.disclaimer}</p>
    </div>
  );
}
