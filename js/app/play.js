// Play: the four games as a workspace (design/m9-notes.md; design/public-app.md §2), on the
// app's game loom. Each game makes the loom's cards from its own state: the name game from a
// name set in a pixel font, one byte a card from a message, guess the cloth from a puzzle's
// seed, the draw boy from the rows pulled by hand (and then from the figure's own cards).

import * as drawBoy from "../game/drawBoy.js";
import { messageDeck } from "../game/byteGame.js";
import { puzzle } from "../game/guessGame.js";
import { planName } from "../game/nameGame.js";
import { msg } from "../l10n/l10n.js";
import { MAX_SEED } from "../sim/link.js";
import { Loom } from "../sim/loom.js";
import { makeDeck } from "../sim/deck.js";
import * as act from "./looms.js";
import { GAMES } from "./playState.js";
/** @import { AppStore } from "./looms.js" */
/** @import { GameName, PlayState } from "./playState.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { Msg } from "../l10n/l10n.js" */

/**
 * Put cards on the game loom, from the start, saying what they are.
 * @param {AppStore} store
 * @param {Deck} deck
 * @param {Msg} said
 * @param {Partial<import("./looms.js").AppState>} [also]
 * @param {number} [woven] rows to weave at once
 */
function cards(store, deck, said, also = {}, woven = 0) {
  const loom = new Loom(deck);
  if (woven) loom.moveTo(woven, 0);
  act.setLoom(store, loom, null, "game", also);
  act.say(store, said, false, "game");
}

/** An empty loom, for a game with nothing to weave yet, and why. @param {AppStore} store @param {Msg} why @param {Partial<import("./looms.js").AppState>} [also] */
function nothing(store, why, also = {}) {
  act.setLoom(store, new Loom({ hooks: 8, cards: [], loop: false }), null, "game", also);
  act.say(store, why, true, "game");
}

/**
 * The game loom made anew from a game's state.
 * @param {AppStore} store
 * @param {PlayState} p
 */
function make(store, p) {
  const also = { play: p };
  if (p.game === "name") {
    const r = planName(p.name.text, p.name.mode);
    if (!r.ok) return nothing(store, r.why, also);
    const n = r.plan.lines.join("").replace(/ /g, "").length;
    const words = { chars: msg("name.chars", {}, n), lines: msg("name.lines", {}, r.plan.lines.length), hooks: r.plan.deck.hooks, cards: r.plan.deck.cards.length };
    return cards(store, r.plan.deck, msg(p.name.mode === "damask" ? "name.planDamask" : "name.planDirect", words), also);
  }
  if (p.game === "byte") {
    // a friend's secret is the cards themselves, kept with the game; a message typed makes them
    if (p.byte.secret && p.byte.deck) return cards(store, p.byte.deck, msg("byte.secret", {}, p.byte.deck.cards.length), also);
    const r = messageDeck(p.byte.text);
    if (!r.ok) return nothing(store, r.reason, also);
    return cards(store, r.deck, msg("byte.made", {}, r.deck.cards.length), also);
  }
  if (p.game === "guess") {
    const q = puzzle(p.guess.seed);
    return cards(store, q.deck, msg("guess.made", {}, q.deck.cards.length), also);
  }
  if (p.drawboy.phase === "hand") {
    const rows = p.drawboy.hand.woven;
    return cards(store, { hooks: 8, cards: rows.map((r) => [...r]), loop: false }, msg("drawboy.hand", { row: Math.min(rows.length + 1, drawBoy.ROWS.length), of: drawBoy.ROWS.length }), also, rows.length);
  }
  return cards(store, makeDeck(8, drawBoy.ROWS.map((r) => r.map((x) => (x ? "O" : ".")).join("")), false), msg("drawboy.cards", { cards: drawBoy.ROWS.length }), also);
}

/**
 * Change the games' state, and make the game loom from it.
 * @param {AppStore} store
 * @param {(p: PlayState) => PlayState} f
 */
export const setPlay = (store, f) => make(store, f(store.state.play));

/** The game last chosen on this device (the tab Games opens on), kept as the workspace is. */
const GAME = "jacquard.game";

/** @returns {GameName | undefined} */
export function rememberedGame() {
  try {
    const g = localStorage.getItem(GAME);
    return g !== null && /** @type {readonly string[]} */ (GAMES).includes(g) ? /** @type {GameName} */ (g) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Remember the game each time another is chosen.
 * @param {AppStore} store
 * @returns {() => void}
 */
export function watchGame(store) {
  return store.watch(
    (s) => [s.play.game],
    () => {
      try {
        localStorage.setItem(GAME, store.state.play.game);
      } catch {
        // not remembered
      }
    },
  );
}

/** Open Play, on a game (or the one on show). @param {AppStore} store @param {GameName} [game] */
export function openPlay(store, game) {
  act.setWorkspace(store, "play");
  setPlay(store, (p) => ({ ...p, game: game ?? p.game }));
}

/** Choose a game. @param {AppStore} store @param {GameName} game */
export const chooseGame = (store, game) => setPlay(store, (p) => ({ ...p, game }));

/** Weave all the game loom's cards at once (the games' "Weave to the end"). @param {AppStore} store */
export function weaveAll(store) {
  const { loom } = store.state.looms.game;
  act.moveTo(store, loom.deck.cards.length, 0, "game");
}

// ---- the name game ----------------------------------------------------------------------------

/** @param {AppStore} store @param {Partial<PlayState["name"]>} patch */
export const setName = (store, patch) => setPlay(store, (p) => ({ ...p, name: { ...p.name, ...patch } }));

// ---- one byte a card --------------------------------------------------------------------------

/** A message typed: its cards made, a secret no more. @param {AppStore} store @param {string} text */
export const setMessage = (store, text) => setPlay(store, (p) => ({ ...p, byte: { text, secret: false, guess: "" } }));

/**
 * A friend's cards, from a link: on the loom, the text theirs to read.
 * @param {AppStore} store
 * @param {Deck} deck
 */
export function openSecret(store, deck) {
  act.setWorkspace(store, "play");
  const p = store.state.play;
  cards(store, deck, msg("byte.secret", {}, deck.cards.length), { play: { ...p, game: "byte", byte: { text: "", secret: true, guess: "", deck } } });
}

/** The friend's reading of the secret. @param {AppStore} store @param {string} guess */
export const guessSecret = (store, guess) => store.set({ play: { ...store.state.play, byte: { ...store.state.play.byte, guess } } });

// ---- guess the cloth --------------------------------------------------------------------------

/** Pick a cloth (0-based): once a puzzle, counted. @param {AppStore} store @param {number} i */
export function pickCloth(store, i) {
  const g = store.state.play.guess;
  if (g.picked !== null) return;
  const right = puzzle(g.seed).answer === i;
  store.set({ play: { ...store.state.play, guess: { ...g, picked: i, right: g.right + (right ? 1 : 0), tried: g.tried + 1 } } });
  act.say(store, msg(right ? "guess.right" : "guess.wrong"), !right, "game");
}

/** The next puzzle. @param {AppStore} store */
export const nextPuzzle = (store) => setPlay(store, (p) => ({ ...p, guess: { ...p.guess, seed: p.guess.seed >= MAX_SEED ? 1 : p.guess.seed + 1, picked: null } }));

// ---- draw boy against Jacquard -----------------------------------------------------------------

/** @param {PlayState} p @param {Partial<PlayState["drawboy"]>} patch @returns {PlayState} */
const boy = (p, patch) => ({ ...p, drawboy: { ...p.drawboy, ...patch } });

/** Pull a cord (or let it go). @param {AppStore} store @param {number} end 0-based */
export function pullCord(store, end) {
  const d = store.state.play.drawboy;
  store.set({ play: boy(store.state.play, { hand: drawBoy.pull(d.hand, end), started: d.started ?? Date.now() }) });
}

/** Throw the shuttle: the row woven as the cords stand. @param {AppStore} store */
export function throwShuttle(store) {
  setPlay(store, (p) => {
    const hand = drawBoy.throwShuttle(p.drawboy.hand);
    const started = p.drawboy.started ?? Date.now();
    return boy(p, { hand, started, seconds: drawBoy.finished(hand) ? Math.round((Date.now() - started) / 100) / 10 : p.drawboy.seconds });
  });
}

/** Weave it again with the cards, or by hand from the start. @param {AppStore} store @param {"hand" | "cards"} phase */
export const drawBoyPhase = (store, phase) => setPlay(store, (p) => boy(p, phase === "hand" ? { phase, hand: drawBoy.start(), seconds: 0, started: null } : { phase }));
