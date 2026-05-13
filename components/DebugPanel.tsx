type DebugPanelProps = {
  playerCount: number;
  statsRows: number;
  advancedStatsRows: number;
  externalRows: number;
  categoryCount: number;
  rowLabels: string[];
  columnLabels: string[];
};

export default function DebugPanel({
  playerCount,
  statsRows,
  advancedStatsRows,
  externalRows,
  categoryCount,
  rowLabels,
  columnLabels,
}: DebugPanelProps) {
  return (
    <details className="debug-panel">
      <summary>Debug</summary>
      <div className="debug-grid">
        <div>
          <span>Players loaded</span>
          <strong>{playerCount}</strong>
        </div>
        <div>
          <span>Stats rows</span>
          <strong>{statsRows}</strong>
        </div>
        <div>
          <span>Advanced Stats rows</span>
          <strong>{advancedStatsRows}</strong>
        </div>
        <div>
          <span>External rows</span>
          <strong>{externalRows}</strong>
        </div>
        <div>
          <span>Categories generated</span>
          <strong>{categoryCount}</strong>
        </div>
      </div>

      <div className="debug-block">
        <span>Current row categories</span>
        <div className="debug-pills">
          {rowLabels.map((label) => (
            <span key={label} className="debug-pill">
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="debug-block">
        <span>Current column categories</span>
        <div className="debug-pills">
          {columnLabels.map((label) => (
            <span key={label} className="debug-pill">
              {label}
            </span>
          ))}
        </div>
      </div>
    </details>
  );
}
