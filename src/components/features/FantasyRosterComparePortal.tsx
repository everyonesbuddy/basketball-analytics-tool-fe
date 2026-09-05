import type { FormEvent } from "react";
import {
  FantasyRosterBuilder,
  FantasyRosterCompareCard,
} from "../dashboard/DashboardCards";
import type { RosterSlotAssignments } from "../dashboard/DashboardCards";
import type {
  FantasyPlayerCandidate,
  FantasyRosterCompareResponse,
  FantasyScoringId,
} from "../../utils/dashboardTypes";

type FantasyRosterComparePortalProps = {
  candidatePool: FantasyPlayerCandidate[];
  rosterA: RosterSlotAssignments;
  rosterB: RosterSlotAssignments;
  scoringId: FantasyScoringId;
  season: string;
  teamCount: string;
  starters: string;
  rosterCompare: FantasyRosterCompareResponse | null;
  loadingCompare: boolean;
  onRosterAChange: (next: RosterSlotAssignments) => void;
  onRosterBChange: (next: RosterSlotAssignments) => void;
  onScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSeasonChange: (season: string) => void;
  onTeamCountChange: (teamCount: string) => void;
  onStartersChange: (starters: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const FantasyRosterComparePortal = ({
  candidatePool,
  rosterA,
  rosterB,
  scoringId,
  season,
  teamCount,
  starters,
  rosterCompare,
  loadingCompare,
  onRosterAChange,
  onRosterBChange,
  onScoringIdChange,
  onSeasonChange,
  onTeamCountChange,
  onStartersChange,
  onSubmit,
}: FantasyRosterComparePortalProps) => {
  const rosterAIds = new Set(
    Object.values(rosterA).map((player) => String(player.id)),
  );
  const rosterBIds = new Set(
    Object.values(rosterB).map((player) => String(player.id)),
  );

  return (
    <section className="feature-stage feature-stage--fantasy-compare">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/compare/head-to-head compares two full rosters' best starting lineups on VORP.">
          Roster Head-to-Head
        </h3>
        <p className="helper-note">
          Build both full rosters and see which one has the stronger starting
          lineup right now — this compares best-starters-vs-best-starters,
          not just adding up every player.
        </p>

        <label htmlFor="fantasyRosterCompareScoring">Scoring Format</label>
        <select
          id="fantasyRosterCompareScoring"
          value={scoringId}
          onChange={(event) =>
            onScoringIdChange(Number(event.target.value) as FantasyScoringId)
          }
        >
          <option value={1}>Standard</option>
          <option value={3}>PPR</option>
          <option value={4}>Half-PPR</option>
        </select>
        <label
          htmlFor="fantasyRosterCompareSeason"
          title="Leave blank to use the current live season."
        >
          Season (optional)
        </label>
        <input
          id="fantasyRosterCompareSeason"
          value={season}
          onChange={(event) => onSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="fantasyRosterCompareTeamCount"
          title="Matches your real league size — changes the Replacement Baseline used for VORP."
        >
          Team Count
        </label>
        <input
          id="fantasyRosterCompareTeamCount"
          value={teamCount}
          onChange={(event) => onTeamCountChange(event.target.value)}
          placeholder="12"
        />
        <label
          htmlFor="fantasyRosterCompareStarters"
          title="Format: QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1. These are each team's starting slots."
        >
          Starters (optional)
        </label>
        <input
          id="fantasyRosterCompareStarters"
          value={starters}
          onChange={(event) => onStartersChange(event.target.value)}
          placeholder="QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1"
        />

        <FantasyRosterBuilder
          title="Roster A"
          starters={starters}
          candidates={candidatePool}
          assignments={rosterA}
          unavailableIds={rosterBIds}
          onChange={onRosterAChange}
        />

        <FantasyRosterBuilder
          title="Roster B"
          starters={starters}
          candidates={candidatePool}
          assignments={rosterB}
          unavailableIds={rosterAIds}
          onChange={onRosterBChange}
        />

        <button
          type="submit"
          disabled={
            loadingCompare || !rosterAIds.size || !rosterBIds.size
          }
        >
          {loadingCompare ? "Comparing..." : "Compare Rosters"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Roster Compare Readout</h2>
          {rosterCompare ? (
            <FantasyRosterCompareCard data={rosterCompare} />
          ) : (
            <p className="empty-note">
              Add both rosters and compare to see which starting lineup is
              stronger.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default FantasyRosterComparePortal;
