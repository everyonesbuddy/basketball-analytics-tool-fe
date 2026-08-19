import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { StartSitCard } from "../dashboard/DashboardCards";
import type {
  FantasyScoringId,
  PlayerOption,
  StartSitResponse,
} from "../../utils/dashboardTypes";

type StartSitPortalProps = {
  fantasyPlayerOptions: PlayerOption[];
  roster: PlayerOption[];
  rosterPick: string;
  scoringId: FantasyScoringId;
  season: string;
  window: string;
  startSit: StartSitResponse | null;
  loadingStartSit: boolean;
  loadingPlayerOptions: boolean;
  onRosterPickChange: (id: string) => void;
  onAddToRoster: () => void;
  onRemoveFromRoster: (id: string) => void;
  onScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSeasonChange: (season: string) => void;
  onWindowChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const StartSitPortal = ({
  fantasyPlayerOptions,
  roster,
  rosterPick,
  scoringId,
  season,
  window,
  startSit,
  loadingStartSit,
  loadingPlayerOptions,
  onRosterPickChange,
  onAddToRoster,
  onRemoveFromRoster,
  onScoringIdChange,
  onSeasonChange,
  onWindowChange,
  onSubmit,
}: StartSitPortalProps) => {
  return (
    <section className="feature-stage feature-stage--startsit">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge fantasy-badge--startsit">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/start-sit combines next-week projection with recent actual performance.">
          Start / Sit
        </h3>
        <p className="helper-note">
          Not sure who to start this week? Add the players you're torn
          between and see next week's projection next to how they've
          actually been playing lately.
        </p>

        <label htmlFor="startSitScoring">Scoring Format</label>
        <select
          id="startSitScoring"
          value={scoringId}
          onChange={(event) =>
            onScoringIdChange(Number(event.target.value) as FantasyScoringId)
          }
        >
          <option value={1}>Standard</option>
          <option value={3}>PPR</option>
          <option value={4}>Half-PPR</option>
        </select>
        <label htmlFor="startSitSeason" title="Leave blank to use the current live season.">
          Season (optional)
        </label>
        <input
          id="startSitSeason"
          value={season}
          onChange={(event) => onSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="startSitWindow"
          title="Number of most recent completed games to average for recent form."
        >
          Recent Games Window
        </label>
        <input
          id="startSitWindow"
          value={window}
          onChange={(event) => onWindowChange(event.target.value)}
          placeholder="4"
        />

        <SearchableEntitySelect
          id="startSitRosterPick"
          label="Add Player To Compare"
          value={rosterPick}
          onChange={onRosterPickChange}
          options={fantasyPlayerOptions}
          disabled={loadingPlayerOptions}
          placeholder="Search NFL player by name"
          fallbackPrefix="Player"
        />
        <button type="button" onClick={onAddToRoster} disabled={!rosterPick}>
          Add Player
        </button>
        {roster.length ? (
          <div className="chip-grid">
            {roster.map((entry) => (
              <span className="chip" key={entry.id}>
                {entry.label}{" "}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${entry.label}`}
                  onClick={() => onRemoveFromRoster(entry.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <button type="submit" disabled={loadingStartSit || !roster.length}>
          {loadingStartSit ? "Loading..." : "Compare Start/Sit"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Start / Sit Readout</h2>
          {startSit ? (
            <StartSitCard data={startSit} />
          ) : (
            <p className="empty-note">
              Add players and compare to see next-week projection and recent
              form side by side.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default StartSitPortal;
