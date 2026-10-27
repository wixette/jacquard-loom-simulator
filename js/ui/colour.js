// Colours as the colour picker (js/ui/colourPicker.js) works them: hex, and hue, saturation
// and value. Pure: no DOM, so the tests run it.

/**
 * A colour as hue (0–360), saturation and value (0–1).
 * @typedef {{ h: number; s: number; v: number }} HSV
 */

/** @param {string} hex "#rrggbb" @returns {HSV} */
export function hexToHsv(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

/** @param {HSV} c @returns {string} "#rrggbb" */
export function hsvToHex({ h, s, v }) {
  const f = (/** @type {number} */ k) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** A hex colour as typed: "#" optional, 6 digits (or 3, doubled), any case. @param {string} text @returns {string | null} */
export function readHex(text) {
  const t = text.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(t)) return `#${[...t.toLowerCase()].map((c) => c + c).join("")}`;
  return null;
}
