type HeroPanelProps = {
  status: string;
  progress: number;
  recommendation?: string;
  onRun: () => void;
};

export function HeroPanel({
  status,
  progress,
  recommendation,
  onRun,
}: HeroPanelProps) {
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
      <h2 style={{ marginTop: 0 }}>Poker Solver Dashboard</h2>
      <div style={{ marginBottom: 8 }}>
        <strong>Recommendation:</strong> {recommendation ?? "-"}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Progress:</strong> {progress}%
      </div>
      <button onClick={onRun}>Run Solver</button>
    </div>
  );
}