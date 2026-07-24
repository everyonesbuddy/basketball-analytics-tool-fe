import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import {
  TeamEfficiencyCard,
  TeamNeedGapCard,
} from "../dashboard/DashboardCards";
import type {
  TeamEfficiencyResponse,
  TeamNeedGapResponse,
  TeamOption,
  TeamSeasonType,
} from "../../utils/dashboardTypes";

type TeamPortalProps = {
  teamId: string;
  teamGames: string;
  teamSeasonType: TeamSeasonType;
  teamOptions: TeamOption[];
  teamEfficiency: TeamEfficiencyResponse | null;
  teamNeedGap: TeamNeedGapResponse | null;
  loadingTeam: boolean;
  loadingTeamOptions: boolean;
  onTeamIdChange: (id: string) => void;
  onTeamGamesChange: (value: string) => void;
  onTeamSeasonTypeChange: (value: TeamSeasonType) => void;
  onTeamQueryChange: (query: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const TeamPortal = ({
  teamId,
  teamGames,
  teamSeasonType,
  teamOptions,
  teamEfficiency,
  teamNeedGap,
  loadingTeam,
  loadingTeamOptions,
  onTeamIdChange,
  onTeamGamesChange,
  onTeamSeasonTypeChange,
  onTeamQueryChange,
  onSubmit,
}: TeamPortalProps) => {
  const latestSeasonYear =
    Array.isArray(teamEfficiency?.seasonsCovered) &&
    teamEfficiency.seasonsCovered.length
      ? Math.max(...teamEfficiency.seasonsCovered)
      : null;

  const regularLabel = latestSeasonYear
    ? `Regular Season ${latestSeasonYear}`
    : "Regular Season";
  const postseasonLabel = latestSeasonYear
    ? `Postseason ${latestSeasonYear}`
    : "Postseason";

  return (
    <section className="feature-stage feature-stage--team">
      <form onSubmit={onSubmit}>
        <h3 title="Loads team efficiency baseline and derives team need gaps versus league averages.">
          Team Efficiencies + Needs
        </h3>
        <p className="helper-note">
          This view evaluates team efficiencies first, then computes
          strength/gap deltas to surface roster and scheme needs.
        </p>
        <SearchableEntitySelect
          id="teamSelect"
          label="Team Selector"
          value={teamId}
          onChange={onTeamIdChange}
          options={teamOptions}
          disabled={loadingTeamOptions}
          placeholder="Search team by name or ID"
          fallbackPrefix="Team"
          emptyMessage="No matching teams found."
          onQueryChange={onTeamQueryChange}
        />
        <p
          className="selector-note"
          title="teamId path variable used for /teams/:teamId/efficiency and /teams/:teamId/needs requests."
        >
          Selected Team ID: {teamId || "-"}
        </p>
        <label
          htmlFor="teamGames"
          title="Rolling sample of completed games used to derive efficiency and need-gap outputs."
        >
          Recent Games
        </label>
        <input
          id="teamGames"
          value={teamGames}
          onChange={(event) => onTeamGamesChange(event.target.value)}
          placeholder="5"
        />
        <label
          htmlFor="teamSeasonType"
          title="Choose regular season, postseason, or both as the source context for efficiency calculations."
        >
          Season Type
        </label>
        <select
          id="teamSeasonType"
          value={teamSeasonType}
          onChange={(event) =>
            onTeamSeasonTypeChange(event.target.value as TeamSeasonType)
          }
        >
          <option value="regular">{regularLabel}</option>
          <option value="postseason">{postseasonLabel}</option>
          <option value="all">All (Regular + Postseason)</option>
        </select>
        <button type="submit" disabled={loadingTeam || loadingTeamOptions}>
          {loadingTeam ? "Loading..." : "Load Team Efficiency"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2 title="Efficiency baseline with downstream gap diagnostics.">
            Team Efficiency And Need-Gap Readout
          </h2>
          {teamEfficiency ? (
            <>
              <TeamEfficiencyCard
                data={teamEfficiency}
                teamLabel={
                  teamOptions.find((option) => option.id === teamId)?.label ||
                  (teamEfficiency.team as { displayName?: string })
                    ?.displayName ||
                  `Team #${teamId}`
                }
              />
              {teamNeedGap ? (
                <TeamNeedGapCard
                  data={teamNeedGap}
                  teamLabel={
                    teamOptions.find((option) => option.id === teamId)?.label ||
                    (teamEfficiency.team as { displayName?: string })
                      ?.displayName ||
                    `Team #${teamId}`
                  }
                />
              ) : null}
            </>
          ) : (
            <p className="empty-note">
              Load team efficiency to view offense, defense, and net trends.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default TeamPortal;
