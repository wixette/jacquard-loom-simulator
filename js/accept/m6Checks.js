// M6's checks on the app (design/m6-notes.md), run by index.html?selftest: S-1 the frame at every
// size (the phone's and the tablet's in frames of their sizes), S-2 the machine's settings beside
// what they change, S-3 the transport and its stepper, S-4 the keyboard, S-5 the panels' edges,
// S-6 every view in every arrangement, S-7 links, S-8 the languages, S-9 the sounds, S-12 the
// griffe's labels, S-13 clicks while the loom plays. S-10, the 3D
// parts' names, needs no page (tests/scene/partNames.test.js).

import { linkOf, openLink } from "../app/links.js";
import * as act from "../app/looms.js";
import { MESSAGES } from "../l10n/all.js";
import { LOCALES } from "../l10n/l10n.js";
import { encodeLink, STAGE_VIEWS } from "../sim/link.js";
import { STOP_KEYS } from "../sim/loom.js";
import { result } from "./harness.js";
import { englishOnly } from "./m5Checks.js";
/** @import { AppStore, StageView } from "../app/looms.js" */
/** @import { Sound } from "../app/sound.js" */
/** @import { CheckResult } from "./harness.js" */

/**
 * What the checks drive: the app (js/main.js).
 * @typedef {object} AppPage
 * @property {AppStore} store
 * @property {{ build: () => void; sound: Sound }} shell
 */

/** Two frames: the resize observers and the drawing have run. */
const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** @param {string} sel */
const $ = (sel) => /** @type {HTMLElement | null} */ (document.querySelector(sel));
/** @param {string} sel */
const $$ = (sel) => /** @type {HTMLElement[]} */ ([...document.querySelectorAll(sel)]);
/** Waits until no 3D view is still loading (up to 20 s). */
const loaded = async (root = document) => {
  for (let k = 0; k < 100 && root.querySelector(".view-note"); k++) await sleep(200);
};
/** @param {Element} e */
const area = (e) => {
  const r = e.getBoundingClientRect();
  return Math.round(r.width) * Math.round(r.height);
};
/** @param {string} key @param {EventTarget} [at] */
const press = (key, at = document.body) => at.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

/**
 * @param {AppPage} page
 * @returns {Promise<CheckResult[]>}
 */
export async function runM6Checks(page) {
  const { store } = page;
  act.setWorkspace(store, "weave");
  const out = [];
  for (const check of [frame, settings, transport, keyboard, edges, views, links, languages, sounds, griffeLabels, clicksWhilePlaying]) {
    act.reset(store);
    act.follow(store, null);
    out.push(await check(page));
  }
  act.setViews(store, ["section"]);
  return out;
}

/**
 * S-1: at a laptop's, a desktop's, a tablet's and a phone's size, upright and on its side, the
 * frame has its parts, and the page neither scrolls nor overflows sideways.
 * @returns {Promise<CheckResult>}
 */
async function frame() {
  /** @type {string[]} */
  const bad = [];
  const SIZES = /** @type {const} */ ([
    [1366, 768, "desktop", [".topbar", ".panel.left", ".stage", ".caption", ".player", ".panel.right"]],
    [1920, 1080, "desktop", [".topbar", ".panel.left", ".stage", ".caption", ".player", ".panel.right"]],
    [820, 1180, "phone", [".appbar", ".stage", ".under-stage .player", ".sheet .tabs"]],
    [390, 844, "phone", [".appbar", ".stage", ".under-stage .caption", ".under-stage .player", ".sheet .tabs"]],
    [844, 390, "landscape", [".appbar", ".land .stage", ".under-stage .player", ".sheet .tabs"]],
  ]);
  for (const [w, h, mode, parts] of SIZES) {
    const f = document.createElement("iframe");
    f.style.cssText = `position: fixed; left: 0; top: 0; width: ${w}px; height: ${h}px; border: 0; visibility: hidden; z-index: -1`;
    f.src = "index.html";
    document.body.appendChild(f);
    const doc = await new Promise((r) => f.addEventListener("load", () => r(/** @type {Document} */ (f.contentDocument)), { once: true }));
    for (let k = 0; k < 50 && !doc.querySelector(".app .player"); k++) await sleep(100);
    await loaded(doc);
    await sleep(200);
    const where = `${w} × ${h}`;
    const app = doc.querySelector(".app");
    if (!app?.classList.contains(mode)) bad.push(`${where}: not the ${mode} frame`);
    for (const p of parts) {
      const e = doc.querySelector(p);
      if (!e || area(e) === 0) bad.push(`${where}: no ${p}`);
    }
    // on a desktop the player runs along the whole bottom, under the panels too, its controls
    // centred on the window
    const player = doc.querySelector(".app.desktop > .player");
    const controls = doc.querySelector(".app.desktop > .player .controls");
    if (mode === "desktop" && (!player || !controls)) bad.push(`${where}: the player is not along the window's bottom`);
    else if (player && controls) {
      const [p, c] = [player.getBoundingClientRect(), controls.getBoundingClientRect()];
      if (p.width < w - 1) bad.push(`${where}: the player is ${Math.round(p.width)} px wide`);
      if (Math.abs((c.left + c.right) / 2 - w / 2) > 2) bad.push(`${where}: the controls are not centred on the window`);
    }
    const root = doc.documentElement;
    if (root.scrollWidth > w + 1 || root.scrollHeight > h + 1) bad.push(`${where}: the page scrolls (${root.scrollWidth} × ${root.scrollHeight})`);
    for (const e of doc.querySelectorAll(".app *")) {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && r.right > w + 1 && !e.closest(".chain, .chain-box, .cloth-box, .view-chips, .sheet-body")) {
        bad.push(`${where}: ${e.tagName.toLowerCase()}.${e.className} reaches past the right edge`);
        break;
      }
    }
    f.remove();
  }
  return result("S-1", "At every size the frame has its parts, and the page neither scrolls nor overflows sideways", bad.length === 0, bad.slice(0, 4).join("; ") || `${SIZES.length} sizes: 1366 and 1920 desktops (the player along the whole bottom, its controls centred), a tablet, a phone upright and on its side`);
}

/**
 * S-2: the top bar holds only the app's own (the workspaces, Share, the language, About); the
 * head and tie-up chip over the cards shows their values and changes them; the palette over the
 * cloth changes its colours; the chain's end is a switch that laces or opens the chain, in step
 * with the cards' loop button.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function settings({ store }) {
  /** @type {string[]} */
  const bad = [];
  const ls = () => store.state.looms[store.state.current];
  const bar = /** @type {HTMLElement} */ ($(".topbar"));
  const controls = [...bar.querySelectorAll("button, select, input")].filter((e) => !e.closest(".workspaces"));
  if (controls.length !== 3) bad.push(`the top bar has ${controls.length} controls besides the workspaces, not 3 (Share, language, About)`);
  if (bar.querySelector("select, input, .setup-chip")) bad.push("a machine setting in the top bar");
  const chip = /** @type {HTMLElement} */ ($(".panel.left .setup-chip"));
  if (!chip) bad.push("no head and tie-up chip over the cards");
  else {
    if (!chip.textContent?.includes(String(ls().loom.deck.hooks))) bad.push(`the chip does not show the head (${chip.textContent})`);
    chip.click();
    const hooks = /** @type {HTMLSelectElement | null} */ (document.getElementById("setup-hooks"));
    if (!hooks) bad.push("the chip opens no head setting");
    else {
      hooks.value = "32";
      hooks.dispatchEvent(new Event("change"));
      await frames();
      if (ls().loom.deck.hooks !== 32) bad.push("the head setting does not change the head");
      if (!chip.textContent?.includes("32")) bad.push("the chip does not follow the head");
      chip.click();
      act.setHooks(store, 16);
    }
  }
  const palette = /** @type {HTMLElement | null} */ ($('.panel.right .panel-head [aria-haspopup="dialog"]'));
  palette?.click();
  /** @param {string} v */
  const typeHex = (v) => {
    const hex = /** @type {HTMLInputElement | null} */ (document.getElementById("colour-hex"));
    if (!hex) return false;
    hex.value = v;
    hex.dispatchEvent(new Event("input"));
    return true;
  };
  if (!typeHex("#336699")) bad.push("no colours over the cloth");
  else {
    if (ls().warp !== "#336699") bad.push("the picker does not set the warp");
    /** @type {HTMLElement | null} */ ($("#colour-weft"))?.click();
    typeHex("abc");
    if (ls().weft !== "#aabbcc" || ls().warp !== "#336699") bad.push("the weft's row does not give the picker the weft");
    await frames();
    // the button shows the pair itself, warp in front; a ready-made pair sets both; swap swaps
    const front = () => palette?.querySelector(".pair-swatch .warp")?.getAttribute("fill");
    if (front() !== "#336699") bad.push(`the colours button shows ${front()}, not the warp`);
    const pair = /** @type {HTMLElement | null} */ ($('.colours-pop .pair[data-pair="madder"]'));
    pair?.click();
    if (ls().warp !== "#9b2d30" || ls().weft !== "#e8c16a") bad.push("a ready-made pair does not set both colours");
    await frames();
    if (pair?.getAttribute("aria-pressed") !== "true") bad.push("the pair chosen is not marked");
    /** @type {HTMLElement | null} */ ($(".colours-pop .swap"))?.click();
    if (ls().warp !== "#e8c16a" || ls().weft !== "#9b2d30") bad.push("swap does not swap the colours");
    if (/** @type {HTMLInputElement | null} */ (document.getElementById("colour-hex"))?.value !== "#9B2D30") bad.push("the picker does not follow the colours");
    // a non-modal popover: it follows its button when the layout moves, its button and a press
    // elsewhere and Esc shut it
    const pop = () => /** @type {HTMLElement | null} */ ($(".colours-pop"));
    /** Whether the panel hangs from its button: just under it, their right edges together. */
    const hung = () => {
      const [a, p] = [palette?.getBoundingClientRect(), pop()?.getBoundingClientRect()];
      return !!a && !!p && Math.abs(p.right - a.right) <= 2 && Math.abs(p.top - a.bottom - 6) <= 2;
    };
    if (!hung()) bad.push("the panel does not hang from its button");
    // the button moved (as a resize moves it): the panel follows
    if (palette) palette.style.marginRight = "120px";
    window.dispatchEvent(new Event("resize"));
    await frames();
    await frames();
    if (!hung()) bad.push("the panel did not follow its button");
    if (palette) palette.style.marginRight = "";
    window.dispatchEvent(new Event("resize"));
    await frames();
    palette?.click();
    if (pop()) bad.push("its button does not shut it");
    palette?.click();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    if (pop()) bad.push("a press elsewhere does not shut it");
    palette?.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    if (pop()) bad.push("Esc does not shut it");
    act.setColours(store, { warp: act.WARP, weft: act.WEFT });
  }
  const loopButton = () => /** @type {HTMLElement} */ ($('.panel.left .panel-head [aria-pressed]'));
  for (const want of [!ls().loom.deck.loop, ls().loom.deck.loop]) {
    const end = /** @type {HTMLElement | null} */ ($(".chain-end.lace"));
    if (!end) {
      bad.push("the chain's end is not a switch");
      break;
    }
    end.click();
    await frames();
    if (ls().loom.deck.loop !== want) bad.push("the chain's end does not lace or open the chain");
    if ($(".chain-end.lace")?.getAttribute("aria-checked") !== String(want) || loopButton()?.getAttribute("aria-pressed") !== String(want)) bad.push("the chain's end and the loop button disagree");
  }
  return result("S-2", "The machine's settings sit with what they change: the head and tie-up over the cards, the colours over the cloth, the loop at the chain's end; the top bar holds only the app's own", bad.length === 0, bad.slice(0, 4).join("; ") || "top bar: Share, language, About; head 16 → 32 → 16 from its chip; warp and weft from the page's own picker, a pair and swap, the button showing them; the panel follows its button and shuts as a popover does; the chain laced and opened from its end");
}

/**
 * S-3: the transport's buttons act; play is the largest, reset as large as the steps; the six
 * moments are a stepper, not buttons, with the moment reached marked as the current step.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function transport({ store }) {
  /** @type {string[]} */
  const bad = [];
  const ls = () => store.state.looms[store.state.current];
  const b = (/** @type {string} */ id) => /** @type {HTMLElement} */ ($(`.player [data-act="${id}"]`));
  const [reset, back, play, fwd] = ["reset", "back", "play", "fwd"].map(b);
  if (!(area(play) > area(fwd) && area(fwd) === area(back) && area(reset) === area(back))) bad.push(`sizes: reset ${area(reset)}, back ${area(back)}, play ${area(play)}, step ${area(fwd)}`);
  const moments = /** @type {HTMLElement} */ ($(".player .moments"));
  if (moments.querySelectorAll("li").length !== STOP_KEYS.length) bad.push("not six moments");
  if (moments.querySelector("button, a, [tabindex]")) bad.push("a moment is a control");
  for (let i = 0; i < 3; i++) fwd.click();
  await frames();
  const here = moments.querySelectorAll('[aria-current="step"]');
  if (here.length !== 1 || /** @type {HTMLElement} */ (here[0]).dataset.stop !== "2") bad.push(`after three steps the current moment is ${[...here].map((e) => /** @type {HTMLElement} */ (e).dataset.stop).join()}`);
  back.click();
  if (Math.abs(ls().loom.phi - 0.32) > 0.2) bad.push(`back did not go back (${ls().loom.phi})`);
  play.click();
  await sleep(300);
  if (!ls().playing) bad.push("play does not play");
  play.click();
  if (ls().playing) bad.push("play does not pause");
  reset.click();
  if (ls().loom.pick !== 0 || ls().loom.phi !== 0) bad.push("reset does not go back to the first card");
  return result("S-3", "The transport's buttons act, play the largest and reset as large as the steps; the moments are a stepper, not buttons, the one reached the current step", bad.length === 0, bad.slice(0, 4).join("; ") || `play ${area(play)} px², the others ${area(fwd)} px² each; three steps mark moment 3`);
}

/**
 * S-4: Space plays and pauses, the arrows step, 1 to 4 choose the first view, F follows what is
 * under the pointer and Esc stops; no key acts while a field that takes keys has the focus.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function keyboard({ store }) {
  /** @type {string[]} */
  const bad = [];
  const ls = () => store.state.looms[store.state.current];
  act.setViews(store, ["section"]);
  press("ArrowRight");
  press("ArrowRight");
  const after2 = ls().loom.phi;
  press("ArrowLeft");
  if (!(after2 > ls().loom.phi && ls().loom.phi > 0)) bad.push("the arrows do not step");
  press(" ");
  if (!ls().playing) bad.push("Space does not play");
  press(" ");
  if (ls().playing) bad.push("Space does not pause");
  for (const [k, v] of /** @type {const} */ ([["2", "side"], ["3", "front"], ["1", "section"]])) {
    press(k);
    if (store.state.views[0] !== v) bad.push(`${k} does not show the ${v}`);
  }
  await frames();
  const cord = /** @type {SVGGraphicsElement | null} */ (document.querySelector("svg.section line.cord[data-hook]"));
  if (cord) {
    const r = cord.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
    press("f");
    if (!ls().follow) bad.push("F does not follow the part under the pointer");
    press("Escape");
    if (ls().follow) bad.push("Esc does not stop following");
  } else bad.push("no cord to point at");
  const speed = /** @type {HTMLElement} */ ($(".player .speed input"));
  const phi = ls().loom.phi;
  press("ArrowRight", speed);
  if (ls().loom.phi !== phi) bad.push("an arrow on the speed slider stepped the loom");
  return result("S-4", "The keys act: Space, ← →, 1–4, F and Esc; none acts while a field that takes keys has the focus", bad.length === 0, bad.slice(0, 4).join("; ") || "Space, ←, →, 1, 2, 3, F, Esc; the speed slider keeps its arrows");
}

/**
 * S-5: a panel's edge resizes it by the keyboard within its limits, closes it to a rail and
 * opens it again; the size is remembered.
 * @returns {Promise<CheckResult>}
 */
async function edges() {
  /** @type {string[]} */
  const bad = [];
  const saved = Object.fromEntries(["jacquard.panel.left", "jacquard.panel.left.closed"].map((k) => [k, localStorage.getItem(k)]));
  const edge = /** @type {HTMLElement} */ ($(".edge"));
  const panel = /** @type {HTMLElement} */ ($(".panel.left"));
  const width = () => Math.round(panel.getBoundingClientRect().width);
  const w0 = width();
  press("ArrowRight", edge);
  await frames();
  if (width() !== w0 + 16) bad.push(`→ on the edge: ${w0} → ${width()}`);
  press("Home", edge);
  await frames();
  if (width() !== Number(edge.getAttribute("aria-valuemin"))) bad.push("Home does not give the smallest size");
  if (localStorage.getItem("jacquard.panel.left") !== String(width())) bad.push("the size is not remembered");
  press("Enter", edge);
  await frames();
  if (!panel.classList.contains("closed") || area(/** @type {HTMLElement} */ (panel.querySelector(".rail"))) === 0) bad.push("Enter does not close the panel to its rail");
  /** @type {HTMLElement} */ (panel.querySelector(".rail")).click();
  await frames();
  if (panel.classList.contains("closed")) bad.push("the rail does not open the panel");
  edge.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  await frames();
  if (width() !== w0) bad.push(`a double-click does not give the default size back (${width()})`);
  for (const [k, v] of Object.entries(saved)) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
  return result("S-5", "A panel's edge resizes it within its limits, closes it to a rail and opens it again, and the size is remembered", bad.length === 0, bad.slice(0, 4).join("; ") || `the cards panel: ${w0} → ${w0 + 16} → ${edge.getAttribute("aria-valuemin")} px, closed and opened, ${w0} px again`);
}

/**
 * S-6: every view fills its pane, alone, in two and in four; taking a 3D view away leaves no
 * canvas behind.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function views({ store }) {
  /** @type {string[]} */
  const bad = [];
  const canvases = document.querySelectorAll("canvas").length;
  /** @type {StageView[][]} */
  const sets = [...STAGE_VIEWS.map((v) => [v]), ["section", "3d"], ["u1", "u5"], ["section", "front", "side", "3d"]];
  for (const vs of sets) {
    act.setViews(store, vs);
    await frames();
    await loaded();
    await frames();
    const panes = $$(".stage .pane-host");
    if (panes.length !== vs.length) bad.push(`${vs.join(",")}: ${panes.length} panes`);
    panes.forEach((host, i) => {
      const d = host.querySelector(":scope > svg, :scope > canvas");
      // the cloth's squares keep their size: it fits its pane's width, and scrolls down it
      if (vs[i] === "cloth") {
        const c = host.querySelector("canvas");
        if (!c || area(c) === 0 || c.getBoundingClientRect().width > host.getBoundingClientRect().width + 1) bad.push(`cloth in ${vs.join(",")}: not in its pane`);
      } else if (!d || area(d) < 0.5 * area(host)) bad.push(`${vs[i]} in ${vs.join(",")}: does not fill its pane`);
    });
  }
  act.setViews(store, ["section"]);
  await frames();
  const left = document.querySelectorAll("canvas").length - canvases;
  if (left > 0) bad.push(`${left} canvas(es) left behind`);
  return result("S-6", "Every view fills its pane, alone, two side by side and four; no canvas is left behind", bad.length === 0, bad.slice(0, 4).join("; ") || `${sets.length} arrangements, ${sets.flat().length} views`);
}

/**
 * S-7: the link the app writes (Share) opens the same loom, views and colours again; a link
 * names the language it opens in.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function links({ store }) {
  /** @type {string[]} */
  const bad = [];
  const ls = () => store.state.looms[store.state.current];
  act.loadPreset(store, "twill");
  for (let i = 0; i < 9; i++) act.step(store);
  act.followHook(store, 3);
  act.setColours(store, { warp: "#123456" });
  act.setViews(store, ["section", "u2"]);
  const want = { cards: JSON.stringify(ls().loom.deck.cards), pick: ls().loom.pick, phi: ls().loom.phi, follow: ls().follow?.hook, warp: ls().warp, views: store.state.views.join() };
  const fragment = await encodeLink(linkOf(store));
  act.loadPreset(store, "plain");
  act.setColours(store, { warp: act.WARP });
  act.setViews(store, ["section"]);
  await openLink(store, `#${fragment}`);
  const got = { cards: JSON.stringify(ls().loom.deck.cards), pick: ls().loom.pick, phi: ls().loom.phi, follow: ls().follow?.hook, warp: ls().warp, views: store.state.views.join() };
  for (const k of /** @type {(keyof typeof want)[]} */ (Object.keys(want))) if (want[k] !== got[k]) bad.push(`${k}: ${want[k]} → ${got[k]}`);
  await openLink(store, "#v=2&lang=fr");
  if (store.state.locale !== "fr") bad.push("a link's language is not taken");
  await openLink(store, "#v=2&lang=en");
  act.loadPreset(store, "plain");
  act.setColours(store, { warp: act.WARP });
  return result("S-7", "The link the app writes opens the same loom, views and colours again, in the language it names", bad.length === 0, bad.slice(0, 4).join("; ") || `a twill at pick ${want.pick + 1}, hook 4 followed, a warp colour, section and U2: ${fragment.length} characters`);
}

/**
 * S-8: in every language, nothing in the app is left in English (its text, its names for screen
 * readers, its tooltips), the machine's numbers and names aside.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function languages({ store }) {
  /** @type {string[]} */
  const bad = [];
  const { chooseLanguage } = await import("../app/language.js");
  const app = /** @type {HTMLElement} */ ($("#app"));
  act.setViews(store, ["section", "3d"]);
  await loaded();
  const texts = () => [app.innerText, ...[...app.querySelectorAll("[aria-label], [title], [data-tip]")].flatMap((e) => [e.getAttribute("aria-label"), e.getAttribute("title"), /** @type {HTMLElement} */ (e).dataset.tip])].filter(Boolean).join(" ");
  for (const l of LOCALES.filter((x) => x !== "en")) {
    await chooseLanguage(store, l);
    await frames();
    const only = englishOnly(l);
    const left = [...new Set((texts().match(/[A-Za-z]{4,}/g) ?? []).filter((w) => only.has(w)))];
    if (left.length) bad.push(`${l}: English left: ${left.slice(0, 5).join(", ")}`);
  }
  await chooseLanguage(store, "en");
  act.setViews(store, ["section"]);
  const keys = Object.keys(MESSAGES.en).length;
  return result("S-8", "In every language nothing in the app is left in English: its texts, its names and its tooltips", bad.length === 0, bad.slice(0, 4).join("; ") || `${LOCALES.length - 1} languages, ${keys} keys`);
}

/**
 * S-9: each moment passed going forward sounds its own sound, once; going back, a reset and a
 * link opened are silent; a refusal sounds the dull stop.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function sounds({ store, shell }) {
  /** @type {string[]} */
  const bad = [];
  const { sound } = shell;
  const play = sound.play;
  /** @type {string[]} */
  let heard = [];
  sound.play = (name) => void heard.push(name);
  try {
    for (let i = 0; i < 6; i++) act.step(store);
    if (heard.join() !== "lift,turn,shuttle,beat,fall,press") bad.push(`a pick sounds ${heard.join() || "nothing"}`);
    heard = [];
    act.stepBack(store);
    act.reset(store);
    await openLink(store, "#v=2&h=8&c=x.aa-55&l=1&p=1&s=3");
    if (heard.length) bad.push(`back, a reset and a link sound ${heard.join()}`);
    // playing at the fastest speed, every sound of a pick is still heard
    act.loadPreset(store, "plain");
    act.lace(store, true);
    act.reset(store);
    act.setSpeed(store, 60);
    heard = [];
    act.play(store);
    await sleep(1600);
    act.pause(store);
    act.setSpeed(store, 12);
    const fast = ["lift", "turn", "shuttle", "beat", "fall", "press"].filter((n) => !heard.includes(n));
    if (fast.length) bad.push(`at 60 picks a minute ${fast.join(", ")} not heard`);
    act.loadPreset(store, "blank");
    act.lace(store, false);
    heard = [];
    for (let i = 0; i < 12; i++) act.step(store);
    if (!heard.includes("refuse")) bad.push("running out of cards makes no sound");
  } finally {
    sound.play = play;
    act.loadPreset(store, "plain");
  }
  // every file loads and decodes, and starts within a fifth of a second of its file's start
  const { FILES, onset } = await import("../app/sound.js");
  const ctx = new OfflineAudioContext(1, 1, 44100);
  /** @type {string[]} */
  const starts = [];
  for (const [name, file] of Object.entries(FILES)) {
    try {
      const buffer = await ctx.decodeAudioData(await (await fetch(`audio/${file}`)).arrayBuffer());
      const at = onset(buffer);
      if (buffer.duration < 0.1 || at > 0.2) bad.push(`${file}: ${buffer.duration.toFixed(2)} s, starting at ${at.toFixed(2)} s`);
      starts.push(`${name} ${Math.round(at * 1000)} ms`);
    } catch {
      bad.push(`${file} does not load`);
    }
  }
  return result("S-9", "Each motion of a pick passed going forward sounds its own sound, once, as it happens, at every speed; back, a reset and a link are silent; a refusal sounds; every file loads, heard from where it starts", bad.length === 0, bad.slice(0, 4).join("; ") || `lift, turn, shuttle, beat, fall, press, stepped and at 60 picks a minute; silent back, reset and link; the refusal heard; started past ${starts.join(", ")}`);
}

/**
 * S-12: at every moment of a pick, the section labels the griffe and its knives beside the
 * griffe's frame where it is (not at the top of its travel), and on the same side throughout.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function griffeLabels({ store }) {
  /** @type {string[]} */
  const bad = [];
  act.setViews(store, ["section"]);
  const { t } = await import("../l10n/l10n.js");
  /** @type {Set<string>} */
  const sides = new Set();
  for (let k = 0; k <= 6; k++) {
    await frames();
    const frameBox = document.querySelector(".stage svg.section .griffe-frame")?.getBoundingClientRect();
    const find = (/** @type {string} */ key) => [...document.querySelectorAll(".stage svg.section .lbl")].find((e) => e.textContent === t(key))?.getBoundingClientRect();
    const [griffe, knives] = [find("part.griffe"), find("part.knives")];
    if (!frameBox || !griffe || !knives) {
      bad.push(`moment ${k}: ${!griffe ? "no griffe label" : "no knives label"}`);
    } else {
      for (const [name, r] of /** @type {const} */ ([["griffe", griffe], ["knives", knives]])) {
        if (r.bottom < frameBox.top - 4 || r.top > frameBox.bottom + 4) bad.push(`moment ${k}: the ${name} label is not beside the griffe`);
        sides.add(`${name}:${r.left >= frameBox.right ? "right" : "left"}`);
      }
    }
    act.step(store);
  }
  if (sides.size !== 2) bad.push(`the labels change sides: ${[...sides].join(", ")}`);
  act.reset(store);
  return result("S-12", "The griffe and its knives are labelled beside the griffe at every moment, on one side", bad.length === 0, bad.slice(0, 4).join("; ") || "7 moments, rest to shed closed and the next card");
}

/**
 * S-13: while the loom plays, a click is never lost: no control of the frame is replaced or has
 * its contents replaced (the play button's icon only when playing starts or stops), and a press
 * on a part of something drawn anew (a hook in the section, a hole in the chain) counts once,
 * even when it is redrawn between the press and its release.
 * @param {AppPage} page
 * @returns {Promise<CheckResult>}
 */
async function clicksWhilePlaying({ store }) {
  /** @type {string[]} */
  const bad = [];
  const ls = () => store.state.looms[store.state.current];
  act.setViews(store, ["section"]);
  act.loadPreset(store, "twill");
  await frames();
  act.play(store);
  await frames();
  const icon = $('.player [data-act="play"] .icon');
  /** @type {Set<string>} */
  const replaced = new Set();
  const CONTROLS = "button, select, input, label";
  const watch = new MutationObserver((ms) => {
    for (const m of ms) {
      const t = /** @type {Element} */ (m.target);
      const hit = [...m.removedNodes].some((n) => n instanceof Element && n.matches(CONTROLS)) || t.closest?.(CONTROLS);
      if (hit) replaced.add(`${(t.closest?.(CONTROLS) ?? t).tagName.toLowerCase()}.${String((t.closest?.(CONTROLS) ?? t).className).split(" ")[0]}`);
    }
  });
  for (const area of $$(".player, .panel-head, .setup-row, .pane-tools, .stage-tools, .trace-box, .topbar")) watch.observe(area, { childList: true, subtree: true, characterData: true });
  await sleep(800);
  watch.disconnect();
  if (replaced.size) bad.push(`replaced while playing: ${[...replaced].join(", ")}`);
  if ($('.player [data-act="play"] .icon') !== icon) bad.push("the pause button's icon is replaced while playing");
  if (getComputedStyle(/** @type {Element} */ (icon)).pointerEvents !== "none") bad.push("a button's icon takes the pointer");
  act.pause(store);
  /** A press on an element, then a redraw, then the release where it was pressed. @param {Element} part @param {Element} root @param {() => void} redraw */
  const pressAcross = async (part, root, redraw) => {
    const r = part.getBoundingClientRect();
    const at = { bubbles: true, button: 0, pointerId: 7, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    part.dispatchEvent(new PointerEvent("pointerdown", at));
    redraw();
    await frames();
    if (part.isConnected) bad.push("the part was not redrawn, so the check checks nothing");
    root.dispatchEvent(new PointerEvent("pointerup", at));
    await frames();
  };
  const hook = /** @type {Element} */ (document.querySelector('.stage svg.section polyline.hook[data-hook="2"]'));
  await pressAcross(hook, /** @type {Element} */ (document.querySelector(".stage svg.section")), () => act.touch(store));
  if (ls().follow?.hook !== 2) bad.push("a hook pressed across a redraw was not followed");
  act.follow(store, null);
  const card = 1;
  const before = ls().loom.deck.cards[card][0];
  const hole = /** @type {Element} */ (document.querySelector(`.chain [data-card="${card}"] .hole`));
  await pressAcross(hole, /** @type {Element} */ ($(".chain")), () => act.select(store, 3));
  if (ls().loom.deck.cards[card][0] === before) bad.push("a hole pressed across a redraw was not punched");
  // a plain click (no redraw between) counts once, not twice
  const once = /** @type {HTMLElement} */ (document.querySelector(`.chain [data-card="${card}"] .hole`));
  const r = once.getBoundingClientRect();
  const at = { bubbles: true, button: 0, pointerId: 8, clientX: r.left + 2, clientY: r.top + 2 };
  once.dispatchEvent(new PointerEvent("pointerdown", at));
  once.dispatchEvent(new PointerEvent("pointerup", at));
  // the click a press makes, sent late, as a tap's can be
  await sleep(60);
  once.dispatchEvent(new MouseEvent("click", { ...at, detail: 1 }));
  if (ls().loom.deck.cards[card][0] !== before) bad.push("a plain click on a hole counted twice");
  // a key's click (Enter on a hole) counts, even just after a press
  /** @type {HTMLElement} */ (document.querySelector(`.chain [data-card="${card}"] .hole`)).click();
  if (ls().loom.deck.cards[card][0] === before) bad.push("a key's click on a hole after a press did not count");
  act.loadPreset(store, "plain");
  return result("S-13", "While the loom plays no click is lost: no control is replaced, and a press on a part drawn anew counts once", bad.length === 0, bad.slice(0, 4).join("; ") || "0.8 s of playing: no control replaced; a hook and a hole pressed across a redraw; a click sent late counted once, a key's counted");
}
