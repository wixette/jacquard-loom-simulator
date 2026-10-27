// The machine's sounds (design/public-app.md §3, Sound; after the sibling Stepped Reckoner's).
// Only the machine makes sound; the interface is silent. One observer watches the loom the views
// show and sounds each motion of a pick it passes going forward, played or stepped alike, at the
// motion itself (SOUND_AT), one in each step of the transport:
// - hooks taken (the griffe rising): the knives' clunk and the harness lifting;
// - shed open (the cylinder swung out and turned): the card chain's knock;
// - shuttle across: the swish of the shuttle, as it is thrown;
// - beaten up: the batten's clack, the loudest, as it strikes;
// - shed closed (the griffe falling): a softer thud;
// - next card pressed: the cylinder's clack against the needles;
// and a dull stop when the loom refuses. Going back, or jumping (a reset, a link, a tutorial step
// setting the loom up), is silent. Every sound plays at every speed: above EASY picks a minute
// each is shaped to fit (voice): cut short with a fade, a little quieter but for the batten.
// Sound starts after the learner's first press or key, as browsers require. Web Audio: decoded
// once, played with no delay (from where each sound starts in its file), overlapping, each a
// little different in pitch and loudness.

import { BATTEN_STRIKE } from "../sim/cycle.js";
import { P } from "../sim/params.js";
/** @import { AppStore, LoomState } from "./looms.js" */

/** The version this module was loaded with (?v=), for the files it loads. */
const V = new URL(import.meta.url).search;

/** The files in audio/ (their sources: audio/SOURCES.md). */
export const FILES = /** @type {const} */ ({
  lift: "lift.mp3",
  turn: "turn.mp3",
  shuttle: "shuttle.mp3",
  beat: "beat.mp3",
  fall: "fall.mp3",
  press: "press.mp3",
  refuse: "refuse.mp3",
});
/** Quieter than this (a share of the file's loudest sample) counts as silence before it starts. */
const ONSET = 0.03;
/** @typedef {keyof typeof FILES} SoundName */

/**
 * When in a pick (0 to 1) each sound is heard: on the motion that makes it, not on the moment
 * the transport names after it (the shuttle's swish as it is thrown, not when it has arrived).
 * Each falls within one step of the transport, so a step sounds once (js/sim/cycle.js).
 */
export const SOUND_AT = /** @type {const} */ ([
  ["lift", P.stops[0]], // the knives take the hooks: hooks taken
  ["turn", P.cylinderTurn[1]], // the cylinder's quarter turn ends on its catch: before the shed is open
  ["shuttle", P.shuttle[0]], // the shuttle is thrown: as it starts across
  ["beat", BATTEN_STRIKE], // the batten strikes the weft: before it swings back to rest
  ["fall", P.stops[4]], // the griffe lands: shed closed
  ["press", P.cylinderBack[1]], // the cylinder presses the next card on the needles: before the next pick
]);
/** Up to this speed (picks a minute) every sound plays whole; faster, each is shaped to fit (voice). */
const EASY = 30;
/** The fastest the loom plays (the speed slider's end). */
const FASTEST = 60;

/**
 * How a sound is played at a speed: every sound at every speed, at its own pitch (sped up by a
 * tenth at most), cut short with a fade when the loom is fast, so that it is over within half a
 * pick and never smears into its own next pick, and, when fast, the batten loudest and the rest
 * a little quieter, so that the busier mix is no louder. Stepping, every sound plays whole.
 * @param {SoundName} name
 * @param {number} speed picks a minute
 * @param {boolean} playing
 * @returns {{ rate: number; gain: number; limit: number | null }} limit: seconds, or null for the whole sound
 */
export function voice(name, speed, playing) {
  if (!playing || speed <= EASY) return { rate: 1, gain: 1, limit: null };
  const busy = Math.min(1, (speed - EASY) / (FASTEST - EASY));
  return { rate: 1 + 0.1 * busy, gain: name === "beat" ? 1 : 1 - 0.35 * busy, limit: Math.max(0.12, (0.5 * 60) / speed) };
}
/** The files are levelled to full scale: play them at this. */
const LEVEL = 0.5;
/** Where the learner's choice is remembered. */
const KEY = "jacquard.sound";

export class Sound {
  /** @private @type {AudioContext | null} */
  ctx = null;
  /** @private @type {Partial<Record<SoundName, AudioBuffer>>} */
  buffers = {};
  /** Where each sound starts in its file (s): past the silence before it, so it is heard on its moment. @private @type {Partial<Record<SoundName, number>>} */
  starts = {};
  /** @private @type {GainNode | null} */
  out = null;
  /** Muted by the learner (remembered on this device). */
  muted = false;

  /** @param {AppStore} store */
  constructor(store) {
    try {
      this.muted = localStorage.getItem(KEY) === "off";
    } catch {
      // not remembered: on
    }
    // A touch's pointerdown does not count as a gesture (its pointerup does), and a context can
    // be suspended again (iOS, for a call), so every gesture resumes it while it is not running.
    const unlock = () => {
      this.start();
      if (this.ctx && this.ctx.state !== "running") this.ctx.resume().catch(() => {});
    };
    for (const type of ["pointerdown", "pointerup", "keydown"]) window.addEventListener(type, unlock, true);
    /** @type {{ ls: LoomState; at: number } | null} */
    let was = null;
    store.watch(
      (s) => [s.current, s.looms[s.current]],
      () => {
        const ls = store.state.looms[store.state.current];
        const at = ls.loom.pick + ls.loom.phi;
        const before = was;
        was = { ls, at };
        if (!before) return;
        if (ls.status !== before.ls.status && ls.status.warn) this.play("refuse");
        // the same loom, moved on by at most one pick: sound the stops passed
        if (ls.loom !== before.ls.loom || at <= before.at || at - before.at > 1 + 1e-9) return;

        for (let p = Math.floor(before.at); p <= Math.floor(at); p++) {
          for (const [name, when] of SOUND_AT) {
            const x = p + when;
            if (x > before.at + 1e-9 && x <= at + 1e-9) this.play(name, voice(name, ls.speed, ls.playing));
          }
        }
      },
    );
  }

  /** @param {boolean} muted */
  mute(muted) {
    this.muted = muted;
    try {
      localStorage.setItem(KEY, muted ? "off" : "on");
    } catch {
      // not remembered
    }
  }

  /** @private */
  async start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext;
    if (!Ctx) return; // no Web Audio: the loom is silent
    this.ctx = new Ctx();
    this.out = this.ctx.createGain();
    this.out.gain.value = LEVEL;
    this.out.connect(this.ctx.destination);
    await Promise.all(
      Object.entries(FILES).map(async ([name, file]) => {
        try {
          const res = await fetch(new URL(`../../audio/${file}${V}`, import.meta.url));
          const data = await res.arrayBuffer();
          const buffer = await /** @type {AudioContext} */ (this.ctx).decodeAudioData(data);
          this.buffers[/** @type {SoundName} */ (name)] = buffer;
          this.starts[/** @type {SoundName} */ (name)] = onset(buffer);
        } catch {
          // a sound that cannot load stays silent; the loom works without it
        }
      }),
    );
  }

  /**
   * Play a sound now, as voice() shapes it (whole, at its own pitch, if not given).
   * @param {SoundName} name
   * @param {{ rate: number; gain: number; limit: number | null }} [v]
   */
  play(name, v = { rate: 1, gain: 1, limit: null }) {
    const { ctx, out } = this;
    const buffer = this.buffers[name];
    if (this.muted || !ctx || !out || !buffer || ctx.state !== "running") return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    // a little different each time: ±4% in pitch, ±12% in loudness
    const rate = v.rate * (0.96 + Math.random() * 0.08);
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    const level = v.gain * (0.88 + Math.random() * 0.24);
    gain.gain.value = level;
    src.connect(gain).connect(out);
    const from = this.starts[name] ?? 0;
    src.start(0, from);
    // cut short with a 50 ms fade where it would run past its limit
    const length = (buffer.duration - from) / rate;
    if (v.limit !== null && length > v.limit) {
      const end = ctx.currentTime + v.limit;
      gain.gain.setValueAtTime(level, end - 0.05);
      gain.gain.linearRampToValueAtTime(0.0001, end);
      src.stop(end + 0.01);
    }
  }
}

/**
 * Where a sound starts: its first sample above ONSET of its loudest, less 5 ms, so a file's
 * leading silence (and an MP3's encoder delay) does not make it late.
 * @param {AudioBuffer} buffer
 * @returns {number} seconds
 */
export function onset(buffer) {
  const channels = [...Array(buffer.numberOfChannels).keys()].map((c) => buffer.getChannelData(c));
  let peak = 0;
  for (const d of channels) for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak === 0) return 0;
  for (let i = 0; i < buffer.length; i++) if (channels.some((d) => Math.abs(d[i]) >= peak * ONSET)) return Math.max(0, i / buffer.sampleRate - 0.005);
  return 0;
}
