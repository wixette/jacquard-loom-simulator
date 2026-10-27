// The tutorial, parts 1 to 3 (design/m7-notes.md): T-1, every step has a name a link can carry,
// once, and every text its steps use, in English; T-2, each task is not done at its step's
// start, refuses a likely mistake and takes its solution, and a step's loom is the same however
// it is reached; T-3, the history keeps out of the myths the research lists; T-4, every picture
// is there, at the size its step says, with its credit and licence.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { MESSAGES } from "../../js/l10n/all.js";
import { cardToString } from "../../js/sim/deck.js";
import { ALIASES, loomAt, PARTS, runTutorial, stepIndex, STEPS } from "../../js/teach/tutorial.js";
/** @import { Step } from "../../js/teach/tutorial.js" */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const en = MESSAGES.en;

/**
 * Every message key a step uses.
 * @param {Step} s
 */
function keysOf(s) {
  const k = (/** @type {string} */ x) => `tut.${s.id}.${x}`;
  const keys = [k("title"), k("text")];
  if (s.task) keys.push(k("task"));
  if (s.done) keys.push(k("done"));
  if (s.predict) {
    keys.push(k("q"), k("right"), k("wrong"));
    for (let c = 1; c <= s.predict.choices; c++) keys.push(k(`a${c}`));
  }
  if (s.image) keys.push(s.image.credit);
  return keys;
}

describe("the tutorial's steps (T-1)", () => {
  it("every step has a name a link can carry, and no two the same", () => {
    const ids = STEPS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z0-9-]{1,64}$/);
    for (const [old, now] of Object.entries(ALIASES)) {
      assert.ok(!ids.includes(old), `alias ${old} is a step's name`);
      assert.ok(ids.includes(now), `alias ${old} opens no step`);
    }
    assert.equal(stepIndex("weave-twill"), STEPS.findIndex((s) => s.id === "weave-twill"));
    assert.equal(stepIndex("no-such-step"), -1);
  });
  it("the parts come in order, each with its name, its aim and its recap", () => {
    assert.deepEqual([...new Set(STEPS.map((s) => s.part))], [...PARTS]);
    for (const p of PARTS) for (const k of [`tut.part${p}`, `tut.part${p}.goal`, `tut.part${p}.recap`]) assert.ok(en[k], k);
  });
  it("every text a step uses is in English, and every tutorial text belongs to a step", () => {
    const used = new Set(STEPS.flatMap(keysOf));
    for (const k of used) assert.ok(en[k]?.trim(), `no English for ${k}`);
    const own = Object.keys(en).filter((k) => k.startsWith("tut.") && !/^tut\.part\d/.test(k));
    assert.deepEqual(own.filter((k) => !used.has(k)), []);
  });
  it("a question's right answer is one of its choices", () => {
    for (const s of STEPS) if (s.predict) assert.ok(s.predict.answer >= 1 && s.predict.answer <= s.predict.choices, s.id);
  });
});

describe("the tutorial's tasks (T-2)", () => {
  it("each task: not done at its step's start, a mistake refused, its solution taken", () => {
    assert.deepEqual(runTutorial(), []);
  });
  it("a step's loom is the same however the step is reached", () => {
    for (let i = 0; i < STEPS.length; i++) {
      const [a, b] = [loomAt(i), loomAt(i)];
      assert.deepEqual(
        { cards: a.loom.deck.cards.map(cardToString), tie: a.loom.tie, pick: a.loom.pick, phi: a.loom.phi, rows: a.loom.cloth.length, follow: a.follow },
        { cards: b.loom.deck.cards.map(cardToString), tie: b.loom.tie, pick: b.loom.pick, phi: b.loom.phi, rows: b.loom.cloth.length, follow: b.follow },
      );
    }
  });
  it("a step that sets up no loom goes on from the step before, its task done", () => {
    const i = stepIndex("how-loop");
    const at = loomAt(i).loom;
    assert.equal(at.cloth.length, 4, "how-program's four rows are woven");
    assert.equal(at.deck.loop, false, "the chain is still open");
  });
});

describe("the history keeps out of the myths (T-3, research REPORT §6)", () => {
  const story = Object.entries(en)
    .filter(([k]) => k.startsWith("tut.story-") || k.startsWith("tut.how-") || k.startsWith("tut.part"))
    .map(([, v]) => v)
    .join("\n");
  it("no patent of 1801, no 24,000 cards, no 'first computer'", () => {
    assert.doesNotMatch(story, /patent/i);
    assert.doesNotMatch(story, /24[,.\s]?000/);
    assert.doesNotMatch(story, /first (computer|programmable)/i);
    assert.doesNotMatch(story, /invented the punched card/i);
  });
  it("Lovelace is quoted as she wrote it (Note A, 1843)", () => {
    assert.match(story, /weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves/);
  });
});

describe("the tutorial's pictures (T-4)", () => {
  for (const s of STEPS.filter((x) => x.image)) {
    const img = /** @type {NonNullable<Step["image"]>} */ (s.image);
    it(`${s.id}: ${img.file}`, () => {
      const file = ROOT + img.file;
      assert.ok(existsSync(file), "missing");
      // a JPEG's size, from its first SOF marker
      const b = readFileSync(file);
      let at = 2;
      while (at < b.length && !(b[at] === 0xff && b[at + 1] >= 0xc0 && b[at + 1] <= 0xc3)) at += 2 + b.readUInt16BE(at + 2);
      assert.deepEqual({ width: b.readUInt16BE(at + 7), height: b.readUInt16BE(at + 5) }, { width: img.width, height: img.height });
      assert.match(en[img.credit], /Public domain|CC0|CC BY/);
      assert.ok(readFileSync(ROOT + "REUSE.toml", "utf8").includes(img.file), "no licence in REUSE.toml");
    });
  }
});
