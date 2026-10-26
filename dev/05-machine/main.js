// M4 developer page: the ghosted whole loom with the five core units in place and the repeat
// bands (js/scene/unitsView.js), posed by the loom's simulation, beside the 2D section at the
// same moment. ?selftest runs the M3 and M4 checks on the files the page loaded, and the
// page's own.

import { result } from "../../js/accept/harness.js";
import { runM3Checks } from "../../js/accept/m3Checks.js";
import { runM4Checks } from "../../js/accept/m4Checks.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { HOOK_COUNTS, presetDeck, PRESETS } from "../../js/sim/deck.js";
import { Loom, STOP_NAMES, STOPS } from "../../js/sim/loom.js";
import { UNITS } from "../../js/scene/units.js";
import { UnitsView } from "../../js/scene/unitsView.js";
import { sectionLayout } from "../../js/view2d/layout.js";
import { SectionView } from "../../js/view2d/sectionView.js";
/** @import { UnitId, Unit } from "../../js/scene/units.js" */

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} id
 */
const $ = (id) => /** @type {T} */ (document.getElementById(id));

// A head of 24 hooks: its card has 3 columns, one per cross-row, so the selector shows the
// needles reading one column of it (hook 12 is in column 2, row 4).
let loom = new Loom(presetDeck("arrow", 24));
let hook = 11;
let playing = false;
let last = 0;
const view = new UnitsView($("units3d"), { onChange: (mode) => mark(mode) });
/** For inspecting the scene from the browser's console. */
/** @type {Window & { unitsView?: UnitsView }} */ (window).unitsView = view;

const MACHINE_IDEA = "The whole loom, ghosted, with one of each core unit where it stands. The blue bands mark where the real machine repeats a unit, with how many: 416 hooks and needles in the 400 head, 1,600 harness cords and warp ends with a 4-repeat tie. Click a unit, or a band's label, to open it alone.";
const section = new SectionView($("section"));
const preset = /** @type {HTMLSelectElement} */ ($("preset"));
const hooksSelect = /** @type {HTMLSelectElement} */ ($("hooks"));
const hookSelect = /** @type {HTMLSelectElement} */ ($("hook"));
const speed = /** @type {HTMLInputElement} */ ($("speed"));

/** @param {string} text @param {boolean} [warn] */
function say(text, warn = false) {
  $("status").textContent = text;
  $("status").classList.toggle("warn", warn);
}

for (const [key, p] of Object.entries(PRESETS)) preset.add(new Option(p.label.replace(/ \(.*\)$/, ""), key, key === "arrow", key === "arrow"));
for (const n of HOOK_COUNTS) hooksSelect.add(new Option(String(n), String(n)));
function fillHooks() {
  hookSelect.innerHTML = "";
  for (let h = 0; h < loom.deck.hooks; h++) hookSelect.add(new Option(`Hook ${h + 1}`, String(h)));
  hook = Math.min(hook, loom.deck.hooks - 1);
  hookSelect.value = String(hook);
  hooksSelect.value = String(loom.deck.hooks);
}
fillHooks();

function newDeck() {
  loom = new Loom(presetDeck(preset.value, Number(hooksSelect.value)));
  fillHooks();
  say(`New cards: ${PRESETS[preset.value].label}, on ${loom.deck.hooks} hooks. The loom is back at the first card.`);
  draw();
}
preset.addEventListener("change", newDeck);
hooksSelect.addEventListener("change", newDeck);
hookSelect.addEventListener("change", () => {
  hook = Number(hookSelect.value);
  say(`The selector and the harness line now show hook ${hook + 1}.`);
  draw();
});

// The list: the whole loom, then each unit.
$("unit-list").innerHTML = [`<li><button type="button" data-unit="machine"><span class="code">◎</span><span>The whole loom</span></button></li>`, ...UNITS.map((u) => `<li><button type="button" data-unit="${u.id}"><span class="code">${u.code}</span><span>${u.title}</span></button></li>`)].join("");
/** @param {"machine" | UnitId} mode */
function mark(mode) {
  for (const b of document.querySelectorAll("[data-unit]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.unit === mode);
  $("unit-idea").textContent = UNITS.find((u) => u.id === mode)?.idea ?? MACHINE_IDEA;
}
/** @param {"machine" | UnitId} mode */
function showUnit(mode) {
  if (mode === "machine") view.showMachine();
  else view.show(mode);
}
$("unit-list").addEventListener("click", (e) => {
  const b = /** @type {Element} */ (e.target).closest("[data-unit]");
  if (b instanceof HTMLElement) showUnit(/** @type {"machine" | UnitId} */ (b.dataset.unit));
});

// Turning the loom.
$("stops").innerHTML = STOP_NAMES.map((n, i) => `<li data-stop="${i}">${n}</li>`).join("");
function pause() {
  playing = false;
  $("play").textContent = "▶ Play";
}
$("fwd").addEventListener("click", () => {
  pause();
  const r = loom.stepForward();
  say(r.ok ? `Step: ${r.message}` : r.reason, !r.ok);
  draw();
});
$("back").addEventListener("click", () => {
  pause();
  const r = loom.stepBack();
  say(r.ok ? r.message : r.reason, !r.ok);
  draw();
});
$("reset").addEventListener("click", () => {
  pause();
  loom.reset();
  say("Reset: back at the first card, with no cloth.");
  draw();
});
speed.addEventListener("input", () => ($("speed-out").textContent = speed.value));
$("play").addEventListener("click", () => {
  if (playing) return pause();
  const can = loom.phi === 0 ? loom.canStart() : { ok: true };
  if (!can.ok) return say(/** @type {{ reason: string }} */ (can).reason, true);
  playing = true;
  last = performance.now();
  $("play").textContent = "❚❚ Pause";
  requestAnimationFrame(frame);
});
/** @param {number} now */
function frame(now) {
  if (!playing) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const r = loom.advance((dt * Number(speed.value)) / 60);
  if (!r.ok) {
    pause();
    say(r.reason, true);
  }
  draw();
  if (playing) requestAnimationFrame(frame);
}

function draw() {
  const snap = loom.snapshot();
  view.pose(snap, hook);
  section.render(sectionLayout(snap, Math.floor(hook / 8)), { follow: hook, view: "whole", labels: false });
  const at = STOPS.findIndex((s) => Math.abs(s - snap.phi) < 1e-9);
  const atStop = snap.phi === 0 ? STOPS.length - 1 : at;
  for (const li of document.querySelectorAll("#stops li")) {
    const i = Number(/** @type {HTMLElement} */ (li).dataset.stop);
    li.classList.toggle("done", snap.phi > 0 && STOPS[i] <= snap.phi + 1e-9);
    li.classList.toggle("here", i === atStop);
  }
  const h = snap.head.hooks[hook];
  $("where").textContent = `Pick ${snap.pick + 1} · ${Math.round(snap.phi * 100)} % through · hook ${hook + 1} (card column ${Math.floor(hook / 8) + 1}, row ${(hook % 8) + 1}) ${h.caught ? "is lifted" : h.selected ? "is chosen" : "is not chosen"} on this card`;
}
window.addEventListener("resize", () => draw());

showUnit("machine");
draw();
view
  .load((f) => ($("loading").textContent = `Loading the units… ${Math.round(f * 100)} %`))
  .then(() => {
    $("loading").remove();
    showUnit(view.mode);
    draw();
    if (selftestRequested()) selftest();
  })
  .catch((e) => {
    $("loading").textContent = `The units could not be loaded: ${e}`;
  });

function selftest() {
  const t0 = performance.now();
  const units = /** @type {Record<UnitId, Unit>} */ (view.units);
  const context = /** @type {import("three").Object3D} */ (view.context);
  const results = [...runM3Checks(units), ...runM4Checks(context, units)];
  // The page: the whole loom shows the ghost, every unit and the band labels, clear of each
  // other; a band's label opens its unit alone; the list brings the whole loom back.
  const bad = [];
  view.showMachine(false);
  view.placeTags();
  const tags = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".band-tag")]).filter((t) => !t.hidden);
  if (!context.visible || Object.values(units).some((u) => !u.root.visible)) bad.push("the whole loom does not show the ghost and every unit");
  if (tags.length !== 4) bad.push(`${tags.length} band labels shown`);
  const rects = tags.map((t) => t.getBoundingClientRect());
  rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => {
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) bad.push("two band labels overlap");
  }));
  tags.find((t) => t.textContent?.includes("harness"))?.click();
  if (view.mode !== "harness" || context.visible) bad.push(`the harness band's label opened ${view.mode}`);
  /** @type {HTMLElement} */ (document.querySelector('[data-unit="machine"]')).click();
  if (view.mode !== "machine") bad.push("the list did not bring the whole loom back");
  view.showMachine(false);
  results.push(result("J4-9", "On the page, the whole loom shows the ghost, every unit and the band labels clear of each other; a band's label opens its unit alone, and the list brings the whole loom back", bad.length === 0, bad.join("; ") || `${tags.length} band labels`));
  draw();
  showSelftest($("side-panel"), results, performance.now() - t0);
}
