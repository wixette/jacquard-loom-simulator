// The cards of the chain near the cylinder, in 3D (unit U2). They are made here, not in the
// .glb, because they are the learner's own cards: each is placed where the 2D section's chain
// puts it (js/view2d/layout.js, chainNearCylinder), at its true size (58.7 mm across the
// chain, as long as the head is wide, 1.2 mm thick), with a dark disc on its outer face for
// every punched hole, in every column. Cards fade out along the strands as in the 2D view.

import * as THREE from "three";
import { P, U } from "../sim/params.js";
import { COLUMN_PITCH, realCard } from "../view2d/cardLayout.js";
import { sectionLayout } from "../view2d/layout.js";
import { sectionToThree } from "./frame.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { ChainCard } from "../view2d/layout.js" */

/** How many cards can be shown at once (the strands' reach is two cards each way). */
const POOL = 12;
/** The cylinder's first column of bores, along Y from the section (mm): the card registers on it. */
const FIRST_COLUMN_DY = -3.5 * COLUMN_PITCH;

/**
 * @typedef {object} CardPlace where a card lies, in the machine frame
 * @property {number} index its chain index
 * @property {THREE.Vector3} centre (m)
 * @property {THREE.Vector3} along unit, toward the card before it (hole 1 is at the other end)
 * @property {THREE.Vector3} out unit, away from the cylinder
 * @property {number} opacity
 * @property {boolean} facing
 * @property {{ hook: number, at: THREE.Vector3 }[]} holes the punched holes' centres on the outer face (m)
 * @property {THREE.Vector3[]} blanks the other hole positions, where the card is not punched (m)
 */

/**
 * Where each drawn card of the chain lies, in three.js coordinates.
 * @param {Snapshot} snap
 * @returns {CardPlace[]}
 */
export function cardPlaces(snap) {
  const L = sectionLayout(snap, 0);
  const rc = realCard(snap.deck.hooks);
  const col0 = rc.holes[0].x;
  return L.chain.cards.map((c) => placeOf(c, snap, rc, col0));
}

/**
 * @param {ChainCard} c
 * @param {Snapshot} snap
 * @param {import("../view2d/cardLayout.js").RealCard} rc
 * @param {number} col0
 * @returns {CardPlace}
 */
function placeOf(c, snap, rc, col0) {
  const len = Math.hypot(c.lo[0] - c.hi[0], c.lo[1] - c.hi[1]);
  const v = [(c.lo[0] - c.hi[0]) / len, (c.lo[1] - c.hi[1]) / len];
  const o = [-v[1], v[0]]; // away from the cylinder (the 2D strip is thickened toward it)
  const mid = [(c.hi[0] + c.lo[0]) / 2, (c.hi[1] + c.lo[1]) / 2];
  const t = P.cardThickness;
  const along = new THREE.Vector3(v[0], v[1], 0);
  const out = new THREE.Vector3(o[0], o[1], 0);
  const midDy = FIRST_COLUMN_DY - col0 + rc.width / 2;
  const centre = new THREE.Vector3(...sectionToThree(mid[0] + (o[0] * t) / 2, mid[1] + (o[1] * t) / 2, midDy));
  const card = snap.deck.cards[c.index];
  /** @type {{ hook: number, at: THREE.Vector3 }[]} */
  const holes = [];
  /** @type {THREE.Vector3[]} */
  const blanks = [];
  for (const h of rc.holes) {
    const a = (h.row - 3.5) * P.tierPitch; // hole 1 toward the card's hi end, as in 2D
    const x = mid[0] + v[0] * a + o[0] * t;
    const y = mid[1] + v[1] * a + o[1] * t;
    const at = new THREE.Vector3(...sectionToThree(x, y, FIRST_COLUMN_DY + h.column * COLUMN_PITCH));
    if (card[h.hook]) holes.push({ hook: h.hook, at });
    else blanks.push(at);
  }
  return { index: c.index, centre, along, out, opacity: c.opacity, facing: c.facing, holes, blanks };
}

export class CardChain3D {
  /** @param {THREE.Object3D} parent */
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.name = "cards";
    parent.add(this.group);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const disc = new THREE.CylinderGeometry(P.holeDiameter / 2000, P.holeDiameter / 2000, 0.0003, 12);
    // A blank position: a faint printed ring (local +Y is the card's outward side), as on the
    // 2D cards and the printed ones, so every column shows its 8 positions.
    const ring = blankRing().rotateX(-Math.PI / 2);
    /** @type {{ mesh: THREE.Mesh, mat: THREE.MeshStandardMaterial, holes: THREE.InstancedMesh, holeMat: THREE.MeshStandardMaterial, blanks: THREE.InstancedMesh, blankMat: THREE.MeshStandardMaterial }[]} */
    this.pool = [];
    for (let i = 0; i < POOL; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xd9b77e, roughness: 0.75 });
      const mesh = new THREE.Mesh(box, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.9 });
      const holes = new THREE.InstancedMesh(disc, holeMat, 64);
      const blankMat = new THREE.MeshStandardMaterial({ color: BLANK_COLOUR, roughness: 0.9 });
      const blanks = new THREE.InstancedMesh(ring, blankMat, 64);
      mesh.visible = holes.visible = blanks.visible = false;
      this.group.add(mesh, holes, blanks);
      this.pool.push({ mesh, mat, holes, holeMat, blanks, blankMat });
    }
    /** @type {CardPlace[]} */
    this.places = [];
  }

  /** @param {Snapshot} snap */
  update(snap) {
    this.places = cardPlaces(snap);
    const width = realCard(snap.deck.hooks).width / 1000;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    this.pool.forEach((slot, i) => {
      const p = this.places[i];
      slot.mesh.visible = slot.holes.visible = slot.blanks.visible = !!p;
      if (!p) return;
      const across = new THREE.Vector3().crossVectors(p.along, p.out);
      m.makeBasis(p.along, p.out, across);
      q.setFromRotationMatrix(m);
      slot.mesh.position.copy(p.centre);
      slot.mesh.quaternion.copy(q);
      slot.mesh.scale.set(P.cardWidth / 1000, P.cardThickness / 1000, width);
      const fade = p.opacity < 0.999;
      for (const mat of [slot.mat, slot.holeMat, slot.blankMat]) {
        mat.transparent = fade;
        mat.opacity = p.opacity;
        mat.depthWrite = !fade;
      }
      slot.mat.color.set(p.facing ? 0xf0c060 : 0xd9b77e);
      const qd = new THREE.Quaternion().setFromUnitVectors(up, p.out);
      p.holes.forEach((h, k) => {
        m.compose(h.at.clone().addScaledVector(p.out, 0.00015), qd, s.set(1, 1, 1));
        slot.holes.setMatrixAt(k, m);
      });
      slot.holes.count = p.holes.length;
      slot.holes.instanceMatrix.needsUpdate = true;
      slot.holes.computeBoundingSphere();
      p.blanks.forEach((b, k) => {
        m.compose(b.clone().addScaledVector(p.out, 0.00012), qd, s.set(1, 1, 1));
        slot.blanks.setMatrixAt(k, m);
      });
      slot.blanks.count = p.blanks.length;
      slot.blanks.instanceMatrix.needsUpdate = true;
      slot.blanks.computeBoundingSphere();
    });
  }
}

/** A blank position's printed ring: a little inside a hole's size, faint (in the XY plane, facing +Z). */
const blankRing = () => new THREE.RingGeometry(P.holeDiameter / 2000 - 0.0006, P.holeDiameter / 2000, 18);
/** The blank positions' colour: a little darker than the pasteboard. */
const BLANK_COLOUR = 0xa98849;

/**
 * The card facing the needles in unit U1, laid on the cylinder's face slice (the node
 * "cylinder.column", whose origin is the card's first column at the middle row, on the needle
 * board's side). At true size, with every punched hole dark, every blank position a faint
 * ring, the followed hook's position ringed in blue, and the cylinder's two brass pegs through
 * the card's peg holes; the page slides the face so that hook's column is at the needles.
 */
export class FacingCard {
  /** @param {THREE.Object3D} parent */
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.name = "facing-card";
    parent.add(this.group);
    this.mat = new THREE.MeshStandardMaterial({ color: 0xf0c060, roughness: 0.75 });
    this.card = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mat);
    this.card.castShadow = this.card.receiveShadow = true;
    const r = P.holeDiameter / 2000;
    const disc = new THREE.CylinderGeometry(r, r, 0.0003, 14).rotateZ(-Math.PI / 2);
    this.holes = new THREE.InstancedMesh(disc, new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.9 }), 64);
    this.blanks = new THREE.InstancedMesh(blankRing().rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: BLANK_COLOUR, roughness: 0.9 }), 64);
    // The cylinder's pegs, standing a little out of the card's peg holes: brass, so they cannot
    // pass for holes.
    const pr = U.pegDiameter / 2000;
    const peg = new THREE.CylinderGeometry(pr, pr, 0.003, 18).rotateZ(-Math.PI / 2);
    this.pegs = new THREE.InstancedMesh(peg, new THREE.MeshStandardMaterial({ color: 0xc9922f, metalness: 1, roughness: 0.3 }), 2);
    this.pegs.userData.label_en = "the cylinder's pegs, through the card's peg holes: they keep every hole on its bore";
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.0009, 0.00045, 6, 24).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2e6fb0, roughness: 0.5 }));
    this.group.add(this.card, this.holes, this.blanks, this.pegs, this.ring);
    this.key = "";
  }

  /**
   * @param {boolean[] | null} card the card facing the needles, or null (an empty face)
   * @param {number} hooks
   * @param {number} followed the followed hook (0-based)
   */
  update(card, hooks, followed) {
    const key = JSON.stringify([card, hooks, followed]);
    if (key === this.key) return;
    this.key = key;
    this.group.visible = card !== null;
    if (!card) return;
    const rc = realCard(hooks);
    const col0 = rc.holes[0].x;
    /** A point on the card's outer face, machine mm from the first column's middle (along Y, up Z), in three.js. */
    const at = (/** @type {number} */ dy, /** @type {number} */ dz, /** @type {number} */ dx = 0.1) => new THREE.Vector3(dx / 1000, dz / 1000, -dy / 1000);
    this.card.scale.set(P.cardThickness / 1000, P.cardWidth / 1000, rc.width / 1000);
    this.card.position.copy(at(rc.width / 2 - col0, 0, -P.cardThickness / 2));
    const m = new THREE.Matrix4();
    let n = 0;
    let b = 0;
    for (const h of rc.holes) {
      if (card[h.hook]) {
        m.setPosition(at(h.x - col0, (3.5 - h.row) * P.tierPitch));
        this.holes.setMatrixAt(n++, m);
      } else {
        m.setPosition(at(h.x - col0, (3.5 - h.row) * P.tierPitch, 0.06));
        this.blanks.setMatrixAt(b++, m);
      }
    }
    this.holes.count = n;
    this.blanks.count = b;
    this.holes.instanceMatrix.needsUpdate = true;
    this.blanks.instanceMatrix.needsUpdate = true;
    rc.pegs.forEach((p, i) => {
      m.setPosition(at(p.x - col0, 0, 1.5));
      this.pegs.setMatrixAt(i, m);
    });
    this.pegs.instanceMatrix.needsUpdate = true;
    // The bounds three.js culls by follow the instances.
    this.holes.computeBoundingSphere();
    this.blanks.computeBoundingSphere();
    this.pegs.computeBoundingSphere();
    const f = rc.holes[followed];
    this.ring.position.copy(at(f.x - col0, (3.5 - f.row) * P.tierPitch, 0.3));
    this.card.userData.label_en = `the card facing the needles: the ringed hole is hook ${followed + 1}'s, in column ${f.column + 1} (cross-row ${f.column + 1}) and row ${f.row + 1} (needle ${f.row + 1}); ${card[followed] ? "punched, so its needle goes in" : "blank, so it pushes its needle back"}`;
  }

  /**
   * The punched holes' centres on the card's face, in world space (for the checks).
   * @param {boolean[]} card
   * @param {number} hooks
   * @returns {{ hook: number, at: THREE.Vector3 }[]}
   */
  holesWorld(card, hooks) {
    const rc = realCard(hooks);
    const col0 = rc.holes[0].x;
    this.group.updateWorldMatrix(true, false);
    // On the card's outer face (the dark discs are drawn a hair proud of it).
    return rc.holes.filter((h) => card[h.hook]).map((h) => ({ hook: h.hook, at: new THREE.Vector3(0, ((3.5 - h.row) * P.tierPitch) / 1000, -(h.x - col0) / 1000).applyMatrix4(this.group.matrixWorld) }));
  }
}

/**
 * The cylinder's pegs in unit U2, two on each face, made by the page so they stand at the
 * learner's card's peg holes (the cylinder is the reference 400 head's, longer than the card).
 * Children of the prism node, so they turn with it.
 */
export class CylinderPegs {
  /** @param {THREE.Object3D} prism the node "cylinder.prism" (its origin is the prism's centre) */
  constructor(prism) {
    const r = U.pegDiameter / 2000;
    this.mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(r, r, 0.006, 16), new THREE.MeshStandardMaterial({ color: 0xc9922f, metalness: 1, roughness: 0.3 }), 8);
    this.mesh.name = "cylinder-pegs";
    this.mesh.userData.label_en = "the cylinder's pegs: they pass through the card's peg holes, so every hole lands on its bore";
    prism.add(this.mesh);
    this.hooks = 0;
  }

  /**
   * @param {number} hooks the learner's head
   * @returns {void}
   */
  update(hooks) {
    if (hooks === this.hooks) return;
    this.hooks = hooks;
    const rc = realCard(hooks);
    const col0 = rc.holes[0].x;
    const out = P.cylinderFace / 2 + 3; // half the peg stands out of the face
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const up = new THREE.Vector3(0, 1, 0);
    let i = 0;
    for (const p of rc.pegs) {
      const dy = FIRST_COLUMN_DY + p.x - col0; // along the cylinder, machine mm from the section
      // The four faces' outward normals in three.js: +X (the needles), up, -X, down.
      for (const n of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0)]) {
        q.setFromUnitVectors(up, n);
        m.compose(n.clone().multiplyScalar(out / 1000).add(new THREE.Vector3(0, 0, -dy / 1000)), q, s);
        this.mesh.setMatrixAt(i++, m);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.computeBoundingSphere();
  }

  /**
   * The two pegs on the face at the needles (the first and fifth), their tips' centres in world space.
   * @returns {THREE.Vector3[]}
   */
  atNeedles() {
    this.mesh.updateWorldMatrix(true, false);
    const m = new THREE.Matrix4();
    return [0, 4].map((i) => {
      this.mesh.getMatrixAt(i, m);
      return new THREE.Vector3(0, 0.003, 0).applyMatrix4(m).applyMatrix4(this.mesh.matrixWorld);
    });
  }
}
