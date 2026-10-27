// M8's checks on the app (design/m8-notes.md), run by index.html?selftest after M7's: C-1 Design
// opens on its picture and the large cloth, C-2 painting the paper weaves it again, C-3 the two
// readings and what the status line says of them, C-4 Weave it, C-5 Design's link, C-6 what
// Design's loom refuses, C-7 an image opened. The picture's reading itself needs no page (tests/sim/picture.test.js).

import { openCreate } from "../app/create.js";
import { leaveLearn } from "../app/learn.js";
import { linkOf, openLink } from "../app/links.js";
import * as act from "../app/looms.js";
import { encodeLink } from "../sim/link.js";
import { readPicture, startPicture } from "../sim/picture.js";
import { t } from "../l10n/l10n.js";
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
  for (const check of [opens, paint, readings, weaveIt, link, refuses, image]) {
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
  if (!$(".panel.left .weave-it") || !$(".panel.left .chain-slot .chain-box")) bad.push("no cards and Weave it under the paper");
  if (!$(".panel.right svg.section")) bad.push("no machine on the right");
  if (!$(".stage .cloth-box.large canvas")) bad.push("no large cloth");
  const l = store.state.looms.create.loom;
  if (l.pick !== l.deck.cards.length) bad.push("the cloth is not woven to its end");
  return result("C-1", "Design opens on its loom: the paper on the left with its cards and Weave it under it, the cloth alone and large, the machine on the right", bad.length === 0, bad.slice(0, 4).join("; ") || `${l.deck.cards.length} cards, ${l.deck.hooks} hooks`);
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
  /** @type {HTMLElement} */ ($(".panel.left .weave-it")).click();
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

/**
 * C-7: before the file dialog, the image button says what an image becomes (the formats, the
 * paper's size it is shrunk to, the level of dark); an image opened is fitted in the paper, not
 * stretched, and its level shows above the paper.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function image({ store }) {
  /** @type {string[]} */
  const bad = [];
  /** @type {HTMLElement} */ ($('.pic-tools [aria-haspopup="dialog"]')).click();
  await frames();
  const pop = $(".popover.image-pop");
  const n = store.state.pictures.create.rows.length;
  if (!pop) bad.push("no word before the file dialog");
  else {
    const text = pop.textContent ?? "";
    for (const key of ["pic.open.formats", "pic.open.best", "pic.open.private"]) if (!text.includes(t(key))) bad.push(`it does not say ${key}`);
    if (!text.includes(t("pic.open.size", { n }))) bad.push("it does not say the paper's size");
    if (!pop.querySelector(".popover-foot .btn")) bad.push("no Choose an image");
  }
  pop?.dispatchEvent(new Event("shut"));
  // a wide image, twice as wide as tall, all dark: fitted, the paper's top and bottom quarters stay light
  const c = document.createElement("canvas");
  c.width = 200;
  c.height = 100;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  g.fillStyle = "#000";
  g.fillRect(0, 0, 200, 100);
  const blob = await new Promise((r) => c.toBlob(r));
  const files = new DataTransfer();
  files.items.add(new File([/** @type {Blob} */ (blob)], "wide.png", { type: "image/png" }));
  const input = /** @type {HTMLInputElement} */ ($(".pic-file"));
  input.files = files.files;
  input.dispatchEvent(new Event("change"));
  for (let k = 0; k < 30 && !store.state.pictures.create.rows.some((r) => r.every(Boolean)); k++) await frames();
  const rows = store.state.pictures.create.rows;
  const dark = rows.map((r) => r.every(Boolean));
  if (dark[0] || dark[n - 1] || !dark[Math.floor(n / 2)]) bad.push(`not fitted: dark rows ${dark.map(Number).join("")}`);
  const level = $(".pic-threshold");
  const paper = $(".pic-grid");
  if (!level || level.hidden) bad.push("no level once opened");
  else if (paper && level.getBoundingClientRect().top > paper.getBoundingClientRect().top) bad.push("the level is under the paper");
  return result("C-7", "The image button says first what an image becomes (formats, the paper's size, the level of dark); an image opened is fitted in the paper, its level above it", bad.length === 0, bad.slice(0, 4).join("; ") || `a 2 : 1 image on ${n} × ${n}: ${dark.filter(Boolean).length} dark rows`);
}
