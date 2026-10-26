// Screenshots of the pages, `pnpm shots`: every 2D and 3D view as the pages show them, for
// reviewing a change of the theme or the layout side by side with the one before.
//
//     pnpm shots                       (into shots/)
//     pnpm shots --out ~/Pictures/before
//     pnpm shots --only machine        (the shots whose name contains "machine")
//
// It drives headless Chrome (tools/headless.mjs) at 1600 × 900 and writes PNGs. Each shot
// loads its page afresh and sets it up as a learner would leave it.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { openBrowser, ROOT } from "./headless.mjs";

/**
 * A shot: its file name, the page (a path from the site's root), what must be true before it
 * is set up, a setup run in the page as the body of an async function (with the helpers in
 * HELPERS), and the window's size if not the default.
 * @typedef {{ name: string; path: string; ready?: string; setup?: string; size?: [number, number] }} Shot
 */

/** Run in the page before each setup. */
const HELPERS = `
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (sel, times = 1) => { for (let i = 0; i < times; i++) { document.querySelector(sel)?.click(); await sleep(60); } };
const tap = async (sel) => { document.querySelector(sel)?.dispatchEvent(new MouseEvent("click", { bubbles: true })); await sleep(150); };
`;

/** The 3D views are ready when their loading note is gone. */
const LOADED_3D = "document.querySelector('canvas') && !document.querySelector('.loading')";

/** Weave a few picks, then stop with the shed open, so every view shows lifted ends. */
const WEAVE = "await click('#fwd', 6 * 5 + 2);";

/** @type {Shot[]} */
const SHOTS = [
  { name: "learner", path: "index.html", setup: WEAVE },
  { name: "learner-follow", path: "index.html", setup: `${WEAVE} await tap("svg.section .hook.caught");` },
  { name: "learner-3d", path: "index.html?view=3d", ready: LOADED_3D, setup: "await sleep(1500);" },
  { name: "section", path: "dev/01-section/", setup: WEAVE },
  { name: "loom", path: "dev/02-loom/", setup: WEAVE },
  { name: "learner-needles", path: "index.html", setup: `${WEAVE} await click('[data-view="needles"]'); await sleep(300);` },
  { name: "learner-crooks", path: "index.html", setup: `${WEAVE} await click('[data-view="crooks"]'); await sleep(300);` },
  { name: "learner-bits", path: "index.html", setup: `${WEAVE} await click('#fwd', 6 * 6); await click('#bits'); await sleep(300);` },
  ...["selector", "cylinder", "griffe", "harness", "shed"].map((u) => ({
    name: `units-${u}`,
    path: "dev/04-units/",
    ready: LOADED_3D,
    setup: `await click('#fwd', 2); await click('[data-unit="${u}"]'); await sleep(2500);`,
  })),
  { name: "machine", path: "dev/05-machine/", ready: LOADED_3D, setup: "await click('#fwd', 2); await sleep(2500);" },
  { name: "name-game", path: "dev/06-name-game/?text=Ada", setup: "await click('#all'); await sleep(800);" },
  { name: "learner-phone", path: "index.html", setup: WEAVE, size: [390, 844] },
];

const { values } = parseArgs({ options: { out: { type: "string", default: "shots" }, only: { type: "string" } } });
const out = resolve(ROOT, values.out ?? "shots");
mkdirSync(out, { recursive: true });

const browser = await openBrowser({ width: 1600, height: 900 });
try {
  for (const s of SHOTS.filter((s) => !values.only || s.name.includes(values.only))) {
    const [w, h] = s.size ?? [1600, 900];
    await browser.resize(w, h, w < 600);
    await browser.open(s.path, s.ready);
    if (s.setup) await browser.evaluate(`(async () => { ${HELPERS} ${s.setup} })()`);
    const file = join(out, `${s.name}.png`);
    writeFileSync(file, await browser.shot());
    console.log(`${file}${browser.errors.length ? `  (errors: ${browser.errors.join("; ")})` : ""}`);
  }
} finally {
  await browser.close();
}
