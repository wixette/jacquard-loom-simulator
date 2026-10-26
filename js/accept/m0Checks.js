// M0 acceptance checks (design/simulator-plan.md §8.1): the logic, the cycle, and the 2D
// section as the layout draws it. They drive the loom through the same methods the page
// uses and measure the same shapes it draws. Run by tests/accept/m0.accept.test.js and by
// the developer page's ?selftest.

import { say, t } from "../l10n/l10n.js";
import { cylinderOut, griffeHeight } from "../sim/cycle.js";
import { makeDeck, PRESETS } from "../sim/deck.js";
import { hookX, KNIFE_REST_TOP, needleY } from "../sim/head.js";
import { Loom, STOP_KEYS, STOPS } from "../sim/loom.js";
import { P } from "../sim/params.js";
import { endCount, hookOfEnd, rowOfCard } from "../sim/tieup.js";
import { sectionLayout } from "../view2d/layout.js";
import { corners, fmt, pointSegment, polylinePolygon, result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { SectionLayout } from "../view2d/layout.js" */
/** @import { Tie } from "../sim/tieup.js" */

/** Readout tolerance, mm: the layout must put a part where the simulation says. */
const POS_TOL = 0.1;
/** A selected hook's crook sits on its knife: at most this far apart, mm. */
const CONTACT_TOL = 0.3;
/** Parts that must not touch keep at least this much apart, mm. */
const CLEAR_MIN = 0.5;
/** Fine sampling of one pick, for the cycle and the clearance checks. */
const SAMPLES = 400;
/** The full selected lift at the mails, mm. */
const FULL_LIFT = P.griffeLift - P.restGap;

/** @type {Record<string, Deck>} */
const DECKS = {
  plain: makeDeck(8, PRESETS.plain.rows, true),
  arrow: makeDeck(8, PRESETS.arrow.rows, false),
  blank: makeDeck(8, PRESETS.blank.rows, false),
  full: makeDeck(8, PRESETS.full.rows, false),
};

/** @type {[string, Tie][]} */
const TIES = [
  ["straight", { kind: "straight", repeats: 1 }],
  ["straight x 3", { kind: "straight", repeats: 3 }],
  ["point", { kind: "point" }],
];

/** The arrow as the research draws it (top line first); the cloth must weave it. */
const ARROW_DESIGN = ["00011000", "00111100", "01011010", "10011001", "00011000", "00011000", "00011000", "00011000"];

/** @param {boolean[]} row */
const bits = (row) => row.map((b) => (b ? "1" : "0")).join("");

/**
 * Snapshots of a pick sampled finely, by moving the loom (not by stepping).
 * @param {Deck} deck
 * @param {number} pick
 * @param {Tie} [tie]
 * @returns {Snapshot[]}
 */
function samplePick(deck, pick, tie) {
  const loom = new Loom(deck, tie);
  const out = [];
  for (let i = 0; i <= SAMPLES; i++) {
    loom.moveTo(pick, Math.min(i / SAMPLES, 0.999999));
    out.push(loom.snapshot());
  }
  return out;
}

/**
 * Everything a viewer could see change, rounded to what can be seen.
 * @param {Snapshot} s
 * @returns {string}
 */
function visible(s) {
  const h = s.head;
  const r = (/** @type {number} */ x) => Math.round(x * 2) / 2;
  return JSON.stringify([r(h.griffe), r(h.cylinderOut), r(h.turn * 90), h.needlePush.map(r), h.hooks.map((x) => r(x.lift)), s.cloth.length, s.pendingRow !== null, r(s.shuttle * 100), r(s.batten * 10), s.facingIndex]);
}

/** @returns {CheckResult} */
function selection() {
  /** @type {string[]} */
  const bad = [];
  for (const [name, deck] of Object.entries(DECKS)) {
    const loom = new Loom(deck);
    for (let pick = 0; pick < deck.cards.length + (deck.loop ? 3 : 0); pick++) {
      loom.moveTo(pick, 0);
      const s = loom.snapshot();
      const card = deck.cards[pick % deck.cards.length];
      const L = sectionLayout(s);
      card.forEach((hole, k) => {
        const pushed = s.head.needlePush[k] > P.needleProtrusion - POS_TOL;
        const still = s.head.needlePush[k] < POS_TOL;
        if (hole ? !still : !pushed) bad.push(`${name} pick ${pick + 1} needle ${k + 1}: push ${fmt(s.head.needlePush[k])}`);
        // Off the knife: the crook's far edge clears the knife's face; on it: the crook overlaps the knife.
        const knife = L.knives[k];
        const crookFar = L.hooks[k].crookEnd[0] - P.hookWire / 2;
        const off = crookFar > knife.x + knife.w + CLEAR_MIN;
        const over = crookFar < knife.x;
        if (hole ? !over : !off) bad.push(`${name} pick ${pick + 1} hook ${k + 1}: crook edge ${fmt(crookFar)}, knife ${fmt(knife.x)}..${fmt(knife.x + knife.w)}`);
      });
    }
  }
  return result("J0-1", "Blanks push their needles and hooks off the knives; holes leave them over the knives", bad.length === 0, bad.slice(0, 4).join("; ") || "4 decks, every pick, every hook");
}

/** @returns {CheckResult} */
function lift() {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  for (const [tname, tie] of TIES) {
    for (const [name, deck] of Object.entries(DECKS)) {
      const loom = new Loom(deck, tie);
      for (let pick = 0; pick < deck.cards.length; pick++) {
        loom.moveTo(pick, STOPS[1]);
        const s = loom.snapshot();
        const card = deck.cards[pick];
        for (let e = 1; e <= endCount(tie, 8); e++) {
          const want = card[hookOfEnd(tie, 8, e) - 1] ? FULL_LIFT : 0;
          n++;
          if (Math.abs(s.endLift[e - 1] - want) > POS_TOL) bad.push(`${tname} ${name} pick ${pick + 1} end ${e}: ${fmt(s.endLift[e - 1])} mm`);
        }
      }
    }
  }
  const blank = new Loom(DECKS.blank);
  blank.moveTo(0, STOPS[1]);
  if (blank.snapshot().endLift.some((x) => x > 0)) bad.push("the blank card lifted something");
  const full = new Loom(DECKS.full);
  full.moveTo(0, STOPS[1]);
  if (full.snapshot().endLift.some((x) => Math.abs(x - FULL_LIFT) > POS_TOL)) bad.push("the fully cut card did not lift every end");
  return result("J0-2", "At the open shed, an end is up exactly when its hook's hole is punched (3 ties)", bad.length === 0, bad.slice(0, 4).join("; ") || `${n} ends checked, lift ${fmt(FULL_LIFT)} mm`);
}

/** @returns {CheckResult} */
function cloth() {
  /** @type {string[]} */
  const bad = [];
  const arrow = new Loom(DECKS.arrow);
  while (arrow.stepForward().ok);
  const woven = arrow.cloth.map(bits);
  const want = [...ARROW_DESIGN].reverse();
  if (woven.join() !== want.join()) bad.push(`arrow woven as ${woven.join("/")}`);
  for (const [tname, tie] of TIES) {
    const loom = new Loom(DECKS.plain, tie);
    for (let i = 0; i < 6 * 5; i++) loom.stepForward();
    if (loom.cloth.length !== 5) bad.push(`${tname}: ${loom.cloth.length} rows after 5 picks`);
    loom.cloth.forEach((row, i) => {
      if (bits(row) !== bits(rowOfCard(tie, DECKS.plain.cards[i % 2], 8))) bad.push(`${tname} plain row ${i + 1}: ${bits(row)}`);
    });
  }
  return result("J0-3", "The cloth is the cards through the tie; the arrow deck weaves the arrow", bad.length === 0, bad.slice(0, 3).join("; ") || `arrow: ${woven.length} rows; plain: 5 rows x 3 ties`);
}

/** @returns {CheckResult} */
function order() {
  /** @type {string[]} */
  const bad = [];
  let pressAt = -1;
  for (let i = 0; i <= 4000; i++) {
    const phi = i / 4000;
    const g = griffeHeight(phi);
    const out = cylinderOut(phi);
    // (a) The cylinder lets the needles go only once the knives are under the crooks.
    if (phi < 0.5 && out > 0 && g <= P.restGap) bad.push(`cylinder out ${fmt(out)} at phi ${fmt(phi, 3)} before the knives catch (griffe ${fmt(g)})`);
    // (b) The shed is fully open while the shuttle flies.
    if (phi >= P.shuttle[0] && phi <= P.shuttle[1] && g < P.griffeLift - 1e-6) bad.push(`shed not full at phi ${fmt(phi, 3)}`);
    if (pressAt < 0 && phi > P.griffeFall[0] && out < P.needleProtrusion - 1e-6) pressAt = phi;
  }
  // (c) The next card is pressed after the hooks have landed and before the griffe is at rest.
  const g = griffeHeight(pressAt);
  if (!(g <= P.restGap && g > 0)) bad.push(`card pressed at phi ${fmt(pressAt, 3)} with the griffe at ${fmt(g)} mm`);
  return result("J0-4", "Cylinder waits for the knives; shed full during the shuttle; next card pressed before the griffe rests", bad.length === 0, bad.slice(0, 3).join("; ") || `card meets the needles at phi ${fmt(pressAt, 3)}, griffe ${fmt(g)} mm above rest`);
}

/** @returns {CheckResult} */
function indexAndLoop() {
  /** @type {string[]} */
  const bad = [];
  const plain = new Loom(DECKS.plain);
  for (let p = 0; p < 7; p++) {
    plain.moveTo(p, 0.5);
    if (plain.snapshot().cardIndex !== p % 2) bad.push(`plain pick ${p + 1} reads card ${plain.snapshot().cardIndex}`);
  }
  const arrow = new Loom(DECKS.arrow);
  let steps = 0;
  while (arrow.stepForward().ok) steps++;
  const refused = arrow.stepForward();
  if (steps !== 8 * STOPS.length) bad.push(`open arrow chain ran ${steps} steps`);
  const reason = refused.ok ? "" : say(refused.reason, "en");
  if (refused.ok || !/run out/.test(reason)) bad.push(`past the end: ${refused.ok ? "not refused" : reason}`);
  const empty = new Loom({ hooks: 8, cards: [], loop: true });
  const none = empty.stepForward();
  if (none.ok) bad.push("an empty chain started");
  return result("J0-5", "One card per pick; a loop wraps; an open chain refuses to run past its end", bad.length === 0, bad.join("; ") || `refused with: "${reason}"`);
}

/** @returns {CheckResult} */
function reverse() {
  /** @type {string[]} */
  const bad = [];
  const loom = new Loom(DECKS.arrow);
  const start = JSON.stringify(loom.snapshot());
  const back0 = loom.stepBack();
  if (back0.ok) bad.push("stepping back at the start was not refused");
  /** @type {string[]} */
  const seen = [];
  for (let i = 0; i < 30; i++) {
    seen.push(JSON.stringify(loom.snapshot()));
    loom.stepForward();
  }
  for (let i = 29; i >= 0; i--) {
    loom.stepBack();
    if (JSON.stringify(loom.snapshot()) !== seen[i]) {
      bad.push(`state after stepping back to step ${i} differs`);
      break;
    }
  }
  if (JSON.stringify(loom.snapshot()) !== start) bad.push("not back at the start");
  return result("J0-6", "Forward n steps then back n restores the cloth and every part exactly", bad.length === 0, bad.join("; ") || "30 steps (5 picks) out and back; refused at pick 0");
}

/** @returns {CheckResult} */
function stepStops() {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  for (const [name, deck] of Object.entries(DECKS)) {
    const loom = new Loom(deck);
    for (let i = 0; i < 6 * 10; i++) {
      const before = visible(loom.snapshot());
      const r = loom.stepForward();
      if (!r.ok) break;
      n++;
      const stop = i % STOPS.length;
      const words = say(r.message, "en");
      if (!words.startsWith(t(STOP_KEYS[stop], {}, "en"))) bad.push(`${name} step ${i + 1}: "${words.slice(0, 30)}"`);
      if (visible(loom.snapshot()) === before) bad.push(`${name} step ${i + 1} (${t(STOP_KEYS[stop], {}, "en")}) changed nothing visible`);
    }
  }
  return result("J0-7", "Every step changes something visible and is the next of the six named stops", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} steps over 4 decks`);
}

/** @returns {CheckResult} */
function readout() {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  for (const s of samplePick(DECKS.arrow, 4, { kind: "straight", repeats: 1 })) {
    const L = sectionLayout(s);
    const h = s.head;
    for (let k = 0; k < 8; k++) {
      n++;
      const checks = /** @type {[string, number, number][]} */ ([
        ["needle head", L.needles[k].head, -P.needleProtrusion + h.needlePush[k]],
        ["needle height", L.needles[k].y, needleY(k)],
        ["hook foot", L.hooks[k].shank[0][1], h.hooks[k].lift],
        ["hook top x", L.hooks[k].crookStart[0], hookX(k) + h.hooks[k].shift + h.hooks[k].deflect],
        ["knife top", L.knives[k].y + L.knives[k].h, KNIFE_REST_TOP + h.griffe],
        ["mail", L.mails[k].centre[1] - L.shed.rest, h.hooks[k].lift],
        ["eye on hook", (L.needles[k].eye[0] + L.needles[k].eye[1]) / 2, L.hooks[k].shank[3][0]],
        ["needle with the card", L.needles[k].push, h.cardPush[k]],
      ]);
      for (const [what, got, want] of checks) if (Math.abs(got - want) > POS_TOL) bad.push(`phi ${fmt(s.phi, 3)} hook ${k + 1} ${what}: ${fmt(got)} vs ${fmt(want)}`);
    }
  }
  return result("J0-8", "The section draws every needle, hook, knife and mail where the simulation puts it", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} hook-moments, within ${POS_TOL} mm`);
}

/** @returns {CheckResult} */
function clearance() {
  /** @type {string[]} */
  const bad = [];
  let worstClear = Infinity;
  let worstContact = 0;
  let worstCylinder = Infinity;
  for (const [name, deck] of [["arrow", DECKS.arrow], ["plain", DECKS.plain]]) {
    const d = /** @type {Deck} */ (deck);
    for (let pick = 0; pick < Math.min(d.cards.length, 6); pick++) {
      for (const s of samplePick(d, pick)) {
        const L = sectionLayout(s);
        const r = P.hookWire / 2;
        L.hooks.forEach((h) => {
          // Every hook against every knife (all pairs): only a caught hook's crook on its own knife is a designed contact.
          const upper = h.shank.slice(1);
          L.knives.forEach((knife) => {
            const own = knife.k === h.k;
            if (own && h.caught) {
              const gap = h.crookStart[1] - r - (knife.y + knife.h);
              worstContact = Math.max(worstContact, Math.abs(gap));
              const covers = h.crookEnd[0] - r < knife.x && h.crookStart[0] > knife.x + knife.w;
              if (Math.abs(gap) > CONTACT_TOL || !covers) bad.push(`${name} pick ${pick + 1} phi ${fmt(s.phi, 3)}: caught hook ${h.k + 1} ${fmt(gap)} mm off its knife`);
              return;
            }
            const dist = polylinePolygon(upper, corners(knife)) - r;
            // An upright hook over its own knife, about to be caught or just passed under, may come
            // as close as touching (the knife meets the crook there), but never into it.
            if (own && h.shift < 1e-9) {
              if (dist < -1e-6) bad.push(`${name} pick ${pick + 1} phi ${fmt(s.phi, 3)}: knife ${knife.k + 1} inside the crook of its upright hook`);
              return;
            }
            worstClear = Math.min(worstClear, dist);
            if (dist < CLEAR_MIN) bad.push(`${name} pick ${pick + 1} phi ${fmt(s.phi, 3)}: hook ${h.k + 1} ${fmt(dist)} mm from knife ${knife.k + 1}`);
          });
        });
        // While the cylinder turns, its corners (with the cards) clear the needle points.
        if (s.head.turn > 0 && s.head.turn < 1) {
          const poly = L.cylinder.corners;
          for (const n of L.needles) {
            let dist = Infinity;
            for (let i = 0; i < 4; i++) dist = Math.min(dist, pointSegment([n.head, n.y], poly[i], poly[(i + 1) % 4]));
            dist -= P.cardThickness + P.needleWire / 2;
            worstCylinder = Math.min(worstCylinder, dist);
            if (dist < CLEAR_MIN) bad.push(`${name} pick ${pick + 1} phi ${fmt(s.phi, 3)}: turning cylinder ${fmt(dist)} mm from needle ${n.k + 1}`);
          }
        }
      }
    }
  }
  return result(
    "J0-9",
    "Hooks clear every knife they are not caught by; caught crooks sit on their knives; the turning cylinder clears the needles",
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `closest hook to a knife ${fmt(worstClear)} mm; contact within ${fmt(worstContact, 3)} mm; turning cylinder ${fmt(worstCylinder)} mm from the needle points`,
  );
}

/** @returns {CheckResult} */
function needlesWithTheCard() {
  /** @type {string[]} */
  const bad = [];
  /** Between moments 1/2000 of a pick apart, no part of the head may move further (mm). */
  const STEP_MAX = 1.0;
  const STEPS = 2000;
  let worst = 0;
  for (const [name, deck] of Object.entries(DECKS)) {
    const loom = new Loom(deck);
    const picks = deck.loop ? 3 : deck.cards.length;
    /** @type {SectionLayout | null} */
    let before = null;
    for (let pick = 0; pick < picks; pick++) {
      for (let i = 0; i <= STEPS; i++) {
        const phi = i / STEPS;
        if (phi >= 1 && !(deck.loop || pick + 1 < deck.cards.length)) break;
        loom.moveTo(pick, Math.min(phi, 1));
        const snap = loom.snapshot();
        const L = sectionLayout(snap);
        // A needle moves only when the card on the cylinder touches it.
        const reach = Math.max(0, P.needleProtrusion - snap.head.cylinderOut);
        for (const n of L.needles) {
          if (n.push > reach + 1e-9) bad.push(`${name} pick ${pick + 1} phi ${fmt(phi, 4)}: needle ${n.k + 1} pushed ${fmt(n.push)} mm, but the card reaches only ${fmt(reach)} mm`);
        }
        if (before) {
          for (let k = 0; k < 8; k++) {
            const moves = [
              ["needle", Math.abs(L.needles[k].head - before.needles[k].head)],
              ["hook top", Math.abs(L.hooks[k].crookStart[0] - before.hooks[k].crookStart[0])],
              ["hook at its needle", Math.abs(L.hooks[k].shank[3][0] - before.hooks[k].shank[3][0])],
              ["hook lift", Math.abs(L.hooks[k].lift - before.hooks[k].lift)],
            ];
            for (const [what, d] of moves) {
              worst = Math.max(worst, /** @type {number} */ (d));
              if (/** @type {number} */ (d) > STEP_MAX) bad.push(`${name} pick ${pick + 1} phi ${fmt(phi, 4)}: ${what} ${k + 1} jumps ${fmt(/** @type {number} */ (d))} mm`);
            }
          }
        }
        before = L;
      }
    }
  }
  return result("J0-10", "Needles move only when the card touches them, and no needle or hook jumps, within a pick or from one pick to the next", bad.length === 0, bad.slice(0, 3).join("; ") || `${STEPS} moments a pick over 4 decks; the largest move between moments ${fmt(worst)} mm`);
}

/**
 * Every M0 check.
 * @returns {CheckResult[]}
 */
export function runM0Checks() {
  return [selection(), lift(), cloth(), order(), indexAndLoop(), reverse(), stepStops(), readout(), clearance(), needlesWithTheCard()];
}
