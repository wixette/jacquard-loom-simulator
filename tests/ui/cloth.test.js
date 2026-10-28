// The cloth's squares (js/view2d/clothView.js, cellSize; design/m8-notes.md, decision 7): sized
// by the width only, so they keep their size as rows are woven; 1.5 times larger on the stage;
// small for a wide cloth, never under 3 px (1.0.0 review).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cellSize } from "../../js/view2d/clothView.js";

describe("the cloth's squares", () => {
  it("at most 22 px in a panel, 33 on the stage, the same however many rows", () => {
    assert.equal(cellSize(340, 8, false), 22);
    assert.equal(cellSize(900, 16, true), 33);
  });
  it("as many ends as fit across, never under 3 px", () => {
    assert.equal(cellSize(340, 64, false), Math.floor((340 - 4 - 28 - 6) / 64));
    assert.equal(cellSize(340, 256, false), 3);
  });
  it("the stage's are never smaller than the panel's at the same width", () => {
    for (const ends of [8, 16, 64, 96, 256]) for (const w of [200, 340, 600, 1200]) assert.ok(cellSize(w, ends, true) >= cellSize(w, ends, false));
  });
});
