// The prototype loom page: everything a page with the whole loom in 2D does, shared by the
// prototype learner page (dev/03-learner) and the M1 developer page (dev/02-loom). Since M5 it
// runs on the app's store (store.js, looms.js) and components (components/): the page supplies
// the hosts, by id; the components draw in them; the page's own controls (its prototype
// markup) act through the store's actions and follow its state. createLoomPage() returns what
// other parts of a page (lessons, the picture helper, the checks) need to drive the loom.

import { say as words, t, tn } from "../l10n/l10n.js";
import { HOOK_COUNTS, PRESETS } from "../sim/deck.js";
import { decodeLink, encodeLink, LONG_LINK } from "../sim/link.js";
import { Loom, POSITIONS, STOP_KEYS, STOPS } from "../sim/loom.js";
import { endCount, tieLabel } from "../sim/tieup.js";
import { traceOf } from "../sim/trace.js";
import { place } from "./components/component.js";
import { benchPanel, chainPanel, clothPanel } from "./components/panels.js";
import { frontView, sectionView, sideView } from "./components/views.js";
import * as act from "./looms.js";
import { appState, loomState, TIES, tieKey } from "./looms.js";
import { Store } from "./store.js";
/** @import { Msg } from "../l10n/l10n.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Tie } from "../sim/tieup.js" */
/** @import { Follow } from "../sim/trace.js" */
/** @import { AppStore, SectionView } from "./looms.js" */

/**
 * @typedef {object} LoomPage
 * @property {AppStore} store
 * @property {Loom} loom
 * @property {() => void} draw draws the loom again (after a change made to it in place)
 * @property {(text: string | Msg, warn?: boolean) => void} say
 * @property {() => void} pause
 * @property {(o: { deck: Deck, tie?: Tie, follow?: Follow | null, message?: string | Msg, view?: SectionView }) => void} open
 * @property {Follow | null} follow the thread followed, if any
 */

/**
 * Wires the loom page's elements (found by id) and starts it.
 * @param {{ deck?: Deck, tie?: Tie, onDraw?: (snap: Snapshot) => void }} [options]
 * @returns {LoomPage}
 */
export function createLoomPage(options = {}) {
  /**
   * @template {HTMLElement} [T=HTMLElement]
   * @param {string} id
   */
  const $ = (id) => /** @type {T} */ (document.getElementById(id));
  /** @param {string | Msg} m @returns {Msg} */
  const asMsg = (m) => (typeof m === "string" ? { text: m } : m);

  const base = appState();
  /** @type {AppStore} */
  const store = new Store({ ...base, looms: { ...base.looms, mine: loomState(options.deck ?? base.looms.mine.loom.deck, options.tie) } });
  const mine = () => store.state.looms.mine;

  // ---- the views, as components in the page's hosts -----------------------------------------
  for (const [make, id] of /** @type {const} */ ([
    [sectionView, "section"],
    [sideView, "side"],
    [frontView, "front"],
    [clothPanel, "cloth"],
    [chainPanel, "chain"],
    [benchPanel, "bench"],
  ])) {
    place(make(store), $(id), store);
  }

  // ---- the page's own controls ----------------------------------------------------------------
  const status = $("status");
  const hooksSelect = /** @type {HTMLSelectElement} */ ($("hooks"));
  const preset = /** @type {HTMLSelectElement} */ ($("preset"));
  const cross = /** @type {HTMLSelectElement} */ ($("cross"));
  const tieSelect = /** @type {HTMLSelectElement} */ ($("tie"));
  const warp = /** @type {HTMLInputElement} */ ($("warp"));
  const weft = /** @type {HTMLInputElement} */ ($("weft"));
  const bits = /** @type {HTMLInputElement} */ ($("bits"));
  const loopBox = /** @type {HTMLInputElement} */ ($("loop"));
  const speed = /** @type {HTMLInputElement} */ ($("speed"));

  for (const n of HOOK_COUNTS) hooksSelect.add(new Option(tn("hooks.option", n / 8, { hooks: n }), String(n)));
  for (const [key, p] of Object.entries(PRESETS)) preset.add(new Option(t(p.name), key, key === "arrow", key === "arrow"));
  for (const [key, tie] of Object.entries(TIES)) tieSelect.add(new Option(words(tieLabel(tie)), key));
  $("stops").innerHTML = STOP_KEYS.map((k, i) => `<li data-stop="${i}">${t(k)}</li>`).join("");

  hooksSelect.addEventListener("change", () => act.setHooks(store, Number(hooksSelect.value)));
  $("load").addEventListener("click", () => act.loadPreset(store, preset.value));
  tieSelect.addEventListener("change", () => act.setTie(store, TIES[tieSelect.value]));
  cross.addEventListener("change", () => act.setCrossRow(store, Number(cross.value)));
  /** @param {string} id @param {() => void} fn */
  const on = (id, fn) => $(id).addEventListener("click", fn);
  on("add", () => act.add(store));
  on("dup", () => act.duplicate(store));
  on("del", () => act.remove(store));
  on("up", () => act.move(store, -1));
  on("down", () => act.move(store, 1));
  on("inv", () => act.invert(store));
  loopBox.addEventListener("change", () => act.lace(store, loopBox.checked));
  for (const b of document.querySelectorAll("[data-view]")) {
    b.addEventListener("click", () => act.setSectionView(store, /** @type {SectionView} */ (/** @type {HTMLElement} */ (b).dataset.view)));
  }
  for (const b of document.querySelectorAll("[data-face]")) {
    b.addEventListener("click", () => act.setFace(store, /** @type {"front" | "back"} */ (/** @type {HTMLElement} */ (b).dataset.face)));
  }
  warp.addEventListener("input", () => act.setColours(store, { warp: warp.value }));
  weft.addEventListener("input", () => act.setColours(store, { weft: weft.value }));
  bits.addEventListener("input", () => act.setBits(store, bits.checked));
  on("unfollow", () => act.follow(store, null));
  on("fwd", () => act.step(store));
  on("back", () => act.stepBack(store));
  on("reset", () => act.reset(store));
  on("play", () => act.play(store));
  speed.addEventListener("input", () => act.setSpeed(store, Number(speed.value)));

  /** The page's controls as the state has them. */
  function sync() {
    const ls = mine();
    const { loom } = ls;
    const snap = loom.snapshot();
    hooksSelect.value = String(loom.deck.hooks);
    tieSelect.value = tieKey(loom.tie);
    loopBox.checked = loom.deck.loop;
    const n = loom.deck.hooks / 8;
    if (cross.options.length !== n) {
      cross.innerHTML = "";
      for (let c = 0; c < n; c++) cross.add(new Option(t("section.crossRow", { row: c + 1, from: c * 8 + 1, to: c * 8 + 8 }), String(c)));
    }
    cross.value = String(ls.crossRow);
    cross.disabled = n === 1;
    for (const b of document.querySelectorAll("[data-view]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.view === store.state.sectionView);
    for (const b of document.querySelectorAll("[data-face]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.face === ls.face);
    warp.value = ls.warp;
    weft.value = ls.weft;
    bits.checked = ls.bits;
    speed.value = String(ls.speed);
    $("speed-out").textContent = String(ls.speed);
    $("play").textContent = ls.playing ? "❚❚ Pause" : "▶ Play";
    $("unfollow").hidden = ls.follow === null;
    $("trace").textContent = ls.follow ? words(traceOf(snap, ls.follow).text) : t("trace.hint");
    status.textContent = words(ls.status.msg);
    status.classList.toggle("warn", ls.status.warn);
    const at = STOPS.findIndex((s) => Math.abs(s - snap.phi) < 1e-9);
    const atStop = snap.phi === 0 ? STOPS.length - 1 : at;
    for (const li of document.querySelectorAll("#stops li")) {
      const i = Number(/** @type {HTMLElement} */ (li).dataset.stop);
      li.classList.toggle("done", snap.phi > 0 && STOPS[i] <= snap.phi + 1e-9);
      li.classList.toggle("here", i === atStop);
    }
    const card = snap.cardIndex === null ? t("where.noCard") : t("where.card", { card: snap.cardIndex + 1 });
    $("where").textContent = tn("where", snap.cloth.length, { pick: snap.pick + 1, card, percent: Math.round(snap.phi * 100), ends: endCount(snap.tie, snap.deck.hooks) });
    options.onDraw?.(snap);
  }
  store.watch((s) => [s.looms.mine, s.sectionView], sync);

  // ---- links (design/links.md) ---------------------------------------------------------------
  on("share", async () => {
    act.pause(store);
    const ls = mine();
    const { loom } = ls;
    let s = POSITIONS.findIndex((p) => Math.abs(p - loom.phi) < 1e-9);
    if (s < 0) {
      // Between stops (after playing): the link names the stop just passed.
      const before = POSITIONS.filter((p) => p <= loom.phi);
      s = POSITIONS.indexOf(before[before.length - 1]);
      act.moveTo(store, loom.pick, POSITIONS[s]);
    }
    const fragment = await encodeLink({
      deck: loom.deck,
      tie: loom.tie,
      pick: loom.pick,
      stop: s,
      follow: ls.follow,
      crossRow: ls.crossRow,
      warp: ls.warp,
      weft: ls.weft,
      face: ls.face,
      bits: ls.bits,
      sectionView: store.state.sectionView,
    });
    history.replaceState(null, "", `#${fragment}`);
    const url = location.href;
    const copied = url.length > LONG_LINK ? { key: "status.linkLong", params: { n: url.length } } : { key: "status.linkCopied" };
    navigator.clipboard?.writeText(url).then(
      () => act.say(store, copied),
      () => act.say(store, { key: "status.linkReady", params: { n: url.length } }),
    );
  });

  async function openLink() {
    if (!location.hash || location.hash === "#") return;
    const r = await decodeLink(location.hash);
    if (!r.ok) {
      act.say(store, r.reason, true);
      return;
    }
    const l = r.link;
    if (l.deck) {
      act.open(store, { deck: l.deck, tie: l.tie, follow: l.follow });
      if ((l.pick > 0 || l.stop > 0) && l.deck.cards.length > 0 && (l.deck.loop || l.pick < l.deck.cards.length)) act.moveTo(store, l.pick, POSITIONS[l.stop]);
      if (l.crossRow !== null) act.setCrossRow(store, l.crossRow);
    }
    act.setColours(store, { warp: l.warp, weft: l.weft });
    act.setFace(store, l.face);
    act.setBits(store, l.bits);
    act.setSectionView(store, l.sectionView);
    if (l.deck) act.say(store, { key: "status.linkOpened", n: l.deck.cards.length, params: { hooks: l.deck.hooks, tie: tieLabel(l.tie) } });
  }
  openLink();
  window.addEventListener("hashchange", openLink);
  sync();

  return {
    store,
    /** The loom as it is now. */
    get loom() {
      return mine().loom;
    },
    /** The thread followed, if any. */
    get follow() {
      return mine().follow;
    },
    draw: () => act.touch(store),
    say: (text, warn = false) => act.say(store, asMsg(text), warn),
    pause: () => act.pause(store),
    open: (o) => act.open(store, { ...o, message: o.message === undefined ? undefined : asMsg(o.message) }),
  };
}
