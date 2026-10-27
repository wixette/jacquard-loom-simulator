// The machine's views as components (component.js): the head in section, the loom from the side
// and from the front, and the loom in 3D. Each shows one loom (its own, or the current one),
// follows a part when it is clicked, and draws to its host's size.

import { t } from "../../l10n/l10n.js";
import { traceOf } from "../../sim/trace.js";
import { STEPS } from "../../teach/tutorial.js";
import { frontLayout, FrontView } from "../../view2d/frontView.js";
import { sectionLayout } from "../../view2d/layout.js";
import { SectionView } from "../../view2d/sectionView.js";
import { sideLayout, SideView } from "../../view2d/sideView.js";
import { onPress } from "../../ui/components.js";
import { followEnd, followHook } from "../looms.js";
import { loomOf, shown } from "./component.js";
/** @import { AppStore, LoomId } from "../looms.js" */
/** @import { Component } from "./component.js" */
/** @import { UnitId } from "../../scene/units.js" */
/** @import { UnitsView } from "../../scene/unitsView.js" */

/** @typedef {{ loom?: LoomId }} ViewOptions the loom it shows, if not the current one */

/**
 * The common part of a 2D view: its host made a view's (it fills the host, on the stage), and
 * given back as it was.
 * @param {HTMLElement} host
 */
function asView(host) {
  host.classList.add("view");
  return () => host.classList.remove("view");
}

/**
 * The head in section: one cross-row, whole or close up (the store's sectionView).
 * @param {AppStore} store
 * @param {ViewOptions} [o]
 * @returns {Component}
 */
export function sectionView(store, o = {}) {
  /** @type {HTMLElement} */
  let host;
  /** @type {SectionView} */
  let view;
  /** @type {() => void} */
  let restore;
  /** @param {Element} part */
  const click = (part) => {
    const p = part.closest("[data-hook]");
    if (p instanceof SVGElement && p.dataset.hook !== undefined) followHook(store, Number(p.dataset.hook), o.loom);
  };
  return {
    name: "comp.section",
    mount(h) {
      host = h;
      restore = asView(h);
      view = new SectionView(h);
      onPress(view.svg, click);
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.crossRow, ls.follow, s.sectionView, s.locale, s.workspace, s.learn.step];
    },
    update(s) {
      if (!shown(host)) return;
      const ls = loomOf(s, o.loom);
      // the parts a step of the tutorial points at glow (css/views.css)
      view.svg.dataset.glow = s.workspace === "learn" && (o.loom ?? s.current) === "tutorial" ? (STEPS[s.learn.step].glow ?? []).join(" ") : "";
      const snap = ls.loom.snapshot();
      const trace = ls.follow ? traceOf(snap, ls.follow) : null;
      view.render(sectionLayout(snap, ls.crossRow), { follow: trace ? trace.hook : null, view: s.sectionView, labels: true });
    },
    unmount() {
      view.svg.remove();
      restore();
    },
  };
}

/**
 * The loom from the side: treadle, lever, head, harness, shed, batten and cloth.
 * @param {AppStore} _store
 * @param {ViewOptions} [o]
 * @returns {Component}
 */
export function sideView(_store, o = {}) {
  /** @type {HTMLElement} */
  let host;
  /** @type {SideView} */
  let view;
  /** @type {() => void} */
  let restore;
  return {
    name: "comp.side",
    mount(h) {
      host = h;
      restore = asView(h);
      view = new SideView(h);
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, s.locale];
    },
    update(s) {
      if (shown(host)) view.render(sideLayout(loomOf(s, o.loom).loom.snapshot()));
    },
    unmount() {
      view.svg.remove();
      restore();
    },
  };
}

/**
 * The loom from the front: hooks, harness, shed and shuttle; a click follows an end or a hook.
 * @param {AppStore} store
 * @param {ViewOptions} [o]
 * @returns {Component}
 */
export function frontView(store, o = {}) {
  /** @type {HTMLElement} */
  let host;
  /** @type {FrontView} */
  let view;
  /** @type {() => void} */
  let restore;
  /** @param {Element} part */
  const click = (part) => {
    const p = part.closest("[data-end], [data-hook]");
    if (!(p instanceof SVGElement)) return;
    if (p.dataset.end) followEnd(store, Number(p.dataset.end), o.loom);
    else if (p.dataset.hook) followHook(store, Number(p.dataset.hook), o.loom);
  };
  return {
    name: "comp.front",
    mount(h) {
      host = h;
      restore = asView(h);
      view = new FrontView(h);
      onPress(view.svg, click);
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.follow, s.locale];
    },
    update(s) {
      if (!shown(host)) return;
      const ls = loomOf(s, o.loom);
      const snap = ls.loom.snapshot();
      view.render(frontLayout(snap), ls.follow ? traceOf(snap, ls.follow) : null);
    },
    unmount() {
      view.svg.remove();
      restore();
    },
  };
}

/** The unit each 3D view of the stage shows (js/sim/link.js, STAGE_VIEWS). */
export const UNIT_VIEWS = /** @type {const} */ ({
  "3d": { unit: "machine" },
  u1: { unit: "selector" },
  u2: { unit: "cylinder" },
  u3: { unit: "griffe" },
  u4: { unit: "harness" },
  u5: { unit: "shed" },
});

/**
 * The loom in 3D: the ghosted whole machine with its five core units, or one unit alone. The
 * 3D code and the models load only when this is first mounted.
 * @param {AppStore} store
 * @param {ViewOptions & { unit?: "machine" | UnitId; onMode?: (mode: "machine" | UnitId) => void }} [o] onMode: what it shows, each time that changes (a click on a unit opens it alone)
 * @returns {Component}
 */
export function unitsView(store, o = {}) {
  /** @type {HTMLElement} */
  let host;
  /** @type {UnitsView | null} */
  let view = null;
  /** @type {HTMLElement} */
  let note;
  let progress = 0;
  /** @type {string | null} */
  let failed = null;
  let gone = false;
  /** The language the bands were last labelled in. */
  let labelled = "";
  /** @type {() => void} */
  let restore;
  const say = () => (note.textContent = failed !== null ? t("units.failed", { error: failed }) : t("units.loading", { percent: Math.round(progress * 100) }));
  /** @type {Component} */
  const component = {
    name: "comp.units",
    mount(h) {
      host = h;
      restore = asView(h);
      if (getComputedStyle(h).position === "static") h.style.position = "relative";
      note = document.createElement("p");
      note.className = "view-note";
      h.appendChild(note);
      say();
      // three.js and the models come only with the first 3D view.
      import("../../scene/unitsView.js")
        .then(({ UnitsView }) => {
          if (gone) return;
          view = new UnitsView(h, { onChange: o.onMode });
          if (o.unit && o.unit !== "machine") view.show(o.unit, false);
          else view.showMachine(false);
          return view.load((f) => {
            progress = f;
            say();
          });
        })
        .then(() => {
          if (gone || !view) return;
          note.remove();
          component.update(store.state);
        })
        .catch((e) => {
          failed = String(e);
          if (!gone) say();
        });
    },
    watch(s) {
      const ls = loomOf(s, o.loom);
      return [ls.loom, ls.rev, ls.follow, s.locale];
    },
    update(s) {
      if (note.isConnected) say();
      if (!view?.loaded) return;
      // the bands' labels are buttons: written only when the language changes, not every frame
      if (labelled !== s.locale) {
        labelled = s.locale;
        view.relabel();
      }
      const ls = loomOf(s, o.loom);
      view.pose(ls.loom.snapshot(), ls.follow ? ls.follow.hook : 0);
    },
    unmount() {
      gone = true;
      view?.dispose();
      note.remove();
      host.style.position = "";
      restore();
    },
  };
  return component;
}
