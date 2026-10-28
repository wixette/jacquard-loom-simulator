// M1 acceptance checks (design/m1-notes.md): heads of 8 to 64 hooks, the real card, every
// cross-row in section, the ties through the front view, edits that never rewrite the
// cloth, the woven cloth, the trace, links, and the shed in the front and side views. They
// drive the loom through the page's own methods and measure the shapes the page draws.
// Run by tests/accept/m1.accept.test.js and by dev/02-loom's ?selftest.

import { say, t } from "../l10n/l10n.js";
import { cylinderOut } from "../sim/cycle.js";
import {
  addCard,
  cardForPick,
  cardIndexForPick,
  duplicateCard,
  HOOK_COUNTS,
  holeOfHook,
  hookOfHole,
  invertCard,
  moveCard,
  presetDeck,
  removeCard,
  setLoop,
  toggleHole,
} from "../sim/deck.js";
import { decodeLink, DEFAULT_LINK, encodeLink } from "../sim/link.js";
import { Loom, POSITIONS, STOP_KEYS, STOPS } from "../sim/loom.js";
import { P } from "../sim/params.js";
import { endCount, hookOfEnd, rowOfCard } from "../sim/tieup.js";
import { followCell, traceOf } from "../sim/trace.js";
import { COLUMN_PITCH, realCard, ROW_PITCH } from "../view2d/cardLayout.js";
import { clothCells } from "../view2d/clothView.js";
import { frontLayout, SHED } from "../view2d/frontView.js";
import { sectionLayout } from "../view2d/layout.js";
import { sideLayout } from "../view2d/sideView.js";
import { fmt, insideConvex, result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { AppLink } from "../sim/link.js" */
/** @import { Tie } from "../sim/tieup.js" */

/** Positions in the drawings must match the simulation to within this (mm or drawing units). */
const POS_TOL = 0.01;
/** Parts that must not touch keep at least this much apart (drawing units). */
const CLEAR_MIN = 0.5;

/** @type {Tie[]} */
const TIES = [
  { kind: "straight", repeats: 1 },
  { kind: "straight", repeats: 2 },
  { kind: "straight", repeats: 3 },
  { kind: "straight", repeats: 4 },
  { kind: "point" },
];
/** @param {Tie} t */
const tieName = (t) => (t.kind === "point" ? "point" : `straight x ${t.repeats}`);

/**
 * A small deterministic random number generator (mulberry32), so the checks are repeatable.
 * @param {number} seed
 * @returns {() => number}
 */
function rng(seed) {
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
 * @param {() => number} rand
 * @param {number} hooks
 * @param {number} n
 * @param {boolean} loop
 * @returns {Deck}
 */
function randomDeck(rand, hooks, n, loop) {
  return { hooks, loop, cards: [...Array(n)].map(() => [...Array(hooks)].map(() => rand() < 0.5)) };
}

/** @param {boolean[]} row */
const bits = (row) => row.map((b) => (b ? "1" : "0")).join("");

/** @returns {CheckResult} */
function cardAddressing() {
  /** @type {string[]} */
  const bad = [];
  for (const H of HOOK_COUNTS) {
    const rc = realCard(H);
    if (rc.holes.length !== H) bad.push(`${H} hooks: ${rc.holes.length} holes`);
    for (const hole of rc.holes) {
      const { column, row } = holeOfHook(hole.hook);
      if (hole.column !== column || hole.row !== row) bad.push(`${H}: hook ${hole.hook + 1} drawn at column ${hole.column + 1} row ${hole.row + 1}`);
      if (column !== Math.ceil((hole.hook + 1) / 8) - 1 || row !== (hole.hook % 8)) bad.push(`hook ${hole.hook + 1} is not at column ceil(h/8), row ((h-1) mod 8)+1`);
      if (hookOfHole(column, row) !== hole.hook) bad.push(`hookOfHole does not invert holeOfHook at ${hole.hook + 1}`);
      const first = rc.holes[0];
      if (Math.abs(hole.x - (first.x + column * COLUMN_PITCH)) > POS_TOL || Math.abs(hole.y - (first.y + row * ROW_PITCH)) > POS_TOL) bad.push(`${H}: hook ${hole.hook + 1} off the grid`);
      const r = rc.holeDiameter / 2;
      if (hole.x - r < 0 || hole.x + r > rc.width || hole.y - r < 0 || hole.y + r > rc.height) bad.push(`${H}: hook ${hole.hook + 1} off the card`);
      for (const p of rc.pegs) if (Math.hypot(hole.x - p.x, hole.y - p.y) < r + rc.pegDiameter / 2 + CLEAR_MIN) bad.push(`${H}: hook ${hole.hook + 1} runs into a peg hole`);
    }
    // Punching hole h of the unfolded strip and hole (column, row) of the real card is one act.
    const d = presetDeck("blank", H);
    const h = H - 3;
    const { column, row } = holeOfHook(h);
    const a = toggleHole(d, 0, h);
    const b = toggleHole(d, 0, hookOfHole(column, row));
    if (bits(a.cards[0]) !== bits(b.cards[0])) bad.push(`${H}: the strip and the real card punch different holes`);
  }
  return result("J1-1", "Hook h has its hole at column ceil(h/8), row ((h-1) mod 8)+1 of the real card; strip and card are one hole", bad.length === 0, bad.slice(0, 3).join("; ") || `${HOOK_COUNTS.join(", ")} hooks; card ${fmt(realCard(64).width, 1)} x ${fmt(realCard(64).height, 1)} mm at 64`);
}

/** @returns {CheckResult} */
function everyCrossRow() {
  /** @type {string[]} */
  const bad = [];
  const rand = rng(11);
  let n = 0;
  for (const H of [16, 24, 64]) {
    const deck = randomDeck(rand, H, 5, true);
    const loom = new Loom(deck);
    for (let pick = 0; pick < 5; pick++) {
      loom.moveTo(pick, 0);
      const s = loom.snapshot();
      const card = /** @type {boolean[]} */ (cardForPick(deck, pick));
      for (let c = 0; c < H / 8; c++) {
        const L = sectionLayout(s, c);
        const facing = L.cards.find((x) => x.facing);
        if (!facing) bad.push(`${H} hooks cross-row ${c + 1}: no card faces the needles`);
        else if (facing.holes.length !== card.slice(c * 8, c * 8 + 8).filter(Boolean).length) bad.push(`${H} cross-row ${c + 1}: the card in section has ${facing.holes.length} holes`);
        for (let k = 0; k < 8; k++) {
          n++;
          const hook = c * 8 + k;
          if (L.hooks[k].hook !== hook || L.needles[k].hook !== hook) bad.push(`${H} cross-row ${c + 1} row ${k + 1}: shows hook ${L.hooks[k].hook + 1}`);
          const pushed = L.needles[k].push > P.needleProtrusion - POS_TOL;
          if (card[hook] === pushed) bad.push(`${H} pick ${pick + 1} hook ${hook + 1}: needle ${pushed ? "pushed by a hole" : "not pushed by a blank"}`);
        }
      }
    }
  }
  return result("J1-2", "Each cross-row's section shows its own 8 hooks, read from its own column of the card", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} hook-moments over 16, 24 and 64 hooks`);
}

/** @returns {CheckResult} */
function tiesInFront() {
  /** @type {string[]} */
  const bad = [];
  const rand = rng(23);
  let n = 0;
  for (const H of [8, 16, 64]) {
    for (const tie of TIES) {
      const deck = randomDeck(rand, H, 3, true);
      const loom = new Loom(deck, tie);
      for (let pick = 0; pick < 3; pick++) {
        loom.moveTo(pick, STOPS[1]);
        const F = frontLayout(loom.snapshot());
        const E = endCount(tie, H);
        if (F.shed.top - F.shed.rest < SHED) bad.push(`${H} ${tieName(tie)}: the shed is drawn only ${fmt(F.shed.top - F.shed.rest)} units open`);
        if (F.mails.length !== E || F.cords.length !== E) bad.push(`${H} ${tieName(tie)}: ${F.mails.length} ends drawn, ${E} expected`);
        for (const m of F.mails) {
          n++;
          const h = hookOfEnd(tie, H, m.end) - 1;
          const want = deck.cards[pick][h];
          if (m.up !== want || Math.abs(m.y - F.shed.rest - (want ? F.shed.top - F.shed.rest : 0)) > POS_TOL) bad.push(`${H} ${tieName(tie)} pick ${pick + 1} end ${m.end}: ${m.up ? "up" : "down"}`);
          const cord = F.cords[m.end - 1];
          if (cord.hook !== h || Math.abs(cord.top[0] - F.hooks[h].x) > POS_TOL || Math.abs(cord.bottom[0] - m.x) > POS_TOL) bad.push(`${H} ${tieName(tie)}: end ${m.end}'s cord does not run from hook ${h + 1}`);
        }
      }
    }
  }
  return result("J1-3", "In the front view, an end is up exactly when its hook's hole is punched, its cord running from that hook (5 ties)", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} warp ends over 8, 16 and 64 hooks`);
}

/** @returns {CheckResult} */
function editsKeepCloth() {
  /** @type {string[]} */
  const bad = [];
  const ops = /** @type {[string, (d: Deck) => Deck][]} */ ([
    ["punch", (d) => toggleHole(d, 1, 3)],
    ["add", (d) => addCard(d, 0)],
    ["duplicate", (d) => duplicateCard(d, 2)],
    ["delete", (d) => removeCard(d, 0)],
    ["move", (d) => moveCard(d, 1, 1)],
    ["invert", (d) => invertCard(d, 2)],
    ["open the loop", (d) => setLoop(d, false)],
  ]);
  for (const [name, op] of ops) {
    const loom = new Loom(presetDeck("twill", 16));
    for (let i = 0; i < 3 * STOPS.length; i++) loom.stepForward();
    const before = loom.cloth.map(bits).join("/");
    loom.setDeck(op(loom.deck));
    if (loom.cloth.map(bits).join("/") !== before) bad.push(`${name} rewrote the cloth`);
    const ok = loom.canStart().ok;
    if (ok) {
      for (let i = 0; i < STOPS.length; i++) loom.stepForward();
      const want = bits(rowOfCard(loom.tie, cardForPick(loom.deck, 3), 16));
      if (bits(loom.cloth[3]) !== want) bad.push(`after ${name}, pick 4 was not woven from the edited chain`);
    }
  }
  return result("J1-4", "Editing the chain never rewrites cloth already woven; the next pick is woven from the edited chain", bad.length === 0, bad.join("; ") || `${ops.length} kinds of edit after 3 picks`);
}

/** @returns {CheckResult} */
function wovenCloth() {
  /** @type {string[]} */
  const bad = [];
  const loom = new Loom(presetDeck("arrow", 16), { kind: "straight", repeats: 2 });
  for (let i = 0; i < 6 * STOPS.length + 3; i++) loom.stepForward();
  const s = loom.snapshot();
  const rows = s.cloth.length + (s.pendingRow ? 1 : 0);
  const front = clothCells(s, "front");
  const back = clothCells(s, "back");
  if (front.length !== rows || back.length !== rows) bad.push(`${front.length} rows drawn, ${rows} expected`);
  front.forEach((row, r) => {
    const woven = r < s.cloth.length ? s.cloth[r] : /** @type {boolean[]} */ (s.pendingRow);
    row.forEach((c, j) => {
      if (c.end !== j + 1 || c.warpOver !== woven[j] || c.bit !== woven[j]) bad.push(`front row ${r + 1} end ${j + 1}`);
      const b = back[r][row.length - 1 - j];
      if (b.end !== c.end || b.warpOver === c.warpOver) bad.push(`back row ${r + 1} end ${j + 1}: not the front turned over`);
    });
    if (row.some((c) => c.pending) !== (r === s.cloth.length)) bad.push(`row ${r + 1} pending wrongly`);
  });
  return result("J1-5", "The cloth shows the warp's colour exactly where an end was lifted; the back is the front turned over", bad.length === 0, bad.slice(0, 3).join("; ") || `${rows} rows (one in the shed) x ${front[0]?.length ?? 0} ends, front and back`);
}

/** @returns {CheckResult} */
function trace() {
  /** @type {string[]} */
  const bad = [];
  const rand = rng(37);
  let n = 0;
  for (const tie of TIES) {
    const deck = randomDeck(rand, 24, 4, true);
    const loom = new Loom(deck, tie);
    loom.moveTo(6, 0);
    const s = loom.snapshot();
    for (let r = 0; r < s.cloth.length; r++) {
      for (let e = 1; e <= endCount(tie, 24); e++) {
        n++;
        const t = traceOf(s, followCell(s, r, e));
        const h = hookOfEnd(tie, 24, e) - 1;
        const card = deck.cards[/** @type {number} */ (cardIndexForPick(deck, r))];
        if (t.hook !== h || t.cardIndex !== cardIndexForPick(deck, r)) bad.push(`pick ${r + 1} end ${e}: hook ${t.hook + 1}, card ${t.cardIndex}`);
        if (t.hole !== card[h] || t.cell !== s.cloth[r][e - 1] || t.hole !== t.cell) bad.push(`pick ${r + 1} end ${e}: hole ${t.hole}, cell ${t.cell}`);
        if (!t.ends.includes(e)) bad.push(`pick ${r + 1} end ${e}: not among its hook's ends`);
        if (!sectionLayout(s, t.column).hooks.some((x) => x.hook === h)) bad.push(`hook ${h + 1} is not in the section of cross-row ${t.column + 1}`);
      }
    }
  }
  return result("J1-6", "Every cloth cell traces to its card, hole, cross-row, hook and ends, and the hole's bit is the cell's", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} cells over 5 ties`);
}

/**
 * J1-7, with the main app's link format since M5 (design/links.md): a loom round-trips through
 * a link, the format's example reads as documented, and a broken link is refused with a
 * reason. (The prototype's own format, v=1, is gone; tests/sim/link.test.js pins the new one.)
 * @returns {Promise<CheckResult>}
 */
async function links() {
  /** @type {string[]} */
  const bad = [];
  const rand = rng(41);
  let n = 0;
  for (let i = 0; i < 60; i++) {
    const hooks = HOOK_COUNTS[Math.floor(rand() * HOOK_COUNTS.length)];
    const hex = () => `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`;
    /** @type {AppLink} */
    const l = {
      ...DEFAULT_LINK,
      deck: { hooks, cards: randomDeck(rand, hooks, Math.floor(rand() * 12), true).cards, loop: rand() < 0.5 },
      tie: TIES[Math.floor(rand() * TIES.length)],
      warp: hex(),
      weft: hex(),
      pick: Math.floor(rand() * 50),
      stop: Math.floor(rand() * POSITIONS.length),
      // a cross-row other than the followed hook's (always in the first), or none
      crossRow: hooks > 8 && rand() < 0.5 ? 1 + Math.floor(rand() * (hooks / 8 - 1)) : null,
      follow: rand() < 0.5 ? null : { hook: Math.floor(rand() * 8), end: null, pick: null },
      face: rand() < 0.5 ? "front" : "back",
    };
    // an open chain goes no further than its end, where it rests after its last pick
    if (l.deck && !l.deck.loop && l.pick >= l.deck.cards.length) Object.assign(l, { pick: l.deck.cards.length, stop: 0 });
    const back = await decodeLink(await encodeLink(l));
    n++;
    if (!back.ok) bad.push(`round trip ${i + 1}: ${say(back.reason, "en")}`);
    else if (JSON.stringify(back.link) !== JSON.stringify(l)) bad.push(`round trip ${i + 1} differs`);
  }
  // The format's example (design/links.md) is part of the contract.
  const ex = await decodeLink("#v=2&w=weave&h=16&c=x.a5a5-5a5a&p=3&s=2&f=5");
  const want = { ...DEFAULT_LINK, deck: { hooks: 16, cards: [bitsOf("1010010110100101"), bitsOf("0101101001011010")], loop: true }, pick: 3, stop: 2, follow: { hook: 4, end: null, pick: null } };
  if (!ex.ok || JSON.stringify(ex.link) !== JSON.stringify(want)) bad.push(`the documented example reads as ${JSON.stringify(ex)}`);
  const broken = ["", "#v=1&h=8&d=ff", "#v=2&h=12&c=x.", "#v=2&h=8&c=x.zz", "#v=2&h=8&c=x.ff&t=q", "#v=2&h=8&c=x.ff&wc=red", "#v=2&h=8&c=x.ff&p=-1", "#v=2&h=8&c=x.ff&x=2", "#v=2&h=8&c=x.ff&face=side", "#v=2&h=8"];
  for (const b of broken) {
    try {
      const r = await decodeLink(b);
      if (r.ok) bad.push(`"${b}" was accepted`);
      else if (!say(r.reason, "en").startsWith("This link cannot be read")) bad.push(`"${b}": ${say(r.reason, "en")}`);
    } catch (e) {
      bad.push(`"${b}" threw ${e}`);
    }
  }
  return result("J1-7", "Links round-trip every state, read the documented example as documented, and refuse broken ones with a reason", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} random states; ${broken.length} broken links refused`);
}

/** @param {string} s */
function bitsOf(s) {
  return [...s].map((c) => c === "1");
}

/** @returns {CheckResult} */
function frontShed() {
  /** @type {string[]} */
  const bad = [];
  let worst = Infinity;
  const loom = new Loom(presetDeck("satin", 32), { kind: "point" });
  for (let pick = 0; pick < 3; pick++) {
    for (let i = 0; i <= 200; i++) {
      const phi = i / 200;
      loom.moveTo(pick, Math.min(phi, 0.999999));
      const s = loom.snapshot();
      const F = frontLayout(s);
      const sh = F.shuttle;
      const inShed = sh.x + sh.w > 0 && sh.x < F.width;
      if (phi < P.shuttle[0] && inShed) bad.push(`shuttle in the warp at phi ${fmt(phi, 3)} before the shuttle's time`);
      if (!inShed) continue;
      for (const m of F.mails) {
        if (m.x < sh.x || m.x > sh.x + sh.w) continue;
        const gap = m.up ? m.y - F.dot - (sh.y + sh.h) : sh.y - (m.y + F.dot);
        worst = Math.min(worst, gap);
        if (gap < CLEAR_MIN) bad.push(`pick ${pick + 1} phi ${fmt(phi, 3)}: shuttle ${fmt(gap)} from end ${m.end}`);
      }
      if (F.weft && !(F.weft[0][1] > F.shed.rest && F.weft[0][1] < F.shed.top)) bad.push(`weft outside the shed at phi ${fmt(phi, 3)}`);
    }
  }
  return result("J1-8", "In the front view the shuttle crosses only through the open shed, clear of every warp end, laying the weft between the sheets", bad.length === 0, bad.slice(0, 3).join("; ") || `closest end to the shuttle ${fmt(worst)} units`);
}

/** @returns {CheckResult} */
function sideShed() {
  /** @type {string[]} */
  const bad = [];
  const loom = new Loom(presetDeck("arrow", 8));
  let struck = false;
  let minShed = Infinity;
  for (let i = 0; i <= 400; i++) {
    const phi = Math.min(i / 400, 0.999999);
    loom.moveTo(4, phi);
    const s = loom.snapshot();
    const L = sideLayout(s);
    const lift = Math.max(...s.endLift);
    if (Math.abs(L.mails.lifted[1] - L.mails.rest[1] - lift) > POS_TOL) bad.push(`shed at the mails ${fmt(L.mails.lifted[1] - L.mails.rest[1])} at phi ${fmt(phi, 3)}`);
    if (Math.abs(L.treadle.cordPoint[1] - (330 - s.head.griffe)) > POS_TOL) bad.push(`treadle not down by the griffe's lift at phi ${fmt(phi, 3)}`);
    if (L.batten.reedX < L.fellX) bad.push(`reed past the fell at phi ${fmt(phi, 3)}`);
    if (L.batten.reedX - L.fellX < 6 + CLEAR_MIN) struck = true;
    if (L.shuttle && lift < P.griffeLift - P.restGap - POS_TOL) bad.push(`shuttle in a shed not fully open at phi ${fmt(phi, 3)}`);
    if (L.shuttle && L.shuttle.x + L.shuttle.w > L.batten.reedX) bad.push(`shuttle not in front of the reed at phi ${fmt(phi, 3)}`);
    if (L.shuttle) {
      // Under the upper warp, which runs from the lifted mails down to the fell: the shuttle's
      // top corner nearest the fell is where the shed is lowest.
      const [m, fell] = [L.warp.upper[1], L.warp.upper[2]];
      const sheet = fell[1] + ((m[1] - fell[1]) * (L.shuttle.x - fell[0])) / (m[0] - fell[0]);
      const gap = sheet - (L.shuttle.y + L.shuttle.h);
      minShed = Math.min(minShed, gap);
      if (gap < 2) bad.push(`shuttle ${fmt(gap)} mm under the upper warp at phi ${fmt(phi, 3)}`);
      if (L.shuttle.y < L.warp.lower[1][1]) bad.push(`shuttle below the lower warp at phi ${fmt(phi, 3)}`);
    }
    if (cylinderOut(phi) < 0) bad.push("cylinder inside the needle board");
  }
  if (!struck) bad.push("the reed never reached the fell");
  return result(
    "J1-9",
    "In the side view the shed at the mails is the hooks' lift, the treadle drives the griffe, the batten beats up to the fell, and the shuttle crosses on the race in front of the reed, clear under the upper warp",
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `400 moments of one pick; the shuttle at least ${fmt(minShed)} mm under the upper warp`,
  )
}

/** @returns {CheckResult} */
function bigHeadSteps() {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  for (const [H, tie] of /** @type {[number, Tie][]} */ ([[16, { kind: "straight", repeats: 3 }], [64, { kind: "point" }]])) {
    const loom = new Loom(presetDeck("satin", H), tie);
    for (let i = 0; i < 6 * 9; i++) {
      const before = JSON.stringify([loom.snapshot().head, loom.cloth.length, loom.snapshot().pendingRow !== null]);
      const r = loom.stepForward();
      if (!r.ok) {
        bad.push(`${H} hooks step ${i + 1} refused`);
        break;
      }
      n++;
      const words = say(r.message, "en");
      if (!words.startsWith(t(STOP_KEYS[i % STOPS.length], {}, "en"))) bad.push(`${H} hooks step ${i + 1}: "${words.slice(0, 24)}"`);
      if (JSON.stringify([loom.snapshot().head, loom.cloth.length, loom.snapshot().pendingRow !== null]) === before) bad.push(`${H} hooks step ${i + 1} changed nothing`);
    }
    for (let i = 0; i < 6 * 9; i++) loom.stepBack();
    if (loom.cloth.length !== 0 || loom.pick !== 0 || loom.phi !== 0) bad.push(`${H} hooks: not back at the start`);
  }
  return result("J1-10", "On 16 and 64 hooks every step is the next named stop and changes something; stepping back undoes it all", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} steps out and back`);
}

/** @returns {CheckResult} */
function cylinderFaces() {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  const decks = /** @type {[string, Deck][]} */ ([
    ["twill loop (4)", presetDeck("twill", 8)],
    ["arrow open (8)", presetDeck("arrow", 8)],
    ["satin loop (8), 24 hooks", presetDeck("satin", 24)],
  ]);
  for (const [name, deck] of decks) {
    const loom = new Loom(deck);
    const wrap = deck.loop && deck.cards.length <= 4;
    for (let pick = 0; pick < deck.cards.length; pick++) {
      for (const phi of [0, STOPS[0], 0.2, STOPS[1], STOPS[4]]) {
        loom.moveTo(pick, phi);
        const s = loom.snapshot();
        for (let c = 0; c < deck.hooks / 8; c++) {
          const L = sectionLayout(s, c);
          n++;
          const byOffset = new Map(L.faces.map((f) => [f.offset, f]));
          if (L.faces.length !== 4) bad.push(`${name} pick ${pick + 1}: ${L.faces.length} faces`);
          for (const f of L.faces) {
            // Posselt's order: the card at the needles on the needle face (until the turn starts:
            // then it swings off and hangs), the next card on top, the one after it down the outer
            // face, nothing underneath; a loop of 4 or fewer is a belt round all four faces.
            // Worked out here, not by the simulation.
            const r = pick + f.offset;
            const len = deck.cards.length;
            const exists = deck.loop ? true : r >= 0 && r < len;
            const onFace = wrap || f.offset === 1 || f.offset === 2 || (f.offset === 0 && s.head.turn === 0);
            const want = onFace && exists ? (((r % len) + len) % len) : null;
            if (f.index !== want) bad.push(`${name} pick ${pick + 1} phi ${fmt(phi, 2)}: face ${f.offset} shows card ${f.index === null ? "none" : f.index + 1}, not ${want === null ? "none" : want + 1}`);
            if (f.index !== null) {
              const card = deck.cards[f.index].slice(c * 8, c * 8 + 8);
              const marked = f.marks.map((m) => m.punched);
              if (marked.length !== 8 || marked.some((p, k) => p !== card[k])) bad.push(`${name} pick ${pick + 1}: face ${f.offset}'s marks are not card ${f.index + 1}'s holes`);
            } else if (f.marks.length !== 0 || f.strip.length !== 0) bad.push(`${name} pick ${pick + 1}: a face with no card shows a card`);
            // The next card's face is a quarter turn back from this one's (counter-clockwise in the
            // drawing), since the forward turn is clockwise and brings it up to here.
            const next = byOffset.get(f.offset + 1);
            if (next) {
              const ccw = [-f.normal[1], f.normal[0]];
              if (Math.abs(next.normal[0] - ccw[0]) > 1e-9 || Math.abs(next.normal[1] - ccw[1]) > 1e-9) bad.push(`${name}: the next card's face is not a quarter turn on from face ${f.offset}`);
            }
          }
          // Once the turn has started and until it is half done, the card that was at the
          // needles hangs and no card faces them; otherwise the facing card lies on its face.
          const facing = L.faces.filter((f) => f.facing);
          const between = !wrap && s.head.turn > 0 && !s.head.nextFacing;
          const wantFacing = s.facingIndex === null || between ? null : s.facingIndex;
          if (wantFacing === null ? facing.length !== 0 : facing.length !== 1 || facing[0].index !== wantFacing) bad.push(`${name} pick ${pick + 1} phi ${fmt(phi, 2)}: the face at the needles shows ${facing.map((f) => f.index)}, not card ${wantFacing}`);
          // Every drawn card spans one pitch of the chain, is laced to its neighbours, and has hole
          // 1 at its hi end (laced to the card after it: the top edge on the needle face).
          for (const card of L.chain.cards) {
            const span = Math.hypot(card.hi[0] - card.lo[0], card.hi[1] - card.lo[1]);
            if (Math.abs(span - P.cylinderFace) > POS_TOL) bad.push(`${name} pick ${pick + 1}: card ${card.index + 1} spans ${fmt(span)} mm`);
            const prev = L.chain.cards.find((x) => x.offset === card.offset - 1);
            if (prev && Math.hypot(prev.hi[0] - card.lo[0], prev.hi[1] - card.lo[1]) > POS_TOL) bad.push(`${name} pick ${pick + 1}: cards ${card.index + 1} and ${prev.index + 1} are not laced together`);
            const m0 = card.marks[0].at;
            const m7 = card.marks[7].at;
            if (Math.hypot(m0[0] - card.hi[0], m0[1] - card.hi[1]) > Math.hypot(m7[0] - card.hi[0], m7[1] - card.hi[1])) bad.push(`${name}: card ${card.index + 1}'s hole 1 is not at its hi end`);
          }
          // At rest the face at the needles looks straight at them, and each punched hole is level with its needle.
          if (phi === 0 && facing.length === 1 && facing[0].index !== null) {
            const f = facing[0];
            if (Math.abs(f.normal[0] - 1) > 1e-9) bad.push(`${name} pick ${pick + 1}: the facing face does not look at the needles`);
            const card = deck.cards[/** @type {number} */ (f.index)];
            const ys = L.needles.filter((nd) => card[nd.hook]).map((nd) => nd.y).sort((a, b) => a - b);
            const dots = f.dots.map((d) => d[1]).sort((a, b) => a - b);
            if (ys.length !== dots.length || ys.some((y, i) => Math.abs(y - dots[i]) > POS_TOL)) bad.push(`${name} pick ${pick + 1} cross-row ${c + 1}: the card's holes are not level with their needles`);
          }
        }
      }
    }
  }
  return result(
    "J1-11",
    "The chain lies over the cylinder in Posselt's order (the card at the needles, the next card on top, the one after down the outer face, nothing underneath; a loop of 4 or fewer wraps all four faces), turning clockwise to bring the top card to the needles; each card one pitch long and laced to its neighbours, hole 1 at its top edge on the needle face, its holes as the card has them and level with the needles",
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `${n} sections over 3 decks and 5 moments of every pick`,
  );
}

/**
 * Whether segments ab and cd cross each other's interiors (touching at an end does not count).
 * @param {[number, number]} a
 * @param {[number, number]} b
 * @param {[number, number]} c
 * @param {[number, number]} d
 */
function crosses(a, b, c, d) {
  const side = (/** @type {[number, number]} */ p, /** @type {[number, number]} */ q, /** @type {[number, number]} */ r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const e = 1e-6;
  const d1 = side(c, d, a);
  const d2 = side(c, d, b);
  const d3 = side(a, b, c);
  const d4 = side(a, b, d);
  return ((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e));
}

/** @returns {CheckResult} */
function chainContinuity() {
  /** @type {string[]} */
  const bad = [];
  /** Between two close moments a card may move this far (mm); further is a jump. */
  const STEP_MAX = 4;
  /** A card may appear or disappear only this faint. */
  const POP_MAX = 0.05;
  const decks = /** @type {[string, Deck][]} */ ([
    ["plain loop (2)", presetDeck("plain", 8)],
    ["twill loop (4)", presetDeck("twill", 8)],
    ["loop of 5", { hooks: 8, loop: true, cards: presetDeck("satin", 8).cards.slice(0, 5) }],
    ["loop of 6", { hooks: 8, loop: true, cards: presetDeck("satin", 8).cards.slice(0, 6) }],
    ["satin loop (8)", presetDeck("satin", 8)],
    ["loop of 12", { hooks: 8, loop: true, cards: [...presetDeck("satin", 8).cards, ...presetDeck("twill", 8).cards] }],
    ["arrow open (8)", presetDeck("arrow", 8)],
    ["open of 3", { hooks: 8, loop: false, cards: presetDeck("twill", 8).cards.slice(0, 3) }],
  ]);
  let moments = 0;
  /** @param {import("../view2d/layout.js").SectionLayout} L */
  const drawn = (L) => new Map(L.chain.cards.filter((c) => c.opacity > 0.01).map((c) => [c.index, c]));
  for (const [name, deck] of decks) {
    const loom = new Loom(deck);
    const repeats = deck.loop && deck.cards.length < 4;
    for (let pick = 0; pick < deck.cards.length + 2; pick++) {
      if (!deck.loop && pick >= deck.cards.length) break;
      /** @type {import("../view2d/layout.js").SectionLayout | null} */
      let before = null;
      for (let i = 0; i <= 400; i++) {
        loom.moveTo(pick, Math.min(i / 400, 0.999999));
        const L = sectionLayout(loom.snapshot());
        moments++;
        // One card is drawn once (a loop shorter than the four faces repeats, by design).
        const seen = new Set();
        for (const c of L.chain.cards) {
          if (c.opacity <= 0.01) continue;
          if (seen.has(c.index) && !repeats) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: card ${c.index + 1} drawn twice`);
          seen.add(c.index);
        }
        // A hanging card stays outside the prism.
        const prism = L.cylinder.corners;
        const cx = L.cylinder.centre;
        const inner = prism.map((p) => /** @type {[number, number]} */ ([cx[0] + (p[0] - cx[0]) * 0.97, cx[1] + (p[1] - cx[1]) * 0.97]));
        for (const c of L.chain.cards) {
          if (c.face !== null) continue;
          for (let s = 0.05; s <= 0.95; s += 0.1) {
            const q = /** @type {[number, number]} */ ([c.hi[0] + (c.lo[0] - c.hi[0]) * s, c.hi[1] + (c.lo[1] - c.hi[1]) * s]);
            if (insideConvex(q, inner)) {
              bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: hanging card ${c.index + 1} inside the cylinder`);
              break;
            }
          }
        }
        // The two strands never cross.
        const out = L.chain.cards.filter((c) => c.face === null && c.offset <= 0);
        const inc = L.chain.cards.filter((c) => c.face === null && c.offset > 0);
        for (const a of out) for (const b of inc) if (crosses(a.hi, a.lo, b.hi, b.lo)) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: the strands cross at cards ${a.index + 1} and ${b.index + 1}`);
        // Every card is held up: it lies on a face that does not look downward, or hangs
        // straight down from its lacing (a loop of 4 or fewer is a belt, held by itself).
        if (deck.cards.length > 4 || !deck.loop) {
          for (const c of L.chain.cards) {
            if (c.opacity <= 0.01) continue;
            const f = c.face === null ? null : L.faces.find((x) => x.offset === c.face);
            if (f && f.normal[1] < -1e-9) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: card ${c.index + 1} lies under the cylinder, with nothing to hold it up`);
            if (!f && Math.abs(c.hi[0] - c.lo[0]) > POS_TOL) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: hanging card ${c.index + 1} is not hanging straight down`);
          }
        }
        if (before) {
          const now = drawn(L);
          const was = drawn(before);
          for (const [index, c] of now) {
            const w = was.get(index);
            if (!w) {
              if (c.opacity > POP_MAX && !repeats) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: card ${index + 1} appears at opacity ${fmt(c.opacity)}`);
              continue;
            }
            const moved = Math.max(Math.hypot(c.hi[0] - w.hi[0], c.hi[1] - w.hi[1]), Math.hypot(c.lo[0] - w.lo[0], c.lo[1] - w.lo[1]));
            if (moved > STEP_MAX && !repeats) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: card ${index + 1} jumps ${fmt(moved)} mm`);
            if (Math.abs(c.outside - w.outside) > 0.05 && !repeats) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: card ${index + 1}'s number jumps sides`);
          }
          for (const [index, w] of was) if (!now.has(index) && w.opacity > POP_MAX && !repeats) bad.push(`${name} pick ${pick + 1} phi ${fmt(i / 400, 3)}: card ${index + 1} vanishes at opacity ${fmt(w.opacity)}`);
        }
        before = L;
      }
      // The end of one pick is the start of the next: every card is where it was.
      if (deck.loop || pick + 1 < deck.cards.length) {
        loom.moveTo(pick, 0.999999);
        const end = drawn(sectionLayout(loom.snapshot()));
        loom.moveTo(pick + 1, 0);
        const start = drawn(sectionLayout(loom.snapshot()));
        for (const [index, c] of start) {
          const e = end.get(index);
          if (!e) {
            if (c.opacity > POP_MAX && !repeats) bad.push(`${name} pick ${pick + 2} starts with card ${index + 1} appearing`);
            continue;
          }
          const moved = Math.max(Math.hypot(c.hi[0] - e.hi[0], c.hi[1] - e.hi[1]), Math.hypot(c.lo[0] - e.lo[0], c.lo[1] - e.lo[1]));
          if (moved > POS_TOL && !repeats) bad.push(`${name}: card ${index + 1} moves ${fmt(moved)} mm between pick ${pick + 1}'s end and pick ${pick + 2}'s start`);
          if (Math.abs(c.outside - e.outside) > 0.01 && !repeats) bad.push(`${name}: card ${index + 1}'s number changes sides between pick ${pick + 1}'s end and pick ${pick + 2}'s start`);
        }
        for (const [index, e] of end) if (!start.has(index) && e.opacity > POP_MAX && !repeats) bad.push(`${name} pick ${pick + 2} starts with card ${index + 1} gone`);
      }
    }
  }
  return result(
    "J1-12",
    "The chain moves continuously and as gravity lets it: no card or card number jumps, appears or vanishes (cards enter and leave by fading), none is drawn twice, every card lies on a face that does not look downward or hangs straight down (none clings under the cylinder), none hangs inside the cylinder, the strands never cross, and each pick ends where the next begins",
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `${moments} moments over 8 chains, loops of 2 to 12 cards and open chains`,
  );
}

/**
 * Every M1 check (asynchronous since links are: design/links.md).
 * @returns {Promise<CheckResult[]>}
 */
export async function runM1Checks() {
  return [cardAddressing(), everyCrossRow(), tiesInFront(), editsKeepCloth(), wovenCloth(), trace(), await links(), frontShed(), sideShed(), bigHeadSteps(), cylinderFaces(), chainContinuity()];
}
