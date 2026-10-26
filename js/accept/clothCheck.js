// A check of the woven cloth as the browser shows it: as the cloth grows past its box and its
// scrollbar appears, the cells keep their size, so the cloth grows steadily instead of
// blinking between two sizes (the scrollbar's width once fed back into the cell size).

import { result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */

/**
 * Steps the loom (with a deck that does not run out) until the cloth is a few rows taller
 * than its box, and watches the canvas's width at every step.
 * @param {HTMLElement} host the cloth's scrolling box
 * @param {() => void} step turns the loom on by one stop
 * @returns {CheckResult}
 */
export function checkClothSteady(host, step) {
  const canvas = /** @type {HTMLCanvasElement} */ (host.querySelector("canvas"));
  const widths = new Set();
  let steps = 0;
  let past = 0;
  let scrolled = false;
  while (steps < 2000 && past < 30) {
    step();
    steps++;
    widths.add(canvas.style.width);
    if (canvas.offsetHeight > host.clientHeight) {
      scrolled = true;
      past++;
    }
  }
  const ok = scrolled && widths.size === 1;
  return result(
    "V-3",
    "The woven cloth keeps its cell size as it grows past its box and its scrollbar appears (it does not blink)",
    ok,
    !scrolled ? `the cloth never grew past its box in ${steps} steps` : widths.size > 1 ? `the cloth took ${widths.size} widths (${[...widths].join(", ")}) as it grew` : `${steps} steps, the cloth ${canvas.offsetHeight} px in a ${host.clientHeight} px box, one width throughout`,
  );
}
