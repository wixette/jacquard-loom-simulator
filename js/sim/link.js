// Links that open the simulator in a state: the head, the tie, the colours, the chain of
// cards, where the loom is, and what the page shows. Worksheets and textbooks keep such
// links for years, so the format is a public contract: fields may be added; an existing
// field is never renamed, dropped or read differently. tests/sim/link.test.js pins it.
//
// The state goes in the URL's fragment, as form-encoded fields:
//
//   #v=1&h=16&t=s1&l=1&wc=5b3f8c&fc=efe3c2&d=a5a5-5a5a&p=3&s=2&x=1&f=5&face=front
//
//   v     format version, 1
//   h     hooks: 8, 16, … 64
//   t     tie-up: s1 … s4 (straight, repeated 1 to 4 times) or p (point)
//   l     1 = the chain is laced into a loop, 0 = open
//   wc    warp colour, 6 hex digits; fc weft colour
//   d     the cards, first first, joined by "-"; each card is h / 4 hex digits, hook 1 in
//         the highest bit of the first digit; a 1 bit is a hole
//   p     the pick being woven, from 0
//   s     the moment within it: 0 at rest (the card pressed), 1 to 5 the step stops
//         (hooks taken, shed open, shuttle across, beaten up, shed closed)
//   x     the cross-row the head section shows, from 1
//   f     the followed hook, from 1 (absent: none)
//   face  the face of the cloth shown: front or back
//
// Only v, h and d are required; the others have the defaults of DEFAULT_LINK.

import { HOOK_COUNTS } from "./deck.js";
/** @import { Tie } from "./tieup.js" */

/**
 * @typedef {object} LinkState
 * @property {number} hooks
 * @property {Tie} tie
 * @property {boolean} loop
 * @property {string} warp colour, "#rrggbb"
 * @property {string} weft colour, "#rrggbb"
 * @property {boolean[][]} cards
 * @property {number} pick
 * @property {number} stop 0 to 5
 * @property {number} crossRow 0-based
 * @property {number | null} follow 0-based hook, or null
 * @property {"front" | "back"} face
 */

/** The longest chain a link may carry. */
export const MAX_CARDS = 1024;

/** @type {Omit<LinkState, "hooks" | "cards">} */
export const DEFAULT_LINK = {
  tie: { kind: "straight", repeats: 1 },
  loop: true,
  warp: "#5b3f8c",
  weft: "#efe3c2",
  pick: 0,
  stop: 0,
  crossRow: 0,
  follow: null,
  face: "front",
};

/**
 * @param {boolean[]} card
 * @returns {string}
 */
function cardToHex(card) {
  let out = "";
  for (let i = 0; i < card.length; i += 4) {
    let v = 0;
    for (let j = 0; j < 4; j++) v = (v << 1) | (card[i + j] ? 1 : 0);
    out += v.toString(16);
  }
  return out;
}

/**
 * @param {string} hex
 * @returns {boolean[]}
 */
function hexToCard(hex) {
  const out = [];
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    for (let j = 3; j >= 0; j--) out.push(((v >> j) & 1) === 1);
  }
  return out;
}

/** @param {Tie} tie */
const tieCode = (tie) => (tie.kind === "point" ? "p" : `s${tie.repeats}`);

/**
 * The fragment for a state, without the leading "#".
 * @param {LinkState} s
 * @returns {string}
 */
export function encodeLink(s) {
  const q = new URLSearchParams();
  q.set("v", "1");
  q.set("h", String(s.hooks));
  q.set("t", tieCode(s.tie));
  q.set("l", s.loop ? "1" : "0");
  q.set("wc", s.warp.replace("#", "").toLowerCase());
  q.set("fc", s.weft.replace("#", "").toLowerCase());
  q.set("d", s.cards.map(cardToHex).join("-"));
  q.set("p", String(s.pick));
  q.set("s", String(s.stop));
  q.set("x", String(s.crossRow + 1));
  if (s.follow !== null) q.set("f", String(s.follow + 1));
  q.set("face", s.face);
  return q.toString();
}

/**
 * @param {string | null} v
 * @param {number} min
 * @param {number} max
 * @returns {number | null}
 */
function int(v, min, max) {
  if (v === null || !/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
}

/**
 * Reads a fragment (with or without the "#"). Never throws: a link that cannot be read
 * says why.
 * @param {string} fragment
 * @returns {{ ok: true, state: LinkState } | { ok: false, reason: string }}
 */
export function decodeLink(fragment) {
  const q = new URLSearchParams(fragment.replace(/^#/, ""));
  /** @param {string} reason */
  const no = (reason) => /** @type {{ ok: false, reason: string }} */ ({ ok: false, reason: `This link cannot be read: ${reason}.` });
  if (q.get("v") !== "1") return no(q.has("v") ? `it is of format ${q.get("v")}, and this simulator reads format 1` : "it has no format version (v)");
  const hooks = int(q.get("h"), 8, 64);
  if (hooks === null || !HOOK_COUNTS.includes(hooks)) return no(`a head has 8, 16, … 64 hooks, not "${q.get("h")}"`);
  const d = q.get("d");
  if (d === null) return no("it has no cards (d)");
  const parts = d === "" ? [] : d.split("-");
  if (parts.length > MAX_CARDS) return no(`it has ${parts.length} cards; at most ${MAX_CARDS}`);
  const digits = hooks / 4;
  for (const [i, p] of parts.entries()) {
    if (!new RegExp(`^[0-9a-fA-F]{${digits}}$`).test(p)) return no(`card ${i + 1} should be ${digits} hex digits for ${hooks} hooks`);
  }
  const cards = parts.map(hexToCard);

  /** @type {Tie} */
  let tie = DEFAULT_LINK.tie;
  const t = q.get("t");
  if (t !== null) {
    if (t === "p") tie = { kind: "point" };
    else if (/^s[1-4]$/.test(t)) tie = { kind: "straight", repeats: Number(t[1]) };
    else return no(`the tie-up "${t}" is not s1 to s4 or p`);
  }
  const colour = (/** @type {string} */ key, /** @type {string} */ fallback) => {
    const v = q.get(key);
    if (v === null) return fallback;
    return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : null;
  };
  const warp = colour("wc", DEFAULT_LINK.warp);
  const weft = colour("fc", DEFAULT_LINK.weft);
  if (warp === null || weft === null) return no("a colour should be 6 hex digits");
  const optional = (/** @type {string} */ key, /** @type {number} */ min, /** @type {number} */ max, /** @type {number} */ fallback) =>
    q.has(key) ? int(q.get(key), min, max) : fallback;
  const pick = optional("p", 0, 1_000_000, 0);
  const stop = optional("s", 0, 5, 0);
  const x = optional("x", 1, hooks / 8, 1);
  const f = q.has("f") ? int(q.get("f"), 1, hooks) : 0;
  if (pick === null || stop === null || x === null || f === null) return no("a number in it is out of range");
  const face = q.get("face") ?? "front";
  if (face !== "front" && face !== "back") return no(`the cloth's face "${face}" is not front or back`);
  const l = q.get("l");
  if (l !== null && l !== "0" && l !== "1") return no("the loop (l) should be 0 or 1");
  return {
    ok: true,
    state: { hooks, tie, loop: l === null ? DEFAULT_LINK.loop : l === "1", warp, weft, cards, pick, stop, crossRow: x - 1, follow: f === 0 ? null : f - 1, face },
  };
}
