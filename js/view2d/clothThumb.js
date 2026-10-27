// A cloth drawn small (a challenge's target, a guessing game's choices, a figure to weave): each
// thread a square in the warp's colour where it lies over the weft, else the weft's, the first
// pick at the bottom, sized to fit a width.

/**
 * @param {boolean[][]} cloth first pick first; true = warp over weft
 * @param {{ warp: string; weft: string; width: number; label: string; cls?: string }} o
 * @returns {HTMLCanvasElement}
 */
export function clothThumb(cloth, o) {
  const ends = cloth[0]?.length ?? 8;
  const px = Math.max(3, Math.min(14, Math.floor(o.width / ends)));
  const canvas = document.createElement("canvas");
  canvas.className = o.cls ?? "cloth-thumb";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", o.label);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(ends * px * dpr);
  canvas.height = Math.round(cloth.length * px * dpr);
  canvas.style.width = `${ends * px}px`;
  canvas.style.height = `${cloth.length * px}px`;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
  g.scale(dpr, dpr);
  const gap = px > 5 ? 1 : 0;
  cloth.forEach((row, p) =>
    row.forEach((up, e) => {
      g.fillStyle = up ? o.warp : o.weft;
      g.fillRect(e * px, (cloth.length - 1 - p) * px, px - gap, px - gap);
    }),
  );
  return canvas;
}
