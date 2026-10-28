// The panels around the machine as components (component.js): the cloth, the chain of cards,
// the card on the bench, the transport, the status line and the thread followed. Each shows
// one loom (its own, or the current one) and acts on it through the store's actions.

import { say, t, tn } from "../../l10n/l10n.js";
import { STOP_KEYS, STOPS } from "../../sim/loom.js";
import { endCount } from "../../sim/tieup.js";
import { findFloats } from "../../sim/design.js";
import { traceOf } from "../../sim/trace.js";
import { STEPS } from "../../teach/tutorial.js";
import { el, icon, setText, setTip } from "../../ui/components.js";
import { BenchCard, ChainList } from "../../view2d/chainEditor.js";
import { ClothView } from "../../view2d/clothView.js";
import { follow, followCloth, followHook, lace, pause, play, punch, reset, select, setSpeed, step, stepBack } from "../looms.js";
import { loomOf, shown } from "./component.js";
/** @import { AppStore, LoomId } from "../looms.js" */
/** @import { Component } from "./component.js" */

/** @typedef {{ loom?: LoomId; large?: boolean }} PanelOptions the loom it shows, if not the current one; large: a view on the stage, its squares larger */

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
  /** What was drawn last: while the loom plays it moves every frame, and the cloth is drawn again only when it changes. */
  let drawn = "";
  return {
    name: "comp.cloth",
    mount(h) {
      host = h;
      // a box that scrolls is reached by the keyboard, to scroll it
      box = el("div", { class: o.large ? "cloth-box large" : "cloth-box", tabindex: "0", role: "group", "data-l10n-name": "cloth.title" });
      h.appendChild(box);
      view = new ClothView(box, { onCell: (pick, end) => followCloth(store, pick, end, o.loom) });
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.follow, ls.face, ls.warp, ls.weft, ls.bits, s.locale, s.workspace, s.learn.step];
    },
    update(s) {
      if (!shown(host)) return;
      const ls = loomOf(s, o.loom);
      const snap = ls.loom.snapshot();
      // between moments only the cloth's rows, and the row in the shed, change what is drawn
      const now = [snap.cloth.length, snap.pendingRow !== null, ls.follow?.hook, ls.follow?.end, ls.follow?.pick, ls.face, ls.warp, ls.weft, ls.bits, s.locale, s.workspace, s.learn.step, host.clientWidth].join();
      if (ls.playing && now === drawn) return;
      drawn = now;
      // a picture's cloth shows its loose threads (Create, and the tutorial's picture steps)
      const id = o.loom ?? s.current;
      const marks = id === "create" || (id === "tutorial" && s.workspace === "learn" && !!STEPS[s.learn.step].picture);
      view.render(snap, { face: ls.face, warp: ls.warp, weft: ls.weft, bits: ls.bits, trace: ls.follow ? traceOf(snap, ls.follow) : null, floats: marks ? findFloats(snap.cloth).floats : undefined, large: o.large });
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
        onLace: (loop) => lace(store, loop, o.loom),
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
 * and where the loom is; and any tools the frame adds after the speed (the sound switch).
 * @param {AppStore} store
 * @param {PanelOptions & { tools?: HTMLElement[] }} [o]
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
            button("reset", "restart_alt", "tonal", () => {
              pause(store, o.loom);
              reset(store, o.loom);
            }),
            button("back", "skip_previous", "tonal", () => stepBack(store, o.loom)),
            button("play", "play_arrow", "filled play", () => play(store, o.loom)),
            button("fwd", "skip_next", "tonal", () => step(store, o.loom)),
          ]),
          el("div", { class: "after" }, [el("label", { class: "speed" }, [speedOut, speed]), ...(o.tools ?? [])]),
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
      // the icon is changed only when it changes: replaced under a press (every frame, playing),
      // it would lose the click that pauses
      if (b.play.dataset.playing !== String(ls.playing)) {
        b.play.dataset.playing = String(ls.playing);
        b.play.replaceChildren(icon(ls.playing ? "pause" : "play_arrow"));
      }
      speed.value = String(ls.speed);
      setText(speedOut, tn("transport.speed", ls.speed));
      moments.setAttribute("aria-label", t("transport.moments"));
      const at = STOPS.findIndex((x) => Math.abs(x - snap.phi) < 1e-9);
      const here = snap.phi === 0 ? STOPS.length - 1 : at;
      for (const li of /** @type {HTMLCollectionOf<HTMLElement>} */ (moments.children)) {
        const i = Number(li.dataset.stop);
        setText(/** @type {HTMLElement} */ (li.lastElementChild), t(STOP_KEYS[i]));
        li.classList.toggle("done", snap.phi > 0 && STOPS[i] <= snap.phi + 1e-9);
        li.classList.toggle("here", i === here);
        if (i === here) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      }
      // an open chain woven to its end: no pick past it to name
      const card = snap.cardIndex === null ? t("where.noCard") : t("where.card", { card: snap.cardIndex + 1 });
      setText(where, snap.cardIndex === null && snap.cloth.length > 0 && snap.phi === 0 ? tn("where.end", snap.cloth.length, { ends: endCount(snap.tie, snap.deck.hooks) }) : tn("where", snap.cloth.length, { pick: snap.pick + 1, card, percent: Math.round(snap.phi * 100), ends: endCount(snap.tie, snap.deck.hooks) }));
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
      const ls = loomOf(s, o.loom);
      return [ls.status, ls.playing, s.locale];
    },
    update(s) {
      const { status, playing } = loomOf(s, o.loom);
      // while the loom plays it says each moment, several a second: a screen reader hears only
      // a refusal then, and the line as it stands once the loom stops
      line.setAttribute("aria-live", playing && !status.warn ? "off" : "polite");
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
      setText(text, ls.follow ? say(traceOf(ls.loom.snapshot(), ls.follow).text) : t("trace.hint"));
      setText(stop, t("follow.stop"));
      stop.hidden = !ls.follow;
    },
    unmount() {
      box.remove();
    },
  };
}
