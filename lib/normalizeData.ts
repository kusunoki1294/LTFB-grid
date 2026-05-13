import { findHeaderIndex, parseCsv, unique } from "@/lib/csv";
import type {
  GameAppearance,
  NormalizedGameData,
  PlayerAdvancedStats,
  PlayerExternalStats,
  PlayerRecord,
  PlayerStats,
} from "@/lib/types";

type StatsEntry = {
  id: string;
  name: string;
  stats: PlayerStats;
};

type AdvancedEntry = {
  id: string;
  name: string;
  advancedStats: PlayerAdvancedStats;
};

type ExternalEntry = {
  id: string;
  name: string;
  external: PlayerExternalStats;
};

type MutablePlayer = {
  id: string;
  name: string;
  aliases: Set<string>;
  stats?: PlayerStats;
  advancedStats?: PlayerAdvancedStats;
  external?: PlayerExternalStats;
};

type SheetPayload = {
  spreadsheetId: string;
  statsCsv: string;
  advancedStatsCsv: string;
  externalCsv: string;
};

const statsFieldHeaders: Array<[keyof PlayerStats, string]> = [
  ["passingTds", "pTD"],
  ["rushingTds", "RuTD"],
  ["receivingTds", "ReTD"],
  ["interceptionsThrown", "Intercepted"],
  ["interceptionsCaught", "Int(Pick)"],
  ["defensiveScores", "Pick Six/Fumble Rec"],
  ["sacks", "Sack"],
  ["pancakes", "Pancakes"],
  ["fumblesRecovered", "Fumble Recovered"],
  ["returnTds", "Kick/Punt Return TD"],
  ["twoPointConversions", "2pt Conversion"],
  ["gamesPlayed", "Games Played"],
  ["mvps", "MVPs"],
];

const advancedFieldHeaders: Array<[keyof PlayerAdvancedStats, string]> = [
  ["passingTdToInterceptionRatio", "pTD/Intercepted"],
  ["tdsPerGame", "TD/Games"],
  ["bestPassingTdsGame", "Most pTD in a Game"],
  ["bestRushingTdsGame", "Most RuTD in a game"],
  ["bestReceivingTdsGame", "Most ReTD in a game"],
  ["bestPicksGame", "Most Picks in a Game"],
  ["bestTotalTdsGame", "Most TD in a Game"],
  ["totalTds", "Total TD"],
  ["totalFantasy", "Total Fantasy"],
  ["fantasyPerGame", "Fantasy/Game"],
  ["highestFantasyGame", "Highest Fantasy Game"],
  ["qbWins", "QB Wins"],
];

const externalParticipantHeaders = [
  "TC",
  "1st Round",
  "2nd Round",
  "3rd Round",
  "4th Round",
  "5th Round",
  "6th Round",
  "7th Round",
];

export function normalizePlayerName(value: string): string {
  let normalized = value.trim().replace(/\s+/g, " ");

  while (/\*+\s*$/.test(normalized)) {
    normalized = normalized.replace(/\s*\*+\s*$/, "").trim();
  }

  return normalized.replace(/\s+/g, " ");
}

export function toPlayerId(value: string): string {
  return normalizePlayerName(value).toLowerCase();
}

export function parseNumberValue(value: string): number | undefined {
  const cleaned = value.trim().replace(/,/g, "").replace(/%$/, "");

  if (!cleaned || cleaned === "#REF!" || cleaned === "#VALUE!") {
    return undefined;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sortPlayersByName(playerA: PlayerRecord, playerB: PlayerRecord): number {
  return playerA.name.localeCompare(playerB.name);
}

function sortIdsByName(ids: string[], playersById: Record<string, PlayerRecord>): string[] {
  return ids.sort((left, right) =>
    playersById[left].name.localeCompare(playersById[right].name),
  );
}

function parseStatsEntries(statsCsv: string): { entries: StatsEntry[]; rawRowCount: number } {
  const rows = parseCsv(statsCsv);
  const headers = rows[0] ?? [];
  const seasonNameIndex = findHeaderIndex(headers, "Season Stats");

  if (seasonNameIndex === -1) {
    return { entries: [], rawRowCount: Math.max(rows.length - 1, 0) };
  }

  const fieldIndexes = new Map<keyof PlayerStats, number>();
  for (const [field, header] of statsFieldHeaders) {
    const index = findHeaderIndex(headers, header, seasonNameIndex + 1);
    if (index !== -1) {
      fieldIndexes.set(field, index);
    }
  }

  const entries: StatsEntry[] = [];

  for (const row of rows.slice(1)) {
    const name = normalizePlayerName(row[seasonNameIndex] ?? "");
    if (!name) {
      continue;
    }

    const stats: PlayerStats = {};
    let hasValue = false;

    for (const [field, index] of fieldIndexes.entries()) {
      const value = parseNumberValue(row[index] ?? "");
      if (value !== undefined) {
        stats[field] = value;
        hasValue = true;
      }
    }

    if (!hasValue) {
      continue;
    }

    entries.push({
      id: toPlayerId(name),
      name,
      stats,
    });
  }

  return {
    entries,
    rawRowCount: Math.max(rows.length - 1, 0),
  };
}

function parseAdvancedEntries(advancedStatsCsv: string): {
  entries: AdvancedEntry[];
  rawRowCount: number;
} {
  const rows = parseCsv(advancedStatsCsv);
  const headers = rows[0] ?? [];
  const fieldIndexes = new Map<keyof PlayerAdvancedStats, number>();

  for (const [field, header] of advancedFieldHeaders) {
    const index = findHeaderIndex(headers, header);
    if (index !== -1) {
      fieldIndexes.set(field, index);
    }
  }

  const entries: AdvancedEntry[] = [];

  for (const row of rows.slice(1)) {
    const name = normalizePlayerName(row[0] ?? "");
    if (!name) {
      continue;
    }

    const advancedStats: PlayerAdvancedStats = {};
    let hasValue = false;

    for (const [field, index] of fieldIndexes.entries()) {
      const value = parseNumberValue(row[index] ?? "");
      if (value !== undefined) {
        advancedStats[field] = value;
        hasValue = true;
      }
    }

    if (!hasValue) {
      continue;
    }

    entries.push({
      id: toPlayerId(name),
      name,
      advancedStats,
    });
  }

  return {
    entries,
    rawRowCount: Math.max(rows.length - 1, 0),
  };
}

function parseExternalEntries(externalCsv: string): {
  entries: ExternalEntry[];
  rawRowCount: number;
  games: GameAppearance[];
} {
  const rows = parseCsv(externalCsv);
  const headers = rows[0] ?? [];
  const dateIndex = findHeaderIndex(headers, "Date");
  const participantIndexes = externalParticipantHeaders
    .map((header) => findHeaderIndex(headers, header))
    .filter((index) => index !== -1);

  const playerDates = new Map<string, Set<string>>();
  const playerNames = new Map<string, string>();
  const gameParticipants = new Map<string, Set<string>>();

  let currentDate = "";

  for (const row of rows.slice(1)) {
    const nextDate = (row[dateIndex] ?? "").trim();
    if (nextDate) {
      currentDate = nextDate;
    }

    if (!currentDate) {
      continue;
    }

    const participants = unique(
      participantIndexes
        .map((index) => normalizePlayerName(row[index] ?? ""))
        .filter((value) => value !== ""),
    );

    if (participants.length === 0) {
      continue;
    }

    const gameSet = gameParticipants.get(currentDate) ?? new Set<string>();

    for (const participant of participants) {
      const playerId = toPlayerId(participant);
      playerNames.set(playerId, participant);
      gameSet.add(playerId);

      const dateSet = playerDates.get(playerId) ?? new Set<string>();
      dateSet.add(currentDate);
      playerDates.set(playerId, dateSet);
    }

    gameParticipants.set(currentDate, gameSet);
  }

  const entries: ExternalEntry[] = Array.from(playerDates.entries()).map(
    ([playerId, dates]) => ({
      id: playerId,
      name: playerNames.get(playerId) ?? playerId,
      external: {
        appearances: dates.size,
        appearanceDates: Array.from(dates),
      },
    }),
  );

  const games: GameAppearance[] = Array.from(gameParticipants.entries()).map(
    ([date, participants]) => ({
      date,
      playerIds: Array.from(participants),
    }),
  );

  return {
    entries,
    rawRowCount: Math.max(rows.length - 1, 0),
    games,
  };
}

function upsertPlayer(players: Map<string, MutablePlayer>, playerId: string, name: string) {
  const existing = players.get(playerId);
  if (existing) {
    existing.aliases.add(name);
    return existing;
  }

  const created: MutablePlayer = {
    id: playerId,
    name,
    aliases: new Set([name]),
  };

  players.set(playerId, created);
  return created;
}

export function normalizeSheetData(payload: SheetPayload): NormalizedGameData {
  const statsResult = parseStatsEntries(payload.statsCsv);
  const advancedResult = parseAdvancedEntries(payload.advancedStatsCsv);
  const externalResult = parseExternalEntries(payload.externalCsv);

  const players = new Map<string, MutablePlayer>();
  const statsByPlayerId: Record<string, PlayerStats> = {};
  const advancedStatsByPlayerId: Record<string, PlayerAdvancedStats> = {};
  const externalByPlayerId: Record<string, PlayerExternalStats> = {};

  for (const entry of statsResult.entries) {
    const player = upsertPlayer(players, entry.id, entry.name);
    player.stats = entry.stats;
    statsByPlayerId[entry.id] = entry.stats;
  }

  for (const entry of advancedResult.entries) {
    const player = upsertPlayer(players, entry.id, entry.name);
    player.advancedStats = entry.advancedStats;
    advancedStatsByPlayerId[entry.id] = entry.advancedStats;
  }

  for (const entry of externalResult.entries) {
    const player = upsertPlayer(players, entry.id, entry.name);
    player.external = entry.external;
    externalByPlayerId[entry.id] = entry.external;
  }

  const normalizedPlayers: PlayerRecord[] = Array.from(players.values())
    .map((player) => ({
      id: player.id,
      name: player.name,
      aliases: Array.from(player.aliases),
      stats: player.stats,
      advancedStats: player.advancedStats,
      external: player.external,
    }))
    .sort(sortPlayersByName);

  const playersById = normalizedPlayers.reduce<Record<string, PlayerRecord>>(
    (accumulator, player) => {
      accumulator[player.id] = player;
      return accumulator;
    },
    {},
  );

  const games = externalResult.games.map((game) => ({
    date: game.date,
    playerIds: sortIdsByName(game.playerIds, playersById),
  }));

  return {
    spreadsheetId: payload.spreadsheetId,
    loadedAt: new Date().toISOString(),
    sourceCounts: {
      statsRows: statsResult.rawRowCount,
      advancedStatsRows: advancedResult.rawRowCount,
      externalRows: externalResult.rawRowCount,
    },
    players: normalizedPlayers,
    playersById,
    statsByPlayerId,
    advancedStatsByPlayerId,
    externalByPlayerId,
    games,
  };
}
