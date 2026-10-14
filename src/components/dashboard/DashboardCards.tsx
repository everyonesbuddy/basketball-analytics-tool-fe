import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  LabelList,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  formatPlayerSplitLabelWithYear,
  formatStatLongLabel,
  type PlayerMetric,
  getPlayerOverviewMetrics,
  getSummaryRows,
  safeToText,
} from "../../utils/dashboardFormatters";
import type {
  ConsistencyResponse,
  DraftBoardResponse,
  FantasyCompactPlayer,
  FantasyPlayerCandidate,
  FantasyPlayerCompareResponse,
  FantasyRecentForm,
  FantasyRosterCompareResponse,
  FantasyRosterCompareSide,
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
  TeamNeedGapResponse,
  TeamEfficiencyResponse,
  TradeAnalysisResponse,
  WaiverWireResponse,
} from "../../utils/dashboardTypes";

export const formatMetricValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return value.toFixed(0);
  }

  return value.toFixed(1);
};

export const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

const formatSimilarityScore = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return value.toFixed(4);
};

const formatFactor = (value: number | null | undefined, digits = 2): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return value.toFixed(digits);
};

const getHeadshotUrl = (athleteId?: string | number | null): string => {
  const id = String(athleteId ?? "").trim();
  if (!id) {
    return "https://a.espncdn.com/i/headshots/nba/players/full/1966.png";
  }

  return `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`;
};

const getStringFromRecord = (
  value: unknown,
  candidates: string[],
): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const bag = value as Record<string, unknown>;
  for (const key of candidates) {
    const next = bag[key];
    if (typeof next === "string" && next.trim()) {
      return next.trim();
    }
  }

  return null;
};

const getTeamLogoUrl = (
  team: unknown,
  teamId?: string | number | null,
): string => {
  const fromTeam = getStringFromRecord(team, ["logo", "logoHref", "logoUrl"]);
  if (fromTeam) {
    return fromTeam;
  }

  const id = String(teamId ?? "").trim();
  if (id) {
    return `https://a.espncdn.com/i/teamlogos/nba/500/${id}.png`;
  }

  return "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png";
};

const formatGameDateTime = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? "-" : next.toLocaleString();
};

const toSeasonTypeLabel = (
  seasonType?: "regular" | "postseason" | null,
): string => {
  if (seasonType === "postseason") {
    return "Postseason";
  }

  if (seasonType === "regular") {
    return "Regular Season";
  }

  return "Unknown";
};

const formatSeasonTag = (
  seasonYear?: number | null,
  seasonType?: "regular" | "postseason" | null,
) => {
  const label = toSeasonTypeLabel(seasonType);

  if (seasonYear && Number.isInteger(seasonYear)) {
    return `${seasonYear} ${label}`;
  }

  return label;
};

const formatSeasonCoverage = (
  years?: number[],
  types?: Array<"regular" | "postseason">,
) => {
  const yearText = years?.length ? years.join(", ") : "-";
  const typeText = types?.length
    ? types.map((type) => toSeasonTypeLabel(type)).join(" + ")
    : "-";

  return `${typeText} | Seasons: ${yearText}`;
};

const formatMatchupText = (
  teamName?: string | null,
  opponentName?: string | null,
  homeAway?: string | null,
) => {
  const team = teamName || "Team";
  const opponent = opponentName || "Opponent";
  const atHome = String(homeAway || "").toLowerCase() === "home";
  return atHome ? `${team} vs ${opponent}` : `${team} @ ${opponent}`;
};

const getBoxDisplayValue = (
  boxMap: Record<string, unknown> | undefined,
  candidates: string[],
): string => {
  if (!boxMap) {
    return "-";
  }

  for (const candidate of candidates) {
    if (boxMap[candidate] !== undefined && boxMap[candidate] !== null) {
      return safeToText(boxMap[candidate]);
    }
  }

  return "-";
};

const InterpretationNote = ({ parameters }: { parameters: string }) => (
  <div className="interpret-note">
    <p className="interpret-note__title">Interpretation Notes</p>
    <ul className="interpret-note__list">
      <li>Derived values are sensitive to request context: {parameters}.</li>
      <li>
        Cache can temporarily preserve prior computations until TTL expires or
        force refresh is used.
      </li>
      <li>
        Upstream ESPN payload variability can affect both data availability and
        derived metric precision.
      </li>
    </ul>
  </div>
);

const InlineInfo = ({ label }: { label: string }) => (
  <span className="inline-info" title={label} aria-label={label}>
    i
  </span>
);

const getTeamGapMetricTooltip = (metric?: string) => {
  switch (String(metric || "")) {
    case "offRtg":
      return "Off Rating Gap = team.offRtg - league.offRtg. Positive means better-than-league offensive efficiency.";
    case "defRtg":
      return "Def Rating Gap = league.defRtg - team.defRtg (inverted so positive means better defense).";
    case "netRtg":
      return "Net Rating Gap = team.netRtg - league.netRtg. Positive means stronger overall two-way impact.";
    case "pointsScored":
      return "Points Scored Gap = team.pointsScored - league.pointsScored. Positive means scoring above league baseline.";
    case "pointsAllowed":
      return "Points Allowed Gap = league.pointsAllowed - team.pointsAllowed (inverted so positive means allowing fewer points).";
    case "possessions":
      return "Pace/Possessions Gap = team.possessions - league.possessions. Positive means faster pace than league baseline.";
    default:
      return "Metric delta from league baseline in the same games/seasonType context.";
  }
};

const formatUsagePercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
};

const toReadableSignal = (value?: string | null): string => {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getSignalChipClass = (signal?: string | null): string => {
  if (signal === "better_than_expected") {
    return "chip hit";
  }

  if (signal === "worse_than_expected") {
    return "chip miss";
  }

  return "chip";
};

export const IdentityCard = ({ player }: { player: PlayerProfile }) => {
  const identity = player.identity;
  const summaryRows = getSummaryRows(player.summary);
  const overviewMetrics = getPlayerOverviewMetrics(player).slice(0, 6);

  return (
    <article className="scout-card">
      <div className="player-header">
        <img
          className="headshot"
          src={
            identity.headshot ||
            "https://a.espncdn.com/i/headshots/nba/players/full/1966.png"
          }
          alt={identity.displayName}
          loading="lazy"
        />
        <div>
          <p
            className="tag"
            title="identity.id from normalized player profile contract."
          >
            Athlete ID {identity.id}
          </p>
          <h3>{identity.displayName}</h3>
          <p
            className="meta-line"
            title="identity.position and identity.teamAbbreviation from normalized identity source priority."
          >
            {safeToText(identity.position)} |{" "}
            {safeToText(identity.teamAbbreviation)}
          </p>
          <p
            className="meta-line"
            title="identity.team display name resolved from freshest available team source."
          >
            {safeToText(identity.team)}
          </p>
        </div>
      </div>

      <div className="chip-grid">
        <span className="chip" title="identity.jersey from normalized profile.">
          Jersey #{safeToText(identity.jersey)}
        </span>
        <span
          className="chip"
          title="identity.age in years from normalized profile."
        >
          Age {safeToText(identity.age)}
        </span>
        <span className="chip">
          Exp {safeToText(identity.experienceYears)} yrs
        </span>
        <span
          className="chip"
          title="Impact Scope is derived from available plus-minus trend rows: season type coverage plus season years included in backend trend aggregation."
        >
          Impact Scope{" "}
          {formatSeasonCoverage(
            player.plusMinusTrend?.seasonsCovered,
            player.plusMinusTrend?.seasonTypesCovered,
          )}
        </span>
        <span
          className={`chip ${player._cache === "HIT" ? "hit" : "miss"}`}
          title="Cache status from backend envelope metadata (_cache): HIT means reused cached payload, MISS means fresh computation."
        >
          Cache {player._cache ?? "-"}
        </span>
      </div>

      {overviewMetrics.length ? (
        <div className="overview-pill-grid">
          {overviewMetrics.map((metric) => (
            <div className="overview-pill" key={`${identity.id}-${metric.key}`}>
              <p className="overview-pill-label">{metric.label}</p>
              <p className="overview-pill-value">
                {formatMetricValue(metric.value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="stats-block">
        <h4>Summary Splits</h4>
        {summaryRows.length ? (
          <div className="summary-grid">
            {summaryRows.map((entry) => (
              <section
                key={`${identity.id}-${entry.name}`}
                className="summary-panel"
              >
                <div className="split-header-row">
                  <p className="split-name">
                    {formatPlayerSplitLabelWithYear(player, entry.name)}
                  </p>
                </div>
                <div className="split-table-wrap">
                  <table className="split-kv-table">
                    <tbody>
                      {entry.values.map((point) => (
                        <tr
                          key={`${identity.id}-${entry.name}-${point.key}-row`}
                        >
                          <th>{formatStatLongLabel(point.key)}</th>
                          <td>{point.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="empty-note">
            No summary rows returned by ESPN for this profile.
          </p>
        )}
      </div>

      <p className="timestamp">
        Updated {new Date(player.lastUpdatedAt).toLocaleString()}
      </p>
    </article>
  );
};

export const PlayerOverviewChart = ({
  player,
  metricsOverride,
  splitLabel,
  headerControl,
}: {
  player: PlayerProfile;
  metricsOverride?: PlayerMetric[];
  splitLabel?: string;
  headerControl?: ReactNode;
}) => {
  const metrics = metricsOverride ?? getPlayerOverviewMetrics(player);
  const data = metrics.map((metric) => ({
    metric: metric.label,
    value: Number(metric.value.toFixed(2)),
  }));

  const chartHeight = Math.max(300, data.length * 34);
  const playerLabel = player.identity.shortName || player.identity.displayName;

  return (
    <article className="scout-card viz-card">
      <div className="viz-header-row">
        <h3>Player Overview</h3>
        {headerControl ?? null}
      </div>
      <p className="viz-subtitle">
        Key production profile for {playerLabel}
        {splitLabel ? ` | ${splitLabel}` : ""}
        <InlineInfo label="Chart data source comes from normalized summary split rows (Regular Season, Post Season, Career when available)." />
      </p>
      {metrics.length ? (
        <div className="viz-container" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height={chartHeight - 16}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 22, left: 22, bottom: 8 }}
              barCategoryGap={12}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf3" />
              <XAxis
                type="number"
                tick={{ fill: "#506178", fontSize: 12 }}
                label={{
                  value: "Stat Value",
                  position: "insideBottomRight",
                  fill: "#6a7891",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="metric"
                width={170}
                interval={0}
                tick={{ fill: "#506178", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(28, 79, 190, 0.08)" }}
                formatter={(value) => [value, "Value"]}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#d7e0ec",
                  fontSize: 12,
                  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                }}
              />
              <Bar
                dataKey="value"
                fill="#2f6cf6"
                radius={[0, 8, 8, 0]}
                animationDuration={900}
                animationEasing="ease-out"
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="#42546e"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="empty-note">
          No numeric summary metrics found for this split. Select another chart
          data source.
        </p>
      )}
    </article>
  );
};

type ComparisonMetric = {
  key: string;
  label: string;
  shortLabel: string;
  playerA: number | null;
  playerB: number | null;
};

export const ComparisonChart = ({
  playerA,
  playerB,
  splitLabel,
  metrics,
  headerControl,
}: {
  playerA: PlayerProfile;
  playerB: PlayerProfile;
  splitLabel: string;
  metrics: ComparisonMetric[];
  headerControl?: ReactNode;
}) => {
  const playerALabel =
    playerA.identity.shortName || playerA.identity.displayName;
  const playerBLabel =
    playerB.identity.shortName || playerB.identity.displayName;

  const chartData = metrics.map((metric) => ({
    metric: metric.label,
    metricShort: metric.shortLabel,
    playerA: metric.playerA === null ? null : Number(metric.playerA.toFixed(2)),
    playerB: metric.playerB === null ? null : Number(metric.playerB.toFixed(2)),
  }));

  const metricsForBars = chartData.slice(0, 10);

  const profileData = metrics.map((metric) => {
    const rawPlayerA =
      metric.playerA === null ? null : Number(metric.playerA.toFixed(2));
    const rawPlayerB =
      metric.playerB === null ? null : Number(metric.playerB.toFixed(2));
    const maxValue = Math.max(metric.playerA ?? 0, metric.playerB ?? 0, 1);
    return {
      metric: metric.shortLabel,
      metricLabel: metric.label,
      rawPlayerA,
      rawPlayerB,
      playerA:
        metric.playerA === null
          ? null
          : Number(((metric.playerA / maxValue) * 100).toFixed(1)),
      playerB:
        metric.playerB === null
          ? null
          : Number(((metric.playerB / maxValue) * 100).toFixed(1)),
    };
  });

  const chartHeight = Math.max(380, metricsForBars.length * 46 + 80);

  return (
    <article className="scout-card compare-chart-card">
      <div className="viz-header-row">
        <h3>{splitLabel}</h3>
        {headerControl ?? null}
      </div>
      <p className="viz-subtitle">
        Indexed radar shape for {playerALabel} vs {playerBLabel} (leader per
        metric = 100, tooltip includes raw values)
        <InlineInfo label="Radar normalization is view-only: each metric is scaled so the split leader is 100 for easier shape comparison; raw values remain in tooltip/table." />
      </p>
      {metrics.length ? (
        <div className="compare-layout">
          <div className="viz-container radar-container">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={profileData}
                margin={{ top: 14, right: 24, left: 24, bottom: 10 }}
                outerRadius="78%"
              >
                <PolarGrid stroke="#d9e3f0" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#54657f", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  tick={{ fill: "#7a889f", fontSize: 10 }}
                  domain={[0, 100]}
                  tickCount={5}
                />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    const metricName = payload?.[0]?.payload?.metricLabel;
                    return metricName || String(label);
                  }}
                  formatter={(_, name, item) => {
                    const raw =
                      name === "playerA"
                        ? item?.payload?.rawPlayerA
                        : item?.payload?.rawPlayerB;

                    return [
                      formatMetricValue(raw as number | null),
                      name === "playerA" ? playerALabel : playerBLabel,
                    ];
                  }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#d7e0ec",
                    fontSize: 12,
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === "playerA" ? playerALabel : playerBLabel
                  }
                />
                <Radar
                  name="playerA"
                  dataKey="playerA"
                  stroke="#2f6cf6"
                  fill="#2f6cf6"
                  fillOpacity={0.24}
                />
                <Radar
                  name="playerB"
                  dataKey="playerB"
                  stroke="#26a69a"
                  fill="#26a69a"
                  fillOpacity={0.22}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="viz-container compare-bars-container">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={metricsForBars}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 14, bottom: 8 }}
                barGap={4}
                barCategoryGap={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf3" />
                <XAxis
                  type="number"
                  tick={{ fill: "#506178", fontSize: 12 }}
                  label={{
                    value: "Raw Stat Value",
                    position: "insideBottomRight",
                    fill: "#6a7891",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="metricShort"
                  tick={{ fill: "#506178", fontSize: 11 }}
                  width={72}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: "rgba(28, 79, 190, 0.08)" }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.metric ?? "Metric"
                  }
                  formatter={(value, name) => [
                    value,
                    name === "playerA" ? playerALabel : playerBLabel,
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#d7e0ec",
                    fontSize: 12,
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar
                  dataKey="playerA"
                  name="playerA"
                  fill="#2f6cf6"
                  radius={[0, 8, 8, 0]}
                  barSize={8}
                  animationDuration={850}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="playerB"
                  name="playerB"
                  fill="#26a69a"
                  radius={[0, 8, 8, 0]}
                  barSize={8}
                  animationBegin={120}
                  animationDuration={850}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="empty-note">
          No comparable metrics were returned for this split. Select another
          data source.
        </p>
      )}
    </article>
  );
};

export const ComparisonMatrix = ({
  playerA,
  playerB,
  splitLabel,
  metrics,
}: {
  playerA: PlayerProfile;
  playerB: PlayerProfile;
  splitLabel: string;
  metrics: ComparisonMetric[];
}) => {
  const playerALabel =
    playerA.identity.shortName || playerA.identity.displayName;
  const playerBLabel =
    playerB.identity.shortName || playerB.identity.displayName;

  return (
    <article className="scout-card compare-table-card">
      <h3>{splitLabel}</h3>
      <p className="viz-subtitle">Readable side-by-side stat matrix</p>
      {metrics.length ? (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>{playerALabel}</th>
                <th>{playerBLabel}</th>
                <th>Edge</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const leader =
                  metric.playerA === null && metric.playerB === null
                    ? "N/A"
                    : metric.playerA === null
                      ? playerBLabel
                      : metric.playerB === null
                        ? playerALabel
                        : metric.playerA > metric.playerB
                          ? playerALabel
                          : metric.playerB > metric.playerA
                            ? playerBLabel
                            : "Tie";

                return (
                  <tr key={metric.key}>
                    <td>{metric.label}</td>
                    <td>{formatMetricValue(metric.playerA)}</td>
                    <td>{formatMetricValue(metric.playerB)}</td>
                    <td className="edge-cell">{leader}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-note">
          No side-by-side stat rows available for this split.
        </p>
      )}
    </article>
  );
};

export const PlayerImpactCard = ({
  data,
  playerLabel,
}: {
  data: PlayerImpactResponse;
  playerLabel: string;
}) => {
  const trend = Array.isArray(data.trend) ? data.trend : [];
  const chartData = trend.slice(0, 12).map((point, index) => ({
    game: point.opponent?.abbreviation || `G${index + 1}`,
    date: formatGameDateTime(point.gameDate),
    score: point.score?.scoreLine || "-",
    plusMinus: toFiniteNumber(point.plusMinus),
  }));

  return (
    <article className="scout-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getHeadshotUrl(data.athleteId)}
          alt={playerLabel}
          loading="lazy"
        />
        <h3>Player Impact</h3>
      </div>
      <p className="viz-subtitle">
        Recent plus-minus trend for {playerLabel} |{" "}
        {formatSeasonCoverage(data.seasonsCovered, data.seasonTypesCovered)}
        <InlineInfo label="seasonTypeRequested/seasonsCovered/seasonTypesCovered summarize the season buckets represented in returned trend rows." />
      </p>
      <p className="derive-note">
        What this looks at: recent completed games with plus-minus pulled from
        game-level impact rows. Total and average plus-minus are aggregated from
        the returned game set, and rolling average smooths short-term swings
        across the requested sample.
      </p>
      <InterpretationNote parameters="games and seasonType" />
      <p className="selector-note">
        Request context: Athlete #{safeToText(data.athleteId)} | Games Requested{" "}
        {safeToText(data.gamesRequested)} | Season Type{" "}
        {safeToText(data.seasonTypeRequested)} | Cache {safeToText(data._cache)}
      </p>
      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="gamesPlayed: count of trend rows included in the response after completed-game filtering."
          >
            Games Played
          </p>
          <p className="overview-pill-value">
            {toFiniteNumber(data.gamesPlayed).toFixed(0)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="totalPlusMinus: sum of per-game plusMinus values across returned trend rows."
          >
            Total Plus-Minus
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.totalPlusMinus))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="averagePlusMinus: totalPlusMinus divided by gamesPlayed over the returned context."
          >
            Average Plus-Minus
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.averagePlusMinus))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="rollingAverage: latest value of trailing-window average over plusMinus series in impact aggregation."
          >
            Rolling Average
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.rollingAverage))}
          </p>
        </div>
      </div>

      {chartData.length ? (
        <div className="viz-container impact-viz">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 6, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf3" />
              <XAxis dataKey="game" tick={{ fill: "#5b6d86", fontSize: 11 }} />
              <YAxis tick={{ fill: "#5b6d86", fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  formatMetricValue(toFiniteNumber(value)),
                  "Plus-Minus",
                ]}
                labelFormatter={(label, payload) => {
                  const datum = payload?.[0]?.payload as
                    | { date?: string; score?: string }
                    | undefined;
                  return `${String(label)} | ${datum?.date ?? "-"} | ${datum?.score ?? "-"}`;
                }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#d7e0ec",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="plusMinus" fill="#2f6cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="empty-note">
          No trend rows were returned for this player.
        </p>
      )}

      {trend.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th title="gameDate from event summary.">Date / Time</th>
                <th title="Season tag composed from seasonYear and seasonType metadata.">
                  Season
                </th>
                <th title="matchup string or derived team/opponent format.">
                  Matchup
                </th>
                <th title="Win/Loss style result descriptor from score/result fields.">
                  Result
                </th>
                <th title="scoreLine from event summary.">Score</th>
                <th title="plusMinus extracted from player box score groups.">
                  Plus-Minus
                </th>
                <th title="Per-row rolling average of plusMinus in the trailing window.">
                  Rolling Avg
                </th>
                <th title="Selected box score fields from byKey map: points, rebounds, assists.">
                  Box (PTS/REB/AST)
                </th>
              </tr>
            </thead>
            <tbody>
              {trend.slice(0, 12).map((point) => {
                const teamName =
                  point.team?.abbreviation ||
                  point.team?.shortDisplayName ||
                  point.team?.displayName;
                const opponentName =
                  point.opponent?.abbreviation ||
                  point.opponent?.shortDisplayName ||
                  point.opponent?.displayName;

                const homeAway =
                  point.team?.id && point.homeTeamId
                    ? String(point.team.id) === String(point.homeTeamId)
                      ? "home"
                      : "away"
                    : null;

                const byKey = point.boxScore?.byKey;
                const pts = getBoxDisplayValue(byKey, ["pts", "points"]);
                const reb = getBoxDisplayValue(byKey, ["reb", "rebounds"]);
                const ast = getBoxDisplayValue(byKey, ["ast", "assists"]);

                return (
                  <tr
                    key={
                      point.eventId || `${point.gameDate}-${point.plusMinus}`
                    }
                  >
                    <td>{formatGameDateTime(point.gameDate)}</td>
                    <td>
                      {formatSeasonTag(point.seasonYear, point.seasonType)}
                    </td>
                    <td>
                      {point.matchup ||
                        formatMatchupText(teamName, opponentName, homeAway)}
                    </td>
                    <td>{safeToText(point.score?.result || point.result)}</td>
                    <td>{safeToText(point.score?.scoreLine)}</td>
                    <td>
                      {formatMetricValue(toFiniteNumber(point.plusMinus))}
                    </td>
                    <td>
                      {formatMetricValue(toFiniteNumber(point.rollingAverage))}
                    </td>
                    <td>{`${pts} / ${reb} / ${ast}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
};

export const PlayerCompsCard = ({
  data,
  playerLabel,
}: {
  data: PlayerCompsResponse;
  playerLabel: string;
}) => {
  const comps = Array.isArray(data.comps) ? data.comps : [];

  return (
    <article className="scout-card compare-table-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getHeadshotUrl(data.athleteId)}
          alt={playerLabel}
          loading="lazy"
        />
        <h3 title="Player Value Comps are nearest-neighbor matches from normalized summary-stat vectors.">
          Player Value Comps
        </h3>
      </div>
      <p className="viz-subtitle">
        Closest similarity matches for {playerLabel} based on normalized stat
        vectors.
      </p>
      <p className="derive-note">
        What this looks at: production features from player summary data (for
        example points, rebounds, assists, shooting percentages, steals, blocks,
        turnovers, minutes, points per minute, and a simple efficiency index.
        Each player is converted to a normalized z-score vector, then cosine
        similarity is used to rank nearest comparables. Final score is smoothed
        with sample reliability to reduce noisy tiny-sample inflation.
      </p>
      <p className="selector-note">
        Score model: similarityScore = cosineSimilarity x sampleStability
        <InlineInfo label="sampleStability reduces volatility for low-sample candidates using games-played and minutes context. Same-split matching is enforced before scoring." />
      </p>
      <InterpretationNote parameters="limit, sampleSize, and split" />
      {data.warning ? <p className="empty-note">{data.warning}</p> : null}
      <p className="selector-note">
        Request context: Athlete #{safeToText(data.athleteId)} | Limit{" "}
        {safeToText(data.limit)} | Sample Size{" "}
        {safeToText(data.sampleSizeRequested)} | Split Requested{" "}
        {safeToText(data.splitRequested)} | Cache {safeToText(data._cache)}
      </p>
      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Total pool of eligible players evaluated before ranking the top comp matches."
          >
            Compared Against
            <InlineInfo label="comparedAgainst: count of eligible candidate vectors scored against the target athlete after filtering/validation." />
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.comparedAgainst))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Maximum number of player profiles considered by the comps endpoint before similarity scoring."
          >
            Sample Size
            <InlineInfo label="sampleSizeRequested: sanitized sample-size request used to build candidate pool and z-score stats." />
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.sampleSizeRequested))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="The split context used by the backend when constructing comparison vectors."
          >
            Source Split
            <InlineInfo label="sourceSplit: target summary split actually used to build the feature vector for this request." />
          </p>
          <p className="overview-pill-value">{safeToText(data.sourceSplit)}</p>
        </div>
      </div>
      {comps.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th title="Comparable player headshot.">Img</th>
                <th title="Comparable player's displayName after enrichment.">
                  Player
                </th>
                <th title="Comparable athlete identifier used for backend parity checks.">
                  Athlete ID
                </th>
                <th title="Comparable team abbreviation/name from enrichment lookup.">
                  Team
                </th>
                <th title="Comparable position abbreviation/name from enriched identity.">
                  Pos
                </th>
                <th title="Candidate split row used to construct this player's feature vector.">
                  Split
                </th>
                <th>
                  <span className="th-with-info">
                    Stability
                    <InlineInfo label="sampleStability factor (0.35 to 1.00) down-weights low games/minutes sample contexts." />
                  </span>
                </th>
                <th title="gamesPlayed from the candidate split row used for comp scoring.">
                  GP Used
                </th>
                <th>
                  <span className="th-with-info">
                    Similarity
                    <InlineInfo label="Adjusted similarity after smoothing. Base cosine similarity on z-score vectors is multiplied by sampleStability. Strict same-split filtering happens before scoring." />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comps.map((comp) => (
                <tr key={`${comp.athleteId}-${comp.displayName}`}>
                  <td>
                    <img
                      className="comp-headshot"
                      src={comp.headshot || getHeadshotUrl(comp.athleteId)}
                      alt={safeToText(comp.displayName)}
                      loading="lazy"
                    />
                  </td>
                  <td>{safeToText(comp.displayName)}</td>
                  <td>{safeToText(comp.athleteId)}</td>
                  <td>{safeToText(comp.teamAbbreviation || comp.team)}</td>
                  <td>{safeToText(comp.position)}</td>
                  <td>{safeToText(comp.sourceSplit)}</td>
                  <td>{formatFactor(comp.sampleStability)}</td>
                  <td>{formatMetricValue(toFiniteNumber(comp.gamesPlayed))}</td>
                  <td>{formatSimilarityScore(comp.similarityScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-note">No comps were returned for this athlete.</p>
      )}
      <p className="selector-note">
        Reading tip: a player can look strong in head-to-head raw stats but rank
        lower in comps when sample stability is low or the requested split
        context differs from the head-to-head slice you are mentally comparing.
      </p>
    </article>
  );
};

export const PlayerTrajectoryCard = ({
  data,
  playerLabel,
}: {
  data: PlayerTrajectoryResponse;
  playerLabel: string;
}) => {
  const trajectory = Array.isArray(data.trajectory) ? data.trajectory : [];
  const chartData = trajectory.slice(0, 20).map((point, index) => ({
    game: `G${index + 1}`,
    matchup: point.matchup || "-",
    pointsRolling: toFiniteNumber(point.rolling?.points),
    tsRolling: toFiniteNumber(point.rolling?.trueShootingPct),
  }));

  return (
    <article className="scout-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getHeadshotUrl(data.athleteId)}
          alt={playerLabel}
          loading="lazy"
        />
        <h3 title="Development Curve uses rolling averages over recent games to smooth variance and reveal trend direction.">
          Development Curve
        </h3>
      </div>
      <p className="viz-subtitle">
        Rolling production trend for {playerLabel} (window {data.window || 5}).
        <InlineInfo label="Rolling Window means each data point uses the average of the latest N valid games up to that game (N = selected window size)." />
      </p>
      <p className="derive-note">
        What this looks at: game-level trajectory rows ordered by recency. The
        chart uses rolling averages over the selected window to smooth noise and
        show directional movement in scoring and true-shooting efficiency. TS%
        is derived as points / (2 * (FGA + 0.44 * FTA)) * 100.
      </p>
      <InterpretationNote parameters="games, window, and seasonType" />
      <p className="selector-note">
        Request context: Athlete #{safeToText(data.athleteId)} | Games Requested{" "}
        {safeToText(data.gamesRequested)} | Games Analyzed{" "}
        {safeToText(data.gamesAnalyzed)} | Window {safeToText(data.window)} |
        Season Type {safeToText(data.seasonTypeRequested)} | Cache{" "}
        {safeToText(data._cache)}
      </p>
      <div className="interpret-note">
        <p className="interpret-note__title">How Window Changes The Curve</p>
        <ul className="interpret-note__list">
          <li>
            Games Requested ({safeToText(data.gamesRequested)}) and Games
            Analyzed ({safeToText(data.gamesAnalyzed)}) control how many game
            rows are in this trajectory dataset.
          </li>
          <li>
            Window ({safeToText(data.window)}) controls how each rolling value
            is computed from those rows.
          </li>
          <li>
            Larger window = smoother, slower-moving macro trend because each
            point averages more games.
          </li>
          <li>
            Smaller window = more reactive short-term trend because each point
            averages fewer games.
          </li>
          <li>
            Raw per-game stats do not change when window changes, but rolling
            values and trend direction can change because their averaging span
            changed.
          </li>
          <li>
            Cache MISS only means the backend recomputed instead of reusing a
            cached payload.
          </li>
        </ul>
      </div>
      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Number of completed games included in trajectory calculation."
          >
            Games Analyzed
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.gamesAnalyzed))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Rolling Points = average points across the latest N games in the rolling window."
          >
            <span className="label-with-info">
              Points Trend
              <InlineInfo label="Points Trend compares earliest vs latest Rolling Points: up/down/flat based on thresholded delta." />
            </span>
          </p>
          <p className="overview-pill-value">
            {safeToText(data.trendDirection?.points).toUpperCase()}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Rolling TS% = average true-shooting percentage across the latest N games in the rolling window."
          >
            <span className="label-with-info">
              TS% Trend
              <InlineInfo label="TS% Trend compares earliest vs latest Rolling TS%: up/down/flat based on thresholded delta." />
            </span>
          </p>
          <p className="overview-pill-value">
            {safeToText(data.trendDirection?.trueShootingPct).toUpperCase()}
          </p>
        </div>
      </div>
      {chartData.length ? (
        <div className="viz-container impact-viz">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 6, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf3" />
              <XAxis dataKey="game" tick={{ fill: "#5b6d86", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "#5b6d86", fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#5b6d86", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatMetricValue(toFiniteNumber(value)),
                  String(name || "Value"),
                ]}
                labelFormatter={(label, payload) => {
                  const datum = payload?.[0]?.payload as
                    | { matchup?: string }
                    | undefined;
                  return `${String(label)} | ${datum?.matchup ?? "-"}`;
                }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#d7e0ec",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pointsRolling"
                name="Rolling Points"
                stroke="#2f6cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tsRolling"
                name="Rolling TS%"
                stroke="#26a69a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="empty-note">No trajectory rows were returned.</p>
      )}
    </article>
  );
};

export const PlayerUsageValueCard = ({
  data,
  playerLabel,
}: {
  data: PlayerUsageValueResponse;
  playerLabel: string;
}) => {
  const actionableStats = data.actionableStats || {};
  const expectedRanges = data.expectedStatRanges || {};
  const actionableRows = Object.entries(actionableStats);
  const expectedRows = Object.entries(expectedRanges);
  const gmInsights = Array.isArray(data.decisionInsights?.gm)
    ? data.decisionInsights?.gm
    : [];
  const coachInsights = Array.isArray(data.decisionInsights?.coach)
    ? data.decisionInsights?.coach
    : [];

  return (
    <article className="scout-card compare-table-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getHeadshotUrl(data.athleteId)}
          alt={playerLabel}
          loading="lazy"
        />
        <h3 title="Usage Value benchmarks player production against peers in the same usage-rate bucket.">
          Usage Value Benchmark
        </h3>
      </div>
      <p className="viz-subtitle">
        Usage-adjusted production context for {playerLabel}.
      </p>
      <p className="derive-note">
        What this looks at: regular-season usage and production benchmarks among
        eligible peer samples. The backend groups players into usage buckets,
        computes bucket expected production, then classifies player value using
        z-score distance from bucket expectation.
      </p>
      <InterpretationNote parameters="usage bucket construction, eligibility thresholds, and forceRefresh" />
      {data.warning ? <p className="empty-note">{data.warning}</p> : null}
      <p className="selector-note">
        Request context: Athlete #{safeToText(data.athleteId)} | Split Used{" "}
        {safeToText(data.splitUsed)} | Source Split{" "}
        {safeToText(data.sourceSplit)} | Cache {safeToText(data._cache)}
      </p>

      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Player usage percent used to assign usage bucket."
          >
            Usage %
          </p>
          <p className="overview-pill-value">
            {formatUsagePercent(data.usagePct)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Merged usage bucket label used for benchmark comparison."
          >
            Usage Bucket
          </p>
          <p className="overview-pill-value">{safeToText(data.usageBucket)}</p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Actual minus expected production standardized by bucket std dev."
          >
            Z-Score
          </p>
          <p className="overview-pill-value">{formatFactor(data.zScore, 2)}</p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Classification using z-score thresholds: above, within, or below expected range."
          >
            Status
          </p>
          <p className="overview-pill-value">{toReadableSignal(data.status)}</p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Bucket expected mean production (efficiencyIndex)."
          >
            Expected Prod
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.expectedProduction)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Player actual production (efficiencyIndex)."
          >
            Actual Prod
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.actualProduction)}
          </p>
        </div>
      </div>

      <div className="impact-summary-grid context-wrap">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Peer sample size in this usage bucket."
          >
            Bucket Sample
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.bucketSampleSize)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Minimum games required for baseline eligibility."
          >
            Min Games
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.benchmarkContext?.minGames)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Minimum average minutes required for baseline eligibility."
          >
            Min Minutes
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.benchmarkContext?.minMinutes)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Usage bucket width used by benchmark model."
          >
            Bucket Width
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.benchmarkContext?.bucketWidth)}
          </p>
        </div>
      </div>

      {actionableRows.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th title="Tracked stat included in actionable benchmark outputs.">
                  Metric
                </th>
                <th title="Player actual stat value.">Actual</th>
                <th title="Bucket expected mean for this stat.">Expected</th>
                <th title="Expected bucket range (mean +/- 1 std dev).">
                  Expected Range
                </th>
                <th title="Actual minus expected mean.">Delta</th>
                <th title="Action signal from range comparison.">Signal</th>
              </tr>
            </thead>
            <tbody>
              {actionableRows.map(([key, stat]) => (
                <tr key={key}>
                  <td>{safeToText(stat?.metric || key)}</td>
                  <td>{formatMetricValue(stat?.actual)}</td>
                  <td>{formatMetricValue(stat?.expectedMean)}</td>
                  <td>
                    {formatMetricValue(stat?.expectedRange?.low)} to{" "}
                    {formatMetricValue(stat?.expectedRange?.high)}
                  </td>
                  <td>{formatMetricValue(stat?.deltaFromMean)}</td>
                  <td>
                    <span className={getSignalChipClass(stat?.signal)}>
                      {toReadableSignal(stat?.signal)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {expectedRows.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th title="Stat name from expected bucket profile.">Metric</th>
                <th title="Expected mean within the usage bucket.">Mean</th>
                <th title="Expected standard deviation in the usage bucket.">
                  Std Dev
                </th>
                <th title="Expected bucket range (mean +/- 1 std dev).">
                  Range
                </th>
                <th title="Number of peers informing this metric profile.">
                  Sample
                </th>
              </tr>
            </thead>
            <tbody>
              {expectedRows.map(([key, stat]) => (
                <tr key={`expected-${key}`}>
                  <td>{safeToText(stat?.metric || key)}</td>
                  <td>{formatMetricValue(stat?.expectedMean)}</td>
                  <td>{formatFactor(stat?.stdDev, 2)}</td>
                  <td>
                    {formatMetricValue(stat?.expectedRange?.low)} to{" "}
                    {formatMetricValue(stat?.expectedRange?.high)}
                  </td>
                  <td>{formatMetricValue(stat?.sampleSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* {data.decisionInsights?.summary ? (
        <p className="selector-note">
          Summary: {data.decisionInsights.summary}
        </p>
      ) : null} */}
      {gmInsights.length ? (
        <section className="context-wrap">
          <h4>GM Suggestions</h4>
          <ul className="plain-list">
            {gmInsights.map((item, index) => (
              <li key={`gm-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {coachInsights.length ? (
        <section className="context-wrap">
          <h4>Coach Suggestions</h4>
          <ul className="plain-list">
            {coachInsights.map((item, index) => (
              <li key={`coach-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
};

export const TeamEfficiencyCard = ({
  data,
  teamLabel,
}: {
  data: TeamEfficiencyResponse;
  teamLabel: string;
}) => {
  const recentGames = Array.isArray(data.recentGames) ? data.recentGames : [];
  const chartData = recentGames.slice(0, 12).map((game, index) => ({
    game: game.opponent?.abbreviation || `G${index + 1}`,
    date: formatGameDateTime(game.gameDate),
    score: game.score?.scoreLine || "-",
    netRtg: toFiniteNumber(game.netRtg),
  }));

  return (
    <article className="scout-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getTeamLogoUrl(data.team, data.teamId)}
          alt={teamLabel}
          loading="lazy"
        />
        <h3 title="Team Efficiency summarizes offensive and defensive quality per-possession before need-gap interpretation.">
          Team Efficiency Baseline
        </h3>
      </div>
      <p className="viz-subtitle">
        Efficiency profile for {teamLabel} used to identify strength and need
        gaps |{" "}
        {formatSeasonCoverage(data.seasonsCovered, data.seasonTypesCovered)}
        <InlineInfo label="seasonTypeRequested reflects normalized seasonType input; seasonsCovered/seasonTypesCovered describe returned completed-game rows." />
      </p>
      <p className="derive-note">
        What this looks at: completed-game box scores aggregated into
        possession-based efficiency metrics. Possessions are estimated from FGA
        - OREB + TOV + 0.44 * FTA, then offensive rating, defensive rating, and
        net rating are calculated per 100 possessions.
      </p>
      <InterpretationNote parameters="games and seasonType" />
      <p className="selector-note">
        Request context: Team #{safeToText(data.teamId)} | Games Requested{" "}
        {safeToText(data.gamesRequested)} | Games Played{" "}
        {safeToText(data.gamesPlayed)}| Cache {safeToText(data._cache)}
      </p>
      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="gamesPlayed: count of completed events included after season filter and safeGames clamp."
          >
            Games Played
          </p>
          <p className="overview-pill-value">
            {toFiniteNumber(data.gamesPlayed).toFixed(0)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="offRtg = (pointsScored / possessions) * 100, where possessions = FGA - OREB + TOV + 0.44 * FTA."
          >
            Offensive Rating
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.aggregate?.offRtg))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="defRtg = (pointsAllowed / possessions) * 100 using the same possession estimate."
          >
            Defensive Rating
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.aggregate?.defRtg))}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label" title="netRtg = offRtg - defRtg.">
            Net Rating
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(data.aggregate?.netRtg))}
          </p>
        </div>
      </div>

      {chartData.length ? (
        <div className="viz-container impact-viz">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 6, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf3" />
              <XAxis dataKey="game" tick={{ fill: "#5b6d86", fontSize: 11 }} />
              <YAxis tick={{ fill: "#5b6d86", fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  formatMetricValue(toFiniteNumber(value)),
                  "Net Rating",
                ]}
                labelFormatter={(label, payload) => {
                  const datum = payload?.[0]?.payload as
                    | { date?: string; score?: string }
                    | undefined;
                  return `${String(label)} | ${datum?.date ?? "-"} | ${datum?.score ?? "-"}`;
                }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#d7e0ec",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="netRtg" fill="#26a69a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="empty-note">No recent completed games were returned.</p>
      )}

      {recentGames.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th title="gameDate from completed event summary.">
                  Date / Time
                </th>
                <th title="Derived from seasonYear and seasonType metadata.">
                  Season
                </th>
                <th title="matchup string or derived home/away team text.">
                  Matchup
                </th>
                <th title="score result indicator from event summary.">
                  Result
                </th>
                <th title="scoreLine from event summary.">Score</th>
                <th title="possessions = FGA - OREB + TOV + 0.44 * FTA.">
                  Poss
                </th>
                <th title="offRtg = pointsScored per 100 possessions.">Off</th>
                <th title="defRtg = pointsAllowed per 100 possessions.">Def</th>
                <th title="netRtg = offRtg - defRtg.">Net</th>
              </tr>
            </thead>
            <tbody>
              {recentGames.slice(0, 12).map((game) => {
                const matchup =
                  game.matchup ||
                  formatMatchupText(
                    game.team?.abbreviation ||
                      game.team?.shortDisplayName ||
                      game.team?.displayName,
                    game.opponent?.abbreviation ||
                      game.opponent?.shortDisplayName ||
                      game.opponent?.displayName,
                    game.homeAway,
                  );

                return (
                  <tr key={game.eventId || `${game.gameDate}-${game.netRtg}`}>
                    <td>{formatGameDateTime(game.gameDate)}</td>
                    <td>{formatSeasonTag(game.seasonYear, game.seasonType)}</td>
                    <td>{matchup}</td>
                    <td>{safeToText(game.score?.result)}</td>
                    <td>{safeToText(game.score?.scoreLine)}</td>
                    <td>
                      {formatMetricValue(toFiniteNumber(game.possessions))}
                    </td>
                    <td>{formatMetricValue(toFiniteNumber(game.offRtg))}</td>
                    <td>{formatMetricValue(toFiniteNumber(game.defRtg))}</td>
                    <td>{formatMetricValue(toFiniteNumber(game.netRtg))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
};

export const TeamNeedGapCard = ({
  data,
  teamLabel,
}: {
  data: TeamNeedGapResponse;
  teamLabel: string;
}) => {
  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const gaps = Array.isArray(data.gaps) ? data.gaps : [];
  const delta = data.deltaFromLeague || {};

  return (
    <article className="scout-card compare-table-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getTeamLogoUrl(data.team, data.teamId)}
          alt={teamLabel}
          loading="lazy"
        />
        <h3 title="Need Gap Analysis compares team efficiency against league averages to surface strengths and weaknesses.">
          Team Need Gap Analysis
        </h3>
      </div>
      <p className="viz-subtitle">
        Delta from league-average benchmarks for {teamLabel}.
      </p>
      <p className="derive-note">
        What this looks at: team aggregate efficiency (off/def/net) compared
        against league-average aggregate values over the same filter context
        (season type and recent games). Gaps are deduced from team-minus-league
        deltas and categorized as strengths or needs. Strengths are the top
        positive deltas, while gaps are the top negative deltas in the same
        benchmark context.
      </p>
      <InterpretationNote parameters="games and seasonType" />
      <p className="selector-note">
        Request context: Team #{safeToText(data.teamId)} | Games Requested{" "}
        {safeToText(data.gamesRequested)} | Benchmark Teams{" "}
        {safeToText(data.benchmarkTeamsCount)} | Cache {safeToText(data._cache)}
      </p>
      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Offensive rating delta from league average (team minus league)."
          >
            <span className="label-with-info">
              Off Rating Gap
              <InlineInfo label="Off Rating Gap = team.offRtg - league.offRtg. Positive means better-than-league offensive efficiency in this context." />
            </span>
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(delta.offRtg))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Defensive rating delta from league average (team minus league). Lower defensive rating is typically better."
          >
            <span className="label-with-info">
              Def Rating Gap
              <InlineInfo label="Def Rating Gap = league.defRtg - team.defRtg (inverted so positive means better defense). Positive means allowing fewer points per 100 possessions than league baseline." />
            </span>
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(delta.defRtg))}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title="Net rating delta from league average (team minus league)."
          >
            <span className="label-with-info">
              Net Rating Gap
              <InlineInfo label="Net Rating Gap = team.netRtg - league.netRtg. Positive means better overall two-way impact than league baseline." />
            </span>
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(toFiniteNumber(delta.netRtg))}
          </p>
        </div>
      </div>
      <div className="comparison-grid">
        <section className="scout-card">
          <h4>
            <span className="label-with-info">
              Strengths
              <InlineInfo label="Strengths are metrics with positive team-minus-league deltas (above_league_avg), ranked by largest positive values and capped to top 3." />
            </span>
          </h4>
          {strengths.length ? (
            <ul className="plain-list">
              {strengths.map((item) => (
                <li key={`s-${item.metric}`}>
                  <span className="label-with-info">
                    {safeToText(item.description)}
                    <InlineInfo label={getTeamGapMetricTooltip(item.metric)} />
                  </span>
                  : {formatMetricValue(toFiniteNumber(item.delta))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No above-average strengths returned.</p>
          )}
        </section>
        <section className="scout-card">
          <h4>
            <span className="label-with-info">
              Gaps
              <InlineInfo label="Gaps are metrics with negative team-minus-league deltas (below_league_avg), ranked by most negative values and capped to top 3." />
            </span>
          </h4>
          {gaps.length ? (
            <ul className="plain-list">
              {gaps.map((item) => (
                <li key={`g-${item.metric}`}>
                  <span className="label-with-info">
                    {safeToText(item.description)}
                    <InlineInfo label={getTeamGapMetricTooltip(item.metric)} />
                  </span>
                  : {formatMetricValue(toFiniteNumber(item.delta))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No below-average gaps returned.</p>
          )}
        </section>
      </div>
    </article>
  );
};

const getTeamGradeChipClass = (grade?: string | null): string => {
  if (!grade) {
    return "chip";
  }

  if (grade.startsWith("A") || grade.startsWith("B")) {
    return "chip hit";
  }

  if (grade.startsWith("D") || grade === "F") {
    return "chip miss";
  }

  return "chip";
};

const getTeamGradeMetricTooltip = (key?: string): string => {
  switch (String(key || "")) {
    case "netRtg":
      return "Net Rating — worth 40% of the grade. Higher is better.";
    case "offRtg":
      return "Offensive Rating — worth 25% of the grade. Higher is better.";
    case "defRtg":
      return "Defensive Rating — worth 25% of the grade. Lower is better.";
    case "winRate":
      return "Recent win rate over the requested game window — worth 10% of the grade.";
    default:
      return "Contributes to the overall grade for the requested game window.";
  }
};

export const TeamGradeCard = ({
  data,
  teamLabel,
}: {
  data: TeamGradeResponse;
  teamLabel: string;
}) => {
  const grade = data.grade;
  const metrics = Array.isArray(grade?.metrics) ? grade.metrics : [];

  return (
    <article className="scout-card compare-table-card">
      <div className="card-title-with-headshot">
        <img
          className="headshot headshot--tiny"
          src={getTeamLogoUrl(data.team, data.teamId)}
          alt={teamLabel}
          loading="lazy"
        />
        <h3 title="Team Grade scores recent form against the rest of the league for the requested game window and season type.">
          Team Grade
        </h3>
      </div>
      <p className="fantasy-plain-summary">
        This is a recent-form snapshot, not a permanent label — it's based on
        the last {safeToText(data.gamesRequested)} games only. Change the games
        or season type and the grade will change too.
      </p>
      <div className="impact-summary-grid">
        <div className="overview-pill overview-pill--highlight">
          <p className="overview-pill-label">Grade</p>
          <p className="overview-pill-value">
            <span className={getTeamGradeChipClass(grade?.grade)}>
              {safeToText(grade?.grade)}
            </span>
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Score (0-100)</p>
          <p className="overview-pill-value">
            {formatMetricValue(grade?.score)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Games Used</p>
          <p className="overview-pill-value">
            {safeToText(grade?.gamesPlayed)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">League Sample</p>
          <p className="overview-pill-value">
            {safeToText(grade?.leagueSampleSize)} teams
          </p>
        </div>
      </div>

      {metrics.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>League Avg</th>
                <th title="How many standard deviations from the league average, adjusted for direction.">
                  Z-Score
                </th>
                <th title="0-100 score for this metric alone.">Score</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.key}>
                  <td>
                    <span className="label-with-info">
                      {metric.label}
                      <InlineInfo
                        label={getTeamGradeMetricTooltip(metric.key)}
                      />
                    </span>
                  </td>
                  <td>{formatMetricValue(metric.value)}</td>
                  <td>{formatMetricValue(metric.leagueAverage)}</td>
                  <td>{formatFactor(metric.zScore, 2)}</td>
                  <td>{formatMetricValue(metric.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="comparison-grid context-wrap">
        <section className="scout-card">
          <h4>Strengths</h4>
          {grade?.strengths?.length ? (
            <ul className="plain-list">
              {grade.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No standout strengths right now.</p>
          )}
        </section>
        <section className="scout-card">
          <h4>Weaknesses</h4>
          {grade?.weaknesses?.length ? (
            <ul className="plain-list">
              {grade.weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No standout weaknesses right now.</p>
          )}
        </section>
      </div>
    </article>
  );
};

export const TeamCompareCard = ({ data }: { data: TeamCompareResponse }) => {
  const { comparison } = data;
  const advantageLabel =
    comparison.advantage === "tie"
      ? "Even matchup"
      : comparison.advantage === "teamA"
        ? `${data.teamA.team?.displayName || "Team A"} has the edge`
        : `${data.teamB.team?.displayName || "Team B"} has the edge`;

  return (
    <article className="scout-card compare-table-card">
      <h3 title="Compares two teams' recent efficiency metrics and grades head-to-head.">
        Team Head-to-Head
      </h3>
      <p className="fantasy-plain-summary">
        Compares both teams' last {safeToText(data.gamesRequested)} games side
        by side — a recent-form snapshot, not a permanent power ranking.
      </p>
      <p className="callout-note">{advantageLabel}</p>

      <div className="comparison-grid">
        {[
          { label: "Team A", side: data.teamA },
          { label: "Team B", side: data.teamB },
        ].map(({ label, side }) => (
          <section className="scout-card" key={label}>
            <div className="card-title-with-headshot">
              <img
                className="headshot headshot--tiny"
                src={getTeamLogoUrl(side.team, side.teamId)}
                alt={side.team?.displayName || label}
                loading="lazy"
              />
              <h4>{side.team?.displayName || label}</h4>
            </div>
            <span className={getTeamGradeChipClass(side.grade?.grade)}>
              Grade {safeToText(side.grade?.grade)} (
              {formatMetricValue(side.grade?.score)})
            </span>
          </section>
        ))}
      </div>

      {comparison.metrics.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>{data.teamA.team?.displayName || "Team A"}</th>
                <th>{data.teamB.team?.displayName || "Team B"}</th>
                <th>Edge</th>
              </tr>
            </thead>
            <tbody>
              {comparison.metrics.map((metric) => (
                <tr key={metric.key}>
                  <td>{metric.label}</td>
                  <td>{formatMetricValue(metric.teamA)}</td>
                  <td>{formatMetricValue(metric.teamB)}</td>
                  <td>
                    {metric.advantage === "tie" || !metric.advantage
                      ? "Tie"
                      : metric.advantage === "teamA"
                        ? data.teamA.team?.displayName || "Team A"
                        : data.teamB.team?.displayName || "Team B"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
};

const formatAdp = (
  adp: number | null | undefined,
  isPlaceholder?: boolean,
): string => {
  if (isPlaceholder) {
    return "No live ADP yet";
  }

  if (adp === null || adp === undefined || !Number.isFinite(adp)) {
    return "—";
  }

  return adp.toFixed(1);
};

const getFantasyStatusLabel = (status?: string | null): string => {
  switch (status) {
    case "undervalued":
      return "Undervalued";
    case "overvalued":
      return "Overvalued";
    case "valued_as_expected":
      return "Valued As Expected";
    case "no_adp_signal":
      return "No ADP Signal";
    case "insufficient_data":
      return "Insufficient Data";
    case "insufficient_peers":
      return "Insufficient Peers";
    default:
      return toReadableSignal(status);
  }
};

const getFantasyStatusChipClass = (status?: string | null): string => {
  if (status === "undervalued") {
    return "chip hit";
  }

  if (status === "overvalued") {
    return "chip miss";
  }

  if (
    status === "no_adp_signal" ||
    status === "insufficient_data" ||
    status === "insufficient_peers"
  ) {
    return "chip muted";
  }

  return "chip";
};

const getFantasyRowAccentClass = (status?: string | null): string => {
  if (status === "undervalued") {
    return "fantasy-player-row--value";
  }

  if (status === "overvalued") {
    return "fantasy-player-row--risk";
  }

  if (
    status === "no_adp_signal" ||
    status === "insufficient_data" ||
    status === "insufficient_peers"
  ) {
    return "fantasy-player-row--muted";
  }

  return "";
};

// Generic extractor: backend fields sometimes arrive as plain primitives and
// sometimes as ESPN-style objects (e.g. { displayValue, value, abbreviation }).
// This avoids ever rendering a bare object as "[object Object]".
const formatFantasyValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? formatMetricValue(value) : "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value.trim() || "-";
  }

  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => formatFantasyValue(item)).join(", ")
      : "-";
  }

  if (typeof value === "object") {
    const bag = value as Record<string, unknown>;
    const preferredKeys = [
      "displayValue",
      "value",
      "label",
      "displayName",
      "name",
      "description",
      "abbreviation",
      "type",
      "status",
    ];

    for (const key of preferredKeys) {
      const candidate = bag[key];
      if (
        (typeof candidate === "string" && candidate.trim()) ||
        typeof candidate === "number"
      ) {
        return formatFantasyValue(candidate);
      }
    }

    const entries = Object.entries(bag).filter(
      ([, entryValue]) => entryValue !== null && entryValue !== undefined,
    );
    if (!entries.length) {
      return "-";
    }

    return entries
      .slice(0, 3)
      .map(([key, entryValue]) =>
        typeof entryValue === "object" && entryValue !== null
          ? `${key}: …`
          : `${key}: ${formatFantasyValue(entryValue)}`,
      )
      .join(", ");
  }

  return "-";
};

const formatFantasyTeam = (team: unknown): string => formatFantasyValue(team);

const formatFantasyInjury = (injury: unknown): string => {
  if (injury === null || injury === undefined) {
    return "Healthy";
  }

  if (typeof injury === "string" && !injury.trim()) {
    return "Healthy";
  }

  return formatFantasyValue(injury);
};

const getInjuryChipClass = (injury: unknown): string => {
  const label = formatFantasyInjury(injury).toLowerCase();
  if (label.includes("out") || label.includes("ir") || label.includes("pup")) {
    return "chip miss";
  }

  if (label.includes("doubtful") || label.includes("questionable")) {
    return "chip muted";
  }

  return "chip";
};

const formatActualStat = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "Not played yet";
  }

  return formatMetricValue(value);
};

const formatDraftVsProjectedRank = (entry: {
  position: string;
  adpPositionRank: number | null;
  projectedPositionRank: number | null;
}): string => {
  const { position, adpPositionRank, projectedPositionRank } = entry;
  if (adpPositionRank === null || projectedPositionRank === null) {
    return "—";
  }

  return `Drafted as ${position}${adpPositionRank}, projects as ${position}${projectedPositionRank}`;
};

const formatAdpDeltaHeadline = (entry: {
  position: string;
  adpDelta: number | null;
}): string | null => {
  if (entry.adpDelta === null || entry.adpDelta === undefined) {
    return null;
  }

  if (entry.adpDelta === 0) {
    return `Drafted right at their ${entry.position} projection.`;
  }

  const direction = entry.adpDelta > 0 ? "above" : "below";
  return `Projected ${Math.abs(entry.adpDelta)} ${entry.position} spot${
    Math.abs(entry.adpDelta) === 1 ? "" : "s"
  } ${direction} ADP.`;
};

const getSleeperScoreIntensityLabel = (
  score: number | null | undefined,
): string | null => {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return null;
  }

  if (score > 1) {
    return "Meaningful value signal";
  }

  if (score < -1) {
    return "Expensive relative to projection";
  }

  return "Expected market value";
};

const formatStartersSummary = (
  starters: Record<string, number | undefined> | undefined,
): string => {
  if (!starters) {
    return "-";
  }

  const entries = Object.entries(starters).filter(
    ([, count]) => typeof count === "number" && count > 0,
  );

  if (!entries.length) {
    return "-";
  }

  return entries.map(([position, count]) => `${position} ${count}`).join(" · ");
};

type RosterSlot = {
  key: string;
  label: string;
  eligiblePositions: string[];
};

const ROSTER_SLOT_ORDER = [
  "QB",
  "RB",
  "WR",
  "TE",
  "FLEX",
  "K",
  "DST",
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "G",
  "F",
  "UTIL",
];

const NBA_POSITIONS = ["PG", "SG", "SF", "PF", "C"];

const buildRosterSlots = (
  starters: Record<string, number | undefined> | undefined,
): RosterSlot[] => {
  const slots: RosterSlot[] = [];

  for (const position of ROSTER_SLOT_ORDER) {
    const count = starters?.[position] ?? 0;
    for (let index = 1; index <= count; index += 1) {
      slots.push({
        key: `${position}-${index}`,
        label: count > 1 ? `${position}${index}` : position,
        eligiblePositions:
          position === "FLEX"
            ? ["RB", "WR", "TE"]
            : position === "G"
              ? ["PG", "SG"]
              : position === "F"
                ? ["SF", "PF"]
                : position === "UTIL"
                  ? NBA_POSITIONS
                  : [position],
      });
    }
  }

  return slots;
};

export type DraftTeamRosters = Record<
  number,
  Record<string, FantasyPlayerCandidate>
>;

export type DraftRosterState = {
  teamRosters: DraftTeamRosters;
  selectedTeamIndex: number;
  onTeamRostersChange: (next: DraftTeamRosters) => void;
  onSelectTeam: (index: number) => void;
  onUndraftPlayer: (id: string) => void;
  onReset: () => void;
};

const getDraftTeamLabel = (index: number) =>
  index === 0 ? "My Team" : `Team ${index + 1}`;

const byVorpDesc = (a: FantasyPlayerCandidate, b: FantasyPlayerCandidate) =>
  (typeof b.vorp === "number" ? b.vorp : -Infinity) -
  (typeof a.vorp === "number" ? a.vorp : -Infinity);

// A player rostered by any team in the league is off the board for every team.
const collectRosteredIds = (teamRosters: DraftTeamRosters) =>
  new Set(
    Object.values(teamRosters).flatMap((roster) =>
      Object.values(roster).map((player) => String(player.id)),
    ),
  );

type RosterNeed = {
  slotLabel: string;
  positions: string[];
  candidate: FantasyPlayerCandidate;
};

const buildRosterNeeds = (
  data: DraftBoardResponse,
  assignments: Record<string, FantasyPlayerCandidate>,
  rosteredIds: Set<string>,
): RosterNeed[] => {
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const seenSlotTypes = new Set<string>();
  const alreadySuggested = new Set<string>();
  const needs: RosterNeed[] = [];

  for (const slot of buildRosterSlots(data.leagueSettings?.starters)) {
    if (assignments[slot.key]) {
      continue;
    }

    const slotType = slot.eligiblePositions.join("/");
    if (seenSlotTypes.has(slotType)) {
      continue;
    }
    seenSlotTypes.add(slotType);

    const best = candidates
      .filter(
        (candidate) =>
          slot.eligiblePositions.includes(candidate.position) &&
          !rosteredIds.has(String(candidate.id)) &&
          !alreadySuggested.has(String(candidate.id)),
      )
      .sort(byVorpDesc)[0];

    if (best) {
      alreadySuggested.add(String(best.id));
      needs.push({
        slotLabel: slot.label,
        positions: slot.eligiblePositions,
        candidate: best,
      });
    }
  }

  return needs.sort((a, b) => byVorpDesc(a.candidate, b.candidate));
};

// Used by the one-click Draft buttons, which pick a player without naming a slot.
export const assignCandidateToOpenSlot = (
  teamRosters: DraftTeamRosters,
  teamIndex: number,
  starters: Record<string, number | undefined> | undefined,
  candidate: FantasyPlayerCandidate,
): DraftTeamRosters => {
  if (collectRosteredIds(teamRosters).has(String(candidate.id))) {
    return teamRosters;
  }

  const assignments = teamRosters[teamIndex] ?? {};
  const openSlot = buildRosterSlots(starters).find(
    (slot) =>
      !assignments[slot.key] &&
      slot.eligiblePositions.includes(candidate.position),
  );

  if (!openSlot) {
    return teamRosters;
  }

  return {
    ...teamRosters,
    [teamIndex]: { ...assignments, [openSlot.key]: candidate },
  };
};

type DraftLogEntry = {
  id: string;
  name: string;
  position: string;
  teamLabel: string;
};

const buildDraftLog = (teamRosters: DraftTeamRosters): DraftLogEntry[] =>
  Object.entries(teamRosters).flatMap(([teamIndex, roster]) =>
    Object.values(roster).map((player) => ({
      id: String(player.id),
      name: safeToText(player.name),
      position: safeToText(player.position),
      teamLabel: getDraftTeamLabel(Number(teamIndex)),
    })),
  );

export type RosterSlotAssignments = Record<string, FantasyPlayerCandidate>;

const ALL_FANTASY_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"];

const DEFAULT_STARTERS: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  K: 1,
  DST: 1,
};

// Parses the "QB:1,RB:2,..." text input the fantasy forms accept.
export const parseStartersConfig = (
  starters: string,
): Record<string, number> => {
  const parsed: Record<string, number> = {};

  for (const part of starters.split(",")) {
    const [position, count] = part.split(":");
    const key = position?.trim().toUpperCase();
    const value = Number(count);

    if (key && Number.isFinite(value) && value > 0) {
      parsed[key] = value;
    }
  }

  return Object.keys(parsed).length ? parsed : DEFAULT_STARTERS;
};

export const buildRosterBuilderSlots = (
  starters: string,
  benchCount = 6,
): RosterSlot[] => {
  const slots = buildRosterSlots(parseStartersConfig(starters));

  for (let index = 1; index <= benchCount; index += 1) {
    slots.push({
      key: `BN-${index}`,
      label: `BN${index}`,
      eligiblePositions: ALL_FANTASY_POSITIONS,
    });
  }

  return slots;
};

const RosterSlotGrid = ({
  slots,
  assignments,
  candidates,
  unavailableIds,
  onAssign,
  onClear,
}: {
  slots: RosterSlot[];
  assignments: RosterSlotAssignments;
  candidates: FantasyPlayerCandidate[];
  unavailableIds: Set<string>;
  onAssign: (slot: RosterSlot, candidate: FantasyPlayerCandidate) => void;
  onClear: (slotKey: string) => void;
}) => {
  const [openSlotKey, setOpenSlotKey] = useState<string | null>(null);
  const [pickerFilter, setPickerFilter] = useState("");
  const needle = pickerFilter.trim().toLowerCase();

  const handlePick = (slot: RosterSlot, candidate: FantasyPlayerCandidate) => {
    onAssign(slot, candidate);
    setOpenSlotKey(null);
    setPickerFilter("");
  };

  return (
    <div className="draft-roster-grid">
      {slots.map((slot) => {
        const assigned = assignments[slot.key];
        const isOpen = openSlotKey === slot.key;
        const eligibleCandidates = candidates
          .filter((candidate) =>
            slot.eligiblePositions.includes(candidate.position),
          )
          .filter(
            (candidate) =>
              !unavailableIds.has(String(candidate.id)) ||
              (assigned && String(assigned.id) === String(candidate.id)),
          )
          .filter((candidate) =>
            needle ? candidate.name.toLowerCase().includes(needle) : true,
          )
          .sort(byVorpDesc)
          .slice(0, 25);

        return (
          <div className="draft-roster-slot" key={slot.key}>
            <button
              type="button"
              className={`draft-roster-slot__cell ${
                assigned ? "filled" : "empty"
              } ${isOpen ? "open" : ""}`}
              onClick={() =>
                setOpenSlotKey((current) =>
                  current === slot.key ? null : slot.key,
                )
              }
            >
              <span className="draft-roster-slot__label">{slot.label}</span>
              {assigned ? (
                <span className="draft-roster-slot__player">
                  <strong>{safeToText(assigned.name)}</strong>
                  <span className="meta-line">
                    {safeToText(assigned.position)} ·{" "}
                    {formatFantasyTeam(assigned.team)} · VORP{" "}
                    {formatMetricValue(assigned.vorp)}
                  </span>
                </span>
              ) : (
                <span className="draft-roster-slot__placeholder">
                  + Add Player
                </span>
              )}
            </button>
            {assigned ? (
              <button
                type="button"
                className="draft-roster-slot__clear"
                aria-label={`Clear ${slot.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onClear(slot.key);
                }}
              >
                ×
              </button>
            ) : null}

            {isOpen ? (
              <div className="draft-roster-picker">
                <input
                  type="search"
                  className="fantasy-search-input"
                  placeholder={`Search ${slot.label} candidates...`}
                  value={pickerFilter}
                  onChange={(event) => setPickerFilter(event.target.value)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
                <div className="draft-roster-picker__list">
                  {eligibleCandidates.length ? (
                    eligibleCandidates.map((candidate, index) => (
                      <button
                        type="button"
                        key={String(candidate.id)}
                        className="draft-roster-picker__row"
                        onClick={() => handlePick(slot, candidate)}
                      >
                        <span className="draft-roster-picker__rank">
                          #{index + 1}
                        </span>
                        <span className="draft-roster-picker__name">
                          {safeToText(candidate.name)}{" "}
                          <span className="chip">
                            {safeToText(candidate.position)}
                          </span>
                        </span>
                        <span className="draft-roster-picker__meta">
                          Tier {safeToText(candidate.tier)} · ADP{" "}
                          {formatAdp(candidate.adp, candidate.adpIsPlaceholder)}{" "}
                          · VORP {formatMetricValue(candidate.vorp)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="empty-note">
                      No available candidates for this slot.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const FantasyRosterBuilder = ({
  title,
  hint,
  starters,
  candidates,
  assignments,
  unavailableIds,
  onChange,
}: {
  title: string;
  hint?: string;
  starters: string;
  candidates: FantasyPlayerCandidate[];
  assignments: RosterSlotAssignments;
  unavailableIds?: Set<string>;
  onChange: (next: RosterSlotAssignments) => void;
}) => {
  const slots = buildRosterBuilderSlots(starters);
  const ownIds = new Set(
    Object.values(assignments).map((player) => String(player.id)),
  );
  const blocked = new Set([...ownIds, ...(unavailableIds ?? [])]);
  const filled = Object.keys(assignments).length;

  return (
    <section className="draft-roster-board roster-builder">
      <div className="draft-roster-board__header">
        <div>
          <h4 className="fantasy-section-heading">{title}</h4>
          {hint ? <p className="helper-note">{hint}</p> : null}
        </div>
        <div className="draft-roster-board__actions">
          <span className="draft-roster-board__count">
            {filled}/{slots.length} filled
          </span>
          {filled ? (
            <button
              type="button"
              className="draft-roster-board__reset"
              onClick={() => onChange({})}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <RosterSlotGrid
        slots={slots}
        assignments={assignments}
        candidates={candidates}
        unavailableIds={blocked}
        onAssign={(slot, candidate) =>
          onChange({ ...assignments, [slot.key]: candidate })
        }
        onClear={(slotKey) => {
          const next = { ...assignments };
          delete next[slotKey];
          onChange(next);
        }}
      />
    </section>
  );
};

const DraftRosterBoard = ({
  data,
  draftState,
  onPickPlayer,
}: {
  data: DraftBoardResponse;
  draftState: DraftRosterState;
  onPickPlayer: (candidate: FantasyPlayerCandidate) => void;
}) => {
  const teamCount = Math.max(1, data.leagueSettings?.teamCount ?? 1);
  const { teamRosters, selectedTeamIndex } = draftState;

  const slots = buildRosterSlots(data.leagueSettings?.starters);
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const assignments = teamRosters[selectedTeamIndex] ?? {};
  const assignedIds = collectRosteredIds(teamRosters);

  const handlePick = (slot: RosterSlot, candidate: FantasyPlayerCandidate) => {
    draftState.onTeamRostersChange({
      ...teamRosters,
      [selectedTeamIndex]: { ...assignments, [slot.key]: candidate },
    });
    onPickPlayer(candidate);
  };

  const handleClearSlot = (slotKey: string) => {
    const cleared = assignments[slotKey];
    const roster = { ...assignments };
    delete roster[slotKey];
    draftState.onTeamRostersChange({
      ...teamRosters,
      [selectedTeamIndex]: roster,
    });

    if (cleared) {
      draftState.onUndraftPlayer(String(cleared.id));
    }
  };

  const filledSlotCount = Object.keys(assignments).length;
  const totalPicks = assignedIds.size;

  return (
    <section className="draft-roster-board">
      <div className="draft-roster-board__header">
        <div>
          <h4 className="fantasy-section-heading">League Roster Board</h4>
          <p className="helper-note">
            Pick the team on the clock, then click a slot to fill it. Picks are
            saved on this device and stay put if you leave the page.
          </p>
        </div>
        <div className="draft-roster-board__actions">
          <span className="draft-roster-board__count">
            {filledSlotCount}/{slots.length} filled
          </span>
          {totalPicks ? (
            <button
              type="button"
              className="draft-roster-board__reset"
              onClick={draftState.onReset}
            >
              Reset Draft
            </button>
          ) : null}
        </div>
      </div>

      <div className="draft-roster-team-tabs" role="tablist" aria-label="Teams">
        {Array.from({ length: teamCount }, (_, index) => index).map((index) => {
          const filled = Object.keys(teamRosters[index] ?? {}).length;
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={selectedTeamIndex === index}
              className={`draft-roster-team-tab ${
                selectedTeamIndex === index ? "active" : ""
              }`}
              onClick={() => {
                draftState.onSelectTeam(index);
              }}
            >
              {getDraftTeamLabel(index)}
              {filled ? (
                <span className="draft-roster-team-tab__badge">{filled}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <RosterSlotGrid
        key={selectedTeamIndex}
        slots={slots}
        assignments={assignments}
        candidates={candidates}
        unavailableIds={assignedIds}
        onAssign={handlePick}
        onClear={handleClearSlot}
      />
    </section>
  );
};

const FantasyGlossary = ({
  items,
}: {
  items: Array<{ term: string; definition: string }>;
}) => (
  <details className="context-wrap fantasy-glossary">
    <summary>What do these terms mean?</summary>
    <ul className="plain-list">
      {items.map((item) => (
        <li key={item.term}>
          <strong>{item.term}:</strong> {item.definition}
        </li>
      ))}
    </ul>
  </details>
);

const FantasyPlainSummary = ({ children }: { children: ReactNode }) => (
  <p className="fantasy-plain-summary">{children}</p>
);

const FANTASY_STATUS_LEGEND_ITEMS = [
  { chipClass: "chip hit", label: "Green = good value" },
  { chipClass: "chip miss", label: "Red = riskier / pricier" },
  { chipClass: "chip muted", label: "Gray = not enough data yet" },
];

const FantasyStatusLegend = () => (
  <div className="fantasy-status-legend" aria-label="Color legend">
    <span className="fantasy-status-legend__label">Color guide:</span>
    {FANTASY_STATUS_LEGEND_ITEMS.map((item) => (
      <span className={item.chipClass} key={item.label}>
        {item.label}
      </span>
    ))}
  </div>
);

type FantasyStrategySection = {
  phase: string;
  tips: string[];
};

const FantasyStrategyGuide = ({
  title,
  sections,
}: {
  title: string;
  sections: FantasyStrategySection[];
}) => (
  <details className="context-wrap fantasy-strategy" open>
    <summary>{title}</summary>
    {sections.map((section) => (
      <div className="fantasy-strategy__section" key={section.phase}>
        <h4>{section.phase}</h4>
        <ul className="plain-list">
          {section.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    ))}
  </details>
);

const FLEX_ELIGIBLE_POSITIONS = new Set(["RB", "WR", "TE"]);

type PositionScarcityRow = {
  position: string;
  replacementRank: number | null;
  replacementPlayerName: string | null;
  baselineProjected: number | null;
  mandatoryStarters: number | null;
  flexShare: number | null;
  topCandidateName: string | null;
  topCandidateProjected: number | null;
  topCandidateVorp: number | null;
};

const buildPositionScarcityRows = (
  data: DraftBoardResponse,
): PositionScarcityRow[] => {
  const baselines = data.replacementBaselines || {};
  const teamCount = data.leagueSettings?.teamCount ?? null;
  const starters = (data.leagueSettings?.starters ?? {}) as Record<
    string,
    number | undefined
  >;
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];

  return Object.entries(baselines)
    .map(([position, baseline]) => {
      const starterCount = starters[position];
      const mandatoryStarters =
        typeof teamCount === "number" && typeof starterCount === "number"
          ? teamCount * starterCount
          : null;
      const flexShare =
        FLEX_ELIGIBLE_POSITIONS.has(position) &&
        typeof mandatoryStarters === "number" &&
        typeof baseline.replacementRank === "number"
          ? Math.max(0, baseline.replacementRank - mandatoryStarters)
          : null;

      const positionCandidates = candidates
        .filter((candidate) => candidate.position === position)
        .sort(
          (a, b) =>
            (typeof b.vorp === "number" ? b.vorp : -Infinity) -
            (typeof a.vorp === "number" ? a.vorp : -Infinity),
        );
      const top = positionCandidates[0] ?? null;

      return {
        position,
        replacementRank: baseline.replacementRank,
        replacementPlayerName: baseline.replacementPlayerName,
        baselineProjected: baseline.projectedTotal,
        mandatoryStarters,
        flexShare,
        topCandidateName: top?.name ?? null,
        topCandidateProjected: top?.projectedTotal ?? null,
        topCandidateVorp: top?.vorp ?? null,
      };
    })
    .sort(
      (a, b) =>
        (typeof b.topCandidateVorp === "number"
          ? b.topCandidateVorp
          : -Infinity) -
        (typeof a.topCandidateVorp === "number"
          ? a.topCandidateVorp
          : -Infinity),
    );
};

const PositionScarcityPanel = ({ data }: { data: DraftBoardResponse }) => {
  const rows = buildPositionScarcityRows(data);

  if (!rows.length) {
    return null;
  }

  const maxProjected = Math.max(
    1,
    ...rows.map((row) =>
      Math.max(row.baselineProjected ?? 0, row.topCandidateProjected ?? 0),
    ),
  );

  return (
    <details className="context-wrap fantasy-peer-details">
      <summary>Why this rank?</summary>
      <p className="derive-note">
        The "replacement player" is roughly the last player the league would
        need to fill every starting slot at that position. A bigger gap between
        the best available player and that baseline means the position is scarce
        right now; a small gap means it's safe to wait.
      </p>
      <div className="scarcity-board">
        {rows.map((row) => {
          const baselinePct =
            row.baselineProjected !== null
              ? Math.min(100, (row.baselineProjected / maxProjected) * 100)
              : 0;
          const topPct =
            row.topCandidateProjected !== null
              ? Math.min(100, (row.topCandidateProjected / maxProjected) * 100)
              : 0;
          const gapWidth = Math.max(0, topPct - baselinePct);

          return (
            <div className="scarcity-row" key={row.position}>
              <div className="scarcity-row__header">
                <span className="chip">{row.position}</span>
                <p className="scarcity-row__baseline-text">
                  Replacement Player #{safeToText(row.replacementRank)} (last
                  starter needed league-wide for {row.position} based on your
                  league): {safeToText(row.replacementPlayerName)} (
                  {formatMetricValue(row.baselineProjected)} pts)
                </p>
              </div>
              <p className="scarcity-row__breakdown">
                {row.mandatoryStarters !== null
                  ? `${row.mandatoryStarters} mandatory starter${row.mandatoryStarters === 1 ? "" : "s"}`
                  : "Mandatory starters unknown"}
                {row.flexShare
                  ? ` + ~${row.flexShare} FLEX slot${row.flexShare === 1 ? "" : "s"}`
                  : ""}{" "}
                → rank #{safeToText(row.replacementRank)} sets the baseline.
              </p>
              <div
                className="scarcity-bar"
                title={`Replacement baseline ${formatMetricValue(row.baselineProjected)} pts vs. best available ${formatMetricValue(row.topCandidateProjected)} pts.`}
              >
                <div
                  className="scarcity-bar__baseline"
                  style={{ width: `${baselinePct}%` }}
                />
                {gapWidth > 0 ? (
                  <div
                    className="scarcity-bar__gap"
                    style={{ left: `${baselinePct}%`, width: `${gapWidth}%` }}
                  />
                ) : null}
              </div>
              {row.topCandidateName ? (
                <p className="scarcity-row__top">
                  Best available: <strong>{row.topCandidateName}</strong>{" "}
                  projects {formatMetricValue(row.topCandidateProjected)} pts —{" "}
                  <strong>
                    {formatMetricValue(row.topCandidateVorp)} VORP
                  </strong>{" "}
                  above this baseline.
                </p>
              ) : (
                <p className="empty-note">
                  No available candidate at this position right now.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
};

export const DraftBoardCard = ({
  data,
  rosterLabel,
  draftState,
  onMarkDrafted,
  onDraftCandidate,
}: {
  data: DraftBoardResponse;
  rosterLabel?: string;
  draftState?: DraftRosterState;
  onMarkDrafted?: (id: string) => void;
  onDraftCandidate?: (candidate: FantasyPlayerCandidate) => void;
}) => {
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const rosteredIds = draftState
    ? collectRosteredIds(draftState.teamRosters)
    : new Set<string>();
  const bestOverall = candidates.find(
    (candidate) => !rosteredIds.has(String(candidate.id)),
  );
  const rosterNeeds = draftState
    ? buildRosterNeeds(
        data,
        draftState.teamRosters[draftState.selectedTeamIndex] ?? {},
        rosteredIds,
      )
    : [];
  const draftLog = draftState ? buildDraftLog(draftState.teamRosters) : [];

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/draft-board ranks available candidates into value tiers using projections and ADP.">
          Draft Board
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)} |{" "}
        Position {safeToText(data.position)}
      </p>
      <p className="fantasy-tip">
        VORP = value over a replacement-level player at that position, higher is
        better.
      </p>
      <FantasyStatusLegend />
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}

      {bestOverall && onDraftCandidate ? (
        <section className="fantasy-next-up">
          <p className="fantasy-next-up__label">
            Next Best Available (Overall)
          </p>
          <div className="fantasy-next-up__row">
            <p className="fantasy-next-up__name">
              {safeToText(bestOverall.name)}{" "}
              <span className="chip">{safeToText(bestOverall.position)}</span>{" "}
              <span className="chip">
                VORP {formatMetricValue(bestOverall.vorp)}
              </span>
            </p>
            <button
              type="button"
              className="fantasy-draft-button"
              onClick={() => onDraftCandidate(bestOverall)}
            >
              Draft
            </button>
          </div>
        </section>
      ) : null}

      {rosterNeeds.length && draftState && onDraftCandidate ? (
        <section className="draft-needs">
          <div className="draft-needs__header">
            <p className="draft-needs__title">
              Best Picks For {getDraftTeamLabel(draftState.selectedTeamIndex)}
            </p>
            <span className="draft-needs__hint">
              Ranked by VORP across the slots still open
            </span>
          </div>
          <ol className="draft-needs__list">
            {rosterNeeds.map((need, index) => (
              <li className="draft-needs__row" key={need.slotLabel}>
                <span className="draft-needs__rank">{index + 1}</span>
                <span className="draft-needs__slot">{need.slotLabel}</span>
                <span className="draft-needs__player">
                  <strong>{safeToText(need.candidate.name)}</strong>
                  <span className="meta-line">
                    {safeToText(need.candidate.position)} ·{" "}
                    {formatFantasyTeam(need.candidate.team)} · VORP{" "}
                    {formatMetricValue(need.candidate.vorp)}
                  </span>
                </span>
                <button
                  type="button"
                  className="fantasy-draft-button"
                  onClick={() => onDraftCandidate(need.candidate)}
                >
                  Draft
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {draftState && onMarkDrafted ? (
        <DraftRosterBoard
          data={data}
          draftState={draftState}
          onPickPlayer={(candidate) => onMarkDrafted(String(candidate.id))}
        />
      ) : null}

      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p className="overview-pill-label">Pool Size</p>
          <p className="overview-pill-value">{safeToText(data.poolSize)}</p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Available</p>
          <p className="overview-pill-value">
            {safeToText(data.availableCount)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Roster Size</p>
          <p className="overview-pill-value">{safeToText(data.rosterSize)}</p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Excluded</p>
          <p className="overview-pill-value">
            {safeToText(data.excludedFromRoster)}
          </p>
        </div>
      </div>

      {data.replacementBaselines &&
      Object.keys(data.replacementBaselines).length ? (
        <PositionScarcityPanel data={data} />
      ) : null}
      {draftLog.length ? (
        <div className="draft-log">
          <p className="draft-log__label">
            Who drafted who ({draftLog.length} picks)
          </p>
          <div className="chip-grid">
            {draftLog.map((entry) => (
              <span className="chip draft-log__chip" key={entry.id}>
                {entry.name} ({entry.position}){" "}
                <strong>{entry.teamLabel}</strong>
              </span>
            ))}
          </div>
        </div>
      ) : rosterLabel ? (
        <p className="selector-note">Drafted so far: {rosterLabel}</p>
      ) : null}
    </article>
  );
};

export const SleepersCard = ({
  data,
  positionFilter,
}: {
  data: SleepersResponse;
  positionFilter?: string;
}) => {
  const [nameFilter, setNameFilter] = useState("");

  const allSleepers = Array.isArray(data.sleepers) ? data.sleepers : [];
  const filtered =
    positionFilter && positionFilter !== "ALL"
      ? allSleepers.filter((sleeper) => sleeper.position === positionFilter)
      : allSleepers;

  const needle = nameFilter.trim().toLowerCase();
  const searched = needle
    ? filtered.filter((sleeper) => sleeper.name.toLowerCase().includes(needle))
    : filtered;

  const sorted = [...searched].sort((a, b) => {
    const scoreA =
      typeof a.sleeperScore === "number" ? a.sleeperScore : -Infinity;
    const scoreB =
      typeof b.sleeperScore === "number" ? b.sleeperScore : -Infinity;
    return scoreB - scoreA;
  });

  const peerDistributions = Array.isArray(data.peerDistributions)
    ? data.peerDistributions
    : [];

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge fantasy-badge--sleepers">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/sleepers ranks undervalued players by ADP delta against position peers. Labeled Draft Values, not guaranteed sleepers.">
          Draft Values
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)}
      </p>
      <FantasyPlainSummary>
        This list finds players being drafted later than their skill level says
        they should be — a hint at good value picks, not a guarantee.
      </FantasyPlainSummary>
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}

      <div className="impact-summary-grid">
        <div className="overview-pill">
          <p className="overview-pill-label">Pool Size</p>
          <p className="overview-pill-value">{safeToText(data.poolSize)}</p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Evaluated</p>
          <p className="overview-pill-value">
            {safeToText(data.evaluatedCount)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Excluded</p>
          <p className="overview-pill-value">
            {safeToText(data.excludedCount)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Placeholder ADP Excluded</p>
          <p className="overview-pill-value">
            {safeToText(data.excludedForPlaceholderAdp)}
          </p>
        </div>
      </div>

      <p className="fantasy-tip">
        Sleeper Score compares a player's draft position to how their projection
        stacks up against others at the same position — higher means better
        value.
      </p>
      <FantasyStatusLegend />

      {peerDistributions.length ? (
        <details className="context-wrap fantasy-peer-details">
          <summary>Peer Distribution Sample Sizes</summary>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Mean ADP Delta</th>
                  <th>Std Dev ADP Delta</th>
                  <th>Sample Size</th>
                </tr>
              </thead>
              <tbody>
                {peerDistributions.map((row) => (
                  <tr key={row.position}>
                    <td>{safeToText(row.position)}</td>
                    <td>{formatMetricValue(row.meanAdpDelta)}</td>
                    <td>{formatFactor(row.stdDevAdpDelta, 2)}</td>
                    <td>{safeToText(row.sampleSize)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      {data.evaluatedCount === 0 ? (
        <p className="empty-note">
          Draft Values are unavailable right now — ESPN replaces ADP with a
          placeholder once the draft window closes, so there's no usable draft
          signal until the next draft season begins.
        </p>
      ) : (
        <>
          <div className="fantasy-toolbar context-wrap">
            <input
              type="search"
              className="fantasy-search-input"
              placeholder="Search by player name..."
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              aria-label="Search sleepers by name"
            />
          </div>

          {sorted.length ? (
            <div className="fantasy-player-row-list context-wrap">
              {sorted.map((sleeper) => {
                const headline = formatAdpDeltaHeadline(sleeper);
                const intensity = getSleeperScoreIntensityLabel(
                  sleeper.sleeperScore,
                );

                return (
                  <article
                    className={`fantasy-player-row ${getFantasyRowAccentClass(sleeper.status)}`}
                    key={String(sleeper.id)}
                  >
                    <div className="fantasy-player-row__primary">
                      <div>
                        <p className="fantasy-player-row__name">
                          {safeToText(sleeper.name)}{" "}
                          <span className="chip">
                            {safeToText(sleeper.position)}
                          </span>
                        </p>
                        <p className="meta-line">
                          {formatFantasyTeam(sleeper.team)}
                        </p>
                      </div>
                      <span
                        className={getFantasyStatusChipClass(sleeper.status)}
                      >
                        {getFantasyStatusLabel(sleeper.status)}
                      </span>
                    </div>

                    {headline ? (
                      <p className="callout-note callout-note--compact">
                        {headline}
                      </p>
                    ) : null}
                    <p className="selector-note">
                      {formatDraftVsProjectedRank(sleeper)}
                    </p>

                    <div className="impact-summary-grid fantasy-player-row__stats">
                      <div className="overview-pill">
                        <p className="overview-pill-label">ADP</p>
                        <p className="overview-pill-value">
                          {formatAdp(sleeper.adp, false)}
                        </p>
                      </div>
                      <div className="overview-pill">
                        <p className="overview-pill-label">Own %</p>
                        <p className="overview-pill-value">
                          {formatUsagePercent(sleeper.ownershipPct)}
                        </p>
                      </div>
                      <div className="overview-pill">
                        <p
                          className="overview-pill-label"
                          title="ESPN's modelled expectation for the season — not historical production."
                        >
                          Proj Total
                        </p>
                        <p className="overview-pill-value">
                          {formatMetricValue(sleeper.projectedTotal)}
                        </p>
                      </div>
                      <div className="overview-pill">
                        <p
                          className="overview-pill-label"
                          title="Real box-score production so far this season. Reads 'Not played yet' until a game is logged."
                        >
                          Actual Total
                        </p>
                        <p className="overview-pill-value">
                          {formatActualStat(sleeper.actualTotal)}
                        </p>
                      </div>
                      <div className="overview-pill">
                        <p
                          className="overview-pill-label"
                          title="Confidence/intensity indicator: >1 meaningful value signal, -1 to 1 expected market value, <-1 expensive relative to projection."
                        >
                          Sleeper Score
                        </p>
                        <p className="overview-pill-value">
                          {formatFactor(sleeper.sleeperScore, 2)}
                        </p>
                        {intensity ? (
                          <p className="overview-pill-caption">{intensity}</p>
                        ) : null}
                      </div>
                      <div className="overview-pill">
                        <p className="overview-pill-label">Peer Sample</p>
                        <p className="overview-pill-value">
                          {safeToText(sleeper.peerSampleSize)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-note">No sleepers returned for this filter.</p>
          )}
        </>
      )}
    </article>
  );
};

export const FantasySeasonBanner = ({
  season,
}: {
  season: FantasySeasonState | null;
}) => {
  if (!season) {
    return null;
  }

  return (
    <p
      className="selector-note fantasy-season-banner"
      title="Authoritative season/week state from GET /api/fantasy/season."
    >
      NFL Fantasy Season {safeToText(season.season)} | Week{" "}
      {safeToText(season.currentScoringPeriod)} |{" "}
      {season.active ? "Active" : "Inactive"}
    </p>
  );
};

const getInSeasonStatusLabel = (status?: string | null): string => {
  switch (status) {
    case "ready":
      return "Ready";
    case "insufficient_sample":
      return "Insufficient Sample";
    case "no_upcoming_projection":
      return "No Upcoming Projection";
    default:
      return toReadableSignal(status);
  }
};

const getRecommendationLabel = (value?: string | null): string => {
  switch (value) {
    case "start":
      return "Start";
    case "consider_sit":
      return "Consider Sit";
    case "insufficient_sample":
      return "Insufficient Sample";
    case "no_upcoming_projection":
      return "No Upcoming Projection";
    default:
      return toReadableSignal(value);
  }
};

const getRecommendationChipClass = (value?: string | null): string => {
  if (value === "start") {
    return "chip hit";
  }

  if (value === "consider_sit") {
    return "chip miss";
  }

  if (value === "insufficient_sample" || value === "no_upcoming_projection") {
    return "chip muted";
  }

  return "chip";
};

const getVerdictLabel = (value?: string | null): string => {
  switch (value) {
    case "balanced":
      return "Balanced";
    case "slight_edge":
      return "Slight Edge";
    case "clear_edge":
      return "Clear Edge";
    default:
      return toReadableSignal(value);
  }
};

const FantasyRecentFormSummary = ({
  form,
}: {
  form: FantasyRecentForm | null | undefined;
}) => {
  if (!form || form.gamesSample < 1) {
    return (
      <p className="empty-note">No completed games sampled yet this window.</p>
    );
  }

  return (
    <div className="impact-summary-grid fantasy-player-row__stats">
      <div className="overview-pill">
        <p className="overview-pill-label">Games Sampled</p>
        <p className="overview-pill-value">{form.gamesSample}</p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">Actual Avg</p>
        <p className="overview-pill-value">
          {formatMetricValue(form.actualAverage)}
        </p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">Projected Avg</p>
        <p className="overview-pill-value">
          {formatMetricValue(form.projectedAverage)}
        </p>
      </div>
      <div className="overview-pill">
        <p
          className="overview-pill-label"
          title="Actual average minus projected average over the sampled window. Positive means recently outperforming projection."
        >
          Δ vs Proj
        </p>
        <p className="overview-pill-value">
          {formatMetricValue(form.deltaFromProjection)}
        </p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">Std Dev</p>
        <p className="overview-pill-value">
          {formatFactor(form.standardDeviation, 2)}
        </p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">Last Game</p>
        <p className="overview-pill-value">
          {formatMetricValue(form.lastActual)}
        </p>
      </div>
    </div>
  );
};

export const WaiverWireCard = ({ data }: { data: WaiverWireResponse }) => {
  const [nameFilter, setNameFilter] = useState("");
  const needle = nameFilter.trim().toLowerCase();
  const candidates = (data.candidates || []).filter((candidate) =>
    needle ? candidate.name.toLowerCase().includes(needle) : true,
  );

  const breakouts = [...candidates]
    .sort(
      (a, b) =>
        (b.recentForm.deltaFromProjection ?? -Infinity) -
        (a.recentForm.deltaFromProjection ?? -Infinity),
    )
    .slice(0, 10);
  const breakoutIds = new Set(breakouts.map((candidate) => candidate.id));
  const saferPickups = candidates
    .filter(
      (candidate) =>
        !breakoutIds.has(candidate.id) &&
        (candidate.recentForm.deltaFromProjection ?? -Infinity) >= 0,
    )
    .sort(
      (a, b) =>
        (a.recentForm.standardDeviation ?? Infinity) -
        (b.recentForm.standardDeviation ?? Infinity),
    )
    .slice(0, 10);

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge fantasy-badge--waivers">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/waivers surfaces low-ownership players outperforming their recent projection.">
          Waiver Wire
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)} |{" "}
        Week {safeToText(data.currentScoringPeriod)}
      </p>
      <FantasyPlainSummary>
        Shows players almost nobody has rostered who are playing better than
        expected recently — good pickup ideas for this week.
      </FantasyPlainSummary>
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}
      <p className="selector-note">
        Ownership Max {safeToText(data.ownershipMax)}% | Window{" "}
        {safeToText(data.window)} games | Status{" "}
        {getInSeasonStatusLabel(data.status)}
      </p>

      <p className="fantasy-tip">
        Delta vs Projection is how many points a player is beating their own
        projection by over the last few games — higher means hotter.
      </p>
      <FantasyStatusLegend />

      {data.status !== "ready" ? (
        <p className="empty-note">
          {data.decisionInsights ||
            "Not enough completed games yet to identify waiver-wire trends."}
        </p>
      ) : (
        <>
          <div className="fantasy-toolbar context-wrap">
            <input
              type="search"
              className="fantasy-search-input"
              placeholder="Search by player name..."
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              aria-label="Search waiver candidates by name"
            />
          </div>
          {candidates.length ? (
            <>
              <section className="context-wrap">
                <h4
                  className="fantasy-section-heading"
                  title="Highest recent actual-vs-projection outperformance, regardless of week-to-week volatility."
                >
                  Breakouts
                </h4>
                <div className="fantasy-player-row-list">
                  {breakouts.map((candidate) => (
                    <article
                      className="fantasy-player-row fantasy-player-row--value"
                      key={String(candidate.id)}
                    >
                      <div className="fantasy-player-row__primary">
                        <div>
                          <p className="fantasy-player-row__name">
                            {safeToText(candidate.name)}{" "}
                            <span className="chip">
                              {safeToText(candidate.position)}
                            </span>
                          </p>
                          <p className="meta-line">
                            {formatFantasyTeam(candidate.team)} · Own{" "}
                            {formatUsagePercent(candidate.ownershipPct)} ·
                            Started {formatUsagePercent(candidate.startedPct)}
                          </p>
                        </div>
                      </div>
                      <FantasyRecentFormSummary form={candidate.recentForm} />
                    </article>
                  ))}
                </div>
              </section>

              {saferPickups.length ? (
                <section className="context-wrap">
                  <h4
                    className="fantasy-section-heading"
                    title="Positive recent outperformance with the lowest week-to-week volatility — steadier bets than a single huge game."
                  >
                    Safer Pickups
                  </h4>
                  <div className="fantasy-player-row-list">
                    {saferPickups.map((candidate) => (
                      <article
                        className="fantasy-player-row"
                        key={String(candidate.id)}
                      >
                        <div className="fantasy-player-row__primary">
                          <div>
                            <p className="fantasy-player-row__name">
                              {safeToText(candidate.name)}{" "}
                              <span className="chip">
                                {safeToText(candidate.position)}
                              </span>
                            </p>
                            <p className="meta-line">
                              {formatFantasyTeam(candidate.team)} · Own{" "}
                              {formatUsagePercent(candidate.ownershipPct)} ·
                              Started {formatUsagePercent(candidate.startedPct)}
                            </p>
                          </div>
                        </div>
                        <FantasyRecentFormSummary form={candidate.recentForm} />
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <p className="empty-note">No candidates match this filter.</p>
          )}
        </>
      )}
    </article>
  );
};

export const ConsistencyCard = ({ data }: { data: ConsistencyResponse }) => {
  const [nameFilter, setNameFilter] = useState("");
  const needle = nameFilter.trim().toLowerCase();
  const players = (data.players || []).filter((player) =>
    needle ? player.name.toLowerCase().includes(needle) : true,
  );

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge fantasy-badge--consistency">
          NFL Fantasy
        </span>
        <h3 title="GET /api/fantasy/consistency ranks recent floor and volatility across completed games.">
          Reliable Recent Performers (Floor Leaders)
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)} |{" "}
        Week {safeToText(data.currentScoringPeriod)}
      </p>
      <FantasyPlainSummary>
        Ranks players by how steady they've been recently — good for picking a
        safer start over a boom-or-bust option.
      </FantasyPlainSummary>
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}
      <p className="selector-note">
        Window {safeToText(data.window)} games | Status{" "}
        {getInSeasonStatusLabel(data.status)}
      </p>

      <p className="fantasy-tip">
        Std Dev is how much a player's weekly score swings — lower means more
        predictable, higher means boom-or-bust.
      </p>
      <FantasyStatusLegend />

      {data.status !== "ready" ? (
        <p className="empty-note">
          {data.decisionInsights ||
            "At least three completed games are required for consistency rankings."}
        </p>
      ) : (
        <>
          <div className="fantasy-toolbar context-wrap">
            <input
              type="search"
              className="fantasy-search-input"
              placeholder="Search by player name..."
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              aria-label="Search consistency leaders by name"
            />
          </div>
          {players.length ? (
            <div className="fantasy-player-row-list context-wrap">
              {players.map((player) => (
                <article className="fantasy-player-row" key={String(player.id)}>
                  <div className="fantasy-player-row__primary">
                    <div>
                      <p className="fantasy-player-row__name">
                        {safeToText(player.name)}{" "}
                        <span className="chip">
                          {safeToText(player.position)}
                        </span>
                      </p>
                      <p className="meta-line">
                        {formatFantasyTeam(player.team)} · Own{" "}
                        {formatUsagePercent(player.ownershipPct)}
                      </p>
                    </div>
                    <span className="chip hit">
                      Consistency {formatFactor(player.consistencyScore, 2)}
                    </span>
                  </div>
                  <FantasyRecentFormSummary form={player.recentForm} />
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-note">No players match this filter.</p>
          )}
        </>
      )}
    </article>
  );
};

export const StartSitCard = ({ data }: { data: StartSitResponse }) => (
  <article className="scout-card fantasy-card">
    <div className="fantasy-header-row">
      <span className="fantasy-badge fantasy-badge--startsit">NFL Fantasy</span>
      <h3 title="GET /api/fantasy/start-sit combines next-week projection with recent actual performance.">
        Start / Sit
      </h3>
    </div>
    <p className="viz-subtitle">
      {safeToText(data.scoring)} scoring | Season {safeToText(data.season)} |{" "}
      Week {safeToText(data.currentScoringPeriod)}
    </p>
    <FantasyPlainSummary>
      Add the players you're unsure about starting this week and see who's
      projected higher and who's actually been playing better lately.
    </FantasyPlainSummary>
    {data.decisionInsights ? (
      <p className="callout-note">{data.decisionInsights}</p>
    ) : null}
    <p className="selector-note">
      Window {safeToText(data.window)} games | Status{" "}
      {getInSeasonStatusLabel(data.status)}
    </p>
    <p className="fantasy-tip">
      Based on projection and recent form only — matchup, weather, and late
      injury news are not factored in.
    </p>
    <FantasyStatusLegend />

    {data.players?.length ? (
      <div className="fantasy-player-row-list context-wrap">
        {data.players.map((player) => (
          <article className="fantasy-player-row" key={String(player.id)}>
            <div className="fantasy-player-row__primary">
              <div>
                <p className="fantasy-player-row__name">
                  {safeToText(player.name)}{" "}
                  <span className="chip">{safeToText(player.position)}</span>
                </p>
                <p className="meta-line">{formatFantasyTeam(player.team)}</p>
              </div>
              <span
                className={getRecommendationChipClass(player.recommendation)}
              >
                {getRecommendationLabel(player.recommendation)}
              </span>
            </div>
            <div className="impact-summary-grid fantasy-player-row__stats">
              <div className="overview-pill">
                <p className="overview-pill-label">Next Week</p>
                <p className="overview-pill-value">
                  {safeToText(player.nextScoringPeriod)}
                </p>
              </div>
              <div className="overview-pill">
                <p className="overview-pill-label">Next Projection</p>
                <p className="overview-pill-value">
                  {formatMetricValue(player.nextProjection)}
                </p>
              </div>
            </div>
            <FantasyRecentFormSummary form={player.recentForm} />
          </article>
        ))}
      </div>
    ) : (
      <p className="empty-note">No players match this request.</p>
    )}
  </article>
);

const TRADE_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "Side A / Side B Convention",
    definition:
      'This UI\'s convention: Side A is "You Give," Side B is "You Receive." The backend itself is direction-agnostic — it just compares whatever player IDs are placed on each side.',
  },
  {
    term: "Total VORP",
    definition:
      "Sum of each side's VORP (projected points over the position's Replacement Baseline) across every player included in the trade — the same VORP used on the Draft Board.",
  },
  {
    term: "Net VORP To You (netVorpToA)",
    definition:
      "Side B's Total VORP minus Side A's Total VORP. Positive means you (Side A / \"You Give\") gain value from this trade; negative means the other side gains value.",
  },
  {
    term: "Verdict",
    definition:
      'Balanced (within 3 VORP), Slight Edge (within 12 VORP), or Clear Edge (more than 12 VORP) — a quick read on how lopsided the deal is by total value alone. Don\'t call a trade "fair" from Verdict alone — check the position breakdown too, since a team can accept an edge to fill a real roster need.',
  },
  {
    term: "Missing Player IDs",
    definition:
      "Player IDs that were requested but not found in the current player pool — double-check those IDs before trusting the verdict.",
  },
];

const TRADE_STRATEGY: FantasyStrategySection[] = [
  {
    phase: "How to use this",
    tips: [
      "Set League Settings (team count/starters) to match your real league first — Replacement Baselines (and therefore VORP) shift with league size and starter counts, which can change the verdict.",
      "Add every player on each side of the deal, not just the headline names — throw-ins with real VORP change Net VORP To You more than people expect.",
      'Treat "Balanced"/"Slight Edge" as fine to accept on team need alone; reserve pushback for "Clear Edge" trades unless you\'re deliberately selling low-VORP depth for a positional need.',
      'Never call a trade "fair" from Verdict alone — always check the position (byPosition) breakdown so you can judge roster construction, not just total value.',
    ],
  },
];

export const TradeAnalyzerCard = ({
  data,
}: {
  data: TradeAnalysisResponse;
}) => (
  <article className="scout-card fantasy-card">
    <div className="fantasy-header-row">
      <span className="fantasy-badge fantasy-badge--trade">NFL Fantasy</span>
      <h3 title="GET /api/fantasy/trades/analyze compares VORP totals on each side of a proposed trade.">
        Trade Analyzer
      </h3>
    </div>
    <p className="viz-subtitle">
      {safeToText(data.scoring)} scoring | Season {safeToText(data.season)}
    </p>
    <p className="selector-note">
      League Settings: {safeToText(data.leagueSettings?.teamCount)} teams |{" "}
      Starters: {formatStartersSummary(data.leagueSettings?.starters)}
    </p>
    <FantasyPlainSummary>
      Add the players from both sides of a trade to see who actually gains more
      value — that's it.
    </FantasyPlainSummary>
    <p className="callout-note callout-note--compact">
      Convention: Side A = "You Give," Side B = "You Receive." Net VORP To A is
      positive when you gain value, negative when you give up value.
    </p>
    {data.decisionInsights ? (
      <p className="callout-note">{data.decisionInsights}</p>
    ) : null}
    {data.missingPlayerIds?.length ? (
      <p className="empty-note">
        Missing player IDs (not found in pool):{" "}
        {data.missingPlayerIds.join(", ")}
      </p>
    ) : null}

    <div className="impact-summary-grid">
      <div className="overview-pill overview-pill--highlight">
        <p className="overview-pill-label">Verdict</p>
        <p className="overview-pill-value">{getVerdictLabel(data.verdict)}</p>
      </div>
      <div className="overview-pill">
        <p
          className="overview-pill-label"
          title="Positive means you (Side A) gain value; negative means the other side (Side B) gains value. Verdict alone doesn't capture roster construction — check the position breakdown below too."
        >
          Net VORP To You
        </p>
        <p className="overview-pill-value">
          {formatMetricValue(data.netVorpToA)}
        </p>
      </div>
    </div>

    <FantasyStrategyGuide
      title="How to use this for a trade"
      sections={TRADE_STRATEGY}
    />
    <FantasyGlossary items={TRADE_GLOSSARY} />

    <div className="comparison-grid context-wrap">
      {[
        { label: "You Give (Side A)", side: data.sideA },
        { label: "You Receive (Side B)", side: data.sideB },
      ].map(({ label, side }) => (
        <section className="scout-card" key={label}>
          <h4>
            {label} — {side?.playerCount ?? 0} player
            {side?.playerCount === 1 ? "" : "s"}, Total VORP{" "}
            {formatMetricValue(side?.totalVorp)}
          </h4>
          {side?.byPosition && Object.keys(side.byPosition).length ? (
            <div className="chip-grid">
              {Object.entries(side.byPosition).map(([position, vorp]) => (
                <span className="chip" key={position}>
                  {position} VORP: {formatMetricValue(vorp)}
                </span>
              ))}
            </div>
          ) : null}
          {side?.players?.length ? (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>Proj Total</th>
                    <th>VORP</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {side.players.map((player) => (
                    <tr key={String(player.id)}>
                      <td>{safeToText(player.name)}</td>
                      <td>{safeToText(player.position)}</td>
                      <td>{formatFantasyTeam(player.team)}</td>
                      <td>{formatMetricValue(player.projectedTotal)}</td>
                      <td>{formatMetricValue(player.vorp)}</td>
                      <td>{safeToText(player.tier)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-note">No players added to this side yet.</p>
          )}
        </section>
      ))}
    </div>
  </article>
);

const FANTASY_COMPARE_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "VORP",
    definition:
      "The main number to trust here — projected points above the replacement-level player at that position. Higher is more valuable for your league settings.",
  },
  {
    term: "Projected Positional Rank",
    definition:
      "Where this player is expected to finish among others at the same position — lower is better.",
  },
  {
    term: "ADP",
    definition:
      "Average draft pick. Lower means drafted earlier. Not shown as a real number when a player has no live ADP yet.",
  },
];

export const FantasyPlayerCompareCard = ({
  data,
}: {
  data: FantasyPlayerCompareResponse;
}) => {
  const renderPlayer = (player: FantasyCompactPlayer, label: string) => (
    <section className="scout-card" key={label}>
      <h4>
        {safeToText(player.name)}{" "}
        <span className="chip">{safeToText(player.position)}</span>
      </h4>
      <p className="meta-line">
        {formatFantasyTeam(player.team)}{" "}
        <span className={getInjuryChipClass(player.injuryStatus)}>
          {formatFantasyInjury(player.injuryStatus)}
        </span>
      </p>
      <div className="impact-summary-grid fantasy-player-row__stats">
        <div className="overview-pill overview-pill--highlight">
          <p className="overview-pill-label">VORP</p>
          <p className="overview-pill-value">
            {formatMetricValue(player.vorp)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Proj Total</p>
          <p className="overview-pill-value">
            {formatMetricValue(player.projectedTotal)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Actual Total</p>
          <p className="overview-pill-value">
            {formatActualStat(player.actualTotal)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">ADP</p>
          <p className="overview-pill-value">{formatAdp(player.adp, false)}</p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Proj Rank (Pos)</p>
          <p className="overview-pill-value">
            {safeToText(player.projectedPositionRank)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Tier</p>
          <p className="overview-pill-value">{safeToText(player.tier)}</p>
        </div>
      </div>
    </section>
  );

  const advantageLabel =
    data.advantage === "tie"
      ? "Even matchup on projected value"
      : data.advantage === "playerA"
        ? `${data.playerA.name} has more projected value`
        : `${data.playerB.name} has more projected value`;

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/compare/players compares two individual players on projected VORP for your league settings.">
          Player Compare
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)}
      </p>
      <FantasyPlainSummary>
        Add two players to see who's actually worth more in your league — VORP
        already accounts for position scarcity, so it's a fairer comparison than
        raw projected points.
      </FantasyPlainSummary>
      <p className="selector-note">
        League Settings: {safeToText(data.leagueSettings?.teamCount)} teams |{" "}
        Starters: {formatStartersSummary(data.leagueSettings?.starters)}
      </p>
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}
      <p className="callout-note callout-note--compact">{advantageLabel}</p>

      <FantasyGlossary items={FANTASY_COMPARE_GLOSSARY} />

      <div className="comparison-grid context-wrap">
        {renderPlayer(data.playerA, "Player A")}
        {renderPlayer(data.playerB, "Player B")}
      </div>

      {data.metrics.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>{safeToText(data.playerA.name)}</th>
                <th>{safeToText(data.playerB.name)}</th>
                <th>Edge</th>
              </tr>
            </thead>
            <tbody>
              {data.metrics.map((metric) => (
                <tr key={metric.label}>
                  <td>{metric.label}</td>
                  <td>{formatMetricValue(metric.playerA)}</td>
                  <td>{formatMetricValue(metric.playerB)}</td>
                  <td>
                    {metric.advantage === "tie" || !metric.advantage
                      ? "Tie"
                      : metric.advantage === "playerA"
                        ? safeToText(data.playerA.name)
                        : safeToText(data.playerB.name)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
};

const FANTASY_ROSTER_COMPARE_GLOSSARY: Array<{
  term: string;
  definition: string;
}> = [
  {
    term: "Starter VORP",
    definition:
      "Each roster's best possible starting lineup, added up in VORP (value over replacement). This is the headline number — higher is stronger for your league settings.",
  },
  {
    term: "Lineup Coverage",
    definition:
      "Whether a roster actually has enough players to fill every starting slot, including FLEX. A low coverage score means missing starters, not just a weak lineup.",
  },
  {
    term: "Position VORP Breakdown",
    definition:
      "How much of each roster's Starter VORP comes from each position — useful for spotting whether an edge is broad or comes from one or two elite players.",
  },
  {
    term: "Missing Starter Slots",
    definition:
      "Positions where a roster doesn't have enough players to fill every starting slot your league requires.",
  },
];

const renderFantasyRosterCompareSide = (
  label: string,
  side: FantasyRosterCompareSide | undefined,
) => {
  const missingSlots = Object.entries(side?.missingStarterSlots || {});
  const byPosition = Object.entries(side?.byPosition || {});

  return (
    <section className="scout-card" key={label}>
      <h4>
        {label} — Starter VORP {formatMetricValue(side?.starterVorp)}
      </h4>
      <p className="meta-line">
        Roster Size {safeToText(side?.rosterSize)} | Coverage{" "}
        {formatMetricValue(side?.coverageScore)}
      </p>
      {byPosition.length ? (
        <div className="chip-grid">
          {byPosition.map(([position, vorp]) => (
            <span className="chip" key={position}>
              {position} VORP: {formatMetricValue(vorp)}
            </span>
          ))}
        </div>
      ) : null}
      {missingSlots.length ? (
        <div className="chip-grid context-wrap">
          {missingSlots.map(([position, count]) => (
            <span className="chip miss" key={position}>
              {position}: need {count} more
            </span>
          ))}
        </div>
      ) : null}
      {side?.missingPlayerIds?.length ? (
        <p className="empty-note">
          Missing player IDs: {side.missingPlayerIds.join(", ")}
        </p>
      ) : null}
      {side?.suggestedStarters?.length ? (
        <div className="compare-table-wrap context-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Starter</th>
                <th>Pos</th>
                <th>Team</th>
                <th>Proj Total</th>
                <th>VORP</th>
              </tr>
            </thead>
            <tbody>
              {side.suggestedStarters.map((player) => (
                <tr key={String(player.id)}>
                  <td>{safeToText(player.name)}</td>
                  <td>{safeToText(player.position)}</td>
                  <td>{formatFantasyTeam(player.team)}</td>
                  <td>{formatMetricValue(player.projectedTotal)}</td>
                  <td>{formatMetricValue(player.vorp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-note">No suggested starters available.</p>
      )}
    </section>
  );
};

export const FantasyRosterCompareCard = ({
  data,
}: {
  data: FantasyRosterCompareResponse;
}) => {
  const advantageLabel =
    data.comparison.advantage === "tie"
      ? "Even matchup on starter value"
      : data.comparison.advantage === "rosterA"
        ? "Roster A has the stronger starting lineup"
        : "Roster B has the stronger starting lineup";

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/compare/head-to-head compares two full rosters' best starting lineups on VORP.">
          Roster Head-to-Head
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)}
      </p>
      <FantasyPlainSummary>
        Add both full rosters and see which one has the stronger starting lineup
        right now — this compares best-starters-vs-best-starters, not just
        adding up every player on the bench.
      </FantasyPlainSummary>
      <p className="selector-note">
        League Settings: {safeToText(data.leagueSettings?.teamCount)} teams |{" "}
        Starters: {formatStartersSummary(data.leagueSettings?.starters)}
      </p>
      {data.comparison.decisionInsights ? (
        <p className="callout-note">{data.comparison.decisionInsights}</p>
      ) : null}
      <p className="callout-note callout-note--compact">{advantageLabel}</p>

      <FantasyGlossary items={FANTASY_ROSTER_COMPARE_GLOSSARY} />

      <div className="comparison-grid context-wrap">
        {renderFantasyRosterCompareSide("Roster A", data.rosterA)}
        {renderFantasyRosterCompareSide("Roster B", data.rosterB)}
      </div>
    </article>
  );
};

const FANTASY_TEAM_GRADE_GLOSSARY: Array<{ term: string; definition: string }> =
  [
    {
      term: "Grade / Score",
      definition:
        "Combines Starter Value, Market Value, and Lineup Coverage into one letter grade using the Score Weights shown below — A is excellent, F means the roster is missing real value, is being drafted like a weak team, or is missing real starters for your league settings.",
    },
    {
      term: "Starter Value Score",
      definition:
        'League-relative, not "percent of a perfect lineup" — an impossible perfect lineup would make an A unreachable in any real league. Instead, each starter is scored against the replacement range for their position in your exact league size: replacement-level starters sit around 50, strong starters land around 80-90, and elite starters approach 100. A realistic top-half roster can genuinely earn an A or B here.',
    },
    {
      term: "Market Value Score",
      definition:
        "How your roster stacks up against what real drafters actually value these players at (ADP/ownership), not just the model's projections — this is what accounts for league size and what other players are being drafted. A roster full of proven, widely-owned players scores higher here than one leaning on deep sleepers, even at similar VORP.",
    },
    {
      term: "Lineup Coverage Score",
      definition:
        "Whether your roster actually has enough players to fill every starting slot (including FLEX). Below 100 means you have open or thin starting slots.",
    },
    {
      term: "Score Weights",
      definition:
        "How much each component above counts toward the final Score — these come straight from the backend, so if the mix ever changes, this panel reflects it automatically.",
    },
    {
      term: "Why this can differ from ESPN's own grade",
      definition:
        "This grade only knows your final roster — not your actual draft picks, private league draft history, or ESPN's proprietary rankings. It's a measure of roster strength for your league settings, not a recreation of ESPN's draft grade.",
    },
    {
      term: "Missing Starter Slots",
      definition:
        "Positions where your roster doesn't have enough players to fill every starting slot your league requires — a direct waiver/trade target list.",
    },
  ];

const formatWeightPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return `${Math.round(value * 100)}%`;
};

export const FantasyTeamGradeCard = ({
  data,
}: {
  data: FantasyTeamGradeResponse;
}) => {
  const missingSlots = Object.entries(data.missingStarterSlots || {});

  return (
    <article className="scout-card fantasy-card">
      <div className="fantasy-header-row">
        <span className="fantasy-badge">NFL Fantasy</span>
        <h3 title="GET /api/fantasy/team-grade grades your roster's starter value, market value, and lineup coverage for your league settings.">
          Team / Roster Grade
        </h3>
      </div>
      <p className="viz-subtitle">
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)}
      </p>
      <FantasyPlainSummary>
        Add your whole roster and see a letter grade for how strong your
        starting lineup is relative to your league size and starter settings —
        not against some impossible perfect lineup, and factoring in what other
        drafters actually value these players at.
      </FantasyPlainSummary>
      <p className="selector-note">
        League Settings: {safeToText(data.leagueSettings?.teamCount)} teams |{" "}
        Starters: {formatStartersSummary(data.leagueSettings?.starters)}
      </p>
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}
      {data.missingPlayerIds.length ? (
        <p className="empty-note">
          Missing player IDs (not found in pool):{" "}
          {data.missingPlayerIds.join(", ")}
        </p>
      ) : null}

      <div className="impact-summary-grid">
        <div className="overview-pill overview-pill--highlight">
          <p className="overview-pill-label">Grade</p>
          <p className="overview-pill-value">
            <span className={getTeamGradeChipClass(data.grade)}>
              {safeToText(data.grade)}
            </span>
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Score (0-100)</p>
          <p className="overview-pill-value">{formatMetricValue(data.score)}</p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title={`Weight: ${formatWeightPercent(data.scoreWeights?.starterValue)}. League-relative: ~50 is replacement level, 80-90 is a strong starter, 100 is elite.`}
          >
            Starter Value
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.valueScore)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title={`Weight: ${formatWeightPercent(data.scoreWeights?.marketValue)}. Accounts for league size and what other drafters actually value these players at.`}
          >
            Market Value
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.marketScore)}
          </p>
        </div>
        <div className="overview-pill">
          <p
            className="overview-pill-label"
            title={`Weight: ${formatWeightPercent(data.scoreWeights?.coverage)}`}
          >
            Lineup Coverage
          </p>
          <p className="overview-pill-value">
            {formatMetricValue(data.coverageScore)}
          </p>
        </div>
        <div className="overview-pill">
          <p className="overview-pill-label">Roster Size</p>
          <p className="overview-pill-value">{safeToText(data.rosterSize)}</p>
        </div>
      </div>

      {data.scoreWeights ? (
        <p className="selector-note">
          Score Weights: Starter Value{" "}
          {formatWeightPercent(data.scoreWeights.starterValue)} | Market Value{" "}
          {formatWeightPercent(data.scoreWeights.marketValue)} | Coverage{" "}
          {formatWeightPercent(data.scoreWeights.coverage)}
        </p>
      ) : null}
      {data.valueScoreMethod ? (
        <p
          className="selector-note"
          title="This is roster strength for your league settings, not a recreation of ESPN's proprietary draft grade — it only knows your final roster, not your actual draft picks."
        >
          Starter Value Method: {safeToText(data.valueScoreMethod)}
        </p>
      ) : null}

      <FantasyGlossary items={FANTASY_TEAM_GRADE_GLOSSARY} />

      {missingSlots.length ? (
        <section className="context-wrap">
          <h4 className="fantasy-section-heading">Missing Starter Slots</h4>
          <div className="chip-grid">
            {missingSlots.map(([position, count]) => (
              <span className="chip miss" key={position}>
                {position}: need {count} more
              </span>
            ))}
          </div>
        </section>
      ) : (
        <p className="empty-note context-wrap">
          No missing starter slots — your roster can fill every starting spot.
        </p>
      )}

      {data.suggestedStarters?.length ? (
        <section className="context-wrap">
          <h4 className="fantasy-section-heading">Suggested Starting Lineup</h4>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>Proj Total</th>
                  <th>VORP</th>
                </tr>
              </thead>
              <tbody>
                {data.suggestedStarters.map((player) => (
                  <tr key={String(player.id)}>
                    <td>{safeToText(player.name)}</td>
                    <td>{safeToText(player.position)}</td>
                    <td>{formatFantasyTeam(player.team)}</td>
                    <td>{formatMetricValue(player.projectedTotal)}</td>
                    <td>{formatMetricValue(player.vorp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {data.roster?.length ? (
        <section className="context-wrap">
          <h4 className="fantasy-section-heading">Full Roster</h4>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>Proj Total</th>
                  <th>VORP</th>
                  <th>Starter?</th>
                </tr>
              </thead>
              <tbody>
                {data.roster.map((player) => (
                  <tr key={String(player.id)}>
                    <td>{safeToText(player.name)}</td>
                    <td>{safeToText(player.position)}</td>
                    <td>{formatFantasyTeam(player.team)}</td>
                    <td>{formatMetricValue(player.projectedTotal)}</td>
                    <td>{formatMetricValue(player.vorp)}</td>
                    <td>
                      <span className={player.isStarter ? "chip hit" : "chip"}>
                        {player.isStarter ? "Starter" : "Bench"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </article>
  );
};
