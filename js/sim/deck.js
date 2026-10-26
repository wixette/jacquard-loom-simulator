// The chain of cards. A card is one row of holes, one per hook: true = punched (a hole),
// false = blank. Index 0 is hook 1, which is served by the top needle and stands nearest
// the needle board. Pick r is woven from card r; a closed chain (loop) starts again
// after its last card, an open one runs out.
//
// Every function returns a new deck; nothing is changed in place.

/**
 * @typedef {object} Deck
 * @property {number} hooks how many hooks (holes per card)
 * @property {boolean[][]} cards
 * @property {boolean} loop whether the chain is laced into an endless loop
 */

/**
 * A card from a string, hook 1 first: "O" or "1" is a hole, anything else blank.
 * @param {string} s
 * @returns {boolean[]}
 */
export const cardFromString = (s) => [...s].map((c) => c === "O" || c === "1");

/**
 * A card as a string, hook 1 first: "O" for a hole, "." for a blank.
 * @param {boolean[]} card
 * @returns {string}
 */
export const cardToString = (card) => card.map((h) => (h ? "O" : ".")).join("");

/**
 * @param {number} hooks
 * @param {string[]} rows cards as strings, the first card (pick 1) first
 * @param {boolean} [loop]
 * @returns {Deck}
 */
export function makeDeck(hooks, rows, loop = true) {
  const cards = rows.map(cardFromString);
  for (const c of cards) if (c.length !== hooks) throw new Error(`a card has ${c.length} holes, the head ${hooks} hooks`);
  return { hooks, cards, loop };
}

/**
 * The index in the chain of the card for pick r (0-based), or null when an open chain has
 * no card there. In a closed loop every r has a card, before the first pick too: the card
 * before card 1 is the last card (the cylinder shows it on the face that has just left
 * the needles).
 * @param {Deck} deck
 * @param {number} r
 * @returns {number | null}
 */
export function cardIndexForPick(deck, r) {
  const n = deck.cards.length;
  if (n === 0) return null;
  if (deck.loop) return ((r % n) + n) % n;
  return r >= 0 && r < n ? r : null;
}

/**
 * The card that weaves pick r (0-based), or null (as cardIndexForPick).
 * @param {Deck} deck
 * @param {number} r
 * @returns {boolean[] | null}
 */
export function cardForPick(deck, r) {
  const i = cardIndexForPick(deck, r);
  return i === null ? null : deck.cards[i];
}

/**
 * @param {Deck} deck
 * @param {number} i card index
 * @param {number} h hook index (0-based)
 * @returns {Deck}
 */
export function toggleHole(deck, i, h) {
  return { ...deck, cards: deck.cards.map((c, j) => (j === i ? c.map((x, k) => (k === h ? !x : x)) : c)) };
}

/**
 * A blank card inserted after card i (at the end when i is -1 or past it).
 * @param {Deck} deck
 * @param {number} i
 * @returns {Deck}
 */
export function addCard(deck, i = deck.cards.length - 1) {
  const at = i < 0 || i >= deck.cards.length ? deck.cards.length : i + 1;
  const cards = [...deck.cards];
  cards.splice(at, 0, new Array(deck.hooks).fill(false));
  return { ...deck, cards };
}

/**
 * @param {Deck} deck
 * @param {number} i
 * @returns {Deck}
 */
export function duplicateCard(deck, i) {
  const cards = [...deck.cards];
  cards.splice(i + 1, 0, [...deck.cards[i]]);
  return { ...deck, cards };
}

/**
 * @param {Deck} deck
 * @param {number} i
 * @returns {Deck}
 */
export function removeCard(deck, i) {
  return { ...deck, cards: deck.cards.filter((_c, j) => j !== i) };
}

/**
 * Moves card i by d places (-1 earlier, +1 later), if it can.
 * @param {Deck} deck
 * @param {number} i
 * @param {number} d
 * @returns {Deck}
 */
export function moveCard(deck, i, d) {
  const j = i + d;
  if (j < 0 || j >= deck.cards.length) return deck;
  const cards = [...deck.cards];
  [cards[i], cards[j]] = [cards[j], cards[i]];
  return { ...deck, cards };
}

/**
 * Punches every blank and fills every hole of card i.
 * @param {Deck} deck
 * @param {number} i
 * @returns {Deck}
 */
export function invertCard(deck, i) {
  return { ...deck, cards: deck.cards.map((c, j) => (j === i ? c.map((x) => !x) : c)) };
}

/**
 * @param {Deck} deck
 * @param {boolean} loop
 * @returns {Deck}
 */
export const setLoop = (deck, loop) => ({ ...deck, loop });

/**
 * Ready-made decks for the 8-hook cross-row of M0, as strings, the first card first.
 * The arrow is the research's worked example (research/data/operation_cycle.json): its
 * design is read bottom line first, so the first card is the arrow's shaft.
 * Each is named by a message key (its name for the reader).
 * @type {Record<string, { name: string, rows: string[], loop: boolean }>}
 */
export const PRESETS = {
  plain: { name: "preset.plain", rows: ["O.O.O.O.", ".O.O.O.O"], loop: true },
  twill: { name: "preset.twill", rows: ["OO..OO..", ".OO..OO.", "..OO..OO", "O..OO..O"], loop: true },
  satin: {
    name: "preset.satin",
    rows: ["O.......", "...O....", "......O.", ".O......", "....O...", ".......O", "..O.....", ".....O.."],
    loop: true,
  },
  arrow: {
    name: "preset.arrow",
    rows: ["...OO...", "...OO...", "...OO...", "...OO...", "O..OO..O", ".O.OO.O.", "..OOOO..", "...OO..."],
    loop: false,
  },
  blank: { name: "preset.blank", rows: ["........"], loop: false },
  full: { name: "preset.full", rows: ["OOOOOOOO"], loop: false },
};

/** The hook counts a head can have: 8 x c hooks, c = 1 to 8 (design/simulator-plan.md §4.1). */
export const HOOK_COUNTS = [8, 16, 24, 32, 40, 48, 56, 64];

/**
 * A preset for a head of any hook count: its eight-hole pattern repeated across the card.
 * @param {string} name a key of PRESETS
 * @param {number} hooks a multiple of 8
 * @returns {Deck}
 */
export function presetDeck(name, hooks) {
  const p = PRESETS[name];
  if (!p) throw new Error(`no preset ${name}`);
  if (hooks % 8 !== 0 || hooks < 8) throw new RangeError(`a head has 8 x c hooks, not ${hooks}`);
  return makeDeck(hooks, p.rows.map((r) => r.repeat(hooks / 8)), p.loop);
}

/**
 * The same cards on a head of another size: each card cut short or filled out with blanks.
 * @param {Deck} deck
 * @param {number} hooks
 * @returns {Deck}
 */
export function resizeDeck(deck, hooks) {
  return { ...deck, hooks, cards: deck.cards.map((c) => (c.length >= hooks ? c.slice(0, hooks) : [...c, ...new Array(hooks - c.length).fill(false)])) };
}

/**
 * Where hook h (0-based) has its hole on the real card: the column is its cross-row,
 * the row its needle tier, both 0-based. Hook 1 is column 0, row 0 (research section 4:
 * hook h at column ceil(h / 8), row ((h - 1) mod 8) + 1, counting from 1).
 * @param {number} h
 * @returns {{ column: number, row: number }}
 */
export const holeOfHook = (h) => ({ column: Math.floor(h / 8), row: h % 8 });

/**
 * The hook (0-based) whose hole is at a column and row of the real card.
 * @param {number} column
 * @param {number} row
 * @returns {number}
 */
export const hookOfHole = (column, row) => column * 8 + row;
