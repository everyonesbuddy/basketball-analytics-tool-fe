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

export type TeamAggregateShape = {
  pointsScored?: number | null;
  pointsAllowed?: number | null;
  possessions?: number | null;
  offRtg?: number | null;
  defRtg?: number | null;
  netRtg?: number | null;
};

export type TeamGradeMetricDirection = "higher_is_better" | "lower_is_better";

export type TeamGradeMetric = {
  key: string;
  label: string;
  value: number | null;
  leagueAverage: number | null;
  zScore: number | null;
  score: number | null;
  direction: TeamGradeMetricDirection;
  sampleSize: number;
};

export type TeamGrade = {
  score: number | null;
  grade: string;
  metrics: TeamGradeMetric[];
  strengths: string[];
  weaknesses: string[];
  leagueSampleSize: number;
  gamesPlayed: number;
};

export type TeamGradeResponse = {
  teamId: string;
  team: TeamSummary | null;
  gamesRequested: number;
  gamesPlayed: number;
  seasonTypeRequested: TeamSeasonType;
  seasonsCovered: number[];
  seasonTypesCovered: Array<"regular" | "postseason">;
  grade: TeamGrade;
  aggregate: TeamAggregateShape;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type TeamCompareMetric = {
  key: string;
  label: string;
  teamA: number | null;
  teamB: number | null;
  difference: number | null;
  advantage: "teamA" | "teamB" | "tie" | null;
  direction: TeamGradeMetricDirection;
};

export type TeamCompareResult = {
  metrics: TeamCompareMetric[];
  advantage: "teamA" | "teamB" | "tie";
  teamAScore: number | null;
  teamBScore: number | null;
  decisionInsights: string;
};

export type TeamCompareSide = {
  teamId: string;
  team: TeamSummary | null;
  aggregate: TeamAggregateShape;
  grade: TeamGrade;
};

export type TeamCompareResponse = {
  teamA: TeamCompareSide;
  teamB: TeamCompareSide;
  gamesRequested: number;
  seasonTypeRequested: TeamSeasonType;
  comparison: TeamCompareResult;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type SummaryRow = {
  name: string;
  values: Array<{ key: string; value: string }>;
};

export type FantasyPosition = "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";
export type FantasyScoringId = 1 | 3 | 4;

export type FantasyPlayerStatus =
  | "undervalued"
  | "overvalued"
  | "valued_as_expected"
  | "no_adp_signal"
  | "insufficient_data"
  | "insufficient_peers";

export type FantasyDraftRank = {
  ppr: number | null;
  standard: number | null;
};

// Backend has been observed returning either a plain string or an ESPN-style
// object (e.g. { abbreviation, displayName }) for team/injuryStatus fields.
export type FantasyTeamValue = string | Record<string, unknown> | null;
export type FantasyInjuryValue = string | Record<string, unknown> | null;

// keyStats/rawStats are always split projected vs actual — "projected" is
// ESPN's modelled expectation (fractional values like 14.5 TDs), "actual" is
// real box-score production and stays null until the player has played.
export type FantasyStatBreakdown = {
  projected: Record<string, unknown> | null;
  actual: Record<string, unknown> | null;
};

export type FantasyPlayerCandidate = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  injuryStatus: FantasyInjuryValue;
  tier: number | null;
  adp: number | null;
  adpIsPlaceholder: boolean;
  ownershipPct: number | null;
  auctionValue: number | null;
  projectedTotal: number | null;
  projectedAverage: number | null;
  actualTotal: number | null;
  actualAverage: number | null;
  actualGames: number | null;
  replacementBaseline: number | null;
  vorp: number | null;
  vorpRank: number | null;
  draftRank: FantasyDraftRank | null;
  projectedRank: number | null;
  projectedPositionRank: number | null;
  adpPositionRank: number | null;
  adpDelta: number | null;
  sleeperScore: number | null;
  status: FantasyPlayerStatus | string;
  keyStats: FantasyStatBreakdown | null;
  rawStats?: FantasyStatBreakdown | null;
};

export type FantasyTier = {
  tier: number;
  count: number;
  high: number | null;
  low: number | null;
  mean: number | null;
  stdDev: number | null;
};

export type FantasyStarters = {
  QB?: number;
  RB?: number;
  WR?: number;
  TE?: number;
  FLEX?: number;
  K?: number;
  DST?: number;
};

export type FantasyLeagueSettings = {
  teamCount: number;
  starters: FantasyStarters;
};

export type FantasyReplacementBaseline = {
  replacementRank: number | null;
  replacementPlayerId: string | number | null;
  replacementPlayerName: string | null;
  projectedTotal: number | null;
};

export type FantasyReplacementBaselines = Record<
  string,
  FantasyReplacementBaseline
>;

export type DraftBoardResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  position: string;
  leagueSettings: FantasyLeagueSettings;
  rosterSize: number;
  excludedFromRoster: number;
  poolSize: number;
  availableCount: number;
  tierMetric: string;
  replacementBaselines: FantasyReplacementBaselines;
  tiers: FantasyTier[];
  candidates: FantasyPlayerCandidate[];
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type FantasyPeerDistribution = {
  position: string;
  meanAdpDelta: number | null;
  stdDevAdpDelta: number | null;
  sampleSize: number | null;
};

export type FantasySleeper = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  adp: number | null;
  ownershipPct: number | null;
  projectedTotal: number | null;
  actualTotal?: number | null;
  actualGames?: number | null;
  projectedRank: number | null;
  projectedPositionRank: number | null;
  adpPositionRank: number | null;
  adpDelta: number | null;
  sleeperScore: number | null;
  peerSampleSize: number | null;
  status: FantasyPlayerStatus | string;
};

export type SleepersResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  poolSize: number;
  evaluatedCount: number;
  excludedCount: number;
  excludedForPlaceholderAdp: number;
  peerDistributions: FantasyPeerDistribution[];
  sleepers: FantasySleeper[];
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type FantasySeasonState = {
  season: number;
  active: boolean;
  currentScoringPeriod: number;
  startDate?: string | null;
  endDate?: string | null;
  _cache?: "HIT" | "MISS";
};

export type FantasyTradePlayerSummary = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  projectedTotal: number | null;
  replacementBaseline: number | null;
  vorp: number | null;
  vorpRank: number | null;
  tier: number | null;
};

export type FantasyTradeSideSummary = {
  playerCount: number;
  totalVorp: number | null;
  byPosition: Record<string, number>;
  players: FantasyTradePlayerSummary[];
};

export type FantasyTradeVerdict = "balanced" | "slight_edge" | "clear_edge";

export type TradeAnalysisResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  leagueSettings: FantasyLeagueSettings;
  replacementBaselines: FantasyReplacementBaselines;
  tiers: FantasyTier[];
  sideA: FantasyTradeSideSummary;
  sideB: FantasyTradeSideSummary;
  missingPlayerIds: Array<string | number>;
  netVorpToA: number | null;
  verdict: FantasyTradeVerdict | string;
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type FantasyWeeklyHistoryEntry = {
  scoringPeriodId: number;
  projected?: number | null;
  actual?: number | null;
};

export type FantasyRecentForm = {
  gamesSample: number;
  actualAverage: number | null;
  projectedAverage: number | null;
  deltaFromProjection: number | null;
  standardDeviation: number | null;
  lastActual: number | null;
  weekOverWeekDelta: number | null;
  history: FantasyWeeklyHistoryEntry[];
};

export type FantasyInSeasonStatus =
  | "ready"
  | "insufficient_sample"
  | "no_upcoming_projection";

export type FantasyWaiverCandidate = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  ownershipPct: number | null;
  startedPct: number | null;
  projectedTotal: number | null;
  actualTotal: number | null;
  recentForm: FantasyRecentForm;
};

export type WaiverWireResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  currentScoringPeriod: number | null;
  ownershipMax: number;
  window: number;
  status: FantasyInSeasonStatus | string;
  candidates: FantasyWaiverCandidate[];
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type FantasyConsistencyPlayer = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  ownershipPct: number | null;
  consistencyScore: number | null;
  recentForm: FantasyRecentForm;
};

export type ConsistencyResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  currentScoringPeriod: number | null;
  window: number;
  status: FantasyInSeasonStatus | string;
  players: FantasyConsistencyPlayer[];
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type FantasyStartSitRecommendation =
  | "start"
  | "consider_sit"
  | "insufficient_sample"
  | "no_upcoming_projection";

export type FantasyStartSitPlayer = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  nextScoringPeriod: number | null;
  nextProjection: number | null;
  recentForm: FantasyRecentForm;
  recommendation: FantasyStartSitRecommendation | string;
};

export type StartSitResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  currentScoringPeriod: number | null;
  window: number;
  status: FantasyInSeasonStatus | string;
  players: FantasyStartSitPlayer[];
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

// Shape returned by the backend's compactPlayer() for player compare / team grade.
export type FantasyCompactPlayer = {
  id: string | number;
  name: string;
  position: string;
  team: FantasyTeamValue;
  projectedTotal: number | null;
  projectedAverage: number | null;
  actualTotal: number | null;
  vorp: number | null;
  vorpRank: number | null;
  projectedRank: number | null;
  projectedPositionRank: number | null;
  adp: number | null;
  tier: number | null;
  injuryStatus: FantasyInjuryValue;
  keyStats: FantasyStatBreakdown | null;
};

export type FantasyCompareMetric = {
  label: string;
  playerA: number | null;
  playerB: number | null;
  difference: number | null;
  advantage: "playerA" | "playerB" | "tie" | null;
};

export type FantasyPlayerCompareResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  leagueSettings: FantasyLeagueSettings;
  playerA: FantasyCompactPlayer;
  playerB: FantasyCompactPlayer;
  metrics: FantasyCompareMetric[];
  advantage: "playerA" | "playerB" | "tie";
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type FantasyRosterPlayer = FantasyCompactPlayer & {
  isStarter: boolean;
};

export type FantasyTeamGradeScoreWeights = {
  starterValue: number;
  marketValue: number;
  coverage: number;
};

export type FantasyTeamGradeResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  leagueSettings: FantasyLeagueSettings;
  rosterSize: number;
  missingPlayerIds: Array<string | number>;
  grade: string;
  score: number | null;
  valueScore: number | null;
  valueScoreMethod: string | null;
  marketScore: number | null;
  coverageScore: number | null;
  scoreWeights: FantasyTeamGradeScoreWeights | null;
  starterVorp: number | null;
  idealStarterVorp: number | null;
  replacementBaselines: FantasyReplacementBaselines;
  roster: FantasyRosterPlayer[];
  suggestedStarters: FantasyCompactPlayer[];
  positionCounts: Record<string, number>;
  missingStarterSlots: Record<string, number>;
  decisionInsights: string | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

// One side of a full-roster head-to-head (GET /api/fantasy/compare/head-to-head).
export type FantasyRosterCompareSide = {
  rosterSize: number;
  missingPlayerIds: Array<string | number>;
  starterVorp: number | null;
  starterCount: number | null;
  coverageScore: number | null;
  byPosition: Record<string, number>;
  missingStarterSlots: Record<string, number>;
  roster: FantasyRosterPlayer[];
  suggestedStarters: FantasyCompactPlayer[];
};

export type FantasyRosterCompareResult = {
  advantage: "rosterA" | "rosterB" | "tie";
  netStarterVorp?: number | null;
  decisionInsights: string | null;
};

export type FantasyRosterCompareResponse = {
  season: number | string;
  scoringId: number;
  scoring: string;
  leagueSettings: FantasyLeagueSettings;
  replacementBaselines?: FantasyReplacementBaselines;
  rosterA: FantasyRosterCompareSide;
  rosterB: FantasyRosterCompareSide;
  comparison: FantasyRosterCompareResult;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};

export type NbaFantasyPosition =
  | "PG"
  | "SG"
  | "SF"
  | "PF"
  | "C"
  | "G"
  | "F"
  | "UTIL";

export type NbaFantasyLeagueSettings = {
  teamCount: number;
  starters: Record<string, number>;
};

export type NbaFantasySeasonState = FantasySeasonState & {
  sport?: "nba";
};

export type NbaFantasyDraftBoardResponse = Omit<
  DraftBoardResponse,
  "leagueSettings"
> & {
  sport?: "nba";
  leagueSettings: NbaFantasyLeagueSettings;
};

export type NbaFantasySleepersResponse = SleepersResponse & {
  sport?: "nba";
};

export type NbaFantasyTradeAnalysisResponse = Omit<
  TradeAnalysisResponse,
  "leagueSettings"
> & {
  sport?: "nba";
  leagueSettings: NbaFantasyLeagueSettings;
};

export type NbaFantasyPlayerCompareResponse = Omit<
  FantasyPlayerCompareResponse,
  "leagueSettings"
> & {
  sport?: "nba";
  leagueSettings: NbaFantasyLeagueSettings;
};

export type NbaFantasyRosterCompareResponse = Omit<
  FantasyRosterCompareResponse,
  "leagueSettings"
> & {
  sport?: "nba";
  leagueSettings: NbaFantasyLeagueSettings;
};

export type NbaFantasyTeamGradeResponse = Omit<
  FantasyTeamGradeResponse,
  "leagueSettings"
> & {
  sport?: "nba";
  leagueSettings: NbaFantasyLeagueSettings;
};

export type DraftSimulatorSport = "nfl" | "nba";

export type DraftSimulatorPlayer = {
  id?: string | number;
  name: string;
  position: string;
  team?: FantasyTeamValue;
  vorp?: number | null;
  projectedTotal?: number | null;
  adp?: number | null;
  // 0-100.
  availabilityPct: number | null;
};

export type DraftSimulatorPickOption = DraftSimulatorPlayer & {
  expectedLineupVorp: number | null;
  sampleSize?: number | null;
  isDefaultPick?: boolean;
  vsBestValue?: {
    meanDifference: number | null;
    beatsBestValuePct?: number | null;
  } | null;
};

export type DraftSimulatorPickGroup<T> = {
  overallPick: number | null;
  round: number | null;
  players: T[];
};

export type DraftSimulatorPlanEntry = {
  round: number | null;
  overallPick?: number | null;
  status?: string | null;
  topChoices?: Array<{ name: string; pct: number | null }>;
};

export type DraftSimulatorStrategy = {
  key: string;
  label: string;
  rank: number | null;
  starterVorp: {
    mean: number | null;
    stdDev?: number | null;
    p10: number | null;
    p50: number | null;
    p90: number | null;
  } | null;
  lineupCompletePct?: number | null;
  vsBestValue?: {
    meanDifference: number | null;
    beatsBestValuePct?: number | null;
  } | null;
  positionMix?: Record<string, number> | null;
  pickPlan?: DraftSimulatorPlanEntry[] | null;
};

export type DraftSimulatorResponse = {
  sport?: DraftSimulatorSport;
  season?: number | string;
  simulations?: number;
  situation?: {
    draftPosition?: number;
    teamCount?: number;
    rounds?: number;
    picksMade?: number;
    totalPicks?: number;
    yourNextPick?: {
      round: number | null;
      overallPick: number | null;
      picksUntilYou: number | null;
    } | null;
    yourPicks?: number[];
  } | null;
  nextPickAvailability?: DraftSimulatorPickGroup<DraftSimulatorPlayer> | null;
  pickOptions?: DraftSimulatorPickGroup<DraftSimulatorPickOption> | null;
  strategies?: DraftSimulatorStrategy[];
  decisionInsights?: string[] | null;
  assumptions?: string[] | null;
  lastUpdatedAt?: string;
  _cache?: "HIT" | "MISS";
};
