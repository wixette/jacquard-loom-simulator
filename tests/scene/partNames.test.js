// The 3D parts' names (js/scene/partNames.js): every part the models name has a message key,
// whose English, filled in, is the model's own English name; so a part renamed in
// blender/scripts, or a part added, fails here until its message follows. The repeat bands are
// named by their own keys (band.*), not by the part's.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { MESSAGES } from "../../js/l10n/all.js";
import { t } from "../../js/l10n/l10n.js";
import { partName } from "../../js/scene/partNames.js";
import { UNITS } from "../../js/scene/units.js";

const ASSETS = fileURLToPath(new URL("../../assets/", import.meta.url));

/** The nodes of a .glb, from its JSON chunk. @param {string} file */
function nodes(file) {
  const b = readFileSync(ASSETS + file);
  const length = b.readUInt32LE(12);
  return /** @type {{ name: string; extras?: Record<string, unknown> }[]} */ (JSON.parse(b.subarray(20, 20 + length).toString()).nodes ?? []);
}

describe("the 3D parts' names", () => {
  for (const file of readdirSync(ASSETS).filter((f) => f.endsWith(".glb"))) {
    it(`every part named in ${file} has its message, saying the same in English`, () => {
      let n = 0;
      for (const node of nodes(file)) {
        const label = node.extras?.label_en;
        if (typeof label !== "string" || node.extras?.band) continue;
        const m = partName(node.name);
        assert.ok(m.key in MESSAGES.en, `${node.name}: no message ${m.key}`);
        assert.equal(t(m.key, m.params, "en"), label, node.name);
        n++;
      }
      assert.ok(n > 0, "no named parts");
    });
  }
  it("every unit's title and idea is a message", () => {
    for (const u of UNITS) for (const k of [u.title, u.idea]) assert.ok(k in MESSAGES.en, k);
  });
});
