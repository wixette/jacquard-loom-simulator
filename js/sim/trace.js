// The trace: from one thread of the cloth (or one hook) back through the machine. For a
// cell of the cloth, pick r and warp end e: the card that wove pick r, the hole of hook
// tie(e) in it, the needle that reads that hole, the hook, its knife, its harness cords
// and the warp ends they lift. Every panel highlights what this returns, so they agree.

import { cardForPick, cardIndexForPick, holeOfHook } from "./deck.js";
import { endsOfHook, hookOfEnd } from "./tieup.js";
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
 * @property {string} text the trace in words
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
  const n = f.hook + 1;
  const where = `column ${column + 1}, row ${row + 1}`;
  const endList = ends.length === 1 ? `${ends[0]}` : `${ends.slice(0, -1).join(", ")} and ${ends[ends.length - 1]}`;
  const cords = ends.length === 1 ? `its harness cord lifts end ${ends[0]}` : `its ${ends.length} harness cords lift ends ${endList}`;
  let text;
  if (cardIndex === null || hole === null) {
    text = `Hook ${n}: hole ${n} of each card (${where}); needle ${row + 1} of cross-row ${column + 1}; knife ${row + 1}; ${cords}.`;
  } else if (hole) {
    text = `${pick === null ? "This pick" : `Pick ${pick + 1}`}: card ${cardIndex + 1} has hole ${n} punched (${where}), so needle ${row + 1} of cross-row ${column + 1} goes into the cylinder, hook ${n} stays over knife ${row + 1} and is lifted, and ${cords}${f.end !== null ? `: end ${f.end} lies over the weft (1)` : ""}.`;
  } else {
    text = `${pick === null ? "This pick" : `Pick ${pick + 1}`}: card ${cardIndex + 1} is blank at hole ${n} (${where}), so needle ${row + 1} of cross-row ${column + 1} is pushed back, hook ${n} is pushed off knife ${row + 1} and stays down, and ${ends.length === 1 ? `end ${ends[0]} stays` : `ends ${endList} stay`} down${f.end !== null ? `: the weft lies over end ${f.end} (0)` : ""}.`;
  }
  return { hook: f.hook, column, row, ends, end: f.end, pick, cardIndex, hole, cell, text };
}
