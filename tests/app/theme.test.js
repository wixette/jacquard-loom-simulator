// F-8 (design/m5-notes.md): no colour is written into a view. The 2D drawings and the 3D
// scene name colours only through the theme's tokens (css/theme.css, js/ui/theme.js); a line
// that must hold a colour of another kind (a light, a material of the models, a shade of the
// learner's own colour) says so with "not a theme colour". Every token a stylesheet or a
// module uses is defined: in css/theme.css, in the prototypes' own aliases (css/loom.css and a
// developer page's stylesheet), or set by the code that draws (a chain's cell size).

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
/** @param {string} dir @param {string} ext @returns {string[]} */
const files = (dir, ext) =>
  readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`, ext) : e.name.endsWith(ext) ? [`${dir}/${e.name}`] : []));

const COLOUR = /#[0-9a-f]{3,8}\b|0x[0-9a-f]{6}\b|\brgba?\(|\bhsla?\(|setRGB|setScalar/i;

describe("no colour is written into a view (F-8)", () => {
  for (const file of [...files("js/view2d", ".js"), ...files("js/scene", ".js")]) {
    it(file, () => {
      const bad = readFileSync(join(ROOT, file), "utf8")
        .split("\n")
        .map((line, i) => ({ line: line.replace(/token\("--[\w-]+", "[^"]*"\)/g, ""), n: i + 1 }))
        .filter(({ line }) => COLOUR.test(line) && !line.includes("not a theme colour") && !/^\s*(\/\/|\*)/.test(line));
      assert.deepEqual(bad.map((b) => `${file}:${b.n}`), []);
    });
  }
});

describe("every token used is defined (F-8)", () => {
  const sources = [...files("css", ".css"), ...files("dev", ".css"), ...files("js", ".js")];
  const read = (/** @type {string} */ f) => readFileSync(join(ROOT, f), "utf8");
  const defined = new Set(sources.filter((f) => f.endsWith(".css")).flatMap((f) => [...read(f).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])));
  for (const f of sources.filter((f) => f.endsWith(".js"))) for (const m of read(f).matchAll(/setProperty\("(--[\w-]+)"/g)) defined.add(m[1]);
  for (const file of sources) {
    it(file, () => {
      const used = [...read(file).matchAll(/var\((--[\w-]+)|token\("(--[\w-]+)"/g)].map((m) => m[1] ?? m[2]);
      assert.deepEqual([...new Set(used.filter((t) => !defined.has(t)))], [], `${file} uses tokens nothing defines`);
    });
  }
});
