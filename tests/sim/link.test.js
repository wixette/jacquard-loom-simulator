// The link format is a public contract (js/sim/link.js): these tests pin it.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeLink, encodeLink } from "../../js/sim/link.js";

describe("links", () => {
  it("writes the documented fields in the documented order", () => {
    const fragment = encodeLink({
      hooks: 8,
      tie: { kind: "point" },
      loop: false,
      warp: "#112233",
      weft: "#AABBCC",
      cards: [[true, false, false, false, false, false, false, true]],
      pick: 2,
      stop: 4,
      crossRow: 0,
      follow: null,
      face: "back",
    });
    assert.equal(fragment, "v=1&h=8&t=p&l=0&wc=112233&fc=aabbcc&d=81&p=2&s=4&x=1&face=back");
  });

  it("puts hook 1 in the highest bit of the first hex digit", () => {
    const r = decodeLink("v=1&h=8&d=80");
    assert.ok(r.ok);
    assert.deepEqual(r.state.cards[0], [true, false, false, false, false, false, false, false]);
  });

  it("needs only v, h and d; the rest has defaults", () => {
    const r = decodeLink("#v=1&h=16&d=");
    assert.ok(r.ok);
    assert.deepEqual(r.state.cards, []);
    assert.equal(r.state.loop, true);
    assert.deepEqual(r.state.tie, { kind: "straight", repeats: 1 });
    assert.equal(r.state.face, "front");
    assert.equal(r.state.follow, null);
  });

  it("ignores fields it does not know (later versions may add some)", () => {
    const r = decodeLink("#v=1&h=8&d=ff&zz=whatever");
    assert.ok(r.ok);
  });

  it("refuses a card of the wrong length, and says which", () => {
    const r = decodeLink("#v=1&h=16&d=ffff-ff");
    assert.equal(r.ok, false);
    assert.match(/** @type {{ reason: string }} */ (r).reason, /card 2/);
  });
});
