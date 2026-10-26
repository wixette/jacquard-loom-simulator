// M5 developer page: every view and panel of the app as a component (js/app/components/),
// placed in a grid of slots the reader fills as they like, on one of the app's looms (the
// store's, js/app/looms.js), in any of the ten languages. With ?selftest it runs the page's
// checks (F-3, F-6; design/m5-notes.md).

import { runM5PageChecks } from "../../js/accept/m5Checks.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { COMPONENTS } from "../../js/app/components/all.js";
import { place } from "../../js/app/components/component.js";
import { chooseLanguage, initialLanguage } from "../../js/app/language.js";
import { appState, LOOM_IDS, setCurrent } from "../../js/app/looms.js";
import { Store } from "../../js/app/store.js";
import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, t } from "../../js/l10n/l10n.js";
import { el, icon, showMenu } from "../../js/ui/components.js";
/** @import { Placed } from "../../js/app/components/component.js" */
/** @import { LoomId } from "../../js/app/looms.js" */
/** @import { Locale } from "../../js/l10n/l10n.js" */

/** @type {import("../../js/app/looms.js").AppStore} */
const store = new Store(appState());
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** What the slots hold at first: the machine above, the program and the output below. */
const FIRST = ["section", "front", "units", "chain", "cloth", "bench"];
/** The band along the bottom: time, what happened, the thread followed. */
const BAND = ["transport", "status", "trace"];

/** @type {(Placed | null)[]} */
const slots = [];
/** @type {HTMLSelectElement[]} */
const pickers = [];

/**
 * Put a component in slot i (or empty it, with "").
 * @param {number} i
 * @param {string} name
 */
function setSlot(i, name) {
  slots[i]?.unmount();
  slots[i] = null;
  const host = /** @type {HTMLElement} */ ($("slots").children[i].querySelector(".slot-host"));
  host.replaceChildren();
  if (name) slots[i] = place(COMPONENTS[name](store), host, store);
  pickers[i].value = name;
}

FIRST.forEach((_, i) => {
  const picker = el("select", { "aria-label": `Slot ${i + 1}` });
  picker.addEventListener("change", () => setSlot(i, picker.value));
  pickers.push(picker);
  $("slots").append(el("section", { class: "slot" }, [el("div", { class: "slot-bar" }, [picker]), el("div", { class: "slot-host" })]));
  slots.push(null);
});
/** @type {Placed[]} */
const band = BAND.map((name) => {
  const host = el("div");
  $("band").append(host);
  return place(COMPONENTS[name](store), host, store);
});

/** The texts the page itself shows, in the store's language. */
function relabel() {
  for (const p of pickers) {
    const was = p.value;
    p.replaceChildren(new Option("—", ""), ...Object.entries(COMPONENTS).map(([k, make]) => new Option(t(make(store).name), k)));
    p.value = was;
  }
  const loom = /** @type {HTMLSelectElement} */ ($("loom"));
  if (!loom.options.length) for (const id of LOOM_IDS) loom.add(new Option(id, id));
  loom.value = store.state.current;
  $("lang").replaceChildren(icon("translate"), el("span", { text: LOCALE_SHORT[store.state.locale] }));
  $("changes").textContent = `${store.changes} changes`;
}
store.watch((s) => [s.locale, s.current], relabel);
store.watch((s) => [s.looms], () => ($("changes").textContent = `${store.changes} changes`));
relabel();
FIRST.forEach((name, i) => setSlot(i, name));

$("loom").addEventListener("change", () => setCurrent(store, /** @type {LoomId} */ (/** @type {HTMLSelectElement} */ ($("loom")).value)));
$("lang").addEventListener("click", () =>
  showMenu(
    $("lang"),
    LOCALES.map((l) => ({ label: LOCALE_NAMES[l], lang: l, checked: l === store.state.locale, run: () => chooseLanguage(store, l, { keep: true }) })),
  ),
);
await chooseLanguage(store, initialLanguage());

/** What the checks drive. */
export const page = {
  store,
  slots,
  band,
  setSlot,
  /** @param {Locale} l */
  language: (l) => chooseLanguage(store, l),
};

if (selftestRequested()) {
  const t0 = performance.now();
  const results = await runM5PageChecks(page);
  showSelftest(document.body, results, performance.now() - t0);
}
