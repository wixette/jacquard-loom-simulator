// Opening the app from a link (design/links.md): every field the link holds, put into the store
// at once, on the loom of the workspace it names; or, if it cannot be read, nothing of it, and
// the reason in the status line.

import { isLocale } from "../l10n/l10n.js";
import { decodeLink } from "../sim/link.js";
import { POSITIONS } from "../sim/loom.js";
import { tieLabel } from "../sim/tieup.js";
import { chooseLanguage } from "./language.js";
import * as act from "./looms.js";
/** @import { AppStore } from "./looms.js" */

/**
 * @param {AppStore} store
 * @param {string} fragment the URL's fragment, with or without its "#"
 * @returns {Promise<boolean>} whether a link was opened
 */
export async function openLink(store, fragment) {
  if (!fragment || fragment === "#") return false;
  const r = await decodeLink(fragment);
  if (!r.ok) {
    act.say(store, r.reason, true);
    return false;
  }
  const l = r.link;
  if (l.lang && isLocale(l.lang)) await chooseLanguage(store, l.lang);
  // Create and Play come in a later release: their links open Weave until then.
  act.setWorkspace(store, l.workspace === "learn" ? "learn" : "weave");
  if (l.deck) {
    act.open(store, { deck: l.deck, tie: l.tie, follow: l.follow });
    if ((l.pick > 0 || l.stop > 0) && l.deck.cards.length > 0 && (l.deck.loop || l.pick < l.deck.cards.length)) act.moveTo(store, l.pick, POSITIONS[l.stop]);
    if (l.crossRow !== null) act.setCrossRow(store, l.crossRow);
    act.say(store, { key: "status.linkOpened", n: l.deck.cards.length, params: { hooks: l.deck.hooks, tie: tieLabel(l.tie) } });
  }
  act.setColours(store, { warp: l.warp, weft: l.weft });
  act.setFace(store, l.face);
  act.setBits(store, l.bits);
  act.setSectionView(store, l.sectionView);
  // A link that names no views leaves the stage as the screen chose it (design/links.md).
  if (new URLSearchParams(fragment.replace(/^#/, "")).has("view")) act.setViews(store, l.views);
  return true;
}
