import type { FormEvent } from "react";
import {
  FantasyRosterBuilder,
  FantasyTeamGradeCard,
} from "../dashboard/DashboardCards";
import type { RosterSlotAssignments } from "../dashboard/DashboardCards";
import type {
  FantasyPlayerCandidate,
  FantasyScoringId,
  FantasyTeamGradeResponse,
} from "../../utils/dashboardTypes";

type FantasyTeamGradePortalProps = {
  candidatePool: FantasyPlayerCandidate[];
  roster: RosterSlotAssignments;
  scoringId: FantasyScoringId;
  season: string;
  teamCount: string;
  starters: string;
  teamGrade: FantasyTeamGradeResponse | null;
  loadingTeamGrade: boolean;
  onRosterChange: (next: RosterSlotAssignments) => void;
  onScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSeasonChange: (season: string) => void;
  onTeamCountChange: (teamCount: string) => void;
  onStartersChange: (starters: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const FantasyTeamGradePortal = ({
  candidatePool,
  roster,
  scoringId,
  season,
  teamCount,
  starters,
  teamGrade,
  loadingTeamGrade,
  onRosterChange,
  onScoringIdChange,
  onSeasonChange,
  onTeamCountChange,
  onStartersChange,
  onSubmit,
}: FantasyTeamGradePortalProps) => {
  const rosterSize = Object.keys(roster).length;

  return (
    <section className="feature-stage feature-stage--fantasy-grade">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/team-grade grades your roster's starter value and lineup coverage for your league settings.">
          Team / Roster Grade
        </h3>
        <p className="helper-note">
          Add your whole roster (including your D/ST and K) and get a letter
          grade for your starting lineup, plus exactly which slots you're
          short on.
        </p>
        <label htmlFor="fantasyGradeScoring">Scoring Format</label>
        <select
          id="fantasyGradeScoring"
          value={scoringId}
          onChange={(event) =>
            onScoringIdChange(Number(event.target.value) as FantasyScoringId)
          }
        >
          <option value={1}>Standard</option>
          <option value={3}>PPR</option>
          <option value={4}>Half-PPR</option>
        </select>
        <label htmlFor="fantasyGradeSeason" title="Leave blank to use the current live season.">
          Season (optional)
        </label>
        <input
          id="fantasyGradeSeason"
          value={season}
          onChange={(event) => onSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="fantasyGradeTeamCount"
          title="Matches your real league size — changes the Replacement Baseline used for VORP."
        >
          Team Count
        </label>
        <input
          id="fantasyGradeTeamCount"
          value={teamCount}
          onChange={(event) => onTeamCountChange(event.target.value)}
          placeholder="12"
        />
        <label
          htmlFor="fantasyGradeStarters"
          title="Format: QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1. These are your team's starting slots, not the league's."
        >
          Starters (optional)
        </label>
        <input
          id="fantasyGradeStarters"
          value={starters}
          onChange={(event) => onStartersChange(event.target.value)}
          placeholder="QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1"
        />

        <FantasyRosterBuilder
          title="Your Roster"
          hint="Click a slot to add a player. Bench slots hold the rest of your roster."
          starters={starters}
          candidates={candidatePool}
          assignments={roster}
          onChange={onRosterChange}
        />

        <button type="submit" disabled={loadingTeamGrade || !rosterSize}>
          {loadingTeamGrade ? "Grading..." : "Grade My Roster"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Roster Grade Readout</h2>
          {teamGrade ? (
            <FantasyTeamGradeCard data={teamGrade} />
          ) : (
            <p className="empty-note">
              Add your roster and grade it to see your starting lineup
              strength and any missing slots.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default FantasyTeamGradePortal;
