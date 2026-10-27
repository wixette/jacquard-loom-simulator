// The picture tool's panel (design/m8-notes.md; as the prototype's picture helper, design/
// m2-notes.md): a square picture on point paper, painted by pointer (the first square pressed
// decides whether a stroke paints dark or light), drawn at 8 to 32 squares, taken from the
// ready-made pictures or opened from an image (reduced and thresholded here, in the browser;
// never uploaded), and how it is read: one square per thread, or damask. Every change weaves
// the picture again on its loom (js/app/looms.js, setPicture), whose status line says what the
// reading made and whether the cloth holds together.

import { t, tn } from "../../l10n/l10n.js";
import { pictureFromPixels } from "../../sim/design.js";
import { blankPicture, DAMASK_BLOCKS, PICKS_PER_ROW, PICTURE_NAMES, PICTURE_SIZES, pictureNeeds, presetPicture, resizePicture } from "../../sim/picture.js";
import { el, icon, setTip, showMenu } from "../../ui/components.js";
import { token } from "../../ui/theme.js";
import { setPicture } from "../looms.js";
/** @import { AppStore, PictureLoom } from "../looms.js" */
/** @import { Component } from "./component.js" */
/** @import { Picture } from "../../sim/design.js" */
/** @import { PictureSpec } from "../../sim/picture.js" */

/** An image opened, kept small: a picture is at most 32 squares a side, so 256 px is plenty. */
const IMAGE_PX = 256;

/**
 * @param {AppStore} store
 * @param {{ loom: PictureLoom }} o the loom the picture is woven on
 * @returns {Component}
 */
export function picturePanel(store, o) {
  /** @type {HTMLElement} */
  let box;
  /** @type {HTMLCanvasElement} */
  let grid;
  /** @type {ImageData | null} the image opened, for the threshold to read again */
  let image = null;
  /** The picture while a stroke paints it: drawn at once, woven when the stroke ends. @type {Picture | null} */
  let stroke = null;
  const spec = () => store.state.pictures[o.loom];
  /** @param {Partial<PictureSpec>} patch */
  const change = (patch) => setPicture(store, patch, o.loom);

  /** @type {Record<string, HTMLElement>} */
  const ui = {};
  /** A labelled control in the panel's form. @param {string} key @param {HTMLElement} control */
  const field = (key, control) => {
    const name = el("span", { class: "pic-label" });
    name.dataset.key = key;
    return el("label", { class: "pic-field" }, [name, control]);
  };

  /** The picture on point paper, as the designers who drew for the cards used: light squares, dark ink. @param {Picture} p */
  const draw = (p) => {
    const n = p.length;
    const px = Math.max(160, Math.floor(grid.clientWidth || 280));
    const dpr = window.devicePixelRatio || 1;
    grid.width = Math.round(px * dpr);
    grid.height = Math.round(px * dpr);
    const g = /** @type {CanvasRenderingContext2D} */ (grid.getContext("2d"));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = px / n;
    g.fillStyle = token("--blank", "#efe4c8");
    g.fillRect(0, 0, px, px);
    g.fillStyle = token("--paste-ink", "#3b2b12");
    p.forEach((row, y) => row.forEach((d, x) => d && g.fillRect(x * c, y * c, c, c)));
    g.strokeStyle = token("--paste-edge", "#8f7444");
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      // every eighth line darker: a card's cross-row, eight hooks
      if (i % 8 === 0) continue;
      const q = Math.round(i * c) + 0.5;
      g.moveTo(q, 0);
      g.lineTo(q, px);
      g.moveTo(0, q);
      g.lineTo(px, q);
    }
    g.globalAlpha = 0.4;
    g.stroke();
    g.globalAlpha = 0.9;
    g.beginPath();
    for (let i = 0; i <= n; i += 8) {
      const q = Math.min(px - 0.5, Math.round(i * c) + 0.5);
      g.moveTo(q, 0);
      g.lineTo(q, px);
      g.moveTo(0, q);
      g.lineTo(px, q);
    }
    g.stroke();
    g.globalAlpha = 1;
  };

  /** The square under a pointer, or null. @param {PointerEvent} e */
  const squareAt = (e) => {
    const r = grid.getBoundingClientRect();
    const n = spec().rows.length;
    const x = Math.floor(((e.clientX - r.left) / r.width) * n);
    const y = Math.floor(((e.clientY - r.top) / r.height) * n);
    return x >= 0 && y >= 0 && x < n && y < n ? { x, y } : null;
  };

  /** @param {HTMLInputElement} input */
  const openImage = (input) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, IMAGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
      g.drawImage(img, 0, 0, c.width, c.height);
      image = g.getImageData(0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ui.threshold.hidden = false;
      fromImage();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      ui.note.textContent = t("pic.imageFailed", { file: file.name });
    };
    img.src = url;
  };
  /** The picture from the image opened, at the paper's size and the threshold chosen. */
  const fromImage = () => {
    if (!image) return;
    const n = spec().rows.length;
    const level = Number(/** @type {HTMLInputElement} */ (ui.level).value);
    change({ rows: pictureFromPixels(image.data, image.width, image.height, n, n, level) });
    ui.note.textContent = t("pic.imageOpened", { n });
  };

  return {
    name: "comp.picture",
    mount(h) {
      grid = el("canvas", { class: "pic-grid", role: "img" });
      // Painting: the first square pressed decides whether the stroke paints dark or light.
      /** @type {boolean | null} */
      let paint = null;
      grid.addEventListener("pointerdown", (e) => {
        const c = squareAt(e);
        if (!c || e.button !== 0) return;
        try {
          grid.setPointerCapture(e.pointerId);
        } catch {
          // painting works without capture
        }
        stroke = spec().rows.map((r) => [...r]);
        paint = !stroke[c.y][c.x];
        stroke[c.y][c.x] = paint;
        draw(stroke);
      });
      grid.addEventListener("pointermove", (e) => {
        if (paint === null || !stroke) return;
        const c = squareAt(e);
        if (!c || stroke[c.y][c.x] === paint) return;
        stroke[c.y][c.x] = paint;
        draw(stroke);
      });
      const end = () => {
        if (paint !== null && stroke) change({ rows: stroke });
        paint = null;
        stroke = null;
      };
      grid.addEventListener("pointerup", end);
      grid.addEventListener("pointercancel", end);

      const size = el("select", { class: "pic-size" });
      for (const n of PICTURE_SIZES) size.add(new Option("", String(n)));
      size.addEventListener("change", () => change({ rows: resizePicture(spec().rows, Number(size.value)) }));
      const ready = el("button", { type: "button", class: "btn icon-only", "aria-haspopup": "menu" }, [icon("menu_book")]);
      ready.addEventListener("click", () =>
        showMenu(
          ready,
          PICTURE_NAMES.map((name) => ({
            label: t(`pic.${name}`),
            run: () => {
              image = null;
              ui.threshold.hidden = true;
              ui.note.textContent = "";
              change({ rows: presetPicture(name) });
            },
          })),
        ),
      );
      const file = el("input", { type: "file", accept: "image/*", class: "pic-file", hidden: true });
      file.addEventListener("change", () => openImage(file));
      const open = el("button", { type: "button", class: "btn icon-only" }, [icon("image")]);
      open.addEventListener("click", () => file.click());
      const invert = el("button", { type: "button", class: "btn icon-only" }, [icon("invert_colors")]);
      invert.addEventListener("click", () => change({ rows: spec().rows.map((r) => r.map((d) => !d)) }));
      const clear = el("button", { type: "button", class: "btn icon-only" }, [icon("delete")]);
      clear.addEventListener("click", () => {
        image = null;
        ui.threshold.hidden = true;
        change({ rows: blankPicture(spec().rows.length) });
      });
      const level = el("input", { type: "range", min: "16", max: "240", step: "1", value: "128" });
      level.addEventListener("input", fromImage);
      const threshold = el("label", { class: "pic-field pic-threshold", hidden: true }, [el("span", { class: "pic-label", "data-key": "pic.threshold" }), level]);

      const direct = el("button", { type: "button", "data-mode": "direct" });
      const damask = el("button", { type: "button", "data-mode": "damask" });
      for (const b of [direct, damask]) b.addEventListener("click", () => change({ mode: /** @type {"direct" | "damask"} */ (b.dataset.mode) }));
      const per = el("select");
      for (const k of PICKS_PER_ROW) per.add(new Option(String(k), String(k)));
      per.addEventListener("change", () => change({ perRow: Number(per.value) }));
      const block = el("select");
      for (const k of DAMASK_BLOCKS) block.add(new Option("", String(k)));
      block.addEventListener("change", () => change({ k: Number(block.value) }));

      Object.assign(ui, { size, ready, open, invert, clear, level, threshold, direct, damask, per, block, note: el("p", { class: "pic-note", "aria-live": "polite" }) });
      ui.perField = field("pic.perRow", per);
      ui.blockField = field("pic.block", block);
      // how it is read first, above the paper, where a short panel still shows it
      box = el("div", { class: "pic-box" }, [
        el("div", { class: "pic-reading" }, [el("span", { class: "pic-label", "data-key": "pic.reading.label" }), el("div", { class: "seg", role: "group" }, [direct, damask]), ui.perField, ui.blockField]),
        el("div", { class: "pic-tools" }, [field("pic.size", size), el("span", { class: "spacer" }), ready, open, invert, clear, file]),
        grid,
        threshold,
        ui.note,
      ]);
      h.appendChild(box);
    },
    watch(s) {
      return [s.pictures[o.loom], s.locale];
    },
    update(s) {
      const p = s.pictures[o.loom];
      if (!stroke) draw(p.rows);
      const n = p.rows.length;
      /** @type {HTMLSelectElement} */ (ui.size).value = String(n);
      for (const opt of /** @type {HTMLSelectElement} */ (ui.size).options) opt.text = t("pic.sizeOption", { n: Number(opt.value) });
      for (const opt of /** @type {HTMLSelectElement} */ (ui.block).options) {
        const k = Number(opt.value);
        opt.text = t("pic.blockOption", { k });
        // a block that would need more hooks than the largest head is offered, greyed
        opt.disabled = pictureNeeds({ ...p, mode: "damask", k }).hooks === null;
      }
      /** @type {HTMLSelectElement} */ (ui.block).value = String(p.k);
      /** @type {HTMLSelectElement} */ (ui.per).value = String(p.perRow);
      ui.direct.setAttribute("aria-pressed", String(p.mode === "direct"));
      ui.damask.setAttribute("aria-pressed", String(p.mode === "damask"));
      ui.direct.textContent = t("pic.direct");
      ui.damask.textContent = t("pic.damask");
      ui.perField.hidden = p.mode !== "direct";
      ui.blockField.hidden = p.mode !== "damask";
      for (const e of /** @type {NodeListOf<HTMLElement>} */ (box.querySelectorAll("[data-key]"))) e.textContent = t(/** @type {string} */ (e.dataset.key));
      setTip(ui.ready, t("pic.ready"));
      setTip(ui.open, t("pic.open"));
      setTip(ui.invert, t("pic.invert"));
      setTip(ui.clear, t("pic.clear"));
      grid.setAttribute("aria-label", tn("pic.grid", n, { n }));
    },
    unmount() {
      box.remove();
    },
  };
}
