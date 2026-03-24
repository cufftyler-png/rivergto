import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { HAND_ORDER, handMatrixCell } from "../../lib/cards";

type ChartsPanelProps = {
  result: any;
  rangeMatrix?: Record<string, number>;
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#f59e0b"];

function buildEvCurve(result: any) {
  const equity = typeof result?.equity === "number" ? result.equity : 0;
  const heroWins = typeof result?.heroWins === "number" ? result.heroWins : 0;
  const villainWins = typeof result?.villainWins === "number" ? result.villainWins : 0;
  const ties = typeof result?.ties === "number" ? result.ties : 0;
  const total = heroWins + villainWins + ties || 1;

  const flopEV = Number((equity * 0.35 - 0.08).toFixed(3));
  const turnEV = Number((equity * 0.55 - 0.1).toFixed(3));
  const riverEV = Number((equity * 0.8 - 0.12).toFixed(3));
  const showdownEV = Number(((heroWins + ties * 0.5) / total - villainWins / total).toFixed(3));

  return [
    { street: "Flop", ev: flopEV },
    { street: "Turn", ev: turnEV },
    { street: "River", ev: riverEV },
    { street: "Showdown", ev: showdownEV },
  ];
}

function buildHeatmapData(rangeMatrix: Record<string, number>) {
  return HAND_ORDER.map((rowRank) => {
    const row: Record<string, string | number> = { row: rowRank };
    for (const colRank of HAND_ORDER) {
      const hand = handMatrixCell(rowRank, colRank);
      row[colRank] = rangeMatrix[hand] ?? 0;
    }
    return row;
  });
}

function heatColor(weight: number) {
  if (weight > 0.75) return "#38bdf8";
  if (weight > 0.5) return "#a78bfa";
  if (weight > 0.25) return "#f472b6";
  if (weight > 0.05) return "#86efac";
  return "#f3f4f6";
}

export function ChartsPanel({ result, rangeMatrix = {} }: ChartsPanelProps) {
  const actionMixData = Array.isArray(result?.actionMix) ? result.actionMix : [];
  const topMatchupData = Array.isArray(result?.topMatchups) ? result.topMatchups : [];

  const pieData =
    typeof result?.heroWins === "number" &&
    typeof result?.villainWins === "number" &&
    typeof result?.ties === "number"
      ? [
          { name: "Hero Wins", value: result.heroWins },
          { name: "Villain Wins", value: result.villainWins },
          { name: "Ties", value: result.ties },
        ]
      : [];

  const evCurveData = buildEvCurve(result);
  const heatmapData = buildHeatmapData(rangeMatrix);

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
      <h3 style={{ marginTop: 0 }}>Charts Panel</h3>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>Action Mix</h4>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={actionMixData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="action" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="freq" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>Win / Loss / Tie Breakdown</h4>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>EV Curve</h4>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={evCurveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="street" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ev" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>Top Villain Matchups</h4>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={topMatchupData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="hand" type="category" width={60} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: 8 }}>Range Heatmap</h4>
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px repeat(13, 44px)",
              gap: 4,
              minWidth: 640,
              alignItems: "center",
            }}
          >
            <div />
            {HAND_ORDER.map((rank) => (
              <div
                key={`top-${rank}`}
                style={{ textAlign: "center", fontSize: 12, fontWeight: 600 }}
              >
                {rank}
              </div>
            ))}

            {heatmapData.map((row) => (
              <div key={String(row.row)} style={{ display: "contents" }}>
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600 }}>
                  {row.row}
                </div>
                {HAND_ORDER.map((colRank) => {
                  const value = Number(row[colRank] ?? 0);
                  return (
                    <div
                      key={`${row.row}-${colRank}`}
                      title={`${handMatrixCell(String(row.row), colRank)}: ${(value * 100).toFixed(0)}%`}
                      style={{
                        width: 44,
                        height: 44,
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: heatColor(value),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      {(value * 100).toFixed(0)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}