// Screenshots of the pages, `pnpm shots`: every 2D and 3D view as the pages show them, for
// reviewing a change of the theme or the layout side by side with the one before.
//
//     pnpm shots                       (into shots/)
//     pnpm shots --out ~/Pictures/before
//     pnpm shots --only machine        (the shots whose name contains "machine")
//     pnpm shots --set=--lift=#ff6b5b  (a theme token changed, to try a colour)
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
/** In the main app: weave a few picks and follow a hook, as a learner would. */
const APP = "for (let i = 0; i < 26; i++) { document.querySelector('.transport [data-act=fwd]')?.click(); await sleep(30); } document.querySelector('svg.section .hook.caught')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sleep(900);";
/** The app is ready when its 3D views (if any) have loaded. */
const APP_READY = "document.querySelector('.app') && !document.querySelector('.view-note')";

/** In the README (pnpm shots --only readme- --out screenshots): the app as a newcomer meets it. */
const README_SHOTS = [
  { name: "readme-app", path: "index.html#v=2&view=section,3d", ready: APP_READY, setup: `${APP} await sleep(2500);`, size: [1920, 1080] },
  { name: "readme-learn", path: "index.html#v=2&w=learn&step=how-griffe", ready: APP_READY, setup: "await sleep(1200);", size: [1440, 900] },
  { name: "readme-units", path: "index.html#v=2&h=8&c=x.cc-66-33-99&p=5&s=2&f=1&view=u1", ready: APP_READY, setup: "await sleep(2500); document.querySelector('.unit-note summary').click(); await sleep(400);", size: [1440, 900] },
  { name: "readme-create", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(800);", size: [1440, 900] },
  { name: "readme-play", path: "index.html#v=2&w=play&game=name&text=Ada", ready: APP_READY, setup: "await sleep(600); [...document.querySelectorAll('.game-body .btn.filled')][0]?.click(); await sleep(1200);", size: [1440, 900] },
  { name: "readme-phone", path: "index.html#v=2&w=learn&step=weave-twill", ready: APP_READY, setup: "await sleep(1000); document.querySelector('.predict input')?.click(); await sleep(400);", size: [390, 844] },
];

const SHOTS = [
  ...README_SHOTS,
  { name: "create-tall", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(600); const z = document.querySelector('.pic-size'); z.value = '32'; z.dispatchEvent(new Event('change')); await sleep(300); const p = document.querySelectorAll('.pic-reading select')[0]; p.value = '3'; p.dispatchEvent(new Event('change')); await sleep(800);", size: [1366, 768] },
  { name: "design-open-image", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(600); document.querySelector('.pic-tools [aria-haspopup=dialog]').click(); await sleep(300);", size: [1366, 768] },
  { name: "design-image-loaded", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(600); const c = document.createElement('canvas'); c.width = 300; c.height = 150; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 150); g.fillStyle = '#222'; g.beginPath(); g.arc(75, 75, 60, 0, 7); g.fill(); g.fillStyle = '#888'; g.fillRect(170, 20, 110, 110); const blob = await new Promise((r) => c.toBlob(r)); const dt = new DataTransfer(); dt.items.add(new File([blob], 'circle-and-square.png', { type: 'image/png' })); const f = document.querySelector('.pic-file'); f.files = dt.files; f.dispatchEvent(new Event('change')); await sleep(800);", size: [1366, 768] },
  { name: "app-1366", path: "index.html#v=2", ready: APP_READY, setup: APP, size: [1366, 768] },
  { name: "app-1280", path: "index.html#v=2", ready: APP_READY, setup: APP, size: [1280, 800] },
  { name: "app-1600", path: "index.html#v=2", ready: APP_READY, setup: `${APP} await sleep(1500);`, size: [1600, 1000] },
  { name: "app-1920-two", path: "index.html#v=2", ready: APP_READY, setup: `${APP} await sleep(1500);`, size: [1920, 1080] },
  { name: "app-1920-four", path: "index.html#v=2&view=section,front,side,3d", ready: APP_READY, setup: `${APP} await sleep(1500);`, size: [1920, 1080] },
  { name: "app-1366-learn", path: "index.html#v=2", ready: APP_READY, setup: `document.getElementById('ws-learn')?.click(); await sleep(300); ${APP}`, size: [1366, 768] },
  ...["story-draw-loom", "story-portrait", "how-whole-loom", "how-section", "how-one-row", "how-not-a-computer", "weave-punch", "weave-twill", "weave-tie-up", "weave-next"].map((step) => ({
    name: `learn-${step}`,
    path: `index.html#v=2&w=learn&step=${step}`,
    ready: APP_READY,
    setup: "await sleep(1500);",
    size: /** @type {[number, number]} */ ([1366, 768]),
  })),
  { name: "learn-de", path: "index.html?lang=de#v=2&w=learn&step=how-one-row", ready: APP_READY, setup: "await sleep(800); document.querySelector('.predict input')?.click(); await sleep(300);", size: [1366, 768] },
  { name: "learn-ja", path: "index.html?lang=ja#v=2&w=learn&step=story-portrait", ready: APP_READY, setup: "await sleep(1500);", size: [1366, 768] },
  { name: "app-view-menu", path: "index.html#v=2&view=section,3d,front,side", ready: APP_READY, setup: "await sleep(1500); document.querySelectorAll('.view-chip')[2].click(); await sleep(300);", size: [1600, 1000] },
  { name: "app-first", path: "index.html", ready: APP_READY, setup: "await sleep(1500);", size: [1366, 768] },
  { name: "learn-tall", path: "index.html#v=2&w=learn&step=how-program", ready: APP_READY, setup: "await sleep(800);", size: [1440, 1100] },
  { name: "learn-phone", path: "index.html#v=2&w=learn&step=how-one-row", ready: APP_READY, setup: "await sleep(800);", size: [390, 844] },
  { name: "app-setup", path: "index.html#v=2", ready: APP_READY, setup: `${APP} document.querySelector('.setup-chip').click(); await sleep(300);`, size: [1366, 768] },
  { name: "app-colours", path: "index.html#v=2", ready: APP_READY, setup: `${APP} document.querySelector('.panel.right [aria-haspopup="dialog"]').click(); await sleep(300);`, size: [1366, 768] },
  { name: "app-colours-pair", path: "index.html#v=2", ready: APP_READY, setup: `${APP} document.querySelector('.colours-btn').click(); await sleep(300); document.querySelector('.pair[data-pair="madder"]').click(); await sleep(300);`, size: [1366, 768] },
  { name: "app-phone-colours", path: "index.html#v=2", ready: APP_READY, setup: `${APP} document.getElementById('sheet-cloth')?.click(); await sleep(300); document.querySelector('.colours-btn').click(); await sleep(300);`, size: [390, 844] },
  { name: "app-64", path: "index.html#v=2", ready: APP_READY, setup: `document.querySelector('.setup-chip').click(); await sleep(200); const h = document.getElementById('setup-hooks'); h.value = '64'; h.dispatchEvent(new Event('change')); await sleep(300); document.querySelector('.chain').scrollLeft = 400; await sleep(200);`, size: [1366, 768] },
  { name: "app-about", path: "index.html#v=2", ready: APP_READY, setup: `document.querySelector('.topbar .btn.icon-only').click(); await sleep(300);`, size: [1366, 768] },
  { name: "app-phone-full", path: "index.html#v=2", ready: APP_READY, setup: `${APP} const g = document.querySelector('.grab'); g.dispatchEvent(new PointerEvent('pointerdown', { clientY: 400, bubbles: true })); g.dispatchEvent(new PointerEvent('pointerup', { clientY: 400, bubbles: true })); await sleep(400);`, size: [390, 844] },
  { name: "app-phone-peek", path: "index.html#v=2", ready: APP_READY, setup: `${APP} const g = document.querySelector('.grab'); g.dispatchEvent(new PointerEvent('pointerdown', { clientY: 400, bubbles: true })); g.dispatchEvent(new PointerEvent('pointerup', { clientY: 480, bubbles: true })); await sleep(400);`, size: [390, 844] },
  { name: "app-unit-note", path: "index.html#v=2&view=section,u1", ready: APP_READY, setup: `${APP} await sleep(1500); document.querySelector('.unit-note summary').click(); await sleep(300);`, size: [1366, 768] },
  { name: "app-ja", path: "index.html?lang=ja#v=2", ready: APP_READY, setup: APP, size: [1366, 768] },
  { name: "app-de", path: "index.html?lang=de#v=2", ready: APP_READY, setup: APP, size: [1366, 768] },
  { name: "app-tablet", path: "index.html#v=2", ready: APP_READY, setup: APP, size: [820, 1180] },
  { name: "app-phone", path: "index.html#v=2", ready: APP_READY, setup: APP, size: [390, 844] },
  { name: "app-phone-cloth", path: "index.html#v=2", ready: APP_READY, setup: `${APP} document.getElementById('sheet-cloth')?.click(); await sleep(400);`, size: [390, 844] },
  { name: "app-landscape", path: "index.html#v=2", ready: APP_READY, setup: APP, size: [844, 390] },
  { name: "learner", path: "dev/03-learner/", setup: WEAVE },
  { name: "learner-follow", path: "dev/03-learner/", setup: `${WEAVE} await tap("svg.section .hook.caught");` },
  { name: "learner-3d", path: "dev/03-learner/?view=3d", ready: LOADED_3D, setup: "await sleep(1500);" },
  { name: "section", path: "dev/01-section/", setup: WEAVE },
  { name: "loom", path: "dev/02-loom/", setup: WEAVE },
  { name: "learner-needles", path: "dev/03-learner/", setup: `${WEAVE} await click('[data-view="needles"]'); await sleep(300);` },
  { name: "learner-crooks", path: "dev/03-learner/", setup: `${WEAVE} await click('[data-view="crooks"]'); await sleep(300);` },
  { name: "learner-bits", path: "dev/03-learner/", setup: `${WEAVE} await click('#fwd', 6 * 6); await click('#bits'); await sleep(300);` },
  ...["selector", "cylinder", "griffe", "harness", "shed"].map((u) => ({
    name: `units-${u}`,
    path: "dev/04-units/",
    ready: LOADED_3D,
    setup: `await click('#fwd', 2); await click('[data-unit="${u}"]'); await sleep(2500);`,
  })),
  { name: "machine", path: "dev/05-machine/", ready: LOADED_3D, setup: "await click('#fwd', 2); await sleep(2500);" },
  { name: "name-game", path: "dev/06-name-game/?text=Ada", setup: "await click('#all'); await sleep(800);" },
  ...["en", "fr", "zh", "ja"].map((lang) => ({
    name: `foundations-${lang}`,
    path: `dev/07-foundations/?lang=${lang}`,
    ready: "!document.querySelector('.view-note')",
    setup: "for (let i = 0; i < 9; i++) { document.querySelector('.transport [data-act=fwd]')?.click(); await sleep(40); } document.querySelector('svg.section .hook.caught')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sleep(800);",
  })),
  { name: "learner-phone", path: "dev/03-learner/", setup: WEAVE, size: [390, 844] },
];

const { values } = parseArgs({ options: { out: { type: "string", default: "shots" }, only: { type: "string" }, set: { type: "string", multiple: true } } });
/** The tokens to change, as [name, value]. */
const tokens = (values.set ?? []).map((t) => /** @type {[string, string]} */ (t.split(/=(.*)/s).slice(0, 2)));
const out = resolve(ROOT, values.out ?? "shots");
mkdirSync(out, { recursive: true });

const browser = await openBrowser({ width: 1600, height: 900 });
try {
  for (const s of SHOTS.filter((s) => !values.only || s.name.includes(values.only))) {
    const [w, h] = s.size ?? [1600, 900];
    await browser.resize(w, h, w < 600);
    await browser.open(s.path, s.ready);
    if (tokens.length) await browser.evaluate(`(() => { for (const [k, v] of ${JSON.stringify(tokens)}) document.documentElement.style.setProperty(k, v); })()`);
    if (s.setup) await browser.evaluate(`(async () => { ${HELPERS} ${s.setup} })()`);
    const file = join(out, `${s.name}.png`);
    writeFileSync(file, await browser.shot());
    console.log(`${file}${browser.errors.length ? `  (errors: ${browser.errors.join("; ")})` : ""}`);
  }
} finally {
  await browser.close();
}
