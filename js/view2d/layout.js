// The 2D section of the head, as shapes: state in, positions out, in the params frame
// (mm; x along the needles from the needle board's face, y up from the top of the bottom
// board). Nothing here draws: sectionView.js turns these shapes into SVG, and the
// acceptance checks measure them. So what the tests check is exactly what is drawn.
//
// The section cuts through one cross-row of the head: its 8 needles in their tiers,
// their 8 hooks (one over each knife), the knives, the card cylinder, and below the
// bottom board the hooks' harness down to the mails and lingoes, shortened (the real
// harness is about a metre: research section 3).

import { cardForPick, cardIndexForPick } from "../sim/deck.js";
import { GRATE_Y, hookX, KNIFE_REST_TOP, KNIFE_RIGHT, needleY } from "../sim/head.js";
import { P } from "../sim/params.js";
/** @import { Snapshot } from "../sim/loom.js" */

/** @typedef {[number, number]} Pt */
/** @typedef {{ x: number, y: number, w: number, h: number }} Rect lower-left corner, width, height */

/** Length (mm) of the bend drawn between the grate and a hook's shifted upper part. */
export const BEND = 30;
/** Where a hook held by a knife starts to bend (mm, above the bottom board): just above the top needle. */
export const UPPER_BEND_Y = P.topTierY + 15;
/** How far (mm) the rester leg stands beside the shank. */
export const RESTER_OFFSET = 3.2;
/** Where the harness is broken off in the drawing (mm, y range). */
export const BREAK = /** @type {[number, number]} */ ([-P.bottomBoardThickness - P.drawnCordLength, -P.bottomBoardThickness - P.drawnCordLength - 14]);

const COMBER_TOP = BREAK[1] - 14;
const MAIL_REST_Y = COMBER_TOP - P.comberThickness - P.drawnMailDrop;
const LINGO_DRAWN = P.lingoLength / 3;

/**
 * @typedef {object} HookShape
 * @property {number} k its row in the cross-row, 0-based: the needle tier and the knife
 * @property {number} hook the hook's number in the head, 0-based (hook + 1 is its name)
 * @property {Pt[]} shank the centre line from the foot up through the bend to the crook's tip
 * @property {Pt[]} rester the turned-up lower leg
 * @property {Pt} crookStart where the crook leaves the shank (centre line)
 * @property {Pt} crookEnd the crook's far end over the knife (centre line)
 * @property {Pt} tipEnd the bottom of the crook's downturned tip (centre line)
 * @property {number} wire the wire's diameter
 * @property {boolean} selected
 * @property {boolean} caught
 * @property {number} lift
 * @property {number} shift how far it stands aside at its needle (the needle's push)
 * @property {number} deflect how much further its crook stands aside, bent by a knife
 */

/**
 * @typedef {object} NeedleShape
 * @property {number} k its tier, 0-based from the top
 * @property {number} hook the hook it serves, 0-based
 * @property {number} y
 * @property {number} head x of the head (the end at the cylinder)
 * @property {number} tail x of the rear end, in the spring box
 * @property {[number, number]} eye x range of the eye around its hook
 * @property {number} push
 */

/**
 * @typedef {object} CardShape
 * @property {number} offset chain position relative to this pick's card (-1, 0, 1, 2)
 * @property {number} index chain index of the card
 * @property {Pt[][]} solid the pasteboard between holes, as segments along the card's outer face
 * @property {Pt[]} holes centres of the punched holes
 * @property {boolean} facing whether this card faces the needles
 */

/**
 * One face of the square card cylinder and the card lying on it. The chain lies over the
 * prism in order (Posselt 1887, Fig. I: the forward catch "will turn the card situated on its
 * top towards the needle-board"): the face at the needles carries the card on the needles;
 * the top face the next card, which comes round to the needles as the prism turns clockwise
 * in the drawing; the outer face the one after it. The face underneath is bare: the cards
 * already read hang below the needle face (offset -1 names it).
 * @typedef {object} CylinderFace
 * @property {number} offset the card's place in the chain relative to this pick's card: -1, 0, 1 or 2
 * @property {number | null} index the chain index of the card on it, or null: no card there (an open chain's ends)
 * @property {boolean} facing whether this face is the one at the needles now
 * @property {Pt} normal the face's outward direction (a unit vector)
 * @property {Pt[]} strip the card, drawn on the face (thickened inward so its outer side stays true), as a polygon; empty for a bare face
 * @property {{ at: Pt, punched: boolean }[]} marks every hole position of the card on this face, in the needles' order: punched or blank
 * @property {Pt[]} dots the punched ones among the marks
 * @property {Pt[]} bores a bare face's bored holes (the prism's own, under where a card would lie)
 * @property {[Pt, Pt]} edge the face's outer edge
 * @property {Pt} label where the card's number goes, inside the prism near the face
 */

/**
 * @typedef {object} SectionLayout
 * @property {HookShape[]} hooks
 * @property {NeedleShape[]} needles
 * @property {number} crossRow which cross-row of the head the section cuts (0-based); its hooks are 8 x crossRow + 1 … + 8
 * @property {{ k: number, hook: number, x0: number, x1: number, y: number }[]} springs
 * @property {(Rect & { k: number, hook: number })[]} knives
 * @property {Rect} griffe the griffe's end frame, seen behind the knives
 * @property {Rect} plunger
 * @property {{ centre: Pt, half: number, angle: number, corners: Pt[], bores: Pt[], out: number }} cylinder angle in degrees, counter-clockwise (the forward turn is clockwise, so it goes from 0 to -90 in a pick); out: how far it has moved out from the needle board (mm)
 * @property {CardShape[]} cards
 * @property {CylinderFace[]} faces all four, whether or not a card lies on them
 * @property {ChainNearCylinder} chain the cards of the chain near the cylinder: on its faces and hanging from it
 * @property {{ bottom: Rect, needle: Rect, springBox: Rect, comber: Rect }} boards
 * @property {{ k: number, hook: number, top: Pt, bottom: Pt }[]} neckCords
 * @property {{ k: number, hook: number, top: Pt, bottom: Pt }[]} harnessCords
 * @property {{ k: number, hook: number, centre: Pt, up: boolean }[]} mails
 * @property {(Rect & { k: number, hook: number })[]} lingoes
 * @property {[number, number]} breakY
 * @property {{ rest: number, top: number }} shed y of the lower and upper shed lines at the mails
 * @property {Record<"whole" | "needles" | "crooks", Rect>} views
 */

/**
 * @param {Pt} c
 * @param {number} a angle in radians
 * @param {number} r
 * @returns {Pt}
 */
const polar = (c, a, r) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];

/**
 * One card of the chain near the cylinder. Its two ends are where it is laced to its
 * neighbours: `hi` to the card after it in the chain (offset + 1), `lo` to the card before
 * it (offset - 1). Hole 1 is at the `hi` end: on the needle face it is the top edge, laced to
 * the next card lying on top, level with needle 1.
 * @typedef {object} ChainCard
 * @property {number} offset its place in the chain relative to this pick's card
 * @property {number} index its chain index
 * @property {number | null} face the face it rides (that face's offset), or null: it hangs from the cylinder
 * @property {Pt} hi
 * @property {Pt} lo
 * @property {Pt[]} strip the card as drawn: a strip along hi-lo, thickened toward the cylinder's side
 * @property {{ at: Pt, punched: boolean }[]} marks its 8 hole positions in this cross-row, hole 1 first
 * @property {Pt} label where its number goes inside the cylinder, while the card lies on a face
 * @property {Pt} labelOut where its number goes outside, while it hangs
 * @property {number} outside how far its number has moved outside, 0 to 1 (crossfaded, so it never jumps)
 * @property {number} opacity 1 near the cylinder, fading to 0 where the drawing stops showing the chain
 * @property {boolean} facing whether it is the card at the needles
 */

/**
 * @typedef {object} ChainNearCylinder
 * @property {"wrap" | "strands"} mode wrap: a loop of 4 cards or fewer covers all four faces; strands: the chain lies over the cylinder and hangs from it on both sides
 * @property {ChainCard[]} cards
 * @property {{ at: Pt, opacity: number }[]} laces where two drawn cards are laced together
 * @property {Pt[][]} more dashed lines for the rest of the chain, not drawn card by card
 * @property {number} reach how far along each strand cards are drawn, in cards (the fade ends there)
 */

/** How thick a card is drawn, so its hole marks fit on it (its real thickness is P.cardThickness). */
export const DRAWN_CARD = 6.4;
/** How far along a strand cards are drawn at most, in cards. */
const REACH = 2;

/**
 * The chain near the cylinder, as Posselt's Fig. I has it. The chain lies over the prism: the
 * card at the needles on the needle face, the next card on the top face, the one after it
 * down the outer face; the cards still to come hang straight down from the outer face's lower
 * corner, and the cards already read hang straight down below the needle face, into the
 * folding frame. Nothing lies on the face underneath: a card there would have nothing to hold
 * it up.
 *
 * In the forward turn the prism turns a quarter clockwise (in the drawing, needles on the
 * right): the cards on the top and outer faces ride round with their faces, the next card
 * coming to the needles; the card that was at the needles swings off its face as the face
 * turns under, hanging from its upper corner, and the read strand hangs from that corner as
 * it comes down; the incoming strand hangs from the outer face's lower corner as it rises,
 * and its first card lies onto the outer face as that face comes round. Only a few cards are
 * drawn on each strand, fading out; the rest of the chain is a dashed line (a dashed loop for
 * a closed chain). The chain list beside the drawing shows every card.
 *
 * A closed loop of 4 cards or fewer cannot hang: it is a belt round all four faces (one card
 * on each, repeated if there are fewer than 4).
 * @param {Snapshot} snap
 * @param {Pt} centre
 * @param {Pt[]} corners at 45, 135, 225, 315 degrees + theta
 * @param {number[]} us the needles' heights relative to the prism's centre
 * @param {number} base the first hook of the cross-row
 * @returns {ChainNearCylinder}
 */
function chainNearCylinder(snap, centre, corners, us, base) {
  const { deck, pick, head } = snap;
  const N = deck.cards.length;
  const L = P.cylinderFace; // the chain's pitch: one card per face
  const half = L / 2;
  const hw = Math.min(P.cardWidth / 2, half - DRAWN_CARD + 0.2);
  const facingOffset = head.nextFacing ? 1 : 0;
  const wrap = deck.loop && N <= 4;
  /** @type {ChainCard[]} */
  const cards = [];

  /**
   * @param {number} offset
   * @param {Pt} hi
   * @param {Pt} lo
   * @param {number | null} face
   * @param {number} opacity
   * @param {number} [outside] 0: the number goes inside (the card lies on a face), 1: outside (it hangs)
   */
  const add = (offset, hi, lo, face, opacity, outside = face === null ? 1 : 0) => {
    const card = cardForPick(deck, pick + offset);
    const index = cardIndexForPick(deck, pick + offset);
    if (!card || index === null || opacity <= 0.001) return;
    const len = Math.hypot(lo[0] - hi[0], lo[1] - hi[1]);
    const v = /** @type {Pt} */ ([(lo[0] - hi[0]) / len, (lo[1] - hi[1]) / len]); // along the chain, toward the card before
    const nl = /** @type {Pt} */ ([v[1], -v[0]]); // the cylinder's side of the chain
    const m = /** @type {Pt} */ ([(hi[0] + lo[0]) / 2, (hi[1] + lo[1]) / 2]);
    /** @param {number} a @param {number} b @returns {Pt} */
    const at = (a, b) => [m[0] + v[0] * a + nl[0] * b, m[1] + v[1] * a + nl[1] * b];
    cards.push({
      offset,
      index,
      face,
      hi,
      lo,
      strip: [at(-hw, 0), at(hw, 0), at(hw, DRAWN_CARD), at(-hw, DRAWN_CARD)],
      marks: us.map((_u, k) => ({ at: at((k - 3.5) * P.tierPitch, DRAWN_CARD / 2), punched: card[base + k] })),
      label: at(0, DRAWN_CARD + 9),
      labelOut: at(0, -9),
      outside,
      opacity,
      facing: offset === facingOffset,
    });
  };

  const [c0, c1, c2, c3] = corners; // upper needle-side, upper outer, lower outer, lower needle-side at rest
  /** @type {Pt[][]} */
  const more = [];
  if (wrap) {
    // A belt round the prism: every card rides its face.
    add(1, c1, c0, 1, 1);
    add(0, c0, c3, 0, 1);
    add(-1, c3, c2, -1, 1);
    add(2, c2, c1, 2, 1);
    return { mode: "wrap", cards, laces: lacesOf(cards), more, reach: 0 };
  }

  // How far the turn has carried the chain on, in cards: the needle face's upper corner comes
  // down by one face as the prism turns a quarter, and the outer face's lower corner goes up by one.
  const s = (centre[1] + half - c0[1]) / L;
  // How far each strand is drawn: in a closed loop, never so far that one card would show on
  // both strands at once (it travels round the hidden part of the loop between them).
  const reach = deck.loop ? Math.min(REACH, (N - 4) / 2) : REACH;
  const fade = Math.min(1, reach);
  /** @param {number} u a card's place along its strand, in cards */
  const opacityAt = (u) => Math.max(0, Math.min(1, (reach - u) / fade));
  // The fades follow the turn itself (evenly paced), the places the corners (one card a turn).
  const t = head.turn;

  // The next card on top, the one after it down the outer face: they ride their faces.
  add(1, c1, c0, 1, 1);
  add(2, c2, c1, 2, 1);
  // The card at the needles, and below it the cards already read, hanging from the needle
  // face's upper corner (at rest the first of them lies on the needle face).
  for (let k = 0; k + t < reach; k++) {
    const onFace = k === 0 && s < 1e-9;
    add(-k, [c0[0], c0[1] - k * L], [c0[0], c0[1] - (k + 1) * L], onFace ? 0 : null, opacityAt(k + t), k === 0 ? s : 1);
  }
  // The cards to come, hanging from the outer face's lower corner (the first of them lies
  // onto the outer face as the turn ends).
  for (let j = 0; j + 1 - t < reach; j++) add(3 + j, [c2[0], c2[1] - (j + 1) * L], [c2[0], c2[1] - j * L], null, opacityAt(j + 1 - t), j === 0 ? 1 - s : 1);

  // The rest of the chain, as dashed lines from where the strands fade out: they follow the
  // corners the strands hang from across the drawing, but stay at one height.
  const shown = Math.max(1, Math.ceil(reach));
  const outEnd = /** @type {Pt} */ ([c0[0], centre[1] - half - shown * L]);
  const outTail = /** @type {Pt} */ ([outEnd[0], outEnd[1] - 0.7 * L]);
  const inEnd = /** @type {Pt} */ ([c2[0], centre[1] - half - shown * L]);
  const inTail = /** @type {Pt} */ ([inEnd[0], inEnd[1] - 0.7 * L]);
  const hiddenRead = cardIndexForPick(deck, pick - 1 - Math.ceil(reach)) !== null;
  const hiddenToCome = cardIndexForPick(deck, pick + 3 + Math.ceil(reach)) !== null;
  if (deck.loop && N > 4) {
    // A closed loop: the two strands join below, out of the drawing.
    const bottom = Math.min(outTail[1], inTail[1]) - 0.6 * L;
    const loop = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = (1 - u) ** 3 * outTail[0] + 3 * (1 - u) ** 2 * u * outTail[0] + 3 * (1 - u) * u * u * inTail[0] + u ** 3 * inTail[0];
      const y = (1 - u) ** 3 * outTail[1] + 3 * (1 - u) ** 2 * u * bottom + 3 * (1 - u) * u * u * bottom + u ** 3 * inTail[1];
      loop.push(/** @type {Pt} */ ([x, y]));
    }
    more.push([outEnd, outTail], [inEnd, inTail], loop);
  } else {
    if (hiddenRead) more.push([outEnd, outTail]);
    if (hiddenToCome) more.push([inEnd, inTail]);
  }
  return { mode: "strands", cards, laces: lacesOf(cards), more, reach };
}

/**
 * The lacings between drawn cards next to each other in the chain.
 * @param {ChainCard[]} cards
 * @returns {{ at: Pt, opacity: number }[]}
 */
function lacesOf(cards) {
  const out = [];
  for (const c of cards) {
    const prev = cards.find((x) => x.offset === c.offset - 1);
    if (prev) out.push({ at: c.lo, opacity: Math.min(c.opacity, prev.opacity) });
  }
  return out;
}


/**
 * The section through one cross-row at the snapshot's moment. A head of 8 x c hooks has c
 * cross-rows; hook h (1-based) is in cross-row ceil(h / 8), at row ((h - 1) mod 8) + 1, and
 * its hole is in the same column and row of the card (research section 4).
 * @param {Snapshot} snap
 * @param {number} [crossRow] 0-based
 * @returns {SectionLayout}
 */
export function sectionLayout(snap, crossRow = 0) {
  const { head, deck } = snap;
  const rows = P.rows;
  const base = crossRow * rows;
  if (base < 0 || base + rows > deck.hooks) throw new RangeError(`no cross-row ${crossRow + 1} in a ${deck.hooks}-hook head`);
  const part = head.hooks.slice(base, base + rows);
  const wire = P.hookWire;
  const crookY = P.hookHeight - wire / 2;

  /** @type {HookShape[]} */
  const hooks = part.map((h, k) => {
    const x = hookX(k);
    const L = h.lift;
    const s = h.shift;
    const top = s + h.deflect;
    const crookStart = /** @type {Pt} */ ([x + top, L + crookY]);
    const crookEnd = /** @type {Pt} */ ([x + top - P.crookOverhang, L + crookY]);
    const tipEnd = /** @type {Pt} */ ([x + top - P.crookOverhang, L + crookY - P.crookTipDrop]);
    return {
      k,
      hook: base + k,
      shank: [[x, L], [x, L + GRATE_Y], [x + s, L + GRATE_Y + BEND], [x + s, L + UPPER_BEND_Y], crookStart, crookEnd, tipEnd],
      rester: [[x, L], [x + RESTER_OFFSET, L], [x + RESTER_OFFSET, L + P.resterHeight]],
      crookStart,
      crookEnd,
      tipEnd,
      wire,
      selected: h.selected,
      caught: h.caught,
      lift: L,
      shift: s,
      deflect: h.deflect,
    };
  });

  /** @type {NeedleShape[]} */
  const needles = head.needlePush.slice(base, base + rows).map((push, k) => {
    const headX = -P.needleProtrusion + push;
    const eyeC = hookX(k) + push;
    return { k, hook: base + k, y: needleY(k), head: headX, tail: headX + P.needleLength, eye: [eyeC - P.needleEye / 2, eyeC + P.needleEye / 2], push };
  });

  const springs = needles.map((n) => ({ k: n.k, hook: n.hook, x0: n.tail, x1: P.springBoxBack, y: n.y }));

  const knifeTop = KNIFE_REST_TOP + head.griffe;
  const knives = part.map((_h, k) => ({
    k,
    hook: base + k,
    x: hookX(k) + KNIFE_RIGHT - P.knifeThickness,
    y: knifeTop - P.knifeHeight,
    w: P.knifeThickness,
    h: P.knifeHeight,
  }));
  const gx0 = hookX(0) - 24;
  const gx1 = hookX(rows - 1) + 14;
  const griffe = { x: gx0, y: knifeTop - P.knifeHeight - 10, w: gx1 - gx0, h: P.knifeHeight + 16 };
  const plunger = { x: (gx0 + gx1) / 2 - 9.5, y: griffe.y + griffe.h, w: 19, h: 90 };

  // The cylinder: a square prism on its batten, out by cylinderOut, turned by turn x 90 deg.
  const half = P.cylinderFace / 2;
  const tierMid = needleY((rows - 1) / 2);
  const centre = /** @type {Pt} */ ([-P.cardThickness - half - head.cylinderOut, tierMid]);
  // The forward turn is clockwise in the drawing: the top face comes round to the needles.
  const theta = -head.turn * Math.PI / 2;
  const corners = [0, 1, 2, 3].map((i) => polar(centre, theta + Math.PI / 4 + (i * Math.PI) / 2, half * Math.SQRT2));
  const drawnCard = DRAWN_CARD;
  // The holes bored in every face, level with the needles when that face looks at them.
  const us = needles.map((nd) => nd.y - tierMid);
  /** @type {Pt[]} */
  const bores = [];
  /** @type {CylinderFace[]} */
  const faces = [];
  for (const offset of [-1, 0, 1, 2]) {
    const a = theta + (offset * Math.PI) / 2; // the face's outward normal: 0 at the needles, 1 on top, 2 outer, -1 underneath
    const n = /** @type {Pt} */ ([Math.cos(a), Math.sin(a)]);
    const t = /** @type {Pt} */ ([-n[1], n[0]]);
    /** @param {number} u @param {number} r @returns {Pt} */
    const on = (u, r) => [centre[0] + n[0] * r + t[0] * u, centre[1] + n[1] * r + t[1] * u];
    for (const u of us) bores.push(on(u, half));
    faces.push({ offset, index: null, facing: false, normal: n, strip: [], marks: [], dots: [], bores: us.map((u) => on(u, half - 2.5)), edge: [on(-half, half), on(half, half)], label: on(0, half - drawnCard - 9) });
  }

  const chain = chainNearCylinder(snap, centre, corners, us, base);
  // The cards riding the faces, and the face at the needles.
  for (const c of chain.cards) {
    if (c.face === null) continue;
    const face = /** @type {CylinderFace} */ (faces.find((f) => f.offset === c.face));
    Object.assign(face, { index: c.index, facing: c.facing, strip: c.strip, marks: c.marks, dots: c.marks.filter((m) => m.punched).map((m) => m.at), bores: [], label: c.label });
  }
  const facingOffset = head.nextFacing ? 1 : 0;
  for (const f of faces) f.facing = f.offset === facingOffset && f.index !== null;
  /** @type {CardShape[]} */
  const cards = chain.cards
    .filter((c) => c.face !== null)
    .map((c) => ({ offset: c.offset, index: c.index, solid: [], holes: c.marks.filter((m) => m.punched).map((m) => m.at), facing: c.facing }));

  const tierTop = needleY(0);
  const tierBottom = needleY(rows - 1);
  const boards = {
    bottom: { x: hookX(0) - 34, y: -P.bottomBoardThickness, w: hookX(rows - 1) - hookX(0) + 60, h: P.bottomBoardThickness },
    needle: { x: 0, y: tierMid - P.needleBoardHeight / 2, w: P.needleBoardThickness, h: P.needleBoardHeight },
    springBox: { x: P.springBoxInner, y: tierBottom - 12, w: P.springBoxBack - P.springBoxInner + 8, h: tierTop - tierBottom + 24 },
    comber: { x: hookX(0) - 34, y: COMBER_TOP - P.comberThickness, w: hookX(rows - 1) - hookX(0) + 60, h: P.comberThickness },
  };

  const neckCords = hooks.map((h) => ({ k: h.k, hook: h.hook, top: /** @type {Pt} */ ([h.shank[0][0], h.lift]), bottom: /** @type {Pt} */ ([h.shank[0][0], BREAK[0] + h.lift]) }));
  const harnessCords = hooks.map((h) => ({ k: h.k, hook: h.hook, top: /** @type {Pt} */ ([h.shank[0][0], BREAK[1] + h.lift]), bottom: /** @type {Pt} */ ([h.shank[0][0], MAIL_REST_Y + 5 + h.lift]) }));
  const mails = hooks.map((h) => ({ k: h.k, hook: h.hook, centre: /** @type {Pt} */ ([h.shank[0][0], MAIL_REST_Y + h.lift]), up: h.lift > 1 }));
  const lingoes = hooks.map((h) => ({ k: h.k, hook: h.hook, x: h.shank[0][0] - 1.8, y: MAIL_REST_Y - 20 - LINGO_DRAWN + h.lift, w: 3.6, h: LINGO_DRAWN }));

  const x0 = -150;
  const x1 = P.springBoxBack + 20;
  const yTop = P.hookHeight + P.griffeLift + 110;
  const yBottom = MAIL_REST_Y - 20 - LINGO_DRAWN - 10;
  return {
    crossRow,
    hooks,
    needles,
    springs,
    knives,
    griffe,
    plunger,
    cylinder: { centre, half, angle: -head.turn * 90, corners, bores, out: head.cylinderOut },
    cards,
    faces,
    chain,
    boards,
    neckCords,
    harnessCords,
    mails,
    lingoes,
    breakY: BREAK,
    shed: { rest: MAIL_REST_Y, top: MAIL_REST_Y + P.griffeLift - P.restGap },
    views: {
      whole: { x: x0, y: yBottom, w: x1 - x0, h: yTop - yBottom },
      needles: { x: -175, y: tierMid - 215, w: 290, h: 300 },
      crooks: { x: hookX(0) - 40, y: KNIFE_REST_TOP - P.knifeHeight - 20, w: hookX(rows - 1) - hookX(0) + 70, h: P.griffeLift + P.knifeHeight + 60 },
    },
  };
}
