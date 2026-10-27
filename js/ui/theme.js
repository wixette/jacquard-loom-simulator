// The theme's tokens (css/theme.css) for what CSS cannot colour: the canvas views and the 3D
// scene. Each is read from the page's stylesheet, so the theme lives in one place; outside a
// page (Node, the tests) the fallback given is used.

/** @type {Map<string, string>} */
const cache = new Map();

/**
 * A token's value, such as token("--md-primary") → "#9ecaff".
 * @param {string} name the custom property, with its two dashes
 * @param {string} [fallback] used where there is no page, or the page lacks the token
 * @returns {string}
 */
export function token(name, fallback = "#ff00ff") {
  let v = cache.get(name);
  if (v === undefined) {
    v = typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) cache.set(name, v);
  }
  return v || fallback;
}
