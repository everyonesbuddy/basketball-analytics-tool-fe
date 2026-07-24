import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import {
  ComparisonChart,
  ComparisonMatrix,
  IdentityCard,
} from "../dashboard/DashboardCards";
import {
  formatCompareSplitLabelWithYear,
  type ComparableSplitMetrics,
} from "../../utils/dashboardFormatters";
import type { PlayerOption, PlayerProfile } from "../../utils/dashboardTypes";

type ComparePortalProps = {
  playerId: string;
  playerBId: string;
  playerOptions: PlayerOption[];
  comparison: PlayerProfile[];
  compareSplitGroups: ComparableSplitMetrics[];
  loadingOptions: boolean;
  loadingCompare: boolean;
  onPlayerIdChange: (id: string) => void;
  onPlayerBIdChange: (id: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const ComparePortal = ({
  playerId,
  playerBId,
  playerOptions,
  comparison,
  compareSplitGroups,
  loadingOptions,
  loadingCompare,
  onPlayerIdChange,
  onPlayerBIdChange,
  onSubmit,
}: ComparePortalProps) => {
  const [selectedSplitKey, setSelectedSplitKey] = useState("");

  const splitOptions = useMemo(() => {
    const supported = compareSplitGroups.filter((split) => {
      const key = split.key.toLowerCase();
      return (
        key.includes("regularseason") ||
        key.includes("postseason") ||
        key.includes("career")
      );
    });

    return supported.length ? supported : compareSplitGroups;
  }, [compareSplitGroups]);

  useEffect(() => {
    if (!splitOptions.length) {
      setSelectedSplitKey("");
      return;
    }

    const regularSeasonSplit = splitOptions.find((split) =>
      split.key.includes("regularseason"),
    );

    const defaultKey = regularSeasonSplit?.key || splitOptions[0].key;

    if (!splitOptions.some((split) => split.key === selectedSplitKey)) {
      setSelectedSplitKey(defaultKey);
    }
  }, [selectedSplitKey, splitOptions]);

  const activeSplit = useMemo(
    () => splitOptions.find((split) => split.key === selectedSplitKey),
    [selectedSplitKey, splitOptions],
  );

  const selectedSplit = activeSplit ?? splitOptions[0] ?? null;

  const selectedSplitLabel = selectedSplit
    ? formatCompareSplitLabelWithYear(
        comparison[0],
        comparison[1],
        selectedSplit.label,
      )
    : "Comparison Split";

  const selectedSplitMetrics = selectedSplit?.metrics ?? [];
  const playerALabel =
    comparison[0]?.identity.shortName || comparison[0]?.identity.displayName;
  const playerBLabel =
    comparison[1]?.identity.shortName || comparison[1]?.identity.displayName;

  const playerAMetricCount = selectedSplitMetrics.filter(
    (metric) => metric.playerA !== null,
  ).length;
  const playerBMetricCount = selectedSplitMetrics.filter(
    (metric) => metric.playerB !== null,
  ).length;

  const hasPartialCoverage =
    selectedSplitMetrics.length > 0 &&
    (playerAMetricCount !== playerBMetricCount ||
      playerAMetricCount === 0 ||
      playerBMetricCount === 0);

  const coverageMessage = hasPartialCoverage
    ? `${playerALabel || "Player A"}: ${playerAMetricCount} stats | ${playerBLabel || "Player B"}: ${playerBMetricCount} stats in ${selectedSplitLabel}.`
    : "";

  return (
    <section className="feature-stage feature-stage--compare">
      <form onSubmit={onSubmit}>
        <h3 title="GET /players/compare/head-to-head compares two normalized player profiles across common summary metrics.">
          Head-to-Head
        </h3>
        <SearchableEntitySelect
          id="playerASelect"
          label="Player A Selector"
          value={playerId}
          onChange={onPlayerIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <SearchableEntitySelect
          id="playerBSelect"
          label="Player B Selector"
          value={playerBId}
          onChange={onPlayerBIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <button type="submit" disabled={loadingCompare || loadingOptions}>
          {loadingCompare ? "Comparing..." : "Compare Players"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Comparison Bench</h2>
          {comparison.length ? (
            <>
              {splitOptions.length ? (
                <>
                  <ComparisonChart
                    playerA={comparison[0]}
                    playerB={comparison[1]}
                    splitLabel={selectedSplitLabel}
                    metrics={selectedSplitMetrics}
                    headerControl={
                      <div className="viz-header-controls">
                        <label
                          htmlFor="compareSplitSelect"
                          title="Selects shared split context for comparison metrics; only splits present for both players are shown."
                        >
                          Compare Data Source
                        </label>
                        <select
                          id="compareSplitSelect"
                          value={selectedSplit?.key ?? ""}
                          onChange={(event) =>
                            setSelectedSplitKey(event.target.value)
                          }
                        >
                          {splitOptions.map((split) => (
                            <option key={split.key} value={split.key}>
                              {formatCompareSplitLabelWithYear(
                                comparison[0],
                                comparison[1],
                                split.label,
                              )}
                            </option>
                          ))}
                        </select>
                      </div>
                    }
                  />
                  {hasPartialCoverage ? (
                    <p className="helper-note coverage-note" role="status">
                      Partial coverage: {coverageMessage}
                    </p>
                  ) : null}
                  <ComparisonMatrix
                    playerA={comparison[0]}
                    playerB={comparison[1]}
                    splitLabel={selectedSplitLabel}
                    metrics={selectedSplitMetrics}
                  />
                </>
              ) : (
                <p className="empty-note">
                  No shared split metrics were found for this pair. Try another
                  player combination.
                </p>
              )}
              <div className="comparison-grid">
                {comparison.map((entry) => (
                  <IdentityCard key={entry.identity.id} player={entry} />
                ))}
              </div>
            </>
          ) : (
            <p className="empty-note">
              Run head-to-head to compare player contracts and summary splits.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default ComparePortal;
