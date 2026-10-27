// The machine's sounds (design/public-app.md §3, Sound; after the sibling Stepped Reckoner's).
// Only the machine makes sound; the interface is silent. One observer watches the loom the views
// show and sounds each moment of a pick it passes going forward, played or stepped alike:
// - hooks taken (the griffe rising): the knives' clunk and the harness lifting;
// - shed open (the cylinder swung out and turned): the card chain's knock;
// - shuttle across: the swish of the shuttle;
// - beaten up: the batten's clack, the loudest;
// - shed closed (the griffe falling): a softer thud;
// - next card pressed: the cylinder's clack against the needles;
// and a dull stop when the loom refuses. Going back, or jumping (a reset, a link, a tutorial step
// setting the loom up), is silent. Playing fast the sounds shorten, and above FAST picks a minute
// only the batten sounds.
// Sound starts after the learner's first press or key, as browsers require. Web Audio: decoded
// once, played with no delay (from where each sound starts in its file), overlapping, each a
// little different in pitch and loudness.

import { STOPS } from "../sim/loom.js";
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

/** The sound of each stop of a pick (STOPS, STOP_KEYS), in order. */
const STOP_SOUNDS = /** @type {const} */ (["lift", "turn", "shuttle", "beat", "fall", "press"]);
/** Faster than this (picks a minute), only the batten sounds. */
const FAST = 30;
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
        const fast = ls.speed > FAST && ls.playing;
        const rate = ls.playing ? Math.min(1.5, Math.max(1, ls.speed / 20)) : 1;
        for (let p = Math.floor(before.at); p <= Math.floor(at); p++) {
          STOPS.forEach((s, i) => {
            const x = p + s;
            if (x > before.at + 1e-9 && x <= at + 1e-9 && (!fast || STOP_SOUNDS[i] === "beat")) this.play(STOP_SOUNDS[i], rate);
          });
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
   * Play a sound now, at a speed (above 1: shorter and higher).
   * @param {SoundName} name
   * @param {number} [rate]
   */
  play(name, rate = 1) {
    const { ctx, out } = this;
    const buffer = this.buffers[name];
    if (this.muted || !ctx || !out || !buffer || ctx.state !== "running") return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    // a little different each time: ±4% in pitch, ±12% in loudness
    src.playbackRate.value = rate * (0.96 + Math.random() * 0.08);
    const gain = ctx.createGain();
    gain.gain.value = 0.88 + Math.random() * 0.24;
    src.connect(gain).connect(out);
    src.start(0, this.starts[name] ?? 0);
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
