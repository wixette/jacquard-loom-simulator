// The picture helper's panel (design/m2-notes.md): a small picture, drawn on a grid, opened
// from an image file (reduced and thresholded here, in the browser; never uploaded) or
// taken from the presets, read into cards directly or as damask (js/sim/design.js). Before
// the cards go on the loom it shows the cloth they will weave, with every float longer
// than the limit marked, and says what the reading needs and why it may not fit.

import { HOOK_COUNTS } from "../sim/deck.js";
import { FLOAT_LIMIT, findFloats, pictureFromPixels, pictureFromStrings, PICTURES, readDamask, readDirect } from "../sim/design.js";
/** @import { Deck } from "../sim/deck.js" */
/** @import { Picture, ReadResult } from "../sim/design.js" */

/**
 * @typedef {object} PictureOptions
 * @property {"direct" | "damask"} mode
 * @property {number | null} hooks null: the smallest head that fits
 * @property {boolean} invert
 * @property {number} picksPerRow direct only
 * @property {boolean} repeat direct only: tile the picture across a wider head
 * @property {number} k damask only: threads per pixel
 */

/**
 * @typedef {object} Planned what the helper would put on the loom
 * @property {ReadResult} read
 * @property {number} hooks
 * @property {string} text what it is, in words
 */

/** The sizes a picture can be drawn at. */
export const SIZES = [8, 16, 24, 32];

/**
 * The smallest head that takes `width` ends, or null.
 * @param {number} width
 */
export const headFor = (width) => HOOK_COUNTS.find((n) => n >= width) ?? null;

/**
 * Reads a picture with the given options, choosing the head when none is set.
 * @param {Picture} picture
 * @param {PictureOptions} o
 * @returns {Planned}
 */
export function planCards(picture, o) {
  const w = picture[0]?.length ?? 0;
  const need = o.mode === "damask" ? w * o.k : w;
  const hooks = o.hooks ?? headFor(need) ?? HOOK_COUNTS[HOOK_COUNTS.length - 1];
  const read = o.mode === "damask" ? readDamask(picture, { hooks, k: o.k, invert: o.invert }) : readDirect(picture, { hooks, invert: o.invert, picksPerRow: o.picksPerRow, repeat: o.repeat });
  if (!read.ok) return { read, hooks, text: read.reason };
  const r = read.reading;
  const how = o.mode === "damask" ? `as damask, each pixel ${o.k} × ${o.k} threads of 8-end satin` : `directly, one pixel per thread${o.picksPerRow > 1 ? `, ${o.picksPerRow} picks per row` : ""}${o.repeat && r.width > w ? ", repeated across the head" : ""}`;
  return { read, hooks, text: `${w} × ${picture.length} picture, read ${how}: ${r.cards.length} cards on a ${hooks}-hook head.` };
}

export class PictureHelper {
  /**
   * @param {HTMLElement} host
   * @param {{ onCards: (deck: Deck, message: string) => void, say: (text: string, warn?: boolean) => void }} events
   */
  constructor(host, events) {
    this.events = events;
    /** @type {Picture} */
    this.picture = pictureFromStrings(PICTURES.heart.rows);
    /** @type {PictureOptions} */
    this.o = { mode: "direct", hooks: null, invert: false, picksPerRow: 1, repeat: false, k: 4 };
    /** @type {Planned | null} */
    this.planned = null;
    host.innerHTML = `
      <p class="dock-intro">A weaver's designer painted the figure on squared paper, one square per thread; a reader then cut one card per row. This helper is that reader.</p>
      <div class="row">
        <label class="field grow">Picture <select id="pic-preset" aria-label="Ready-made pictures"></select></label>
        <label class="field">Size <select id="pic-size" aria-label="Grid size"></select></label>
      </div>
      <canvas id="pic-grid" class="pic-grid" width="320" height="320" aria-label="The picture: click or drag to paint a square dark or light"></canvas>
      <div class="row tools">
        <button type="button" id="pic-clear">Clear</button>
        <button type="button" id="pic-invert">Invert picture</button>
        <label class="file-btn">Open an image… <input id="pic-file" type="file" accept="image/*" /></label>
      </div>
      <label class="slider" id="pic-threshold-row" hidden>Darker than <span id="pic-threshold-out">128</span> is dark <input id="pic-threshold" type="range" min="16" max="240" value="128" /></label>
      <h3>Read it into cards</h3>
      <div class="seg" role="group" aria-label="How to read the picture">
        <button type="button" data-mode="direct" class="on">Directly</button>
        <button type="button" data-mode="damask">As damask</button>
      </div>
      <div class="row opts">
        <label class="field">Head <select id="pic-hooks" aria-label="The head to read it for"></select></label>
        <label class="field" data-only="direct">Picks per row <select id="pic-per"><option value="1">1</option><option value="2">2</option></select></label>
        <label class="field" data-only="damask">Threads per pixel <select id="pic-k"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4" selected>4</option></select></label>
      </div>
      <div class="row opts">
        <label class="check"><input id="pic-inv-cards" type="checkbox" /> Swap holes and blanks</label>
        <label class="check" data-only="direct"><input id="pic-repeat" type="checkbox" /> Repeat across the head</label>
      </div>
      <p id="pic-report" class="pic-report"></p>
      <canvas id="pic-preview" class="pic-preview" aria-label="The cloth these cards will weave, floats marked"></canvas>
      <p class="hint">The cloth these cards weave, first pick at the bottom: warp over weft is dark. A <span class="float-key">red line</span> marks every thread lying loose over more than ${FLOAT_LIMIT} others.</p>
      <button type="button" id="pic-go" class="primary">Put these cards on the loom</button>`;
    /** @template {HTMLElement} T @param {string} id */
    const $ = (id) => /** @type {T} */ (host.querySelector(`#${id}`));
    this.$ = $;
    this.grid = /** @type {HTMLCanvasElement} */ ($("pic-grid"));
    this.preview = /** @type {HTMLCanvasElement} */ ($("pic-preview"));
    const preset = /** @type {HTMLSelectElement} */ ($("pic-preset"));
    const size = /** @type {HTMLSelectElement} */ ($("pic-size"));
    const hooks = /** @type {HTMLSelectElement} */ ($("pic-hooks"));
    preset.add(new Option("— choose —", ""));
    for (const [key, p] of Object.entries(PICTURES)) preset.add(new Option(p.label, key, key === "heart", key === "heart"));
    for (const s of SIZES) size.add(new Option(`${s} × ${s}`, String(s), s === 16, s === 16));
    hooks.add(new Option("Smallest that fits", ""));
    for (const n of HOOK_COUNTS) hooks.add(new Option(`${n} hooks`, String(n)));
    /** @type {ImageData | null} */
    this.image = null;

    preset.addEventListener("change", () => {
      if (!preset.value) return;
      this.setPicture(pictureFromStrings(PICTURES[preset.value].rows));
      this.image = null;
      $("pic-threshold-row").hidden = true;
    });
    size.addEventListener("change", () => {
      const n = Number(size.value);
      this.setPicture(this.image ? this.fromImage(n) : resize(this.picture, n));
    });
    $("pic-clear").addEventListener("click", () => {
      this.image = null;
      $("pic-threshold-row").hidden = true;
      this.setPicture(resize([], Number(size.value)));
    });
    $("pic-invert").addEventListener("click", () => this.setPicture(this.picture.map((r) => r.map((b) => !b))));
    $("pic-file").addEventListener("change", (e) => this.openImage(/** @type {HTMLInputElement} */ (e.target)));
    $("pic-threshold").addEventListener("input", () => {
      $("pic-threshold-out").textContent = /** @type {HTMLInputElement} */ ($("pic-threshold")).value;
      if (this.image) this.setPicture(this.fromImage(this.picture.length));
    });
    for (const b of host.querySelectorAll("[data-mode]")) {
      b.addEventListener("click", () => {
        this.o.mode = /** @type {"direct" | "damask"} */ (/** @type {HTMLElement} */ (b).dataset.mode);
        this.update();
      });
    }
    hooks.addEventListener("change", () => {
      this.o.hooks = hooks.value ? Number(hooks.value) : null;
      this.update();
    });
    $("pic-per").addEventListener("change", () => {
      this.o.picksPerRow = Number(/** @type {HTMLSelectElement} */ ($("pic-per")).value);
      this.update();
    });
    $("pic-k").addEventListener("change", () => {
      this.o.k = Number(/** @type {HTMLSelectElement} */ ($("pic-k")).value);
      this.update();
    });
    $("pic-inv-cards").addEventListener("change", () => {
      this.o.invert = /** @type {HTMLInputElement} */ ($("pic-inv-cards")).checked;
      this.update();
    });
    $("pic-repeat").addEventListener("change", () => {
      this.o.repeat = /** @type {HTMLInputElement} */ ($("pic-repeat")).checked;
      this.update();
    });
    $("pic-go").addEventListener("click", () => this.go());

    // Painting: the first square pressed decides whether the stroke paints dark or light.
    /** @type {boolean | null} */
    let paint = null;
    /** @param {PointerEvent} e */
    const cellAt = (e) => {
      const r = this.grid.getBoundingClientRect();
      const n = this.picture.length;
      const x = Math.floor(((e.clientX - r.left) / r.width) * n);
      const y = Math.floor(((e.clientY - r.top) / r.height) * n);
      return x >= 0 && y >= 0 && x < n && y < n ? { x, y } : null;
    };
    this.grid.addEventListener("pointerdown", (e) => {
      const c = cellAt(e);
      if (!c) return;
      this.grid.setPointerCapture(e.pointerId);
      paint = !this.picture[c.y][c.x];
      this.paintCell(c.x, c.y, paint);
    });
    this.grid.addEventListener("pointermove", (e) => {
      if (paint === null) return;
      const c = cellAt(e);
      if (c) this.paintCell(c.x, c.y, paint);
    });
    const end = () => {
      if (paint !== null) this.update();
      paint = null;
    };
    this.grid.addEventListener("pointerup", end);
    this.grid.addEventListener("pointercancel", end);
    this.update();
  }

  /** @param {Picture} p */
  setPicture(p) {
    this.picture = p;
    /** @type {HTMLSelectElement} */ (this.$("pic-size")).value = String(p.length);
    this.update();
  }

  /** @param {number} x @param {number} y @param {boolean} dark */
  paintCell(x, y, dark) {
    if (this.picture[y][x] === dark) return;
    this.picture = this.picture.map((r, j) => (j === y ? r.map((b, i) => (i === x ? dark : b)) : r));
    /** @type {HTMLSelectElement} */ (this.$("pic-preset")).value = "";
    this.drawGrid();
  }

  /** @param {number} n */
  fromImage(n) {
    const im = /** @type {ImageData} */ (this.image);
    return pictureFromPixels(im.data, im.width, im.height, n, n, Number(/** @type {HTMLInputElement} */ (this.$("pic-threshold")).value));
  }

  /** @param {HTMLInputElement} input */
  openImage(input) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Kept small: a picture is at most 32 squares wide, so 256 px is plenty to average.
      const s = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * s));
      c.height = Math.max(1, Math.round(img.naturalHeight * s));
      const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
      g.drawImage(img, 0, 0, c.width, c.height);
      this.image = g.getImageData(0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      /** @type {HTMLSelectElement} */ (this.$("pic-preset")).value = "";
      this.$("pic-threshold-row").hidden = false;
      this.setPicture(this.fromImage(this.picture.length));
      this.events.say(`Opened ${file.name}: reduced to ${this.picture.length} × ${this.picture.length} squares here in the browser (nothing is uploaded). Move the slider to choose what counts as dark.`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.events.say(`${file.name} could not be read as an image.`, true);
    };
    img.src = url;
  }

  /** Reads the picture again and redraws everything. */
  update() {
    for (const b of document.querySelectorAll("[data-mode]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.mode === this.o.mode);
    for (const el of document.querySelectorAll("[data-only]")) /** @type {HTMLElement} */ (el).hidden = /** @type {HTMLElement} */ (el).dataset.only !== this.o.mode;
    this.planned = planCards(this.picture, this.o);
    this.drawGrid();
    this.drawPreview();
  }

  drawGrid() {
    const g = /** @type {CanvasRenderingContext2D} */ (this.grid.getContext("2d"));
    const n = this.picture.length;
    const c = this.grid.width / n;
    g.fillStyle = "#fbf7ee";
    g.fillRect(0, 0, this.grid.width, this.grid.height);
    g.fillStyle = "#2b1f0c";
    this.picture.forEach((row, y) => row.forEach((d, x) => d && g.fillRect(x * c, y * c, c, c)));
    g.strokeStyle = "rgba(120, 100, 70, 0.35)";
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = Math.round(i * c) + 0.5;
      g.moveTo(p, 0);
      g.lineTo(p, this.grid.height);
      g.moveTo(0, p);
      g.lineTo(this.grid.width, p);
    }
    g.stroke();
  }

  drawPreview() {
    const report = this.$("pic-report");
    const go = /** @type {HTMLButtonElement} */ (this.$("pic-go"));
    const p = /** @type {Planned} */ (this.planned);
    const g = /** @type {CanvasRenderingContext2D} */ (this.preview.getContext("2d"));
    if (!p.read.ok) {
      report.textContent = p.text;
      report.classList.add("warn");
      go.disabled = true;
      go.title = p.text;
      this.preview.width = 0;
      this.preview.height = 0;
      return;
    }
    go.disabled = false;
    go.title = "";
    report.classList.remove("warn");
    const { cards, width } = p.read.reading;
    const cloth = cards.map((c) => c.slice(0, width));
    const f = findFloats(cloth);
    const over = f.floats.length;
    report.textContent = `${p.text} Longest float: ${f.longestWeft} threads of weft, ${f.longestWarp} of warp. ${over === 0 ? `None is longer than ${FLOAT_LIMIT}: the cloth holds together.` : `${over} float${over === 1 ? " is" : "s are"} longer than ${FLOAT_LIMIT} (marked): there the cloth would be loose.`}`;
    const cell = Math.max(2, Math.min(10, Math.floor(320 / Math.max(width, cloth.length))));
    this.preview.width = width * cell;
    this.preview.height = cloth.length * cell;
    const H = cloth.length;
    cloth.forEach((row, pk) =>
      row.forEach((up, e) => {
        g.fillStyle = up ? "#5b3f8c" : "#efe3c2";
        g.fillRect(e * cell, (H - 1 - pk) * cell, cell, cell);
      }),
    );
    g.strokeStyle = "#d62d20";
    g.lineWidth = Math.max(1.5, cell * 0.35);
    g.lineCap = "round";
    g.beginPath();
    for (const fl of f.floats) {
      if (fl.kind === "weft") {
        const y = (H - 1 - fl.pick) * cell + cell / 2;
        g.moveTo(fl.end * cell + cell * 0.2, y);
        g.lineTo((fl.end + fl.length) * cell - cell * 0.2, y);
      } else {
        const x = fl.end * cell + cell / 2;
        g.moveTo(x, (H - fl.pick) * cell - cell * 0.2);
        g.lineTo(x, (H - fl.pick - fl.length) * cell + cell * 0.2);
      }
    }
    g.stroke();
  }

  /** Puts the cards on the loom. */
  go() {
    const p = this.planned;
    if (!p || !p.read.ok) return;
    const { cards } = p.read.reading;
    this.events.onCards({ hooks: p.hooks, cards: cards.map((c) => [...c]), loop: false }, `The picture is on the loom: ${p.text} The first card is the picture's bottom row, so the cloth grows the right way up. Press Play.`);
  }
}

/**
 * A picture resized to n × n by nearest square (an empty one when there is none).
 * @param {Picture} p
 * @param {number} n
 * @returns {Picture}
 */
function resize(p, n) {
  const m = p.length;
  return [...Array(n).keys()].map((y) => [...Array(n).keys()].map((x) => (m ? p[Math.floor((y * m) / n)][Math.floor((x * m) / n)] : false)));
}
