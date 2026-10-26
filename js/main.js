// The main app (design/public-app.md): one store, the language, the frame (js/app/shell.js),
// and a link, if the page was opened with one (design/links.md).

import { chooseLanguage, initialLanguage } from "./app/language.js";
import { openLink } from "./app/links.js";
import { appState } from "./app/looms.js";
import { createShell } from "./app/shell.js";
import { Store } from "./app/store.js";

const store = new Store(appState());
await chooseLanguage(store, initialLanguage());
await openLink(store, location.hash);
createShell(store, /** @type {HTMLElement} */ (document.getElementById("app")));
window.addEventListener("hashchange", () => openLink(store, location.hash));
