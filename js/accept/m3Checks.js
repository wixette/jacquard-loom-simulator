// M3 acceptance checks (design/m3-notes.md): the five 3D core units, loaded from their .glb
// files and posed through the page's own code (js/scene/units.js), measured against the 2D
// layouts the same moments give. Run by tests/accept/m3.accept.test.js (Node) and by
// dev/04-units's ?selftest (on the files the page loaded).

import * as THREE from "three";
import { cardForPick, presetDeck } from "../sim/deck.js";
import { headState, hookX } from "../sim/head.js";
import { Loom } from "../sim/loom.js";
import { FRAME, P, U } from "../sim/params.js";
import { sectionLayout } from "../view2d/layout.js";
import { realCard } from "../view2d/cardLayout.js";
import { sideLayout } from "../view2d/sideView.js";
import { cardPlaces } from "../scene/cards3d.js";
import { toMachine, toSection } from "../scene/frame.js";
import { anchors, gltfName } from "../scene/rig.js";
import { HOOK_LIFT, UNITS } from "../scene/units.js";
import { fmt, result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Unit, UnitId } from "../scene/units.js" */

/** Positions must match the 2D layouts (or each other, where parts meet) to within this (mm). */
export const POS_MM = 0.01;
/** Parts that must not touch keep at least this far apart (mm). */
export const CLEAR_MM = 0.5;
export const MAX_TRIANGLES = 10_000;
export const MAX_BYTES = 3 * 1024 * 1024;

/** Parts each unit must hold, moving or not (plan §5's inventory). */
const INVENTORY = /** @type {Record<UnitId, string[]>} */ ({
  selector: ["head.bottom_board", "head.needle_board", "springs.box", "cylinder.face_block"],
  cylinder: ["cylinder.frame", "cylinder.block", "cylinder.lantern", "cylinder.catch_top", "cylinder.catch_bottom"],
  griffe: ["griffe.knives", "griffe.plunger"],
  harness: ["harness.comber_board"],
  shed: ["warp.end.down", "warp.sheet.lower", "batten.race", "batten.reed"],
});

/**
 * @param {Unit} u
 * @param {string} name
 * @returns {THREE.Object3D}
 */
function part(u, name) {
  const o = u.root.getObjectByName(gltfName(name));
  if (!o) throw new Error(`${u.spec.file} has no ${name}`);
  return o;
}

/**
 * The anchor points of a part, in the 2D section's terms (mm).
 * @param {Unit} u
 * @param {string} name
 * @param {string} key
 */
const sec = (u, name, key) => anchors(part(u, name), key).map(toSection);
/**
 * The anchor points of a part in the machine frame (mm).
 * @param {Unit} u
 * @param {string} name
 * @param {string} key
 */
const mach = (u, name, key) => anchors(part(u, name), key).map(toMachine);

/**
 * Moments to measure: every pick of a few decks (one per cross-row's worth of hooks), at n
 * moments of each.
 * @param {number} n
 * @returns {Generator<Snapshot>}
 */
function* moments(n) {
  for (const [name, hooks] of /** @type {[string, number][]} */ ([["arrow", 8], ["twill", 16], ["satin", 8]])) {
    const deck = presetDeck(name, hooks);
    const loom = new Loom(deck);
    const picks = Math.min(deck.cards.length, 4);
    for (let pick = 0; pick < picks; pick++) {
      for (let i = 0; i < n; i++) {
        loom.moveTo(pick, i / n);
        yield loom.snapshot();
      }
    }
  }
}

/** @param {Record<UnitId, Unit>} units @returns {CheckResult} */
function contract(units) {
  /** @type {string[]} */
  const bad = [];
  let moving = 0;
  for (const spec of UNITS) {
    const u = units[spec.id];
    if (!u) {
      bad.push(`${spec.file} not loaded`);
      continue;
    }
    if (!u.root.getObjectByName(gltfName(spec.root))) bad.push(`${spec.file} has no root ${spec.root}`);
    for (const key of Object.keys(spec.nodes)) {
      moving++;
      if (!u.rig.parts[key].labelEn || u.rig.parts[key].labelEn === spec.nodes[key]) bad.push(`${spec.nodes[key]} has no label`);
    }
    for (const name of INVENTORY[spec.id]) if (!u.root.getObjectByName(gltfName(name))) bad.push(`${spec.file} has no ${name}`);
  }
  return result("J3-1", "Each unit's file holds its parts, every moving part one named node with its motion and a label (plan §5)", bad.length === 0, bad.slice(0, 3).join("; ") || `5 units, ${moving} moving parts`);
}

/** @param {Unit} u @returns {CheckResult} */
function selectorReadout(u) {
  const bad = [];
  let n = 0;
  let holes = 0;
  for (const snap of moments(60)) {
    for (let hook = 0; hook < snap.deck.hooks; hook++) {
      const k = hook % P.rows;
      const c = (hook - k) / P.rows;
      const L = sectionLayout(snap, c);
      u.pose(snap, hook);
      n++;
      const H = L.hooks[k];
      /** @param {string} what @param {number} got @param {number} want */
      const near = (what, got, want) => {
        if (Math.abs(got - want) > POS_MM) bad.push(`${what}: ${fmt(got)} for ${fmt(want)} (hook ${hook + 1}, phi ${fmt(snap.phi, 3)})`);
      };
      // The cross-row's 8 needles and springs, as the section of that cross-row has them.
      for (let j = 0; j < P.rows; j++) {
        const nd = L.needles[j];
        const point = sec(u, `needles.needle.${j}`, "point")[0];
        near(`needle ${j + 1}'s point`, point.x, nd.head);
        near(`needle ${j + 1}'s height`, point.y, nd.y);
        near(`needle ${j + 1}'s eye`, sec(u, `needles.needle.${j}`, "eye")[0].x, (nd.eye[0] + nd.eye[1]) / 2);
        near(`spring ${j + 1}'s end`, sec(u, `springs.spring.${j}`, "free_end")[0].x, nd.tail);
      }
      // The followed hook, at its own place in the row.
      const [end, start] = sec(u, "hooks.hook.0.crook", "underside");
      near("crook start", start.x + 0.5, H.crookStart[0]);
      near("crook height", start.y + P.hookWire / 2, H.crookStart[1]);
      near("crook end", end.x - 0.5, H.crookEnd[0]);
      near("hook at its needle", sec(u, "hooks.hook.0.upper", "at_needle")[0].x, H.shank[0][0] + H.shift);
      near("hook foot", sec(u, "hooks.hook.0", "foot")[0].y, H.lift);
      near("knife top", sec(u, "griffe.knife.0", "top")[1].y, L.knives[k].y + L.knives[k].h);
      near("knife face", sec(u, "griffe.knife.0", "top")[1].x, L.knives[k].x + L.knives[k].w);
      // The card facing the needles: its column for this cross-row at the needles, each
      // punched hole on the card's face, level with its needle and in line with it.
      const face = snap.facingIndex === null ? null : snap.deck.cards[snap.facingIndex];
      const fc = /** @type {import("../scene/cards3d.js").FacingCard} */ (u.facing);
      if (fc.group.visible !== (face !== null)) bad.push(`hook ${hook + 1} at phi ${fmt(snap.phi, 3)}: the card is ${fc.group.visible ? "shown with no card facing" : "missing"}`);
      if (face) {
        // Every hole position is shown: a punched hole dark, a blank one as a faint ring.
        if (fc.holes.count !== face.filter(Boolean).length || fc.holes.count + fc.blanks.count !== snap.deck.hooks) bad.push(`hook ${hook + 1}: the card shows ${fc.holes.count} holes and ${fc.blanks.count} blanks for ${face.filter(Boolean).length} of ${snap.deck.hooks}`);
        const row = fc.holesWorld(face, snap.deck.hooks).filter((h) => h.hook - (h.hook % P.rows) === hook - k);
        if (row.length !== face.slice(hook - k, hook - k + P.rows).filter(Boolean).length) bad.push(`hook ${hook + 1}: ${row.length} holes in its column`);
        for (const h of row) {
          holes++;
          const at = toSection(h.at);
          const nd = L.needles[h.hook % P.rows];
          const point = sec(u, `needles.needle.${h.hook % P.rows}`, "point")[0];
          near(`hole ${h.hook + 1} on the card's face`, at.x, -snap.head.cylinderOut);
          near(`hole ${h.hook + 1}'s height`, at.y, nd.y);
          near(`hole ${h.hook + 1} in line with its needle`, at.dy, point.dy);
        }
      }
    }
  }
  return result("J3-2", "U1 moves as the 2D section of the followed hook's cross-row: its 8 needles and springs, the followed hook (lift, push, held aside) at its own place, its knife, and the card on the cylinder's face, which shows every hole position (punched dark, blank as a faint ring) and whose column for that cross-row is at the needles with every punched hole level and in line with its needle", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} hook-moments over 3 decks (8 and 16 hooks); ${holes} hole positions`);
}

/** @param {Unit} u @returns {CheckResult} */
function selectorContact(u) {
  const bad = [];
  let caughtN = 0;
  let passN = 0;
  let worstPass = Infinity;
  let worstBeside = Infinity;
  const r = P.hookWire / 2;
  const nr = P.needleWire / 2;
  for (const snap of moments(120)) {
    for (let hook = 0; hook < snap.deck.hooks; hook++) {
      const k = hook % P.rows;
      u.pose(snap, hook);
      const h = snap.head.hooks[hook];
      const [end, start] = sec(u, "hooks.hook.0.crook", "underside");
      const tip = sec(u, "hooks.hook.0.crook", "tip")[0];
      const kr = sec(u, "griffe.knife.0", "top")[1];
      const kx1 = kr.x;
      const kx0 = kx1 - P.knifeThickness;
      const ktop = kr.y;
      const kbot = ktop - P.knifeHeight;
      const under = start.y; // the crook's underside
      // A caught hook rests on its knife.
      if (h.caught) {
        caughtN++;
        if (Math.abs(under - ktop) > POS_MM) bad.push(`hook ${hook + 1} caught but ${fmt(under - ktop)} mm off its knife at phi ${fmt(snap.phi, 3)}`);
        if (!(end.x - 0.5 < kx0 && start.x + 0.5 > kx1)) bad.push(`hook ${hook + 1}'s crook does not span its knife`);
      } else if (ktop > under + POS_MM && kbot < under + 2 * r) {
        // The knife is level with the crook: the crook must stand clear of it, aside.
        passN++;
        const gap = end.x - 0.5 - r - kx1;
        worstPass = Math.min(worstPass, gap);
        if (gap < CLEAR_MM - 1e-9) bad.push(`hook ${hook + 1}'s crook ${fmt(gap)} mm from the knife it is not caught by, at phi ${fmt(snap.phi, 3)}`);
      }
      // The crook's downturned tip never goes through a knife.
      if (tip.x + r > kx0 && tip.x - r < kx1 && tip.y - r < ktop - POS_MM && tip.y + r > kbot) bad.push(`hook ${hook + 1}'s tip inside the knife at phi ${fmt(snap.phi, 3)}`);
      // The hook passes inside its own needle's eye, clear of its wire, and beside the other
      // seven needles, clear of their shafts and their eyes.
      const shank = sec(u, "hooks.hook.0.upper", "at_needle")[0];
      for (let j = 0; j < P.rows; j++) {
        const eye = sec(u, `needles.needle.${j}`, "eye")[0];
        const point = sec(u, `needles.needle.${j}`, "point")[0];
        if (j === k) {
          if (Math.abs(shank.x - eye.x) > P.needleEye / 2 - r - nr + POS_MM || Math.abs(shank.dy - eye.dy) > POS_MM) bad.push(`hook ${hook + 1} outside its needle's eye at phi ${fmt(snap.phi, 3)}`);
        } else {
          const beside = Math.abs(shank.dy - point.dy) - r - nr;
          const fromEye = Math.abs(shank.x - eye.x) - (P.needleEye / 2 + nr) - r;
          worstBeside = Math.min(worstBeside, beside, fromEye);
          if (beside < CLEAR_MM || fromEye < CLEAR_MM) bad.push(`hook ${hook + 1} touches needle ${j + 1} at phi ${fmt(snap.phi, 3)}`);
        }
      }
      // The needles' points: on a blank each bears on the card; at a hole it goes into the bore.
      const face = snap.facingIndex === null ? null : snap.deck.cards[snap.facingIndex];
      const card = -snap.head.cylinderOut;
      for (let j = 0; j < P.rows; j++) {
        if (!face) continue;
        const point = sec(u, `needles.needle.${j}`, "point")[0].x;
        const blank = !face[hook - k + j];
        if (blank && point < card - POS_MM) bad.push(`needle ${j + 1} inside a blank by ${fmt(card - point)} at phi ${fmt(snap.phi, 3)}`);
        if (blank && snap.head.cylinderOut < P.needleProtrusion - POS_MM && Math.abs(point - card) > POS_MM) bad.push(`needle ${j + 1} not on its blank at phi ${fmt(snap.phi, 3)}`);
        if (!blank && point < card - P.cylinderFace) bad.push(`needle ${j + 1} deeper than the bore`);
      }
    }
  }
  return result("J3-3", "In U1 a caught hook rests on its knife, its crook spanning it; a hook not caught stands clear of the knife while the knife passes its crook, and no crook's tip goes through a knife; the hook passes inside its own needle's eye and beside the other seven needles; every needle bears on a blank and goes into the bore at a hole", bad.length === 0, bad.slice(0, 3).join("; ") || `${caughtN} caught and ${passN} passing hook-moments; a passing crook keeps ${fmt(worstPass)} mm from its knife, the hook ${fmt(worstBeside)} mm from the other needles`);
}

/** @param {Unit} u @returns {CheckResult} */
function cylinderUnit(u) {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  const h = U.lanternHalf;
  let worstHammer = 0;
  for (const snap of moments(60)) {
    u.pose(snap, 0);
    n++;
    const head = snap.head;
    // The prism turns by the cylinder's quarter turn, clockwise seen from the front (machine
    // X to the right, Z up): the top face comes round to the needles.
    const prism = part(u, "cylinder.prism");
    prism.updateWorldMatrix(true, false);
    const top = new THREE.Vector3(0, 1, 0).applyQuaternion(prism.getWorldQuaternion(new THREE.Quaternion()));
    const tilt = Math.atan2(top.x, top.y) * (180 / Math.PI); // the top face's normal, leaning toward +X (the needles)
    if (Math.abs(tilt - head.turn * 90) > 0.01) bad.push(`the top face leans ${fmt(tilt)} deg toward the needles for a turn of ${fmt(head.turn * 90)}`);
    // The spring hammer presses from below on the lantern's lowest corner, and no corner
    // goes down through it.
    const c = mach(u, "cylinder.batten", "lantern_centre")[0];
    const [f0, f1] = mach(u, "cylinder.hammer", "face");
    const t = (head.turn * Math.PI) / 2;
    let lowest = -Infinity;
    for (let i = 0; i < 4; i++) {
      const a = -t + Math.PI / 4 + (i * Math.PI) / 2;
      const px = c.x + h * Math.SQRT2 * Math.cos(a);
      const pz = c.z + h * Math.SQRT2 * Math.sin(a);
      const faceZ = f0.z + ((f1.z - f0.z) * (px - f0.x)) / (f1.x - f0.x);
      lowest = Math.max(lowest, faceZ - pz);
    }
    worstHammer = Math.max(worstHammer, Math.abs(lowest));
    if (Math.abs(lowest) > 0.05) bad.push(`hammer ${fmt(lowest)} mm off the lantern at phi ${fmt(snap.phi, 3)}`);
    // At rest the facing card's punched holes are level with their needles, on the needle board's side.
    if (snap.phi === 0) {
      const L = sectionLayout(snap, 0);
      const facing = cardPlaces(snap).find((p) => p.facing);
      const card = cardForPick(snap.deck, snap.pick);
      if (!facing || !card) bad.push(`no card at the needles at pick ${snap.pick + 1}`);
      else {
        for (const hole of facing.holes) {
          const s = toSection(hole.at);
          const row = hole.hook % 8;
          if (Math.abs(s.y - L.needles[row].y) > POS_MM || Math.abs(s.x - 0) > POS_MM) bad.push(`hole ${hole.hook + 1} at (${fmt(s.x)}, ${fmt(s.y)}), its needle at (0, ${fmt(L.needles[row].y)})`);
        }
        if (facing.holes.length !== card.filter(Boolean).length) bad.push(`${facing.holes.length} holes drawn for ${card.filter(Boolean).length} punched`);
      }
      // The pegs at the needles stand in the card's peg holes, on the needle face.
      const rc = realCard(snap.deck.hooks);
      const pegs = /** @type {import("../scene/cards3d.js").CylinderPegs} */ (u.pegs).atNeedles().map(toSection);
      rc.pegs.forEach((ph, i) => {
        const want = -3.5 * 6.9 + ph.x - rc.holes[0].x;
        if (Math.abs(pegs[i].dy - want) > POS_MM || Math.abs(pegs[i].y - L.needles.reduce((a, n) => a + n.y, 0) / 8) > POS_MM || pegs[i].x < -P.cardThickness - POS_MM) bad.push(`peg ${i + 1} at (${fmt(pegs[i].x)}, ${fmt(pegs[i].dy)}) mm, its peg hole at ${fmt(want)} mm along the cylinder`);
      });
    }
  }
  return result("J3-4", "U2: the cylinder turns forward by the cycle's quarter turn, its top face coming round to the needles; the spring hammer always presses from below on the lantern's lowest corner; at rest the card at the needles has every punched hole level with its needle at the needle board's face, and the pegs stand at the card's peg holes", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} moments; the hammer stays within ${fmt(worstHammer, 3)} mm of the lantern`);
}

/** @param {Unit} u @returns {CheckResult} */
function cardsFollowChain(u) {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  for (const snap of moments(40)) {
    u.pose(snap, 0);
    const L = sectionLayout(snap, 0);
    const chain = /** @type {import("../scene/cards3d.js").CardChain3D} */ (u.chain);
    const places = chain.places;
    const want = L.chain.cards;
    if (places.length !== want.length) {
      bad.push(`${places.length} cards in 3D, ${want.length} in 2D at phi ${fmt(snap.phi, 3)}`);
      continue;
    }
    places.forEach((p, i) => {
      n++;
      const c = want[i];
      if (p.index !== c.index || Math.abs(p.opacity - c.opacity) > 1e-9 || p.facing !== c.facing) bad.push(`card ${i}: card ${p.index + 1} for ${c.index + 1}`);
      if (p.holes.length !== snap.deck.cards[c.index].filter(Boolean).length || p.holes.length + p.blanks.length !== snap.deck.hooks) bad.push(`card ${c.index + 1} shows ${p.holes.length} holes and ${p.blanks.length} blanks`);
      const m = toSection(p.centre);
      const mid = [(c.hi[0] + c.lo[0]) / 2, (c.hi[1] + c.lo[1]) / 2];
      if (Math.hypot(m.x - mid[0], m.y - mid[1]) > P.cardThickness / 2 + POS_MM) bad.push(`card ${c.index + 1} ${fmt(Math.hypot(m.x - mid[0], m.y - mid[1]))} mm off its 2D place`);
      const v = [(c.lo[0] - c.hi[0]) / Math.hypot(c.lo[0] - c.hi[0], c.lo[1] - c.hi[1]), (c.lo[1] - c.hi[1]) / Math.hypot(c.lo[0] - c.hi[0], c.lo[1] - c.hi[1])];
      if (Math.abs(p.along.x - v[0]) > 1e-6 || Math.abs(p.along.y - v[1]) > 1e-6) bad.push(`card ${c.index + 1} turned off its 2D direction`);
    });
    const slots = chain.group.children.filter((o) => /** @type {THREE.Mesh} */ (o).geometry?.type === "BoxGeometry" && o.visible);
    if (slots.length !== places.length) bad.push(`${slots.length} card meshes shown for ${places.length} cards`);
  }
  return result("J3-5", "U2's cards are the 2D section's chain: the same cards, in the same places and directions, fading as they do, the card at the needles marked, each showing every hole position (punched or blank)", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} card-moments over 3 decks`);
}

/** @param {Unit} u @returns {CheckResult} */
function liftUnit(u) {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  let stretch = 0;
  const loom = new Loom(presetDeck("arrow", 8));
  loom.moveTo(0, 0);
  u.pose(loom.snapshot(), 0);
  const knives0 = mach(u, "griffe.knives", "knife_tops").map((p) => p.z);
  const plunger0 = mach(u, "griffe.plunger", "top")[0].z;
  const back0 = mach(u, "lift.head_lever", "ends")[0].z;
  const cord0 = mach(u, "lift.treadle", "cord")[0].z;
  const len0 = (() => {
    const [a, b] = mach(u, "lift.cord", "ends");
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  })();
  for (let i = 0; i <= 200; i++) {
    loom.moveTo(0, i / 200);
    const snap = loom.snapshot();
    u.pose(snap, 0);
    n++;
    const g = snap.head.griffe;
    /** @param {string} what @param {number} got @param {number} want */
    const near = (what, got, want) => {
      if (Math.abs(got - want) > POS_MM) bad.push(`${what}: ${fmt(got)} for ${fmt(want)} at phi ${fmt(snap.phi, 3)}`);
    };
    mach(u, "griffe.knives", "knife_tops").forEach((p, k) => near(`knife ${k + 1}`, p.z - knives0[k], g));
    near("plunger", mach(u, "griffe.plunger", "top")[0].z - plunger0, g);
    const rod = mach(u, "lift.rod", "ends");
    const [back, front] = mach(u, "lift.head_lever", "ends");
    near("rod at the plunger", rod[0].z, mach(u, "griffe.plunger", "top")[0].z);
    near("rod at the lever", rod[1].z, back.z);
    near("lever's back arm", back.z - back0, g);
    const tc = mach(u, "lift.treadle", "cord")[0];
    near("treadle's cord point", cord0 - tc.z, g);
    const [a, b] = mach(u, "lift.cord", "ends");
    near("cord at the treadle", Math.hypot(a.x - tc.x, a.y - tc.y, a.z - tc.z), 0);
    near("cord at the lever", Math.hypot(b.x - front.x, b.y - front.y, b.z - front.z), 0);
    stretch = Math.max(stretch, Math.abs(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) - len0));
    // The side view's treadle and lever say the same.
    const side = sideLayout(snap);
    near("2D treadle", cord0 - tc.z, U.treadleCord[1] - side.treadle.cordPoint[1]);
  }
  if (stretch > 1) bad.push(`the cord stretches by ${fmt(stretch)} mm`);
  return result("J3-6", "U3: the griffe's 8 knives and its plunger rise by the griffe's lift; the rod joins the plunger to the head lever's back arm, which rises as much; the treadle's cord point drops as much (as in the 2D side view); the cord stays joined to the treadle and the lever and does not stretch", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} moments of a pick; the cord's length changes by ${fmt(stretch, 3)} mm`);
}

/** @param {Unit} u @returns {CheckResult} */
function harnessUnit(u) {
  /** @type {string[]} */
  const bad = [];
  let n = 0;
  const root = part(u, "unit.harness");
  const xs = /** @type {number[]} */ (root.userData.repeat_x);
  for (const lift of [0, 10, 42.45, HOOK_LIFT]) {
    const snap = fakeLift(lift);
    u.pose(snap, 0);
    n++;
    /** @param {string} what @param {{ x: number, y: number, z: number }} got @param {[number, number, number]} want */
    const at = (what, got, want) => {
      const d = Math.hypot(got.x - want[0], got.y - want[1], got.z - want[2]);
      if (d > POS_MM) bad.push(`${what} ${fmt(d)} mm out at a lift of ${fmt(lift)}`);
    };
    const neck = mach(u, "harness.neck_cord.0", "ends");
    at("neck cord at the hook", neck[0], [hookX(0), FRAME.sectionY, FRAME.sectionZ + lift]);
    at("neck cord at the knot", neck[1], [hookX(0), FRAME.sectionY, FRAME.knotZ + lift]);
    xs.forEach((x, i) => {
      const R = i + 1;
      const up = mach(u, `harness.cord.0.${R}.upper`, "ends");
      at(`cord ${R} at the comber board`, up[0], [x, FRAME.sectionY, FRAME.comberZ]);
      at(`cord ${R} at the knot`, up[1], [hookX(0), FRAME.sectionY, FRAME.knotZ + lift]);
      const eye = mach(u, `harness.mail.0.${R}`, "eye")[0];
      at(`mail ${R}`, eye, [x, FRAME.sectionY, FRAME.warpZ + lift]);
      const low = mach(u, `harness.cord.0.${R}.lower`, "ends");
      at(`cord ${R} below the comber board`, low[0], [x, FRAME.sectionY, FRAME.comberZ]);
      at(`cord ${R} at its mail`, low[1], [x, FRAME.sectionY, eye.z + 7]);
      at(`lingo ${R}`, mach(u, `harness.lingo.0.${R}`, "top")[0], [x, FRAME.sectionY, eye.z - 7]);
      for (const [end, y] of /** @type {[string, number][]} */ ([["back", FRAME.backRestY], ["front", FRAME.fellY]])) {
        const e = mach(u, `warp.end.0.${R}.${end}`, "ends");
        at(`warp end ${R} (${end}) at its rest`, e[0], [x, y, FRAME.warpZ]);
        at(`warp end ${R} (${end}) through its mail`, e[1], [eye.x, eye.y, eye.z]);
      }
    });
  }
  return result("J3-7", "U4: as the hook rises, the neck cord, both harness cords (through the comber board), both mails and lingoes rise with it, and both warp ends pass through their mails; every cord stays joined end to end", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} lifts × 2 repeats`);
}

/**
 * A snapshot whose hook 1 is lifted by `lift` (for the harness, which only follows a hook's lift).
 * @param {number} lift
 * @returns {Snapshot}
 */
function fakeLift(lift) {
  const loom = new Loom(presetDeck("arrow", 8));
  const snap = loom.snapshot();
  const head = headState(new Array(8).fill(true), null, 0);
  head.hooks[0] = { ...head.hooks[0], lift, caught: lift > 0 };
  return { ...snap, head };
}

/** @param {Unit} u @returns {CheckResult} */
function shedUnit(u) {
  /** @type {string[]} */
  const bad = [];
  let crossing = 0;
  let minGap = Infinity;
  let struck = false;
  const root = part(u, "unit.shed");
  const [wx0, wx1] = /** @type {number[]} */ (root.userData.warp_x);
  const loom = new Loom(presetDeck("arrow", 8));
  for (let i = 0; i <= 400; i++) {
    loom.moveTo(2, Math.min(i / 400, 0.999999));
    const snap = loom.snapshot();
    u.pose(snap, 0);
    const side = sideLayout(snap);
    const lift = side.lift;
    /** @param {string} what @param {number} got @param {number} want */
    const near = (what, got, want) => {
      if (Math.abs(got - want) > POS_MM) bad.push(`${what}: ${fmt(got)} for ${fmt(want)} at phi ${fmt(snap.phi, 3)}`);
    };
    for (const end of ["back", "front"]) {
      const e = mach(u, `warp.end.up.${end}`, "ends")[1];
      near(`raised end (${end}) at the mails`, e.z, FRAME.warpZ + lift);
      near(`raised end (${end}) under the mails`, e.y, FRAME.sectionY);
      const s = mach(u, `warp.sheet.upper.${end}`, "ends")[1];
      near(`upper sheet (${end}) at the mails`, s.z, FRAME.warpZ + lift);
    }
    const reed = mach(u, "batten.reed", "face")[0].y;
    near("reed", reed + 1.5, side.batten.reedX);
    if (reed < FRAME.fellY) bad.push(`reed past the fell at phi ${fmt(snap.phi, 3)}`);
    if (reed - FRAME.fellY < 6 + CLEAR_MM) struck = true;
    for (const s of ["left", "right"]) near(`${s} sword at the race`, mach(u, `batten.sword.${s}`, "ends")[1].y, reed + 1.5 - 20);
    const [b0, b1] = mach(u, "shuttle.body", "box");
    if (b1.x > wx0 && b0.x < wx1) {
      crossing++;
      if (lift < HOOK_LIFT - POS_MM) bad.push(`shuttle in the warp with the shed ${fmt(lift)} mm open at phi ${fmt(snap.phi, 3)}`);
      if (b1.y > reed + POS_MM) bad.push(`shuttle behind the reed's face at phi ${fmt(snap.phi, 3)}`);
      if (b0.z < FRAME.warpZ) bad.push(`shuttle below the lower sheet at phi ${fmt(snap.phi, 3)}`);
      // The upper sheet runs straight from the fell up to the mails: lowest over the shuttle at its front edge.
      const sheet = FRAME.warpZ + (lift * (b0.y - FRAME.fellY)) / (FRAME.sectionY - FRAME.fellY);
      minGap = Math.min(minGap, sheet - b1.z);
      if (sheet - b1.z < 2) bad.push(`shuttle ${fmt(sheet - b1.z)} mm under the upper sheet at phi ${fmt(snap.phi, 3)}`);
    }
  }
  if (!struck) bad.push("the reed never reached the fell");
  if (crossing === 0) bad.push("the shuttle never crossed the warp");
  return result("J3-8", "U5: the raised end and the upper sheet rise at the mails by the shed's opening; the reed moves as in the 2D side view, beats up to the fell and never passes it; the shuttle is in the warp only while the shed is fully open, in front of the reed, on the lower sheet and clear under the upper one", bad.length === 0, bad.slice(0, 3).join("; ") || `401 moments; the shuttle crosses in ${crossing}, at least ${fmt(minGap)} mm under the upper sheet`);
}

/**
 * @param {Record<UnitId, Unit>} units
 * @param {Record<string, number>} bytes file sizes, by file name
 * @returns {CheckResult}
 */
function budget(units, bytes) {
  /** @type {string[]} */
  const bad = [];
  const counts = [];
  for (const spec of UNITS) {
    let tris = 0;
    units[spec.id].root.traverse((o) => {
      const m = /** @type {THREE.Mesh} */ (o);
      if (!m.isMesh || m.parent?.name === "cards") return;
      const g = m.geometry;
      tris += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
    });
    counts.push(`${spec.code} ${Math.round(tris)}`);
    if (tris > MAX_TRIANGLES) bad.push(`${spec.file}: ${Math.round(tris)} triangles`);
  }
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  if (Object.keys(bytes).length && total > MAX_BYTES) bad.push(`${(total / 1048576).toFixed(2)} MB in all`);
  return result("J3-9", `Each unit has under ${MAX_TRIANGLES / 1000}k triangles and the files together under ${MAX_BYTES / 1048576} MB`, bad.length === 0, bad.join("; ") || `${counts.join(", ")} triangles${Object.keys(bytes).length ? `; ${(total / 1024).toFixed(0)} kB in all` : ""}`);
}

/**
 * Runs the checks on the loaded units (each posed back at rest afterwards by the caller).
 * @param {Record<UnitId, Unit>} units
 * @param {Record<string, number>} [bytes]
 * @returns {CheckResult[]}
 */
export function runM3Checks(units, bytes = {}) {
  /** @type {CheckResult[]} */
  const out = [contract(units)];
  /** @param {string} id @param {string} title @param {() => CheckResult} fn */
  const guard = (id, title, fn) => {
    try {
      out.push(fn());
    } catch (e) {
      out.push(result(id, title, false, String(e)));
    }
  };
  guard("J3-2", "U1 readout", () => selectorReadout(units.selector));
  guard("J3-3", "U1 contact", () => selectorContact(units.selector));
  guard("J3-4", "U2 cylinder", () => cylinderUnit(units.cylinder));
  guard("J3-5", "U2 cards", () => cardsFollowChain(units.cylinder));
  guard("J3-6", "U3 lift", () => liftUnit(units.griffe));
  guard("J3-7", "U4 harness", () => harnessUnit(units.harness));
  guard("J3-8", "U5 shed", () => shedUnit(units.shed));
  guard("J3-9", "budget", () => budget(units, bytes));
  return out;
}
