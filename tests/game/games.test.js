// The games' logic (design/m9-notes.md): one byte per card (B-1), guess the cloth (Q-1), draw
// boy against Jacquard (D-1).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { byteCard, messageDeck, readMessage, rowBits, rowByte } from "../../js/game/byteGame.js";
import * as drawBoy from "../../js/game/drawBoy.js";
import { misread, puzzle, ROWS, weaveCards } from "../../js/game/guessGame.js";
import { checkText, decodeCloth, LINE_GAP, MAX_CHARS, MAX_LINES, planName, wrapText } from "../../js/game/nameGame.js";
import { cardToString } from "../../js/sim/deck.js";
import { Loom } from "../../js/sim/loom.js";

describe("the name game's text wraps into lines (N-1)", () => {
  it("breaks at the spaces, cuts a word longer than a line, and keeps the lines typed", () => {
    assert.deepEqual(wrapText("Ada Lovelace"), ["Ada", "Lovelace"]);
    assert.deepEqual(wrapText("THE JACQUARD LOOM"), ["THE", "JACQUARD", "LOOM"]);
    assert.deepEqual(wrapText("a b c d e"), ["a b c d", "e"]);
    assert.deepEqual(wrapText("ABCDEFGHIJ"), ["ABCDEFGH", "IJ"]);
    assert.deepEqual(wrapText("Ada\n\nLovelace\n\n"), ["Ada", "", "Lovelace"]);
    assert.ok(wrapText("abcdefg ".repeat(40)).every((l) => l.length <= MAX_CHARS));
  });

  it("takes up to MAX_LINES lines, and says how many a longer text makes", () => {
    assert.ok(checkText("ab ".repeat(MAX_LINES).trim()).ok);
    const r = checkText("abcdefg ".repeat(MAX_LINES + 1).trim());
    assert.ok(!r.ok);
    assert.equal(/** @type {any} */ (r).why.key, "name.tooManyLines");
    assert.equal(/** @type {any} */ (r).why.params.lines, MAX_LINES + 1);
  });

  it("a long message woven reads back line by line, a gap between the lines, both ways", () => {
    const text = "THE JACQUARD LOOM WOVE PICTURES FROM A CHAIN OF PUNCHED CARDS, AND ITS IDEA LED TO COMPUTERS";
    for (const mode of /** @type {const} */ (["direct", "damask"])) {
      const r = planName(text, mode);
      assert.ok(r.ok, mode);
      const { plan } = /** @type {any} */ (r);
      assert.equal(plan.picture.length, plan.lines.length * 16 + (plan.lines.length - 1) * LINE_GAP);
      const loom = new Loom(plan.deck);
      loom.moveTo(plan.deck.cards.length, 0);
      assert.deepEqual(decodeCloth(loom.cloth, plan), wrapText(text), mode);
    }
  });
});

describe("one byte per card (B-1)", () => {
  it("a character is a card of its ASCII code, the highest bit at hook 1", () => {
    assert.equal(cardToString(byteCard("A")), ".O.....O");
    assert.equal(rowByte(byteCard("z")), "z".charCodeAt(0));
    assert.equal(rowBits(byteCard("A")), "01000001");
  });
  it("a message woven through the loom reads back from the cloth", () => {
    for (const text of ["Hi!", "Ada Lovelace", "1843 ~ Note A", "x".repeat(32)]) {
      const r = messageDeck(text);
      assert.ok(r.ok, text);
      const l = new Loom(r.deck);
      for (let i = 0; i < r.deck.cards.length * 6; i++) l.stepForward();
      assert.equal(readMessage(l.cloth), text);
    }
  });
  it("an empty message, one too long, or a character outside ASCII is refused with the reason", () => {
    assert.deepEqual(messageDeck(""), { ok: false, reason: { key: "byte.empty" } });
    assert.equal(/** @type {any} */ (messageDeck("é")).reason.key, "byte.notAscii");
    assert.equal(/** @type {any} */ (messageDeck("x".repeat(33))).reason.key, "byte.tooLong");
  });
});

describe("guess the cloth (Q-1)", () => {
  it("every seed gives three different cloths, one of them the deck's own", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const p = puzzle(seed);
      const keys = p.cloths.map((c) => JSON.stringify(c));
      assert.equal(new Set(keys).size, 3, `seed ${seed}`);
      assert.equal(keys[p.answer], JSON.stringify(weaveCards(p.deck.cards.map(cardToString))), `seed ${seed}`);
      assert.equal(p.how[p.answer], null);
      assert.ok(p.cloths.every((c) => c.length === ROWS));
    }
  });
  it("a seed's puzzle is pinned, the same in every browser (Chrome's V8 and Safari's JavaScriptCore gave these; 1.0.0)", () => {
    const seen = (/** @type {number} */ seed) => {
      const p = puzzle(seed);
      return { cards: p.deck.cards.map(cardToString), answer: p.answer, how: p.how };
    };
    const bits = (/** @type {string[]} */ cs) => cs.map((c) => [...c].map((x) => (x === "1" ? "O" : ".")).join(""));
    assert.deepEqual(seen(1), { cards: bits(["10001001", "00011110", "11011110", "01100010", "00010111"]), answer: 1, how: ["mirrored", null, "inverted"] });
    assert.deepEqual(seen(7), { cards: bits(["10001010", "01100111"]), answer: 2, how: ["mirrored", "shifted", null] });
    assert.deepEqual(seen(1_000_000_000), { cards: bits(["00010011", "10000111", "10011010", "10000100", "10011100", "10100100"]), answer: 2, how: ["mirrored", "reversed", null] });
  });
  it("the same seed gives the same puzzle; others differ", () => {
    assert.deepEqual(puzzle(42), puzzle(42));
    assert.notDeepEqual(puzzle(42).deck, puzzle(43).deck);
  });
  it("the misreadings are the careless readings of the cards", () => {
    const cards = ["OO......", "..O....."];
    assert.deepEqual(misread(cards, "reversed"), ["..O.....", "OO......"]);
    assert.deepEqual(misread(cards, "mirrored"), ["......OO", ".....O.."]);
    assert.deepEqual(misread(cards, "inverted"), ["..OOOOOO", "OO.OOOOO"]);
    assert.deepEqual(misread(cards, "shifted"), [".OO.....", "...O...."]);
  });
});

describe("draw boy against Jacquard (D-1)", () => {
  it("pulling the right cords for every row weaves the figure, with no mistakes", () => {
    let d = drawBoy.start();
    for (const row of drawBoy.ROWS) {
      row.forEach((up, e) => {
        if (up) d = drawBoy.pull(d, e);
      });
      d = drawBoy.throwShuttle(d);
    }
    assert.ok(drawBoy.finished(d));
    assert.deepEqual(drawBoy.mistakes(d), []);
    assert.equal(d.pulls, drawBoy.FEWEST_PULLS);
  });
  it("a cord missed shows as a mistake in its row; a cord let go again counts as two pulls", () => {
    let d = drawBoy.start();
    d = drawBoy.pull(d, 0);
    d = drawBoy.pull(d, 0);
    d = drawBoy.throwShuttle(d);
    assert.equal(d.pulls, 2);
    assert.deepEqual(drawBoy.mistakes(d), [0], "the arrow's bottom row lifts ends 4 and 5");
  });
  it("once the figure is woven, nothing more is pulled or woven", () => {
    let d = drawBoy.start();
    for (let i = 0; i < drawBoy.ROWS.length; i++) d = drawBoy.throwShuttle(d);
    const done = d;
    assert.equal(drawBoy.pull(done, 3), done);
    assert.equal(drawBoy.throwShuttle(done), done);
  });
});

describe("the name game at its limits (1.0.0 review)", () => {
  const full = [...Array(MAX_LINES)].map((_, i) => "ABCDEFGH".slice(0, 7) + String.fromCharCode(97 + i)).join(" ");
  it(`${MAX_LINES} full lines (${full.length} characters, a link's most) are taken, and read back both ways`, async () => {
    const { MAX_TEXT } = await import("../../js/sim/link.js");
    // the field takes as much as a link carries: 16 lines of 8 and their 15 breaks, and one more
    assert.equal(MAX_TEXT, MAX_LINES * (MAX_CHARS + 1));
    assert.ok(full.length <= MAX_TEXT);
    assert.equal(wrapText(full).length, MAX_LINES);
    for (const mode of /** @type {const} */ (["damask", "direct"])) {
      const r = planName(full, mode);
      assert.ok(r.ok, mode);
      if (!r.ok) continue;
      const loom = new Loom(r.plan.deck);
      loom.moveTo(r.plan.deck.cards.length, 0);
      assert.deepEqual(decodeCloth(loom.cloth, r.plan), r.plan.lines.map((l) => l.trim()), mode);
      if (mode === "damask") assert.equal(r.plan.deck.hooks, 256, "on 256 of the 400 head's hooks");
    }
  });
  it(`${MAX_LINES + 1} lines are refused, with how many it makes`, () => {
    const r = checkText(`${full} Z`);
    assert.ok(!r.ok);
    assert.equal(/** @type {any} */ (r).why?.params?.lines, MAX_LINES + 1);
  });
  it("Windows line breaks are line breaks; spaces run together are one", () => {
    assert.deepEqual(wrapText("Ada\r\nLovelace"), wrapText("Ada\nLovelace"));
    assert.deepEqual(wrapText("Ada   Byron"), wrapText("Ada Byron"));
  });
});
