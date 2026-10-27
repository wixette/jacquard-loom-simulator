// The guide (design/public-app.md §1, How a step behaves; as the sibling's step player, its U18,
// U26): the tutorial's step as one card, with its part and place over it, its picture and
// credit, its text, its question (predict, then weave), its task line, and Back and Next under
// it. The card is laid out again for a new step or language; the task line, the answers and Next
// follow the loom as the learner works it.

import { say, t } from "../../l10n/l10n.js";
import { endsPart, opensPart, placeInPart, STEPS } from "../../teach/tutorial.js";
import { el, icon, setTip, showMenu } from "../../ui/components.js";
import { answer, goTo, stepDone } from "../learn.js";
/** @import { AppStore, AppState } from "../looms.js" */
/** @import { Component } from "./component.js" */
/** @import { Asked } from "../../teach/tutorial.js" */
/** @import { IconName } from "../../ui/components.js" */

/** The version this module was loaded with (?v=), for the pictures it shows. */
const V = new URL(import.meta.url).search;

/**
 * The controls a task line can offer: the control it works (found in the page as it is now),
 * its icon and its label.
 * @type {Record<Asked, { find: string; icon: IconName; label: string }>}
 */
export const ASKED = {
  step: { find: '.player [data-act="fwd"]', icon: "skip_next", label: "learn.ask.step" },
  play: { find: '.player [data-act="play"]', icon: "play_arrow", label: "learn.ask.play" },
  loop: { find: "[data-control=loop]", icon: "repeat", label: "learn.ask.loop" },
  setup: { find: ".setup-chip", icon: "tune", label: "learn.ask.setup" },
};

/**
 * A step's placeholders, in words.
 * @param {import("../../teach/tutorial.js").Step} step
 * @returns {Record<string, string>}
 */
const params = (step) => Object.fromEntries(Object.entries(step.params ?? {}).map(([k, m]) => [k, say(m)]));

/**
 * A text as paragraphs: blank lines between them.
 * @param {string} text
 * @param {string} [cls]
 */
const paragraphs = (text, cls) => text.split(/\n\n+/).map((p) => el("p", { class: cls, text: p }));

/**
 * @param {AppStore} store
 * @param {{ onWeave: () => void }} o what "Go to Weave" does
 * @returns {Component}
 */
export function guidePanel(store, o) {
  /** @type {HTMLElement} */
  let host;
  /** @type {HTMLElement} */
  let box;
  /** The live parts of the card, made anew with it. */
  let live = /** @type {{ step: number; locale: string; fresh: boolean; taskDone: boolean | null; task: HTMLElement | null; done: HTMLElement | null; recap: HTMLElement | null; feedback: HTMLElement | null; choices: HTMLInputElement[]; next: HTMLButtonElement; asks: HTMLButtonElement[] } | null} */ (null);

  /** The controls the step's task asks for, glowing in the page while it is not done. @param {boolean} on */
  const glow = (on) => {
    for (const e of document.querySelectorAll(".wanted")) e.classList.remove("wanted");
    if (!on) return;
    for (const a of STEPS[store.state.learn.step].task?.ask ?? []) for (const e of document.querySelectorAll(ASKED[a].find)) e.classList.add("wanted");
  };

  /** Lay the card out for the step on show. @param {AppState} s */
  const build = (s) => {
    const i = s.learn.step;
    const step = STEPS[i];
    const key = (/** @type {string} */ k) => `tut.${step.id}.${k}`;
    const text = (/** @type {string} */ k) => t(key(k), params(step));
    const where = placeInPart(i);
    const contents = el("button", { type: "button", class: "btn icon-only step-contents", "aria-haspopup": "menu" }, [icon("toc")]);
    setTip(contents, t("learn.contents"));
    contents.addEventListener("click", () =>
      showMenu(
        contents,
        STEPS.map((x, k) => ({
          label: `${placeInPart(k).at}. ${t(`tut.${x.id}.title`)}`,
          checked: store.state.learn.done.includes(x.id),
          divider: opensPart(k) ? t(`tut.part${x.part}`) : undefined,
          run: () => goTo(store, k),
        })),
      ),
    );
    const head = el("div", { class: "step-head" }, [el("p", { class: "step-kicker", text: t("learn.kicker", { part: where.part, name: t(`tut.part${where.part}`), at: where.at, of: where.of }) }), contents]);

    const card = el("article", { class: "step-card", "aria-labelledby": "step-title" });
    if (opensPart(i)) card.append(el("p", { class: "step-lead", text: t(`tut.part${step.part}.goal`) }));
    card.append(el("h3", { id: "step-title", tabindex: "-1", text: text("title") }));
    if (step.image) {
      card.append(
        el("figure", { class: "step-picture" }, [
          el("img", { src: `${step.image.file}${V}`, alt: "", width: String(step.image.width), height: String(step.image.height), draggable: "false", loading: "lazy" }),
          el("figcaption", { text: t(step.image.credit) }),
        ]),
      );
    }
    card.append(...paragraphs(text("text")));

    /** @type {HTMLInputElement[]} */
    const choices = [];
    let feedback = null;
    if (step.predict) {
      const set = el("fieldset", { class: "predict" }, [el("legend", { text: text("q") })]);
      for (let c = 1; c <= step.predict.choices; c++) {
        const input = el("input", { type: "radio", name: `predict-${step.id}`, value: String(c) });
        input.addEventListener("change", () => answer(store, c));
        choices.push(input);
        set.append(el("label", { class: "choice" }, [input, el("span", { text: text(`a${c}`) })]));
      }
      feedback = el("p", { class: "feedback", "aria-live": "polite" });
      card.append(set, feedback);
    }

    /** @type {HTMLButtonElement[]} */
    const asks = [];
    let task = null;
    if (step.task) {
      for (const a of step.task.ask) {
        const b = el("button", { type: "button", class: "btn tonal ask" }, [icon(ASKED[a].icon), el("span", { text: t(ASKED[a].label) })]);
        b.addEventListener("click", () => /** @type {HTMLElement | null} */ (document.querySelector(ASKED[a].find))?.click());
        asks.push(b);
      }
      task = el("div", { class: "taskline", "aria-live": "polite" });
    }
    const done = step.done ? el("div", { class: "step-done" }, paragraphs(text("done"))) : null;
    const recap = endsPart(i) ? el("p", { class: "step-recap", text: t(`tut.part${step.part}.recap`) }) : null;
    card.append(...[task, done, recap].filter((x) => x !== null));
    if (i === STEPS.length - 1) {
      const weave = el("button", { type: "button", class: "btn filled" }, [icon("open_in_new"), el("span", { text: t("learn.toWeave") })]);
      weave.addEventListener("click", o.onWeave);
      card.append(el("p", { class: "step-actions" }, [weave]));
    }

    const back = el("button", { type: "button", class: "btn" }, [icon("chevron_left"), el("span", { text: t("learn.back") })]);
    back.disabled = i === 0;
    back.addEventListener("click", () => goTo(store, i - 1));
    const next = el("button", { type: "button", class: "btn filled" }, [el("span", { text: t("learn.next") }), icon("chevron_right")]);
    next.hidden = i === STEPS.length - 1;
    // Next waits, greyed but with its tooltip saying for what (a disabled button shows none)
    next.addEventListener("click", () => {
      if (next.getAttribute("aria-disabled") !== "true") goTo(store, i + 1);
    });
    const nav = el("div", { class: "step-nav" }, [back, next]);

    // Laid out again from inside the card (Back, Next, the contents), the focus goes to the new
    // step's title, so a screen reader reads it from the start (Next may wait, disabled).
    const inside = box.contains(document.activeElement);
    box.replaceChildren(head, el("div", { class: "step-scroll" }, [card]), nav);
    box.querySelector(".step-scroll")?.scrollTo(0, 0);
    if (inside || document.activeElement === document.body) /** @type {HTMLElement} */ (box.querySelector("#step-title")).focus({ preventScroll: true });
    live = { step: i, locale: s.locale, fresh: true, taskDone: null, task, done, recap, feedback, choices, next, asks };
  };

  /** Follow the loom and the answers: the task line, the feedback, the done text, Next. @param {AppState} s */
  const follow = (s) => {
    if (!live) return;
    const step = STEPS[s.learn.step];
    const key = (/** @type {string} */ k) => `tut.${step.id}.${k}`;
    const answered = s.learn.answers[step.id];
    live.choices.forEach((c, k) => (c.checked = answered === k + 1));
    if (live.feedback && step.predict) {
      live.feedback.textContent = answered === undefined ? "" : t(key(answered === step.predict.answer ? "right" : "wrong"), params(step));
      live.feedback.className = `feedback${answered === undefined ? "" : answered === step.predict.answer ? " right" : " wrong"}`;
    }
    const taskDone = !!step.task && step.task.check(s.looms.tutorial.loom);
    // predict, then weave: the task comes once the question has an answer
    const waiting = !!step.predict && answered === undefined;
    // what appears (the task, once answered; the done text) is scrolled into view
    const shownBefore = [live.task, live.done].map((e) => !!e && !e.hidden);
    // the task line is written again only when it changes, so a screen reader says it once
    if (live.task && live.taskDone !== taskDone) {
      live.taskDone = taskDone;
      live.task.classList.toggle("done", taskDone);
      live.task.replaceChildren(icon(taskDone ? "check_circle-fill" : "school"), el("span", { class: "task-text", text: taskDone ? t("learn.taskDone") : t(key("task"), params(step)) }), ...(taskDone ? [] : live.asks));
    }
    if (live.task) live.task.hidden = waiting;
    const ready = stepDone(s);
    if (live.done) live.done.hidden = !(step.task ? taskDone : answered !== undefined);
    if (!live.fresh)
      [live.task, live.done].forEach((e, k) => {
        if (e && !e.hidden && !shownBefore[k]) e.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    live.fresh = false;
    if (live.recap) live.recap.hidden = !ready;
    live.next.setAttribute("aria-disabled", String(!ready));
    setTip(live.next, ready ? t("learn.next.tip") : t(waiting ? "learn.next.answer" : "learn.next.wait"));
    glow(!!step.task && !taskDone && !waiting);
  };

  return {
    name: "comp.guide",
    mount(h) {
      host = h;
      box = el("div", { class: "guide-box" });
      host.appendChild(box);
    },
    watch(s) {
      return [s.learn.step, s.locale, s.learn.answers, s.learn.done, s.looms.tutorial.rev];
    },
    update(s) {
      if (!live || live.step !== s.learn.step || live.locale !== s.locale) build(s);
      follow(s);
    },
    unmount() {
      glow(false);
      box.remove();
      live = null;
    },
  };
}
