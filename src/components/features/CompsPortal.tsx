import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { PlayerCompsCard } from "../dashboard/DashboardCards";
import type {
  CompSplitMode,
  PlayerCompsResponse,
  PlayerOption,
} from "../../utils/dashboardTypes";

type CompsPortalProps = {
  compsPlayerId: string;
  compLimit: string;
  compSampleSize: string;
  compSplit: CompSplitMode;
  playerOptions: PlayerOption[];
  playerComps: PlayerCompsResponse | null;
  loadingOptions: boolean;
  loadingComps: boolean;
  onCompsPlayerIdChange: (id: string) => void;
  onCompLimitChange: (value: string) => void;
  onCompSampleSizeChange: (value: string) => void;
  onCompSplitChange: (value: CompSplitMode) => void;
  onSubmit: (event: FormEvent) => void;
};

const CompsPortal = ({
  compsPlayerId,
  compLimit,
  compSampleSize,
  compSplit,
  playerOptions,
  playerComps,
  loadingOptions,
  loadingComps,
  onCompsPlayerIdChange,
  onCompLimitChange,
  onCompSampleSizeChange,
  onCompSplitChange,
  onSubmit,
}: CompsPortalProps) => {
  return (
    <section className="feature-stage feature-stage--profile">
      <form onSubmit={onSubmit}>
        <h3 title="Player Value Comps finds statistically similar players using normalized production vectors.">
          Player Value Comps
        </h3>
        <p className="helper-note">
          Comps are ranked by similarity score based on normalized player stat
          features from backend aggregation.
        </p>
        <p className="helper-note">
          Limit controls how many comp rows are returned; Sample Size controls
          how many candidate players are scanned before ranking.
        </p>
        <SearchableEntitySelect
          id="compsPlayerSelect"
          label="Player Selector"
          value={compsPlayerId}
          onChange={onCompsPlayerIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <label
          htmlFor="compLimit"
          title="Endpoint query variable: limit. Number of highest-similarity comps returned after ranking. Backend clamp: 1 to 25."
        >
          Comp Limit
        </label>
        <input
          id="compLimit"
          value={compLimit}
          onChange={(event) => onCompLimitChange(event.target.value)}
          placeholder="10"
        />
        <label
          htmlFor="compSampleSize"
          title="Endpoint query variable: sampleSize. Maximum candidate pool used for z-score standardization and nearest-neighbor ranking. Backend clamp: 30 to 120."
        >
          Comp Sample Size
        </label>
        <input
          id="compSampleSize"
          value={compSampleSize}
          onChange={(event) => onCompSampleSizeChange(event.target.value)}
          placeholder="100"
        />
        <label
          htmlFor="compSplit"
          title="Endpoint query variable: split. Controls target split context for value comps: regular, postseason, or career. Same-split matching is enforced."
        >
          Split Context
        </label>
        <select
          id="compSplit"
          value={compSplit}
          onChange={(event) =>
            onCompSplitChange(event.target.value as CompSplitMode)
          }
        >
          <option value="regular">Regular Season</option>
          <option value="postseason">Postseason</option>
          <option value="career">Career</option>
        </select>
        <button type="submit" disabled={loadingComps || loadingOptions}>
          {loadingComps ? "Loading..." : "Load Value Comps"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Value Comps</h2>
          {playerComps ? (
            <PlayerCompsCard
              data={playerComps}
              playerLabel={
                playerOptions.find((option) => option.id === compsPlayerId)
                  ?.label ?? `Athlete #${compsPlayerId}`
              }
            />
          ) : (
            <p className="empty-note">
              Load value comps to find the closest statistical profile matches.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default CompsPortal;
