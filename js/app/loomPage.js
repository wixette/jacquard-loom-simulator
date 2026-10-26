// The loom page: everything a page with the whole loom in 2D does, shared by the learner
// page (index.html) and the M1 developer page (dev/02-loom). A head of 8 to 64 hooks, the
// chain of cards with the real card on the bench, the head in section, the loom from the
// side and from the front, the woven cloth, the trace of any thread, and links. The page
// supplies the elements, by id; createLoomPage() wires them and returns what other parts of
// a page (lessons, the picture helper) need to drive the loom.

import { addCard, duplicateCard, HOOK_COUNTS, invertCard, moveCard, presetDeck, PRESETS, removeCard, resizeDeck, setLoop, toggleHole } from "../sim/deck.js";
import { decodeLink, encodeLink } from "../sim/link.js";
import { Loom, POSITIONS, STOP_NAMES, STOPS } from "../sim/loom.js";
import { endCount, hookOfEnd, tieLabel } from "../sim/tieup.js";
import { followCell, traceOf } from "../sim/trace.js";
import { ChainEditor } from "../view2d/chainEditor.js";
import { ClothView } from "../view2d/clothView.js";
import { frontLayout, FrontView } from "../view2d/frontView.js";
import { sectionLayout } from "../view2d/layout.js";
import { SectionView } from "../view2d/sectionView.js";
import { sideLayout, SideView } from "../view2d/sideView.js";
/** @import { Deck } from "../sim/deck.js" */
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Tie } from "../sim/tieup.js" */
/** @import { Follow } from "../sim/trace.js" */

/**
 * @typedef {object} LoomPage
 * @property {Loom} loom
 * @property {() => void} draw
 * @property {(text: string, warn?: boolean) => void} say
 * @property {() => void} pause
 * @property {(o: { deck: Deck, tie?: Tie, follow?: Follow | null, message?: string, view?: "whole" | "needles" | "crooks" }) => void} open
 * @property {Follow | null} follow the thread followed, if any
 */

/**
 * Wires the loom page's elements (found by id) and starts it.
 * @param {{ deck?: Deck, tie?: Tie, onDraw?: (snap: Snapshot) => void }} [options]
 * @returns {LoomPage}
 */
export function createLoomPage(options = {}) {
  /**
   * @template {HTMLElement} [T=HTMLElement]
   * @param {string} id
   */
  const $ = (id) => /** @type {T} */ (document.getElementById(id));

  /** @type {Record<string, Tie>} */
  const TIES = {
    s1: { kind: "straight", repeats: 1 },
    s2: { kind: "straight", repeats: 2 },
    s3: { kind: "straight", repeats: 3 },
    s4: { kind: "straight", repeats: 4 },
    p: { kind: "point" },
  };
  /** @param {Tie} t */
  const tieKey = (t) => (t.kind === "point" ? "p" : `s${t.repeats}`);

  let loom = new Loom(options.deck ?? presetDeck("arrow", 16), options.tie ?? TIES.s1);
  let selected = 0;
  /** @type {Follow | null} */
  let follow = null;
  let crossRow = 0;
  /** @type {"whole" | "needles" | "crooks"} */
  let view = "whole";
  /** @type {"front" | "back"} */
  let face = "front";
  let playing = false;
  let last = 0;

  const section = new SectionView($("section"));
  const side = new SideView($("side"));
  const front = new FrontView($("front"));
  const status = $("status");
  const hooksSelect = /** @type {HTMLSelectElement} */ ($("hooks"));
  const preset = /** @type {HTMLSelectElement} */ ($("preset"));
  const cross = /** @type {HTMLSelectElement} */ ($("cross"));
  const tieSelect = /** @type {HTMLSelectElement} */ ($("tie"));
  const warp = /** @type {HTMLInputElement} */ ($("warp"));
  const weft = /** @type {HTMLInputElement} */ ($("weft"));
  const bits = /** @type {HTMLInputElement} */ ($("bits"));
  const loopBox = /** @type {HTMLInputElement} */ ($("loop"));
  const speed = /** @type {HTMLInputElement} */ ($("speed"));

  /** @param {string} text @param {boolean} [warn] */
  function say(text, warn = false) {
    status.textContent = text;
    status.classList.toggle("warn", warn);
  }

  const chain = new ChainEditor($("bench"), $("chain"), {
    onToggle(i, h) {
      const was = loom.deck.cards[i][h];
      setDeck(toggleHole(loom.deck, i, h));
      selected = i;
      say(`Card ${i + 1}, hole ${h + 1}: ${was ? `filled again (hook ${h + 1} stays down)` : `punched (hook ${h + 1} will lift)`}.`);
      draw();
    },
    onSelect(i) {
      selected = i;
      draw();
    },
    onFollow(h) {
      setFollow({ hook: h, end: null, pick: null });
    },
  });

  const cloth = new ClothView($("cloth"), {
    onCell(pick, end) {
      setFollow(followCell(loom.snapshot(), pick, end));
    },
  });

  /** @param {Deck} deck */
  function setDeck(deck) {
    loom.setDeck(deck);
    selected = Math.max(0, Math.min(selected, deck.cards.length - 1));
  }

  /** @param {Follow | null} f */
  function setFollow(f) {
    follow = f;
    if (f) crossRow = Math.floor(f.hook / 8);
    $("unfollow").hidden = f === null;
    draw();
  }

  /**
   * A new loom: another head or another tie. The cloth starts again.
   * @param {Deck} deck
   * @param {Tie} tie
   */
  function newLoom(deck, tie) {
    pause();
    loom = new Loom(deck, tie);
    selected = 0;
    crossRow = Math.min(crossRow, deck.hooks / 8 - 1);
    if (follow && (follow.hook >= deck.hooks || (follow.end !== null && follow.end > endCount(tie, deck.hooks)))) follow = null;
    $("unfollow").hidden = follow === null;
  }

  // ---- controls ---------------------------------------------------------------------------
  for (const n of HOOK_COUNTS) hooksSelect.add(new Option(`${n} hooks (${n / 8} cross-row${n === 8 ? "" : "s"})`, String(n)));
  for (const [key, p] of Object.entries(PRESETS)) preset.add(new Option(p.label.replace(/ \(.*\)$/, ""), key, key === "arrow", key === "arrow"));
  for (const [key, t] of Object.entries(TIES)) tieSelect.add(new Option(`${tieLabel(t)[0].toUpperCase()}${tieLabel(t).slice(1)}`, key));

  function syncControls() {
    hooksSelect.value = String(loom.deck.hooks);
    tieSelect.value = tieKey(loom.tie);
    loopBox.checked = loom.deck.loop;
    const n = loom.deck.hooks / 8;
    if (cross.options.length !== n) {
      cross.innerHTML = "";
      for (let c = 0; c < n; c++) cross.add(new Option(`${c + 1} (hooks ${c * 8 + 1}–${c * 8 + 8})`, String(c)));
    }
    cross.value = String(crossRow);
    cross.disabled = n === 1;
  }

  hooksSelect.addEventListener("change", () => {
    const h = Number(hooksSelect.value);
    newLoom(resizeDeck(loom.deck, h), loom.tie);
    say(`The head now has ${h} hooks in ${h / 8} cross-row${h === 8 ? "" : "s"}. The cards were ${h > loom.deck.cards[0]?.length ? "filled out with blanks" : "cut to fit"}, and the loom starts again.`);
    draw();
  });
  $("load").addEventListener("click", () => {
    newLoom(presetDeck(preset.value, loom.deck.hooks), loom.tie);
    say(`Loaded: ${PRESETS[preset.value].label.replace(/\(.*\)/, "").trim()}, repeated across ${loom.deck.hooks} hooks. The loom is back at the first card.`);
    draw();
  });
  tieSelect.addEventListener("change", () => {
    newLoom(loom.deck, TIES[tieSelect.value]);
    say(`${tieLabel(loom.tie)[0].toUpperCase()}${tieLabel(loom.tie).slice(1)}: ${endCount(loom.tie, loom.deck.hooks)} warp ends from ${loom.deck.hooks} hooks. A new tie-up changes the warp, so the loom starts again.`);
    draw();
  });
  cross.addEventListener("change", () => {
    crossRow = Number(cross.value);
    draw();
  });

  /** @param {string} id @param {() => void} fn */
  const on = (id, fn) => $(id).addEventListener("click", () => {
    fn();
    draw();
  });
  on("add", () => {
    setDeck(addCard(loom.deck, selected));
    selected = Math.min(selected + 1, loom.deck.cards.length - 1);
    say(`A blank card was added as card ${selected + 1}.`);
  });
  on("dup", () => {
    if (!loom.deck.cards.length) return;
    setDeck(duplicateCard(loom.deck, selected));
    say(`Card ${selected + 1} was duplicated.`);
    selected += 1;
  });
  on("del", () => {
    if (!loom.deck.cards.length) return;
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
    if (selected >= loom.deck.cards.length - 1) return;
    setDeck(moveCard(loom.deck, selected, 1));
    selected += 1;
  });
  on("inv", () => {
    if (!loom.deck.cards.length) return;
    setDeck(invertCard(loom.deck, selected));
    say(`Card ${selected + 1} inverted: its holes are blanks and its blanks holes.`);
  });
  loopBox.addEventListener("change", () => {
    setDeck(setLoop(loom.deck, loopBox.checked));
    say(loopBox.checked ? "The chain is laced into a loop: after the last card, the first comes round again." : "The chain is open: the loom stops after the last card.");
    draw();
  });

  for (const b of document.querySelectorAll("[data-view]")) {
    b.addEventListener("click", () => {
      view = /** @type {"whole" | "needles" | "crooks"} */ (/** @type {HTMLElement} */ (b).dataset.view);
      for (const o of document.querySelectorAll("[data-view]")) o.classList.toggle("on", o === b);
      draw();
    });
  }
  for (const b of document.querySelectorAll("[data-face]")) {
    b.addEventListener("click", () => {
      face = /** @type {"front" | "back"} */ (/** @type {HTMLElement} */ (b).dataset.face);
      draw();
    });
  }
  for (const el of [warp, weft, bits]) el.addEventListener("input", () => draw());

  $("section").addEventListener("click", (e) => {
    const t = /** @type {Element} */ (e.target).closest("[data-hook]");
    if (t instanceof SVGElement && t.dataset.hook !== undefined) setFollow({ hook: Number(t.dataset.hook), end: null, pick: null });
  });
  $("front").addEventListener("click", (e) => {
    const t = /** @type {Element} */ (e.target).closest("[data-end], [data-hook]");
    if (!(t instanceof SVGElement)) return;
    if (t.dataset.end) {
      const end = Number(t.dataset.end);
      setFollow({ hook: hookOfEnd(loom.tie, loom.deck.hooks, end) - 1, end, pick: null });
    } else if (t.dataset.hook) setFollow({ hook: Number(t.dataset.hook), end: null, pick: null });
  });
  on("unfollow", () => setFollow(null));

  on("fwd", () => {
    pause();
    const r = loom.stepForward();
    say(r.ok ? `Step: ${r.message}` : r.reason, !r.ok);
  });
  on("back", () => {
    pause();
    const r = loom.stepBack();
    say(r.ok ? r.message : r.reason, !r.ok);
  });
  on("reset", () => {
    pause();
    loom.reset();
    say("Reset: back at the first card, with no cloth.");
  });
  speed.addEventListener("input", () => ($("speed-out").textContent = speed.value));

  // ---- links ------------------------------------------------------------------------------------
  /** The loom's moment as a link's stop index, or null when it is between stops. */
  function stopIndex() {
    const i = POSITIONS.findIndex((p) => Math.abs(p - loom.phi) < 1e-9);
    return i < 0 ? null : i;
  }
  on("share", () => {
    pause();
    let s = stopIndex();
    if (s === null) {
      // Between stops (after playing): the link names the stop just passed.
      const before = POSITIONS.filter((p) => p <= loom.phi);
      s = POSITIONS.indexOf(before[before.length - 1]);
      loom.moveTo(loom.pick, POSITIONS[s]);
    }
    const fragment = encodeLink({
      hooks: loom.deck.hooks,
      tie: loom.tie,
      loop: loom.deck.loop,
      warp: warp.value,
      weft: weft.value,
      cards: loom.deck.cards,
      pick: loom.pick,
      stop: s,
      crossRow,
      follow: follow ? follow.hook : null,
      face,
    });
    history.replaceState(null, "", `#${fragment}`);
    const url = location.href;
    navigator.clipboard?.writeText(url).then(
      () => say("Link copied: it opens the loom with these cards, at this moment."),
      () => say(`Link ready in the address bar: ${url.length} characters.`),
    ) ?? say("Link ready in the address bar.");
  });

  function openLink() {
    if (!location.hash || location.hash === "#") return;
    const r = decodeLink(location.hash);
    if (!r.ok) {
      say(r.reason, true);
      return;
    }
    const s = r.state;
    loom = new Loom({ hooks: s.hooks, cards: s.cards, loop: s.loop }, s.tie);
    if (s.pick > 0 || s.stop > 0) {
      const can = s.cards.length > 0 && (s.loop || s.pick < s.cards.length);
      if (can) loom.moveTo(s.pick, POSITIONS[s.stop]);
    }
    warp.value = s.warp;
    weft.value = s.weft;
    crossRow = s.crossRow;
    face = s.face;
    follow = s.follow === null ? null : { hook: s.follow, end: null, pick: null };
    $("unfollow").hidden = follow === null;
    say(`Opened from a link: ${s.cards.length} card${s.cards.length === 1 ? "" : "s"} on a ${s.hooks}-hook head, ${tieLabel(s.tie)}.`);
  }

  // ---- playing ----------------------------------------------------------------------------------
  function pause() {
    playing = false;
    $("play").textContent = "▶ Play";
  }
  $("play").addEventListener("click", () => {
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
      STOPS.forEach((s, i) => {
        const passed = loom.pick > before.pick ? s > before.phi : s > before.phi && s <= loom.phi;
        if (passed) say(loom.stopMessage(i, before.pick));
      });
    }
    draw();
    if (playing) requestAnimationFrame(frame);
  }

  $("stops").innerHTML = STOP_NAMES.map((n, i) => `<li data-stop="${i}">${n}</li>`).join("");

  // ---- drawing ------------------------------------------------------------------------------------
  function draw() {
    syncControls();
    const snap = loom.snapshot();
    options.onDraw?.(snap);
    const trace = follow ? traceOf(snap, follow) : null;
    // The section is not drawn while the 3D view takes its place (learner page).
    if ($("section").offsetParent !== null) section.render(sectionLayout(snap, crossRow), { follow: trace ? trace.hook : null, view, labels: true });
    if ($("side").offsetParent !== null) side.render(sideLayout(snap));
    front.render(frontLayout(snap), trace);
    chain.render(snap, selected, trace);
    cloth.render(snap, { face, warp: warp.value, weft: weft.value, bits: bits.checked, trace });
    for (const b of document.querySelectorAll("[data-face]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.face === face);
    $("trace").textContent = trace ? trace.text : "Click a cell of the cloth, a thread in the front view, or any part of the head to follow it through the machine.";
    const at = STOPS.findIndex((s) => Math.abs(s - snap.phi) < 1e-9);
    const atStop = snap.phi === 0 ? STOPS.length - 1 : at;
    for (const li of document.querySelectorAll("#stops li")) {
      const i = Number(/** @type {HTMLElement} */ (li).dataset.stop);
      li.classList.toggle("done", snap.phi > 0 && STOPS[i] <= snap.phi + 1e-9);
      li.classList.toggle("here", i === atStop);
    }
    const card = snap.cardIndex === null ? "no card" : `card ${snap.cardIndex + 1}`;
    $("where").textContent = `Pick ${snap.pick + 1} (${card}) · ${Math.round(snap.phi * 100)} % through · ${snap.cloth.length} row${snap.cloth.length === 1 ? "" : "s"} woven · ${endCount(snap.tie, snap.deck.hooks)} warp ends`;
  }

  openLink();
  window.addEventListener("hashchange", () => {
    openLink();
    draw();
  });
  window.addEventListener("resize", () => draw());
  draw();

  return {
    /** The loom as it is now. */
    get loom() {
      return loom;
    },
    /** The thread followed, if any. */
    get follow() {
      return follow;
    },
    draw,
    say,
    pause,
    /**
     * Puts a new chain of cards (and tie) on the loom, from the start, and says why.
     * @param {{ deck: Deck, tie?: Tie, follow?: Follow | null, message?: string, view?: "whole" | "needles" | "crooks" }} o
     */
    open(o) {
      newLoom(o.deck, o.tie ?? loom.tie);
      if (o.follow !== undefined) {
        follow = o.follow;
        if (follow) crossRow = Math.floor(follow.hook / 8);
        $("unfollow").hidden = follow === null;
      }
      if (o.view) {
        view = o.view;
        for (const b of document.querySelectorAll("[data-view]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.view === view);
      }
      if (o.message) say(o.message);
      draw();
    },
  };
}
