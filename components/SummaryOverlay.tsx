"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";
import { flattenGridCells } from "@/lib/gridGenerator";
import type { AnswerRecord, GridCellDefinition } from "@/lib/types";

type SummaryOverlayProps = {
  isOpen: boolean;
  answers: Record<string, AnswerRecord>;
  cells: GridCellDefinition[][];
  correctCount: number;
  guessesRemaining: number;
  score: number;
  answersShown: boolean;
  onClose: () => void;
  onNewGrid: () => void;
};

const confettiPalette = ["#84d2ff", "#94a9ff", "#ffd479", "#ff8a63", "#8bd8b4", "#d3a2ff"];

const confettiPieces = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  left: `${4 + ((index * 11) % 92)}%`,
  delay: `${(index % 6) * -1.2}s`,
  duration: `${8 + (index % 5)}s`,
  drift: `${index % 2 === 0 ? 140 : -140}px`,
  size: `${10 + (index % 4) * 4}px`,
  color: confettiPalette[index % confettiPalette.length],
  rotate: `${(index * 41) % 360}deg`,
}));

export default function SummaryOverlay({
  isOpen,
  answers,
  cells,
  correctCount,
  guessesRemaining,
  score,
  answersShown,
  onClose,
  onNewGrid,
}: SummaryOverlayProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const orderedSquares = flattenGridCells(cells).map((cell, index) => ({
    cell,
    index: index + 1,
    answer: answers[cell.id],
  }));

  const guessesUsed = 9 - guessesRemaining;
  const misses = Math.max(0, guessesUsed - correctCount);
  const revealedSquares = orderedSquares.filter((square) => square.answer?.revealed);
  const solvedSquares = orderedSquares.filter((square) => square.answer && !square.answer.revealed);
  const isPerfectBoard = solvedSquares.length === orderedSquares.length;

  const kicker = isPerfectBoard ? "Game Complete" : answersShown ? "Round Over" : "Final Scorecard";
  const subtitle = isPerfectBoard
    ? "Clean finish. Every square was solved before the board closed."
    : answersShown
      ? solvedSquares.length > 0
        ? `${solvedSquares.length} squares solved before the final reveal.`
        : "No clean hits this round. The full board has been revealed."
      : "Lower rarity wins.";

  return (
    <div className="summary-overlay" role="presentation">
      <div className="summary-confetti" aria-hidden="true">
        {confettiPieces.map((piece) => (
          <span
            key={piece.id}
            className="confetti-piece"
            style={
              {
                "--confetti-left": piece.left,
                "--confetti-delay": piece.delay,
                "--confetti-duration": piece.duration,
                "--confetti-drift": piece.drift,
                "--confetti-size": piece.size,
                "--confetti-color": piece.color,
                "--confetti-rotate": piece.rotate,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <section aria-modal="true" className="summary-panel" role="dialog">
        <button
          aria-label="Close summary"
          className="summary-close"
          type="button"
          onClick={onClose}
        >
          ×
        </button>

        <div className="summary-heading">
          <p className="summary-kicker">{kicker}</p>
          <h2 className="summary-title">Final Scorecard</h2>
          <p className="summary-subtitle">{subtitle}</p>
        </div>

        <div className="summary-board">
          {orderedSquares.map((square) => (
            <article
              key={square.cell.id}
              className={`summary-square ${square.answer?.revealed ? "revealed" : "solved"}`}
            >
              <span className="summary-square-index">{square.index}</span>
              <strong className="summary-square-name">
                {square.answer?.playerName ?? "—"}
              </strong>
              <span className="summary-square-meta">
                {square.answer
                  ? square.answer.revealed
                    ? "Revealed"
                    : `${square.answer.rarityPercent.toFixed(1)}% rarity`
                  : "No answer"}
              </span>
            </article>
          ))}
        </div>

        <div className="summary-stats">
          <article className="summary-stat-card">
            <span>Hits</span>
            <strong>{correctCount}</strong>
          </article>
          <article className="summary-stat-card">
            <span>Misses</span>
            <strong>{misses}</strong>
          </article>
          <article className="summary-stat-card">
            <span>Final</span>
            <strong>
              {correctCount} / {orderedSquares.length}
            </strong>
          </article>
          <article className="summary-stat-card accent">
            <span>Rarity Score</span>
            <strong>{score.toFixed(1)}</strong>
          </article>
        </div>

        <div className="summary-sections">
          <section className="summary-section">
            <h3>Solved Squares</h3>
            {solvedSquares.length > 0 ? (
              <div className="summary-list">
                {solvedSquares.map((square) => (
                  <div key={square.cell.id} className="summary-list-item">
                    <span className="summary-badge">{square.index}</span>
                    <div>
                      <strong>{square.answer?.playerName}</strong>
                      <small>{square.answer?.rarityPercent.toFixed(1)}% rarity</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="summary-empty">No correct players this round.</p>
            )}
          </section>

          <section className="summary-section">
            <h3>Revealed At End</h3>
            {revealedSquares.length > 0 ? (
              <div className="summary-list">
                {revealedSquares.map((square) => (
                  <div key={square.cell.id} className="summary-list-item revealed">
                    <span className="summary-badge">{square.index}</span>
                    <div>
                      <strong>{square.answer?.playerName}</strong>
                      <small>Shown after the board closed</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="summary-empty">Every square was solved before reveal.</p>
            )}
          </section>
        </div>

        <div className="summary-actions">
          <button className="summary-button secondary" type="button" onClick={onClose}>
            Review Board
          </button>
          <button className="summary-button" type="button" onClick={onNewGrid}>
            New Grid
          </button>
        </div>
      </section>
    </div>
  );
}
