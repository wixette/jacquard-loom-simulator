// The chain of cards and the card on the bench. The chain is a list with one line per
// card, each card unfolded into a strip of holes in hook order (1 at the left), like a row
// of point paper over the warp. The selected card also lies on the bench as the real card:
// eight rows of holes, one column per cross-row of the head, peg holes at the ends. A
// click on either punches the hole or fills it again; they are the same hole. The two are
// apart (ChainList, BenchCard), so each can have a place of its own.

import { locale, t, tn } from "../l10n/l10n.js";
import { onPress } from "../ui/components.js";
import { realCard } from "./cardLayout.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Trace } from "../sim/trace.js" */

/**
 * @typedef {object} ChainEvents
 * @property {(card: number, hook: number) => void} onToggle
 * @property {(card: number) => void} onSelect
 * @property {(hook: number) => void} onFollow
 * @property {(loop: boolean) => void} [onLace] given, the chain's end is a switch that laces it
 *   into a loop or opens it, where the end is shown
 */

const NS = "http://www.w3.org/2000/svg";

/**
 * A click on a card or one of its holes, wherever it is drawn (onPress gives the part pressed).
 * @param {ChainEvents} events
 * @returns {(part: Element) => void}
 */
const clicks = (events) => (part) => {
  const lace = part.closest("[data-lace]");
  if (lace instanceof HTMLElement) {
    events.onLace?.(lace.dataset.lace !== "1");
    return;
  }
  const head = part.closest("[data-head]");
  if (head instanceof HTMLElement) {
    events.onFollow(Number(head.dataset.head));
    return;
  }
  const t = part.closest("[data-card]");
  if (!(t instanceof HTMLElement || t instanceof SVGElement)) return;
  const card = Number(t.dataset.card);
  if (t.dataset.hook !== undefined) events.onToggle(card, Number(t.dataset.hook));
  else events.onSelect(card);
};

export class ChainList {
  /**
   * @param {HTMLElement} host where the chain is listed
   * @param {ChainEvents} events
   */
  constructor(host, events) {
    this.list = document.createElement("div");
    this.list.className = "chain";
    host.appendChild(this.list);
    this.key = "";
    this.laces = events.onLace !== undefined;
    /** The hole the keyboard is on (card -1: the hook numbers over the chain), the chain's one Tab stop. */
    this.at = { card: 0, hook: 0 };
    /** The card selected when last drawn: a new one (a click, a tool) takes the keyboard there. */
    this.selected = -1;
    onPress(this.list, clicks(events));
    this.list.addEventListener("focusin", (e) => {
      const b = /** @type {HTMLElement} */ (e.target);
      if (b.dataset.hook !== undefined) this.at = { card: Number(b.dataset.card), hook: Number(b.dataset.hook) };
      else if (b.dataset.head !== undefined) this.at = { card: -1, hook: Number(b.dataset.head) };
    });
    // The arrow keys go from hole to hole and card to card (a card reached is selected, as a
    // click selects it), Home and End to a card's first and last hole; Enter or Space punches.
    this.list.addEventListener("keydown", (e) => {
      const b = /** @type {HTMLElement} */ (e.target);
      if (b.dataset.hook === undefined && b.dataset.head === undefined) return;
      const cards = this.list.querySelectorAll(".card-line").length;
      const hooks = this.list.querySelectorAll(".strip-head .hn").length;
      let { card, hook } = this.at;
      if (e.key === "ArrowRight") hook = Math.min(hooks - 1, hook + 1);
      else if (e.key === "ArrowLeft") hook = Math.max(0, hook - 1);
      else if (e.key === "ArrowDown") card = Math.min(cards - 1, card + 1);
      else if (e.key === "ArrowUp") card = Math.max(-1, card - 1);
      else if (e.key === "Home") hook = 0;
      else if (e.key === "End") hook = hooks - 1;
      else return;
      e.preventDefault();
      const changed = card !== this.at.card;
      this.at = { card, hook };
      this.focusAt();
      if (changed && card >= 0) events.onSelect(card);
    });
  }

  /** Focus the hole (or hook number) the keyboard is on. */
  focusAt() {
    const { card, hook } = this.at;
    const sel = card < 0 ? `.hn[data-head="${hook}"]` : `.hole[data-card="${card}"][data-hook="${hook}"]`;
    /** @type {HTMLElement | null} */ (this.list.querySelector(sel))?.focus();
  }

  /**
   * Draws only when something it shows has changed (the chain can be long).
   * @param {Snapshot} snap
   * @param {number} selected
   * @param {Trace | null} trace
   * @param {string} [lang] the language it is drawn in, so a new one redraws it
   */
  render(snap, selected, trace, lang = "") {
    const { deck } = snap;
    const atRest = snap.phi === 0;
    const key = JSON.stringify([deck, selected, trace?.hook, trace?.cardIndex, snap.cardIndex, snap.facingIndex, snap.nextIndex, atRest, lang]);
    if (key === this.key) return;
    this.key = key;
    const follow = trace ? trace.hook : null;
    // the keyboard's hole kept in the chain; a card selected elsewhere takes it there
    if (selected !== this.selected && this.at.card >= 0) this.at = { ...this.at, card: selected };
    this.selected = selected;
    this.at = { card: Math.min(this.at.card, deck.cards.length - 1), hook: Math.min(this.at.hook, deck.hooks - 1) };
    const focused = this.list.contains(document.activeElement) && document.activeElement !== this.list.querySelector(".lace");
    const stop = (/** @type {number} */ card, /** @type {number} */ hook) => (card === this.at.card && hook === this.at.hook ? "0" : "-1");
    const cell = Math.max(7, Math.min(18, Math.floor(250 / deck.hooks)));
    this.list.style.setProperty("--cell", `${cell}px`);
    this.list.style.setProperty("--hooks", String(deck.hooks));
    this.list.setAttribute("aria-label", t("chain.name"));

    const rows = [];
    const head = [...Array(deck.hooks).keys()]
      .map((h) => `<button type="button" class="hn${follow === h ? " follow" : ""}" data-head="${h}" tabindex="${stop(-1, h)}" title="${t("chain.followHook", { hook: h + 1 })}" aria-label="${t("chain.followHook", { hook: h + 1 })}">${deck.hooks > 16 && (h + 1) % 8 !== 0 && h !== 0 ? "" : h + 1}</button>`)
      .join("");
    rows.push(`<div class="strip-head"><span class="num"></span><span class="strip">${head}</span><span class="tag"></span></div>`);
    const onNeedles = t("chain.onNeedles");
    deck.cards.forEach((card, i) => {
      let tag = "";
      if (i === snap.cardIndex) tag = atRest ? onNeedles : t("chain.weaving");
      else if (i === snap.facingIndex) tag = onNeedles;
      else if (i === snap.nextIndex && !atRest) tag = t("chain.next");
      const cls = ["card-line", i === selected ? "selected" : "", i === snap.cardIndex ? "current" : "", trace && trace.pick !== null && i === trace.cardIndex ? "traced" : ""].filter(Boolean).join(" ");
      const holes = card
        .map((p, h) => `<button type="button" class="hole${p ? " punched" : ""}${follow === h ? " follow" : ""}${h % 8 === 7 ? " col-end" : ""}" data-card="${i}" data-hook="${h}" tabindex="${stop(i, h)}" aria-label="${t(p ? "chain.hole.punched" : "chain.hole.blank", { card: i + 1, hole: h + 1 })}" aria-pressed="${p}"></button>`)
        .join("");
      rows.push(`<div class="${cls}" data-card="${i}"><span class="num">${i + 1}</span><span class="strip">${holes}</span><span class="tag">${tag}</span></div>`);
    });
    if (deck.cards.length === 0) rows.push(`<p class="empty">${t("chain.empty")}</p>`);
    else if (this.laces)
      rows.push(
        `<button type="button" class="chain-end lace" role="switch" aria-checked="${deck.loop}" data-control="loop" data-lace="${deck.loop ? 1 : 0}" title="${t("cards.loop")}"><span class="switch" aria-hidden="true"></span><span>${t(deck.loop ? "chain.lace.on" : "chain.lace.off")}</span></button>`,
      );
    else rows.push(`<p class="chain-end">${t(deck.loop ? "chain.loop" : "chain.open")}</p>`);
    this.list.innerHTML = rows.join("");
    // the chain is drawn anew as the loom moves on: the keyboard stays on its hole
    if (focused) this.focusAt();
  }
}

export class BenchCard {
  /**
   * @param {HTMLElement} host where the real card lies
   * @param {ChainEvents} events
   */
  constructor(host, events) {
    this.svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, "svg"));
    this.svg.setAttribute("class", "bench-card");
    this.svg.setAttribute("role", "group");
    host.appendChild(this.svg);
    this.label = document.createElement("p");
    this.label.className = "bench-label";
    host.appendChild(this.label);
    onPress(this.svg, clicks(events));
    /** What it last drew (render's key). @type {string} */
    this.drawn = "";
  }

  /**
   * @param {Snapshot} snap
   * @param {number} selected
   * @param {number | null} follow
   */
  render(snap, selected, follow) {
    const { deck } = snap;
    const card = deck.cards[selected];
    // drawn again only when what it shows changes: drawn every frame while the loom plays, a
    // hole would be replaced between its press and its release, and the punch lost
    const key = JSON.stringify([deck.hooks, selected, follow, card ? card.map(Number).join("") : null, this.svg.clientWidth, this.svg.clientHeight, locale()]);
    if (key === this.drawn) return;
    this.drawn = key;
    const rc = realCard(deck.hooks);
    const m = 6;
    this.svg.setAttribute("viewBox", `${-m} ${-m - 6} ${rc.width + 2 * m} ${rc.height + 2 * m + 6}`);
    if (!card) {
      this.svg.innerHTML = "";
      this.label.textContent = t("bench.none");
      return;
    }
    const out = [];
    out.push(`<rect class="paste" x="0" y="0" width="${rc.width}" height="${rc.height}" rx="2"/>`);
    for (const p of rc.pegs) out.push(`<circle class="peg" cx="${p.x}" cy="${p.y}" r="${rc.pegDiameter / 2}"/>`);
    for (const l of rc.laces) out.push(`<circle class="lace" cx="${l.x}" cy="${l.y}" r="1.4"/>`);
    const columns = deck.hooks / 8;
    // Column numbers about 10 px on screen, at whatever size the bench card is shown.
    const vbW = rc.width + 2 * m;
    const vbH = rc.height + 2 * m + 6;
    const scale = this.svg.clientWidth > 0 ? Math.min(this.svg.clientWidth / vbW, (this.svg.clientHeight || 1e9) / vbH) : 4;
    const colPx = Math.min(5, 10 / scale);
    for (let c = 0; c < columns; c++) {
      const x = rc.holes[c * 8].x;
      if (columns <= 16 || c === 0 || (c + 1) % 4 === 0) out.push(`<text class="collbl" x="${x}" y="-2" text-anchor="middle" font-size="${colPx.toFixed(2)}">${c + 1}</text>`);
    }
    for (const h of rc.holes) {
      const punched = card[h.hook];
      out.push(
        `<circle class="hole${punched ? " punched" : ""}${follow === h.hook ? " follow" : ""}" data-card="${selected}" data-hook="${h.hook}" cx="${h.x.toFixed(2)}" cy="${h.y.toFixed(2)}" r="${(rc.holeDiameter / 2 + 0.4).toFixed(2)}"><title>${t("bench.hole", { hook: h.hook + 1, column: h.column + 1, row: h.row + 1 })}</title></circle>`,
      );
    }
    this.svg.innerHTML = out.join("");
    this.svg.setAttribute("aria-label", t("bench.name", { card: selected + 1 }));
    this.label.textContent = tn("bench.short", columns, { card: selected + 1 });
    this.label.title = tn("bench.caption", columns, { card: selected + 1 });
  }
}
