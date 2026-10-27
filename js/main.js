// The main app (design/public-app.md): one store, the language, the frame (js/app/shell.js),
// and a link, if the page was opened with one (design/links.md); with ?selftest, its checks.

import { chooseLanguage, initialLanguage } from "./app/language.js";
import { openLink } from "./app/links.js";
import { appState, setViews } from "./app/looms.js";
import { createShell, openingViews } from "./app/shell.js";
import { Store } from "./app/store.js";

const store = new Store(appState());
await chooseLanguage(store, initialLanguage());
setViews(store, openingViews());
await openLink(store, location.hash);
const shell = createShell(store, /** @type {HTMLElement} */ (document.getElementById("app")));
window.addEventListener("hashchange", () => openLink(store, location.hash));

// With ?selftest, M6's checks run on the app (design/m6-notes.md).
if (new URLSearchParams(location.search).has("selftest")) {
  const [{ runM6Checks }, { showSelftest }] = await Promise.all([import("./accept/m6Checks.js"), import("./accept/selftestPanel.js")]);
  const t0 = performance.now();
  const results = await runM6Checks({ store, shell });
  showSelftest(document.body, results, performance.now() - t0);
}
