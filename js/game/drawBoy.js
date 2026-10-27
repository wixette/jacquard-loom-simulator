// Draw boy against Jacquard (design/public-app.md §2): the same figure woven twice. First as on
// a draw loom: for every row the player, as the draw boy, pulls the cords of the warp ends that
// must rise, one by one, and the weaver throws the shuttle; a cord missed or one too many shows
// in the cloth. Then with the cards, which make the same choices by themselves. The game counts
// what each took: the cords pulled by hand, and the cards. (No historical speeds: none of the
// research's sources gives one.) Pure: no DOM.

import { PICTURES, pictureFromStrings } from "../sim/design.js";
/** @import { Picture } from "../sim/design.js" */

/** The figure: the research's arrow, 8 × 8, its first row woven its bottom one. */
export const FIGURE = /** @type {Picture} */ (pictureFromStrings(PICTURES.arrow.rows));

/** The rows to weave, first pick first: the figure from its bottom row up. */
export const ROWS = [...FIGURE].reverse();

/**
 * The draw boy's state: the rows woven by hand, the cords pulled for the row on the loom, and
 * the count of every cord pulled (and let go), mistakes included.
 * @typedef {object} DrawBoy
 * @property {boolean[][]} woven
 * @property {boolean[]} pulled the cords pulled now, end by end
 * @property {number} pulls
 */

/** @returns {DrawBoy} */
export const start = () => ({ woven: [], pulled: new Array(8).fill(false), pulls: 0 });

/**
 * Pull a cord, or let it go.
 * @param {DrawBoy} d
 * @param {number} end 0-based
 * @returns {DrawBoy}
 */
export const pull = (d, end) => (d.woven.length >= ROWS.length ? d : { ...d, pulled: d.pulled.map((p, e) => (e === end ? !p : p)), pulls: d.pulls + 1 });

/**
 * Throw the shuttle: the row woven as the cords stand, and the cords let go for the next.
 * @param {DrawBoy} d
 * @returns {DrawBoy}
 */
export const throwShuttle = (d) => (d.woven.length >= ROWS.length ? d : { ...d, woven: [...d.woven, [...d.pulled]], pulled: new Array(8).fill(false) });

/** Whether the figure is woven. @param {DrawBoy} d */
export const finished = (d) => d.woven.length >= ROWS.length;

/**
 * The rows woven wrongly (0-based), against the figure.
 * @param {DrawBoy} d
 * @returns {number[]}
 */
export const mistakes = (d) => d.woven.flatMap((row, p) => (row.some((x, e) => x !== ROWS[p][e]) ? [p] : []));

/** The fewest cords a draw boy pulls for the figure: one for every warp end each row lifts. */
export const FEWEST_PULLS = ROWS.reduce((n, row) => n + row.filter(Boolean).length, 0);
