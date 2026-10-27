// How the stage's views are chosen and arranged (design/ui-layout.md §4, The stage): no view is
// shown twice, and the four-view grid holds one 3D model at most (each costs the graphics card a
// great deal). Choosing a view already on the stage swaps it with the pane's own; going to two
// or four views keeps the views on show and fills the rest from the arrangement's defaults.
// Pure: the shell, the keyboard and the tests share it.

/** @typedef {import("../sim/link.js").StageView} StageView */

/**
 * The views each arrangement opens with: two, the section beside the loom in 3D; four, that pair
 * on top, the front and the side below.
 * @type {Record<1 | 2 | 4, StageView[]>}
 */
export const SPLIT = { 1: ["section"], 2: ["section", "3d"], 4: ["section", "3d", "front", "side"] };

/** Whether a view is a 3D model: the whole loom, or one of its units. @param {StageView} v */
export const is3d = (v) => v === "3d" || v.startsWith("u");

/**
 * The views after choosing x for pane i: a view on show elsewhere swaps with the pane's own; in
 * the four-view grid, a 3D model takes the place of the other 3D model, which takes the pane's
 * own view.
 * @param {readonly StageView[]} views
 * @param {number} i
 * @param {StageView} x
 * @returns {StageView[]}
 */
export function choose(views, i, x) {
  const out = [...views];
  const was = out[i];
  out[i] = x;
  const other = out.findIndex((v, j) => j !== i && (v === x || (views.length === 4 && is3d(x) && is3d(v))));
  if (other >= 0) out[other] = was;
  return out;
}

/**
 * The views for n panes: those on show first, in their order, then the arrangement's defaults
 * not on show yet (and, in four, no second 3D model).
 * @param {readonly StageView[]} views
 * @param {1 | 2 | 4} n
 * @returns {StageView[]}
 */
export function arrange(views, n) {
  /** @type {StageView[]} */
  const out = [];
  const fits = (/** @type {StageView} */ v) => !out.includes(v) && !(n === 4 && is3d(v) && out.some(is3d));
  for (const v of [...views, ...SPLIT[n], ...SPLIT[4], "u1"]) if (out.length < n && fits(/** @type {StageView} */ (v))) out.push(/** @type {StageView} */ (v));
  return out;
}

/**
 * Where pane j is, in words' keys: left and right in two, the corners in four.
 * @param {number} j
 * @param {number} n
 */
export const placeKey = (j, n) => (n === 2 ? ["view.at.left", "view.at.right"][j] : ["view.at.topLeft", "view.at.topRight", "view.at.bottomLeft", "view.at.bottomRight"][j]);
