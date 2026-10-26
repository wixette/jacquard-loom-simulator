// The app's language: chosen by a link (?lang= or a link's lang field), then by the reader's
// last choice, then by the browser's languages (the Stepped Reckoner's order, its U7). The
// choice is kept in the browser, and the store's locale changes once the language's texts
// have loaded, so every component redraws in it at once.

import { bestLocale, isLocale, load, setLocale } from "../l10n/l10n.js";
/** @import { Locale } from "../l10n/l10n.js" */
/** @import { AppStore } from "./looms.js" */

const KEY = "jacquard.lang";

/**
 * The language to open in.
 * @returns {Locale}
 */
export function initialLanguage() {
  const asked = new URLSearchParams(location.search).get("lang");
  if (asked && isLocale(asked)) return asked;
  try {
    const kept = localStorage.getItem(KEY);
    if (kept && isLocale(kept)) return kept;
  } catch {
    // no storage (a private window): the browser's languages decide
  }
  return bestLocale(navigator.languages ?? [navigator.language]);
}

/**
 * Change the app's language: load its texts, then tell the store.
 * @param {AppStore} store
 * @param {Locale} locale
 * @param {{ keep?: boolean }} [o] keep: remember it as the reader's choice
 * @returns {Promise<void>}
 */
export async function chooseLanguage(store, locale, o = {}) {
  await load(locale);
  setLocale(locale);
  document.documentElement.lang = locale;
  if (o.keep) {
    try {
      localStorage.setItem(KEY, locale);
    } catch {
      // not kept: the choice lasts as long as the page
    }
  }
  store.set({ locale });
}
