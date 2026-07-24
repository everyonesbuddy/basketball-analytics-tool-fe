import type { PlayerProfile, SummaryRow, SummaryShape } from "./dashboardTypes";

type ComparableMetric = {
  key: string;
  label: string;
  shortLabel: string;
  playerA: number | null;
  playerB: number | null;
};

type SeasonScopedType = "regular" | "postseason" | "career" | "other";

export type ComparableSplitMetrics = {
  key: string;
  label: string;
  metrics: ComparableMetric[];
};

export type PlayerMetric = {
  key: string;
  label: string;
  value: number;
};

export type PlayerSplitOption = {
  key: string;
  label: string;
};

export const toPositiveInt = (value: string): number | null => {
  const next = Number(value.trim());
  if (!Number.isInteger(next) || next <= 0) {
    return null;
  }
  return next;
};

export const safeToText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();
  return text.length ? text : "-";
};

const parseJsonArray = (value: string): unknown[] | null => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => safeToText(item)).filter((item) => item !== "-");
  }

  if (typeof value === "string") {
    const parsed = parseJsonArray(value);
    if (parsed) {
      return parsed
        .map((item) => safeToText(item))
        .filter((item) => item !== "-");
    }
  }

  return [];
};

const toSplitRows = (value: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    );
  }

  if (typeof value === "string") {
    const parsed = parseJsonArray(value);
    if (!parsed) {
      return [];
    }

    return parsed.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    );
  }

  return [];
};

const toUnknownArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseJsonArray(value);
    if (parsed) {
      return parsed;
    }

    const tokens = value
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    return tokens.length ? tokens : [];
  }

  return [];
};

export const getSummaryRows = (summary?: SummaryShape): SummaryRow[] => {
  if (!summary) {
    return [];
  }

  const splitRows = toSplitRows(summary.splits);
  if (!splitRows.length) {
    return [];
  }

  const summaryLabels = toStringArray(summary.labels);
  const summaryDisplayNames = toStringArray(summary.displayNames);
  const summaryNames = toStringArray(summary.names);

  const parseEncodedStats = (raw: string): string[] => {
    const text = raw.trim();
    if (!text.includes("**")) {
      return [];
    }

    const encoded = text.split("**").pop() ?? "";
    return encoded
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
  };

  return splitRows.map((row, index) => {
    const splitNameCandidates = [
      row.displayName,
      row.name,
      summaryNames[index],
      summaryDisplayNames[index],
      summary.displayName,
    ];

    const resolvedSplitName =
      splitNameCandidates
        .map((value) => safeToText(value))
        .find((value) => value !== "-") ?? "-";

    const rowName = resolvedSplitName
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();

    const rowEntries = Object.entries(row).filter(
      ([key]) => !["name", "displayName", "stats"].includes(key),
    );

    const rowStatsValues = toUnknownArray(row.stats);

    const encodedEntry = rowEntries.find(([, value]) => {
      const text = safeToText(value);
      return text !== "-" && text.includes("**") && text.includes(",");
    });

    const encodedValues = encodedEntry
      ? parseEncodedStats(safeToText(encodedEntry[1]))
      : [];

    let statEntries: Array<{ key: string; value: unknown }> = [];

    const preferredLabels = summaryLabels.length
      ? summaryLabels
      : summaryDisplayNames.length
        ? summaryDisplayNames
        : summaryNames;

    if (rowStatsValues.length) {
      const labels = preferredLabels.length
        ? preferredLabels
        : rowStatsValues.map((_, i) => `Stat ${i + 1}`);
      statEntries = rowStatsValues.map((value, i) => ({
        key: labels[i] ?? `Stat ${i + 1}`,
        value,
      }));
    } else if (encodedValues.length) {
      const labels = preferredLabels.length
        ? preferredLabels
        : encodedValues.map((_, i) => `Stat ${i + 1}`);
      statEntries = encodedValues.map((value, i) => ({
        key: labels[i] ?? `Stat ${i + 1}`,
        value,
      }));
    } else {
      statEntries = rowEntries.map(([key, value]) => ({ key, value }));
    }

    return {
      name: rowName === "-" ? `Split ${index + 1}` : rowName,
      values: statEntries.map(({ key, value }) => ({
        key,
        value: safeToText(value),
      })),
    };
  });
};

const PRIORITY_STAT_KEYS = [
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "tov",
  "fgpct",
  "fg3pct",
  "ftpct",
  "gp",
  "min",
];

const STAT_LONG_LABELS: Record<string, string> = {
  pts: "Points",
  reb: "Rebounds",
  ast: "Assists",
  stl: "Steals",
  blk: "Blocks",
  tov: "Turnovers",
  fgpct: "Field Goal %",
  fg3pct: "3-Point %",
  ftpct: "Free Throw %",
  gp: "Games Played",
  min: "Minutes",
};

const normalizeStatKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeSplitKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const getSplitLabel = (value: string): string => {
  const normalized = normalizeSplitKey(value);

  if (normalized.includes("career")) {
    return "Career";
  }

  if (normalized.includes("postseason") || normalized.includes("postseason")) {
    return "Postseason";
  }

  if (normalized.includes("regularseason") || normalized.includes("regular")) {
    return "Regular Season";
  }

  const pretty = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return pretty.length ? pretty : "Split";
};

const getSplitScope = (value: string): SeasonScopedType => {
  const normalized = normalizeSplitKey(value);

  if (normalized.includes("postseason") || normalized.includes("post")) {
    return "postseason";
  }

  if (normalized.includes("regularseason") || normalized.includes("regular")) {
    return "regular";
  }

  if (normalized.includes("career")) {
    return "career";
  }

  return "other";
};

const buildYearSuffix = (years: number[]): string => {
  if (!years.length) {
    return "";
  }

  if (years.length === 1) {
    return ` ${years[0]}`;
  }

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  return ` ${minYear}-${maxYear}`;
};

const getPlayerSeasonYearsForScope = (
  player: PlayerProfile,
  scope: SeasonScopedType,
): number[] => {
  const trend = Array.isArray(player.plusMinusTrend?.trend)
    ? player.plusMinusTrend.trend
    : [];

  const years = trend
    .filter((point) => {
      if (scope === "regular") {
        return point.seasonType === "regular";
      }

      if (scope === "postseason") {
        return point.seasonType === "postseason";
      }

      return true;
    })
    .map((point) => Number(point.seasonYear))
    .filter((year) => Number.isInteger(year)) as number[];

  const unique = Array.from(new Set(years)).sort((a, b) => a - b);

  if (unique.length) {
    return unique;
  }

  const fallbackYears = (player.plusMinusTrend?.seasonsCovered || []).filter(
    (year): year is number => Number.isInteger(year),
  );

  return Array.from(new Set(fallbackYears)).sort((a, b) => a - b);
};

export const formatPlayerSplitLabelWithYear = (
  player: PlayerProfile,
  splitLabel: string,
): string => {
  const scope = getSplitScope(splitLabel);

  if (scope !== "regular" && scope !== "postseason") {
    return splitLabel;
  }

  const years = getPlayerSeasonYearsForScope(player, scope);
  return `${splitLabel}${buildYearSuffix(years)}`;
};

export const formatCompareSplitLabelWithYear = (
  playerA: PlayerProfile,
  playerB: PlayerProfile,
  splitLabel: string,
): string => {
  const scope = getSplitScope(splitLabel);

  if (scope !== "regular" && scope !== "postseason") {
    return splitLabel;
  }

  const years = Array.from(
    new Set([
      ...getPlayerSeasonYearsForScope(playerA, scope),
      ...getPlayerSeasonYearsForScope(playerB, scope),
    ]),
  ).sort((a, b) => a - b);

  return `${splitLabel}${buildYearSuffix(years)}`;
};

export const formatStatLabel = (key: string): string => {
  const normalized = normalizeStatKey(key);
  const known: Record<string, string> = {
    pts: "PTS",
    reb: "REB",
    ast: "AST",
    stl: "STL",
    blk: "BLK",
    tov: "TOV",
    fgpct: "FG%",
    fg3pct: "3P%",
    ftpct: "FT%",
    gp: "GP",
    min: "MIN",
  };

  if (known[normalized]) {
    return known[normalized];
  }

  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return withSpaces.length ? withSpaces.toUpperCase() : key.toUpperCase();
};

export const formatStatLongLabel = (key: string): string => {
  const normalized = normalizeStatKey(key);

  if (STAT_LONG_LABELS[normalized]) {
    return STAT_LONG_LABELS[normalized];
  }

  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!withSpaces.length) {
    return key.toUpperCase();
  }

  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map(
      (token) =>
        `${token.charAt(0).toUpperCase()}${token.slice(1).toLowerCase()}`,
    )
    .join(" ");
};

export const toNumericStat = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = safeToText(value);
  if (text === "-") {
    return null;
  }

  const cleaned = text.replace(/,/g, "").replace(/%$/, "");
  const next = Number(cleaned);
  return Number.isFinite(next) ? next : null;
};

const buildComparableMap = (player: PlayerProfile): Record<string, number> => {
  const rows = getSummaryRows(player.summary);
  const acc: Record<string, number> = {};

  rows.forEach((row) => {
    row.values.forEach((entry) => {
      const normalized = normalizeStatKey(entry.key);
      if (acc[normalized] !== undefined) {
        return;
      }

      const numeric = toNumericStat(entry.value);
      if (numeric === null) {
        return;
      }

      acc[normalized] = numeric;
    });
  });

  // Fallback path: some responses do not provide usable summary.splits values.
  // In that case, collect numeric fields from top-level stats/splits objects.
  const collectFromObject = (value: unknown) => {
    if (typeof value !== "object" || value === null) {
      return;
    }

    Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
      const normalized = normalizeStatKey(key);
      if (!normalized || acc[normalized] !== undefined) {
        return;
      }

      const numeric = toNumericStat(raw);
      if (numeric === null) {
        return;
      }

      acc[normalized] = numeric;
    });
  };

  if (!Object.keys(acc).length) {
    collectFromObject(player.stats);
    collectFromObject(player.splits);
  }

  return acc;
};

type SplitMetricMap = Record<string, Record<string, number>>;

const buildSplitComparableMaps = (player: PlayerProfile): SplitMetricMap => {
  const rows = getSummaryRows(player.summary);
  const splitMap: SplitMetricMap = {};

  rows.forEach((row) => {
    const splitKey = normalizeSplitKey(row.name);
    if (!splitMap[splitKey]) {
      splitMap[splitKey] = {};
    }

    row.values.forEach((entry) => {
      const normalized = normalizeStatKey(entry.key);
      if (splitMap[splitKey][normalized] !== undefined) {
        return;
      }

      const numeric = toNumericStat(entry.value);
      if (numeric === null) {
        return;
      }

      splitMap[splitKey][normalized] = numeric;
    });
  });

  return splitMap;
};

const getOrderedStatKeys = (keys: string[]): string[] => {
  const unique = Array.from(new Set(keys));
  const priority = PRIORITY_STAT_KEYS.filter((key) => unique.includes(key));
  const remainder = unique
    .filter((key) => !PRIORITY_STAT_KEYS.includes(key))
    .sort((a, b) =>
      formatStatLongLabel(a).localeCompare(formatStatLongLabel(b)),
    );

  return [...priority, ...remainder];
};

export const getPlayerOverviewMetrics = (
  player: PlayerProfile,
): PlayerMetric[] => {
  const metricMap = buildComparableMap(player);

  const orderedKeys = getOrderedStatKeys(
    Object.keys(metricMap).filter((key) => metricMap[key] !== undefined),
  );

  return orderedKeys.slice(0, 12).map((key) => ({
    key,
    label: formatStatLongLabel(key),
    value: metricMap[key],
  }));
};

export const getPlayerSplitOptions = (
  player: PlayerProfile,
): PlayerSplitOption[] => {
  const rows = getSummaryRows(player.summary);
  const splitKeys = Array.from(
    new Set(rows.map((row) => normalizeSplitKey(row.name)).filter(Boolean)),
  );

  const mapped = splitKeys.map((key) => {
    const baseLabel = getSplitLabel(key);
    return {
      key,
      label: formatPlayerSplitLabelWithYear(player, baseLabel),
    };
  });

  return mapped.sort((a, b) => {
    const regularA = a.key.includes("regularseason") ? 0 : 1;
    const regularB = b.key.includes("regularseason") ? 0 : 1;

    if (regularA !== regularB) {
      return regularA - regularB;
    }

    return a.label.localeCompare(b.label);
  });
};

export const getPlayerOverviewMetricsBySplit = (
  player: PlayerProfile,
  splitKey: string,
): PlayerMetric[] => {
  if (splitKey === "all") {
    return getPlayerOverviewMetrics(player);
  }

  const splitMap = buildSplitComparableMaps(player);
  const metricsForSplit = splitMap[splitKey] || {};
  const orderedKeys = getOrderedStatKeys(Object.keys(metricsForSplit));

  return orderedKeys.slice(0, 12).map((key) => ({
    key,
    label: formatStatLongLabel(key),
    value: metricsForSplit[key],
  }));
};

export const getComparableMetrics = (
  playerA: PlayerProfile,
  playerB: PlayerProfile,
): ComparableMetric[] => {
  const mapA = buildComparableMap(playerA);
  const mapB = buildComparableMap(playerB);

  const intersected = Object.keys(mapA).filter(
    (key) => mapA[key] !== undefined && mapB[key] !== undefined,
  );

  const orderedIntersected = getOrderedStatKeys(intersected);

  return orderedIntersected.map((key) => ({
    key,
    label: formatStatLongLabel(key),
    shortLabel: formatStatLabel(key),
    playerA: mapA[key],
    playerB: mapB[key],
  }));
};

export const getComparableSplitMetrics = (
  playerA: PlayerProfile,
  playerB: PlayerProfile,
): ComparableSplitMetrics[] => {
  const splitMapA = buildSplitComparableMaps(playerA);
  const splitMapB = buildSplitComparableMaps(playerB);

  const commonSplitKeys = Array.from(
    new Set([...Object.keys(splitMapA), ...Object.keys(splitMapB)]),
  );

  const orderedSplitKeys = commonSplitKeys.sort((a, b) => {
    const order = ["regularseason", "postseason", "career"];
    const indexA = order.findIndex((item) => a.includes(item));
    const indexB = order.findIndex((item) => b.includes(item));

    if (indexA !== indexB) {
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    }

    return getSplitLabel(a).localeCompare(getSplitLabel(b));
  });

  return orderedSplitKeys.map((splitKey) => {
    const mapA = splitMapA[splitKey];
    const mapB = splitMapB[splitKey];
    const orderedIntersected = getOrderedStatKeys(
      Array.from(
        new Set([...Object.keys(mapA || {}), ...Object.keys(mapB || {})]),
      ),
    );

    return {
      key: splitKey,
      label: getSplitLabel(splitKey),
      metrics: orderedIntersected.map((key) => ({
        key,
        label: formatStatLongLabel(key),
        shortLabel: formatStatLabel(key),
        playerA: mapA[key] ?? null,
        playerB: mapB[key] ?? null,
      })),
    };
  });
};
