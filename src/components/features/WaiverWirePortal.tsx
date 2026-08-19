import type { FormEvent } from "react";
import { WaiverWireCard } from "../dashboard/DashboardCards";
import type {
  FantasyScoringId,
  WaiverWireResponse,
} from "../../utils/dashboardTypes";

type WaiverWirePortalProps = {
  scoringId: FantasyScoringId;
  season: string;
  ownershipMax: string;
  window: string;
  waivers: WaiverWireResponse | null;
  loadingWaivers: boolean;
  onScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSeasonChange: (season: string) => void;
  onOwnershipMaxChange: (value: string) => void;
  onWindowChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const WaiverWirePortal = ({
  scoringId,
  season,
  ownershipMax,
  window,
  waivers,
  loadingWaivers,
  onScoringIdChange,
  onSeasonChange,
  onOwnershipMaxChange,
  onWindowChange,
  onSubmit,
}: WaiverWirePortalProps) => {
  return (
    <section className="feature-stage feature-stage--waivers">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge fantasy-badge--waivers">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/waivers surfaces low-ownership players outperforming their recent projection.">
          Waiver Wire
        </h3>
        <p className="helper-note">
          Finds players almost nobody has on their roster who are quietly
          outplaying their projection lately. Only works once games have started
          this season.
        </p>

        <label htmlFor="waiverScoring">Scoring Format</label>
        <select
          id="waiverScoring"
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
          htmlFor="waiverSeason"
          title="Leave blank to use the current live season."
        >
          Season (optional)
        </label>
        <input
          id="waiverSeason"
          value={season}
          onChange={(event) => onSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="waiverOwnershipMax"
          title="Only include players rostered at or below this percentage."
        >
          Ownership Max %
        </label>
        <input
          id="waiverOwnershipMax"
          value={ownershipMax}
          onChange={(event) => onOwnershipMaxChange(event.target.value)}
          placeholder="50"
        />
        <div className="fantasy-preset-row">
          {["25", "50", "75"].map((preset) => (
            <button
              type="button"
              key={preset}
              className={`fantasy-link-button ${ownershipMax === preset ? "active" : ""}`}
              onClick={() => onOwnershipMaxChange(preset)}
            >
              {`< ${preset}%`}
            </button>
          ))}
        </div>
        <label
          htmlFor="waiverWindow"
          title="Number of most recent completed games to average."
        >
          Recent Games Window
        </label>
        <input
          id="waiverWindow"
          value={window}
          onChange={(event) => onWindowChange(event.target.value)}
          placeholder="4"
        />
        <button type="submit" disabled={loadingWaivers}>
          {loadingWaivers ? "Loading..." : "Load Waiver Wire"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Waiver Wire Readout</h2>
          {waivers ? (
            <WaiverWireCard data={waivers} />
          ) : (
            <p className="empty-note">
              Load the waiver wire to find low-ownership players outperforming
              their projection recently.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default WaiverWirePortal;
