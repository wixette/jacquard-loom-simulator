// M7's checks on the app (design/m7-notes.md), run by index.html?selftest after M6's: L-1 the
// tutorial walked step by step, L-2 a task line works the real control and a step locks what it
// does not use, L-3 links to steps, L-4 the place kept, L-5 the parts a step points at, L-6
// the tutorial in every language, L-7 the guide on a phone, L-8 the view menu and its rules,
// L-9 the workspace the app opens on. T-1 to T-4 need no page (tests/teach/tutorial.test.js).

import { goTo, leaveLearn, openLearn } from "../app/learn.js";
import { linkOf, openLink } from "../app/links.js";
import * as act from "../app/looms.js";
import { LOCALES, t } from "../l10n/l10n.js";
import { encodeLink } from "../sim/link.js";
import { loomAt, shownAt, stepIndex, STEPS } from "../teach/tutorial.js";
import { is3d } from "../app/arrange.js";
import { result } from "./harness.js";
import { englishOnly } from "./m5Checks.js";
/** @import { AppPage } from "./m6Checks.js" */
/** @import { CheckResult } from "./harness.js" */

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** @param {string} sel */
const $ = (sel) => /** @type {HTMLElement | null} */ (document.querySelector(sel));
/** @param {string} sel */
const $$ = (sel) => /** @type {HTMLElement[]} */ ([...document.querySelectorAll(sel)]);
/** @param {import("../l10n/l10n.js").Msg} m */
const keyOf = (m) => ("key" in m ? m.key : null);
const next = () => /** @type {HTMLButtonElement} */ ($(".step-nav .btn.filled"));
/** Whether Next waits (greyed, aria-disabled, so its tooltip can say for what). */
const waiting = () => next().getAttribute("aria-disabled") === "true";

/**
 * @param {AppPage} page
 * @returns {Promise<CheckResult[]>}
 */
export async function runM7Checks(page) {
  const { store } = page;
  const out = [];
  for (const check of [walk, tasks, links, place, glow, languages, phone, viewMenu, opening]) {
    openLearn(store, STEPS[0].id);
    await frames();
    out.push(await check(page));
  }
  leaveLearn(store);
  return out;
}

/**
 * L-1: every step, reached by Next from the first: its title and text, its picture loaded with
 * its credit, the stage's views and the cards as it says, Next waiting for its question and its
 * task and taking the learner on once both are done.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function walk({ store }) {
  /** @type {string[]} */
  const bad = [];
  let pictures = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const s = STEPS[i];
    await frames();
    if (store.state.learn.step !== i) {
      bad.push(`Next did not reach ${s.id}`);
      break;
    }
    if ($("#step-title")?.textContent !== t(`tut.${s.id}.title`)) bad.push(`${s.id}: not its title`);
    if (store.state.views.join() !== shownAt(i).views.join()) bad.push(`${s.id}: views ${store.state.views.join()}`);
    const left = /** @type {HTMLElement} */ ($(".panel.left"));
    // a picture step shows the picture tool where the cards would be
    if (left.classList.contains("guide-only") !== (!shownAt(i).cards && !s.picture)) bad.push(`${s.id}: the cards ${shownAt(i).cards ? "hidden" : "shown"}`);
    if (s.picture && !left.classList.contains("on-picture")) bad.push(`${s.id}: no picture tool`);
    if (s.image) {
      const img = /** @type {HTMLImageElement | null} */ ($(".step-picture img"));
      for (let k = 0; k < 50 && img && !img.complete; k++) await sleep(100);
      if (!img || img.naturalWidth !== s.image.width) bad.push(`${s.id}: the picture did not load`);
      else pictures++;
      if ($(".step-picture figcaption")?.textContent !== t(s.image.credit)) bad.push(`${s.id}: no credit`);
    }
    const waits = !!s.predict || !!s.task;
    if (waits && !waiting() && i < STEPS.length - 1) bad.push(`${s.id}: Next does not wait`);
    if (s.predict) {
      const choice = /** @type {HTMLInputElement} */ ($(`.predict input[value="${s.predict.answer}"]`));
      choice.click();
      await frames();
      if (!$(".feedback.right")) bad.push(`${s.id}: no word on the right answer`);
    }
    if (s.task) {
      if ($(".taskline")?.hidden) bad.push(`${s.id}: no task line once answered`);
      s.task.solve(store.state.looms.tutorial.loom);
      act.touch(store, "tutorial");
      await frames();
      if (!$(".taskline.done")) bad.push(`${s.id}: the task line does not say done`);
      if (s.done && $(".step-done")?.hidden) bad.push(`${s.id}: no done text`);
    }
    if (i < STEPS.length - 1) {
      if (waiting()) bad.push(`${s.id}: Next still waits`);
      next().click();
    }
  }
  const done = store.state.learn.done.length;
  if (done !== STEPS.length) bad.push(`${done} of ${STEPS.length} steps counted done`);
  return result("L-1", "Every step, reached by Next: its texts, its picture and credit, its views and cards; Next waits for its question and task", bad.length === 0, bad.slice(0, 4).join("; ") || `${STEPS.length} steps, ${pictures} pictures, every step counted done`);
}

/**
 * L-2: a task line's button works the real control, which glows while the task waits; a step
 * locks the controls it does not use (greyed; pressed, it says why and changes nothing) and
 * frees those it does: punching a card on the bench.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function tasks({ store }) {
  /** @type {string[]} */
  const bad = [];
  const tut = () => store.state.looms.tutorial;
  goTo(store, stepIndex("how-needles"));
  await frames();
  const fwd = /** @type {HTMLElement} */ ($('.player [data-act="fwd"]'));
  if (!fwd.classList.contains("wanted")) bad.push("Step does not glow");
  /** @type {HTMLElement} */ ($(".taskline .ask")).click();
  await frames();
  if (!$(".taskline.done")) bad.push("the task line's Step did not step the loom");
  if (fwd.classList.contains("wanted")) bad.push("Step still glows once done");
  const add = /** @type {HTMLElement} */ ($('.panel.left [data-l10n-tip="cards.add"]'));
  const cards = tut().loom.deck.cards.length;
  if (add.getAttribute("aria-disabled") !== "true") bad.push("the card tools are not greyed");
  add.click();
  if (tut().loom.deck.cards.length !== cards) bad.push("a locked control changed the cards");
  if (!tut().status.warn || keyOf(tut().status.msg) !== "learn.locked") bad.push("a locked control does not say why");
  goTo(store, stepIndex("weave-punch"));
  await frames();
  const bench = $(".bench-slot");
  if (!bench || bench.hidden) bad.push("no bench for punching");
  const hole = /** @type {SVGElement | null} */ (document.querySelector(".bench-slot [data-hook='0']"));
  hole?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await frames();
  if (!tut().loom.deck.cards[0][0]) bad.push("the bench does not punch in a step that asks for it");
  if ($('.panel.left [data-control="punch"]')?.classList.contains("locked")) bad.push("punching is greyed in a step that asks for it");
  return result("L-2", "A task line's button works the real control, which glows; a step locks what it does not use and frees what it does", bad.length === 0, bad.slice(0, 4).join("; ") || "Step from the task line, the card tools locked with the reason, a hole punched on the bench");
}

/**
 * L-3: Share in Learn writes the step's link; a link opens its step, with the step's loom; a
 * name no step has opens the start and says so.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function links({ store }) {
  /** @type {string[]} */
  const bad = [];
  goTo(store, stepIndex("weave-twill"));
  const fragment = await encodeLink(linkOf(store));
  if (fragment !== "v=2&w=learn&step=weave-twill") bad.push(`Share wrote ${fragment}`);
  leaveLearn(store);
  await openLink(store, `#${fragment}`);
  if (store.state.workspace !== "learn" || store.state.learn.step !== stepIndex("weave-twill")) bad.push("the link did not open its step");
  const want = loomAt(stepIndex("weave-twill")).loom;
  if (store.state.looms.tutorial.loom.deck.cards.length !== want.deck.cards.length) bad.push("not the step's loom");
  await openLink(store, "#v=2&w=learn&step=no-such-step");
  if (store.state.learn.step !== 0 || keyOf(store.state.looms.tutorial.status.msg) !== "learn.noStep") bad.push("an unknown step does not open the start with the reason");
  return result("L-3", "Share in Learn links to the step; a step's link opens it, with its loom; an unknown step opens the start and says so", bad.length === 0, bad.slice(0, 4).join("; ") || fragment);
}

/**
 * L-4: the place and the steps done are kept on the device; leaving for Weave gives Weave's
 * loom and views back as they were; coming back resumes the step.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function place({ store }) {
  /** @type {string[]} */
  const bad = [];
  leaveLearn(store);
  const mine = store.state.looms.mine.loom;
  act.setViews(store, ["front"]);
  openLearn(store, "how-loop");
  const kept = JSON.parse(localStorage.getItem("jacquard.tutorial") ?? "{}");
  if (kept.step !== "how-loop") bad.push(`kept ${kept.step}`);
  leaveLearn(store);
  if (store.state.looms.mine.loom !== mine) bad.push("Weave's loom changed");
  if (store.state.views.join() !== "front") bad.push(`Weave's views are ${store.state.views.join()}`);
  openLearn(store);
  if (store.state.learn.step !== stepIndex("how-loop")) bad.push("Learn did not resume where it was left");
  await frames();
  // the place is on the step's card; the tabs keep their size, whichever workspace is on
  if (!$(".step-kicker")?.textContent?.includes("/")) bad.push("the step's card does not say where");
  const widths = () => ["#ws-learn", "#ws-weave"].map((id) => Math.round($(id)?.getBoundingClientRect().width ?? 0)).join();
  const inLearn = widths();
  leaveLearn(store);
  await frames();
  if (widths() !== inLearn) bad.push(`the tabs change size between the workspaces (${inLearn} → ${widths()})`);
  act.setViews(store, ["section"]);
  return result("L-4", "The place is kept on the device; Weave keeps its loom and views; Learn resumes where it was left, its card says where, and the tabs keep their size", bad.length === 0, bad.slice(0, 4).join("; ") || `resumed at how-loop, ${kept.done?.length ?? 0} steps kept done`);
}

/**
 * L-5: the parts a step points at glow in the section, their labels in amber, and nothing glows
 * in Weave.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function glow({ store }) {
  /** @type {string[]} */
  const bad = [];
  goTo(store, stepIndex("how-section"));
  await frames();
  const svg = /** @type {SVGSVGElement | null} */ (document.querySelector(".stage svg.section"));
  const want = STEPS[stepIndex("how-section")].glow ?? [];
  if (svg?.dataset.glow !== want.join(" ")) bad.push(`glows ${svg?.dataset.glow}`);
  const amber = getComputedStyle(document.documentElement).getPropertyValue("--attention").trim();
  const lbl = document.querySelector(".stage svg.section .lbl.p-cylinder");
  const fill = lbl ? getComputedStyle(lbl).fill : "";
  const probe = document.createElement("span");
  probe.style.color = amber;
  document.body.append(probe);
  if (!lbl || fill !== getComputedStyle(probe).color) bad.push(`the cylinder's label is ${fill}`);
  probe.remove();
  leaveLearn(store);
  await frames();
  if (/** @type {SVGSVGElement | null} */ (document.querySelector(".stage svg.section"))?.dataset.glow) bad.push("Weave glows");
  return result("L-5", "The parts a step points at glow in the section, with their labels in amber; nothing glows in Weave", bad.length === 0, bad.slice(0, 4).join("; ") || `how-section: ${want.join(", ")}`);
}

/**
 * L-6: in every language every step of the tutorial speaks it: nothing in the guide is left in
 * English (names and Lovelace's words apart, which English also has in every language).
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function languages({ store }) {
  /** @type {string[]} */
  const bad = [];
  const { chooseLanguage } = await import("../app/language.js");
  act.setViews(store, ["section"]);
  for (const l of LOCALES.filter((x) => x !== "en")) {
    await chooseLanguage(store, l);
    const only = englishOnly(l);
    for (let i = 0; i < STEPS.length; i++) {
      act.setLearn(store, { step: i });
      const box = /** @type {HTMLElement} */ ($(".guide-box"));
      const left = [...new Set((box.textContent?.match(/[A-Za-z]{4,}/g) ?? []).filter((w) => only.has(w)))];
      if (left.length) bad.push(`${l}, ${STEPS[i].id}: ${left.slice(0, 4).join(", ")}`);
    }
  }
  await chooseLanguage(store, "en");
  return result("L-6", "In every language every step speaks it, with no English left", bad.length === 0, bad.slice(0, 4).join("; ") || `${LOCALES.length - 1} languages × ${STEPS.length} steps`);
}

/**
 * L-7: on a phone, Learn opens the sheet on the guide, with the step on show.
 * @returns {Promise<CheckResult>}
 */
async function phone() {
  /** @type {string[]} */
  const bad = [];
  const f = document.createElement("iframe");
  f.style.cssText = "position: fixed; left: 0; top: 0; width: 390px; height: 844px; border: 0; visibility: hidden; z-index: -1";
  f.src = "index.html#v=2&w=learn&step=weave-plain";
  document.body.appendChild(f);
  const doc = await new Promise((r) => f.addEventListener("load", () => r(/** @type {Document} */ (f.contentDocument)), { once: true }));
  for (let k = 0; k < 50 && !doc.querySelector(".sheet #step-title"); k++) await sleep(100);
  const tab = doc.querySelector(".sheet [role=tab][aria-selected=true]");
  if (tab?.id !== "sheet-guide") bad.push(`the sheet opens on ${tab?.id}`);
  if (doc.querySelector(".sheet #step-title")?.textContent !== t("tut.weave-plain.title")) bad.push("not the linked step");
  if (!doc.querySelector(".under-stage .player")) bad.push("no controls under the stage");
  f.remove();
  return result("L-7", "On a phone, Learn opens the sheet on the guide, at the step, with the controls under the stage", bad.length === 0, bad.slice(0, 4).join("; ") || "390 × 844: the guide tab, weave-plain");
}

/**
 * L-8: the view menu is one flat list in two groups, the 2D drawings and the 3D models, with no
 * unit codes; a view on show elsewhere says where, and choosing it swaps the two panes; the
 * four-view grid keeps one 3D model; two and four keep the views on show.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function viewMenu({ store }) {
  /** @type {string[]} */
  const bad = [];
  leaveLearn(store);
  act.setViews(store, ["section", "3d", "front", "side"]);
  await frames();
  /** @type {HTMLElement} */ ($$(".stage .view-chip")[2]).click();
  const menu = $(".menu");
  const heads = [...(menu?.querySelectorAll(".menu-divider span") ?? [])].map((e) => e.textContent);
  if (heads.join("|") !== [t("view.group.2d"), t("view.group.3d")].join("|")) bad.push(`groups: ${heads.join(", ")}`);
  const items = [...(menu?.querySelectorAll("[role=menuitemradio]") ?? [])].map((e) => e.textContent ?? "");
  if (items.length !== 10) bad.push(`${items.length} items`);
  if (items.some((x) => /\bU[1-5]\b/.test(x))) bad.push("a unit code shows");
  if (!items[0].includes(t("view.at.topLeft"))) bad.push(`the section does not say where it is: ${items[0]}`);
  /** @type {HTMLElement} */ (menu?.querySelectorAll("[role=menuitemradio]")[0]).click();
  await frames();
  if (store.state.views.join() !== "front,3d,section,side") bad.push(`choosing the section gave ${store.state.views.join()}`);
  /** @type {HTMLElement} */ ($$(".stage .view-chip")[3]).click();
  /** @type {HTMLElement} */ ([...document.querySelectorAll(".menu [role=menuitemradio]")].find((e) => e.textContent === t("view.u1"))).click();
  await frames();
  if (store.state.views.filter(is3d).length !== 1 || store.state.views[3] !== "u1") bad.push(`a unit in four gave ${store.state.views.join()}`);
  act.setViews(store, ["u2"]);
  await frames();
  /** @type {HTMLElement} */ ($('.stage-tools [data-n="2"]')).click();
  await frames();
  if (store.state.views.join() !== "u2,section") bad.push(`two from u2 gave ${store.state.views.join()}`);
  if ($(".stage .view-chip")?.textContent !== t("view.in3d", { name: t("view.u2") })) bad.push(`the chip reads ${$(".stage .view-chip")?.textContent}`);
  act.setViews(store, ["section"]);
  return result("L-8", "The view menu: two groups, no unit codes, a view on show says where and swaps; four keeps one 3D model; two keeps the view on show", bad.length === 0, bad.slice(0, 4).join("; ") || "the section swapped from the top left; a unit replaced the whole loom; u2 kept going to two");
}

/**
 * L-9: without a link a newcomer opens on Learn, with the whole loom in 3D; after that the app
 * opens on the last workspace used (Weave, Design, Games, on its game); a link decides for itself.
 * @returns {Promise<CheckResult>}
 */
async function opening() {
  /** @type {string[]} */
  const bad = [];
  const kept = { ws: localStorage.getItem("jacquard.workspace"), tut: localStorage.getItem("jacquard.tutorial"), game: localStorage.getItem("jacquard.game") };
  /** @param {string} url @returns {Promise<{ ws: string; views: string; game: string }>} */
  const open = async (url) => {
    const f = document.createElement("iframe");
    f.style.cssText = "position: fixed; left: 0; top: 0; width: 1366px; height: 768px; border: 0; visibility: hidden; z-index: -1";
    f.src = url;
    document.body.appendChild(f);
    await new Promise((r) => f.addEventListener("load", r, { once: true }));
    const doc = /** @type {Document} */ (f.contentDocument);
    for (let k = 0; k < 50 && !doc.querySelector(".app .player"); k++) await sleep(100);
    const app = /** @type {HTMLElement} */ (doc.querySelector(".app"));
    const views = [...doc.querySelectorAll(".stage .view-chip .view-name")].map((e) => e.textContent).join(",");
    const game = /** @type {HTMLElement | null} */ (doc.querySelector('.game-tabs [aria-selected="true"]'))?.dataset.game ?? "";
    f.remove();
    return { ws: app.dataset.ws ?? "", views, game };
  };
  localStorage.removeItem("jacquard.workspace");
  localStorage.removeItem("jacquard.tutorial");
  const first = await open("index.html");
  if (first.ws !== "learn" || first.views !== t("view.in3d", { name: t("view.3d") })) bad.push(`a newcomer opens on ${first.ws}, ${first.views}`);
  localStorage.setItem("jacquard.workspace", "weave");
  const again = await open("index.html");
  if (again.ws !== "weave") bad.push(`after Weave the app opens on ${again.ws}`);
  localStorage.setItem("jacquard.workspace", "create");
  const design = await open("index.html");
  if (design.ws !== "create") bad.push(`after Design the app opens on ${design.ws}`);
  localStorage.setItem("jacquard.workspace", "play");
  localStorage.setItem("jacquard.game", "guess");
  const games = await open("index.html");
  if (games.ws !== "play" || games.game !== "guess") bad.push(`after Games on guess the cloth the app opens on ${games.ws}, ${games.game}`);
  localStorage.setItem("jacquard.workspace", "learn");
  const linked = await open("index.html#v=2&w=weave");
  if (linked.ws !== "weave") bad.push(`a Weave link opens ${linked.ws}`);
  for (const [k, v] of Object.entries({ "jacquard.workspace": kept.ws, "jacquard.tutorial": kept.tut, "jacquard.game": kept.game })) {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  }
  return result("L-9", "A newcomer opens on Learn with the whole loom in 3D; after that, on the workspace last used (Games on its game); a link decides for itself", bad.length === 0, bad.slice(0, 4).join("; ") || "newcomer: Learn, 3D; then Weave, Design, Games on guess the cloth; a Weave link: Weave");
}
