// Learn as a mode (js/app/learn.js; design/m7-notes.md, decisions 2, 4 and 11): a step puts its
// loom on the tutorial's loom and its views on the stage; an unknown step opens the start and
// says so; leaving gives Weave's views back; a step counts as done once its question has an
// answer and its task is done on the loom; the place, the steps done and the workspace last used
// are kept on the device (here a stand-in for the browser's storage).

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { answer, goTo, leaveLearn, openingWorkspace, openLearn, remembered, stepDone, watchDone, watchWorkspace } from "../../js/app/learn.js";
import * as act from "../../js/app/looms.js";
import { appState } from "../../js/app/looms.js";
import { Store } from "../../js/app/store.js";
import { cardToString } from "../../js/sim/deck.js";
import { PRESETS } from "../../js/sim/deck.js";
import { loomAt, shownAt, stepIndex, STEPS } from "../../js/teach/tutorial.js";

/** A stand-in for the browser's local storage. */
class Storage {
  /** @type {Map<string, string>} */
  items = new Map();
  /** @param {string} k */
  getItem(k) {
    return this.items.get(k) ?? null;
  }
  /** @param {string} k @param {string} v */
  setItem(k, v) {
    this.items.set(k, String(v));
  }
  /** @param {string} k */
  removeItem(k) {
    this.items.delete(k);
  }
}

const storage = () => /** @type {Storage} */ (/** @type {any} */ (globalThis).localStorage);
const store = () => new Store(appState());
beforeEach(() => {
  /** @type {any} */ (globalThis).localStorage = new Storage();
});

describe("going to a step", () => {
  it("a newcomer opens Learn at the first step, on the tutorial's loom, with the step's views", () => {
    const s = store();
    openLearn(s);
    assert.equal(s.state.workspace, "learn");
    assert.equal(s.state.current, "tutorial");
    assert.equal(s.state.learn.step, 0);
    assert.deepEqual(s.state.views, shownAt(0).views);
  });
  it("a step by name puts its own loom on the tutorial's loom, and leaves the learner's alone", () => {
    const s = store();
    const mine = s.state.looms.mine.loom;
    openLearn(s, "weave-twill");
    const i = stepIndex("weave-twill");
    assert.equal(s.state.learn.step, i);
    assert.deepEqual(s.state.looms.tutorial.loom.deck.cards.map(cardToString), PRESETS.twill.rows);
    assert.equal(s.state.looms.tutorial.loom.cloth.length, loomAt(i).loom.cloth.length);
    assert.equal(s.state.looms.mine.loom, mine);
  });
  it("a name no step has opens the start, and says so", () => {
    const s = store();
    openLearn(s, "no-such-step");
    assert.equal(s.state.learn.step, 0);
    assert.deepEqual(s.state.looms.tutorial.status, { msg: { key: "learn.noStep", params: { step: "no-such-step" } }, warn: true });
  });
  it("Back before the first step and Next after the last stay within the tutorial", () => {
    const s = store();
    openLearn(s);
    goTo(s, -1);
    assert.equal(s.state.learn.step, 0);
    goTo(s, STEPS.length + 3);
    assert.equal(s.state.learn.step, STEPS.length - 1);
  });
  it("leaving gives Weave its own views back", () => {
    const s = store();
    act.setViews(s, ["front", "u2"]);
    openLearn(s);
    assert.notDeepEqual(s.state.views, ["front", "u2"]);
    leaveLearn(s);
    assert.equal(s.state.workspace, "weave");
    assert.equal(s.state.current, "mine");
    assert.deepEqual(s.state.views, ["front", "u2"]);
  });
});

describe("a step done", () => {
  it("a question counts once it has an answer, right or wrong; a task once the loom shows it", () => {
    const s = store();
    openLearn(s, "how-one-row");
    assert.equal(stepDone(s.state), false);
    answer(s, 2);
    assert.equal(s.state.learn.answers["how-one-row"], 2);
    assert.equal(stepDone(s.state), false, "the task is still to do");
    STEPS[s.state.learn.step].task?.solve(s.state.looms.tutorial.loom);
    act.touch(s, "tutorial");
    assert.equal(stepDone(s.state), true);
  });
  it("a step with neither counts as done when shown", () => {
    const s = store();
    openLearn(s, "story-holes");
    assert.equal(stepDone(s.state), true);
  });
  it("steps are counted done as the learner does them, once each, and kept", () => {
    const s = store();
    watchDone(s);
    openLearn(s, "how-needles");
    assert.ok(!s.state.learn.done.includes("how-needles"));
    act.step(s, "tutorial");
    assert.deepEqual(s.state.learn.done, ["how-needles"]);
    act.step(s, "tutorial");
    assert.deepEqual(s.state.learn.done, ["how-needles"]);
    assert.deepEqual(remembered(), { step: "how-needles", done: ["how-needles"] });
  });
});

describe("what the device keeps", () => {
  it("the place, to resume at it, and the steps done, merged with the page's", () => {
    const a = store();
    openLearn(a, "weave-satin");
    leaveLearn(a);
    const b = store();
    storage().setItem("jacquard.tutorial", JSON.stringify({ step: "weave-satin", done: ["story-draw-loom", 3, "how-units"] }));
    openLearn(b);
    assert.equal(b.state.learn.step, stepIndex("weave-satin"));
    assert.deepEqual(b.state.learn.done, ["story-draw-loom", "how-units"], "anything not a name is dropped");
  });
  it("something unreadable kept is ignored", () => {
    storage().setItem("jacquard.tutorial", "{not json");
    assert.deepEqual(remembered(), { step: null, done: [] });
  });
  it("the workspace last used: Learn for a newcomer, then whichever was used last", () => {
    assert.equal(openingWorkspace(), "learn");
    const s = store();
    watchWorkspace(s);
    act.setWorkspace(s, "learn");
    act.setWorkspace(s, "weave");
    assert.equal(openingWorkspace(), "weave");
    act.setWorkspace(s, "create");
    assert.equal(openingWorkspace(), "create");
    act.setWorkspace(s, "play");
    assert.equal(openingWorkspace(), "play");
    act.setWorkspace(s, "learn");
    assert.equal(openingWorkspace(), "learn");
    storage().setItem("jacquard.workspace", "elsewhere");
    assert.equal(openingWorkspace(), "learn", "anything else kept opens Learn");
  });
  it("without storage (a private window) the app still opens, on Learn", () => {
    /** @type {any} */ (globalThis).localStorage = undefined;
    assert.equal(openingWorkspace(), "learn");
    assert.deepEqual(remembered(), { step: null, done: [] });
    const s = store();
    openLearn(s, "how-loop");
    assert.equal(s.state.learn.step, stepIndex("how-loop"));
  });
});
