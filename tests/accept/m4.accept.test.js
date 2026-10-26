// M4 acceptance spec (design/m4-notes.md): the ghosted machine with the units in place, and
// lessons L8–L10, in Node. The same checks, and the learner page's own (J4-6 to J4-8), run in
// the pages' ?selftest.

import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { before, describe, it } from "node:test";
import { runM4Checks } from "../../js/accept/m4Checks.js";
import { Unit, UNITS } from "../../js/scene/units.js";
import { loadAsset } from "./loadGlb.js";
/** @import { CheckResult } from "../../js/accept/harness.js" */
/** @import { UnitId } from "../../js/scene/units.js" */

/** @type {CheckResult[]} */
let results = [];

/** @param {string} file */
const size = (file) => statSync(fileURLToPath(new URL(`../../assets/${file}`, import.meta.url))).size;

before(async () => {
  const units = /** @type {Record<UnitId, Unit>} */ ({});
  /** @type {Record<string, number>} */
  const bytes = { "context.glb": size("context.glb") };
  for (const spec of UNITS) {
    units[spec.id] = new Unit(spec, await loadAsset(spec.file));
    bytes[spec.file] = size(spec.file);
  }
  results = runM4Checks(await loadAsset("context.glb"), units, bytes);
});

const IDS = ["J4-1", "J4-2", "J4-3", "J4-4", "J4-5"];

describe("M4 acceptance (the ghosted machine and the later lessons)", () => {
  for (const id of IDS) {
    it(id, () => {
      const r = results.find((x) => x.id === id);
      assert.ok(r !== undefined, `check ${id} did not run`);
      assert.equal(r.passed, true, `${id} ${r.title}: ${r.detail}`);
    });
  }
});
