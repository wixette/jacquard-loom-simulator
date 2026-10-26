// The main app's frame (design/ui-layout.md): where each component goes, on a desktop and on a
// phone. The components are the same everywhere (js/app/components/); only their slots change.
// A desktop (1024 px wide or more) has the top bar, the program on the left, the stage in the
// middle, the output on the right and time along the bottom; a phone has the stage on top, the
// transport under it and a bottom sheet with the rest; a phone turned on its side has the stage
// on the left and the sheet beside it. The frame is built again when the screen changes kind or
// the workspace changes; its own texts follow the language without a rebuild.

import pkg from "../../package.json" with { type: "json" };
import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, say as words, t, tn } from "../l10n/l10n.js";
import { HOOK_COUNTS, PRESETS } from "../sim/deck.js";
import { encodeLink, LONG_LINK, STAGE_VIEWS } from "../sim/link.js";
import { tieLabel } from "../sim/tieup.js";
import { printDocument } from "../teach/printCards.js";
import { applyIcons, el, icon, setTip, showMenu, tabs } from "../ui/components.js";
import { place } from "./components/component.js";
import { benchPanel, chainPanel, clothPanel, statusPanel, tracePanel, transportPanel } from "./components/panels.js";
import { frontView, sectionView, sideView, unitsView } from "./components/views.js";
import { chooseLanguage } from "./language.js";
import * as act from "./looms.js";
import { TIES, tieKey } from "./looms.js";
/** @import { AppStore, StageView, Workspace } from "./looms.js" */
/** @import { Component, Placed } from "./components/component.js" */
/** @import { IconName } from "../ui/components.js" */

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
 * @returns {Component}
 */
function viewComponent(store, v) {
  if (v === "section") return sectionView(store);
  if (v === "side") return sideView(store);
  if (v === "front") return frontView(store);
  const units = { "3d": "machine", u1: "selector", u2: "cylinder", u3: "griffe", u4: "harness", u5: "shed" };
  return unitsView(store, { unit: /** @type {any} */ (units[v]) });
}

/** The views each arrangement opens with, when the stage is split. */
const SPLIT = /** @type {Record<1 | 2 | 4, StageView[]>} */ ({ 1: ["section"], 2: ["section", "3d"], 4: ["section", "front", "side", "3d"] });

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
  const ls = () => store.state.looms[store.state.current];

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
    const s = ls();
    const { loom } = s;
    const fragment = await encodeLink({ deck: loom.deck, tie: loom.tie, pick: loom.pick, follow: s.follow, crossRow: s.crossRow, warp: s.warp, weft: s.weft, face: s.face, bits: s.bits, sectionView: store.state.sectionView, views: store.state.views });
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

  /** @param {HTMLElement} anchor */
  function setupPopover(anchor) {
    const old = /** @type {HTMLElement | null} */ (document.querySelector(".popover"));
    old?.remove();
    if (old?.dataset.for === "setup") return;
    const s = ls();
    const hooks = el("select");
    for (const n of HOOK_COUNTS) hooks.add(new Option(tn("hooks.option", n / 8, { hooks: n }), String(n)));
    hooks.value = String(s.loom.deck.hooks);
    hooks.addEventListener("change", () => act.setHooks(store, Number(hooks.value)));
    const tie = el("select");
    for (const [key, ti] of Object.entries(TIES)) tie.add(new Option(words(tieLabel(ti)), key));
    tie.value = tieKey(s.loom.tie);
    tie.addEventListener("change", () => act.setTie(store, TIES[tie.value]));
    const warp = el("input", { type: "color", value: s.warp });
    warp.addEventListener("input", () => act.setColours(store, { warp: warp.value }));
    const weft = el("input", { type: "color", value: s.weft });
    weft.addEventListener("input", () => act.setColours(store, { weft: weft.value }));
    const pop = el("div", { class: "popover", role: "dialog", "aria-label": t("bar.setup.tip") }, [
      el("label", { text: t("setup.hooks") }), hooks,
      el("label", { text: t("setup.tie") }), tie,
      el("label", { text: t("setup.warp") }), warp,
      el("label", { text: t("setup.weft") }), weft,
    ]);
    pop.dataset.for = "setup";
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const b = pop.getBoundingClientRect();
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.left = `${Math.max(8, Math.min(window.innerWidth - b.width - 8, r.right - b.width))}px`;
    const away = (/** @type {PointerEvent} */ e) => {
      if (pop.contains(/** @type {Node} */ (e.target)) || anchor.contains(/** @type {Node} */ (e.target))) return;
      pop.remove();
      document.removeEventListener("pointerdown", away);
    };
    document.addEventListener("pointerdown", away);
  }

  function aboutDialog() {
    const d = el("dialog", { class: "about" }, [
      el("h2", { text: t("about.title") }),
      el("p", { text: t("about.what") }),
      el("p", { text: t("about.version", { version: pkg.version }) }),
      el("p", {}, [el("a", { href: "https://github.com/wixette/jacquard-loom-simulator", target: "_blank", rel: "noopener", text: t("about.source") })]),
      el("form", { method: "dialog" }, [el("button", { class: "btn tonal", text: t("about.close") })]),
    ]);
    document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.showModal();
  }

  function topbar() {
    const list = el("nav", { class: "workspaces tabs", role: "tablist", "aria-label": t("ws.name") });
    for (const w of WORKSPACES) {
      const tab = label("button", `ws.${w}`, { type: "button", role: "tab", class: "tab", id: `ws-${w}` });
      list.appendChild(tab);
    }
    tabs(list, (id) => act.setWorkspace(store, /** @type {Workspace} */ (id.slice(3))));
    for (const tab of list.children) tab.setAttribute("aria-selected", String(tab.id === `ws-${store.state.workspace}`));
    const setup = el("button", { type: "button", class: "btn has-icon", "aria-haspopup": "dialog" }, [icon("tune"), label("span", "bar.setup")]);
    setup.dataset.l10nTip = "bar.setup.tip";
    setup.setAttribute("data-tip-describes", "");
    setup.addEventListener("click", () => setupPopover(setup));
    const share = el("button", { type: "button", class: "btn has-icon", "aria-haspopup": "menu" }, [icon("share"), label("span", "bar.share")]);
    share.dataset.l10nTip = "bar.share.tip";
    share.setAttribute("data-tip-describes", "");
    share.addEventListener("click", () => shareMenu(share));
    const lang = el("button", { type: "button", class: "btn lang-btn", "aria-haspopup": "menu" });
    lang.dataset.l10nTip = "bar.language";
    lang.addEventListener("click", () => languageMenu(lang));
    follow((s) => [s.locale], () => lang.replaceChildren(icon("translate"), el("span", { text: LOCALE_SHORT[store.state.locale] })));
    return el("header", { class: "topbar" }, [brand(), list, el("span", { class: "spacer" }), setup, share, lang, iconButton("info", "bar.about", aboutDialog)]);
  }

  function appbar() {
    const ws = el("select", { class: "ws", "aria-label": t("ws.name") });
    for (const w of WORKSPACES) ws.add(new Option(t(`ws.${w}`), w));
    ws.value = store.state.workspace;
    ws.addEventListener("change", () => act.setWorkspace(store, /** @type {Workspace} */ (ws.value)));
    const menu = iconButton("menu", "bar.menu", () =>
      showMenu(menu, [
        { label: t("bar.language"), run: () => languageMenu(menu) },
        { label: t("bar.about"), run: aboutDialog },
      ]),
    );
    const share = iconButton("share", "bar.share.tip", () => shareMenu(share));
    const setup = iconButton("tune", "bar.setup.tip", () => setupPopover(setup));
    return el("header", { class: "appbar" }, [brand(), ws, el("span", { class: "spacer" }), share, setup, menu]);
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

  /** The cloth's tools: its face and the 0/1 overlay. */
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
    return [el("div", { class: "seg", role: "group" }, [front, back]), bits];
  }

  /** The program: the card on the bench above the chain (and, in Learn, the guide above both). */
  function programPanel() {
    const bench = el("div", { class: "bench-slot" });
    const chain = el("div", { class: "chain-slot" });
    const head = el("div", { class: "panel-head" }, [label("h2", "cards.title"), ...cardTools()]);
    const panel = el("aside", { class: "panel left" }, [...(store.state.workspace === "learn" ? [guide()] : []), head, bench, chain]);
    put(benchPanel(store), bench);
    put(chainPanel(store), chain);
    return panel;
  }

  /** The output: the cloth, and the thread followed below it. */
  function outputPanel() {
    const cloth = el("div", { class: "cloth-slot" });
    const trace = el("div", { class: "trace-slot" });
    const panel = el("aside", { class: "panel right" }, [el("div", { class: "panel-head" }, [label("h2", "cloth.title"), ...clothTools()]), cloth, trace]);
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
    const chip = el("button", { type: "button", class: "chip view-chip", "aria-haspopup": "menu" }, [el("span", { text: t(`view.${v}`) }), icon("keyboard_arrow_down")]);
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
    put(viewComponent(store, v), host);
    return el("div", { class: "pane" }, [host, tools]);
  }

  /** The section's tools: how close it looks, and which cross-row it cuts. */
  function sectionTools() {
    const zoom = el("div", { class: "chip-row", role: "group" });
    for (const z of /** @type {const} */ (["whole", "needles", "crooks"])) {
      const b = label("button", `section.${z}`, { type: "button", class: "chip" });
      b.addEventListener("click", () => act.setSectionView(store, z));
      zoom.appendChild(b);
    }
    const cross = el("select", { "aria-label": t("section.name") });
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
    const arrangement = el("div", { class: "chip-row", role: "group", "aria-label": t("stage.views") });
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
    /** @type {Placed[]} */
    let mine = [];
    follow((s) => [s.views], () => {
      for (const p of mine) {
        p.unmount();
        placed = placed.filter((x) => x !== p);
      }
      const before = placed.length;
      st.dataset.n = String(store.state.views.length);
      panes.replaceChildren(...store.state.views.map((v, i) => pane(i, v)));
      mine = placed.slice(before);
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
    const chips = el("div", { class: "view-chips", role: "group", "aria-label": t("stage.views") });
    for (const v of STAGE_VIEWS.filter((x) => !x.startsWith("u"))) {
      const b = label("button", `view.${v}`, { type: "button", class: "chip" });
      b.addEventListener("click", () => act.setViews(store, [v]));
      chips.appendChild(b);
    }
    const one = el("div", { class: "panes", style: "display: contents" });
    /** @type {Placed[]} */
    let mine = [];
    follow((s) => [s.views[0]], () => {
      for (const p of mine) {
        p.unmount();
        placed = placed.filter((x) => x !== p);
      }
      const before = placed.length;
      const v = store.state.views[0];
      one.replaceChildren(pane(0, v));
      mine = placed.slice(before);
      for (const b of chips.children) b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.l10n === `view.${v}`));
    });
    st.append(chips, one);
    return st;
  }

  /** Time: the transport and the status line. */
  function band() {
    const transport = el("div", { class: "transport-slot" });
    const status = el("div", { class: "status-slot" });
    put(transportPanel(store), transport);
    put(statusPanel(store), status);
    return [transport, status];
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
        body.append(el("div", { class: "panel-head" }, [label("h2", "cards.title"), ...cardTools()]), bench, chain);
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
    return el("section", { class: "sheet" }, [el("div", { class: "grab" }), list, body]);
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
    root.replaceChildren();
    if (mode === "desktop") {
      const [transport, status] = band();
      root.append(topbar(), el("div", { class: "work" }, [programPanel(), el("div", { class: "edge" }), stage(), el("div", { class: "edge" }), outputPanel()]), el("footer", { class: "band" }, [transport, status]));
    } else {
      const [transport, status] = band();
      const under = el("div", { class: "under-stage" }, [transport, status]);
      if (mode === "phone") root.append(appbar(), smallStage(), under, sheet());
      else root.append(appbar(), el("div", { class: "land" }, [el("div", { class: "land-stage" }, [smallStage(), under]), sheet()]));
    }
    applyIcons(root);
    relabel();
  }

  build();
  window.addEventListener("resize", () => {
    if (modeOf() !== mode) build();
  });
  store.watch((s) => [s.workspace], build);
  store.watch((s) => [s.locale], relabel);
  return { build };
}
