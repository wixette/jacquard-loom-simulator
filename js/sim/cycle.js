// One pick, as functions of phi (0 to 1): how far the griffe has risen, how far the
// cylinder is out and turned, where the shuttle and the batten are. The windows come from
// params/machine.json (cycle); the order of events is documented, the fractions are
// estimates for a hand loom.

import { P } from "./params.js";

/**
 * 0 before the window, 1 after it, eased in between.
 * @param {number} phi
 * @param {[number, number]} w
 * @returns {number}
 */
export function ease(phi, [a, b]) {
  const t = Math.min(1, Math.max(0, (phi - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Linear progress through a window, 0 to 1.
 * @param {number} phi
 * @param {[number, number]} w
 * @returns {number}
 */
export function progress(phi, [a, b]) {
  return Math.min(1, Math.max(0, (phi - a) / (b - a)));
}

/**
 * The griffe's height above its rest, in mm.
 * @param {number} phi
 * @returns {number}
 */
export function griffeHeight(phi) {
  return P.griffeLift * (ease(phi, P.griffeRise) - ease(phi, P.griffeFall));
}

/**
 * How far the cylinder has moved out from the needle board, in mm: out after the knives
 * have taken the hooks, back until the card meets the needle points, then on until it
 * presses the blanked needles flush.
 * @param {number} phi
 * @returns {number}
 */
export function cylinderOut(phi) {
  const out = P.cylinderTravel * ease(phi, P.cylinderOut);
  if (phi < P.cylinderBack[0]) return out;
  const atPoints = P.needleProtrusion;
  const back = P.cylinderTravel - (P.cylinderTravel - atPoints) * ease(phi, P.cylinderBack);
  if (phi < P.cardPress[0]) return back;
  return atPoints * (1 - progress(phi, P.cardPress));
}

/**
 * How far through its quarter turn the cylinder is, 0 to 1. At 0.5 and above the next
 * card faces the needles.
 * @param {number} phi
 * @returns {number}
 */
export function cylinderTurn(phi) {
  return ease(phi, P.cylinderTurn);
}

/**
 * The shuttle's way across the shed, 0 (in its box on the left) to 1 (across).
 * @param {number} phi
 * @returns {number}
 */
export function shuttleAcross(phi) {
  return ease(phi, P.shuttle);
}

/** When the batten strikes the weft into the cloth: three fifths into its beat. */
export const BATTEN_STRIKE = P.beat[0] + (P.beat[1] - P.beat[0]) * 0.6;

/**
 * The batten's swing: 0 at rest, -1 pushed back for the shuttle, +1 at the strike.
 * @param {number} phi
 * @returns {number}
 */
export function battenSwing(phi) {
  const back = ease(phi, [P.griffeRise[1], P.shuttle[0]]);
  const [a, b] = P.beat;
  const strike = BATTEN_STRIKE;
  if (phi < a) return back > 0 ? -back : 0;
  if (phi < strike) return -1 + 2 * ease(phi, [a, strike]);
  return 1 - ease(phi, [strike, b]);
}

/** True once this pick's weft has been beaten into the cloth. */
export const beaten = (/** @type {number} */ phi) => phi >= P.beat[1];

/** True while the weft is in the shed but not yet beaten up. */
export const weftInShed = (/** @type {number} */ phi) => phi >= P.shuttle[0] && phi < P.beat[1];
