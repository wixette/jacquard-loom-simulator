// The five 3D core units (design/simulator-plan.md §5, built by blender/scripts/build_units.py):
// what each file holds, what it teaches, and how a moment of the loom poses it. The poses come
// from the same simulation and the same 2D layouts as the 2D views (the head's state, the
// section's chain, the side view's batten), so the 3D parts move as the drawings do.

import * as THREE from "three";
import { hookX } from "../sim/head.js";
import { P, U } from "../sim/params.js";
import { COLUMN_PITCH } from "../view2d/cardLayout.js";
import { sideLayout } from "../view2d/sideView.js";
import { CardChain3D, CylinderPegs, FacingCard } from "./cards3d.js";
import { anchors, Rig } from "./rig.js";
/** @import { Snapshot } from "../sim/loom.js" */

/**
 * @typedef {"selector" | "cylinder" | "griffe" | "harness" | "shed"} UnitId
 */

/**
 * @typedef {object} UnitSpec
 * @property {UnitId} id
 * @property {string} code U1 … U5
 * @property {string} file in assets/
 * @property {string} title its name: a message key
 * @property {string} idea the mechanical idea it teaches (plan §5): a message key
 * @property {string} root the unit's root node
 * @property {Record<string, string>} nodes the moving parts, by key
 */

/** @type {UnitSpec[]} */
export const UNITS = [
  {
    id: "selector",
    code: "U1",
    file: "u1-selector.glb",
    title: "unit.selector",
    idea: "unit.selector.idea",
    root: "unit.selector",
    nodes: {
      ...Object.fromEntries([...Array(8).keys()].flatMap((k) => [[`needle${k}`, `needles.needle.${k}`], [`spring${k}`, `springs.spring.${k}`]])),
      row: "selector.row",
      column: "cylinder.column",
      hook: "hooks.hook.0",
      bend: "hooks.hook.0.bend",
      upper: "hooks.hook.0.upper",
      top: "hooks.hook.0.top",
      crook: "hooks.hook.0.crook",
      knife: "griffe.knife.0",
      face: "cylinder.face",
    },
  },
  {
    id: "cylinder",
    code: "U2",
    file: "u2-cylinder.glb",
    title: "unit.cylinder",
    idea: "unit.cylinder.idea",
    root: "unit.cylinder",
    nodes: { batten: "cylinder.batten", prism: "cylinder.prism", hammer: "cylinder.hammer" },
  },
  {
    id: "griffe",
    code: "U3",
    file: "u3-griffe.glb",
    title: "unit.griffe",
    idea: "unit.griffe.idea",
    root: "unit.griffe",
    nodes: { frame: "griffe.frame", rod: "lift.rod", lever: "lift.head_lever", cord: "lift.cord", treadle: "lift.treadle" },
  },
  {
    id: "harness",
    code: "U4",
    file: "u4-harness.glb",
    title: "unit.harness",
    idea: "unit.harness.idea",
    root: "unit.harness",
    nodes: {
      neck: "harness.neck_cord.0",
      up1: "harness.cord.0.1.upper",
      low1: "harness.cord.0.1.lower",
      mail1: "harness.mail.0.1",
      lingo1: "harness.lingo.0.1",
      back1: "warp.end.0.1.back",
      front1: "warp.end.0.1.front",
      up2: "harness.cord.0.2.upper",
      low2: "harness.cord.0.2.lower",
      mail2: "harness.mail.0.2",
      lingo2: "harness.lingo.0.2",
      back2: "warp.end.0.2.back",
      front2: "warp.end.0.2.front",
    },
  },
  {
    id: "shed",
    code: "U5",
    file: "u5-shed.glb",
    title: "unit.shed",
    idea: "unit.shed.idea",
    root: "unit.shed",
    nodes: {
      endBack: "warp.end.up.back",
      endFront: "warp.end.up.front",
      sheetBack: "warp.sheet.upper.back",
      sheetFront: "warp.sheet.upper.front",
      batten: "batten.frame",
      swordL: "batten.sword.left",
      swordR: "batten.sword.right",
      shuttle: "shuttle.body",
    },
  },
];

/**
 * How far the spring hammer is pushed down (degrees) when the lantern is turned by `turn`
 * (0 to 1): enough that its face rests on the lantern's lowest corner (Posselt, Fig. X: it
 * presses "towards the lantern from below"). As the lantern turns clockwise, its lowest corner
 * is at (h(cos t - sin t), -h(cos t + sin t)) from its centre; the hammer's pivot is one arm
 * beyond the centre, level with the lantern's bottom flat.
 * @param {number} turn
 * @returns {number}
 */
export function hammerAngle(turn) {
  const t = (turn * Math.PI) / 2;
  const h = U.lanternHalf;
  const rise = h * (Math.cos(t) + Math.sin(t) - 1);
  const run = U.hammerArm - h * (Math.cos(t) - Math.sin(t));
  return THREE.MathUtils.radToDeg(Math.atan2(rise, run));
}

/**
 * The head lever's angle (degrees) for a griffe lifted by g mm: its back arm's end rises by g.
 * @param {number} g
 */
export const leverAngle = (g) => THREE.MathUtils.radToDeg(Math.asin(Math.min(1, g / U.leverArm)));

/**
 * The treadle's angle (degrees) for a griffe lifted by g mm: the cord point, on its arc about
 * the pivot behind it, drops by g.
 * @param {number} g
 * @returns {number}
 */
export function treadleAngle(g) {
  const [py, pz] = U.treadlePivot;
  const [cy, cz] = U.treadleCord;
  const r = Math.hypot(cy - py, cz - pz);
  return THREE.MathUtils.radToDeg(Math.asin((cz - pz) / r) - Math.asin((cz - pz - g) / r));
}

/**
 * A unit loaded into the page: its root, its rig and its spec.
 */
export class Unit {
  /**
   * @param {UnitSpec} spec
   * @param {THREE.Object3D} root the loaded glTF scene
   */
  constructor(spec, root) {
    this.spec = spec;
    this.root = root;
    /** @type {Rig<string>} */
    this.rig = new Rig(root, spec.nodes);
    /** The learner's cards on the cylinder (U2 only). */
    this.chain = spec.id === "cylinder" ? new CardChain3D(root) : null;
    /** The cylinder's pegs, at the learner's card's peg holes (U2 only). */
    this.pegs = spec.id === "cylinder" ? new CylinderPegs(/** @type {THREE.Object3D} */ (root.getObjectByName("cylinderprism"))) : null;
    /** The card facing the needles (U1 only). */
    this.facing = spec.id === "selector" ? new FacingCard(/** @type {THREE.Object3D} */ (root.getObjectByName("cylindercolumn"))) : null;
    /** U1's needles and springs, each with its own materials, so the followed one can stand out. */
    this.rowParts = spec.id === "selector" ? [...Array(8).keys()].map((k) => ownMaterials([this.rig.parts[`needle${k}`].node, this.rig.parts[`spring${k}`].node])) : [];
  }

  /**
   * Poses the unit at a moment of the loom. `hook` is the hook whose parts the single-part
   * units show (U1, U4): its selection, lift and push, whatever cross-row it is in.
   * @param {Snapshot} snap
   * @param {number} hook 0-based
   * @returns {void}
   */
  pose(snap, hook) {
    const r = this.rig;
    const head = snap.head;
    const h = head.hooks[hook];
    switch (this.spec.id) {
      case "selector": {
        // The followed hook's cross-row: its 8 needles read the card's column for it.
        const k = hook % P.rows;
        const base = hook - k;
        for (let j = 0; j < P.rows; j++) {
          const push = head.needlePush[base + j];
          r.set(`needle${j}`, push);
          r.set(`spring${j}`, r.parts[`spring${j}`].length - push);
          for (const mt of this.rowParts[j]) Object.assign(mt, { transparent: j !== k, opacity: j === k ? 1 : 0.35, depthWrite: j === k });
        }
        r.set("row", hookX(k) - hookX(0));
        r.set("column", -(base / P.rows) * COLUMN_PITCH);
        r.set("hook", h.lift);
        r.set("bend", h.shift);
        r.set("upper", h.shift);
        r.set("top", h.deflect);
        r.set("crook", h.deflect);
        r.set("knife", head.griffe);
        r.set("face", head.cylinderOut);
        this.facing?.update(facingCard(snap), snap.deck.hooks, hook);
        break;
      }
      case "cylinder":
        r.set("batten", head.cylinderOut);
        r.set("prism", -head.turn * 90); // forward is clockwise, seen from the front: the top card comes to the needles
        r.set("hammer", hammerAngle(head.turn));
        this.chain?.update(snap);
        this.pegs?.update(snap.deck.hooks);
        break;
      case "griffe": {
        const g = head.griffe;
        r.set("frame", g);
        r.set("rod", g);
        r.set("lever", leverAngle(g));
        r.set("treadle", treadleAngle(g));
        const lever = /** @type {THREE.Object3D} */ (this.root.getObjectByName("lifthead_lever"));
        const treadle = /** @type {THREE.Object3D} */ (this.root.getObjectByName("lifttreadle"));
        this.root.updateMatrixWorld(true);
        r.setSegment("cord", anchors(treadle, "cord")[0], anchors(lever, "ends")[1]);
        break;
      }
      case "harness":
        for (const key of Object.keys(this.spec.nodes)) r.set(key, h.lift);
        break;
      case "shed": {
        const side = sideLayout(snap);
        for (const key of ["endBack", "endFront", "sheetBack", "sheetFront"]) r.set(key, side.lift);
        const slide = side.batten.reedX - U.reedRestY;
        for (const key of ["batten", "swordL", "swordR"]) r.set(key, slide);
        r.set("shuttle", (U.shuttleTravel[1] - U.shuttleTravel[0]) * snap.shuttle);
        break;
      }
    }
  }
}

/**
 * The card facing the needles now (this pick's, or the next once the cylinder has turned
 * half way), or null for an empty face.
 * @param {Snapshot} snap
 * @returns {boolean[] | null}
 */
export function facingCard(snap) {
  const i = snap.facingIndex;
  return i === null ? null : snap.deck.cards[i] ?? null;
}

/**
 * Gives each mesh under the given nodes its own copy of its materials, and returns them.
 * @param {THREE.Object3D[]} nodes
 * @returns {THREE.MeshStandardMaterial[]}
 */
function ownMaterials(nodes) {
  /** @type {THREE.MeshStandardMaterial[]} */
  const out = [];
  for (const n of nodes) {
    n.traverse((o) => {
      const m = /** @type {THREE.Mesh} */ (o);
      if (!m.isMesh) return;
      const mats = /** @type {THREE.MeshStandardMaterial[]} */ ([]).concat(/** @type {THREE.MeshStandardMaterial} */ (m.material)).map((mt) => mt.clone());
      m.material = Array.isArray(m.material) ? mats : mats[0];
      out.push(...mats);
    });
  }
  return out;
}

/** The griffe's full lift less the rest gap: how far a caught hook rises (mm). */
export const HOOK_LIFT = P.griffeLift - P.restGap;
