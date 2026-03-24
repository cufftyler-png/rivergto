type BackendPanelProps = {
  result: any;
  isSolving?: boolean;
  cacheSize?: number;
};

export function BackendPanel({
  result,
  isSolving = false,
  cacheSize = 0,
}: BackendPanelProps) {
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
      <h3 style={{ marginTop: 0 }}>Backend Panel</h3>

      <div style={{ marginBottom: 8 }}>
        <strong>State:</strong> {isSolving ? "Solving" : "Ready"}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Cache Size:</strong> {cacheSize}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Service:</strong> {result?.backendMeta?.service ?? "-"}
      </div>

      <div>
        <strong>Pipeline:</strong>{" "}
        {Array.isArray(result?.backendMeta?.pipeline)
          ? result.backendMeta.pipeline.join(" → ")
          : "-"}
      </div>
    </div>
  );
}