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
  FantasyPlayerCandidate,
  FantasyRecentForm,
  FantasySeasonState,
  PlayerCompsResponse,
  PlayerImpactResponse,
  PlayerProfile,
  PlayerTrajectoryResponse,
  PlayerUsageValueResponse,
  SleepersResponse,
  StartSitResponse,
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

const getFantasyStatEntries = (
  source: Record<string, unknown> | null | undefined,
): Array<{ label: string; value: string }> => {
  if (!source || typeof source !== "object") {
    return [];
  }

  return Object.entries(source).map(([key, value]) => ({
    label: formatStatLongLabel(key),
    value: formatFantasyValue(value),
  }));
};

const getFantasyKeyStatsBreakdown = (
  candidate: Pick<FantasyPlayerCandidate, "keyStats" | "rawStats">,
): {
  projected: Array<{ label: string; value: string }>;
  actual: Array<{ label: string; value: string }>;
} => {
  const source = candidate.keyStats ?? candidate.rawStats;
  return {
    projected: getFantasyStatEntries(source?.projected),
    actual: getFantasyStatEntries(source?.actual),
  };
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

const DRAFT_BOARD_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "VORP (the main number to look at)",
    definition:
      "Higher VORP = more valuable for your league. It measures the projected scoring gap between a player and the replacement-level option at their position — not raw points. It changes with Team Count, required Starters, and FLEX slots, so a QB can score more raw points than an RB and still have a lower VORP, because it's easier to find a decent backup QB than a decent backup RB.",
  },
  {
    term: "Replacement Baseline / Replacement Player (last starter needed league-wide for that position, based on your league)",
    definition:
      "Not the \"last player drafted\" — it's the player sitting at the replacement rank: roughly the last player the whole league would need in order to fill every starting lineup slot, including FLEX. Example: in a 12-team league starting 2 RBs, that's around the 24th-to-28th best RB. Every RB's VORP is measured against that one player's projected points — expand \"Why this rank?\" below to see exactly who it is for each position.",
  },
  {
    term: "League Settings (Team Count / Starters)",
    definition:
      "Tell the board how big your league is and how many players start each week. Change these to match your real league — a bigger league or more starters at a position pushes the Replacement Baseline (and every VORP number) further down the list.",
  },
  {
    term: "Tier",
    definition:
      "A group of players who are worth about the same right now, based on VORP — not a group of players with similar raw stats. It's fine to end up with anyone from the same tier; the real cost is crossing into a lower tier. Tier 1 is the best group on the board.",
  },
  {
    term: "ADP",
    definition:
      "Average draft pick across tracked leagues — lower means earlier. \"No live ADP yet\" means adpIsPlaceholder is true and ESPN doesn't have meaningful ADP data yet (common early in a season); ADP and ADP-derived signals are hidden in that case rather than shown as real numbers.",
  },
  {
    term: "Ownership %",
    definition: "Percentage of tracked leagues currently rostering this player.",
  },
  {
    term: "Proj Total / Avg",
    definition:
      "ESPN's modelled expectation for the full season and per game, in the selected scoring format — not historical production. Fractional values (e.g. 14.5 TDs) are the tell that a number is projected. Kept visible for context, but VORP is the primary number to compare players on.",
  },
  {
    term: "Actual Total / Games",
    definition:
      "Real box-score production once games are played. Reads \"Not played yet\" (not zero) until this player has an actual game logged this season.",
  },
  {
    term: "Proj Rank (Pos) vs ADP Rank (Pos)",
    definition:
      "Where the model projects this player to finish among same-position peers, versus where leagues are actually drafting them.",
  },
  {
    term: "ADP Delta",
    definition:
      "ADP Position Rank minus Projected Position Rank. Positive means the player is going later than their projection suggests (a value signal); negative means a likely reach.",
  },
  {
    term: "Sleeper Score / Status",
    definition:
      "A composite value signal. A null score with a status like \"Insufficient Data\" or \"No ADP Signal\" is a distinct, legitimate state — not the same as a computed score near zero.",
  },
];

const SLEEPERS_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "\"Draft Values,\" not guaranteed sleepers",
    definition:
      "This is a draft-only tool comparing a player's ADP position rank against their projected position rank — a value signal, not a promise. It goes quiet once the season starts and ESPN resets ADP.",
  },
  {
    term: "ADP Delta / Draft vs Projected",
    definition:
      "Drafted as, e.g., RB46 but projected as RB40 is a 6-spot ADP Delta — the player is going later than their projection suggests. This is the headline number to lead with, not the raw sleeper score.",
  },
  {
    term: "Sleeper Score",
    definition:
      "A positional z-score for draft value versus ADP — treat it as an intensity/confidence indicator, not the primary number. Above 1 is a meaningful value signal, -1 to 1 is expected market value, below -1 means expensive relative to projection. Null scores use Status instead (e.g. insufficient data/peers, no ADP signal).",
  },
  {
    term: "Peer Sample",
    definition:
      "Number of same-position peers used to compute this player's ADP delta comparison.",
  },
  {
    term: "Peer Distribution",
    definition:
      "The mean and standard deviation of ADP delta for each position — the statistical baseline used to judge whether a given sleeper score is meaningful versus typical position noise.",
  },
];

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

const DRAFT_BOARD_STRATEGY: FantasyStrategySection[] = [
  {
    phase: "Before your draft",
    tips: [
      "Set Team Count and Starters (including FLEX) to match your real league before anything else — the Replacement Baseline, and therefore every VORP and Tier on the board, is computed directly from these settings.",
      "Set Scoring Format to match your league too — rankings shift meaningfully at RB/WR/TE between Standard, Half-PPR, and PPR, so a board built on the wrong format will mislead you.",
      "Filter by Position (or FLEX) to pre-build a cheat sheet round-by-round: scan Tier boundaries (now VORP-based, not raw points) and note where each position's talent drop-off happens so you know when to pivot rather than reach.",
      "Use the tier's Std Dev as a tightness check: a low Std Dev means the players in that tier are genuinely close in value over replacement (safe to grab any of them); a high Std Dev means treat the tier loosely and lean on ADP/status to break ties.",
    ],
  },
  {
    phase: "During your draft",
    tips: [
      "Every time any team picks a player (not just yours), search them in \"Mark Player As Drafted\" and add them, then reload — Available Count and Pool Size will drop to confirm the board is now accurate for who's actually left.",
      "When it's your turn, work tier-first: if you're going to leave a tier anyway, take the last-ranked player left in it before reaching into the next tier for a marginal VORP upgrade.",
      "Compare VORP across positions, not Proj Total — Proj Total makes QBs look best every time, but VORP already accounts for how replaceable each position is, so it's the number that should decide close calls between positions.",
      "Use Status + ADP Delta together as a tiebreaker within a tier: \"Undervalued\" with a larger positive ADP Delta means the field is passing on them relative to projection — safer to wait one more round; \"Overvalued\"/negative ADP Delta means take them now if you want them, they won't last.",
      "Check the injury badge before locking in a pick that's close to your turn — Questionable/Doubtful/Out next to a name is a real risk signal the projection alone won't show you.",
    ],
  },
  {
    phase: "What to look at once games start",
    tips: [
      "Proj Total and VORP are always ESPN's modelled expectation, never history — don't read them as \"what they did.\" Once Actual Total stops reading \"Not played yet,\" compare it against Proj Total to spot early breakouts or busts for keeper/dynasty re-evaluation.",
      "Expand \"Season Stat Breakdown\" per player to see the Projected vs Actual split side by side — this is the fastest way to tell whether a player's box score is tracking ahead of or behind what was expected of them.",
      "Ownership % is a quick gut-check on how widely-known a player already is: a low Own % paired with \"Undervalued\" status is the clearest late-round or waiver-priority signal the board can give you.",
      "Once games are underway, the Waivers and Consistency tabs pick up where this board's projections leave off — use them for actual-production signal instead of re-reading pre-season VORP.",
    ],
  },
];

const SLEEPERS_STRATEGY: FantasyStrategySection[] = [
  {
    phase: "Draft-day prep",
    tips: [
      "Run this 1-2 rounds before you're on the clock at a given position — filter by Position and scan for names with a high Sleeper Score to build a short list of late-round targets before you need them.",
      "Read the \"Draft vs Projected\" line literally as your pick rationale (e.g. \"drafted as RB46, projects as RB40\") — it's the same phrasing you'd use to justify the pick out loud in your draft room.",
      "Before trusting a single Sleeper Score, expand Peer Distribution for that position: a high Std Dev ADP Delta means the whole position is noisy this year, so an average score isn't special; a low Std Dev means even a moderate score is a real signal.",
    ],
  },
  {
    phase: "Treat these statuses differently",
    tips: [
      "\"Undervalued\" with a real Sleeper Score is an actionable target. \"Insufficient Data\" or \"Insufficient Peers\" means the model doesn't have enough signal yet — put these on a watchlist, don't draft on the score alone.",
      "Cross-check a promising name on the Draft Board too: same player, same scoring format, so you can see their Tier and full ADP context alongside the sleeper signal before committing a pick.",
    ],
  },
  {
    phase: "In-season use",
    tips: [
      "This endpoint is a draft-time signal — ADP effectively resets to a placeholder once the season starts, so expect it to return few or no results in-season. That's expected behavior, not a bug.",
      "Once ADP dries up, use Actual Total vs Proj Total on the Draft Board instead — that's the in-season equivalent for finding players outperforming or underperforming their offseason expectation (waiver-wire and start/sit calls).",
    ],
  },
];

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

const FantasyKeyStatsDetails = ({
  candidate,
}: {
  candidate: Pick<FantasyPlayerCandidate, "keyStats" | "rawStats" | "position">;
}) => {
  const { projected, actual } = getFantasyKeyStatsBreakdown(candidate);
  const isSkillPosition =
    candidate.position !== "K" && candidate.position !== "DST";

  return (
    <details className="fantasy-key-stats">
      <summary>Season Stat Breakdown (Projected vs Actual)</summary>
      <div className="fantasy-stat-breakdown">
        <div>
          <p
            className="fantasy-stat-breakdown__label"
            title="ESPN's modelled expectation for this player this season — not historical production."
          >
            Projected
          </p>
          {projected.length ? (
            <div className="chip-grid">
              {projected.map((entry) => (
                <span className="chip" key={`proj-${entry.label}`}>
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              No projected stat breakdown available for this player
              {isSkillPosition
                ? "."
                : " — the backend does not compute keyStats for K/DST by design."}
            </p>
          )}
        </div>
        <div>
          <p
            className="fantasy-stat-breakdown__label"
            title="Real box-score production. Stays null until this player has an actual game logged this season."
          >
            Actual
          </p>
          {actual.length ? (
            <div className="chip-grid">
              {actual.map((entry) => (
                <span className="chip" key={`act-${entry.label}`}>
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              Not played yet this season
              {isSkillPosition
                ? "."
                : " — the backend does not compute keyStats for K/DST by design."}
            </p>
          )}
        </div>
      </div>
    </details>
  );
};

const FantasyPlayerRow = ({
  candidate,
}: {
  candidate: FantasyPlayerCandidate;
}) => (
  <article
    className={`fantasy-player-row ${getFantasyRowAccentClass(candidate.status)}`}
  >
    <div className="fantasy-player-row__primary">
      <div>
        <p className="fantasy-player-row__name">
          {safeToText(candidate.name)}{" "}
          <span className="chip">{safeToText(candidate.position)}</span>
        </p>
        <p className="meta-line">
          {formatFantasyTeam(candidate.team)}{" "}
          <span className={getInjuryChipClass(candidate.injuryStatus)}>
            {formatFantasyInjury(candidate.injuryStatus)}
          </span>
        </p>
      </div>
      <span className={getFantasyStatusChipClass(candidate.status)}>
        {getFantasyStatusLabel(candidate.status)}
      </span>
    </div>

    <div className="impact-summary-grid fantasy-player-row__stats">
      <div className="overview-pill overview-pill--highlight">
        <p
          className="overview-pill-label"
          title="Projected points minus the Replacement Baseline for this position — what the board is ranked and tiered on."
        >
          VORP
        </p>
        <p className="overview-pill-value">
          {formatMetricValue(candidate.vorp)}
        </p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">VORP Rank (Overall)</p>
        <p className="overview-pill-value">{safeToText(candidate.vorpRank)}</p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">ADP</p>
        <p className="overview-pill-value">
          {formatAdp(candidate.adp, candidate.adpIsPlaceholder)}
        </p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">Own %</p>
        <p className="overview-pill-value">
          {formatUsagePercent(candidate.ownershipPct)}
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
          {formatMetricValue(candidate.projectedTotal)}
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
          {formatActualStat(candidate.actualTotal)}
        </p>
      </div>
      <div className="overview-pill">
        <p className="overview-pill-label">Proj Rank (Pos)</p>
        <p className="overview-pill-value">
          {safeToText(candidate.projectedPositionRank)}
        </p>
      </div>
      {candidate.adpIsPlaceholder ? (
        <div className="overview-pill overview-pill--muted">
          <p
            className="overview-pill-label"
            title="ADP-derived draft signals (position rank, delta) are hidden until ESPN has meaningful ADP data — showing them from placeholder data would be misleading."
          >
            Draft Signal
          </p>
          <p className="overview-pill-value">No live ADP yet</p>
        </div>
      ) : (
        <>
          <div className="overview-pill">
            <p className="overview-pill-label">ADP Rank (Pos)</p>
            <p className="overview-pill-value">
              {safeToText(candidate.adpPositionRank)}
            </p>
          </div>
          <div className="overview-pill">
            <p
              className="overview-pill-label"
              title="Positive means going later in position rank than projection suggests — a value signal."
            >
              ADP Delta
            </p>
            <p className="overview-pill-value">
              {formatMetricValue(candidate.adpDelta)}
            </p>
          </div>
        </>
      )}
    </div>

    <FantasyKeyStatsDetails candidate={candidate} />
  </article>
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
        (typeof b.topCandidateVorp === "number" ? b.topCandidateVorp : -Infinity) -
        (typeof a.topCandidateVorp === "number" ? a.topCandidateVorp : -Infinity),
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
    <details className="context-wrap fantasy-peer-details" open>
      <summary>Why this rank? (Replacement Baselines)</summary>
      <p className="derive-note">
        For each position, the "replacement player" isn't the last player
        drafted — it's the player at the replacement rank: roughly the last
        player the whole league would need to fill every starting lineup
        slot, including FLEX. VORP measures the gap above that one player's
        projected points, not raw points. A bigger gap between the best
        available player and this baseline means the position is scarce
        right now and worth reaching for; a small gap means plenty of similar
        options remain, so it's safer to wait. Rows below are sorted by that
        gap, biggest first.
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
                  Replacement Player #{safeToText(row.replacementRank)}{" "}
                  (last starter needed league-wide for {row.position} based on
                  your league):{" "}
                  {safeToText(row.replacementPlayerName)} (
                  {formatMetricValue(row.baselineProjected)} pts)
                </p>
              </div>
              <p className="scarcity-row__breakdown">
                {row.mandatoryStarters !== null
                  ? `${row.mandatoryStarters} mandatory starter${row.mandatoryStarters === 1 ? "" : "s"}`
                  : "Mandatory starters unknown"}
                {row.flexShare ? ` + ~${row.flexShare} FLEX slot${row.flexShare === 1 ? "" : "s"}` : ""}
                {" "}
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
                  <strong>{formatMetricValue(row.topCandidateVorp)} VORP</strong>{" "}
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
      <p className="derive-note">
        This ranking can change as players are drafted — a position with a
        small gap now can open up once its top few players are gone, so
        re-check this panel after marking players as drafted.
      </p>
    </details>
  );
};

export const DraftBoardCard = ({
  data,
  rosterLabel,
}: {
  data: DraftBoardResponse;
  rosterLabel?: string;
}) => {
  const [nameFilter, setNameFilter] = useState("");
  const [collapsedTiers, setCollapsedTiers] = useState<Set<number>>(
    () => new Set(),
  );

  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const tiers = Array.isArray(data.tiers)
    ? [...data.tiers].sort((a, b) => a.tier - b.tier)
    : [];

  const candidatesByTier = new Map<number, FantasyPlayerCandidate[]>();
  candidates.forEach((candidate) => {
    const tierKey =
      typeof candidate.tier === "number" ? candidate.tier : -1;
    const bucket = candidatesByTier.get(tierKey) ?? [];
    bucket.push(candidate);
    candidatesByTier.set(tierKey, bucket);
  });

  const tierKeys = tiers.length
    ? tiers.map((tier) => tier.tier)
    : Array.from(candidatesByTier.keys()).sort((a, b) => a - b);

  const needle = nameFilter.trim().toLowerCase();

  const toggleTier = (tierNumber: number, isOpen: boolean) => {
    setCollapsedTiers((current) => {
      const next = new Set(current);
      if (isOpen) {
        next.delete(tierNumber);
      } else {
        next.add(tierNumber);
      }
      return next;
    });
  };

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
        Position {safeToText(data.position)} | Ranked by{" "}
        {safeToText(data.tierMetric || "vorp").toUpperCase()}
      </p>
      <p className="selector-note">
        League Settings: {safeToText(data.leagueSettings?.teamCount)} teams |{" "}
        Starters: {formatStartersSummary(data.leagueSettings?.starters)}
      </p>
      <FantasyPlainSummary>
        This board ranks every available player by how much better they are
        than a replacement-level pick at their position. Bigger number
        (VORP) = better pick right now.
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
      {rosterLabel ? (
        <p className="selector-note">Drafted so far: {rosterLabel}</p>
      ) : null}

      <FantasyStrategyGuide
        title="How to use this for your draft"
        sections={DRAFT_BOARD_STRATEGY}
      />
      <FantasyGlossary items={DRAFT_BOARD_GLOSSARY} />
      <FantasyStatusLegend />

      {tierKeys.length ? (
        <>
          <div className="fantasy-toolbar context-wrap">
            <input
              type="search"
              className="fantasy-search-input"
              placeholder="Search by player name..."
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              aria-label="Search candidates by name"
            />
            <div className="fantasy-toolbar-actions">
              <button
                type="button"
                className="fantasy-link-button"
                onClick={() => setCollapsedTiers(new Set())}
              >
                Expand All
              </button>
              <button
                type="button"
                className="fantasy-link-button"
                onClick={() => setCollapsedTiers(new Set(tierKeys))}
              >
                Collapse All
              </button>
            </div>
          </div>

          {tierKeys.map((tierNumber) => {
            const tierMeta = tiers.find((tier) => tier.tier === tierNumber);
            const tierCandidates = (
              candidatesByTier.get(tierNumber) ?? []
            ).filter((candidate) =>
              needle ? candidate.name.toLowerCase().includes(needle) : true,
            );

            if (needle && !tierCandidates.length) {
              return null;
            }

            return (
              <details
                key={`tier-${tierNumber}`}
                className="tier-group"
                open={needle ? true : !collapsedTiers.has(tierNumber)}
                onToggle={(event) =>
                  toggleTier(
                    tierNumber,
                    (event.target as HTMLDetailsElement).open,
                  )
                }
              >
                <summary className="tier-group-header">
                  <h4>
                    {tierNumber >= 0 ? `Tier ${tierNumber}` : "Unranked"}
                    {tierMeta ? ` (${tierMeta.count} players)` : ""}
                  </h4>
                  {tierMeta ? (
                    <p className="tier-group-range">
                      High {formatMetricValue(tierMeta.high)} · Mean{" "}
                      {formatMetricValue(tierMeta.mean)} · Low{" "}
                      {formatMetricValue(tierMeta.low)} · Std Dev{" "}
                      {formatFactor(tierMeta.stdDev, 2)}
                    </p>
                  ) : null}
                </summary>
                <div className="fantasy-player-row-list">
                  {tierCandidates.map((candidate) => (
                    <FantasyPlayerRow
                      key={String(candidate.id)}
                      candidate={candidate}
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </>
      ) : (
        <p className="empty-note">No candidates returned for this filter.</p>
      )}
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
        This list finds players being drafted later than their skill level
        says they should be — a hint at good value picks, not a guarantee.
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

      <FantasyStrategyGuide
        title="How to use sleepers for your fantasy team"
        sections={SLEEPERS_STRATEGY}
      />
      <FantasyGlossary items={SLEEPERS_GLOSSARY} />
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
          placeholder once the draft window closes, so there's no usable
          draft signal until the next draft season begins.
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
                      <span className={getFantasyStatusChipClass(sleeper.status)}>
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

const WAIVER_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "Ownership Max",
    definition:
      "Caps results to players rostered below this percentage. Lower values (e.g. under 25%) surface true wire pickups; raising it toward 75% also includes bench-rostered players outperforming their roster spot.",
  },
  {
    term: "Window",
    definition:
      "Number of most recent completed games averaged for the Actual vs Projected comparison.",
  },
  {
    term: "Δ vs Proj (deltaFromProjection)",
    definition:
      "Recent actual average minus recent projected average over the window — the core waiver signal. Positive means a player is producing above what ESPN expected of them lately.",
  },
  {
    term: "Breakouts vs Safer Pickups",
    definition:
      "Breakouts are ranked purely by the highest Δ vs Proj — the biggest recent outperformance, even if it's a bit volatile. Safer Pickups are still outperforming (Δ vs Proj ≥ 0) but ranked by the lowest Std Dev — a steadier, lower-volatility bet.",
  },
  {
    term: "Insufficient Sample",
    definition:
      "Fewer than 2 completed games exist yet this season, so no waiver signal can be computed — this is expected pre-season, not an error. Check back after more weeks are played.",
  },
];

const WAIVER_STRATEGY: FantasyStrategySection[] = [
  {
    phase: "When to check this",
    tips: [
      "Run this weekly after games finish once Status reads \"Ready\" — it's driven entirely by completed actual production, so it's a post-game, not pre-game, tool.",
      "Lower Ownership Max first (e.g. under 25%) to see true widely-available pickups; raise it toward 75% if you want to also catch players outperforming their roster spot on someone else's bench.",
    ],
  },
  {
    phase: "How to read a candidate",
    tips: [
      "Breakouts leads with the biggest recent outperformance regardless of volatility — good for spotting a player about to take over a role.",
      "Safer Pickups favors a low Std Dev over a huge single game — that's sustained outperformance, a better bet for a start-now roster spot.",
      "Cross-check Own % and Started % together: low ownership with rising started % elsewhere is often a sign the wider market is starting to notice too, so don't wait too long.",
    ],
  },
];

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
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)} |
        {" "}Week {safeToText(data.currentScoringPeriod)}
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

      <FantasyStrategyGuide
        title="How to use waivers for your team"
        sections={WAIVER_STRATEGY}
      />
      <FantasyGlossary items={WAIVER_GLOSSARY} />
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

const CONSISTENCY_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "Consistency Score",
    definition:
      "Actual Avg minus Std Dev over the window. Rewards a steady floor rather than one huge ceiling week — a high score means dependable production, not necessarily the highest upside.",
  },
  {
    term: "Std Dev",
    definition:
      "Game-to-game variance over the sampled window. Lower means more predictable output week to week.",
  },
];

const CONSISTENCY_STRATEGY: FantasyStrategySection[] = [
  {
    phase: "When to use this",
    tips: [
      "Use it to pick the safer of two similarly-projected players for your lineup — Consistency Score favors the steadier floor over a spikier ceiling.",
      "Watch for players with a high Consistency Score but a recently underwhelming projection — that combination can be a buy-low trade target since the underlying floor is proven.",
    ],
  },
];

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
        {safeToText(data.scoring)} scoring | Season {safeToText(data.season)} |
        {" "}Week {safeToText(data.currentScoringPeriod)}
      </p>
      <FantasyPlainSummary>
        Ranks players by how steady they've been recently — good for
        picking a safer start over a boom-or-bust option.
      </FantasyPlainSummary>
      {data.decisionInsights ? (
        <p className="callout-note">{data.decisionInsights}</p>
      ) : null}
      <p className="selector-note">
        Window {safeToText(data.window)} games | Status{" "}
        {getInSeasonStatusLabel(data.status)}
      </p>

      <FantasyStrategyGuide
        title="How to use consistency for your lineup"
        sections={CONSISTENCY_STRATEGY}
      />
      <FantasyGlossary items={CONSISTENCY_GLOSSARY} />
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

const START_SIT_GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: "Recommendation",
    definition:
      "Start (recent form supports or exceeds next week's projection), Consider Sit (recent form trails it), Insufficient Sample (fewer than 2 completed games), or No Upcoming Projection (no projection exists for the next period, e.g. a completed season or bye).",
  },
  {
    term: "Next Projection",
    definition:
      "ESPN's projection for the next scoring period only — a single-week number, not a season total.",
  },
];

const START_SIT_STRATEGY: FantasyStrategySection[] = [
  {
    phase: "How to use this",
    tips: [
      "Add the players you're deciding between for this week, then compare Next Projection alongside Δ vs Proj from their recent form — a Start recommendation with a rising Δ is the strongest combination.",
      "This tool does not include opponent-matchup analysis — combine it with your own read on the upcoming defense before finalizing your lineup.",
      "\"No Upcoming Projection\" is expected for a completed season or off week, not an error — it just means there's nothing to recommend yet for that player.",
    ],
  },
];

export const StartSitCard = ({ data }: { data: StartSitResponse }) => (
  <article className="scout-card fantasy-card">
    <div className="fantasy-header-row">
      <span className="fantasy-badge fantasy-badge--startsit">
        NFL Fantasy
      </span>
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
    <p className="empty-note">
      Not included yet: matchup, weather, defensive opponent, and late injury
      news. Treat Start/Consider Sit as a data-driven nudge from projection and
      recent form only, not a guarantee.
    </p>

    <FantasyStrategyGuide
      title="How to use start/sit for your lineup"
      sections={START_SIT_STRATEGY}
    />
    <FantasyGlossary items={START_SIT_GLOSSARY} />
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
              <span className={getRecommendationChipClass(player.recommendation)}>
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
      "This UI's convention: Side A is \"You Give,\" Side B is \"You Receive.\" The backend itself is direction-agnostic — it just compares whatever player IDs are placed on each side.",
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
      "Balanced (within 3 VORP), Slight Edge (within 12 VORP), or Clear Edge (more than 12 VORP) — a quick read on how lopsided the deal is by total value alone. Don't call a trade \"fair\" from Verdict alone — check the position breakdown too, since a team can accept an edge to fill a real roster need.",
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
      "Treat \"Balanced\"/\"Slight Edge\" as fine to accept on team need alone; reserve pushback for \"Clear Edge\" trades unless you're deliberately selling low-VORP depth for a positional need.",
      "Never call a trade \"fair\" from Verdict alone — always check the position (byPosition) breakdown so you can judge roster construction, not just total value.",
    ],
  },
];

export const TradeAnalyzerCard = ({ data }: { data: TradeAnalysisResponse }) => (
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
      Add the players from both sides of a trade to see who actually gains
      more value — that's it.
    </FantasyPlainSummary>
    <p className="callout-note callout-note--compact">
      Convention: Side A = "You Give," Side B = "You Receive." Net VORP To A
      is positive when you gain value, negative when you give up value.
    </p>
    {data.decisionInsights ? (
      <p className="callout-note">{data.decisionInsights}</p>
    ) : null}
    {data.missingPlayerIds?.length ? (
      <p className="empty-note">
        Missing player IDs (not found in pool): {data.missingPlayerIds.join(", ")}
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

    <FantasyStrategyGuide title="How to use this for a trade" sections={TRADE_STRATEGY} />
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
