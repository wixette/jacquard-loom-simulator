// When the machine's sounds are heard (js/app/sound.js, SOUND_AT): each on the motion that
// makes it, and one in each step of the transport, in the order of the pick.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SOUND_AT, voice } from "../../js/app/sound.js";
import { BATTEN_STRIKE, battenSwing, shuttleAcross } from "../../js/sim/cycle.js";
import { STOPS } from "../../js/sim/loom.js";
import { P } from "../../js/sim/params.js";

describe("the machine's sounds, in time", () => {
  it("one sound in each step of the transport, in the order of the pick", () => {
    assert.deepEqual(SOUND_AT.map(([n]) => n), ["lift", "turn", "shuttle", "beat", "fall", "press"]);
    SOUND_AT.forEach(([name, at], i) => {
      const from = i === 0 ? 0 : STOPS[i - 1];
      assert.ok(at > from && at <= STOPS[i], `${name} at ${at} is not in the step (${from}, ${STOPS[i]}]`);
    });
  });
  it("the swish as the shuttle is thrown, the clack as the batten strikes, the press as the card meets the needles", () => {
    const at = Object.fromEntries(SOUND_AT);
    assert.equal(shuttleAcross(at.shuttle), 0, "the shuttle has not yet moved");
    assert.ok(shuttleAcross(at.shuttle + 0.01) > 0, "and moves straight after");
    assert.equal(at.beat, BATTEN_STRIKE);
    assert.equal(battenSwing(BATTEN_STRIKE), 1, "the batten is at its strike");
    assert.equal(at.press, P.cylinderBack[1], "the cylinder is back on the needles");
  });
});

describe("the machine's sounds, at every speed", () => {
  const names = SOUND_AT.map(([n]) => n);
  it("stepping, or playing up to 30 picks a minute, every sound plays whole, at its own pitch", () => {
    for (const n of names) {
      assert.deepEqual(voice(n, 60, false), { rate: 1, gain: 1, limit: null });
      for (const speed of [6, 12, 30]) assert.deepEqual(voice(n, speed, true), { rate: 1, gain: 1, limit: null });
    }
  });
  it("faster, every sound still plays, near its own pitch, over within half a pick, the batten loudest", () => {
    for (const speed of [31, 45, 60]) {
      const pick = 60 / speed;
      for (const n of names) {
        const v = voice(n, speed, true);
        assert.ok(v.gain > 0.5, `${n} at ${speed}: silent`);
        assert.ok(v.rate <= 1.1, `${n} at ${speed}: pitched up by ${v.rate}`);
        assert.ok(v.limit !== null && v.limit <= pick / 2 + 1e-9, `${n} at ${speed}: longer than half a pick`);
        if (n !== "beat") assert.ok(v.gain < voice("beat", speed, true).gain, `${n} as loud as the batten at ${speed}`);
      }
    }
  });
});
