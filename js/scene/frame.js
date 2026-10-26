// The machine frame of the 3D models (params/machine.json, machine_frame): mm, X across the
// loom along the needles, Y front to back, Z up. A point (x, y) of the 2D section is
// (x, sectionY, sectionZ + y). The glTF files hold the same frame in metres with Y up, so a
// machine point (X, Y, Z) is three.js (X, Z, -Y) / 1000.

import { FRAME } from "../sim/params.js";

/** @typedef {{ x: number, y: number, z: number }} Xyz */

/**
 * A machine-frame point (mm) as three.js coordinates (m).
 * @param {number} X
 * @param {number} Y
 * @param {number} Z
 * @returns {[number, number, number]}
 */
export const toThree = (X, Y, Z) => [X / 1000, Z / 1000, -Y / 1000];

/**
 * A three.js point (m) in the machine frame (mm).
 * @param {{ x: number, y: number, z: number }} v
 * @returns {Xyz}
 */
export const toMachine = (v) => ({ x: v.x * 1000, y: -v.z * 1000, z: v.y * 1000 });

/**
 * A point of the 2D section (mm), off the section by dy along Y, as three.js coordinates (m).
 * @param {number} x
 * @param {number} y
 * @param {number} [dy]
 * @returns {[number, number, number]}
 */
export const sectionToThree = (x, y, dy = 0) => toThree(x, FRAME.sectionY + dy, FRAME.sectionZ + y);

/**
 * A three.js point (m) as a point of the 2D section (mm), with how far off the section it is.
 * @param {{ x: number, y: number, z: number }} v
 * @returns {{ x: number, y: number, dy: number }}
 */
export function toSection(v) {
  const m = toMachine(v);
  return { x: m.x, y: m.z - FRAME.sectionZ, dy: m.y - FRAME.sectionY };
}
