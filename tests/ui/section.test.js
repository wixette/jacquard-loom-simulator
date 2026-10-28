// The shuttle in the head's section (js/view2d/layout.js, sectionLayout; 1.1.0): while it
// crosses, it goes through the shed between the two shed lines, across the cross-row's ends, left
// to right, laying its weft behind it; at rest, and once the weft is beaten up, it is not drawn.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { P } from "../../js/sim/params.js";
import { Loom } from "../../js/sim/loom.js";
import { sectionLayout } from "../../js/view2d/layout.js";

const at = (/** @type {number} */ phi) => {
  const l = new Loom({ hooks: 8, cards: [[true, false, true, false, true, false, true, false]], loop: true });
  l.moveTo(0, phi);
  return sectionLayout(l.snapshot());
};

describe("the shuttle in the section", () => {
  const [from, to] = P.shuttle;
  it("crosses through the shed, between its two lines, left to right, its weft behind it", () => {
    const xs = [];
    for (const k of [0.2, 0.5, 0.8]) {
      const L = at(from + (to - from) * k);
      assert.ok(L.shuttle, `drawn at ${k}`);
      if (!L.shuttle) continue;
      assert.ok(L.shuttle.y > L.shed.rest && L.shuttle.y + L.shuttle.h < L.shed.top, "between the shed's lines");
      assert.ok(L.weft && L.weft[1][0] > L.weft[0][0], "its weft laid behind it");
      xs.push(L.shuttle.x);
    }
    assert.deepEqual([...xs].sort((a, b) => a - b), xs, "left to right");
  });
  it("is not drawn at rest, nor its weft once beaten up", () => {
    assert.equal(at(0).shuttle, null);
    assert.equal(at(0).weft, null);
    const beaten = at(P.stops[3] + 0.01);
    assert.equal(beaten.shuttle, null);
    assert.equal(beaten.weft, null);
  });
});
