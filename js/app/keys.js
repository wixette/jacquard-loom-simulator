// The keyboard (design/ui-layout.md §6, rule 5): Space plays or pauses, ← and → step back and on,
// 1 to 4 put the section, the side, the front or the loom in 3D in the first view, F follows what
// is under the pointer, Esc stops following. The keys act only while nothing that takes them has
// the focus: a text field or a list, a button (Space presses it), a tab, a menu, a panel's edge,
// or an open dialog.

import * as act from "./looms.js";
/** @import { AppStore, StageView } from "./looms.js" */

/** The views the number keys put in the first view, in the order of the view chips. */
const NUMBER_VIEWS = /** @type {const} */ (["section", "side", "front", "3d"]);

/** What keeps its keys: the elements with keys of their own. */
const OWN_KEYS = "input, select, textarea, [contenteditable], [role=tab], [role=menu], [role=menuitem], [role=menuitemradio], [role=separator], dialog, .popover";

/**
 * @param {AppStore} store
 * @returns {() => void} the way to take the keys away again
 */
export function wireKeys(store) {
  /** Where the pointer is, for F. */
  let at = { x: -1, y: -1 };
  const moved = (/** @type {PointerEvent} */ e) => {
    at = { x: e.clientX, y: e.clientY };
  };
  const pressed = (/** @type {KeyboardEvent} */ e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = /** @type {Element} */ (e.target);
    if (target.closest?.(OWN_KEYS) || document.querySelector("dialog[open]")) return;
    const onButton = target.closest?.("button, a[href]") !== null;
    const id = store.state.current;
    if (e.key === " " && !onButton) act.play(store, id);
    else if (e.key === "ArrowRight") act.step(store, id);
    else if (e.key === "ArrowLeft") act.stepBack(store, id);
    else if (e.key >= "1" && e.key <= "4" && !e.shiftKey) {
      const views = /** @type {StageView[]} */ ([...store.state.views]);
      views[0] = NUMBER_VIEWS[Number(e.key) - 1];
      // a view shown twice would be one too many: the other pane takes the first one's
      const twice = views.indexOf(views[0], 1);
      if (twice > 0) views[twice] = store.state.views[0];
      act.setViews(store, views);
    } else if (e.key === "f" || e.key === "F") {
      const under = document.elementFromPoint(at.x, at.y);
      if (!under?.closest(".pane-host, .cloth-box")) return;
      under.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: at.x, clientY: at.y }));
    } else if (e.key === "Escape" && store.state.looms[id].follow) act.follow(store, null, id);
    else return;
    e.preventDefault();
  };
  window.addEventListener("pointermove", moved, { passive: true });
  window.addEventListener("keydown", pressed);
  return () => {
    window.removeEventListener("pointermove", moved);
    window.removeEventListener("keydown", pressed);
  };
}
