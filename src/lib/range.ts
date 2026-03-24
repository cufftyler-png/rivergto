import { HAND_ORDER, handMatrixCell } from "./cards";

function buildEmptyMatrix(): Record<string, number> {
  const matrix: Record<string, number> = {};

  for (const rowRank of HAND_ORDER) {
    for (const colRank of HAND_ORDER) {
      const hand = handMatrixCell(rowRank, colRank);
      matrix[hand] = 0;
    }
  }

  return matrix;
}

function applyWeights(
  base: Record<string, number>,
  updates: Record<string, number>
): Record<string, number> {
  return { ...base, ...updates };
}

function scaleMatrix(
  matrix: Record<string, number>,
  scale: number
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(matrix)) {
    out[key] = Number(Math.max(0, Math.min(1, matrix[key] * scale)).toFixed(2));
  }
  return out;
}

function keepOnlyStrongHands(matrix: Record<string, number>): Record<string, number> {
  const strong = new Set([
    "AA", "KK", "QQ", "JJ", "TT",
    "AKs", "AQs", "AKo", "AQo", "AJs", "KQs"
  ]);

  const out: Record<string, number> = {};
  for (const key of Object.keys(matrix)) {
    out[key] = strong.has(key) ? matrix[key] : 0;
  }
  return out;
}

function keepOnlyVeryStrongHands(matrix: Record<string, number>): Record<string, number> {
  const strong = new Set([
    "AA", "KK", "QQ", "JJ",
    "AKs", "AQs", "AKo"
  ]);

  const out: Record<string, number> = {};
  for (const key of Object.keys(matrix)) {
    out[key] = strong.has(key) ? matrix[key] : 0;
  }
  return out;
}

export function getPresetMatrix(
  heroPos: string,
  villainPos: string,
  reactionType: string
): Record<string, number> {
  let matrix = buildEmptyMatrix();

  if (heroPos === "BTN" && villainPos === "BB") {
    matrix = applyWeights(matrix, {
      AA: 1, KK: 1, QQ: 1, JJ: 0.95, TT: 0.9, "99": 0.8, "88": 0.7,
      AKs: 1, AQs: 0.95, AJs: 0.85, ATs: 0.75, A9s: 0.55,
      KQs: 0.85, KJs: 0.7, KTs: 0.55,
      QJs: 0.8, QTs: 0.65,
      JTs: 0.8, T9s: 0.75, "98s": 0.65, "87s": 0.5, "76s": 0.35,
      AKo: 0.95, AQo: 0.8, AJo: 0.55, KQo: 0.65
    });
  } else if (heroPos === "CO" && villainPos === "BTN") {
    matrix = applyWeights(matrix, {
      AA: 1, KK: 1, QQ: 1, JJ: 0.95, TT: 0.85, "99": 0.75, "88": 0.6, "77": 0.45,
      AKs: 1, AQs: 0.95, AJs: 0.85, ATs: 0.7, A9s: 0.45,
      KQs: 0.9, KJs: 0.75, KTs: 0.55,
      QJs: 0.8, QTs: 0.65, JTs: 0.8, T9s: 0.7, "98s": 0.55,
      AKo: 0.95, AQo: 0.8, AJo: 0.6, KQo: 0.7
    });
  } else if (heroPos === "UTG" && villainPos === "BB") {
    matrix = applyWeights(matrix, {
      AA: 1, KK: 1, QQ: 1, JJ: 0.95, TT: 0.85, "99": 0.7, "88": 0.55,
      AKs: 1, AQs: 0.9, AJs: 0.7, ATs: 0.45,
      KQs: 0.75, QJs: 0.55, JTs: 0.5,
      AKo: 0.95, AQo: 0.7, KQo: 0.45
    });
  } else if (heroPos === "SB" && villainPos === "BB") {
    matrix = applyWeights(matrix, {
      AA: 1, KK: 1, QQ: 1, JJ: 0.95, TT: 0.9, "99": 0.8, "88": 0.7, "77": 0.6,
      AKs: 1, AQs: 0.95, AJs: 0.85, ATs: 0.75, A9s: 0.65, A8s: 0.55, A7s: 0.45,
      KQs: 0.85, KJs: 0.75, KTs: 0.65, K9s: 0.5,
      QJs: 0.8, QTs: 0.7, JTs: 0.8, T9s: 0.75, "98s": 0.65, "87s": 0.55,
      AKo: 0.95, AQo: 0.85, AJo: 0.7, ATo: 0.55, KQo: 0.75
    });
  } else {
    matrix = applyWeights(matrix, {
      AA: 1, KK: 1, QQ: 1, JJ: 0.9, TT: 0.8,
      AKs: 0.95, AQs: 0.8, AJs: 0.65,
      KQs: 0.65, QJs: 0.5, JTs: 0.5,
      AKo: 0.85, AQo: 0.65, KQo: 0.5
    });
  }

  if (reactionType === "Open") {
    return matrix;
  }

  if (reactionType === "3-Bet") {
    return scaleMatrix(keepOnlyStrongHands(matrix), 0.95);
  }

  if (reactionType === "4-Bet") {
    return scaleMatrix(keepOnlyVeryStrongHands(matrix), 0.95);
  }

  if (reactionType === "5-Bet") {
    return applyWeights(buildEmptyMatrix(), {
      AA: 1,
      KK: 0.9,
      AKs: 0.55,
      AKo: 0.45,
      QQ: 0.35
    });
  }

  return matrix;
}