// The Play panel (design/m9-notes.md; design/public-app.md §2): the four games by tab, and the
// game on show. Each game works the game loom through js/app/play.js; the cloth it weaves is on
// the stage, and the loom's own controls weave it pick by pick. The panel is laid out again for
// another game or language, and follows the game's state and the loom otherwise.

import { t, tn } from "../../l10n/l10n.js";
import { byteChar, MAX_BYTES, readMessage, rowBits, rowByte } from "../../game/byteGame.js";
import * as drawBoy from "../../game/drawBoy.js";
import { puzzle } from "../../game/guessGame.js";
import { decodeCloth, MAX_CHARS, MAX_LINES, planName } from "../../game/nameGame.js";
import { cardToString } from "../../sim/deck.js";
import { MAX_TEXT } from "../../sim/link.js";
import { el, icon, setText } from "../../ui/components.js";
import { clothThumb } from "../../view2d/clothThumb.js";
import * as play from "../play.js";
import { GAMES } from "../playState.js";
/** @import { AppStore, AppState } from "../looms.js" */
/** @import { Component } from "./component.js" */

/** @param {string} key @param {Record<string, any>} [params] */
const p = (key, params) => el("p", { class: "game-text", text: t(key, params) });

/**
 * @param {AppStore} store
 * @returns {Component}
 */
export function gamesPanel(store) {
  /** @type {HTMLElement} */
  let box;
  /** @type {HTMLElement} */
  let body;
  /** The game chooser: a list of the games by their titles, as many as there come to be. @type {HTMLSelectElement} */
  let chooser;
  /** The game laid out, and the language, to know when to lay it out again. */
  let shown = "";
  /** What follows the state, set by the game laid out. @type {(s: AppState) => void} */
  let follow = () => {};

  /** The name game: a name, how it is read (as Design reads a picture), Weave to the end, and the cloth read back. */
  const nameGame = () => {
    // up to MAX_LINES lines of MAX_CHARS, with room for the spaces and line breaks between them
    const text = el("textarea", { class: "game-input", rows: "3", maxlength: String(MAX_TEXT), spellcheck: "false", "aria-label": t("name.label") });
    text.value = store.state.play.name.text;
    text.addEventListener("input", () => play.setName(store, { text: text.value }));
    const modes = el("div", { class: "seg", role: "group" });
    // the same two readings as Design's, by the same names, in the same order
    for (const m of /** @type {const} */ (["direct", "damask"])) {
      const b = el("button", { type: "button", "data-mode": m, text: t(`pic.${m}`) });
      b.addEventListener("click", () => play.setName(store, { mode: m }));
      modes.append(b);
    }
    const all = el("button", { type: "button", class: "btn filled" }, [icon("skip_next"), el("span", { text: t("game.weaveAll") })]);
    all.addEventListener("click", () => play.weaveAll(store));
    const read = el("p", { class: "game-result" });
    follow = (s) => {
      for (const b of /** @type {HTMLElement[]} */ ([...modes.children])) b.setAttribute("aria-pressed", String(b.dataset.mode === s.play.name.mode));
      const r = planName(s.play.name.text, s.play.name.mode);
      const cloth = s.looms.game.loom.cloth;
      // the cloth read back line by line; when it is the text's lines, the text as typed (its line breaks as " / ")
      const back = r.ok && cloth.length >= r.plan.deck.cards.length ? decodeCloth(cloth, r.plan) : [];
      const typed = s.play.name.text.split("\n").map((l) => l.trim().replace(/ +/g, " ")).filter((l, i, all) => l !== "" || all.slice(i).some((x) => x.trim() !== "")).join(" / ");
      // said aloud once the cloth reads back, not at every row woven
      read.setAttribute("aria-live", back.length ? "polite" : "off");
      setText(read, !r.ok ? "" : back.length === 0 ? t("name.weaving", { rows: cloth.length, of: r.plan.deck.cards.length }) : t("name.reads", { text: back.join("\n") === r.plan.lines.join("\n") ? typed : back.join(" / ") }));
    };
    return [p("name.about", { per: MAX_CHARS, lines: MAX_LINES }), text, el("div", { class: "game-row" }, [el("span", { class: "game-label", text: t("pic.reading.label") }), modes]), p("name.modes"), el("div", { class: "game-row" }, [all]), read];
  };

  /** One byte a card: a message typed, its rows read back; or a friend's secret to read. */
  const byteGame = () => {
    const rows = el("table", { class: "byte-rows" });
    const secret = store.state.play.byte.secret;
    let filled = -1;
    const fill = (/** @type {AppState} */ s) => {
      const cloth = s.looms.game.loom.cloth;
      // made anew only when a row is woven or unwoven, not every frame (a selection in it stays)
      if (cloth.length === filled) return;
      filled = cloth.length;
      rows.replaceChildren(
        el("tr", {}, [el("th", { text: t("byte.row") }), el("th", { text: t("byte.bits") }), el("th", { text: t("byte.code") }), el("th", { text: t("byte.char") })]),
        ...cloth.map((row, i) => el("tr", {}, [el("td", { text: String(i + 1) }), el("td", { class: "bits", text: rowBits(row) }), el("td", { text: secret ? "" : String(rowByte(row)) }), el("td", { text: secret ? "" : byteChar(rowByte(row)) })])),
      );
    };
    const all = el("button", { type: "button", class: "btn filled" }, [icon("skip_next"), el("span", { text: t("game.weaveAll") })]);
    all.addEventListener("click", () => play.weaveAll(store));
    if (secret) {
      const guess = el("input", { type: "text", class: "game-input", maxlength: String(MAX_BYTES), spellcheck: "false", "aria-label": t("byte.yourReading") });
      const check = el("button", { type: "button", class: "btn tonal", text: t("byte.check") });
      const said = el("p", { class: "game-result", "aria-live": "polite" });
      check.addEventListener("click", () => {
        play.guessSecret(store, guess.value);
        const cards = store.state.looms.game.loom.deck.cards;
        const answer = readMessage(cards);
        said.textContent = guess.value === answer ? t("byte.solved", { text: answer }) : t("byte.notYet");
        said.className = `game-result ${guess.value === answer ? "right" : "wrong"}`;
      });
      follow = fill;
      return [p("byte.secretAbout"), el("div", { class: "game-row" }, [all]), rows, p("byte.hint"), el("div", { class: "game-row" }, [guess, check]), said, newMessage()];
    }
    const text = el("input", { type: "text", class: "game-input", maxlength: String(MAX_BYTES), spellcheck: "false", "aria-label": t("byte.label") });
    text.value = store.state.play.byte.text;
    text.addEventListener("input", () => play.setMessage(store, text.value));
    follow = fill;
    return [p("byte.about"), text, el("div", { class: "game-row" }, [all]), rows, p("byte.send")];
  };
  /** A button to write a message of one's own, after reading a friend's. */
  const newMessage = () => {
    const b = el("button", { type: "button", class: "btn", text: t("byte.writeOwn") });
    b.addEventListener("click", () => play.setMessage(store, "Hello!"));
    return el("div", { class: "game-row" }, [b]);
  };

  /** Guess the cloth: the cards, three cloths to choose from, the score, the next puzzle. */
  const guessGame = () => {
    const g = store.state.play.guess;
    const q = puzzle(g.seed);
    const { warp, weft } = store.state.looms.game;
    const chain = el("div", { class: "guess-cards" }, q.deck.cards.map((c, i) => el("div", { class: "guess-card" }, [el("span", { class: "num", text: String(i + 1) }), el("span", { class: "holes", text: cardToString(c).replace(/O/g, "●").replace(/\./g, "○") })])));
    const choices = el("div", { class: "guess-choices", role: "group", "aria-label": t("guess.choices") });
    q.cloths.forEach((cloth, i) => {
      const b = el("button", { type: "button", class: "guess-choice" }, [clothThumb(cloth, { warp, weft, width: 72, label: t("guess.choice", { n: i + 1 }) }), el("span", { text: t("guess.choice", { n: i + 1 }) })]);
      b.addEventListener("click", () => play.pickCloth(store, i));
      choices.append(b);
    });
    const said = el("p", { class: "game-result", "aria-live": "polite" });
    const next = el("button", { type: "button", class: "btn filled" }, [el("span", { text: t("guess.next") }), icon("chevron_right")]);
    next.addEventListener("click", () => play.nextPuzzle(store));
    follow = (s) => {
      const now = s.play.guess;
      [...choices.children].forEach((b, i) => {
        b.classList.toggle("right", now.picked !== null && i === q.answer);
        b.classList.toggle("wrong", now.picked === i && i !== q.answer);
        b.setAttribute("aria-disabled", String(now.picked !== null));
      });
      const how = now.picked !== null && now.picked !== q.answer ? q.how[now.picked] : null;
      setText(said, now.picked === null ? "" : now.picked === q.answer ? t("guess.rightWhy") : t(`guess.${how}`));
      said.className = `game-result${now.picked === null ? "" : now.picked === q.answer ? " right" : " wrong"}`;
      next.hidden = now.picked === null;
      setText(score, tn("guess.score", now.tried, { right: now.right }));
    };
    const score = el("p", { class: "game-score" });
    return [p("guess.about"), chain, choices, said, el("div", { class: "game-row" }, [next]), score];
  };

  /** Draw boy against Jacquard: the figure, the cords to pull, the shuttle; then the cards. */
  const drawBoyGame = () => {
    const { warp, weft } = store.state.looms.game;
    const figure = el("figure", { class: "drawboy-figure" }, [clothThumb(drawBoy.ROWS, { warp, weft, width: 96, label: t("drawboy.figure") }), el("figcaption", { text: t("drawboy.figure") })]);
    const cords = el("div", { class: "cords", role: "group", "aria-label": t("drawboy.cords") });
    for (let e = 0; e < 8; e++) {
      const b = el("button", { type: "button", class: "cord", "aria-pressed": "false", text: String(e + 1) });
      b.addEventListener("click", () => play.pullCord(store, e));
      cords.append(b);
    }
    const shuttle = el("button", { type: "button", class: "btn filled" }, [el("span", { text: t("drawboy.throw") })]);
    shuttle.addEventListener("click", () => play.throwShuttle(store));
    const state = el("p", { class: "game-result", "aria-live": "polite" });
    const toCards = el("button", { type: "button", class: "btn filled", text: t("drawboy.toCards") });
    toCards.addEventListener("click", () => play.drawBoyPhase(store, "cards"));
    const again = el("button", { type: "button", class: "btn", text: t("drawboy.again") });
    again.addEventListener("click", () => play.drawBoyPhase(store, "hand"));
    const hand = el("div", { class: "drawboy-hand" }, [p("drawboy.pull"), cords, el("div", { class: "game-row" }, [shuttle])]);
    follow = (s) => {
      const d = s.play.drawboy;
      const done = drawBoy.finished(d.hand);
      hand.hidden = d.phase !== "hand" || done;
      [...cords.children].forEach((b, e) => b.setAttribute("aria-pressed", String(d.hand.pulled[e])));
      const wrong = drawBoy.mistakes(d.hand);
      const loom = s.looms.game.loom;
      setText(
        state,
        d.phase === "cards"
          ? loom.cloth.length >= drawBoy.ROWS.length
            ? t("drawboy.cardsDone", { cards: drawBoy.ROWS.length, pulls: d.hand.pulls, seconds: d.hand.woven.length ? d.seconds : 0 })
            : t("drawboy.cardsGo", { cards: drawBoy.ROWS.length })
          : done
            ? tn("drawboy.handDone", wrong.length, { pulls: d.hand.pulls, fewest: drawBoy.FEWEST_PULLS, seconds: d.seconds })
            : t("drawboy.row", { row: d.hand.woven.length + 1, of: drawBoy.ROWS.length, pulls: d.hand.pulls }),
      );
      toCards.hidden = d.phase !== "hand" || !done;
      again.hidden = d.phase === "hand" && !done;
    };
    return [p("drawboy.about"), figure, hand, state, el("div", { class: "game-row" }, [toCards, again])];
  };

  /** Lay the panel out for the game on show. @param {AppState} s */
  const build = (s) => {
    shown = `${s.play.game}/${s.play.byte.secret}/${s.play.guess.seed}/${s.locale}`;
    chooser.setAttribute("aria-label", t("game.choose"));
    for (const o of chooser.options) o.text = t(`game.${o.value}.title`);
    chooser.value = s.play.game;
    const game = { name: nameGame, byte: byteGame, guess: guessGame, drawboy: drawBoyGame }[s.play.game];
    // the title is the chooser's, on show; kept as the heading a screen reader goes by
    body.replaceChildren(el("h3", { class: "game-title visually-hidden", text: t(`game.${s.play.game}.title`) }), ...game());
  };

  return {
    name: "comp.games",
    mount(h) {
      // a list, not tabs: a game is chosen, not a page of the panel shown, and more games fit it
      chooser = /** @type {HTMLSelectElement} */ (el("select", { class: "game-chooser" }));
      for (const g of GAMES) chooser.add(new Option("", g));
      chooser.addEventListener("change", () => play.chooseGame(store, /** @type {import("../playState.js").GameName} */ (chooser.value)));
      body = el("div", { class: "game-body" });
      box = el("div", { class: "games-box" }, [el("div", { class: "game-choose" }, [chooser]), body]);
      h.appendChild(box);
    },
    watch(s) {
      return [s.play, s.looms.game.rev, s.locale];
    },
    update(s) {
      const key = `${s.play.game}/${s.play.byte.secret}/${s.play.guess.seed}/${s.locale}`;
      if (key !== shown) build(s);
      follow(s);
    },
    unmount() {
      box.remove();
    },
  };
}
