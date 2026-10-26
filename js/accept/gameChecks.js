// The name game's acceptance checks (design/name-game-notes.md): the font, the text's rules, and
// the round trip that makes it a fair game: the cards woven through the loom's own steps give a
// cloth that reads back as the text typed, in both readings. runGameChecks() needs no DOM
// (tests/accept/game.accept.test.js and dev/06-name-game's ?selftest).

import { Loom } from "../sim/loom.js";
import { checkText, decodeCloth, DIRECT_HOOKS_MAX, glyph, GLYPH_H, GLYPH_W, MAX_CHARS, planName, REFERENCE_HOOKS } from "../game/nameGame.js";
import { result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */
/** @import { NamePlan } from "../game/nameGame.js" */

/**
 * Weaves a plan's whole chain, through the loom's steps or by moving to its end.
 * @param {NamePlan} plan
 * @param {boolean} [stepped]
 * @returns {boolean[][]}
 */
export function weaveAll(plan, stepped = false) {
  const loom = new Loom(plan.deck);
  if (stepped) {
    let guard = plan.deck.cards.length * 8 + 8;
    while (loom.cloth.length < plan.deck.cards.length && guard-- > 0) if (!loom.stepForward().ok) break;
  } else loom.moveTo(plan.deck.cards.length, 0);
  return loom.cloth.map((r) => [...r]);
}

/** @returns {CheckResult} */
function font() {
  const bad = [];
  const seen = new Map();
  for (let c = 32; c <= 126; c++) {
    const ch = String.fromCharCode(c);
    const g = glyph(ch);
    if (g.length !== GLYPH_H || g.some((r) => r.length !== GLYPH_W)) bad.push(`${ch} is not 8 × 16`);
    const key = g.flat().join("");
    if (seen.has(key)) bad.push(`${ch} looks like ${seen.get(key)}`);
    seen.set(key, ch);
    if (c > 32 && !g.flat().some(Boolean)) bad.push(`${ch} is blank`);
  }
  return result("G-1", "The font (Unscii 8 × 16) has all 95 printable ASCII characters, each 8 × 16 pixels, no two alike, none blank but the space", bad.length === 0, bad.slice(0, 3).join("; ") || "95 glyphs");
}

/** @returns {CheckResult} */
function rules() {
  const bad = [];
  const ok = ["JACQUARD", "Ada\nLovelace", "a b", "~!@#$%^&", "12345678\nx\ny\nz"];
  const refused = ["", "   \n  ", "Café", "ABCDEFGHI", "a\nb\nc\nd\ne", "tab\there"];
  for (const t of ok) if (!checkText(t).ok) bad.push(`${JSON.stringify(t)} refused`);
  for (const t of refused) {
    const r = checkText(t);
    if (r.ok || !r.reason) bad.push(`${JSON.stringify(t)} accepted`);
  }
  // A line of 8 characters fits both heads; one of 9 is refused before any cards are cut.
  const d = planName("ABCDEFGH", "damask");
  if (!d.ok || d.plan.deck.hooks > REFERENCE_HOOKS) bad.push("8 characters do not fit the 400 head as damask");
  const q = planName("ABCDEFGH", "direct");
  if (!q.ok || q.plan.deck.hooks !== DIRECT_HOOKS_MAX) bad.push("8 characters do not fill the 64-hook head directly");
  return result("G-2", `Up to ${MAX_CHARS} printable ASCII characters a line, up to 4 lines, are accepted; anything else is refused with a reason; 8 characters fit the 400 head as damask (256 hooks) and the 64-hook head directly`, bad.length === 0, bad.slice(0, 3).join("; ") || `${ok.length} texts accepted, ${refused.length} refused`);
}

/**
 * @param {"damask" | "direct"} mode
 * @param {string} id
 * @returns {CheckResult}
 */
function roundTrip(mode, id) {
  const bad = [];
  const texts = ["JACQUARD", "Ada\nLovelace", "1801", "Hello,\nworld!", "{[(<>)]}", "a"];
  let cards = 0;
  let worstFloat = 0;
  for (const t of texts) {
    const r = planName(t, mode);
    if (!r.ok) {
      bad.push(`${JSON.stringify(t)}: ${r.reason}`);
      continue;
    }
    const p = r.plan;
    const k = mode === "damask" ? 4 : 1;
    if (p.deck.cards.length !== p.lines.length * GLYPH_H * k) bad.push(`${JSON.stringify(t)}: ${p.deck.cards.length} cards`);
    cards += p.deck.cards.length;
    // Woven through the loom's own steps (the short texts) or to the end, the cloth reads back.
    const cloth = weaveAll(p, p.deck.cards.length <= 64);
    const read = decodeCloth(cloth, p);
    if (read.join("\n") !== p.lines.map((l) => l.trim()).join("\n")) bad.push(`${JSON.stringify(t)} reads back as ${JSON.stringify(read.join("\n"))}`);
    if (mode === "damask") worstFloat = Math.max(worstFloat, p.floats.longestWarp, p.floats.longestWeft);
  }
  if (mode === "damask" && worstFloat > 8) bad.push(`a float of ${worstFloat} threads in damask`);
  const what = mode === "damask" ? "As damask (4 × 4 threads of satin a pixel, on up to 256 of the 400 head's hooks), with no loose thread longer than 8" : "Directly (one pixel per thread, on up to 64 hooks)";
  return result(id, `${what}, every text's cards, woven through the loom, give a cloth that reads back as the text`, bad.length === 0, bad.slice(0, 3).join("; ") || `${texts.length} texts, ${cards} cards${mode === "damask" ? `, longest float ${worstFloat}` : ""}`);
}

/** @returns {CheckResult[]} */
export function runGameChecks() {
  return [font(), rules(), roundTrip("damask", "G-3"), roundTrip("direct", "G-4")];
}
