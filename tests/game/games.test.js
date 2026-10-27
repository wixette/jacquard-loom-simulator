// The games' logic (design/m9-notes.md): one byte per card (B-1), guess the cloth (Q-1), draw
// boy against Jacquard (D-1).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { byteCard, messageDeck, readMessage, rowBits, rowByte } from "../../js/game/byteGame.js";
import * as drawBoy from "../../js/game/drawBoy.js";
import { misread, puzzle, ROWS, weaveCards } from "../../js/game/guessGame.js";
import { cardToString } from "../../js/sim/deck.js";
import { Loom } from "../../js/sim/loom.js";

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
