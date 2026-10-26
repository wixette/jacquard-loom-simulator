// Translations (docs/conventions.md, Code): ten locales, one module each (js/l10n/<locale>.js),
// keyed alike; English is the reference and the fallback, and is loaded with this module, so
// a page's first draw never waits for a language. Pure logic: no DOM, so the pages, the tests
// and the checks share it. (After the Stepped Reckoner's js/l10n/l10n.js.)
//
// A message may hold {name} placeholders, filled from its params. A message whose form depends
// on a number has variants "<key>.one", "<key>.other" (and others where a language needs
// them: "few", "many", "two", "zero"), chosen with Intl.PluralRules. A list of numbers is
// written as the language writes lists ("2, 4 and 7", "2、4和7"), and a param may itself be a
// message, put into words first. The machine speaks in messages (Msg), not in sentences.

import en from "./en.js";

/** The locales, in the order the language menu lists them. */
export const LOCALES = /** @type {const} */ (["en", "es", "fr", "de", "it", "pt-BR", "zh", "zh-TW", "ja", "ko"]);
/** @typedef {(typeof LOCALES)[number]} Locale */
/** @typedef {Record<string, string>} Messages */

/**
 * Something to say: a message key with its values (n chooses the plural form and is also
 * the {n} placeholder), or text as it is (a prototype's English).
 * @typedef {{ key: string; n?: number; params?: Record<string, Param> } | { text: string }} Msg
 */
/** @typedef {string | number | number[] | Msg} Param */

/** What each locale calls itself, for the language menu. */
export const LOCALE_NAMES = /** @type {Record<Locale, string>} */ ({
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  zh: "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
});

/** What the language button shows: short, beside an icon that already says "language". */
export const LOCALE_SHORT = /** @type {Record<Locale, string>} */ ({
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  "pt-BR": "PT",
  zh: "简",
  "zh-TW": "繁",
  ja: "日",
  ko: "한",
});

/** A list longer than this is counted instead of listed. */
const LIST_MAX = 12;

/** @type {Partial<Record<Locale, Messages>>} */
const tables = { en };
/** @type {Locale} */
let current = "en";

/**
 * @param {string} x
 * @returns {x is Locale}
 */
export const isLocale = (x) => /** @type {readonly string[]} */ (LOCALES).includes(x);

/**
 * Make a locale's messages available (the page loads them with load(); tests register all).
 * @param {Locale} locale
 * @param {Messages} messages
 */
export function register(locale, messages) {
  tables[locale] = messages;
}

/**
 * Load a locale's module in the browser (English is always there).
 * @param {Locale} locale
 * @returns {Promise<void>}
 */
export async function load(locale) {
  if (!tables[locale]) tables[locale] = (await import(`./${locale}.js`)).default;
}

/** @param {Locale} locale */
export function setLocale(locale) {
  current = locale;
}

/** @returns {Locale} */
export const locale = () => current;

/**
 * The best supported locale for a list of language tags (the reader's choices, in order),
 * or English.
 * @param {readonly string[]} tags
 * @returns {Locale}
 */
export function bestLocale(tags) {
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const lower = tag.toLowerCase();
    // Chinese: Traditional for Taiwan, Hong Kong and Macao, and for the Hant script.
    if (lower.startsWith("zh")) return /hant|-tw|-hk|-mo/.test(lower) ? "zh-TW" : "zh";
    if (lower.startsWith("pt")) return "pt-BR";
    const exact = LOCALES.find((l) => l.toLowerCase() === lower);
    if (exact) return exact;
    const base = LOCALES.find((l) => l.toLowerCase() === lower.split("-")[0]);
    if (base) return base;
  }
  return "en";
}

/**
 * A param in words: a number as the locale writes it, a list of numbers as a list, a
 * message put into words.
 * @param {Param} v
 * @param {Locale} loc
 * @returns {string}
 */
function word(v, loc) {
  if (typeof v === "number") return new Intl.NumberFormat(loc).format(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    if (v.length > LIST_MAX) return tn("list.many", v.length, {}, loc);
    // English as the project writes it: "2, 4 and 7", with no comma before "and".
    return new Intl.ListFormat(loc === "en" ? "en-GB" : loc, { type: "conjunction" }).format(v.map((x) => new Intl.NumberFormat(loc).format(x)));
  }
  return say(v, loc);
}

/**
 * A message in a locale (English if it has none), with its placeholders filled. A key no
 * locale has comes back as itself, so a missing text shows rather than breaks.
 * @param {string} key
 * @param {Record<string, Param>} [params]
 * @param {Locale} [loc]
 * @returns {string}
 */
export function t(key, params = {}, loc = current) {
  const msg = tables[loc]?.[key] ?? tables.en?.[key] ?? key;
  return msg.replace(/\{(\w+)\}/g, (_, k) => (k in params ? word(params[k], loc) : `{${k}}`));
}

/**
 * A message whose form depends on a number n (also available as the {n} placeholder).
 * @param {string} key
 * @param {number} n
 * @param {Record<string, Param>} [params]
 * @param {Locale} [loc]
 * @returns {string}
 */
export function tn(key, n, params = {}, loc = current) {
  const rule = new Intl.PluralRules(loc).select(n);
  const table = tables[loc] ?? {};
  const k = `${key}.${rule}` in table || `${key}.${rule}` in (tables.en ?? {}) ? `${key}.${rule}` : `${key}.other`;
  return t(k, { n, ...params }, loc);
}

/**
 * A Msg in words.
 * @param {Msg} m
 * @param {Locale} [loc]
 * @returns {string}
 */
export function say(m, loc = current) {
  if ("text" in m) return m.text;
  return m.n === undefined ? t(m.key, m.params, loc) : tn(m.key, m.n, m.params, loc);
}

/**
 * A Msg: msg("loom.stop.taken", { hooks: [2, 4] }), or msg("loom.cards", {}, 3) for a plural.
 * @param {string} key
 * @param {Record<string, Param>} [params]
 * @param {number} [n]
 * @returns {Msg}
 */
export const msg = (key, params, n) => ({ key, ...(params ? { params } : {}), ...(n === undefined ? {} : { n }) });
