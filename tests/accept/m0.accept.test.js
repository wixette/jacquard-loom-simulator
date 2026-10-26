// M0 acceptance spec (design/simulator-plan.md §8.1): the logic, the cycle and the 2D
// section's layout, in Node. The same checks run in the developer page's ?selftest.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runM0Checks } from "../../js/accept/m0Checks.js";

const results = runM0Checks();
const IDS = ["J0-1", "J0-2", "J0-3", "J0-4", "J0-5", "J0-6", "J0-7", "J0-8", "J0-9", "J0-10"];

describe("M0 acceptance (one cross-row in 2D)", () => {
  for (const id of IDS) {
    it(id, () => {
      const r = results.find((x) => x.id === id);
      assert.ok(r !== undefined, `check ${id} did not run`);
      assert.equal(r.passed, true, `${id} ${r.title}: ${r.detail}`);
    });
  }
});
