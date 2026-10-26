import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeDeck, PRESETS, toggleHole } from "../../js/sim/deck.js";
import { Loom, STOPS } from "../../js/sim/loom.js";

describe("loom", () => {
  it("a row joins the cloth at the beat and leaves it when stepped back past the beat", () => {
    const loom = new Loom(makeDeck(8, PRESETS.plain.rows));
    loom.moveTo(0, 0.6);
    assert.equal(loom.cloth.length, 0);
    assert.notEqual(loom.snapshot().pendingRow, null);
    loom.moveTo(0, 0.7);
    assert.equal(loom.cloth.length, 1);
    assert.equal(loom.snapshot().pendingRow, null);
    loom.moveTo(0, 0.6);
    assert.equal(loom.cloth.length, 0);
  });

  it("moving to the end of a pick is the start of the next", () => {
    const loom = new Loom(makeDeck(8, PRESETS.plain.rows));
    loom.moveTo(2, 1);
    assert.equal(loom.pick, 3);
    assert.equal(loom.phi, 0);
    assert.equal(loom.cloth.length, 3);
  });

  it("cloth already woven stays as woven when a card is changed", () => {
    const loom = new Loom(makeDeck(8, PRESETS.plain.rows));
    for (let i = 0; i < STOPS.length; i++) loom.stepForward();
    const before = JSON.stringify(loom.cloth);
    loom.setDeck(toggleHole(loom.deck, 0, 1));
    assert.equal(JSON.stringify(loom.cloth), before);
  });

  it("a new tie starts the loom again", () => {
    const loom = new Loom(makeDeck(8, PRESETS.plain.rows));
    loom.moveTo(3, 0.2);
    loom.setTie({ kind: "point" });
    assert.equal(loom.pick, 0);
    assert.equal(loom.cloth.length, 0);
    assert.equal(loom.snapshot().endLift.length, 15);
  });

  it("playing stops at the end of an open chain and says why", () => {
    const loom = new Loom(makeDeck(8, PRESETS.blank.rows, false));
    let r = loom.advance(0.5);
    assert.equal(r.ok, true);
    r = loom.advance(0.6);
    assert.equal(loom.pick, 1);
    r = loom.advance(0.1);
    assert.equal(r.ok, false);
  });
});
