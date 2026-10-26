// M2 acceptance checks (design/m2-notes.md): the picture helper's two readings, the floats,
// the image reduction, the lessons, and the learner page's dock. runM2Checks() needs no DOM
// and runs in tests/accept/m2.accept.test.js and in the learner page's ?selftest;
// runM2PageChecks() drives the page itself, in the browser only.

import { HOOK_COUNTS } from "../sim/deck.js";
import { FLOAT_LIMIT, findFloats, pictureFromPixels, pictureFromStrings, PICTURES, readDamask, readDirect, SATIN, satinPoint } from "../sim/design.js";
import { Loom } from "../sim/loom.js";
import { endCount } from "../sim/tieup.js";
import { headFor, planCards } from "../app/pictureHelper.js";
import { LESSONS } from "../teach/lessons.js";
import { result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { Picture } from "../sim/design.js" */
/** @import { Tie } from "../sim/tieup.js" */
/** @import { LearnerPage } from "../app/learnerPage.js" */

/**
 * A small deterministic random number generator (mulberry32), so the checks are repeatable.
 * @param {number} seed
 * @returns {() => number}
 */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A random picture, w wide and h high, with blobs (so it has long runs, as drawings do).
 * @param {() => number} r
 * @param {number} w
 * @param {number} h
 * @returns {Picture}
 */
function randomPicture(r, w, h) {
  const density = 0.2 + 0.6 * r();
  const rows = [];
  let prev = /** @type {boolean[]} */ ([]);
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const keep = y > 0 && r() < 0.6;
      row.push(keep ? prev[x] : r() < density);
    }
    rows.push(row);
    prev = row;
  }
  return rows;
}

/**
 * Weaves a deck through the loom's own steps until it has `picks` rows (or cannot go on).
 * @param {Deck} deck
 * @param {Tie} tie
 * @param {number} picks
 * @returns {boolean[][]}
 */
function weave(deck, tie, picks) {
  const loom = new Loom(deck, tie);
  let guard = picks * 8 + 8;
  while (loom.cloth.length < picks && guard-- > 0) {
    if (!loom.stepForward().ok) break;
  }
  return loom.cloth.map((row) => [...row]);
}

/** @param {boolean[][]} a @param {boolean[][]} b */
const same = (a, b) => a.length === b.length && a.every((row, i) => row.length === b[i].length && row.every((x, j) => x === b[i][j]));

/** The presets as pictures. */
const PRESET_PICTURES = Object.entries(PICTURES).map(([key, p]) => ({ key, picture: pictureFromStrings(p.rows) }));

/** @returns {CheckResult} */
function directReading() {
  const r = rng(201);
  const bad = [];
  let cases = 0;
  const pictures = [...PRESET_PICTURES.map((p) => p.picture)];
  for (let i = 0; i < 40; i++) pictures.push(randomPicture(r, 2 + Math.floor(r() * 31), 1 + Math.floor(r() * 16)));
  pictures.forEach((pic, n) => {
    const w = pic[0].length;
    const h = pic.length;
    const hooks = /** @type {number} */ (headFor(w));
    for (const per of [1, 2]) {
      for (const invert of [false, true]) {
        for (const repeat of [false, true]) {
          cases++;
          const res = readDirect(pic, { hooks, picksPerRow: per, invert, repeat });
          if (!res.ok) {
            bad.push(`picture ${n} refused: ${res.reason}`);
            continue;
          }
          const { cards, width, height } = res.reading;
          if (cards.length !== h * per || height !== h * per) bad.push(`picture ${n}: ${cards.length} cards for ${h} rows × ${per}`);
          if (width !== (repeat ? hooks : w)) bad.push(`picture ${n}: woven ${width} wide`);
          // Card p is picture row (h - 1 - floor(p / per)): the first card is the bottom row.
          cards.forEach((card, p) => {
            const y = h - 1 - Math.floor(p / per);
            for (let x = 0; x < hooks; x++) {
              const px = x < w ? pic[y][x] : repeat ? pic[y][x % w] : false;
              if (card[x] !== (invert ? !px : px)) bad.push(`picture ${n}, card ${p + 1}, hole ${x + 1}`);
            }
          });
          // Woven on the loom, the cloth read from its top shows the picture the right way up.
          if (per === 1 && !invert && !repeat) {
            const cloth = weave({ hooks, cards, loop: false }, { kind: "straight", repeats: 1 }, h);
            const seen = cloth.map((row) => row.slice(0, w)).reverse();
            if (!same(seen, pic)) bad.push(`picture ${n}: the woven cloth is not the picture`);
          }
        }
      }
    }
  });
  const wide = readDirect(pictureFromStrings(["#".repeat(20)]), { hooks: 16 });
  if (wide.ok || !/hooks/.test(wide.reason)) bad.push("a picture wider than the head was not refused with a reason");
  return result(
    "J2-1",
    "Direct reading: card p is the picture's row p from the bottom (each repeated per picks-per-row), a dark pixel a hole, invert and repeat as set; woven on the loom, the cloth shows the picture the right way up; a picture wider than the head is refused with a reason",
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `${cases} readings of ${pictures.length} pictures (4 presets, 40 random up to 32 × 16)`,
  );
}

/**
 * The floats of a cloth counted the slow way, as "kind pick end length" strings.
 * @param {boolean[][]} cloth
 * @param {number} limit
 */
function slowFloats(cloth, limit) {
  const out = [];
  const H = cloth.length;
  const W = cloth[0]?.length ?? 0;
  for (let p = 0; p < H; p++) {
    for (let e = 0; e < W; e++) {
      if (!cloth[p][e] && (e === 0 || cloth[p][e - 1])) {
        let n = 0;
        while (e + n < W && !cloth[p][e + n]) n++;
        if (n > limit) out.push(`weft ${p} ${e} ${n}`);
      }
      if (cloth[p][e] && (p === 0 || !cloth[p - 1][e])) {
        let n = 0;
        while (p + n < H && cloth[p + n][e]) n++;
        if (n > limit) out.push(`warp ${p} ${e} ${n}`);
      }
    }
  }
  return out.sort();
}

/** @returns {CheckResult} */
function floats() {
  const r = rng(202);
  const bad = [];
  let total = 0;
  for (let i = 0; i < 60; i++) {
    const w = 1 + Math.floor(r() * 40);
    const h = 1 + Math.floor(r() * 30);
    const cloth = randomPicture(r, w, h);
    const limit = 1 + Math.floor(r() * 10);
    const got = findFloats(cloth, limit).floats.map((f) => `${f.kind} ${f.pick} ${f.end} ${f.length}`).sort();
    const want = slowFloats(cloth, limit);
    total += want.length;
    if (got.join("|") !== want.join("|")) bad.push(`cloth ${i}: ${got.length} floats found, ${want.length} counted`);
  }
  // The direct heart: its blank rows are each one weft thread loose across all 16 ends.
  const heart = readDirect(pictureFromStrings(PICTURES.heart.rows), { hooks: 16 });
  if (heart.ok) {
    const f = findFloats(heart.reading.cards);
    const blank = PICTURES.heart.rows.filter((row) => !row.includes("#")).length;
    const full = f.floats.filter((x) => x.kind === "weft" && x.length === 16).length;
    if (f.longestWeft !== 16 || full !== blank) bad.push(`the direct heart: longest weft float ${f.longestWeft}, ${full} full-width floats for ${blank} blank rows`);
  } else bad.push("the heart did not read");
  return result(
    "J2-2",
    `Floats: every run of weft over more than the limit (default ${FLOAT_LIMIT}) along a pick, and of warp along an end, is found exactly once, and nothing else; a blank row of a direct picture is a weft float across the whole cloth`,
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `60 random cloths (${total} floats) match a slow count; the direct heart's blank rows float across all 16 ends`,
  );
}

/** @returns {CheckResult} */
function damask() {
  const r = rng(203);
  const bad = [];
  // The satin: each end is lifted once in each 8 picks, and neighbouring ends' points are
  // at least 2 picks apart (step 3 shares no factor with 8), so no two points touch.
  for (let e = 0; e < SATIN.ends; e++) {
    const pts = [...Array(SATIN.ends).keys()].filter((p) => satinPoint(e, p));
    const next = [...Array(SATIN.ends).keys()].filter((p) => satinPoint(e + 1, p));
    if (pts.length !== 1) bad.push(`end ${e} has ${pts.length} satin points in 8 picks`);
    else if (Math.min((pts[0] - next[0] + 8) % 8, (next[0] - pts[0] + 8) % 8) < 2) bad.push(`ends ${e} and ${e + 1} have touching points`);
  }
  let worstPreset = 0;
  let worstRandom = 0;
  let worstOne = 0;
  let readings = 0;
  /**
   * @param {Picture} pic
   * @param {number} k
   * @param {string} name
   * @returns {number} the longest float, or -1 when it does not fit 64 hooks
   */
  const check = (pic, k, name) => {
    const w = pic[0].length;
    const h = pic.length;
    const res = readDamask(pic, { hooks: 64, k });
    if (w * k > 64) {
      if (res.ok || !/hooks/.test(res.reason)) bad.push(`${name} at k = ${k} needs ${w * k} hooks but was not refused`);
      return -1;
    }
    if (!res.ok) {
      bad.push(`${name} at k = ${k} refused: ${res.reason}`);
      return -1;
    }
    readings++;
    const { cards, width, height } = res.reading;
    if (cards.length !== h * k || height !== h * k || width !== w * k) bad.push(`${name} at k = ${k}: ${cards.length} cards, ${width} wide`);
    let darkUp = 0;
    let dark = 0;
    let lightUp = 0;
    let light = 0;
    cards.forEach((card, p) => {
      const y = h - 1 - Math.floor(p / k);
      for (let e = 0; e < width; e++) {
        const d = pic[y][Math.floor(e / k)];
        if (card[e] !== (d ? !satinPoint(e, p) : satinPoint(e, p))) bad.push(`${name} k ${k}: pick ${p + 1}, end ${e + 1}`);
        if (d) {
          dark++;
          if (card[e]) darkUp++;
        } else {
          light++;
          if (card[e]) lightUp++;
        }
      }
    });
    if (dark >= 64 && darkUp / dark < 0.75) bad.push(`${name} k ${k}: figure only ${(darkUp / dark).toFixed(2)} warp`);
    if (light >= 64 && lightUp / light > 0.25) bad.push(`${name} k ${k}: ground ${(lightUp / light).toFixed(2)} warp`);
    const f = findFloats(cards.map((c) => c.slice(0, width)));
    return Math.max(f.longestWarp, f.longestWeft);
  };
  for (const { key, picture } of PRESET_PICTURES) {
    for (const k of [1, 2, 3, 4]) worstPreset = Math.max(worstPreset, check(picture, k, key));
  }
  for (let i = 0; i < 40; i++) {
    const pic = randomPicture(r, 2 + Math.floor(r() * 15), 2 + Math.floor(r() * 12));
    worstOne = Math.max(worstOne, check(pic, 1, `random ${i}`));
    for (const k of [2, 3, 4]) worstRandom = Math.max(worstRandom, check(pic, k, `random ${i}`));
  }
  if (worstPreset > FLOAT_LIMIT) bad.push(`a preset in damask floats over ${worstPreset} threads`);
  if (worstRandom > FLOAT_LIMIT) bad.push(`a random picture in damask at k = 2 to 4 floats over ${worstRandom} threads`);
  return result(
    "J2-3",
    `Damask: each pixel is k × k threads, figure in warp-faced and ground in weft-faced 8-end satin (each end lifted once in 8 picks, no two points touching); no float is longer than ${FLOAT_LIMIT} threads in the presets at k = 1 to 4, nor in any picture at k = 2 to 4; a picture too wide for 64 hooks is refused with a reason`,
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `${readings} readings; longest float ${worstPreset} in the presets, ${worstRandom} in 40 random pictures at k = 2 to 4 (at k = 1: ${worstOne}; the direct heart: 16)`,
  );
}

/** @returns {CheckResult} */
function imageReduction() {
  const bad = [];
  /**
   * An image w × h whose pixel (x, y) is the colour fill(x, y) gives, as RGBA bytes.
   * @param {number} w
   * @param {number} h
   * @param {(x: number, y: number) => number[]} fill
   */
  const image = (w, h, fill) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(fill(x, y), (y * w + x) * 4);
    return data;
  };
  // A black square on white, 64 × 64 px, from (16, 16) to (48, 48): a 4 × 4 picture has its middle 2 × 2 dark.
  const sq = image(64, 64, (x, y) => (x >= 16 && x < 48 && y >= 16 && y < 48 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  const p = pictureFromPixels(sq, 64, 64, 4, 4);
  const want = ["....", ".##.", ".##.", "...."].map((s) => [...s].map((c) => c === "#"));
  if (!same(p, want)) bad.push(`a black square reads ${p.map((r) => r.map((b) => (b ? "#" : ".")).join("")).join("/")}`);
  // Transparent black counts as white.
  const clear = pictureFromPixels(image(8, 8, () => [0, 0, 0, 0]), 8, 8, 4, 4);
  if (clear.some((r) => r.some(Boolean))) bad.push("a transparent image read dark");
  // A grey ramp left to right: the threshold moves the edge.
  const ramp = image(256, 4, (x) => [x, x, x, 255]);
  const at = /** @param {number} t */ (t) => pictureFromPixels(ramp, 256, 4, 16, 1, t)[0].filter(Boolean).length;
  if (!(at(64) < at(128) && at(128) < at(192) && at(128) === 8)) bad.push(`the threshold does not move the edge (${at(64)}, ${at(128)}, ${at(192)})`);
  // An image smaller than the picture: each pixel fills a block.
  const tiny = pictureFromPixels(image(2, 2, (x, y) => (x === y ? [0, 0, 0, 255] : [255, 255, 255, 255])), 2, 2, 4, 4);
  if (!tiny[0][0] || !tiny[1][1] || tiny[0][3] || !tiny[3][3]) bad.push("an image smaller than the picture does not fill blocks");
  return result(
    "J2-4",
    "An image is reduced in the page to the picture's size by averaging each block, transparent counts as white, and the threshold decides what is dark",
    bad.length === 0,
    bad.join("; ") || "a square, a transparent image, a grey ramp at three thresholds, an image smaller than the picture",
  );
}

/** @returns {CheckResult} */
function lessons() {
  const bad = [];
  const first = LESSONS.slice(0, 7);
  const ids = first.map((l) => l.id).join(" ");
  if (ids !== "L1 L2 L3 L4 L5 L6 L7") bad.push(`the lessons are ${ids}`);
  for (const l of first) {
    const deck = l.deck();
    if (!HOOK_COUNTS.includes(deck.hooks) || deck.cards.length === 0 || deck.cards.some((c) => c.length !== deck.hooks)) bad.push(`${l.id}: its cards do not fit a head`);
    if (!l.steps.length || !l.notice || !l.question.includes("?")) bad.push(`${l.id}: steps, notice or question missing`);
    if (l.follow && l.follow.hook >= deck.hooks) bad.push(`${l.id}: follows hook ${l.follow.hook + 1} of ${deck.hooks}`);
    if (!deck.loop && deck.cards.length < l.picks) bad.push(`${l.id}: ${l.picks} picks from an open chain of ${deck.cards.length}`);
    const cloth = weave(deck, l.tie, l.picks);
    if (cloth.length < l.picks) bad.push(`${l.id}: wove ${cloth.length} of ${l.picks} picks`);
    else if (cloth[0].length !== endCount(l.tie, deck.hooks)) bad.push(`${l.id}: ${cloth[0].length} ends`);
    else if (!l.shows(cloth)) bad.push(`${l.id}: its cloth does not show the point`);
  }
  // The variants that teach by failing must fail: twill reversed is not the same diagonal,
  // satin stepped by two lifts some ends twice and others never.
  for (const id of ["L3", "L4"]) {
    const l = /** @type {import("../teach/lessons.js").Lesson} */ (LESSONS.find((x) => x.id === id));
    const v = l.variants[0];
    if (!v) bad.push(`${id} has no variant`);
    else if (l.shows(weave(v.deck(), l.tie, l.picks))) bad.push(`${id}'s variant "${v.label}" shows the same as the lesson`);
  }
  return result(
    "J2-5",
    "Lessons L1–L7 each open with cards that fit a head, steps, a notice and a question; woven through the loom's own steps, each lesson's cloth shows its point; the twill reversed and the satin stepped by two show that they differ",
    bad.length === 0,
    bad.slice(0, 3).join("; ") || `7 lessons woven (${first.reduce((s, l) => s + l.picks, 0)} picks); 2 variants differ as taught`,
  );
}

/** @returns {CheckResult} */
function planning() {
  const bad = [];
  const heart = pictureFromStrings(PICTURES.heart.rows);
  const base = { invert: false, picksPerRow: 1, repeat: false, k: 4, hooks: null };
  const direct = planCards(heart, { ...base, mode: "direct" });
  const dam = planCards(heart, { ...base, mode: "damask" });
  if (!direct.read.ok || direct.hooks !== 16 || direct.read.reading.cards.length !== 16) bad.push(`16 × 16 direct: ${direct.text}`);
  if (!dam.read.ok || dam.hooks !== 64 || dam.read.reading.cards.length !== 64) bad.push(`16 × 16 damask at k = 4: ${dam.text}`);
  // Both weave on the loom, and the direct cloth is the picture.
  for (const p of [direct, dam]) {
    if (!p.read.ok) continue;
    const { cards } = p.read.reading;
    const cloth = weave({ hooks: p.hooks, cards, loop: false }, { kind: "straight", repeats: 1 }, cards.length);
    if (!same(cloth, cards)) bad.push(`${p.hooks} hooks: the woven cloth differs from the cards`);
  }
  const arrow = planCards(pictureFromStrings(PICTURES.arrow.rows), { ...base, mode: "damask", k: 3 });
  if (arrow.hooks !== 24) bad.push(`the 8-wide arrow at k = 3 got ${arrow.hooks} hooks, not 24`);
  const big = planCards(resizeSquare(heart, 32), { ...base, mode: "damask" });
  if (big.read.ok || !/128 hooks/.test(big.text)) bad.push(`32 wide at k = 4 was not refused as needing 128 hooks: ${big.text}`);
  const set = planCards(heart, { ...base, mode: "direct", hooks: 8 });
  if (set.read.ok) bad.push("16 wide on a chosen 8-hook head was not refused");
  return result(
    "J2-6",
    "The helper chooses the smallest head that fits (or the one set), and a 16 × 16 picture weaves in both modes: 16 cards on 16 hooks directly, 64 on 64 as damask; a reading that does not fit is refused, saying what it needs",
    bad.length === 0,
    bad.join("; ") || `${direct.text} / ${dam.text}`,
  );
}

/**
 * @param {Picture} p
 * @param {number} n
 * @returns {Picture}
 */
const resizeSquare = (p, n) => [...Array(n).keys()].map((y) => [...Array(n).keys()].map((x) => p[Math.floor((y * p.length) / n)][Math.floor((x * p.length) / n)]));

/** @returns {CheckResult[]} */
export function runM2Checks() {
  return [directReading(), floats(), damask(), imageReduction(), lessons(), planning()];
}

// ---- the page (browser only) ----------------------------------------------------------------

/**
 * Whether an element is shown with some size.
 * @param {Element | null} el
 */
const shown = (el) => {
  if (!(el instanceof HTMLElement || el instanceof SVGElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};

/**
 * The page checks: they drive the learner page as a learner would, then put it back.
 * @param {LearnerPage} learner
 * @returns {CheckResult[]}
 */
export function runM2PageChecks(learner) {
  const { page } = learner;
  const keep = { deck: page.loom.deck, tie: page.loom.tie };
  const status = /** @type {HTMLElement} */ (document.getElementById("status"));
  const out = [];

  // J2-7: one dock panel at a time; the machine stays in view with each.
  {
    const bad = [];
    const tabs = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-dock]")]);
    for (const t of tabs) {
      t.click();
      for (const o of tabs) {
        const panel = document.getElementById(`dock-${o.dataset.dock}`);
        if (shown(panel) !== (o === t)) bad.push(`with ${t.dataset.dock} open, ${o.dataset.dock} is ${shown(panel) ? "shown" : "hidden"}`);
      }
      for (const sel of ["svg.section", "#chain .card-line", "svg.bench-card", "#cloth canvas", "#play", "#status"]) {
        if (!shown(document.querySelector(sel))) bad.push(`with ${t.dataset.dock} open, ${sel} is not in view`);
      }
    }
    learner.show("lessons");
    out.push(result("J2-7", "The dock shows one of lessons, picture helper and about at a time, and the cards, the head, the cloth, the transport and the status line stay on screen with each", bad.length === 0 && tabs.length === 3, bad.slice(0, 3).join("; ") || `${tabs.length} tabs`));
  }

  // J2-8: each lesson, opened from its button, puts its own cards on the loom from the start.
  {
    const bad = [];
    learner.lessons.showList();
    for (const l of LESSONS.slice(0, 7)) {
      page.loom.moveTo(1, 0.5);
      const b = /** @type {HTMLElement | null} */ (document.querySelector(`#dock-lessons [data-lesson="${l.id}"]`));
      if (!b) {
        bad.push(`no button for ${l.id}`);
        continue;
      }
      b.click();
      const d = page.loom.deck;
      const want = l.deck();
      if (JSON.stringify(d) !== JSON.stringify(want) || JSON.stringify(page.loom.tie) !== JSON.stringify(l.tie)) bad.push(`${l.id}: the loom has other cards or another tie`);
      if (page.loom.pick !== 0 || page.loom.phi !== 0 || page.loom.cloth.length !== 0) bad.push(`${l.id}: not at the start`);
      if (!status.textContent?.startsWith(l.id)) bad.push(`${l.id}: the status line says "${status.textContent}"`);
      if (!document.querySelector("#dock-lessons .question")?.textContent?.includes(l.question)) bad.push(`${l.id}: its question is not shown`);
      learner.lessons.showList();
    }
    out.push(result("J2-8", "Each lesson, opened from the dock, puts its own cards and tie on the loom at the first card with no cloth, shows its question, and says so in the status line", bad.length === 0, bad.slice(0, 3).join("; ") || "7 lessons opened from a loom mid-pick"));
  }

  // J2-9: the helper on the page: draw, read, put on the loom.
  {
    const bad = [];
    learner.show("picture");
    const host = /** @type {HTMLElement} */ (document.getElementById("dock-picture"));
    /** @param {string} sel @param {string} v */
    const set = (sel, v) => {
      const el = /** @type {HTMLSelectElement} */ (host.querySelector(sel));
      el.value = v;
      el.dispatchEvent(new Event("change"));
    };
    const go = /** @type {HTMLButtonElement} */ (host.querySelector("#pic-go"));
    set("#pic-preset", "heart");
    /** @type {HTMLElement} */ (host.querySelector('[data-mode="direct"]')).click();
    go.click();
    const heart = pictureFromStrings(PICTURES.heart.rows);
    const d = page.loom.deck;
    if (d.hooks !== 16 || d.cards.length !== 16 || d.cards[0].join() !== heart[15].join() || d.cards[15].join() !== heart[0].join()) bad.push("directly: the loom does not have the heart's 16 cards, bottom row first");
    page.loom.moveTo(16, 0);
    if (!same([...page.loom.cloth].reverse(), heart)) bad.push("directly: the woven cloth is not the heart");
    if (!/longer than 8 \(marked\)/.test(host.querySelector("#pic-report")?.textContent ?? "")) bad.push("directly: the report does not mark the heart's floats");
    /** @type {HTMLElement} */ (host.querySelector('[data-mode="damask"]')).click();
    set("#pic-k", "4");
    go.click();
    if (page.loom.deck.hooks !== 64 || page.loom.deck.cards.length !== 64) bad.push(`as damask: the loom has ${page.loom.deck.cards.length} cards on ${page.loom.deck.hooks} hooks`);
    if (!/None is longer than 8/.test(host.querySelector("#pic-report")?.textContent ?? "")) bad.push("as damask: the report finds long floats");
    set("#pic-size", "32");
    if (!go.disabled || !/128 hooks/.test(host.querySelector("#pic-report")?.textContent ?? "")) bad.push("32 wide as damask at k = 4: the button is not greyed with the reason");
    set("#pic-size", "16");
    /** @type {HTMLElement} */ (host.querySelector('[data-mode="direct"]')).click();
    set("#pic-preset", "heart");
    learner.show("lessons");
    out.push(result("J2-9", "On the page, the heart read directly puts its 16 cards on a 16-hook loom, bottom row first, and weaves the heart; its floats are reported and marked; as damask it puts 64 cards on 64 hooks with none marked; a reading that does not fit greys the button and says why", bad.length === 0, bad.join("; ") || "direct and damask on the page; 32 wide refused"));
  }

  page.open({ deck: keep.deck, tie: keep.tie, follow: null, message: "The first card is pressed against the needles. Press Step ▸ to turn the loom to the next moment, or Play." });
  return out;
}
