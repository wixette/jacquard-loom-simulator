// The loom as a machine: the chain of cards, the tie-up, which pick it is weaving and how
// far through it, and the cloth woven so far. The views ask it for a snapshot and draw
// that; they change it only through these methods.
//
// Pick p (0-based) is woven from card p of the chain. At rest between picks, card p is
// pressed against the needles. During the pick the cylinder swings out, turns, and
// presses card p + 1. The row joins the cloth when the batten beats it up; stepping back
// past that moment takes it out again, so reversing unweaves exactly. (The real loom's
// reverse cord turns the cylinder back for the next lift, which weaves the previous
// card again; the page names this simplification.)

import { beaten, battenSwing, shuttleAcross, weftInShed } from "./cycle.js";
import { cardForPick, cardIndexForPick } from "./deck.js";
import { headState } from "./head.js";
import { P } from "./params.js";
import { endCount, hookOfEnd, rowOfCard, STRAIGHT } from "./tieup.js";
/** @import { Deck } from "./deck.js" */
/** @import { HeadState } from "./head.js" */
/** @import { Tie } from "./tieup.js" */

/** The step stops within a pick, as fractions of the pick; 1 is the next pick's start. */
export const STOPS = P.stops;

/** What each stop shows, in order (the last is also where the next pick starts). */
export const STOP_NAMES = ["Hooks taken", "Shed open", "Shuttle across", "Beaten up", "Shed closed", "Next card pressed"];

/**
 * The moments a pick can be left at between steps: 0 is at rest (its card pressed), then the
 * stops up to "shed closed". A link names them by index (js/sim/link.js, field s).
 */
export const POSITIONS = [0, ...STOPS.slice(0, -1)];

const EPS = 1e-9;

/**
 * @typedef {object} Snapshot
 * @property {number} pick the pick being woven (0-based)
 * @property {number} phi how far through it, 0 to 1
 * @property {Deck} deck
 * @property {Tie} tie
 * @property {number | null} cardIndex the chain index of this pick's card
 * @property {number | null} nextIndex the chain index of the next card (null: the chain has run out)
 * @property {number | null} facingIndex the chain index of the card facing the needles now
 * @property {HeadState} head
 * @property {number[]} endLift how far each warp end is lifted (mm), by its hook
 * @property {boolean[][]} cloth the rows woven so far, first pick first; true = warp over weft
 * @property {boolean[] | null} pendingRow this pick's row while its weft is in the shed, not yet beaten up
 * @property {number} shuttle 0 to 1 across the shed
 * @property {number} batten -1 back, 0 rest, 1 striking
 */

/**
 * @typedef {{ ok: true, message: string } | { ok: false, reason: string }} StepResult
 */

/**
 * @param {Deck} deck
 * @param {number} pick
 * @returns {boolean[]}
 */
function selectionFor(deck, pick) {
  // A missing card is an empty cylinder face: every needle goes into a hole, every hook rises.
  return cardForPick(deck, pick) ?? new Array(deck.hooks).fill(true);
}

/**
 * The hooks (1-based) a card lifts.
 * @param {boolean[] | null} card
 * @param {number} hooks
 * @returns {number[]}
 */
const liftedHooks = (card, hooks) => [...Array(hooks).keys()].filter((k) => !card || card[k]).map((k) => k + 1);

/**
 * Numbers in words: "4", "4 and 5", "1, 4 and 8"; more than a dozen are counted instead.
 * @param {number[]} xs
 */
const list = (xs) => (xs.length === 0 ? "none" : xs.length === 1 ? `${xs[0]}` : xs.length > 12 ? `(${xs.length} of them)` : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export class Loom {
  /**
   * @param {Deck} deck
   * @param {Tie} [tie]
   */
  constructor(deck, tie = STRAIGHT) {
    /** @type {Deck} */
    this.deck = deck;
    /** @type {Tie} */
    this.tie = tie;
    this.pick = 0;
    this.phi = 0;
    /** @type {boolean[][]} */
    this.cloth = [];
  }

  /** Back to the first card, no cloth. */
  reset() {
    this.pick = 0;
    this.phi = 0;
    this.cloth = [];
  }

  /**
   * New cards. The cloth already woven stays as it was woven; the machine goes on from where it is.
   * @param {Deck} deck
   */
  setDeck(deck) {
    if (deck.hooks !== this.deck.hooks) throw new Error("a new deck must fit the same head");
    this.deck = deck;
  }

  /**
   * A new tie-up changes the width of the warp, so the loom starts again.
   * @param {Tie} tie
   */
  setTie(tie) {
    this.tie = tie;
    this.reset();
  }

  /**
   * Whether the next pick can start from rest, and if not, why.
   * @returns {{ ok: true } | { ok: false, reason: string }}
   */
  canStart() {
    const n = this.deck.cards.length;
    if (n === 0) return { ok: false, reason: "There are no cards in the chain: add a card." };
    if (cardForPick(this.deck, this.pick) === null) {
      return { ok: false, reason: `The chain has run out after ${n} card${n === 1 ? "" : "s"}: close the loop, add cards, or step back.` };
    }
    return { ok: true };
  }

  /** @returns {Snapshot} */
  snapshot() {
    const { deck, tie, pick, phi } = this;
    const selection = selectionFor(deck, pick);
    const head = headState(selection, cardForPick(deck, pick + 1), phi);
    const ends = endCount(tie, deck.hooks);
    const endLift = [];
    for (let e = 1; e <= ends; e++) endLift.push(head.hooks[hookOfEnd(tie, deck.hooks, e) - 1].lift);
    const cardIndex = cardIndexForPick(deck, pick);
    const nextIndex = cardIndexForPick(deck, pick + 1);
    return {
      pick,
      phi,
      deck,
      tie,
      cardIndex,
      nextIndex,
      facingIndex: head.nextFacing ? nextIndex : cardIndex,
      head,
      endLift,
      cloth: this.cloth,
      pendingRow: weftInShed(phi) ? rowOfCard(tie, cardForPick(deck, pick), deck.hooks) : null,
      shuttle: shuttleAcross(phi),
      batten: battenSwing(phi),
    };
  }

  /**
   * Moves to a moment, weaving or unweaving the rows passed on the way.
   * @param {number} pick
   * @param {number} phi
   */
  moveTo(pick, phi) {
    if (phi >= 1 - EPS) {
      pick += 1;
      phi = 0;
    }
    this.pick = pick;
    this.phi = Math.max(0, phi);
    const t = pick + this.phi;
    const beat = P.beat[1];
    const rows = t + EPS >= beat ? Math.floor(t - beat + EPS) + 1 : 0;
    while (this.cloth.length > rows) this.cloth.pop();
    while (this.cloth.length < rows) {
      const r = this.cloth.length;
      this.cloth.push(rowOfCard(this.tie, cardForPick(this.deck, r), this.deck.hooks));
    }
  }

  /**
   * Turns the loom on to the next step stop.
   * @returns {StepResult}
   */
  stepForward() {
    if (this.phi < EPS) {
      const can = this.canStart();
      if (!can.ok) return can;
    }
    const i = STOPS.findIndex((s) => s > this.phi + EPS);
    const pick = this.pick;
    this.moveTo(pick, STOPS[i]);
    return { ok: true, message: this.stopMessage(i, pick) };
  }

  /**
   * Turns the loom back to the previous step stop.
   * @returns {StepResult}
   */
  stepBack() {
    if (this.phi < EPS) {
      if (this.pick === 0) return { ok: false, reason: "This is the start: nothing has been woven yet." };
      this.moveTo(this.pick - 1, STOPS[STOPS.length - 2]);
      return { ok: true, message: `Back: ${STOP_NAMES[STOPS.length - 2].toLowerCase()} of pick ${this.pick + 1}; the next card is off the needles again.` };
    }
    const before = [0, ...STOPS.slice(0, -1)].filter((s) => s < this.phi - EPS);
    const to = before[before.length - 1];
    const wasBeaten = beaten(this.phi);
    this.moveTo(this.pick, to);
    const name = to === 0 ? "at rest before the pick" : STOP_NAMES[STOPS.indexOf(to)].toLowerCase();
    return { ok: true, message: `Back: ${name} of pick ${this.pick + 1}${wasBeaten && !beaten(to) ? "; its row is out of the cloth again" : ""}.` };
  }

  /**
   * Runs the loom on by dphi (for playing). Stops at the end of a pick when the next one
   * cannot start, and says why.
   * @param {number} dphi
   * @returns {{ ok: true } | { ok: false, reason: string }}
   */
  advance(dphi) {
    if (this.phi < EPS) {
      const can = this.canStart();
      if (!can.ok) return can;
    }
    const phi = this.phi + dphi;
    if (phi >= 1) this.moveTo(this.pick, 1);
    else this.moveTo(this.pick, phi);
    return { ok: true };
  }

  /**
   * What happened at stop i of pick `pick`.
   * @param {number} i
   * @param {number} pick
   * @returns {string}
   */
  stopMessage(i, pick) {
    const hooks = this.deck.hooks;
    const card = cardForPick(this.deck, pick);
    const next = cardForPick(this.deck, pick + 1);
    const n = pick + 1;
    const lifted = liftedHooks(card, hooks);
    switch (i) {
      case 0:
        if (lifted.length === 0) return `Hooks taken: none. Card ${(cardIndexForPick(this.deck, pick) ?? 0) + 1} has no holes, so every needle and hook was pushed off the knives.`;
        return `Hooks taken: the knives have caught hook${lifted.length === 1 ? "" : "s"} ${list(lifted)}, whose needle${lifted.length === 1 ? "" : "s"} went into holes in card ${(cardIndexForPick(this.deck, pick) ?? 0) + 1}.`;
      case 1:
        if (lifted.length === 0) return "Shed open: no warp end is lifted, so the weft will lie over the whole warp. The cylinder has swung out and turned to the next card.";
        return `Shed open: hook${lifted.length === 1 ? "" : "s"} ${list(lifted)} ${lifted.length === 1 ? "has" : "have"} lifted ${lifted.length === 1 ? "its warp ends" : "their warp ends"}. The cylinder has swung out and turned to the next card.`;
      case 2:
        return `Shuttle across: the weft of pick ${n} lies in the shed, under the lifted ends and over the rest.`;
      case 3:
        return `Beaten up: pick ${n} is part of the cloth.`;
      case 4:
        return "Shed closed: the griffe is coming down, every hook is back on the bottom board, and the cylinder is back at the needle points.";
      default:
        if (!next) return "Next card pressed? There is no next card: the empty cylinder face pushes no needle, so every hook would rise. The chain has run out.";
        return `Next card pressed: card ${(cardIndexForPick(this.deck, pick + 1) ?? 0) + 1}'s blanks have pushed needles ${list([...Array(hooks).keys()].filter((k) => !next[k]).map((k) => k + 1))} back, and their hooks off the knives. Ready for pick ${n + 1}.`;
    }
  }
}
