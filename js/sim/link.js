// Links that open the app in a state: the workspace, a loom (its head, tie-up, cards, moment
// and how it is shown) or a step of the tutorial. Worksheets and textbooks keep such links for
// years, so the format is a public contract (design/links.md, docs/ui-design.md P8): fields may
// be added; an existing field is never renamed, dropped or read differently.
// tests/sim/link.test.js pins it, with the examples of design/links.md.
//
// The state goes in the URL's fragment, as form-encoded fields:
//
//   #v=2&w=weave&h=16&c=x.a5a5-5a5a&p=3&s=2&f=5
//
// A deck of cards is readable hex (x.), packed bits (b.) or compressed bits (z., DEFLATE), so
// writing and reading a link are asynchronous (the browser's CompressionStream). No DOM.

import { msg } from "../l10n/l10n.js";
import { HOOK_COUNTS } from "./deck.js";
import { PICTURE_SIZES } from "./picture.js";
import { endCount, hookOfEnd } from "./tieup.js";
/** @import { Msg } from "../l10n/l10n.js" */
/** @import { Tie } from "./tieup.js" */

/** The format's version. */
export const LINK_VERSION = 2;

/** The workspaces a link may open. */
export const WORKSPACES = /** @type {const} */ (["weave", "learn", "create", "play"]);
/** @typedef {(typeof WORKSPACES)[number]} Workspace */

/** The stage's views a link may name. */
export const STAGE_VIEWS = /** @type {const} */ (["section", "side", "front", "3d", "u1", "u2", "u3", "u4", "u5", "cloth"]);
/** @typedef {(typeof STAGE_VIEWS)[number]} StageView */

/** The locales a link may name (js/l10n/l10n.js, LOCALES; repeated so this module stays pure). */
const LANGS = ["en", "es", "fr", "de", "it", "pt-BR", "zh", "zh-TW", "ja", "ko"];

/** The longest chain a link may carry. */
export const MAX_CARDS = 1024;

/** A link longer than this may be cut by an email program or a chat app. */
export const LONG_LINK = 2000;

/**
 * What a link holds. deck is null when the link carries no cards: the app keeps its own, and
 * the fields about a deck (tie, pick, stop, follow, crossRow) are their defaults.
 * @typedef {object} AppLink
 * @property {Workspace} workspace
 * @property {string | null} lang a locale, or null for the reader's
 * @property {string | null} step the tutorial's step, by name (Learn)
 * @property {{ hooks: number; cards: boolean[][]; loop: boolean } | null} deck
 * @property {Tie} tie
 * @property {number} pick the pick being woven, 0-based
 * @property {number} stop the moment within it, 0 (at rest) to 5
 * @property {{ hook: number; end: number | null; pick: number | null } | null} follow hook 0-based, end 1-based, pick 0-based
 * @property {number | null} crossRow 0-based, or null: the followed hook's, or the first
 * @property {string} warp "#rrggbb"
 * @property {string} weft
 * @property {"whole" | "needles" | "crooks"} sectionView
 * @property {"front" | "back"} face
 * @property {boolean} bits
 * @property {StageView[]} views one, two or four
 * @property {LinkPicture | null} picture Create's picture and how it is read, or null
 * @property {LinkGame | null} game the game Play opens on, and its own fields, or null
 */

/**
 * A game in a link (Play): which, and what it needs (the name game's text and reading, the
 * guessing game's puzzle); one byte a card carries its message as cards (deck), a secret.
 * @typedef {{ name: "name" | "byte" | "guess" | "drawboy"; text: string; mode: "damask" | "direct"; seed: number }} LinkGame
 */

/**
 * A picture in a link (Create): square, top row first, true = dark; and its reading.
 * @typedef {{ rows: boolean[][]; mode: "direct" | "damask"; k: number; perRow: number }} LinkPicture
 */

/** @type {AppLink} */
export const DEFAULT_LINK = {
  workspace: "weave",
  lang: null,
  step: null,
  deck: null,
  tie: { kind: "straight", repeats: 1 },
  pick: 0,
  stop: 0,
  follow: null,
  crossRow: null,
  warp: "#5b3f8c",
  weft: "#efe3c2",
  sectionView: "whole",
  face: "front",
  bits: false,
  views: ["section"],
  picture: null,
  game: null,
};

/** The games a link can open, and the longest name text it carries. */
export const LINK_GAMES = /** @type {const} */ (["name", "byte", "guess", "drawboy"]);
// the name game takes 16 lines of 8 characters, and the spaces and line breaks between them
const MAX_TEXT = 144;

// ---- decks: x. (hex), b. (packed), z. (compressed) -----------------------------------------------

/**
 * The cards as bytes: each card hooks/8 bytes, hook 1 in the highest bit of its first byte.
 * @param {boolean[][]} cards
 * @param {number} hooks
 * @returns {Uint8Array}
 */
export function packCards(cards, hooks) {
  const per = hooks / 8;
  const out = new Uint8Array(cards.length * per);
  cards.forEach((card, c) => card.forEach((hole, h) => hole && (out[c * per + (h >> 3)] |= 0x80 >> (h & 7))));
  return out;
}

/**
 * @param {Uint8Array} bytes
 * @param {number} hooks
 * @returns {boolean[][]}
 */
export function unpackCards(bytes, hooks) {
  const per = hooks / 8;
  const cards = [];
  for (let c = 0; c < bytes.length / per; c++) cards.push([...Array(hooks).keys()].map((h) => (bytes[c * per + (h >> 3)] & (0x80 >> (h & 7))) !== 0));
  return cards;
}

/** @param {Uint8Array} bytes @returns {string} */
const toBase64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** @param {string} s @returns {Uint8Array | null} */
function fromBase64url(s) {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

/**
 * Bytes compressed, or uncompressed with at most `limit` bytes out (a stream that would grow
 * past it, a "zip bomb", is refused).
 * @param {Uint8Array} bytes
 * @param {boolean} inflate
 * @param {number} [limit]
 * @returns {Promise<Uint8Array>}
 */
async function through(bytes, inflate, limit = Infinity) {
  const stream = new Blob([/** @type {BlobPart} */ (bytes)]).stream().pipeThrough(inflate ? new DecompressionStream("deflate-raw") : new CompressionStream("deflate-raw"));
  const reader = stream.getReader();
  /** @type {Uint8Array[]} */
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("too long");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** @param {boolean[]} card @returns {string} */
function cardToHex(card) {
  let out = "";
  for (let i = 0; i < card.length; i += 4) {
    let v = 0;
    for (let j = 0; j < 4; j++) v = (v << 1) | (card[i + j] ? 1 : 0);
    out += v.toString(16);
  }
  return out;
}

/** A deck whose readable hex is no longer than this is written in it, so a teacher can read it. */
const READABLE = 80;

/**
 * A deck in readable hex if it is short, else in the shorter of packed and compressed. (Which
 * encoding is written is not part of the contract; every reader reads all three.)
 * @param {boolean[][]} cards
 * @param {number} hooks
 * @returns {Promise<string>}
 */
export async function encodeDeck(cards, hooks) {
  const hex = `x.${cards.map(cardToHex).join("-")}`;
  const bytes = packCards(cards, hooks);
  const packed = `b.${toBase64url(bytes)}`;
  const zipped = `z.${toBase64url(await through(bytes, false))}`;
  if (hex.length <= READABLE) return hex;
  return zipped.length < packed.length ? zipped : packed;
}

/**
 * A deck from any of its encodings, or why it cannot be read.
 * @param {string} text
 * @param {number} hooks
 * @returns {Promise<{ ok: true; cards: boolean[][] } | { ok: false; reason: Msg }>}
 */
export async function decodeDeck(text, hooks) {
  const bad = (/** @type {string} */ key, /** @type {Record<string, number>} */ params = {}) => ({ ok: /** @type {const} */ (false), reason: msg(key, params) });
  const per = hooks / 8;
  /** @type {boolean[][]} */
  let cards;
  if (text.startsWith("x.")) {
    const parts = text === "x." ? [] : text.slice(2).split("-");
    for (const [i, p] of parts.entries()) if (!new RegExp(`^[0-9a-fA-F]{${hooks / 4}}$`).test(p)) return bad("link.card", { card: i + 1, digits: hooks / 4, hooks });
    cards = parts.map((p) => [...p].flatMap((ch) => [3, 2, 1, 0].map((j) => ((parseInt(ch, 16) >> j) & 1) === 1)));
  } else if (text.startsWith("b.") || text.startsWith("z.")) {
    let bytes = fromBase64url(text.slice(2));
    if (bytes && text.startsWith("z.")) {
      // a stream that is not DEFLATE, or one that would grow past the longest chain: refused
      bytes = await through(bytes, true, MAX_CARDS * per).catch(() => null);
    }
    if (!bytes || bytes.length % per !== 0) return bad("link.deck");
    cards = unpackCards(bytes, hooks);
  } else return bad("link.deck");
  if (cards.length > MAX_CARDS) return bad("link.tooMany", { n: cards.length, max: MAX_CARDS });
  return { ok: true, cards };
}

// ---- the link -----------------------------------------------------------------------------------

/** @param {Tie} tie */
const tieCode = (tie) => (tie.kind === "point" ? "p" : `s${tie.repeats}`);

/**
 * The fragment for a link, without the leading "#": only the fields that differ from their
 * defaults, and the version.
 * @param {Partial<AppLink>} link
 * @returns {Promise<string>}
 */
export async function encodeLink(link) {
  const l = { ...DEFAULT_LINK, ...link };
  const d = DEFAULT_LINK;
  const q = new URLSearchParams();
  q.set("v", String(LINK_VERSION));
  if (l.workspace !== d.workspace) q.set("w", l.workspace);
  if (l.lang) q.set("lang", l.lang);
  if (l.step) q.set("step", l.step);
  if (l.deck) {
    q.set("h", String(l.deck.hooks));
    q.set("c", await encodeDeck(l.deck.cards, l.deck.hooks));
    if (!l.deck.loop) q.set("l", "0");
    if (tieCode(l.tie) !== "s1") q.set("t", tieCode(l.tie));
    if (l.pick) q.set("p", String(l.pick));
    if (l.stop) q.set("s", String(l.stop));
    if (l.follow) {
      q.set("f", String(l.follow.hook + 1));
      if (l.follow.end !== null) q.set("fe", String(l.follow.end));
      if (l.follow.end !== null && l.follow.pick !== null) q.set("fp", String(l.follow.pick + 1));
    }
    const own = l.follow ? Math.floor(l.follow.hook / 8) : 0;
    if (l.crossRow !== null && l.crossRow !== own) q.set("x", String(l.crossRow + 1));
  }
  if (l.warp !== d.warp) q.set("wc", l.warp.replace("#", "").toLowerCase());
  if (l.weft !== d.weft) q.set("fc", l.weft.replace("#", "").toLowerCase());
  if (l.sectionView !== d.sectionView) q.set("sv", l.sectionView);
  if (l.face !== d.face) q.set("face", l.face);
  if (l.bits) q.set("bits", "1");
  if (l.views.join() !== d.views.join()) q.set("view", l.views.join(","));
  if (l.game) {
    q.set("game", l.game.name);
    if (l.game.name === "name") {
      q.set("text", l.game.text);
      if (l.game.mode !== "damask") q.set("mode", l.game.mode);
    }
    if (l.game.name === "guess") q.set("seed", String(l.game.seed));
  }
  if (l.picture) {
    // the picture as a deck of rows, each row a card as wide as the picture (0.2.0)
    const n = l.picture.rows.length;
    q.set("pw", String(n));
    q.set("pic", await encodeDeck(l.picture.rows, n));
    if (l.picture.mode !== "direct") q.set("rd", l.picture.mode);
    if (l.picture.mode === "damask" && l.picture.k !== 4) q.set("k", String(l.picture.k));
    if (l.picture.mode === "direct" && l.picture.perRow !== 1) q.set("pp", String(l.picture.perRow));
  }
  // URLSearchParams writes "," as %2C; a link reads better with it as it is.
  return q.toString().replace(/%2C/g, ",");
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
 * Reads a fragment (with or without the "#"). Never throws: a link that cannot be read says
 * why, and nothing of it is used.
 * @param {string} fragment
 * @returns {Promise<{ ok: true; link: AppLink } | { ok: false; reason: Msg }>}
 */
export async function decodeLink(fragment) {
  const q = new URLSearchParams(fragment.replace(/^#/, ""));
  /** @param {Msg} why */
  const no = (why) => /** @type {{ ok: false; reason: Msg }} */ ({ ok: false, reason: msg("link.cannot", { why }) });
  /** @param {string} key @param {Record<string, string | number>} [params] */
  const noBecause = (key, params) => no(msg(key, params));
  const v = q.get("v");
  if (v !== String(LINK_VERSION)) return v === null ? noBecause("link.noVersion") : v === "1" ? noBecause("link.prototype") : noBecause("link.version", { v, mine: LINK_VERSION });

  /** @type {AppLink} */
  const l = structuredClone(DEFAULT_LINK);
  // Fields whose values may grow in later releases: a value not known yet falls back.
  const w = q.get("w");
  if (w !== null && /** @type {readonly string[]} */ (WORKSPACES).includes(w)) l.workspace = /** @type {Workspace} */ (w);
  const lang = q.get("lang");
  if (lang !== null && LANGS.includes(lang)) l.lang = lang;
  const step = q.get("step");
  if (step !== null) {
    if (!/^[a-z0-9-]{1,64}$/.test(step)) return noBecause("link.step", { step });
    l.step = step;
  }
  const views = q.get("view");
  if (views !== null) {
    const known = views.split(",").filter((x) => /** @type {readonly string[]} */ (STAGE_VIEWS).includes(x));
    if ([1, 2, 4].includes(known.length) && new Set(known).size === known.length) l.views = /** @type {StageView[]} */ (known);
  }

  // How things are shown.
  const colour = (/** @type {string} */ key, /** @type {string} */ fallback) => {
    const c = q.get(key);
    if (c === null) return fallback;
    return /^[0-9a-fA-F]{6}$/.test(c) ? `#${c.toLowerCase()}` : null;
  };
  const warp = colour("wc", l.warp);
  const weft = colour("fc", l.weft);
  if (warp === null || weft === null) return noBecause("link.colour");
  l.warp = warp;
  l.weft = weft;
  const sv = q.get("sv");
  if (sv !== null) {
    if (sv !== "whole" && sv !== "needles" && sv !== "crooks") return noBecause("link.value", { field: "sv", value: sv });
    l.sectionView = sv;
  }
  const face = q.get("face");
  if (face !== null) {
    if (face !== "front" && face !== "back") return noBecause("link.value", { field: "face", value: face });
    l.face = face;
  }
  const bits = q.get("bits");
  if (bits !== null) {
    if (bits !== "0" && bits !== "1") return noBecause("link.value", { field: "bits", value: bits });
    l.bits = bits === "1";
  }

  // A game (Play, 0.2.0): which, and its own fields; a game not known yet opens the first.
  const game = q.get("game");
  if (game !== null) {
    const name = /** @type {LinkGame["name"]} */ ((/** @type {readonly string[]} */ (LINK_GAMES)).includes(game) ? game : "name");
    const text = q.get("text") ?? "";
    if (text.length > MAX_TEXT) return noBecause("link.textLong", { most: MAX_TEXT });
    const mode = q.get("mode") ?? "damask";
    if (mode !== "damask" && mode !== "direct") return noBecause("link.value", { field: "mode", value: mode });
    const seed = q.has("seed") ? int(q.get("seed"), 1, 1_000_000_000) : 1;
    if (seed === null) return noBecause("link.range");
    l.game = { name, text, mode, seed };
  }

  // A picture (Create, 0.2.0): its rows, as wide as they are many, and how it is read.
  const pic = q.get("pic");
  if (pic !== null) {
    const n = int(q.get("pw"), 8, 32);
    if (n === null || !(/** @type {readonly number[]} */ (PICTURE_SIZES)).includes(n)) return noBecause("link.pictureSize", { pw: q.get("pw") ?? "" });
    const rows = await decodeDeck(pic, n);
    if (!rows.ok) return no(rows.reason);
    if (rows.cards.length !== n) return noBecause("link.pictureSquare", { n, rows: rows.cards.length });
    const rd = q.get("rd") ?? "direct";
    if (rd !== "direct" && rd !== "damask") return noBecause("link.value", { field: "rd", value: rd });
    const k = q.has("k") ? int(q.get("k"), 2, 6) : 4;
    const pp = q.has("pp") ? int(q.get("pp"), 1, 3) : 1;
    if (k === null || pp === null) return noBecause("link.range");
    l.picture = { rows: rows.cards, mode: rd, k, perRow: pp };
  } else if (q.has("pw")) return noBecause("link.pictureOnly");

  // The loom.
  const c = q.get("c");
  if (c === null) {
    if (q.has("h")) return noBecause("link.headOnly");
    return { ok: true, link: l };
  }
  const hooks = int(q.get("h"), 8, 64);
  if (hooks === null || !HOOK_COUNTS.includes(hooks)) return noBecause("link.hooks", { h: q.get("h") ?? "" });
  const deck = await decodeDeck(c, hooks);
  if (!deck.ok) return no(deck.reason);
  const loop = q.get("l");
  if (loop !== null && loop !== "0" && loop !== "1") return noBecause("link.value", { field: "l", value: loop });
  l.deck = { hooks, cards: deck.cards, loop: loop !== "0" };
  const t = q.get("t");
  if (t !== null) {
    if (t === "p") l.tie = { kind: "point" };
    else if (/^s[1-4]$/.test(t)) l.tie = { kind: "straight", repeats: Number(t[1]) };
    else return noBecause("link.value", { field: "t", value: t });
  }
  /** @param {string} key @param {number} min @param {number} max @param {number} fallback */
  const optional = (key, min, max, fallback) => (q.has(key) ? int(q.get(key), min, max) : fallback);
  const pick = optional("p", 0, 1_000_000, 0);
  const stop = optional("s", 0, 5, 0);
  const f = optional("f", 1, hooks, 0);
  const fe = optional("fe", 1, endCount(l.tie, hooks), 0);
  const fp = optional("fp", 1, 1_000_000, 0);
  const x = optional("x", 1, hooks / 8, 0);
  if (pick === null || stop === null || f === null || fe === null || fp === null || x === null) return noBecause("link.range");
  if ((fe && !f) || (fp && !fe) || (fe && hookOfEnd(l.tie, hooks, fe) !== f)) return noBecause("link.follow");
  l.pick = pick;
  l.stop = stop;
  l.follow = f ? { hook: f - 1, end: fe || null, pick: fp ? fp - 1 : null } : null;
  l.crossRow = x ? x - 1 : null;
  return { ok: true, link: l };
}
