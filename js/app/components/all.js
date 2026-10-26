// Every component of the app, by the name a layout gives its slot (design/ui-layout.md §1):
// the machine's views, and the panels around them.

import { benchPanel, chainPanel, clothPanel, statusPanel, tracePanel, transportPanel } from "./panels.js";
import { frontView, sectionView, sideView, unitsView } from "./views.js";
/** @import { AppStore, LoomId } from "../looms.js" */
/** @import { Component } from "./component.js" */

/** @type {Record<string, (store: AppStore, o?: { loom?: LoomId }) => Component>} */
export const COMPONENTS = {
  section: sectionView,
  side: sideView,
  front: frontView,
  units: unitsView,
  cloth: clothPanel,
  chain: chainPanel,
  bench: benchPanel,
  transport: transportPanel,
  status: statusPanel,
  trace: tracePanel,
};

/** @typedef {keyof typeof COMPONENTS} ComponentName */
