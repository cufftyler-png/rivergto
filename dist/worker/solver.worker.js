const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const SUITS = ["s", "h", "d", "c"];
const HAND_ORDER = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

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
  const usedSet = new Set(used);
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

function buildWeightedVillainCombos(deck, matrix) {
  return allTwoCardCombos(deck)
    .map((combo) => {
      const key = canonicalHandKey(combo);
      return {
        combo,
        key,
        weight: matrix[key] || 0,
      };
    })
    .filter((item) => item.weight > 0);
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

function buildActionMix(equity, pot, callAmount) {
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
  const edge = equity - potOdds;

  if (edge > 0.15) {
    return [
      { action: "Fold", freq: 5 },
      { action: "Call", freq: 35 },
      { action: "Raise", freq: 60 },
    ];
  }

  if (edge > 0.03) {
    return [
      { action: "Fold", freq: 10 },
      { action: "Call", freq: 65 },
      { action: "Raise", freq: 25 },
    ];
  }

  if (edge > -0.05) {
    return [
      { action: "Fold", freq: 30 },
      { action: "Call", freq: 60 },
      { action: "Raise", freq: 10 },
    ];
  }

  return [
    { action: "Fold", freq: 75 },
    { action: "Call", freq: 22 },
    { action: "Raise", freq: 3 },
  ];
}

self.onmessage = (event) => {
  const { requestId, payload } = event.data;
  const {
    heroCards = [],
    boardCards = [],
    matrix = {},
    iterations = 3000,
    pot = 100,
    callAmount = 50,
  } = payload;

  if (heroCards.length !== 2) {
    self.postMessage({
      requestId,
      result: { error: "Hero must have exactly 2 cards." },
    });
    return;
  }

  const known = [...heroCards, ...boardCards];
  if (new Set(known).size !== known.length) {
    self.postMessage({
      requestId,
      result: { error: "Duplicate cards detected in hero/board." },
    });
    return;
  }

  if (boardCards.length > 5) {
    self.postMessage({
      requestId,
      result: { error: "Board cannot have more than 5 cards." },
    });
    return;
  }

  self.postMessage({
    requestId,
    progress: 5,
    status: "Preparing deck",
  });

  const deck = removeCards(buildDeck(), known);
  const villainCandidates = buildWeightedVillainCombos(deck, matrix);

  if (!villainCandidates.length) {
    self.postMessage({
      requestId,
      result: { error: "No weighted villain combos available." },
    });
    return;
  }

  let heroWins = 0;
  let villainWins = 0;
  let ties = 0;
  const matchupCounts = {};
  const convergence = [];

  const bucketSize = Math.max(100, Math.floor(iterations / 20));

  for (let i = 0; i < iterations; i++) {
    const sampled = weightedPick(villainCandidates);
    const villainHand = sampled.combo;
    const villainKey = sampled.key;

    const used = [...known, ...villainHand];
    const runDeck = removeCards(buildDeck(), used);

    const need = 5 - boardCards.length;
    const shuffled = shuffle(runDeck);
    const runout = need > 0 ? shuffled.slice(0, need) : [];
    const fullBoard = [...boardCards, ...runout];

    const heroScore = bestOfSeven([...heroCards, ...fullBoard]);
    const villainScore = bestOfSeven([...villainHand, ...fullBoard]);
    const cmp = compareScores(heroScore, villainScore);

    if (cmp > 0) heroWins++;
    else if (cmp < 0) villainWins++;
    else ties++;

    matchupCounts[villainKey] = (matchupCounts[villainKey] || 0) + 1;

    if ((i + 1) % bucketSize === 0 || i === iterations - 1) {
      const totalSoFar = heroWins + villainWins + ties;
      const eqSoFar = (heroWins + 0.5 * ties) / totalSoFar;
      convergence.push({
        sims: totalSoFar,
        equity: Number((eqSoFar * 100).toFixed(2)),
      });
    }

    if (i > 0 && i % Math.max(100, Math.floor(iterations / 10)) === 0) {
      self.postMessage({
        requestId,
        progress: Math.min(90, 10 + Math.round((i / iterations) * 80)),
        status: "Running weighted simulation",
      });
    }
  }

  const total = heroWins + villainWins + ties;
  const equity = (heroWins + 0.5 * ties) / total;
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
  const recommendation =
    equity > potOdds + 0.1
      ? "Raise / Value"
      : equity > potOdds
      ? "Call"
      : "Fold";

  const topMatchups = Object.entries(matchupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([hand, count]) => ({ hand, count }));

  self.postMessage({
    requestId,
    progress: 100,
    status: "Solved",
    result: {
      equity,
      recommendation,
      heroWins,
      villainWins,
      ties,
      topMatchups,
      convergence,
      actionMix: buildActionMix(equity, pot, callAmount),
      backendMeta: {
        service: "WorkerSolverService",
        pipeline: ["range-load", "weighted-sampling", "equity-sim", "convergence-track", "result-return"],
        batchSize: iterations,
      },
    },
  });
};