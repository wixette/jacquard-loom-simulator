// M7's checks on the app (design/m7-notes.md), run by index.html?selftest after M6's: L-1 the
// tutorial walked step by step, L-2 a task line works the real control and a step locks what it
// does not use, L-3 links to steps, L-4 the place kept, L-5 the parts a step points at, L-6
// the tutorial in every language, L-7 the guide on a phone. T-1 to T-4 need no page
// (tests/teach/tutorial.test.js).

import { goTo, leaveLearn, openLearn } from "../app/learn.js";
import { linkOf, openLink } from "../app/links.js";
import * as act from "../app/looms.js";
import { LOCALES, t } from "../l10n/l10n.js";
import { encodeLink } from "../sim/link.js";
import { loomAt, shownAt, stepIndex, STEPS } from "../teach/tutorial.js";
import { result } from "./harness.js";
import { englishOnly } from "./m5Checks.js";
/** @import { AppPage } from "./m6Checks.js" */
/** @import { CheckResult } from "./harness.js" */

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** @param {string} sel */
const $ = (sel) => /** @type {HTMLElement | null} */ (document.querySelector(sel));
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
  for (const check of [walk, tasks, links, place, glow, languages, phone]) {
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
    if (left.classList.contains("guide-only") === shownAt(i).cards) bad.push(`${s.id}: the cards ${shownAt(i).cards ? "hidden" : "shown"}`);
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
  const tab = $("#ws-learn .ws-where");
  if (!tab || tab.hidden || !tab.textContent?.includes("/")) bad.push("the Learn tab does not carry the place");
  leaveLearn(store);
  act.setViews(store, ["section"]);
  return result("L-4", "The place is kept on the device; Weave keeps its loom and views; Learn resumes where it was left, and its tab says where", bad.length === 0, bad.slice(0, 4).join("; ") || `resumed at how-loop, ${kept.done?.length ?? 0} steps kept done`);
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
