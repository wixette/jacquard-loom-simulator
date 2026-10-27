// M9's checks on the app (design/m9-notes.md), run by index.html?selftest after M8's: G-1 Play
// opens on its loom with the four games, G-2 the name game woven reads back as typed, G-3 one
// byte per card and the friend's secret, G-4 guess the cloth, G-5 draw boy against Jacquard, G-6
// a game's link. The games' logic needs no page (tests/game/games.test.js).

import { leaveLearn } from "../app/learn.js";
import { linkOf, openLink } from "../app/links.js";
import * as play from "../app/play.js";
import { GAMES } from "../app/playState.js";
import { readMessage } from "../game/byteGame.js";
import { ROWS } from "../game/drawBoy.js";
import { decodeCloth, planName } from "../game/nameGame.js";
import { t } from "../l10n/l10n.js";
import { encodeLink } from "../sim/link.js";
import { result } from "./harness.js";
/** @import { AppPage } from "./m6Checks.js" */
/** @import { CheckResult } from "./harness.js" */

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** @param {string} sel */
const $ = (sel) => /** @type {HTMLElement | null} */ (document.querySelector(sel));
/** @param {string} sel */
const $$ = (sel) => /** @type {HTMLElement[]} */ ([...document.querySelectorAll(sel)]);
/** The game's filled button, by its text. @param {string} key */
const button = (key) => /** @type {HTMLElement | undefined} */ ($$(".game-body button").find((b) => b.textContent?.trim() === t(key)));

/**
 * @param {AppPage} page
 * @returns {Promise<CheckResult[]>}
 */
export async function runM9Checks(page) {
  const { store } = page;
  const out = [];
  for (const check of [opens, names, bytes, guess, drawBoy, link]) {
    play.openPlay(store, "name");
    await frames();
    out.push(await check(page));
  }
  leaveLearn(store);
  await frames();
  return out;
}

/**
 * G-1: Play opens on the game loom, the cloth on the stage, the games in four tabs; a tab
 * chooses its game.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function opens({ store }) {
  /** @type {string[]} */
  const bad = [];
  if (store.state.workspace !== "play" || store.state.current !== "game") bad.push(`${store.state.workspace}, ${store.state.current}`);
  if (store.state.views.join() !== "cloth") bad.push(`views ${store.state.views.join()}`);
  const tabs = $$(".game-tabs [role=tab]");
  if (tabs.map((b) => b.dataset.game).join() !== GAMES.join()) bad.push(`tabs ${tabs.map((b) => b.dataset.game).join()}`);
  for (const b of tabs) {
    b.click();
    await frames();
    if (store.state.play.game !== b.dataset.game || $(".game-title")?.textContent !== t(`game.${b.dataset.game}.title`)) bad.push(`the ${b.dataset.game} tab did not open its game`);
  }
  return result("G-1", "Play opens on its loom with the cloth, and a tab for each of the four games opens it", bad.length === 0, bad.slice(0, 4).join("; ") || GAMES.join(", "));
}

/**
 * G-2: the name game: the text typed, woven to the end in both readings, reads back as typed.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function names({ store }) {
  /** @type {string[]} */
  const bad = [];
  const area = /** @type {HTMLTextAreaElement} */ ($(".game-body textarea"));
  area.value = "JACQUARD";
  area.dispatchEvent(new Event("input", { bubbles: true }));
  for (const mode of /** @type {const} */ (["damask", "direct"])) {
    /** @type {HTMLElement} */ ($(`.game-body [data-mode="${mode}"]`)).click();
    await frames();
    button("game.weaveAll")?.click();
    await frames();
    const l = store.state.looms.game.loom;
    if (l.pick !== l.deck.cards.length) bad.push(`${mode}: not woven to the end`);
    const plan = planName("JACQUARD", mode);
    const read = plan.ok ? decodeCloth(l.cloth, plan.plan).join("\n") : plan.reason;
    if (read !== "JACQUARD") bad.push(`${mode}: reads ${read}`);
  }
  return result("G-2", "The name game: the text typed, woven to the end, reads back as typed, as damask and square by square", bad.length === 0, bad.slice(0, 4).join("; ") || "JACQUARD both ways");
}

/**
 * G-3: one byte per card: the message is a card a character, woven back into the text; its link
 * gives a friend only the cards, and the right reading is told so.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function bytes({ store }) {
  /** @type {string[]} */
  const bad = [];
  play.chooseGame(store, "byte");
  play.setMessage(store, "Loom");
  await frames();
  if (store.state.looms.game.loom.deck.cards.length !== 4) bad.push(`${store.state.looms.game.loom.deck.cards.length} cards for 4 characters`);
  button("game.weaveAll")?.click();
  await frames();
  if (readMessage(store.state.looms.game.loom.cloth) !== "Loom") bad.push(`the cloth reads ${readMessage(store.state.looms.game.loom.cloth)}`);
  const fragment = await encodeLink(linkOf(store));
  if (fragment.includes("Loom")) bad.push("the link gives the message away");
  play.setMessage(store, "Other");
  await openLink(store, `#${fragment}`);
  await frames();
  if (!store.state.play.byte.secret) bad.push("the link does not open the secret");
  const guess = /** @type {HTMLInputElement | null} */ ($(".game-body input.game-input"));
  if (!guess) bad.push("no field for the reading");
  else {
    guess.value = "Loom";
    guess.dispatchEvent(new Event("input", { bubbles: true }));
    button("byte.check")?.click();
    await frames();
    if (!$(".game-body .game-result")?.textContent) bad.push("Check says nothing");
  }
  return result("G-3", "One byte per card: a card a character, the cloth reads back as the message; its link gives only the cards, to be read", bad.length === 0, bad.slice(0, 4).join("; ") || `Loom in 4 cards; a ${fragment.length}-character link`);
}

/**
 * G-4: guess the cloth: three cloths, one the deck weaves; a wrong pick is told why, the right
 * one counted; Next brings another puzzle.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function guess({ store }) {
  /** @type {string[]} */
  const bad = [];
  play.chooseGame(store, "guess");
  await frames();
  const choices = $$(".guess-choices .guess-choice");
  if (choices.length !== 3) bad.push(`${choices.length} cloths`);
  const { puzzle } = await import("../game/guessGame.js");
  const q = puzzle(store.state.play.guess.seed);
  const wrong = [0, 1, 2].find((i) => i !== q.answer) ?? 0;
  choices[wrong]?.click();
  await frames();
  if (!$(".game-body .game-result")?.textContent) bad.push("a wrong pick is not told why");
  if (store.state.play.guess.tried !== 1 || store.state.play.guess.right !== 0) bad.push("the wrong pick is not counted");
  const seed = store.state.play.guess.seed;
  button("guess.next")?.click();
  await frames();
  if (store.state.play.guess.seed === seed) bad.push("Next did not bring another puzzle");
  const q2 = puzzle(store.state.play.guess.seed);
  $$(".guess-choices .guess-choice")[q2.answer]?.click();
  await frames();
  if (store.state.play.guess.right !== 1) bad.push(`the right pick is not counted (${store.state.play.guess.right})`);
  return result("G-4", "Guess the cloth: three cloths; a wrong pick is told why, the right one counted; Next brings another", bad.length === 0, bad.slice(0, 4).join("; ") || `puzzle ${seed}, answer ${q.answer + 1}`);
}

/**
 * G-5: draw boy against Jacquard: the figure woven by hand, cord by cord, row by row, then by the
 * cards, the same cloth.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function drawBoy({ store }) {
  /** @type {string[]} */
  const bad = [];
  play.chooseGame(store, "drawboy");
  await frames();
  for (const row of ROWS) {
    row.forEach((up, e) => up && $$(".cords .cord")[e]?.click());
    button("drawboy.throw")?.click();
    await frames();
  }
  const hand = store.state.play.drawboy.hand;
  if (hand.woven.length !== ROWS.length) bad.push(`${hand.woven.length} rows by hand`);
  if (hand.woven.some((r, p) => r.join() !== ROWS[p].join())) bad.push("the hand's cloth is not the figure");
  button("drawboy.toCards")?.click();
  await frames();
  if (store.state.play.drawboy.phase !== "cards") bad.push("not on the cards");
  // the cards weave on the loom's own controls, as any chain does
  play.weaveAll(store);
  await frames();
  const cloth = store.state.looms.game.loom.cloth;
  if (cloth.length !== ROWS.length || cloth.some((r, p) => r.slice(0, 8).join() !== ROWS[p].join())) bad.push("the cards' cloth is not the figure");
  return result("G-5", "Draw boy against Jacquard: the figure woven cord by cord by hand, then by the cards, the same cloth", bad.length === 0, bad.slice(0, 4).join("; ") || `${hand.pulls} cords pulled for ${ROWS.length} rows`);
}

/**
 * G-6: a game's link opens the same game, and guess the cloth the same puzzle.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function link({ store }) {
  /** @type {string[]} */
  const bad = [];
  play.chooseGame(store, "guess");
  play.nextPuzzle(store);
  play.nextPuzzle(store);
  const seed = store.state.play.guess.seed;
  const fragment = await encodeLink(linkOf(store));
  play.chooseGame(store, "name");
  leaveLearn(store);
  await openLink(store, `#${fragment}`);
  if (store.state.workspace !== "play" || store.state.play.game !== "guess" || store.state.play.guess.seed !== seed) bad.push(`opened ${store.state.workspace}, ${store.state.play.game}, puzzle ${store.state.play.guess.seed}`);
  return result("G-6", "A game's link opens the same game; guess the cloth, the same puzzle", bad.length === 0, bad.slice(0, 4).join("; ") || fragment);
}
