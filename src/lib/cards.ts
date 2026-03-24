export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
export const SUITS = ["s", "h", "d", "c"];
export const HAND_ORDER = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

export function parseCards(text: string): string[] {
  return (text || "")
    .trim()
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toUpperCase().replace("10", "T"))
    .filter((tok) => tok.length === 2 && RANKS.includes(tok[0]) && SUITS.includes(tok[1].toLowerCase()))
    .map((tok) => tok[0] + tok[1].toLowerCase());
}

export function buildDeck(): string[] {
  const deck: string[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(r + s);
    }
  }
  return deck;
}

export function removeCards(deck: string[], used: string[]): string[] {
  const usedSet = new Set(used);
  return deck.filter((c) => !usedSet.has(c));
}

export function handMatrixCell(rowRank: string, colRank: string): string {
  if (rowRank === colRank) return rowRank + colRank;

  const rowIndex = HAND_ORDER.indexOf(rowRank);
  const colIndex = HAND_ORDER.indexOf(colRank);

  return rowIndex < colIndex
    ? rowRank + colRank + "s"
    : colRank + rowRank + "o";
}