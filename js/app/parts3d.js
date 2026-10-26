// "Parts in 3D" on the learner page: the ghosted loom with the five core units in place, or one
// unit alone, in the mechanism pane instead of the 2D section (plan §6: one view switch, so no
// control has two homes). Loaded the first time the learner chooses it, since it brings
// three.js and the models; posed from the loom at every redraw.

import { UNITS } from "../scene/units.js";
import { UnitsView } from "../scene/unitsView.js";
/** @import { LoomPage } from "./loomPage.js" */
/** @import { UnitId } from "../scene/units.js" */

/** What the whole loom view says under it. */
const MACHINE_IDEA = "The whole loom, ghosted, with one of each core unit in its place. The orange bands mark where the real machine repeats a unit: hundreds of hooks, needles and harness cords like the one shown. Click a unit, or a band's label, to open it.";

/**
 * @typedef {object} Parts3D
 * @property {UnitsView} view
 * @property {Promise<void>} ready resolves when the models are loaded
 * @property {(id: "machine" | UnitId) => void} open
 * @property {() => void} pose
 */

/**
 * @param {HTMLElement} host the panel: a bar of buttons, the 3D view, a caption
 * @param {LoomPage} page
 * @returns {Parts3D}
 */
export function createParts3D(host, page) {
  host.innerHTML = `
    <div class="parts-bar" role="group" aria-label="What the 3D view shows">
      <button type="button" data-part="machine">Whole loom</button>
      ${UNITS.map((u) => `<button type="button" data-part="${u.id}" title="${u.title}">${u.code} ${u.title.replace(/^The /, "").replace(/ and .*/, "")}</button>`).join("")}
    </div>
    <div class="parts3d-view"><p class="loading">Loading the 3D parts…</p></div>
    <p class="parts-idea"></p>`;
  const viewHost = /** @type {HTMLElement} */ (host.querySelector(".parts3d-view"));
  const idea = /** @type {HTMLElement} */ (host.querySelector(".parts-idea"));
  const loading = /** @type {HTMLElement} */ (host.querySelector(".loading"));
  const view = new UnitsView(viewHost, {
    onChange(mode) {
      for (const b of host.querySelectorAll("[data-part]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.part === mode);
      const spec = UNITS.find((u) => u.id === mode);
      idea.textContent = spec ? `${spec.code} · ${spec.title}. ${spec.idea}` : MACHINE_IDEA;
    },
  });
  host.querySelector(".parts-bar")?.addEventListener("click", (e) => {
    const b = /** @type {Element} */ (e.target).closest("[data-part]");
    if (!(b instanceof HTMLElement)) return;
    open(/** @type {"machine" | UnitId} */ (b.dataset.part));
  });
  /** @param {"machine" | UnitId} id */
  function open(id) {
    if (id === "machine") view.showMachine();
    else view.show(id);
  }
  const pose = () => view.pose(page.loom.snapshot(), page.follow ? page.follow.hook : 0);
  view.showMachine(false);
  const ready = view
    .load((f) => (loading.textContent = `Loading the 3D parts… ${Math.round(f * 100)} %`))
    .then(() => {
      loading.remove();
      pose();
    })
    .catch((e) => {
      loading.textContent = `The 3D parts could not be loaded: ${e}`;
      throw e;
    });
  return { view, ready, open, pose };
}
