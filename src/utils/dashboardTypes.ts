export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type HealthResponse = {
  success: boolean;
  message: string;
  timestamp: string;
};

export type SummaryShape = {
  displayName?: string;
  labels?: string[] | string;
  names?: string[] | string;
  displayNames?: string[] | string;
  splits?: Array<Record<string, unknown>> | string;
};

export type PlayerIdentity = {
  id: number;
  displayName: string;
  shortName?: string;
  position?: string;
  team?: string;
  teamAbbreviation?: string;
  jersey?: string;
  experienceYears?: number;
  age?: number;
  headshot?: string;
};

export type PlayerProfile = {
  identity: PlayerIdentity;
  summary?: SummaryShape;
  stats?: Record<string, unknown>;
  splits?: Record<string, unknown>;
  gameLog?: Record<string, unknown>;
  plusMinusTrend?: PlayerImpactResponse;
  lastUpdatedAt: string;
  _cache?: "HIT" | "MISS";
};

export type CompareResponse = {
  players: [PlayerProfile, PlayerProfile] | PlayerProfile[];
  generatedAt: string;
};

export type PlayerOption = {
  id: string;
  label: string;
};

export type TeamOption = {
  id: string;
  label: string;
};

export type TeamSeasonType = "regular" | "postseason" | "all";
export type CompSplitMode = "auto" | "regular" | "postseason" | "career";

export type TeamSummary = {
  id?: string | null;
  displayName?: string | null;
  shortDisplayName?: string | null;
  abbreviation?: string | null;
  logo?: string | null;
};

export type ScoreSummary = {
  team?: number | null;
  opponent?: number | null;
  scoreLine?: string | null;
  result?: string | null;
};

export type GameStatus = {
  state?: string | null;
  detail?: string | null;
  shortDetail?: string | null;
  completed?: boolean;
};

export type PlayerImpactTrendPoint = {
  eventId?: string;
  gameDate?: string;
  seasonYear?: number | null;
  seasonType?: "regular" | "postseason" | null;
  seasonTypeCode?: number | null;
  season?: { year?: number | null; type?: number | null };
  matchup?: string | null;
  opponent?: TeamSummary;
  team?: TeamSummary;
  homeTeamId?: string | number | null;
  awayTeamId?: string | number | null;
  result?: string | null;
  gameStatus?: GameStatus;
  score?: ScoreSummary;
  boxScore?: {
    keys?: string[];
    labels?: string[];
    raw?: unknown[];
    byKey?: Record<string, unknown>;
    byLabel?: Record<string, unknown>;
  } | null;
  plusMinus?: number;
  rollingAverage?: number;
};

export type PlayerImpactResponse = {
  athleteId?: string;
  seasonTypeRequested?: TeamSeasonType | "all";
  seasonsCovered?: number[];
  seasonTypesCovered?: Array<"regular" | "postseason">;
  gamesRequested?: number;
  gamesPlayed?: number;
  totalPlusMinus?: number;
  averagePlusMinus?: number;
  rollingAverage?: number;
  trend?: PlayerImpactTrendPoint[];
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type TeamEfficiencyGame = {
  eventId?: string;
  gameDate?: string;
  seasonYear?: number | null;
  seasonType?: "regular" | "postseason" | null;
  seasonTypeCode?: number | null;
  matchup?: string | null;
  status?: GameStatus;
  team?: TeamSummary;
  homeAway?: string | null;
  opponent?: TeamSummary;
  score?: ScoreSummary;
  pointsScored?: number;
  pointsAllowed?: number;
  teamStats?: Record<string, unknown>;
  opponentStats?: Record<string, unknown>;
  boxScore?: {
    team?: Record<string, unknown>;
    opponent?: Record<string, unknown>;
  };
  possessions?: number;
  offRtg?: number;
  defRtg?: number;
  netRtg?: number;
};

export type TeamEfficiencyResponse = {
  teamId?: string;
  seasonType?: TeamSeasonType;
  seasonTypeRequested?: TeamSeasonType | "all";
  seasonsCovered?: number[];
  seasonTypesCovered?: Array<"regular" | "postseason">;
  team?: Record<string, unknown> | TeamSummary;
  gamesRequested?: number;
  gamesPlayed?: number;
  recentGames?: TeamEfficiencyGame[];
  aggregate?: {
    pointsScored?: number;
    pointsAllowed?: number;
    possessions?: number;
    offRtg?: number;
    defRtg?: number;
    netRtg?: number;
  };
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type PlayerComp = {
  athleteId?: string;
  displayName?: string | null;
  team?: string | null;
  teamAbbreviation?: string | null;
  position?: string | null;
  headshot?: string | null;
  similarityScore?: number | null;
  sourceSplit?: string | null;
  sampleStability?: number | null;
  splitAlignment?: number | null;
  gamesPlayed?: number | null;
};

export type PlayerCompsResponse = {
  athleteId?: string;
  splitRequested?: CompSplitMode;
  comparedAgainst?: number;
  sampleSizeRequested?: number;
  limit?: number;
  sourceSplit?: string | null;
  comps?: PlayerComp[];
  warning?: string;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type PlayerTrajectoryPoint = {
  eventId?: string;
  gameDate?: string;
  matchup?: string | null;
  seasonYear?: number | null;
  seasonType?: "regular" | "postseason" | null;
  score?: ScoreSummary | null;
  metrics?: {
    points?: number | null;
    rebounds?: number | null;
    assists?: number | null;
    steals?: number | null;
    blocks?: number | null;
    turnovers?: number | null;
    minutes?: number | null;
    plusMinus?: number | null;
    trueShootingPct?: number | null;
  };
  rolling?: {
    points?: number | null;
    assists?: number | null;
    rebounds?: number | null;
    trueShootingPct?: number | null;
  };
};

export type PlayerTrajectoryResponse = {
  athleteId?: string;
  gamesRequested?: number;
  gamesAnalyzed?: number;
  window?: number;
  seasonTypeRequested?: TeamSeasonType | "all";
  seasonsCovered?: number[];
  seasonTypesCovered?: Array<"regular" | "postseason">;
  trendDirection?: {
    points?: "up" | "down" | "flat" | null;
    assists?: "up" | "down" | "flat" | null;
    rebounds?: "up" | "down" | "flat" | null;
    trueShootingPct?: "up" | "down" | "flat" | null;
  };
  trajectory?: PlayerTrajectoryPoint[];
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type UsageValueSignal =
  | "better_than_expected"
  | "within_expected_range"
  | "worse_than_expected"
  | "insufficient_data";

export type UsageValueStatus =
  | "above_expected_range"
  | "in_expected_range"
  | "below_expected_range";

export type UsageValueRange = {
  low?: number | null;
  high?: number | null;
};

export type UsageValueMetricProfile = {
  metric?: string | null;
  preferLower?: boolean;
  expectedMean?: number | null;
  stdDev?: number | null;
  expectedRange?: UsageValueRange | null;
  sampleSize?: number | null;
};

export type UsageValueActionableStat = {
  metric?: string | null;
  actual?: number | null;
  expectedMean?: number | null;
  expectedRange?: UsageValueRange | null;
  deltaFromMean?: number | null;
  signal?: UsageValueSignal | string | null;
};

export type UsageValueDecisionInsights = {
  summary?: string | null;
  gm?: string[] | null;
  coach?: string[] | null;
};

export type PlayerUsageValueResponse = {
  athleteId?: string;
  splitUsed?: string | null;
  usagePct?: number | null;
  usageBucket?: string | null;
  expectedProduction?: number | null;
  actualProduction?: number | null;
  zScore?: number | null;
  status?: UsageValueStatus | string | null;
  bucketSampleSize?: number | null;
  gamesPlayed?: number | null;
  avgMinutes?: number | null;
  sourceSplit?: string | null;
  actionableStats?: Record<string, UsageValueActionableStat> | null;
  expectedStatRanges?: Record<string, UsageValueMetricProfile> | null;
  decisionInsights?: UsageValueDecisionInsights | null;
  benchmarkContext?: {
    sampleSizeRequested?: number | null;
    sampleSizeEligible?: number | null;
    minGames?: number | null;
    minMinutes?: number | null;
    bucketWidth?: number | null;
    minBucketSize?: number | null;
  } | null;
  warning?: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type TeamNeedDimension = {
  metric?: string;
  description?: string;
  delta?: number | null;
  higherIsBetter?: boolean;
  status?: "above_league_avg" | "below_league_avg" | "at_league_avg";
};

export type TeamNeedGapResponse = {
  teamId?: string;
  team?: Record<string, unknown> | TeamSummary | null;
  seasonTypeRequested?: TeamSeasonType;
  gamesRequested?: number;
  benchmarkTeamsCount?: number;
  seasonsCovered?: number[];
  seasonTypesCovered?: Array<"regular" | "postseason">;
  teamAggregate?: {
    pointsScored?: number | null;
    pointsAllowed?: number | null;
    possessions?: number | null;
    offRtg?: number | null;
    defRtg?: number | null;
    netRtg?: number | null;
  };
  leagueAverage?: {
    pointsScored?: number | null;
    pointsAllowed?: number | null;
    possessions?: number | null;
    offRtg?: number | null;
    defRtg?: number | null;
    netRtg?: number | null;
  };
  deltaFromLeague?: {
    pointsScored?: number | null;
    pointsAllowed?: number | null;
    possessions?: number | null;
    offRtg?: number | null;
    defRtg?: number | null;
    netRtg?: number | null;
  };
  strengths?: TeamNeedDimension[];
  gaps?: TeamNeedDimension[];
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type SummaryRow = {
  name: string;
  values: Array<{ key: string; value: string }>;
};
