import type { FormEvent } from "react";
import { SleepersCard } from "../dashboard/DashboardCards";
import type {
  FantasyPosition,
  FantasyScoringId,
  SleepersResponse,
} from "../../utils/dashboardTypes";

type SleepersPortalProps = {
  sleepersScoringId: FantasyScoringId;
  sleepersSeason: string;
  sleepersPositionFilter: FantasyPosition | "ALL";
  sleepers: SleepersResponse | null;
  loadingSleepers: boolean;
  onSleepersScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSleepersSeasonChange: (season: string) => void;
  onSleepersPositionFilterChange: (position: FantasyPosition | "ALL") => void;
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
];

const SleepersPortal = ({
  sleepersScoringId,
  sleepersSeason,
  sleepersPositionFilter,
  sleepers,
  loadingSleepers,
  onSleepersScoringIdChange,
  onSleepersSeasonChange,
  onSleepersPositionFilterChange,
  onSubmit,
}: SleepersPortalProps) => {
  return (
    <section className="feature-stage feature-stage--sleepers">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge fantasy-badge--sleepers">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/sleepers ranks draft-day value gaps by ADP delta against position peers. Labeled Draft Values, not guaranteed sleepers.">
          Draft Values
        </h3>
        <p className="helper-note">
          Finds players other leagues are drafting later than their
          projection says they should go — a heads-up on value, not a
          promise. Best used right before or during your draft.
        </p>
        <label
          htmlFor="sleepersScoring"
          title="Changes how projections and rankings are computed: Standard (no PPR bonus), PPR (1 point per reception), Half-PPR (0.5 points per reception)."
        >
          Scoring Format
        </label>
        <select
          id="sleepersScoring"
          value={sleepersScoringId}
          onChange={(event) =>
            onSleepersScoringIdChange(
              Number(event.target.value) as FantasyScoringId,
            )
          }
        >
          <option value={1}>Standard</option>
          <option value={3}>PPR</option>
          <option value={4}>Half-PPR</option>
        </select>
        <label
          htmlFor="sleepersSeason"
          title="Leave blank to use the backend's current live season."
        >
          Season (optional)
        </label>
        <input
          id="sleepersSeason"
          value={sleepersSeason}
          onChange={(event) => onSleepersSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="sleepersPositionFilter"
          title="Filters the returned sleeper list on the client; the backend does not accept a position param for this route."
        >
          Position Filter
        </label>
        <select
          id="sleepersPositionFilter"
          value={sleepersPositionFilter}
          onChange={(event) =>
            onSleepersPositionFilterChange(
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
        <button type="submit" disabled={loadingSleepers}>
          {loadingSleepers ? "Loading..." : "Load Draft Values"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Draft Values Readout</h2>
          {sleepers ? (
            <SleepersCard
              data={sleepers}
              positionFilter={sleepersPositionFilter}
            />
          ) : (
            <p className="empty-note">
              Load draft values to view ADP delta signals and peer
              distributions.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default SleepersPortal;
