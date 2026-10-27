// The names of the 3D parts in the page's language. The models carry each part's name in
// English (userData.label_en, from blender/scripts); the page names it by a message key made from
// the part's node name: the parts' numbers dropped (the eight needles share one name, with the
// needle's number), and the sides of a part shown twice (the batten's two swords, the warp end
// on both sides of the reed). tests/scene/partNames.test.js checks every named node of the
// models against its key's English.

/** The last parts of a node's name that only say which side it is on. */
const SIDES = new Set(["left", "right", "back", "front"]);

/**
 * The message naming a part, from its node's name: `needles.needle.3` is
 * `{ key: "p3d.needles.needle", params: { n: 4 } }`, `harness.mail.0.2` is
 * `{ key: "p3d.harness.mail", params: { repeat: 2 } }`.
 * @param {string} node
 * @returns {{ key: string; params: Record<string, number> }}
 */
export function partName(node) {
  const parts = node.split(".");
  const numbers = parts.filter((p) => /^\d+$/.test(p)).map(Number);
  let words = parts.filter((p) => !/^\d+$/.test(p));
  // a side is dropped where the part's other side has the same name (not "upper"/"lower")
  if (words.length > 2 && SIDES.has(words[words.length - 1])) words = words.slice(0, -1);
  /** @type {Record<string, number>} */
  const params = {};
  if (numbers.length > 0) params.n = numbers[0] + 1;
  if (numbers.length > 1) params.repeat = numbers[1];
  return { key: `p3d.${words.join(".")}`, params };
}
