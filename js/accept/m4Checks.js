// M4 acceptance checks (design/m4-notes.md): the ghosted whole machine with the units in
// place and the repeat bands, lessons L8–L10 with the true-size cards, and the "Parts in 3D"
// view of the learner page. runM4Checks() needs no DOM and runs in Node
// (tests/accept/m4.accept.test.js) and in the pages' ?selftest; runM4PageChecks() drives the
// learner page itself, in the browser only.

import * as THREE from "three";
import { HOOK_COUNTS, makeDeck, presetDeck } from "../sim/deck.js";
import { Loom } from "../sim/loom.js";
import { FRAME, P, PARAMS as params } from "../sim/params.js";
import { toMachine } from "../scene/frame.js";
import { anchors, gltfName } from "../scene/rig.js";
import { UNITS } from "../scene/units.js";
import { LESSONS } from "../teach/lessons.js";
import { cardsPerPage, pageSvg } from "../teach/printCards.js";
import { realCard } from "../view2d/cardLayout.js";
import { fmt, result } from "./harness.js";
import { MAX_BYTES, MAX_TRIANGLES } from "./m3Checks.js";
/** @import { CheckResult } from "./harness.js" */
/** @import { Unit, UnitId } from "../scene/units.js" */
/** @import { LearnerPage } from "../app/learnerPage.js" */

/** Tolerance for "inside" (mm). */
const IN_MM = 0.5;

/** The ghost's parts (plan §5). */
const SHELL = ["loom.frame", "head.housing", "head.frame", "loom.card_rack", "loom.card_chain", "loom.comber_board", "loom.beams", "loom.cloth"];
/** The reference head (params reference_head): 52 cross-rows of 8 needles, 400 working hooks, 4 repeats. */
const REF = { needles: params.reference_head.cross_rows.v * P.rows, hooks: params.reference_head.hooks.v, repeats: params.reference_head.repeats.v };
/** The bands, what each must hold, and the count each states. */
const BANDS = /** @type {{ name: string, unit: UnitId, count: number }[]} */ ([
  { name: "band.hooks", unit: "selector", count: REF.needles },
  { name: "band.needles", unit: "selector", count: REF.needles },
  { name: "band.harness", unit: "harness", count: REF.hooks * REF.repeats },
  { name: "band.warp", unit: "shed", count: REF.hooks * REF.repeats },
]);

/**
 * @param {THREE.Object3D} root
 * @param {string} name
 */
function find(root, name) {
  const o = root.getObjectByName(gltfName(name));
  if (!o) throw new Error(`no ${name}`);
  return o;
}

/**
 * A box from two anchor corners, machine mm.
 * @param {THREE.Object3D} o
 */
function boxOf(o) {
  const [a, b] = anchors(o, "box").map(toMachine);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
}

/**
 * @param {{ x0: number, x1: number, y0: number, y1: number, z0: number, z1: number }} b
 * @param {{ x: number, y: number, z: number }} p
 */
const inside = (b, p) => p.x >= b.x0 - IN_MM && p.x <= b.x1 + IN_MM && p.y >= b.y0 - IN_MM && p.y <= b.y1 + IN_MM && p.z >= b.z0 - IN_MM && p.z <= b.z1 + IN_MM;

/**
 * The machine-mm box of the shown meshes under an object.
 * @param {THREE.Object3D} o
 */
function meshBox(o) {
  const box = new THREE.Box3();
  o.updateWorldMatrix(true, true);
  o.traverseVisible((m) => {
    if (/** @type {THREE.Mesh} */ (m).isMesh) box.union(new THREE.Box3().setFromObject(m, false));
  });
  const a = toMachine(box.min);
  const b = toMachine(box.max);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
}

/** @param {THREE.Object3D} context @returns {CheckResult} */
function contract(context) {
  /** @type {string[]} */
  const bad = [];
  for (const name of SHELL) {
    try {
      const o = find(context, name);
      if (!o.userData.translucent || !o.userData.label_en) bad.push(`${name} is not marked translucent and labelled`);
    } catch (e) {
      bad.push(String(e));
    }
  }
  for (const b of BANDS) {
    try {
      const o = find(context, b.name);
      const label = String(o.userData.label_en ?? "");
      if (!o.userData.band || !o.userData.note_en) bad.push(`${b.name} has no band note`);
      if (o.userData.unit_ref !== b.unit) bad.push(`${b.name} refers to ${o.userData.unit_ref}`);
      if (!label.replace(/,/g, "").includes(String(b.count))) bad.push(`${b.name} says "${label}", not ${b.count}`);
    } catch (e) {
      bad.push(String(e));
    }
  }
  return result("J4-1", `The ghosted machine holds the frame, the beams, the head's housing and frame, the card rack and chain, the comber board and the cloth, translucent and named, and four repeat bands, each naming its unit and its count for the reference 400 head (${REF.needles} hooks and needles = ${REF.needles / P.rows} × ${P.rows}; ${REF.hooks} working hooks × ${REF.repeats} repeats = ${REF.hooks * REF.repeats} ends)`, bad.length === 0, bad.slice(0, 3).join("; ") || `${SHELL.length} shell parts, ${BANDS.length} bands`);
}

/**
 * Poses every unit at n moments of a pick and calls fn at each.
 * @param {Record<UnitId, Unit>} units
 * @param {number} n
 * @param {(phi: number) => void} fn
 */
function throughAPick(units, n, fn) {
  const loom = new Loom(presetDeck("arrow", 8));
  for (let i = 0; i <= n; i++) {
    loom.moveTo(2, Math.min(i / n, 0.999999));
    const snap = loom.snapshot();
    for (const u of Object.values(units)) u.pose(snap, 3);
    fn(snap.phi);
  }
}

/** @param {THREE.Object3D} context @param {Record<UnitId, Unit>} units @returns {CheckResult} */
function inPlace(context, units) {
  /** @type {string[]} */
  const bad = [];
  const [e0, e1] = anchors(find(context, "context"), "extent").map(toMachine);
  const frame = { x0: e0.x, x1: e1.x, y0: e0.y, y1: e1.y, z0: 0, z1: FRAME.sectionZ + 700 };
  const housing = meshBox(find(context, "head.housing"));
  let n = 0;
  throughAPick(units, 40, (phi) => {
    for (const spec of UNITS) {
      const b = meshBox(units[spec.id].root);
      n++;
      for (const p of [{ x: b.x0, y: b.y0, z: b.z0 }, { x: b.x1, y: b.y1, z: b.z1 }]) {
        if (!inside(frame, p)) bad.push(`${spec.code} reaches (${fmt(p.x, 0)}, ${fmt(p.y, 0)}, ${fmt(p.z, 0)}) outside the loom at phi ${fmt(phi, 2)}`);
      }
    }
    const sel = units.selector;
    for (const [name, key] of [["needles.needle.0", "point"], ["needles.needle.0", "tail"], ["hooks.hook.0", "foot"], ["hooks.hook.0.crook", "tip"], ["griffe.knife.0", "top"]]) {
      for (const p of anchors(find(sel.root, name), key).map(toMachine)) if (!inside(housing, p)) bad.push(`U1's ${name} (${key}) outside the head's housing at phi ${fmt(phi, 2)}`);
    }
    const tread = anchors(find(units.griffe.root, "lift.treadle"), "cord").map(toMachine)[0];
    if (tread.z < 0) bad.push("the treadle goes through the floor");
  });
  return result("J4-2", "Every unit stands inside the ghosted loom through a whole pick, and U1's needle, hook and knife inside the head's housing; the treadle stays above the floor", bad.length === 0, bad.slice(0, 3).join("; ") || `${n} unit-moments; the head's housing ${fmt(housing.x1 - housing.x0, 0)} × ${fmt(housing.y1 - housing.y0, 0)} × ${fmt(housing.z1 - housing.z0, 0)} mm`);
}

/** @param {THREE.Object3D} context @param {Record<UnitId, Unit>} units @returns {CheckResult} */
function bandsHold(context, units) {
  /** @type {string[]} */
  const bad = [];
  let pts = 0;
  const box = Object.fromEntries(BANDS.map((b) => [b.name, boxOf(find(context, b.name))]));
  /** @param {string} band @param {Unit} u @param {string} name @param {string} key @param {number} phi */
  const holds = (band, u, name, key, phi) => {
    for (const p of anchors(find(u.root, name), key).map(toMachine)) {
      pts++;
      if (!inside(box[band], p)) bad.push(`${band} misses ${u.spec.code}'s ${name} (${key}) at phi ${fmt(phi, 2)}`);
    }
  };
  throughAPick(units, 40, (phi) => {
    holds("band.hooks", units.selector, "hooks.hook.0", "foot", phi);
    holds("band.hooks", units.selector, "hooks.hook.0.crook", "underside", phi);
    holds("band.hooks", units.selector, "hooks.hook.0.crook", "tip", phi);
    holds("band.needles", units.selector, "needles.needle.0", "point", phi);
    holds("band.needles", units.selector, "needles.needle.0", "tail", phi);
    holds("band.needles", units.selector, "springs.spring.0", "free_end", phi);
    for (const R of [1, 2]) {
      holds("band.harness", units.harness, `harness.mail.0.${R}`, "eye", phi);
      holds("band.harness", units.harness, `harness.cord.0.${R}.lower`, "ends", phi);
      holds("band.harness", units.harness, `harness.lingo.0.${R}`, "top", phi);
      holds("band.warp", units.harness, `warp.end.0.${R}.back`, "ends", phi);
      holds("band.warp", units.harness, `warp.end.0.${R}.front`, "ends", phi);
    }
    holds("band.warp", units.shed, "warp.end.up.back", "ends", phi);
    holds("band.warp", units.shed, "warp.end.up.front", "ends", phi);
  });
  return result("J4-3", "Each repeat band holds the parts its unit shows one of, wherever they move in a pick: the hooks band U1's hook, the needles band its needle and spring, the harness band U4's cords, mails and lingoes, the warp band the warp ends of U4 and U5", bad.length === 0, bad.slice(0, 3).join("; ") || `${pts} part-points over 41 moments`);
}

/**
 * @param {THREE.Object3D} context
 * @param {Record<string, number>} bytes
 * @returns {CheckResult}
 */
function budget(context, bytes) {
  let tris = 0;
  context.traverse((o) => {
    const m = /** @type {THREE.Mesh} */ (o);
    if (!m.isMesh) return;
    const g = m.geometry;
    tris += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
  });
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  const files = Object.keys(bytes).length;
  const ok = tris <= MAX_TRIANGLES && (files === 0 || total <= MAX_BYTES);
  return result("J4-4", `The ghosted machine has under ${MAX_TRIANGLES / 1000}k triangles, and all the 3D files together are under ${MAX_BYTES / 1048576} MB`, ok, `${Math.round(tris)} triangles${files ? `; ${files} files, ${(total / 1024).toFixed(0)} kB in all` : ""}`);
}

/** @returns {CheckResult} */
function laterLessons() {
  /** @type {string[]} */
  const bad = [];
  const later = LESSONS.slice(7);
  if (later.map((l) => l.id).join(" ") !== "L8 L9 L10") bad.push(`the later lessons are ${later.map((l) => l.id).join(" ")}`);
  /** @param {import("../sim/deck.js").Deck} deck @param {import("../sim/tieup.js").Tie} tie @param {number} picks */
  const weave = (deck, tie, picks) => {
    const loom = new Loom(deck, tie);
    let guard = picks * 8 + 8;
    while (loom.cloth.length < picks && guard-- > 0) if (!loom.stepForward().ok) break;
    return loom.cloth.map((r) => [...r]);
  };
  for (const l of later) {
    if (!l.steps.length || !l.notice || !l.question.includes("?")) bad.push(`${l.id}: steps, notice or question missing`);
    if (!l.shows(weave(l.deck(), l.tie, l.picks))) bad.push(`${l.id}: its cloth does not show its point`);
  }
  // L8: the deck's mistakes are one swapped pair of cards and one missing hole; the corrected deck weaves clean.
  const l8 = /** @type {import("../teach/lessons.js").Lesson} */ (later[0]);
  const buggy = l8.deck().cards;
  const fixed = l8.variants[0].deck().cards;
  const diff = buggy.map((c, i) => (c.join() === fixed[i].join() ? -1 : i)).filter((i) => i >= 0);
  const swapped = diff.length >= 2 && buggy[diff[0]].join() === fixed[diff[1]].join() && buggy[diff[1]].join() === fixed[diff[0]].join();
  const holes = diff.slice(2).map((i) => fixed[i].filter((b, h) => b && !buggy[i][h]).length);
  if (!(diff.length === 3 && swapped && holes.join() === "1")) bad.push(`L8's deck differs from the corrected one at cards ${diff.map((i) => i + 1).join(", ")}`);
  if (l8.shows(weave(l8.variants[0].deck(), l8.tie, l8.picks))) bad.push("L8's corrected deck still shows flaws");
  // L10: the cards print at true size, every punched hole filled and every blank ringed.
  let cards = 0;
  for (const hooks of HOOK_COUNTS) {
    const rc = realCard(hooks);
    if (rc.width > 210 - 2 * 12 - 14) bad.push(`a ${hooks}-hook card (${fmt(rc.width)} mm) is wider than the page allows`);
    const deck = makeDeck(hooks, ["O.O.....".repeat(hooks / 8), ".".repeat(hooks), "O".repeat(hooks)], false);
    const per = cardsPerPage(hooks);
    const svg = pageSvg(deck, 0, Math.min(per, deck.cards.length));
    if (!svg.includes('width="210mm"') || !svg.includes('viewBox="0 0 210 297"')) bad.push("the page is not A4 in millimetres");
    const groups = svg.split('<g class="card"').slice(1);
    groups.forEach((g, i) => {
      cards++;
      const punched = (g.match(/class="hole punched"/g) ?? []).length;
      const blank = (g.match(/class="hole blank"/g) ?? []).length;
      const want = deck.cards[i].filter(Boolean).length;
      if (punched !== want || punched + blank !== hooks) bad.push(`${hooks} hooks, card ${i + 1}: ${punched} holes filled for ${want}`);
      if (!g.includes(`width="${rc.width.toFixed(2)}" height="${rc.height.toFixed(2)}"`)) bad.push(`${hooks} hooks: the card is not drawn ${fmt(rc.width)} × ${fmt(rc.height)} mm`);
    });
    if (per < 4) bad.push(`only ${per} cards to a page`);
  }
  return result("J4-5", "Lessons L8–L10 weave their points: L8's deck has one swapped pair of cards and one missing hole, and the corrected deck weaves clean; L9's cloth repeats with its loop; L10's cards print at true size on A4, every punched hole filled and every blank ringed", bad.length === 0, bad.slice(0, 3).join("; ") || `3 lessons; ${cards} cards printed over ${HOOK_COUNTS.length} head sizes`);
}

/**
 * The M4 checks that need no page: the ghosted machine with the units, and the later lessons.
 * @param {THREE.Object3D} context the loaded context.glb
 * @param {Record<UnitId, Unit>} units
 * @param {Record<string, number>} [bytes] the 3D files' sizes, by name
 * @returns {CheckResult[]}
 */
export function runM4Checks(context, units, bytes = {}) {
  /** @type {CheckResult[]} */
  const out = [];
  /** @param {string} id @param {string} title @param {() => CheckResult} fn */
  const guard = (id, title, fn) => {
    try {
      out.push(fn());
    } catch (e) {
      out.push(result(id, title, false, String(e)));
    }
  };
  guard("J4-1", "the ghosted machine", () => contract(context));
  guard("J4-2", "the units in place", () => inPlace(context, units));
  guard("J4-3", "the repeat bands", () => bandsHold(context, units));
  guard("J4-4", "budget", () => budget(context, bytes));
  guard("J4-5", "lessons L8–L10", () => laterLessons());
  return out;
}

// ---- the learner page (browser only) ----------------------------------------------------------

/**
 * @param {Element | null} el
 */
const shown = (el) => {
  if (!(el instanceof HTMLElement || el instanceof SVGElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/**
 * Drives "Parts in 3D" on the learner page, then puts it back on the section.
 * @param {LearnerPage} learner
 * @returns {Promise<CheckResult[]>}
 */
export async function runM4PageChecks(learner) {
  const out = [];
  const { page } = learner;
  const keep = { deck: page.loom.deck, tie: page.loom.tie };
  /** @type {string[]} */
  const bad = [];
  const parts = await learner.mechanism("3d");
  if (!parts) return [result("J4-6", "Parts in 3D", false, "the 3D view did not open")];
  const canvas = document.querySelector("#parts3d canvas");
  if (!shown(canvas)) bad.push("no 3D view in the mechanism pane");
  if (shown(document.querySelector("svg.section"))) bad.push("the section is still shown");
  for (const el of document.querySelectorAll(".section-only")) if (shown(el)) bad.push("a section control is still shown");
  for (const sel of ["#chain .card-line", "svg.bench-card", "#cloth canvas", "#play", "#status", "svg.front"]) if (!shown(document.querySelector(sel))) bad.push(`${sel} is not in view with the 3D parts`);
  // The 3D parts follow the loom: after a step, U1's needle is where the head puts the followed hook's needle.
  page.open({ deck: presetDeck("arrow", 8), follow: { hook: 2, end: null, pick: null } });
  /** @type {HTMLElement} */ (document.getElementById("fwd")).click();
  /** @type {HTMLElement} */ (document.getElementById("fwd")).click();
  const snap = page.loom.snapshot();
  const sel = /** @type {Unit} */ (parts.view.units.selector);
  const point = anchors(find(sel.root, "needles.needle.2"), "point").map(toMachine)[0].x;
  if (Math.abs(point - (-P.needleProtrusion + snap.head.needlePush[2])) > 0.01) bad.push(`U1's needle at ${fmt(point)} after a step, not ${fmt(-P.needleProtrusion + snap.head.needlePush[2])}`);
  const lift = anchors(find(sel.root, "hooks.hook.0"), "foot").map(toMachine)[0].z - FRAME.sectionZ;
  if (Math.abs(lift - snap.head.hooks[2].lift) > 0.01) bad.push(`U1's hook lifted ${fmt(lift)}, not ${fmt(snap.head.hooks[2].lift)}`);
  // Each unit opens alone from the bar; the whole loom shows the ghost and every unit.
  for (const spec of UNITS) {
    /** @type {HTMLElement} */ (document.querySelector(`#parts3d [data-part="${spec.id}"]`)).click();
    const vis = Object.entries(parts.view.units).filter(([, u]) => u.root.visible).map(([k]) => k);
    if (vis.join() !== spec.id || parts.view.context?.visible) bad.push(`with ${spec.code} open, ${vis.join(", ")} shown${parts.view.context?.visible ? " and the ghost" : ""}`);
  }
  /** @type {HTMLElement} */ (document.querySelector('#parts3d [data-part="machine"]')).click();
  const all = Object.values(parts.view.units).filter((u) => u.root.visible).length;
  if (all !== 5 || !parts.view.context?.visible) bad.push(`the whole loom shows ${all} units${parts.view.context?.visible ? "" : " and no ghost"}`);
  out.push(result("J4-6", "On the learner page, Parts in 3D takes the section's place (its controls go with it) while the cards, the bench, the cloth, the front view, the transport and the status line stay; the parts follow the loom and the followed hook; each unit opens alone and the whole loom shows the ghost with every unit", bad.length === 0, bad.slice(0, 3).join("; ") || "6 views; U1 follows hook 3 through two steps"));

  // The band labels: shown in the whole loom, not overlapping, each opening its unit.
  const tagBad = [];
  parts.view.showMachine(false);
  parts.view.placeTags();
  const tags = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("#parts3d .band-tag")]);
  const rects = tags.filter((t) => !t.hidden).map((t) => t.getBoundingClientRect());
  if (rects.length !== BANDS.length) tagBad.push(`${rects.length} band labels shown of ${BANDS.length}`);
  rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => {
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) tagBad.push("two band labels overlap");
  }));
  const host = /** @type {HTMLElement} */ (document.querySelector("#parts3d .parts3d-view")).getBoundingClientRect();
  for (const r of rects) if (r.left < host.left - 1 || r.right > host.right + 1 || r.top < host.top - 1 || r.bottom > host.bottom + 1) tagBad.push("a band label runs outside the 3D view");
  const hooksTag = tags.find((t) => t.textContent?.includes("hooks"));
  hooksTag?.click();
  if (parts.view.mode !== "selector") tagBad.push(`the hooks band's label opened ${parts.view.mode}`);
  /** @type {HTMLElement} */ (document.querySelector('#parts3d [data-part="machine"]')).click();
  out.push(result("J4-7", "In the whole loom every band's label is shown inside the 3D view, clear of the others, and opens its unit", tagBad.length === 0, tagBad.slice(0, 3).join("; ") || `${rects.length} labels`));

  await learner.mechanism("2d");
  page.open({ deck: keep.deck, tie: keep.tie, follow: null, message: "The first card is pressed against the needles. Press Step ▸ to turn the loom to the next moment, or Play." });
  if (!shown(document.querySelector("svg.section"))) out.push(result("J4-8", "Back to the section", false, "the section did not come back"));
  else out.push(result("J4-8", "Section (2D) brings the section and its controls back", true, "the section is drawn again"));
  return out;
}
