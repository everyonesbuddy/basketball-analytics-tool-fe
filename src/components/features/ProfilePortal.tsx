import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { IdentityCard, PlayerOverviewChart } from "../dashboard/DashboardCards";
import {
  getPlayerOverviewMetricsBySplit,
  getPlayerSplitOptions,
} from "../../utils/dashboardFormatters";
import type { PlayerOption, PlayerProfile } from "../../utils/dashboardTypes";

type ProfilePortalProps = {
  playerId: string;
  playerOptions: PlayerOption[];
  player: PlayerProfile | null;
  loadingOptions: boolean;
  loadingSingle: boolean;
  onPlayerIdChange: (id: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const ProfilePortal = ({
  playerId,
  playerOptions,
  player,
  loadingOptions,
  loadingSingle,
  onPlayerIdChange,
  onSubmit,
}: ProfilePortalProps) => {
  const [selectedSplitKey, setSelectedSplitKey] = useState("regularseason");

  const splitOptions = useMemo(
    () => (player ? getPlayerSplitOptions(player) : []),
    [player],
  );

  useEffect(() => {
    if (!splitOptions.length) {
      setSelectedSplitKey("regularseason");
      return;
    }

    if (!splitOptions.some((option) => option.key === selectedSplitKey)) {
      setSelectedSplitKey(splitOptions[0].key);
    }
  }, [splitOptions, selectedSplitKey]);

  const selectedSplitLabel =
    splitOptions.find((option) => option.key === selectedSplitKey)?.label ||
    "Regular Season";

  const selectedMetrics = player
    ? getPlayerOverviewMetricsBySplit(player, selectedSplitKey)
    : [];

  return (
    <section className="feature-stage feature-stage--profile">
      <form onSubmit={onSubmit}>
        <h3 title="GET /players/:athleteId returns normalized player identity, split summary rows, and optional embedded impact context.">
          Single Profile
        </h3>
        <SearchableEntitySelect
          id="singlePlayerSelect"
          label="Player Selector"
          value={playerId}
          onChange={onPlayerIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <button type="submit" disabled={loadingSingle || loadingOptions}>
          {loadingSingle ? "Loading..." : "Load Profile"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Single Player Readout</h2>
          {player ? (
            <>
              <PlayerOverviewChart
                player={player}
                metricsOverride={selectedMetrics}
                splitLabel={selectedSplitLabel}
                headerControl={
                  <div className="viz-header-controls">
                    <label
                      htmlFor="singleProfileSplitSelect"
                      title="Selects which normalized split row feeds the chart: Regular Season, Post Season, or Career when available."
                    >
                      Chart Data Source
                    </label>
                    <select
                      id="singleProfileSplitSelect"
                      value={selectedSplitKey}
                      onChange={(event) =>
                        setSelectedSplitKey(event.target.value)
                      }
                    >
                      {splitOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                }
              />
              <IdentityCard player={player} />
            </>
          ) : (
            <p className="empty-note">
              Load a player profile to start scouting analysis.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default ProfilePortal;
