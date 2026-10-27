// What every view and panel of the app is (design/ui-layout.md §6): a component, made for a
// store, that mounts into any host, draws to the host's size, redraws when the part of the
// state it shows changes or the host is resized, and leaves nothing behind when unmounted.
// place() does the watching and the resizing, so a component only says what it watches and
// how it draws.

/** @import { AppState, AppStore, LoomId, LoomState } from "../looms.js" */

/**
 * @typedef {object} Component
 * @property {string} name the message key of its name (a slot's title, a screen reader's name)
 * @property {(host: HTMLElement) => void} mount make its elements inside the host
 * @property {(state: AppState) => readonly unknown[]} watch the parts of the state it shows
 * @property {(state: AppState) => void} update draw them (also after a resize)
 * @property {() => void} unmount take its elements and listeners away
 */

/**
 * Where a component is: its host, and the way to take it away again.
 * @typedef {object} Placed
 * @property {Component} component
 * @property {HTMLElement} host
 * @property {() => void} unmount
 */

/**
 * Mount a component in a host, keep it drawn, and give the way to unmount it.
 * @param {Component} component
 * @param {HTMLElement} host
 * @param {AppStore} store
 * @returns {Placed}
 */
export function place(component, host, store) {
  component.mount(host);
  const draw = () => component.update(store.state);
  const unwatch = store.watch(component.watch, draw);
  // A resize redraws (the views draw to their host's size). The first report comes when the
  // host is laid out: a component placed before its host was in the page draws then.
  const resized = new ResizeObserver(draw);
  resized.observe(host);
  draw();
  return {
    component,
    host,
    unmount() {
      resized.disconnect();
      unwatch();
      component.unmount();
    },
  };
}

/**
 * The loom a component shows: its own, if it was made for one, or the current one.
 * @param {AppState} state
 * @param {LoomId | undefined} id
 * @returns {LoomState}
 */
export const loomOf = (state, id) => state.looms[id ?? state.current];

/**
 * Whether a host is shown (a view in a hidden slot does not draw; it draws when shown, since
 * its size changes).
 * @param {HTMLElement} host
 */
export const shown = (host) => host.offsetParent !== null || getComputedStyle(host).position === "fixed";
