import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCard,
  cardForPick,
  cardFromString,
  cardIndexForPick,
  cardToString,
  duplicateCard,
  invertCard,
  makeDeck,
  moveCard,
  PRESETS,
  removeCard,
  setLoop,
  toggleHole,
} from "../../js/sim/deck.js";

describe("deck", () => {
  it("reads and writes cards, hook 1 first", () => {
    assert.deepEqual(cardFromString("O.1."), [true, false, true, false]);
    assert.equal(cardToString([true, false, false, true]), "O..O");
  });

  it("refuses a card that does not fit the head", () => {
    assert.throws(() => makeDeck(8, ["O..."]));
  });

  it("a loop starts again; an open chain runs out", () => {
    const loop = makeDeck(8, PRESETS.plain.rows, true);
    assert.equal(cardIndexForPick(loop, 5), 1);
    assert.equal(cardToString(/** @type {boolean[]} */ (cardForPick(loop, 4))), "O.O.O.O.");
    const open = setLoop(loop, false);
    assert.equal(cardForPick(open, 2), null);
    assert.equal(cardIndexForPick(open, 2), null);
    assert.equal(cardForPick(open, -1), null);
    // In a loop, the card before card 1 is the last card.
    assert.equal(cardIndexForPick(loop, -1), 1);
    assert.equal(cardIndexForPick(makeDeck(8, PRESETS.twill.rows, true), -1), 3);
  });

  it("edits return new decks and leave the old one alone", () => {
    const d = makeDeck(8, ["........"], false);
    const t = toggleHole(d, 0, 3);
    assert.equal(cardToString(d.cards[0]), "........");
    assert.equal(cardToString(t.cards[0]), "...O....");
    const two = addCard(t);
    assert.equal(two.cards.length, 2);
    assert.equal(cardToString(two.cards[1]), "........");
    const dup = duplicateCard(two, 0);
    assert.deepEqual(dup.cards.map(cardToString), ["...O....", "...O....", "........"]);
    const moved = moveCard(dup, 2, -1);
    assert.deepEqual(moved.cards.map(cardToString), ["...O....", "........", "...O...."]);
    assert.equal(moveCard(moved, 0, -1), moved);
    assert.deepEqual(invertCard(moved, 1).cards.map(cardToString)[1], "OOOOOOOO");
    assert.equal(removeCard(moved, 0).cards.length, 2);
  });

  it("the satin preset steps its hole by 3, which shares no factor with 8", () => {
    const pos = PRESETS.satin.rows.map((r) => r.indexOf("O"));
    for (let i = 1; i < pos.length; i++) assert.equal((pos[i] - pos[i - 1] + 8) % 8, 3);
    assert.equal(new Set(pos).size, 8);
  });
});
