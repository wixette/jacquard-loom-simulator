// M1 acceptance spec (design/m1-notes.md): the whole 2D machine, in Node. The same checks
// run in dev/02-loom's ?selftest.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runM1Checks } from "../../js/accept/m1Checks.js";

const results = await runM1Checks();
const IDS = ["J1-1", "J1-2", "J1-3", "J1-4", "J1-5", "J1-6", "J1-7", "J1-8", "J1-9", "J1-10", "J1-11", "J1-12"];

describe("M1 acceptance (the whole loom in 2D)", () => {
  for (const id of IDS) {
    it(id, () => {
      const r = results.find((x) => x.id === id);
      assert.ok(r !== undefined, `check ${id} did not run`);
      assert.equal(r.passed, true, `${id} ${r.title}: ${r.detail}`);
    });
  }
});
