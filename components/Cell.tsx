import type { AnswerRecord } from "@/lib/types";

type CellProps = {
  label: string;
  answer?: AnswerRecord;
  disabled: boolean;
  onClick: () => void;
};

export default function Cell({ label, answer, disabled, onClick }: CellProps) {
  const stateClass = answer ? (answer.revealed ? "revealed" : "locked") : "empty";

  return (
    <button
      aria-label={label}
      className={`grid-cell ${stateClass}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="cell-label">{answer ? (answer.revealed ? "Answer" : "Locked In") : "Tap to answer"}</span>
      <span className="cell-player">{answer ? answer.playerName : "+"}</span>
      <span className={`cell-rarity ${answer ? "" : "muted"}`}>
        {answer ? `${answer.rarityPercent.toFixed(1)}% rarity` : "Must satisfy both categories"}
      </span>
    </button>
  );
}
