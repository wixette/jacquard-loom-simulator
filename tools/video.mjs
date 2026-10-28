// Short clips for posts, `pnpm video`: the loom at work, with its sound, in one or more
// languages. 1920 × 1080, H.264 and AAC in MP4. (After the Stepped Reckoner's tools/video.mjs.)
//
//     pnpm video                          (English, into videos/en/)
//     pnpm video --lang en,zh --out ~/Downloads/jacquard-media/videos
//     pnpm video --only name --fps 60
//
// Frame by frame, not in real time: before the page loads, its clock (requestAnimationFrame and
// performance.now, which drive the loom's play loop, the 3D views and their camera flights) is
// replaced by one this tool advances by exactly one frame at a time, then takes the frame
// (tools/headless.mjs). So the clip is smooth however slow the rendering, and no screen or audio
// device is recorded. The page is opened with ?debug, for its store and its sound (js/main.js).
//
// The sound is not recorded either: every sound the app asks for (Sound.play, with the voice
// js/app/sound.js gives it at the loom's speed) is logged with its time, and the soundtrack is
// mixed afterwards from the same files in audio/, as the app plays them: from the sound's onset,
// a little different in pitch and loudness each time, cut short with a fade where the voice says.
// The soundtrack is then made as loud as it can be, its peak at -1 dB. Needs ffmpeg.

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { openBrowser, ROOT, sleep } from "./headless.mjs";

const WIDTH = 1920;
const HEIGHT = 1080;
const RATE = 48000;
/** As in js/app/sound.js: the files, the level they are played at, and where a sound starts. */
const FILES = { lift: "lift.mp3", turn: "turn.mp3", shuttle: "shuttle.mp3", beat: "beat.mp3", fall: "fall.mp3", press: "press.mp3", refuse: "refuse.mp3" };
const LEVEL = 0.5;
const ONSET = 0.03;
/** The soundtrack's peak, -1 dB. */
const PEAK = 10 ** (-1 / 20);

/** Installed before the page's own scripts: a clock that runs in real time until started. */
const CLOCK = `(() => {
  const realNow = performance.now.bind(performance);
  const realFrame = window.requestAnimationFrame.bind(window);
  let manual = false, t = 0, queue = [], id = 0;
  performance.now = () => (manual ? t : realNow());
  window.requestAnimationFrame = (cb) => {
    if (manual) { queue.push(cb); return ++id; }
    return realFrame((ts) => (manual ? queue.push(cb) : cb(ts)));
  };
  window.__clock = {
    start() { t = realNow(); manual = true; return t; },
    advance(ms) { t += ms; const q = queue; queue = []; for (const cb of q) cb(t); return t; },
    get now() { return t; },
  };
})();`;

/** Run in the page when recording starts: log the sounds, steer the 3D camera. */
const RECORDER = `(() => {
  const sound = app.shell.sound;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rec = { sounds: [], drift: [0, 0, 1], each: null, state: {}, quiet: false };
  const t0 = __clock.start();
  sound.play = (name, v = { rate: 1, gain: 1, limit: null }) => {
    if (rec.quiet) return;
    // a little different each time, as Sound.play does
    rec.sounds.push({ name, t: (__clock.now - t0) / 1000, rate: v.rate * (0.96 + rnd() * 0.08), gain: v.gain * (0.88 + rnd() * 0.24), limit: v.limit });
  };
  const view = () => document.querySelector(".stage canvas")?.unitsView?.viewer;
  // Orbit the first 3D view's camera by degrees across (+: to the loom's right) and up, and scale its distance.
  rec.orbit = (across, up, zoom) => {
    const v = view(); if (!v) return;
    const c = v.camera, t = v.controls.target, o = c.position.clone().sub(t);
    const r = o.length() * zoom, theta = Math.atan2(o.x, o.z) + (across * Math.PI) / 180;
    const phi = Math.min(Math.max(Math.acos(o.y / o.length()) - (up * Math.PI) / 180, 0.08), Math.PI / 2 + 0.25);
    c.position.copy(t).add(o.set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta)).multiplyScalar(r));
    c.lookAt(t);
    v.invalidate(false);
  };
  // One frame: the scene's hook, the camera's drift (not while it flies), the clock.
  rec.frame = (dt) => {
    rec.each?.(rec.state);
    const [a, u, z] = rec.drift, v = view();
    if (v && !v.flight && (a || u || z !== 1)) rec.orbit(a * dt, u * dt, z ** dt);
    __clock.advance(dt * 1000);
  };
  window.__rec = rec;
})();`;

/** Page helpers for the setups (run before recording, in real time) and the scenes' own code. */
const HELPERS = `
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { store } = window.app;
const act = await import("./js/app/looms.js");
const play = await import("./js/app/play.js");
const { STOPS } = await import("./js/sim/loom.js");
const units = () => document.querySelector(".stage canvas")?.unitsView;
const loaded = async () => { for (let i = 0; i < 150 && (document.querySelector(".view-note") || [...document.querySelectorAll(".stage canvas")].some((c) => c.unitsView && !c.unitsView.loaded)); i++) await sleep(100); await sleep(800); };
const wide = async () => { for (const e of document.querySelectorAll(".edge")) e.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); await sleep(900); };
const orbit = async (across = 0, up = 0, zoom = 1) => {
  const u = units(); if (!u) return;
  const v = u.viewer, c = v.camera, t = v.controls.target.clone(), o = c.position.clone().sub(t);
  const r = o.length() * zoom, theta = Math.atan2(o.x, o.z) + (across * Math.PI) / 180;
  const phi = Math.min(Math.max(Math.acos(o.y / o.length()) - (up * Math.PI) / 180, 0.08), Math.PI / 2 + 0.25);
  v.flyTo(t.clone().add(o.set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta)).multiplyScalar(r)), t, 0.001);
  await sleep(600);
};
window.__page = { store, act, play, STOPS, units };
`;

/**
 * What a scene's script can do, frame-exact. Page code runs between frames, as a learner's
 * presses would, with `store`, `act`, `play`, `STOPS` and `units` (window.__page) in scope.
 * @typedef {object} Take
 * @property {(js: string) => Promise<any>} run run page code now
 * @property {(seconds: number) => Promise<void>} hold record this long
 * @property {(seconds?: number) => Promise<void>} settle record until no loom plays and no camera flies
 * @property {(across: number, up?: number, zoom?: number) => Promise<void>} drift move the 3D camera on its own, by degrees and a zoom factor a second
 * @property {(js: string | null) => Promise<void>} each run page code before every frame (with `rec`, and `s`, an object kept between frames)
 * @property {(quiet: boolean) => Promise<void>} quiet leave the sounds out (a loom far faster than a weaver's)
 */

/** @typedef {{ name: string; hash: string; setup: string; script: (t: Take) => Promise<void> }} Scene */

/** Code run in the page, with the helpers of __page in scope. @param {string} js */
const page = (js) => `(async () => { const { store, act, play, STOPS, units } = window.__page; ${js} })()`;

/** @type {Scene[]} */
const SCENES = [
  {
    // The arrow woven pick by pick, the head in section and the whole loom in 3D side by side,
    // a hook followed through both; slow, then at a weaver's pace.
    name: "01-weaving",
    hash: "view=section,3d",
    setup: "act.lace(store, true); act.followHook(store, 3); act.setSpeed(store, 12); await loaded(); await orbit(-12, 4, 0.85);",
    async script(t) {
      await t.drift(1.2);
      await t.hold(1.2);
      await t.run(page("act.play(store);"));
      await t.hold(11);
      await t.run(page("act.setSpeed(store, 40);"));
      await t.hold(9);
      await t.run(page("act.pause(store);"));
      await t.hold(1.2);
    },
  },
  {
    // One pick in section, slowly: the card pressed, the hooks taken, the shed open, the shuttle
    // across, the batten, the shed closed, the next card; the followed hook drawn blue.
    name: "02-one-pick",
    hash: "view=section",
    setup: "await wide(); act.moveTo(store, 2, 0); act.followHook(store, 3); act.setSpeed(store, 6);",
    async script(t) {
      await t.hold(1.2);
      await t.run(page("act.play(store);"));
      await t.hold(10.2);
      await t.run(page("act.pause(store);"));
      await t.hold(1.5);
    },
  },
  {
    // The whole loom in 3D, twill weaving, the camera going round it.
    name: "03-loom-in-3d",
    hash: "view=3d",
    setup: `await wide(); act.loadPreset(store, "twill"); act.moveTo(store, 10, 0); act.setSpeed(store, 24); await loaded(); await orbit(-40, 6, 0.62);`,
    async script(t) {
      await t.drift(5, 0, 0.995);
      await t.hold(1);
      await t.run(page("act.play(store);"));
      await t.hold(16);
      await t.run(page("act.pause(store);"));
      await t.hold(1.2);
    },
  },
  {
    // The units the head is made of, each opened from the whole machine while the loom weaves.
    name: "04-units",
    hash: "view=3d",
    setup: "await wide(); act.lace(store, true); act.moveTo(store, 3, 0); act.setSpeed(store, 20); await loaded(); await orbit(-20, 4, 0.75);",
    async script(t) {
      await t.drift(2);
      await t.run(page("act.play(store);"));
      await t.hold(3);
      // (the griffe and the harness are tall and thin alone: they read better in the whole loom)
      for (const unit of ["selector", "cylinder", "shed"]) {
        await t.run(page(`units().show(${JSON.stringify(unit)});`));
        await t.settle(3);
        await t.hold(3.6);
      }
      await t.run(page("units().showMachine();"));
      await t.hold(2.5);
      await t.run(page("act.pause(store);"));
      await t.hold(1);
    },
  },
  {
    // A name typed, read as damask, its cards woven fast, and the cloth read back.
    name: "05-name-game",
    hash: "w=play&game=name&text=",
    setup: "await sleep(500);",
    async script(t) {
      await t.hold(1);
      const text = "JACQUARD";
      for (let i = 1; i <= text.length; i++) {
        await t.run(page(`play.setName(store, { text: ${JSON.stringify(text.slice(0, i))} }); document.querySelector(".game-body textarea").value = ${JSON.stringify(text.slice(0, i))};`));
        await t.hold(0.22);
      }
      await t.hold(1);
      // a pick at a weaver's pace, heard; then far faster, silent; stopped on the last card (the
      // chain's end would be said as a refusal) and woven to its end
      await t.run(page("act.setSpeed(store, 60, 'game'); act.play(store, 'game');"));
      await t.hold(2.2);
      await t.quiet(true);
      await t.run(page("act.setSpeed(store, 900, 'game');"));
      await t.each("const l = app.store.state.looms.game; if (l.playing && l.loom.pick >= l.loom.deck.cards.length - 1) { __page.act.pause(app.store, 'game'); __page.play.weaveAll(app.store); }");
      await t.settle(20);
      await t.each(null);
      await t.quiet(false);
      await t.hold(2.5);
    },
  },
  {
    // A heart drawn on point paper square by square, its cloth woven as it is drawn, with long
    // loose threads; then read as damask, and it holds together.
    name: "06-design",
    hash: "w=create",
    setup: `const { presetPicture } = await import("./js/sim/picture.js"); window.__heart = presetPicture("heart"); act.setPicture(store, { rows: window.__heart.map((r) => r.map(() => false)), mode: "direct" }, "create"); await sleep(500);`,
    async script(t) {
      await t.hold(1);
      // a row a step, from the top, as a designer fills the paper
      for (let y = 1; y <= 16; y++) {
        await t.run(page(`act.setPicture(store, { rows: window.__heart.map((r, j) => (j < ${y} ? r : r.map(() => false))) }, "create");`));
        await t.hold(0.25);
      }
      await t.hold(2.5);
      await t.run(page(`document.querySelector('.panel.left [data-mode="damask"]').click();`));
      await t.hold(4);
    },
  },
  {
    // A thread followed: a hook, through the section and the front, while the loom weaves.
    name: "07-follow-a-thread",
    hash: "view=section,front",
    setup: `await wide(); act.loadPreset(store, "twill"); act.moveTo(store, 4, 0); act.setSpeed(store, 20); act.followHook(store, 2);`,
    async script(t) {
      await t.hold(1);
      await t.run(page("act.play(store);"));
      await t.hold(6);
      await t.run(page("act.followHook(store, 5);"));
      await t.hold(6);
      await t.run(page("act.pause(store);"));
      await t.hold(1);
    },
  },
];

const { values: opts } = parseArgs({
  options: {
    lang: { type: "string", default: "en" },
    out: { type: "string", default: join(ROOT, "videos") },
    only: { type: "string", default: "" },
    fps: { type: "string", default: "30" },
  },
});
const FPS = Number(opts.fps);
const scenes = SCENES.filter((s) => s.name.includes(opts.only));
const work = mkdtempSync(join(tmpdir(), "jls-video-"));

/**
 * Run ffmpeg; resolve with its output when it exits cleanly.
 * @param {string[]} args
 * @returns {Promise<Buffer>}
 */
function ffmpeg(args) {
  return new Promise((ok, fail) => {
    const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], { stdio: ["ignore", "pipe", "pipe"] });
    /** @type {Buffer[]} */
    const out = [];
    let err = "";
    p.stdout.on("data", (d) => out.push(d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", fail);
    p.on("exit", (code) => (code === 0 ? ok(Buffer.concat(out)) : fail(new Error(`ffmpeg ${args.join(" ")}: ${err}`))));
  });
}

/** @type {Map<string, { data: Float32Array; from: number }>} */
const decoded = new Map();
/**
 * A sound file as stereo samples at RATE, and where it starts (its onset, as js/app/sound.js finds it).
 * @param {keyof typeof FILES} name
 */
async function samples(name) {
  let s = decoded.get(name);
  if (!s) {
    const raw = await ffmpeg(["-i", join(ROOT, "audio", FILES[name]), "-f", "f32le", "-ac", "2", "-ar", String(RATE), "pipe:1"]);
    const data = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
    const peak = data.reduce((p, x) => Math.max(p, Math.abs(x)), 0);
    let first = 0;
    while (first < data.length && Math.abs(data[first]) < ONSET * peak) first++;
    s = { data, from: Math.max(0, Math.floor(first / 2) - Math.round(0.005 * RATE)) };
    decoded.set(name, s);
  }
  return s;
}

/**
 * Mix the logged sounds into a stereo track of the given length, as raw 32-bit floats.
 * @param {{ name: keyof typeof FILES; t: number; rate: number; gain: number; limit: number | null }[]} sounds
 * @param {number} seconds
 */
async function mix(sounds, seconds) {
  const n = Math.ceil(seconds * RATE);
  const out = new Float32Array(n * 2);
  for (const e of sounds) {
    const { data, from } = await samples(e.name);
    const frames = data.length / 2;
    const start = Math.round(e.t * RATE);
    // cut short with a 50 ms fade where it would run past its limit, as Sound.play does
    const limit = e.limit === null ? Infinity : Math.round(e.limit * RATE);
    const fade = Math.round(0.05 * RATE);
    for (let i = 0; start + i < n && i < limit; i++) {
      const x = from + i * e.rate;
      const k = Math.floor(x);
      if (k + 1 >= frames) break;
      const f = x - k;
      const g = e.gain * LEVEL * (limit - i < fade ? (limit - i) / fade : 1);
      for (let c = 0; c < 2; c++) out[(start + i) * 2 + c] += g * (data[k * 2 + c] * (1 - f) + data[(k + 1) * 2 + c] * f);
    }
  }
  // as loud as it can be without clipping: its peak at -1 dB
  const peak = out.reduce((p, x) => Math.max(p, Math.abs(x)), 0);
  const gain = peak > 0 ? PEAK / peak : 1;
  for (let i = 0; i < out.length; i++) out[i] *= gain;
  return Buffer.from(out.buffer);
}

const browser = await openBrowser({ width: WIDTH, height: HEIGHT });
const { send, evaluate, errors } = browser;
await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });

let failed = 0;
let n = 0;
for (const lang of opts.lang.split(",")) {
  const dir = resolve(opts.out, lang);
  mkdirSync(dir, { recursive: true });
  for (const scene of scenes) {
    // each scene from nothing kept (a panel closed, a picture drawn), loaded afresh
    await evaluate("try { localStorage.clear() } catch {}").catch(() => {});
    await browser.open(`index.html?debug&lang=${lang}&take=${n++}#v=2&${scene.hash}`, "window.app && document.querySelector('.app .player')");
    await evaluate(`(async () => { ${HELPERS} ${scene.setup} })()`);
    await sleep(500);
    await evaluate(RECORDER);

    const video = join(work, "video.mp4");
    const encoder = spawn(
      "ffmpeg",
      ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", video],
      { stdio: ["pipe", "ignore", "inherit"] },
    );
    const encoded = new Promise((r) => encoder.on("exit", r));
    let frames = 0;
    const frame = async () => {
      await evaluate(`__rec.frame(${1 / FPS})`);
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 95 });
      if (!encoder.stdin.write(Buffer.from(shot.result.data, "base64"))) await new Promise((r) => encoder.stdin.once("drain", r));
      frames++;
    };
    /** @param {number} seconds */
    const hold = async (seconds) => {
      for (let i = Math.round(seconds * FPS); i > 0; i--) await frame();
    };
    const busy = "Object.values(app.store.state.looms).some((l) => l.playing) || !!document.querySelector('.stage canvas')?.unitsView?.viewer.flight";
    /** @type {Take} */
    const take = {
      run: (js) => evaluate(js),
      hold,
      async settle(seconds = 30) {
        await frame(); // what was started moves on the next frame
        for (let i = seconds * FPS; i > 0 && (await evaluate(busy)); i--) await frame();
      },
      drift: async (across, up = 0, zoom = 1) => void (await evaluate(`__rec.drift = [${across}, ${up}, ${zoom}]`)),
      each: async (js) => void (await evaluate(js ? `__rec.state = {}; __rec.each = (s) => { const rec = __rec; ${js} }` : "__rec.each = null")),
      quiet: async (q) => void (await evaluate(`__rec.quiet = ${q}`)),
    };
    try {
      await scene.script(take);
    } catch (e) {
      errors.push(String(e));
    }
    encoder.stdin.end();
    await encoded;

    const seconds = frames / FPS;
    const sounds = await evaluate("__rec.sounds");
    const audio = join(work, "audio.f32");
    writeFileSync(audio, await mix(sounds, seconds));
    const out = join(dir, `${scene.name}.mp4`);
    await ffmpeg(["-y", "-i", video, "-f", "f32le", "-ar", String(RATE), "-ac", "2", "-i", audio,
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]);
    if (errors.length) failed++;
    console.log(`${lang}/${scene.name}.mp4  ${seconds.toFixed(1)} s, ${sounds.length} sounds${errors.length ? `  ERROR ${errors.join("; ")}` : ""}`);
  }
}
await browser.close();
rmSync(work, { recursive: true, force: true });
process.exitCode = failed ? 1 : 0;
