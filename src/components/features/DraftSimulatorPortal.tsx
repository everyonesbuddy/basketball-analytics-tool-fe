import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { fetchFantasyDraftSimulator } from "../../utils/dashboardApi";
import { safeToText } from "../../utils/dashboardFormatters";
import { formatMetricValue } from "../dashboard/DashboardCards";
import type {
  DraftSimulatorResponse,
  DraftSimulatorSport,
  DraftSimulatorStrategy,
  FantasyScoringId,
} from "../../utils/dashboardTypes";

const STRATEGY_OPTIONS: Record<
  DraftSimulatorSport,
  Array<{ key: string; label: string }>
> = {
  nfl: [
    { key: "rb_heavy", label: "RB heavy" },
    { key: "wr_heavy", label: "WR heavy" },
    { key: "hero_rb", label: "Hero RB" },
    { key: "zero_rb", label: "Zero RB" },
    { key: "early_qb", label: "Early QB" },
    { key: "early_te", label: "Early TE" },
  ],
  nba: [
    { key: "guards_first", label: "Guards first" },
    { key: "bigs_first", label: "Bigs first" },
    { key: "forwards_first", label: "Forwards first" },
  ],
};

const SETTINGS_KEY = "fantasy.simSettings.v1";

type SimSettings = { draftPosition: string; simulations: string };

const readSettings = (sport: DraftSimulatorSport): SimSettings => {
  try {
    const raw = window.localStorage.getItem(`${SETTINGS_KEY}.${sport}`);
    if (raw) {
      return { draftPosition: "1", simulations: "150", ...JSON.parse(raw) };
    }
  } catch {
    // Fall through to defaults.
  }
  return { draftPosition: "1", simulations: "150" };
};

const strategyLabel = (strategy: DraftSimulatorStrategy) =>
  strategy.label || strategy.key.replace(/_/g, " ");

const formatPct = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : `${formatMetricValue(value)}%`;

const formatSigned = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${formatMetricValue(value)}`;
};

const sortedChoices = (
  choices: Array<{ name: string; pct: number | null }> | undefined,
) => [...(choices ?? [])].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));

type DraftSimulatorPortalProps = {
  sport: DraftSimulatorSport;
  // Every player id drafted so far, in pick order.
  pickIds: string[];
  teamCount: string;
  starters: string;
  season: string;
  scoringId?: FantasyScoringId;
  forceRefresh: boolean;
};

const DraftSimulatorPortal = ({
  sport,
  pickIds,
  teamCount,
  starters,
  season,
  scoringId,
  forceRefresh,
}: DraftSimulatorPortalProps) => {
  const [saved] = useState(() => readSettings(sport));
  const [draftPosition, setDraftPosition] = useState(saved.draftPosition);
  const [simulations, setSimulations] = useState(saved.simulations);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<DraftSimulatorResponse | null>(null);
  const [ranWith, setRanWith] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickKey = pickIds.join(",");
  const stale = Boolean(result) && ranWith !== pickKey;
  const teams = Number(teamCount) > 0 ? Number(teamCount) : 12;

  const toggleStrategy = (key: string) =>
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  const run = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const slot = Number(draftPosition);
    if (!Number.isInteger(slot) || slot < 1 || slot > teams) {
      setError(
        `Your draft position must be a whole number from 1 to ${teams}.`,
      );
      return;
    }

    const runs = Number(simulations);
    if (!Number.isInteger(runs) || runs < 20 || runs > 400) {
      setError("Simulations must be a whole number from 20 to 400.");
      return;
    }

    try {
      window.localStorage.setItem(
        `${SETTINGS_KEY}.${sport}`,
        JSON.stringify({ draftPosition, simulations }),
      );
    } catch {
      // Settings just won't be remembered.
    }

    setLoading(true);
    try {
      const data = await fetchFantasyDraftSimulator(sport, forceRefresh, {
        draftPosition: slot,
        teamCount: teams,
        starters: starters.trim() || undefined,
        scoringId,
        season: season.trim() || undefined,
        simulations: runs,
        picks: pickIds,
        strategies: selected,
      });
      setResult(data);
      setRanWith(pickKey);
      setPlanKey("");
    } catch {
      setError(
        "The draft simulation failed. Check your settings and that the backend draft-simulator route is available.",
      );
    } finally {
      setLoading(false);
    }
  };

  const nextPick = result?.situation?.yourNextPick;
  const options = result?.pickOptions?.players ?? [];
  const availability = result?.nextPickAvailability?.players ?? [];
  const insights = result?.decisionInsights ?? [];

  const ranked = [...(result?.strategies ?? [])].sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99),
  );
  const means = ranked
    .map((strategy) => strategy.starterVorp?.mean)
    .filter((value): value is number => typeof value === "number");
  const minMean = Math.min(...means);
  const maxMean = Math.max(...means);
  // Bars are scaled to the spread so close strategies still read as close.
  const barWidth = (mean: number | null | undefined) =>
    typeof mean !== "number" || maxMean === minMean
      ? 100
      : 35 + (65 * (mean - minMean)) / (maxMean - minMean);

  const activePlan =
    ranked.find((strategy) => strategy.key === planKey) ?? ranked[0];

  // A round only needs a strategy decision if the plans pick different players.
  const topNamesByRound = new Map<number, Set<string>>();
  ranked.forEach((strategy) =>
    strategy.pickPlan?.forEach((entry) => {
      const top = sortedChoices(entry.topChoices)[0];
      if (top && entry.round !== null) {
        const names = topNamesByRound.get(entry.round) ?? new Set<string>();
        names.add(top.name);
        topNamesByRound.set(entry.round, names);
      }
    }),
  );

  return (
    <section className="feature-stage feature-stage--draft-sim">
      <form onSubmit={run}>
        <span className="fantasy-badge">
          {sport === "nba" ? "NBA Fantasy" : "NFL Fantasy"}
        </span>
        <h3>Draft Simulator</h3>
        <p className="helper-note">
          Plays your draft out many times from your slot. It uses the{" "}
          {pickIds.length} pick{pickIds.length === 1 ? "" : "s"} marked on the
          Draft Board so far.
        </p>
        <label htmlFor={`${sport}SimSlot`}>Your pick (1-{teams})</label>
        <input
          id={`${sport}SimSlot`}
          value={draftPosition}
          onChange={(event) => setDraftPosition(event.target.value)}
        />
        <label htmlFor={`${sport}SimRuns`}>Simulations</label>
        <input
          id={`${sport}SimRuns`}
          value={simulations}
          onChange={(event) => setSimulations(event.target.value)}
        />
        <details className="sim-options">
          <summary>
            Choose directions to compare
            {selected.length ? ` (${selected.length} selected)` : " (all)"}
          </summary>
          <div className="chip-grid">
            {STRATEGY_OPTIONS[sport].map((option) => (
              <label className="chip sim-strategy-chip" key={option.key}>
                <input
                  type="checkbox"
                  checked={selected.includes(option.key)}
                  onChange={() => toggleStrategy(option.key)}
                />{" "}
                {option.label}
              </label>
            ))}
          </div>
        </details>
        <button type="submit" disabled={loading}>
          {loading
            ? "Simulating..."
            : result
              ? "Re-run Simulation"
              : "Run Simulation"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Simulation Readout</h2>
          {error ? <p className="error-note">{error}</p> : null}
          {!result ? (
            <p className="empty-note">
              Set your draft slot and run the simulation to see which direction
              looks strongest and what to do at each pick.
            </p>
          ) : (
            <article className="scout-card fantasy-card">
              {stale ? (
                <p className="callout-note">
                  The draft has changed since this run — re-run to update.
                </p>
              ) : null}
              {insights.length ? (
                <ul className="callout-note plain-list">
                  {insights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}

              <div className="impact-summary-grid">
                <div className="overview-pill">
                  <p className="overview-pill-label">Picks made</p>
                  <p className="overview-pill-value">
                    {formatMetricValue(
                      result.situation?.picksMade ?? pickIds.length,
                    )}
                  </p>
                </div>
                <div className="overview-pill">
                  <p className="overview-pill-label">Your next pick</p>
                  <p className="overview-pill-value">
                    {formatMetricValue(nextPick?.overallPick)}
                  </p>
                </div>
                <div className="overview-pill">
                  <p className="overview-pill-label">Picks until you</p>
                  <p className="overview-pill-value">
                    {formatMetricValue(nextPick?.picksUntilYou)}
                  </p>
                </div>
              </div>

              {ranked.length ? (
                <section className="sim-section">
                  <div className="sim-section__head">
                    <h4 className="fantasy-section-heading">
                      Draft directions, ranked
                    </h4>
                    <span className="sim-section__sub">
                      {formatMetricValue(result.simulations)} simulated drafts
                    </span>
                  </div>
                  <p className="fantasy-tip">
                    Compare the gaps, not the totals. Close directions are
                    effectively ties.
                  </p>
                  <div className="sim-directions">
                    {ranked.map((strategy, index) => {
                      const isBaseline = strategy.key === "best_value";
                      const delta = strategy.vsBestValue?.meanDifference;
                      return (
                        <article
                          className={`sim-direction ${index === 0 ? "sim-direction--top" : ""}`}
                          key={strategy.key}
                        >
                          <span className="sim-direction__rank">
                            {strategy.rank ?? index + 1}
                          </span>
                          <div className="sim-direction__body">
                            <div className="sim-direction__title">
                              <strong>{strategyLabel(strategy)}</strong>
                              {index === 0 ? (
                                <span className="sim-tag sim-tag--top">
                                  Top direction
                                </span>
                              ) : null}
                              {isBaseline ? (
                                <span className="sim-tag">Baseline</span>
                              ) : (
                                <span
                                  className={`sim-tag ${
                                    typeof delta === "number" && delta >= 0
                                      ? "sim-tag--pos"
                                      : "sim-tag--neg"
                                  }`}
                                  title="Average lineup VORP versus Best value"
                                >
                                  {formatSigned(delta)} vs best value
                                </span>
                              )}
                            </div>
                            <div className="sim-direction__bar">
                              <span
                                className="sim-direction__fill"
                                style={{
                                  width: `${barWidth(strategy.starterVorp?.mean)}%`,
                                }}
                              />
                              <span className="sim-direction__value">
                                {formatMetricValue(strategy.starterVorp?.mean)}
                              </span>
                            </div>
                            <p className="sim-direction__stats">
                              Range{" "}
                              {formatMetricValue(strategy.starterVorp?.p10)} –{" "}
                              {formatMetricValue(strategy.starterVorp?.p90)}
                              {!isBaseline
                                ? ` · Beats best value ${formatPct(strategy.vsBestValue?.beatsBestValuePct)}`
                                : ""}
                              {` · Lineup filled ${formatPct(strategy.lineupCompletePct)}`}
                            </p>
                            {strategy.positionMix ? (
                              <div className="sim-direction__mix">
                                {Object.entries(strategy.positionMix).map(
                                  ([position, count]) => (
                                    <span className="chip" key={position}>
                                      {position} {formatMetricValue(count)}
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activePlan?.pickPlan?.length ? (
                <section className="sim-section">
                  <div className="sim-section__head">
                    <h4 className="fantasy-section-heading">
                      Round-by-round plan
                    </h4>
                    <span className="sim-section__sub">
                      Higher % = picked more often
                    </span>
                  </div>
                  <div
                    className="sim-plan-tabs"
                    role="tablist"
                    aria-label="Plan by direction"
                  >
                    {ranked.map((strategy) => (
                      <button
                        key={strategy.key}
                        type="button"
                        role="tab"
                        aria-selected={strategy.key === activePlan.key}
                        className={`sim-plan-tab ${strategy.key === activePlan.key ? "active" : ""}`}
                        onClick={() => setPlanKey(strategy.key)}
                      >
                        {strategyLabel(strategy)}
                      </button>
                    ))}
                  </div>

                  <ol className="sim-plan">
                    {activePlan.pickPlan.map((entry, index) => {
                      const choices = sortedChoices(entry.topChoices);
                      const isNext =
                        entry.overallPick !== null &&
                        entry.overallPick === nextPick?.overallPick;
                      const isPast =
                        typeof entry.overallPick === "number" &&
                        typeof nextPick?.overallPick === "number" &&
                        entry.overallPick < nextPick.overallPick;
                      const agree =
                        (topNamesByRound.get(entry.round ?? -1)?.size ?? 0) ===
                          1 && ranked.length > 1;
                      return (
                        <li
                          className={`sim-plan__row ${isNext ? "sim-plan__row--next" : ""} ${isPast ? "sim-plan__row--past" : ""}`}
                          key={`${entry.round}-${index}`}
                        >
                          <div className="sim-plan__round">
                            <strong>R{safeToText(entry.round)}</strong>
                            <span>pick {safeToText(entry.overallPick)}</span>
                            {isNext ? (
                              <span className="sim-tag sim-tag--top">
                                You're here
                              </span>
                            ) : null}
                          </div>
                          <div className="sim-plan__choices">
                            {choices.length ? (
                              choices.map((choice, choiceIndex) => (
                                <span
                                  className={`sim-choice ${choiceIndex === 0 ? "sim-choice--top" : ""}`}
                                  key={choice.name}
                                  style={
                                    {
                                      "--pct": `${Math.min(100, choice.pct ?? 0)}%`,
                                    } as CSSProperties
                                  }
                                >
                                  <span className="sim-choice__name">
                                    {choice.name}
                                  </span>
                                  <span className="sim-choice__pct">
                                    {formatPct(choice.pct)}
                                  </span>
                                </span>
                              ))
                            ) : (
                              <span className="meta-line">-</span>
                            )}
                          </div>
                          <span
                            className={`sim-plan__note ${agree ? "" : "sim-plan__note--differs"}`}
                          >
                            {agree ? "Same in every plan" : "Plans differ here"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : null}

              {options.length ? (
                <section className="sim-section">
                  <div className="sim-section__head">
                    <h4 className="fantasy-section-heading">
                      Your next pick — options
                    </h4>
                    <span className="sim-section__sub">
                      Round {safeToText(result.pickOptions?.round)}, pick{" "}
                      {safeToText(result.pickOptions?.overallPick)}
                    </span>
                  </div>
                  <p className="fantasy-tip">
                    "vs default" is what taking this player instead of the
                    default changes about your final lineup. A few points either
                    way is a tie.
                  </p>
                  <div className="compare-table-wrap">
                    <table className="compare-table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Pos</th>
                          <th>Lineup VORP</th>
                          <th>vs default</th>
                          <th>Beats default</th>
                          <th>Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {options.map((option, index) => (
                          <tr key={`${option.name}-${index}`}>
                            <td>
                              {safeToText(option.name)}
                              {option.isDefaultPick ? (
                                <span className="chip"> default</span>
                              ) : null}
                            </td>
                            <td>{safeToText(option.position)}</td>
                            <td>
                              {formatMetricValue(option.expectedLineupVorp)}
                            </td>
                            <td>
                              {formatSigned(option.vsBestValue?.meanDifference)}
                            </td>
                            <td>
                              {formatPct(option.vsBestValue?.beatsBestValuePct)}
                            </td>
                            <td
                              title={
                                option.sampleSize
                                  ? `Based on ${option.sampleSize} simulations — a low count means treat this loosely.`
                                  : undefined
                              }
                            >
                              {formatPct(option.availabilityPct)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {availability.length ? (
                <details className="sim-section">
                  <summary>Will they last until your pick?</summary>
                  <div className="compare-table-wrap">
                    <table className="compare-table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Pos</th>
                          <th>VORP</th>
                          <th>Still available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availability.map((entry, index) => (
                          <tr key={`${entry.name}-${index}`}>
                            <td>{safeToText(entry.name)}</td>
                            <td>{safeToText(entry.position)}</td>
                            <td>{formatMetricValue(entry.vorp)}</td>
                            <td>{formatPct(entry.availabilityPct)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ) : null}

              {result.assumptions?.length ? (
                <details className="sim-section">
                  <summary>How this is modelled</summary>
                  <ul className="plain-list">
                    {result.assumptions.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </article>
          )}
        </div>
      </section>
    </section>
  );
};

export default DraftSimulatorPortal;
