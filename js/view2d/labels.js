// Labels on the 2D drawings, sized in screen pixels and placed clear of the drawing. The
// drawings are in their own units (mm for the section, drawing units for the front and side
// views) and scaled to fit their pane, so a label sized in those units came out tiny in a
// wide view and huge in a close-up. Here a label is always about LABEL_PX on screen; it is
// drawn only when the part it names is in view; it goes in the first of a few spots beside
// its part that is inside the visible area and clear of the drawing's shapes and of the
// other labels; and if none is, it is left out rather than laid over something.

/** @typedef {{ x: number, y: number, w: number, h: number }} Box lower-left corner (y up), width, height */
/** @typedef {[number, number]} Pt */
/** A line of the drawing, drawn r thick either side of a-b. @typedef {{ a: Pt, b: Pt, r: number }} Seg */
/** What labels must keep off. @typedef {{ boxes: Box[], segs: Seg[] }} Obstacles */
/** A spot for a label: the baseline's start, middle or end at (x, y). @typedef {[number, number, ("start" | "middle" | "end")?]} Spot */

/** Labels' size on screen, px. */
export const LABEL_PX = 12;
/** Small numbers (hooks, cards, columns), px. */
export const NUMBER_PX = 11;
/** An estimate of a character's width, as a share of the font size (system sans-serif). */
const CHAR_WIDTH = 0.58;

/**
 * How a drawing in its own units (y up) lands on screen: px per unit, and the area of the
 * drawing actually visible (the view, widened to the pane's shape, as SVG's "meet" does).
 * @typedef {object} ScreenFrame
 * @property {number} scale px per drawing unit
 * @property {Box} visible in drawing units
 */

/**
 * @param {Box} view the viewBox, in drawing units (y up)
 * @param {number} widthPx the drawing's width on screen
 * @param {number} heightPx its height on screen
 * @returns {ScreenFrame}
 */
export function screenFrame(view, widthPx, heightPx) {
  if (!(widthPx > 0 && heightPx > 0)) return { scale: 1, visible: view };
  const scale = Math.min(widthPx / view.w, heightPx / view.h);
  const w = widthPx / scale;
  const h = heightPx / scale;
  return { scale, visible: { x: view.x - (w - view.w) / 2, y: view.y - (h - view.h) / 2, w, h } };
}

/** @returns {Obstacles} */
export const noObstacles = () => ({ boxes: [], segs: [] });

/**
 * The box around some points, grown by m.
 * @param {Pt[]} pts
 * @param {number} [m]
 * @returns {Box}
 */
export function boxAround(pts, m = 0) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs) - m;
  const y = Math.min(...ys) - m;
  return { x, y, w: Math.max(...xs) + m - x, h: Math.max(...ys) + m - y };
}

/**
 * The segments of a polyline, r thick.
 * @param {Pt[]} pts
 * @param {number} r
 * @returns {Seg[]}
 */
export const segsOf = (pts, r) => pts.slice(1).map((b, i) => ({ a: pts[i], b, r }));

/**
 * @param {Box} a
 * @param {Box} b
 */
const boxesMeet = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Whether segment s comes within its thickness of box b.
 * @param {Seg} s
 * @param {Box} b
 */
function segMeetsBox(s, b) {
  const g = { x: b.x - s.r, y: b.y - s.r, w: b.w + 2 * s.r, h: b.h + 2 * s.r };
  // Clip the segment to the grown box (Liang-Barsky).
  let t0 = 0;
  let t1 = 1;
  const dx = s.b[0] - s.a[0];
  const dy = s.b[1] - s.a[1];
  const edges = /** @type {[number, number][]} */ ([
    [-dx, s.a[0] - g.x],
    [dx, g.x + g.w - s.a[0]],
    [-dy, s.a[1] - g.y],
    [dy, g.y + g.h - s.a[1]],
  ]);
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/**
 * Whether two thick segments come within their thicknesses of each other.
 * @param {Seg} p
 * @param {Seg} q
 */
function segsCross(p, q) {
  const box = boxAround([p.a, p.b], p.r);
  if (!segMeetsBox({ a: q.a, b: q.b, r: q.r }, box)) return false;
  // Sample along p: close enough for thin leaders.
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const c = /** @type {Pt} */ ([p.a[0] + (p.b[0] - p.a[0]) * t, p.a[1] + (p.b[1] - p.a[1]) * t]);
    if (segMeetsBox(q, { x: c[0] - p.r, y: c[1] - p.r, w: 2 * p.r, h: 2 * p.r })) return true;
  }
  return false;
}

/**
 * @param {number} v
 * @returns {string}
 */
const f = (v) => (Math.round(v * 100) / 100).toString();

export class LabelPlacer {
  /**
   * @param {ScreenFrame} frame
   * @param {Obstacles} [obstacles] the drawing's shapes, which labels must keep off
   * @param {number} [px] the labels' size on screen
   */
  constructor(frame, obstacles = noObstacles(), px = LABEL_PX) {
    this.frame = frame;
    this.obstacles = obstacles;
    /** The font size in drawing units. */
    this.size = px / frame.scale;
    /** @type {Box[]} */
    this.placed = [];
    /** Labels left out, with why (for checking a drawing's labels by hand). @type {string[]} */
    this.left = [];
  }

  /**
   * Whether a label's box is clear of the drawing and of the labels placed so far.
   * @param {Box} box
   */
  clear(box) {
    return this.blocker(box) === null;
  }

  /**
   * What a label's box would lie on, or null when it is clear.
   * @param {Box} box
   * @returns {string | null}
   */
  blocker(box) {
    const pad = this.size * 0.15;
    const b = { x: box.x - pad, y: box.y - pad, w: box.w + 2 * pad, h: box.h + 2 * pad };
    const p = this.placed.findIndex((q) => boxesMeet(q, b));
    if (p >= 0) return `label ${p}`;
    const o = this.obstacles.boxes.findIndex((q) => boxesMeet(q, b));
    if (o >= 0) return `box ${o}`;
    const g = this.obstacles.segs.findIndex((q) => segMeetsBox(q, b));
    return g >= 0 ? `line ${g}` : null;
  }

  /**
   * A label in the first of the spots that is in view and clear (each also tried a line up
   * and a line down). Returns its SVG text, or "" when there is no room for it.
   * @param {string} text
   * @param {Spot[]} spots in drawing units, y up; a spot out of view is skipped
   * @param {string} [cls]
   * @returns {string}
   */
  placeAt(text, spots, cls = "lbl") {
    const one = this.tryLines([text], spots, cls);
    if (one) return one;
    // Too long for any spot: try it on two lines, split at the space nearest its middle.
    const spaces = [...text.matchAll(/ /g)].map((m) => /** @type {number} */ (m.index));
    if (spaces.length === 0) return "";
    const cut = spaces.reduce((a, b) => (Math.abs(b - text.length / 2) < Math.abs(a - text.length / 2) ? b : a));
    const two = this.tryLines([text.slice(0, cut), text.slice(cut + 1)], spots, cls);
    if (two) this.left.pop();
    return two;
  }

  /**
   * @param {string[]} lines
   * @param {Spot[]} spots
   * @param {string} cls
   * @returns {string}
   */
  tryLines(lines, spots, cls) {
    const text = lines.join(" ");
    const v = this.frame.visible;
    const s = this.size;
    const w = Math.max(...lines.map((l) => l.length)) * CHAR_WIDTH * s;
    const extra = (lines.length - 1) * 1.15 * s; // the lines after the first
    /** @type {string[]} */
    const why = [];
    // Several lines may grow down from the spot (the first line's baseline on it) or up (the last's).
    const grows = lines.length > 1 ? [0, extra] : [0];
    for (const dy of [0, 0.6 * s, -0.6 * s, 1.25 * s, -1.25 * s]) {
      for (const [x, y0spot, anchor = "start"] of spots) for (const up of grows) {
        const y = y0spot + up;
        if (x < v.x || x > v.x + v.w || y0spot < v.y || y0spot > v.y + v.h) {
          if (dy === 0) why.push("part out of view");
          continue;
        }
        const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
        const y0 = y + dy;
        const box = { x: x0, y: y0 - s * 0.25 - extra, w, h: s * 1.2 + extra };
        // Wholly in view, or not at all.
        if (box.x < v.x || box.x + box.w > v.x + v.w || box.y < v.y || box.y + box.h > v.y + v.h) {
          if (dy === 0) why.push("would run out of view");
          continue;
        }
        const blocked = this.blocker(box);
        if (blocked) {
          if (dy === 0) why.push(`on ${blocked}`);
          continue;
        }
        this.placed.push(box);
        if (lines.length === 1) return `<text class="${cls}" x="${f(x0)}" y="${f(-y0)}" font-size="${f(s)}">${text}</text>`;
        // (Each line keeps the spot's anchor within the label's width.)
        const tx = anchor === "start" ? x0 : anchor === "middle" ? x0 + w / 2 : x0 + w;
        const spans = lines.map((l, i) => `<tspan x="${f(tx)}" dy="${i === 0 ? 0 : f(1.15 * s)}">${l}</tspan>`).join("");
        return `<text class="${cls}" x="${f(tx)}" y="${f(-y0)}" font-size="${f(s)}" text-anchor="${anchor}">${spans}</text>`;
      }
    }
    this.left.push(`${text}: ${why.join("; ")}`);
    return "";
  }

  /**
   * A label away from its part, joined to it by a thin leader line, for a part with no room
   * beside it: the first spot where the label is clear and the leader (from the middle of the
   * label's bottom edge to the target) crosses nothing on its way.
   * @param {string} text
   * @param {Spot[]} spots
   * @param {Pt} target the point on the part the leader ends at
   * @param {string} [cls]
   * @returns {string}
   */
  placeWithLeader(text, spots, target, cls = "lbl") {
    const v = this.frame.visible;
    const s = this.size;
    const w = text.length * CHAR_WIDTH * s;
    for (const [x, y, anchor = "start"] of spots) {
      const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
      const box = { x: x0, y: y - s * 0.25, w, h: s * 1.2 };
      if (box.x < v.x || box.x + box.w > v.x + v.w || box.y < v.y || box.y + box.h > v.y + v.h) continue;
      if (this.blocker(box)) continue;
      const from = /** @type {Pt} */ ([Math.min(Math.max(target[0], box.x + s * 0.3), box.x + box.w - s * 0.3), box.y - s * 0.1]);
      const len = Math.hypot(target[0] - from[0], target[1] - from[1]);
      // The leader stops a little short of the part, and must cross nothing else.
      const end = /** @type {Pt} */ ([target[0] + ((from[0] - target[0]) * 2) / len, target[1] + ((from[1] - target[1]) * 2) / len]);
      const leader = { a: from, b: end, r: 0.5 };
      if (this.obstacles.boxes.some((o) => segMeetsBox(leader, o)) || this.placed.some((o) => segMeetsBox(leader, o))) continue;
      if (this.obstacles.segs.some((g) => segsCross(leader, g))) continue;
      this.placed.push(box);
      return `<line class="leader" x1="${f(from[0])}" y1="${f(-from[1])}" x2="${f(end[0])}" y2="${f(-end[1])}"/><text class="${cls}" x="${f(x0)}" y="${f(-y)}" font-size="${f(s)}">${text}</text>`;
    }
    this.left.push(`${text}: no clear spot for a leader either`);
    return "";
  }

  /**
   * A label at one spot (or a line up or down from it); "" when there is no room.
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {"start" | "middle" | "end"} [anchor]
   * @param {string} [cls]
   * @returns {string}
   */
  place(x, y, text, anchor = "start", cls = "lbl") {
    return this.placeAt(text, [[x, y, anchor]], cls);
  }
}
