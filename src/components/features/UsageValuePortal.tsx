import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { PlayerUsageValueCard } from "../dashboard/DashboardCards";
import type {
  PlayerOption,
  PlayerUsageValueResponse,
} from "../../utils/dashboardTypes";

type UsageValuePortalProps = {
  usageValuePlayerId: string;
  playerOptions: PlayerOption[];
  playerUsageValue: PlayerUsageValueResponse | null;
  loadingOptions: boolean;
  loadingUsageValue: boolean;
  onUsageValuePlayerIdChange: (id: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const UsageValuePortal = ({
  usageValuePlayerId,
  playerOptions,
  playerUsageValue,
  loadingOptions,
  loadingUsageValue,
  onUsageValuePlayerIdChange,
  onSubmit,
}: UsageValuePortalProps) => {
  return (
    <section className="feature-stage feature-stage--usage">
      <form onSubmit={onSubmit}>
        <h3 title="GET /players/:athleteId/usage-value benchmarks usage-adjusted production against peer buckets.">
          Player Usage Value
        </h3>
        <p className="helper-note">
          This report compares a player against peers in the same usage bucket,
          then classifies whether production is above, within, or below expected
          range.
        </p>
        <SearchableEntitySelect
          id="usageValuePlayerSelect"
          label="Player Selector"
          value={usageValuePlayerId}
          onChange={onUsageValuePlayerIdChange}
          options={playerOptions}
          disabled={loadingOptions}
          placeholder="Search player by name or ID"
          fallbackPrefix="Athlete"
        />
        <button type="submit" disabled={loadingUsageValue || loadingOptions}>
          {loadingUsageValue ? "Loading..." : "Load Usage Value"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Usage Value Readout</h2>
          {playerUsageValue ? (
            <PlayerUsageValueCard
              data={playerUsageValue}
              playerLabel={
                playerOptions.find((option) => option.id === usageValuePlayerId)
                  ?.label ?? `Athlete #${usageValuePlayerId}`
              }
            />
          ) : (
            <p className="empty-note">
              Load usage value to evaluate usage-adjusted production and
              decision signals.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default UsageValuePortal;
