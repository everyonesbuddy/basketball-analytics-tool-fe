import type { FormEvent } from "react";
import { ConsistencyCard } from "../dashboard/DashboardCards";
import type {
  ConsistencyResponse,
  FantasyScoringId,
} from "../../utils/dashboardTypes";

type ConsistencyPortalProps = {
  scoringId: FantasyScoringId;
  season: string;
  window: string;
  consistency: ConsistencyResponse | null;
  loadingConsistency: boolean;
  onScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSeasonChange: (season: string) => void;
  onWindowChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const ConsistencyPortal = ({
  scoringId,
  season,
  window,
  consistency,
  loadingConsistency,
  onScoringIdChange,
  onSeasonChange,
  onWindowChange,
  onSubmit,
}: ConsistencyPortalProps) => {
  return (
    <section className="feature-stage feature-stage--consistency">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge fantasy-badge--consistency">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/consistency ranks recent floor and volatility across completed games.">
          Reliable Recent Performers
        </h3>
        <p className="helper-note">
          Ranks players by how dependable they've been lately, not just how
          high they can score. Great for picking the safer option between
          two similar players.
        </p>

        <label htmlFor="consistencyScoring">Scoring Format</label>
        <select
          id="consistencyScoring"
          value={scoringId}
          onChange={(event) =>
            onScoringIdChange(Number(event.target.value) as FantasyScoringId)
          }
        >
          <option value={1}>Standard</option>
          <option value={3}>PPR</option>
          <option value={4}>Half-PPR</option>
        </select>
        <label htmlFor="consistencySeason" title="Leave blank to use the current live season.">
          Season (optional)
        </label>
        <input
          id="consistencySeason"
          value={season}
          onChange={(event) => onSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="consistencyWindow"
          title="Number of most recent completed games to average (minimum 3 required)."
        >
          Recent Games Window
        </label>
        <input
          id="consistencyWindow"
          value={window}
          onChange={(event) => onWindowChange(event.target.value)}
          placeholder="4"
        />
        <button type="submit" disabled={loadingConsistency}>
          {loadingConsistency ? "Loading..." : "Load Consistency Leaders"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Consistency Readout</h2>
          {consistency ? (
            <ConsistencyCard data={consistency} />
          ) : (
            <p className="empty-note">
              Load consistency leaders to compare floor and volatility across
              recent games.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default ConsistencyPortal;
