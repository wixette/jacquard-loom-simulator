// M3 developer page: the five core units in 3D (js/scene/unitsView.js), posed by the loom's
// simulation, beside the 2D section at the same moment. ?selftest runs the M3 checks on the
// files the page loaded, and the page's own.

import { result } from "../../js/accept/harness.js";
import { runM3Checks } from "../../js/accept/m3Checks.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { msg, say as words, t } from "../../js/l10n/l10n.js";
import { HOOK_COUNTS, presetDeck, PRESETS } from "../../js/sim/deck.js";
import { Loom, STOP_KEYS, STOPS } from "../../js/sim/loom.js";
import { UNITS } from "../../js/scene/units.js";
import { UnitsView } from "../../js/scene/unitsView.js";
import { sectionLayout } from "../../js/view2d/layout.js";
import { SectionView } from "../../js/view2d/sectionView.js";
/** @import { Msg } from "../../js/l10n/l10n.js" */
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
const view = new UnitsView($("units3d"));
/** For inspecting the scene from the browser's console. */
/** @type {Window & { unitsView?: UnitsView }} */ (window).unitsView = view;
const section = new SectionView($("section"));
const preset = /** @type {HTMLSelectElement} */ ($("preset"));
const hooksSelect = /** @type {HTMLSelectElement} */ ($("hooks"));
const hookSelect = /** @type {HTMLSelectElement} */ ($("hook"));
const speed = /** @type {HTMLInputElement} */ ($("speed"));

/** @param {string | Msg} text @param {boolean} [warn] */
function say(text, warn = false) {
  $("status").textContent = typeof text === "string" ? text : words(text);
  $("status").classList.toggle("warn", warn);
}

for (const [key, p] of Object.entries(PRESETS)) preset.add(new Option(t(p.name), key, key === "arrow", key === "arrow"));
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
  say(`New cards: ${t(PRESETS[preset.value].name)}, on ${loom.deck.hooks} hooks. The loom is back at the first card.`);
  draw();
}
preset.addEventListener("change", newDeck);
hooksSelect.addEventListener("change", newDeck);
hookSelect.addEventListener("change", () => {
  hook = Number(hookSelect.value);
  say(`The selector and the harness line now show hook ${hook + 1}.`);
  draw();
});

// The unit list.
$("unit-list").innerHTML = UNITS.map((u) => `<li><button type="button" data-unit="${u.id}"><span class="code">${u.code}</span><span>${t(u.title)}</span></button></li>`).join("");
/** @param {UnitId} id */
function showUnit(id) {
  view.show(id);
  const spec = /** @type {import("../../js/scene/units.js").UnitSpec} */ (UNITS.find((u) => u.id === id));
  for (const b of document.querySelectorAll("[data-unit]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.unit === id);
  $("unit-idea").textContent = t(spec.idea);
}
$("unit-list").addEventListener("click", (e) => {
  const b = /** @type {Element} */ (e.target).closest("[data-unit]");
  if (b instanceof HTMLElement) showUnit(/** @type {UnitId} */ (b.dataset.unit));
});

// Turning the loom.
$("stops").innerHTML = STOP_KEYS.map((k, i) => `<li data-stop="${i}">${t(k)}</li>`).join("");
function pause() {
  playing = false;
  $("play").textContent = "▶ Play";
}
$("fwd").addEventListener("click", () => {
  pause();
  const r = loom.stepForward();
  say(r.ok ? msg("status.step", { what: r.message }) : r.reason, !r.ok);
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
  if (!can.ok) return say(/** @type {{ reason: Msg }} */ (can).reason, true);
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

showUnit("selector");
draw();
view
  .load((f) => ($("loading").textContent = `Loading the units… ${Math.round(f * 100)} %`))
  .then(() => {
    $("loading").remove();
    showUnit(view.mode === "machine" ? "selector" : view.mode);
    draw();
    if (selftestRequested()) selftest();
  })
  .catch((e) => {
    $("loading").textContent = `The units could not be loaded: ${e}`;
  });

function selftest() {
  const t0 = performance.now();
  const units = /** @type {Record<UnitId, Unit>} */ (view.units);
  const results = runM3Checks(units);
  // The page: each unit, chosen, is shown alone and framed in the canvas.
  const bad = [];
  for (const spec of UNITS) {
    showUnit(spec.id);
    const shown = Object.entries(units).filter(([, u]) => u.root.visible).map(([k]) => k);
    if (shown.join() !== spec.id) bad.push(`with ${spec.code} chosen, ${shown.join(", ")} shown`);
  }
  showUnit("selector");
  results.push(result("J3-10", "On the page, each unit chosen from the list is shown alone and framed", bad.length === 0, bad.join("; ") || "5 units"));
  draw();
  showSelftest($("side-panel"), results, performance.now() - t0);
}
