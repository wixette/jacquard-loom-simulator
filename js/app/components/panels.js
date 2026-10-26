// The panels around the machine as components (component.js): the cloth, the chain of cards,
// the card on the bench, the transport, the status line and the thread followed. Each shows
// one loom (its own, or the current one) and acts on it through the store's actions.

import { say, t, tn } from "../../l10n/l10n.js";
import { STOP_KEYS, STOPS } from "../../sim/loom.js";
import { endCount } from "../../sim/tieup.js";
import { traceOf } from "../../sim/trace.js";
import { el, icon, setTip } from "../../ui/components.js";
import { BenchCard, ChainList } from "../../view2d/chainEditor.js";
import { ClothView } from "../../view2d/clothView.js";
import { follow, followCloth, followHook, pause, play, punch, reset, select, setSpeed, step, stepBack } from "../looms.js";
import { loomOf, shown } from "./component.js";
/** @import { AppStore, LoomId } from "../looms.js" */
/** @import { Component } from "./component.js" */

/** @typedef {{ loom?: LoomId }} PanelOptions the loom it shows, if not the current one */

/**
 * The woven cloth, first pick at the bottom; a click on a cell follows its thread.
 * @param {AppStore} store
 * @param {PanelOptions} [o]
 * @returns {Component}
 */
export function clothPanel(store, o = {}) {
  /** @type {HTMLElement} */
  let host;
  /** @type {HTMLElement} */
  let box;
  /** @type {ClothView} */
  let view;
  return {
    name: "comp.cloth",
    mount(h) {
      host = h;
      box = el("div", { class: "cloth-box" });
      h.appendChild(box);
      view = new ClothView(box, { onCell: (pick, end) => followCloth(store, pick, end, o.loom) });
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.follow, ls.face, ls.warp, ls.weft, ls.bits, s.locale];
    },
    update(s) {
      if (!shown(host)) return;
      const ls = loomOf(s, o.loom);
      const snap = ls.loom.snapshot();
      view.render(snap, { face: ls.face, warp: ls.warp, weft: ls.weft, bits: ls.bits, trace: ls.follow ? traceOf(snap, ls.follow) : null });
    },
    unmount() {
      box.remove();
    },
  };
}

/**
 * The chain: one line of holes a card, the card being woven marked; a click punches a hole,
 * selects a card, or follows a hook.
 * @param {AppStore} store
 * @param {PanelOptions} [o]
 * @returns {Component}
 */
export function chainPanel(store, o = {}) {
  /** @type {HTMLElement} */
  let box;
  /** @type {ChainList} */
  let list;
  return {
    name: "comp.chain",
    mount(h) {
      box = el("div", { class: "chain-box" });
      h.appendChild(box);
      list = new ChainList(box, {
        onToggle: (card, hook) => punch(store, card, hook, o.loom),
        onSelect: (card) => select(store, card, o.loom),
        onFollow: (hook) => followHook(store, hook, o.loom),
      });
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.selected, ls.follow, s.locale];
    },
    update(s) {
      const ls = loomOf(s, o.loom);
      const snap = ls.loom.snapshot();
      list.render(snap, ls.selected, ls.follow ? traceOf(snap, ls.follow) : null, s.locale);
    },
    unmount() {
      box.remove();
    },
  };
}

/**
 * The selected card on the bench, as the real card: a click punches a hole.
 * @param {AppStore} store
 * @param {PanelOptions} [o]
 * @returns {Component}
 */
export function benchPanel(store, o = {}) {
  /** @type {HTMLElement} */
  let host;
  /** @type {HTMLElement} */
  let box;
  /** @type {BenchCard} */
  let bench;
  return {
    name: "comp.bench",
    mount(h) {
      host = h;
      box = el("div", { class: "bench-box" });
      h.appendChild(box);
      bench = new BenchCard(box, {
        onToggle: (card, hook) => punch(store, card, hook, o.loom),
        onSelect: (card) => select(store, card, o.loom),
        onFollow: (hook) => followHook(store, hook, o.loom),
      });
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.selected, ls.follow, s.locale];
    },
    update(s) {
      if (!shown(host)) return;
      const ls = loomOf(s, o.loom);
      bench.render(ls.loom.snapshot(), ls.selected, ls.follow ? ls.follow.hook : null);
    },
    unmount() {
      box.remove();
    },
  };
}

/**
 * Turning the loom: reset, step back, play or pause, step, the play button the largest; the
 * speed; the six moments of a pick as a stepper (a state, not buttons), the one reached marked;
 * and where the loom is.
 * @param {AppStore} store
 * @param {PanelOptions} [o]
 * @returns {Component}
 */
export function transportPanel(store, o = {}) {
  /** @type {HTMLElement} */
  let box;
  /** @type {Record<string, HTMLButtonElement>} */
  const b = {};
  /** @type {HTMLInputElement} */
  let speed;
  /** @type {HTMLElement} */
  let speedOut;
  /** @type {HTMLOListElement} */
  let moments;
  /** @type {HTMLElement} */
  let where;
  /**
   * @param {string} id
   * @param {import("../../ui/components.js").IconName} name
   * @param {string} cls
   * @param {() => void} run
   */
  const button = (id, name, cls, run) => {
    b[id] = el("button", { type: "button", class: `btn icon-only ${cls}`, "data-act": id }, [icon(name)]);
    b[id].addEventListener("click", run);
    return b[id];
  };
  return {
    name: "comp.transport",
    mount(h) {
      speed = el("input", { type: "range", min: "6", max: "60", step: "1" });
      speed.addEventListener("input", () => setSpeed(store, Number(speed.value), o.loom));
      speedOut = el("span", { class: "speed-out" });
      moments = el("ol", { class: "moments" });
      moments.append(...STOP_KEYS.map((_, i) => el("li", { "data-stop": String(i) }, [el("span", { class: "dot" }), el("span", { class: "name" })])));
      where = el("p", { class: "where" });
      box = el("div", { class: "transport", role: "group" }, [
        moments,
        el("div", { class: "transport-row" }, [
          where,
          el("div", { class: "controls" }, [
            button("reset", "restart_alt", "", () => {
              pause(store, o.loom);
              reset(store, o.loom);
            }),
            button("back", "skip_previous", "tonal", () => stepBack(store, o.loom)),
            button("play", "play_arrow", "filled play", () => play(store, o.loom)),
            button("fwd", "skip_next", "tonal", () => step(store, o.loom)),
          ]),
          el("label", { class: "speed" }, [speedOut, speed]),
        ]),
      ]);
      h.appendChild(box);
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.playing, ls.speed, s.locale];
    },
    update(s) {
      const ls = loomOf(s, o.loom);
      const snap = ls.loom.snapshot();
      box.setAttribute("aria-label", t("transport.name"));
      setTip(b.back, t("transport.back.tip"));
      setTip(b.fwd, t("transport.fwd.tip"));
      setTip(b.reset, t("transport.reset.tip"));
      setTip(b.play, t(ls.playing ? "transport.pause" : "transport.play"));
      b.play.replaceChildren(icon(ls.playing ? "pause" : "play_arrow"));
      speed.value = String(ls.speed);
      speedOut.textContent = tn("transport.speed", ls.speed);
      moments.setAttribute("aria-label", t("transport.moments"));
      const at = STOPS.findIndex((x) => Math.abs(x - snap.phi) < 1e-9);
      const here = snap.phi === 0 ? STOPS.length - 1 : at;
      for (const li of /** @type {HTMLCollectionOf<HTMLElement>} */ (moments.children)) {
        const i = Number(li.dataset.stop);
        /** @type {HTMLElement} */ (li.lastElementChild).textContent = t(STOP_KEYS[i]);
        li.classList.toggle("done", snap.phi > 0 && STOPS[i] <= snap.phi + 1e-9);
        li.classList.toggle("here", i === here);
        if (i === here) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      }
      const card = snap.cardIndex === null ? t("where.noCard") : t("where.card", { card: snap.cardIndex + 1 });
      where.textContent = tn("where", snap.cloth.length, { pick: snap.pick + 1, card, percent: Math.round(snap.phi * 100), ends: endCount(snap.tie, snap.deck.hooks) });
    },
    unmount() {
      box.remove();
    },
  };
}

/**
 * The status line: what the loom just did, or why it refused.
 * @param {AppStore} _store
 * @param {PanelOptions} [o]
 * @returns {Component}
 */
export function statusPanel(_store, o = {}) {
  /** @type {HTMLElement} */
  let line;
  return {
    name: "comp.status",
    mount(h) {
      line = el("p", { class: "status-line", role: "status", "aria-live": "polite" });
      h.appendChild(line);
    },
    watch(s) {
      return [loomOf(s, o.loom).status, s.locale];
    },
    update(s) {
      const { status } = loomOf(s, o.loom);
      line.textContent = say(status.msg);
      line.title = line.textContent;
      line.classList.toggle("warn", status.warn);
    },
    unmount() {
      line.remove();
    },
  };
}

/**
 * The thread followed, in words, from the card to the cloth; and the way to stop following.
 * @param {AppStore} store
 * @param {PanelOptions} [o]
 * @returns {Component}
 */
export function tracePanel(store, o = {}) {
  /** @type {HTMLElement} */
  let box;
  /** @type {HTMLElement} */
  let text;
  /** @type {HTMLButtonElement} */
  let stop;
  return {
    name: "comp.trace",
    mount(h) {
      text = el("p", { class: "trace-text" });
      stop = el("button", { type: "button", class: "btn" });
      stop.addEventListener("click", () => follow(store, null, o.loom));
      box = el("div", { class: "trace-box" }, [text, stop]);
      h.appendChild(box);
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.follow, s.locale];
    },
    update(s) {
      const ls = loomOf(s, o.loom);
      text.textContent = ls.follow ? say(traceOf(ls.loom.snapshot(), ls.follow).text) : t("trace.hint");
      stop.textContent = t("follow.stop");
      stop.hidden = !ls.follow;
    },
    unmount() {
      box.remove();
    },
  };
}
