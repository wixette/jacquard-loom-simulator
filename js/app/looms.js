// The looms in the store, and everything that can be done to them. The app has several looms
// (design/ui-layout.md §2, rule 3): the learner's own, the tutorial's and a game's; the views
// show the current one. Each action changes one loom, says what it did in that loom's status
// line, and makes one change to the store. No DOM, except the ticker that plays the looms.

import { msg } from "../l10n/l10n.js";
import { addCard, duplicateCard, invertCard, moveCard, presetDeck, PRESETS, removeCard, resizeDeck, setLoop, toggleHole } from "../sim/deck.js";
import { Loom, STOPS } from "../sim/loom.js";
import { endCount, hookOfEnd, STRAIGHT, tieLabel } from "../sim/tieup.js";
import { followCell } from "../sim/trace.js";
import { Store } from "./store.js";
/** @import { Locale, Msg } from "../l10n/l10n.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { Tie } from "../sim/tieup.js" */
/** @import { Follow } from "../sim/trace.js" */

/** @typedef {"mine" | "tutorial" | "game"} LoomId */
/** @typedef {"whole" | "needles" | "crooks"} SectionView */
/** @typedef {"front" | "back"} Face */

/**
 * One loom and how it is shown.
 * @typedef {object} LoomState
 * @property {Loom} loom the machine (a class: it changes in place, and rev says it has)
 * @property {number} rev raised by every action that changes the loom
 * @property {number} selected the card selected in the chain, on the bench
 * @property {Follow | null} follow the thread followed
 * @property {number} crossRow the cross-row the section cuts, 0-based
 * @property {string} warp the warp's colour, "#rrggbb"
 * @property {string} weft the weft's colour
 * @property {Face} face the face of the cloth shown
 * @property {boolean} bits the 0/1 overlay on the cloth
 * @property {boolean} playing
 * @property {number} speed picks a minute
 * @property {{ msg: Msg; warn: boolean }} status what it last did, or why it refused
 */

/**
 * The app's state.
 * @typedef {object} AppState
 * @property {Record<LoomId, LoomState>} looms
 * @property {LoomId} current the loom the views show
 * @property {SectionView} sectionView how close the section looks
 * @property {Locale} locale
 */

/** @typedef {Store<AppState>} AppStore */

export const LOOM_IDS = /** @type {const} */ (["mine", "tutorial", "game"]);

/** The cloth's colours until the learner chooses others (the theme's --warp and --weft). */
export const WARP = "#5b3f8c";
export const WEFT = "#efe3c2";

/** The tie-ups the setup offers, by the key a link and a menu use. */
export const TIES = /** @type {Record<string, Tie>} */ ({
  s1: { kind: "straight", repeats: 1 },
  s2: { kind: "straight", repeats: 2 },
  s3: { kind: "straight", repeats: 3 },
  s4: { kind: "straight", repeats: 4 },
  p: { kind: "point" },
});

/** @param {Tie} t */
export const tieKey = (t) => (t.kind === "point" ? "p" : `s${t.repeats}`);

/**
 * A loom at its start, with these cards.
 * @param {Deck} deck
 * @param {Tie} [tie]
 * @returns {LoomState}
 */
export function loomState(deck, tie = STRAIGHT) {
  return { loom: new Loom(deck, tie), rev: 0, selected: 0, follow: null, crossRow: 0, warp: WARP, weft: WEFT, face: "front", bits: false, playing: false, speed: 10, status: { msg: msg("status.start"), warn: false } };
}

/**
 * The app as it opens.
 * @param {Partial<AppState>} [o]
 * @returns {AppState}
 */
export function appState(o = {}) {
  return {
    looms: { mine: loomState(presetDeck("arrow", 16)), tutorial: loomState(presetDeck("plain", 8)), game: loomState(presetDeck("blank", 8)) },
    current: "mine",
    sectionView: "whole",
    locale: "en",
    ...o,
  };
}

/**
 * Change one loom: fn may change its Loom in place, and returns the other fields to change, or
 * null if nothing changed. The loom's revision is raised unless fn says so with keepRev.
 * @param {AppStore} store
 * @param {LoomId} id
 * @param {(ls: LoomState) => (Partial<LoomState> & { keepRev?: boolean }) | null} fn
 */
function change(store, id, fn) {
  store.set((s) => {
    const ls = s.looms[id];
    const patch = fn(ls);
    if (!patch) return {};
    const { keepRev, ...rest } = patch;
    return { looms: { ...s.looms, [id]: { ...ls, ...rest, rev: keepRev ? ls.rev : ls.rev + 1 } } };
  });
}

/**
 * @param {Msg} m
 * @param {boolean} [warn]
 */
const said = (m, warn = false) => ({ msg: m, warn });

/**
 * A new loom in place of the old: another head or another tie, or other cards from the start.
 * The thread followed is kept while it still exists.
 * @param {LoomState} ls
 * @param {Deck} deck
 * @param {Tie} tie
 * @returns {Partial<LoomState>}
 */
function fresh(ls, deck, tie) {
  const follow = ls.follow && (ls.follow.hook >= deck.hooks || (ls.follow.end !== null && ls.follow.end > endCount(tie, deck.hooks))) ? null : ls.follow;
  return { loom: new Loom(deck, tie), selected: 0, playing: false, follow, crossRow: Math.min(ls.crossRow, deck.hooks / 8 - 1) };
}

/** The current loom's id. @param {AppStore} store */
const cur = (store) => store.state.current;

// ---- what the learner says to the app -------------------------------------------------------------

/**
 * Say something in a loom's status line.
 * @param {AppStore} store
 * @param {Msg} m
 * @param {boolean} [warn]
 * @param {LoomId} [id]
 */
export function say(store, m, warn = false, id = cur(store)) {
  change(store, id, () => ({ status: said(m, warn), keepRev: true }));
}

/**
 * The loom was changed in place, outside the actions (a check moving it to a moment): its
 * views draw it again.
 * @param {AppStore} store
 * @param {LoomId} [id]
 */
export function touch(store, id = cur(store)) {
  change(store, id, () => ({}));
}

/** @param {AppStore} store @param {LoomId} id */
export const setCurrent = (store, id) => store.set({ current: id });
/** @param {AppStore} store @param {SectionView} v */
export const setSectionView = (store, v) => store.set({ sectionView: v });

// ---- turning the loom --------------------------------------------------------------------------

/** @param {AppStore} store @param {LoomId} [id] */
export function step(store, id = cur(store)) {
  change(store, id, (ls) => {
    const r = ls.loom.stepForward();
    return { playing: false, status: r.ok ? said(msg("status.step", { what: r.message })) : said(r.reason, true), keepRev: !r.ok };
  });
}

/** @param {AppStore} store @param {LoomId} [id] */
export function stepBack(store, id = cur(store)) {
  change(store, id, (ls) => {
    const r = ls.loom.stepBack();
    return { playing: false, status: r.ok ? said(r.message) : said(r.reason, true), keepRev: !r.ok };
  });
}

/** @param {AppStore} store @param {LoomId} [id] */
export function reset(store, id = cur(store)) {
  change(store, id, (ls) => {
    ls.loom.reset();
    return { playing: false, status: said(msg("status.reset")) };
  });
}

/** @param {AppStore} store @param {LoomId} [id] */
export function pause(store, id = cur(store)) {
  change(store, id, (ls) => (ls.playing ? { playing: false, keepRev: true } : null));
}

/**
 * Play, or pause if playing.
 * @param {AppStore} store
 * @param {LoomId} [id]
 */
export function play(store, id = cur(store)) {
  change(store, id, (ls) => {
    if (ls.playing) return { playing: false, keepRev: true };
    const can = ls.loom.phi === 0 ? ls.loom.canStart() : { ok: true };
    if (!can.ok) return { status: said(/** @type {{ reason: Msg }} */ (can).reason, true), keepRev: true };
    return { playing: true, keepRev: true };
  });
  if (store.state.looms[id].playing) startTicker(store);
}

/**
 * Run every playing loom on by dt seconds, at its speed, saying the last moment it passed.
 * @param {AppStore} store
 * @param {number} dt
 */
export function tick(store, dt) {
  for (const id of LOOM_IDS) {
    if (!store.state.looms[id].playing) continue;
    change(store, id, (ls) => {
      const { loom } = ls;
      const before = { pick: loom.pick, phi: loom.phi };
      const r = loom.advance((dt * ls.speed) / 60);
      if (!r.ok) return { playing: false, status: said(r.reason, true) };
      /** @type {Msg | null} */
      let m = null;
      STOPS.forEach((s, i) => {
        const passed = loom.pick > before.pick ? s > before.phi : s > before.phi && s <= loom.phi;
        if (passed) m = loom.stopMessage(i, before.pick);
      });
      return m ? { status: said(m) } : {};
    });
  }
}

/** Whether the ticker runs. */
const ticking = new WeakSet();

/**
 * Play the looms frame by frame while any is playing (in a page).
 * @param {AppStore} store
 */
function startTicker(store) {
  if (ticking.has(store) || typeof requestAnimationFrame === "undefined") return;
  ticking.add(store);
  let last = performance.now();
  /** @param {number} now */
  const frame = (now) => {
    tick(store, Math.min(0.1, (now - last) / 1000));
    last = now;
    if (LOOM_IDS.some((id) => store.state.looms[id].playing)) requestAnimationFrame(frame);
    else ticking.delete(store);
  };
  requestAnimationFrame(frame);
}

/** @param {AppStore} store @param {number} speed picks a minute @param {LoomId} [id] */
export function setSpeed(store, speed, id = cur(store)) {
  change(store, id, (ls) => (ls.speed === speed ? null : { speed, keepRev: true }));
}

// ---- the cards ---------------------------------------------------------------------------------

/** @param {AppStore} store @param {number} card @param {number} hook @param {LoomId} [id] */
export function punch(store, card, hook, id = cur(store)) {
  change(store, id, (ls) => {
    const was = ls.loom.deck.cards[card][hook];
    ls.loom.setDeck(toggleHole(ls.loom.deck, card, hook));
    return { selected: card, status: said(msg(was ? "status.filled" : "status.punched", { card: card + 1, hole: hook + 1 })) };
  });
}

/** @param {AppStore} store @param {number} card @param {LoomId} [id] */
export function select(store, card, id = cur(store)) {
  change(store, id, (ls) => (ls.selected === card ? null : { selected: card, keepRev: true }));
}

/**
 * The selected card stays in the chain's bounds.
 * @param {LoomState} ls
 * @param {number} selected
 */
const clamp = (ls, selected) => Math.max(0, Math.min(selected, ls.loom.deck.cards.length - 1));

/** @param {AppStore} store @param {LoomId} [id] */
export function add(store, id = cur(store)) {
  change(store, id, (ls) => {
    ls.loom.setDeck(addCard(ls.loom.deck, ls.selected));
    const selected = clamp(ls, ls.selected + 1);
    return { selected, status: said(msg("status.added", { card: selected + 1 })) };
  });
}

/** @param {AppStore} store @param {LoomId} [id] */
export function duplicate(store, id = cur(store)) {
  change(store, id, (ls) => {
    if (!ls.loom.deck.cards.length) return null;
    ls.loom.setDeck(duplicateCard(ls.loom.deck, ls.selected));
    return { selected: ls.selected + 1, status: said(msg("status.duplicated", { card: ls.selected + 1 })) };
  });
}

/** @param {AppStore} store @param {LoomId} [id] */
export function remove(store, id = cur(store)) {
  change(store, id, (ls) => {
    if (!ls.loom.deck.cards.length) return null;
    ls.loom.setDeck(removeCard(ls.loom.deck, ls.selected));
    return { selected: clamp(ls, ls.selected), status: said(msg("status.removed", { card: ls.selected + 1 })) };
  });
}

/**
 * Move the selected card earlier (-1) or later (+1) in the chain.
 * @param {AppStore} store
 * @param {-1 | 1} by
 * @param {LoomId} [id]
 */
export function move(store, by, id = cur(store)) {
  change(store, id, (ls) => {
    const to = ls.selected + by;
    if (to < 0 || to >= ls.loom.deck.cards.length) return null;
    ls.loom.setDeck(moveCard(ls.loom.deck, ls.selected, by));
    return { selected: to, status: said(msg("status.moved", { from: ls.selected + 1, card: to + 1 })) };
  });
}

/** @param {AppStore} store @param {LoomId} [id] */
export function invert(store, id = cur(store)) {
  change(store, id, (ls) => {
    if (!ls.loom.deck.cards.length) return null;
    ls.loom.setDeck(invertCard(ls.loom.deck, ls.selected));
    return { status: said(msg("status.inverted", { card: ls.selected + 1 })) };
  });
}

/** @param {AppStore} store @param {boolean} loop @param {LoomId} [id] */
export function lace(store, loop, id = cur(store)) {
  change(store, id, (ls) => {
    if (ls.loom.deck.loop === loop) return null;
    ls.loom.setDeck(setLoop(ls.loom.deck, loop));
    return { status: said(msg(loop ? "status.loopOn" : "status.loopOff")) };
  });
}

// ---- the head, the tie-up, other cards -------------------------------------------------------

/** @param {AppStore} store @param {number} hooks @param {LoomId} [id] */
export function setHooks(store, hooks, id = cur(store)) {
  change(store, id, (ls) => {
    const was = ls.loom.deck.hooks;
    if (was === hooks) return null;
    const cards = msg(hooks > was ? "status.cardsGrown" : "status.cardsCut");
    return { ...fresh(ls, resizeDeck(ls.loom.deck, hooks), ls.loom.tie), status: said(msg("status.head", { hooks, cards }, hooks / 8)) };
  });
}

/** @param {AppStore} store @param {string} name a key of PRESETS @param {LoomId} [id] */
export function loadPreset(store, name, id = cur(store)) {
  change(store, id, (ls) => {
    const hooks = ls.loom.deck.hooks;
    return { ...fresh(ls, presetDeck(name, hooks), ls.loom.tie), status: said(msg("status.loaded", { deck: msg(PRESETS[name].name), hooks })) };
  });
}

/** @param {AppStore} store @param {Tie} tie @param {LoomId} [id] */
export function setTie(store, tie, id = cur(store)) {
  change(store, id, (ls) => {
    if (tieKey(tie) === tieKey(ls.loom.tie)) return null;
    const hooks = ls.loom.deck.hooks;
    return { ...fresh(ls, ls.loom.deck, tie), status: said(msg("status.tie", { tie: tieLabel(tie), ends: endCount(tie, hooks), hooks })) };
  });
}

/**
 * Put other cards on a loom, from the start (a lesson, a step of the tutorial, a game).
 * @param {AppStore} store
 * @param {{ deck: Deck; tie?: Tie; follow?: Follow | null; message?: Msg; view?: SectionView }} o
 * @param {LoomId} [id]
 */
export function open(store, o, id = cur(store)) {
  change(store, id, (ls) => {
    const patch = fresh(ls, o.deck, o.tie ?? ls.loom.tie);
    if (o.follow !== undefined) {
      patch.follow = o.follow;
      if (o.follow) patch.crossRow = Math.floor(o.follow.hook / 8);
    }
    return { ...patch, status: o.message ? said(o.message) : ls.status };
  });
  if (o.view) setSectionView(store, o.view);
}

// ---- what is shown -----------------------------------------------------------------------------

/**
 * Follow a thread (or stop following, with null). The section turns to its cross-row.
 * @param {AppStore} store
 * @param {Follow | null} f
 * @param {LoomId} [id]
 */
export function follow(store, f, id = cur(store)) {
  change(store, id, (ls) => ({ follow: f, crossRow: f ? Math.floor(f.hook / 8) : ls.crossRow, keepRev: true }));
}

/**
 * Follow a cell of the cloth back through the machine.
 * @param {AppStore} store
 * @param {number} pick 0-based
 * @param {number} end 1-based
 * @param {LoomId} [id]
 */
export function followCloth(store, pick, end, id = cur(store)) {
  follow(store, followCell(store.state.looms[id].loom.snapshot(), pick, end), id);
}

/**
 * Follow a warp end (1-based) through the harness to its hook.
 * @param {AppStore} store
 * @param {number} end
 * @param {LoomId} [id]
 */
export function followEnd(store, end, id = cur(store)) {
  const { loom } = store.state.looms[id];
  follow(store, { hook: hookOfEnd(loom.tie, loom.deck.hooks, end) - 1, end, pick: null }, id);
}

/** @param {AppStore} store @param {number} hook 0-based @param {LoomId} [id] */
export const followHook = (store, hook, id = cur(store)) => follow(store, { hook, end: null, pick: null }, id);

/** @param {AppStore} store @param {number} row 0-based @param {LoomId} [id] */
export function setCrossRow(store, row, id = cur(store)) {
  change(store, id, (ls) => (ls.crossRow === row ? null : { crossRow: row, keepRev: true }));
}

/** @param {AppStore} store @param {Face} face @param {LoomId} [id] */
export function setFace(store, face, id = cur(store)) {
  change(store, id, (ls) => (ls.face === face ? null : { face, keepRev: true }));
}

/** @param {AppStore} store @param {boolean} bits @param {LoomId} [id] */
export function setBits(store, bits, id = cur(store)) {
  change(store, id, (ls) => (ls.bits === bits ? null : { bits, keepRev: true }));
}

/** @param {AppStore} store @param {{ warp?: string; weft?: string }} c @param {LoomId} [id] */
export function setColours(store, c, id = cur(store)) {
  change(store, id, (ls) => ((c.warp ?? ls.warp) === ls.warp && (c.weft ?? ls.weft) === ls.weft ? null : { warp: c.warp ?? ls.warp, weft: c.weft ?? ls.weft, keepRev: true }));
}

/**
 * Move a loom to a moment of its pick, weaving or unweaving on the way (a link, a step).
 * @param {AppStore} store
 * @param {number} pick
 * @param {number} phi
 * @param {LoomId} [id]
 */
export function moveTo(store, pick, phi, id = cur(store)) {
  change(store, id, (ls) => {
    ls.loom.moveTo(pick, phi);
    return { playing: false };
  });
}
