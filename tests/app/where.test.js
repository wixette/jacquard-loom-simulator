// The loom's place in words, under the controls (js/app/where.js): the pick, its card and how
// far through it; an open chain woven to its end says so, not a pick past it (1.0.0 review).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { whereText } from "../../js/app/where.js";
import { Loom, STOPS } from "../../js/sim/loom.js";

const deck = (/** @type {boolean} */ loop) => ({ hooks: 8, cards: [Array(8).fill(true), Array(8).fill(false)], loop });

describe("where the loom is, in words", () => {
  it("an open chain woven to its end says so", () => {
    const l = new Loom(deck(false));
    l.moveTo(2, 0);
    assert.equal(whereText(l.snapshot()), "The chain woven to its end · 2 rows woven · 8 warp ends");
  });
  it("a loop never ends: its next pick, and its card", () => {
    const l = new Loom(deck(true));
    l.moveTo(2, 0);
    assert.equal(whereText(l.snapshot()), "Pick 3 (card 1) · 0 % through · 2 rows woven · 8 warp ends");
  });
  it("within a pick, how far through it", () => {
    const l = new Loom(deck(false));
    l.moveTo(1, STOPS[2]);
    assert.match(whereText(l.snapshot()), /^Pick 2 \(card 2\) · \d+ % through · 1 row woven/);
  });
  it("an empty chain has no card, and no end woven", () => {
    const l = new Loom({ hooks: 8, cards: [], loop: false });
    assert.equal(whereText(l.snapshot()), "Pick 1 (no card) · 0 % through · 0 rows woven · 8 warp ends");
  });
});
