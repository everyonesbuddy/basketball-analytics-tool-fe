import axios from "axios";
import type {
  ApiEnvelope,
  CompareResponse,
  HealthResponse,
  PlayerOption,
  PlayerCompsResponse,
  CompSplitMode,
  PlayerImpactResponse,
  PlayerProfile,
  PlayerTrajectoryResponse,
  TeamSeasonType,
  TeamNeedGapResponse,
  TeamOption,
  TeamEfficiencyResponse,
} from "./dashboardTypes";

const API_BASE_URL =
  "https://basketball-analytics-tool-be-780d720c8c7d.herokuapp.com/api";

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
