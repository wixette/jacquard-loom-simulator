// What the app keeps on the device (design/ui-layout.md §3): the game last chosen, Design's
// picture (a link's too), read back with anything not a picture left out; and storage that
// refuses to keep anything never stops the app (here a stand-in for the browser's storage).

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { openCreate, rememberedPicture, watchPicture } from "../../js/app/create.js";
import { openLink } from "../../js/app/links.js";
import * as act from "../../js/app/looms.js";
import { appState } from "../../js/app/looms.js";
import { chooseGame, rememberedGame, watchGame } from "../../js/app/play.js";
import { Store } from "../../js/app/store.js";

/** A stand-in for the browser's local storage; `full` makes it refuse to keep anything. */
class Storage {
  /** @type {Map<string, string>} */
  items = new Map();
  full = false;
  /** @param {string} k */
  getItem(k) {
    return this.items.get(k) ?? null;
  }
  /** @param {string} k @param {string} v */
  setItem(k, v) {
    if (this.full) throw new Error("QuotaExceededError");
    this.items.set(k, String(v));
  }
  /** @param {string} k */
  removeItem(k) {
    this.items.delete(k);
  }
}

const storage = () => /** @type {Storage} */ (/** @type {any} */ (globalThis).localStorage);
const store = () => new Store(appState());
/** @param {boolean[][]} rows */
const key = (rows) => rows.map((r) => r.map(Number).join("")).join("/");
beforeEach(() => {
  /** @type {any} */ (globalThis).localStorage = new Storage();
});

describe("the game last chosen", () => {
  it("is kept as it is chosen, and read back; anything else kept is no game", () => {
    assert.equal(rememberedGame(), undefined);
    const s = store();
    watchGame(s);
    chooseGame(s, "guess");
    assert.equal(rememberedGame(), "guess");
    storage().setItem("jacquard.game", "chess");
    assert.equal(rememberedGame(), undefined);
  });
});

describe("Design's picture", () => {
  it("is kept as it changes, and Design opens on it the next time", () => {
    const a = store();
    watchPicture(a);
    const rows = [...Array(8)].map((_, y) => [...Array(8)].map((_, x) => x === y));
    act.setPicture(a, { rows, mode: "damask", k: 3 }, "create");
    const b = store();
    openCreate(b);
    assert.equal(key(b.state.pictures.create.rows), key(rows));
    assert.equal(b.state.pictures.create.mode, "damask");
    assert.equal(b.state.pictures.create.k, 3);
  });
  it("a link's picture is the one kept, so Design keeps it after a visit to Weave", async () => {
    const a = store();
    watchPicture(a);
    act.setPicture(a, { rows: [...Array(8)].map(() => Array(8).fill(true)) }, "create");
    await openLink(a, "#v=2&w=create&pw=8&pic=x.18-3c-7e-ff-ff-7e-3c-18&rd=damask&k=3");
    const linked = key(a.state.pictures.create.rows);
    act.setWorkspace(a, "weave");
    openCreate(a);
    assert.equal(key(a.state.pictures.create.rows), linked);
    assert.equal(a.state.pictures.create.mode, "damask");
  });
  it("anything kept that is not a picture of the tool's sizes and readings is left out", () => {
    for (const v of ["{not json", JSON.stringify({ rows: ["#.", ".#"] }), JSON.stringify({ rows: Array(8).fill("#".repeat(7)) }), JSON.stringify({ rows: 5 })]) {
      storage().setItem("jacquard.picture", v);
      assert.equal(rememberedPicture(), null, v);
    }
    storage().setItem("jacquard.picture", JSON.stringify({ rows: Array(8).fill("#".repeat(8)), mode: "plaid", k: 99, perRow: 7 }));
    assert.deepEqual({ ...rememberedPicture(), rows: null }, { rows: null, mode: "direct", k: 4, perRow: 1, invert: false }, "an unknown reading is read square by square");
  });
});

describe("storage that keeps nothing", () => {
  it("never stops the app: the choices last as long as the page", () => {
    storage().full = true;
    const s = store();
    watchGame(s);
    watchPicture(s);
    chooseGame(s, "drawboy");
    act.setPicture(s, { mode: "damask" }, "create");
    assert.equal(s.state.play.game, "drawboy");
    assert.equal(rememberedGame(), undefined);
  });
});
