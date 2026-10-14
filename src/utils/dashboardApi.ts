import axios from "axios";
import type {
  ApiEnvelope,
  CompareResponse,
  ConsistencyResponse,
  DraftBoardResponse,
  FantasyPlayerCompareResponse,
  FantasyPosition,
  FantasyRosterCompareResponse,
  FantasyScoringId,
  FantasySeasonState,
  FantasyTeamGradeResponse,
  HealthResponse,
  PlayerUsageValueResponse,
  PlayerOption,
  PlayerCompsResponse,
  CompSplitMode,
  DraftSimulatorResponse,
  DraftSimulatorSport,
  PlayerImpactResponse,
  PlayerProfile,
  PlayerTrajectoryResponse,
  SleepersResponse,
  StartSitResponse,
  TeamSeasonType,
  TeamCompareResponse,
  TeamGradeResponse,
  TeamNeedGapResponse,
  TeamOption,
  TeamEfficiencyResponse,
  TradeAnalysisResponse,
  WaiverWireResponse,
  NbaFantasyDraftBoardResponse,
  NbaFantasyPlayerCompareResponse,
  NbaFantasyPosition,
  NbaFantasyRosterCompareResponse,
  NbaFantasySeasonState,
  NbaFantasySleepersResponse,
  NbaFantasyTeamGradeResponse,
  NbaFantasyTradeAnalysisResponse,
} from "./dashboardTypes";

const LOCAL_API_BASE_URL = "http://localhost:5000/api";
const LIVE_API_BASE_URL =
  "https://basketball-analytics-tool-be-780d720c8c7d.herokuapp.com/api";

const isLocalHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
};

const API_BASE_URL = isLocalHost() ? LOCAL_API_BASE_URL : LIVE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const getApiBaseUrl = () => API_BASE_URL;

export const fetchHealth = async () => {
  const response = await api.get<HealthResponse>("/health");
  return response.data;
};

export const fetchPlayerProfile = async (
  athleteId: number,
  forceRefresh: boolean,
) => {
  const response = await api.get<ApiEnvelope<PlayerProfile>>(
    `/players/${athleteId}`,
    {
      params: { forceRefresh },
    },
  );

  return response.data.data;
};

export const fetchHeadToHead = async (
  playerAId: number,
  playerBId: number,
  forceRefresh: boolean,
) => {
  const response = await api.get<ApiEnvelope<CompareResponse>>(
    "/players/compare/head-to-head",
    {
      params: {
        playerAId,
        playerBId,
        forceRefresh,
      },
    },
  );

  return response.data.data.players;
};

export const fetchPlayerImpact = async (
  athleteId: number,
  forceRefresh: boolean,
  games = 10,
  seasonType: TeamSeasonType = "all",
) => {
  const response = await api.get<ApiEnvelope<PlayerImpactResponse>>(
    `/players/${athleteId}/impact`,
    {
      params: {
        games,
        seasonType,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchPlayerComps = async (
  athleteId: number,
  forceRefresh: boolean,
  limit = 10,
  sampleSize = 100,
  split: CompSplitMode = "auto",
) => {
  const response = await api.get<ApiEnvelope<PlayerCompsResponse>>(
    `/players/${athleteId}/comps`,
    {
      params: {
        limit,
        sampleSize,
        split,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchPlayerTrajectory = async (
  athleteId: number,
  forceRefresh: boolean,
  games = 20,
  window = 5,
  seasonType: TeamSeasonType = "all",
) => {
  const response = await api.get<ApiEnvelope<PlayerTrajectoryResponse>>(
    `/players/${athleteId}/trajectory`,
    {
      params: {
        games,
        window,
        seasonType,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchPlayerUsageValue = async (
  athleteId: number,
  forceRefresh: boolean,
) => {
  const response = await api.get<ApiEnvelope<PlayerUsageValueResponse>>(
    `/players/${athleteId}/usage-value`,
    {
      params: {
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchTeamEfficiency = async (
  teamId: number,
  forceRefresh: boolean,
  games = 5,
  seasonType: TeamSeasonType = "regular",
) => {
  const response = await api.get<ApiEnvelope<TeamEfficiencyResponse>>(
    `/teams/${teamId}/efficiency`,
    {
      params: {
        games,
        seasonType,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchTeamNeedGap = async (
  teamId: number,
  forceRefresh: boolean,
  games = 5,
  seasonType: TeamSeasonType = "regular",
) => {
  const response = await api.get<ApiEnvelope<TeamNeedGapResponse>>(
    `/teams/${teamId}/needs`,
    {
      params: {
        games,
        seasonType,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchTeamGrade = async (
  teamId: number,
  forceRefresh: boolean,
  games = 5,
  seasonType: TeamSeasonType = "regular",
) => {
  const response = await api.get<ApiEnvelope<TeamGradeResponse>>(
    `/teams/${teamId}/grade`,
    {
      params: {
        games,
        seasonType,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchTeamCompare = async (
  teamAId: number,
  teamBId: number,
  forceRefresh: boolean,
  games = 5,
  seasonType: TeamSeasonType = "regular",
) => {
  const response = await api.get<ApiEnvelope<TeamCompareResponse>>(
    "/teams/compare/head-to-head",
    {
      params: {
        teamAId,
        teamBId,
        games,
        seasonType,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export type FantasyLeagueSettingsParams = {
  teamCount?: number;
  // Raw backend format, e.g. "QB:1,RB:2,WR:2,TE:1,FLEX:1,K:1,DST:1".
  starters?: string;
};

const NBA_FANTASY_BASE = "/fantasy/nba";

export type DraftSimulatorParams = {
  draftPosition: number;
  teamCount?: number;
  starters?: string;
  scoringId?: FantasyScoringId;
  season?: number | string;
  rounds?: number;
  simulations?: number;
  // Every player id drafted so far, in pick order, including your own.
  picks?: string[];
  strategies?: string[];
};

export const fetchFantasyDraftSimulator = async (
  sport: DraftSimulatorSport,
  forceRefresh: boolean,
  params: DraftSimulatorParams,
) => {
  const response = await api.get<ApiEnvelope<DraftSimulatorResponse>>(
    `${sport === "nba" ? NBA_FANTASY_BASE : "/fantasy"}/draft-simulator`,
    {
      params: {
        draftPosition: params.draftPosition,
        teamCount: params.teamCount,
        starters: params.starters || undefined,
        scoringId: sport === "nfl" ? params.scoringId : undefined,
        season: params.season,
        rounds: params.rounds,
        simulations: params.simulations,
        picks: params.picks?.length ? params.picks.join(",") : undefined,
        strategies: params.strategies?.length
          ? params.strategies.join(",")
          : undefined,
        forceRefresh,
      },
      timeout: 90000,
    },
  );
  return response.data.data;
};

export const fetchNbaFantasySeasonState = async (forceRefresh: boolean) => {
  const response = await api.get<ApiEnvelope<NbaFantasySeasonState>>(
    `${NBA_FANTASY_BASE}/season`,
    { params: { forceRefresh } },
  );
  return response.data.data;
};

export const fetchNbaFantasyDraftBoard = async (
  forceRefresh: boolean,
  position?: NbaFantasyPosition,
  rosterSoFar?: string[],
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<NbaFantasyDraftBoardResponse>>(
    `${NBA_FANTASY_BASE}/draft-board`,
    {
      params: {
        position,
        rosterSoFar: rosterSoFar?.length ? rosterSoFar.join(",") : undefined,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );
  return response.data.data;
};

export const fetchNbaFantasySleepers = async (
  forceRefresh: boolean,
  season?: number | string,
) => {
  const response = await api.get<ApiEnvelope<NbaFantasySleepersResponse>>(
    `${NBA_FANTASY_BASE}/sleepers`,
    { params: { season, forceRefresh } },
  );
  return response.data.data;
};

export const fetchNbaFantasyTradeAnalysis = async (
  forceRefresh: boolean,
  sideA: string[],
  sideB: string[],
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<NbaFantasyTradeAnalysisResponse>>(
    `${NBA_FANTASY_BASE}/trades/analyze`,
    {
      params: {
        sideA: sideA.join(","),
        sideB: sideB.join(","),
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );
  return response.data.data;
};

export const fetchNbaFantasyPlayerCompare = async (
  forceRefresh: boolean,
  playerAId: string,
  playerBId: string,
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<NbaFantasyPlayerCompareResponse>>(
    `${NBA_FANTASY_BASE}/compare/players`,
    {
      params: {
        playerAId,
        playerBId,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );
  return response.data.data;
};

export const fetchNbaFantasyRosterCompare = async (
  forceRefresh: boolean,
  rosterA: string[],
  rosterB: string[],
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<NbaFantasyRosterCompareResponse>>(
    `${NBA_FANTASY_BASE}/compare/head-to-head`,
    {
      params: {
        rosterA: rosterA.join(","),
        rosterB: rosterB.join(","),
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );
  return response.data.data;
};

export const fetchNbaFantasyTeamGrade = async (
  forceRefresh: boolean,
  roster: string[],
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<NbaFantasyTeamGradeResponse>>(
    `${NBA_FANTASY_BASE}/team-grade`,
    {
      params: {
        roster: roster.join(","),
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );
  return response.data.data;
};

export const fetchFantasySeasonState = async (forceRefresh: boolean) => {
  const response = await api.get<ApiEnvelope<FantasySeasonState>>(
    "/fantasy/season",
    {
      params: { forceRefresh },
    },
  );

  return response.data.data;
};

export const fetchFantasyDraftBoard = async (
  forceRefresh: boolean,
  scoringId: FantasyScoringId = 3,
  position?: FantasyPosition,
  rosterSoFar?: string[],
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<DraftBoardResponse>>(
    "/fantasy/draft-board",
    {
      params: {
        position: position || undefined,
        rosterSoFar:
          rosterSoFar && rosterSoFar.length ? rosterSoFar.join(",") : undefined,
        scoringId,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasySleepers = async (
  forceRefresh: boolean,
  scoringId: FantasyScoringId = 3,
  season?: number | string,
) => {
  const response = await api.get<ApiEnvelope<SleepersResponse>>(
    "/fantasy/sleepers",
    {
      params: {
        scoringId,
        season,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyTradeAnalysis = async (
  forceRefresh: boolean,
  sideA: string[],
  sideB: string[],
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<TradeAnalysisResponse>>(
    "/fantasy/trades/analyze",
    {
      params: {
        sideA: sideA.join(","),
        sideB: sideB.join(","),
        scoringId,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyWaiverWire = async (
  forceRefresh: boolean,
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  ownershipMax = 50,
  window = 4,
) => {
  const response = await api.get<ApiEnvelope<WaiverWireResponse>>(
    "/fantasy/waivers",
    {
      params: {
        scoringId,
        season,
        ownershipMax,
        window,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyConsistency = async (
  forceRefresh: boolean,
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  window = 4,
) => {
  const response = await api.get<ApiEnvelope<ConsistencyResponse>>(
    "/fantasy/consistency",
    {
      params: {
        scoringId,
        season,
        window,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyStartSit = async (
  forceRefresh: boolean,
  playerIds: string[],
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  window = 4,
) => {
  const response = await api.get<ApiEnvelope<StartSitResponse>>(
    "/fantasy/start-sit",
    {
      params: {
        playerIds: playerIds.join(","),
        scoringId,
        season,
        window,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyPlayerCompare = async (
  forceRefresh: boolean,
  playerAId: string,
  playerBId: string,
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<FantasyPlayerCompareResponse>>(
    "/fantasy/compare/players",
    {
      params: {
        playerAId,
        playerBId,
        scoringId,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyRosterCompare = async (
  forceRefresh: boolean,
  rosterA: string[],
  rosterB: string[],
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<FantasyRosterCompareResponse>>(
    "/fantasy/compare/head-to-head",
    {
      params: {
        rosterA: rosterA.join(","),
        rosterB: rosterB.join(","),
        scoringId,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

export const fetchFantasyTeamGrade = async (
  forceRefresh: boolean,
  roster: string[],
  scoringId: FantasyScoringId = 3,
  season?: number | string,
  leagueSettings?: FantasyLeagueSettingsParams,
) => {
  const response = await api.get<ApiEnvelope<FantasyTeamGradeResponse>>(
    "/fantasy/team-grade",
    {
      params: {
        roster: roster.join(","),
        scoringId,
        season,
        teamCount: leagueSettings?.teamCount,
        starters: leagueSettings?.starters || undefined,
        forceRefresh,
      },
    },
  );

  return response.data.data;
};

type TeamOptionApiItem = {
  id?: number | string;
  teamId?: number | string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  name?: string;
  location?: string;
  label?: string;
};

const normalizeTeamOption = (item: TeamOptionApiItem): TeamOption | null => {
  const rawId = item.id ?? item.teamId;
  const id = String(rawId ?? "").trim();
  if (!id) {
    return null;
  }

  const combinedLocationName =
    `${item.location ?? ""} ${item.name ?? ""}`.trim();
  const displayName =
    String(item.displayName ?? "").trim() ||
    combinedLocationName ||
    String(item.shortDisplayName ?? "").trim() ||
    String(item.name ?? "").trim();
  const abbr = String(item.abbreviation ?? "").trim();

  const primaryLabel = item.label
    ? String(item.label).trim()
    : displayName
      ? `${displayName}${abbr ? ` (${abbr})` : ""}`
      : "";
  const fallbackLabel = abbr || `Team #${id}`;

  return {
    id,
    label: String(primaryLabel ?? fallbackLabel).trim() || `Team #${id}`,
  };
};

const toTeamOptionArray = (payload: unknown): TeamOption[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeTeamOption(item as TeamOptionApiItem))
      .filter((item): item is TeamOption => item !== null);
  }

  if (typeof payload === "object" && payload !== null) {
    const bag = payload as Record<string, unknown>;
    const nested = bag.teams ?? bag.options ?? bag.items ?? bag.results ?? [];
    return toTeamOptionArray(nested);
  }

  return [];
};

export const fetchTeamOptions = async (forceRefresh: boolean, query = "") => {
  const response = await api.get<ApiEnvelope<unknown>>("/teams", {
    params: {
      query,
      forceRefresh,
    },
  });

  const options = toTeamOptionArray(response.data.data);
  const deduped = new Map<string, TeamOption>();

  options.forEach((option) => {
    if (!deduped.has(option.id)) {
      deduped.set(option.id, option);
    }
  });

  return Array.from(deduped.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
};

type PlayerOptionApiItem = {
  id?: number | string;
  athleteId?: number | string;
  fullName?: string;
  displayName?: string;
  name?: string;
  label?: string;
};

const normalizePlayerOption = (
  item: PlayerOptionApiItem,
): PlayerOption | null => {
  const rawId = item.id ?? item.athleteId;
  const id = String(rawId ?? "").trim();
  if (!id) {
    return null;
  }

  const label = String(
    item.label ??
      item.fullName ??
      item.displayName ??
      item.name ??
      `Athlete #${id}`,
  ).trim();

  return {
    id,
    label: label || `Athlete #${id}`,
  };
};

const toOptionArray = (payload: unknown): PlayerOption[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizePlayerOption(item as PlayerOptionApiItem))
      .filter((item): item is PlayerOption => item !== null);
  }

  if (typeof payload === "object" && payload !== null) {
    const bag = payload as Record<string, unknown>;
    const nested =
      bag.options ??
      bag.items ??
      bag.results ??
      bag.athletes ??
      bag.players ??
      [];
    return toOptionArray(nested);
  }

  return [];
};

export const fetchPlayerOptions = async (
  forceRefresh: boolean,
  query = "",
  limit = 2000,
  offset = 0,
) => {
  const route = query.trim().length ? "/players/options" : "/players/all";
  const params = query.trim().length
    ? { query, limit, offset, forceRefresh }
    : { forceRefresh };

  const response = await api.get<ApiEnvelope<unknown>>(route, {
    params,
  });

  const options = toOptionArray(response.data.data);
  const deduped = new Map<string, PlayerOption>();

  options.forEach((option) => {
    if (!deduped.has(option.id)) {
      deduped.set(option.id, option);
    }
  });

  return Array.from(deduped.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
};
