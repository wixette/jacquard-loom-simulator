// Design (first called Create), the picture tool, as a workspace (design/m8-notes.md): its own loom, woven from the
// learner's picture, which is kept on this device, so a picture drawn is there the next time.
// Open in Weave puts the picture's cards on the learner's own loom (js/app/looms.js).

import { pictureFromStrings } from "../sim/design.js";
import { DAMASK_BLOCKS, PICKS_PER_ROW, PICTURE_SIZES } from "../sim/picture.js";
import * as act from "./looms.js";
/** @import { AppStore } from "./looms.js" */
/** @import { PictureSpec } from "../sim/picture.js" */

const KEY = "jacquard.picture";

/**
 * A picture as kept: its rows as strings ("#" dark), and how it is read.
 * @param {PictureSpec} s
 */
const kept = (s) => JSON.stringify({ rows: s.rows.map((r) => r.map((d) => (d ? "#" : ".")).join("")), mode: s.mode, k: s.k, perRow: s.perRow });

/**
 * The picture this device keeps, or null: anything not a picture of the sizes and readings the
 * tool offers is left out.
 * @returns {PictureSpec | null}
 */
export function rememberedPicture() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const rows = Array.isArray(v?.rows) && v.rows.every((/** @type {unknown} */ r) => typeof r === "string") ? pictureFromStrings(v.rows) : null;
    if (!rows || !(/** @type {readonly number[]} */ (PICTURE_SIZES)).includes(rows.length) || rows.some((r) => r.length !== rows.length)) return null;
    const mode = v.mode === "damask" ? "damask" : "direct";
    const k = (/** @type {readonly number[]} */ (DAMASK_BLOCKS)).includes(v.k) ? v.k : 4;
    const perRow = (/** @type {readonly number[]} */ (PICKS_PER_ROW)).includes(v.perRow) ? v.perRow : 1;
    return { rows, mode, k, perRow, invert: false };
  } catch {
    return null;
  }
}

/**
 * Open Create, with the picture this device keeps (the first time, the ready-made heart).
 * @param {AppStore} store
 */
export function openCreate(store) {
  const p = rememberedPicture();
  if (p && kept(p) !== kept(store.state.pictures.create)) act.setPicture(store, p, "create");
  act.setWorkspace(store, "create");
}

/**
 * Keep Design's picture on this device each time it changes.
 * @param {AppStore} store
 * @returns {() => void}
 */
export function watchPicture(store) {
  return store.watch(
    (s) => [s.pictures.create],
    () => {
      try {
        localStorage.setItem(KEY, kept(store.state.pictures.create));
      } catch {
        // not kept
      }
    },
  );
}
