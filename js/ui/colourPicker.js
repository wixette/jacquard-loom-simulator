// A colour picker inside the page (docs/ui-design.md, P10), in place of the browser's: the
// browser's opens a popup of its own (on a Mac the system's Colors window), which the page
// cannot close or keep in its own popover, so a click beside it reopens it rather than closing
// it. This one lives inside its panel: a square for saturation and brightness, a hue slider and
// a hex field, worked by pointer or keyboard. The colour maths is in js/ui/colour.js.

import { hexToHsv, hsvToHex, readHex } from "./colour.js";
import { el } from "./components.js";

const clamp = (/** @type {number} */ x) => Math.max(0, Math.min(1, x));

/**
 * @typedef {object} ColourPicker
 * @property {HTMLElement} element
 * @property {(hex: string) => void} set show a colour (not reported back)
 */

/**
 * @param {object} o
 * @param {string} o.value "#rrggbb"
 * @param {(hex: string) => void} o.onInput called as the colour changes
 * @param {{ area: string; hue: string; hex: string; areaValue: (s: number, v: number) => string }} o.names for screen readers
 * @returns {ColourPicker}
 */
export function colourPicker({ value, onInput, names }) {
  let c = hexToHsv(value);
  const thumb = el("span", { class: "cp-thumb" });
  const area = el("div", { class: "cp-area", role: "slider", tabindex: "0", "aria-label": names.area }, [thumb]);
  const hue = el("input", { type: "range", class: "cp-hue", min: "0", max: "359", step: "1", "aria-label": names.hue });
  const hex = el("input", { type: "text", class: "cp-hex", id: "colour-hex", spellcheck: "false", autocomplete: "off", maxlength: "7", "aria-label": names.hex });
  const swatch = el("span", { class: "cp-swatch", "aria-hidden": "true" });

  /** Draw the controls from c; typing keeps its own text while it is being typed. @param {boolean} [typing] */
  const draw = (typing = false) => {
    const now = hsvToHex(c);
    area.style.setProperty("--hue", String(c.h));
    thumb.style.left = `${c.s * 100}%`;
    thumb.style.top = `${(1 - c.v) * 100}%`;
    thumb.style.background = now;
    area.setAttribute("aria-valuetext", names.areaValue(Math.round(c.s * 100), Math.round(c.v * 100)));
    hue.value = String(Math.round(c.h));
    swatch.style.background = now;
    if (!typing) hex.value = now.toUpperCase();
  };
  const changed = () => {
    draw();
    onInput(hsvToHex(c));
  };

  /** @param {PointerEvent} e */
  const at = (e) => {
    const r = area.getBoundingClientRect();
    c = { ...c, s: clamp((e.clientX - r.left) / r.width), v: 1 - clamp((e.clientY - r.top) / r.height) };
    changed();
  };
  area.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    area.focus();
    try {
      area.setPointerCapture(e.pointerId);
    } catch {
      // the drag works without capture
    }
    at(e);
    const move = (/** @type {PointerEvent} */ m) => at(m);
    const up = () => {
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerup", up);
      area.removeEventListener("pointercancel", up);
    };
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerup", up);
    area.addEventListener("pointercancel", up);
  });
  area.addEventListener("keydown", (e) => {
    const d = e.shiftKey ? 0.1 : 0.01;
    const moves = /** @type {Record<string, [number, number]>} */ ({ ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] });
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    c = { ...c, s: clamp(c.s + m[0]), v: clamp(c.v + m[1]) };
    changed();
  });
  hue.addEventListener("input", () => {
    c = { ...c, h: Number(hue.value) };
    changed();
  });
  hex.addEventListener("input", () => {
    const v = readHex(hex.value);
    if (!v) return;
    c = hexToHsv(v);
    draw(true);
    onInput(v);
  });
  hex.addEventListener("change", () => draw());
  hex.addEventListener("keydown", (e) => {
    if (e.key === "Enter") draw();
  });
  draw();
  return {
    element: el("div", { class: "cp" }, [area, el("div", { class: "cp-row" }, [swatch, hue]), el("label", { class: "cp-hex-row" }, [el("span", { text: names.hex }), hex])]),
    set(v) {
      // the same colour again leaves the hue as the learner set it (grey has no hue of its own)
      if (v === hsvToHex(c)) return;
      c = hexToHsv(v);
      draw();
    },
  };
}
