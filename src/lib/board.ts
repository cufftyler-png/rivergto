export function classifyBoard(boardCards: string[]) {
  if (boardCards.length < 3) {
    return {
      name: "Preflop / partial board",
      aggression: 0.5,
      wetness: 0.4,
    };
  }

  return {
    name: "Flop board",
    aggression: 0.6,
    wetness: 0.5,
  };
}