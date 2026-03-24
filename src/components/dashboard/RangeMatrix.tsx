import { HAND_ORDER, handMatrixCell } from "../../lib/cards";

type RangeMatrixProps = {
  rangeMatrix: Record<string, number>;
  setRangeMatrix: (value: Record<string, number>) => void;
  selectedMatrixHand: string;
  setSelectedMatrixHand: (value: string) => void;
};

export function RangeMatrix({
  rangeMatrix,
  setRangeMatrix,
  selectedMatrixHand,
  setSelectedMatrixHand,
}: RangeMatrixProps) {
  const selectedWeight = rangeMatrix[selectedMatrixHand] ?? 0;

  function adjustSelectedHand(delta: number) {
    setRangeMatrix({
      ...rangeMatrix,
      [selectedMatrixHand]: Math.max(
        0,
        Math.min(1, Number((selectedWeight + delta).toFixed(2)))
      ),
    });
  }

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
      <h3 style={{ marginTop: 0 }}>Range Matrix</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "28px repeat(13, 1fr)",
          gap: 4,
          minWidth: 680,
          overflowX: "auto",
          fontSize: 12,
        }}
      >
        <div />
        {HAND_ORDER.map((rank) => (
          <div key={`top-${rank}`} style={{ textAlign: "center" }}>
            {rank}
          </div>
        ))}

        {HAND_ORDER.map((rowRank) => (
          <div key={rowRank} style={{ display: "contents" }}>
            <div style={{ textAlign: "center" }}>{rowRank}</div>

            {HAND_ORDER.map((colRank) => {
              const hand = handMatrixCell(rowRank, colRank);
              const weight = rangeMatrix[hand] ?? 0;

              let background = "#ffffff";
              if (weight > 0.75) background = "#7dd3fc";
              else if (weight > 0.5) background = "#c4b5fd";
              else if (weight > 0.25) background = "#f9a8d4";
              else if (weight > 0.05) background = "#bbf7d0";

              return (
                <button
                  key={hand}
                  onClick={() => setSelectedMatrixHand(hand)}
                  style={{
                    aspectRatio: "1 / 1",
                    border: selectedMatrixHand === hand ? "2px solid black" : "1px solid #ccc",
                    borderRadius: 8,
                    background,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  {hand}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Selected:</strong> {selectedMatrixHand}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Weight:</strong> {(selectedWeight * 100).toFixed(0)}%
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => adjustSelectedHand(-0.1)}>-10%</button>
          <button onClick={() => adjustSelectedHand(-0.02)}>-2%</button>
          <button onClick={() => adjustSelectedHand(0.02)}>+2%</button>
          <button onClick={() => adjustSelectedHand(0.1)}>+10%</button>
        </div>
      </div>
    </div>
  );
}