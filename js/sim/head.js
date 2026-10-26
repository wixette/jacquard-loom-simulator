// The head's kinematics: for a given card on the needles, the card being woven and the
// moment phi, where every needle, hook and knife is. Pure numbers in the 2D section
// frame of params/machine.json (mm; x along the needles from the needle board's face,
// y up from the top of the bottom board). The views draw from this; they never decide
// anything themselves.
//
// How a hook is selected (research notes-mechanism):
// - a blank pushes its needle back by the needle's stroke, and the needle's eye pushes
//   its hook's upper part off its knife; a hole lets the needle into the cylinder, and
//   the hook stays upright over its knife;
// - the griffe rises; its knives catch under the crooks of the upright hooks and lift
//   them; the pushed hooks are passed by;
// - while a knife passes an unselected hook, the hook's top is held aside by the knife's
//   face (on the way up, once the cylinder has let the needle go; on the way down, by the
//   bevel, which pushes each upright hook aside until it springs back under the knife:
//   Barlow p. 157). The knife acts on the crook, at the top: the hook bends above the
//   needles, and the needle stays where its spring and the card put it. So a needle moves
//   only when the card touches it.
//
// One simplification, named: a pushed hook is drawn as moving sideways by its needle's
// stroke above the grate, and a hook held by a knife as bending above the top needle (the
// real wire flexes along its length); the research gives the needle stroke (12.7 mm) and
// estimates the hook's shift at the knife as about the same.

import { cylinderOut, cylinderTurn, griffeHeight } from "./cycle.js";
import { P } from "./params.js";

/** Height (mm) of the grate that holds the hooks' lower parts upright: the top of the rester. */
export const GRATE_Y = P.resterHeight;

/** Height of a crook's underside at rest (mm): where a knife catches it. */
export const CROOK_UNDERSIDE = P.hookHeight - P.hookWire;

/** Height of a knife's top edge at rest (mm). */
export const KNIFE_REST_TOP = CROOK_UNDERSIDE - P.restGap;

/** A knife's right face, relative to its hook's shank axis (mm, negative: toward the cylinder). */
export const KNIFE_RIGHT = -(P.hookWire / 2 + P.knifeGap);

/** Clearance a hook keeps from a knife's face when held aside by it (mm). */
export const HOLD_CLEARANCE = 1.0;

/**
 * How far a hook not caught must stand aside while a knife passes its crook (mm): its
 * crook's far edge must clear the knife's face.
 */
export const HOLD_SHIFT = P.crookOverhang + P.hookWire / 2 + KNIFE_RIGHT + HOLD_CLEARANCE;

/**
 * Griffe heights (mm) over which a knife passing an unselected hook standing on the board
 * keeps it aside: from where the knife's top is clear below the crook's downturned tip,
 * to where its bottom is above the crook.
 */
export const HOLD_WINDOW = /** @type {[number, number]} */ ([P.restGap - P.crookTipDrop - 0.5, P.restGap + P.knifeHeight + P.hookWire]);

/** Over this much further rise (mm) a held hook slides back off the knife's bevel. */
export const HOLD_RAMP = 6.0;

/**
 * x of hook k's shank (0-based k; hook 1 is nearest the needle board), mm.
 * @param {number} k
 * @returns {number}
 */
export const hookX = (k) => P.firstHookX + k * P.hookPitch;

/**
 * y of needle k (0-based; needle 1, the top one, serves hook 1), mm.
 * @param {number} k
 * @returns {number}
 */
export const needleY = (k) => P.topTierY - k * P.tierPitch;

/**
 * How far aside the crook of a hook not caught must stand at griffe height g (mm): fully
 * while the knife overlaps the crook; easing in over the knife's bevel as it comes down
 * onto the crook from above; easing out as the knife goes on down below the crook's tip,
 * where the hook springs back under it (smoothly, not in one step).
 * @param {number} g
 * @returns {number}
 */
export function holdShift(g) {
  const [lo, hi] = HOLD_WINDOW;
  if (g <= 0) return 0;
  if (g <= lo) return HOLD_SHIFT * (g / lo);
  if (g <= hi) return HOLD_SHIFT;
  if (g < hi + HOLD_RAMP) return HOLD_SHIFT * (1 - (g - hi) / HOLD_RAMP);
  return 0;
}

/**
 * @typedef {object} HookState
 * @property {boolean} selected its hole is punched in the card being woven
 * @property {boolean} caught it hangs on its knife now
 * @property {number} lift how far it is raised (mm)
 * @property {number} shift how far it stands aside from upright at its needle, away from its knife, pushed by the needle (mm); it is the needle's push
 * @property {number} deflect how much further its crook is held aside by a passing knife, the hook bending above the needles (mm)
 */

/**
 * @typedef {object} HeadState
 * @property {number} phi
 * @property {number} griffe the griffe's height above rest (mm)
 * @property {number} cylinderOut how far the cylinder has moved out (mm)
 * @property {number} turn the cylinder's quarter turn, 0 to 1
 * @property {boolean} nextFacing whether the next card (rather than this pick's) faces the needles
 * @property {number[]} cardPush how far the card on the cylinder pushes each needle back (mm)
 * @property {number[]} needlePush how far each needle is pushed back from its rest (mm): only ever by the card
 * @property {HookState[]} hooks
 */

/**
 * The head at moment phi of a pick.
 * @param {boolean[]} selection the card being woven (true = hole), or all true when there is none
 * @param {boolean[] | null} facingNext the card that comes to the needles after the turn, or null (an empty face)
 * @param {number} phi
 * @returns {HeadState}
 */
export function headState(selection, facingNext, phi) {
  const g = griffeHeight(phi);
  const out = cylinderOut(phi);
  const turn = cylinderTurn(phi);
  const nextFacing = turn >= 0.5;
  const face = nextFacing ? facingNext : selection;
  const reach = Math.max(0, P.needleProtrusion - out);
  const cardPush = selection.map((_s, k) => (face && !face[k] ? reach : 0));
  const hold = holdShift(g);
  /** @type {HookState[]} */
  const hooks = selection.map((selected, k) => {
    const caught = selected && g > P.restGap && cardPush[k] === 0;
    const lift = caught ? g - P.restGap : 0;
    // A selected hook stands upright for its knife to catch; an unselected one is pushed
    // by its needle, and its crook kept aside by the knife while the knife passes it.
    const shift = caught ? 0 : cardPush[k];
    const deflect = caught || selected ? 0 : Math.max(0, hold - shift);
    return { selected, caught, lift, shift, deflect };
  });
  // The needles follow the card alone: a hook bent by a knife does not drag its needle.
  const needlePush = [...cardPush];
  return { phi, griffe: g, cylinderOut: out, turn, nextFacing, cardPush, needlePush, hooks };
}
