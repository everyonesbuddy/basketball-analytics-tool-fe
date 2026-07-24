import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { PlayerTrajectoryCard } from "../dashboard/DashboardCards";
import type {
  PlayerOption,
  PlayerTrajectoryResponse,
  TeamSeasonType,
} from "../../utils/dashboardTypes";

type TrajectoryPortalProps = {
  trajectoryPlayerId: string;
  trajectoryGames: string;
  trajectoryWindow: string;
  trajectorySeasonType: TeamSeasonType;
  playerOptions: PlayerOption[];
  playerTrajectory: PlayerTrajectoryResponse | null;
  loadingOptions: boolean;
  loadingTrajectory: boolean;
  onTrajectoryPlayerIdChange: (id: string) => void;
  onTrajectoryGamesChange: (value: string) => void;
  onTrajectoryWindowChange: (value: string) => void;
  onTrajectorySeasonTypeChange: (value: TeamSeasonType) => void;
  onSubmit: (event: FormEvent) => void;
};

const TrajectoryPortal = ({
  trajectoryPlayerId,
  trajectoryGames,
  trajectoryWindow,
  trajectorySeasonType,
  playerOptions,
  playerTrajectory,
  loadingOptions,
  loadingTrajectory,
  onTrajectoryPlayerIdChange,
  onTrajectoryGamesChange,
  onTrajectoryWindowChange,
  onTrajectorySeasonTypeChange,
  onSubmit,
}: TrajectoryPortalProps) => {
  return (
    <section className="feature-stage feature-stage--impact">
      <form onSubmit={onSubmit}>
        <h3 title="Development Curve tracks rolling performance trends over recent games.">
          Development Curve
        </h3>
        <p className="helper-note">
          Rolling averages smooth game-to-game variance to highlight trajectory
          direction for production and efficiency.
        </p>
        <SearchableEntitySelect
          id="trajectoryPlayerSelect"
          label="Player Selector"
          value={trajectoryPlayerId}
          onChange={onTrajectoryPlayerIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <label
          htmlFor="trajectoryGames"
          title="Endpoint query variable: games. Number of recent completed games pulled into trajectory analysis. Backend clamp: 5 to 30."
        >
          Recent Games
        </label>
        <input
          id="trajectoryGames"
          value={trajectoryGames}
          onChange={(event) => onTrajectoryGamesChange(event.target.value)}
          placeholder="20"
        />
        <label
          htmlFor="trajectoryWindow"
          title="Endpoint query variable: window. Rolling Window size N: each trajectory point averages the latest N valid games up to that game. Backend clamp: 2 to 20."
        >
          Rolling Window
        </label>
        <input
          id="trajectoryWindow"
          value={trajectoryWindow}
          onChange={(event) => onTrajectoryWindowChange(event.target.value)}
          placeholder="5"
        />
        <label
          htmlFor="trajectorySeasonType"
          title="Endpoint query variable: seasonType. Filters trajectory source games to regular, postseason, or all."
        >
          Season Type
        </label>
        <select
          id="trajectorySeasonType"
          value={trajectorySeasonType}
          onChange={(event) =>
            onTrajectorySeasonTypeChange(event.target.value as TeamSeasonType)
          }
        >
          <option value="regular">Regular Season</option>
          <option value="postseason">Postseason</option>
          <option value="all">All (Regular + Postseason)</option>
        </select>
        <button type="submit" disabled={loadingTrajectory || loadingOptions}>
          {loadingTrajectory ? "Loading..." : "Load Development Curve"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Development Curve</h2>
          {playerTrajectory ? (
            <PlayerTrajectoryCard
              data={playerTrajectory}
              playerLabel={
                playerOptions.find((option) => option.id === trajectoryPlayerId)
                  ?.label ?? `Athlete #${trajectoryPlayerId}`
              }
            />
          ) : (
            <p className="empty-note">
              Load development curve to inspect rolling production trends.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default TrajectoryPortal;
