import { useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote, Loading, PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import { useLoad } from "../useLoad";
import IdeaCard from "../trading/IdeaCard";
import { BaseTag } from "../trading/BaseTag";
import {
  BASE_COLOR,
  BASE_NAME,
  BASE_NEEDS,
  BASE_WHAT,
  money,
  pctOf,
  signed,
} from "../trading/format";
import type {
  BaseKey,
  Idea,
  Play,
  Settings,
  TradingView,
} from "../trading/types";

const BASES: BaseKey[] = ["single", "double", "triple", "homeRun"];
const ago = (iso: string | null) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60
    ? `${m} min ago`
    : m < 1440
      ? `${Math.round(m / 60)} h ago`
      : `${Math.round(m / 1440)} d ago`;
};

// ── Ideas ──────────────────────────────────────────────────────────────

function Lookup({ onTracked }: { onTracked: () => void }) {
  const [sym, setSym] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{
    symbol: string;
    price: number;
    asOf: string;
    ideas: Idea[];
  } | null>(null);
  const [error, setError] = useState("");
  const go = async () => {
    if (!sym.trim()) return;
    setBusy(true);
    setError("");
    setRes(null);
    try {
      setRes(
        (
          await os.get(
            `/trading/symbol/${encodeURIComponent(sym.trim().toUpperCase())}`,
          )
        ).data,
      );
    } catch (err) {
      setError(errorText(err, "Couldn't look that up."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card
      title="Look up any symbol"
      sub="Shares like AAPL, or crypto like BTC-USD. Shows any setup firing right now."
    >
      <form
        className="os-row"
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
      >
        <input
          className="os-input"
          value={sym}
          onChange={(e) => setSym(e.target.value)}
          placeholder="NVDA"
          style={{ flex: "1 1 160px", textTransform: "uppercase" }}
          aria-label="Symbol"
        />
        <button className="os-btn" disabled={busy}>
          <FiSearch /> {busy ? "Looking…" : "Look"}
        </button>
      </form>
      {error && <ErrorNote text={error} />}
      {res && (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {res.ideas.length === 0 ? (
            <p className="os-muted os-flat">
              No setup on {res.symbol} right now ({money(res.price)} on{" "}
              {res.asOf}). Nothing to do is a fine answer.
            </p>
          ) : (
            res.ideas.map((i) => (
              <IdeaCard key={i.setup} idea={i} onTracked={onTracked} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}

function Ideas({ view, reload }: { view: TradingView; reload: () => void }) {
  const [kind, setKind] = useState<"all" | "stock" | "crypto">("all");
  const [base, setBase] = useState<BaseKey | "all">("all");
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState("");
  const ideas = view.ideas.filter(
    (i) =>
      (kind === "all" || i.kind === kind) &&
      (base === "all" ||
        i.base === base ||
        i.options?.some((o) => o.base === base)),
  );
  const scan = async () => {
    setScanning(true);
    setMsg("");
    try {
      const r = await os.post("/trading/scan", {});
      setMsg(
        `Scanned: ${r.data.found} idea${r.data.found === 1 ? "" : "s"}${r.data.skipped.length ? `; ${r.data.skipped.length} symbol${r.data.skipped.length === 1 ? "" : "s"} had no data` : ""}.`,
      );
      reload();
    } catch (err) {
      setMsg(errorText(err, "The scan didn't finish."));
    } finally {
      setScanning(false);
    }
  };
  return (
    <div className="os-page">
      <div className="os-tr-bar">
        <div className="os-seg" role="tablist" aria-label="What">
          {(
            [
              ["all", "All"],
              ["stock", "Stocks & options"],
              ["crypto", "Crypto"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={kind === k ? "on" : ""}
              onClick={() => setKind(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="os-row os-tr-basefilter">
          <button
            className={`os-chip ${base === "all" ? "os-chip--on" : ""}`}
            onClick={() => setBase("all")}
          >
            Any base
          </button>
          {BASES.map((b) => (
            <button
              key={b}
              className={`os-chip ${base === b ? "os-chip--on" : ""}`}
              onClick={() => setBase(b)}
              style={
                base === b
                  ? { borderColor: BASE_COLOR[b], color: BASE_COLOR[b] }
                  : undefined
              }
            >
              {BASE_NAME[b]}
            </button>
          ))}
        </div>
        <button
          className="os-btn os-btn--primary"
          onClick={scan}
          disabled={scanning}
        >
          <FiRefreshCw className={scanning ? "os-spin" : ""} />{" "}
          {scanning ? "Scanning…" : "Scan now"}
        </button>
      </div>
      <p className="os-small os-muted os-flat">
        Stocks scanned {ago(view.scan.lastStockScan)} (it scans at 10:00 and
        3:30 on weekdays) · crypto {ago(view.scan.lastCryptoScan)} (every 4
        hours)
        {view.scan.hidden
          ? ` · ${view.scan.hidden} below your minimum score hidden`
          : ""}
        .{msg && ` ${msg}`}
      </p>
      {ideas.length === 0 ? (
        <Card>
          <p className="os-flat">
            {view.scan.at
              ? "No setups worth a look right now. That's normal: most days there are only a few."
              : "No scan yet. Hit Scan now; it takes about a minute."}
          </p>
        </Card>
      ) : (
        <div className="os-tr-ideas">
          {ideas.map((i, n) => (
            <IdeaCard
              key={i.id}
              idea={i}
              onTracked={reload}
              openOptions={n < 2}
            />
          ))}
        </div>
      )}
      <Lookup onTracked={reload} />
    </div>
  );
}

// ── My plays ───────────────────────────────────────────────────────────

function PlayRow({ p, reload }: { p: Play; reload: () => void }) {
  const [closing, setClosing] = useState(false);
  const [price, setPrice] = useState(String(p.lastPrice ?? ""));
  const [reason, setReason] = useState(p.hit || "manual");
  const [error, setError] = useState("");
  const name =
    p.kind === "option"
      ? `${p.underlying} $${p.option?.strike} ${p.option?.type}`
      : p.symbol.replace("-USD", "");
  const r = p.returnPct;
  const pl =
    p.lastPrice !== null && p.status === "open"
      ? (p.lastPrice - p.entryPrice) * p.qty * (p.kind === "option" ? 100 : 1)
      : p.exitPrice !== null
        ? (p.exitPrice - p.entryPrice) * p.qty * (p.kind === "option" ? 100 : 1)
        : null;
  const close = async () => {
    try {
      await os.patch(`/trading/plays/${p._id}`, {
        close: { price: Number(price), reason },
      });
      reload();
    } catch (err) {
      setError(errorText(err, "Couldn't close it."));
    }
  };
  return (
    <li className={`os-tr-play ${p.hit ? `hit-${p.hit}` : ""}`}>
      <div className="os-tr-play__main">
        <div>
          <div className="os-row" style={{ gap: 8 }}>
            <strong>{name}</strong>
            <BaseTag base={p.base} />
            {p.hit === "target" && (
              <span className="os-tag os-tag--ok">Target hit</span>
            )}
            {p.hit === "stop" && (
              <span className="os-tag os-tag--warn">Stop hit</span>
            )}
          </div>
          <span className="os-small os-muted">
            {p.qty}{" "}
            {p.kind === "option"
              ? "contract"
              : p.kind === "crypto"
                ? "coin"
                : "share"}
            {p.qty === 1 ? "" : "s"} at {money(p.entryPrice)} ·{" "}
            {p.status === "open"
              ? `opened ${new Date(p.openedAt).toLocaleDateString()}`
              : `closed ${p.closedAt ? new Date(p.closedAt).toLocaleDateString() : ""} (${p.exitReason})`}
            {p.option?.expiration ? ` · expires ${p.option.expiration}` : ""}
          </span>
        </div>
        <div className="os-tr-play__nums">
          <span>
            {p.status === "open" ? "Now" : "Out at"}{" "}
            <strong>
              {money(p.status === "open" ? p.lastPrice : p.exitPrice)}
            </strong>
          </span>
          <span className={r === null ? "" : r >= 0 ? "os-ok" : "os-bad"}>
            <strong>{signed(r)}</strong>{" "}
            {pl !== null && (
              <small>
                ({pl >= 0 ? "+" : "-"}
                {money(Math.abs(pl), 0)})
              </small>
            )}
          </span>
          <span className="os-small os-muted">
            target {money(p.target)} · stop {money(p.stop)}
          </span>
        </div>
      </div>
      {p.status === "open" &&
        (closing ? (
          <div className="os-row">
            <input
              className="os-input"
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label="Sold at"
              style={{ width: 120 }}
            />
            <select
              className="os-input"
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              aria-label="Why"
            >
              <option value="target">Hit target</option>
              <option value="stop">Hit stop</option>
              <option value="manual">My call</option>
              <option value="expired">Expired</option>
            </select>
            <button
              className="os-btn os-btn--small os-btn--primary"
              onClick={close}
              disabled={!(Number(price) >= 0)}
            >
              Close it
            </button>
            <button
              className="os-btn os-btn--small os-btn--ghost"
              onClick={() => setClosing(false)}
            >
              Cancel
            </button>
            {error && <span className="os-bad os-small">{error}</span>}
          </div>
        ) : (
          <div className="os-row">
            <button
              className="os-btn os-btn--small"
              onClick={() => setClosing(true)}
            >
              I sold it
            </button>
            <button
              className="os-link os-link--muted"
              onClick={async () => {
                if (
                  window.confirm(
                    "Delete this play? (Use 'I sold it' to keep it in your record.)",
                  )
                ) {
                  await os.delete(`/trading/plays/${p._id}`);
                  reload();
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
    </li>
  );
}

function Plays({ view, reload }: { view: TradingView; reload: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const open = view.plays.filter((p) => p.status === "open");
  const closed = view.plays.filter((p) => p.status === "closed");
  const refresh = async () => {
    setRefreshing(true);
    await os.post("/trading/plays/refresh", {}).catch(() => {});
    setRefreshing(false);
    reload();
  };
  return (
    <div className="os-page">
      <Card
        title={`Open (${open.length})`}
        sub="Prices update every 15 minutes in market hours (crypto anytime); you get a notification when one hits its target or stop."
        right={
          <button
            className="os-btn os-btn--small"
            onClick={refresh}
            disabled={refreshing}
          >
            <FiRefreshCw /> {refreshing ? "Updating…" : "Update prices"}
          </button>
        }
      >
        {open.length === 0 ? (
          <p className="os-muted os-flat">
            Nothing open. Track a play from an idea after you place it with your
            broker.
          </p>
        ) : (
          <ul className="os-tr-plays">
            {open.map((p) => (
              <PlayRow key={p._id} p={p} reload={reload} />
            ))}
          </ul>
        )}
      </Card>
      {closed.length > 0 && (
        <Card title={`Closed (${closed.length})`}>
          <ul className="os-tr-plays">
            {closed.slice(0, 50).map((p) => (
              <PlayRow key={p._id} p={p} reload={reload} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ── Record ─────────────────────────────────────────────────────────────

function Record({ view }: { view: TradingView }) {
  const r = view.record;
  return (
    <div className="os-page">
      <div className="os-stats">
        <div>
          <span>Closed plays</span>
          <strong>{r.all.plays}</strong>
          <small>{r.open} open</small>
        </div>
        <div
          className={
            r.all.hitRate !== null && r.all.hitRate >= 0.5 ? "good" : ""
          }
        >
          <span>Hit rate</span>
          <strong>{pctOf(r.all.hitRate)}</strong>
          <small>{r.all.wins} winners</small>
        </div>
        <div
          className={
            r.all.avgReturnPct !== null
              ? r.all.avgReturnPct >= 0
                ? "good"
                : "bad"
              : ""
          }
        >
          <span>Average play</span>
          <strong>{signed(r.all.avgReturnPct)}</strong>
          <small>
            best {signed(r.all.best)} · worst {signed(r.all.worst)}
          </small>
        </div>
        <div className={r.all.pl >= 0 ? "good" : "bad"}>
          <span>Profit / loss</span>
          <strong>
            {r.all.pl >= 0 ? "" : "-"}
            {money(Math.abs(r.all.pl), 0)}
          </strong>
          <small>all closed plays</small>
        </div>
        <div>
          <span>Weekly risk</span>
          <strong>{money(view.settings.weeklyRisk, 0)}</strong>
          <small>change in Settings</small>
        </div>
      </div>
      <Card
        title="By base"
        sub="Bigger bases need fewer hits to pay. Each bar shows your hit rate against roughly what that base needs."
      >
        <div className="os-tr-bases">
          {BASES.map((b) => {
            const g = r.byBase[b];
            const need = BASE_NEEDS[b];
            return (
              <div
                key={b}
                className="os-tr-basecard"
                style={{ borderTopColor: BASE_COLOR[b] }}
              >
                <div
                  className="os-row"
                  style={{ justifyContent: "space-between" }}
                >
                  <BaseTag base={b} />
                  <span className="os-small os-muted">
                    {view.settings.split[b]}% of risk
                  </span>
                </div>
                <p className="os-small os-muted os-flat">{BASE_WHAT[b]}</p>
                <div
                  className="os-tr-meter"
                  title={`Needs about ${Math.round(need * 100)}%`}
                >
                  <span
                    style={{
                      width: `${Math.round((g.hitRate ?? 0) * 100)}%`,
                      background: BASE_COLOR[b],
                    }}
                  />
                  <i style={{ left: `${need * 100}%` }} />
                </div>
                <div className="os-tr-basecard__nums">
                  <span>
                    <strong>{g.plays ? `${g.wins}/${g.plays}` : "–"}</strong>{" "}
                    hit
                  </span>
                  <span>
                    avg <strong>{signed(g.avgReturnPct)}</strong>
                  </span>
                  <span className={g.pl >= 0 ? "os-ok" : "os-bad"}>
                    <strong>
                      {g.pl >= 0 ? "+" : "-"}
                      {money(Math.abs(g.pl), 0)}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="By kind">
        <table className="os-table os-table--wide">
          <thead>
            <tr>
              <th>Kind</th>
              <th className="os-num">Plays</th>
              <th className="os-num">Hit rate</th>
              <th className="os-num">Avg</th>
              <th className="os-num">P/L</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["stock", "Shares"],
                ["option", "Options"],
                ["crypto", "Crypto"],
              ] as const
            ).map(([k, l]) => {
              const g = r.byKind[k];
              return (
                <tr key={k}>
                  <td>{l}</td>
                  <td className="os-num">{g.plays}</td>
                  <td className="os-num">{pctOf(g.hitRate)}</td>
                  <td className="os-num">{signed(g.avgReturnPct)}</td>
                  <td className={`os-num ${g.pl >= 0 ? "os-ok" : "os-bad"}`}>
                    {g.pl >= 0 ? "+" : "-"}
                    {money(Math.abs(g.pl), 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────

function SettingsTab({
  view,
  onSaved,
}: {
  view: TradingView;
  onSaved: () => void;
}) {
  const s = view.settings;
  const [stocks, setStocks] = useState(s.stocks.join(", "));
  const [crypto, setCrypto] = useState(
    s.crypto.map((c) => c.replace("-USD", "")).join(", "),
  );
  const [weeklyRisk, setWeeklyRisk] = useState(String(s.weeklyRisk));
  const [split, setSplit] = useState<Settings["split"]>(s.split);
  const [minScore, setMinScore] = useState(String(s.minScore));
  const [alerts, setAlerts] = useState(s.alerts);
  const [msg, setMsg] = useState("");
  const total = BASES.reduce((a, b) => a + (Number(split[b]) || 0), 0);
  const save = async () => {
    setMsg("");
    try {
      await os.patch("/trading/settings", {
        stocks,
        crypto,
        weeklyRisk: Number(weeklyRisk),
        split,
        minScore: Number(minScore),
        alerts,
      });
      setMsg("Saved.");
      onSaved();
    } catch (err) {
      setMsg(errorText(err, "Couldn't save."));
    }
  };
  return (
    <div className="os-page">
      <Card
        title="Watchlists"
        sub="Liquid names with busy option chains work best. Separate with commas."
      >
        <div className="os-form os-settings">
          <label>
            Stocks and ETFs
            <textarea
              className="os-input"
              rows={3}
              value={stocks}
              onChange={(e) => setStocks(e.target.value)}
            />
          </label>
          <label>
            Crypto
            <textarea
              className="os-input"
              rows={2}
              value={crypto}
              onChange={(e) => setCrypto(e.target.value)}
            />
          </label>
        </div>
      </Card>
      <Card
        title="Risk"
        sub="How much you're OK losing in a bad week, and how it splits across the bases. Sizes are worked out so a stop-out loses about that base's share."
      >
        <div className="os-form os-settings">
          <div className="os-grid2">
            <label>
              Weekly risk budget
              <span className="os-prefix">
                <span>$</span>
                <input
                  type="number"
                  min={0}
                  value={weeklyRisk}
                  onChange={(e) => setWeeklyRisk(e.target.value)}
                />
              </span>
            </label>
            <label>
              Show ideas scoring at least
              <input
                className="os-input"
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </label>
          </div>
          <div className="os-grid4">
            {BASES.map((b) => (
              <label key={b}>
                {BASE_NAME[b]}
                <span className="os-suffix">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={split[b]}
                    onChange={(e) =>
                      setSplit({ ...split, [b]: Number(e.target.value) })
                    }
                  />
                  <span>%</span>
                </span>
                <small className="os-muted">
                  ≈{" "}
                  {money(
                    ((Number(weeklyRisk) || 0) * (Number(split[b]) || 0)) / 100,
                    0,
                  )}{" "}
                  a week
                </small>
              </label>
            ))}
          </div>
          {total !== 100 && (
            <p className="os-bad os-small os-flat">
              The split adds up to {total}%; it needs to be 100%.
            </p>
          )}
          <label className="os-check">
            <input
              type="checkbox"
              checked={alerts}
              onChange={(e) => setAlerts(e.target.checked)}
            />{" "}
            Notify me about new plays and when a play hits its target or stop
          </label>
          <div className="os-actions">
            <button
              className="os-btn os-btn--primary"
              onClick={save}
              disabled={total !== 100}
            >
              Save
            </button>
            {msg && <span className="os-small">{msg}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Trading desk: ideas by base (single, double, triple, home run), your plays and your record. Ideas only; you place trades yourself. */
export default function TradingPage() {
  const { data, error, reload } = useLoad<TradingView>(() =>
    os.get("/trading").then((r) => r.data),
  );
  const settingsKey = useMemo(
    () => JSON.stringify(data?.settings || {}),
    [data],
  );
  const openCount = data?.plays.filter((p) => p.status === "open").length || 0;
  const hits =
    data?.plays.filter((p) => p.status === "open" && p.hit).length || 0;
  return (
    <div className="os-page">
      <PageHead
        title="Trading"
        sub="Setups on your watchlists, sorted into singles, doubles, triples and home runs. You place the trades; this finds them and keeps score."
      />
      <SubNav
        items={[
          ["/trading", "Ideas", true],
          [
            "/trading/plays",
            `My plays${openCount ? ` (${openCount}${hits ? `, ${hits} hit` : ""})` : ""}`,
          ],
          ["/trading/record", "Record"],
          ["/trading/settings", "Settings"],
        ]}
      />
      {error && <ErrorNote text={error} />}
      {!data ? (
        !error && <Loading />
      ) : (
        <>
          <Routes>
            <Route index element={<Ideas view={data} reload={reload} />} />
            <Route
              path="plays"
              element={<Plays view={data} reload={reload} />}
            />
            <Route path="record" element={<Record view={data} />} />
            <Route
              path="settings"
              element={
                <SettingsTab key={settingsKey} view={data} onSaved={reload} />
              }
            />
          </Routes>
          <p className="os-small os-muted">{data.disclaimer}</p>
        </>
      )}
    </div>
  );
}
