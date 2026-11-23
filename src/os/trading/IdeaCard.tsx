import { useState } from "react";
import { FiArrowDownRight, FiArrowUpRight, FiPlus } from "react-icons/fi";
import os, { errorText } from "../api";
import { BaseTag } from "./BaseTag";
import { BASE_NAME, money, pctOf, signed } from "./format";
import type { BaseKey, Idea, OptionPick } from "./types";

type Draft = {
  kind: "stock" | "option" | "crypto";
  symbol: string;
  underlying: string;
  direction: "up" | "down";
  base: BaseKey;
  setup: string;
  option?: { type: "call" | "put"; strike: number; expiration: string };
  entryPrice: string;
  qty: string;
  target: string;
  stop: string;
  underlyingTarget: number;
  underlyingStop: number;
};

/** Record that you took it: price you got, how many, target and stop (filled in from the idea). */
function TrackForm({ draft, onDone, onCancel }: { draft: Draft; onDone: () => void; onCancel: () => void }) {
  const [d, setD] = useState(draft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await os.post("/trading/plays", { ...d, entryPrice: Number(d.entryPrice), qty: Number(d.qty), target: Number(d.target) || null, stop: Number(d.stop) || null });
      onDone();
    } catch (err) {
      setError(errorText(err, "Couldn't save it."));
      setSaving(false);
    }
  };
  const unit = d.kind === "option" ? "contracts" : d.kind === "crypto" ? "coins" : "shares";
  return (
    <div className="os-tr-track">
      <strong>Track it: you placed this yourself</strong>
      <div className="os-tr-track__fields">
        <label>
          Your price
          <input className="os-input" type="number" step="any" value={d.entryPrice} onChange={(e) => setD({ ...d, entryPrice: e.target.value })} />
        </label>
        <label>
          How many {unit}
          <input className="os-input" type="number" step="any" value={d.qty} onChange={(e) => setD({ ...d, qty: e.target.value })} />
        </label>
        <label>
          Sell at (target)
          <input className="os-input" type="number" step="any" value={d.target} onChange={(e) => setD({ ...d, target: e.target.value })} />
        </label>
        <label>
          Get out at (stop)
          <input className="os-input" type="number" step="any" value={d.stop} onChange={(e) => setD({ ...d, stop: e.target.value })} />
        </label>
      </div>
      {error && <p className="os-bad os-small os-flat">{error}</p>}
      <div className="os-row">
        <button className="os-btn os-btn--primary os-btn--small" disabled={saving || !(Number(d.entryPrice) > 0) || !(Number(d.qty) > 0)} onClick={save}>
          Save to my plays
        </button>
        <button className="os-btn os-btn--ghost os-btn--small" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function OptionRow({ o, onTrack }: { o: OptionPick; onTrack: () => void }) {
  return (
    <tr>
      <td>
        <BaseTag base={o.base} />
      </td>
      <td>
        <strong>
          ${o.strike} {o.type}
        </strong>
        <div className="os-small os-muted">
          {o.expiration} · {o.days}d · Δ {Math.abs(o.delta).toFixed(2)}
        </div>
      </td>
      <td className="os-num">
        {money(o.mid, 2)}
        <div className="os-small os-muted">{money(o.cost, 0)} each</div>
      </td>
      <td className="os-num os-ok">{signed(o.gainPct)}</td>
      <td className="os-num os-bad">-{o.lossPct}%</td>
      <td className="os-num">
        {o.size?.qty ? (
          <>
            {o.size.qty}
            <div className="os-small os-muted">risk {money(o.size.maxLoss, 0)}</div>
          </>
        ) : (
          <span className="os-small os-muted" title="More than this base's share of your weekly risk">
            1 risks {money(o.mid * 100 * (o.base === "homeRun" ? 1 : o.lossPct / 100), 0)}
          </span>
        )}
      </td>
      <td>
        <button className="os-btn os-btn--small" onClick={onTrack} aria-label={`Track ${o.contract}`}>
          <FiPlus /> Track
        </button>
      </td>
    </tr>
  );
}

/** One idea: why it fired, the plan, how it's done before, and the ways to play it. */
export default function IdeaCard({ idea, onTracked }: { idea: Idea; onTracked: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const up = idea.direction === "up";
  const h = idea.history;
  const base = { symbol: idea.symbol, underlying: idea.symbol, direction: idea.direction, setup: idea.setup, underlyingTarget: idea.target, underlyingStop: idea.stop };
  const trackShares = () =>
    setDraft({ ...base, kind: idea.kind, base: idea.base, entryPrice: String(idea.entry), qty: String(idea.size?.qty || ""), target: String(idea.target), stop: String(idea.stop) });
  const trackOption = (o: OptionPick) =>
    setDraft({ ...base, kind: "option", symbol: o.contract, base: o.base, option: { type: o.type, strike: o.strike, expiration: o.expiration }, entryPrice: String(o.mid), qty: String(o.size?.qty || 1), target: String(o.atTarget), stop: String(o.atStop) });

  return (
    <article className={`os-tr-idea ${idea.warning && h.n >= 5 ? "os-tr-idea--weak" : ""}`}>
      <header className="os-tr-idea__head">
        <div>
          <div className="os-row" style={{ gap: 8 }}>
            <strong className="os-tr-sym">{idea.symbol.replace("-USD", "")}</strong>
            <span className={`os-tr-dir ${up ? "up" : "down"}`}>
              {up ? <FiArrowUpRight /> : <FiArrowDownRight />} {up ? (idea.kind === "crypto" ? "Long" : "Bullish") : "Bearish: puts"}
            </span>
            <BaseTag base={idea.base} />
          </div>
          <span className="os-small os-muted">
            {idea.setupName} · {idea.style} · {idea.asOf}
          </span>
        </div>
        <div className="os-tr-score" title="Signal strength, reward for the risk, and how it's done before">
          <strong>{idea.score}</strong>
          <span>score</span>
        </div>
      </header>

      <div className="os-tr-plan">
        <div>
          <span>Price</span>
          <strong>{money(idea.price)}</strong>
        </div>
        <div>
          <span>Target</span>
          <strong className="os-ok">{money(idea.target)}</strong>
          <small>{signed(up ? idea.gainPct : -idea.gainPct)}</small>
        </div>
        <div>
          <span>Stop</span>
          <strong className="os-bad">{money(idea.stop)}</strong>
          <small>{signed(up ? -idea.lossPct : idea.lossPct)}</small>
        </div>
        <div>
          <span>Reward : risk</span>
          <strong>{idea.rewardRisk.toFixed(1)} : 1</strong>
        </div>
        <div>
          <span>Before, here</span>
          <strong>{h.n ? `${h.wins} of ${h.n}` : "–"}</strong>
          <small>{h.n ? `${pctOf(h.hitRate)} hit · avg ${signed(h.avgReturnPct)}` : "no history"}</small>
        </div>
      </div>

      <ul className="os-tr-reasons">
        {idea.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {idea.warning && <p className="os-tr-warn">{idea.warning}</p>}

      {!idea.optionsOnly && (
        <div className="os-tr-shares">
          <span>
            <strong>{idea.kind === "crypto" ? "Buy the coin" : "Shares"}:</strong>{" "}
            {idea.size?.qty ? (
              <>
                {idea.size.qty} {idea.size.unit}
                {idea.size.qty === 1 ? "" : "s"} ≈ {money(idea.size.qty * idea.entry, 0)}, risking about {money(idea.size.maxLoss, 0)} at the stop
              </>
            ) : (
              "set a weekly risk budget in Settings to size it"
            )}
          </span>
          <button className="os-btn os-btn--small" onClick={trackShares}>
            <FiPlus /> Track
          </button>
        </div>
      )}

      {idea.options && idea.options.length > 0 && (
        <details className="os-tr-ladder">
          <summary>
            <strong>
              {idea.options.length} {up ? "call" : "put"}
              {idea.options.length === 1 ? "" : "s"}
            </strong>{" "}
            <span className="os-muted">
              · same idea, pick your base: {[...new Set(idea.options.map((o) => o.base))].map((b) => BASE_NAME[b]).join(", ")}
            </span>
          </summary>
          <p className="os-small os-muted os-flat">Priced at the mid. Gain and loss if the stock reaches the target or stop in about two weeks (or halfway to expiry).</p>
          <div className="os-tr-tablewrap">
            <table className="os-table os-table--wide">
              <thead>
                <tr>
                  <th>Base</th>
                  <th>Contract</th>
                  <th className="os-num">Price</th>
                  <th className="os-num">At target</th>
                  <th className="os-num">At stop</th>
                  <th className="os-num">Size</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {idea.options.map((o) => (
                  <OptionRow key={o.contract} o={o} onTrack={() => trackOption(o)} />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {idea.kind === "stock" && idea.options && idea.options.length === 0 && <p className="os-small os-muted os-flat">{idea.optionsError || "No liquid options that fit right now."}</p>}

      {draft && (
        <TrackForm
          draft={draft}
          onCancel={() => setDraft(null)}
          onDone={() => {
            setDraft(null);
            onTracked();
          }}
        />
      )}
    </article>
  );
}
