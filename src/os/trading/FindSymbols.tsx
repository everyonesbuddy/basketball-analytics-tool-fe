import { useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { money, pctOf, signed } from "./format";
import type { FindView, TradingView } from "./types";

/**
 * Symbols worth adding: cheaper, liquid stocks with options you can afford,
 * and more coins, ranked by how our setups did on each over two years.
 */
export default function FindSymbols({
  view,
  onAdded,
}: {
  view: TradingView;
  onAdded: () => void;
}) {
  const s = view.settings;
  const [kind, setKind] = useState<"stock" | "crypto">("stock");
  const [maxPrice, setMaxPrice] = useState("40");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<FindView | null>(null);
  const [onlyBudget, setOnlyBudget] = useState(true);

  const look = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await os.get(
        `/trading/discover?kind=${kind}&maxPrice=${Number(maxPrice) || 40}`,
      );
      setRes(r.data);
    } catch (err) {
      setError(errorText(err, "Couldn't look right now."));
    } finally {
      setBusy(false);
    }
  };

  const add = async (symbol: string) => {
    const body =
      kind === "crypto"
        ? { crypto: [...s.crypto, symbol] }
        : { stocks: [...s.stocks, symbol] };
    try {
      await os.patch("/trading/settings", body);
      setRes((r) =>
        r
          ? {
              ...r,
              rows: r.rows.map((x) =>
                x.symbol === symbol ? { ...x, onList: true } : x,
              ),
            }
          : r,
      );
      onAdded();
    } catch (err) {
      setError(errorText(err, "Couldn't add it."));
    }
  };

  const rows =
    res?.rows.filter(
      (r) =>
        !(res.kind === "stock" && onlyBudget && res.maxContract && r.fitsBudget === false),
    ) || [];

  return (
    <div className="os-page">
      <Card
        title="Find symbols that fit"
        sub="Looks at today's most active stocks plus a list of liquid names (or 20 big coins), and ranks them by how our setups did on each over the last two years."
      >
        <div className="os-row" style={{ gap: 10, flexWrap: "wrap" }}>
          <div className="os-seg" role="tablist" aria-label="Kind">
            <button
              className={kind === "stock" ? "on" : ""}
              onClick={() => {
                setKind("stock");
                setRes(null);
              }}
            >
              Stocks
            </button>
            <button
              className={kind === "crypto" ? "on" : ""}
              onClick={() => {
                setKind("crypto");
                setRes(null);
              }}
            >
              Crypto
            </button>
          </div>
          {kind === "stock" && (
            <label className="os-small os-tr-findprice">
              Share price up to
              <span className="os-prefix">
                <span>$</span>
                <input
                  type="number"
                  min={1}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </span>
            </label>
          )}
          <button className="os-btn" onClick={look} disabled={busy}>
            <FiSearch /> {busy ? "Looking… (up to a minute)" : "Look"}
          </button>
        </div>
        {kind === "stock" && (
          <p className="os-small os-muted os-flat" style={{ marginTop: 8 }}>
            Cheaper stocks mean cheaper contracts. An at-the-money call on a
            $15 stock is often $100–200, and on a $150 stock it's $1,000+.
            {s.maxContract
              ? ` Your max is $${s.maxContract} a contract.`
              : " Set a max per contract in Settings to filter by it."}
          </p>
        )}
        {kind === "crypto" && (
          <p className="os-small os-muted os-flat" style={{ marginTop: 8 }}>
            Coins can be bought in fractions, so any coin fits any budget. What
            matters is how well the setups have worked on it.
          </p>
        )}
      </Card>

      {error && <ErrorNote text={error} />}

      {res && (
        <Card
          title={`${rows.length} ${res.kind === "crypto" ? "coins" : "stocks"}`}
          sub={res.note}
        >
          {res.kind === "stock" && res.maxContract ? (
            <label className="os-check" style={{ marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={onlyBudget}
                onChange={(e) => setOnlyBudget(e.target.checked)}
              />{" "}
              Only ones with an at-the-money contract under ${res.maxContract}
            </label>
          ) : null}
          {rows.length === 0 ? (
            <p className="os-muted os-flat">
              Nothing fits.{" "}
              {res.kind === "stock"
                ? "Try a higher share price, or untick the budget filter."
                : ""}
            </p>
          ) : (
            <div className="os-tr-tablewrap os-tr-findwrap">
              <table className="os-table os-table--wide">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    {res.kind === "stock" && (
                      <th className="os-num">ATM call</th>
                    )}
                    <th className="os-num">Past fit</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol}>
                      <td>
                        <strong>{r.symbol.replace("-USD", "")}</strong>
                        <div className="os-small os-muted">
                          {money(r.price)}
                        </div>
                      </td>
                      {res.kind === "stock" && (
                        <td
                          className={`os-num ${r.fitsBudget === false ? "os-bad" : ""}`}
                        >
                          {r.atm ? money(r.atm.cost, 0) : "–"}
                          {r.atm && (
                            <div className="os-small os-muted">
                              ${r.atm.strike} · {r.atm.expiration.slice(5)}
                            </div>
                          )}
                        </td>
                      )}
                      <td
                        className="os-num"
                        title={`${r.fit.wins} of ${r.fit.n} past trades hit`}
                      >
                        {pctOf(r.fit.hitRate)} hit
                        <div
                          className={`os-small ${(r.fit.avgReturnPct ?? 0) > 0 ? "os-ok" : "os-bad"}`}
                        >
                          {signed(r.fit.avgReturnPct)} avg
                        </div>
                      </td>
                      <td>
                        {r.onList ? (
                          <span className="os-small os-muted">On list</span>
                        ) : (
                          <button
                            className="os-btn os-btn--small"
                            onClick={() => add(r.symbol)}
                          >
                            <FiPlus /> Add
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="os-small os-muted os-flat" style={{ marginTop: 10 }}>
            Past fit: how often our setups reached their target before their
            stop on that symbol, and the average result per trade, losers
            included. Added symbols get scanned from the next scan
            on.
          </p>
        </Card>
      )}
    </div>
  );
}
