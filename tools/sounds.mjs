// Placeholder sounds for the machine (design/public-app.md §3, Sound), until the recorded ones
// come: each a short synthesised sound of the right kind, written to audio/ as 16-bit mono WAV.
// Deterministic (a seeded noise), so running it again changes nothing. A recorded file replaces
// a placeholder by taking its name (js/app/sound.js, FILES).
//
//   node tools/sounds.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./headless.mjs";

const RATE = 22050;

/** A seeded noise in -1..1 (mulberry32). @param {number} seed */
function noise(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/**
 * A sound of `seconds`, each sample from f(t, i).
 * @param {number} seconds
 * @param {(t: number) => number} f
 */
function render(seconds, f) {
  const n = Math.round(seconds * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = f(i / RATE);
  // levelled to a peak of 0.9
  const peak = out.reduce((m, x) => Math.max(m, Math.abs(x)), 1e-9);
  return out.map((x) => (x / peak) * 0.9);
}

/** A one-pole low-pass over a source, cut at hz. @param {() => number} src @param {number} hz */
function lowpass(src, hz) {
  const k = 1 - Math.exp((-2 * Math.PI * hz) / RATE);
  let y = 0;
  return () => (y += k * (src() - y));
}

/** A knock: a damped body at hz with a burst of filtered noise. */
function knock(seed, hz, decay, bright, seconds = 0.25) {
  const n = lowpass(noise(seed), bright);
  return render(seconds, (t) => Math.exp(-t * decay) * (Math.sin(2 * Math.PI * hz * t) * 0.7 + n() * 1.6 * Math.exp(-t * decay * 2)));
}

const SOUNDS = {
  // the cylinder pressed against the needles: a wooden clack, then the needles' short rattle
  press: (() => {
    const a = knock(1, 210, 38, 2400, 0.3);
    const r = noise(2);
    return a.map((x, i) => {
      const t = i / RATE;
      const rattle = t > 0.04 && t < 0.16 ? r() * 0.25 * (Math.sin(t * 2 * Math.PI * 90) > 0.6 ? 1 : 0) : 0;
      return x + rattle;
    });
  })(),
  // the griffe rising, hooks taken: the knives' iron clunk, the harness lifting
  lift: (() => {
    const n = lowpass(noise(3), 900);
    return render(0.45, (t) => Math.exp(-t * 14) * (Math.sin(2 * Math.PI * 120 * t) + 0.35 * Math.sin(2 * Math.PI * 1310 * t) * Math.exp(-t * 30)) + n() * 0.5 * Math.exp(-t * 6));
  })(),
  // the cylinder swinging out and turning to the next card: the chain's wooden knock
  turn: knock(4, 320, 45, 3000, 0.22),
  // the shuttle thrown: a swish
  shuttle: (() => {
    const n = lowpass(noise(5), 3500);
    return render(0.32, (t) => n() * Math.sin(Math.PI * Math.min(1, t / 0.32)) ** 2);
  })(),
  // the batten beating up: the loudest clack
  beat: knock(6, 150, 30, 4000, 0.35),
  // the griffe falling, the shed closed: a softer thud
  fall: (() => {
    const n = lowpass(noise(7), 500);
    return render(0.3, (t) => Math.exp(-t * 22) * (Math.sin(2 * Math.PI * 95 * t) + n() * 0.8)).map((x) => x * 0.6);
  })(),
  // refused (the chain has run out): a dull stop
  refuse: render(0.28, (t) => Math.exp(-t * 12) * (Math.sin(2 * Math.PI * 82 * t) + 0.4 * Math.sin(2 * Math.PI * 123 * t))),
};

/** @param {Float32Array} samples */
function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + samples.length * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24);
  b.writeUInt32LE(RATE * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((x, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x)) * 32767), 44 + i * 2));
  return b;
}

const dir = join(ROOT, "audio");
mkdirSync(dir, { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  writeFileSync(join(dir, `${name}.wav`), wav(samples));
  console.log(`audio/${name}.wav: ${(samples.length / RATE).toFixed(2)} s`);
}
