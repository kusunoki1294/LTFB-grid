export type PlayerStats = {
  passingTds?: number;
  rushingTds?: number;
  receivingTds?: number;
  interceptionsThrown?: number;
  interceptionsCaught?: number;
  defensiveScores?: number;
  sacks?: number;
  pancakes?: number;
  fumblesRecovered?: number;
  returnTds?: number;
  twoPointConversions?: number;
  gamesPlayed?: number;
  mvps?: number;
};

export type PlayerAdvancedStats = {
  passingTdToInterceptionRatio?: number;
  tdsPerGame?: number;
  bestPassingTdsGame?: number;
  bestRushingTdsGame?: number;
  bestReceivingTdsGame?: number;
  bestPicksGame?: number;
  bestTotalTdsGame?: number;
  totalTds?: number;
  totalFantasy?: number;
  fantasyPerGame?: number;
  highestFantasyGame?: number;
  qbWins?: number;
};

export type PlayerExternalStats = {
  appearances: number;
  appearanceDates: string[];
};

export type PlayerRecord = {
  id: string;
  name: string;
  aliases: string[];
  stats?: PlayerStats;
  advancedStats?: PlayerAdvancedStats;
  external?: PlayerExternalStats;
};

export type GameAppearance = {
  date: string;
  playerIds: string[];
};

export type SourceCounts = {
  statsRows: number;
  advancedStatsRows: number;
  externalRows: number;
};

export type NormalizedGameData = {
  spreadsheetId: string;
  loadedAt: string;
  sourceCounts: SourceCounts;
  players: PlayerRecord[];
  playersById: Record<string, PlayerRecord>;
  statsByPlayerId: Record<string, PlayerStats>;
  advancedStatsByPlayerId: Record<string, PlayerAdvancedStats>;
  externalByPlayerId: Record<string, PlayerExternalStats>;
  games: GameAppearance[];
};

export type CategorySource = "stats" | "advancedStats" | "external";

export type Category = {
  id: string;
  label: string;
  source: CategorySource;
  playerIds: string[];
  matchCount: number;
  test: (player: PlayerRecord, data: NormalizedGameData) => boolean;
};

export type GridCellDefinition = {
  id: string;
  row: number;
  column: number;
  rowCategoryId: string;
  columnCategoryId: string;
  validPlayerIds: string[];
  rarityPercent: number;
};

export type GeneratedGrid = {
  rowCategoryIds: string[];
  columnCategoryIds: string[];
  cells: GridCellDefinition[][];
};

export type AnswerRecord = {
  cellId: string;
  playerId: string;
  playerName: string;
  rarityPercent: number;
  revealed: boolean;
};
