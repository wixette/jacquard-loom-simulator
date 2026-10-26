// The app's one state (design/ui-layout.md §6): a store that holds it, changes it, and tells
// whoever watches a part of it when that part has changed. No DOM: the tests drive it in Node.
//
// The state is replaced, not edited: a change makes a new top-level object, sharing every
// part it did not touch, so a watcher compares its parts by identity. A watcher names what it
// watches by a function returning the values it depends on; it is told only when one of them
// is no longer the same, once per change.

/**
 * @template S
 * @typedef {object} Watcher
 * @property {(state: S) => readonly unknown[]} select the values it depends on
 * @property {(state: S, before: S) => void} run told when one of them has changed
 * @property {readonly unknown[]} last the values it was last told of
 */

/** @template S */
export class Store {
  /** @param {S} state */
  constructor(state) {
    /** @type {S} */
    this.state = state;
    /** @type {Set<Watcher<S>>} */
    this.watchers = new Set();
    /** How many changes so far (for the tests and the M5 page). */
    this.changes = 0;
  }

  /**
   * Change the state: a new state from the old one, or the parts to replace. A change that
   * leaves every part as it was tells no one.
   * @param {Partial<S> | ((state: S) => Partial<S>)} change
   */
  set(change) {
    const before = this.state;
    const patch = typeof change === "function" ? change(before) : change;
    const keys = /** @type {(keyof S)[]} */ (Object.keys(patch));
    if (keys.every((k) => patch[k] === before[k])) return;
    this.state = { ...before, ...patch };
    this.changes++;
    for (const w of [...this.watchers]) {
      if (!this.watchers.has(w)) continue; // unwatched by an earlier watcher
      const now = w.select(this.state);
      if (now.length === w.last.length && now.every((v, i) => v === w.last[i])) continue;
      w.last = now;
      w.run(this.state, before);
    }
  }

  /**
   * Watch a part of the state.
   * @param {(state: S) => readonly unknown[]} select the values to watch
   * @param {(state: S, before: S) => void} run called when one of them changes
   * @returns {() => void} stops watching
   */
  watch(select, run) {
    /** @type {Watcher<S>} */
    const w = { select, run, last: select(this.state) };
    this.watchers.add(w);
    return () => this.watchers.delete(w);
  }
}
