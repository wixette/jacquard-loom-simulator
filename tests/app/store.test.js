// The store and the looms (design/m5-notes.md): F-1, a watcher is told of a change only when
// what it watches has changed, once per action, and an action that changes nothing tells no
// one; F-2, the looms are apart.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as act from "../../js/app/looms.js";
import { appState, LOOM_IDS } from "../../js/app/looms.js";
import { Store } from "../../js/app/store.js";
/** @import { AppState, LoomId } from "../../js/app/looms.js" */

/** A store at the app's start, and a count of what each watcher heard. */
function setup() {
  const store = new Store(appState());
  /** @type {Record<string, number>} */
  const heard = {};
  /**
   * @param {string} name
   * @param {(s: AppState) => readonly unknown[]} select
   */
  const listen = (name, select) => {
    heard[name] = 0;
    return store.watch(select, () => heard[name]++);
  };
  return { store, heard, listen };
}

/** @param {AppState} s @param {LoomId} id */
const loomParts = (s, id) => [s.looms[id].loom, s.looms[id].rev, s.looms[id].follow, s.looms[id].selected];

describe("the store tells a watcher only of what it watches (F-1)", () => {
  it("one action, one telling, to the watchers whose part changed", () => {
    const { store, heard, listen } = setup();
    listen("mine", (s) => loomParts(s, "mine"));
    listen("status", (s) => [s.looms.mine.status]);
    listen("tutorial", (s) => loomParts(s, "tutorial"));
    listen("view", (s) => [s.sectionView]);
    act.step(store);
    assert.deepEqual(heard, { mine: 1, status: 1, tutorial: 0, view: 0 });
    act.setSectionView(store, "needles");
    assert.deepEqual(heard, { mine: 1, status: 1, tutorial: 0, view: 1 });
    act.say(store, { text: "hello" });
    assert.deepEqual(heard, { mine: 1, status: 2, tutorial: 0, view: 1 }, "saying something is not a change of the loom");
  });

  it("an action that changes nothing tells no one", () => {
    const { store, heard, listen } = setup();
    listen("all", (s) => [s.looms, s.current, s.sectionView, s.locale]);
    const changes = store.changes;
    act.select(store, 0); // already selected
    act.move(store, -1); // the first card cannot move earlier
    act.setSpeed(store, store.state.looms.mine.speed);
    act.setSectionView(store, "whole");
    act.setFace(store, "front");
    act.setBits(store, false);
    act.lace(store, store.state.looms.mine.loom.deck.loop);
    act.setColours(store, { warp: store.state.looms.mine.warp });
    act.pause(store); // not playing
    act.setTie(store, store.state.looms.mine.loom.tie);
    act.setHooks(store, store.state.looms.mine.loom.deck.hooks);
    assert.equal(heard.all, 0);
    assert.equal(store.changes, changes);
  });

  it("a refused step changes the status line, not the loom", () => {
    const { store, heard, listen } = setup();
    act.stepBack(store); // at the start: refused
    listen("loom", (s) => [s.looms.mine.rev]);
    const before = store.state.looms.mine.rev;
    act.stepBack(store);
    assert.equal(store.state.looms.mine.rev, before);
    assert.equal(store.state.looms.mine.status.warn, true);
    assert.equal(heard.loom, 0);
  });

  it("an unwatched watcher hears nothing more", () => {
    const { store, heard, listen } = setup();
    const stop = listen("mine", (s) => loomParts(s, "mine"));
    act.step(store);
    stop();
    act.step(store);
    assert.equal(heard.mine, 1);
  });
});

describe("the looms are apart (F-2)", () => {
  for (const id of LOOM_IDS) {
    it(`what is done to the ${id} loom leaves the others as they were`, () => {
      const { store } = setup();
      const others = LOOM_IDS.filter((o) => o !== id);
      const before = Object.fromEntries(others.map((o) => [o, store.state.looms[o]]));
      const decks = Object.fromEntries(others.map((o) => [o, JSON.stringify(store.state.looms[o].loom.deck)]));
      const picks = Object.fromEntries(others.map((o) => [o, store.state.looms[o].loom.pick]));
      act.loadPreset(store, "twill", id);
      act.add(store, id);
      act.punch(store, 0, 3, id);
      for (let i = 0; i < 9; i++) act.step(store, id);
      act.stepBack(store, id);
      act.followHook(store, 2, id);
      act.setHooks(store, 24, id);
      act.setFace(store, "back", id);
      act.say(store, { text: "only here" }, false, id);
      for (const o of others) {
        assert.equal(store.state.looms[o], before[o], `${o} was replaced`);
        assert.equal(JSON.stringify(store.state.looms[o].loom.deck), decks[o], `${o}'s cards changed`);
        assert.equal(store.state.looms[o].loom.pick, picks[o]);
      }
      // the create and game looms keep their cards for the picture tool and the games
      if (id === "mine" || id === "tutorial") assert.equal(store.state.looms[id].loom.deck.hooks, 24);
    });
  }

  it("the actions act on the current loom unless told which", () => {
    const { store } = setup();
    act.setCurrent(store, "tutorial");
    act.step(store);
    assert.ok(store.state.looms.tutorial.loom.phi > 0);
    assert.equal(store.state.looms.mine.loom.phi, 0);
  });

  it("playing runs only the looms that play", () => {
    const { store } = setup();
    act.play(store, "game");
    act.tick(store, 1);
    assert.ok(store.state.looms.game.loom.phi > 0 || store.state.looms.game.loom.pick > 0);
    assert.equal(store.state.looms.mine.loom.phi, 0);
    assert.equal(store.state.looms.tutorial.loom.phi, 0);
  });
});

describe("in Learn a step locks what it does not use (design/m7-notes.md, decision 5)", () => {
  it("the tutorial's loom refuses a locked control, says why and changes nothing; the step's own control works", async () => {
    const { stepIndex } = await import("../../js/teach/tutorial.js");
    const { store } = setup();
    act.setWorkspace(store, "learn");
    act.setLearn(store, { step: stepIndex("how-section") });
    const deck = () => JSON.stringify(store.state.looms.tutorial.loom.deck);
    const before = deck();
    act.add(store, "tutorial");
    act.punch(store, 0, 0, "tutorial");
    act.lace(store, false, "tutorial");
    act.setHooks(store, 16, "tutorial");
    assert.equal(deck(), before);
    assert.deepEqual(store.state.looms.tutorial.status, { msg: { key: "learn.locked" }, warn: true });
    act.step(store, "tutorial");
    assert.ok(store.state.looms.tutorial.loom.phi > 0, "the transport stays free");
    act.add(store, "mine");
    assert.equal(store.state.looms.mine.loom.deck.cards.length, 9, "the learner's own loom is never locked");
    act.setLearn(store, { step: stepIndex("weave-punch") });
    act.punch(store, 0, 0, "tutorial");
    assert.notEqual(deck(), before, "punching is free in a step that asks for it");
  });
});


describe("the card tools, the loop and the play loop (js/app/looms.js)", () => {
  const cards = (/** @type {Store<AppState>} */ s) => s.state.looms.mine.loom.deck.cards.map((c) => c.map(Number).join(""));
  it("duplicate, move, invert and remove act on the selected card, and say what they did", () => {
    const { store } = setup();
    act.loadPreset(store, "twill", "mine");
    const before = cards(store);
    act.select(store, 1, "mine");
    act.duplicate(store, "mine");
    assert.deepEqual(cards(store), [before[0], before[1], before[1], before[2], before[3]].map(String));
    assert.equal(store.state.looms.mine.selected, 2);
    act.move(store, -1, "mine");
    assert.equal(store.state.looms.mine.selected, 1);
    act.move(store, -1, "mine");
    act.move(store, -1, "mine");
    assert.equal(store.state.looms.mine.selected, 0, "a card goes no earlier than the first");
    act.invert(store, "mine");
    assert.equal(cards(store)[0], [...before[1]].map((b) => (b === "1" ? "0" : "1")).join(""));
    assert.deepEqual(store.state.looms.mine.status.msg, { key: "status.inverted", params: { card: 1 } });
    act.remove(store, "mine");
    assert.equal(cards(store).length, 4);
    for (let i = 0; i < 5; i++) act.remove(store, "mine");
    assert.equal(cards(store).length, 0, "the chain can be emptied");
    const rev = store.state.looms.mine.rev;
    act.remove(store, "mine");
    act.duplicate(store, "mine");
    act.invert(store, "mine");
    assert.equal(store.state.looms.mine.rev, rev, "with no cards they do nothing");
  });
  it("lacing the chain says so, and lacing it again changes nothing", () => {
    const { store } = setup();
    act.lace(store, true, "mine");
    assert.equal(store.state.looms.mine.loom.deck.loop, true);
    assert.deepEqual(store.state.looms.mine.status.msg, { key: "status.loopOn" });
    const rev = store.state.looms.mine.rev;
    act.lace(store, true, "mine");
    assert.equal(store.state.looms.mine.rev, rev);
    act.lace(store, false, "mine");
    assert.deepEqual(store.state.looms.mine.status.msg, { key: "status.loopOff" });
  });
  it("playing runs the loom on at its speed, saying each moment passed, and stops where the chain runs out", () => {
    const { store } = setup();
    act.loadPreset(store, "plain", "mine");
    act.lace(store, false, "mine");
    act.setSpeed(store, 60, "mine");
    store.set({ looms: { ...store.state.looms, mine: { ...store.state.looms.mine, playing: true } } });
    act.tick(store, 0.5);
    const ls = () => store.state.looms.mine;
    assert.ok(Math.abs(ls().loom.phi - 0.5) < 1e-9, "half a pick in half a second, at 60 a minute");
    assert.equal(/** @type {{ key: string }} */ (ls().status.msg).key, "loom.open", "the last moment passed: the shed open");
    for (let i = 0; i < 10; i++) act.tick(store, 0.5);
    assert.equal(ls().playing, false, "stopped");
    assert.equal(ls().loom.cloth.length, 2, "after the chain's two cards");
    assert.equal(ls().status.warn, true);
    act.reset(store, "mine");
    assert.deepEqual([ls().loom.pick, ls().loom.phi, ls().loom.cloth.length], [0, 0, 0]);
    assert.deepEqual(ls().status.msg, { key: "status.reset" });
  });
  it("a cell of the cloth followed back to its hook; the section's cross-row chosen", () => {
    const { store } = setup();
    act.setHooks(store, 16, "mine");
    for (let i = 0; i < 12; i++) act.step(store, "mine");
    act.followCloth(store, 0, 13, "mine");
    assert.equal(store.state.looms.mine.follow?.hook, 12);
    assert.equal(store.state.looms.mine.follow?.end, 13);
    assert.equal(store.state.looms.mine.crossRow, 1, "the section turns to the hook's cross-row");
    act.setCrossRow(store, 0, "mine");
    assert.equal(store.state.looms.mine.crossRow, 0);
  });
});

describe("each workspace keeps its own views (1.0.0 review)", () => {
  it("Design and Games open on the cloth the first time, and each keeps what it was left with", () => {
    const s = new Store(appState());
    const weave = s.state.views;
    act.setWorkspace(s, "create");
    assert.deepEqual(s.state.views, ["cloth"]);
    act.setViews(s, ["cloth", "section"]);
    act.setWorkspace(s, "play");
    assert.deepEqual(s.state.views, ["cloth"]);
    act.setViews(s, ["front"]);
    act.setWorkspace(s, "weave");
    assert.deepEqual(s.state.views, weave);
    act.setWorkspace(s, "create");
    assert.deepEqual(s.state.views, ["cloth", "section"]);
    act.setWorkspace(s, "play");
    assert.deepEqual(s.state.views, ["front"]);
  });
});
