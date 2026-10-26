// The loom from the side, schematic but roughly to scale (mm, y up, the weaver at the
// left): the treadle, the head lever and the cord between them, the head on the frame,
// the harness hanging to the mails, the warp from the back rest through the mails to the
// fell, the batten swinging back and beating, the shuttle in the shed, and the cloth over
// the breast beam to the cloth beam. It shows the rhythm of a pick: the foot lifts the
// griffe, the shed opens, the shuttle passes, the batten beats.
//
// The loom's frame is estimated (research section 3): overall sizes from the Science
// Museum's silk hand loom 1914-469, members and heights estimated.

import { FRAME, P, U } from "../sim/params.js";
import { boxAround, LabelPlacer, screenFrame, segsOf } from "./labels.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Pt } from "./layout.js" */

// The side view's x is the machine frame's Y (front to back), its y the frame's Z (up).
const FELL_X = FRAME.fellY;
const WARP_Y = FRAME.warpZ;
const MAIL_X = FRAME.sectionY;
const BACK_REST = /** @type {Pt} */ ([FRAME.backRestY, 820]);
const BREAST = /** @type {Pt} */ ([250, 810]);
const HEAD_BOTTOM = FRAME.sectionZ - P.bottomBoardThickness;
const HEAD_H = 413;
const LEVER_PIVOT = U.leverPivot;
const LEVER_ARM = U.leverArm;
const TREADLE_PIVOT = U.treadlePivot;
const TREADLE_CORD_X = U.treadleCord[0];
const REED_REST_X = U.reedRestY;
const REED_STRIKE_X = FELL_X + 6;
const REED_BACK_X = U.reedBackY;
/** The shuttle's width (front to back) and height, mm. */
const [, SHUTTLE_W, SHUTTLE_H] = U.shuttle;

/**
 * @typedef {object} SideLayout
 * @property {number} lift the shed's opening at the mails (mm)
 * @property {{ lifted: Pt, rest: Pt }} mails
 * @property {{ upper: Pt[], lower: Pt[] }} warp
 * @property {Pt[]} cloth
 * @property {{ pivot: Pt, griffeEnd: Pt, cordEnd: Pt }} lever
 * @property {{ pivot: Pt, cordPoint: Pt, foot: Pt }} treadle
 * @property {{ x: number, y: number, w: number, h: number }} head
 * @property {{ x: number, y: number, w: number, h: number }} griffe
 * @property {{ pivot: Pt, reedX: number, reedTop: number, reedBottom: number }} batten
 * @property {{ x: number, y: number, w: number, h: number } | null} shuttle while it crosses, on the race in front of the reed
 * @property {number} fellX
 */

/**
 * @param {Snapshot} snap
 * @returns {SideLayout}
 */
export function sideLayout(snap) {
  const g = snap.head.griffe;
  const lift = Math.max(0, ...snap.endLift, 0);
  const a = Math.asin(Math.min(1, g / LEVER_ARM));
  const griffeEnd = /** @type {Pt} */ ([LEVER_PIVOT[0] + LEVER_ARM * Math.cos(a), LEVER_PIVOT[1] + LEVER_ARM * Math.sin(a)]);
  const cordEnd = /** @type {Pt} */ ([LEVER_PIVOT[0] - LEVER_ARM * Math.cos(a), LEVER_PIVOT[1] - LEVER_ARM * Math.sin(a)]);
  // The treadle pivots at the back; its cord point drops by the griffe's lift.
  const restY = U.treadleCord[1];
  const cordPoint = /** @type {Pt} */ ([TREADLE_CORD_X, restY - g]);
  const slope = (cordPoint[1] - TREADLE_PIVOT[1]) / (cordPoint[0] - TREADLE_PIVOT[0]);
  const foot = /** @type {Pt} */ ([U.treadleFootY, TREADLE_PIVOT[1] + slope * (U.treadleFootY - TREADLE_PIVOT[0])]);
  const swing = snap.batten;
  // Back (swing -1) far enough that the shed in front of the reed is taller than the shuttle.
  const reedX = swing >= 0 ? REED_REST_X - (REED_REST_X - REED_STRIKE_X) * swing : REED_REST_X - swing * (REED_BACK_X - REED_REST_X);
  const lifted = /** @type {Pt} */ ([MAIL_X, WARP_Y + lift]);
  const rest = /** @type {Pt} */ ([MAIL_X, WARP_Y]);
  const fell = /** @type {Pt} */ ([FELL_X, WARP_Y + 8]);
  const crossing = snap.shuttle > 0 && snap.shuttle < 1;
  return {
    lift,
    mails: { lifted, rest },
    warp: { upper: [BACK_REST, lifted, fell], lower: [BACK_REST, rest, fell] },
    cloth: [fell, BREAST, [BREAST[0] + 40, 600], [330, 560]],
    lever: { pivot: LEVER_PIVOT, griffeEnd, cordEnd },
    treadle: { pivot: TREADLE_PIVOT, cordPoint, foot },
    head: { x: MAIL_X - 140, y: HEAD_BOTTOM, w: 280, h: HEAD_H },
    griffe: { x: MAIL_X - 100, y: HEAD_BOTTOM + 300 + g, w: 200, h: 40 },
    batten: { pivot: U.battenPivot, reedX, reedTop: WARP_Y + P.griffeLift + 60, reedBottom: WARP_Y - 70 },
    // On the race in front of the reed (the fell's side), against it, riding on the lower warp.
    shuttle: crossing ? { x: reedX - 4 - SHUTTLE_W, y: WARP_Y + 1, w: SHUTTLE_W, h: SHUTTLE_H } : null,
    fellX: FELL_X,
  };
}

const NS = "http://www.w3.org/2000/svg";
/** @param {number} v */
const f = (v) => Math.round(v).toString();
/** The side view's extent, mm, y up. */
const VIEW = { x: -60, y: -60, w: 2620, h: 3260 };

export class SideView {
  /** @param {HTMLElement} host */
  constructor(host) {
    this.svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, "svg"));
    this.svg.setAttribute("class", "side");
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("aria-label", "The loom from the side: treadle, lever, head, harness, shed, batten and cloth");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    this.svg.setAttribute("viewBox", `${VIEW.x} ${-(VIEW.y + VIEW.h)} ${VIEW.w} ${VIEW.h}`);
    host.appendChild(this.svg);
  }

  /** @param {SideLayout} L */
  render(L) {
    /** @param {Pt[]} p */
    const pts = (p) => p.map(([x, y]) => `${f(x)},${f(-y)}`).join(" ");
    /** @param {Pt} a @param {Pt} b @param {string} cls */
    const line = (a, b, cls) => `<line class="${cls}" x1="${f(a[0])}" y1="${f(-a[1])}" x2="${f(b[0])}" y2="${f(-b[1])}"/>`;
    /** @param {{ x: number, y: number, w: number, h: number }} r @param {string} cls */
    const rect = (r, cls) => `<rect class="${cls}" x="${f(r.x)}" y="${f(-(r.y + r.h))}" width="${f(r.w)}" height="${f(r.h)}"/>`;
    const out = [];
    out.push(line([-60, 0], [2560, 0], "floor"));
    // Frame: front and back posts, top rails.
    for (const x of [200, 2500]) out.push(rect({ x: x - 30, y: 0, w: 60, h: 2380 }, "frame"));
    out.push(rect({ x: 170, y: 2340, w: 2360, h: 50 }, "frame"));
    out.push(rect(L.head, "head"));
    out.push(rect(L.griffe, "griffe-side"));
    out.push(line(L.lever.griffeEnd, [L.lever.griffeEnd[0], L.griffe.y + L.griffe.h], "rod"));
    out.push(line(L.lever.cordEnd, L.lever.griffeEnd, "lever"));
    out.push(`<circle class="pivot" cx="${f(L.lever.pivot[0])}" cy="${f(-L.lever.pivot[1])}" r="18"/>`);
    out.push(line(L.lever.cordEnd, L.treadle.cordPoint, "cord"));
    out.push(line(L.treadle.pivot, L.treadle.foot, "treadle"));
    out.push(`<circle class="pivot" cx="${f(L.treadle.pivot[0])}" cy="${f(-L.treadle.pivot[1])}" r="18"/>`);
    // Harness: a bundle from the head to the comber board, then to the mails.
    for (const dx of [-40, 0, 40]) out.push(line([L.head.x + L.head.w / 2 + dx, L.head.y], [L.mails.rest[0] + dx / 2, 1700], "harness"));
    out.push(rect({ x: L.mails.rest[0] - 60, y: 1690, w: 120, h: 20 }, "wood"));
    out.push(line([L.mails.rest[0], 1690], L.mails.lifted, "harness"));
    out.push(line(L.mails.rest, [L.mails.rest[0], 520], "lingo"));
    // Warp, the shed, the cloth.
    out.push(`<polyline class="warp-line" points="${pts(L.warp.lower)}"/>`);
    out.push(`<polyline class="warp-line up" points="${pts(L.warp.upper)}"/>`);
    out.push(`<polyline class="cloth-line" points="${pts(L.cloth)}"/>`);
    out.push(`<circle class="beam" cx="330" cy="-500" r="70"/>`);
    out.push(`<circle class="beam" cx="2480" cy="-560" r="90"/>`);
    out.push(rect({ x: 220, y: 760, w: 60, h: 50 }, "wood"));
    // Batten: swords from the pivot to the race, the reed.
    const b = L.batten;
    out.push(line(b.pivot, [b.reedX + 20, b.reedBottom], "sword"));
    out.push(line([b.reedX, b.reedBottom], [b.reedX, b.reedTop], "reed"));
    out.push(rect({ x: b.reedX - 70, y: WARP_Y - 32, w: 80, h: 30 }, "race"));
    if (L.shuttle) out.push(rect(L.shuttle, "shuttle"));
    // What labels must keep off, over the whole pick (so no label moves mid-pick): the frame,
    // the head, and every moving part over its sweep: the lever and the treadle over their
    // strokes, the batten over its swing, the upper warp over the shed.
    const lift = P.griffeLift - P.restGap;
    const reedMin = REED_STRIKE_X - 20;
    const reedMax = REED_BACK_X + 20;
    const boxes = [
      { x: 170, y: 0, w: 60, h: 2380 },
      { x: 2470, y: 0, w: 60, h: 2380 },
      { x: 170, y: 2340, w: 2360, h: 50 },
      L.head,
      { x: L.mails.rest[0] - 60, y: 1690, w: 120, h: 20 },
      { x: 220, y: 760, w: 60, h: 50 },
      { x: 260, y: 430, w: 140, h: 140 },
      { x: 2390, y: 470, w: 180, h: 180 },
      { x: reedMin - 20, y: b.reedBottom - 40, w: reedMax - reedMin + 100, h: b.reedTop - b.reedBottom + 60 },
      boxAround([b.pivot, [reedMin, b.reedBottom], [reedMax, b.reedBottom]], 30),
      boxAround([L.lever.pivot, [L.lever.pivot[0] - LEVER_ARM - 30, L.lever.pivot[1] - 90], [L.lever.pivot[0] + LEVER_ARM + 30, L.lever.pivot[1] + 90]], 0),
      boxAround([L.treadle.pivot, [700, 380], [700, 120]], 20),
    ];
    const upper = /** @type {Pt[]} */ ([L.warp.lower[0], [L.warp.lower[1][0], L.warp.lower[1][1] + lift], L.warp.lower[2]]);
    const segs = [
      { a: /** @type {Pt} */ ([LEVER_PIVOT[0] - LEVER_ARM, LEVER_PIVOT[1] + 100]), b: /** @type {Pt} */ ([LEVER_PIVOT[0] - LEVER_ARM, 120]), r: 30 },
      { a: /** @type {Pt} */ ([L.head.x, L.head.y]), b: /** @type {Pt} */ ([L.mails.rest[0], 1700]), r: 30 },
      { a: /** @type {Pt} */ ([L.head.x + L.head.w, L.head.y]), b: /** @type {Pt} */ ([L.mails.rest[0], 1700]), r: 30 },
      { a: /** @type {Pt} */ ([L.mails.rest[0], 1690]), b: /** @type {Pt} */ ([L.mails.rest[0], 520]), r: 15 },
      ...segsOf(L.warp.lower, 12),
      ...segsOf(upper, 12),
      ...segsOf(L.cloth, 15),
    ];
    const labels = new LabelPlacer(screenFrame(VIEW, this.svg.clientWidth, this.svg.clientHeight), { boxes, segs });
    const s = labels.size;
    out.push(labels.placeAt("head", [[L.head.x + L.head.w + s * 0.4, L.head.y + L.head.h / 2 - s * 0.35], [L.head.x - s * 0.4, L.head.y + L.head.h / 2 - s * 0.35, "end"]]));
    out.push(labels.placeAt("lever", [[L.lever.pivot[0] - LEVER_ARM - 70, L.lever.pivot[1] - s * 0.35, "end"], [L.lever.pivot[0], L.lever.pivot[1] + 110, "middle"]]));
    out.push(labels.placeAt("treadle", [[900, 400], [1300, 400], [900, 30]]));
    out.push(labels.placeAt("batten", [[reedMax + 110, 1500], [reedMin - 30, 1500, "end"], [b.pivot[0], 2420, "middle"]]));
    out.push(labels.placeAt("shed", [[1750, L.mails.rest[1] - s * 1.8], [1750, L.mails.rest[1] + lift + s * 1.2]]));
    this.svg.innerHTML = out.join("");
  }
}
