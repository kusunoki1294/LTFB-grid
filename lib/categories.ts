import type { Category, CategorySource, NormalizedGameData, PlayerRecord } from "@/lib/types";

type ThresholdKind = "count" | "rate";
type Comparator = "gte" | "gt";

type NumericCategoryConfig = {
  id: string;
  source: CategorySource;
  kind: ThresholdKind;
  comparator: Comparator;
  accessor: (player: PlayerRecord) => number | undefined;
  label: (threshold: number) => string;
  maxThresholds?: number;
};

const minimumMatches = 3;

const numericCategoryConfigs: NumericCategoryConfig[] = [
  {
    id: "stats-passing-tds",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.passingTds,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} passing TDs`,
  },
  {
    id: "stats-rushing-tds",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.rushingTds,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} rushing TDs`,
  },
  {
    id: "stats-receiving-tds",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.receivingTds,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} receiving TDs`,
  },
  {
    id: "stats-picks",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.interceptionsCaught,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} picks`,
  },
  {
    id: "stats-defensive-scores",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.defensiveScores,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} defensive TDs`,
  },
  {
    id: "stats-sacks",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.sacks,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} sacks`,
  },
  {
    id: "stats-pancakes",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.pancakes,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} pancakes`,
  },
  {
    id: "stats-fumble-recoveries",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.fumblesRecovered,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} fumble recoveries`,
  },
  {
    id: "stats-return-tds",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.returnTds,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} return TDs`,
  },
  {
    id: "stats-two-point-conversions",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.twoPointConversions,
    label: (threshold) =>
      `At least ${formatThreshold(threshold, "count")} two-point conversions`,
  },
  {
    id: "stats-games-played",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.gamesPlayed,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} games played`,
  },
  {
    id: "stats-mvps",
    source: "stats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.stats?.mvps,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} MVPs`,
  },
  {
    id: "advanced-td-int-ratio",
    source: "advancedStats",
    kind: "rate",
    comparator: "gt",
    accessor: (player) => player.advancedStats?.passingTdToInterceptionRatio,
    label: (threshold) => `Passing TD / interception ratio over ${formatThreshold(threshold, "rate")}`,
  },
  {
    id: "advanced-tds-per-game",
    source: "advancedStats",
    kind: "rate",
    comparator: "gt",
    accessor: (player) => player.advancedStats?.tdsPerGame,
    label: (threshold) => `TDs per game over ${formatThreshold(threshold, "rate")}`,
  },
  {
    id: "advanced-best-passing-game",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.bestPassingTdsGame,
    label: (threshold) =>
      `Recorded at least ${formatThreshold(threshold, "count")} passing TDs in a game`,
  },
  {
    id: "advanced-best-rushing-game",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.bestRushingTdsGame,
    label: (threshold) =>
      `Recorded at least ${formatThreshold(threshold, "count")} rushing TDs in a game`,
  },
  {
    id: "advanced-best-receiving-game",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.bestReceivingTdsGame,
    label: (threshold) =>
      `Recorded at least ${formatThreshold(threshold, "count")} receiving TDs in a game`,
  },
  {
    id: "advanced-best-picks-game",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.bestPicksGame,
    label: (threshold) =>
      `Recorded at least ${formatThreshold(threshold, "count")} picks in a game`,
  },
  {
    id: "advanced-best-total-td-game",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.bestTotalTdsGame,
    label: (threshold) =>
      `Recorded at least ${formatThreshold(threshold, "count")} total TDs in a game`,
  },
  {
    id: "advanced-total-tds",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.totalTds,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} total TDs`,
  },
  {
    id: "advanced-total-fantasy",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.totalFantasy,
    label: (threshold) => `At least ${formatThreshold(threshold, "count")} total fantasy points`,
  },
  {
    id: "advanced-fantasy-per-game",
    source: "advancedStats",
    kind: "rate",
    comparator: "gt",
    accessor: (player) => player.advancedStats?.fantasyPerGame,
    label: (threshold) => `Fantasy points per game over ${formatThreshold(threshold, "rate")}`,
  },
  {
    id: "advanced-highest-fantasy-game",
    source: "advancedStats",
    kind: "count",
    comparator: "gte",
    accessor: (player) => player.advancedStats?.highestFantasyGame,
    label: (threshold) =>
      `Posted at least ${formatThreshold(threshold, "count")} fantasy points in a game`,
  },
];

function roundThreshold(value: number, kind: ThresholdKind): number {
  if (kind === "count") {
    if (value >= 100) {
      return Math.floor(value / 25) * 25;
    }

    if (value >= 50) {
      return Math.floor(value / 10) * 10;
    }

    if (value >= 20) {
      return Math.floor(value / 5) * 5;
    }

    if (value >= 10) {
      return Math.floor(value / 2) * 2;
    }

    return Math.floor(value);
  }

  if (value >= 10) {
    return Math.floor(value);
  }

  if (value >= 3) {
    return Math.floor(value * 2) / 2;
  }

  if (value >= 1) {
    return Math.floor(value * 4) / 4;
  }

  return Math.floor(value * 10) / 10;
}

function formatThreshold(value: number, kind: ThresholdKind): string {
  if (kind === "count") {
    return `${Math.round(value)}`;
  }

  return value % 1 === 0 ? `${value.toFixed(0)}` : `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function passesComparator(
  value: number | undefined,
  comparator: Comparator,
  threshold: number,
): boolean {
  if (value === undefined) {
    return false;
  }

  return comparator === "gte" ? value >= threshold : value > threshold;
}

function buildThresholds(values: number[], kind: ThresholdKind): number[] {
  const sorted = Array.from(new Set(values.filter((value) => Number.isFinite(value)))).sort(
    (left, right) => left - right,
  );

  if (sorted.length < 2) {
    return [];
  }

  const quantiles = [0.35, 0.55, 0.75];
  const thresholds = quantiles
    .map((quantile) => {
      const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * quantile));
      return roundThreshold(sorted[index], kind);
    })
    .filter((threshold) => threshold > 0);

  return Array.from(new Set(thresholds));
}

function sortPlayerIds(playerIds: string[], data: NormalizedGameData): string[] {
  return playerIds.sort((left, right) =>
    data.playersById[left].name.localeCompare(data.playersById[right].name),
  );
}

export function buildCategories(data: NormalizedGameData): Category[] {
  const categories: Category[] = [];
  const seenSignatures = new Set<string>();

  for (const config of numericCategoryConfigs) {
    const values = data.players
      .map((player) => config.accessor(player))
      .filter((value): value is number => value !== undefined);

    for (const threshold of buildThresholds(values, config.kind).slice(
      0,
      config.maxThresholds ?? 3,
    )) {
      const playerIds = sortPlayerIds(
        data.players
          .filter((player) =>
            passesComparator(config.accessor(player), config.comparator, threshold),
          )
          .map((player) => player.id),
        data,
      );

      if (playerIds.length < minimumMatches || playerIds.length >= data.players.length) {
        continue;
      }

      const signature = `${config.id}:${playerIds.join("|")}`;
      if (seenSignatures.has(signature)) {
        continue;
      }

      seenSignatures.add(signature);

      categories.push({
        id: `${config.id}-${String(threshold).replace(/\./g, "_")}`,
        label: config.label(threshold),
        source: config.source,
        playerIds,
        matchCount: playerIds.length,
        test: (player) =>
          passesComparator(config.accessor(player), config.comparator, threshold),
      });
    }
  }

  return categories.sort((left, right) => left.label.localeCompare(right.label));
}
