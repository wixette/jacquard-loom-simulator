// M0 developer page: one cross-row of a Jacquard head in 2D. Punch the cards, step or play
// the pick cycle in the section, watch the cloth.

import { runM0Checks } from "../../js/accept/m0Checks.js";
import { checkLabels } from "../../js/accept/labelCheck.js";
import { selftestRequested, showSelftest } from "../../js/accept/selftestPanel.js";
import { addCard, duplicateCard, invertCard, makeDeck, moveCard, PRESETS, removeCard, setLoop, toggleHole } from "../../js/sim/deck.js";
import { Loom, STOP_NAMES, STOPS } from "../../js/sim/loom.js";
import { hookOfEnd } from "../../js/sim/tieup.js";
import { CardEditor } from "../../js/view2d/cardEditor.js";
import { ClothGrid } from "../../js/view2d/clothGrid.js";
import { sectionLayout } from "../../js/view2d/layout.js";
import { SectionView } from "../../js/view2d/sectionView.js";
/** @import { Deck } from "../../js/sim/deck.js" */
/** @import { Tie } from "../../js/sim/tieup.js" */

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} id
 */
const $ = (id) => /** @type {T} */ (document.getElementById(id));

const HOOKS = 8;
const START = "arrow";

/** @param {string} name @returns {Deck} */
const presetDeck = (name) => makeDeck(HOOKS, PRESETS[name].rows, PRESETS[name].loop);

const loom = new Loom(presetDeck(START));
const section = new SectionView($("section"));
/** @type {number | null} */
let follow = null;
let selected = 0;
/** @type {"whole" | "needles" | "crooks"} */
let view = "whole";
let playing = false;
let last = 0;

const status = $("status");
/** @param {string} text @param {boolean} [warn] */
function say(text, warn = false) {
  status.textContent = text;
  status.classList.toggle("warn", warn);
}

const cards = new CardEditor($("cards"), {
  onToggle(i, h) {
    const was = loom.deck.cards[i][h];
    setDeck(toggleHole(loom.deck, i, h));
    selected = i;
    say(`Card ${i + 1}, hole ${h + 1}: ${was ? "filled again (blank: hook " + (h + 1) + " stays down)" : "punched (hook " + (h + 1) + " will lift)"}.`);
  },
  onSelect(i) {
    selected = i;
    invalidate();
  },
});

const cloth = new ClothGrid($("cloth"), {
  onEnd(e) {
    setFollow(hookOfEnd(loom.tie, HOOKS, e) - 1);
  },
});

/** @param {Deck} deck */
function setDeck(deck) {
  loom.setDeck(deck);
  selected = Math.min(selected, deck.cards.length - 1);
  invalidate();
}

/** @param {number | null} k */
function setFollow(k) {
  follow = k;
  $("unfollow").hidden = k === null;
  $("follow-text").textContent =
    k === null
      ? "Click any needle, hook, knife or mail in the section, or a column of the cloth, to follow that hook everywhere."
      : `Following hook ${k + 1}: needle ${k + 1} (tier ${k + 1} from the top), its hook, its knife, its cord and mail, hole ${k + 1} of every card, and the warp ends it lifts.`;
  invalidate();
}

// ---- controls ---------------------------------------------------------------------------
const preset = /** @type {HTMLSelectElement} */ ($("preset"));
for (const [key, p] of Object.entries(PRESETS)) preset.add(new Option(p.label, key, key === START, key === START));
$("load").addEventListener("click", () => {
  pause();
  loom.setDeck(presetDeck(preset.value));
  loom.reset();
  selected = 0;
  say(`Loaded: ${PRESETS[preset.value].label}. The loom is back at the first card.`);
  invalidate();
});

/** @param {string} id @param {() => void} fn */
const on = (id, fn) => $(id).addEventListener("click", fn);
on("add", () => {
  setDeck(addCard(loom.deck, selected));
  selected = Math.min(selected + 1, loom.deck.cards.length - 1);
  say(`A blank card was added as card ${selected + 1}.`);
});
on("dup", () => {
  if (selected < 0) return;
  setDeck(duplicateCard(loom.deck, selected));
  say(`Card ${selected + 1} was duplicated.`);
  selected += 1;
});
on("del", () => {
  if (selected < 0) return;
  const n = selected + 1;
  setDeck(removeCard(loom.deck, selected));
  say(`Card ${n} was taken out of the chain.`);
});
on("up", () => {
  if (selected <= 0) return;
  setDeck(moveCard(loom.deck, selected, -1));
  selected -= 1;
});
on("down", () => {
  if (selected < 0 || selected >= loom.deck.cards.length - 1) return;
  setDeck(moveCard(loom.deck, selected, 1));
  selected += 1;
});
on("inv", () => {
  if (selected < 0) return;
  setDeck(invertCard(loom.deck, selected));
  say(`Card ${selected + 1} inverted: its holes are blanks and its blanks holes.`);
});
const loopBox = /** @type {HTMLInputElement} */ ($("loop"));
loopBox.addEventListener("change", () => {
  setDeck(setLoop(loom.deck, loopBox.checked));
  say(loopBox.checked ? "The chain is laced into a loop: after the last card, card 1 comes round again." : "The chain is open: the loom stops after the last card.");
});

const tieSelect = /** @type {HTMLSelectElement} */ ($("tie"));
tieSelect.addEventListener("change", () => {
  pause();
  /** @type {Record<string, Tie>} */
  const ties = { s1: { kind: "straight", repeats: 1 }, s3: { kind: "straight", repeats: 3 }, p: { kind: "point" } };
  loom.setTie(ties[tieSelect.value]);
  say("A new tie-up changes the warp, so the loom starts again from card 1.");
  invalidate();
});

for (const b of document.querySelectorAll("[data-view]")) {
  b.addEventListener("click", () => {
    view = /** @type {"whole" | "needles" | "crooks"} */ (/** @type {HTMLElement} */ (b).dataset.view);
    for (const o of document.querySelectorAll("[data-view]")) o.classList.toggle("on", o === b);
    invalidate();
  });
}
const labelsBox = /** @type {HTMLInputElement} */ ($("labels"));
labelsBox.addEventListener("change", () => invalidate());

$("section").addEventListener("click", (e) => {
  const t = /** @type {Element} */ (e.target).closest("[data-hook]");
  if (t instanceof SVGElement && t.dataset.hook !== undefined) setFollow(Number(t.dataset.hook));
});
on("unfollow", () => setFollow(null));

on("fwd", () => {
  pause();
  const r = loom.stepForward();
  say(r.ok ? `Step: ${r.message}` : r.reason, !r.ok);
  invalidate();
});
on("back", () => {
  pause();
  const r = loom.stepBack();
  say(r.ok ? r.message : r.reason, !r.ok);
  invalidate();
});
on("reset", () => {
  pause();
  loom.reset();
  say("Reset: back at card 1, with no cloth.");
  invalidate();
});

const speed = /** @type {HTMLInputElement} */ ($("speed"));
speed.addEventListener("input", () => ($("speed-out").textContent = speed.value));

function pause() {
  playing = false;
  $("play").textContent = "▶ Play";
}
on("play", () => {
  if (playing) {
    pause();
    return;
  }
  const can = loom.phi === 0 ? loom.canStart() : { ok: true };
  if (!can.ok) {
    say(/** @type {{ reason: string }} */ (can).reason, true);
    return;
  }
  playing = true;
  last = performance.now();
  $("play").textContent = "❚❚ Pause";
  requestAnimationFrame(frame);
});

// The stops of one pick, as a strip that shows where the loom is.
$("stops").innerHTML = STOP_NAMES.map((n, i) => `<li data-stop="${i}">${n}</li>`).join("");

// ---- drawing: at once after every action; every frame only while playing ------------------
function invalidate() {
  draw();
}

/** @param {number} now */
function frame(now) {
  if (!playing) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const before = { pick: loom.pick, phi: loom.phi };
  const r = loom.advance((dt * Number(speed.value)) / 60);
  if (!r.ok) {
    pause();
    say(r.reason, true);
  } else {
    // Say what happened at each stop passed.
    STOPS.forEach((s, i) => {
      const passed = loom.pick > before.pick ? s > before.phi : s > before.phi && s <= loom.phi;
      if (passed) say(loom.stopMessage(i, before.pick));
    });
  }
  draw();
  if (playing) requestAnimationFrame(frame);
}

function draw() {
  const snap = loom.snapshot();
  section.render(sectionLayout(snap), { follow, view, labels: labelsBox.checked });
  cards.render(snap, selected, follow);
  cloth.render(snap, follow);
  loopBox.checked = loom.deck.loop;
  const at = STOPS.findIndex((s) => Math.abs(s - snap.phi) < 1e-9);
  const atStop = snap.phi === 0 ? STOPS.length - 1 : at;
  for (const li of document.querySelectorAll("#stops li")) {
    const i = Number(/** @type {HTMLElement} */ (li).dataset.stop);
    li.classList.toggle("done", snap.phi > 0 && STOPS[i] <= snap.phi + 1e-9);
    li.classList.toggle("here", i === atStop);
  }
  const card = snap.cardIndex === null ? "no card" : `card ${snap.cardIndex + 1}`;
  $("where").textContent = `Pick ${snap.pick + 1} (${card}) · ${Math.round(snap.phi * 100)} % through · ${snap.cloth.length} row${snap.cloth.length === 1 ? "" : "s"} woven`;
}

window.addEventListener("resize", () => draw());
draw();

if (selftestRequested()) {
  const t0 = performance.now();
  const results = runM0Checks();
  // The labels as shown, in each view of the section (then back to the view the page had).
  const viewButtons = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-view]")]);
  const was = viewButtons.find((b) => b.classList.contains("on")) ?? viewButtons[0];
  results.push(
    ...checkLabels(
      () => /** @type {SVGSVGElement[]} */ ([...document.querySelectorAll("svg.section, svg.cloth")]),
      [...viewButtons.map((b) => ({ name: `${b.textContent} view`, show: () => b.click() })), { name: "back", show: () => was.click() }],
    ),
  );
  showSelftest($("side"), results, performance.now() - t0);
}
