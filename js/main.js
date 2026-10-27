// The main app (design/public-app.md): one store, the language, the frame (js/app/shell.js),
// and a link, if the page was opened with one (design/links.md), or else the workspace last
// used (a newcomer's: Learn); with ?selftest, its checks.

import { chooseLanguage, initialLanguage } from "./app/language.js";
import { openLearn, openingWorkspace, watchWorkspace } from "./app/learn.js";
import { openLink } from "./app/links.js";
import { appState, setViews } from "./app/looms.js";
import { createShell, openingViews } from "./app/shell.js";
import { Store } from "./app/store.js";

const store = new Store(appState());
await chooseLanguage(store, initialLanguage());
setViews(store, openingViews());
// Without a link, the app opens where it was left on this device; a newcomer, on Learn. A link
// that cannot be read opens Weave, whose status line says why.
const linked = await openLink(store, location.hash);
if (!linked && location.hash.length <= 1 && openingWorkspace() === "learn") openLearn(store);
watchWorkspace(store);
const shell = createShell(store, /** @type {HTMLElement} */ (document.getElementById("app")));
window.addEventListener("hashchange", () => openLink(store, location.hash));

// With ?selftest, M6's and M7's checks run on the app (design/m6-notes.md, design/m7-notes.md).
if (new URLSearchParams(location.search).has("selftest")) {
  const [{ runM6Checks }, { runM7Checks }, { showSelftest }] = await Promise.all([import("./accept/m6Checks.js"), import("./accept/m7Checks.js"), import("./accept/selftestPanel.js")]);
  const t0 = performance.now();
  const results = [...(await runM6Checks({ store, shell })), ...(await runM7Checks({ store, shell }))];
  showSelftest(document.body, results, performance.now() - t0);
}
