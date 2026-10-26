// M1 developer page: the whole Jacquard loom in 2D (js/app/loomPage.js, shared with the
// learner page), with the M0 and M1 acceptance checks and the label checks in ?selftest.

import { checkClothSteady } from "../../js/accept/clothCheck.js";
import { checkLabels } from "../../js/accept/labelCheck.js";
import { runM0Checks } from "../../js/accept/m0Checks.js";
import { runM1Checks } from "../../js/accept/m1Checks.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { createLoomPage } from "../../js/app/loomPage.js";

createLoomPage();

if (selftestRequested()) {
  const t0 = performance.now();
  const results = [...runM0Checks(), ...runM1Checks()];
  // The labels as shown, in each view of the section (then back to the view the page had).
  const viewButtons = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-view]")]);
  const was = viewButtons.find((b) => b.classList.contains("on")) ?? viewButtons[0];
  results.push(
    ...checkLabels(
      () => /** @type {SVGSVGElement[]} */ ([...document.querySelectorAll("svg.section, svg.front, svg.side, svg.bench-card")]),
      [...viewButtons.map((b) => ({ name: `${b.textContent} view`, show: () => b.click() })), { name: "back", show: () => was.click() }],
    ),
  );
  results.push(clothSteady());
  showSelftest(/** @type {HTMLElement} */ (document.getElementById("side-panel")), results, performance.now() - t0);
}

/**
 * V-3 on this page: a looped chain woven past the cloth's box, then the loom put back.
 * @returns {import("../../js/accept/harness.js").CheckResult}
 */
function clothSteady() {
  const loop = /** @type {HTMLInputElement} */ (document.getElementById("loop"));
  const was = loop.checked;
  const setLoop = (/** @type {boolean} */ on) => {
    loop.checked = on;
    loop.dispatchEvent(new Event("change"));
  };
  setLoop(true);
  const fwd = /** @type {HTMLElement} */ (document.getElementById("fwd"));
  const r = checkClothSteady(/** @type {HTMLElement} */ (document.getElementById("cloth")), () => fwd.click());
  setLoop(was);
  /** @type {HTMLElement} */ (document.getElementById("reset")).click();
  return r;
}
