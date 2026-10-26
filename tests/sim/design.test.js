// The picture helper's logic (js/sim/design.js): small cases worked by hand.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findFloats, pictureFromStrings, readDamask, readDirect, satinPoint } from "../../js/sim/design.js";

describe("readDirect", () => {
  it("cuts the first card from the bottom row", () => {
    const r = readDirect(pictureFromStrings(["#.", ".#"]), { hooks: 8 });
    assert.ok(r.ok);
    assert.deepEqual(r.reading.cards.map((c) => c.slice(0, 2)), [[false, true], [true, false]]);
    assert.equal(r.reading.width, 2);
  });
  it("repeats rows for picks per row, inverts, tiles", () => {
    const r = readDirect(pictureFromStrings(["#."]), { hooks: 8, picksPerRow: 2, invert: true, repeat: true });
    assert.ok(r.ok);
    assert.equal(r.reading.cards.length, 2);
    assert.deepEqual(r.reading.cards[0], [false, true, false, true, false, true, false, true]);
  });
  it("refuses a picture wider than the head", () => {
    const r = readDirect(pictureFromStrings(["#########"]), { hooks: 8 });
    assert.equal(r.ok, false);
  });
});

describe("readDamask", () => {
  it("weaves figure in warp-faced and ground in weft-faced satin", () => {
    const r = readDamask(pictureFromStrings(["#."]), { hooks: 16, k: 8 });
    assert.ok(r.ok);
    const { cards } = r.reading;
    assert.equal(cards.length, 8);
    for (let p = 0; p < 8; p++) {
      for (let e = 0; e < 16; e++) assert.equal(cards[p][e], e < 8 ? !satinPoint(e, p) : satinPoint(e, p));
    }
  });
});

describe("findFloats", () => {
  it("finds weft runs along picks and warp runs along ends", () => {
    const cloth = pictureFromStrings(["#.....", "#.##..", "#....."]);
    const f = findFloats(cloth, 3);
    assert.deepEqual(f.floats.map((x) => [x.kind, x.pick, x.end, x.length]).sort(), [["weft", 0, 1, 5], ["weft", 2, 1, 5]]);
    assert.equal(f.longestWarp, 3);
    assert.equal(f.longestWeft, 5);
  });
});
