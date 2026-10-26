// The chain of cards as a list the student punches. Each card is drawn turned on its
// side: hole 1 at the left is the one the top needle reads, which lifts hook 1. A click
// on a hole punches it, or fills it again.

/** @import { Snapshot } from "../sim/loom.js" */

/**
 * @typedef {object} CardEditorEvents
 * @property {(card: number, hole: number) => void} onToggle
 * @property {(card: number) => void} onSelect
 */

export class CardEditor {
  /**
   * @param {HTMLElement} host
   * @param {CardEditorEvents} events
   */
  constructor(host, events) {
    this.host = host;
    host.classList.add("cards");
    host.addEventListener("click", (e) => {
      const t = /** @type {HTMLElement} */ (e.target).closest("[data-card]");
      if (!(t instanceof HTMLElement)) return;
      const card = Number(t.dataset.card);
      if (t.dataset.hole !== undefined) events.onToggle(card, Number(t.dataset.hole));
      else events.onSelect(card);
    });
  }

  /**
   * @param {Snapshot} snap
   * @param {number} selected the selected card's index, or -1
   * @param {number | null} follow the followed hook, or null
   */
  render(snap, selected, follow) {
    const { deck } = snap;
    const atRest = snap.phi === 0;
    const rows = [];
    rows.push(
      `<div class="card-head"><span class="num"></span>${[...Array(deck.hooks).keys()]
        .map((h) => `<span class="hn${follow === h ? " follow" : ""}">${h + 1}</span>`)
        .join("")}<span class="tag"></span></div>`,
    );
    deck.cards.forEach((card, i) => {
      const tags = [];
      if (i === snap.cardIndex) tags.push(atRest ? "on needles" : "weaving");
      else if (i === snap.facingIndex) tags.push("on needles");
      else if (i === snap.nextIndex && atRest === false) tags.push("next");
      const cls = ["card-row", i === selected ? "selected" : "", i === snap.cardIndex ? "current" : "", i === snap.facingIndex ? "facing" : ""].filter(Boolean).join(" ");
      const holes = card
        .map(
          (p, h) =>
            `<button type="button" class="hole${p ? " punched" : ""}${follow === h ? " follow" : ""}" data-card="${i}" data-hole="${h}" aria-label="Card ${i + 1}, hole ${h + 1}: ${p ? "punched" : "blank"}" aria-pressed="${p}"></button>`,
        )
        .join("");
      rows.push(`<div class="${cls}" data-card="${i}"><span class="num">${i + 1}</span>${holes}<span class="tag">${tags.join(", ")}</span></div>`);
    });
    if (deck.cards.length === 0) rows.push(`<p class="empty">No cards. Add one to start.</p>`);
    else rows.push(`<p class="chain-end">${deck.loop ? `↺ laced back to card 1 (a closed loop)` : "▪ end of the chain (open)"}</p>`);
    this.host.innerHTML = rows.join("");
  }
}
