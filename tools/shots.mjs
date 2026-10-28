// Screenshots of the pages, `pnpm shots`: every 2D and 3D view as the pages show them, for
// reviewing a change of the theme or the layout side by side with the one before; the README's
// pictures; and a set for posts (post-…, 1920 × 1080: the app, the loom in 3D and in section,
// the five units, Design, the games, the tutorial, a phone), in any language.
//
//     pnpm shots                       (into shots/)
//     pnpm shots --out ~/Pictures/before
//     pnpm shots --only machine        (the shots whose name contains "machine")
//     pnpm shots --set=--lift=#ff6b5b  (a theme token changed, to try a colour)
//     pnpm shots --only post- --lang en,zh --out ~/Downloads/jacquard-media/shots
//                                      (the posts' set, in English and Chinese: into <out>/<lang>/)
//
// It drives headless Chrome (tools/headless.mjs) at 1600 × 900 and writes PNGs. Each shot
// loads its page afresh and sets it up as a learner would leave it. A post's shot is the whole
// page or the stage alone (its views, without the panels), set up through the app's own store
// (?debug, js/main.js).

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { openBrowser, ROOT } from "./headless.mjs";

/**
 * A shot: its file name, the page (a path from the site's root), what must be true before it
 * is set up, a setup run in the page as the body of an async function (with the helpers in
 * HELPERS, and for a post POST_HELPERS), the window's size if not the default, its pixel ratio
 * (a phone's, sharp), and whether it is the stage alone.
 * @typedef {{ name: string; path: string; ready?: string; setup?: string; size?: [number, number]; scale?: number; stage?: boolean; post?: boolean }} Shot
 */

/** Run in the page before each setup. */
const HELPERS = `
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (sel, times = 1) => { for (let i = 0; i < times; i++) { document.querySelector(sel)?.click(); await sleep(60); } };
const tap = async (sel) => { document.querySelector(sel)?.dispatchEvent(new MouseEvent("click", { bubbles: true })); await sleep(150); };
`;

/** Run in the main app (with ?debug) before a post's setup: its store and actions, and the 3D camera. */
const POST_HELPERS = `
const { store } = window.app;
const act = await import("./js/app/looms.js");
const play = await import("./js/app/play.js");
const { STOPS } = await import("./js/sim/loom.js");
const units = () => document.querySelector(".stage canvas")?.unitsView;
// every 3D view loaded (its models in), and a moment for the picture to settle
const loaded = async () => { for (let i = 0; i < 150 && (document.querySelector(".view-note") || [...document.querySelectorAll(".stage canvas")].some((c) => c.unitsView && !c.unitsView.loaded)); i++) await sleep(100); await sleep(800); };
// Orbit the first 3D view's camera from where it is, in degrees: across (+ to the loom's right)
// and up; and scale its distance (below 1: nearer).
const orbit = async (across = 0, up = 0, zoom = 1) => {
  const u = units(); if (!u) return;
  const v = u.viewer, c = v.camera, t = v.controls.target.clone(), o = c.position.clone().sub(t);
  const r = o.length() * zoom, theta = Math.atan2(o.x, o.z) + (across * Math.PI) / 180;
  const phi = Math.min(Math.max(Math.acos(o.y / o.length()) - (up * Math.PI) / 180, 0.08), Math.PI / 2 + 0.25);
  v.flyTo(t.clone().add(o.set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta)).multiplyScalar(r)), t, 0.001);
  await sleep(600);
};
const button = (key) => [...document.querySelectorAll(".game-body button")].find((b) => b.textContent.trim() === key);
// the side panels closed (Enter on each edge, as the keyboard does), the stage the window's width
const wide = async () => { for (const e of document.querySelectorAll(".edge")) e.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); await sleep(900); };
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

/**
 * The posts' set, 1920 × 1080 (a phone's at its own size, three times as sharp): the main app in
 * the language asked for, set up through its store.
 * @param {string} name
 * @param {string} hash the link it opens (design/links.md)
 * @param {string} setup
 * @param {Partial<Shot>} [o]
 * @returns {Shot}
 */
const post = (name, hash, setup, o = {}) => ({ name: `post-${name}`, path: `index.html?debug#v=2&${hash}`, ready: APP_READY, setup, size: [1920, 1080], post: true, ...o });
/** Woven a few picks into the arrow, the shed open on pick 6, hook 4 followed. */
const ARROW = "act.moveTo(store, 5, STOPS[1]); act.followHook(store, 3); await sleep(300);";
const POSTS = [
  post("01-app", "view=section,3d", `${ARROW} await loaded(); await orbit(-12, 4, 0.9);`),
  post("02-four-views", "view=section,front,side,3d", `${ARROW} await loaded(); await orbit(-15, 4, 0.95);`),
  post("03-loom-3d", "view=3d", `act.loadPreset(store, "twill"); act.moveTo(store, 14, STOPS[1]); await loaded(); await orbit(-28, 6, 0.62);`, { stage: true }),
  post("04-loom-3d-side", "view=3d", `act.loadPreset(store, "twill"); act.moveTo(store, 14, STOPS[2]); await loaded(); await orbit(55, 12, 0.66);`, { stage: true }),
  post("05-section", "view=section", `${ARROW}`, { stage: true }),
  post("06-section-and-front", "view=section,front", `${ARROW}`, { stage: true }),
  ...["u1", "u2", "u3", "u4", "u5"].map((u, i) =>
    post(`${String(7 + i).padStart(2, "0")}-unit-${["selector", "cylinder", "griffe", "harness", "shed"][i]}`, `h=8&c=x.cc-66-33-99&p=5&s=2&f=1&view=${u}`, `await loaded(); await orbit(0, 0, ${[0.5, 0.9, 1, 1, 0.85][i]}); document.querySelector('.unit-note summary').click(); await sleep(500);`, { stage: true }),
  ),
  post("12-cloth-satin", "view=cloth", `act.loadPreset(store, "satin"); act.setColours(store, { warp: "#9b2d30", weft: "#e8c16a" }); act.moveTo(store, 24, 0); await sleep(500);`, { stage: true }),
  post("13-design-loose", "w=create", "await sleep(800);"),
  post("14-design-damask", "w=create", "document.querySelector('.panel.left [data-mode=damask]').click(); await sleep(1200);"),
  post("15-name-game", "w=play&game=name&text=JACQUARD", "play.weaveAll(store); await sleep(1500);"),
  post("16-name-cloth", "w=play&game=name&text=JACQUARD%0ALOOM", "play.weaveAll(store); await sleep(1500);", { stage: true }),
  post("17-one-byte-a-card", "w=play&game=byte", `play.setMessage(store, "Hello!"); play.weaveAll(store); await sleep(1200);`),
  post("18-guess-the-cloth", "w=play&game=guess&seed=7", `const { puzzle } = await import("./js/game/guessGame.js"); play.pickCloth(store, puzzle(7).answer); play.weaveAll(store); await sleep(1000);`),
  post("19-draw-boy", "w=play&game=drawboy", `const { ROWS } = await import("./js/game/drawBoy.js"); for (const row of ROWS.slice(0, 5)) { row.forEach((up, e) => up && play.pullCord(store, e)); play.throwShuttle(store); } await sleep(800);`),
  post("20-learn-portrait", "w=learn&step=story-portrait", "await sleep(1500);"),
  post("21-learn-griffe", "w=learn&step=how-griffe", "await loaded();"),
  post("22-learn-challenge", "w=learn&step=debug-swapped", "act.moveTo(store, 6, 0); await sleep(1000);"),
  post("23-learn-babbage", "w=learn&step=next-babbage", "await loaded(); await orbit(-20, 5, 0.9);"),
  post("24-phone-learn", "w=learn&step=weave-twill", "await sleep(1000); document.querySelector('.predict input')?.click(); await sleep(400);", { size: [390, 844], scale: 3 }),
  post("25-phone-games", "w=play&game=name&text=JACQUARD", "play.weaveAll(store); await sleep(1200);", { size: [390, 844], scale: 3 }),
];

const SHOTS = [
  ...README_SHOTS,
  ...POSTS,
  { name: "create-tall", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(600); const z = document.querySelector('.pic-size'); z.value = '32'; z.dispatchEvent(new Event('change')); await sleep(300); const p = document.querySelectorAll('.pic-reading select')[0]; p.value = '3'; p.dispatchEvent(new Event('change')); await sleep(800);", size: [1366, 768] },
  { name: "design-open-image", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(600); document.querySelector('.pic-tools [aria-haspopup=dialog]').click(); await sleep(300);", size: [1366, 768] },
  { name: "design-image-loaded", path: "index.html#v=2&w=create", ready: APP_READY, setup: "await sleep(600); const c = document.createElement('canvas'); c.width = 300; c.height = 150; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 150); g.fillStyle = '#222'; g.beginPath(); g.arc(75, 75, 60, 0, 7); g.fill(); g.fillStyle = '#888'; g.fillRect(170, 20, 110, 110); const blob = await new Promise((r) => c.toBlob(r)); const dt = new DataTransfer(); dt.items.add(new File([blob], 'circle-and-square.png', { type: 'image/png' })); const f = document.querySelector('.pic-file'); f.files = dt.files; f.dispatchEvent(new Event('change')); await sleep(800);", size: [1366, 768] },
  ...["fr", "de"].map((lang) => ({ name: `design-${lang}`, path: `index.html?lang=${lang}#v=2&w=create`, ready: APP_READY, setup: "await sleep(800);", size: /** @type {[number, number]} */ ([1366, 768]) })),
  { name: "games-de", path: "index.html?lang=de#v=2&w=play", ready: APP_READY, setup: "await sleep(800);", size: [1366, 768] },
  { name: "games-long", path: "index.html#v=2&w=play&game=name&text=THE%20JACQUARD%20LOOM%20WOVE%20PICTURES%20FROM%20A%20CHAIN%20OF%20PUNCHED%20CARDS%2C%20AND%20ITS%20IDEA%20LED%20TO%20COMPUTERS", ready: APP_READY, setup: "await sleep(800); [...document.querySelectorAll('.game-body .btn.filled')][0].click(); await sleep(1500);", size: [1366, 768] },
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

const { values } = parseArgs({ options: { out: { type: "string", default: "shots" }, only: { type: "string" }, set: { type: "string", multiple: true }, lang: { type: "string" } } });
/** The tokens to change, as [name, value]. */
const tokens = (values.set ?? []).map((t) => /** @type {[string, string]} */ (t.split(/=(.*)/s).slice(0, 2)));
const out = resolve(ROOT, values.out ?? "shots");
mkdirSync(out, { recursive: true });

/** The languages asked for (each into its own folder), or none: the pages' own choice, into out/. */
const langs = values.lang ? values.lang.split(",") : [null];
const browser = await openBrowser({ width: 1600, height: 900 });
let failed = 0;
try {
  for (const lang of langs) {
    const dir = lang ? join(out, lang) : out;
    mkdirSync(dir, { recursive: true });
    for (const s of SHOTS.filter((s) => !values.only || s.name.includes(values.only))) {
      const [w, h] = s.size ?? [1600, 900];
      await browser.resize(w, h, w < 600, s.scale ?? 1);
      // the language as a query field, and the shot's name, so that each shot loads afresh
      const [page, hash = ""] = s.path.split("#");
      const query = [lang && `lang=${lang}`, s.post && `shot=${s.name}`].filter(Boolean).join("&");
      // a post starts from nothing kept (a panel closed by the shot before, a picture drawn)
      if (s.post) await browser.evaluate("try { localStorage.clear() } catch {}").catch(() => {});
      await browser.open(`${page}${query ? `${page.includes("?") ? "&" : "?"}${query}` : ""}${hash ? `#${hash}` : ""}`, s.ready);
      if (tokens.length) await browser.evaluate(`(() => { for (const [k, v] of ${JSON.stringify(tokens)}) document.documentElement.style.setProperty(k, v); })()`);
      const setup = `${s.stage ? "await wide();" : ""} ${s.setup ?? ""}`;
      if (setup.trim()) await browser.evaluate(`(async () => { ${HELPERS} ${s.post ? POST_HELPERS : ""} ${setup} })()`).catch((e) => browser.errors.push(String(e)));
      const clip = s.stage ? { ...JSON.parse(await browser.evaluate("JSON.stringify(document.querySelector('.stage').getBoundingClientRect())")), scale: 1 } : undefined;
      const file = join(dir, `${s.name}.png`);
      writeFileSync(file, await browser.shot(clip ? { clip } : {}));
      if (browser.errors.length) failed++;
      console.log(`${file}${browser.errors.length ? `  (errors: ${browser.errors.join("; ")})` : ""}`);
    }
  }
} finally {
  await browser.close();
}
process.exitCode = failed ? 1 : 0;
