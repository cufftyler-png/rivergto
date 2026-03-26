import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

const POSITIONS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const REACTIONS = ["Open", "3-Bet", "4-Bet", "5-Bet"];
const STREETS = ["Pre-flop", "Flop", "Turn", "River"];
const BET_SIZES = [25, 50, 75, 100];
const STORAGE_KEY = "rivergto_saved_spots_v1";

const BRAND = "#22D3EE";
const BRAND_2 = "#8B5CF6";
const BG = "#020617";
const API_BASE_URL = "https://rivergto.onrender.com";

const SEAT_POS: Record<string, { left: string; top: string }> = {
  UTG: { left: "50%", top: "8%" },
  HJ: { left: "84%", top: "28%" },
  CO: { left: "84%", top: "72%" },
  BTN: { left: "50%", top: "88%" },
  SB: { left: "16%", top: "72%" },
  BB: { left: "16%", top: "28%" },
};

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = ["s", "h", "d", "c"];
const suitSymbol: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

type SavedSpot = {
  name: string;
  heroPos: string;
  villainPos: string;
  reaction: string;
  street: string;
  pot: number;
  call: number;
  heroCards: string[];
  villainCards: string[];
  board: string[];
  hideVillainCards: boolean;
};

function buildDeck() {
  const deck: string[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(r + s);
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function removeCards(deck: string[], used: string[]) {
  const usedSet = new Set(used.filter(Boolean));
  return deck.filter((c) => !usedSet.has(c));
}

function streetBoardCount(street: string) {
  if (street === "Pre-flop") return 0;
  if (street === "Flop") return 3;
  if (street === "Turn") return 4;
  return 5;
}

function clampBoardToStreet(board: string[], street: string) {
  const needed = streetBoardCount(street);
  const next = [...board];
  for (let i = 0; i < 5; i++) {
    if (i >= needed) next[i] = "";
  }
  return next;
}

function randomizeHand(excluded: string[]) {
  const deck = shuffle(removeCards(buildDeck(), excluded));
  return [deck[0], deck[1]];
}

function randomizeBoardForStreet(street: string, used: string[]) {
  const needed = streetBoardCount(street);
  const next = ["", "", "", "", ""];
  const deck = shuffle(removeCards(buildDeck(), used));
  for (let i = 0; i < needed; i++) {
    next[i] = deck[i];
  }
  return next;
}

function advanceStreet(
  street: string,
  board: string[],
  heroCards: string[],
  villainCards: string[],
  hideVillainCards: boolean
) {
  const used = [...heroCards, ...(hideVillainCards ? [] : villainCards), ...board.filter(Boolean)];
  if (street === "Pre-flop") {
    const deck = shuffle(removeCards(buildDeck(), used));
    return {
      street: "Flop",
      board: [deck[0], deck[1], deck[2], "", ""],
    };
  }
  if (street === "Flop") {
    const deck = shuffle(removeCards(buildDeck(), used));
    return {
      street: "Turn",
      board: [board[0], board[1], board[2], deck[0], ""],
    };
  }
  if (street === "Turn") {
    const deck = shuffle(removeCards(buildDeck(), used));
    return {
      street: "River",
      board: [board[0], board[1], board[2], board[3], deck[0]],
    };
  }
  return { street: "River", board };
}

function cardColor(card: string, faceDown = false) {
  if (faceDown) return "#94a3b8";
  if (!card) return "#ddd";
  const s = card[1];
  if (s === "h") return "#ef4444";
  if (s === "d") return "#f97316";
  if (s === "c") return "#22c55e";
  return BRAND;
}

function pill(active: boolean): React.CSSProperties {
  return {
    padding: "8px 15px",
    borderRadius: 999,
    border: active ? `2px solid ${BRAND}` : "1px solid #475569",
    background: active
      ? `linear-gradient(135deg, ${BRAND}, ${BRAND_2})`
      : "#111827",
    color: active ? "#04111d" : "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  };
}

function softPanelStyle(): React.CSSProperties {
  return {
    padding: 16,
    borderRadius: 22,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function Card({
  card,
  onClick,
  disabled,
  faceDown = false,
}: {
  card?: string;
  onClick?: () => void;
  disabled?: boolean;
  faceDown?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 44,
        height: 62,
        borderRadius: 12,
        background: faceDown ? "#1e293b" : "#0f172a",
        border: "1px solid #475569",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: cardColor(card || "", faceDown),
        cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
      }}
    >
      {faceDown ? (
        <div style={{ fontSize: 16 }}>🂠</div>
      ) : card ? (
        <>
          <div style={{ fontWeight: 700 }}>{card[0]}</div>
          <div style={{ fontSize: 18 }}>{suitSymbol[card[1]]}</div>
        </>
      ) : (
        <div style={{ color: "#94a3b8", fontSize: 11 }}>Pick</div>
      )}
    </button>
  );
}

function getUsedCards(heroCards: string[], villainCards: string[], board: string[], hideVillainCards: boolean) {
  return [...heroCards, ...(hideVillainCards ? [] : villainCards), ...board].filter(Boolean);
}

function isCardUsed(
  card: string,
  heroCards: string[],
  villainCards: string[],
  board: string[],
  hideVillainCards: boolean,
  exempt?: string
) {
  const used = getUsedCards(heroCards, villainCards, board, hideVillainCards);
  return used.some((c) => c === card && c !== exempt);
}

function setCardNoDupes(
  prev: string[],
  index: number,
  card: string,
  heroCards: string[],
  villainCards: string[],
  board: string[],
  hideVillainCards: boolean,
  currentCard: string
) {
  if (isCardUsed(card, heroCards, villainCards, board, hideVillainCards, currentCard)) return prev;
  const next = [...prev];
  next[index] = card;
  return next;
}

function comboLabel(i: number, j: number) {
  const r1 = RANKS[i];
  const r2 = RANKS[j];
  if (i === j) return `${r1}${r2}`;
  if (i < j) return `${r1}${r2}s`;
  return `${r2}${r1}o`;
}

function getRangeWeight(label: string, reaction: string) {
  const premium = ["AA", "KK", "QQ", "AKs", "AKo", "AQs"];
  const strong = ["JJ", "TT", "99", "AJs", "KQs", "AQo", "KQo", "QJs"];
  const playable = ["88", "77", "ATs", "KJs", "QTs", "JTs", "T9s", "98s", "AJo"];

  let base = 0.02;
  if (premium.includes(label)) base = 0.95;
  else if (strong.includes(label)) base = 0.68;
  else if (playable.includes(label)) base = 0.38;
  else if (label.includes("s")) base = 0.16;
  else if (label.endsWith("o")) base = 0.08;
  else if (label.length === 2) base = 0.22;

  if (reaction === "3-Bet") base *= 0.72;
  if (reaction === "4-Bet") base *= 0.42;
  if (reaction === "5-Bet") base *= 0.25;

  return Math.max(0, Math.min(1, Number(base.toFixed(2))));
}

function rangeColor(weight: number) {
  if (weight >= 0.8) return "rgba(34,211,238,0.95)";
  if (weight >= 0.55) return "rgba(59,130,246,0.9)";
  if (weight >= 0.3) return "rgba(139,92,246,0.82)";
  if (weight >= 0.12) return "rgba(34,197,94,0.65)";
  return "rgba(255,255,255,0.06)";
}

function buildNormalizedActionMix(actionMix: { action: string; freq: number }[] = []) {
  if (!actionMix.length) return [];

  const total = actionMix.reduce((sum, item) => sum + (item.freq || 0), 0);
  if (total <= 0) {
    return actionMix.map((item) => ({ ...item, pct: 0 }));
  }

  const normalized = actionMix.map((item) => ({
    ...item,
    pct: Number(((item.freq / total) * 100).toFixed(1)),
  }));

  const currentTotal = normalized.reduce((sum, item) => sum + item.pct, 0);
  const diff = Number((100 - currentTotal).toFixed(1));

  if (normalized.length > 0 && diff !== 0) {
    normalized[normalized.length - 1].pct = Number(
      (normalized[normalized.length - 1].pct + diff).toFixed(1)
    );
  }

  return normalized;
}

function actionColor(action: string) {
  if (action === "Fold") return "#ef4444";
  if (action === "Call" || action === "Check") return "#22c55e";
  if (action === "Raise") return "#8B5CF6";
  if (action.includes("%")) return "#22D3EE";
  return "#64748b";
}

function ActionMixStackedBar({
  actionMix,
}: {
  actionMix: { action: string; freq: number }[];
}) {
  const normalized = buildNormalizedActionMix(actionMix);

  return (
    <div>
      <div
        style={{
          width: "100%",
          height: 48,
          borderRadius: 999,
          overflow: "hidden",
          display: "flex",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {normalized.map((item, index) => (
          <div
            key={`${item.action}-${index}`}
            style={{
              width: `${item.pct}%`,
              background: actionColor(item.action),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 12,
              minWidth: item.pct > 0 ? 38 : 0,
              whiteSpace: "nowrap",
            }}
            title={`${item.action}: ${item.pct}%`}
          >
            {item.pct >= 8 ? `${item.action} ${item.pct}%` : item.pct >= 4 ? `${item.pct}%` : ""}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 10,
        }}
      >
        {normalized.map((item, index) => (
          <div
            key={`legend-${item.action}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: actionColor(item.action),
              }}
            />
            <div>
              {item.action}: {item.pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RangeMatrix({ reaction }: { reaction: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(13, 1fr)",
        gap: 2,
      }}
    >
      {RANKS.map((_, i) =>
        RANKS.map((__, j) => {
          const label = comboLabel(i, j);
          const weight = getRangeWeight(label, reaction);
          return (
            <div
              key={label}
              title={`${label}: ${(weight * 100).toFixed(0)}%`}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 6,
                background: rangeColor(weight),
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "white",
                minHeight: 22,
              }}
            >
              {label}
            </div>
          );
        })
      )}
    </div>
  );
}

function CardPicker({
  title,
  cards,
  onPick,
  heroCards,
  villainCards,
  board,
  hideVillainCards,
  visibleSlots,
}: {
  title: string;
  cards: string[];
  onPick: (slot: number, card: string) => void;
  heroCards: string[];
  villainCards: string[];
  board: string[];
  hideVillainCards: boolean;
  visibleSlots: number;
}) {
  const [slot, setSlot] = useState(0);
  const current = cards[slot] || "";

  useEffect(() => {
    if (slot >= visibleSlots) setSlot(Math.max(0, visibleSlots - 1));
  }, [visibleSlots, slot]);

  return (
    <div style={softPanelStyle()}>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{title}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {cards.slice(0, visibleSlots).map((card: string, i: number) => (
          <div
            key={i}
            style={{ outline: slot === i ? `2px solid ${BRAND}` : "none", borderRadius: 14 }}
          >
            <Card card={card} onClick={() => setSlot(i)} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 4, marginBottom: 6 }}>
        {RANKS.map((rank) => {
          const target = `${rank}${current[1] || "s"}`;
          const disabled = isCardUsed(target, heroCards, villainCards, board, hideVillainCards, current);
          return (
            <button key={rank} onClick={() => onPick(slot, target)} disabled={disabled} style={pill(false)}>
              {rank}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {SUITS.map((s) => {
          const target = `${current[0] || "A"}${s}`;
          const disabled = isCardUsed(target, heroCards, villainCards, board, hideVillainCards, current);
          return (
            <button key={s} onClick={() => onPick(slot, target)} disabled={disabled} style={pill(false)}>
              {suitSymbol[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Seat({
  pos,
  heroPos,
  villainPos,
  onDrop,
  onDragOver,
  onSeatDragStart,
  heroCards,
  villainCards,
  call,
  setCall,
  hideVillainCards,
}: any) {
  const seat = SEAT_POS[pos];
  const isHero = pos === heroPos;
  const isVillain = pos === villainPos;
  const cards = isHero ? heroCards : isVillain ? villainCards : [];

  const seatFill = isHero ? BRAND : isVillain ? "#ef4444" : "#0f172a";
  const seatLabel = isHero ? "Hero" : isVillain ? "Villain" : "";

  const layoutMap: Record<
    string,
    {
      cardMarginTop?: number;
      cardMarginBottom?: number;
      betMarginTop?: number;
      betMarginBottom?: number;
      sideOffset?: number;
    }
  > = {
    UTG: { cardMarginTop: 8, betMarginTop: 6 },
    HJ: { cardMarginTop: 8, betMarginTop: 6, sideOffset: 16 },
    CO: { cardMarginBottom: 8, betMarginTop: 6, sideOffset: 16 },
    BTN: { cardMarginBottom: 8, betMarginTop: 6 },
    SB: { cardMarginBottom: 8, betMarginTop: 6, sideOffset: -16 },
    BB: { cardMarginTop: 8, betMarginTop: 6, sideOffset: -16 },
  };

  const layout = layoutMap[pos] || {};
  const cardBlockStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: 4,
    marginTop: layout.cardMarginTop ?? 6,
    marginBottom: layout.cardMarginBottom ?? 0,
    position: "relative",
    left: layout.sideOffset ?? 0,
    zIndex: 3,
  };

  const betBlockStyle: React.CSSProperties = {
    marginTop: layout.betMarginTop ?? 6,
    marginBottom: layout.betMarginBottom ?? 0,
    position: "relative",
    left: layout.sideOffset ?? 0,
    zIndex: 3,
  };

  return (
    <div
      onDrop={() => onDrop(pos)}
      onDragOver={onDragOver}
      style={{
        position: "absolute",
        transform: "translate(-50%, -50%)",
        ...seat,
        textAlign: "center",
        width: 132,
        pointerEvents: "auto",
        zIndex: 2,
      }}
    >
      <div style={{ marginBottom: 4, fontSize: 11 }}>{pos}</div>

      <div
        draggable={isHero || isVillain}
        onDragStart={() => {
          if (isHero) onSeatDragStart("Hero");
          if (isVillain) onSeatDragStart("Villain");
        }}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: seatFill,
          border: "2px dashed rgba(255,255,255,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          margin: "0 auto",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          cursor: isHero || isVillain ? "grab" : "default",
          userSelect: "none",
          fontSize: 13,
        }}
      >
        {seatLabel}
      </div>

      {(isHero || (isVillain && !hideVillainCards)) && cards.length > 0 && (
        <div style={cardBlockStyle}>
          {cards.map((c: string, i: number) => (
            <Card key={i} card={c} />
          ))}
        </div>
      )}

      {(isHero || isVillain) && (
        <div style={betBlockStyle}>
          <input
            value={call}
            onChange={(e) => setCall(Number(e.target.value) || 0)}
            style={{
              width: 70,
              borderRadius: 999,
              border: "1px solid #475569",
              background: "#111827",
              color: "white",
              textAlign: "center",
              padding: "5px 8px",
              fontSize: 12,
            }}
          />
        </div>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div style={softPanelStyle()}>
      <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 2 }}>{title.toUpperCase()}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Panel({ title, comment, children }: any) {
  return (
    <div style={softPanelStyle()}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{title}</div>
      {comment && <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>{comment}</div>}
      {children}
    </div>
  );
}

export default function App() {
  const [heroPos, setHeroPos] = useState("BTN");
  const [villainPos, setVillainPos] = useState("BB");
  const [reaction, setReaction] = useState("Open");
  const [street, setStreet] = useState("Flop");
  const [drag, setDrag] = useState<string | null>(null);

  const [heroCards, setHeroCards] = useState(["As", "Kh"]);
  const [villainCards, setVillainCards] = useState(["Qd", "Qs"]);
  const [board, setBoard] = useState(["Qh", "Jc", "3d", "", ""]);

  const [pot, setPot] = useState(100);
  const [call, setCall] = useState(50);
  const [hideVillainCards, setHideVillainCards] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [savedName, setSavedName] = useState("My Spot");
  const [savedSpots, setSavedSpots] = useState<SavedSpot[]>([]);

  const visibleBoardSlots = streetBoardCount(street);

  const rangeMatrix = useMemo(() => reaction, [reaction]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedSpots(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSpots));
  }, [savedSpots]);

  useEffect(() => {
    setBoard((prev) => clampBoardToStreet(prev, street));
  }, [street]);

  function onDrop(pos: string) {
    if (drag === "Hero") {
      if (pos === villainPos) setVillainPos(heroPos);
      setHeroPos(pos);
    }
    if (drag === "Villain") {
      if (pos === heroPos) setHeroPos(villainPos);
      setVillainPos(pos);
    }
    setDrag(null);
  }

  function onSeatDragStart(role: "Hero" | "Villain") {
    setDrag(role);
  }

  function pickHero(index: number, card: string) {
    setHeroCards((prev) =>
      setCardNoDupes(prev, index, card, heroCards, villainCards, board, hideVillainCards, prev[index])
    );
  }

  function pickVillain(index: number, card: string) {
    setVillainCards((prev) =>
      setCardNoDupes(prev, index, card, heroCards, villainCards, board, hideVillainCards, prev[index])
    );
  }

  function pickBoard(index: number, card: string) {
    setBoard((prev) =>
      setCardNoDupes(prev, index, card, heroCards, villainCards, board, hideVillainCards, prev[index])
    );
  }

  function randomizeVillain() {
    const excluded = [...heroCards, ...board.filter(Boolean)];
    const next = randomizeHand(excluded);
    setVillainCards(next);
  }

  function randomizeBoard() {
    const excluded = [...heroCards, ...(hideVillainCards ? [] : villainCards)];
    setBoard(randomizeBoardForStreet(street, excluded));
  }

  function nextStreet() {
    const advanced = advanceStreet(street, board, heroCards, villainCards, hideVillainCards);
    setStreet(advanced.street);
    setBoard(advanced.board);
  }

  function saveSpot() {
    const spot: SavedSpot = {
      name: savedName || `Spot ${savedSpots.length + 1}`,
      heroPos,
      villainPos,
      reaction,
      street,
      pot,
      call,
      heroCards,
      villainCards,
      board,
      hideVillainCards,
    };
    setSavedSpots((prev) => [spot, ...prev].slice(0, 20));
  }

  function loadSpot(spot: SavedSpot) {
    setHeroPos(spot.heroPos);
    setVillainPos(spot.villainPos);
    setReaction(spot.reaction);
    setStreet(spot.street);
    setPot(spot.pot);
    setCall(spot.call);
    setHeroCards(spot.heroCards);
    setVillainCards(spot.villainCards);
    setBoard(spot.board);
    setHideVillainCards(spot.hideVillainCards);
    setSavedName(spot.name);
  }

  async function runSolve() {
    const villainCardsForSolve = hideVillainCards ? [] : villainCards;

    const payload = {
      heroPos,
      villainPos,
      reaction,
      pot,
      callAmount: call,
      heroCards,
      villainCards: villainCardsForSolve,
      boardCards: board.slice(0, visibleBoardSlots).filter(Boolean),
      betSizes: BET_SIZES,
      playerCount: reaction === "Open" ? 2 : reaction === "3-Bet" ? 3 : 4,
      street,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setResult(json);
    } catch {
      setResult({ error: "Backend not reachable." });
    }
  }

  const pieData = result
    ? [
        { name: "Hero", value: result.heroWins || 0 },
        { name: "Villain", value: result.villainWins || 0 },
        { name: "Tie", value: result.ties || 0 },
      ]
    : [];

  return (
    <div style={{ padding: 18, background: BG, color: "white", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div
          style={{
            padding: 18,
            borderRadius: 26,
            background: `linear-gradient(135deg, rgba(34,211,238,0.12), rgba(139,92,246,0.10), rgba(34,197,94,0.10))`,
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#93c5fd", marginBottom: 8 }}>
            RIVERGTO
          </div>
          <h1 style={{ fontSize: 30, margin: 0 }}>
            Interactive poker solver and range lab
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 16, marginBottom: 16 }}>
          <div style={softPanelStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Interactive table</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                  Hide villain cards to solve like a real hand without knowing exact holdings.
                </div>
              </div>
              <button onClick={runSolve} style={pill(true)}>Run Solve</button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              {REACTIONS.map((r) => (
                <button key={r} onClick={() => setReaction(r)} style={pill(reaction === r)}>{r}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {STREETS.map((s) => (
                <button key={s} onClick={() => setStreet(s)} style={pill(street === s)}>
                  {s}
                </button>
              ))}
              <button onClick={nextStreet} style={pill(false)}>Advance hand</button>
              <button onClick={randomizeBoard} style={pill(false)}>Randomize board</button>
              {!hideVillainCards && (
                <button onClick={randomizeVillain} style={pill(false)}>Randomize villain</button>
              )}
              <button onClick={() => setHideVillainCards((v) => !v)} style={pill(hideVillainCards)}>
                {hideVillainCards ? "Use range solve" : "Use exact villain cards"}
              </button>
            </div>

            <div
              style={{
                position: "relative",
                height: 580,
                borderRadius: 220,
                background: "radial-gradient(circle, #166534, #052e16)",
                overflow: "visible",
                paddingBottom: 24,
              }}
            >
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "74%", height: "70%", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)" }} />

              {POSITIONS.map((pos) => (
                <Seat
                  key={pos}
                  pos={pos}
                  heroPos={heroPos}
                  villainPos={villainPos}
                  onDrop={onDrop}
                  onDragOver={(e: any) => e.preventDefault()}
                  onSeatDragStart={onSeatDragStart}
                  heroCards={heroCards}
                  villainCards={villainCards}
                  call={call}
                  setCall={setCall}
                  hideVillainCards={hideVillainCards}
                />
              ))}

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -58%)",
                  textAlign: "center",
                }}
              >
                <div style={{ padding: 12, borderRadius: 20, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)", minWidth: 108 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#fde68a" }}>Pot</div>
                  <input
                    type="number"
                    value={pot}
                    onChange={(e) => setPot(Number(e.target.value) || 0)}
                    style={{ width: 82, marginTop: 6, borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "#111827", color: "white", textAlign: "center", padding: "7px 8px" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
                  {board.slice(0, visibleBoardSlots).map((c, i) => (
                    <Card key={i} card={c} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <CardPicker
              title="Hero hand picker"
              cards={heroCards}
              onPick={pickHero}
              heroCards={heroCards}
              villainCards={villainCards}
              board={board}
              hideVillainCards={hideVillainCards}
              visibleSlots={2}
            />

            {!hideVillainCards && (
              <CardPicker
                title="Villain hand picker"
                cards={villainCards}
                onPick={pickVillain}
                heroCards={heroCards}
                villainCards={villainCards}
                board={board}
                hideVillainCards={hideVillainCards}
                visibleSlots={2}
              />
            )}

            <CardPicker
              title={`Board picker (${street})`}
              cards={board}
              onPick={pickBoard}
              heroCards={heroCards}
              villainCards={villainCards}
              board={board}
              hideVillainCards={hideVillainCards}
              visibleSlots={visibleBoardSlots}
            />

            <Panel title="Range matrix" comment="Villain range chart">
              <RangeMatrix reaction={rangeMatrix} />
            </Panel>

            <Panel title="Save / Load hands" comment="Saved spots stay on this browser so you can revisit the same setup quickly.">
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={savedName}
                  onChange={(e) => setSavedName(e.target.value)}
                  style={{ flex: 1, borderRadius: 999, border: "1px solid #475569", background: "#111827", color: "white", padding: "9px 12px", fontSize: 12 }}
                />
                <button onClick={saveSpot} style={pill(true)}>Save</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {savedSpots.map((spot, i) => (
                  <button key={`${spot.name}-${i}`} onClick={() => loadSpot(spot)} style={pill(false)}>
                    {spot.name}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {result?.error && (
          <div style={{ ...softPanelStyle(), color: "#f87171", marginBottom: 14 }}>
            Backend error: {result.error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
          <Metric title="Recommendation" value={result?.recommendation || "-"} />
          <Metric title="Equity" value={typeof result?.equity === "number" ? `${(result.equity * 100).toFixed(1)}%` : "-"} />
          <Metric title="Pot Odds" value={`${((call / (pot + call || 1)) * 100).toFixed(1)}%`} />
          <Metric title="Street" value={street} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Panel title="Bet-size-specific outputs" comment="What sizing you should use">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 12 }}>
              {(result?.betSizes || BET_SIZES.map((x) => ({ action: `${x}%`, freq: 0 }))).map((item: any) => (
                <div key={item.action} style={{ padding: 12, borderRadius: 18, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: "#94a3b8" }}>{item.action}</div>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{Math.round(item.freq)}%</div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginTop: 8 }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, item.freq))}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg,${BRAND},${BRAND_2})` }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result?.betSizes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="freq" fill={BRAND} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Action mix and outcomes" comment="How often you should bet, check or fold">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <ActionMixStackedBar actionMix={result?.actionMix || []} />
              </div>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={72}>
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={[BRAND, "#ef4444", "#f59e0b"][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Panel title="Convergence" comment="Frequently choosing the best option converges to net positive winnings">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result?.convergence || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sims" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="equity" stroke={BRAND} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="EV curve" comment="">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result?.evCurve || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="street" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ev" stroke={BRAND_2} strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Multi-player tree preview" comment="">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(result?.multiTree || []).map((step: string, i: number) => (
              <div key={i} style={{ ...pill(false), background: "rgba(255,255,255,0.06)" }}>
                {i + 1}. {step}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}