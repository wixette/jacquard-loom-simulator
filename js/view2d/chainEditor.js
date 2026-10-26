// The chain of cards and the card on the bench. The chain is a list with one line per
// card, each card unfolded into a strip of holes in hook order (1 at the left), like a row
// of point paper over the warp. The selected card also lies on the bench as the real card:
// eight rows of holes, one column per cross-row of the head, peg holes at the ends. A
// click on either punches the hole or fills it again; they are the same hole.

import { realCard } from "./cardLayout.js";
/** @import { Snapshot } from "../sim/loom.js" */
/** @import { Trace } from "../sim/trace.js" */

/**
 * @typedef {object} ChainEvents
 * @property {(card: number, hook: number) => void} onToggle
 * @property {(card: number) => void} onSelect
 * @property {(hook: number) => void} onFollow
 */

const NS = "http://www.w3.org/2000/svg";

export class ChainEditor {
  /**
   * @param {HTMLElement} bench where the real card lies
   * @param {HTMLElement} list where the chain is listed
   * @param {ChainEvents} events
   */
  constructor(bench, list, events) {
    this.bench = bench;
    this.list = list;
    this.key = "";
    this.benchSvg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, "svg"));
    this.benchSvg.setAttribute("class", "bench-card");
    this.benchSvg.setAttribute("role", "group");
    bench.appendChild(this.benchSvg);
    this.benchLabel = document.createElement("p");
    this.benchLabel.className = "bench-label";
    bench.appendChild(this.benchLabel);
    list.classList.add("chain");
    /** @param {Event} e */
    const click = (e) => {
      const t = /** @type {Element} */ (e.target).closest("[data-card]");
      if (!(t instanceof HTMLElement || t instanceof SVGElement)) return;
      const card = Number(t.dataset.card);
      if (t.dataset.hook !== undefined) events.onToggle(card, Number(t.dataset.hook));
      else events.onSelect(card);
    };
    list.addEventListener("click", click);
    this.benchSvg.addEventListener("click", click);
    list.addEventListener("click", (e) => {
      const t = /** @type {Element} */ (e.target).closest("[data-head]");
      if (t instanceof HTMLElement) events.onFollow(Number(t.dataset.head));
    });
  }

  /**
   * Draws only when something it shows has changed (the chain can be long).
   * @param {Snapshot} snap
   * @param {number} selected
   * @param {Trace | null} trace
   */
  render(snap, selected, trace) {
    const { deck } = snap;
    const atRest = snap.phi === 0;
    const key = JSON.stringify([deck, selected, trace?.hook, trace?.cardIndex, snap.cardIndex, snap.facingIndex, snap.nextIndex, atRest, this.benchSvg.clientWidth]);
    if (key === this.key) return;
    this.key = key;
    const follow = trace ? trace.hook : null;
    const cell = Math.max(7, Math.min(18, Math.floor(250 / deck.hooks)));
    this.list.style.setProperty("--cell", `${cell}px`);
    this.list.style.setProperty("--hooks", String(deck.hooks));

    const rows = [];
    const head = [...Array(deck.hooks).keys()]
      .map((h) => `<span class="hn${follow === h ? " follow" : ""}" data-head="${h}" title="Follow hook ${h + 1}">${deck.hooks > 16 && (h + 1) % 8 !== 0 && h !== 0 ? "" : h + 1}</span>`)
      .join("");
    rows.push(`<div class="strip-head"><span class="num"></span><span class="strip">${head}</span><span class="tag"></span></div>`);
    deck.cards.forEach((card, i) => {
      let tag = "";
      if (i === snap.cardIndex) tag = atRest ? "on needles" : "weaving";
      else if (i === snap.facingIndex) tag = "on needles";
      else if (i === snap.nextIndex && !atRest) tag = "next";
      const cls = ["card-line", i === selected ? "selected" : "", i === snap.cardIndex ? "current" : "", trace && trace.pick !== null && i === trace.cardIndex ? "traced" : ""].filter(Boolean).join(" ");
      const holes = card
        .map((p, h) => `<button type="button" class="hole${p ? " punched" : ""}${follow === h ? " follow" : ""}${h % 8 === 7 ? " col-end" : ""}" data-card="${i}" data-hook="${h}" aria-label="Card ${i + 1}, hole ${h + 1}: ${p ? "punched" : "blank"}" aria-pressed="${p}"></button>`)
        .join("");
      rows.push(`<div class="${cls}" data-card="${i}"><span class="num">${i + 1}</span><span class="strip">${holes}</span><span class="tag">${tag}</span></div>`);
    });
    if (deck.cards.length === 0) rows.push(`<p class="empty">No cards. Add one to start.</p>`);
    else rows.push(`<p class="chain-end">${deck.loop ? "↺ laced back to card 1 (a closed loop)" : "▪ end of the chain (open)"}</p>`);
    this.list.innerHTML = rows.join("");

    this.renderBench(snap, selected, follow);
  }

  /**
   * @param {Snapshot} snap
   * @param {number} selected
   * @param {number | null} follow
   */
  renderBench(snap, selected, follow) {
    const { deck } = snap;
    const card = deck.cards[selected];
    const rc = realCard(deck.hooks);
    const m = 6;
    this.benchSvg.setAttribute("viewBox", `${-m} ${-m - 6} ${rc.width + 2 * m} ${rc.height + 2 * m + 6}`);
    if (!card) {
      this.benchSvg.innerHTML = "";
      this.benchLabel.textContent = "No card selected.";
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
    const scale = this.benchSvg.clientWidth > 0 ? Math.min(this.benchSvg.clientWidth / vbW, (this.benchSvg.clientHeight || 1e9) / vbH) : 4;
    const colPx = Math.min(5, 10 / scale);
    for (let c = 0; c < columns; c++) {
      const x = rc.holes[c * 8].x;
      if (columns <= 16 || c === 0 || (c + 1) % 4 === 0) out.push(`<text class="collbl" x="${x}" y="-2" text-anchor="middle" font-size="${colPx.toFixed(2)}">${c + 1}</text>`);
    }
    for (const h of rc.holes) {
      const punched = card[h.hook];
      out.push(
        `<circle class="hole${punched ? " punched" : ""}${follow === h.hook ? " follow" : ""}" data-card="${selected}" data-hook="${h.hook}" cx="${h.x.toFixed(2)}" cy="${h.y.toFixed(2)}" r="${(rc.holeDiameter / 2 + 0.4).toFixed(2)}"><title>Hook ${h.hook + 1}: column ${h.column + 1}, row ${h.row + 1}</title></circle>`,
      );
    }
    this.benchSvg.innerHTML = out.join("");
    this.benchSvg.setAttribute("aria-label", `Card ${selected + 1} on the bench, as the real card`);
    this.benchLabel.textContent = `Card ${selected + 1} as the real card: ${columns} column${columns === 1 ? "" : "s"} (one per cross-row of the head) × 8 rows (one per needle tier), peg holes at the ends. Hook h has its hole in column ⌈h/8⌉, row ((h−1) mod 8) + 1.`;
  }
}
