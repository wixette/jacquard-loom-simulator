// The app's links (design/links.md): what the app is showing, as a link (Share's), and opening
// the app from one: every field the link holds, put into the store at once, on the loom of the
// workspace it names (a step of the tutorial, a loom, Design's picture, a game); or, if it
// cannot be read, nothing of it, and the reason in the status line.

import { isLocale } from "../l10n/l10n.js";
import { decodeLink } from "../sim/link.js";
import { POSITIONS } from "../sim/loom.js";
import { tieLabel } from "../sim/tieup.js";
import { STEPS } from "../teach/tutorial.js";
import { arrange } from "./arrange.js";
import { chooseLanguage } from "./language.js";
import { openLearn } from "./learn.js";
import { openSecret, setPlay } from "./play.js";
import * as act from "./looms.js";
/** @import { AppStore } from "./looms.js" */
/** @import { AppLink } from "../sim/link.js" */

/**
 * What the app is showing, as the fields of a link: in Learn, the tutorial's step (it sets up
 * its own loom); in Design, the picture and how it is read; in Games, the game (one byte a card's
 * as its cards, a secret); in Weave, the loom (its cards, tie-up, pick and moment, the thread
 * followed, its colours and face); and the stage's views.
 * @param {AppStore} store
 * @returns {Partial<AppLink>}
 */
export function linkOf(store) {
  if (store.state.workspace === "learn") return { workspace: "learn", step: STEPS[store.state.learn.step].id };
  if (store.state.workspace === "play") {
    const p = store.state.play;
    const g = { name: p.game, text: p.name.text, mode: p.name.mode, seed: p.guess.seed };
    // one byte a card is sent as its cards, a secret: the friend reads the cloth
    if (p.game === "byte") {
      const { deck } = store.state.looms.game.loom;
      return { workspace: "play", game: g, deck, views: store.state.views };
    }
    return { workspace: "play", game: g, views: store.state.views };
  }
  if (store.state.workspace === "create") {
    const { rows, mode, k, perRow } = store.state.pictures.create;
    const c = store.state.looms.create;
    return { workspace: "create", picture: { rows, mode, k, perRow }, warp: c.warp, weft: c.weft, face: c.face, bits: c.bits, views: store.state.views };
  }
  const s = store.state.looms[store.state.current];
  const { loom } = s;
  // paused between two moments, the moment just passed: the rows woven so far stay woven
  const stop = POSITIONS.reduce((at, p, i) => (p <= loom.phi + 1e-9 ? i : at), 0);
  return { deck: loom.deck, tie: loom.tie, pick: loom.pick, stop, follow: s.follow, crossRow: s.crossRow, warp: s.warp, weft: s.weft, face: s.face, bits: s.bits, sectionView: store.state.sectionView, views: store.state.views };
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
  const has = (/** @type {string} */ key) => new URLSearchParams(fragment.replace(/^#/, "")).has(key);
  /** The views the link names, kept to the stage's rules (js/app/arrange.js): four views hold one 3D model at most. */
  const views = () => has("view") && act.setViews(store, arrange(l.views, /** @type {1 | 2 | 4} */ (l.views.length)));
  if (l.lang && isLocale(l.lang)) await chooseLanguage(store, l.lang);
  // A step of the tutorial sets up its own loom and views (design/links.md, Learn).
  if (l.workspace === "learn") {
    openLearn(store, l.step);
    return true;
  }
  // Design: the picture the link carries, on Design's own loom, with its colours and views
  if (l.workspace === "create") {
    if (l.picture) act.setPicture(store, { ...l.picture, invert: false }, "create");
    act.setWorkspace(store, "create");
    act.setColours(store, { warp: l.warp, weft: l.weft }, "create");
    act.setFace(store, l.face, "create");
    act.setBits(store, l.bits, "create");
    views();
    return true;
  }
  // Games: the game the link names, with its own fields (the name game's text and reading each
  // on its own), and its views
  if (l.workspace === "play") {
    const g = l.game ?? { name: "name", text: "", mode: "damask", seed: 1 };
    if (g.name === "byte" && l.deck) openSecret(store, l.deck);
    else {
      act.setWorkspace(store, "play");
      setPlay(store, (p) => ({ ...p, game: g.name, name: { text: has("text") ? g.text : p.name.text, mode: has("mode") ? g.mode : p.name.mode }, guess: g.name === "guess" ? { seed: g.seed, picked: null, right: 0, tried: 0 } : p.guess }));
    }
    views();
    return true;
  }
  act.setWorkspace(store, "weave");
  if (l.deck) {
    act.open(store, { deck: l.deck, tie: l.tie, follow: l.follow });
    // the link's moment (an open chain's within it, js/sim/link.js): at its end, woven to its end
    if ((l.pick > 0 || l.stop > 0) && l.deck.cards.length > 0) act.moveTo(store, l.pick, POSITIONS[l.stop]);
    // the cross-row the link names, else the followed hook's, else the first
    act.setCrossRow(store, l.crossRow ?? (l.follow ? Math.floor(l.follow.hook / 8) : 0));
    act.say(store, { key: "status.linkOpened", n: l.deck.cards.length, params: { hooks: l.deck.hooks, tie: tieLabel(l.tie) } });
  }
  act.setColours(store, { warp: l.warp, weft: l.weft });
  act.setFace(store, l.face);
  act.setBits(store, l.bits);
  act.setSectionView(store, l.sectionView);
  // A link that names no views leaves the stage as the screen chose it (design/links.md).
  views();
  return true;
}
