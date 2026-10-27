// The stage's views (js/app/arrange.js; design/ui-layout.md §4): no view twice, one 3D model at
// most in the four-view grid, and going to two or four keeps the views on show.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { arrange, choose, is3d, SPLIT } from "../../js/app/arrange.js";
import { STAGE_VIEWS } from "../../js/sim/link.js";
/** @import { StageView } from "../../js/app/arrange.js" */

describe("choosing a view", () => {
  it("a view on show elsewhere swaps with the pane's own", () => {
    assert.deepEqual(choose(["section", "3d"], 0, "3d"), ["3d", "section"]);
    assert.deepEqual(choose(["section", "3d", "front", "side"], 3, "section"), ["side", "3d", "front", "section"]);
  });
  it("a view not on show takes the pane", () => {
    assert.deepEqual(choose(["section", "3d"], 1, "u2"), ["section", "u2"]);
    assert.deepEqual(choose(["section"], 0, "front"), ["front"]);
  });
  it("in four, a 3D model takes the place of the other 3D model", () => {
    assert.deepEqual(choose(["section", "3d", "front", "side"], 2, "u4"), ["section", "front", "u4", "side"]);
  });
  it("whatever is chosen, in whatever arrangement, no view is shown twice and four holds one 3D model at most", () => {
    for (const n of /** @type {const} */ ([1, 2, 4]))
      for (let i = 0; i < n; i++)
        for (const x of STAGE_VIEWS) {
          const out = choose(SPLIT[n], i, x);
          assert.equal(new Set(out).size, n, `${SPLIT[n]} ${i} ${x}`);
          assert.equal(out[i], x);
          if (n === 4) assert.ok(out.filter(is3d).length <= 1, out.join());
        }
  });
});

describe("going to one, two or four views", () => {
  it("the views on show stay, in their order; the rest come from the defaults", () => {
    assert.deepEqual(arrange(["section"], 2), ["section", "3d"]);
    assert.deepEqual(arrange(["section", "3d"], 4), ["section", "3d", "front", "side"]);
    assert.deepEqual(arrange(["u2"], 2), ["u2", "section"]);
    assert.deepEqual(arrange(["front", "u3"], 4), ["front", "u3", "section", "side"]);
    assert.deepEqual(arrange(["section", "3d", "front", "side"], 1), ["section"]);
  });
  it("two views on show twice over, or two 3D models, are never made", () => {
    /** @type {StageView[][]} */
    const starts = [["3d"], ["u1", "u5"], ["side", "front"], ["section", "3d", "front", "side"]];
    for (const s of starts)
      for (const n of /** @type {const} */ ([1, 2, 4])) {
        const out = arrange(s, n);
        assert.equal(out.length, n);
        assert.equal(new Set(out).size, n);
        if (n === 4) assert.ok(out.filter(is3d).length <= 1, out.join());
      }
  });
});
