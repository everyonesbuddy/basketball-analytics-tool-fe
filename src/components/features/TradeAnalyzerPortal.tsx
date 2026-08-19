import type { FormEvent } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import { TradeAnalyzerCard } from "../dashboard/DashboardCards";
import type {
  FantasyScoringId,
  PlayerOption,
  TradeAnalysisResponse,
} from "../../utils/dashboardTypes";

type TradeAnalyzerPortalProps = {
  fantasyPlayerOptions: PlayerOption[];
  sideA: PlayerOption[];
  sideB: PlayerOption[];
  sideAPick: string;
  sideBPick: string;
  scoringId: FantasyScoringId;
  season: string;
  teamCount: string;
  starters: string;
  tradeAnalysis: TradeAnalysisResponse | null;
  loadingTrade: boolean;
  loadingPlayerOptions: boolean;
  onSideAPickChange: (id: string) => void;
  onSideBPickChange: (id: string) => void;
  onAddSideA: () => void;
  onAddSideB: () => void;
  onRemoveSideA: (id: string) => void;
  onRemoveSideB: (id: string) => void;
  onScoringIdChange: (scoringId: FantasyScoringId) => void;
  onSeasonChange: (season: string) => void;
  onTeamCountChange: (teamCount: string) => void;
  onStartersChange: (starters: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const TradeAnalyzerPortal = ({
  fantasyPlayerOptions,
  sideA,
  sideB,
  sideAPick,
  sideBPick,
  scoringId,
  season,
  teamCount,
  starters,
  tradeAnalysis,
  loadingTrade,
  loadingPlayerOptions,
  onSideAPickChange,
  onSideBPickChange,
  onAddSideA,
  onAddSideB,
  onRemoveSideA,
  onRemoveSideB,
  onScoringIdChange,
  onSeasonChange,
  onTeamCountChange,
  onStartersChange,
  onSubmit,
}: TradeAnalyzerPortalProps) => {
  return (
    <section className="feature-stage feature-stage--trade">
      <form onSubmit={onSubmit}>
        <span className="fantasy-badge fantasy-badge--trade">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/trades/analyze compares VORP totals on each side of a proposed trade.">
          Trade Analyzer
        </h3>
        <p className="helper-note">
          Add the players on each side of a trade you're considering, then hit
          Analyze — you'll get a simple verdict on who actually wins the deal.
        </p>

        <label htmlFor="tradeScoring">Scoring Format</label>
        <select
          id="tradeScoring"
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
          htmlFor="tradeSeason"
          title="Leave blank to use the current live season."
        >
          Season (optional)
        </label>
        <input
          id="tradeSeason"
          value={season}
          onChange={(event) => onSeasonChange(event.target.value)}
          placeholder="Current season"
        />
        <label
          htmlFor="tradeTeamCount"
          title="Matches your real league size — changes the Replacement Baseline used for VORP."
        >
          Team Count
        </label>
        <input
          id="tradeTeamCount"
          value={teamCount}
          onChange={(event) => onTeamCountChange(event.target.value)}
          placeholder="12"
        />
        <label
          htmlFor="tradeStarters"
          title="Format: QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1. Leave blank for defaults."
        >
          Starters (optional)
        </label>
        <input
          id="tradeStarters"
          value={starters}
          onChange={(event) => onStartersChange(event.target.value)}
          placeholder="QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1"
        />

        <p
          className="helper-note"
          title="Convention used throughout this tool: Side A is what you send away, Side B is what you receive."
        >
          You Give (Side A)
        </p>
        <SearchableEntitySelect
          id="tradeSideAPick"
          label="Add Player To Side A (You Give)"
          value={sideAPick}
          onChange={onSideAPickChange}
          options={fantasyPlayerOptions}
          disabled={loadingPlayerOptions}
          placeholder="Search NFL player by name"
          fallbackPrefix="Player"
        />
        <button type="button" onClick={onAddSideA} disabled={!sideAPick}>
          Add To You Give
        </button>
        {sideA.length ? (
          <div className="chip-grid">
            {sideA.map((entry) => (
              <span className="chip" key={entry.id}>
                {entry.label}{" "}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${entry.label} from Side A`}
                  onClick={() => onRemoveSideA(entry.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <p className="helper-note">You Receive (Side B)</p>
        <SearchableEntitySelect
          id="tradeSideBPick"
          label="Add Player To Side B (You Receive)"
          value={sideBPick}
          onChange={onSideBPickChange}
          options={fantasyPlayerOptions}
          disabled={loadingPlayerOptions}
          placeholder="Search NFL player by name"
          fallbackPrefix="Player"
        />
        <button type="button" onClick={onAddSideB} disabled={!sideBPick}>
          Add To You Receive
        </button>
        {sideB.length ? (
          <div className="chip-grid">
            {sideB.map((entry) => (
              <span className="chip" key={entry.id}>
                {entry.label}{" "}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${entry.label} from Side B`}
                  onClick={() => onRemoveSideB(entry.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loadingTrade || !sideA.length || !sideB.length}
        >
          {loadingTrade ? "Analyzing..." : "Analyze Trade"}
        </button>
      </form>

      <section className="results-zone">
        <div>
          <h2>Trade Analysis Readout</h2>
          {tradeAnalysis ? (
            <TradeAnalyzerCard data={tradeAnalysis} />
          ) : (
            <p className="empty-note">
              Add players to both sides and analyze to compare VORP value.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default TradeAnalyzerPortal;
