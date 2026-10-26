// Name game prototype (design/public-app.md §2, design/name-game-notes.md): a name becomes a
// chain of cards (js/game/nameGame.js) and the loom weaves it, card by card, into cloth
// (js/view2d/clothView.js); when the chain has run, the page reads the cloth back as text.
// ?text=…&mode=damask|direct opens it with a name; ?selftest runs the game's checks and the page's.

import { result } from "../../js/accept/harness.js";
import { runGameChecks } from "../../js/accept/gameChecks.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { decodeCloth, planName, REFERENCE_HOOKS } from "../../js/game/nameGame.js";
import { Loom } from "../../js/sim/loom.js";
import { ClothView } from "../../js/view2d/clothView.js";
/** @import { Mode, NamePlan } from "../../js/game/nameGame.js" */
/** @import { CheckResult } from "../../js/accept/harness.js" */

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} id
 */
const $ = (id) => /** @type {T} */ (document.getElementById(id));

const query = new URLSearchParams(location.search);
const textBox = /** @type {HTMLTextAreaElement} */ ($("text"));
const speed = /** @type {HTMLInputElement} */ ($("speed"));
const warp = /** @type {HTMLInputElement} */ ($("warp"));
const weft = /** @type {HTMLInputElement} */ ($("weft"));
if (query.get("text")) textBox.value = /** @type {string} */ (query.get("text"));
/** @type {Mode} */
let mode = query.get("mode") === "direct" ? "direct" : "damask";
/** @type {NamePlan | null} */
let plan = null;
let loom = new Loom({ hooks: 8, cards: [], loop: false });
let playing = false;
let last = 0;
const cloth = new ClothView($("cloth"), { onCell: () => {} });

/** @param {string} text @param {boolean} [warn] */
function say(text, warn = false) {
  $("status").textContent = text;
  $("status").classList.toggle("warn", warn);
}

/** Reads the text again: new cards, the loom back at its first card. */
function replan() {
  pause();
  const r = planName(textBox.value, mode);
  for (const b of document.querySelectorAll("[data-mode]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.mode === mode);
  $("readback").textContent = "";
  for (const id of ["play", "all", "save", "share"]) /** @type {HTMLButtonElement} */ ($(id)).disabled = !r.ok;
  if (!r.ok) {
    plan = null;
    $("plan").textContent = r.reason;
    $("plan").classList.add("warn");
    return;
  }
  plan = r.plan;
  loom = new Loom(plan.deck);
  $("plan").classList.remove("warn");
  const f = plan.floats;
  $("plan").textContent = `${plan.text}${plan.mode === "direct" ? ` ${f.count} loose thread${f.count === 1 ? "" : "s"} longer than 8 (the longest: ${Math.max(f.longestWeft, f.longestWarp)}).` : " No thread lies loose over more than 8 others."}`;
  $("mode-note").textContent = mode === "damask"
    ? `Real cloth: each pixel is woven as a block of 4 × 4 threads of satin, as Jacquard weavers wove pictures and lettering, on the real head of ${REFERENCE_HOOKS} hooks. Every thread is held down.`
    : "Quick: one pixel per thread on a small head. Fast to weave, but where the letters leave blank ground, threads lie loose over it: real cloth would come apart.";
  say("Press Weave: the loom reads the cards one by one, and the cloth grows from the bottom.");
  draw();
}

function draw() {
  const snap = loom.snapshot();
  cloth.render(snap, { face: "front", warp: warp.value, weft: weft.value, bits: false, trace: null });
  if (!plan) return;
  const n = plan.deck.cards.length;
  if (loom.cloth.length >= n) {
    const read = decodeCloth(loom.cloth, plan);
    $("readback").innerHTML = "";
    $("readback").append(`The loom read ${n} cards and wove: `, Object.assign(document.createElement("strong"), { textContent: read.join(" / ") }));
  }
}

// ---- weaving --------------------------------------------------------------------------------
function pause() {
  playing = false;
  $("play").textContent = "▶ Weave";
}
$("play").addEventListener("click", () => {
  if (playing) return pause();
  if (!plan) return;
  if (loom.cloth.length >= plan.deck.cards.length) loom = new Loom(plan.deck);
  playing = true;
  last = performance.now();
  $("play").textContent = "❚❚ Pause";
  requestAnimationFrame(frame);
});
/** @param {number} now */
function frame(now) {
  if (!playing || !plan) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const r = loom.advance((dt * Number(speed.value)) / 60);
  if (!r.ok || loom.cloth.length >= plan.deck.cards.length) {
    pause();
    say(`Woven: ${plan.deck.cards.length} cards, ${plan.deck.cards.length} picks of weft.`);
  } else say(`Card ${loom.pick + 1} of ${plan.deck.cards.length}: ${loom.cloth.length} rows woven.`);
  draw();
  if (playing) requestAnimationFrame(frame);
}
$("all").addEventListener("click", () => {
  if (!plan) return;
  pause();
  loom = new Loom(plan.deck);
  loom.moveTo(plan.deck.cards.length, 0);
  say(`Woven at once: ${plan.deck.cards.length} cards.`);
  draw();
});
$("again").addEventListener("click", () => replan());
speed.addEventListener("input", () => ($("speed-out").textContent = speed.value));
textBox.addEventListener("input", () => replan());
for (const el of [warp, weft]) el.addEventListener("input", () => draw());
for (const b of document.querySelectorAll("[data-mode]")) {
  b.addEventListener("click", () => {
    mode = /** @type {Mode} */ (/** @type {HTMLElement} */ (b).dataset.mode);
    replan();
  });
}

// ---- keeping it ------------------------------------------------------------------------------
/**
 * The cloth as a picture: each thread crossing a few pixels, the warp's colour where it lies
 * over, the weft's where it lies under, the top of the cloth at the top.
 * @returns {Promise<Blob>}
 */
function picture() {
  const rows = loom.cloth;
  const ends = rows[0]?.length ?? 1;
  const s = Math.max(2, Math.min(12, Math.floor(1600 / ends)));
  const c = document.createElement("canvas");
  c.width = ends * s;
  c.height = Math.max(1, rows.length) * s;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  rows.forEach((row, p) => {
    const y = (rows.length - 1 - p) * s;
    row.forEach((up, e) => {
      g.fillStyle = up ? warp.value : weft.value;
      g.fillRect(e * s, y, s, s);
    });
  });
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("no picture"))), "image/png"));
}
$("save").addEventListener("click", async () => {
  if (!plan) return;
  if (loom.cloth.length < plan.deck.cards.length) {
    loom = new Loom(plan.deck);
    loom.moveTo(plan.deck.cards.length, 0);
    draw();
  }
  const url = URL.createObjectURL(await picture());
  const a = Object.assign(document.createElement("a"), { href: url, download: `woven-${plan.lines.join("-").replace(/[^A-Za-z0-9-]+/g, "_") || "name"}.png` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say("The picture of the cloth is saved.");
});
/** The page's link for this text and mode. */
function link() {
  const q = new URLSearchParams({ text: textBox.value, mode });
  history.replaceState(null, "", `?${q}`);
  return location.href;
}
$("share").addEventListener("click", () => {
  const url = link();
  navigator.clipboard?.writeText(url).then(
    () => say("Link copied: it opens the game with this name."),
    () => say("The link is in the address bar."),
  ) ?? say("The link is in the address bar.");
});

replan();
if (selftestRequested()) selftest();

async function selftest() {
  const t0 = performance.now();
  /** @type {CheckResult[]} */
  const results = runGameChecks();
  const bad = [];
  const keep = { text: textBox.value, mode };
  /** @param {string} t @param {Mode} m */
  const use = (t, m) => {
    textBox.value = t;
    textBox.dispatchEvent(new Event("input"));
    /** @type {HTMLElement} */ (document.querySelector(`[data-mode="${m}"]`)).click();
  };
  for (const [t, m, cards] of /** @type {[string, Mode, number][]} */ ([["JACQUARD", "damask", 64], ["Ada\nLovelace", "direct", 32]])) {
    use(t, m);
    /** @type {HTMLElement} */ ($("all")).click();
    if (loom.cloth.length !== cards) bad.push(`${JSON.stringify(t)}: ${loom.cloth.length} rows woven, not ${cards}`);
    const read = $("readback").textContent ?? "";
    if (!read.includes(t.split("\n").join(" / "))) bad.push(`${JSON.stringify(t)} reads back as "${read}"`);
    const canvas = /** @type {HTMLCanvasElement | null} */ (document.querySelector("#cloth canvas"));
    if (!canvas || canvas.height < cards) bad.push(`${JSON.stringify(t)}: the cloth is not drawn`);
  }
  use("Café", "damask");
  if (!/** @type {HTMLButtonElement} */ ($("play")).disabled || !$("plan").classList.contains("warn")) bad.push("a text outside the font is not refused on the page");
  use("JACQUARD", "damask");
  /** @type {HTMLElement} */ ($("all")).click();
  const blob = await picture();
  if (blob.size < 100 || blob.type !== "image/png") bad.push(`the picture is ${blob.size} bytes of ${blob.type}`);
  const url = new URL(link());
  if (url.searchParams.get("text") !== "JACQUARD" || url.searchParams.get("mode") !== "damask") bad.push(`the link is ${url.search}`);
  results.push(result("G-5", "On the page, a name typed is woven (all at once) into its rows and read back from the cloth, in both modes; a text outside the font greys Weave and says why; the cloth saves as a PNG picture; the link carries the text and the mode", bad.length === 0, bad.join("; ") || `2 names woven and read back; a ${blob.size}-byte picture`));
  textBox.value = keep.text;
  mode = keep.mode;
  history.replaceState(null, "", `?selftest`);
  replan();
  showSelftest(/** @type {HTMLElement} */ ($("game-panel")), results, performance.now() - t0);
}
