import { useEffect, useRef, useState } from "react";
import SearchableEntitySelect from "../common/SearchableEntitySelect";
import {
  FantasyRosterBuilder,
  formatMetricValue,
} from "../dashboard/DashboardCards";
import type { RosterSlotAssignments } from "../dashboard/DashboardCards";
import {
  fetchNbaFantasyDraftBoard,
  fetchNbaFantasyPlayerCompare,
  fetchNbaFantasyRosterCompare,
  fetchNbaFantasySeasonState,
  fetchNbaFantasySleepers,
  fetchNbaFantasyTeamGrade,
  fetchNbaFantasyTradeAnalysis,
} from "../../utils/dashboardApi";
import { safeToText } from "../../utils/dashboardFormatters";
import type {
  FantasyPlayerCandidate,
  NbaFantasyDraftBoardResponse,
  NbaFantasyPlayerCompareResponse,
  NbaFantasyPosition,
  NbaFantasyRosterCompareResponse,
  NbaFantasySeasonState,
  NbaFantasySleepersResponse,
  NbaFantasyTeamGradeResponse,
  NbaFantasyTradeAnalysisResponse,
  PlayerOption,
} from "../../utils/dashboardTypes";

type ToolKey =
  | "draft-board"
  | "draft-values"
  | "trade"
  | "player-compare"
  | "roster-compare"
  | "team-grade";

const TOOLS: Array<{ key: ToolKey; label: string }> = [
  { key: "draft-board", label: "Draft Board" },
  { key: "draft-values", label: "Draft Values" },
  { key: "trade", label: "Trade Analyzer" },
  { key: "player-compare", label: "Player Compare" },
  { key: "roster-compare", label: "Roster Head-to-Head" },
  { key: "team-grade", label: "Team Grade" },
];

const NBA_POSITIONS: Array<NbaFantasyPosition | "ALL"> = [
  "ALL",
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "G",
  "F",
  "UTIL",
];

const DEFAULT_STARTERS = "PG:1,SG:1,SF:1,PF:1,C:1,G:1,F:1,UTIL:3";
const NBA_FANTASY_STORAGE_KEY = "fantasy.nbaFantasyState.v1";

type PersistedNbaFantasyState = {
  activeTool: ToolKey;
  teams: Record<number, string[]>;
  selectedTeamIndex: number;
  position: NbaFantasyPosition | "ALL";
  season: string;
  teamCount: string;
  starters: string;
  playerA: string;
  playerB: string;
  sideA: string[];
  sideB: string[];
  rosterA: RosterSlotAssignments;
  rosterB: RosterSlotAssignments;
  gradeRoster: RosterSlotAssignments;
};

const EMPTY_NBA_FANTASY_STATE: PersistedNbaFantasyState = {
  activeTool: "draft-board",
  teams: {},
  selectedTeamIndex: 0,
  position: "ALL",
  season: "",
  teamCount: "12",
  starters: DEFAULT_STARTERS,
  playerA: "",
  playerB: "",
  sideA: [],
  sideB: [],
  rosterA: {},
  rosterB: {},
  gradeRoster: {},
};

const readPersistedNbaFantasyState = (): PersistedNbaFantasyState => {
  try {
    const raw = window.localStorage.getItem(NBA_FANTASY_STORAGE_KEY);
    if (!raw) return EMPTY_NBA_FANTASY_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedNbaFantasyState>;
    return {
      ...EMPTY_NBA_FANTASY_STATE,
      ...parsed,
      teams:
        parsed.teams && typeof parsed.teams === "object" ? parsed.teams : {},
      selectedTeamIndex:
        typeof parsed.selectedTeamIndex === "number"
          ? parsed.selectedTeamIndex
          : 0,
      sideA: Array.isArray(parsed.sideA) ? parsed.sideA : [],
      sideB: Array.isArray(parsed.sideB) ? parsed.sideB : [],
      rosterA:
        parsed.rosterA && typeof parsed.rosterA === "object"
          ? parsed.rosterA
          : {},
      rosterB:
        parsed.rosterB && typeof parsed.rosterB === "object"
          ? parsed.rosterB
          : {},
      gradeRoster:
        parsed.gradeRoster && typeof parsed.gradeRoster === "object"
          ? parsed.gradeRoster
          : {},
    };
  } catch {
    return EMPTY_NBA_FANTASY_STATE;
  }
};

const toPlayerOptions = (players: FantasyPlayerCandidate[]): PlayerOption[] =>
  players.map((player) => ({
    id: String(player.id),
    label: `${player.name} (${player.position})`,
  }));

const formatTeam = (player: { team?: unknown }) => safeToText(player.team);

const PlayerTable = ({
  players,
  onDraft,
}: {
  players: FantasyPlayerCandidate[];
  onDraft?: (player: FantasyPlayerCandidate) => void;
}) => (
  <div className="compare-table-wrap">
    <table className="compare-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th>Proj</th>
          <th>VORP</th>
          <th>Tier</th>
          {onDraft ? <th /> : null}
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={String(player.id)}>
            <td>{safeToText(player.name)}</td>
            <td>{safeToText(player.position)}</td>
            <td>{formatTeam(player)}</td>
            <td>{formatMetricValue(player.projectedTotal)}</td>
            <td>{formatMetricValue(player.vorp)}</td>
            <td>{safeToText(player.tier)}</td>
            {onDraft ? (
              <td>
                <button
                  type="button"
                  className="fantasy-draft-button"
                  onClick={() => onDraft(player)}
                >
                  Draft
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RosterSummary = ({
  title,
  players,
}: {
  title: string;
  players: Array<{
    id: string | number;
    name: string;
    position: string;
    team?: unknown;
    vorp?: number | null;
    lineupSlot?: string;
  }>;
}) => (
  <section className="context-wrap">
    <h4 className="fantasy-section-heading">{title}</h4>
    {players.length ? (
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>VORP</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={String(player.id)}>
                <td>{safeToText(player.lineupSlot)}</td>
                <td>{safeToText(player.name)}</td>
                <td>{safeToText(player.position)}</td>
                <td>{formatTeam(player)}</td>
                <td>{formatMetricValue(player.vorp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="empty-note">No players in this lineup yet.</p>
    )}
  </section>
);

const NbaFantasyPortal = ({ forceRefresh }: { forceRefresh: boolean }) => {
  const [savedState] = useState(readPersistedNbaFantasyState);
  const [activeTool, setActiveTool] = useState<ToolKey>(savedState.activeTool);
  const [seasonState, setSeasonState] = useState<NbaFantasySeasonState | null>(
    null,
  );
  const [candidatePool, setCandidatePool] = useState<FantasyPlayerCandidate[]>(
    [],
  );
  const [draftBoard, setDraftBoard] =
    useState<NbaFantasyDraftBoardResponse | null>(null);
  const [sleepers, setSleepers] = useState<NbaFantasySleepersResponse | null>(
    null,
  );
  const [tradeAnalysis, setTradeAnalysis] =
    useState<NbaFantasyTradeAnalysisResponse | null>(null);
  const [playerCompare, setPlayerCompare] =
    useState<NbaFantasyPlayerCompareResponse | null>(null);
  const [rosterCompare, setRosterCompare] =
    useState<NbaFantasyRosterCompareResponse | null>(null);
  const [teamGrade, setTeamGrade] =
    useState<NbaFantasyTeamGradeResponse | null>(null);
  const [draftTeams, setDraftTeams] = useState(savedState.teams);
  const [selectedDraftTeam, setSelectedDraftTeam] = useState(
    savedState.selectedTeamIndex,
  );
  const [position, setPosition] = useState<NbaFantasyPosition | "ALL">(
    savedState.position,
  );
  const [season, setSeason] = useState(savedState.season);
  const [teamCount, setTeamCount] = useState(savedState.teamCount);
  const [starters, setStarters] = useState(savedState.starters);
  const [playerA, setPlayerA] = useState(savedState.playerA);
  const [playerB, setPlayerB] = useState(savedState.playerB);
  const [sideAPick, setSideAPick] = useState("");
  const [sideBPick, setSideBPick] = useState("");
  const [sideA, setSideA] = useState<string[]>(savedState.sideA);
  const [sideB, setSideB] = useState<string[]>(savedState.sideB);
  const [rosterA, setRosterA] = useState<RosterSlotAssignments>(savedState.rosterA);
  const [rosterB, setRosterB] = useState<RosterSlotAssignments>(savedState.rosterB);
  const [gradeRoster, setGradeRoster] = useState<RosterSlotAssignments>(
    savedState.gradeRoster,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const draftedIds = [
    ...new Set(Object.values(draftTeams).flatMap((ids) => ids)),
  ];
  const draftedIdsRef = useRef(draftedIds);
  draftedIdsRef.current = draftedIds;
  const playerOptions = toPlayerOptions(candidatePool);
  const seasonParam = season.trim() || undefined;
  const leagueSettings = {
    teamCount: Number(teamCount) > 0 ? Number(teamCount) : undefined,
    starters,
  };

  const loadBoard = async (nextDraftedIds = draftedIds) => {
    setError("");
    setLoading(true);
    try {
      const result = await fetchNbaFantasyDraftBoard(
        forceRefresh,
        position === "ALL" ? undefined : position,
        nextDraftedIds,
        seasonParam,
        leagueSettings,
      );
      setDraftBoard(result);
      return result;
    } catch {
      setError("Could not load the NBA fantasy draft board.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const [seasonResult, boardResult] = await Promise.allSettled([
          fetchNbaFantasySeasonState(forceRefresh),
          fetchNbaFantasyDraftBoard(
            forceRefresh,
            undefined,
            [],
            seasonParam,
            leagueSettings,
          ),
        ]);
        if (seasonResult.status === "fulfilled") {
          setSeasonState(seasonResult.value);
        }
        if (boardResult.status === "fulfilled") {
          setCandidatePool(boardResult.value.candidates ?? []);
          if (
            draftedIdsRef.current.length ||
            position !== "ALL"
          ) {
            const filteredBoard = await fetchNbaFantasyDraftBoard(
              forceRefresh,
              position === "ALL" ? undefined : position,
              draftedIdsRef.current,
              seasonParam,
              leagueSettings,
            );
            setDraftBoard(filteredBoard);
          } else {
            setDraftBoard(boardResult.value);
          }
        } else {
          setError("Could not load the NBA fantasy player pool.");
        }
      } finally {
        setLoading(false);
      }
    };
    void initialize();
  }, [forceRefresh]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NBA_FANTASY_STORAGE_KEY,
        JSON.stringify({
          activeTool,
          teams: draftTeams,
          selectedTeamIndex: selectedDraftTeam,
          position,
          season,
          teamCount,
          starters,
          playerA,
          playerB,
          sideA,
          sideB,
          rosterA,
          rosterB,
          gradeRoster,
        }),
      );
    } catch {
      // Storage can be unavailable or full; the active draft remains usable.
    }
  }, [
    activeTool,
    draftTeams,
    selectedDraftTeam,
    position,
    season,
    teamCount,
    starters,
    playerA,
    playerB,
    sideA,
    sideB,
    rosterA,
    rosterB,
    gradeRoster,
  ]);

  useEffect(() => {
    if (activeTool !== "draft-values" || sleepers) {
      return;
    }
    setLoading(true);
    void fetchNbaFantasySleepers(forceRefresh, seasonParam)
      .then(setSleepers)
      .catch(() => setError("Could not load NBA fantasy draft values."))
      .finally(() => setLoading(false));
  }, [activeTool, forceRefresh, seasonParam, sleepers]);

  const draftPlayer = (player: FantasyPlayerCandidate) => {
    const id = String(player.id);
    if (draftedIds.includes(id)) return;
    const nextTeamIds = [...(draftTeams[selectedDraftTeam] ?? []), id];
    const nextTeams = { ...draftTeams, [selectedDraftTeam]: nextTeamIds };
    const nextIds = [...new Set(Object.values(nextTeams).flat())];
    setDraftTeams(nextTeams);
    void loadBoard(nextIds);
  };

  const removeDraftedPlayer = (id: string) => {
    const nextTeams = Object.fromEntries(
      Object.entries(draftTeams).map(([team, ids]) => [
        team,
        ids.filter((playerId) => playerId !== id),
      ]),
    ) as Record<number, string[]>;
    const nextIds = [...new Set(Object.values(nextTeams).flat())];
    setDraftTeams(nextTeams);
    void loadBoard(nextIds);
  };

  const resetNbaDraft = () => {
    setDraftTeams({});
    setSelectedDraftTeam(0);
    void loadBoard([]);
  };

  const addTradePlayer = (side: "A" | "B") => {
    const picked = side === "A" ? sideAPick : sideBPick;
    if (!picked) return;
    if (side === "A") {
      setSideA((current) => [...new Set([...current, picked])]);
      setSideAPick("");
    } else {
      setSideB((current) => [...new Set([...current, picked])]);
      setSideBPick("");
    }
  };

  const runTradeAnalysis = async () => {
    setError("");
    setLoading(true);
    try {
      setTradeAnalysis(
        await fetchNbaFantasyTradeAnalysis(
          forceRefresh,
          sideA,
          sideB,
          seasonParam,
          leagueSettings,
        ),
      );
    } catch {
      setError("Could not analyze this NBA fantasy trade.");
    } finally {
      setLoading(false);
    }
  };

  const runPlayerCompare = async () => {
    if (!playerA || !playerB) return;
    setError("");
    setLoading(true);
    try {
      setPlayerCompare(
        await fetchNbaFantasyPlayerCompare(
          forceRefresh,
          playerA,
          playerB,
          seasonParam,
          leagueSettings,
        ),
      );
    } catch {
      setError("Could not compare those NBA fantasy players.");
    } finally {
      setLoading(false);
    }
  };

  const runRosterCompare = async () => {
    const idsA = Object.values(rosterA).map((player) => String(player.id));
    const idsB = Object.values(rosterB).map((player) => String(player.id));
    if (!idsA.length || !idsB.length) return;
    setError("");
    setLoading(true);
    try {
      setRosterCompare(
        await fetchNbaFantasyRosterCompare(
          forceRefresh,
          idsA,
          idsB,
          seasonParam,
          leagueSettings,
        ),
      );
    } catch {
      setError("Could not compare these NBA fantasy rosters.");
    } finally {
      setLoading(false);
    }
  };

  const runTeamGrade = async () => {
    const ids = Object.values(gradeRoster).map((player) => String(player.id));
    if (!ids.length) return;
    setError("");
    setLoading(true);
    try {
      setTeamGrade(
        await fetchNbaFantasyTeamGrade(
          forceRefresh,
          ids,
          seasonParam,
          leagueSettings,
        ),
      );
    } catch {
      setError("Could not grade this NBA fantasy roster.");
    } finally {
      setLoading(false);
    }
  };

  const playerById = (id: string) =>
    candidatePool.find((player) => String(player.id) === id);

  const removeTradePlayer = (side: "A" | "B", id: string) => {
    if (side === "A") setSideA((current) => current.filter((item) => item !== id));
    else setSideB((current) => current.filter((item) => item !== id));
  };

  const idsA = new Set(Object.values(rosterA).map((player) => String(player.id)));
  const idsB = new Set(Object.values(rosterB).map((player) => String(player.id)));
  const draftTeamCount = Math.max(1, Number(teamCount) || 12);
  const currentTeamPicks = draftTeams[selectedDraftTeam] ?? [];

  return (
    <section className="feature-stage feature-stage--nba-fantasy">
      <header className="nba-fantasy-header">
        <div>
          <span className="fantasy-badge">NBA Fantasy · Points</span>
          <h2>NBA Fantasy</h2>
          <p className="helper-note">
            ESPN points-league projections, player values, trades, and roster analysis.
          </p>
        </div>
        <p className="nba-fantasy-season">
          {seasonState
            ? `Season ${seasonState.season} · Period ${seasonState.currentScoringPeriod}${seasonState.active ? " · Active" : ""}`
            : "Loading season..."}
        </p>
      </header>

      <nav className="nba-fantasy-tools" aria-label="NBA fantasy tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            type="button"
            className={activeTool === tool.key ? "active" : ""}
            aria-current={activeTool === tool.key ? "page" : undefined}
            onClick={() => setActiveTool(tool.key)}
          >
            {tool.label}
          </button>
        ))}
      </nav>

      {error ? <p className="error-note">{error}</p> : null}
      {loading && !draftBoard ? <p className="empty-note">Loading NBA fantasy data...</p> : null}

      {activeTool === "draft-board" ? (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadBoard();
            }}
          >
            <label htmlFor="nbaFantasyPosition">Position</label>
            <select
              id="nbaFantasyPosition"
              value={position}
              onChange={(event) => setPosition(event.target.value as NbaFantasyPosition | "ALL")}
            >
              {NBA_POSITIONS.map((item) => (
                <option key={item} value={item}>{item === "ALL" ? "All Positions" : item}</option>
              ))}
            </select>
            <label htmlFor="nbaFantasySeason">Season</label>
            <input id="nbaFantasySeason" value={season} placeholder="Current season" onChange={(event) => setSeason(event.target.value)} />
            <label htmlFor="nbaFantasyTeams">Teams</label>
            <input id="nbaFantasyTeams" value={teamCount} onChange={(event) => setTeamCount(event.target.value)} />
            <label htmlFor="nbaFantasyStarters">Starters</label>
            <input id="nbaFantasyStarters" value={starters} onChange={(event) => setStarters(event.target.value)} />
            <button type="submit" disabled={loading}>{loading ? "Updating..." : "Apply Filters"}</button>
          </form>
          {draftBoard ? (
            <article className="scout-card fantasy-card">
              <div className="fantasy-header-row">
                <span className="fantasy-badge">NBA Fantasy</span>
                <h3>Draft Board</h3>
              </div>
              <p className="viz-subtitle">Points scoring · Season {safeToText(draftBoard.season)} · Position {safeToText(draftBoard.position)}</p>
              {draftBoard.decisionInsights ? <p className="callout-note">{draftBoard.decisionInsights}</p> : null}
              <div className="impact-summary-grid">
                <div className="overview-pill"><p className="overview-pill-label">Available</p><p className="overview-pill-value">{safeToText(draftBoard.availableCount)}</p></div>
                <div className="overview-pill"><p className="overview-pill-label">Drafted</p><p className="overview-pill-value">{draftedIds.length}</p></div>
                <div className="overview-pill"><p className="overview-pill-label">Roster slots</p><p className="overview-pill-value">{safeToText(draftBoard.leagueSettings?.teamCount)} teams</p></div>
              </div>
              <div className="draft-roster-team-tabs" role="tablist" aria-label="NBA fantasy draft teams">
                {Array.from({ length: draftTeamCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={selectedDraftTeam === index}
                    className={`draft-roster-team-tab ${selectedDraftTeam === index ? "active" : ""}`}
                    onClick={() => setSelectedDraftTeam(index)}
                  >
                    {index === 0 ? "My Team" : `Team ${index + 1}`}
                    {draftTeams[index]?.length ? <span className="draft-roster-team-tab__badge">{draftTeams[index].length}</span> : null}
                  </button>
                ))}
              </div>
              <div className="nba-draft-picks">
                <div className="nba-draft-picks__heading">
                  <strong>{selectedDraftTeam === 0 ? "My Team" : `Team ${selectedDraftTeam + 1}`} picks</strong>
                  {draftedIds.length ? <button type="button" className="draft-roster-board__reset" onClick={resetNbaDraft}>Reset Draft</button> : null}
                </div>
                {currentTeamPicks.length ? (
                  <div className="chip-grid">
                    {currentTeamPicks.map((id) => {
                      const player = candidatePool.find((candidate) => String(candidate.id) === id);
                      return (
                        <span className="chip" key={id}>
                          {player ? `${player.name} (${player.position})` : `Player #${id}`}
                          <button type="button" className="chip-remove" aria-label={`Undraft ${player?.name ?? id}`} onClick={() => removeDraftedPlayer(id)}>×</button>
                        </span>
                      );
                    })}
                  </div>
                ) : <p className="empty-note">No picks assigned to this team yet.</p>}
              </div>
              <PlayerTable players={(draftBoard.candidates ?? []).slice(0, 75)} onDraft={draftPlayer} />
            </article>
          ) : <p className="empty-note">The NBA fantasy draft board is loading.</p>}
        </>
      ) : null}

      {activeTool === "draft-values" ? (
        <article className="scout-card fantasy-card">
          <div className="fantasy-header-row"><span className="fantasy-badge">NBA Fantasy</span><h3>Draft Values</h3></div>
          <p className="fantasy-tip">Draft values compare each player's projected value with their average draft position.</p>
          {sleepers?.decisionInsights ? <p className="callout-note">{sleepers.decisionInsights}</p> : null}
          {sleepers ? (
            <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Player</th><th>Pos</th><th>ADP</th><th>ADP Delta</th><th>Value score</th><th>Status</th></tr></thead><tbody>
              {sleepers.sleepers.map((player) => <tr key={String(player.id)}><td>{safeToText(player.name)}</td><td>{safeToText(player.position)}</td><td>{formatMetricValue(player.adp)}</td><td>{formatMetricValue(player.adpDelta)}</td><td>{formatMetricValue(player.sleeperScore)}</td><td>{safeToText(player.status)}</td></tr>)}
            </tbody></table></div>
          ) : <p className="empty-note">Loading draft values...</p>}
        </article>
      ) : null}

      {activeTool === "trade" ? (
        <>
          <div className="nba-fantasy-trade-sides">
            {(["A", "B"] as const).map((side) => {
              const selected = side === "A" ? sideA : sideB;
              const pick = side === "A" ? sideAPick : sideBPick;
              return (
                <section className="context-wrap" key={side}>
                  <h3>{side === "A" ? "You Give" : "You Receive"}</h3>
                  <SearchableEntitySelect id={`nbaTrade${side}`} label="Add player" value={pick} onChange={side === "A" ? setSideAPick : setSideBPick} options={playerOptions} placeholder="Search NBA player" fallbackPrefix="Player" />
                  <button type="button" onClick={() => addTradePlayer(side)} disabled={!pick}>Add player</button>
                  <div className="chip-grid">{selected.map((id) => <span className="chip" key={id}>{playerById(id)?.name ?? id}<button type="button" className="chip-remove" aria-label={`Remove ${id}`} onClick={() => removeTradePlayer(side, id)}>×</button></span>)}</div>
                </section>
              );
            })}
          </div>
          <button type="button" disabled={loading || !sideA.length || !sideB.length} onClick={() => void runTradeAnalysis()}>{loading ? "Analyzing..." : "Analyze Trade"}</button>
          {tradeAnalysis ? <article className="scout-card fantasy-card"><h3>Trade Readout</h3><p className="callout-note">{tradeAnalysis.decisionInsights ?? `Verdict: ${tradeAnalysis.verdict}`}</p><div className="impact-summary-grid"><div className="overview-pill"><p className="overview-pill-label">You Give</p><p className="overview-pill-value">{formatMetricValue(tradeAnalysis.sideA.totalVorp)} VORP</p></div><div className="overview-pill"><p className="overview-pill-label">You Receive</p><p className="overview-pill-value">{formatMetricValue(tradeAnalysis.sideB.totalVorp)} VORP</p></div><div className="overview-pill"><p className="overview-pill-label">Net</p><p className="overview-pill-value">{formatMetricValue(tradeAnalysis.netVorpToA)}</p></div></div></article> : null}
        </>
      ) : null}

      {activeTool === "player-compare" ? (
        <>
          <div className="nba-fantasy-compare-picks">
            <SearchableEntitySelect id="nbaPlayerCompareA" label="Player A" value={playerA} onChange={setPlayerA} options={playerOptions} placeholder="Search player" fallbackPrefix="Player" />
            <SearchableEntitySelect id="nbaPlayerCompareB" label="Player B" value={playerB} onChange={setPlayerB} options={playerOptions} placeholder="Search player" fallbackPrefix="Player" />
          </div>
          <button type="button" disabled={loading || !playerA || !playerB} onClick={() => void runPlayerCompare()}>{loading ? "Comparing..." : "Compare Players"}</button>
          {playerCompare ? <article className="scout-card fantasy-card"><h3>{playerCompare.playerA.name} vs. {playerCompare.playerB.name}</h3><p className="callout-note">{playerCompare.decisionInsights ?? `Advantage: ${playerCompare.advantage}`}</p><div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Metric</th><th>{playerCompare.playerA.name}</th><th>{playerCompare.playerB.name}</th><th>Difference</th></tr></thead><tbody>{playerCompare.metrics.map((metric) => <tr key={metric.label}><td>{safeToText(metric.label)}</td><td>{formatMetricValue(metric.playerA)}</td><td>{formatMetricValue(metric.playerB)}</td><td>{formatMetricValue(metric.difference)}</td></tr>)}</tbody></table></div></article> : null}
        </>
      ) : null}

      {activeTool === "roster-compare" ? (
        <>
          <div className="nba-fantasy-rosters">
            <FantasyRosterBuilder title="Roster A" starters={starters} candidates={candidatePool} assignments={rosterA} unavailableIds={idsB} onChange={setRosterA} />
            <FantasyRosterBuilder title="Roster B" starters={starters} candidates={candidatePool} assignments={rosterB} unavailableIds={idsA} onChange={setRosterB} />
          </div>
          <button type="button" disabled={loading || !idsA.size || !idsB.size} onClick={() => void runRosterCompare()}>{loading ? "Comparing..." : "Compare Rosters"}</button>
          {rosterCompare ? <article className="scout-card fantasy-card"><h3>Roster Head-to-Head</h3><p className="callout-note">{rosterCompare.comparison.decisionInsights ?? `Advantage: ${rosterCompare.comparison.advantage}`}</p><div className="impact-summary-grid"><div className="overview-pill"><p className="overview-pill-label">Roster A starter VORP</p><p className="overview-pill-value">{formatMetricValue(rosterCompare.rosterA.starterVorp)}</p></div><div className="overview-pill"><p className="overview-pill-label">Roster B starter VORP</p><p className="overview-pill-value">{formatMetricValue(rosterCompare.rosterB.starterVorp)}</p></div></div><div className="nba-fantasy-rosters"><RosterSummary title="Roster A Starters" players={rosterCompare.rosterA.suggestedStarters} /><RosterSummary title="Roster B Starters" players={rosterCompare.rosterB.suggestedStarters} /></div></article> : null}
        </>
      ) : null}

      {activeTool === "team-grade" ? (
        <>
          <FantasyRosterBuilder title="Your NBA Roster" hint="Fill your lineup slots; the bench holds remaining players." starters={starters} candidates={candidatePool} assignments={gradeRoster} onChange={setGradeRoster} />
          <button type="button" disabled={loading || !Object.keys(gradeRoster).length} onClick={() => void runTeamGrade()}>{loading ? "Grading..." : "Grade Roster"}</button>
          {teamGrade ? <article className="scout-card fantasy-card"><h3>NBA Team Grade: {safeToText(teamGrade.grade)}</h3><p className="callout-note">{teamGrade.decisionInsights}</p><div className="impact-summary-grid"><div className="overview-pill"><p className="overview-pill-label">Overall</p><p className="overview-pill-value">{formatMetricValue(teamGrade.score)}</p></div><div className="overview-pill"><p className="overview-pill-label">Starter value</p><p className="overview-pill-value">{formatMetricValue(teamGrade.valueScore)}</p></div><div className="overview-pill"><p className="overview-pill-label">Market value</p><p className="overview-pill-value">{formatMetricValue(teamGrade.marketScore)}</p></div><div className="overview-pill"><p className="overview-pill-label">Coverage</p><p className="overview-pill-value">{formatMetricValue(teamGrade.coverageScore)}</p></div></div><RosterSummary title="Suggested Starters" players={teamGrade.suggestedStarters} /><p className="selector-note">Missing slots: {Object.entries(teamGrade.missingStarterSlots ?? {}).map(([slot, count]) => `${slot} ${count}`).join(" · ") || "None"}</p></article> : null}
        </>
      ) : null}
    </section>
  );
};

export default NbaFantasyPortal;
