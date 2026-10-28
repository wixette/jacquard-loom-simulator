// The main app's frame (design/ui-layout.md): where each component goes, on a desktop and on a
// phone. The components are the same everywhere (js/app/components/); only their slots change.
// A desktop (1024 px wide or more) has the top bar, the program on the left, the stage in the
// middle with its caption under it, the output on the right, and the player (the moments and the
// controls) along the whole window's bottom, as it drives all three; a phone has the stage on top, the
// transport under it and a bottom sheet with the rest; a phone turned on its side has the stage
// on the left and the sheet beside it. The frame is built again when the screen changes kind or
// the workspace changes; its own texts follow the language without a rebuild.

import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, msg, say as words, t, tn } from "../l10n/l10n.js";
import { HOOK_COUNTS, PRESETS } from "../sim/deck.js";
import { encodeLink, LONG_LINK, STAGE_VIEWS } from "../sim/link.js";
import { linkOf } from "./links.js";
import { tieLabel } from "../sim/tieup.js";
import { fitsPage, printDocument } from "../teach/printCards.js";
import { realCard } from "../view2d/cardLayout.js";
import { ClothView } from "../view2d/clothView.js";
import { applyIcons, applyL10n, el, icon, setText, setTip, showMenu, showPopover, tabs } from "../ui/components.js";
import { colourPicker } from "../ui/colourPicker.js";
import { wireEdge } from "../ui/edge.js";
import { showAbout } from "./about.js";
import { wireKeys } from "./keys.js";
import { Sound } from "./sound.js";
import { place } from "./components/component.js";
import { benchPanel, chainPanel, clothPanel, statusPanel, tracePanel, transportPanel } from "./components/panels.js";
import { frontView, labelsShown, sectionView, setLabels, sideView, UNIT_VIEWS, unitsView } from "./components/views.js";
import { chooseLanguage } from "./language.js";
import { leaveLearn, openLearn, watchDone } from "./learn.js";
import { openCreate } from "./create.js";
import { picturePanel } from "./components/picture.js";
import { gamesPanel } from "./components/games.js";
import { openPlay } from "./play.js";
import { guidePanel } from "./components/guide.js";
import { allowedAt, shownAt, STEPS } from "../teach/tutorial.js";
import { arrange, choose, is3d, placeKey, SPLIT } from "./arrange.js";
import * as act from "./looms.js";
import { TIES, tieKey } from "./looms.js";
/** @import { AppStore, StageView, Workspace } from "./looms.js" */
/** @import { UnitId } from "../scene/units.js" */
/** @import { Component, Placed } from "./components/component.js" */
/** @import { IconName } from "../ui/components.js" */
/** @import { Edge } from "../ui/edge.js" */
/** @import { Control } from "../teach/tutorial.js" */

/** @typedef {"desktop" | "phone" | "landscape"} Mode */

/** What kind of screen this is: its width, and on a phone its orientation. */
export function modeOf() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w >= 1024) return /** @type {Mode} */ ("desktop");
  if (w > h && h < 520) return /** @type {Mode} */ ("landscape");
  return /** @type {Mode} */ ("phone");
}

/** The views in the order of the view menu: the 2D drawings, the 3D models, then the cloth. */
const MENU_VIEWS = /** @type {const} */ (["section", "side", "front", "3d", "u1", "u2", "u3", "u4", "u5", "cloth"]);

/** The workspaces of this release, in the order the bar shows them. */
const WORKSPACES = /** @type {const} */ (["learn", "weave", "create", "play"]);

/**
 * A view's component.
 * @param {AppStore} store
 * @param {StageView} v
 * @param {(unit: "machine" | UnitId) => void} [onMode] a 3D view's: what it shows, as that changes
 * @returns {Component}
 */
function viewComponent(store, v, onMode) {
  if (v === "cloth") return clothPanel(store, { large: true });
  if (v === "section") return sectionView(store);
  if (v === "side") return sideView(store);
  if (v === "front") return frontView(store);
  return unitsView(store, { unit: UNIT_VIEWS[/** @type {keyof typeof UNIT_VIEWS} */ (v)].unit, onMode });
}

/** The side panels' sizes (px): the smallest, the largest and the default (design/ui-layout.md §4). */
const PANEL = { left: { min: 260, max: 480, size: 320 }, right: { min: 280, max: 520, size: 340 } };
/** What the stage keeps at least beside the panels (px). */
const STAGE_MIN = 560;

/** The narrowest stage that holds two views side by side (each about as wide as a laptop's one). */
const TWO_VIEWS = 1040;

/**
 * Ready-made pairs of warp and weft colours, by the key of their names (colours.pair.*): the
 * opening pair first, then pairs of the dyes and silks of the period.
 * @type {Record<string, [string, string]>}
 */
const COLOUR_PAIRS = {
  start: ["#5b3f8c", "#efe3c2"],
  indigo: ["#25386b", "#f2efe6"],
  madder: ["#9b2d30", "#e8c16a"],
  black: ["#1f1f22", "#f4f1ea"],
  green: ["#2f5d46", "#e9dfb8"],
  silver: ["#7d8794", "#2a3247"],
};

const SVGNS = "http://www.w3.org/2000/svg";

/**
 * The two colours as a paint program shows them: the warp's square in front, the weft's behind.
 * @param {string} warp
 * @param {string} weft
 * @returns {SVGSVGElement}
 */
function pairSwatch(warp, weft) {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon pair-swatch");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<rect class="weft" x="9" y="9" width="12.5" height="12.5" rx="2.5" fill="${weft}"/><rect class="warp" x="2.5" y="2.5" width="12.5" height="12.5" rx="2.5" fill="${warp}"/>`;
  return svg;
}

/**
 * A small piece of 2/2 twill in two colours: 12 ends and 6 picks, the warp where it lies over
 * the weft.
 * @param {string} warp
 * @param {string} weft
 * @returns {SVGSVGElement}
 */
function twillSample(warp, weft) {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "0 0 12 6");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  let cells = `<rect width="12" height="6" fill="${weft}"/>`;
  for (let p = 0; p < 6; p++) for (let e = 0; e < 12; e++) if ((e + p) % 4 < 2) cells += `<rect x="${e}" y="${5 - p}" width="1" height="1" fill="${warp}"/>`;
  svg.innerHTML = cells;
  return svg;
}

/**
 * A view's name: on its chip, a 2D drawing by its short name and a 3D model as "3D · its name";
 * in the view menu (long), under its group's heading, a 2D drawing by its full name and a 3D
 * model by its own.
 * @param {StageView} v
 * @param {boolean} [long]
 */
const viewName = (v, long = false) => (is3d(v) ? (long ? t(`view.${v}`) : t("view.in3d", { name: t(`view.${v}`) })) : long ? t(`comp.${v}`) : t(`view.${v}`));

/**
 * The views Weave opens with when no link names them: two where the stage holds them, else one.
 * @returns {StageView[]}
 */
export function openingViews() {
  const stage = window.innerWidth - PANEL.left.size - PANEL.right.size - 2;
  return modeOf() === "desktop" && stage >= TWO_VIEWS ? SPLIT[2] : SPLIT[1];
}

/**
 * @param {AppStore} store
 * @param {HTMLElement} root
 */
export function createShell(store, root) {
  /** @type {Placed[]} */
  let placed = [];
  /** @type {(() => void)[]} */
  let unwatch = [];
  /** @type {Mode | null} */
  let mode = null;
  /** The phone sheet's tab on show, kept across a rebuild. @type {string | null} */
  let sheetTab = null;

  /**
   * Put a component in a host.
   * @param {Component} c
   * @param {HTMLElement} host
   */
  const put = (c, host) => placed.push(place(c, host, store));
  /**
   * Keep a part of the frame up to date with the state.
   * @param {(s: import("./looms.js").AppState) => readonly unknown[]} select
   * @param {() => void} run
   */
  const follow = (select, run) => {
    unwatch.push(store.watch(select, run));
    run();
  };
  /**
   * Make the panes anew: the old ones' components and watchers are taken away first, and the new
   * ones' are returned, to be taken away in their turn.
   * @param {{ placed: Placed[]; unwatch: (() => void)[] }} old
   * @param {() => HTMLElement[]} make
   */
  const remake = (old, make) => {
    for (const p of old.placed) p.unmount();
    for (const u of old.unwatch) u();
    placed = placed.filter((x) => !old.placed.includes(x));
    unwatch = unwatch.filter((x) => !old.unwatch.includes(x));
    const [p0, u0] = [placed.length, unwatch.length];
    const nodes = make();
    return { nodes, mine: { placed: placed.slice(p0), unwatch: unwatch.slice(u0) } };
  };
  const ls = () => store.state.looms[store.state.current];
  const sound = new Sound(store);
  /** The side panels' edges, while the desktop frame is up. @type {Partial<Record<"left" | "right", Edge>>} */
  let edges = {};

  /**
   * An icon button with its tooltip and name.
   * @param {IconName} name
   * @param {string} tip a message key
   * @param {() => void} run
   * @param {string} [cls]
   */
  function iconButton(name, tip, run, cls = "btn icon-only") {
    const b = el("button", { type: "button", class: cls }, [icon(name)]);
    b.dataset.l10nTip = tip;
    b.addEventListener("click", run);
    return b;
  }

  /**
   * A text in the frame, kept in the store's language.
   * @param {keyof HTMLElementTagNameMap} tag
   * @param {string} key
   * @param {Record<string, string>} [attrs]
   */
  function label(tag, key, attrs = {}) {
    const e = el(tag, attrs);
    e.dataset.l10n = key;
    return e;
  }

  /** The frame's own texts and tooltips, in the store's language. */
  function relabel() {
    applyL10n(root);
    document.title = t("app.title");
  }

  // ---- the parts of the frame ------------------------------------------------------------------

  function brand() {
    // named even where its words are hidden (a phone shows the logo alone)
    return el("a", { class: "brand", href: "./", "data-l10n-name": "app.name" }, [el("img", { src: "images/logo.svg", alt: "", draggable: "false" }), label("span", "app.name")]);
  }

  /** @param {HTMLElement} anchor */
  function languageMenu(anchor) {
    showMenu(
      anchor,
      LOCALES.map((l) => ({ label: LOCALE_NAMES[l], lang: l, checked: l === store.state.locale, run: () => chooseLanguage(store, l, { keep: true }) })),
    );
  }

  /** @param {HTMLElement} anchor */
  function shareMenu(anchor) {
    showMenu(anchor, [
      { label: t("share.link"), run: copyLink },
      { label: t("share.picture"), run: savePicture },
      { label: t("share.print"), run: printCards },
    ]);
  }

  async function copyLink() {
    const fragment = await encodeLink(linkOf(store));
    history.replaceState(null, "", `#${fragment}`);
    const url = location.href;
    const done = url.length > LONG_LINK ? { key: "status.linkLong", params: { n: url.length } } : { key: "status.linkCopied" };
    navigator.clipboard?.writeText(url).then(
      () => act.say(store, done),
      () => act.say(store, { key: "status.linkReady", params: { n: url.length } }),
    );
  }

  function savePicture() {
    // drawn afresh, off the page, from the loom as it is: not whichever cloth the page shows
    // (one in a closed panel is blank or old; a phone's Cards tab has none)
    const s = ls();
    const host = el("div", { style: "position: fixed; left: -10000px; top: 0; width: 900px" });
    document.body.appendChild(host);
    const view = new ClothView(host, { onCell: () => {} });
    view.render(s.loom.snapshot(), { face: s.face, warp: s.warp, weft: s.weft, bits: false, trace: null, large: true });
    const canvas = view.canvas;
    host.remove();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = el("a", { href: URL.createObjectURL(blob), download: "jacquard-cloth.png" });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      act.say(store, { key: "share.saved" });
    });
  }

  function printCards() {
    const deck = ls().loom.deck;
    const rc = realCard(deck.hooks);
    const size = { hooks: deck.hooks, w: rc.width.toFixed(1), h: rc.height.toFixed(1) };
    // a 400 head's card is wider than the paper: it cannot be printed at its true size
    if (!fitsPage(deck.hooks)) return act.say(store, { key: "share.tooWide", params: size }, true);
    const note = tn("print.note", deck.cards.length, size);
    const url = URL.createObjectURL(new Blob([printDocument(deck, t("app.title"), { note, lang: store.state.locale })], { type: "text/html" }));
    const w = window.open(url, "_blank");
    act.say(store, w ? { key: "share.printed", n: deck.cards.length } : { key: "share.blocked" }, !w);
  }

  /** The head and its tie-up, from the chip over the cards. @param {HTMLElement} anchor */
  function setupPopover(anchor) {
    const s = ls();
    const hooks = el("select", { id: "setup-hooks" });
    for (const n of HOOK_COUNTS) hooks.add(new Option(tn("hooks.option", n / 8, { hooks: n }), String(n)));
    hooks.value = String(s.loom.deck.hooks);
    hooks.addEventListener("change", () => act.setHooks(store, Number(hooks.value)));
    const tie = el("select", { id: "setup-tie" });
    for (const [key, ti] of Object.entries(TIES)) tie.add(new Option(words(tieLabel(ti)), key));
    tie.value = tieKey(s.loom.tie);
    tie.addEventListener("change", () => act.setTie(store, TIES[tie.value]));
    showPopover(anchor, "setup", t("setup.tip"), [el("label", { for: "setup-hooks", text: t("setup.hooks") }), hooks, el("label", { for: "setup-tie", text: t("setup.tie") }), tie]);
  }

  /**
   * The cloth's colours, from the button over the cloth: the two threads, one of them chosen
   * for the picker below them (the page's own: js/ui/colourPicker.js), a swap, ready-made pairs
   * and Reset, all in one popover.
   * @param {HTMLElement} anchor
   */
  function coloursPopover(anchor) {
    // pressed again, its button shuts it, before anything (a watcher) is set up for a new one
    const open = document.querySelector('.popover[data-for="colours"]');
    if (open) return void open.dispatchEvent(new Event("shut"));
    /** @type {"warp" | "weft"} */
    let editing = "warp";
    const picker = colourPicker({
      value: ls().warp,
      onInput: (hex) => act.setColours(store, { [editing]: hex }),
      names: { area: t("colours.area"), hue: t("colours.hue"), hex: t("colours.hex"), areaValue: (sat, val) => t("colours.areaValue", { s: sat, v: val }) },
    });
    /**
     * One thread's row, a button that gives it to the picker: its swatch, its name and what it
     * is, and its value as hex.
     * @param {"warp" | "weft"} thread
     */
    const row = (thread) => {
      const swatch = el("span", { class: "swatch", "aria-hidden": "true" });
      const hex = el("span", { class: "hex" });
      const line = el("button", { type: "button", class: "colour-row", id: `colour-${thread}` }, [
        swatch,
        el("span", { class: "colour-text" }, [el("span", { class: "colour-name", text: t(`setup.${thread}`) }), el("span", { class: "colour-hint", text: t(`colours.${thread}Hint`) })]),
        hex,
      ]);
      line.addEventListener("click", () => {
        editing = thread;
        show();
      });
      return { line, swatch, hex, thread };
    };
    const rows = [row("warp"), row("weft")];
    const swap = el("button", { type: "button", class: "btn icon-only swap" }, [icon("swap_vert")]);
    setTip(swap, t("colours.swap"));
    swap.addEventListener("click", () => act.setColours(store, { warp: ls().weft, weft: ls().warp }));
    const pairs = el("div", { class: "colour-pairs", role: "group", "aria-label": t("colours.pairs") });
    for (const [key, [warp, weft]] of Object.entries(COLOUR_PAIRS)) {
      const b = el("button", { type: "button", class: "pair", "aria-label": t(`colours.pair.${key}`) }, [pairSwatch(warp, weft)]);
      setTip(b, t(`colours.pair.${key}`));
      b.dataset.pair = key;
      b.addEventListener("click", () => act.setColours(store, { warp, weft }));
      pairs.append(b);
    }
    const again = el("button", { type: "button", class: "btn", text: t("colours.reset") });
    again.addEventListener("click", () => act.setColours(store, { warp: act.WARP, weft: act.WEFT }));
    // a few rows of twill in the two colours: the cloth as the colours change, which the panel
    // would otherwise hide
    const sample = el("span", { class: "colour-sample", role: "img", "aria-label": t("colours.sample") });
    // the panel follows the colours however they change: the picker, the swap, a pair, Reset
    const show = () => {
      const s = ls();
      sample.replaceChildren(twillSample(s.warp, s.weft));
      for (const r of rows) {
        r.swatch.style.background = s[r.thread];
        r.hex.textContent = s[r.thread].toUpperCase();
        r.line.setAttribute("aria-pressed", String(r.thread === editing));
      }
      picker.set(s[editing]);
      for (const b of /** @type {HTMLElement[]} */ ([...pairs.children])) {
        const [w, f] = COLOUR_PAIRS[/** @type {string} */ (b.dataset.pair)];
        b.setAttribute("aria-pressed", String(w === s.warp && f === s.weft));
      }
    };
    const unwatch = store.watch((st) => [st.looms[st.current].warp, st.looms[st.current].weft], show);
    showPopover(
      anchor,
      "colours",
      t("colours.tip"),
      [
        el("div", { class: "popover-head" }, [el("h3", { class: "popover-title", text: t("colours.title") }), sample]),
        el("div", { class: "colour-threads" }, [rows[0].line, swap, rows[1].line]),
        picker.element,
        el("p", { class: "popover-sub", text: t("colours.pairs") }),
        pairs,
        el("div", { class: "popover-foot" }, [again]),
      ],
      "colours-pop",
      unwatch,
    );
    show();
  }

  /**
   * Open a workspace: Learn at the tutorial's place, Weave as the learner left it, Create with
   * the learner's picture.
   * @param {Workspace} w
   */
  function goWorkspace(w) {
    if (w === store.state.workspace) return;
    if (w === "learn") openLearn(store);
    else if (w === "create") openCreate(store);
    else if (w === "play") openPlay(store);
    else leaveLearn(store);
  }

  /**
   * Mark a control that changes the cards or the loom, so that it greys while a step of the
   * tutorial locks it (P6: pressed, it says why in the status line).
   * @template {HTMLElement} E
   * @param {E} e
   * @param {Control} control
   * @returns {E}
   */
  function controls(e, control) {
    e.dataset.control = control;
    return e;
  }

  /** Grey the controls the step on show locks, on the tutorial's loom. */
  function greyLocked() {
    const s = store.state;
    const free = s.current === "tutorial" ? allowedAt(s.learn.step) : s.current === "create" || s.current === "game" ? ["colours", "picture"] : null;
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-control]"))) {
      const locked = free !== null && !free.includes(/** @type {Control} */ (e.dataset.control));
      e.classList.toggle("locked", locked);
      if (e instanceof HTMLButtonElement) e.setAttribute("aria-disabled", String(locked));
    }
  }

  function topbar() {
    const list = el("nav", { class: "workspaces tabs", role: "tablist", "data-l10n-name": "ws.name" });
    for (const w of WORKSPACES) {
      const tab = el("button", { type: "button", role: "tab", class: "tab", id: `ws-${w}` }, [label("span", `ws.${w}`)]);
      list.appendChild(tab);
    }
    tabs(list, (id) => goWorkspace(/** @type {Workspace} */ (id.slice(3))));
    for (const tab of /** @type {HTMLElement[]} */ ([...list.children])) {
      tab.setAttribute("aria-selected", String(tab.id === `ws-${store.state.workspace}`));
      tab.tabIndex = tab.id === `ws-${store.state.workspace}` ? 0 : -1;
    }
    const share = el("button", { type: "button", class: "btn has-icon", "aria-haspopup": "menu" }, [icon("share"), label("span", "bar.share")]);
    share.dataset.l10nTip = "bar.share.tip";
    share.setAttribute("data-tip-describes", "");
    share.addEventListener("click", () => shareMenu(share));
    const lang = el("button", { type: "button", class: "btn lang-btn", "aria-haspopup": "menu" });
    lang.dataset.l10nTip = "bar.language";
    lang.addEventListener("click", () => languageMenu(lang));
    follow((s) => [s.locale], () => lang.replaceChildren(icon("translate"), el("span", { text: LOCALE_SHORT[store.state.locale] })));
    return el("header", { class: "topbar" }, [brand(), list, el("span", { class: "spacer" }), share, lang, iconButton("info", "bar.about", showAbout)]);
  }

  function appbar() {
    const ws = el("select", { class: "ws", "data-l10n-name": "ws.name" });
    for (const w of WORKSPACES) ws.appendChild(label("option", `ws.${w}`, { value: w }));
    ws.value = store.state.workspace;
    ws.addEventListener("change", () => goWorkspace(/** @type {Workspace} */ (ws.value)));
    const menu = iconButton("menu", "bar.menu", () =>
      showMenu(menu, [
        { label: t("bar.language"), run: () => languageMenu(menu) },
        { label: t("bar.about"), run: showAbout },
      ]),
    );
    const share = iconButton("share", "bar.share.tip", () => shareMenu(share));
    return el("header", { class: "appbar" }, [brand(), ws, el("span", { class: "spacer" }), share, menu]);
  }

  /** The card tools, over the chain. */
  function cardTools() {
    const decks = controls(iconButton("menu_book", "cards.decks", () =>
      showMenu(
        decks,
        Object.entries(PRESETS).map(([key, p]) => ({ label: tn("preset.option", p.rows.length, { name: t(p.name) }), run: () => act.loadPreset(store, key) })),
      ),
    ), "cards");
    const loop = controls(iconButton("repeat", "cards.loop", () => act.lace(store, !ls().loom.deck.loop)), "loop");
    follow((s) => [s.looms[s.current].rev], () => loop.setAttribute("aria-pressed", String(ls().loom.deck.loop)));
    return [
      decks,
      ...[
        iconButton("add", "cards.add", () => act.add(store)),
        iconButton("content_copy", "cards.duplicate", () => act.duplicate(store)),
        iconButton("delete", "cards.remove", () => act.remove(store)),
        iconButton("arrow_upward", "cards.up", () => act.move(store, -1)),
        iconButton("arrow_downward", "cards.down", () => act.move(store, 1)),
        iconButton("invert_colors", "cards.invert", () => act.invert(store)),
      ].map((b) => controls(b, "cards")),
      loop,
    ];
  }

  /** The cloth's tools: its face, the 0/1 overlay and its colours. */
  function clothTools() {
    const front = label("button", "cloth.faceFront", { type: "button" });
    const back = label("button", "cloth.faceBack", { type: "button" });
    front.addEventListener("click", () => act.setFace(store, "front"));
    back.addEventListener("click", () => act.setFace(store, "back"));
    const bits = label("button", "cloth.bits", { type: "button", class: "chip" });
    bits.dataset.l10nTip = "cloth.bits.tip";
    bits.setAttribute("data-tip-describes", "");
    bits.addEventListener("click", () => act.setBits(store, !ls().bits));
    follow((s) => [s.looms[s.current].face, s.looms[s.current].bits], () => {
      front.setAttribute("aria-pressed", String(ls().face === "front"));
      back.setAttribute("aria-pressed", String(ls().face === "back"));
      bits.setAttribute("aria-pressed", String(ls().bits));
    });
    // the colours themselves, warp over weft, as a paint program shows its two colours
    const colours = controls(el("button", { type: "button", class: "btn icon-only colours-btn", "aria-haspopup": "dialog" }), "colours");
    colours.dataset.l10nTip = "colours.tip";
    colours.addEventListener("click", () => (colours.classList.contains("locked") ? act.say(store, msg("learn.locked"), true) : coloursPopover(colours)));
    follow((s) => [s.looms[s.current].warp, s.looms[s.current].weft], () => colours.replaceChildren(pairSwatch(ls().warp, ls().weft)));
    return [el("div", { class: "seg", role: "group" }, [front, back]), bits, colours];
  }

  /**
   * What a closed panel leaves: a rail with the button that opens it again.
   * @param {"left" | "right"} side
   */
  function rail(side) {
    const b = iconButton(side === "left" ? "left_panel_open" : "right_panel_open", `panel.open.${side}`, () => edges[side]?.close(false), "btn icon-only rail");
    return b;
  }

  /**
   * The edge between a side panel and the stage, a window splitter.
   * @param {"left" | "right"} side
   */
  function edge(side) {
    const e = el("div", { class: "edge", role: "separator", tabindex: "0", "aria-orientation": "vertical" });
    e.dataset.l10nName = `panel.edge.${side}`;
    e.dataset.l10nTip = "panel.edge.tip";
    return e;
  }

  /** The head and its tie-up, shown as they are, over the cards; pressed, they can be changed. */
  function setupRow() {
    const text = el("span");
    const chip = controls(el("button", { type: "button", class: "chip setup-chip", "aria-haspopup": "dialog" }, [icon("tune"), text, icon("keyboard_arrow_down")]), "setup");
    chip.dataset.l10nTip = "setup.tip";
    chip.setAttribute("data-tip-describes", "");
    // locked, it says why instead of opening
    chip.addEventListener("click", () => (chip.classList.contains("locked") ? act.say(store, msg("learn.locked"), true) : setupPopover(chip)));
    follow((s) => [s.looms[s.current].rev, s.locale], () => {
      const { deck, tie } = ls().loom;
      setText(text, t("setup.chip", { head: tn("hooks.option", deck.hooks / 8, { hooks: deck.hooks }), tie: words(tieLabel(tie)) }));
    });
    return el("div", { class: "setup-row" }, [chip]);
  }

  /**
   * The program: the card on the bench above the chain. In Learn the guide is above both, and
   * alone where the step does not use the cards (the story).
   */
  function programPanel() {
    if (store.state.workspace === "create") return picturesPanel();
    if (store.state.workspace === "play") {
      const slot = el("div", { class: "games-slot" });
      const panel = el("aside", { class: "panel left", "data-l10n-name": "game.title" }, [rail("left"), el("div", { class: "panel-head" }, [label("h2", "game.title")]), slot]);
      put(gamesPanel(store), slot);
      return panel;
    }
    const bench = controls(el("div", { class: "bench-slot" }), "punch");
    const chain = controls(el("div", { class: "chain-slot" }), "punch");
    const head = el("div", { class: "panel-head" }, [label("h2", "cards.title"), ...cardTools()]);
    const learn = store.state.workspace === "learn";
    const setup = setupRow();
    // in Learn, a step on a picture has the picture tool under the guide, in place of the cards
    const picture = el("div", { class: "picture-slot", hidden: true });
    const panel = el("aside", { class: "panel left", "data-l10n-name": learn ? "sheet.guide" : "cards.title" }, [rail("left"), ...(learn ? [guide(), picture] : []), head, setup, bench, chain]);
    put(benchPanel(store), bench);
    put(chainPanel(store), chain);
    if (learn) put(picturePanel(store, { loom: "tutorial" }), picture);
    // in Learn the guide has the room: the bench shows only for a step that punches cards, the
    // head and tie-up only for one that changes them
    if (learn)
      follow((s) => [s.learn.step], () => {
        const i = store.state.learn.step;
        const onPicture = !!STEPS[i].picture;
        panel.classList.toggle("guide-only", !shownAt(i).cards && !onPicture);
        panel.classList.toggle("on-picture", onPicture);
        picture.hidden = !onPicture;
        for (const e of [head, chain]) e.hidden = onPicture;
        bench.hidden = onPicture || !allowedAt(i).includes("punch");
        setup.hidden = onPicture || !allowedAt(i).includes("setup");
      });
    return panel;
  }

  /**
   * Design's left panel: the picture and how it is read (js/app/components/picture.js), and
   * under it the cards it makes, with Open in Weave, as Learn stacks its guide over the cards.
   */
  function picturesPanel() {
    const slot = el("div", { class: "picture-slot" });
    const chain = el("div", { class: "chain-slot" });
    const panel = el("aside", { class: "panel left on-design", "data-l10n-name": "pic.title" }, [
      rail("left"),
      el("div", { class: "panel-head" }, [label("h2", "pic.title")]),
      slot,
      el("div", { class: "panel-head" }, [label("h2", "pic.cards"), weaveIt()]),
      chain,
    ]);
    put(picturePanel(store, { loom: "create" }), slot);
    put(chainPanel(store), chain);
    return panel;
  }

  /** Open in Weave: the picture's cards on the learner's own loom, in Weave. */
  function weaveIt() {
    const b = el("button", { type: "button", class: "btn filled weave-it" }, [icon("open_in_new"), label("span", "pic.weaveIt")]);
    b.dataset.l10nTip = "pic.weaveIt.tip";
    b.setAttribute("data-tip-describes", "");
    b.addEventListener("click", () => act.weavePicture(store, "create"));
    follow((s) => [s.looms.create.rev], () => b.setAttribute("aria-disabled", String(store.state.looms.create.loom.deck.cards.length === 0)));
    return b;
  }

  /** The output: the cloth, and the thread followed below it; in Design and Games, the machine. */
  function outputPanel() {
    // in Design and Games, the machine beside the cloth on the stage, small: the head in
    // section, on the workspace's own loom
    if (store.state.workspace === "play" || store.state.workspace === "create") {
      const machine = el("div", { class: "machine-slot" });
      const trace = el("div", { class: "trace-slot" });
      const panel = el("aside", { class: "panel right", "data-l10n-name": "game.machine" }, [rail("right"), el("div", { class: "panel-head" }, [label("h2", "game.machine")]), machine, trace]);
      put(sectionView(store), machine);
      put(tracePanel(store), trace);
      return panel;
    }
    const cloth = el("div", { class: "cloth-slot" });
    const trace = el("div", { class: "trace-slot" });
    const panel = el("aside", { class: "panel right", "data-l10n-name": "cloth.title" }, [rail("right"), el("div", { class: "panel-head" }, [label("h2", "cloth.title"), ...clothTools()]), cloth, trace]);
    put(clothPanel(store), cloth);
    put(tracePanel(store), trace);
    return panel;
  }

  /** The guide: the tutorial's step (js/app/components/guide.js). */
  function guide() {
    const host = el("div", { class: "guide" });
    put(guidePanel(store, { onGo: (w) => goWorkspace(w) }), host);
    return host;
  }

  /**
   * One pane of the stage: its view, the chip that names and changes it, and the view's tools.
   * @param {number} i
   * @param {StageView} v
   */
  function pane(i, v) {
    const host = el("div", { class: "pane-host" });
    const chip = el("button", { type: "button", class: "chip view-chip", "aria-haspopup": "menu" }, [el("span", { class: "view-name" }), icon("keyboard_arrow_down")]);
    follow((s) => [s.locale], () => (/** @type {HTMLElement} */ (chip.firstChild).textContent = viewName(v)));
    // One flat list: the 2D drawings, the 3D models, then the cloth; a view on show in another
    // pane says where, and choosing it swaps the two (js/app/arrange.js).
    chip.addEventListener("click", () => {
      const views = store.state.views;
      showMenu(
        chip,
        MENU_VIEWS.map((x) => {
          const at = views.indexOf(x);
          const name = viewName(x, true);
          return {
            label: at >= 0 && at !== i ? `${name} · ${t(placeKey(at, views.length))}` : name,
            checked: x === v,
            divider: x === "section" ? t("view.group.2d") : x === "cloth" ? true : x === "3d" ? t("view.group.3d") : undefined,
            run: () => act.setViews(store, choose(store.state.views, i, x)),
          };
        }),
      );
    });
    const tools = el("div", { class: "pane-tools" }, mode === "desktop" ? [chip] : []);
    if (v === "section") tools.append(...sectionTools());
    if (v === "cloth") tools.append(...clothTools());
    /** @type {((unit: "machine" | UnitId) => void) | undefined} */
    let onMode;
    if (v in UNIT_VIEWS) {
      const note = unitNote(/** @type {keyof typeof UNIT_VIEWS} */ (v));
      const counts = labelsSwitch(host);
      tools.append(note.element, counts.element);
      counts.shownFor(UNIT_VIEWS[/** @type {keyof typeof UNIT_VIEWS} */ (v)].unit);
      onMode = (unit) => {
        note.show(unit);
        counts.shownFor(unit);
      };
    }
    put(viewComponent(store, v, onMode), host);
    return el("div", { class: "pane" }, [host, tools]);
  }

  /**
   * What a 3D view shows, and the idea it teaches: a chip that opens a short card.
   * @param {keyof typeof UNIT_VIEWS} v the view
   */
  function unitNote(v) {
    const title = el("h3");
    const idea = el("p");
    const summary = el("summary", { class: "chip" }, [icon("info")]);
    summary.dataset.l10nTip = "unit.note";
    summary.dataset.l10nName = "unit.note";
    const element = el("details", { class: "unit-note" }, [summary, el("div", { class: "unit-card" }, [title, idea])]);
    /** @type {"machine" | UnitId} */
    let shown = UNIT_VIEWS[v].unit;
    const write = () => {
      title.textContent = t(`unit.${shown}`);
      idea.textContent = t(`unit.${shown}.idea`);
    };
    follow((s) => [s.locale], write);
    /** @param {"machine" | UnitId} unit */
    const show = (unit) => {
      shown = unit;
      write();
    };
    return { element, show };
  }

  /**
   * The counts over the whole machine in 3D (416 hooks, 1,600 warp ends…), on or off: by
   * themselves they show where the view is large enough not to be covered by them (not on a
   * phone); pressed, as the reader chooses, in every 3D view and kept on this device.
   * @param {HTMLElement} host the view's host, whose size decides by itself
   */
  function labelsSwitch(host) {
    const b = el("button", { type: "button", class: "chip labels-switch", "data-l10n-tip": "view3d.labels" });
    const draw = () => {
      const on = labelsShown(host.clientWidth, host.clientHeight);
      if (b.getAttribute("aria-pressed") === String(on)) return;
      b.replaceChildren(icon(on ? "label" : "label_off"));
      b.setAttribute("aria-pressed", String(on));
    };
    b.addEventListener("click", () => {
      setLabels(labelsShown(host.clientWidth, host.clientHeight) ? "off" : "on");
      draw();
    });
    // by itself, the switch follows the view's size
    new ResizeObserver(draw).observe(host);
    draw();
    return { element: b, shownFor: (/** @type {"machine" | UnitId} */ unit) => (b.hidden = unit !== "machine") };
  }

  /** The section's tools: how close it looks, and which cross-row it cuts. */
  function sectionTools() {
    // how close the section looks: a zoom on the same drawing, so a tool of the view, not a view;
    // a plain magnifier before the chips says so (a mark, not a control: it looks like none)
    const zoom = el("div", { class: "chip-row", role: "group", "data-l10n-name": "section.zoom" });
    const zoomTool = el("div", { class: "zoom-tool" }, [el("span", { class: "zoom-mark", "aria-hidden": "true" }, [icon("zoom_in")]), zoom]);
    for (const z of /** @type {const} */ (["whole", "needles", "crooks"])) {
      const b = label("button", `section.${z}`, { type: "button", class: "chip", "data-tip-describes": "" });
      b.dataset.l10nTip = "section.zoom";
      b.addEventListener("click", () => act.setSectionView(store, z));
      zoom.appendChild(b);
    }
    const cross = el("select", { "data-l10n-name": "section.name" });
    cross.addEventListener("change", () => act.setCrossRow(store, Number(cross.value)));
    const crossChip = el("label", { class: "chip" }, [cross]);
    follow((s) => [s.sectionView, s.looms[s.current].crossRow, s.looms[s.current].loom.deck.hooks, s.locale], () => {
      for (const b of zoom.querySelectorAll("button")) b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.l10n === `section.${store.state.sectionView}`));
      const n = ls().loom.deck.hooks / 8;
      // the options are made anew only when the head or the language changes: made every frame
      // while the loom plays, the open list would close under the pointer
      const options = [...Array(n).keys()].map((c) => t("section.crossRow", { row: c + 1, from: c * 8 + 1, to: c * 8 + 8 }));
      if ([...cross.options].map((x) => x.text).join("\n") !== options.join("\n")) cross.replaceChildren(...options.map((text, c) => new Option(text, String(c))));
      if (cross.value !== String(ls().crossRow)) cross.value = String(ls().crossRow);
      crossChip.hidden = n === 1;
    });
    return [zoomTool, crossChip];
  }

  /** The stage, split as the store says, with the arrangement and the thread followed. */
  function stage() {
    const st = el("main", { class: "stage" });
    const arrangement = el("div", { class: "chip-row", role: "group", "data-l10n-name": "stage.views" });
    for (const [n, name, tip] of /** @type {const} */ ([[1, "crop_square", "stage.one"], [2, "view_column_2", "stage.two"], [4, "grid_view", "stage.four"]])) {
      const b = el("button", { type: "button", class: "chip" }, [icon(name)]);
      b.dataset.l10nTip = tip;
      b.dataset.n = String(n);
      b.addEventListener("click", () => act.setViews(store, arrange(store.state.views, n)));
      arrangement.appendChild(b);
    }
    const chipFollow = el("button", { type: "button", class: "chip follow-chip" });
    chipFollow.addEventListener("click", () => act.follow(store, null));
    const panes = el("div", { class: "panes", style: "display: contents" });
    /** The panes on show, each with its place and view, its node, and its components and watchers. @type {{ key: string; node: HTMLElement; mine: { placed: Placed[]; unwatch: (() => void)[] } }[]} */
    let shownPanes = [];
    follow((s) => [s.views], () => {
      st.dataset.n = String(store.state.views.length);
      const keys = store.state.views.map((v, i) => `${i}:${v}`);
      for (const p of shownPanes) if (!keys.includes(p.key)) remake(p.mine, () => []);
      shownPanes = keys.map((key, i) => {
        const kept = shownPanes.find((p) => p.key === key);
        if (kept) return kept;
        const made = remake({ placed: [], unwatch: [] }, () => [pane(i, store.state.views[i])]);
        return { key, node: made.nodes[0], mine: made.mine };
      });
      // focus on a view's chip (its menu, keys 1 to 4) goes back to the same pane's chip
      const focused = /** @type {HTMLElement | null} */ (document.activeElement)?.closest(".pane");
      const at = focused ? [...panes.children].indexOf(focused) : -1;
      panes.replaceChildren(...shownPanes.map((p) => p.node));
      if (at >= 0 && !panes.contains(document.activeElement)) /** @type {HTMLElement | undefined} */ (panes.children[at]?.querySelector(".view-chip"))?.focus();
      greyLocked();
      for (const b of arrangement.children) b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.n === String(store.state.views.length)));
      relabel();
    });
    follow((s) => [s.looms[s.current].follow, s.locale], () => {
      const f = ls().follow;
      chipFollow.hidden = !f;
      if (f) chipFollow.replaceChildren(el("span", { text: t("follow.chip", { hook: f.hook + 1 }) }), icon("close"));
    });
    st.append(panes, el("div", { class: "stage-tools" }, [arrangement]), el("div", { class: "stage-foot" }, [chipFollow]));
    return st;
  }

  /** A phone's stage: one view at a time, chosen by chips. */
  function smallStage() {
    const st = el("main", { class: "stage" });
    const chips = el("div", { class: "view-chips", role: "group", "data-l10n-name": "stage.views" });
    // One chip for 3D: it opens the whole loom and its five units, as the desktop's view menu does,
    // and names the one on show.
    const THREE_D = /** @type {StageView[]} */ (["3d", "u1", "u2", "u3", "u4", "u5"]);
    for (const v of STAGE_VIEWS.filter((x) => !x.startsWith("u"))) {
      const b = el("button", { type: "button", class: "chip" });
      b.dataset.view = v;
      if (v === "3d") {
        b.setAttribute("aria-haspopup", "menu");
        b.addEventListener("click", () =>
          showMenu(
            b,
            THREE_D.map((x) => ({ label: viewName(x, true), checked: x === store.state.views[0], run: () => act.setViews(store, [x]) })),
          ),
        );
      } else b.addEventListener("click", () => act.setViews(store, [v]));
      chips.appendChild(b);
    }
    /** The view a chip stands for now: the 3D chip, the 3D view on show (or the whole loom). @param {HTMLElement} b */
    const chipView = (b) => /** @type {StageView} */ (b.dataset.view === "3d" && THREE_D.includes(store.state.views[0]) ? store.state.views[0] : b.dataset.view);
    follow((s) => [s.locale, s.views[0]], () => {
      for (const b of /** @type {HTMLElement[]} */ ([...chips.children])) {
        const name = viewName(chipView(b));
        if (b.dataset.view === "3d") b.replaceChildren(el("span", { text: name }), icon("keyboard_arrow_down"));
        else b.textContent = name;
      }
    });
    const one = el("div", { class: "panes", style: "display: contents" });
    let mine = { placed: /** @type {Placed[]} */ ([]), unwatch: /** @type {(() => void)[]} */ ([]) };
    follow((s) => [s.views[0]], () => {
      const v = store.state.views[0];
      const made = remake(mine, () => [pane(0, v)]);
      one.replaceChildren(...made.nodes);
      mine = made.mine;
      for (const b of /** @type {HTMLElement[]} */ ([...chips.children])) b.setAttribute("aria-pressed", String(chipView(b) === v));
      // the view on show is in sight in the strip (Design and Games open on the cloth, its end)
      const on = /** @type {HTMLElement | undefined} */ ([...chips.children].find((b) => chipView(/** @type {HTMLElement} */ (b)) === v));
      if (on) requestAnimationFrame(() => (chips.scrollLeft = Math.max(0, on.offsetLeft - (chips.clientWidth - on.offsetWidth) / 2)));
      relabel();
    });
    st.append(chips, one);
    return st;
  }

  /** The machine's sound, on or off (remembered on this device). */
  function soundSwitch() {
    const b = el("button", { type: "button", class: "btn icon-only sound" });
    const show = () => {
      b.replaceChildren(icon(sound.muted ? "volume_off" : "volume_up"));
      b.setAttribute("aria-pressed", String(!sound.muted));
      b.dataset.l10nTip = sound.muted ? "sound.off" : "sound.on";
      setTip(b, t(b.dataset.l10nTip));
    };
    b.addEventListener("click", () => {
      sound.mute(!sound.muted);
      show();
    });
    show();
    return b;
  }

  /**
   * Time: the caption (what the loom just did), which stays under the stage it explains, and the
   * player (the moments and the loom's controls), which on a desktop runs along the window's
   * bottom, under the cards and the cloth as well, since all three move with it.
   */
  function time() {
    const caption = el("div", { class: "caption" });
    const player = el("div", { class: "player" });
    put(statusPanel(store), caption);
    put(transportPanel(store, { tools: [soundSwitch()] }), player);
    return [caption, player];
  }

  /**
   * The sheet's grab: dragged up it gives the sheet more of the screen (peek, half, full), dragged
   * down less; a tap opens it fully, or back to half.
   */
  function grab() {
    const SIZES = /** @type {const} */ (["peek", "half", "full"]);
    const b = el("button", { type: "button", class: "grab" }, [el("span")]);
    b.dataset.l10nTip = "sheet.grab";
    b.dataset.l10nName = "sheet.grab";
    const now = () => SIZES.indexOf(/** @type {any} */ (root.dataset.sheet ?? "half"));
    const to = (/** @type {number} */ i) => {
      root.dataset.sheet = SIZES[Math.max(0, Math.min(2, i))];
      b.setAttribute("aria-expanded", String(root.dataset.sheet === "full"));
    };
    to(now());
    /** @type {number | null} */
    let y0 = null;
    b.addEventListener("pointerdown", (e) => {
      y0 = e.clientY;
      try {
        b.setPointerCapture(e.pointerId);
      } catch {
        // the drag works without capture
      }
    });
    b.addEventListener("pointerup", (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      y0 = null;
      dragged = Math.abs(dy) > 24;
      if (dy < -24) to(now() + (dy < -200 ? 2 : 1));
      else if (dy > 24) to(now() - (dy > 200 ? 2 : 1));
    });
    // a tap, Enter or Space (a click without a drag) opens the sheet fully, or brings it back
    let dragged = false;
    b.addEventListener("click", () => {
      if (!dragged) to(now() === 2 ? 1 : 2);
      dragged = false;
    });
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") to(now() + 1);
      else if (e.key === "ArrowDown") to(now() - 1);
      else return;
      e.preventDefault();
    });
    return b;
  }

  /** A phone's sheet: the program, the output and (in Learn) the guide, by tab. */
  function sheet() {
    const ws = store.state.workspace;
    const ids = ws === "create" ? ["picture", "cards"] : ws === "play" ? ["game"] : [...(ws === "learn" ? ["guide"] : []), "cards", "cloth"];
    const list = el("div", { class: "tabs", role: "tablist" });
    const body = el("div", { class: "sheet-body" });
    for (const id of ids) list.appendChild(label("button", `sheet.${id}`, { type: "button", role: "tab", class: "tab", id: `sheet-${id}` }));
    list.dataset.l10nName = "sheet.name";
    /** @type {{ placed: Placed[]; unwatch: (() => void)[] }} */
    let mine = { placed: [], unwatch: [] };
    const show = (/** @type {string} */ id) => {
      sheetTab = id;
      mine = remake(mine, () => {
        body.replaceChildren();
        fill(id);
        return [];
      }).mine;
      relabel();
      greyLocked();
    };
    /** The tab's own parts, in the sheet's body. @param {string} id */
    const fill = (id) => {
      if (id === "guide") {
        body.appendChild(guide());
        // a step on a picture brings the picture tool under it
        const picture = el("div", { class: "picture-slot" });
        body.appendChild(picture);
        put(picturePanel(store, { loom: "tutorial" }), picture);
        follow((s) => [s.learn.step], () => (picture.hidden = !STEPS[store.state.learn.step].picture));
      }
      if (id === "game") {
        const slot = el("div", { class: "games-slot" });
        body.append(slot);
        put(gamesPanel(store), slot);
      }
      if (id === "picture") {
        const slot = el("div", { class: "picture-slot" });
        body.append(slot);
        put(picturePanel(store, { loom: "create" }), slot);
      }
      if (id === "cards" && ws === "create") {
        const chain = el("div", { class: "chain-slot" });
        body.append(el("div", { class: "panel-head" }, [label("h2", "pic.cards")]), el("div", { class: "weave-it-row" }, [weaveIt()]), chain);
        put(chainPanel(store), chain);
      }
      if (id === "cards" && ws !== "create" && ws !== "play") {
        const bench = el("div", { class: "bench-slot" });
        const chain = el("div", { class: "chain-slot" });
        body.append(el("div", { class: "panel-head" }, [label("h2", "cards.title"), ...cardTools()]), setupRow(), bench, chain);
        put(benchPanel(store), bench);
        put(chainPanel(store), chain);
      }
      if (id === "cloth") {
        const cloth = el("div", { class: "cloth-slot" });
        const trace = el("div", { class: "trace-slot" });
        body.append(el("div", { class: "panel-head" }, [label("h2", "cloth.title"), ...clothTools()]), cloth, trace);
        put(clothPanel(store), cloth);
        put(tracePanel(store), trace);
      }
    };
    const select = tabs(list, (tab) => show(tab.slice("sheet-".length)));
    // the tab on show stays when the frame is built again (the phone turned, the workspace changed)
    select(`sheet-${sheetTab && ids.includes(sheetTab) ? sheetTab : ids[0]}`);
    return el("section", { class: "sheet" }, [grab(), list, body]);
  }

  // ---- building the frame ------------------------------------------------------------------------

  function build() {
    const tabFocused = !!document.activeElement?.closest(".workspaces");
    for (const p of placed) p.unmount();
    for (const u of unwatch) u();
    placed = [];
    unwatch = [];
    document.querySelector(".popover")?.dispatchEvent(new Event("shut"));
    mode = modeOf();
    root.className = `app ${mode}`;
    root.dataset.ws = store.state.workspace;
    if (mode !== "phone") delete root.dataset.sheet;
    root.replaceChildren();
    edges = {};
    if (mode === "desktop") {
      const [caption, player] = time();
      const centre = el("div", { class: "centre" }, [stage(), caption]);
      const [left, right] = [programPanel(), outputPanel()];
      const [edgeLeft, edgeRight] = [edge("left"), edge("right")];
      const work = el("div", { class: "work" }, [left, edgeLeft, centre, edgeRight, right]);
      root.append(topbar(), work, player);
      // the left panel starts closed where the stage would be narrow (§4, medium screens)
      const narrow = window.innerWidth - PANEL.left.size - PANEL.right.size < STAGE_MIN;
      edges = {
        left: wireEdge({ work, panel: left, edge: edgeLeft, side: "left", sizes: PANEL.left, stageMin: STAGE_MIN, startClosed: narrow }),
        right: wireEdge({ work, panel: right, edge: edgeRight, side: "right", sizes: PANEL.right, stageMin: STAGE_MIN, startClosed: false }),
      };
    } else {
      const under = el("div", { class: "under-stage" }, time());
      if (mode === "phone") root.append(appbar(), smallStage(), under, sheet());
      else root.append(appbar(), el("div", { class: "land" }, [el("div", { class: "land-stage" }, [smallStage(), under]), sheet()]));
    }
    applyIcons(root);
    relabel();
    follow((s) => [s.current, s.learn.step, s.looms[s.current].loom.deck, s.looms[s.current].loom.pick, s.looms[s.current].selected, s.looms[s.current].follow], greyLocked);
    // a workspace chosen by the keyboard: focus stays on its tab, which the frame made anew
    if (tabFocused) document.getElementById(`ws-${store.state.workspace}`)?.focus();
  }

  build();
  wireKeys(store);
  watchDone(store);
  window.addEventListener("resize", () => {
    if (modeOf() !== mode) build();
  });
  store.watch((s) => [s.workspace], build);
  store.watch((s) => [s.locale], relabel);
  return { build, sound };
}
