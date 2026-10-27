// M8's checks on the app (design/m8-notes.md), run by index.html?selftest after M7's: C-1 Create
// opens on its picture and the large cloth, C-2 painting the paper weaves it again, C-3 the two
// readings and what the status line says of them, C-4 Weave it, C-5 Create's link, C-6 what
// Create's loom refuses. The picture's reading itself needs no page (tests/sim/picture.test.js).

import { openCreate } from "../app/create.js";
import { leaveLearn } from "../app/learn.js";
import { linkOf, openLink } from "../app/links.js";
import * as act from "../app/looms.js";
import { encodeLink } from "../sim/link.js";
import { readPicture, startPicture } from "../sim/picture.js";
import { result } from "./harness.js";
/** @import { AppPage } from "./m6Checks.js" */
/** @import { CheckResult } from "./harness.js" */

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** @param {string} sel */
const $ = (sel) => /** @type {HTMLElement | null} */ (document.querySelector(sel));
/** @param {import("../l10n/l10n.js").Msg} m */
const keyOf = (m) => ("key" in m ? m.key : null);
/** @param {boolean[][]} rows */
const rowsKey = (rows) => rows.map((r) => r.map(Number).join("")).join("/");

/**
 * @param {AppPage} page
 * @returns {Promise<CheckResult[]>}
 */
export async function runM8Checks(page) {
  const { store } = page;
  const out = [];
  for (const check of [opens, paint, readings, weaveIt, link, refuses]) {
    act.setPicture(store, { rows: startPicture().rows, mode: "direct", k: 4, perRow: 1, invert: false }, "create");
    openCreate(store);
    await frames();
    out.push(await check(page));
  }
  leaveLearn(store);
  await frames();
  return out;
}

/**
 * C-1: Create opens on its own loom, the picture tool on the left, the cloth alone on the stage
 * and the picture's cards on the right.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function opens({ store }) {
  /** @type {string[]} */
  const bad = [];
  if (store.state.current !== "create") bad.push(`the loom is ${store.state.current}`);
  if (store.state.views.join() !== "cloth") bad.push(`views ${store.state.views.join()}`);
  if (!$(".panel.left .pic-grid")) bad.push("no paper");
  if (!$(".panel.right .weave-it")) bad.push("no Weave it");
  if (!$(".stage .cloth-box.large canvas")) bad.push("no large cloth");
  const l = store.state.looms.create.loom;
  if (l.pick !== l.deck.cards.length) bad.push("the cloth is not woven to its end");
  return result("C-1", "Create opens on its loom: the paper on the left, the cloth alone and large, the cards and Weave it on the right", bad.length === 0, bad.slice(0, 4).join("; ") || `${l.deck.cards.length} cards, ${l.deck.hooks} hooks`);
}

/**
 * C-2: a stroke on the paper changes the picture, and the loom weaves it again.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function paint({ store }) {
  /** @type {string[]} */
  const bad = [];
  const grid = /** @type {HTMLCanvasElement} */ ($(".panel.left .pic-grid"));
  const before = store.state.pictures.create.rows;
  const deck = store.state.looms.create.loom.deck;
  const r = grid.getBoundingClientRect();
  const n = before.length;
  const at = (/** @type {number} */ x, /** @type {number} */ y) => ({ clientX: r.left + ((x + 0.5) * r.width) / n, clientY: r.top + ((y + 0.5) * r.height) / n, button: 0, pointerId: 1, bubbles: true });
  grid.dispatchEvent(new PointerEvent("pointerdown", at(0, 0)));
  grid.dispatchEvent(new PointerEvent("pointermove", at(1, 0)));
  grid.dispatchEvent(new PointerEvent("pointermove", at(2, 0)));
  grid.dispatchEvent(new PointerEvent("pointerup", at(2, 0)));
  await frames();
  const after = store.state.pictures.create.rows;
  const paint0 = !before[0][0];
  if (![0, 1, 2].every((x) => after[0][x] === paint0)) bad.push("the stroke did not paint its squares");
  if (after.slice(1).some((row, y) => rowsKey([row]) !== rowsKey([before[y + 1]]))) bad.push("the stroke painted other rows");
  if (store.state.looms.create.loom.deck === deck) bad.push("the loom did not weave it again");
  return result("C-2", "A stroke on the paper paints its squares, dark or light as the first decides, and the loom weaves the picture again", bad.length === 0, bad.slice(0, 4).join("; ") || `3 squares ${paint0 ? "dark" : "light"}`);
}

/**
 * C-3: the heart read square by square has long floats, drawn on the cloth and said in the
 * status line; read as damask it holds together, on more cards.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function readings({ store }) {
  /** @type {string[]} */
  const bad = [];
  const status = () => store.state.looms.create.status.msg;
  const holds = () => {
    const m = status();
    return "key" in m ? /** @type {any} */ (m.params?.holds)?.key : null;
  };
  if (keyOf(status()) !== "pic.reading" || holds() !== "pic.loose") bad.push(`square by square: ${keyOf(status())}, ${holds()}`);
  const direct = store.state.looms.create.loom.deck.cards.length;
  /** @type {HTMLElement} */ ($('.panel.left [data-mode="damask"]')).click();
  await frames();
  if (store.state.pictures.create.mode !== "damask") bad.push("As damask did not change the reading");
  if (holds() !== "pic.holds") bad.push(`as damask: ${holds()}`);
  const damask = store.state.looms.create.loom.deck.cards.length;
  if (damask <= direct) bad.push(`damask on ${damask} cards, square by square on ${direct}`);
  const r = readPicture(store.state.pictures.create);
  if (!r.ok || r.cards.floats.length) bad.push("the damask reading has floats");
  return result("C-3", "Read square by square the heart floats, and the status line says so; as damask it holds together, on more cards", bad.length === 0, bad.slice(0, 4).join("; ") || `${direct} cards square by square, ${damask} as damask`);
}

/**
 * C-4: Weave it puts the picture's cards on the learner's own loom, in Weave.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function weaveIt({ store }) {
  /** @type {string[]} */
  const bad = [];
  const cards = JSON.stringify(store.state.looms.create.loom.deck.cards);
  /** @type {HTMLElement} */ ($(".panel.right .weave-it")).click();
  await frames();
  if (store.state.workspace !== "weave" || store.state.current !== "mine") bad.push(`went to ${store.state.workspace}, ${store.state.current}`);
  if (JSON.stringify(store.state.looms.mine.loom.deck.cards) !== cards) bad.push("not the picture's cards");
  if (keyOf(store.state.looms.mine.status.msg) !== "pic.woven") bad.push("the status line does not say whose cards they are");
  return result("C-4", "Weave it puts the picture's cards on the learner's own loom, in Weave, and says so", bad.length === 0, bad.slice(0, 4).join("; ") || `${JSON.parse(cards).length} cards on Weave's loom`);
}

/**
 * C-5: Share in Create writes the picture and its reading; the link opens them again.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function link({ store }) {
  /** @type {string[]} */
  const bad = [];
  act.setPicture(store, { mode: "damask", k: 3 }, "create");
  const want = store.state.pictures.create;
  const fragment = await encodeLink(linkOf(store));
  if (!fragment.includes("w=create") || !fragment.includes("pic=")) bad.push(`Share wrote ${fragment.slice(0, 60)}`);
  act.setPicture(store, { rows: startPicture().rows, mode: "direct", k: 4 }, "create");
  leaveLearn(store);
  await openLink(store, `#${fragment}`);
  const got = store.state.pictures.create;
  if (store.state.workspace !== "create") bad.push(`opened ${store.state.workspace}`);
  if (rowsKey(got.rows) !== rowsKey(want.rows) || got.mode !== "damask" || got.k !== 3) bad.push("not the same picture and reading");
  return result("C-5", "Create's link holds the picture and its reading, and opens them again", bad.length === 0, bad.slice(0, 4).join("; ") || `${fragment.length} characters`);
}

/**
 * C-6: Create's loom is the picture's: a control that would change its cards refuses and says
 * why; its colours are free.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function refuses({ store }) {
  /** @type {string[]} */
  const bad = [];
  const deck = store.state.looms.create.loom.deck;
  act.add(store, "create");
  if (store.state.looms.create.loom.deck !== deck) bad.push("a card was added");
  if (keyOf(store.state.looms.create.status.msg) !== "pic.locked") bad.push("it does not say why");
  act.setColours(store, { warp: "#336699" }, "create");
  if (store.state.looms.create.warp !== "#336699") bad.push("the colours are not free");
  return result("C-6", "Create's loom refuses a change to its cards and says why; its colours are free", bad.length === 0, bad.slice(0, 4).join("; ") || "add refused with pic.locked; the warp recoloured");
}
