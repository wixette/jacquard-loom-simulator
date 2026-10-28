// The 3D view of the loom's parts: the ghosted whole machine with the five core units in their
// places (and bands where the real machine repeats them), or one unit alone, turned and zoomed
// by the learner, posed at the loom's moment, with any part under the pointer named. Clicking a
// unit (or its band) in the whole machine flies to it and opens it alone.

import * as THREE from "three";
import { t } from "../l10n/l10n.js";
import { P, PARAMS } from "../sim/params.js";
import { anchors, gltfName } from "./rig.js";
import { partName } from "./partNames.js";
import { Unit, UNITS } from "./units.js";
import { Viewer } from "./viewer.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { UnitId } from "./units.js" */

/** Where each unit, and the whole machine, is looked at from (three.js direction from its centre). */
const VIEW_FROM = /** @type {Record<UnitId | "machine", THREE.Vector3Like>} */ ({
  machine: { x: 0.95, y: 0.5, z: 1.1 },
  selector: { x: 0.35, y: 0.25, z: 1 },
  cylinder: { x: -0.7, y: 0.35, z: 1 },
  griffe: { x: 1, y: 0.25, z: 0.55 },
  harness: { x: 0.25, y: 0.15, z: 1 },
  shed: { x: 0.9, y: 0.5, z: 0.6 },
});

/** The parts each unit is framed on when opened (the rest is in reach by zooming out). */
const FOCUS = /** @type {Record<UnitId, string[]>} */ ({
  selector: ["needles.needle.0", "needles.needle.7", "facing-card", "springs.box", "hooks.hook.0.crook"],
  cylinder: ["cylinder.block", "cylinder.lantern", "cylinder.hammer", "cylinder.catch_top", "cylinder.catch_bottom", "cards"],
  griffe: ["unit.griffe"],
  harness: ["unit.harness"],
  shed: ["batten.race", "batten.reed", "shuttle.body", "warp.sheet.upper.front"],
});

/** The version of this module's URL (?v=…), for the files it fetches. */
const VERSION = new URL(import.meta.url).search;

/**
 * @typedef {object} Band a translucent block where the real machine repeats a unit
 * @property {THREE.Object3D} node
 * @property {string} label
 * @property {string} note
 * @property {UnitId} unit
 * @property {HTMLElement} tag its label on the page
 */

export class UnitsView {
  /**
   * @param {HTMLElement} host
   * @param {{ onChange?: (mode: "machine" | UnitId) => void }} [events]
   */
  constructor(host, events = {}) {
    this.host = host;
    this.events = events;
    this.viewer = new Viewer(host);
    this.viewer.renderOnDemand = true;
    /** @type {Partial<Record<UnitId, Unit>>} */
    this.units = {};
    /** @type {THREE.Object3D | null} */
    this.context = null;
    /** @type {Band[]} */
    this.bands = [];
    /** @type {"machine" | UnitId} */
    this.mode = "machine";
    this.loaded = false;
    this.disposed = false;
    this.tip = document.createElement("div");
    this.tip.className = "part-tip";
    this.tip.hidden = true;
    host.appendChild(this.tip);
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    this.raycaster = new THREE.Raycaster();
    const canvas = this.viewer.renderer.domElement;
    canvas.addEventListener("pointermove", (e) => this.hover(e));
    canvas.addEventListener("pointerleave", () => (this.tip.hidden = true));
    // A click (not a drag) on a unit or its band, in the whole machine, opens that unit.
    /** @type {{ x: number, y: number } | null} */
    let down = null;
    canvas.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
    canvas.addEventListener("pointerup", (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5 && this.mode === "machine") {
        const id = this.unitAt(e);
        if (id) this.show(id);
      }
      down = null;
    });
    // the labels move only when the picture does: placed after each frame drawn, not every tick
    this.viewer.onDraw.push(() => this.placeTags());
  }

  /**
   * The bands' labels in the page's language (the models carry them in English; the counts
   * are the reference head's, params reference_head).
   * @returns {void}
   */
  relabel() {
    const rows = PARAMS.reference_head.cross_rows.v;
    const hooks = PARAMS.reference_head.hooks.v;
    const repeats = PARAMS.reference_head.repeats.v;
    const n = { "band.hooks": rows * P.rows, "band.needles": rows * P.rows, "band.harness": hooks * repeats, "band.warp": hooks * repeats };
    for (const b of this.bands) {
      const key = /** @type {keyof typeof n} */ (b.node.name.replace(/^band/, "band."));
      if (!(key in n)) continue;
      b.label = t(key, { n: n[key] });
      b.note = t(`${key}.note`, { rows, hooks, repeats });
      b.tag.textContent = b.label;
      b.tag.title = b.note;
    }
  }

  /**
   * Stop and take the view away: the scene, its canvas, the part's tip and the bands' labels.
   * @returns {void}
   */
  dispose() {
    this.disposed = true;
    this.viewer.dispose();
    this.tip.remove();
    for (const b of this.bands) b.tag.remove();
  }

  /**
   * Loads the ghosted machine and every unit's file.
   * @param {(fraction: number) => void} [onProgress]
   * @returns {Promise<void>}
   */
  async load(onProgress) {
    const files = ["context.glb", ...UNITS.map((u) => u.file)];
    const parts = files.map(() => 0);
    /**
     * @param {number} i
     * @returns {[string, (f: number) => void]}
     */
    const source = (i) => [
      new URL(`../../assets/${files[i]}${VERSION}`, import.meta.url).href,
      (f) => {
        parts[i] = f;
        onProgress?.(parts.reduce((a, b) => a + b, 0) / parts.length);
      },
    ];
    const loading = UNITS.map(async (spec, i) => {
      this.units[spec.id] = new Unit(spec, await this.viewer.load(...source(i + 1)));
    });
    this.context = await this.viewer.load(...source(0));
    await Promise.all(loading);
    // Taken away while it loaded: what arrived since is given back too.
    if (this.disposed) {
      this.viewer.dispose();
      return;
    }
    this.context.traverse((o) => {
      if (!o.userData.band) return;
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "band-tag";
      const unit = /** @type {UnitId} */ (o.userData.unit_ref);
      tag.addEventListener("click", () => this.show(unit));
      this.host.appendChild(tag);
      this.bands.push({ node: o, label: o.userData.label_en, note: o.userData.note_en, unit, tag });
    });
    this.relabel();
    this.loaded = true;
    if (this.mode === "machine") this.showMachine(false);
    else this.show(this.mode, false);
  }

  /**
   * The whole machine: the ghost, every unit in its place, the bands.
   * @param {boolean} [fly]
   * @returns {void}
   */
  showMachine(fly = true) {
    this.mode = "machine";
    if (this.context) this.context.visible = true;
    for (const u of Object.values(this.units)) u.root.visible = true;
    if (this.context) this.viewer.fit(this.context, VIEW_FROM.machine, fly);
    this.viewer.invalidate();
    this.events.onChange?.("machine");
  }

  /**
   * One unit alone, framed on its working parts.
   * @param {UnitId} id
   * @param {boolean} [fly]
   * @returns {void}
   */
  show(id, fly = true) {
    this.mode = id;
    if (this.context) this.context.visible = false;
    for (const [key, u] of Object.entries(this.units)) u.root.visible = key === id;
    const u = this.units[id];
    if (u) {
      u.root.updateMatrixWorld(true);
      const parts = FOCUS[id].map((n) => u.root.getObjectByName(gltfName(n))).filter((o) => o !== undefined);
      this.viewer.fit(parts.length ? parts : u.root, VIEW_FROM[id], fly);
    }
    this.viewer.invalidate();
    this.events.onChange?.(id);
  }

  /**
   * Poses every loaded unit at the loom's moment.
   * @param {Snapshot} snap
   * @param {number} hook the hook the single-part units show (0-based)
   * @returns {void}
   */
  pose(snap, hook) {
    for (const u of Object.values(this.units)) u.pose(snap, hook);
    this.viewer.invalidate();
  }

  /**
   * The band labels follow their bands on screen, in the whole machine only.
   * @returns {void}
   */
  placeTags() {
    const show = this.mode === "machine" && this.host.clientWidth > 0;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    /** @type {{ b: Band, x: number, y: number }[]} */
    const at = [];
    for (const b of this.bands) {
      b.tag.hidden = !show;
      if (!show) continue;
      const p = anchors(b.node, "label_at")[0].project(this.viewer.camera);
      b.tag.hidden = p.z > 1 || p.x < -1 || p.x > 1 || p.y < -1 || p.y > 1;
      if (!b.tag.hidden) at.push({ b, x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h });
    }
    // Labels that would overlap are stacked, each just below the one above it.
    at.sort((a, c) => a.y - c.y);
    /** @type {{ x0: number, x1: number, y0: number, y1: number }[]} */
    const placed = [];
    for (const t of at) {
      const tw = t.b.tag.offsetWidth || 120;
      const th = (t.b.tag.offsetHeight || 18) + 2;
      // Kept wholly inside the view (a label is centred on x, its bottom at y).
      const x = Math.max(tw / 2 + 2, Math.min(w - tw / 2 - 2, t.x));
      let y = Math.max(th, t.y);
      for (const q of placed) if (x - tw / 2 < q.x1 && x + tw / 2 > q.x0 && y - th < q.y1 && y > q.y0) y = q.y1 + th;
      t.b.tag.hidden = y > h - 2;
      placed.push({ x0: x - tw / 2, x1: x + tw / 2, y0: y - th, y1: y });
      t.b.tag.style.left = `${x}px`;
      t.b.tag.style.top = `${y}px`;
    }
  }

  /**
   * The unit under the pointer (a band counts as its unit), or null.
   * @param {{ clientX: number, clientY: number }} e
   * @returns {UnitId | null}
   */
  unitAt(e) {
    const hit = this.pick(e, true);
    /** @type {THREE.Object3D | null} */
    let o = hit ? hit.object : null;
    while (o) {
      if (o.userData.unit_ref) return o.userData.unit_ref;
      if (o.userData.unit && o.userData.unit !== "context") return o.userData.unit;
      o = o.parent;
    }
    return null;
  }

  /**
   * The first shown part under the pointer.
   * @private
   * @param {{ clientX: number, clientY: number }} e
   * @param {boolean} [bands] whether the bands count (they are clicked through otherwise)
   */
  pick(e, bands = false) {
    const r = this.viewer.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(p, this.viewer.camera);
    const roots = [...Object.values(this.units).map((u) => u.root), ...(this.context ? [this.context] : [])].filter((o) => o.visible);
    const hits = this.raycaster.intersectObjects(roots, true).filter((h) => {
      let o = /** @type {THREE.Object3D | null} */ (h.object);
      while (o) {
        if (!o.visible) return false;
        if (o.userData.band) return bands;
        o = o.parent;
      }
      return true;
    });
    // The ghost's shell is see-through: a unit behind it wins.
    return hits.find((h) => !isGhost(h.object) || h.object.parent?.userData.band || h.object.userData.band) ?? hits[0] ?? null;
  }

  /**
   * A part's name in the page's language, or as the model has it if no message names it.
   * @private
   * @param {THREE.Object3D} o
   */
  nameOf(o) {
    const m = partName(o.name);
    const name = t(m.key, m.params);
    return name === m.key ? /** @type {string} */ (o.userData.label_en) : name;
  }

  /**
   * Names the part under the pointer.
   * @private
   * @param {PointerEvent} e
   */
  hover(e) {
    const hit = this.pick(e, this.mode === "machine");
    /** @type {THREE.Object3D | null} */
    let o = hit ? hit.object : null;
    while (o && !o.userData.label_en) o = o.parent;
    /** @type {string | null} */
    let label = o ? this.nameOf(o) : hit?.object.parent?.name === "cards" ? t("p3d.card") : null;
    const band = o ? this.bands.find((b) => b.node === o) : undefined;
    if (band) label = t("p3d.open", { label: t("p3d.band", { label: band.label, note: band.note }) });
    else if (this.mode === "machine" && hit && o && !isGhost(o)) {
      const spec = UNITS.find((u) => u.id === this.unitAt(e));
      if (spec) label = t("p3d.open", { label: t("p3d.inUnit", { code: spec.code, title: t(spec.title), label: label ?? "" }) });
    }
    if (!label) {
      this.tip.hidden = true;
      return;
    }
    this.tip.hidden = false;
    this.tip.textContent = label;
    const hr = this.host.getBoundingClientRect();
    this.tip.style.left = `${Math.max(4, Math.min(e.clientX - hr.left + 14, hr.width - 260))}px`;
    this.tip.style.top = `${e.clientY - hr.top + 14}px`;
  }
}

/**
 * Whether a part belongs to the ghosted shell.
 * @param {THREE.Object3D} o
 */
function isGhost(o) {
  /** @type {THREE.Object3D | null} */
  let p = o;
  while (p) {
    if (p.userData.unit === "context") return true;
    p = p.parent;
  }
  return false;
}
