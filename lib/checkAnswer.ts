import { toPlayerId } from "@/lib/normalizeData";
import { solveGrid, type FixedAssignments } from "@/lib/gridGenerator";
import type { Category, GridCellDefinition, NormalizedGameData, PlayerRecord } from "@/lib/types";

type AnswerCheckInput = {
  playerName: string;
  rowCategory: Category;
  columnCategory: Category;
  cell: GridCellDefinition;
  data: NormalizedGameData;
  usedPlayerIds: string[];
  fixedAssignments: FixedAssignments;
  gridCells: GridCellDefinition[][];
};

export type AnswerCheckResult =
  | {
      ok: true;
      player: PlayerRecord;
      rarityPercent: number;
    }
  | {
      ok: false;
      message: string;
      shouldCountMiss: boolean;
    };

function findPlayer(playerName: string, data: NormalizedGameData): PlayerRecord | undefined {
  const playerId = toPlayerId(playerName);
  return data.playersById[playerId];
}

export function checkAnswer(input: AnswerCheckInput): AnswerCheckResult {
  const player = findPlayer(input.playerName, input.data);

  if (!player) {
    return {
      ok: false,
      message: "That player was not found in the loaded sheet data.",
      shouldCountMiss: false,
    };
  }

  if (input.usedPlayerIds.includes(player.id)) {
    return {
      ok: false,
      message: "You cannot use the same player twice.",
      shouldCountMiss: false,
    };
  }

  const matchesRow = input.rowCategory.test(player, input.data);
  const matchesColumn = input.columnCategory.test(player, input.data);

  if (!matchesRow || !matchesColumn) {
    return {
      ok: false,
      message: `${player.name} does not satisfy both categories for this square.`,
      shouldCountMiss: true,
    };
  }

  const nextAssignments: FixedAssignments = {
    ...input.fixedAssignments,
    [input.cell.id]: player.id,
  };

  if (!solveGrid(input.gridCells, nextAssignments)) {
    return {
      ok: false,
      message:
        "That player fits this square, but it leaves no unique-player solution for the rest of the grid.",
      shouldCountMiss: false,
    };
  }

  return {
    ok: true,
    player,
    rarityPercent: input.cell.rarityPercent,
  };
}
