// Guess the cloth (design/public-app.md §2): shown a small deck and three cloths, the player
// picks the one it weaves. The wrong two are what a learner reading the cards carelessly would
// expect: two of the four misreadings (the chain read in the other order, each card read from
// the other end, holes and blanks swapped, or each card read one hook along). Every puzzle comes from a number (its seed), so a link can give a friend the
// same one, and the three cloths are always different. Pure: no DOM.

import { makeDeck } from "../sim/deck.js";
import { Loom } from "../sim/loom.js";
/** @import { Deck } from "../sim/deck.js" */

/** The cards of a puzzle: 8 hooks, a looped chain of 2 to 6 cards. */
const HOOKS = 8;
/** Rows of each cloth shown. */
export const ROWS = 8;

/** The ways a card can be misread, by name (the hint of each is guess.<name> in js/l10n). */
export const MISREADINGS = /** @type {const} */ (["reversed", "mirrored", "inverted", "shifted"]);
/** @typedef {(typeof MISREADINGS)[number]} Misreading */

/** A seeded generator, 0 to 1 (mulberry32). @param {number} seed */
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deck misread.
 * @param {string[]} cards
 * @param {Misreading} how
 * @returns {string[]}
 */
export function misread(cards, how) {
  if (how === "reversed") return [...cards].reverse();
  if (how === "mirrored") return cards.map((c) => [...c].reverse().join(""));
  if (how === "inverted") return cards.map((c) => [...c].map((x) => (x === "O" ? "." : "O")).join(""));
  return cards.map((c) => c.slice(-1) + c.slice(0, -1));
}

/** The cloth a looped chain weaves, ROWS rows. @param {string[]} cards @returns {boolean[][]} */
export function weaveCards(cards) {
  const l = new Loom(makeDeck(HOOKS, cards, true));
  l.moveTo(ROWS, 0);
  return l.cloth;
}

/** @param {boolean[][]} c */
const key = (c) => c.map((r) => r.map(Number).join("")).join("/");

/**
 * @typedef {object} Puzzle
 * @property {number} seed
 * @property {Deck} deck the cards shown
 * @property {boolean[][][]} cloths the three cloths, in the order shown
 * @property {number} answer which of them the deck weaves (0-based)
 * @property {(Misreading | null)[]} how what each cloth is (null: the right one)
 */

/**
 * A list in a seeded order (Fisher–Yates). Not sort() with a random comparator: what that gives,
 * and how often it asks, is each browser's own, so a seed gave Safari another puzzle than Chrome.
 * @template T
 * @param {readonly T[]} list
 * @param {() => number} rand
 * @returns {T[]}
 */
function shuffled(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The puzzle a seed gives: a small looped deck whose three readings all differ, the same in
 * every browser (since 1.0.0; 0.2.0's seeds gave other puzzles).
 * @param {number} seed
 * @returns {Puzzle}
 */
export function puzzle(seed) {
  const rand = random(seed);
  for (;;) {
    const n = 2 + Math.floor(rand() * 5);
    const cards = [...Array(n)].map(() => [...Array(HOOKS)].map(() => (rand() < 0.45 ? "O" : ".")).join(""));
    const right = weaveCards(cards);
    // two misreadings, in a seeded order, whose cloths differ from the right one and each other
    const ways = shuffled(MISREADINGS, rand);
    /** @type {{ cloth: boolean[][]; how: Misreading | null }[]} */
    const shown = [{ cloth: right, how: null }];
    for (const how of ways) {
      const c = weaveCards(misread(cards, how));
      if (shown.every((s) => key(s.cloth) !== key(c))) shown.push({ cloth: c, how });
      if (shown.length === 3) break;
    }
    // a deck too regular to be misread three ways (all blank, say) is drawn again
    if (shown.length < 3 || cards.every((c) => c === cards[0])) continue;
    const order = shuffled([0, 1, 2], rand);
    const ordered = order.map((i) => shown[i]);
    return { seed, deck: makeDeck(HOOKS, cards, true), cloths: ordered.map((s) => s.cloth), answer: ordered.findIndex((s) => s.how === null), how: ordered.map((s) => s.how) };
  }
}
