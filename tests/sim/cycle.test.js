import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { battenSwing, cylinderOut, cylinderTurn, griffeHeight, shuttleAcross } from "../../js/sim/cycle.js";
import { P } from "../../js/sim/params.js";

describe("cycle", () => {
  it("everything is at rest at the start and the end of a pick", () => {
    for (const phi of [0, 1]) {
      assert.equal(griffeHeight(phi), 0);
      assert.equal(cylinderOut(phi), 0);
      assert.equal(battenSwing(phi), 0);
    }
    assert.equal(cylinderTurn(1), 1);
    assert.equal(shuttleAcross(1), 1);
  });

  it("moves continuously (no jump bigger than the motion allows between close moments)", () => {
    let prev = { g: 0, c: 0 };
    for (let i = 1; i <= 2000; i++) {
      const phi = i / 2000;
      const g = griffeHeight(phi);
      const c = cylinderOut(phi);
      assert.ok(Math.abs(g - prev.g) < 1, `griffe jumps at ${phi}`);
      assert.ok(Math.abs(c - prev.c) < 1, `cylinder jumps at ${phi}`);
      prev = { g, c };
    }
  });

  it("reaches its documented extremes", () => {
    assert.equal(griffeHeight(0.5), P.griffeLift);
    assert.equal(cylinderOut(0.5), P.cylinderTravel);
    assert.equal(battenSwing(P.shuttle[1]), -1);
  });
});
