// The deck as cards to print at true size (lesson L10): each card is drawn in millimetres as
// the real card (js/view2d/cardLayout.js), with its peg and lacing holes, every punched hole
// filled black to cut out and every blank as a faint ring, numbered in chain order. Pages are
// A4, four cards to a page; printed at 100 % a card measures its true 58.7 mm across.

import { realCard } from "../view2d/cardLayout.js";
/** @import { Deck } from "../sim/deck.js" */

/** Page size and margins, mm (A4, portrait). */
const PAGE = { w: 210, h: 297, margin: 12 };
/** Room between cards, and for each card's number, mm. */
const GAP = 8;
const LABEL = 14;

/**
 * One page of cards as SVG, in millimetres.
 * @param {Deck} deck
 * @param {number} first the chain index of the page's first card
 * @param {number} count how many cards on the page
 * @returns {string}
 */
export function pageSvg(deck, first, count) {
  const rc = realCard(deck.hooks);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}mm" height="${PAGE.h}mm" viewBox="0 0 ${PAGE.w} ${PAGE.h}">`);
  for (let k = 0; k < count; k++) {
    const i = first + k;
    const card = deck.cards[i];
    const x0 = PAGE.margin + LABEL;
    const y0 = PAGE.margin + k * (rc.height + GAP);
    out.push(`<g class="card" data-card="${i}" transform="translate(${x0} ${y0})">`);
    out.push(`<rect class="outline" x="0" y="0" width="${rc.width.toFixed(2)}" height="${rc.height.toFixed(2)}" rx="1.5" fill="none" stroke="#000" stroke-width="0.25"/>`);
    out.push(`<text x="${-LABEL / 2}" y="${(rc.height / 2 + 1.5).toFixed(2)}" font-size="4" text-anchor="middle" font-family="sans-serif">${i + 1}</text>`);
    for (const p of rc.pegs) out.push(`<circle class="peg" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${(rc.pegDiameter / 2).toFixed(2)}" fill="none" stroke="#000" stroke-width="0.25"/>`);
    for (const l of rc.laces) out.push(`<circle class="lace" cx="${l.x.toFixed(2)}" cy="${l.y.toFixed(2)}" r="1.2" fill="none" stroke="#000" stroke-width="0.2"/>`);
    for (const h of rc.holes) {
      const punched = card[h.hook];
      out.push(
        punched
          ? `<circle class="hole punched" data-hook="${h.hook}" cx="${h.x.toFixed(2)}" cy="${h.y.toFixed(2)}" r="${(rc.holeDiameter / 2).toFixed(2)}" fill="#000"/>`
          : `<circle class="hole blank" data-hook="${h.hook}" cx="${h.x.toFixed(2)}" cy="${h.y.toFixed(2)}" r="${(rc.holeDiameter / 2).toFixed(2)}" fill="none" stroke="#bbb" stroke-width="0.15"/>`,
      );
    }
    out.push(`</g>`);
  }
  out.push(`</svg>`);
  return out.join("");
}

/** Whether a card for this head fits across an A4 page at its true size (a 400 head's does not). */
export const fitsPage = (/** @type {number} */ hooks) => realCard(hooks).width <= PAGE.w - 2 * PAGE.margin - LABEL;

/** How many cards fit on one page. */
export const cardsPerPage = (/** @type {number} */ hooks) => Math.floor((PAGE.h - 2 * PAGE.margin + GAP) / (realCard(hooks).height + GAP));

/**
 * A printable HTML document of the whole deck, its note (how to print and cut them) in the
 * page's language.
 * @param {Deck} deck
 * @param {string} title
 * @param {{ note?: string; lang?: string }} [o] the note, and its language (English by default)
 * @returns {string}
 */
export function printDocument(deck, title, o = {}) {
  const per = cardsPerPage(deck.hooks);
  const pages = [];
  for (let first = 0; first < deck.cards.length; first += per) pages.push(pageSvg(deck, first, Math.min(per, deck.cards.length - first)));
  const rc = realCard(deck.hooks);
  const note = o.note ?? `${deck.cards.length} cards for a ${deck.hooks}-hook head, ${rc.width.toFixed(1)} × ${rc.height.toFixed(1)} mm each. Print at 100 % (not "fit to page"); check one card with a ruler. Cut out the black holes, then lace the cards in order through the small holes at their ends.`;
  const esc = (/** @type {string} */ s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="${o.lang ?? "en"}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page { size: A4; margin: 0; } body { margin: 0; font-family: sans-serif; } .page { width: 210mm; height: 297mm; page-break-after: always; } .note { position: fixed; top: 4mm; left: 12mm; font-size: 3.2mm; } @media print { .note { display: none; } }</style></head><body>
<p class="note">${esc(note)}</p>
${pages.map((p) => `<div class="page">${p}</div>`).join("\n")}
</body></html>`;
}
