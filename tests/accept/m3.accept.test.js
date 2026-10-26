// M3 acceptance spec (design/m3-notes.md): runs on the five unit files in assets/, in Node.
// The same checks run in dev/04-units's ?selftest on the files the page loaded.

import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { before, describe, it } from "node:test";
import { runM3Checks } from "../../js/accept/m3Checks.js";
import { Unit, UNITS } from "../../js/scene/units.js";
import { loadAsset } from "./loadGlb.js";
/** @import { CheckResult } from "../../js/accept/harness.js" */
/** @import { UnitId } from "../../js/scene/units.js" */

/** @type {CheckResult[]} */
let results = [];

before(async () => {
  const units = /** @type {Record<UnitId, Unit>} */ ({});
  /** @type {Record<string, number>} */
  const bytes = {};
  for (const spec of UNITS) {
    units[spec.id] = new Unit(spec, await loadAsset(spec.file));
    bytes[spec.file] = statSync(fileURLToPath(new URL(`../../assets/${spec.file}`, import.meta.url))).size;
  }
  results = runM3Checks(units, bytes);
});

const IDS = ["J3-1", "J3-2", "J3-3", "J3-4", "J3-5", "J3-6", "J3-7", "J3-8", "J3-9"];

describe("M3 acceptance (the 3D core units)", () => {
  for (const id of IDS) {
    it(id, () => {
      const r = results.find((x) => x.id === id);
      assert.ok(r !== undefined, `check ${id} did not run`);
      assert.equal(r.passed, true, `${id} ${r.title}: ${r.detail}`);
    });
  }
});
