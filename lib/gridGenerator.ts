import type { Category, GeneratedGrid, GridCellDefinition } from "@/lib/types";

export type FixedAssignments = Record<string, string>;

function shuffle<T>(values: T[]): T[] {
  const cloned = [...values];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = cloned[index];
    cloned[index] = cloned[swapIndex];
    cloned[swapIndex] = current;
  }

  return cloned;
}

function combinationsOfThree<T>(values: T[]): [T, T, T][] {
  const combinations: [T, T, T][] = [];

  for (let first = 0; first < values.length - 2; first += 1) {
    for (let second = first + 1; second < values.length - 1; second += 1) {
      for (let third = second + 1; third < values.length; third += 1) {
        combinations.push([values[first], values[second], values[third]]);
      }
    }
  }

  return combinations;
}

function intersectPlayerIds(rowCategory: Category, columnCategory: Category): string[] {
  const rowPlayerIds = new Set(rowCategory.playerIds);
  return columnCategory.playerIds.filter((playerId) => rowPlayerIds.has(playerId));
}

export function flattenGridCells(cells: GridCellDefinition[][]): GridCellDefinition[] {
  return cells.flat();
}

export function solveGrid(
  cells: GridCellDefinition[][],
  fixedAssignments: FixedAssignments = {},
): FixedAssignments | null {
  const flattenedCells = flattenGridCells(cells);
  const assignments: FixedAssignments = { ...fixedAssignments };
  const usedPlayers = new Set<string>();

  for (const cell of flattenedCells) {
    const fixedPlayerId = fixedAssignments[cell.id];
    if (!fixedPlayerId) {
      continue;
    }

    if (!cell.validPlayerIds.includes(fixedPlayerId) || usedPlayers.has(fixedPlayerId)) {
      return null;
    }

    usedPlayers.add(fixedPlayerId);
  }

  const orderedCells = [...flattenedCells].sort((left, right) => {
    const leftAvailable = left.validPlayerIds.filter((playerId) => !usedPlayers.has(playerId)).length;
    const rightAvailable = right.validPlayerIds.filter((playerId) => !usedPlayers.has(playerId)).length;
    return leftAvailable - rightAvailable;
  });

  function backtrack(index: number): boolean {
    if (index >= orderedCells.length) {
      return true;
    }

    const cell = orderedCells[index];
    if (assignments[cell.id]) {
      return backtrack(index + 1);
    }

    for (const playerId of cell.validPlayerIds) {
      if (usedPlayers.has(playerId)) {
        continue;
      }

      assignments[cell.id] = playerId;
      usedPlayers.add(playerId);

      if (backtrack(index + 1)) {
        return true;
      }

      usedPlayers.delete(playerId);
      delete assignments[cell.id];
    }

    return false;
  }

  return backtrack(0) ? assignments : null;
}

function buildGrid(
  rowCategories: Category[],
  columnCategories: Category[],
  totalPlayers: number,
): GeneratedGrid | null {
  const cells: GridCellDefinition[][] = rowCategories.map((rowCategory, rowIndex) =>
    columnCategories.map((columnCategory, columnIndex) => {
      const validPlayerIds = intersectPlayerIds(rowCategory, columnCategory);

      return {
        id: `r${rowIndex}-c${columnIndex}`,
        row: rowIndex,
        column: columnIndex,
        rowCategoryId: rowCategory.id,
        columnCategoryId: columnCategory.id,
        validPlayerIds,
        rarityPercent: Number(((validPlayerIds.length / totalPlayers) * 100).toFixed(1)),
      };
    }),
  );

  if (flattenGridCells(cells).some((cell) => cell.validPlayerIds.length === 0)) {
    return null;
  }

  if (!solveGrid(cells)) {
    return null;
  }

  return {
    rowCategoryIds: rowCategories.map((category) => category.id),
    columnCategoryIds: columnCategories.map((category) => category.id),
    cells,
  };
}

export function generateGrid(categories: Category[], totalPlayers: number): GeneratedGrid {
  const eligibleCategories = categories.filter((category) => category.matchCount >= 3);

  if (eligibleCategories.length < 6) {
    throw new Error("Not enough categories to generate a valid grid.");
  }

  for (let attempt = 0; attempt < 2500; attempt += 1) {
    const shuffled = shuffle(eligibleCategories);
    const rowCategories = shuffled.slice(0, 3);
    const columnCategories = shuffled.slice(3, 6);
    const candidate = buildGrid(rowCategories, columnCategories, totalPlayers);

    if (candidate) {
      return candidate;
    }
  }

  const rowCombinations = combinationsOfThree(eligibleCategories);
  const columnCombinations = combinationsOfThree(eligibleCategories);
  let checked = 0;

  for (const rowCategories of rowCombinations) {
    const rowIds = new Set(rowCategories.map((category) => category.id));

    for (const columnCategories of columnCombinations) {
      if (columnCategories.some((category) => rowIds.has(category.id))) {
        continue;
      }

      const candidate = buildGrid(rowCategories, columnCategories, totalPlayers);
      checked += 1;

      if (candidate) {
        return candidate;
      }

      if (checked >= 100000) {
        break;
      }
    }

    if (checked >= 100000) {
      break;
    }
  }

  throw new Error("Could not generate a valid grid from the current category pool.");
}
