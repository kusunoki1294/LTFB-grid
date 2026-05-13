type FlashMessage = {
  tone: "info" | "error" | "success";
  text: string;
};

type GameHeaderProps = {
  guessesRemaining: number;
  correctCount: number;
  score: number;
  isGameOver: boolean;
  isBusy: boolean;
  answersShown: boolean;
  message: FlashMessage | null;
  onNewGrid: () => void;
  onGiveUp: () => void;
};

export default function GameHeader({
  guessesRemaining,
  correctCount,
  score,
  isGameOver,
  isBusy,
  answersShown,
  message,
  onNewGrid,
  onGiveUp,
}: GameHeaderProps) {
  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Immaculate Grid Style Game</p>
        <h1 className="hero-title">LTFB Grid</h1>
        <p className="hero-text">
          Fill each square with a player who satisfies both the row and column categories.
          Lower total rarity is better.
        </p>
      </div>

      <div className="hero-side">
        <div className="stat-row">
          <div className="stat-chip">
            <span>Guesses left</span>
            <strong>{guessesRemaining}</strong>
          </div>
          <div className="stat-chip">
            <span>Correct</span>
            <strong>{correctCount}/9</strong>
          </div>
          <div className="stat-chip">
            <span>{isGameOver ? "Final score" : "Score"}</span>
            <strong>{score.toFixed(1)}</strong>
          </div>
        </div>

        <div className="action-row">
          <button className="button" type="button" onClick={onNewGrid} disabled={isBusy}>
            {isBusy ? "Building..." : "New Grid"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={onGiveUp}
            disabled={isBusy || answersShown}
          >
            {answersShown ? "Answers Shown" : "Give Up / Show Answers"}
          </button>
        </div>
      </div>

      {message ? <div className={`flash ${message.tone}`}>{message.text}</div> : null}
    </header>
  );
}
