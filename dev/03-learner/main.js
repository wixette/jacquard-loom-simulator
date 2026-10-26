// M2 developer page: the prototype learner page, which was the site's main page until the
// main app (design/public-app.md). With ?selftest it also runs every milestone's acceptance
// checks in the page (the 3D ones on the files the page loads), and the label checks on its
// views, as the developer pages do.

import pkg from "../../package.json" with { type: "json" };
import { checkClothSteady } from "../../js/accept/clothCheck.js";
import { checkLabels } from "../../js/accept/labelCheck.js";
import { runM0Checks } from "../../js/accept/m0Checks.js";
import { runM1Checks } from "../../js/accept/m1Checks.js";
import { runM2Checks, runM2PageChecks } from "../../js/accept/m2Checks.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { createLearnerPage } from "../../js/app/learnerPage.js";
/** @import { CheckResult } from "../../js/accept/harness.js" */
/** @import { Unit, UnitId } from "../../js/scene/units.js" */

const learner = createLearnerPage();
/** @type {HTMLElement} */ (document.getElementById("version")).textContent = pkg.version;

if (selftestRequested()) selftest();

async function selftest() {
  const t0 = performance.now();
  /** @type {CheckResult[]} */
  const results = [...runM0Checks(), ...(await runM1Checks()), ...runM2Checks(), ...runM2PageChecks(learner)];
  const viewButtons = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-view]")]);
  const dockButtons = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-dock]")]);
  results.push(
    ...checkLabels(
      () => /** @type {SVGSVGElement[]} */ ([...document.querySelectorAll("svg.section, svg.front, svg.side, svg.bench-card")]),
      [
        ...viewButtons.map((b) => ({ name: `${b.textContent} view`, show: () => b.click() })),
        ...dockButtons.map((b) => ({ name: `${b.textContent} tab`, show: () => b.click() })),
        { name: "back", show: () => (viewButtons[0].click(), dockButtons[0].click()) },
      ],
    ),
  );
  // The cloth as it grows past its box (a looped chain), then the loom put back.
  {
    const keep = { deck: learner.page.loom.deck, tie: learner.page.loom.tie };
    learner.page.open({ deck: { ...keep.deck, loop: true }, tie: keep.tie });
    const fwd = /** @type {HTMLElement} */ (document.getElementById("fwd"));
    results.push(checkClothSteady(/** @type {HTMLElement} */ (document.getElementById("cloth")), () => fwd.click()));
    learner.page.open({ deck: keep.deck, tie: keep.tie, message: "The first card is pressed against the needles. Press Step ▸ to turn the loom to the next moment, or Play." });
  }
  // The 3D parts: the M3 and M4 checks on the files the page loads, then the page's own.
  try {
    const [{ runM3Checks }, { runM4Checks, runM4PageChecks }] = await Promise.all([import("../../js/accept/m3Checks.js"), import("../../js/accept/m4Checks.js")]);
    const parts = await learner.mechanism("3d");
    if (parts?.view.context) {
      const units = /** @type {Record<UnitId, Unit>} */ (parts.view.units);
      results.push(...runM3Checks(units), ...runM4Checks(parts.view.context, units));
      parts.pose();
    }
    results.push(...(await runM4PageChecks(learner)));
  } catch (e) {
    results.push({ id: "J4-6", title: "Parts in 3D", passed: false, detail: String(e) });
  }
  showSelftest(/** @type {HTMLElement} */ (document.getElementById("side-panel")), results, performance.now() - t0);
}
