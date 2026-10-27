// The games' state (design/m9-notes.md), apart from their actions (js/app/play.js) so the store
// can start with it: which game is on, and each game's own: the name game's text and reading,
// the message one byte a card (or, opened from a friend's link, a secret to read), the guessing
// game's puzzle and score, and the draw boy's rows woven by hand.

import * as drawBoy from "../game/drawBoy.js";

/** The games, in the order the Play panel shows them. */
export const GAMES = /** @type {const} */ (["name", "byte", "guess", "drawboy"]);
/** @typedef {(typeof GAMES)[number]} GameName */

/**
 * @typedef {object} PlayState
 * @property {GameName} game
 * @property {{ text: string; mode: "damask" | "direct" }} name
 * @property {{ text: string; secret: boolean; guess: string }} byte secret: the cards came from a link, the text is the friend's to find
 * @property {{ seed: number; picked: number | null; right: number; tried: number }} guess
 * @property {{ phase: "hand" | "cards"; hand: import("../game/drawBoy.js").DrawBoy; seconds: number; started: number | null }} drawboy
 */

/** @returns {PlayState} */
export const startPlay = () => ({
  game: "name",
  name: { text: "Ada", mode: "damask" },
  byte: { text: "Hello!", secret: false, guess: "" },
  guess: { seed: 1, picked: null, right: 0, tried: 0 },
  drawboy: { phase: "hand", hand: drawBoy.start(), seconds: 0, started: null },
});
