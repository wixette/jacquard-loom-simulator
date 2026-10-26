// The cloth as a grid of 0s and 1s: one row per pick, first pick at the bottom; one
// column per warp end. 1 = the warp end lies over the weft (it was lifted), 0 = the weft
// lies over it. The row being woven shows while its weft is in the shed, outlined.

import { hookOfEnd } from "../sim/tieup.js";
/** @import { Snapshot } from "../sim/loom.js" */

const NS = "http://www.w3.org/2000/svg";
const CELL = 18;
const MAX_ROWS = 24;

export class ClothGrid {
  /**
   * @param {HTMLElement} host
   * @param {{ onEnd: (end: number) => void }} events end is 1-based
   */
  constructor(host, events) {
    this.svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, "svg"));
    this.svg.setAttribute("class", "cloth");
    this.svg.setAttribute("role", "img");
    host.appendChild(this.svg);
    this.svg.addEventListener("click", (e) => {
      const t = /** @type {Element} */ (e.target).closest("[data-end]");
      if (t instanceof SVGElement && t.dataset.end) events.onEnd(Number(t.dataset.end));
    });
  }

  /**
   * @param {Snapshot} snap
   * @param {number | null} follow the followed hook (0-based), or null
   */
  render(snap, follow) {
    const rows = snap.cloth;
    const ends = rows[0]?.length ?? snap.endLift.length;
    const shown = rows.slice(-MAX_ROWS);
    const first = rows.length - shown.length;
    const all = snap.pendingRow ? [...shown, snap.pendingRow] : shown;
    const left = 30;
    const top = 8;
    const h = Math.max(all.length, 1) * CELL;
    const w = ends * CELL;
    const out = [];
    const followed = (/** @type {number} */ e) => follow !== null && hookOfEnd(snap.tie, snap.deck.hooks, e) === follow + 1;
    for (let e = 1; e <= ends; e++) {
      if (followed(e)) out.push(`<rect class="col-follow" x="${left + (e - 1) * CELL - 1}" y="${top - 2}" width="${CELL + 2}" height="${h + 4}"/>`);
    }
    all.forEach((row, i) => {
      const y = top + h - (i + 1) * CELL;
      const pending = snap.pendingRow !== null && i === all.length - 1;
      const pick = first + i + 1;
      out.push(`<text class="rowlbl" x="${left - 6}" y="${y + CELL * 0.68}" text-anchor="end">${pick}</text>`);
      row.forEach((up, j) => {
        const x = left + j * CELL;
        out.push(`<rect class="cell ${up ? "w" : "f"}${pending ? " pending" : ""}" data-end="${j + 1}" x="${x}" y="${y}" width="${CELL - 1}" height="${CELL - 1}"/>`);
        out.push(`<text class="bit${up ? " w" : ""}" x="${x + (CELL - 1) / 2}" y="${y + CELL * 0.68}" text-anchor="middle">${up ? 1 : 0}</text>`);
      });
      if (pending) out.push(`<rect class="pending-outline" x="${left - 1}" y="${y - 1}" width="${w + 1}" height="${CELL + 1}"/>`);
    });
    if (all.length === 0) out.push(`<text class="rowlbl" x="${left}" y="${top + CELL * 0.68}">No cloth yet.</text>`);
    for (let e = 1; e <= ends; e++) {
      out.push(`<text class="collbl${followed(e) ? " follow" : ""}" data-end="${e}" x="${left + (e - 1) * CELL + (CELL - 1) / 2}" y="${top + h + 14}" text-anchor="middle">${e}</text>`);
    }
    const width = left + w + 6;
    const height = top + h + 22;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.setAttribute("width", String(width));
    this.svg.setAttribute("height", String(height));
    this.svg.setAttribute("aria-label", `Cloth: ${rows.length} pick${rows.length === 1 ? "" : "s"} woven, ${ends} warp ends`);
    this.svg.innerHTML = out.join("");
  }
}
