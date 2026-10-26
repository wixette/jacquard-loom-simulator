// The woven cloth, first pick at the bottom, drawn thread by thread: where a warp end lies
// over the weft its colour shows, shaded as a vertical thread; where the weft lies over
// it, the weft's colour shows, shaded as a horizontal thread. The back of the cloth is the
// front turned over: every float changes sides, and left and right swap. A 0/1 overlay
// shows the same cloth as the bits it was woven from.
//
// clothCells() is pure (it says what each cell shows); ClothView draws it on a canvas.

import { t, tn } from "../l10n/l10n.js";
import { hookOfEnd } from "../sim/tieup.js";
import { token } from "../ui/theme.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Trace } from "../sim/trace.js" */

/**
 * @typedef {object} ClothCell
 * @property {number} pick 0-based
 * @property {number} end 1-based, the warp end this cell belongs to
 * @property {boolean} warpOver whether the warp's colour shows here, on the face drawn
 * @property {boolean} bit the woven bit: 1 = warp over weft on the front
 * @property {boolean} pending the row whose weft is still in the shed
 */

/**
 * The cells as drawn, row by row, the first pick first, each row left to right as seen
 * on the face drawn.
 * @param {Snapshot} snap
 * @param {"front" | "back"} face
 * @returns {ClothCell[][]}
 */
export function clothCells(snap, face) {
  const rows = snap.pendingRow ? [...snap.cloth, snap.pendingRow] : snap.cloth;
  return rows.map((row, r) => {
    const cells = row.map((bit, j) => ({ pick: r, end: j + 1, warpOver: face === "front" ? bit : !bit, bit, pending: snap.pendingRow !== null && r === rows.length - 1 }));
    return face === "front" ? cells : cells.reverse();
  });
}

/**
 * @param {string} hex "#rrggbb"
 * @param {number} k how much lighter (+) or darker (-), -1 to 1
 * @returns {string}
 */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`; // not a theme colour: a shade of the learner's own colour
}

/** At most this many rows are drawn, the newest. */
const MAX_ROWS = 400;

/** @type {number | null} */
let scrollbar = null;

/**
 * How wide a scrollbar is in this browser (0 where scrollbars float over the content).
 * @returns {number}
 */
function scrollbarWidth() {
  if (scrollbar === null) {
    const d = document.createElement("div");
    d.style.cssText = "position:absolute;top:-200px;width:100px;height:50px;overflow:scroll;visibility:hidden";
    document.body.appendChild(d);
    scrollbar = d.offsetWidth - d.clientWidth;
    d.remove();
  }
  return scrollbar;
}

/**
 * The width inside a scrolling box, less room for its scrollbar whether it shows or not.
 * @param {HTMLElement} host
 * @returns {number}
 */
export function steadyWidth(host) {
  const s = getComputedStyle(host);
  const inner = host.offsetWidth - parseFloat(s.borderLeftWidth) - parseFloat(s.borderRightWidth) - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  return inner - scrollbarWidth();
}

export class ClothView {
  /**
   * @param {HTMLElement} host
   * @param {{ onCell: (pick: number, end: number) => void }} events
   */
  constructor(host, events) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "cloth-canvas";
    this.canvas.setAttribute("role", "img");
    host.appendChild(this.canvas);
    /** @type {ClothCell[][]} */
    this.cells = [];
    this.cell = 10;
    this.left = 28;
    this.top = 6;
    this.canvas.addEventListener("click", (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left - this.left;
      const y = e.clientY - r.top - this.top;
      const n = this.cells.length;
      const row = n - 1 - Math.floor(y / this.cell);
      const col = Math.floor(x / this.cell);
      const c = this.cells[row]?.[col];
      if (c) events.onCell(c.pick, c.end);
    });
  }

  /**
   * @param {Snapshot} snap
   * @param {{ face: "front" | "back", warp: string, weft: string, bits: boolean, trace: Trace | null }} o
   */
  render(snap, o) {
    // The newest rows only, when the cloth gets long (a looped chain can weave for ever).
    const all = clothCells(snap, o.face);
    const cells = all.slice(-MAX_ROWS);
    const skipped = all.length - cells.length;
    this.cells = cells;
    const ends = cells[0]?.length ?? snap.endLift.length;
    // The width is the same whether or not the scrollbar shows: sizing the cells to the width
    // left beside a scrollbar that comes and goes made the cloth fit, then overflow, then fit
    // again at every redraw, so it blinked as it grew past its box.
    const width = Math.max(200, steadyWidth(this.host) - 4);
    const cell = Math.max(3, Math.min(22, Math.floor((width - this.left - 6) / ends)));
    this.cell = cell;
    const rows = Math.max(cells.length, 1);
    const w = this.left + ends * cell + 6;
    const h = this.top + rows * cell + 18;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const g = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext("2d"));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const warpDark = shade(o.warp, -0.35);
    const warpLight = shade(o.warp, 0.25);
    const weftDark = shade(o.weft, -0.25);
    const weftLight = shade(o.weft, 0.35);
    const tr = o.trace;
    const followEnd = (/** @type {number} */ e) => tr !== null && hookOfEnd(snap.tie, snap.deck.hooks, e) === tr.hook + 1;
    cells.forEach((row, r) => {
      const y = this.top + (rows - 1 - r) * cell;
      row.forEach((c, j) => {
        const x = this.left + j * cell;
        g.globalAlpha = c.pending ? 0.55 : 1;
        if (c.warpOver) {
          const grad = g.createLinearGradient(x, 0, x + cell, 0);
          grad.addColorStop(0, warpDark);
          grad.addColorStop(0.5, warpLight);
          grad.addColorStop(1, warpDark);
          g.fillStyle = grad;
        } else {
          const grad = g.createLinearGradient(0, y, 0, y + cell);
          grad.addColorStop(0, weftDark);
          grad.addColorStop(0.5, weftLight);
          grad.addColorStop(1, weftDark);
          g.fillStyle = grad;
        }
        g.fillRect(x, y, cell - (cell > 5 ? 1 : 0), cell - (cell > 5 ? 1 : 0));
        if (o.bits && cell >= 12) {
          g.globalAlpha = 1;
          g.fillStyle = c.warpOver ? "rgba(255,255,255,0.85)" : "rgba(60,40,10,0.7)"; // not a theme colour: the bits are read on the learner's own colours
          g.font = `${Math.round(cell * 0.6)}px ui-monospace, Menlo, monospace`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(c.bit ? "1" : "0", x + cell / 2, y + cell / 2 + 1);
        }
      });
      g.globalAlpha = 1;
      if (cell >= 8 && (cells.length <= 40 || (r + 1) % 5 === 0)) {
        g.fillStyle = token("--label", "#c9d0d9");
        g.font = `10px ${token("--font", "system-ui, sans-serif")}`;
        g.textAlign = "right";
        g.textBaseline = "middle";
        g.fillText(String(r + 1 + skipped), this.left - 5, y + cell / 2);
      }
    });
    const pendingRow = cells.findIndex((row) => row[0]?.pending);
    if (pendingRow >= 0) {
      // The row in the shed: a dashed frame in the text's colour, while its weft is not yet beaten.
      g.strokeStyle = token("--md-on-surface", "#e0e3e9");
      g.setLineDash([3, 2]);
      g.lineWidth = 1.5;
      g.strokeRect(this.left - 1, this.top + (rows - 1 - pendingRow) * cell - 1, ends * cell + 1, cell + 1);
      g.setLineDash([]);
    }
    if (tr) {
      g.strokeStyle = token("--md-primary", "#9ecaff");
      g.lineWidth = 1.5;
      (cells[0] ?? []).forEach((c, j) => {
        if (followEnd(c.end)) g.strokeRect(this.left + j * cell - 0.5, this.top - 2, cell, rows * cell + 3);
      });
      const tp = tr.pick === null ? -1 : tr.pick - skipped;
      if (tr.end !== null && tp >= 0 && tp < cells.length) {
        const j = cells[tp].findIndex((c) => c.end === tr.end);
        g.lineWidth = 2.5;
        g.strokeStyle = token("--md-primary", "#9ecaff");
        g.strokeRect(this.left + j * cell - 1, this.top + (rows - 1 - tp) * cell - 1, cell + 1, cell + 1);
      }
    }
    if (cells.length === 0) {
      g.fillStyle = token("--label", "#c9d0d9");
      g.font = `12px ${token("--font", "system-ui, sans-serif")}`;
      g.textAlign = "left";
      g.fillText(t("cloth.none"), this.left, this.top + 12);
    }
    this.canvas.setAttribute("aria-label", tn("cloth.name", snap.cloth.length, { face: t(o.face === "front" ? "cloth.front" : "cloth.back"), ends }));
  }
}
