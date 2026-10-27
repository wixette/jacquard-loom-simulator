// The page's colour picker's maths (js/ui/colour.js): hex and hue-saturation-value read
// each other back, and a hex value is read as typed.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hexToHsv, hsvToHex, readHex } from "../../js/ui/colour.js";

describe("the colour picker's colours", () => {
  it("every colour of a coarse grid survives hex → HSV → hex", () => {
    for (let r = 0; r < 256; r += 17)
      for (let g = 0; g < 256; g += 17)
        for (let b = 0; b < 256; b += 17) {
          const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
          assert.equal(hsvToHex(hexToHsv(hex)), hex);
        }
  });
  it("the primaries and greys are where they should be", () => {
    assert.deepEqual(hexToHsv("#ff0000"), { h: 0, s: 1, v: 1 });
    assert.deepEqual(hexToHsv("#00ff00"), { h: 120, s: 1, v: 1 });
    assert.deepEqual(hexToHsv("#0000ff"), { h: 240, s: 1, v: 1 });
    assert.deepEqual(hexToHsv("#000000"), { h: 0, s: 0, v: 0 });
    assert.equal(hsvToHex({ h: 200, s: 0, v: 0.5 }), "#808080");
  });
  it("a hex value is read with or without #, in either case, and short forms doubled", () => {
    assert.equal(readHex("#5B3F8C"), "#5b3f8c");
    assert.equal(readHex(" 5b3f8c "), "#5b3f8c");
    assert.equal(readHex("abc"), "#aabbcc");
    for (const bad of ["", "#12345", "#1234567", "ggg000", "#12 456"]) assert.equal(readHex(bad), null, bad);
  });
});
