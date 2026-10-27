// A picture and how it is read into cards, for the Create workspace and the tutorial (design/
// m8-notes.md): a square picture on point paper, 8 to 32 squares a side, and its reading,
// direct (one square per thread) or damask (each square a block of satin threads), on the
// smallest head that takes it. The reading itself is js/sim/design.js's; this says, in
// messages, what it needs and why it may not fit, and weaves the cloth the cards make, with
// its loose threads. Pure: no DOM.

import { msg } from "../l10n/l10n.js";
import { HOOK_COUNTS } from "./deck.js";
import { findFloats, FLOAT_LIMIT, pictureFromStrings, PICTURES, readDamask, readDirect } from "./design.js";
/** @import { Msg } from "../l10n/l10n.js" */
/** @import { Deck } from "./deck.js" */
/** @import { Float, Picture } from "./design.js" */

/** The sizes a picture is drawn at, squares a side: each a whole number of cross-rows. */
export const PICTURE_SIZES = /** @type {const} */ ([8, 16, 24, 32]);
/** The blocks a damask reading can make of a square, threads a side (no float over 8 from 2 to 6). */
export const DAMASK_BLOCKS = /** @type {const} */ ([2, 3, 4, 5, 6]);
/** How many picks a direct reading can weave of each row of the picture. */
export const PICKS_PER_ROW = /** @type {const} */ ([1, 2, 3]);

/**
 * A picture and how it is read.
 * @typedef {object} PictureSpec
 * @property {Picture} rows top row first, true = dark; square
 * @property {"direct" | "damask"} mode
 * @property {number} k damask: threads a side of each square's block
 * @property {number} perRow direct: picks woven of each row
 * @property {boolean} invert dark squares lift the weft's colour instead of the warp's
 */

/**
 * What a picture's reading makes: the cards, on the smallest head that takes them, and the
 * cloth they weave with its floats.
 * @typedef {object} PictureCards
 * @property {Deck} deck an open chain, the first card the picture's bottom row
 * @property {number} width the woven width in warp ends (the rest of the head left blank)
 * @property {boolean[][]} cloth the cloth it weaves, first pick first, `width` ends wide
 * @property {Float[]} floats the threads lying loose over more than FLOAT_LIMIT
 * @property {number} longest the longest float, of either kind
 */

/** @typedef {{ ok: true; cards: PictureCards } | { ok: false; reason: Msg }} PictureRead */

/** A blank picture, n squares a side. @param {number} n @returns {Picture} */
export const blankPicture = (n) => [...Array(n)].map(() => new Array(n).fill(false));

/** The ready-made pictures, by name (their names are pic.<name> in js/l10n). */
export const PICTURE_NAMES = /** @type {const} */ (["heart", "arrow", "letter", "face"]);

/** A ready-made picture. @param {(typeof PICTURE_NAMES)[number]} name @returns {Picture} */
export const presetPicture = (name) => pictureFromStrings(PICTURES[name].rows);

/** The picture a reading starts from, and Create opens with. @returns {PictureSpec} */
export const startPicture = () => ({ rows: presetPicture("heart"), mode: "direct", k: 4, perRow: 1, invert: false });

/**
 * A picture redrawn at n squares a side, each square taken from the nearest one of the old.
 * @param {Picture} p
 * @param {number} n
 * @returns {Picture}
 */
export function resizePicture(p, n) {
  const m = p.length;
  return [...Array(n).keys()].map((y) => [...Array(n).keys()].map((x) => (m ? p[Math.floor((y * m) / n)][Math.floor((x * m) / n)] : false)));
}

/**
 * The warp ends a reading needs, and the smallest head that has them (null: none does).
 * @param {PictureSpec} s
 * @returns {{ ends: number; hooks: number | null }}
 */
export function pictureNeeds(s) {
  const ends = s.mode === "damask" ? s.rows.length * s.k : s.rows.length;
  return { ends, hooks: HOOK_COUNTS.find((n) => n >= ends) ?? null };
}

/**
 * Read a picture into cards, or say why it cannot be.
 * @param {PictureSpec} s
 * @returns {PictureRead}
 */
export function readPicture(s) {
  const n = s.rows.length;
  if (n === 0 || s.rows.some((r) => r.length !== n)) return { ok: false, reason: msg("pic.notSquare") };
  const { ends, hooks } = pictureNeeds(s);
  if (hooks === null) return { ok: false, reason: msg("pic.tooWide", { ends, most: HOOK_COUNTS[HOOK_COUNTS.length - 1], k: s.k, n }) };
  const read = s.mode === "damask" ? readDamask(s.rows, { hooks, k: s.k, invert: s.invert }) : readDirect(s.rows, { hooks, invert: s.invert, picksPerRow: s.perRow });
  // the sizes are checked above, so the reading cannot refuse
  if (!read.ok) throw new Error(read.reason);
  const { cards, width } = read.reading;
  const cloth = cards.map((c) => c.slice(0, width));
  const f = findFloats(cloth);
  return { ok: true, cards: { deck: { hooks, cards, loop: false }, width, cloth, floats: f.floats, longest: Math.max(f.longestWarp, f.longestWeft) } };
}

/**
 * What a reading makes, in words: its size, its cards and head, and whether it holds together.
 * @param {PictureSpec} s
 * @param {PictureRead} r
 * @returns {Msg}
 */
export function describeReading(s, r) {
  if (!r.ok) return r.reason;
  const c = r.cards;
  const how = s.mode === "damask" ? msg("pic.read.damask", { k: s.k }) : s.perRow > 1 ? msg("pic.read.directPicks", { per: s.perRow }) : msg("pic.read.direct");
  const holds = c.floats.length === 0 ? msg("pic.holds", { limit: FLOAT_LIMIT, longest: c.longest }) : msg("pic.loose", { limit: FLOAT_LIMIT, longest: c.longest }, c.floats.length);
  return msg("pic.reading", { n: s.rows.length, how, cards: c.deck.cards.length, hooks: c.deck.hooks, holds });
}
