import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { DraftBoardCard } from "../dashboard/DashboardCards";
import type { DraftRosterState } from "../dashboard/DashboardCards";
import type {
  DraftBoardResponse,
  FantasyPlayerCandidate,
  FantasyPosition,
  FantasyScoringId,
  PlayerOption,
} from "../../utils/dashboardTypes";

type DraftBoardPortalProps = {
  draftBoardPosition: FantasyPosition | "ALL";
  draftBoardScoringId: FantasyScoringId;
  draftBoardSeason: string;
  draftBoardTeamCount: string;
  draftBoardStarters: string;
  draftBoardRoster: PlayerOption[];
  draftBoardRosterPick: string;
  draftBoardCandidateOptions: PlayerOption[];
  draftBoard: DraftBoardResponse | null;
  draftState: DraftRosterState;
  loadingDraftBoard: boolean;
  onDraftBoardPositionChange: (position: FantasyPosition | "ALL") => void;
  onDraftBoardScoringIdChange: (scoringId: FantasyScoringId) => void;
  onDraftBoardSeasonChange: (season: string) => void;
  onDraftBoardTeamCountChange: (value: string) => void;
  onDraftBoardStartersChange: (value: string) => void;
  onDraftBoardRosterPickChange: (id: string) => void;
  onAddToRoster: () => void;
  onRemoveFromRoster: (id: string) => void;
  onMarkDrafted: (id: string) => void;
  onDraftCandidate: (candidate: FantasyPlayerCandidate) => void;
  onSubmit: (event: FormEvent) => void;
};

const POSITIONS: Array<FantasyPosition | "ALL"> = [
  "ALL",
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
  "FLEX",
];

const DraftBoardPortal = ({
  draftBoardPosition,
  draftBoardScoringId,
  draftBoardSeason,
  draftBoardTeamCount,
  draftBoardStarters,
  draftBoardRoster,
  draftBoardRosterPick,
  draftBoardCandidateOptions,
  draftBoard,
  draftState,
  loadingDraftBoard,
  onDraftBoardPositionChange,
  onDraftBoardScoringIdChange,
  onDraftBoardSeasonChange,
  onDraftBoardTeamCountChange,
  onDraftBoardStartersChange,
  onDraftBoardRosterPickChange,
  onAddToRoster,
  onRemoveFromRoster,
  onMarkDrafted,
  onDraftCandidate,
  onSubmit,
}: DraftBoardPortalProps) => {
  const rosterLabel = draftBoardRoster.length
    ? draftBoardRoster.map((entry) => entry.label).join(", ")
    : "";

  return (
    <section className="feature-stage feature-stage--draft-board">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/draft-board ranks available candidates into value tiers using projections and ADP.">
          Draft Board
        </h3>
        <p className="helper-note">
          Loaded automatically with everyone available. Adjust your league
          settings below and click Apply Filters if your league differs from
          the defaults.
        </p>
        <label
          htmlFor="draftBoardPosition"
          title="Filters the board to a single position, or FLEX-eligible skill positions. Backend query param: position."
        >
          Position
        </label>
        <select
          id="draftBoardPosition"
          value={draftBoardPosition}
          onChange={(event) =>
            onDraftBoardPositionChange(
              event.target.value as FantasyPosition | "ALL",
            )
          }
        >
          {POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position === "ALL" ? "All Positions" : position}
            </option>
          ))}
        </select>
        <label
          htmlFor="draftBoardScoring"
          title="Changes how projections and rankings are computed: Standard (no PPR bonus), PPR (1 point per reception), Half-PPR (0.5 points per reception)."
        >
          Scoring Format
        </label>
        <select
          id="draftBoardScoring"
          value={draftBoardScoringId}
          onChange={(event) =>
            onDraftBoardScoringIdChange(
              Number(event.target.value) as FantasyScoringId,
            )
          }
        >
          <option value={1}>Standard</option>
          <option value={3}>PPR</option>
          <option value={4}>Half-PPR</option>
        </select>
        <label
          htmlFor="draftBoardSeason"
          title="Leave blank to use the backend's current live season."
        >
          Season (optional)
        </label>
        <input
          id="draftBoardSeason"
          value={draftBoardSeason}
          onChange={(event) => onDraftBoardSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="draftBoardTeamCount"
          title="Matches your real league size — changes the Replacement Baseline used for VORP and tiers."
        >
          Team Count
        </label>
        <input
          id="draftBoardTeamCount"
          value={draftBoardTeamCount}
          onChange={(event) => onDraftBoardTeamCountChange(event.target.value)}
          placeholder="12"
        />
        <label
          htmlFor="draftBoardStarters"
          title="Format: QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1. Leave blank for defaults."
        >
          Starters (optional)
        </label>
        <input
          id="draftBoardStarters"
          value={draftBoardStarters}
          onChange={(event) => onDraftBoardStartersChange(event.target.value)}
          placeholder="QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1"
        />

        <p className="helper-note">
          Drafted by someone else? Search and add them below — the board
          updates immediately, no reload needed.
        </p>
        <SearchableEntitySelect
          id="draftBoardRosterPick"
          label="Mark Player As Drafted"
          value={draftBoardRosterPick}
          onChange={onDraftBoardRosterPickChange}
          options={draftBoardCandidateOptions}
          placeholder="Search a candidate already on the board"
          fallbackPrefix="Player"
          emptyMessage="Load the board first to search candidates."
        />
        <button
          type="button"
          onClick={onAddToRoster}
          disabled={!draftBoardRosterPick}
        >
          Add To Drafted List
        </button>

        {draftBoardRoster.length ? (
          <div className="chip-grid">
            {draftBoardRoster.map((entry) => (
              <span className="chip" key={entry.id}>
                {entry.label}{" "}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${entry.label} from drafted list`}
                  onClick={() => onRemoveFromRoster(entry.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <button type="submit" disabled={loadingDraftBoard}>
          {loadingDraftBoard ? "Applying..." : "Apply Filters"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Draft Board</h2>
          {draftBoard ? (
            <DraftBoardCard
              data={draftBoard}
              rosterLabel={rosterLabel}
              draftState={draftState}
              onMarkDrafted={onMarkDrafted}
              onDraftCandidate={onDraftCandidate}
            />
          ) : (
            <p className="empty-note">
              Loading the draft board...
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default DraftBoardPortal;
