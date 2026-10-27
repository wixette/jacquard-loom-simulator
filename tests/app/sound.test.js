// When the machine's sounds are heard (js/app/sound.js, SOUND_AT): each on the motion that
// makes it, and one in each step of the transport, in the order of the pick.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SOUND_AT } from "../../js/app/sound.js";
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
