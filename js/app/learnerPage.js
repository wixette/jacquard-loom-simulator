// The learner page (index.html): the whole loom in 2D (loomPage.js), always on screen, and
// one dock beside it with the lessons, the picture helper and "about this machine", one at a
// time. The mechanism pane shows the head in section or, at the learner's choice, the parts
// in 3D (parts3d.js). ?lesson=L3 opens a lesson, so a worksheet can link straight to it;
// ?view=3d opens the parts in 3D.

import { printDocument } from "../teach/printCards.js";
import { createLoomPage } from "./loomPage.js";
import { LessonDock } from "./lessonDock.js";
import { PictureHelper } from "./pictureHelper.js";
/** @import { LoomPage } from "./loomPage.js" */
/** @import { Parts3D } from "./parts3d.js" */

/**
 * @typedef {object} LearnerPage
 * @property {LoomPage} page
 * @property {LessonDock} lessons
 * @property {PictureHelper} picture
 * @property {(tab: "lessons" | "picture" | "about") => void} show
 * @property {(mech: "2d" | "3d") => Promise<Parts3D | null>} mechanism shows the section or the parts in 3D
 * @property {() => Parts3D | null} parts the 3D view, once it has been opened
 */

/** @returns {LearnerPage} */
export function createLearnerPage() {
  /** @type {Parts3D | null} */
  let parts = null;
  const page = createLoomPage({ onDraw: () => parts?.pose() });
  const tabs = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-dock]")]);
  /** @param {"lessons" | "picture" | "about"} tab */
  function show(tab) {
    for (const b of tabs) {
      const on = b.dataset.dock === tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
      /** @type {HTMLElement} */ (document.getElementById(`dock-${b.dataset.dock}`)).hidden = !on;
    }
  }
  for (const b of tabs) b.addEventListener("click", () => show(/** @type {"lessons" | "picture" | "about"} */ (b.dataset.dock)));

  const picture = new PictureHelper(/** @type {HTMLElement} */ (document.getElementById("dock-picture")), {
    onCards(deck, message) {
      page.open({ deck, tie: { kind: "straight", repeats: 1 }, follow: null, message });
    },
    say: page.say,
  });
  const lessons = new LessonDock(/** @type {HTMLElement} */ (document.getElementById("dock-lessons")), page, {
    showPicture: () => show("picture"),
    print() {
      const deck = page.loom.deck;
      const url = URL.createObjectURL(new Blob([printDocument(deck, "Jacquard cards to print")], { type: "text/html" }));
      const w = window.open(url, "_blank");
      page.say(w ? `The ${deck.cards.length} cards are open in a new tab, ready to print at 100 %.` : "The browser blocked the new tab: allow pop-ups for this page to print the cards.", !w);
    },
  });

  // The mechanism pane: the 2D section, or the parts in 3D in its place.
  const sectionHost = /** @type {HTMLElement} */ (document.getElementById("section"));
  const partsHost = /** @type {HTMLElement} */ (document.getElementById("parts3d"));
  const title = /** @type {HTMLElement} */ (document.getElementById("mech-title"));
  /**
   * @param {"2d" | "3d"} mech
   * @returns {Promise<Parts3D | null>}
   */
  async function mechanism(mech) {
    const three = mech === "3d";
    for (const b of document.querySelectorAll("[data-mech]")) b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.mech === mech);
    for (const el of document.querySelectorAll(".section-only")) /** @type {HTMLElement} */ (el).hidden = three;
    sectionHost.hidden = three;
    partsHost.hidden = !three;
    // The 3D loom shows the loom from every side: it takes the side view's room too.
    document.getElementById("stage")?.classList.toggle("three", three);
    title.textContent = three ? "The parts, in 3D" : "The head, in section";
    if (three && !parts) {
      const { createParts3D } = await import("./parts3d.js");
      parts = createParts3D(partsHost, page);
      await parts.ready;
    }
    page.draw();
    return parts;
  }
  for (const b of document.querySelectorAll("[data-mech]")) b.addEventListener("click", () => mechanism(/** @type {"2d" | "3d"} */ (/** @type {HTMLElement} */ (b).dataset.mech)));

  const lesson = new URLSearchParams(location.search).get("lesson");
  show("lessons");
  if (lesson && !lessons.open(lesson.toUpperCase())) page.say(`There is no lesson "${lesson}": the lessons are L1 to L10.`, true);
  if (new URLSearchParams(location.search).get("view") === "3d") mechanism("3d");
  return { page, lessons, picture, show, mechanism, parts: () => parts };
}
