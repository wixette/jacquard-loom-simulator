// Binds glTF nodes to motion scalars. The glTF holds the rest pose; each moving node carries
// extras saying how it moves (blender/scripts/build_units.py): translate (mm along axis),
// rotate (degrees about axis), reach (a straight piece from its origin to an end that moves
// by value mm along "move", turned and stretched to stay joined), stretch (a spring along its
// local +Y, value its length in mm), show (shown when value is 1), and segment (a cord
// between two points, set from both by setSegment). Setting a value always starts from the
// rest pose, so values never accumulate.

import * as THREE from "three";

/** @typedef {"translate" | "rotate" | "reach" | "stretch" | "show" | "segment"} Motion */

/**
 * @typedef {object} MotionNode
 * @property {THREE.Object3D} node
 * @property {Motion} motion
 * @property {THREE.Vector3} axis translate, rotate: the axis; reach: the direction the moving end goes
 * @property {number} length reach, stretch, segment: the piece's length at rest (mm)
 * @property {THREE.Vector3} restPos
 * @property {THREE.Quaternion} restQuat
 * @property {string} labelEn
 */

/**
 * three.js strips reserved characters (including ".") from glTF node names on load.
 * @param {string} name
 */
export const gltfName = (name) => THREE.PropertyBinding.sanitizeNodeName(name);

const UP = new THREE.Vector3(0, 1, 0);

/** @template {string} K */
export class Rig {
  /** @readonly */
  parts = /** @type {Record<K, MotionNode>} */ ({});
  /** @private */
  q = new THREE.Quaternion();
  /** @private */
  v = new THREE.Vector3();

  /**
   * @param {THREE.Object3D} root
   * @param {Record<K, string>} names
   */
  constructor(root, names) {
    /** @type {string[]} */
    const missing = [];
    for (const [key, name] of /** @type {[K, string][]} */ (Object.entries(names))) {
      const node = root.getObjectByName(gltfName(name));
      if (!node) {
        missing.push(name);
        continue;
      }
      const ex = /** @type {{ motion?: string, axis?: number[], move?: number[], length?: number, label_en?: string }} */ (node.userData);
      const motion = /** @type {Motion} */ (ex.motion);
      if (!["translate", "rotate", "reach", "stretch", "show", "segment"].includes(motion)) {
        missing.push(`${name} (no motion extras)`);
        continue;
      }
      // The rest pose is recorded on the node the first time any rig binds it, so a second rig
      // (the self-test on a posed page) does not take the current pose for the rest.
      const ud = /** @type {{ __rest?: { pos: THREE.Vector3, quat: THREE.Quaternion } }} */ (node.userData);
      ud.__rest ??= { pos: node.position.clone(), quat: node.quaternion.clone() };
      this.parts[key] = {
        node,
        motion,
        axis: new THREE.Vector3().fromArray((motion === "reach" ? ex.move : ex.axis) ?? [0, 0, 1]).normalize(),
        length: ex.length ?? 1,
        restPos: ud.__rest.pos,
        restQuat: ud.__rest.quat,
        labelEn: ex.label_en ?? name,
      };
    }
    if (missing.length) throw new Error(`glTF is missing required nodes: ${missing.join(", ")}`);
  }

  /**
   * Rotation in degrees; lengths in millimetres (the glTF is in metres).
   * @param {K} key
   * @param {number} value
   * @returns {void}
   */
  set(key, value) {
    const p = this.parts[key];
    switch (p.motion) {
      case "rotate":
        this.q.setFromAxisAngle(p.axis, THREE.MathUtils.degToRad(value));
        p.node.quaternion.copy(p.restQuat).multiply(this.q);
        break;
      case "translate":
        p.node.position.copy(p.restPos).addScaledVector(p.axis, value / 1000);
        break;
      case "reach": {
        // The piece runs along local +Y; its far end moves by value along axis (local frame).
        const end = this.v.set(0, p.length, 0).addScaledVector(p.axis, value);
        const len = end.length();
        this.q.setFromUnitVectors(UP, end.divideScalar(len));
        p.node.quaternion.copy(p.restQuat).multiply(this.q);
        p.node.scale.set(1, len / p.length, 1);
        break;
      }
      case "stretch":
        p.node.scale.set(1, value / p.length, 1);
        break;
      case "show":
        p.node.visible = value > 0.5;
        break;
      case "segment":
        throw new Error(`${p.labelEn} is set from its two ends (setSegment)`);
    }
  }

  /**
   * Puts a segment piece between two world points (m).
   * @param {K} key
   * @param {THREE.Vector3} a
   * @param {THREE.Vector3} b
   * @returns {void}
   */
  setSegment(key, a, b) {
    const p = this.parts[key];
    const parent = /** @type {THREE.Object3D} */ (p.node.parent);
    parent.updateWorldMatrix(true, false);
    const la = parent.worldToLocal(a.clone());
    const lb = parent.worldToLocal(b.clone());
    const d = lb.sub(la);
    const len = d.length();
    p.node.position.copy(la);
    p.node.quaternion.setFromUnitVectors(UP, d.divideScalar(len));
    p.node.scale.set(1, (len * 1000) / p.length, 1);
  }
}

/**
 * Anchor points declared by the build (extras[key], node-local metres) in world space.
 * @param {THREE.Object3D} part
 * @param {string} key
 * @returns {THREE.Vector3[]}
 */
export function anchors(part, key) {
  const flat = (/** @type {Record<string, unknown>} */ (part.userData))[key];
  if (!Array.isArray(flat) || flat.length % 3) throw new Error(`${part.name} has no anchors "${key}"`);
  let top = part;
  while (top.parent) top = top.parent;
  top.updateMatrixWorld(true);
  /** @type {THREE.Vector3[]} */
  const out = [];
  for (let i = 0; i < flat.length; i += 3) out.push(new THREE.Vector3(flat[i], flat[i + 1], flat[i + 2]).applyMatrix4(part.matrixWorld));
  return out;
}
