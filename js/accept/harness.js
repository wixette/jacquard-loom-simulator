// Helpers for acceptance checks: the result record, and 2D distances for the section's
// shapes. No DOM, so they run both in Node (node --test) and in the page (?selftest).
// Lengths are in millimetres, as in the layout.

/** @import { Pt, Rect } from "../view2d/layout.js" */

/**
 * @typedef {object} CheckResult
 * @property {string} id
 * @property {string} title
 * @property {boolean} passed
 * @property {string} detail
 */

/**
 * @param {string} id
 * @param {string} title
 * @param {boolean} passed
 * @param {string} detail
 * @returns {CheckResult}
 */
export function result(id, title, passed, detail) {
  return { id, title, passed, detail };
}

/** @param {number} x */
export const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : String(x));

/**
 * Distance from point p to segment ab.
 * @param {Pt} p
 * @param {Pt} a
 * @param {Pt} b
 * @returns {number}
 */
export function pointSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/**
 * @param {Pt} a
 * @param {Pt} b
 * @param {Pt} c
 * @returns {number}
 */
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

/**
 * Distance between segments ab and cd (0 when they cross).
 * @param {Pt} a
 * @param {Pt} b
 * @param {Pt} c
 * @param {Pt} d
 * @returns {number}
 */
export function segmentSegment(a, b, c, d) {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(pointSegment(a, c, d), pointSegment(b, c, d), pointSegment(c, a, b), pointSegment(d, a, b));
}

/**
 * The corners of an axis-aligned rectangle, counter-clockwise.
 * @param {Rect} r
 * @returns {Pt[]}
 */
export const corners = (r) => [
  [r.x, r.y],
  [r.x + r.w, r.y],
  [r.x + r.w, r.y + r.h],
  [r.x, r.y + r.h],
];

/**
 * Whether p lies inside the convex polygon (counter-clockwise corners).
 * @param {Pt} p
 * @param {Pt[]} poly
 * @returns {boolean}
 */
export function insideConvex(p, poly) {
  for (let i = 0; i < poly.length; i++) if (cross(poly[i], poly[(i + 1) % poly.length], p) < 0) return false;
  return true;
}

/**
 * Distance between a polyline and a convex polygon (0 when they touch or overlap).
 * @param {Pt[]} line
 * @param {Pt[]} poly counter-clockwise
 * @returns {number}
 */
export function polylinePolygon(line, poly) {
  if (line.some((p) => insideConvex(p, poly))) return 0;
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    for (let j = 0; j < poly.length; j++) best = Math.min(best, segmentSegment(line[i], line[i + 1], poly[j], poly[(j + 1) % poly.length]));
  }
  return best;
}
