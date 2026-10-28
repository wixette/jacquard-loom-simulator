// The main app (design/public-app.md): one store, the language, the frame (js/app/shell.js),
// and a link, if the page was opened with one (design/links.md), or else the workspace last
// used (a newcomer's: Learn); with ?selftest, its checks.

import { chooseLanguage, initialLanguage } from "./app/language.js";
import { openLearn, openingWorkspace, watchWorkspace } from "./app/learn.js";
import { openCreate, watchPicture } from "./app/create.js";
import { openLink } from "./app/links.js";
import { appState, setViews } from "./app/looms.js";
import { openPlay, rememberedGame, watchGame } from "./app/play.js";
import { createShell, openingViews } from "./app/shell.js";
import { Store } from "./app/store.js";

const store = new Store(appState());
await chooseLanguage(store, initialLanguage());
setViews(store, openingViews());
// Without a link, the app opens where it was left on this device; a newcomer, on Learn. A link
// that cannot be read opens Weave, whose status line says why.
// Design's picture is kept from the start, so a link's picture is the one Design keeps
watchPicture(store);
const linked = await openLink(store, location.hash);
if (!linked && location.hash.length <= 1) {
  const w = openingWorkspace();
  if (w === "learn") openLearn(store);
  else if (w === "create") openCreate(store);
  else if (w === "play") openPlay(store, rememberedGame());
}
watchWorkspace(store);
watchGame(store);
const shell = createShell(store, /** @type {HTMLElement} */ (document.getElementById("app")));
window.addEventListener("hashchange", () => openLink(store, location.hash));

// With ?selftest, M6's to M9's checks run on the app (design/m6-notes.md to design/m9-notes.md).
// With ?debug, the app's store and frame for the tools that drive the page (tools/shots.mjs,
// tools/video.mjs: the sound to log, the looms to set up).
if (new URLSearchParams(location.search).has("debug")) /** @type {any} */ (window).app = { store, shell };

if (new URLSearchParams(location.search).has("selftest")) {
  const [{ runM6Checks }, { runM7Checks }, { runM8Checks }, { runM9Checks }, { showSelftest }] = await Promise.all([import("./accept/m6Checks.js"), import("./accept/m7Checks.js"), import("./accept/m8Checks.js"), import("./accept/m9Checks.js"), import("./accept/selftestPanel.js")]);
  // what this device keeps (the picture, the tutorial's place, the tab…) is given back after the
  // checks, which change it: a teacher running them keeps their drawing
  /** @type {[string, string][]} */
  let kept = [];
  try {
    kept = Object.keys(localStorage).filter((k) => k.startsWith("jacquard.")).map((k) => [k, /** @type {string} */ (localStorage.getItem(k))]);
  } catch {
    // nothing kept to give back
  }
  const t0 = performance.now();
  try {
    const results = [...(await runM6Checks({ store, shell })), ...(await runM7Checks({ store, shell })), ...(await runM8Checks({ store, shell })), ...(await runM9Checks({ store, shell }))];
    showSelftest(document.body, results, performance.now() - t0);
  } finally {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("jacquard.")) localStorage.removeItem(k);
      for (const [k, v] of kept) localStorage.setItem(k, v);
    } catch {
      // not given back
    }
  }
}
