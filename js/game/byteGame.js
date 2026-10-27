// One byte per card (design/public-app.md §2): on an 8-hook head one card is one byte, so a
// message in ASCII becomes a chain of cards, one character each, hook 1 the highest bit (as a
// link writes a card, design/links.md). Woven, the cloth holds the message row by row: a warp
// end over the weft is a 1. A friend sent the link reads the cloth back into text. Pure: no DOM.

import { msg } from "../l10n/l10n.js";
/** @import { Msg } from "../l10n/l10n.js" */
/** @import { Deck } from "../sim/deck.js" */

/** The longest message: one card a character. */
export const MAX_BYTES = 32;

/**
 * A character as a card: its ASCII code in eight holes, the highest bit at hook 1.
 * @param {string} ch
 * @returns {boolean[]}
 */
export const byteCard = (ch) => [...Array(8).keys()].map((b) => ((ch.charCodeAt(0) >> (7 - b)) & 1) === 1);

/**
 * A row of the cloth (or a card) read as a byte: its warp ends over the weft are the 1s.
 * @param {boolean[]} row
 * @returns {number}
 */
export const rowByte = (row) => row.slice(0, 8).reduce((n, up) => (n << 1) | (up ? 1 : 0), 0);

/**
 * A byte as the character it stands for in ASCII, or "?" for one that is not printable.
 * @param {number} byte
 */
export const byteChar = (byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "?");

/**
 * The message as a chain of cards, or why it cannot be one.
 * @param {string} text
 * @returns {{ ok: true; deck: Deck } | { ok: false; reason: Msg }}
 */
export function messageDeck(text) {
  if (text.length === 0) return { ok: false, reason: msg("byte.empty") };
  const bad = [...text].find((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126);
  if (bad) return { ok: false, reason: msg("byte.notAscii", { ch: bad }) };
  if (text.length > MAX_BYTES) return { ok: false, reason: msg("byte.tooLong", { most: MAX_BYTES }, text.length) };
  return { ok: true, deck: { hooks: 8, cards: [...text].map(byteCard), loop: false } };
}

/**
 * The cloth read back: each row woven, a character.
 * @param {boolean[][]} cloth first pick first
 * @returns {string}
 */
export const readMessage = (cloth) => cloth.map((row) => byteChar(rowByte(row))).join("");

/**
 * A row as its bits, written as a learner reads them: "01000001".
 * @param {boolean[]} row
 */
export const rowBits = (row) => row.slice(0, 8).map((up) => (up ? "1" : "0")).join("");
