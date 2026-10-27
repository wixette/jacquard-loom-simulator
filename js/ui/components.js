// The interface's components (docs/ui-design.md, P10): icons, elements, translated texts and
// tooltips, menus and tabs. One of each kind, used the same way everywhere, following Material
// Design 3's patterns and WAI-ARIA's keyboard rules. (From the Stepped Reckoner's
// js/ui/components.js.)

import { ICONS } from "../../vendor/material-symbols/icons.js";
import { t } from "../l10n/l10n.js";

/** @typedef {keyof typeof ICONS} IconName */

const SVG = "http://www.w3.org/2000/svg";

/**
 * A Material Symbol as an inline SVG element, in the current text colour.
 * @param {IconName} name
 * @returns {SVGSVGElement}
 */
export function icon(name) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 -960 960 960");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", ICONS[name]);
  svg.appendChild(path);
  return svg;
}

/**
 * An element with attributes and children.
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Record<string, string | boolean | undefined>} [attrs]
 * @param {(Node | string | null | undefined)[]} [children]
 * @returns {HTMLElementTagNameMap[K]}
 */
export function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === "class") e.className = String(v);
    else if (k === "text") e.textContent = String(v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children) if (c !== null && c !== undefined) e.append(c);
  return e;
}

/**
 * Set an element's text only when it differs: a part of the page written on every frame while
 * the loom plays would otherwise be replaced under the pointer, and a click on it lost.
 * @param {Element} e
 * @param {string} text
 */
export function setText(e, text) {
  if (e.textContent !== text) e.textContent = text;
}

/**
 * A click on a part of something drawn anew as the loom moves (a drawing every frame while it
 * plays, the chain at every card): the part is read when it is pressed, and the press counts as
 * a click when it is let go on the same root close by, so a redraw between the two cannot lose
 * it (a browser drops a click whose press and release fall on different elements). A click with
 * no press before it (a key's: Enter on a hole, the F key, a check's) counts as well, once.
 * @param {Element} svg the root, which is not redrawn
 * @param {(part: Element) => void} run
 * @returns {() => void} the way to take the listeners away
 */
export function onPress(svg, run) {
  /** @type {{ target: Element; x: number; y: number; id: number } | null} */
  let down = null;
  let handled = false;
  const press = (/** @type {PointerEvent} */ e) => {
    down = e.button === 0 ? { target: /** @type {Element} */ (e.target), x: e.clientX, y: e.clientY, id: e.pointerId } : null;
  };
  const release = (/** @type {PointerEvent} */ e) => {
    const d = down;
    down = null;
    if (!d || e.pointerId !== d.id || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    run(d.target);
    // the click that follows, when the part was not redrawn, is the same press
    handled = true;
    setTimeout(() => (handled = false), 0);
  };
  const click = (/** @type {MouseEvent} */ e) => {
    if (!handled) run(/** @type {Element} */ (e.target));
  };
  const root = /** @type {HTMLElement} */ (svg);
  root.addEventListener("pointerdown", press);
  root.addEventListener("pointerup", release);
  root.addEventListener("click", click);
  return () => {
    root.removeEventListener("pointerdown", press);
    root.removeEventListener("pointerup", release);
    root.removeEventListener("click", click);
  };
}

/**
 * Replace each <i data-icon="name"> placeholder under root with its icon.
 * @param {ParentNode} root
 */
export function applyIcons(root) {
  for (const i of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("i[data-icon]"))) {
    i.replaceWith(icon(/** @type {IconName} */ (i.dataset.icon)));
  }
}

/**
 * Translate the texts under root: data-l10n sets the text, data-l10n-tip the tooltip and the
 * screen-reader name (an icon button's only name), data-l10n-name the name alone.
 * @param {ParentNode} root
 */
export function applyL10n(root) {
  for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-l10n]"))) setText(e, t(/** @type {string} */ (e.dataset.l10n)));
  for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-l10n-tip]"))) setTip(e, t(/** @type {string} */ (e.dataset.l10nTip)));
  for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-l10n-name]"))) e.setAttribute("aria-label", t(/** @type {string} */ (e.dataset.l10nName)));
}

// ---- tooltips ---------------------------------------------------------------------------------
/** @type {HTMLElement | null} */
let tipBox = null;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let tipTimer;

/**
 * Give an element a tooltip (shown on hover and keyboard focus) and a screen-reader name. An
 * element with its own visible label (data-tip-describes: a text button, a labelled field) keeps
 * that label as its name, and the tooltip describes it.
 * @param {HTMLElement} e
 * @param {string} text
 */
export function setTip(e, text) {
  e.dataset.tip = text;
  e.setAttribute(e.hasAttribute("data-tip-describes") ? "aria-description" : "aria-label", text);
  if (e.dataset.tipBound) return;
  e.dataset.tipBound = "1";
  const show = () => {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => {
      if (!e.isConnected || !e.dataset.tip) return;
      tipBox ??= document.body.appendChild(el("div", { class: "tooltip", role: "presentation" }));
      tipBox.textContent = e.dataset.tip;
      tipBox.hidden = false;
      const r = e.getBoundingClientRect();
      const b = tipBox.getBoundingClientRect();
      const below = r.bottom + 8 + b.height < window.innerHeight;
      tipBox.style.top = `${below ? r.bottom + 8 : r.top - 8 - b.height}px`;
      tipBox.style.left = `${Math.max(8, Math.min(window.innerWidth - b.width - 8, r.left + r.width / 2 - b.width / 2))}px`;
    }, 450);
  };
  const hide = () => {
    clearTimeout(tipTimer);
    if (tipBox) tipBox.hidden = true;
  };
  e.addEventListener("pointerenter", (ev) => ev.pointerType === "mouse" && show());
  e.addEventListener("pointerleave", hide);
  e.addEventListener("focus", () => e.matches(":focus-visible") && show());
  e.addEventListener("blur", hide);
  e.addEventListener("click", hide);
}

// ---- menus ------------------------------------------------------------------------------------
/**
 * @typedef {object} MenuItem
 * @property {string} label
 * @property {() => void} run
 * @property {boolean} [checked] shown with a check (a choice among several)
 * @property {boolean} [toggle] an on/off switch (checked shows a ticked box), not a choice
 * @property {string | true} [divider] a line before the item, headed by the text if one is given
 * @property {string} [lang] the item's own language (the language menu)
 */

/** @type {{ box: HTMLElement; anchor: HTMLElement } | null} */
let openMenu = null;

/** Close the open menu, if any. */
export function closeMenu() {
  if (!openMenu) return;
  const { box, anchor } = openMenu;
  openMenu = null;
  box.remove();
  anchor.setAttribute("aria-expanded", "false");
}

/**
 * Open a menu under (or above) an anchor button. Arrow keys move, Enter or Space choose,
 * Escape and a click outside close it.
 * @param {HTMLElement} anchor
 * @param {MenuItem[]} items
 */
export function showMenu(anchor, items) {
  const again = openMenu?.anchor === anchor;
  closeMenu();
  if (again) return;
  const box = el("div", { class: "menu", role: "menu" });
  const buttons = items.map((it) => {
    if (it.divider) box.appendChild(el("div", { class: "menu-divider", role: "separator" }, [typeof it.divider === "string" ? el("span", { text: it.divider }) : null]));
    const role = it.checked === undefined ? "menuitem" : it.toggle ? "menuitemcheckbox" : "menuitemradio";
    const mark = it.checked === undefined ? null : it.toggle ? icon(it.checked ? "check_box" : "check_box_outline_blank") : it.checked ? icon("check") : el("span", { class: "check" });
    const b = el("button", { role, tabindex: "-1", lang: it.lang }, [mark, el("span", { text: it.label })]);
    if (it.checked !== undefined) b.setAttribute("aria-checked", String(it.checked));
    b.addEventListener("click", () => {
      closeMenu();
      anchor.focus();
      it.run();
    });
    box.appendChild(b);
    return b;
  });
  document.body.appendChild(box);
  openMenu = { box, anchor };
  anchor.setAttribute("aria-expanded", "true");
  const r = anchor.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const below = r.bottom + 4 + b.height <= window.innerHeight - 8;
  box.style.top = `${below ? r.bottom + 4 : Math.max(8, r.top - 4 - b.height)}px`;
  // open towards the middle of the window: from the anchor's left edge, or its right edge on the right
  const left = r.left + r.width / 2 > window.innerWidth / 2 ? r.right - b.width : r.left;
  box.style.left = `${Math.max(8, Math.min(window.innerWidth - b.width - 8, left))}px`;
  const start = Math.max(0, items.findIndex((it) => it.checked && !it.toggle));
  buttons[start]?.focus();
  box.addEventListener("keydown", (e) => {
    const i = buttons.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(i + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length].focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      buttons[e.key === "Home" ? 0 : buttons.length - 1].focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      closeMenu();
      anchor.focus();
    }
  });
}

document.addEventListener("pointerdown", (e) => {
  if (openMenu && !openMenu.box.contains(/** @type {Node} */ (e.target)) && !openMenu.anchor.contains(/** @type {Node} */ (e.target))) closeMenu();
});
window.addEventListener("resize", closeMenu);

// ---- tabs (WAI-ARIA tabs, automatic activation) -------------------------------------------------
/**
 * @param {HTMLElement} list the role="tablist" element
 * @param {(id: string) => void} onSelect called with the selected tab's id
 * @returns {(id: string) => void} selects a tab by id
 */
export function tabs(list, onSelect) {
  const all = /** @type {HTMLButtonElement[]} */ ([...list.querySelectorAll('[role="tab"]')]);
  /** @param {string} id */
  const select = (id) => {
    for (const tab of all) {
      const on = tab.id === id;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(/** @type {string} */ (tab.getAttribute("aria-controls")));
      if (panel) panel.hidden = !on;
    }
    onSelect(id);
  };
  for (const tab of all) tab.addEventListener("click", () => select(tab.id));
  list.addEventListener("keydown", (e) => {
    const i = all.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    if (i < 0) return;
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % all.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + all.length) % all.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = all.length - 1;
    if (j < 0) return;
    e.preventDefault();
    all[j].focus();
    select(all[j].id);
  });
  return select;
}
