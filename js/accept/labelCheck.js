// A check of the labels as the browser shows them (the visual layer, which Node cannot
// see): every label in the page's drawings is a readable size on screen, inside its drawing,
// not covered by anything else on the page, and clear of every other label. Used by the
// developer pages' ?selftest, in each view they offer.

import { result } from "./harness.js";
/** @import { CheckResult } from "./harness.js" */

/** A label's box on screen is this tall at least and at most (px): about 8 to 15 px type. */
const MIN_PX = 9;
const MAX_PX = 19;

/**
 * Problems with the labels in the given drawings, as they are on screen now.
 * @param {SVGSVGElement[]} svgs
 * @returns {{ problems: string[], count: number }}
 */
export function labelProblems(svgs) {
  const problems = [];
  let count = 0;
  for (const svg of svgs) {
    const name = svg.getAttribute("class") ?? "svg";
    const sr = svg.getBoundingClientRect();
    if (sr.width === 0 || sr.height === 0) continue;
    const texts = [...svg.querySelectorAll("text")].filter((t) => t.textContent?.trim() && Number(t.getAttribute("opacity") ?? 1) >= 0.5);
    const boxes = texts.map((t) => {
      const spans = [...t.querySelectorAll("tspan")];
      return { t, text: spans.length ? spans.map((x) => x.textContent).join(" ") : (t.textContent ?? "").trim(), lines: Math.max(1, spans.length), r: t.getBoundingClientRect() };
    });
    for (const b of boxes) {
      count++;
      const where = `${name} "${b.text}"`;
      const line = b.r.height / b.lines;
      if (line < MIN_PX || line > MAX_PX) problems.push(`${where} is ${line.toFixed(1)} px tall a line`);
      if (b.r.left < sr.left - 0.5 || b.r.right > sr.right + 0.5 || b.r.top < sr.top - 0.5 || b.r.bottom > sr.bottom + 0.5) {
        problems.push(`${where} runs outside its drawing`);
        continue;
      }
      // Whatever is on top at the label's centre must belong to the same drawing.
      const top = document.elementFromPoint(b.r.left + b.r.width / 2, b.r.top + b.r.height / 2);
      if (top && !svg.contains(top)) problems.push(`${where} is covered by ${top.id ? `#${top.id}` : top.tagName.toLowerCase()}`);
      for (const o of boxes) {
        if (o === b || o.t.compareDocumentPosition(b.t) & Node.DOCUMENT_POSITION_PRECEDING) continue;
        const w = Math.min(b.r.right, o.r.right) - Math.max(b.r.left, o.r.left);
        const h = Math.min(b.r.bottom, o.r.bottom) - Math.max(b.r.top, o.r.top);
        if (w > 1 && h > 1) problems.push(`${where} overlaps "${o.text}"`);
      }
    }
  }
  return { problems, count };
}

/**
 * Name labels (class "lbl") that lie over a shape of their own drawing: points across each
 * label's box are sampled, and anything of the drawing found under one, other than text, is
 * a problem. (Card numbers sit on their cards by design and are not checked.)
 * @param {SVGSVGElement[]} svgs
 * @returns {{ problems: string[], count: number }}
 */
export function labelsOverDrawing(svgs) {
  const problems = [];
  let count = 0;
  for (const svg of svgs) {
    const name = svg.getAttribute("class") ?? "svg";
    for (const t of svg.querySelectorAll("text.lbl")) {
      const spans = [...t.querySelectorAll("tspan")];
      const text = spans.length ? spans.map((x) => x.textContent).join(" ") : (t.textContent ?? "").trim();
      if (!text) continue;
      count++;
      const r = t.getBoundingClientRect();
      const hits = new Set();
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          const x = r.left + r.width * (0.08 + (0.84 * i) / 5);
          const y = r.top + r.height * (0.25 + (0.5 * j) / 2);
          for (const e of document.elementsFromPoint(x, y)) {
            if (e === svg || !svg.contains(e) || e.closest("text")) continue;
            hits.add(e.getAttribute("class") ?? e.tagName.toLowerCase());
          }
        }
      }
      if (hits.size) problems.push(`${name} "${text}" lies over ${[...hits].join(", ")}`);
    }
  }
  return { problems, count };
}

/**
 * The checks, over each of the views the page can show: `views` switches the page to each in
 * turn (and back at the end) and names it.
 * @param {() => SVGSVGElement[]} svgs the drawings to look at
 * @param {{ name: string, show: () => void }[]} views
 * @returns {CheckResult[]}
 */
export function checkLabels(svgs, views) {
  const problems = [];
  const over = [];
  let count = 0;
  let named = 0;
  for (const v of views) {
    v.show();
    const r = labelProblems(svgs());
    count += r.count;
    for (const p of r.problems) problems.push(`${v.name}: ${p}`);
    const o = labelsOverDrawing(svgs());
    named += o.count;
    for (const p of o.problems) over.push(`${v.name}: ${p}`);
  }
  const at = `at ${window.innerWidth} × ${window.innerHeight} px`;
  return [
    result("V-1", "Every label is a readable size on screen, inside its drawing, uncovered, and clear of the others (in each view)", problems.length === 0, problems.slice(0, 4).join("; ") || `${count} labels over ${views.length} views ${at}`),
    result("V-2", "No name label lies over a line or shape of its drawing (in each view)", over.length === 0, over.slice(0, 4).join("; ") || `${named} name labels over ${views.length} views ${at}`),
  ];
}
