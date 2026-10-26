// The loom from the front, as the weaver sees it, schematic: the hooks in the head, the
// harness cords fanning from each hook to its warp ends through the comber board, the
// mails and lingoes, the shed with each warp end seen end-on (a dot, up or down), and the
// shuttle crossing through the shed laying the weft. This is where a hole becomes a
// particular thread across the width.
//
// frontLayout() is pure (units of the drawing, y up); FrontView draws it as SVG.

import { t } from "../l10n/l10n.js";
import { endCount, hookOfEnd } from "../sim/tieup.js";
import { LabelPlacer, screenFrame } from "./labels.js";
import { P } from "../sim/params.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Trace } from "../sim/trace.js" */
/** @import { Pt } from "./layout.js" */

/** Drawing units per warp end across the width. */
export const END_PITCH = 12;
/** The shed's full opening at the mails, in drawing units, for a narrow warp. */
export const SHED = 40;
const FULL_LIFT = P.griffeLift - P.restGap;
const SHUTTLE_LEN = 60;
const BOX = 70;
/** A wide warp is drawn taller too, so the view keeps a readable shape. */
const WIDTH_PER_UNIT_HEIGHT = 1100;

/**
 * @typedef {object} FrontLayout
 * @property {number} width the warp's width
 * @property {{ hook: number, x: number, y: number, lifted: boolean }[]} hooks
 * @property {{ hook: number, end: number, top: Pt, bottom: Pt }[]} cords from the hook to the comber board
 * @property {{ end: number, hook: number, x: number, y: number, up: boolean }[]} mails one per warp end; the end passes through it
 * @property {{ x: number, y: number, w: number, h: number }} comber
 * @property {{ x: number, y: number, w: number, h: number }} head
 * @property {{ x: number, y: number, w: number, h: number }} shuttle
 * @property {Pt[] | null} weft the pick being laid, while it is in the shed
 * @property {{ rest: number, top: number }} shed the lower and upper sheets at the mails; top - rest is the full shed
 * @property {{ x: number, y: number, w: number, h: number }} view
 * @property {number} dot the radius of a warp end's dot
 * @property {number} u how much taller than for a narrow warp the drawing is
 */

/**
 * @param {Snapshot} snap
 * @returns {FrontLayout}
 */
export function frontLayout(snap) {
  const H = snap.deck.hooks;
  const E = endCount(snap.tie, H);
  const width = E * END_PITCH;
  const u = Math.max(1, width / WIDTH_PER_UNIT_HEIGHT);
  const MAIL_Y = 150 * u;
  const COMBER_Y = 250 * u;
  const HOOK_Y = 400 * u;
  const shed = SHED * u;
  const SCALE = shed / FULL_LIFT;
  const SHUTTLE_H = 12 * u;
  const headW = Math.max(width * 0.55, H * 4);
  const hx0 = (width - headW) / 2;
  const hookX = (/** @type {number} */ h) => hx0 + ((h + 0.5) * headW) / H;
  const endX = (/** @type {number} */ e) => (e - 0.5) * END_PITCH;
  const hooks = snap.head.hooks.map((k, h) => ({ hook: h, x: hookX(h), y: HOOK_Y + k.lift * SCALE, lifted: k.lift > 0.5 }));
  const cords = [];
  const mails = [];
  for (let e = 1; e <= E; e++) {
    const h = hookOfEnd(snap.tie, H, e) - 1;
    cords.push({ hook: h, end: e, top: /** @type {Pt} */ ([hooks[h].x, hooks[h].y]), bottom: /** @type {Pt} */ ([endX(e), COMBER_Y + 8 * u]) });
    const lift = snap.endLift[e - 1];
    mails.push({ end: e, hook: h, x: endX(e), y: MAIL_Y + lift * SCALE, up: lift > 0.5 });
  }
  const sx = -BOX + (width + BOX - SHUTTLE_LEN + BOX) * snap.shuttle;
  const shuttle = { x: sx, y: MAIL_Y + shed / 2 - SHUTTLE_H / 2, w: SHUTTLE_LEN, h: SHUTTLE_H };
  const inShed = snap.pendingRow !== null;
  const weftEnd = Math.min(width, Math.max(0, sx + SHUTTLE_LEN / 2));
  /** @type {Pt[] | null} */
  const weft = inShed && snap.shuttle > 0 ? [[0, MAIL_Y + shed / 2], [weftEnd, MAIL_Y + shed / 2]] : null;
  return {
    width,
    hooks,
    cords,
    mails,
    comber: { x: -8, y: COMBER_Y, w: width + 16, h: 8 * u },
    head: { x: hx0 - 10, y: HOOK_Y - 14 * u, w: headW + 20, h: shed + 40 * u },
    shuttle,
    weft,
    shed: { rest: MAIL_Y, top: MAIL_Y + shed },
    view: { x: -BOX - 10, y: MAIL_Y - 60 * u, w: width + 2 * BOX + 20, h: HOOK_Y + shed + 50 * u - (MAIL_Y - 60 * u) },
    dot: Math.min(3, END_PITCH / 4),
    u,
  };
}

const NS = "http://www.w3.org/2000/svg";
/** @param {number} v */
const f = (v) => (Math.round(v * 10) / 10).toString();

export class FrontView {
  /** @param {HTMLElement} host */
  constructor(host) {
    this.svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, "svg"));
    this.svg.setAttribute("class", "front");
    this.svg.setAttribute("role", "img");
        this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    host.appendChild(this.svg);
  }

  /**
   * @param {FrontLayout} L
   * @param {Trace | null} trace
   */
  render(L, trace) {
    this.svg.setAttribute("aria-label", t("front.name"));
    const v = L.view;
    const Y = (/** @type {number} */ y) => -y;
    this.svg.setAttribute("viewBox", `${f(v.x)} ${f(Y(v.y + v.h))} ${f(v.w)} ${f(v.h)}`);
    const fol = (/** @type {number} */ h) => (trace && trace.hook === h ? " follow" : "");
    const out = [];
    // What labels must keep off, over the whole pick (so no label moves mid-pick): the head,
    // the comber board, every cord with its hook down or up, the warp ends and lingoes over
    // the shed, the shed's lines, and the shuttle's path.
    const r = 1.5;
    const up = L.shed.top - L.shed.rest;
    const ends = L.mails.map((m) => m.x);
    const boxes = [
      L.head,
      L.comber,
      { x: -80, y: L.shuttle.y, w: L.width + 160, h: L.shuttle.h },
      { x: Math.min(...ends) - L.dot, y: L.shed.rest - 34 * L.u, w: Math.max(...ends) - Math.min(...ends) + 2 * L.dot, h: L.comber.y - (L.shed.rest - 34 * L.u) },
    ];
    const segs = [
      ...L.cords.flatMap((c) => {
        const down = c.top[1] - (L.hooks[c.hook].lifted ? up : 0);
        return [
          { a: /** @type {Pt} */ ([c.top[0], down]), b: c.bottom, r },
          { a: /** @type {Pt} */ ([c.top[0], down + up]), b: c.bottom, r },
        ];
      }),
      { a: /** @type {Pt} */ ([v.x, L.shed.rest]), b: /** @type {Pt} */ ([v.x + v.w, L.shed.rest]), r: 1 },
      { a: /** @type {Pt} */ ([v.x, L.shed.top]), b: /** @type {Pt} */ ([v.x + v.w, L.shed.top]), r: 1 },
    ];
    const labels = new LabelPlacer(screenFrame(v, this.svg.clientWidth, this.svg.clientHeight), { boxes, segs });
    const fs = labels.size;
    out.push(`<rect class="head-box" x="${f(L.head.x)}" y="${f(Y(L.head.y + L.head.h))}" width="${f(L.head.w)}" height="${f(L.head.h)}" rx="4"/>`);
    for (const c of L.cords) out.push(`<line class="cord${fol(c.hook)}" data-end="${c.end}" x1="${f(c.top[0])}" y1="${f(Y(c.top[1]))}" x2="${f(c.bottom[0])}" y2="${f(Y(c.bottom[1]))}"/>`);
    out.push(`<rect class="wood" x="${f(L.comber.x)}" y="${f(Y(L.comber.y + L.comber.h))}" width="${f(L.comber.w)}" height="${f(L.comber.h)}"/>`);
    for (const m of L.mails) {
      out.push(`<line class="cord${fol(m.hook)}" data-end="${m.end}" x1="${f(m.x)}" y1="${f(Y(L.comber.y))}" x2="${f(m.x)}" y2="${f(Y(m.y + 4))}"/>`);
      out.push(`<line class="lingo${fol(m.hook)}" data-end="${m.end}" x1="${f(m.x)}" y1="${f(Y(m.y - 5))}" x2="${f(m.x)}" y2="${f(Y(m.y - 34 * L.u))}"/>`);
    }
    out.push(`<line class="shed" x1="${f(v.x)}" y1="${f(Y(L.shed.rest))}" x2="${f(v.x + v.w)}" y2="${f(Y(L.shed.rest))}"/>`);
    out.push(`<line class="shed" x1="${f(v.x)}" y1="${f(Y(L.shed.top))}" x2="${f(v.x + v.w)}" y2="${f(Y(L.shed.top))}"/>`);
    if (L.weft) out.push(`<line class="weft" x1="${f(L.weft[0][0])}" y1="${f(Y(L.weft[0][1]))}" x2="${f(L.weft[1][0])}" y2="${f(Y(L.weft[1][1]))}"/>`);
    const s = L.shuttle;
    out.push(`<rect class="shuttle" x="${f(s.x)}" y="${f(Y(s.y + s.h))}" width="${f(s.w)}" height="${f(s.h)}" rx="${f(s.h / 2)}"/>`);
    for (const m of L.mails) {
      const traced = trace && trace.end === m.end ? " traced" : "";
      out.push(`<circle class="end${m.up ? " up" : ""}${fol(m.hook)}${traced}" data-end="${m.end}" cx="${f(m.x)}" cy="${f(Y(m.y))}" r="${f(L.dot)}"/>`);
    }
    for (const h of L.hooks) out.push(`<rect class="hookmark${h.lifted ? " up" : ""}${fol(h.hook)}" data-hook="${h.hook}" x="${f(h.x - 2)}" y="${f(Y(h.y + 18 * L.u))}" width="4" height="${f(18 * L.u)}"/>`);
    const left = v.x + fs * 0.3;
    const right = L.width + fs * 0.5;
    out.push(labels.placeAt(t("part.hooks"), [[L.head.x + L.head.w + fs * 0.4, L.head.y + L.head.h / 2 - fs * 0.35], [L.head.x - fs * 0.4, L.head.y + L.head.h / 2 - fs * 0.35, "end"]]));
    out.push(labels.placeAt(t("part.comberBoard"), [[left, L.comber.y + L.comber.h + fs * 0.4], [left, L.comber.y - fs * 1.2], [right, L.comber.y + L.comber.h + fs * 0.4]]));
    out.push(labels.placeAt(t("part.up"), [[left, L.shed.top + fs * 0.4], [right, L.shed.top + fs * 0.4]]));
    out.push(labels.placeAt(t("part.down"), [[left, L.shed.rest - fs * 1.2], [right, L.shed.rest - fs * 1.2]]));
    this.svg.innerHTML = out.join("");
  }
}
