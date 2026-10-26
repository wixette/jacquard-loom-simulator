// Draws the head section (layout.js) as SVG. It only draws: every position comes from the
// layout, which comes from the simulation. Parts that belong to one hook carry
// data-hook="h" (the hook's 0-based number in the whole head), so the page can follow a
// hook by clicking any of them.

import { KNIFE_REST_TOP } from "../sim/head.js";
import { P } from "../sim/params.js";
import { boxAround, LabelPlacer, NUMBER_PX, screenFrame } from "./labels.js";
/** @import { Pt, Rect, SectionLayout } from "./layout.js" */

/**
 * @typedef {object} SectionOptions
 * @property {number | null} follow the followed hook (0-based, in the whole head), or null
 * @property {"whole" | "needles" | "crooks"} view
 * @property {boolean} labels
 */

const NS = "http://www.w3.org/2000/svg";

/** @param {number} y */
const Y = (y) => -y;
/** @param {number} v */
const f = (v) => (Math.round(v * 100) / 100).toString();
/** @param {Pt[]} pts */
const pts = (pts) => pts.map(([x, y]) => `${f(x)},${f(Y(y))}`).join(" ");
/**
 * @param {Rect} r
 * @param {string} cls
 * @param {string} [extra]
 */
const rect = (r, cls, extra = "") => `<rect class="${cls}" x="${f(r.x)}" y="${f(Y(r.y + r.h))}" width="${f(r.w)}" height="${f(r.h)}"${extra}/>`;
/**
 * @param {Pt} a
 * @param {Pt} b
 * @param {string} cls
 * @param {string} [extra]
 */
const line = (a, b, cls, extra = "") => `<line class="${cls}" x1="${f(a[0])}" y1="${f(Y(a[1]))}" x2="${f(b[0])}" y2="${f(Y(b[1]))}"${extra}/>`;
/**
 * A compression spring between x0 and x1 at height y, as a zigzag.
 * @param {number} x0
 * @param {number} x1
 * @param {number} y
 * @param {number} r
 * @returns {Pt[]}
 */
function zigzag(x0, x1, y, r) {
  const n = 9;
  /** @type {Pt[]} */
  const out = [[x0, y]];
  for (let i = 1; i < n; i++) out.push([x0 + ((x1 - x0) * i) / n, y + (i % 2 ? r : -r)]);
  out.push([x1, y]);
  return out;
}

export class SectionView {
  /** @param {HTMLElement} host */
  constructor(host) {
    /** @type {SVGSVGElement} */
    this.svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, "svg"));
    this.svg.setAttribute("class", "section");
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("aria-label", "Side section through one cross-row of the Jacquard head");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    host.appendChild(this.svg);
  }

  /**
   * @param {SectionLayout} L
   * @param {SectionOptions} o
   */
  render(L, o) {
    const v = L.views[o.view];
    this.svg.setAttribute("viewBox", `${f(v.x)} ${f(Y(v.y + v.h))} ${f(v.w)} ${f(v.h)}`);
    // Labels and numbers are sized in screen pixels, whatever the view's scale.
    const frame = screenFrame(v, this.svg.clientWidth, this.svg.clientHeight);
    /** Card numbers: about NUMBER_PX on screen, but never too big for the 62 mm prism. */
    const num = Math.min(12, NUMBER_PX / frame.scale);
    const vis = frame.visible;
    /**
     * Whether a number at p is drawn: only in view, and only when the cylinder is shown big
     * enough to carry readable numbers (the chain list and the close-ups show them otherwise).
     */
    const readable = num * frame.scale >= 8;
    const inView = (/** @type {number[]} */ p) => readable && p[0] - num > vis.x && p[0] + num < vis.x + vis.w && p[1] - num > vis.y && p[1] + num < vis.y + vis.h;
    /** @param {number} k */
    const fol = (k) => (o.follow === k ? " follow" : "");
    /** @param {number} k */
    const dh = (k) => ` data-hook="${k}"`;
    const out = [];

    // Boards and frames (wood), behind everything.
    out.push(rect(L.griffe, "griffe-frame"));
    out.push(rect(L.plunger, "griffe-frame"));
    out.push(rect(L.boards.springBox, "wood"));
    out.push(rect(L.boards.bottom, "wood"));
    out.push(rect(L.boards.comber, "wood"));

    // The harness, broken off in the middle.
    for (const c of L.neckCords) out.push(line(c.top, c.bottom, `cord${fol(c.hook)}`, dh(c.hook)));
    for (const c of L.harnessCords) out.push(line(c.top, c.bottom, `cord${fol(c.hook)}`, dh(c.hook)));
    const bx0 = L.boards.bottom.x - 10;
    const bx1 = L.boards.bottom.x + L.boards.bottom.w + 10;
    for (const y of L.breakY) out.push(`<polyline class="break" points="${pts(zigzag(bx0, bx1, y, 3))}"/>`);
    out.push(`<line class="shed" x1="${f(bx0)}" y1="${f(Y(L.shed.rest))}" x2="${f(bx1)}" y2="${f(Y(L.shed.rest))}"/>`);
    out.push(`<line class="shed" x1="${f(bx0)}" y1="${f(Y(L.shed.top))}" x2="${f(bx1)}" y2="${f(Y(L.shed.top))}"/>`);
    for (const g of L.lingoes) out.push(rect(g, `lingo${fol(g.hook)}`, dh(g.hook)));
    for (const m of L.mails) {
      out.push(line([m.centre[0], m.centre[1] - 5], [m.centre[0], m.centre[1] - 20], `cord${fol(m.hook)}`, dh(m.hook)));
      out.push(`<ellipse class="mail${m.up ? " up" : ""}${fol(m.hook)}"${dh(m.hook)} cx="${f(m.centre[0])}" cy="${f(Y(m.centre[1]))}" rx="3.2" ry="5"/>`);
      out.push(`<circle class="warp${m.up ? " up" : ""}" cx="${f(m.centre[0])}" cy="${f(Y(m.centre[1]))}" r="1.6"/>`);
    }

    // The card cylinder and the chain near it, under the needles, so a needle going into a
    // hole can be seen inside the cylinder. Each card is a pasteboard strip with all eight
    // hole positions marked as in the card editor: a filled dot is punched, a hollow circle
    // blank; the card at the needles is the brightest. A face with no card has a dashed edge and its
    // bored holes, faint and small. Cards hanging from the cylinder fade out along the
    // strands; the rest of the chain is dashed.
    const c = L.cylinder;
    out.push(`<polygon class="cylinder" points="${pts(c.corners)}"/>`);
    for (const face of L.faces) {
      if (face.index !== null) continue;
      out.push(line(face.edge[0], face.edge[1], "face-bare"));
      for (const b of face.bores) out.push(`<circle class="bore" cx="${f(b[0])}" cy="${f(Y(b[1]))}" r="1.1"/>`);
    }
    for (const m of L.chain.more) out.push(`<polyline class="chain-more" points="${pts(m)}"/>`);
    for (const card of L.chain.cards) {
      const cls = card.facing ? " facing" : "";
      const op = card.opacity < 1 ? ` opacity="${f(card.opacity)}"` : "";
      out.push(`<g class="chain-card${card.face === null ? " hanging" : ""}"${op}><polygon class="card-strip${cls}" points="${pts(card.strip)}"><title>Card ${card.index + 1}</title></polygon>`);
      for (const m of card.marks) out.push(`<circle class="card-mark${m.punched ? " punched" : ""}" cx="${f(m.at[0])}" cy="${f(Y(m.at[1]))}" r="2.3"/>`);
      // The number: inside the cylinder while the card lies on a face, outside while it hangs,
      // crossfaded while it moves between the two.
      if (card.outside < 1 && inView(card.label)) out.push(`<text class="face-num${cls}" x="${f(card.label[0])}" y="${f(Y(card.label[1]) + num * 0.35)}" font-size="${f(num)}" text-anchor="middle"${card.outside > 0 ? ` opacity="${f(1 - card.outside)}"` : ""}>${card.index + 1}</text>`);
      if (card.outside > 0) {
        // Outside, clear of the card whatever the number's size.
        const mid = [(card.hi[0] + card.lo[0]) / 2, (card.hi[1] + card.lo[1]) / 2];
        const dx = card.labelOut[0] - mid[0];
        const dy = card.labelOut[1] - mid[1];
        const dl = Math.hypot(dx, dy) || 1;
        const at = [mid[0] + (dx / dl) * (3 + num * 0.75), mid[1] + (dy / dl) * (3 + num * 0.75)];
        if (inView(at)) out.push(`<text class="face-num outside" x="${f(at[0])}" y="${f(Y(at[1]) + num * 0.35)}" font-size="${f(num)}" text-anchor="middle"${card.outside < 1 ? ` opacity="${f(card.outside)}"` : ""}>${card.index + 1}</text>`);
      }
      out.push("</g>");
    }
    for (const l of L.chain.laces) out.push(`<circle class="lace" cx="${f(l.at[0])}" cy="${f(Y(l.at[1]))}" r="1.6"${l.opacity < 1 ? ` opacity="${f(l.opacity)}"` : ""}/>`);
    out.push(`<circle class="axle" cx="${f(c.centre[0])}" cy="${f(Y(c.centre[1]))}" r="3"/>`);
    // The way it turns: a 45-degree arc outside the prism's upper outer corner, clockwise, so
    // the top face comes round to the needles and the outer face comes up on top (Posselt's
    // forward catch). Clear of the needle board and of both hanging strands.
    const R = c.half * Math.SQRT2 + 8;
    const a0 = (157.5 * Math.PI) / 180;
    const a1 = a0 - Math.PI / 4;
    const at = (/** @type {number} */ a) => /** @type {Pt} */ ([c.centre[0] + R * Math.cos(a), c.centre[1] + R * Math.sin(a)]);
    const p0 = at(a0);
    const p1 = at(a1 + 0.06);
    out.push(`<path class="turn-arrow" d="M ${f(p0[0])} ${f(Y(p0[1]))} A ${f(R)} ${f(R)} 0 0 1 ${f(p1[0])} ${f(Y(p1[1]))}"/>`);
    // The head: a triangle pointing along the arc's direction (clockwise tangent) at its end.
    const tip = at(a1);
    const tx = Math.sin(a1);
    const ty = -Math.cos(a1);
    const nx = Math.cos(a1);
    const ny = Math.sin(a1);
    const len = 6;
    const wid = 3.2;
    const back = [tip[0] - tx * len, tip[1] - ty * len];
    const head = [tip, [back[0] + nx * wid, back[1] + ny * wid], [back[0] - nx * wid, back[1] - ny * wid]];
    out.push(`<polygon class="turn-head" points="${pts(/** @type {Pt[]} */ (head))}"/>`);

    // Needles, springs and the needle board.
    for (const s of L.springs) out.push(`<polyline class="spring${fol(s.hook)}" points="${pts(zigzag(s.x0, s.x1, s.y, 2.0))}"/>`);
    for (const n of L.needles) {
      out.push(line([n.head, n.y], [n.tail, n.y], `needle${n.push > 0.01 ? " pushed" : ""}${fol(n.hook)}`, dh(n.hook)));
    }
    out.push(rect(L.boards.needle, "wood board-face"));

    // Hooks: shank and crook, the rester beside it.
    for (const h of L.hooks) {
      const cls = `hook${h.caught ? " caught" : ""}${h.selected ? " selected" : ""}${fol(h.hook)}`;
      out.push(`<polyline class="${cls}"${dh(h.hook)} points="${pts(h.shank)}" stroke-width="${f(h.wire)}"/>`);
      out.push(`<polyline class="${cls} rester"${dh(h.hook)} points="${pts(h.rester)}" stroke-width="${f(h.wire)}"/>`);
    }
    // Needle eyes around their hooks, drawn over the hooks.
    for (const n of L.needles) {
      out.push(`<rect class="eye${fol(n.hook)}"${dh(n.hook)} x="${f(n.eye[0])}" y="${f(Y(n.y) - 1.6)}" width="${f(n.eye[1] - n.eye[0])}" height="3.2" rx="1.6"/>`);
    }
    // Knives (iron), in section.
    for (const k of L.knives) out.push(rect(k, `knife${fol(k.hook)}`, dh(k.hook)));

    if (o.labels) out.push(...sectionLabels(L, frame, bx0, bx1));
    this.svg.innerHTML = out.join("");
  }
}

/** The labels the last drawing left out, and why (for checking by hand, in the console). */
export const LEFT_OUT = /** @type {string[]} */ ([]);

/** The rester leg's distance beside its shank, and a little room (mm). */
const RESTER_GAP = 6;

/**
 * The section's labels, each beside the part it names, clear of the drawing.
 * @param {SectionLayout} L
 * @param {import("./labels.js").ScreenFrame} frame
 * @param {number} bx0 the harness drawing's left end
 * @param {number} bx1 its right end
 * @returns {string[]}
 */
function sectionLabels(L, frame, bx0, bx1) {
  // What labels must keep off: every part over its whole range of motion in a pick (the hooks
  // with their full lift and push, the griffe over its stroke, the cylinder over its travel
  // and turn, the mails over the shed), so no label has to move to another spot mid-pick.
  const c = L.cylinder;
  const lift = P.griffeLift;
  const g0 = L.griffe;
  const rows = L.hooks.length;
  const first = L.hooks[0].shank[0][0];
  const last = L.hooks[rows - 1].shank[0][0];
  const hooksRange = { x: first - P.crookOverhang - 3, y: L.boards.bottom.y + L.boards.bottom.h - 2, w: last - first + P.crookOverhang + P.needleProtrusion + 8, h: P.hookHeight + lift + 6 };
  // Each hook over its motion: its shank, upright or pushed, from the foot up to its crook at
  // full lift, and its crook (which also leans toward its knife).
  const crookY = P.hookHeight - P.hookWire;
  const hookShapes = L.hooks.flatMap((h) => {
    const x = h.shank[0][0];
    return [
      { x: x - 3, y: 0, w: P.needleProtrusion + 6 + RESTER_GAP, h: crookY - 8 + lift },
      { x: x - P.crookOverhang - 3, y: crookY - 8, w: P.crookOverhang + P.needleProtrusion + 6, h: lift + 14 },
    ];
  });
  const griffeRest = KNIFE_REST_TOP - P.knifeHeight - 10;
  const griffeRange = { x: g0.x, y: griffeRest, w: g0.w, h: g0.h + lift + L.plunger.h + 4 };
  const needleRange = boxAround(L.needles.flatMap((n) => [/** @type {Pt} */ ([-P.needleProtrusion - 2, n.y]), /** @type {Pt} */ ([-P.needleProtrusion + P.needleLength + P.needleProtrusion, n.y])]), 3);
  // The cylinder and its chain: the box around them now, widened by the rest of the travel
  // either way and by the corners' sweep as the prism turns.
  const now = boxAround([...c.corners, ...L.chain.cards.flatMap((k) => k.strip), ...L.chain.more.flat()], 8);
  const out0 = c.out;
  const sweep = c.half * (Math.SQRT2 - 1) + 10;
  // (It never reaches past the needle board's face: the card stops there.)
  const left = now.x - (P.cylinderTravel - out0) - sweep;
  const cylinderRange = { x: left, y: now.y - sweep, w: 2 - left, h: now.h + 2 * sweep };
  const mails = L.mails;
  const lingoBottom = L.shed.rest - 20 - L.lingoes[0].h;
  const harnessRange = { x: Math.min(...mails.map((m) => m.centre[0])) - 6, y: lingoBottom - 2, w: Math.max(...mails.map((m) => m.centre[0])) - Math.min(...mails.map((m) => m.centre[0])) + 12, h: L.boards.comber.y - lingoBottom + 2 };
  const hooksRight = Math.max(...hookShapes.map((b) => b.x + b.w));
  const boxes = [L.boards.bottom, L.boards.needle, L.boards.springBox, L.boards.comber, ...hookShapes, griffeRange, needleRange, cylinderRange, harnessRange];
  const segs = [
    ...L.breakY.map((y) => ({ a: /** @type {Pt} */ ([bx0, y]), b: /** @type {Pt} */ ([bx1, y]), r: 3.5 })),
    { a: /** @type {Pt} */ ([bx0, L.shed.rest]), b: /** @type {Pt} */ ([bx1, L.shed.rest]), r: 1 },
    { a: /** @type {Pt} */ ([bx0, L.shed.top]), b: /** @type {Pt} */ ([bx1, L.shed.top]), r: 1 },
    { a: /** @type {Pt} */ ([first, 0]), b: /** @type {Pt} */ ([first, L.breakY[0]]), r: 2 },
    { a: /** @type {Pt} */ ([last, 0]), b: /** @type {Pt} */ ([last, L.breakY[0]]), r: 2 },
  ];
  const labels = new LabelPlacer(frame, { boxes, segs });
  const s = labels.size;
  const nb = L.boards.needle;
  const sb = L.boards.springBox;
  const bottom = L.boards.bottom;
  const comber = L.boards.comber;
  const mid = (/** @type {{ y: number, h: number }} */ b) => b.y + b.h / 2 - s * 0.35;
  const out = [];
  LEFT_OUT.length = 0;
  // Each label tries a few spots beside its part, in order, and is left out if none is clear.
  out.push(labels.placeAt("card cylinder", [[cylinderRange.x + cylinderRange.w / 2, cylinderRange.y + cylinderRange.h + 4, "middle"], [cylinderRange.x - 4, cylinderRange.y + cylinderRange.h - s * 1.2, "end"], [cylinderRange.x, cylinderRange.y + cylinderRange.h + 4]]));
  const pastCylinder = cylinderRange.x + cylinderRange.w + s * 0.3 + 1;
  const needleBoard = labels.placeAt("needle board", [[nb.x + nb.w / 2, nb.y + nb.h + 4, "middle"], [pastCylinder, nb.y + nb.h + 4], [pastCylinder, nb.y - 4 - s], [nb.x + nb.w / 2, nb.y - 4 - s, "middle"]]);
  if (needleBoard) out.push(needleBoard);
  else {
    // No room beside the board at this scale: above it, with a leader down to it.
    const tried = labels.left.length;
    const withLeader = labels.placeWithLeader("needle board", [[griffeRange.x - s * 0.4, cylinderRange.y + cylinderRange.h + 4 + 1.6 * s, "end"], [griffeRange.x - s * 0.4, cylinderRange.y + cylinderRange.h + 4 + 3 * s, "end"]], [nb.x + nb.w / 2, nb.y + nb.h]);
    if (withLeader) labels.left.splice(tried - 2, 2);
    out.push(withLeader);
  }
  out.push(labels.placeAt("spring box", [[sb.x + sb.w / 2, sb.y + sb.h + 4, "middle"], [sb.x + sb.w / 2, sb.y - 4 - s, "middle"], [sb.x + sb.w + 4, mid(sb)]]));
  const knivesRest = KNIFE_REST_TOP - P.knifeHeight / 2 - s * 0.35;
  out.push(labels.placeAt("knives", [[griffeRange.x - 4, knivesRest, "end"], [griffeRange.x - 4, griffeRange.y + griffeRange.h / 2, "end"], [griffeRange.x + griffeRange.w + 4, knivesRest]]));
  out.push(labels.placeAt("griffe", [[griffeRange.x + griffeRange.w / 2, griffeRange.y + griffeRange.h + 4, "middle"], [griffeRange.x + griffeRange.w + 4, griffeRange.y + griffeRange.h - s * 1.5], [griffeRange.x - 4, griffeRange.y + griffeRange.h - s * 1.5, "end"]]));
  const beyond = hooksRight + s * 0.3 + 1;
  out.push(labels.placeAt("hooks", [[beyond, 200], [beyond, 120], [beyond, 60], [hooksRange.x - 4, 120, "end"]]));
  out.push(labels.placeAt("bottom board", [[bottom.x + bottom.w + 4, mid(bottom)], [bottom.x - 4, mid(bottom), "end"]]));
  const breakMid = (L.breakY[0] + L.breakY[1]) / 2 - s * 0.35;
  out.push(labels.placeAt("harness, shortened", [[bx1 + 4 + s * 0.3, breakMid], [bx0 - 4 - s * 0.3, breakMid, "end"]]));
  out.push(labels.placeAt("comber board", [[comber.x + comber.w + 4, mid(comber)], [comber.x - 4, mid(comber), "end"]]));
  out.push(labels.placeAt("warp up", [[bx1 + 4, L.shed.top - s * 0.35], [bx0 - 4, L.shed.top - s * 0.35, "end"]]));
  out.push(labels.placeAt("mails: warp down", [[bx1 + 4, L.shed.rest - s * 0.35], [bx0 - 4, L.shed.rest - s * 0.35, "end"]]));
  out.push(labels.placeAt("lingoes", [[harnessRange.x - 4, lingoBottom + 10, "end"], [bx1 + 4, lingoBottom + 10]]));
  // The first and last hooks' numbers, by their feet.
  const numbers = new LabelPlacer(frame, { boxes, segs }, NUMBER_PX);
  numbers.placed = labels.placed;
  const h0 = L.hooks[0];
  const hn = L.hooks[L.hooks.length - 1];
  out.push(numbers.placeAt(String(h0.hook + 1), [[hooksRange.x - 3, 60, "end"], [hooksRange.x - 3, 100, "end"]]));
  out.push(numbers.placeAt(String(hn.hook + 1), [[beyond, 60], [beyond, 100]]));
  LEFT_OUT.push(...labels.left, ...numbers.left);
  return out;
}
