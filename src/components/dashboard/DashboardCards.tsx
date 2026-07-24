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
import {
  formatPlayerSplitLabelWithYear,
  formatStatLongLabel,
  type PlayerMetric,
  getPlayerOverviewMetrics,
  getSummaryRows,
  safeToText,
} from "../../utils/dashboardFormatters";
import type {
  PlayerCompsResponse,
  PlayerImpactResponse,
  PlayerProfile,
  PlayerTrajectoryResponse,
  TeamNeedGapResponse,
  TeamEfficiencyResponse,
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

  if (!metrics.length) {
    return (
      <article className="scout-card viz-card">
        <h3>Player Overview</h3>
        <p className="empty-note">
          No numeric summary metrics found for this player.
        </p>
      </article>
    );
  }

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
  if (!metrics.length) {
    return null;
  }

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
  if (!metrics.length) {
    return null;
  }

  const playerALabel =
    playerA.identity.shortName || playerA.identity.displayName;
  const playerBLabel =
    playerB.identity.shortName || playerB.identity.displayName;

  return (
    <article className="scout-card compare-table-card">
      <h3>{splitLabel}</h3>
      <p className="viz-subtitle">Readable side-by-side stat matrix</p>
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
      <h3>Player Impact</h3>
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
      <h3 title="Player Value Comps are nearest-neighbor matches from normalized summary-stat vectors.">
        Player Value Comps
      </h3>
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
      <h3 title="Development Curve uses rolling averages over recent games to smooth variance and reveal trend direction.">
        Development Curve
      </h3>
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
                  name === "tsRolling" ? "Rolling TS%" : "Rolling Points",
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
      <h3 title="Team Efficiency summarizes offensive and defensive quality per-possession before need-gap interpretation.">
        Team Efficiency Baseline
      </h3>
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
      <h3 title="Need Gap Analysis compares team efficiency against league averages to surface strengths and weaknesses.">
        Team Need Gap Analysis
      </h3>
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
