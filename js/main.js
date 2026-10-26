// The main app (design/public-app.md): one store, the language, the frame (js/app/shell.js),
// and a link, if the page was opened with one (design/links.md).

import { chooseLanguage, initialLanguage } from "./app/language.js";
import { openLink } from "./app/links.js";
import { appState, setViews } from "./app/looms.js";
import { createShell, openingViews } from "./app/shell.js";
import { Store } from "./app/store.js";

const store = new Store(appState());
await chooseLanguage(store, initialLanguage());
setViews(store, openingViews());
await openLink(store, location.hash);
createShell(store, /** @type {HTMLElement} */ (document.getElementById("app")));
window.addEventListener("hashchange", () => openLink(store, location.hash));
