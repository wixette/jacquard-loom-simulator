// M5's checks in the page (design/m5-notes.md): F-3, every component mounts in any slot,
// draws to its host's size and again when the host is resized, and unmounts leaving nothing
// behind; F-6, a new language redraws every component in it. The other M5 checks need no page
// and run in Node (tests/app/, tests/l10n.test.js, tests/sim/link.test.js).

import { COMPONENTS } from "../app/components/all.js";
import { followHook, step } from "../app/looms.js";
import { MESSAGES } from "../l10n/all.js";
import { LOCALES } from "../l10n/l10n.js";
import { result } from "./harness.js";
/** @import { Placed } from "../app/components/component.js" */
/** @import { AppStore } from "../app/looms.js" */
/** @import { Locale } from "../l10n/l10n.js" */
/** @import { CheckResult } from "./harness.js" */

/**
 * What the checks drive: the M5 page (dev/07-foundations/main.js).
 * @typedef {object} M5Page
 * @property {AppStore} store
 * @property {(Placed | null)[]} slots
 * @property {Placed[]} band
 * @property {(i: number, name: string) => void} setSlot
 * @property {(l: Locale) => Promise<void>} language
 */

/** Two frames: the resize observers and the drawing have run. */
const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {M5Page} page
 * @returns {Promise<CheckResult[]>}
 */
export async function runM5PageChecks(page) {
  const keep = page.slots.map((p) => (p ? /** @type {string} */ (Object.keys(COMPONENTS).find((k) => COMPONENTS[k](page.store).name === p.component.name)) : ""));
  const out = [await lifecycle(page), await languages(page)];
  keep.forEach((name, i) => page.setSlot(i, name));
  return out;
}

/**
 * F-3: in two slots of different sizes, every component mounts, fills its host, redraws when
 * the host is resized, shows the same state in either slot, and unmounts leaving nothing.
 * @param {M5Page} page
 * @returns {Promise<CheckResult>}
 */
async function lifecycle(page) {
  /** @type {string[]} */
  const bad = [];
  const store = page.store;
  for (let i = 0; i < 4; i++) step(store);
  followHook(store, 2);
  const slotsOf = [0, 4];
  for (const i of slotsOf) page.setSlot(i, "");
  // the page's own 3D views finish loading first (their canvases come when three.js has)
  for (let k = 0; k < 100 && document.querySelector(".view-note"); k++) await sleep(200);
  await frames();
  const watchers = store.watchers.size;
  const canvases = document.querySelectorAll("canvas").length;
  let n = 0;
  for (const name of Object.keys(COMPONENTS)) {
    for (const i of slotsOf) {
      page.setSlot(i, name);
      const placed = /** @type {Placed} */ (page.slots[i]);
      const host = placed.host;
      if (name === "units") {
        // the 3D loom loads its models: wait for them, up to 20 s
        for (let k = 0; k < 100 && host.querySelector(".view-note"); k++) await sleep(200);
        if (host.querySelector(".view-note")) bad.push(`units in slot ${i + 1}: not loaded`);
      }
      await frames();
      n++;
      const where = `${name} in slot ${i + 1}`;
      if (host.childElementCount === 0) bad.push(`${where}: drew nothing`);
      const box = host.getBoundingClientRect();
      for (const c of host.children) {
        const r = c.getBoundingClientRect();
        if (r.width > box.width + 1 || r.height > box.height + 1) bad.push(`${where}: ${c.tagName.toLowerCase()} overflows its host (${Math.round(r.width)} × ${Math.round(r.height)} in ${Math.round(box.width)} × ${Math.round(box.height)})`);
      }
      const drawing = host.querySelector(":scope > svg, :scope > canvas");
      if (drawing && ["section", "side", "front", "units"].includes(name)) {
        const r = drawing.getBoundingClientRect();
        if (Math.abs(r.width - box.width) > 2 || Math.abs(r.height - box.height) > 2) bad.push(`${where}: the drawing does not fill its host`);
      }
      // A resize redraws.
      const update = placed.component.update;
      let drawn = 0;
      placed.component.update = (s) => {
        drawn++;
        update(s);
      };
      host.style.maxWidth = `${Math.round(box.width * 0.7)}px`;
      await frames();
      host.style.maxWidth = "";
      await frames();
      placed.component.update = update;
      if (drawn === 0) bad.push(`${where}: not drawn again when resized`);
    }
    // The same state in both slots.
    const [a, b] = slotsOf.map((i) => /** @type {Placed} */ (page.slots[i]).host);
    const marks = (/** @type {HTMLElement} */ h) => [".follow", ".caught", ".punched", ".selected", ".here"].map((s) => h.querySelectorAll(s).length).join();
    if (name !== "units" && marks(a) !== marks(b)) bad.push(`${name}: the two slots show different states (${marks(a)} / ${marks(b)})`);
    for (const i of slotsOf) {
      const host = /** @type {Placed} */ (page.slots[i]).host;
      page.setSlot(i, "");
      if (host.childElementCount > 0 || host.classList.contains("view") || host.style.position) bad.push(`${name} in slot ${i + 1}: left something behind`);
    }
    await frames();
    if (store.watchers.size !== watchers) bad.push(`${name}: ${store.watchers.size - watchers} watcher(s) left behind`);
  }
  const left = document.querySelectorAll("canvas").length - canvases;
  if (left > 0) bad.push(`${left} canvas(es) left behind`);
  return result("F-3", "Every component mounts in any slot, draws to its host's size and again when resized, shows the same state in another slot, and unmounts leaving nothing", bad.length === 0, bad.slice(0, 4).join("; ") || `${Object.keys(COMPONENTS).length} components, ${n} placements`);
}

/**
 * The words of English that a locale's own texts do not use: if one shows in that locale,
 * a text was left in English. Only words of four letters or more, so numbers, units and
 * names shared by every language do not count.
 * @param {Locale} locale
 * @returns {Set<string>}
 */
function englishOnly(locale) {
  const words = (/** @type {string} */ s) => s.replace(/\{\w+\}/g, " ").match(/[A-Za-z]{4,}/g) ?? [];
  const theirs = new Set(Object.values(MESSAGES[locale]).flatMap(words).map((w) => w.toLowerCase()));
  return new Set(Object.values(MESSAGES.en).flatMap(words).filter((w) => !theirs.has(w.toLowerCase())));
}

/**
 * F-6: in each language, every component on the page speaks it.
 * @param {M5Page} page
 * @returns {Promise<CheckResult>}
 */
async function languages(page) {
  /** @type {string[]} */
  const bad = [];
  const was = page.store.state.locale;
  const hosts = () => [...page.slots.filter((p) => p !== null), ...page.band].map((p) => /** @type {Placed} */ (p).host);
  const texts = (/** @type {HTMLElement} */ h) =>
    [h.innerText, ...[...h.querySelectorAll("[aria-label], [title], [data-tip]")].flatMap((e) => [e.getAttribute("aria-label"), e.getAttribute("title"), /** @type {HTMLElement} */ (e).dataset.tip]), ...[...h.querySelectorAll("title")].map((e) => e.textContent)].filter(Boolean).join(" ");
  for (const l of LOCALES.filter((x) => x !== "en")) {
    await page.language(l);
    await frames();
    const only = englishOnly(l);
    for (const h of hosts()) {
      const left = [...new Set((texts(h).match(/[A-Za-z]{4,}/g) ?? []).filter((w) => only.has(w)))];
      if (left.length) bad.push(`${l}: English left: ${left.slice(0, 5).join(", ")}`);
    }
  }
  await page.language(was);
  return result("F-6", "Choosing a language redraws every component in it, with no English left", bad.length === 0, bad.slice(0, 4).join("; ") || `${LOCALES.length - 1} languages, ${hosts().length} components each`);
}
