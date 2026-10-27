// The chain of cards and the card on the bench. The chain is a list with one line per
// card, each card unfolded into a strip of holes in hook order (1 at the left), like a row
// of point paper over the warp. The selected card also lies on the bench as the real card:
// eight rows of holes, one column per cross-row of the head, peg holes at the ends. A
// click on either punches the hole or fills it again; they are the same hole. The two are
// apart (ChainList, BenchCard), so each can have a place of its own.

import { t, tn } from "../l10n/l10n.js";
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
 * A click on a card or one of its holes, wherever it is drawn.
 * @param {ChainEvents} events
 * @returns {(e: Event) => void}
 */
const clicks = (events) => (e) => {
  const lace = /** @type {Element} */ (e.target).closest("[data-lace]");
  if (lace instanceof HTMLElement) {
    events.onLace?.(lace.dataset.lace !== "1");
    return;
  }
  const head = /** @type {Element} */ (e.target).closest("[data-head]");
  if (head instanceof HTMLElement) {
    events.onFollow(Number(head.dataset.head));
    return;
  }
  const t = /** @type {Element} */ (e.target).closest("[data-card]");
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
    this.list.addEventListener("click", clicks(events));
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
    const cell = Math.max(7, Math.min(18, Math.floor(250 / deck.hooks)));
    this.list.style.setProperty("--cell", `${cell}px`);
    this.list.style.setProperty("--hooks", String(deck.hooks));
    this.list.setAttribute("aria-label", t("chain.name"));

    const rows = [];
    const head = [...Array(deck.hooks).keys()]
      .map((h) => `<span class="hn${follow === h ? " follow" : ""}" data-head="${h}" title="${t("chain.followHook", { hook: h + 1 })}">${deck.hooks > 16 && (h + 1) % 8 !== 0 && h !== 0 ? "" : h + 1}</span>`)
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
        .map((p, h) => `<button type="button" class="hole${p ? " punched" : ""}${follow === h ? " follow" : ""}${h % 8 === 7 ? " col-end" : ""}" data-card="${i}" data-hook="${h}" aria-label="${t(p ? "chain.hole.punched" : "chain.hole.blank", { card: i + 1, hole: h + 1 })}" aria-pressed="${p}"></button>`)
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
    this.svg.addEventListener("click", clicks(events));
  }

  /**
   * @param {Snapshot} snap
   * @param {number} selected
   * @param {number | null} follow
   */
  render(snap, selected, follow) {
    const { deck } = snap;
    const card = deck.cards[selected];
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
