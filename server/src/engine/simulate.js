const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const SUITS = ["s", "h", "d", "c"];
const HAND_ORDER = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const POSITIONS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];

function rankValue(rank) {
  return "23456789TJQKA".indexOf(rank) + 2;
}

function buildDeck() {
  const deck = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(r + s);
    }
  }
  return deck;
}

function removeCards(deck, used) {
  const usedSet = new Set(used.filter(Boolean));
  return deck.filter((c) => !usedSet.has(c));
}

function canonicalHandKey(cards) {
  const [c1, c2] = cards;
  const r1 = c1[0];
  const r2 = c2[0];
  const s1 = c1[1];
  const s2 = c2[1];

  const i1 = HAND_ORDER.indexOf(r1);
  const i2 = HAND_ORDER.indexOf(r2);

  if (r1 === r2) return r1 + r2;

  const hi = i1 < i2 ? r1 : r2;
  const lo = i1 < i2 ? r2 : r1;

  return hi + lo + (s1 === s2 ? "s" : "o");
}

function allTwoCardCombos(deck) {
  const combos = [];
  for (let i = 0; i < deck.length - 1; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      combos.push([deck[i], deck[j]]);
    }
  }
  return combos;
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;

  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }

  return items[items.length - 1];
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sortDesc(nums) {
  return [...nums].sort((a, b) => b - a);
}

function evaluateFive(cards) {
  const vals = cards.map((c) => rankValue(c[0])).sort((a, b) => b - a);
  const counts = {};
  const suits = {};

  vals.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });

  cards.forEach((c) => {
    suits[c[1]] = (suits[c[1]] || 0) + 1;
  });

  const isFlush = Object.values(suits).some((x) => x === 5);

  let straightHigh = 0;
  const uniqAsc = [...new Set(vals)].sort((a, b) => a - b);

  if (uniqAsc.length === 5) {
    if (uniqAsc[4] - uniqAsc[0] === 4) straightHigh = uniqAsc[4];
    if (JSON.stringify(uniqAsc) === JSON.stringify([2, 3, 4, 5, 14])) {
      straightHigh = 5;
    }
  }

  const groups = Object.entries(counts)
    .map(([v, c]) => ({ v: Number(v), c }))
    .sort((a, b) => b.c - a.c || b.v - a.v);

  if (isFlush && straightHigh) return [8, straightHigh];
  if (groups[0].c === 4) return [7, groups[0].v, groups[1].v];
  if (groups[0].c === 3 && groups[1] && groups[1].c === 2) return [6, groups[0].v, groups[1].v];
  if (isFlush) return [5, ...vals];
  if (straightHigh) return [4, straightHigh];
  if (groups[0].c === 3) return [3, groups[0].v, ...sortDesc(groups.slice(1).map((g) => g.v))];
  if (groups[0].c === 2 && groups[1] && groups[1].c === 2) {
    const pairVals = sortDesc([groups[0].v, groups[1].v]);
    const kicker = groups[2].v;
    return [2, ...pairVals, kicker];
  }
  if (groups[0].c === 2) return [1, groups[0].v, ...sortDesc(groups.slice(1).map((g) => g.v))];
  return [0, ...vals];
}

function compareScores(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function bestOfSeven(cards) {
  let best = null;

  for (let a = 0; a < cards.length - 4; a++) {
    for (let b = a + 1; b < cards.length - 3; b++) {
      for (let c = b + 1; c < cards.length - 2; c++) {
        for (let d = c + 1; d < cards.length - 1; d++) {
          for (let e = d + 1; e < cards.length; e++) {
            const score = evaluateFive([
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e],
            ]);
            if (!best || compareScores(score, best) > 0) {
              best = score;
            }
          }
        }
      }
    }
  }

  return best;
}

function handStrengthFromKey(key) {
  if (!key) return 0;
  const r1 = key[0];
  const r2 = key[1];
  const v1 = rankValue(r1);
  const v2 = rankValue(r2);
  const pair = r1 === r2;
  const suited = key.endsWith("s");
  const broadway = v1 >= 10 && v2 >= 10;
  const connector = Math.abs(v1 - v2) === 1;

  let score = 0.05;
  if (pair) score += 0.35 + (v1 - 2) / 20;
  if (suited) score += 0.1;
  if (broadway) score += 0.1;
  if (connector) score += 0.08;
  score += (v1 + v2) / 40;

  return Math.min(1.5, score);
}

function buildFallbackMatrix(heroPos, villainPos, reactionType) {
  const matrix = {};
  const positionalBonus = {
    UTG: 0.82,
    HJ: 0.9,
    CO: 1.0,
    BTN: 1.08,
    SB: 0.98,
    BB: 1.0,
  };

  const heroScale = positionalBonus[heroPos] || 1;
  const villainScale = positionalBonus[villainPos] || 1;
  const reactionScale =
    reactionType === "Open" ? 1
    : reactionType === "3-Bet" ? 0.72
    : reactionType === "4-Bet" ? 0.48
    : 0.28;

  for (const r1 of HAND_ORDER) {
    for (const r2 of HAND_ORDER) {
      let key;
      if (r1 === r2) key = r1 + r2;
      else {
        const i1 = HAND_ORDER.indexOf(r1);
        const i2 = HAND_ORDER.indexOf(r2);
        key = i1 < i2 ? r1 + r2 + "s" : r2 + r1 + "o";
      }

      let w = handStrengthFromKey(key) * reactionScale * villainScale / heroScale;
      matrix[key] = Number(Math.max(0, Math.min(1, w)).toFixed(2));
    }
  }

  return matrix;
}

function normalizeMatrix(inputMatrix, heroPos, villainPos, reactionType) {
  const fallback = buildFallbackMatrix(heroPos, villainPos, reactionType);
  if (!inputMatrix || typeof inputMatrix !== "object") return fallback;

  const keys = Object.keys(inputMatrix);
  if (!keys.length) return fallback;

  const positive = keys.filter((k) => (inputMatrix[k] || 0) > 0);
  if (!positive.length) return fallback;

  return inputMatrix;
}

function buildWeightedVillainCombos(deck, matrix, deadMoneyFactor, boardPressure) {
  return allTwoCardCombos(deck)
    .map((combo) => {
      const key = canonicalHandKey(combo);
      const baseWeight = matrix[key] || 0;
      const strength = handStrengthFromKey(key);

      let adjusted = baseWeight;

      if (deadMoneyFactor > 0) {
        adjusted *= 1 + deadMoneyFactor * (strength > 0.65 ? 0.35 : -0.08);
      }

      if (boardPressure > 0) {
        adjusted *= 1 + boardPressure * (strength > 0.6 ? 0.18 : -0.05);
      }

      return {
        combo,
        key,
        weight: Math.max(0, adjusted),
      };
    })
    .filter((item) => item.weight > 0);
}

function classifyBoard(boardCards) {
  if (boardCards.length < 3) {
    return {
      name: "Partial board",
      wetness: 0.4,
      highCard: 0.5,
      paired: false,
    };
  }

  const ranks = boardCards.map((c) => rankValue(c[0]));
  const suits = boardCards.map((c) => c[1]);
  const uniqSuits = new Set(suits).size;
  const counts = {};
  ranks.forEach((r) => {
    counts[r] = (counts[r] || 0) + 1;
  });

  const paired = Object.values(counts).some((x) => x >= 2);
  const span = Math.max(...ranks) - Math.min(...ranks);
  const highCard = Math.max(...ranks) / 14;
  const wetness = Math.max(
    0,
    Math.min(
      1,
      (5 - Math.min(span, 5)) / 5 + (uniqSuits === 2 ? 0.22 : uniqSuits === 1 ? 0.4 : 0)
    )
  );

  let name = "Dynamic board";
  if (paired) name = "Paired board";
  if (wetness > 0.72) name = "Wet connected board";
  if (uniqSuits === 1) name = "Monotone board";

  return { name, wetness, highCard, paired };
}

function buildActionMix(equity, pot, callAmount, betSizes, reactionType, playerCount) {
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
  const edge = equity - potOdds;

  const mix = [];
  if (callAmount > 0) {
    mix.push({ action: "Fold", freq: edge > 0.12 ? 5 : edge > 0.03 ? 12 : edge > -0.03 ? 28 : 62 });
    mix.push({ action: "Call", freq: edge > 0.12 ? 34 : edge > 0.03 ? 58 : edge > -0.03 ? 54 : 28 });
  } else {
    mix.push({ action: "Check", freq: edge > 0.08 ? 18 : 42 });
  }

  const playerPenalty = playerCount >= 4 ? 0.78 : playerCount === 3 ? 0.9 : 1;
  const reactionBonus =
    reactionType === "Open" ? 1
    : reactionType === "3-Bet" ? 0.95
    : reactionType === "4-Bet" ? 0.82
    : 0.65;

  betSizes.forEach((size) => {
    const pressure = size / 100;
    let freq = 0;
    if (edge > 0.12) freq = 10 + pressure * 22;
    else if (edge > 0.03) freq = 7 + pressure * 16;
    else if (edge > -0.02) freq = 3 + pressure * 8;
    else freq = Math.max(0, 4 - pressure * 3);

    freq *= playerPenalty * reactionBonus;
    mix.push({ action: `${size}%`, freq: Number(freq.toFixed(1)) });
  });

  const total = mix.reduce((s, x) => s + x.freq, 0) || 1;
  return mix.map((x) => ({
    ...x,
    freq: Math.round((x.freq / total) * 100),
  }));
}

function buildMultiTree(reactionType, heroPos, villainPos, playerCount) {
  const filler = POSITIONS.filter((p) => ![heroPos, villainPos].includes(p)).slice(0, Math.max(0, playerCount - 2));
  if (reactionType === "Open") {
    return [
      `${villainPos} opens`,
      ...filler.map((p) => `${p} folds`),
      `${heroPos} responds`,
    ];
  }
  if (reactionType === "3-Bet") {
    return [
      `${filler[0] || "CO"} opens`,
      `${villainPos} 3-bets`,
      ...filler.slice(1).map((p) => `${p} folds`),
      `${heroPos} faces 3-bet`,
    ];
  }
  if (reactionType === "4-Bet") {
    return [
      `${filler[0] || "CO"} opens`,
      `${filler[1] || villainPos} 3-bets`,
      `${villainPos} 4-bets`,
      `${heroPos} decides`,
    ];
  }
  return [
    `${filler[0] || "CO"} opens`,
    `${filler[1] || "BTN"} 3-bets`,
    `${heroPos} 4-bets or flats prior`,
    `${villainPos} 5-bets`,
    `${heroPos} final node`,
  ];
}

function buildEvCurve(equity, playerCount, reactionType) {
  const multiPenalty = playerCount >= 4 ? 0.9 : playerCount === 3 ? 0.95 : 1;
  const reactionPenalty =
    reactionType === "Open" ? 1
    : reactionType === "3-Bet" ? 0.95
    : reactionType === "4-Bet" ? 0.88
    : 0.8;

  return [
    { street: "Flop", ev: Number((equity * 0.35 * multiPenalty * reactionPenalty - 0.08).toFixed(3)) },
    { street: "Turn", ev: Number((equity * 0.55 * multiPenalty * reactionPenalty - 0.1).toFixed(3)) },
    { street: "River", ev: Number((equity * 0.8 * multiPenalty * reactionPenalty - 0.12).toFixed(3)) },
    { street: "Showdown", ev: Number((equity * multiPenalty * reactionPenalty - 0.18).toFixed(3)) },
  ];
}

export async function runSolve(payload) {
  const {
    heroPos = "BTN",
    villainPos = "BB",
    reaction = "Open",
    pot = 100,
    callAmount = 50,
    heroCards = [],
    villainCards = [],
    boardCards = [],
    betSizes = [25, 50, 75, 100],
    matrix = null,
    playerCount = 2,
  } = payload || {};

  if (heroCards.length !== 2) {
    return { error: "Hero must have exactly 2 cards." };
  }

  if (villainCards.length === 2) {
    // if exact villain hole cards are given, solve directly against them
    const known = [...heroCards, ...villainCards, ...boardCards];
    if (new Set(known).size !== known.length) {
      return { error: "Duplicate cards detected." };
    }

    let heroWins = 0;
    let villainWins = 0;
    let ties = 0;
    const convergence = [];
    const iterations = 2500;
    const bucketSize = 125;

    for (let i = 0; i < iterations; i++) {
      const deck = removeCards(buildDeck(), known);
      const need = 5 - boardCards.length;
      const runout = shuffle(deck).slice(0, need);
      const fullBoard = [...boardCards, ...runout];

      const heroScore = bestOfSeven([...heroCards, ...fullBoard]);
      const villainScore = bestOfSeven([...villainCards, ...fullBoard]);
      const cmp = compareScores(heroScore, villainScore);

      if (cmp > 0) heroWins++;
      else if (cmp < 0) villainWins++;
      else ties++;

      if ((i + 1) % bucketSize === 0 || i === iterations - 1) {
        const totalSoFar = heroWins + villainWins + ties;
        convergence.push({
          sims: totalSoFar,
          equity: Number((((heroWins + 0.5 * ties) / totalSoFar) * 100).toFixed(2)),
        });
      }
    }

    const total = heroWins + villainWins + ties;
    const equity = (heroWins + 0.5 * ties) / total;

    return {
      equity,
      recommendation:
        equity > callAmount / (pot + callAmount) + 0.08 ? "Raise"
        : equity > callAmount / (pot + callAmount) ? "Call"
        : "Fold",
      actionMix: buildActionMix(equity, pot, callAmount, betSizes, reaction, playerCount),
      betSizes: betSizes.map((b) => ({
        action: `${b}%`,
        freq: Math.round(Math.max(1, equity * b * 0.7)),
      })),
      convergence,
      heroWins,
      villainWins,
      ties,
      evCurve: buildEvCurve(equity, playerCount, reaction),
      multiTree: buildMultiTree(reaction, heroPos, villainPos, playerCount),
      backendMeta: {
        service: "ExpressSolverService",
        pipeline: ["exact-villain", "runout-sim", "equity", "decision"],
        batchSize: iterations,
      },
    };
  }

  const normalizedMatrix = normalizeMatrix(matrix, heroPos, villainPos, reaction);
  const known = [...heroCards, ...boardCards].filter(Boolean);

  if (new Set(known).size !== known.length) {
    return { error: "Duplicate cards detected in hero or board." };
  }

  if (boardCards.length > 5) {
    return { error: "Board cannot have more than 5 cards." };
  }

  const boardProfile = classifyBoard(boardCards);
  const deadMoneyFactor = Math.min(0.45, Math.max(0, (playerCount - 2) * 0.14));
  const boardPressure = boardProfile.wetness * 0.22 + (boardProfile.paired ? 0.03 : 0);

  const deck = removeCards(buildDeck(), known);
  const villainCandidates = buildWeightedVillainCombos(
    deck,
    normalizedMatrix,
    deadMoneyFactor,
    boardPressure
  );

  if (!villainCandidates.length) {
    return { error: "No weighted villain combos available." };
  }

  const iterations =
    reaction === "5-Bet" ? 5000
    : reaction === "4-Bet" ? 4200
    : reaction === "3-Bet" ? 3600
    : 3000;

  let heroWins = 0;
  let villainWins = 0;
  let ties = 0;

  const matchupCounts = {};
  const equityByMatchup = {};
  const convergence = [];

  const bucketSize = Math.max(120, Math.floor(iterations / 20));

  for (let i = 0; i < iterations; i++) {
    const sampled = weightedPick(villainCandidates);
    const villainHand = sampled.combo;
    const villainKey = sampled.key;

    const used = [...known, ...villainHand];
    const runDeck = removeCards(buildDeck(), used);

    const need = 5 - boardCards.length;
    const runout = need > 0 ? shuffle(runDeck).slice(0, need) : [];
    const fullBoard = [...boardCards, ...runout];

    const heroScore = bestOfSeven([...heroCards, ...fullBoard]);
    const villainScore = bestOfSeven([...villainHand, ...fullBoard]);
    const cmp = compareScores(heroScore, villainScore);

    if (cmp > 0) heroWins++;
    else if (cmp < 0) villainWins++;
    else ties++;

    matchupCounts[villainKey] = (matchupCounts[villainKey] || 0) + 1;
    equityByMatchup[villainKey] = equityByMatchup[villainKey] || { wins: 0, total: 0 };
    if (cmp > 0) equityByMatchup[villainKey].wins += 1;
    else if (cmp === 0) equityByMatchup[villainKey].wins += 0.5;
    equityByMatchup[villainKey].total += 1;

    if ((i + 1) % bucketSize === 0 || i === iterations - 1) {
      const totalSoFar = heroWins + villainWins + ties;
      convergence.push({
        sims: totalSoFar,
        equity: Number((((heroWins + 0.5 * ties) / totalSoFar) * 100).toFixed(2)),
      });
    }
  }

  const total = heroWins + villainWins + ties;
  const equity = (heroWins + 0.5 * ties) / total;
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;

  const recommendation =
    equity > potOdds + 0.1 ? "Raise / Value"
    : equity > potOdds ? "Call"
    : "Fold";

  const topMatchups = Object.entries(matchupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([hand, count]) => ({
      hand,
      count,
      eq: Number((((equityByMatchup[hand]?.wins || 0) / (equityByMatchup[hand]?.total || 1)) * 100).toFixed(1)),
    }));

  return {
    equity,
    recommendation,
    heroWins,
    villainWins,
    ties,
    topMatchups,
    convergence,
    actionMix: buildActionMix(equity, pot, callAmount, betSizes, reaction, playerCount),
    betSizes: betSizes.map((b) => ({
      action: `${b}%`,
      freq: Math.round(
        Math.max(
          1,
          (equity - potOdds + 0.25) * b * (playerCount >= 4 ? 0.55 : playerCount === 3 ? 0.65 : 0.75)
        )
      ),
    })),
    evCurve: buildEvCurve(equity, playerCount, reaction),
    multiTree: buildMultiTree(reaction, heroPos, villainPos, playerCount),
    boardProfile,
    backendMeta: {
      service: "ExpressSolverService",
      pipeline: ["range-load", "weighted-sampling", "runout-sim", "equity", "tree-preview", "decision"],
      batchSize: iterations,
    },
  };
}