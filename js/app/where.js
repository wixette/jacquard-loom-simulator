// Where the loom is, in words, under the controls: the pick, its card and how far through it,
// the rows woven and the warp ends; or, an open chain woven to its end, just that (there is no
// pick past it to name).

import { t, tn } from "../l10n/l10n.js";
import { endCount } from "../sim/tieup.js";
/** @import { Snapshot } from "../sim/loom.js" */

/**
 * @param {Snapshot} snap
 * @returns {string}
 */
export function whereText(snap) {
  const ends = endCount(snap.tie, snap.deck.hooks);
  if (snap.cardIndex === null && snap.cloth.length > 0 && snap.phi === 0) return tn("where.end", snap.cloth.length, { ends });
  const card = snap.cardIndex === null ? t("where.noCard") : t("where.card", { card: snap.cardIndex + 1 });
  return tn("where", snap.cloth.length, { pick: snap.pick + 1, card, percent: Math.round(snap.phi * 100), ends });
}
