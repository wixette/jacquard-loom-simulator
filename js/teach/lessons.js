// The guided lessons (design/simulator-plan.md §4.4: L1–L7, and L8–L10 from M4). Each lesson opens the loom
// with its own cards, says what to do and what to notice, and asks one question. Each also
// says how to check, on the cloth it weaves, that it shows what it claims; the M2 checks
// weave every lesson and run that check, so a lesson cannot quietly stop teaching its point.

import { makeDeck } from "../sim/deck.js";
import { findFloats, PICTURES, pictureFromStrings, readDirect } from "../sim/design.js";
/** @import { Deck } from "../sim/deck.js" */
/** @import { Tie } from "../sim/tieup.js" */

/**
 * @typedef {object} Lesson
 * @property {string} id
 * @property {string} title
 * @property {string} goal one line: what it shows
 * @property {() => Deck} deck the cards it opens with
 * @property {Tie} tie
 * @property {{ hook: number, end: number | null, pick: number | null } | null} follow a hook to follow from the start
 * @property {string[]} steps what to do
 * @property {string} notice what to see
 * @property {string} question one question to answer
 * @property {{ label: string, deck: () => Deck }[]} variants other cards to try, one click each
 * @property {number} picks how many picks show the point
 * @property {(cloth: boolean[][]) => boolean} shows whether the woven cloth shows the point
 * @property {boolean} [picture] whether the lesson uses the picture helper
 * @property {boolean} [print] whether the lesson prints the deck at true size
 */

/** @param {boolean[]} row */
const bits = (row) => row.map((b) => (b ? "1" : "0")).join("");

/** The 2/2 twill of L3, card by card. */
const TWILL = ["OO..OO..", ".OO..OO.", "..OO..OO", "O..OO..O"];

/** @type {Lesson[]} */
export const LESSONS = [
  {
    id: "L1",
    title: "One card, one row",
    goal: "What a hole in a card does.",
    deck: () => makeDeck(8, ["...OO..."], false),
    tie: { kind: "straight", repeats: 1 },
    follow: { hook: 3, end: null, pick: null },
    steps: [
      "The card on the needles has two holes, for hooks 4 and 5. Hook 4 is followed in blue.",
      "Press Step ▸ and watch the section: the blanks push their needles back, and their hooks off the knives.",
      "Step on until the shed opens: only hooks 4 and 5 rise, and lift warp ends 4 and 5.",
      "Step on until the batten has beaten up: the cloth has one row.",
    ],
    notice: "A hole lets its needle into the cylinder, so its hook stays over its knife and is lifted: hole = 1 = warp up.",
    question: "Which warp ends lie over the weft in row 1, and why those?",
    variants: [],
    picks: 1,
    shows: (cloth) => cloth.length >= 1 && bits(cloth[0]) === "00011000",
  },
  {
    id: "L2",
    title: "Plain weave",
    goal: "The simplest cloth: two cards, taking turns.",
    deck: () => makeDeck(8, ["O.O.O.O.", ".O.O.O.O"], true),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: ["The chain has two cards, laced into a loop.", "Press Play, and let it weave a dozen rows.", "Look at the cloth from the front, then from the back."],
    notice: "Each card lifts every other end; the next lifts the others. Over, under, over, under: the weft is held at every crossing.",
    question: "Why does the back of plain weave look the same as the front?",
    variants: [],
    picks: 8,
    shows: (cloth) => cloth.length >= 8 && cloth.every((row, p) => row.every((b, e) => b === ((e + p) % 2 === 0))),
  },
  {
    id: "L3",
    title: "Twill",
    goal: "A diagonal from four cards, each one step on.",
    deck: () => makeDeck(8, ["OO..OO..", ".OO..OO.", "..OO..OO", "O..OO..O"], true),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: ["Each card is the one before it, moved one hole to the right.", "Press Play and watch the cloth grow.", "Then try the variant with the cards in reverse order."],
    notice: "Each row is the row below it moved one end on, so the floats line up in diagonals.",
    question: "What happens to the diagonal when the cards come in the opposite order?",
    variants: [{ label: "Cards in reverse order", deck: () => makeDeck(8, ["O..OO..O", "..OO..OO", ".OO..OO.", "OO..OO.."], true) }],
    picks: 8,
    shows: (cloth) => cloth.length >= 8 && cloth.slice(1).every((row, i) => row.every((b, e) => b === cloth[i][(e + 7) % 8])),
  },
  {
    id: "L4",
    title: "Satin",
    goal: "A smooth face: one crossing per thread, spread out.",
    deck: () => makeDeck(8, ["O.......", "...O....", "......O.", ".O......", "....O...", ".......O", "..O.....", ".....O.."], true),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: ["Each card has one hole, three places on from the last.", "Weave eight rows and look at the cloth's face.", "Then try the variant that steps by two."],
    notice: "Every warp end is lifted exactly once in eight picks, and no two crossings touch: the weft floats smoothly over the rest.",
    question: "Why does stepping by two fail? (Hint: 2 and 8 share a factor.)",
    variants: [{ label: "Step by two (try it)", deck: () => makeDeck(8, ["O.......", "..O.....", "....O...", "......O.", "O.......", "..O.....", "....O...", "......O."], true) }],
    picks: 8,
    shows: (cloth) => cloth.length >= 8 && [...Array(8).keys()].every((e) => cloth.slice(0, 8).filter((row) => row[e]).length === 1),
  },
  {
    id: "L5",
    title: "A picture",
    goal: "Cards that weave a figure: the research's arrow.",
    deck: () => makeDeck(8, ["...OO...", "...OO...", "...OO...", "...OO...", "O..OO..O", ".O.OO.O.", "..OOOO..", "...OO..."], false),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: ["Look at the chain: the first card is the arrow's shaft, the last its tip.", "Press Play until the chain runs out.", "Read the cloth from the bottom up."],
    notice: "The first card weaves the bottom row, so the picture is cut from its bottom line up, and the cloth shows it the right way up.",
    question: "What would the cloth show if the cards were laced in the opposite order?",
    variants: [],
    picks: 8,
    shows: (cloth) => cloth.length >= 8 && cloth.slice(0, 8).map(bits).reverse().join("") === PICTURES.arrow.rows.map((r) => r.replace(/#/g, "1").replace(/\./g, "0")).join(""),
  },
  {
    id: "L6",
    title: "Your picture",
    goal: "From a picture to cards, and why real pictures were woven in satin.",
    deck: () => {
      const r = readDirect(pictureFromStrings(PICTURES.heart.rows), { hooks: 16 });
      return { hooks: 16, cards: r.ok ? r.reading.cards : [], loop: false };
    },
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: [
      "Open the Picture tab: draw on the grid, open an image, or keep the heart.",
      "Make the cards directly, one pixel per thread, and weave them. The helper marks every float longer than 8 threads.",
      "Then make them as damask, each pixel a block of satin, and weave again (a bigger head may be needed).",
    ],
    notice: "Read directly, a large dark or light area is one thread lying loose over many: the cloth would not hold. In damask, with blocks of 2 threads or more, no float is longer than 8.",
    question: "Why did the weavers of the famous woven portrait of Jacquard use satins, not plain pixels?",
    variants: [],
    picks: 16,
    shows: (cloth) => cloth.length >= 16 && findFloats(cloth).floats.length > 0,
    picture: true,
  },
  {
    id: "L7",
    title: "Loops and repeats",
    goal: "Four cards, many rows; one hook, many ends.",
    deck: () => makeDeck(8, ["OO..OO..", ".OO..OO.", "..OO..OO", "O..OO..O"], true),
    tie: { kind: "straight", repeats: 3 },
    follow: { hook: 0, end: null, pick: null },
    steps: [
      "The chain is a loop of four cards, and the tie-up repeats each hook three times across the warp: 24 ends from 8 hooks.",
      "Press Play and let it weave a few rows past the fourth.",
      "Hook 1 is followed: see its three harness cords in the front view, and its three columns in the cloth.",
      "Then change the tie-up to the point tie and weave again.",
    ],
    notice: "The pattern repeats every 4 picks up the cloth (the loop) and every 8 ends across it (the tie-up).",
    question: "How many cards and hooks would a pattern 8 rows high and 24 ends wide need with no repeats?",
    variants: [],
    picks: 12,
    shows: (cloth) => cloth.length >= 12 && cloth.every((row, p) => row.length === 24 && row.every((b, e) => b === cloth[p % 4][e % 8])),
  },
  {
    id: "L8",
    title: "Debug the deck",
    goal: "Find two mistakes in a deck from the flaws they weave.",
    deck: () => makeDeck(8, [...TWILL.slice(0, 2), TWILL[3], TWILL[2], ...TWILL.slice(0, 2), "..O...OO", TWILL[3]], false),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: [
      "This deck should weave two repeats of the twill of L3: a clean diagonal, eight rows high.",
      "Press Play until the chain runs out, and look at the cloth for where the diagonal breaks.",
      "Click a faulty cell of the cloth: the trace shows its card and its hole. Fix the cards in the chain (punch, or move a card with ↑ ↓), then Reset and weave again.",
    ],
    notice: "Two cards in the wrong order break the diagonal for two rows; a missing hole leaves one warp end down where the pattern wants it up. The cloth shows exactly which card, and which hole.",
    question: "Which two mistakes were made, and which rows of the cloth showed each?",
    variants: [{ label: "Show the corrected deck", deck: () => makeDeck(8, [...TWILL, ...TWILL], false) }],
    picks: 8,
    shows: (cloth) => {
      if (cloth.length < 8) return false;
      const target = [...TWILL, ...TWILL].map((c) => c.replace(/O/g, "1").replace(/\./g, "0"));
      const wrong = cloth.slice(0, 8).map((row, p) => (bits(row) === target[p] ? -1 : p)).filter((p) => p >= 0);
      return wrong.join() === "2,3,6";
    },
  },
  {
    id: "L9",
    title: "A program, but not a computer",
    goal: "What the loom does with its cards, and what it cannot do.",
    deck: () => makeDeck(8, ["O..O..O.", ".O..O..O", "..O..O.."], true),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: [
      "The chain is a loop of three cards. Weave nine rows.",
      "Compare rows 4 to 6 with rows 1 to 3, and rows 7 to 9: the same, card for card.",
      "Look for any way to make the loom weave the second round differently without changing a card. There is none: the chain alone decides.",
    ],
    notice: "The loom reads its cards in a fixed order and never looks at what it has woven: no choice, no arithmetic, nothing written back. Lovelace wrote that Babbage's Engine \"weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves\" (Note A, 1843).",
    question: "Babbage borrowed the cards. What did his Analytical Engine add that the loom lacks? (Lovelace: cards for operations and for numbers, a store and a mill, and \"backing\" the cards to use a group again, Notes B and C.)",
    variants: [],
    picks: 9,
    shows: (cloth) => cloth.length >= 9 && cloth.every((row, p) => bits(row) === bits(cloth[p % 3])) && bits(cloth[0]) !== bits(cloth[1]),
  },
  {
    id: "L10",
    title: "Make a real card",
    goal: "Print the deck at true size, punch it, lace it.",
    deck: () => makeDeck(8, ["...OO...", "...OO...", "...OO...", "...OO...", "O..OO..O", ".O.OO.O.", "..OOOO..", "...OO..."], false),
    tie: { kind: "straight", repeats: 1 },
    follow: null,
    steps: [
      "The loom has the arrow of L5 on an 8-hook head: eight cards of one column each. (Any deck works: make your own first, or put a picture on the loom.)",
      "Press \"Print the cards at true size\" and print at 100 %. Check one card with a ruler: 58.7 mm across, as Posselt's cards were.",
      "Cut out the black holes (a hole punch or a pencil on a pad), then lace the cards in order through the small holes at their ends.",
      "Read your chain card by card and compare it with the chain on the screen.",
    ],
    notice: "Each card on the screen is the same card you hold: its column of eight holes is one cross-row of the head, hole 1 at the top.",
    question: "Lay your chain over the woven cloth: which card made which row?",
    variants: [],
    picks: 8,
    shows: (cloth) => cloth.length >= 8 && cloth.slice(0, 8).map(bits).reverse().join("") === PICTURES.arrow.rows.map((r) => r.replace(/#/g, "1").replace(/\./g, "0")).join(""),
    print: true,
  },
];
