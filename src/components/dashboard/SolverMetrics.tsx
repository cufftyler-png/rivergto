type SolverMetricsProps = {
  equity?: number;
  progress: number;
  heroWins?: number;
  villainWins?: number;
  ties?: number;
  pot?: number;
  callAmount?: number;
};

export function SolverMetrics({
  equity,
  progress,
  heroWins,
  villainWins,
  ties,
  pot,
  callAmount,
}: SolverMetricsProps) {
  const potOdds =
    typeof pot === "number" && typeof callAmount === "number" && pot + callAmount > 0
      ? callAmount / (pot + callAmount)
      : undefined;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        background: "#f8f8f8",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Solver Metrics</h3>

      <div style={{ marginBottom: 8 }}>
        <strong>Equity:</strong>{" "}
        {typeof equity === "number" ? `${(equity * 100).toFixed(1)}%` : "-"}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Pot Odds:</strong>{" "}
        {typeof potOdds === "number" ? `${(potOdds * 100).toFixed(1)}%` : "-"}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Hero Wins:</strong> {heroWins ?? "-"}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Villain Wins:</strong> {villainWins ?? "-"}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Ties:</strong> {ties ?? "-"}
      </div>

      <div>
        <strong>Progress:</strong> {progress}%
      </div>
    </div>
  );
}