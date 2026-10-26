// The tie-up: which hook lifts each warp end, through the harness. A straight tie repeats
// hooks 1…H across the warp; a point tie runs 1…H…2 and so mirrors the figure (research
// notes-mechanism, the harness). Warp ends and hooks are numbered from 1.

import { msg } from "../l10n/l10n.js";
/** @import { Msg } from "../l10n/l10n.js" */

/**
 * @typedef {{ kind: "straight", repeats: number } | { kind: "point" }} Tie
 */

/** @type {Tie} */
export const STRAIGHT = { kind: "straight", repeats: 1 };

/**
 * How many warp ends the tie drives from a head of `hooks` hooks.
 * @param {Tie} tie
 * @param {number} hooks
 * @returns {number}
 */
export function endCount(tie, hooks) {
  return tie.kind === "straight" ? hooks * tie.repeats : 2 * hooks - 1;
}

/**
 * The hook (1-based) that lifts warp end e (1-based).
 * @param {Tie} tie
 * @param {number} hooks
 * @param {number} e
 * @returns {number}
 */
export function hookOfEnd(tie, hooks, e) {
  if (e < 1 || e > endCount(tie, hooks)) throw new RangeError(`no warp end ${e}`);
  if (tie.kind === "straight") return ((e - 1) % hooks) + 1;
  return e <= hooks ? e : 2 * hooks - e;
}

/**
 * The warp ends (1-based) that hook h lifts.
 * @param {Tie} tie
 * @param {number} hooks
 * @param {number} h
 * @returns {number[]}
 */
export function endsOfHook(tie, hooks, h) {
  const out = [];
  for (let e = 1; e <= endCount(tie, hooks); e++) if (hookOfEnd(tie, hooks, e) === h) out.push(e);
  return out;
}

/**
 * The cloth row a card weaves: for each warp end, true when the end is lifted over the weft.
 * A missing card (an empty cylinder face) lifts every hook.
 * @param {Tie} tie
 * @param {boolean[] | null} card
 * @param {number} hooks
 * @returns {boolean[]}
 */
export function rowOfCard(tie, card, hooks) {
  const row = [];
  for (let e = 1; e <= endCount(tie, hooks); e++) row.push(card ? card[hookOfEnd(tie, hooks, e) - 1] : true);
  return row;
}

/**
 * The tie-up's name, as a message.
 * @param {Tie} tie
 * @returns {Msg}
 */
export const tieLabel = (tie) => (tie.kind === "point" ? msg("tie.point") : tie.repeats === 1 ? msg("tie.straight") : msg("tie.straightN", { n: tie.repeats }));
