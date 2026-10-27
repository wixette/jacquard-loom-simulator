// The main app's frame (design/ui-layout.md): where each component goes, on a desktop and on a
// phone. The components are the same everywhere (js/app/components/); only their slots change.
// A desktop (1024 px wide or more) has the top bar, the program on the left, the stage in the
// middle, the output on the right and time along the bottom; a phone has the stage on top, the
// transport under it and a bottom sheet with the rest; a phone turned on its side has the stage
// on the left and the sheet beside it. The frame is built again when the screen changes kind or
// the workspace changes; its own texts follow the language without a rebuild.

import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, say as words, t, tn } from "../l10n/l10n.js";
import { HOOK_COUNTS, PRESETS } from "../sim/deck.js";
import { encodeLink, LONG_LINK, STAGE_VIEWS } from "../sim/link.js";
import { linkOf } from "./links.js";
import { tieLabel } from "../sim/tieup.js";
import { printDocument } from "../teach/printCards.js";
import { applyIcons, el, icon, setTip, showMenu, tabs } from "../ui/components.js";
import { wireEdge } from "../ui/edge.js";
import { showAbout } from "./about.js";
import { wireKeys } from "./keys.js";
import { Sound } from "./sound.js";
import { place } from "./components/component.js";
import { benchPanel, chainPanel, clothPanel, statusPanel, tracePanel, transportPanel } from "./components/panels.js";
import { frontView, sectionView, sideView, UNIT_VIEWS, unitsView } from "./components/views.js";
import { chooseLanguage } from "./language.js";
import * as act from "./looms.js";
import { TIES, tieKey } from "./looms.js";
/** @import { AppStore, StageView, Workspace } from "./looms.js" */
/** @import { UnitId } from "../scene/units.js" */
/** @import { Component, Placed } from "./components/component.js" */
/** @import { IconName } from "../ui/components.js" */
/** @import { Edge } from "../ui/edge.js" */

/** @typedef {"desktop" | "phone" | "landscape"} Mode */

/** What kind of screen this is: its width, and on a phone its orientation. */
export function modeOf() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w >= 1024) return /** @type {Mode} */ ("desktop");
  if (w > h && h < 520) return /** @type {Mode} */ ("landscape");
  return /** @type {Mode} */ ("phone");
}

/** The workspaces of this release, in the order the bar shows them. */
const WORKSPACES = /** @type {const} */ (["learn", "weave"]);

/**
 * A view's component.
 * @param {AppStore} store
 * @param {StageView} v
 * @param {(unit: "machine" | UnitId) => void} [onMode] a 3D view's: what it shows, as that changes
 * @returns {Component}
 */
function viewComponent(store, v, onMode) {
  if (v === "section") return sectionView(store);
  if (v === "side") return sideView(store);
  if (v === "front") return frontView(store);
  return unitsView(store, { unit: UNIT_VIEWS[v].unit, onMode });
}

/** The views each arrangement opens with, when the stage is split. */
const SPLIT = /** @type {Record<1 | 2 | 4, StageView[]>} */ ({ 1: ["section"], 2: ["section", "3d"], 4: ["section", "front", "side", "3d"] });

/** The side panels' sizes (px): the smallest, the largest and the default (design/ui-layout.md §4). */
const PANEL = { left: { min: 260, max: 480, size: 320 }, right: { min: 280, max: 520, size: 340 } };
/** What the stage keeps at least beside the panels (px). */
const STAGE_MIN = 560;

/** The narrowest stage that holds two views side by side (each about as wide as a laptop's one). */
const TWO_VIEWS = 1040;

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
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-l10n]"))) e.textContent = t(/** @type {string} */ (e.dataset.l10n));
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-l10n-tip]"))) setTip(e, t(/** @type {string} */ (e.dataset.l10nTip)));
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-l10n-name]"))) e.setAttribute("aria-label", t(/** @type {string} */ (e.dataset.l10nName)));
    document.title = t("app.title");
  }

  // ---- the parts of the frame ------------------------------------------------------------------

  function brand() {
    return el("a", { class: "brand", href: "./" }, [el("img", { src: "images/logo.svg", alt: "", draggable: "false" }), label("span", "app.name")]);
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
    const canvas = /** @type {HTMLCanvasElement | null} */ (root.querySelector("canvas.cloth-canvas"));
    if (!canvas) return;
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
    const url = URL.createObjectURL(new Blob([printDocument(deck, t("app.title"))], { type: "text/html" }));
    const w = window.open(url, "_blank");
    act.say(store, w ? { key: "share.printed", n: deck.cards.length } : { key: "share.blocked" }, !w);
  }

  /**
   * A small dialog under its anchor, shut by pressing the anchor again, pressing elsewhere, or Esc.
   * @param {HTMLElement} anchor
   * @param {string} id
   * @param {string} name
   * @param {HTMLElement[]} rows
   */
  function popover(anchor, id, name, rows) {
    const old = /** @type {HTMLElement | null} */ (document.querySelector(".popover"));
    old?.remove();
    if (old?.dataset.for === id) return;
    const pop = el("div", { class: "popover", role: "dialog", "aria-label": name }, rows);
    pop.dataset.for = id;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const b = pop.getBoundingClientRect();
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.left = `${Math.max(8, Math.min(window.innerWidth - b.width - 8, r.left))}px`;
    const shut = () => {
      pop.remove();
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
    const away = (/** @type {PointerEvent} */ e) => {
      if (!pop.contains(/** @type {Node} */ (e.target)) && !anchor.contains(/** @type {Node} */ (e.target))) shut();
    };
    const esc = (/** @type {KeyboardEvent} */ e) => {
      if (e.key !== "Escape") return;
      shut();
      anchor.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    /** @type {HTMLElement | null} */ (pop.querySelector("select, input, button"))?.focus();
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
    popover(anchor, "setup", t("setup.tip"), [el("label", { for: "setup-hooks", text: t("setup.hooks") }), hooks, el("label", { for: "setup-tie", text: t("setup.tie") }), tie]);
  }

  /** The cloth's colours, from the palette over the cloth. @param {HTMLElement} anchor */
  function coloursPopover(anchor) {
    const s = ls();
    const warp = el("input", { type: "color", id: "colour-warp", value: s.warp });
    warp.addEventListener("input", () => act.setColours(store, { warp: warp.value }));
    const weft = el("input", { type: "color", id: "colour-weft", value: s.weft });
    weft.addEventListener("input", () => act.setColours(store, { weft: weft.value }));
    const again = el("button", { type: "button", class: "btn", text: t("colours.reset") });
    again.addEventListener("click", () => {
      act.setColours(store, { warp: act.WARP, weft: act.WEFT });
      warp.value = act.WARP;
      weft.value = act.WEFT;
    });
    popover(anchor, "colours", t("colours.tip"), [el("label", { for: "colour-warp", text: t("setup.warp") }), warp, el("label", { for: "colour-weft", text: t("setup.weft") }), weft, el("span"), again]);
  }

  function topbar() {
    const list = el("nav", { class: "workspaces tabs", role: "tablist", "data-l10n-name": "ws.name" });
    for (const w of WORKSPACES) {
      const tab = label("button", `ws.${w}`, { type: "button", role: "tab", class: "tab", id: `ws-${w}` });
      list.appendChild(tab);
    }
    tabs(list, (id) => act.setWorkspace(store, /** @type {Workspace} */ (id.slice(3))));
    for (const tab of list.children) tab.setAttribute("aria-selected", String(tab.id === `ws-${store.state.workspace}`));
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
    ws.addEventListener("change", () => act.setWorkspace(store, /** @type {Workspace} */ (ws.value)));
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
    const decks = iconButton("menu_book", "cards.decks", () =>
      showMenu(
        decks,
        Object.entries(PRESETS).map(([key, p]) => ({ label: tn("preset.option", p.rows.length, { name: t(p.name) }), run: () => act.loadPreset(store, key) })),
      ),
    );
    const loop = iconButton("repeat", "cards.loop", () => act.lace(store, !ls().loom.deck.loop));
    follow((s) => [s.looms[s.current].rev], () => loop.setAttribute("aria-pressed", String(ls().loom.deck.loop)));
    return [
      decks,
      iconButton("add", "cards.add", () => act.add(store)),
      iconButton("content_copy", "cards.duplicate", () => act.duplicate(store)),
      iconButton("delete", "cards.remove", () => act.remove(store)),
      iconButton("arrow_upward", "cards.up", () => act.move(store, -1)),
      iconButton("arrow_downward", "cards.down", () => act.move(store, 1)),
      iconButton("invert_colors", "cards.invert", () => act.invert(store)),
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
    const colours = iconButton("palette", "colours.tip", () => coloursPopover(colours));
    colours.setAttribute("aria-haspopup", "dialog");
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
    const chip = el("button", { type: "button", class: "chip setup-chip", "aria-haspopup": "dialog" }, [icon("tune"), text, icon("keyboard_arrow_down")]);
    chip.dataset.l10nTip = "setup.tip";
    chip.setAttribute("data-tip-describes", "");
    chip.addEventListener("click", () => setupPopover(chip));
    follow((s) => [s.looms[s.current].rev, s.locale], () => {
      const { deck, tie } = ls().loom;
      text.textContent = t("setup.chip", { head: tn("hooks.option", deck.hooks / 8, { hooks: deck.hooks }), tie: words(tieLabel(tie)) });
    });
    return el("div", { class: "setup-row" }, [chip]);
  }

  /** The program: the card on the bench above the chain (and, in Learn, the guide above both). */
  function programPanel() {
    const bench = el("div", { class: "bench-slot" });
    const chain = el("div", { class: "chain-slot" });
    const head = el("div", { class: "panel-head" }, [label("h2", "cards.title"), ...cardTools()]);
    const panel = el("aside", { class: "panel left" }, [rail("left"), ...(store.state.workspace === "learn" ? [guide()] : []), head, setupRow(), bench, chain]);
    put(benchPanel(store), bench);
    put(chainPanel(store), chain);
    return panel;
  }

  /** The output: the cloth, and the thread followed below it. */
  function outputPanel() {
    const cloth = el("div", { class: "cloth-slot" });
    const trace = el("div", { class: "trace-slot" });
    const panel = el("aside", { class: "panel right" }, [rail("right"), el("div", { class: "panel-head" }, [label("h2", "cloth.title"), ...clothTools()]), cloth, trace]);
    put(clothPanel(store), cloth);
    put(tracePanel(store), trace);
    return panel;
  }

  /** A sample step of the tutorial, to show where it goes (the tutorial itself comes in M7). */
  function guide() {
    return el("div", { class: "guide" }, [
      el("div", { class: "step-card" }, [
        el("p", { class: "step-kicker", text: "3 · Weave · 2/9" }),
        el("h3", { text: "Plain weave" }),
        el("p", { text: "Two cards, taking turns: the first lifts the odd ends, the second the even ones. Predict the cloth, then weave four picks." }),
        el("div", { class: "taskline" }, [icon("play_arrow"), el("span", { text: "Your turn: weave four picks" })]),
        el("div", { class: "step-nav" }, [el("button", { type: "button", class: "btn", text: "Back" }), el("button", { type: "button", class: "btn filled", text: "Next" })]),
      ]),
    ]);
  }

  /**
   * One pane of the stage: its view, the chip that names and changes it, and the view's tools.
   * @param {number} i
   * @param {StageView} v
   */
  function pane(i, v) {
    const host = el("div", { class: "pane-host" });
    const chip = el("button", { type: "button", class: "chip view-chip", "aria-haspopup": "menu" }, [label("span", `view.${v}`), icon("keyboard_arrow_down")]);
    chip.addEventListener("click", () =>
      showMenu(
        chip,
        STAGE_VIEWS.map((x) => ({
          label: t(`view.${x}`),
          checked: x === v,
          divider: x === "u1" ? true : undefined,
          run: () => {
            const views = [...store.state.views];
            views[i] = x;
            act.setViews(store, views);
          },
        })),
      ),
    );
    const tools = el("div", { class: "pane-tools" }, mode === "desktop" ? [chip] : []);
    if (v === "section") tools.append(...sectionTools());
    /** @type {((unit: "machine" | UnitId) => void) | undefined} */
    let onMode;
    if (v in UNIT_VIEWS) {
      const note = unitNote(/** @type {keyof typeof UNIT_VIEWS} */ (v));
      tools.append(note.element);
      onMode = note.show;
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
      const code = Object.values(UNIT_VIEWS).find((u) => u.unit === shown)?.code;
      title.textContent = code ? `${code} · ${t(`unit.${shown}`)}` : t(`unit.${shown}`);
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

  /** The section's tools: how close it looks, and which cross-row it cuts. */
  function sectionTools() {
    const zoom = el("div", { class: "chip-row", role: "group" });
    for (const z of /** @type {const} */ (["whole", "needles", "crooks"])) {
      const b = label("button", `section.${z}`, { type: "button", class: "chip" });
      b.addEventListener("click", () => act.setSectionView(store, z));
      zoom.appendChild(b);
    }
    const cross = el("select", { "data-l10n-name": "section.name" });
    cross.addEventListener("change", () => act.setCrossRow(store, Number(cross.value)));
    const crossChip = el("label", { class: "chip" }, [cross]);
    follow((s) => [s.sectionView, s.looms[s.current].crossRow, s.looms[s.current].rev, s.locale], () => {
      for (const b of zoom.children) b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.l10n === `section.${store.state.sectionView}`));
      const n = ls().loom.deck.hooks / 8;
      cross.replaceChildren(...[...Array(n).keys()].map((c) => new Option(t("section.crossRow", { row: c + 1, from: c * 8 + 1, to: c * 8 + 8 }), String(c))));
      cross.value = String(ls().crossRow);
      crossChip.hidden = n === 1;
    });
    return [zoom, crossChip];
  }

  /** The stage, split as the store says, with the arrangement and the thread followed. */
  function stage() {
    const st = el("main", { class: "stage" });
    const arrangement = el("div", { class: "chip-row", role: "group", "data-l10n-name": "stage.views" });
    for (const [n, name, tip] of /** @type {const} */ ([[1, "crop_square", "stage.one"], [2, "view_column_2", "stage.two"], [4, "grid_view", "stage.four"]])) {
      const b = el("button", { type: "button", class: "chip" }, [icon(name)]);
      b.dataset.l10nTip = tip;
      b.dataset.n = String(n);
      b.addEventListener("click", () => act.setViews(store, store.state.views.length === n ? store.state.views : SPLIT[n]));
      arrangement.appendChild(b);
    }
    const chipFollow = el("button", { type: "button", class: "chip follow-chip" });
    chipFollow.addEventListener("click", () => act.follow(store, null));
    const panes = el("div", { class: "panes", style: "display: contents" });
    let mine = { placed: /** @type {Placed[]} */ ([]), unwatch: /** @type {(() => void)[]} */ ([]) };
    follow((s) => [s.views], () => {
      st.dataset.n = String(store.state.views.length);
      const made = remake(mine, () => store.state.views.map((v, i) => pane(i, v)));
      panes.replaceChildren(...made.nodes);
      mine = made.mine;
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
    for (const v of STAGE_VIEWS.filter((x) => !x.startsWith("u"))) {
      const b = label("button", `view.${v}`, { type: "button", class: "chip" });
      b.addEventListener("click", () => act.setViews(store, [v]));
      chips.appendChild(b);
    }
    const one = el("div", { class: "panes", style: "display: contents" });
    let mine = { placed: /** @type {Placed[]} */ ([]), unwatch: /** @type {(() => void)[]} */ ([]) };
    follow((s) => [s.views[0]], () => {
      const v = store.state.views[0];
      const made = remake(mine, () => [pane(0, v)]);
      one.replaceChildren(...made.nodes);
      mine = made.mine;
      for (const b of chips.children) b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.l10n === `view.${v}`));
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

  /** Time, under the stage: what the loom just did, then the moments and the loom's controls. */
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
      if (dy < -24) to(now() + (dy < -200 ? 2 : 1));
      else if (dy > 24) to(now() - (dy > 200 ? 2 : 1));
      else to(now() === 2 ? 1 : 2);
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
    const ids = [...(store.state.workspace === "learn" ? ["guide"] : []), "cards", "cloth"];
    const list = el("div", { class: "tabs", role: "tablist" });
    const body = el("div", { class: "sheet-body" });
    for (const id of ids) list.appendChild(label("button", `sheet.${id}`, { type: "button", role: "tab", class: "tab", id: `sheet-${id}` }));
    /** @type {Placed[]} */
    let mine = [];
    const show = (/** @type {string} */ id) => {
      for (const p of mine) {
        p.unmount();
        placed = placed.filter((x) => x !== p);
      }
      const before = placed.length;
      body.replaceChildren();
      if (id === "guide") body.appendChild(guide());
      if (id === "cards") {
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
      mine = placed.slice(before);
      relabel();
    };
    const select = tabs(list, (tab) => show(tab.slice("sheet-".length)));
    select(`sheet-${ids[0]}`);
    return el("section", { class: "sheet" }, [grab(), list, body]);
  }

  // ---- building the frame ------------------------------------------------------------------------

  function build() {
    for (const p of placed) p.unmount();
    for (const u of unwatch) u();
    placed = [];
    unwatch = [];
    document.querySelector(".popover")?.remove();
    mode = modeOf();
    root.className = `app ${mode}`;
    if (mode !== "phone") delete root.dataset.sheet;
    root.replaceChildren();
    edges = {};
    if (mode === "desktop") {
      const centre = el("div", { class: "centre" }, [stage(), ...time()]);
      const [left, right] = [programPanel(), outputPanel()];
      const [edgeLeft, edgeRight] = [edge("left"), edge("right")];
      const work = el("div", { class: "work" }, [left, edgeLeft, centre, edgeRight, right]);
      root.append(topbar(), work);
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
  }

  build();
  wireKeys(store);
  window.addEventListener("resize", () => {
    if (modeOf() !== mode) build();
  });
  store.watch((s) => [s.workspace], build);
  store.watch((s) => [s.locale], relabel);
  return { build, sound };
}
