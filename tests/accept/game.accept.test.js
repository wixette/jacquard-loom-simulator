// The name game's acceptance spec (design/name-game-notes.md), in Node. The same checks, and
// the page's own (G-5), run in dev/06-name-game's ?selftest.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runGameChecks } from "../../js/accept/gameChecks.js";

const results = runGameChecks();

describe("The name game", () => {
  for (const id of ["G-1", "G-2", "G-3", "G-4"]) {
    it(id, () => {
      const r = results.find((x) => x.id === id);
      assert.ok(r !== undefined, `check ${id} did not run`);
      assert.equal(r.passed, true, `${id} ${r.title}: ${r.detail}`);
    });
  }
});
