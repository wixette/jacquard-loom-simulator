// The tutorial, parts 1 to 3 (design/public-app.md §1; design/m7-notes.md): the story, how it
// works and what it is, and weaving. A step is data: its texts are message keys made from its
// name (tut.<name>.title, .text, and .task, .q, .a1…, .right, .wrong, .done where it has them),
// what it puts on the stage, the loom it sets up, the parts it points at, and its task, which
// is checked on the loom as it is (its cards, its moment, its cloth), not on the clicks that got
// there. No DOM, so the app, the tests and the page's ?selftest run the same steps.
//
// A step without a loom of its own goes on with the one before it, as the learner left it. So
// the loom at a step's start is the last loom set up, with every task since then done: going
// Back, or opening a step from a link, gives the same loom every time.

import { msg } from "../l10n/l10n.js";
import { cardFromString, cardToString, makeDeck, PRESETS, resizeDeck, setLoop } from "../sim/deck.js";
import { findFloats } from "../sim/design.js";
import { presetPicture, readPicture } from "../sim/picture.js";
import { Loom, STOPS } from "../sim/loom.js";
import { STRAIGHT } from "../sim/tieup.js";
/** @import { Msg } from "../l10n/l10n.js" */
/** @import { Deck } from "../sim/deck.js" */
/** @import { Tie } from "../sim/tieup.js" */
/** @import { StageView } from "../sim/link.js" */

/**
 * The controls that change the cards or the loom. A step locks those its task does not ask
 * for; the transport, the views, the cloth's face and following a thread are always free.
 * @typedef {"punch" | "cards" | "loop" | "setup" | "colours" | "picture"} Control
 */
export const CONTROLS = /** @type {const} */ (["punch", "cards", "loop", "setup", "colours", "picture"]);

/**
 * What a task line offers as buttons, each working the real control (which glows): the
 * transport's step and play, the chain's loop, the head's setup.
 * @typedef {"step" | "play" | "loop" | "setup"} Asked
 */

/**
 * A loom for a step to start from.
 * @typedef {object} Setup
 * @property {number} hooks
 * @property {string[]} cards as deck.js writes them: "O" a hole, "." a blank, hook 1 first
 * @property {boolean} loop
 * @property {Tie} [tie]
 * @property {number} [follow] a hook to follow (0-based)
 * @property {number} [woven] rows already woven
 */

/**
 * A picture for a step to start from (the picture tool, part 5): a ready-made picture and how
 * it is read, woven to the end on the tutorial's loom.
 * @typedef {object} PictureSetup
 * @property {import("../sim/picture.js").PictureName} name
 * @property {"direct" | "damask"} mode
 */

/**
 * The cloth a challenge should weave (part 4): the cards that weave it, and how many rows of it
 * the learner's cloth must match.
 * @typedef {object} Target
 * @property {string[]} cards
 * @property {boolean} loop
 * @property {Tie} [tie]
 * @property {number} rows
 */

/**
 * Something for the learner to do on the loom.
 * @typedef {object} Task
 * @property {Asked[]} ask the controls its task line offers
 * @property {Control[]} [allow] the controls it unlocks
 * @property {(l: Loom) => boolean} check whether the loom shows it done
 * @property {(l: Loom) => void} solve do it (going on from it, and the tests)
 * @property {(l: Loom) => void} wrong a likely mistake, which check must not take (the tests)
 */

/**
 * A question to answer before weaving (predict, then weave): its choices are tut.<name>.a1,
 * .a2…, the feedback .right and .wrong.
 * @typedef {object} Predict
 * @property {number} choices
 * @property {number} answer the right choice, 1-based
 */

/**
 * A picture with a step, with its credit (what it shows, who made it, its licence).
 * @typedef {object} Picture
 * @property {string} file from the site's root
 * @property {string} credit message key
 * @property {number} width px, so the page keeps its place while it loads
 * @property {number} height
 */

/**
 * @typedef {object} Step
 * @property {string} id its name, in links and in the learner's progress: never changed
 * @property {1 | 2 | 3 | 4 | 5 | 6} part
 * @property {Picture} [image]
 * @property {StageView[]} [views] the stage's views (carried on to the steps after)
 * @property {boolean} [cards] whether the cards show under the step (carried on)
 * @property {Setup} [setup] a loom of its own
 * @property {string[]} [glow] the parts of the section it points at (css/views.css, data-glow)
 * @property {Predict} [predict]
 * @property {Task} [task]
 * @property {boolean} [done] it has a text for when its task is done (tut.<name>.done)
 * @property {Record<string, Msg>} [params] the values of its texts' placeholders
 * @property {boolean} [picture] it works on a picture: the picture tool under the guide, and its
 *   cloth's loose threads marked
 * @property {PictureSetup} [startPicture] a picture of its own to weave, in place of a loom setup
 * @property {Target} [target] the cloth it should weave, shown beside its text (a challenge)
 * @property {Control[]} [allow] controls it frees without a task (a task's own allow wins)
 * @property {"weave" | "create"} [go] a button to that workspace, under its text
 */

/** The parts, by number: their names and what each teaches are tut.part<n>, .goal, .recap. */
export const PARTS = /** @type {const} */ ([1, 2, 3, 4, 5]);

const EPS = 1e-9;
const TWILL = PRESETS.twill.rows;
const SATIN = PRESETS.satin.rows;
const BY_TWO = ["O.......", "..O.....", "....O...", "......O.", "O.......", "..O.....", "....O...", "......O."];

/** Whether the loom has reached moment i of its first pick (STOPS), or gone past it. @param {Loom} l @param {number} i */
const reached = (l, i) => l.pick > 0 || l.phi >= STOPS[i] - EPS;
/** @param {Loom} l @param {number} rows */
const woven = (l, rows) => l.cloth.length >= rows;
/** @param {Loom} l @param {number} i @param {string} holes */
function punchAs(l, i, holes) {
  l.setDeck({ ...l.deck, cards: l.deck.cards.map((c, k) => (k === i ? cardFromString(holes) : c)) });
}
/** @param {Loom} l @param {number} rows */
const weave = (l, rows) => l.moveTo(rows, 0);
/** @param {boolean[]} row */
const bits = (row) => row.map((b) => (b ? "O" : ".")).join("");

/**
 * A challenge's target, woven: its rows, first pick first.
 * @param {Target} t
 * @returns {boolean[][]}
 */
export function targetCloth(t) {
  const l = new Loom(deckOf({ hooks: t.cards[0].length, cards: t.cards, loop: t.loop }), t.tie ?? STRAIGHT);
  l.moveTo(t.rows, 0);
  return l.cloth;
}

/**
 * Whether a loom has woven a challenge's target: its first rows the target's.
 * @param {Loom} l
 * @param {Target} t
 */
const wovenAs = (l, t) => {
  const want = targetCloth(t);
  return l.cloth.length >= t.rows && want.every((row, p) => bits(l.cloth[p]) === bits(row));
};

/**
 * A challenge's task: weave the target, from the start, with whatever controls the fault needs.
 * Its solution puts the target's own cards on the loom (any fix that weaves the target counts).
 * @param {Target} t
 * @param {Control[]} allow
 * @returns {Task}
 */
const challenge = (t, allow) => ({
  ask: ["play"],
  allow,
  check: (l) => wovenAs(l, t),
  solve: (l) => {
    if (t.tie) l.setTie(t.tie);
    l.setDeck(deckOf({ hooks: l.deck.hooks, cards: t.cards, loop: t.loop }));
    l.reset();
    weave(l, t.rows);
  },
  wrong: (l) => weave(l, t.rows),
});

/** @type {Step[]} */
export const STEPS = [
  // ---- 1. The story ----------------------------------------------------------------------------
  { id: "story-draw-loom", part: 1, views: ["3d"], cards: false, image: { file: "images/tutorial/draw-loom.jpg", credit: "img.drawLoom", width: 720, height: 439 } },
  { id: "story-holes", part: 1, image: { file: "images/tutorial/cards.jpg", credit: "img.cards", width: 540, height: 720 } },
  { id: "story-jacquard", part: 1, image: { file: "images/tutorial/model-1810.jpg", credit: "img.model1810", width: 540, height: 720 } },
  { id: "story-portrait", part: 1, image: { file: "images/tutorial/portrait.jpg", credit: "img.portrait", width: 512, height: 720 } },

  // ---- 2. How it works, and what it is ---------------------------------------------------------
  { id: "how-whole-loom", part: 2, views: ["3d"], cards: false },
  { id: "how-units", part: 2, views: ["u1"] },
  {
    id: "how-section",
    part: 2,
    views: ["section"],
    cards: true,
    setup: { hooks: 8, cards: ["...OO..."], loop: false, follow: 3 },
    glow: ["cylinder", "needles", "hooks", "knives"],
  },
  {
    id: "how-needles",
    part: 2,
    glow: ["needles", "hooks"],
    done: true,
    task: { ask: ["step"], check: (l) => reached(l, 0), solve: (l) => l.moveTo(0, STOPS[0]), wrong: () => {} },
  },
  {
    id: "how-griffe",
    part: 2,
    glow: ["griffe", "knives", "hooks", "harness"],
    done: true,
    task: { ask: ["step"], check: (l) => reached(l, 1), solve: (l) => l.moveTo(0, STOPS[1]), wrong: (l) => l.moveTo(0, STOPS[0]) },
  },
  {
    id: "how-one-row",
    part: 2,
    glow: ["mails"],
    predict: { choices: 3, answer: 1 },
    done: true,
    task: { ask: ["step"], check: (l) => woven(l, 1), solve: (l) => l.moveTo(0, STOPS[3]), wrong: (l) => l.moveTo(0, STOPS[2]) },
  },
  {
    id: "how-program",
    part: 2,
    setup: { hooks: 8, cards: TWILL, loop: false },
    done: true,
    task: { ask: ["play"], check: (l) => woven(l, 4), solve: (l) => weave(l, 4), wrong: (l) => weave(l, 3) },
  },
  {
    id: "how-loop",
    part: 2,
    done: true,
    task: {
      ask: ["loop", "play"],
      allow: ["loop"],
      check: (l) => l.deck.loop && woven(l, 8),
      solve: (l) => {
        l.setDeck(setLoop(l.deck, true));
        weave(l, 8);
      },
      wrong: (l) => weave(l, 4),
    },
  },
  { id: "how-not-a-computer", part: 2 },

  // ---- 3. Weave --------------------------------------------------------------------------------
  {
    id: "weave-punch",
    part: 3,
    setup: { hooks: 8, cards: ["........"], loop: false },
    done: true,
    task: {
      ask: ["step"],
      allow: ["punch"],
      check: (l) => cardToString(l.deck.cards[0]) === "O.O.O.O." && woven(l, 1) && bits(l.cloth[0]) === "O.O.O.O.",
      solve: (l) => {
        punchAs(l, 0, "O.O.O.O.");
        weave(l, 1);
      },
      wrong: (l) => {
        punchAs(l, 0, "O.O.O...");
        weave(l, 1);
      },
    },
  },
  {
    id: "weave-plain",
    part: 3,
    setup: { hooks: 8, cards: ["O.O.O.O.", "........"], loop: true },
    done: true,
    task: {
      ask: ["play"],
      allow: ["punch"],
      check: (l) => cardToString(l.deck.cards[1]) === ".O.O.O.O" && woven(l, 4) && l.cloth.every((row, p) => row.every((b, e) => b === ((e + p) % 2 === 0))),
      solve: (l) => {
        punchAs(l, 1, ".O.O.O.O");
        weave(l, 4);
      },
      wrong: (l) => {
        punchAs(l, 1, ".O.O.O..");
        weave(l, 4);
      },
    },
  },
  {
    id: "weave-twill",
    part: 3,
    setup: { hooks: 8, cards: TWILL, loop: true },
    predict: { choices: 3, answer: 1 },
    done: true,
    task: { ask: ["play"], check: (l) => woven(l, 8), solve: (l) => weave(l, 8), wrong: (l) => weave(l, 4) },
  },
  {
    id: "weave-satin",
    part: 3,
    setup: { hooks: 8, cards: SATIN, loop: true },
    done: true,
    task: { ask: ["play"], check: (l) => woven(l, 8), solve: (l) => weave(l, 8), wrong: (l) => weave(l, 4) },
  },
  {
    id: "weave-satin-by-two",
    part: 3,
    setup: { hooks: 8, cards: BY_TWO, loop: true },
    predict: { choices: 2, answer: 2 },
    done: true,
    task: { ask: ["play"], check: (l) => woven(l, 8), solve: (l) => weave(l, 8), wrong: (l) => weave(l, 4) },
  },
  {
    id: "weave-tie-up",
    part: 3,
    views: ["front"],
    params: { tie: msg("tie.straightN", { n: 2 }) },
    setup: { hooks: 8, cards: TWILL, loop: true },
    done: true,
    task: {
      ask: ["setup", "play"],
      allow: ["setup"],
      check: (l) => l.deck.hooks === 8 && l.tie.kind === "straight" && l.tie.repeats === 2 && woven(l, 4),
      solve: (l) => {
        l.setTie({ kind: "straight", repeats: 2 });
        weave(l, 4);
      },
      wrong: (l) => weave(l, 4),
    },
  },
  {
    id: "weave-picture",
    part: 3,
    views: ["section"],
    setup: { hooks: 8, cards: PRESETS.arrow.rows, loop: false },
    predict: { choices: 2, answer: 1 },
    done: true,
    task: { ask: ["play"], check: (l) => woven(l, 8), solve: (l) => weave(l, 8), wrong: (l) => weave(l, 4) },
  },
  { id: "weave-next", part: 3, go: "weave" },

  // ---- 4. Challenge: debugging, from the cloth back to the program ----------------------------
  {
    id: "debug-swapped",
    part: 4,
    views: ["section"],
    cards: true,
    setup: { hooks: 8, cards: [TWILL[0], TWILL[2], TWILL[1], TWILL[3]], loop: true },
    target: { cards: TWILL, loop: true, rows: 8 },
    done: true,
    task: challenge({ cards: TWILL, loop: true, rows: 8 }, ["cards", "punch"]),
  },
  {
    id: "debug-hole",
    part: 4,
    setup: { hooks: 8, cards: SATIN.map((c, i) => (i === 4 ? "........" : c)), loop: true },
    target: { cards: SATIN, loop: true, rows: 8 },
    done: true,
    task: challenge({ cards: SATIN, loop: true, rows: 8 }, ["punch"]),
  },
  {
    id: "debug-tie-up",
    part: 4,
    views: ["front"],
    params: { tie: msg("tie.straightN", { n: 2 }) },
    setup: { hooks: 8, cards: TWILL, loop: true, tie: { kind: "point" } },
    target: { cards: TWILL, loop: true, tie: { kind: "straight", repeats: 2 }, rows: 4 },
    done: true,
    task: challenge({ cards: TWILL, loop: true, tie: { kind: "straight", repeats: 2 }, rows: 4 }, ["setup"]),
  },
  {
    id: "debug-loop",
    part: 4,
    views: ["section"],
    setup: { hooks: 8, cards: [...TWILL, TWILL[3]], loop: true },
    target: { cards: TWILL, loop: true, rows: 12 },
    done: true,
    task: challenge({ cards: TWILL, loop: true, rows: 12 }, ["cards"]),
  },

  // ---- 5. Your tools --------------------------------------------------------------------------
  { id: "tools-picture", part: 5, views: ["cloth"], cards: false, picture: true, startPicture: { name: "heart", mode: "direct" }, allow: ["picture"] },
  {
    id: "tools-loose",
    part: 5,
    picture: true,
    predict: { choices: 3, answer: 1 },
    done: true,
    task: {
      ask: [],
      allow: ["picture"],
      // the cloth holds together: no thread loose over more than eight others
      check: (l) => l.cloth.length > 0 && findFloats(l.cloth).floats.length === 0,
      solve: (l) => {
        const r = readPicture({ rows: presetPicture("heart"), mode: "damask", k: 4, perRow: 1, invert: false });
        if (!r.ok) return;
        l.deck = r.cards.deck;
        l.reset();
        weave(l, r.cards.deck.cards.length);
      },
      wrong: () => {},
    },
  },
  { id: "tools-follow", part: 5, views: ["front"], cards: true, setup: { hooks: 8, cards: TWILL, loop: true, tie: { kind: "straight", repeats: 2 }, woven: 8 } },
  {
    id: "tools-setup",
    part: 5,
    views: ["section"],
    done: true,
    task: {
      ask: ["setup"],
      allow: ["setup"],
      check: (l) => l.deck.hooks === 16,
      solve: (l) => {
        l.deck = resizeDeck(l.deck, 16);
        l.reset();
      },
      wrong: (l) => l.setTie({ kind: "straight", repeats: 3 }),
    },
  },
  { id: "tools-share", part: 5 },
  { id: "tools-create", part: 5, go: "create" },
];

/**
 * Old names of steps that were renamed, and the step each now opens (design/links.md: a link to
 * a step keeps working for ever).
 * @type {Record<string, string>}
 */
export const ALIASES = {};

/**
 * The step a name opens, or -1.
 * @param {string} name
 */
export function stepIndex(name) {
  const id = ALIASES[name] ?? name;
  return STEPS.findIndex((s) => s.id === id);
}

/**
 * Where a step is in its part: its place (1-based) and the part's length.
 * @param {number} i
 */
export function placeInPart(i) {
  const part = STEPS[i].part;
  const steps = STEPS.filter((s) => s.part === part);
  return { part, at: steps.indexOf(STEPS[i]) + 1, of: steps.length };
}

/** Whether a step is its part's first or last. @param {number} i */
export const opensPart = (i) => i === 0 || STEPS[i - 1].part !== STEPS[i].part;
/** @param {number} i */
export const endsPart = (i) => i === STEPS.length - 1 || STEPS[i + 1].part !== STEPS[i].part;

/** @param {Setup} s @returns {Deck} */
const deckOf = (s) => makeDeck(s.hooks, s.cards, s.loop);

/**
 * What a step shows, carried on from the steps before it: the stage's views and whether the
 * cards show.
 * @param {number} i
 * @returns {{ views: StageView[]; cards: boolean }}
 */
export function shownAt(i) {
  /** @type {{ views: StageView[]; cards: boolean }} */
  const p = { views: ["section"], cards: true };
  for (const s of STEPS.slice(0, i + 1)) {
    if (s.views) p.views = s.views;
    if (s.cards !== undefined) p.cards = s.cards;
  }
  return p;
}

/**
 * The loom at a step's start: the last loom set up at or before it, with the tasks since done.
 * @param {number} i
 * @returns {{ loom: Loom; follow: number | null }}
 */
export function loomAt(i) {
  let k = i;
  while (k > 0 && !STEPS[k].setup && !STEPS[k].startPicture) k--;
  const pic = STEPS[k].startPicture ? pictureAt(k) : null;
  const read = pic ? readPicture(pic) : null;
  const s = STEPS[k].setup ?? { hooks: 8, cards: TWILL, loop: true };
  const loom = read?.ok ? new Loom(read.cards.deck) : new Loom(deckOf(s), s.tie ?? STRAIGHT);
  if (read?.ok) loom.moveTo(read.cards.deck.cards.length, 0);
  else if (s.woven) loom.moveTo(s.woven, 0);
  for (let j = k; j < i; j++) {
    const task = STEPS[j].task;
    if (task && !task.check(loom)) task.solve(loom);
  }
  return { loom, follow: pic ? null : (s.follow ?? null) };
}

/**
 * The picture a step works on: the last one a step set up, at or before it (null: none).
 * @param {number} i
 * @returns {import("../sim/picture.js").PictureSpec | null}
 */
export function pictureAt(i) {
  for (let k = i; k >= 0; k--) {
    const p = STEPS[k].startPicture;
    if (p) return { rows: presetPicture(p.name), mode: p.mode, k: 4, perRow: 1, invert: false };
    if (STEPS[k].setup) return null;
  }
  return null;
}



/**
 * The controls a step leaves free, of those that change the cards or the loom.
 * @param {number} i
 * @returns {Control[]}
 */
export const allowedAt = (i) => STEPS[i].task?.allow ?? STEPS[i].allow ?? [];

/**
 * Run the tutorial with a scripted learner (the tests, and the page's ?selftest): every task
 * is not yet done at its step's start, refuses its likely mistake and takes its solution.
 * @returns {string[]} what went wrong, if anything
 */
export function runTutorial() {
  /** @type {string[]} */
  const problems = [];
  STEPS.forEach((s, i) => {
    const task = s.task;
    if (!task) return;
    if (task.check(loomAt(i).loom)) problems.push(`${s.id}: done before the learner acts`);
    const mistaken = loomAt(i).loom;
    task.wrong(mistaken);
    if (task.check(mistaken)) problems.push(`${s.id}: takes a mistake`);
    const solved = loomAt(i).loom;
    task.solve(solved);
    if (!task.check(solved)) problems.push(`${s.id}: not done by its solution`);
  });
  return problems;
}
