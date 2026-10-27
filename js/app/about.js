// The About dialog (design/ui-layout.md §4, the app's one dialog; as the sibling's, its U8): a
// title band with its close button, then the logo, the name and version, what the simulator is
// and how faithful, the credits, the licences and the link to the source.

import { t } from "../l10n/l10n.js";
import { el, icon, setTip } from "../ui/components.js";
import pkg from "../../package.json" with { type: "json" };

const V = new URL(import.meta.url).search;

const LICENCES = ["about.licence.code", "about.licence.content", "about.licence.three", "about.licence.font", "about.licence.icons", "about.licence.sounds"];

/** Open the About dialog; it goes away when closed. */
export function showAbout() {
  const close = el("button", { type: "button", class: "btn icon-only dialog-close" }, [icon("close")]);
  setTip(close, t("about.close"));
  const dialog = el("dialog", { class: "about", "aria-labelledby": "about-title" }, [
    el("div", { class: "dialog-head" }, [el("h2", { class: "dialog-title", id: "about-title", text: t("about.title") }), close]),
    el("div", { class: "dialog-body" }, [
      el("img", { class: "dialog-logo", src: `images/logo.svg${V}`, alt: "", width: "80", height: "64", draggable: "false" }),
      el("p", { class: "dialog-name", text: t("app.title") }),
      el("p", { text: t("about.version", { version: pkg.version }) }),
      el("p", { text: t("about.what") }),
      el("p", { text: t("about.faithful") }),
      el("h3", { text: t("about.credits") }),
      el("p", { text: t("about.credits.text") }),
      el("h3", { text: t("about.licences") }),
      el("ul", {}, LICENCES.map((k) => el("li", { text: t(k) }))),
      el("p", { class: "dialog-source" }, [icon("code"), el("a", { href: "https://github.com/wixette/jacquard-loom-simulator", target: "_blank", rel: "noopener", text: t("about.source") })]),
    ]),
  ]);
  close.addEventListener("click", () => dialog.close());
  // A press and release both on the dimmed backdrop also close it (the padding is on the inner
  // parts, so only the backdrop is the <dialog> itself); a text selection dragged out does not.
  let pressedOut = false;
  dialog.addEventListener("pointerdown", (e) => {
    pressedOut = e.target === dialog;
  });
  dialog.addEventListener("click", (e) => {
    if (pressedOut && e.target === dialog) dialog.close();
    pressedOut = false;
  });
  dialog.addEventListener("close", () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
}
