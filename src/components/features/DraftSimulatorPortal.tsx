import { useState } from "react";
import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { fetchFantasyDraftSimulator } from "../../utils/dashboardApi";
import { safeToText } from "../../utils/dashboardFormatters";
import { formatMetricValue } from "../dashboard/DashboardCards";
import type {
  DraftSimulatorResponse,
  DraftSimulatorSport,
  DraftSimulatorStrategy,
  FantasyScoringId,
  PlayerOption,
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

const formatMix = (mix: Record<string, number> | null | undefined) =>
  mix
    ? Object.entries(mix)
        .map(([position, count]) => `${position} ${formatMetricValue(count)}`)
        .join(" · ")
    : "-";

const formatPct = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : `${formatMetricValue(value)}%`;

type DraftSimulatorPortalProps = {
  sport: DraftSimulatorSport;
  // Every player id drafted so far, in pick order.
  pickIds: string[];
  pickLabels: Record<string, string>;
  teamCount: string;
  starters: string;
  season: string;
  scoringId?: FantasyScoringId;
  forceRefresh: boolean;
  // Players still on the board, for logging picks without leaving this page.
  playerOptions?: PlayerOption[];
  onLogPick?: (id: string) => void;
  onRemovePick?: (id: string) => void;
};

const DraftSimulatorPortal = ({
  sport,
  pickIds,
  pickLabels,
  teamCount,
  starters,
  season,
  scoringId,
  forceRefresh,
  playerOptions,
  onLogPick,
  onRemovePick,
}: DraftSimulatorPortalProps) => {
  const [pickChoice, setPickChoice] = useState("");
  const [saved] = useState(() => readSettings(sport));
  const [draftPosition, setDraftPosition] = useState(saved.draftPosition);
  const [simulations, setSimulations] = useState(saved.simulations);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<DraftSimulatorResponse | null>(null);
  const [ranWith, setRanWith] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickKey = pickIds.join(",");
  const stale = Boolean(result) && ranWith !== pickKey;
  const teams = Number(teamCount) > 0 ? Number(teamCount) : 12;
  const strategies = result?.strategies ?? [];

  const toggleStrategy = (key: string) =>
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  const run = async (event?: FormEvent) => {
    event?.preventDefault();
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

  // The plan of the top-ranked direction is what "Your move" follows.
  const bestStrategy = [...strategies].sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99),
  )[0];
  const planEntries = bestStrategy?.pickPlan ?? [];
  const planNow =
    planEntries.find((entry) => entry.overallPick === nextPick?.overallPick) ??
    planEntries.find((entry) => entry.topChoices?.length);
  const planChoices = [...(planNow?.topChoices ?? [])].sort(
    (a, b) => (b.pct ?? 0) - (a.pct ?? 0),
  );
  const planAhead = planEntries
    .filter(
      (entry) =>
        (entry.overallPick ?? 0) > (planNow?.overallPick ?? 0) &&
        entry.topChoices?.length,
    )
    .slice(0, 3);
  const findPlayerId = (name: string) =>
    playerOptions?.find((option) => option.label.startsWith(`${name} (`))?.id;

  return (
    <section className="feature-stage feature-stage--draft-sim">
      <form onSubmit={run}>
        <span className="fantasy-badge">
          {sport === "nba" ? "NBA Fantasy" : "NFL Fantasy"}
        </span>
        <h3>Draft Simulator</h3>
        <p className="helper-note">
          The simulator only knows the picks logged below. Log{" "}
          <strong>every</strong> pick made so far — yours and everyone else's —
          in the order they happened, or it will advise you as if the draft
          hasn't started.
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
        {onLogPick && playerOptions ? (
          <>
            <SearchableEntitySelect
              id={`${sport}SimLogPick`}
              label={`Log pick #${pickIds.length + 1}`}
              value={pickChoice}
              onChange={setPickChoice}
              options={playerOptions}
              placeholder="Search the player who was just taken"
              fallbackPrefix="Player"
            />
            <button
              type="button"
              disabled={!pickChoice}
              onClick={() => {
                onLogPick(pickChoice);
                setPickChoice("");
              }}
            >
              Log pick
            </button>
          </>
        ) : null}
        <div className="sim-strategies">
          <span className="helper-note">
            Strategies to compare (none selected = all):
          </span>
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
        </div>
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
          {pickIds.length ? (
            <div className="chip-grid">
              {pickIds.map((id, index) => (
                <span className="chip" key={id}>
                  {index + 1}. {pickLabels[id] ?? `Player #${id}`}
                  {onRemovePick ? (
                    <button
                      type="button"
                      className="chip-remove"
                      aria-label={`Remove pick ${index + 1}`}
                      onClick={() => onRemovePick(id)}
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            <p className="callout-note">
              No picks logged yet, so results describe the very start of the
              draft. If you're further along, log the picks first.
            </p>
          )}
          {!result ? (
            <p className="empty-note">
              Set your draft slot and run the simulation to see which direction
              looks strongest and what to do at your next pick.
            </p>
          ) : (
            <article className="scout-card fantasy-card">
              {stale ? (
                <p className="callout-note">
                  The draft has changed since this run.{" "}
                  <button
                    type="button"
                    className="fantasy-draft-button"
                    disabled={loading}
                    onClick={() => void run()}
                  >
                    {loading ? "Updating..." : "Update plan"}
                  </button>
                </p>
              ) : null}

              {planChoices.length && bestStrategy ? (
                <section className="sim-move">
                  <p className="sim-move__label">
                    Your move — pick {safeToText(planNow?.overallPick)} (round{" "}
                    {safeToText(planNow?.round)})
                  </p>
                  {planChoices.map((choice, index) => {
                    const id = findPlayerId(choice.name);
                    return (
                      <div
                        className={`sim-move__row ${index === 0 ? "sim-move__row--top" : ""}`}
                        key={choice.name}
                      >
                        <span className="sim-move__pct">
                          {formatPct(choice.pct)}
                        </span>
                        <strong className="sim-move__player">
                          {choice.name}
                        </strong>
                        {id && onLogPick ? (
                          <button
                            type="button"
                            className="fantasy-draft-button"
                            onClick={() => onLogPick(id)}
                          >
                            Take
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                  <p className="meta-line">
                    Highest percentage first, from the{" "}
                    {strategyLabel(bestStrategy)} plan (the top-ranked direction). If
                    your first choice is gone, take the next one down.
                  </p>
                  {planAhead.length ? (
                    <p className="meta-line">
                      Then:{" "}
                      {planAhead
                        .map((entry) => {
                          const top = [...(entry.topChoices ?? [])].sort(
                            (a, b) => (b.pct ?? 0) - (a.pct ?? 0),
                          )[0];
                          return `R${safeToText(entry.round)} ${top.name} ${formatPct(top.pct)}`;
                        })
                        .join(" → ")}
                    </p>
                  ) : null}
                </section>
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
                <div className="overview-pill">
                  <p className="overview-pill-label">Simulations</p>
                  <p className="overview-pill-value">
                    {formatMetricValue(result.simulations)}
                  </p>
                </div>
              </div>

              <p className="fantasy-tip">
                "Your next pick" is the overall pick number you're on the clock
                for. With {pickIds.length} picks logged, your next turn is pick{" "}
                {pickIds.length + 1} or later.
              </p>

              {options.length ? (
                <section className="context-wrap">
                  <h4 className="fantasy-section-heading">
                    Your next pick — options (round{" "}
                    {safeToText(result.pickOptions?.round)}, pick{" "}
                    {safeToText(result.pickOptions?.overallPick)})
                  </h4>
                  <p className="fantasy-tip">
                    "vs default" is how taking this player instead of the
                    default pick changes your final lineup VORP. Differences of
                    a few points are ties — the default is the most common pick,
                    not the only good one.
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
                              {formatMetricValue(
                                option.vsBestValue?.meanDifference,
                              )}
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
                <section className="context-wrap">
                  <h4 className="fantasy-section-heading">
                    Will they last until your pick?
                  </h4>
                  <p className="fantasy-tip">
                    Seen a player go off the board? Click Taken to log it fast,
                    then Update plan.
                  </p>
                  <div className="compare-table-wrap">
                    <table className="compare-table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Pos</th>
                          <th>VORP</th>
                          <th>Still available</th>
                          {onLogPick ? <th /> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {availability.map((entry, index) => {
                          const id = findPlayerId(entry.name);
                          return (
                            <tr key={`${entry.name}-${index}`}>
                              <td>{safeToText(entry.name)}</td>
                              <td>{safeToText(entry.position)}</td>
                              <td>{formatMetricValue(entry.vorp)}</td>
                              <td>{formatPct(entry.availabilityPct)}</td>
                              {onLogPick ? (
                                <td>
                                  {id ? (
                                    <button
                                      type="button"
                                      onClick={() => onLogPick(id)}
                                    >
                                      Taken
                                    </button>
                                  ) : null}
                                </td>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {strategies.length ? (
                <section className="context-wrap">
                  <h4 className="fantasy-section-heading">
                    Draft directions, ranked
                  </h4>
                  <p className="fantasy-tip">
                    Best value usually ranks first because it adapts to the
                    draft. A trailing strategy isn't wrong — the gap is what the
                    plan costs. Compare the differences, not the raw totals.
                  </p>
                  <div className="compare-table-wrap">
                    <table className="compare-table">
                      <thead>
                        <tr>
                          <th>Strategy</th>
                          <th>Avg lineup VORP</th>
                          <th>P10 – P90</th>
                          <th>vs best value</th>
                          <th>Beats best value</th>
                          <th>Lineup filled</th>
                          <th>Builds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {strategies.map((strategy, index) => (
                          <tr key={`${strategyLabel(strategy)}-${index}`}>
                            <td>{strategyLabel(strategy)}</td>
                            <td>
                              {formatMetricValue(strategy.starterVorp?.mean)}
                            </td>
                            <td>
                              {formatMetricValue(strategy.starterVorp?.p10)} –{" "}
                              {formatMetricValue(strategy.starterVorp?.p90)}
                            </td>
                            <td>
                              {formatMetricValue(
                                strategy.vsBestValue?.meanDifference,
                              )}
                            </td>
                            <td>
                              {formatPct(
                                strategy.vsBestValue?.beatsBestValuePct,
                              )}
                            </td>
                            <td>{formatPct(strategy.lineupCompletePct)}</td>
                            <td>{formatMix(strategy.positionMix)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {strategies.map((strategy, index) =>
                    strategy.pickPlan?.length ? (
                      <details
                        className="context-wrap"
                        key={`plan-${strategyLabel(strategy)}-${index}`}
                      >
                        <summary>
                          Round-by-round plan: {strategyLabel(strategy)}
                        </summary>
                        <ol className="plain-list">
                          {strategy.pickPlan.map((entry, planIndex) => (
                            <li key={planIndex}>
                              Round {safeToText(entry.round ?? planIndex + 1)}
                              {entry.overallPick
                                ? ` (pick ${safeToText(entry.overallPick)})`
                                : ""}
                              :{" "}
                              {entry.topChoices?.length
                                ? entry.topChoices
                                    .map(
                                      (choice) =>
                                        `${choice.name} ${formatPct(choice.pct)}`,
                                    )
                                    .join(" · ")
                                : "-"}
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : null,
                  )}
                </section>
              ) : null}

              {result.assumptions?.length ? (
                <details className="context-wrap">
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
