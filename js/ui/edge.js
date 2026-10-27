// A side panel's edge (design/ui-layout.md §4, as the sibling's dock edge, its U17): a window
// splitter between the panel and the stage. Drag it, or move it with the arrow keys (Shift: four
// times as far), Home and End for the smallest and the largest size; a double-click gives the
// default size back. Dragged well past its smallest size the panel closes to its rail, and Enter
// closes or opens it. The size, and whether the panel is closed, are remembered on this device.

/** An arrow key moves the edge this far (px); with Shift, four times as far. */
const STEP = 16;
/** Dragged this far (px) past the smallest size, the panel closes. */
const CLOSE_BEYOND = 60;

/**
 * The browser's storage, which may be missing or refuse (a private window): then nothing is
 * remembered.
 */
const saved = {
  /** @param {string} key */
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  /** @param {string} key @param {string | null} value */
  set(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // not remembered
    }
  },
};

/**
 * @typedef {object} Edge
 * @property {(closed: boolean, remember?: boolean) => void} close close the panel to its rail, or open it
 * @property {() => boolean} closed
 */

/**
 * @param {object} o
 * @param {HTMLElement} o.work the grid holding the panels and the stage, with the sizes as `--left` and `--right`
 * @param {HTMLElement} o.panel
 * @param {HTMLElement} o.edge
 * @param {"left" | "right"} o.side which side of the stage the panel is on
 * @param {{ min: number; max: number; size: number }} o.sizes px
 * @param {number} o.stageMin what the stage keeps at least (px)
 * @param {boolean} o.startClosed closed, if the learner never chose (a narrow screen)
 * @returns {Edge}
 */
export function wireEdge({ work, panel, edge, side, sizes, stageMin, startClosed }) {
  const key = `jacquard.panel.${side}`;
  const prop = `--${side}`;
  const other = side === "left" ? "--right" : "--left";
  const range = () => {
    const w = work.getBoundingClientRect().width;
    const rest = parseFloat(getComputedStyle(work).getPropertyValue(other)) || 0;
    return { min: sizes.min, max: Math.max(sizes.min, Math.min(sizes.max, Math.round(w - rest - stageMin))) };
  };
  const size = () => Math.round(panel.getBoundingClientRect().width);
  const isClosed = () => work.classList.contains(`${side}-closed`);
  const describe = () => {
    const { min, max } = range();
    edge.setAttribute("aria-valuemin", String(min));
    edge.setAttribute("aria-valuemax", String(max));
    edge.setAttribute("aria-valuenow", String(isClosed() ? 0 : size()));
  };
  /** @param {number} px @param {boolean} [save] */
  const set = (px, save = true) => {
    const { min, max } = range();
    const v = Math.round(Math.min(max, Math.max(min, px)));
    work.style.setProperty(prop, `${v}px`);
    if (save) saved.set(key, String(v));
    describe();
  };
  /** @param {boolean} closed @param {boolean} [remember] */
  const close = (closed, remember = true) => {
    work.classList.toggle(`${side}-closed`, closed);
    panel.classList.toggle("closed", closed);
    if (remember) saved.set(`${key}.closed`, closed ? "1" : "0");
    describe();
  };
  const remembered = Number(saved.get(key));
  if (remembered > 0) set(remembered, false);
  const was = saved.get(`${key}.closed`);
  close(was === null ? startClosed : was === "1", false);

  /** @type {{ px: number | null } | null} */
  let drag = null;
  edge.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    drag = { px: null };
    try {
      edge.setPointerCapture(e.pointerId);
    } catch {
      // not an active pointer: the drag works without capture
    }
    document.body.classList.add("resizing");
  });
  edge.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = work.getBoundingClientRect();
    drag.px = side === "left" ? e.clientX - r.left : r.right - e.clientX;
    if (drag.px < range().min - CLOSE_BEYOND) return;
    if (isClosed()) close(false);
    set(drag.px, false);
  });
  const end = () => {
    if (!drag) return;
    const { px } = drag;
    drag = null;
    document.body.classList.remove("resizing");
    if (px === null) return;
    if (px < range().min - CLOSE_BEYOND) close(true);
    else set(px);
  };
  edge.addEventListener("pointerup", end);
  edge.addEventListener("pointercancel", end);
  edge.addEventListener("dblclick", () => {
    work.style.removeProperty(prop);
    saved.set(key, null);
    close(false);
  });
  edge.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? STEP * 4 : STEP;
    // the panel grows towards the stage
    const grow = side === "left" ? "ArrowRight" : "ArrowLeft";
    const shrink = side === "left" ? "ArrowLeft" : "ArrowRight";
    if (e.key === "Enter") close(!isClosed());
    else if (isClosed()) return;
    else if (e.key === grow) set(size() + step);
    else if (e.key === shrink) set(size() - step);
    else if (e.key === "Home") set(range().min);
    else if (e.key === "End") set(range().max);
    else return;
    e.preventDefault();
  });
  return { close, closed: isClosed };
}
