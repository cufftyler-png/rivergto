type ScenarioBuilderProps = {
  heroInput: string;
  setHeroInput: (value: string) => void;
  boardInput: string;
  setBoardInput: (value: string) => void;
  heroPos: string;
  setHeroPos: (value: string) => void;
  villainPos: string;
  setVillainPos: (value: string) => void;
  reactionType: string;
  setReactionType: (value: string) => void;
  pot: number;
  setPot: (value: number) => void;
  callAmount: number;
  setCallAmount: (value: number) => void;
};

const POSITIONS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const REACTIONS = ["Open", "3-Bet", "4-Bet", "5-Bet"];

export function ScenarioBuilder({
  heroInput,
  setHeroInput,
  boardInput,
  setBoardInput,
  heroPos,
  setHeroPos,
  villainPos,
  setVillainPos,
  reactionType,
  setReactionType,
  pot,
  setPot,
  callAmount,
  setCallAmount,
}: ScenarioBuilderProps) {
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
      <h3 style={{ marginTop: 0 }}>Scenario Builder</h3>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Hero Hand</label>
          <input
            value={heroInput}
            onChange={(e) => setHeroInput(e.target.value)}
            placeholder="As Kh"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Board</label>
          <input
            value={boardInput}
            onChange={(e) => setBoardInput(e.target.value)}
            placeholder="Qd Jh 3c"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Hero Position</label>
          <select value={heroPos} onChange={(e) => setHeroPos(e.target.value)}>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Villain Position</label>
          <select value={villainPos} onChange={(e) => setVillainPos(e.target.value)}>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Facing</label>
          <select value={reactionType} onChange={(e) => setReactionType(e.target.value)}>
            {REACTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Current Pot</label>
          <input
            type="number"
            value={pot}
            onChange={(e) => setPot(Number(e.target.value) || 0)}
            min={0}
            step={1}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Call Amount</label>
          <input
            type="number"
            value={callAmount}
            onChange={(e) => setCallAmount(Number(e.target.value) || 0)}
            min={0}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}