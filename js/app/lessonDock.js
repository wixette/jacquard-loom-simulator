// The lessons panel: the list of lessons, and the one open, with what to do, what to
// notice and one question. Opening a lesson puts its cards and tie on the loom, from the
// start; its variants put other cards on with one click.

import { LESSONS } from "../teach/lessons.js";
/** @import { LoomPage } from "./loomPage.js" */
/** @import { Lesson } from "../teach/lessons.js" */

/** @param {string} s */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export class LessonDock {
  /**
   * @param {HTMLElement} host
   * @param {LoomPage} page
   * @param {{ showPicture: () => void, print: () => void }} events
   */
  constructor(host, page, events) {
    this.host = host;
    this.page = page;
    /** @type {Lesson | null} */
    this.current = null;
    host.addEventListener("click", (e) => {
      const t = /** @type {Element} */ (e.target).closest("button");
      if (!t) return;
      if (t.dataset.lesson) this.open(t.dataset.lesson);
      else if (t.dataset.variant !== undefined && this.current) {
        const v = this.current.variants[Number(t.dataset.variant)];
        page.open({ deck: v.deck(), tie: this.current.tie, follow: null, message: `${this.current.id}, ${v.label.toLowerCase()}: new cards on the loom, from the start. Press Play.` });
      } else if (t.dataset.action === "again" && this.current) this.open(this.current.id);
      else if (t.dataset.action === "list") this.showList();
      else if (t.dataset.action === "picture") events.showPicture();
      else if (t.dataset.action === "print") events.print();
    });
    this.showList();
  }

  showList() {
    this.current = null;
    this.host.innerHTML = `<p class="dock-intro">Ten short lessons, in order. Each puts its own cards on the loom and asks one question.</p>
      <ol class="lesson-list">${LESSONS.map((l) => `<li><button type="button" data-lesson="${l.id}"><span class="lid">${l.id}</span><span><strong>${esc(l.title)}</strong><br /><small>${esc(l.goal)}</small></span></button></li>`).join("")}</ol>`;
  }

  /**
   * Opens a lesson: its cards go on the loom, from the start.
   * @param {string} id
   * @returns {boolean} whether there is such a lesson
   */
  open(id) {
    const l = LESSONS.find((x) => x.id === id);
    if (!l) return false;
    this.current = l;
    const i = LESSONS.indexOf(l);
    const next = LESSONS[i + 1];
    this.page.open({ deck: l.deck(), tie: l.tie, follow: l.follow, view: "whole", message: `${l.id} · ${l.title}: its cards are on the loom, at the first card. ${l.steps[0]}` });
    this.host.innerHTML = `
      <div class="lesson-bar"><button type="button" data-action="list">◂ All lessons</button><span class="lid">${l.id} of ${LESSONS.length}</span></div>
      <h3>${esc(l.title)}</h3>
      <p class="goal">${esc(l.goal)}</p>
      <ol class="steps">${l.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${l.picture ? `<button type="button" data-action="picture" class="primary">Open the picture helper</button>` : ""}
      ${l.print ? `<button type="button" data-action="print" class="primary">Print the cards at true size</button>` : ""}
      ${l.variants.length ? `<div class="row tools">${l.variants.map((v, k) => `<button type="button" data-variant="${k}">${esc(v.label)}</button>`).join("")}</div>` : ""}
      <p class="notice"><strong>Notice:</strong> ${esc(l.notice)}</p>
      <p class="question"><strong>Question:</strong> ${esc(l.question)}</p>
      <div class="row tools"><button type="button" data-action="again">↺ Start this lesson again</button>${next ? `<button type="button" data-lesson="${next.id}">Next: ${esc(next.title)} ▸</button>` : ""}</div>`;
    return true;
  }
}
