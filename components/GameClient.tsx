"use client";

import { useEffect, useState, useTransition } from "react";
import DebugPanel from "@/components/DebugPanel";
import GameHeader from "@/components/GameHeader";
import Grid from "@/components/Grid";
import PlayerSearch from "@/components/PlayerSearch";
import { buildCategories } from "@/lib/categories";
import { checkAnswer } from "@/lib/checkAnswer";
import {
  flattenGridCells,
  generateGrid,
  solveGrid,
  type FixedAssignments,
} from "@/lib/gridGenerator";
import type {
  AnswerRecord,
  Category,
  GeneratedGrid,
  GridCellDefinition,
  NormalizedGameData,
} from "@/lib/types";

type FlashMessage = {
  tone: "info" | "error" | "success";
  text: string;
};

type GameState = {
  grid: GeneratedGrid;
  answers: Record<string, AnswerRecord>;
  guessesRemaining: number;
  isOver: boolean;
  answersShown: boolean;
};

const maxGuesses = 9;

function buildFreshGame(categories: Category[], totalPlayers: number): GameState {
  return {
    grid: generateGrid(categories, totalPlayers),
    answers: {},
    guessesRemaining: maxGuesses,
    isOver: false,
    answersShown: false,
  };
}

function buildAssignments(answers: Record<string, AnswerRecord>): FixedAssignments {
  return Object.values(answers).reduce<FixedAssignments>((accumulator, answer) => {
    accumulator[answer.cellId] = answer.playerId;
    return accumulator;
  }, {});
}

function buildRevealedAnswers(
  grid: GeneratedGrid,
  answers: Record<string, AnswerRecord>,
  playersById: NormalizedGameData["playersById"],
): Record<string, AnswerRecord> {
  const assignments = buildAssignments(answers);
  const solution = solveGrid(grid.cells, assignments);

  if (!solution) {
    return answers;
  }

  const nextAnswers = { ...answers };

  for (const cell of flattenGridCells(grid.cells)) {
    if (nextAnswers[cell.id]) {
      continue;
    }

    const playerId = solution[cell.id];
    const player = playersById[playerId];

    nextAnswers[cell.id] = {
      cellId: cell.id,
      playerId,
      playerName: player.name,
      rarityPercent: cell.rarityPercent,
      revealed: true,
    };
  }

  return nextAnswers;
}

function sumScore(answers: Record<string, AnswerRecord>): number {
  const total = Object.values(answers)
    .filter((answer) => !answer.revealed)
    .reduce((sum, answer) => sum + answer.rarityPercent, 0);

  return Number(total.toFixed(1));
}

function getFlatCellById(cells: GridCellDefinition[][], cellId: string) {
  return flattenGridCells(cells).find((cell) => cell.id === cellId);
}

export default function GameClient({
  data,
  initialGrid,
}: {
  data: NormalizedGameData;
  initialGrid: GeneratedGrid;
}) {
  const [setup] = useState(() => {
    const players = [...data.players].sort((left, right) => left.name.localeCompare(right.name));

    try {
      const categories = buildCategories(data);
      const initialGame: GameState = {
        grid: initialGrid,
        answers: {},
        guessesRemaining: maxGuesses,
        isOver: false,
        answersShown: false,
      };

      return {
        players,
        categories,
        initialGame,
        error: null as string | null,
      };
    } catch (error) {
      return {
        players,
        categories: [] as Category[],
        initialGame: null as GameState | null,
        error:
          error instanceof Error
            ? error.message
            : "Could not build categories from the current sheet data.",
      };
    }
  });

  const [game, setGame] = useState<GameState | null>(setup.initialGame);
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [message, setMessage] = useState<FlashMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoriesById = setup.categories.reduce<Record<string, Category>>((accumulator, category) => {
    accumulator[category.id] = category;
    return accumulator;
  }, {});

  const currentRowLabels =
    game?.grid.rowCategoryIds.map((categoryId) => categoriesById[categoryId]?.label ?? categoryId) ?? [];
  const currentColumnLabels =
    game?.grid.columnCategoryIds.map((categoryId) => categoriesById[categoryId]?.label ?? categoryId) ?? [];

  useEffect(() => {
    if (!game) {
      return;
    }

    console.info("LTFB Grid debug", {
      playersLoaded: data.players.length,
      statsRowsLoaded: data.sourceCounts.statsRows,
      advancedStatsRowsLoaded: data.sourceCounts.advancedStatsRows,
      externalRowsLoaded: data.sourceCounts.externalRows,
      categoriesGenerated: setup.categories.length,
      rowCategories: currentRowLabels,
      columnCategories: currentColumnLabels,
    });
  }, [
    data.players.length,
    data.sourceCounts.advancedStatsRows,
    data.sourceCounts.externalRows,
    data.sourceCounts.statsRows,
    game,
    setup.categories.length,
    currentRowLabels,
    currentColumnLabels,
  ]);

  if (setup.error || !game) {
    return (
      <section className="app-shell error-state">
        <p className="eyebrow">Grid Setup</p>
        <h1 className="hero-title">LTFB Grid</h1>
        <p className="hero-text">{setup.error ?? "Could not initialize the game."}</p>
      </section>
    );
  }

  const flatCells = flattenGridCells(game.grid.cells);
  const activeCell = activeCellId ? getFlatCellById(game.grid.cells, activeCellId) : undefined;
  const correctCount = Object.values(game.answers).filter((answer) => !answer.revealed).length;
  const score = sumScore(game.answers);
  const usedPlayerIds = Object.values(game.answers).map((answer) => answer.playerId);
  const rowCategories = game.grid.rowCategoryIds.map((categoryId) => categoriesById[categoryId]);
  const columnCategories = game.grid.columnCategoryIds.map((categoryId) => categoriesById[categoryId]);

  function resetGrid() {
    startTransition(() => {
      try {
        setGame(buildFreshGame(setup.categories, setup.players.length));
        setActiveCellId(null);
        setMessage({
          tone: "info",
          text: "New grid generated.",
        });
      } catch (error) {
        setMessage({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "Could not generate a new grid from the current category pool.",
        });
      }
    });
  }

  function revealAnswers() {
    if (!game) {
      return;
    }

    const revealedAnswers = buildRevealedAnswers(game.grid, game.answers, data.playersById);

    setGame({
      ...game,
      answers: revealedAnswers,
      isOver: true,
      answersShown: true,
    });
    setActiveCellId(null);
    setMessage({
      tone: "info",
      text: "Answers shown. Your score only counts the squares you solved yourself.",
    });
  }

  function handleSubmit(playerName: string) {
    if (!game || !activeCell) {
      return;
    }

    const rowCategory = categoriesById[activeCell.rowCategoryId];
    const columnCategory = categoriesById[activeCell.columnCategoryId];

    const result = checkAnswer({
      playerName,
      rowCategory,
      columnCategory,
      cell: activeCell,
      data,
      usedPlayerIds,
      fixedAssignments: buildAssignments(game.answers),
      gridCells: game.grid.cells,
    });

    const nextGuessesRemaining = Math.max(0, game.guessesRemaining - 1);

    if (!result.ok) {
      if (result.shouldCountMiss) {
        if (nextGuessesRemaining === 0) {
          const revealedAnswers = buildRevealedAnswers(game.grid, game.answers, data.playersById);

          setGame({
            ...game,
            answers: revealedAnswers,
            guessesRemaining: 0,
            isOver: true,
            answersShown: true,
          });
          setActiveCellId(null);
          setMessage({
            tone: "error",
            text: "No guesses remaining. Answers revealed.",
          });
          return;
        }

        setGame({
          ...game,
          guessesRemaining: nextGuessesRemaining,
        });
        setMessage({
          tone: "error",
          text: `${result.message} ${nextGuessesRemaining} guesses remaining.`,
        });
        return;
      }

      setMessage({
        tone: "error",
        text: result.message,
      });
      return;
    }

    const nextAnswers: Record<string, AnswerRecord> = {
      ...game.answers,
      [activeCell.id]: {
        cellId: activeCell.id,
        playerId: result.player.id,
        playerName: result.player.name,
        rarityPercent: result.rarityPercent,
        revealed: false,
      },
    };

    const isComplete = Object.keys(nextAnswers).length === flatCells.length;

    if (nextGuessesRemaining === 0 && !isComplete) {
      const revealedAnswers = buildRevealedAnswers(game.grid, nextAnswers, data.playersById);

      setGame({
        ...game,
        answers: revealedAnswers,
        guessesRemaining: 0,
        isOver: true,
        answersShown: true,
      });
      setActiveCellId(null);
      setMessage({
        tone: "info",
        text: `${result.player.name} locks in for that square. No guesses remaining, so the rest of the board was revealed.`,
      });
      return;
    }

    setGame({
      ...game,
      answers: nextAnswers,
      guessesRemaining: nextGuessesRemaining,
      isOver: isComplete,
      answersShown: false,
    });
    setActiveCellId(null);
    setMessage({
      tone: "success",
      text: isComplete
        ? "Grid complete. Lower total rarity is better."
        : `${result.player.name} locks in for that square.`,
    });
  }

  const searchLabel =
    activeCell && categoriesById[activeCell.rowCategoryId] && categoriesById[activeCell.columnCategoryId]
      ? `${categoriesById[activeCell.rowCategoryId].label} + ${categoriesById[activeCell.columnCategoryId].label}`
      : "";

  return (
    <section className="app-shell">
      <GameHeader
        answersShown={game.answersShown}
        correctCount={correctCount}
        guessesRemaining={game.guessesRemaining}
        isBusy={isPending}
        isGameOver={game.isOver}
        message={message}
        score={score}
        onGiveUp={revealAnswers}
        onNewGrid={resetGrid}
      />

      <Grid
        answers={game.answers}
        canSelect={!game.isOver}
        cells={game.grid.cells}
        columnCategories={columnCategories}
        rowCategories={rowCategories}
        onCellClick={(cellId) => {
          if (game.isOver || game.answers[cellId]) {
            return;
          }

          setActiveCellId(cellId);
        }}
      />

      <DebugPanel
        advancedStatsRows={data.sourceCounts.advancedStatsRows}
        categoryCount={setup.categories.length}
        columnLabels={currentColumnLabels}
        externalRows={data.sourceCounts.externalRows}
        playerCount={data.players.length}
        rowLabels={currentRowLabels}
        statsRows={data.sourceCounts.statsRows}
      />

      <PlayerSearch
        cellLabel={searchLabel}
        isOpen={Boolean(activeCell)}
        players={setup.players}
        usedPlayerIds={usedPlayerIds}
        onClose={() => setActiveCellId(null)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
