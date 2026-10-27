// A picture read into cards (js/sim/picture.js; design/m8-notes.md, P-1): the smallest head
// that takes the reading, the first card from the picture's bottom row, the cloth it weaves and
// its loose threads, and a reading too wide refused with the reason.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardToString } from "../../js/sim/deck.js";
import { FLOAT_LIMIT } from "../../js/sim/design.js";
import { blankPicture, describeReading, pictureNeeds, PICTURE_NAMES, presetPicture, readPicture, resizePicture, startPicture } from "../../js/sim/picture.js";
/** @import { PictureSpec } from "../../js/sim/picture.js" */

/** @param {Partial<PictureSpec>} o @returns {PictureSpec} */
const spec = (o) => ({ ...startPicture(), ...o });

describe("a picture read into cards (P-1)", () => {
  it("direct: one card a row, the first from the bottom, on the smallest head that takes it", () => {
    const r = readPicture(spec({ rows: presetPicture("arrow") }));
    assert.ok(r.ok);
    const { deck, width, cloth } = r.cards;
    assert.equal(deck.hooks, 8);
    assert.equal(deck.loop, false);
    assert.equal(width, 8);
    assert.deepEqual(deck.cards.map(cardToString), ["...OO...", "...OO...", "...OO...", "...OO...", "O..OO..O", ".O.OO.O.", "..OOOO..", "...OO..."]);
    assert.deepEqual(cloth.length, 8);
  });
  it("direct, several picks a row: each row's card that many times", () => {
    const r = readPicture(spec({ rows: presetPicture("arrow"), perRow: 3 }));
    assert.ok(r.ok);
    assert.equal(r.cards.deck.cards.length, 24);
    assert.equal(cardToString(r.cards.deck.cards[2]), cardToString(r.cards.deck.cards[0]));
  });
  it("damask: each square a block of satin, so no thread lies loose; the head grows to fit", () => {
    const direct = readPicture(spec({ rows: presetPicture("heart") }));
    const damask = readPicture(spec({ rows: presetPicture("heart"), mode: "damask", k: 4 }));
    assert.ok(direct.ok && damask.ok);
    assert.ok(direct.cards.floats.length > 0, "read square by square, the heart has loose threads");
    assert.ok(direct.cards.longest > FLOAT_LIMIT);
    assert.equal(damask.cards.floats.length, 0, "as damask it holds together");
    assert.equal(damask.cards.deck.hooks, 64);
    assert.equal(damask.cards.deck.cards.length, 64);
  });
  it("invert: the dark squares weave in the weft's colour", () => {
    const a = readPicture(spec({ rows: presetPicture("arrow") }));
    const b = readPicture(spec({ rows: presetPicture("arrow"), invert: true }));
    assert.ok(a.ok && b.ok);
    assert.deepEqual(b.cards.cloth, a.cards.cloth.map((row) => row.map((x) => !x)));
  });
  it("a reading wider than the largest head is refused, and says what it needs", () => {
    const s = spec({ rows: blankPicture(32), mode: "damask", k: 3 });
    assert.deepEqual(pictureNeeds(s), { ends: 96, hooks: null });
    const r = readPicture(s);
    assert.ok(!r.ok);
    assert.deepEqual(r.reason, { key: "pic.tooWide", params: { ends: 96, most: 64, k: 3, n: 32 } });
    assert.deepEqual(describeReading(s, r), r.reason);
  });
  it("a picture that is not square is refused", () => {
    assert.ok(!readPicture(spec({ rows: [[true, false]] })).ok);
    assert.ok(!readPicture(spec({ rows: [] })).ok);
  });
  it("a reading is described: its size, how it is read, its cards and head, whether it holds", () => {
    const s = spec({ rows: presetPicture("heart") });
    const m = describeReading(s, readPicture(s));
    assert.equal(/** @type {{ key: string }} */ (m).key, "pic.reading");
    const p = /** @type {{ params: Record<string, any> }} */ (m).params;
    assert.deepEqual([p.n, p.cards, p.hooks, p.how.key, p.holds.key], [16, 16, 16, "pic.read.direct", "pic.loose"]);
  });
  it("every ready-made picture is square, and a picture resized keeps its squares' places", () => {
    for (const name of PICTURE_NAMES) {
      const p = presetPicture(name);
      assert.ok(p.every((r) => r.length === p.length), name);
    }
    const big = resizePicture(presetPicture("arrow"), 16);
    assert.equal(big.length, 16);
    assert.equal(big[0][6], presetPicture("arrow")[0][3]);
    assert.deepEqual(resizePicture(big, 8), presetPicture("arrow"));
  });
});
