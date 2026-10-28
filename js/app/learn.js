// Learn: the tutorial as a mode (design/ui-layout.md §3): going to a step puts its loom on the
// tutorial's own loom and its views on the stage; a step's task, once the loom shows it done,
// counts as done; the place and the steps done are remembered on this device, so leaving Learn
// and coming back resumes it. The steps themselves are in js/teach/tutorial.js.

import { loomAt, pictureAt, shownAt, stepIndex, STEPS } from "../teach/tutorial.js";
import { WORKSPACES } from "../sim/link.js";
import * as act from "./looms.js";
/** @import { AppStore } from "./looms.js" */

const KEY = "jacquard.tutorial";
/** The workspace last used on this device (design/ui-layout.md §3: the app opens where it was left). */
const WORKSPACE = "jacquard.workspace";


/**
 * The workspace the app opens on, without a link: the one last used on this device, or Learn
 * for a newcomer, who starts with the whole loom in 3D.
 * @returns {import("./looms.js").Workspace}
 */
export function openingWorkspace() {
  try {
    const w = localStorage.getItem(WORKSPACE);
    return w !== null && /** @type {readonly string[]} */ (WORKSPACES).includes(w) ? /** @type {import("./looms.js").Workspace} */ (w) : "learn";
  } catch {
    return "learn";
  }
}

/**
 * Remember the workspace each time it changes, for the next time the app opens.
 * @param {AppStore} store
 * @returns {() => void}
 */
export function watchWorkspace(store) {
  return store.watch(
    (s) => [s.workspace],
    () => {
      try {
        localStorage.setItem(WORKSPACE, store.state.workspace);
      } catch {
        // not remembered
      }
    },
  );
}

/**
 * The place and the steps done, as this device remembers them.
 * @returns {{ step: string | null; done: string[] }}
 */
export function remembered() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && typeof v.step === "string" && Array.isArray(v.done)) return { step: v.step, done: v.done.filter((/** @type {unknown} */ x) => typeof x === "string") };
  } catch {
    // nothing remembered, or storage refused
  }
  return { step: null, done: [] };
}

/** @param {AppStore} store */
function remember(store) {
  const { step, done } = store.state.learn;
  try {
    localStorage.setItem(KEY, JSON.stringify({ step: STEPS[step].id, done }));
  } catch {
    // not remembered
  }
}

/**
 * Go to step i: its loom on the tutorial's loom, its views on the stage.
 * @param {AppStore} store
 * @param {number} i
 */
export function goTo(store, i) {
  const n = Math.max(0, Math.min(STEPS.length - 1, i));
  const { loom, follow } = loomAt(n);
  // the step and its loom in one update: the step done is never judged on the other's loom
  // a step on a picture gives the picture tool its picture, in the same update
  const picture = pictureAt(n);
  const pictures = picture ? { pictures: { ...store.state.pictures, tutorial: picture } } : {};
  act.setLoom(store, loom, follow === null ? null : { hook: follow, end: null, pick: null }, "tutorial", { learn: { ...store.state.learn, step: n }, ...pictures });
  act.setViews(store, shownAt(n).views);
  act.setSectionView(store, "whole");
  remember(store);
}

/**
 * Open Learn: at the step a link names, or where the learner left it, or at the start. A name
 * no step has opens the start, and says so.
 * @param {AppStore} store
 * @param {string | null} [name]
 */
export function openLearn(store, name = null) {
  const r = remembered();
  act.setLearn(store, { done: [...new Set([...store.state.learn.done, ...r.done])] });
  act.setWorkspace(store, "learn");
  const at = name ?? r.step;
  const i = at === null ? 0 : stepIndex(at);
  goTo(store, Math.max(0, i));
  if (name !== null && i < 0) act.say(store, { key: "learn.noStep", params: { step: name } }, true, "tutorial");
}

/**
 * Leave Learn for Weave, keeping the tutorial's place: Weave's loom and views as they were.
 * @param {AppStore} store
 */
export const leaveLearn = (store) => act.setWorkspace(store, "weave");

/**
 * Answer the step's question (predict, then weave): a choice, 1-based.
 * @param {AppStore} store
 * @param {number} choice
 */
export function answer(store, choice) {
  const id = STEPS[store.state.learn.step].id;
  act.setLearn(store, { answers: { ...store.state.learn.answers, [id]: choice } });
}

/**
 * Whether the step on show is done: its question answered and its task done on the loom.
 * @param {import("./looms.js").AppState} s
 */
export function stepDone(s) {
  const step = STEPS[s.learn.step];
  const loom = s.looms.tutorial.loom;
  return (!step.predict || step.id in s.learn.answers) && (!step.task || step.task.check(loom, step.picture ? s.pictures.tutorial : null));
}

/**
 * Count each step done as the learner does it, and remember it.
 * @param {AppStore} store
 * @returns {() => void}
 */
export function watchDone(store) {
  return store.watch(
    (s) => [s.learn.step, s.learn.answers, s.looms.tutorial.rev],
    () => {
      const s = store.state;
      const id = STEPS[s.learn.step].id;
      if (s.learn.done.includes(id) || !stepDone(s)) return;
      act.setLearn(store, { done: [...s.learn.done, id] });
      remember(store);
    },
  );
}
