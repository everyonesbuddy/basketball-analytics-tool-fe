import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { PlayerImpactCard } from "../dashboard/DashboardCards";
import type {
  PlayerImpactResponse,
  PlayerOption,
  TeamSeasonType,
} from "../../utils/dashboardTypes";

type ImpactPortalProps = {
  impactPlayerId: string;
  impactGames: string;
  impactSeasonType: TeamSeasonType;
  playerOptions: PlayerOption[];
  impact: PlayerImpactResponse | null;
  loadingOptions: boolean;
  loadingImpact: boolean;
  onImpactPlayerIdChange: (id: string) => void;
  onImpactGamesChange: (value: string) => void;
  onImpactSeasonTypeChange: (value: TeamSeasonType) => void;
  onSubmit: (event: FormEvent) => void;
};

const ImpactPortal = ({
  impactPlayerId,
  impactGames,
  impactSeasonType,
  playerOptions,
  impact,
  loadingOptions,
  loadingImpact,
  onImpactPlayerIdChange,
  onImpactGamesChange,
  onImpactSeasonTypeChange,
  onSubmit,
}: ImpactPortalProps) => {
  return (
    <section className="feature-stage feature-stage--impact">
      <form onSubmit={onSubmit}>
        <h3 title="GET /players/:athleteId/impact returns plus-minus trend rows with season tags and rolling analytics.">
          Player Impact
        </h3>
        <SearchableEntitySelect
          id="impactPlayerSelect"
          label="Player Selector"
          value={impactPlayerId}
          onChange={onImpactPlayerIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <label
          htmlFor="impactGames"
          title="Endpoint query variable: games. Number of recent completed games requested for trend and aggregate plus-minus. Backend clamp: 1 to 100."
        >
          Recent Games
        </label>
        <input
          id="impactGames"
          value={impactGames}
          onChange={(event) => onImpactGamesChange(event.target.value)}
          placeholder="10"
        />
        <label
          htmlFor="impactSeasonType"
          title="Endpoint query variable: seasonType. Filters impact trend rows to regular, postseason, or all."
        >
          Season Type
        </label>
        <select
          id="impactSeasonType"
          value={impactSeasonType}
          onChange={(event) =>
            onImpactSeasonTypeChange(event.target.value as TeamSeasonType)
          }
        >
          <option value="regular">Regular Season</option>
          <option value="postseason">Postseason</option>
          <option value="all">All (Regular + Postseason)</option>
        </select>
        <button type="submit" disabled={loadingImpact || loadingOptions}>
          {loadingImpact ? "Loading..." : "Load Impact"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Player Impact</h2>
          {impact ? (
            <PlayerImpactCard
              data={impact}
              playerLabel={
                playerOptions.find((option) => option.id === impactPlayerId)
                  ?.label ?? `Athlete #${impactPlayerId}`
              }
            />
          ) : (
            <p className="empty-note">
              Load a player impact report to inspect plus-minus trends.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default ImpactPortal;
