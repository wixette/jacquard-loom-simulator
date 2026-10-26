// The languages (design/m5-notes.md): F-4, every locale has every English key, keeps every
// {placeholder} and has no key English lacks, and the reader's languages choose the nearest;
// F-5, every message the loom, the trace and the links can give has its key and is put into
// words in every locale, with no placeholder left.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MESSAGES } from "../js/l10n/all.js";
import { bestLocale, LOCALES, say, t, tn } from "../js/l10n/l10n.js";
import { HOOK_COUNTS, PRESETS, presetDeck } from "../js/sim/deck.js";
import { decodeLink } from "../js/sim/link.js";
import { Loom, STOP_KEYS } from "../js/sim/loom.js";
import { endCount, tieLabel } from "../js/sim/tieup.js";
import { followCell, traceOf } from "../js/sim/trace.js";
/** @import { Msg } from "../js/l10n/l10n.js" */
/** @import { Tie } from "../js/sim/tieup.js" */

const en = MESSAGES.en;
/** @param {string} s */
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("every locale has every message (F-4)", () => {
  for (const loc of LOCALES) {
    it(loc, () => {
      const m = MESSAGES[loc];
      assert.ok(m, `no messages for ${loc}`);
      const missing = Object.keys(en).filter((k) => !m[k]?.trim());
      const extra = Object.keys(m).filter((k) => !(k in en));
      assert.deepEqual(missing, [], `${loc} lacks ${missing.length} messages`);
      assert.deepEqual(extra, [], `${loc} has messages English does not`);
      const wrong = Object.keys(en).filter((k) => {
        // a plural form always receives {n}: it may use it, or write the number out ("once")
        const drop = (/** @type {string[]} */ p) => (/\.(one|other)$/.test(k) ? p.filter((x) => x !== "n") : p).join();
        return drop(placeholders(en[k])) !== drop(placeholders(m[k]));
      });
      assert.deepEqual(wrong, [], `${loc}: placeholders differ from English`);
    });
  }
});

describe("choosing and using a locale (F-4)", () => {
  it("matches the reader's languages to the nearest locale", () => {
    assert.equal(bestLocale(["de-AT", "en"]), "de");
    assert.equal(bestLocale(["pt-PT"]), "pt-BR");
    assert.equal(bestLocale(["zh-Hant-HK"]), "zh-TW");
    assert.equal(bestLocale(["zh-CN"]), "zh");
    assert.equal(bestLocale(["nl", "fr-CA"]), "fr");
    assert.equal(bestLocale(["nl"]), "en");
  });

  it("fills placeholders, chooses plural forms and writes lists as each language does", () => {
    assert.equal(tn("loom.runOut", 1, {}, "en"), "The chain has run out after 1 card: close the loop, add cards, or step back.");
    assert.equal(tn("loom.runOut", 3, {}, "en"), "The chain has run out after 3 cards: close the loop, add cards, or step back.");
    assert.equal(say({ key: "loom.open", n: 3, params: { hooks: [2, 4, 7] } }, "en"), "Shed open: hooks 2, 4 and 7 have lifted their warp ends. The cylinder has swung out and turned to the next card.");
    assert.match(say({ key: "loom.open", n: 3, params: { hooks: [2, 4, 7] } }, "fr"), /crochets 2, 4 et 7/);
    assert.match(say({ key: "loom.open", n: 3, params: { hooks: [2, 4, 7] } }, "zh"), /2、4和7/);
    assert.match(say({ key: "loom.open", n: 13, params: { hooks: [...Array(13).keys()] } }, "en"), /\(13 of them\)/);
    assert.equal(t("no.such.key"), "no.such.key");
    assert.equal(say({ text: "as it is" }, "ja"), "as it is");
  });
});

/**
 * Every message the loom, the trace and the links can give, collected by running them.
 * @returns {Promise<Msg[]>}
 */
async function everyMessage() {
  /** @type {Msg[]} */
  const out = [];
  const ties = /** @type {Tie[]} */ ([{ kind: "straight", repeats: 1 }, { kind: "straight", repeats: 4 }, { kind: "point" }]);
  for (const name of Object.keys(PRESETS)) {
    for (const hooks of HOOK_COUNTS) {
      for (const loop of [true, false]) {
        const tie = ties[(hooks / 8) % 3];
        const loom = new Loom({ ...presetDeck(name, hooks), loop }, tie);
        for (let i = 0; i < 6 * 10; i++) {
          const r = loom.stepForward();
          out.push(r.ok ? r.message : r.reason);
          if (!r.ok) break;
        }
        for (let i = 0; i < 6 * 3; i++) {
          const r = loom.stepBack();
          out.push(r.ok ? r.message : r.reason);
        }
        const snap = loom.snapshot();
        for (let h = 0; h < hooks; h += 3) out.push(traceOf(snap, { hook: h, end: null, pick: null }).text);
        for (let p = 0; p < snap.cloth.length; p += 2) for (let e = 1; e <= endCount(tie, hooks); e += 5) out.push(traceOf(snap, followCell(snap, p, e)).text);
        out.push(tieLabel(tie));
      }
    }
  }
  out.push(...[new Loom({ hooks: 8, cards: [], loop: true }).stepForward(), new Loom(presetDeck("plain", 8)).stepBack()].map((r) => (r.ok ? r.message : r.reason)));
  for (const k of STOP_KEYS) out.push({ key: k });
  for (const bad of ["", "#v=1", "#v=9", "#v=2&h=12&c=x.", "#v=2&h=8&c=x.zz", "#v=2&h=8&c=q.", "#v=2&h=8", "#v=2&wc=red", "#v=2&sv=x", "#v=2&h=8&c=x.ff&p=-1", "#v=2&h=8&c=x.ff&fe=2", "#v=2&step=A"]) {
    const r = await decodeLink(bad);
    if (!r.ok) out.push(r.reason);
  }
  return out;
}

describe("every message the machine gives is put into words in every locale (F-5)", async () => {
  const messages = await everyMessage();
  /** @param {Msg} m @returns {string[]} */
  const keys = (m) => ("text" in m ? [] : [m.key, ...Object.values(m.params ?? {}).flatMap((p) => (typeof p === "object" && !Array.isArray(p) ? keys(p) : []))]);
  it(`${messages.length} messages, every key known`, () => {
    const unknown = [...new Set(messages.flatMap(keys))].filter((k) => !(k in en) && !(`${k}.other` in en));
    assert.deepEqual(unknown, []);
  });
  for (const loc of LOCALES) {
    it(loc, () => {
      for (const m of messages) {
        const words = say(m, loc);
        assert.ok(words.trim().length > 0, `${JSON.stringify(m)}: empty`);
        assert.doesNotMatch(words, /\{\w+\}/, `${JSON.stringify(m)}: a placeholder left in "${words}"`);
      }
    });
  }
});
