import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { endCount, endsOfHook, hookOfEnd, rowOfCard } from "../../js/sim/tieup.js";

describe("tie-up", () => {
  it("a straight tie repeats the hooks across the warp", () => {
    const tie = /** @type {const} */ ({ kind: "straight", repeats: 3 });
    assert.equal(endCount(tie, 8), 24);
    assert.deepEqual([1, 8, 9, 17, 24].map((e) => hookOfEnd(tie, 8, e)), [1, 8, 1, 1, 8]);
    assert.deepEqual(endsOfHook(tie, 8, 2), [2, 10, 18]);
  });

  it("a point tie runs 1…8…2 and mirrors the figure (15 ends from 8 hooks)", () => {
    const tie = /** @type {const} */ ({ kind: "point" });
    assert.equal(endCount(tie, 8), 15);
    assert.deepEqual([...Array(15).keys()].map((i) => hookOfEnd(tie, 8, i + 1)), [1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it("refuses an end that does not exist", () => {
    assert.throws(() => hookOfEnd({ kind: "straight", repeats: 1 }, 8, 9), RangeError);
  });

  it("a missing card (an empty cylinder face) lifts every end", () => {
    assert.ok(rowOfCard({ kind: "point" }, null, 8).every(Boolean));
  });
});
