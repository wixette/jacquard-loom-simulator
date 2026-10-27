// The app's links (design/links.md): what the app is showing, as a link (Share's), and opening
// the app from one: every field the link holds, put into the store at once, on the loom of the
// workspace it names; or, if it cannot be read, nothing of it, and the reason in the status line.

import { isLocale } from "../l10n/l10n.js";
import { decodeLink } from "../sim/link.js";
import { POSITIONS } from "../sim/loom.js";
import { tieLabel } from "../sim/tieup.js";
import { STEPS } from "../teach/tutorial.js";
import { arrange } from "./arrange.js";
import { chooseLanguage } from "./language.js";
import { openLearn } from "./learn.js";
import * as act from "./looms.js";
/** @import { AppStore } from "./looms.js" */
/** @import { AppLink } from "../sim/link.js" */

/**
 * What the app is showing, as the fields of a link: in Learn, the tutorial's step (it sets up
 * its own loom); in Weave, the loom (its cards, tie-up, pick and moment, the thread followed, its
 * colours and face) and the stage's views.
 * @param {AppStore} store
 * @returns {Partial<AppLink>}
 */
export function linkOf(store) {
  if (store.state.workspace === "learn") return { workspace: "learn", step: STEPS[store.state.learn.step].id };
  const s = store.state.looms[store.state.current];
  const { loom } = s;
  const stop = POSITIONS.findIndex((p) => Math.abs(p - loom.phi) < 1e-9);
  return { deck: loom.deck, tie: loom.tie, pick: loom.pick, stop: Math.max(0, stop), follow: s.follow, crossRow: s.crossRow, warp: s.warp, weft: s.weft, face: s.face, bits: s.bits, sectionView: store.state.sectionView, views: store.state.views };
}

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
  // A step of the tutorial sets up its own loom and views (design/links.md, Learn).
  if (l.workspace === "learn") {
    openLearn(store, l.step);
    return true;
  }
  // Create and Play come in a later release: their links open Weave until then.
  act.setWorkspace(store, "weave");
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
  // kept to the stage's rules (js/app/arrange.js): four views hold one 3D model at most
  if (new URLSearchParams(fragment.replace(/^#/, "")).has("view")) act.setViews(store, arrange(l.views, /** @type {1 | 2 | 4} */ (l.views.length)));
  return true;
}
