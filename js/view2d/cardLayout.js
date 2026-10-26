// The real card, as shapes in mm: c columns of 8 holes (one column per cross-row of the
// head, one row per needle tier), a peg hole at each end, and lacing holes. The hole and
// row pitches are the research's (6.9 x 6.3 mm, derived from Posselt and Barlow); the
// card's length for a head of c cross-rows is our own, from the same margins as Posselt's
// 200 card (26 columns in 244.5 x 58.7 mm, pegs 190.5 mm apart).

import { holeOfHook } from "../sim/deck.js";
import { P, U } from "../sim/params.js";

/** Hole pitch along the card (between columns) and across it (between rows), mm. */
export const COLUMN_PITCH = 6.9;
export const ROW_PITCH = P.tierPitch;
/** From the outer column to the peg hole's centre, and from the peg to the card's end, mm. */
const PEG_INSET = (190.5 - 25 * COLUMN_PITCH) / 2 + 6;
const END_MARGIN = (244.5 - 190.5) / 2;

/**
 * @typedef {object} CardHole
 * @property {number} hook 0-based
 * @property {number} column 0-based, from the left
 * @property {number} row 0-based, from the top (the top needle's row)
 * @property {number} x centre, mm from the card's left end
 * @property {number} y centre, mm from the card's top edge
 */

/**
 * @typedef {object} RealCard
 * @property {number} width mm (the long side)
 * @property {number} height mm (the short side: 2 5/16 in)
 * @property {CardHole[]} holes one per hook, in hook order
 * @property {{ x: number, y: number }[]} pegs the two peg holes
 * @property {{ x: number, y: number }[]} laces lacing holes near each end
 * @property {number} holeDiameter
 * @property {number} pegDiameter
 */

/**
 * The real card for a head of `hooks` hooks.
 * @param {number} hooks
 * @returns {RealCard}
 */
export function realCard(hooks) {
  const columns = hooks / 8;
  const height = P.cardWidth;
  const gridW = (columns - 1) * COLUMN_PITCH;
  const peg0 = END_MARGIN;
  const col0 = peg0 + PEG_INSET;
  const peg1 = col0 + gridW + PEG_INSET;
  const width = peg1 + END_MARGIN;
  const midY = height / 2;
  /** @type {CardHole[]} */
  const holes = [];
  for (let h = 0; h < hooks; h++) {
    const { column, row } = holeOfHook(h);
    holes.push({ hook: h, column, row, x: col0 + column * COLUMN_PITCH, y: midY + (row - 3.5) * ROW_PITCH });
  }
  return {
    width,
    height,
    holes,
    pegs: [
      { x: peg0, y: midY },
      { x: peg1, y: midY },
    ],
    laces: [
      { x: peg0 / 2.2, y: midY - 18 },
      { x: peg0 / 2.2, y: midY + 18 },
      { x: width - peg0 / 2.2, y: midY - 18 },
      { x: width - peg0 / 2.2, y: midY + 18 },
    ],
    holeDiameter: P.holeDiameter,
    pegDiameter: U.pegDiameter,
  };
}
