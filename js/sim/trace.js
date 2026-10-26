// The trace: from one thread of the cloth (or one hook) back through the machine. For a
// cell of the cloth, pick r and warp end e: the card that wove pick r, the hole of hook
// tie(e) in it, the needle that reads that hole, the hook, its knife, its harness cords
// and the warp ends they lift. Every panel highlights what this returns, so they agree.

import { msg } from "../l10n/l10n.js";
import { cardForPick, cardIndexForPick, holeOfHook } from "./deck.js";
import { endsOfHook, hookOfEnd } from "./tieup.js";
/** @import { Msg } from "../l10n/l10n.js" */
/** @import { Snapshot } from "./loom.js" */

/**
 * What is followed: a hook, and optionally one warp end of it and one pick.
 * @typedef {{ hook: number, end: number | null, pick: number | null }} Follow
 */

/**
 * @typedef {object} Trace
 * @property {number} hook 0-based
 * @property {number} column the hook's column on the card = its cross-row, 0-based
 * @property {number} row its row on the card = its needle tier = its knife, 0-based from the top
 * @property {number[]} ends the warp ends (1-based) it lifts through the harness
 * @property {number | null} end the followed end, 1-based
 * @property {number | null} pick the followed pick, 0-based (null: the pick being woven)
 * @property {number | null} cardIndex the chain index of that pick's card
 * @property {boolean | null} hole whether that card has the hook's hole punched
 * @property {boolean | null} cell the cloth at (pick, end): true = warp over, null if not woven
 * @property {Msg} text the trace, to be put into words
 */

/**
 * Follows a cloth cell: pick r (0-based), warp end e (1-based).
 * @param {Snapshot} snap
 * @param {number} pick
 * @param {number} end
 * @returns {Follow}
 */
export function followCell(snap, pick, end) {
  return { hook: hookOfEnd(snap.tie, snap.deck.hooks, end) - 1, end, pick };
}

/**
 * @param {Snapshot} snap
 * @param {Follow} f
 * @returns {Trace}
 */
export function traceOf(snap, f) {
  const { deck, tie } = snap;
  const { column, row } = holeOfHook(f.hook);
  const ends = endsOfHook(tie, deck.hooks, f.hook + 1);
  const pick = f.pick;
  const p = pick ?? snap.pick;
  const cardIndex = cardIndexForPick(deck, p);
  const card = cardForPick(deck, p);
  const hole = card ? card[f.hook] : null;
  const cell = pick !== null && f.end !== null && pick < snap.cloth.length ? snap.cloth[pick][f.end - 1] : null;
  const at = { hook: f.hook + 1, column: column + 1, row: row + 1 };
  const cords = msg("trace.cords", { ends }, ends.length);
  /** @type {Msg} */
  let text;
  if (cardIndex === null || hole === null) {
    text = msg("trace.hook", { ...at, cords });
  } else {
    const when = pick === null ? msg("trace.thisPick") : msg("trace.pick", { pick: pick + 1 });
    const common = { ...at, when, card: cardIndex + 1 };
    if (hole) text = f.end !== null ? msg("trace.lifted.end", { ...common, cords, end: f.end }) : msg("trace.lifted", { ...common, cords });
    else text = f.end !== null ? msg("trace.down.end", { ...common, ends, end: f.end }, ends.length) : msg("trace.down", { ...common, ends }, ends.length);
  }
  return { hook: f.hook, column, row, ends, end: f.end, pick, cardIndex, hole, cell, text };
}
