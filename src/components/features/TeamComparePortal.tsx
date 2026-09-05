import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { TeamCompareCard } from "../dashboard/DashboardCards";
import type {
  TeamCompareResponse,
  TeamOption,
  TeamSeasonType,
} from "../../utils/dashboardTypes";

type TeamComparePortalProps = {
  teamAId: string;
  teamBId: string;
  teamGames: string;
  teamSeasonType: TeamSeasonType;
  teamOptions: TeamOption[];
  teamCompare: TeamCompareResponse | null;
  loadingTeamCompare: boolean;
  loadingTeamOptions: boolean;
  onTeamAIdChange: (id: string) => void;
  onTeamBIdChange: (id: string) => void;
  onTeamGamesChange: (value: string) => void;
  onTeamSeasonTypeChange: (value: TeamSeasonType) => void;
  onSubmit: (event: FormEvent) => void;
};

const TeamComparePortal = ({
  teamAId,
  teamBId,
  teamGames,
  teamSeasonType,
  teamOptions,
  teamCompare,
  loadingTeamCompare,
  loadingTeamOptions,
  onTeamAIdChange,
  onTeamBIdChange,
  onTeamGamesChange,
  onTeamSeasonTypeChange,
  onSubmit,
}: TeamComparePortalProps) => {
  return (
    <section className="feature-stage feature-stage--team-compare">
      <form onSubmit={onSubmit}>
        <h3 title="GET /api/teams/compare/head-to-head compares two teams' recent efficiency and grades.">
          Team Head-to-Head
        </h3>
        <p className="helper-note">
          Pick two teams and see who's playing better right now, based on
          their last few games — not a permanent power ranking.
        </p>
        <SearchableEntitySelect
          id="teamCompareASelect"
          label="Team A"
          value={teamAId}
          onChange={onTeamAIdChange}
          options={teamOptions}
          disabled={loadingTeamOptions}
          placeholder="Search team by name or ID"
          fallbackPrefix="Team"
        />
        <SearchableEntitySelect
          id="teamCompareBSelect"
          label="Team B"
          value={teamBId}
          onChange={onTeamBIdChange}
          options={teamOptions}
          disabled={loadingTeamOptions}
          placeholder="Search team by name or ID"
          fallbackPrefix="Team"
        />
        <label
          htmlFor="teamCompareGames"
          title="Rolling sample of completed games used for both teams."
        >
          Recent Games
        </label>
        <input
          id="teamCompareGames"
          value={teamGames}
          onChange={(event) => onTeamGamesChange(event.target.value)}
          placeholder="5"
        />
        <label htmlFor="teamCompareSeasonType">Season Type</label>
        <select
          id="teamCompareSeasonType"
          value={teamSeasonType}
          onChange={(event) =>
            onTeamSeasonTypeChange(event.target.value as TeamSeasonType)
          }
        >
          <option value="regular">Regular Season</option>
          <option value="postseason">Postseason</option>
          <option value="all">All (Regular + Postseason)</option>
        </select>
        <button
          type="submit"
          disabled={loadingTeamCompare || loadingTeamOptions || teamAId === teamBId}
        >
          {loadingTeamCompare ? "Loading..." : "Compare Teams"}
        </button>
        {teamAId && teamAId === teamBId ? (
          <p className="error-note">Pick two different teams to compare.</p>
        ) : null}
      </form>

      <section className="results-zone">
        <div>
          <h2>Head-to-Head Readout</h2>
          {teamCompare ? (
            <TeamCompareCard data={teamCompare} />
          ) : (
            <p className="empty-note">
              Pick two teams and compare to see who's playing better lately.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default TeamComparePortal;
