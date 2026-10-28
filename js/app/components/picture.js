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
import { el, icon, setTip, showMenu, showPopover } from "../../ui/components.js";
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
  let imageName = "";
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
    // the keyboard's square, while the paper has the keyboard
    if (document.activeElement === grid && grid.matches(":focus-visible")) {
      const k = Math.min(cursor.x, n - 1);
      const m = Math.min(cursor.y, n - 1);
      g.strokeStyle = token("--md-primary", "#9ccaff");
      g.lineWidth = 2;
      g.strokeRect(k * c + 1, m * c + 1, c - 2, c - 2);
    }
  };
  /** The square the arrow keys are on. */
  let cursor = { x: 0, y: 0 };

  /** The square under a pointer, or null. @param {PointerEvent} e */
  const squareAt = (e) => {
    const r = grid.getBoundingClientRect();
    const n = spec().rows.length;
    const x = Math.floor(((e.clientX - r.left) / r.width) * n);
    const y = Math.floor(((e.clientY - r.top) / r.height) * n);
    return x >= 0 && y >= 0 && x < n && y < n ? { x, y } : null;
  };

  /** Where the keyboard is on the paper, said to a screen reader. @type {HTMLElement} */
  let gridSaid;
  /** What the note says, written again in another language. */
  let note = () => "";
  /** @param {HTMLInputElement} input */
  const openImage = (input) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // fitted inside a square, light around it, so that an image that is not square keeps its
      // shape on the square paper (an SVG with no size of its own is drawn at the square's)
      const iw = img.naturalWidth || IMAGE_PX;
      const ih = img.naturalHeight || IMAGE_PX;
      const side = Math.min(IMAGE_PX, Math.max(iw, ih));
      const k = side / Math.max(iw, ih);
      const c = document.createElement("canvas");
      c.width = side;
      c.height = side;
      const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, side, side);
      const w = Math.max(1, Math.round(iw * k));
      const h = Math.max(1, Math.round(ih * k));
      g.drawImage(img, Math.floor((side - w) / 2), Math.floor((side - h) / 2), w, h);
      image = g.getImageData(0, 0, side, side);
      imageName = file.name;
      URL.revokeObjectURL(url);
      ui.threshold.hidden = false;
      fromImage();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      note = () => t("pic.imageFailed", { file: file.name });
      ui.note.textContent = note();
    };
    img.src = url;
  };
  /** The picture from the image opened, at the paper's size and the threshold chosen. */
  const fromImage = () => {
    if (!image) return;
    const n = spec().rows.length;
    const level = Number(/** @type {HTMLInputElement} */ (ui.level).value);
    change({ rows: pictureFromPixels(image.data, image.width, image.height, n, n, level) });
    note = () => t("pic.imageOpened", { file: imageName, n });
    ui.note.textContent = note();
  };

  /**
   * Before the file dialog, what an image becomes: the formats, the paper's size it is shrunk
   * to, and how its squares are made dark or light; then Choose an image… opens the dialog.
   */
  const aboutImage = () => {
    const n = spec().rows.length;
    const choose = el("button", { type: "button", class: "btn filled" }, [icon("folder_open"), el("span", { text: t("pic.open.choose") })]);
    choose.addEventListener("click", () => {
      document.querySelector(".popover")?.dispatchEvent(new Event("shut"));
      /** @type {HTMLInputElement} */ (ui.file).click();
    });
    showPopover(ui.open, "image", t("pic.open.title"), [
      el("h3", { class: "popover-title", text: t("pic.open.title") }),
      el("p", { text: t("pic.open.formats") }),
      el("p", { text: t("pic.open.size", { n }) }),
      el("p", { text: t("pic.open.best") }),
      el("p", { class: "muted", text: t("pic.open.private") }),
      el("div", { class: "popover-foot" }, [choose]),
    ], "image-pop");
  };

  return {
    name: "comp.picture",
    mount(h) {
      // painted by the pointer, or by the keyboard: the arrows move a square, Space or Enter paints it
      grid = el("canvas", { class: "pic-grid", role: "application", tabindex: "0" });
      const said = el("span", { class: "visually-hidden", "aria-live": "polite" });
      const sayAt = () => {
        const rows = spec().rows;
        said.textContent = t(rows[cursor.y]?.[cursor.x] ? "pic.square.dark" : "pic.square.light", { row: cursor.y + 1, col: cursor.x + 1 });
      };
      grid.addEventListener("focus", () => (draw(spec().rows), sayAt()));
      grid.addEventListener("blur", () => draw(spec().rows));
      grid.addEventListener("keydown", (e) => {
        const n = spec().rows.length;
        const step = /** @type {Record<string, [number, number]>} */ ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] })[e.key];
        if (step) cursor = { x: Math.max(0, Math.min(n - 1, cursor.x + step[0])), y: Math.max(0, Math.min(n - 1, cursor.y + step[1])) };
        else if (e.key === " " || e.key === "Enter") {
          const rows = spec().rows.map((r) => [...r]);
          rows[cursor.y][cursor.x] = !rows[cursor.y][cursor.x];
          change({ rows });
        } else return;
        e.preventDefault();
        draw(spec().rows);
        sayAt();
      });
      gridSaid = said;
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
              note = () => "";
              ui.note.textContent = "";
              change({ rows: presetPicture(name) });
            },
          })),
        ),
      );
      const file = el("input", { type: "file", accept: "image/*", class: "pic-file", hidden: true });
      file.addEventListener("change", () => openImage(file));
      const open = el("button", { type: "button", class: "btn icon-only", "aria-haspopup": "dialog" }, [icon("folder_open")]);
      open.addEventListener("click", aboutImage);
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
      const threshold = el("div", { class: "pic-threshold", hidden: true }, [
        el("label", { class: "pic-field" }, [el("span", { class: "pic-label", "data-key": "pic.threshold" }), level]),
        el("p", { class: "pic-hint", "data-key": "pic.threshold.hint" }),
      ]);

      const direct = el("button", { type: "button", "data-mode": "direct" });
      const damask = el("button", { type: "button", "data-mode": "damask" });
      for (const b of [direct, damask]) b.addEventListener("click", () => change({ mode: /** @type {"direct" | "damask"} */ (b.dataset.mode) }));
      const per = el("select");
      for (const k of PICKS_PER_ROW) per.add(new Option(String(k), String(k)));
      per.addEventListener("change", () => change({ perRow: Number(per.value) }));
      const block = el("select");
      for (const k of DAMASK_BLOCKS) block.add(new Option("", String(k)));
      block.addEventListener("change", () => change({ k: Number(block.value) }));

      Object.assign(ui, { file, size, ready, open, invert, clear, level, threshold, direct, damask, per, block, note: el("p", { class: "pic-note", "aria-live": "polite" }) });
      ui.perField = field("pic.perRow", per);
      ui.blockField = field("pic.block", block);
      // how it is read first, above the paper, where a short panel still shows it
      box = el("div", { class: "pic-box" }, [
        el("div", { class: "pic-reading" }, [el("span", { class: "pic-label", "data-key": "pic.reading.label" }), el("div", { class: "seg", role: "group" }, [direct, damask]), ui.perField, ui.blockField]),
        el("div", { class: "pic-tools" }, [field("pic.size", size), el("span", { class: "spacer" }), ready, open, invert, clear, file]),
        // what became of an image opened, and its level, above the paper, where they are seen
        ui.note,
        threshold,
        grid,
        gridSaid,
      ]);
      h.appendChild(box);
    },
    watch(s) {
      return [s.pictures[o.loom], s.locale];
    },
    update(s) {
      const p = s.pictures[o.loom];
      ui.note.textContent = note();
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
