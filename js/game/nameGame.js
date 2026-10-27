// The name game (design/public-app.md §2): a name, set in an 8 × 16 pixel font, becomes a chain
// of cards, and the loom weaves it. The text wraps at 8 characters a line, up to 16 lines, with
// two blank pixel rows between lines. Two ways to read it, as the picture helper has them:
// - "damask", real cloth: each pixel 4 × 4 threads of 8-end satin, on the reference head of the
//   whole-loom view (400 hooks): eight characters need 256 hooks and 64 cards a line (and 8 for the gap);
// - "direct", quick: one pixel per thread, eight characters on a 64-hook head, 16 cards a line (and 2),
//   but letters on a blank ground leave long loose threads.
// The cloth reads back as the text (decodeCloth), which is how the checks know the program
// woven is the name typed.

import { msg } from "../l10n/l10n.js";
import { findFloats, readDamask, readDirect } from "../sim/design.js";
import { UNSCII_16 } from "./unscii16.js";
/** @import { Deck } from "../sim/deck.js" */
/** @import { Picture } from "../sim/design.js" */
/** @import { Msg } from "../l10n/l10n.js" */

/** A glyph's size, in pixels. */
export const GLYPH_W = 8;
export const GLYPH_H = 16;
/** At most this many characters a line, and lines; a text is wrapped into them (wrapText). */
export const MAX_CHARS = 8;
export const MAX_LINES = 16;
/** Blank pixel rows between two lines of text, so that a descender never meets the next line. */
export const LINE_GAP = 2;
/** Damask: threads per pixel, and the head it is woven on (the reference 400 head). */
export const DAMASK_K = 4;
export const REFERENCE_HOOKS = 400;
/** The direct reading's head: the learner's largest. */
export const DIRECT_HOOKS_MAX = 64;

/** @typedef {"damask" | "direct"} Mode */

/**
 * A character's glyph: 16 rows, top first, of 8 pixels, left first; true = ink.
 * @param {string} ch one printable ASCII character
 * @returns {boolean[][]}
 */
export function glyph(ch) {
  const hex = UNSCII_16[ch.charCodeAt(0)];
  if (!hex) throw new RangeError(`no glyph for ${JSON.stringify(ch)}`);
  const rows = [];
  for (let r = 0; r < GLYPH_H; r++) {
    const byte = parseInt(hex.slice(2 * r, 2 * r + 2), 16);
    rows.push([...Array(GLYPH_W).keys()].map((b) => ((byte >> (7 - b)) & 1) === 1));
  }
  return rows;
}

/**
 * The text in lines of at most MAX_CHARS: each line typed is broken at its spaces, as a word
 * processor wraps, and a word longer than a line is cut. A blank line typed stays a blank line;
 * the blank lines at the end go.
 * @param {string} text
 * @returns {string[]}
 */
export function wrapText(text) {
  const out = [];
  for (const typed of text.replace(/\r/g, "").split("\n")) {
    const words = typed.split(" ").filter((w) => w !== "").flatMap((w) => w.match(new RegExp(`.{1,${MAX_CHARS}}`, "g")) ?? []);
    if (words.length === 0) out.push("");
    let line = "";
    for (const w of words) {
      if (line === "") line = w;
      else if (line.length + 1 + w.length <= MAX_CHARS) line += ` ${w}`;
      else {
        out.push(line);
        line = w;
      }
    }
    if (line !== "") out.push(line);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out;
}

/**
 * The text as lines the game can weave, or why it cannot.
 * @param {string} text
 * @returns {{ ok: true, lines: string[] } | { ok: false, reason: string, why: Msg }}
 *   reason: in English (the prototype's page); why: the same as a message (the app's)
 */
export function checkText(text) {
  const bad = [...text.replace(/[\r\n]/g, "")].find((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126);
  if (bad) return { ok: false, reason: `"${bad}" is not in the font: use the letters, digits and signs of plain ASCII.`, why: msg("name.notInFont", { ch: bad }) };
  const lines = wrapText(text);
  if (lines.length === 0) return { ok: false, reason: "Type a name to weave.", why: msg("name.empty") };
  if (lines.length > MAX_LINES) return { ok: false, reason: `That makes ${lines.length} lines of ${MAX_CHARS} characters: at most ${MAX_LINES}.`, why: msg("name.tooManyLines", { lines: lines.length, per: MAX_CHARS, most: MAX_LINES }) };
  return { ok: true, lines };
}

/**
 * The lines set in the font, each centred in the widest line's width, top line first, with
 * LINE_GAP blank rows between two lines.
 * @param {string[]} lines
 * @returns {Picture}
 */
export function textPicture(lines) {
  const chars = Math.max(1, ...lines.map((l) => l.length));
  /** @type {Picture} */
  const rows = [];
  for (const [i, line] of lines.entries()) {
    if (i > 0) for (let r = 0; r < LINE_GAP; r++) rows.push(new Array(chars * GLYPH_W).fill(false));
    const pad = Math.floor((chars - line.length) / 2);
    const cells = [...Array(chars).keys()].map((i) => glyph(line[i - pad] ?? " "));
    for (let r = 0; r < GLYPH_H; r++) rows.push(cells.flatMap((g) => g[r]));
  }
  return rows;
}

/**
 * @typedef {object} NamePlan
 * @property {string[]} lines
 * @property {Mode} mode
 * @property {Picture} picture
 * @property {Deck} deck an open chain, first card first
 * @property {number} k threads per pixel
 * @property {number} width the woven width, in warp ends
 * @property {{ longestWeft: number, longestWarp: number, count: number }} floats loose threads over 8
 * @property {string} text what it is, in words
 */

/**
 * The cards that weave the text.
 * @param {string} text
 * @param {Mode} mode
 * @returns {{ ok: true, plan: NamePlan } | { ok: false, reason: string, why: Msg }}
 */
export function planName(text, mode) {
  const t = checkText(text);
  if (!t.ok) return t;
  const picture = textPicture(t.lines);
  const k = mode === "damask" ? DAMASK_K : 1;
  const width = picture[0].length * k;
  const hooks = Math.ceil(width / 8) * 8;
  const limit = mode === "damask" ? REFERENCE_HOOKS : DIRECT_HOOKS_MAX;
  if (hooks > limit) return { ok: false, reason: `That needs ${hooks} hooks; the head has ${limit}.`, why: msg("name.tooWide", { hooks, most: limit }) };
  const read = mode === "damask" ? readDamask(picture, { hooks, k }) : readDirect(picture, { hooks });
  if (!read.ok) return { ...read, why: msg("name.tooWide", { hooks, most: limit }) };
  const { cards } = read.reading;
  const f = findFloats(cards.map((c) => c.slice(0, width)));
  const n = t.lines.join("").replace(/ /g, "").length;
  const per = GLYPH_H * k;
  const text2 = mode === "damask"
    ? `${n} character${n === 1 ? "" : "s"} on ${t.lines.length} line${t.lines.length === 1 ? "" : "s"}, as damask on a ${hooks}-hook head (the real head has ${REFERENCE_HOOKS}): ${cards.length} cards, ${per} a line.`
    : `${n} character${n === 1 ? "" : "s"} on ${t.lines.length} line${t.lines.length === 1 ? "" : "s"}, one pixel per thread on a ${hooks}-hook head: ${cards.length} cards, ${per} a line.`;
  return {
    ok: true,
    plan: { lines: t.lines, mode, picture, deck: { hooks, cards, loop: false }, k, width, floats: { longestWeft: f.longestWeft, longestWarp: f.longestWarp, count: f.floats.length }, text: text2 },
  };
}

/**
 * Reads woven cloth back as text: each pixel is dark where most of its threads show the warp
 * (damask: the warp-faced satin of the letters), and each character cell is matched against
 * the font. The cloth's first row is the picture's bottom row.
 * @param {boolean[][]} cloth rows woven so far, first pick first
 * @param {NamePlan} plan
 * @returns {string[]} the lines read (a cell that matches no glyph reads as "?")
 */
export function decodeCloth(cloth, plan) {
  const H = plan.picture.length;
  const W = plan.picture[0].length;
  const k = plan.k;
  /** @param {number} y @param {number} x */
  const dark = (y, x) => {
    let up = 0;
    for (let p = (H - 1 - y) * k; p < (H - y) * k; p++) for (let e = x * k; e < (x + 1) * k; e++) if (cloth[p]?.[e]) up++;
    return up * 2 > k * k;
  };
  const chars = W / GLYPH_W;
  /** @type {Map<string, string>} */
  const byBits = new Map();
  for (let c = 32; c <= 126; c++) byBits.set(glyph(String.fromCharCode(c)).flat().join(""), String.fromCharCode(c));
  const out = [];
  const pitch = GLYPH_H + LINE_GAP;
  for (let l = 0; l < (H + LINE_GAP) / pitch; l++) {
    let line = "";
    for (let i = 0; i < chars; i++) {
      const bits = [];
      for (let r = 0; r < GLYPH_H; r++) for (let b = 0; b < GLYPH_W; b++) bits.push(dark(l * pitch + r, i * GLYPH_W + b));
      line += byBits.get(bits.join("")) ?? "?";
    }
    out.push(line.trim());
  }
  return out;
}
