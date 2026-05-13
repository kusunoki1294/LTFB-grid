import Cell from "@/components/Cell";
import type { AnswerRecord, Category, GridCellDefinition } from "@/lib/types";

type GridProps = {
  rowCategories: Category[];
  columnCategories: Category[];
  cells: GridCellDefinition[][];
  answers: Record<string, AnswerRecord>;
  canSelect: boolean;
  onCellClick: (cellId: string) => void;
};

export default function Grid({
  rowCategories,
  columnCategories,
  cells,
  answers,
  canSelect,
  onCellClick,
}: GridProps) {
  return (
    <div className="grid-wrapper">
      <div className="grid-board">
        <div className="corner-card">
          <span className="board-label">3 x 3</span>
          <strong>Lower rarity wins</strong>
        </div>

        {columnCategories.map((category) => (
          <div key={category.id} className="category-card column">
            <span>{category.label}</span>
            <small>{category.matchCount} players match</small>
          </div>
        ))}

        {cells.map((row, rowIndex) => (
          <div key={rowCategories[rowIndex].id} className="grid-row">
            <div className="category-card row">
              <span>{rowCategories[rowIndex].label}</span>
              <small>{rowCategories[rowIndex].matchCount} players match</small>
            </div>

            {row.map((cell, columnIndex) => {
              const answer = answers[cell.id];
              const cellLabel = `${rowCategories[rowIndex].label} and ${columnCategories[columnIndex].label}`;

              return (
                <Cell
                  key={cell.id}
                  answer={answer}
                  disabled={!canSelect || Boolean(answer)}
                  label={cellLabel}
                  onClick={() => onCellClick(cell.id)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
