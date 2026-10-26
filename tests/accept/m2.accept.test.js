// M2 acceptance spec (design/m2-notes.md): the picture helper and the lessons, in Node. The
// same checks, and the page's own (J2-7 to J2-9), run in the learner page's ?selftest.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runM2Checks } from "../../js/accept/m2Checks.js";

const results = runM2Checks();
const IDS = ["J2-1", "J2-2", "J2-3", "J2-4", "J2-5", "J2-6"];

describe("M2 acceptance (the picture helper and the lessons)", () => {
  for (const id of IDS) {
    it(id, () => {
      const r = results.find((x) => x.id === id);
      assert.ok(r !== undefined, `check ${id} did not run`);
      assert.equal(r.passed, true, `${id} ${r.title}: ${r.detail}`);
    });
  }
});
