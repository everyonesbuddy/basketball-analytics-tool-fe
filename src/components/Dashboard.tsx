import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  fetchFantasyConsistency,
  fetchFantasyDraftBoard,
  fetchFantasyRosterCompare,
  fetchFantasySeasonState,
  fetchFantasySleepers,
  fetchFantasyStartSit,
  fetchFantasyTeamGrade,
  fetchFantasyTradeAnalysis,
  fetchFantasyWaiverWire,
  fetchHeadToHead,
  fetchHealth,
  fetchPlayerComps,
  fetchPlayerImpact,
  fetchPlayerOptions,
  fetchPlayerProfile,
  fetchPlayerTrajectory,
  fetchPlayerUsageValue,
  fetchTeamCompare,
  fetchTeamEfficiency,
  fetchTeamGrade,
  fetchTeamNeedGap,
  fetchTeamOptions,
} from "../utils/dashboardApi";
import {
  getComparableSplitMetrics,
  toPositiveInt,
} from "../utils/dashboardFormatters";
import type {
  PlayerOption,
  CompSplitMode,
  ConsistencyResponse,
  DraftBoardResponse,
  FantasyPosition,
  FantasyPlayerCandidate,
  FantasyRosterCompareResponse,
  FantasyScoringId,
  FantasySeasonState,
  FantasyTeamGradeResponse,
  PlayerCompsResponse,
  PlayerImpactResponse,
  PlayerProfile,
  PlayerTrajectoryResponse,
  PlayerUsageValueResponse,
  SleepersResponse,
  StartSitResponse,
  TeamCompareResponse,
  TeamGradeResponse,
  TeamSeasonType,
  TeamNeedGapResponse,
  TeamOption,
  TeamEfficiencyResponse,
  TradeAnalysisResponse,
  WaiverWireResponse,
} from "../utils/dashboardTypes";
import { FantasySeasonBanner } from "./dashboard/DashboardCards";
import { assignCandidateToOpenSlot } from "./dashboard/DashboardCards";
import type {
  DraftTeamRosters,
  RosterSlotAssignments,
} from "./dashboard/DashboardCards";
import ComparePortal from "./features/ComparePortal";
import CompsPortal from "./features/CompsPortal";
import ConsistencyPortal from "./features/ConsistencyPortal";
import DraftBoardPortal from "./features/DraftBoardPortal";
import DraftSimulatorPortal from "./features/DraftSimulatorPortal";
import FantasyRosterComparePortal from "./features/FantasyRosterComparePortal";
import FantasyTeamGradePortal from "./features/FantasyTeamGradePortal";
import ImpactPortal from "./features/ImpactPortal";
import ProfilePortal from "./features/ProfilePortal";
import SleepersPortal from "./features/SleepersPortal";
import StartSitPortal from "./features/StartSitPortal";
import TeamComparePortal from "./features/TeamComparePortal";
import TeamPortal from "./features/TeamPortal";
import TradeAnalyzerPortal from "./features/TradeAnalyzerPortal";
import TrajectoryPortal from "./features/TrajectoryPortal";
import UsageValuePortal from "./features/UsageValuePortal";
import WaiverWirePortal from "./features/WaiverWirePortal";
import NbaFantasyPortal from "./features/NbaFantasyPortal";

type FeatureKey =
  | "profile"
  | "compare"
  | "impact"
  | "comps"
  | "usage-value"
  | "trajectory"
  | "team"
  | "team-compare"
  | "nba-fantasy"
  | "draft-board"
  | "draft-simulator"
  | "sleepers"
  | "trade"
  | "waivers"
  | "consistency"
  | "start-sit"
  | "fantasy-compare"
  | "fantasy-team-grade";

type NavItem = {
  key: FeatureKey;
  label: string;
  title: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "NBA Players",
    items: [
      {
        key: "profile",
        label: "Single Player Profile",
        title:
          "Single player profile with summary splits and core production chart.",
      },
      {
        key: "compare",
        label: "Player Head-to-Head",
        title: "Head-to-head profile comparison across matching split types.",
      },
      {
        key: "impact",
        label: "Plus-Minus Impact Trend",
        title: "Recent plus-minus trend and game-level context.",
      },
      {
        key: "comps",
        label: "Statistical Value Comps",
        title: "Player Value Comps based on normalized stat similarity.",
      },
      {
        key: "usage-value",
        label: "Usage vs. Production",
        title:
          "Usage-adjusted value benchmark against peers in the same usage bucket.",
      },
      {
        key: "trajectory",
        label: "Rolling Development Curve",
        title: "Development curve using rolling averages and trend direction.",
      },
    ],
  },
  {
    title: "NBA Teams",
    items: [
      {
        key: "team",
        label: "Team Efficiency & Needs",
        title:
          "Team efficiencies plus need-gap analysis against league benchmark.",
      },
      {
        key: "team-compare",
        label: "Team Head-to-Head",
        title:
          "Compares two teams' recent efficiency metrics and grades head-to-head.",
      },
    ],
  },
  {
    title: "NBA Fantasy",
    items: [
      {
        key: "nba-fantasy",
        label: "NBA Fantasy Tools",
        title:
          "NBA points-league draft values, trades, player and roster comparisons, and team grades.",
      },
    ],
  },
  {
    title: "NFL Fantasy",
    items: [
      {
        key: "draft-board",
        label: "Draft Board",
        title:
          "Tiered draft board with ADP, ownership, and roster-aware availability.",
      },
      {
        key: "draft-simulator",
        label: "Draft Simulator",
        title:
          "Plays your draft out many times from your slot to compare draft directions and next-pick options.",
      },
      {
        key: "sleepers",
        label: "Draft Values",
        title:
          "Draft-day value gaps ranked by ADP delta against position peers.",
      },
      {
        key: "trade",
        label: "Trade Analyzer",
        title: "Compares total VORP on each side of a proposed trade.",
      },
      {
        key: "waivers",
        label: "Waiver Wire",
        title: "Low-ownership players outperforming their recent projection.",
      },
      {
        key: "consistency",
        label: "Consistency",
        title: "Recent floor and volatility leaders across completed games.",
      },
      {
        key: "start-sit",
        label: "Start / Sit",
        title:
          "Next-week projection plus recent actual performance per player.",
      },
      {
        key: "fantasy-compare",
        label: "Roster Head-to-Head",
        title:
          "Compares two full rosters' best starting lineups on projected VORP.",
      },
      {
        key: "fantasy-team-grade",
        label: "Team Grade",
        title:
          "Grades your roster's starter value, market value, and lineup coverage.",
      },
    ],
  },
];

const FANTASY_FEATURE_KEYS = new Set<FeatureKey>([
  "draft-board",
  "draft-simulator",
  "sleepers",
  "trade",
  "waivers",
  "consistency",
  "start-sit",
  "fantasy-compare",
  "fantasy-team-grade",
]);

const DRAFT_STATE_STORAGE_KEY = "fantasy.draftState.v1";

type PersistedDraftState = {
  roster: PlayerOption[];
  teamRosters: DraftTeamRosters;
  selectedTeamIndex: number;
};

const EMPTY_DRAFT_STATE: PersistedDraftState = {
  roster: [],
  teamRosters: {},
  selectedTeamIndex: 0,
};

const readPersistedDraftState = (): PersistedDraftState => {
  try {
    const raw = window.localStorage.getItem(DRAFT_STATE_STORAGE_KEY);
    if (!raw) {
      return EMPTY_DRAFT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedDraftState>;
    return {
      roster: Array.isArray(parsed.roster) ? parsed.roster : [],
      teamRosters:
        parsed.teamRosters && typeof parsed.teamRosters === "object"
          ? parsed.teamRosters
          : {},
      selectedTeamIndex:
        typeof parsed.selectedTeamIndex === "number"
          ? parsed.selectedTeamIndex
          : 0,
    };
  } catch {
    return EMPTY_DRAFT_STATE;
  }
};

const Dashboard = () => {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("profile");
  const [healthToast, setHealthToast] = useState("");
  const [playerId, setPlayerId] = useState("1966");
  const [playerBId, setPlayerBId] = useState("3945274");
  const [impactPlayerId, setImpactPlayerId] = useState("1966");
  const [compsPlayerId, setCompsPlayerId] = useState("1966");
  const [usageValuePlayerId, setUsageValuePlayerId] = useState("1966");
  const [trajectoryPlayerId, setTrajectoryPlayerId] = useState("1966");
  const [teamId, setTeamId] = useState("10");
  const [impactGames, setImpactGames] = useState("10");
  const [impactSeasonType, setImpactSeasonType] =
    useState<TeamSeasonType>("all");
  const [teamGames, setTeamGames] = useState("5");
  const [compLimit, setCompLimit] = useState("10");
  const [compSampleSize, setCompSampleSize] = useState("100");
  const [compSplit, setCompSplit] = useState<CompSplitMode>("regular");
  const [trajectoryGames, setTrajectoryGames] = useState("20");
  const [trajectoryWindow, setTrajectoryWindow] = useState("5");
  const [trajectorySeasonType, setTrajectorySeasonType] =
    useState<TeamSeasonType>("all");
  const [teamSeasonType, setTeamSeasonType] = useState<TeamSeasonType>("all");
  const [teamQuery, setTeamQuery] = useState("");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [draftBoardPosition, setDraftBoardPosition] = useState<
    FantasyPosition | "ALL"
  >("ALL");
  const [draftBoardScoringId, setDraftBoardScoringId] =
    useState<FantasyScoringId>(3);
  const [draftBoardSeason, setDraftBoardSeason] = useState("");
  const [draftBoardTeamCount, setDraftBoardTeamCount] = useState("12");
  const [draftBoardStarters, setDraftBoardStarters] = useState("");
  const [persistedDraft] = useState(readPersistedDraftState);
  const [draftBoardRoster, setDraftBoardRoster] = useState<PlayerOption[]>(
    persistedDraft.roster,
  );
  const [draftTeamRosters, setDraftTeamRosters] = useState<DraftTeamRosters>(
    persistedDraft.teamRosters,
  );
  const [draftSelectedTeam, setDraftSelectedTeam] = useState(
    persistedDraft.selectedTeamIndex,
  );
  const [draftBoardRosterPick, setDraftBoardRosterPick] = useState("");
  const [sleepersScoringId, setSleepersScoringId] =
    useState<FantasyScoringId>(3);
  const [sleepersSeason, setSleepersSeason] = useState("");
  const [sleepersPositionFilter, setSleepersPositionFilter] = useState<
    FantasyPosition | "ALL"
  >("ALL");
  const [fantasySeason, setFantasySeason] = useState<FantasySeasonState | null>(
    null,
  );
  const [fantasyPlayerOptions, setFantasyPlayerOptions] = useState<
    PlayerOption[]
  >([]);
  const [loadingFantasyPlayerOptions, setLoadingFantasyPlayerOptions] =
    useState(false);
  const [tradeSideA, setTradeSideA] = useState<PlayerOption[]>([]);
  const [tradeSideB, setTradeSideB] = useState<PlayerOption[]>([]);
  const [tradeSideAPick, setTradeSideAPick] = useState("");
  const [tradeSideBPick, setTradeSideBPick] = useState("");
  const [tradeScoringId, setTradeScoringId] = useState<FantasyScoringId>(3);
  const [tradeSeason, setTradeSeason] = useState("");
  const [tradeTeamCount, setTradeTeamCount] = useState("12");
  const [tradeStarters, setTradeStarters] = useState("");
  const [waiverScoringId, setWaiverScoringId] = useState<FantasyScoringId>(3);
  const [waiverSeason, setWaiverSeason] = useState("");
  const [waiverOwnershipMax, setWaiverOwnershipMax] = useState("50");
  const [waiverWindow, setWaiverWindow] = useState("4");
  const [consistencyScoringId, setConsistencyScoringId] =
    useState<FantasyScoringId>(3);
  const [consistencySeason, setConsistencySeason] = useState("");
  const [consistencyWindow, setConsistencyWindow] = useState("4");
  const [startSitRoster, setStartSitRoster] = useState<PlayerOption[]>([]);
  const [startSitPick, setStartSitPick] = useState("");
  const [startSitScoringId, setStartSitScoringId] =
    useState<FantasyScoringId>(3);
  const [startSitSeason, setStartSitSeason] = useState("");
  const [startSitWindow, setStartSitWindow] = useState("4");
  const [teamBId, setTeamBId] = useState("20");
  const [fantasyCandidatePool, setFantasyCandidatePool] = useState<
    FantasyPlayerCandidate[]
  >([]);
  const [fantasyCompareRosterA, setFantasyCompareRosterA] =
    useState<RosterSlotAssignments>({});
  const [fantasyCompareRosterB, setFantasyCompareRosterB] =
    useState<RosterSlotAssignments>({});
  const [fantasyCompareScoringId, setFantasyCompareScoringId] =
    useState<FantasyScoringId>(3);
  const [fantasyCompareSeason, setFantasyCompareSeason] = useState("");
  const [fantasyCompareTeamCount, setFantasyCompareTeamCount] = useState("12");
  const [fantasyCompareStarters, setFantasyCompareStarters] = useState("");
  const [fantasyGradeRoster, setFantasyGradeRoster] =
    useState<RosterSlotAssignments>({});
  const [fantasyGradeScoringId, setFantasyGradeScoringId] =
    useState<FantasyScoringId>(3);
  const [fantasyGradeSeason, setFantasyGradeSeason] = useState("");
  const [fantasyGradeTeamCount, setFantasyGradeTeamCount] = useState("12");
  const [fantasyGradeStarters, setFantasyGradeStarters] = useState("");
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingTeamOptions, setLoadingTeamOptions] = useState(false);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [comparison, setComparison] = useState<PlayerProfile[]>([]);
  const [impact, setImpact] = useState<PlayerImpactResponse | null>(null);
  const [playerComps, setPlayerComps] = useState<PlayerCompsResponse | null>(
    null,
  );
  const [playerTrajectory, setPlayerTrajectory] =
    useState<PlayerTrajectoryResponse | null>(null);
  const [playerUsageValue, setPlayerUsageValue] =
    useState<PlayerUsageValueResponse | null>(null);
  const [teamEfficiency, setTeamEfficiency] =
    useState<TeamEfficiencyResponse | null>(null);
  const [teamNeedGap, setTeamNeedGap] = useState<TeamNeedGapResponse | null>(
    null,
  );
  const [draftBoard, setDraftBoard] = useState<DraftBoardResponse | null>(null);
  const [sleepers, setSleepers] = useState<SleepersResponse | null>(null);
  const [tradeAnalysis, setTradeAnalysis] =
    useState<TradeAnalysisResponse | null>(null);
  const [waivers, setWaivers] = useState<WaiverWireResponse | null>(null);
  const [consistency, setConsistency] = useState<ConsistencyResponse | null>(
    null,
  );
  const [startSit, setStartSit] = useState<StartSitResponse | null>(null);
  const [teamGrade, setTeamGrade] = useState<TeamGradeResponse | null>(null);
  const [teamCompare, setTeamCompare] = useState<TeamCompareResponse | null>(
    null,
  );
  const [fantasyRosterCompare, setFantasyRosterCompare] =
    useState<FantasyRosterCompareResponse | null>(null);
  const [fantasyTeamGrade, setFantasyTeamGrade] =
    useState<FantasyTeamGradeResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);
  const [loadingUsageValue, setLoadingUsageValue] = useState(false);
  const [loadingTrajectory, setLoadingTrajectory] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingDraftBoard, setLoadingDraftBoard] = useState(false);
  const [loadingSleepers, setLoadingSleepers] = useState(false);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [loadingWaivers, setLoadingWaivers] = useState(false);
  const [loadingConsistency, setLoadingConsistency] = useState(false);
  const [loadingStartSit, setLoadingStartSit] = useState(false);
  const [loadingTeamCompare, setLoadingTeamCompare] = useState(false);
  const [loadingFantasyCompare, setLoadingFantasyCompare] = useState(false);
  const [loadingFantasyTeamGrade, setLoadingFantasyTeamGrade] = useState(false);

  const draftBoardCandidateOptions = useMemo<PlayerOption[]>(
    () =>
      (draftBoard?.candidates ?? []).map((candidate) => ({
        id: String(candidate.id),
        label: `${candidate.name} (${candidate.position})`,
      })),
    [draftBoard],
  );

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      setLoadingTeamOptions(true);
      try {
        const [playerResult, teamResult] = await Promise.allSettled([
          fetchPlayerOptions(forceRefresh),
          fetchTeamOptions(forceRefresh),
        ]);

        if (playerResult.status === "fulfilled") {
          const options = playerResult.value;
          if (options.length) {
            setPlayerOptions(options);

            if (!options.some((option) => option.id === playerId)) {
              setPlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === playerBId)) {
              setPlayerBId(options[0].id);
            }

            if (!options.some((option) => option.id === impactPlayerId)) {
              setImpactPlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === compsPlayerId)) {
              setCompsPlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === usageValuePlayerId)) {
              setUsageValuePlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === trajectoryPlayerId)) {
              setTrajectoryPlayerId(options[0].id);
            }
          }
        } else {
          setError(
            "Failed to load player selector options from backend route /players/options.",
          );
        }

        if (teamResult.status === "fulfilled") {
          const options = teamResult.value;
          if (options.length) {
            setTeamOptions(options);
            if (!options.some((option) => option.id === teamId)) {
              setTeamId(options[0].id);
            }
          }
        } else {
          setError(
            "Failed to load team selector options from backend route /teams.",
          );
        }
      } finally {
        setLoadingOptions(false);
        setLoadingTeamOptions(false);
      }
    };

    void loadOptions();
  }, [forceRefresh]);

  useEffect(() => {
    const loadFantasyContext = async () => {
      setLoadingFantasyPlayerOptions(true);
      try {
        const [seasonResult, boardResult] = await Promise.allSettled([
          fetchFantasySeasonState(forceRefresh),
          fetchFantasyDraftBoard(forceRefresh, 3),
        ]);

        if (seasonResult.status === "fulfilled") {
          setFantasySeason(seasonResult.value);
        } else {
          setError(
            "Failed to load fantasy season state from backend route /fantasy/season.",
          );
        }

        if (boardResult.status === "fulfilled") {
          const options = (boardResult.value.candidates ?? []).map(
            (candidate) => ({
              id: String(candidate.id),
              label: `${candidate.name} (${candidate.position})`,
            }),
          );
          setFantasyPlayerOptions(options);
          // Unfiltered pool (no rosterSoFar), so the roster builders can still
          // pick players an in-progress draft has already removed.
          setFantasyCandidatePool(boardResult.value.candidates ?? []);
          // Reuse this same default-filter fetch as the Draft Board's initial
          // data so the tab opens pre-loaded instead of needing a manual load.
          setDraftBoard(boardResult.value);
        }
      } finally {
        setLoadingFantasyPlayerOptions(false);
      }

      // A saved draft means the default board still lists already-drafted
      // players, so refetch it with the restored picks excluded.
      if (persistedDraft.roster.length) {
        void runDraftBoardLoad(persistedDraft.roster.map((entry) => entry.id));
      }
    };

    void loadFantasyContext();
  }, [forceRefresh]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        DRAFT_STATE_STORAGE_KEY,
        JSON.stringify({
          roster: draftBoardRoster,
          teamRosters: draftTeamRosters,
          selectedTeamIndex: draftSelectedTeam,
        }),
      );
    } catch {
      // Storage can be unavailable or full — the draft just won't persist.
    }
  }, [draftBoardRoster, draftTeamRosters, draftSelectedTeam]);

  const loadPlayerUsageValue = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(usageValuePlayerId);
    if (!id) {
      setError("Usage value player ID must be a positive integer.");
      return;
    }

    setLoadingUsageValue(true);
    try {
      const data = await fetchPlayerUsageValue(id, forceRefresh);
      setPlayerUsageValue(data);
    } catch {
      setError(
        `Failed to load usage value for athlete ${id}. Confirm backend /players/:athleteId/usage-value route.`,
      );
    } finally {
      setLoadingUsageValue(false);
    }
  };

  useEffect(() => {
    const trimmedQuery = teamQuery.trim();

    if (!trimmedQuery) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const options = await fetchTeamOptions(forceRefresh, trimmedQuery);
        if (options.length) {
          setTeamOptions(options);
        }
      } catch {
        setError("Failed to search teams from backend route /teams.");
      }
    }, 240);

    return () => window.clearTimeout(timer);
  }, [teamQuery, forceRefresh]);

  const checkHealth = async () => {
    setError("");
    try {
      await fetchHealth();
      setHealthToast("Basketball analytics backend is running");
      window.setTimeout(() => setHealthToast(""), 3000);
    } catch {
      setError(
        "Could not reach backend health endpoint. Confirm API URL and backend server status.",
      );
    }
  };

  const fetchPlayer = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(playerId);

    if (!id) {
      setError("Player ID must be a positive integer.");
      return;
    }

    setLoadingSingle(true);
    try {
      const profile = await fetchPlayerProfile(id, forceRefresh);
      setPlayer(profile);
    } catch {
      setError(`Failed to load player ${id}. Check backend route and ID.`);
    } finally {
      setLoadingSingle(false);
    }
  };

  const loadPlayerComps = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(compsPlayerId);
    const limit = Math.max(1, Math.min(toPositiveInt(compLimit) ?? 10, 25));
    const sampleSize = Math.max(
      30,
      Math.min(toPositiveInt(compSampleSize) ?? 100, 120),
    );

    if (!id) {
      setError("Comps player ID must be a positive integer.");
      return;
    }

    setLoadingComps(true);
    try {
      const data = await fetchPlayerComps(
        id,
        forceRefresh,
        limit,
        sampleSize,
        compSplit,
      );
      setPlayerComps(data);
    } catch {
      setError(
        `Failed to load comps for athlete ${id}. Confirm backend /players/:athleteId/comps route.`,
      );
    } finally {
      setLoadingComps(false);
    }
  };

  const loadPlayerTrajectory = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(trajectoryPlayerId);
    const games = Math.max(
      5,
      Math.min(toPositiveInt(trajectoryGames) ?? 20, 30),
    );
    const window = Math.max(
      2,
      Math.min(toPositiveInt(trajectoryWindow) ?? 5, 20),
    );

    if (!id) {
      setError("Trajectory player ID must be a positive integer.");
      return;
    }

    setLoadingTrajectory(true);
    try {
      const data = await fetchPlayerTrajectory(
        id,
        forceRefresh,
        games,
        window,
        trajectorySeasonType,
      );
      setPlayerTrajectory(data);
    } catch {
      setError(
        `Failed to load trajectory for athlete ${id}. Confirm backend /players/:athleteId/trajectory route.`,
      );
    } finally {
      setLoadingTrajectory(false);
    }
  };

  const comparePlayers = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const a = toPositiveInt(playerId);
    const b = toPositiveInt(playerBId);

    if (!a || !b) {
      setError("Both comparison IDs must be positive integers.");
      return;
    }

    setLoadingCompare(true);
    try {
      const players = await fetchHeadToHead(a, b, forceRefresh);
      setComparison(players);
    } catch {
      setError(
        "Comparison request failed. Confirm both IDs exist and backend is running.",
      );
    } finally {
      setLoadingCompare(false);
    }
  };

  const loadPlayerImpact = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(impactPlayerId);
    const games = toPositiveInt(impactGames) ?? 10;

    if (!id) {
      setError("Impact player ID must be a positive integer.");
      return;
    }

    setLoadingImpact(true);
    try {
      const data = await fetchPlayerImpact(
        id,
        forceRefresh,
        games,
        impactSeasonType,
      );
      setImpact(data);
    } catch {
      setError(
        `Failed to load player impact for athlete ${id}. Confirm backend /players/:athleteId/impact route.`,
      );
    } finally {
      setLoadingImpact(false);
    }
  };

  const loadTeamEfficiency = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(teamId);
    const games = Math.max(1, Math.min(toPositiveInt(teamGames) ?? 5, 15));

    if (!id) {
      setError("Team ID must be a positive integer.");
      return;
    }

    setLoadingTeam(true);
    try {
      const [efficiencyResult, needGapResult, gradeResult] =
        await Promise.allSettled([
          fetchTeamEfficiency(id, forceRefresh, games, teamSeasonType),
          fetchTeamNeedGap(id, forceRefresh, games, teamSeasonType),
          fetchTeamGrade(id, forceRefresh, games, teamSeasonType),
        ]);

      if (efficiencyResult.status === "fulfilled") {
        setTeamEfficiency(efficiencyResult.value);
      } else {
        throw new Error("team-efficiency-fetch-failed");
      }

      if (needGapResult.status === "fulfilled") {
        setTeamNeedGap(needGapResult.value);
      } else {
        setTeamNeedGap(null);
      }

      if (gradeResult.status === "fulfilled") {
        setTeamGrade(gradeResult.value);
      } else {
        setTeamGrade(null);
      }
    } catch {
      setError(
        `Failed to load team efficiency for team ${id}. Confirm backend /teams/:teamId/efficiency route.`,
      );
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadTeamCompare = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const idA = toPositiveInt(teamId);
    const idB = toPositiveInt(teamBId);
    const games = Math.max(1, Math.min(toPositiveInt(teamGames) ?? 5, 15));

    if (!idA || !idB) {
      setError("Both team IDs must be positive integers.");
      return;
    }

    if (idA === idB) {
      setError("Pick two different teams to compare.");
      return;
    }

    setLoadingTeamCompare(true);
    try {
      const data = await fetchTeamCompare(
        idA,
        idB,
        forceRefresh,
        games,
        teamSeasonType,
      );
      setTeamCompare(data);
    } catch {
      setError(
        "Failed to compare teams. Confirm backend /api/teams/compare/head-to-head route.",
      );
    } finally {
      setLoadingTeamCompare(false);
    }
  };

  const loadFantasyRosterCompare = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const rosterAIds = Object.values(fantasyCompareRosterA).map((player) =>
      String(player.id),
    );
    const rosterBIds = Object.values(fantasyCompareRosterB).map((player) =>
      String(player.id),
    );

    if (!rosterAIds.length || !rosterBIds.length) {
      setError("Add at least one player to each roster before comparing.");
      return;
    }

    setLoadingFantasyCompare(true);
    try {
      const data = await fetchFantasyRosterCompare(
        forceRefresh,
        rosterAIds,
        rosterBIds,
        fantasyCompareScoringId,
        fantasyCompareSeason.trim() || undefined,
        {
          teamCount: toPositiveInt(fantasyCompareTeamCount) ?? undefined,
          starters: fantasyCompareStarters.trim() || undefined,
        },
      );
      setFantasyRosterCompare(data);
    } catch {
      setError(
        "Failed to compare fantasy rosters. Confirm backend /api/fantasy/compare/head-to-head route.",
      );
    } finally {
      setLoadingFantasyCompare(false);
    }
  };

  const loadFantasyTeamGrade = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const rosterIds = Object.values(fantasyGradeRoster).map((player) =>
      String(player.id),
    );

    if (!rosterIds.length) {
      setError("Add at least one player to your roster.");
      return;
    }

    setLoadingFantasyTeamGrade(true);
    try {
      const data = await fetchFantasyTeamGrade(
        forceRefresh,
        rosterIds,
        fantasyGradeScoringId,
        fantasyGradeSeason.trim() || undefined,
        {
          teamCount: toPositiveInt(fantasyGradeTeamCount) ?? undefined,
          starters: fantasyGradeStarters.trim() || undefined,
        },
      );
      setFantasyTeamGrade(data);
    } catch {
      setError(
        "Failed to grade fantasy roster. Confirm backend /api/fantasy/team-grade route.",
      );
    } finally {
      setLoadingFantasyTeamGrade(false);
    }
  };

  const addToDraftBoardRoster = () => {
    if (!draftBoardRosterPick) {
      return;
    }

    setDraftBoardRosterPick("");
    draftPlayerIdToSelectedTeam(draftBoardRosterPick);
  };

  const removeFromDraftBoardRoster = (id: string) => {
    const nextRoster = draftBoardRoster.filter((entry) => entry.id !== id);
    setDraftBoardRoster(nextRoster);
    void runDraftBoardLoad(nextRoster.map((entry) => entry.id));
  };

  const runDraftBoardLoad = async (rosterIds: string[]) => {
    setError("");
    setLoadingDraftBoard(true);
    try {
      const data = await fetchFantasyDraftBoard(
        forceRefresh,
        draftBoardScoringId,
        draftBoardPosition === "ALL" ? undefined : draftBoardPosition,
        rosterIds,
        draftBoardSeason.trim() || undefined,
        {
          teamCount: toPositiveInt(draftBoardTeamCount) ?? undefined,
          starters: draftBoardStarters.trim() || undefined,
        },
      );
      setDraftBoard(data);
    } catch {
      setError(
        "Failed to load fantasy draft board. Confirm backend /api/fantasy/draft-board route.",
      );
    } finally {
      setLoadingDraftBoard(false);
    }
  };

  const loadDraftBoard = async (event: FormEvent) => {
    event.preventDefault();
    await runDraftBoardLoad(draftBoardRoster.map((entry) => entry.id));
  };

  const markDraftBoardPlayerDrafted = (id: string) => {
    const alreadyRostered = draftBoardRoster.some((entry) => entry.id === id);
    const option = draftBoardCandidateOptions.find(
      (candidate) => candidate.id === id,
    );
    const nextRoster = alreadyRostered
      ? draftBoardRoster
      : [...draftBoardRoster, option ?? { id, label: `Player #${id}` }];

    setDraftBoardRoster(nextRoster);
    void runDraftBoardLoad(nextRoster.map((entry) => entry.id));
  };

  const resetDraftBoardDraft = () => {
    setDraftTeamRosters({});
    setDraftSelectedTeam(0);
    setDraftBoardRoster([]);
    void runDraftBoardLoad([]);
  };

  // Every draft action attributes the player to a team, so nobody leaves the
  // pool without a roster attached.
  const draftCandidateToSelectedTeam = (candidate: FantasyPlayerCandidate) => {
    setDraftTeamRosters((current) =>
      assignCandidateToOpenSlot(
        current,
        draftSelectedTeam,
        draftBoard?.leagueSettings?.starters,
        candidate,
      ),
    );
    markDraftBoardPlayerDrafted(String(candidate.id));
  };

  const draftPlayerIdToSelectedTeam = (id: string) => {
    const candidate = (draftBoard?.candidates ?? []).find(
      (entry) => String(entry.id) === id,
    );

    if (candidate) {
      draftCandidateToSelectedTeam(candidate);
      return;
    }

    markDraftBoardPlayerDrafted(id);
  };

  const draftState = {
    teamRosters: draftTeamRosters,
    selectedTeamIndex: draftSelectedTeam,
    onTeamRostersChange: setDraftTeamRosters,
    onSelectTeam: setDraftSelectedTeam,
    onUndraftPlayer: removeFromDraftBoardRoster,
    onReset: resetDraftBoardDraft,
  };

  const loadSleepers = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    setLoadingSleepers(true);
    try {
      const data = await fetchFantasySleepers(
        forceRefresh,
        sleepersScoringId,
        sleepersSeason.trim() || undefined,
      );
      setSleepers(data);
    } catch {
      setError(
        "Failed to load fantasy sleepers. Confirm backend /api/fantasy/sleepers route.",
      );
    } finally {
      setLoadingSleepers(false);
    }
  };

  const addToTradeSide = (
    pickId: string,
    setSide: typeof setTradeSideA,
    setPick: typeof setTradeSideAPick,
  ) => {
    if (!pickId) {
      return;
    }

    setSide((current) => {
      if (current.some((entry) => entry.id === pickId)) {
        return current;
      }

      const option = fantasyPlayerOptions.find((entry) => entry.id === pickId);
      if (!option) {
        return current;
      }

      return [...current, option];
    });
    setPick("");
  };

  const removeFromTradeSide = (id: string, setSide: typeof setTradeSideA) => {
    setSide((current) => current.filter((entry) => entry.id !== id));
  };

  const loadTradeAnalysis = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!tradeSideA.length || !tradeSideB.length) {
      setError("Add at least one player to each side before analyzing.");
      return;
    }

    setLoadingTrade(true);
    try {
      const data = await fetchFantasyTradeAnalysis(
        forceRefresh,
        tradeSideA.map((entry) => entry.id),
        tradeSideB.map((entry) => entry.id),
        tradeScoringId,
        tradeSeason.trim() || undefined,
        {
          teamCount: toPositiveInt(tradeTeamCount) ?? undefined,
          starters: tradeStarters.trim() || undefined,
        },
      );
      setTradeAnalysis(data);
    } catch {
      setError(
        "Failed to analyze trade. Confirm backend /api/fantasy/trades/analyze route.",
      );
    } finally {
      setLoadingTrade(false);
    }
  };

  const loadWaiverWire = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    setLoadingWaivers(true);
    try {
      const data = await fetchFantasyWaiverWire(
        forceRefresh,
        waiverScoringId,
        waiverSeason.trim() || undefined,
        toPositiveInt(waiverOwnershipMax) ?? 50,
        toPositiveInt(waiverWindow) ?? 4,
      );
      setWaivers(data);
    } catch {
      setError(
        "Failed to load waiver wire. Confirm backend /api/fantasy/waivers route.",
      );
    } finally {
      setLoadingWaivers(false);
    }
  };

  const loadConsistencyLeaders = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    setLoadingConsistency(true);
    try {
      const data = await fetchFantasyConsistency(
        forceRefresh,
        consistencyScoringId,
        consistencySeason.trim() || undefined,
        toPositiveInt(consistencyWindow) ?? 4,
      );
      setConsistency(data);
    } catch {
      setError(
        "Failed to load consistency leaders. Confirm backend /api/fantasy/consistency route.",
      );
    } finally {
      setLoadingConsistency(false);
    }
  };

  const addToStartSitRoster = () => {
    if (!startSitPick) {
      return;
    }

    setStartSitRoster((current) => {
      if (current.some((entry) => entry.id === startSitPick)) {
        return current;
      }

      const option = fantasyPlayerOptions.find(
        (entry) => entry.id === startSitPick,
      );
      if (!option) {
        return current;
      }

      return [...current, option];
    });
    setStartSitPick("");
  };

  const removeFromStartSitRoster = (id: string) => {
    setStartSitRoster((current) => current.filter((entry) => entry.id !== id));
  };

  const loadStartSit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!startSitRoster.length) {
      setError("Add at least one player to compare.");
      return;
    }

    setLoadingStartSit(true);
    try {
      const data = await fetchFantasyStartSit(
        forceRefresh,
        startSitRoster.map((entry) => entry.id),
        startSitScoringId,
        startSitSeason.trim() || undefined,
        toPositiveInt(startSitWindow) ?? 4,
      );
      setStartSit(data);
    } catch {
      setError(
        "Failed to load start/sit recommendations. Confirm backend /api/fantasy/start-sit route.",
      );
    } finally {
      setLoadingStartSit(false);
    }
  };

  const compareSplitGroups =
    comparison.length >= 2
      ? getComparableSplitMetrics(comparison[0], comparison[1])
      : [];

  return (
    <main className="dashboard-shell app-shell">
      <nav className="app-sidebar" aria-label="Feature navigation">
        <div className="app-sidebar__brand">
          <h1>Analytics Tool</h1>
        </div>
        {NAV_GROUPS.map((group) => (
          <div className="app-sidebar__group" key={group.title}>
            <p className="app-sidebar__group-title">{group.title}</p>
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={activeFeature === item.key}
                className={`app-sidebar__link ${
                  FANTASY_FEATURE_KEYS.has(item.key)
                    ? "app-sidebar__link--fantasy"
                    : ""
                } ${activeFeature === item.key ? "active" : ""}`}
                onClick={() => setActiveFeature(item.key)}
                title={item.title}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="app-content">
        <header className="app-topbar">
          <div className="app-topbar__row">
            <button type="button" onClick={checkHealth}>
              Check API Health
            </button>
            <a
              className="button-link button-link--demo"
              href="https://www.loom.com/share/97bfd45b2bc942fe89676ffb9742ad9f"
              target="_blank"
              rel="noreferrer"
            >
              Watch Demo
            </a>
            <div className="toggle-help-group">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={forceRefresh}
                  onChange={(event) => setForceRefresh(event.target.checked)}
                />
                Bypass Cache
              </label>
              <button
                type="button"
                className="help-icon"
                aria-label="Bypass Cache help"
                title="Bypass Cache forces the dashboard to fetch fresh data from the backend instead of using cached results."
              >
                i
              </button>
            </div>
          </div>

          {healthToast ? (
            <div className="health-toast" role="status" aria-live="polite">
              {healthToast}
            </div>
          ) : null}

          {error ? <p className="error-note">{error}</p> : null}
          {FANTASY_FEATURE_KEYS.has(activeFeature) ? (
            <FantasySeasonBanner season={fantasySeason} />
          ) : null}
        </header>

        <div className="feature-transition" key={activeFeature}>
          {activeFeature === "profile" ? (
            <ProfilePortal
              playerId={playerId}
              playerOptions={playerOptions}
              player={player}
              loadingOptions={loadingOptions}
              loadingSingle={loadingSingle}
              onPlayerIdChange={setPlayerId}
              onSubmit={fetchPlayer}
            />
          ) : activeFeature === "compare" ? (
            <ComparePortal
              playerId={playerId}
              playerBId={playerBId}
              playerOptions={playerOptions}
              comparison={comparison}
              compareSplitGroups={compareSplitGroups}
              loadingOptions={loadingOptions}
              loadingCompare={loadingCompare}
              onPlayerIdChange={setPlayerId}
              onPlayerBIdChange={setPlayerBId}
              onSubmit={comparePlayers}
            />
          ) : activeFeature === "impact" ? (
            <ImpactPortal
              impactPlayerId={impactPlayerId}
              impactGames={impactGames}
              impactSeasonType={impactSeasonType}
              playerOptions={playerOptions}
              impact={impact}
              loadingOptions={loadingOptions}
              loadingImpact={loadingImpact}
              onImpactPlayerIdChange={setImpactPlayerId}
              onImpactGamesChange={setImpactGames}
              onImpactSeasonTypeChange={setImpactSeasonType}
              onSubmit={loadPlayerImpact}
            />
          ) : activeFeature === "comps" ? (
            <CompsPortal
              compsPlayerId={compsPlayerId}
              compLimit={compLimit}
              compSampleSize={compSampleSize}
              compSplit={compSplit}
              playerOptions={playerOptions}
              playerComps={playerComps}
              loadingOptions={loadingOptions}
              loadingComps={loadingComps}
              onCompsPlayerIdChange={setCompsPlayerId}
              onCompLimitChange={setCompLimit}
              onCompSampleSizeChange={setCompSampleSize}
              onCompSplitChange={setCompSplit}
              onSubmit={loadPlayerComps}
            />
          ) : activeFeature === "trajectory" ? (
            <TrajectoryPortal
              trajectoryPlayerId={trajectoryPlayerId}
              trajectoryGames={trajectoryGames}
              trajectoryWindow={trajectoryWindow}
              trajectorySeasonType={trajectorySeasonType}
              playerOptions={playerOptions}
              playerTrajectory={playerTrajectory}
              loadingOptions={loadingOptions}
              loadingTrajectory={loadingTrajectory}
              onTrajectoryPlayerIdChange={setTrajectoryPlayerId}
              onTrajectoryGamesChange={setTrajectoryGames}
              onTrajectoryWindowChange={setTrajectoryWindow}
              onTrajectorySeasonTypeChange={setTrajectorySeasonType}
              onSubmit={loadPlayerTrajectory}
            />
          ) : activeFeature === "usage-value" ? (
            <UsageValuePortal
              usageValuePlayerId={usageValuePlayerId}
              playerOptions={playerOptions}
              playerUsageValue={playerUsageValue}
              loadingOptions={loadingOptions}
              loadingUsageValue={loadingUsageValue}
              onUsageValuePlayerIdChange={setUsageValuePlayerId}
              onSubmit={loadPlayerUsageValue}
            />
          ) : activeFeature === "team" ? (
            <TeamPortal
              teamId={teamId}
              teamGames={teamGames}
              teamSeasonType={teamSeasonType}
              teamOptions={teamOptions}
              teamEfficiency={teamEfficiency}
              teamNeedGap={teamNeedGap}
              teamGrade={teamGrade}
              loadingTeam={loadingTeam}
              loadingTeamOptions={loadingTeamOptions}
              onTeamIdChange={(nextId) => {
                setTeamId(nextId);
                setTeamQuery("");
              }}
              onTeamGamesChange={setTeamGames}
              onTeamSeasonTypeChange={setTeamSeasonType}
              onTeamQueryChange={setTeamQuery}
              onSubmit={loadTeamEfficiency}
            />
          ) : activeFeature === "team-compare" ? (
            <TeamComparePortal
              teamAId={teamId}
              teamBId={teamBId}
              teamGames={teamGames}
              teamSeasonType={teamSeasonType}
              teamOptions={teamOptions}
              teamCompare={teamCompare}
              loadingTeamCompare={loadingTeamCompare}
              loadingTeamOptions={loadingTeamOptions}
              onTeamAIdChange={setTeamId}
              onTeamBIdChange={setTeamBId}
              onTeamGamesChange={setTeamGames}
              onTeamSeasonTypeChange={setTeamSeasonType}
              onSubmit={loadTeamCompare}
            />
          ) : activeFeature === "nba-fantasy" ? (
            <NbaFantasyPortal forceRefresh={forceRefresh} />
          ) : activeFeature === "draft-board" ? (
            <DraftBoardPortal
              draftBoardPosition={draftBoardPosition}
              draftBoardScoringId={draftBoardScoringId}
              draftBoardSeason={draftBoardSeason}
              draftBoardTeamCount={draftBoardTeamCount}
              draftBoardStarters={draftBoardStarters}
              draftBoardRoster={draftBoardRoster}
              draftBoardRosterPick={draftBoardRosterPick}
              draftBoardCandidateOptions={draftBoardCandidateOptions}
              draftBoard={draftBoard}
              draftState={draftState}
              loadingDraftBoard={loadingDraftBoard}
              onDraftBoardPositionChange={setDraftBoardPosition}
              onDraftBoardScoringIdChange={setDraftBoardScoringId}
              onDraftBoardSeasonChange={setDraftBoardSeason}
              onDraftBoardTeamCountChange={setDraftBoardTeamCount}
              onDraftBoardStartersChange={setDraftBoardStarters}
              onDraftBoardRosterPickChange={setDraftBoardRosterPick}
              onAddToRoster={addToDraftBoardRoster}
              onRemoveFromRoster={removeFromDraftBoardRoster}
              onMarkDrafted={markDraftBoardPlayerDrafted}
              onDraftCandidate={draftCandidateToSelectedTeam}
              onSubmit={loadDraftBoard}
            />
          ) : activeFeature === "draft-simulator" ? (
            <DraftSimulatorPortal
              sport="nfl"
              pickIds={draftBoardRoster.map((entry) => entry.id)}
              teamCount={draftBoardTeamCount}
              starters={draftBoardStarters}
              season={draftBoardSeason}
              scoringId={draftBoardScoringId}
              forceRefresh={forceRefresh}
            />
          ) : activeFeature === "sleepers" ? (
            <SleepersPortal
              sleepersScoringId={sleepersScoringId}
              sleepersSeason={sleepersSeason}
              sleepersPositionFilter={sleepersPositionFilter}
              sleepers={sleepers}
              loadingSleepers={loadingSleepers}
              onSleepersScoringIdChange={setSleepersScoringId}
              onSleepersSeasonChange={setSleepersSeason}
              onSleepersPositionFilterChange={setSleepersPositionFilter}
              onSubmit={loadSleepers}
            />
          ) : activeFeature === "trade" ? (
            <TradeAnalyzerPortal
              fantasyPlayerOptions={fantasyPlayerOptions}
              sideA={tradeSideA}
              sideB={tradeSideB}
              sideAPick={tradeSideAPick}
              sideBPick={tradeSideBPick}
              scoringId={tradeScoringId}
              season={tradeSeason}
              teamCount={tradeTeamCount}
              starters={tradeStarters}
              tradeAnalysis={tradeAnalysis}
              loadingTrade={loadingTrade}
              loadingPlayerOptions={loadingFantasyPlayerOptions}
              onSideAPickChange={setTradeSideAPick}
              onSideBPickChange={setTradeSideBPick}
              onAddSideA={() =>
                addToTradeSide(tradeSideAPick, setTradeSideA, setTradeSideAPick)
              }
              onAddSideB={() =>
                addToTradeSide(tradeSideBPick, setTradeSideB, setTradeSideBPick)
              }
              onRemoveSideA={(id) => removeFromTradeSide(id, setTradeSideA)}
              onRemoveSideB={(id) => removeFromTradeSide(id, setTradeSideB)}
              onScoringIdChange={setTradeScoringId}
              onSeasonChange={setTradeSeason}
              onTeamCountChange={setTradeTeamCount}
              onStartersChange={setTradeStarters}
              onSubmit={loadTradeAnalysis}
            />
          ) : activeFeature === "waivers" ? (
            <WaiverWirePortal
              scoringId={waiverScoringId}
              season={waiverSeason}
              ownershipMax={waiverOwnershipMax}
              window={waiverWindow}
              waivers={waivers}
              loadingWaivers={loadingWaivers}
              onScoringIdChange={setWaiverScoringId}
              onSeasonChange={setWaiverSeason}
              onOwnershipMaxChange={setWaiverOwnershipMax}
              onWindowChange={setWaiverWindow}
              onSubmit={loadWaiverWire}
            />
          ) : activeFeature === "consistency" ? (
            <ConsistencyPortal
              scoringId={consistencyScoringId}
              season={consistencySeason}
              window={consistencyWindow}
              consistency={consistency}
              loadingConsistency={loadingConsistency}
              onScoringIdChange={setConsistencyScoringId}
              onSeasonChange={setConsistencySeason}
              onWindowChange={setConsistencyWindow}
              onSubmit={loadConsistencyLeaders}
            />
          ) : activeFeature === "start-sit" ? (
            <StartSitPortal
              fantasyPlayerOptions={fantasyPlayerOptions}
              roster={startSitRoster}
              rosterPick={startSitPick}
              scoringId={startSitScoringId}
              season={startSitSeason}
              window={startSitWindow}
              startSit={startSit}
              loadingStartSit={loadingStartSit}
              loadingPlayerOptions={loadingFantasyPlayerOptions}
              onRosterPickChange={setStartSitPick}
              onAddToRoster={addToStartSitRoster}
              onRemoveFromRoster={removeFromStartSitRoster}
              onScoringIdChange={setStartSitScoringId}
              onSeasonChange={setStartSitSeason}
              onWindowChange={setStartSitWindow}
              onSubmit={loadStartSit}
            />
          ) : activeFeature === "fantasy-compare" ? (
            <FantasyRosterComparePortal
              candidatePool={fantasyCandidatePool}
              rosterA={fantasyCompareRosterA}
              rosterB={fantasyCompareRosterB}
              scoringId={fantasyCompareScoringId}
              season={fantasyCompareSeason}
              teamCount={fantasyCompareTeamCount}
              starters={fantasyCompareStarters}
              rosterCompare={fantasyRosterCompare}
              loadingCompare={loadingFantasyCompare}
              onRosterAChange={setFantasyCompareRosterA}
              onRosterBChange={setFantasyCompareRosterB}
              onScoringIdChange={setFantasyCompareScoringId}
              onSeasonChange={setFantasyCompareSeason}
              onTeamCountChange={setFantasyCompareTeamCount}
              onStartersChange={setFantasyCompareStarters}
              onSubmit={loadFantasyRosterCompare}
            />
          ) : (
            <FantasyTeamGradePortal
              candidatePool={fantasyCandidatePool}
              roster={fantasyGradeRoster}
              scoringId={fantasyGradeScoringId}
              season={fantasyGradeSeason}
              teamCount={fantasyGradeTeamCount}
              starters={fantasyGradeStarters}
              teamGrade={fantasyTeamGrade}
              loadingTeamGrade={loadingFantasyTeamGrade}
              onRosterChange={setFantasyGradeRoster}
              onScoringIdChange={setFantasyGradeScoringId}
              onSeasonChange={setFantasyGradeSeason}
              onTeamCountChange={setFantasyGradeTeamCount}
              onStartersChange={setFantasyGradeStarters}
              onSubmit={loadFantasyTeamGrade}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
