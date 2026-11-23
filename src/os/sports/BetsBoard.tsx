import { useState } from "react";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote, Loading } from "../Bits";
import { useLoad } from "../useLoad";
import {
  CONF_LABEL,
  americanOf,
  decimalOf,
  edgePct,
  legKey,
  money,
  odds,
  pct,
  shopText,
  when,
} from "./format";
import type {
  Board,
  FuturesView,
  Game,
  Leg,
  Parlay,
  PropsView,
  Sport,
} from "./types";

/** The bet slip: picks you're adding, a stake, and save it as a bet you placed. */
function Slip({
  legs,
  onRemove,
  onClear,
  onSaved,
}: {
  legs: Leg[];
  onRemove: (l: Leg) => void;
  onClear: () => void;
  onSaved: () => void;
}) {
  const [stake, setStake] = useState("10");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const games = new Set(legs.map((l) => l.eventId));
  const sameGame = games.size < legs.length;
  const decimal = legs.reduce((d, l) => d * decimalOf(l.odds), 1);
  const prob = legs.every((l) => l.prob)
    ? legs.reduce((p, l) => p * (l.prob || 0), 1)
    : null;
  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await os.post("/sports/bets", {
        kind:
          legs.length > 1
            ? "parlay"
            : legs[0].market === "future"
              ? "future"
              : "straight",
        stake: Number(stake),
        legs,
        fromIdea: true,
      });
      setMsg("Saved to My bets.");
      onSaved();
    } catch (err) {
      setMsg(errorText(err, "Couldn't save it."));
    } finally {
      setSaving(false);
    }
  };
  if (!legs.length)
    return msg ? <p className="os-small os-ok os-flat">{msg}</p> : null;
  return (
    <div className="os-sp-slip">
      <div className="os-row" style={{ justifyContent: "space-between" }}>
        <strong>
          Bet slip:{" "}
          {legs.length > 1 ? `${legs.length}-leg parlay` : "straight bet"} at{" "}
          {odds(americanOf(decimal))}
        </strong>
        <button className="os-link os-link--muted" onClick={onClear}>
          Clear
        </button>
      </div>
      <ul>
        {legs.map((l) => (
          <li key={legKey(l)}>
            <span>
              <strong>{l.label}</strong>{" "}
              <span className="os-muted">
                ({odds(l.odds)}) · {l.matchup}
              </span>
              {l.shop?.worstOdds != null && (
                <span className="os-small os-muted">
                  {" "}
                  · take at {odds(l.shop.worstOdds)} or better
                  {l.shop.worstLine !== null && l.shop.worstLine !== l.line
                    ? `, line as far as ${l.shop.worstLine}`
                    : ""}
                </span>
              )}
            </span>
            <button
              className="os-btn os-btn--ghost os-btn--small"
              onClick={() => onRemove(l)}
              aria-label={`Remove ${l.label}`}
            >
              <FiX />
            </button>
          </li>
        ))}
      </ul>
      {sameGame && (
        <p className="os-tr-warn">
          Two picks from the same game are usually linked; most books won't take
          them as a regular parlay.
        </p>
      )}
      <div className="os-row">
        <span className="os-prefix" style={{ width: 120 }}>
          <span>$</span>
          <input
            type="number"
            min={0}
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            aria-label="Stake"
          />
        </span>
        <span className="os-small">
          Pays {money(Math.round((Number(stake) || 0) * decimal * 100) / 100)}
          {prob !== null ? ` · our chance ${pct(prob)}` : ""}
        </span>
        <button
          className="os-btn os-btn--primary os-btn--small"
          onClick={save}
          disabled={saving || !(Number(stake) > 0)}
        >
          <FiCheck /> I placed it
        </button>
      </div>
      <p className="os-small os-muted os-flat">
        Place it with your sportsbook, then save it here to track it. If your
        book's line or price is different, change the label to what you
        actually got. It settles itself when the games end.
      </p>
      {msg && <p className="os-small os-flat">{msg}</p>}
    </div>
  );
}

function AddButton({
  leg,
  slip,
  toggle,
}: {
  leg: Leg;
  slip: Leg[];
  toggle: (l: Leg) => void;
}) {
  const on = slip.some((l) => legKey(l) === legKey(leg));
  return (
    <button
      className={`os-btn os-btn--small ${on ? "os-btn--primary" : ""}`}
      onClick={() => toggle(leg)}
      aria-pressed={on}
    >
      {on ? <FiCheck /> : <FiPlus />} {on ? "On slip" : "Slip"}
    </button>
  );
}

/** "Take X at -125 or better; fine as far as Y; past that, skip": betting at your own book, not ESPN's number. */
function Shop({ l }: { l: Leg }) {
  const t = shopText(l);
  if (!t) return null;
  return (
    <div className="os-sp-shop">
      <span>
        Take <strong>{t.take}</strong>.
      </span>
      {t.range && <span>{t.range}</span>}
      <span className="os-muted">{t.skip}</span>
    </div>
  );
}

function IdeaTile({
  l,
  slip,
  toggle,
}: {
  l: Leg;
  slip: Leg[];
  toggle: (l: Leg) => void;
}) {
  return (
    <div className={`os-sp-idea conf-${l.confidence}`}>
      <div className="os-sp-idea__top">
        <span className={`os-sp-conf conf-${l.confidence}`}>
          {CONF_LABEL[l.confidence || "low"]}
        </span>
        <span className="os-small os-muted">
          {MARKET_NAME[l.market]} · {l.matchup} · {when(l.date)}
        </span>
      </div>
      <strong className="os-sp-idea__label">
        {l.label} <span className="os-muted">{odds(l.odds)}</span>
      </strong>
      <div className="os-sp-idea__nums">
        <span>
          Our chance <strong>{pct(l.prob)}</strong>
        </span>
        <span className="os-ok">
          Edge <strong>{edgePct(l.edge)}</strong>
        </span>
        {l.market === "prop" && l.recent && (
          <span title={`Last 5: ${l.recent.last5.join(", ")}`}>
            Last {l.recent.of}: <strong>{l.recent.hits}</strong> of{" "}
            {l.recent.of} {l.side}
          </span>
        )}
        {l.market === "prop" && l.projection !== undefined && (
          <span>
            We have <strong>{l.projection}</strong>
          </span>
        )}
      </div>
      {l.market === "prop" && l.recent && (
        <span className="os-small os-muted">
          Last 5 games: {l.recent.last5.join(", ")}
        </span>
      )}
      <Shop l={l} />
      {l.warning && <p className="os-tr-warn os-flat">{l.warning}</p>}
      <AddButton leg={l} slip={slip} toggle={toggle} />
    </div>
  );
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const MARKET_NAME: Record<Leg["market"], string> = {
  spread: "Spread",
  total: "Total",
  moneyline: "Moneyline",
  prop: "Prop",
  future: "Future",
};

/** Player props: DraftKings' main lines (via ESPN) against each player's recent games. */
function Props({
  sport,
  slip,
  toggle,
}: {
  sport: Sport;
  slip: Leg[];
  toggle: (l: Leg) => void;
}) {
  const [stat, setStat] = useState("all");
  const { data, error } = useLoad<PropsView>(
    () => os.get(`/sports/props?sport=${sport}`).then((r) => r.data),
    sport,
  );
  if (error) return <ErrorNote text={error} />;
  if (!data)
    return (
      <p className="os-small os-muted os-flat">
        Reading players' recent box scores… the first load takes a few
        seconds.
      </p>
    );
  const stats = [...new Set(data.ideas.map((l) => l.stat || ""))];
  const shown = data.ideas.filter((l) => stat === "all" || l.stat === stat);
  return (
    <>
      {data.problems.map((p) => (
        <p key={p} className="os-tr-warn">
          {p}
        </p>
      ))}
      {stats.length > 1 && (
        <div className="os-seg os-sp-filter" role="tablist" aria-label="Stat">
          <button
            className={stat === "all" ? "on" : ""}
            onClick={() => setStat("all")}
          >
            All ({data.ideas.length})
          </button>
          {stats.map((k) => (
            <button
              key={k}
              className={stat === k ? "on" : ""}
              onClick={() => setStat(k)}
            >
              {cap(data.stats[k] || k)} (
              {data.ideas.filter((l) => l.stat === k).length})
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="os-muted os-flat">
          {data.lines
            ? `Looked at ${data.lines} prop lines: none with an edge the player's recent games back up.`
            : "No prop lines posted yet for the next games. They usually show up the morning of the game."}
        </p>
      ) : (
        <div className="os-sp-ideas">
          {shown.map((l) => (
            <IdeaTile key={legKey(l)} l={l} slip={slip} toggle={toggle} />
          ))}
        </div>
      )}
      <p className="os-small os-muted os-flat" style={{ marginTop: 10 }}>
        {data.note}
      </p>
    </>
  );
}

function ParlayTile({ p, add }: { p: Parlay; add: (legs: Leg[]) => void }) {
  return (
    <div className="os-sp-parlay">
      <div className="os-row" style={{ justifyContent: "space-between" }}>
        <strong>
          {p.legs.length}-leg parlay · {odds(p.odds)}
        </strong>
        <span className="os-small">
          our chance <strong>{pct(p.prob)}</strong> · value{" "}
          <strong className="os-ok">{edgePct(p.ev)}</strong>
        </span>
      </div>
      <ul>
        {p.legs.map((l) => (
          <li key={legKey(l)}>
            {l.label}{" "}
            <span className="os-muted">
              ({odds(l.odds)}) · {l.matchup}
            </span>
            {l.shop?.worstOdds != null && (
              <span className="os-small os-muted">
                {" "}
                · take at {odds(l.shop.worstOdds)} or better
              </span>
            )}
          </li>
        ))}
      </ul>
      <button className="os-btn os-btn--small" onClick={() => add(p.legs)}>
        <FiPlus /> Put on slip
      </button>
    </div>
  );
}

function GameRow({
  g,
  slip,
  toggle,
}: {
  g: Game;
  slip: Leg[];
  toggle: (l: Leg) => void;
}) {
  const L = g.lines;
  const P = g.projection;
  const fav = P ? (P.margin >= 0 ? g.home.abbr : g.away.abbr) : "";
  const best = Object.fromEntries(
    g.legs.map((l) => [`${l.market}:${l.side}`, l]),
  );
  const cell = (k: string) => {
    const l = best[k];
    if (!l) return <span className="os-muted">–</span>;
    const good = (l.edge || 0) >= 0.025;
    return (
      <button
        className={`os-sp-cell ${good ? "good" : ""} ${slip.some((s) => legKey(s) === legKey(l)) ? "on" : ""}`}
        onClick={() => toggle(l)}
        title={`Our chance ${pct(l.prob)} · edge ${edgePct(l.edge)}${l.shop?.worstOdds != null && good ? ` · take at ${odds(l.shop.worstOdds)} or better` : ""}`}
      >
        <span>
          {l.market === "total"
            ? `${l.side === "over" ? "O" : "U"} ${l.line}`
            : l.market === "spread"
              ? l.line! > 0
                ? `+${l.line}`
                : l.line === 0
                  ? "PK"
                  : l.line
              : "ML"}
        </span>
        <small>{odds(l.odds)}</small>
      </button>
    );
  };
  return (
    <div className="os-sp-game">
      <div className="os-sp-game__teams">
        <span className="os-small os-muted">
          {g.state === "pre" ? when(g.date) : g.detail}
        </span>
        {[g.away, g.home].map((t, i) => (
          <div key={t.id} className="os-sp-team">
            {t.logo ? (
              <img src={t.logo} alt="" width={22} height={22} loading="lazy" />
            ) : (
              <span className="os-sp-dot" />
            )}
            <strong>{t.abbr}</strong>
            <span className="os-small os-muted">{t.record}</span>
            {g.state !== "pre" && (
              <strong className="os-sp-score">{t.score}</strong>
            )}
            {i === 1 && <span className="os-small os-muted">home</span>}
          </div>
        ))}
      </div>
      {L && g.state === "pre" ? (
        <div className="os-sp-game__lines">
          <div className="os-sp-grid">
            <span />
            <span className="os-small os-muted">Spread</span>
            <span className="os-small os-muted">Total</span>
            <span className="os-small os-muted">Win</span>
            <strong>{g.away.abbr}</strong>
            {cell("spread:away")}
            {cell("total:over")}
            {cell("moneyline:away")}
            <strong>{g.home.abbr}</strong>
            {cell("spread:home")}
            {cell("total:under")}
            {cell("moneyline:home")}
          </div>
          {P && (
            <p className="os-small os-muted os-flat">
              We have {fav} by {Math.abs(P.margin).toFixed(1)}, total{" "}
              {P.total.toFixed(0)}
              {P.games < 5 ? " (early season: low confidence)" : ""}.
            </p>
          )}
        </div>
      ) : (
        <p className="os-small os-muted os-flat">
          {g.state === "pre"
            ? "No lines yet."
            : g.completed
              ? "Final"
              : "In progress"}
        </p>
      )}
    </div>
  );
}

function Futures({
  sport,
  slip,
  toggle,
}: {
  sport: Sport;
  slip: Leg[];
  toggle: (l: Leg) => void;
}) {
  const { data, error } = useLoad<FuturesView>(
    () => os.get(`/sports/futures?sport=${sport}`).then((r) => r.data),
    sport,
  );
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  if (!data.markets.length)
    return <p className="os-muted os-flat">No futures posted right now.</p>;
  return (
    <div className="os-sp-futures">
      {data.markets.map((m) => (
        <div key={m.name}>
          <strong>{m.name}</strong>
          <div className="os-tr-tablewrap">
            <table className="os-table os-table--wide">
              <thead>
                <tr>
                  <th>Team</th>
                  <th className="os-num">Odds</th>
                  <th className="os-num">Market</th>
                  <th className="os-num">Ours</th>
                  <th className="os-num">Value</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {m.teams.slice(0, 6).map((t) => {
                  const leg: Leg = {
                    eventId: `future:${m.market}:${t.teamId}`,
                    sport,
                    date: new Date().toISOString(),
                    matchup: m.name,
                    market: "future",
                    side: t.teamId,
                    line: null,
                    odds: t.odds,
                    label: `${t.name} to win ${m.name}`,
                    prob: t.prob,
                    marketProb: t.marketProb,
                  };
                  return (
                    <tr key={t.teamId}>
                      <td>{t.name}</td>
                      <td className="os-num">{odds(t.odds)}</td>
                      <td className="os-num">{pct(t.marketProb)}</td>
                      <td className="os-num">{pct(t.prob)}</td>
                      <td
                        className={`os-num ${t.ev > 0 ? "os-ok" : "os-muted"}`}
                      >
                        {edgePct(t.ev)}
                      </td>
                      <td>
                        {t.ev > 0 && (
                          <AddButton leg={leg} slip={slip} toggle={toggle} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="os-small os-muted os-flat">{data.note}</p>
    </div>
  );
}

/** Today's games with our numbers, the best ideas, parlays and futures, and a slip to save what you place. */
export default function BetsBoard() {
  const [sport, setSport] = useState<Sport>("nba");
  const [slip, setSlip] = useState<Leg[]>([]);
  const [showFutures, setShowFutures] = useState(false);
  const [market, setMarket] = useState<
    "all" | "spread" | "total" | "moneyline"
  >("all");
  const { data, error } = useLoad<Board>(
    () => os.get(`/sports/board?sport=${sport}`).then((r) => r.data),
    sport,
  );
  const toggle = (l: Leg) =>
    setSlip((s) =>
      s.some((x) => legKey(x) === legKey(l))
        ? s.filter((x) => legKey(x) !== legKey(l))
        : [...s, l],
    );
  const addAll = (legs: Leg[]) => setSlip(legs);
  const ideas =
    data?.ideas.filter((l) => market === "all" || l.market === market) || [];
  const futureOnSlip = slip.some((l) => l.market === "future");

  return (
    <div className="os-page">
      <div className="os-tr-bar">
        <div className="os-seg" role="tablist" aria-label="League">
          {(["nba", "nfl"] as const).map((s) => (
            <button
              key={s}
              className={sport === s ? "on" : ""}
              onClick={() => {
                setSport(s);
                setSlip([]);
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <Slip
        legs={slip}
        onRemove={toggle}
        onClear={() => setSlip([])}
        onSaved={() => setSlip([])}
      />
      {futureOnSlip && slip.length > 1 && (
        <p className="os-tr-warn">
          Futures are best saved on their own: put just the one future on the
          slip.
        </p>
      )}

      {error && <ErrorNote text={error} />}
      {!data ? (
        !error && <Loading />
      ) : (
        <>
          {data.problems?.map((p) => (
            <p key={p} className="os-tr-warn">
              {p}
            </p>
          ))}
          <Card
            title="Best bets"
            sub="Where our numbers and the price disagree most. Lines are ESPN's (DraftKings); each pick says the worst line and price still worth taking at your book. Our chance is our model blended half and half with the market, so these are leans, not locks."
          >
            <div className="os-seg os-sp-filter" role="tablist" aria-label="Market">
              {(
                [
                  ["all", "All"],
                  ["spread", "Spreads"],
                  ["total", "Totals"],
                  ["moneyline", "Moneylines"],
                ] as const
              ).map(([k, name]) => (
                <button
                  key={k}
                  className={market === k ? "on" : ""}
                  onClick={() => setMarket(k)}
                >
                  {name} (
                  {k === "all"
                    ? data.ideas.length
                    : data.ideas.filter((l) => l.market === k).length}
                  )
                </button>
              ))}
            </div>
            {ideas.length === 0 ? (
              <p className="os-muted os-flat">
                {data.ideas.length
                  ? "No edges in this market right now. Tap a price in the games below to look at any line."
                  : "No edges worth a bet in the next games. Passing is a bet too."}
              </p>
            ) : (
              <div className="os-sp-ideas">
                {ideas.slice(0, market === "all" ? 9 : 18).map((l) => (
                  <IdeaTile key={legKey(l)} l={l} slip={slip} toggle={toggle} />
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Player props"
            sub="Points, rebounds, assists, threes (NBA) and yards and catches (NFL): the line against each player's last 15 games."
          >
            <Props sport={sport} slip={slip} toggle={toggle} />
          </Card>

          {data.parlays.length > 0 && (
            <Card
              title="Parlays"
              sub="Two or three of the picks above from different games, each with an edge. Bigger payout, much lower chance: keep the stake small."
            >
              <div className="os-sp-parlays">
                {data.parlays.map((p) => (
                  <ParlayTile
                    key={p.legs.map(legKey).join("|")}
                    p={p}
                    add={addAll}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card
            title={`${data.name} games`}
            sub="Tap a price to put it on the slip. Green means our chance beats the price by 2.5 points or more."
          >
            {data.games.length === 0 ? (
              <p className="os-muted os-flat">No games in the next few days.</p>
            ) : (
              <div className="os-sp-games">
                {data.games.map((g) => (
                  <GameRow key={g.id} g={g} slip={slip} toggle={toggle} />
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Futures"
            sub="Title odds against a rough model from team ratings."
            right={
              !showFutures && (
                <button
                  className="os-btn os-btn--small"
                  onClick={() => setShowFutures(true)}
                >
                  Show futures
                </button>
              )
            }
          >
            {showFutures && (
              <Futures sport={sport} slip={slip} toggle={toggle} />
            )}
          </Card>

          <details className="os-card os-sp-ratings">
            <summary>
              <strong>Power ratings</strong>{" "}
              <span className="os-small os-muted">
                · points better than an average team, from every game this
                season ({data.ratings.teams} teams)
              </span>
            </summary>
            <div className="os-tr-tablewrap">
              <table className="os-table os-table--wide">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th className="os-num">Rating</th>
                    <th className="os-num">Scored</th>
                    <th className="os-num">Allowed</th>
                    <th className="os-num">Games</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ratings.table.map((t, i) => {
                    return (
                      <tr key={t.id}>
                        <td>{i + 1}</td>
                        <td>{t.name || t.abbr || `Team ${t.id}`}</td>
                        <td
                          className={`os-num ${t.rating >= 0 ? "os-ok" : "os-bad"}`}
                        >
                          {t.rating > 0 ? `+${t.rating}` : t.rating}
                        </td>
                        <td className="os-num">{t.ppg.toFixed(1)}</td>
                        <td className="os-num">{t.oppPpg.toFixed(1)}</td>
                        <td className="os-num">{t.games}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
          <p className="os-small os-muted">{data.disclaimer}</p>
        </>
      )}
    </div>
  );
}
