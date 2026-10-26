// The picture helper ("reading in"): a small picture becomes a chain of cards. On a real
// loom the designer painted the figure on point paper, one square per thread, and a reader
// (liseur) transferred it to the card-cutting machine, one card per row; this is that reader.
//
// A picture is rows of pixels, top row first, true = dark (the figure). Two ways to read it:
// - direct: each pixel is one warp end and one pick; a dark pixel is a hole, so its warp end
//   lies over the weft. Long runs of one colour make long floats (loose threads), which the
//   helper measures and marks;
// - damask: each pixel becomes a block of k x k threads; dark blocks are woven in warp-faced
//   8-end satin, light ones in weft-faced 8-end satin, so the cloth holds together and the
//   picture shows by which threads lie on top. This is how Jacquard pictures were woven.
//   With blocks of 2 to 6 threads no float is longer than 8; with 1, a pixel that falls on a
//   satin point can join its neighbours' floats (design/m2-notes.md).
// The first card is cut from the bottom row of the picture (Bradbury), so the cloth, which
// grows upward from its first pick, shows the picture the right way up.

/**
 * @typedef {boolean[][]} Picture rows of pixels, top row first; true = dark
 * @typedef {{ cards: boolean[][], width: number, height: number }} Reading the cards, first card first, and the woven size in threads
 * @typedef {{ ok: true, reading: Reading } | { ok: false, reason: string }} ReadResult
 */

/** The satin's repeat and step: 8 ends, moving 3 each pick (3 and 8 share no factor). */
export const SATIN = { ends: 8, step: 3 };

/** A float longer than this many threads is marked as loose. */
export const FLOAT_LIMIT = 8;

/**
 * A picture from strings, top row first: "#", "X", "1" or "O" dark, anything else light.
 * @param {string[]} rows
 * @returns {Picture}
 */
export const pictureFromStrings = (rows) => rows.map((r) => [...r].map((c) => c === "#" || c === "X" || c === "1" || c === "O"));

/**
 * Whether end e at pick p is a satin point (both 0-based).
 * @param {number} e
 * @param {number} p
 */
export const satinPoint = (e, p) => (((e - SATIN.step * p) % SATIN.ends) + SATIN.ends) % SATIN.ends === 0;

/**
 * Reads a picture directly: one pixel per thread.
 * @param {Picture} picture
 * @param {{ hooks: number, invert?: boolean, picksPerRow?: number, repeat?: boolean }} o
 *   repeat: tile the picture across the hooks instead of leaving the rest blank
 * @returns {ReadResult}
 */
export function readDirect(picture, o) {
  const h = picture.length;
  const w = h ? picture[0].length : 0;
  if (h === 0 || w === 0) return { ok: false, reason: "The picture is empty." };
  if (w > o.hooks) return { ok: false, reason: `The picture is ${w} pixels wide; this head has ${o.hooks} hooks. Use a bigger head or a narrower picture.` };
  const per = o.picksPerRow ?? 1;
  /** @type {boolean[][]} */
  const cards = [];
  for (let r = h - 1; r >= 0; r--) {
    const row = [];
    for (let x = 0; x < o.hooks; x++) {
      const inside = x < w || o.repeat;
      const px = inside ? picture[r][x % w] : false;
      row.push(o.invert ? !px : px);
    }
    for (let i = 0; i < per; i++) cards.push([...row]);
  }
  return { ok: true, reading: { cards, width: o.repeat ? o.hooks : w, height: h * per } };
}

/**
 * Reads a picture as damask: each pixel a block of k x k threads, dark blocks in warp-faced
 * satin, light blocks in weft-faced satin.
 * @param {Picture} picture
 * @param {{ hooks: number, k: number, invert?: boolean }} o
 * @returns {ReadResult}
 */
export function readDamask(picture, o) {
  const h = picture.length;
  const w = h ? picture[0].length : 0;
  if (h === 0 || w === 0) return { ok: false, reason: "The picture is empty." };
  const width = w * o.k;
  if (width > o.hooks) return { ok: false, reason: `In damask each pixel is ${o.k} × ${o.k} threads, so this picture needs ${width} hooks; the head has ${o.hooks}. Use a bigger head, smaller blocks or a narrower picture.` };
  /** @type {boolean[][]} */
  const cards = [];
  const height = h * o.k;
  for (let p = 0; p < height; p++) {
    const r = h - 1 - Math.floor(p / o.k); // pick p comes from this picture row
    const row = [];
    for (let e = 0; e < o.hooks; e++) {
      const x = Math.floor(e / o.k);
      const dark = x < w ? picture[r][x] !== Boolean(o.invert) : false;
      const point = satinPoint(e, p);
      row.push(dark ? !point : point);
    }
    cards.push(row);
  }
  return { ok: true, reading: { cards, width, height } };
}

/**
 * @typedef {object} Float a thread lying loose over more than the limit
 * @property {"weft" | "warp"} kind a weft float lies over warp ends along a pick; a warp float over picks along an end
 * @property {number} pick 0-based, where it starts
 * @property {number} end 0-based, where it starts
 * @property {number} length in threads
 */

/**
 * The floats of a woven cloth (rows of picks, true = warp over weft) longer than `limit`,
 * and the longest of each kind. A run of false along a pick is the weft floating over that
 * many ends; a run of true along an end is that warp end floating over that many picks.
 * @param {boolean[][]} cloth
 * @param {number} [limit]
 * @returns {{ floats: Float[], longestWeft: number, longestWarp: number }}
 */
export function findFloats(cloth, limit = FLOAT_LIMIT) {
  /** @type {Float[]} */
  const floats = [];
  let longestWeft = 0;
  let longestWarp = 0;
  const ends = cloth[0]?.length ?? 0;
  cloth.forEach((row, p) => {
    let run = 0;
    for (let e = 0; e <= ends; e++) {
      if (e < ends && !row[e]) run++;
      else {
        if (run > longestWeft) longestWeft = run;
        if (run > limit) floats.push({ kind: "weft", pick: p, end: e - run, length: run });
        run = 0;
      }
    }
  });
  for (let e = 0; e < ends; e++) {
    let run = 0;
    for (let p = 0; p <= cloth.length; p++) {
      if (p < cloth.length && cloth[p][e]) run++;
      else {
        if (run > longestWarp) longestWarp = run;
        if (run > limit) floats.push({ kind: "warp", pick: p - run, end: e, length: run });
        run = 0;
      }
    }
  }
  return { floats, longestWeft, longestWarp };
}

/**
 * A picture from an image's pixels (RGBA bytes, as a canvas gives them), reduced to w x h
 * by averaging each block of the image, then thresholded: darker than `threshold` (0-255)
 * is dark. Transparent pixels count as white.
 * @param {Uint8ClampedArray | number[]} data
 * @param {number} iw the image's width
 * @param {number} ih its height
 * @param {number} w the picture's width
 * @param {number} h its height
 * @param {number} [threshold]
 * @returns {Picture}
 */
export function pictureFromPixels(data, iw, ih, w, h, threshold = 128) {
  /** @type {Picture} */
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    const y0 = Math.floor((y * ih) / h);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * ih) / h));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * iw) / w);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * iw) / w));
      let sum = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * iw + xx) * 4;
          const a = data[i + 3] / 255;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += lum * a + 255 * (1 - a);
          n++;
        }
      }
      row.push(sum / n < threshold);
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Ready-made pictures, top row first ("#" dark).
 * @type {Record<string, { label: string, rows: string[] }>}
 */
export const PICTURES = {
  arrow: {
    label: "Arrow (8 × 8)",
    rows: ["...##...", "..####..", ".#.##.#.", "#..##..#", "...##...", "...##...", "...##...", "...##..."],
  },
  heart: {
    label: "Heart (16 × 16)",
    rows: [
      "................",
      "................",
      "...###....###...",
      "..#####..#####..",
      ".##############.",
      ".##############.",
      ".##############.",
      "..############..",
      "...##########...",
      "....########....",
      ".....######.....",
      "......####......",
      ".......##.......",
      "................",
      "................",
      "................",
    ],
  },
  letter: {
    label: "Letter J (16 × 16)",
    rows: [
      "................",
      "....########....",
      "....########....",
      ".......##.......",
      ".......##.......",
      ".......##.......",
      ".......##.......",
      ".......##.......",
      ".......##.......",
      ".......##.......",
      ".##....##.......",
      ".##....##.......",
      "..##..##........",
      "...####.........",
      "................",
      "................",
    ],
  },
  face: {
    label: "A tiny portrait (16 × 16)",
    rows: [
      ".....######.....",
      "...##########...",
      "..############..",
      "..##........##..",
      ".##..........##.",
      ".#...##..##...#.",
      ".#...##..##...#.",
      ".#............#.",
      ".#......#.....#.",
      ".#.....##.....#.",
      "..#..........#..",
      "..#..######..#..",
      "...#........#...",
      "....##....##....",
      "......####......",
      "................",
    ],
  },
};
