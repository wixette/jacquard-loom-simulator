// The link format (design/links.md, F-7): every example decodes as documented, every link
// type round-trips, decks are written short, and broken or foreign links are refused with a
// reason. The format is a public contract from release 0.1.0: change these tests only by
// adding to them.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { say } from "../../js/l10n/l10n.js";
import { presetDeck } from "../../js/sim/deck.js";
import { decodeDeck, decodeLink, DEFAULT_LINK, encodeDeck, encodeLink, LONG_LINK, MAX_CARDS, packCards } from "../../js/sim/link.js";
/** @import { AppLink } from "../../js/sim/link.js" */

/** @param {string} bits @returns {boolean[]} */
const card = (bits) => [...bits].map((b) => b === "1");

/**
 * The link read, or the test fails with its reason.
 * @param {string} fragment
 * @returns {Promise<AppLink>}
 */
async function read(fragment) {
  const r = await decodeLink(fragment);
  assert.ok(r.ok, r.ok ? "" : say(r.reason, "en"));
  return r.link;
}

/** A random generator, seeded, so a failure can be repeated. @param {number} seed */
function random(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

describe("the examples of design/links.md", () => {
  it("#v=2: Weave, as the app opens", async () => {
    assert.deepEqual(await read("#v=2"), DEFAULT_LINK);
  });

  it("a 16-hook loom with two cards, at the shuttle of pick 4, following hook 5", async () => {
    const l = await read("#v=2&w=weave&h=16&c=x.a5a5-5a5a&p=3&s=2&f=5");
    assert.equal(l.workspace, "weave");
    assert.deepEqual(l.deck, { hooks: 16, cards: [card("1010010110100101"), card("0101101001011010")], loop: true });
    assert.deepEqual(l.tie, { kind: "straight", repeats: 1 });
    assert.equal(l.pick, 3);
    assert.equal(l.stop, 2);
    assert.deepEqual(l.follow, { hook: 4, end: null, pick: null });
    assert.equal(l.crossRow, null);
  });

  it("the arrow on one cross-row, an open chain, the section beside the loom in 3D", async () => {
    const l = await read("#v=2&h=8&c=x.18-18-18-18-99-5a-3c-18&l=0&view=section,3d");
    assert.deepEqual(l.deck, presetDeck("arrow", 8));
    assert.deepEqual(l.views, ["section", "3d"]);
  });

  it("a step of the tutorial, by its name", async () => {
    const l = await read("#v=2&w=learn&step=weave-twill");
    assert.equal(l.workspace, "learn");
    assert.equal(l.step, "weave-twill");
    assert.equal(l.deck, null);
  });

  it("a link of the prototype's format is refused, and says so", async () => {
    const r = await decodeLink("#v=1&h=8&d=ff");
    assert.ok(!r.ok);
    assert.match(say(r.reason, "en"), /prototype/);
  });

  it("the packed deck of the encodings' table", async () => {
    const r = await decodeDeck("b.paVaWg", 16);
    assert.ok(r.ok);
    assert.deepEqual(r.cards, [card("1010010110100101"), card("0101101001011010")]);
  });
});

describe("every link round-trips", () => {
  it("Weave links, random, with every field", async () => {
    const rand = random(7);
    const ties = /** @type {AppLink["tie"][]} */ ([{ kind: "straight", repeats: 1 }, { kind: "straight", repeats: 3 }, { kind: "point" }]);
    for (let i = 0; i < 200; i++) {
      const hooks = 8 * (1 + Math.floor(rand() * 8));
      const n = Math.floor(rand() * 40);
      const cards = [...Array(n)].map(() => [...Array(hooks)].map(() => rand() < 0.5));
      const tie = ties[i % 3];
      const hook = Math.floor(rand() * hooks);
      /** @type {AppLink} */
      const l = {
        ...DEFAULT_LINK,
        lang: rand() < 0.3 ? "fr" : null,
        deck: { hooks, cards, loop: rand() < 0.5 },
        tie,
        pick: Math.floor(rand() * 50),
        stop: Math.floor(rand() * 6),
        follow: rand() < 0.5 ? null : { hook, end: null, pick: null },
        crossRow: rand() < 0.5 ? null : Math.floor(rand() * (hooks / 8)),
        warp: "#123abc",
        face: rand() < 0.5 ? "front" : "back",
        bits: rand() < 0.5,
        sectionView: rand() < 0.5 ? "whole" : "crooks",
        views: rand() < 0.5 ? ["section"] : ["section", "front", "side", "3d"],
      };
      const back = await read(await encodeLink(l));
      // a cross-row equal to the followed hook's (or the first) is not written: it reads as null
      const own = l.follow ? Math.floor(l.follow.hook / 8) : 0;
      assert.deepEqual(back, { ...l, crossRow: l.crossRow === own ? null : l.crossRow }, `link ${i + 1}`);
    }
  });

  it("a cell of the cloth followed: its hook, end and pick", async () => {
    const l = { ...DEFAULT_LINK, deck: presetDeck("twill", 16), tie: /** @type {AppLink["tie"]} */ ({ kind: "straight", repeats: 2 }), follow: { hook: 2, end: 19, pick: 5 } };
    assert.deepEqual(await read(await encodeLink(l)), l);
  });

  it("a Learn link", async () => {
    const l = { ...DEFAULT_LINK, workspace: /** @type {const} */ ("learn"), step: "story-draw-boy" };
    assert.deepEqual(await read(await encodeLink(l)), l);
  });

  it("only what differs from the defaults is written", async () => {
    assert.equal(await encodeLink(DEFAULT_LINK), "v=2");
    assert.equal(await encodeLink({ deck: presetDeck("plain", 8) }), "v=2&h=8&c=x.aa-55");
  });
});

describe("decks are short", () => {
  it("every encoding reads the same deck", async () => {
    const deck = presetDeck("satin", 64);
    const bytes = packCards(deck.cards, 64);
    const b = `b.${Buffer.from(bytes).toString("base64url")}`;
    const x = `x.${deck.cards.map((c) => Buffer.from(packCards([c], 64)).toString("hex")).join("-")}`;
    const z = await encodeDeck(deck.cards, 64);
    assert.ok(z.startsWith("z."), "a repeating deck is compressed");
    for (const text of [x, b, z]) assert.deepEqual(await decodeDeck(text, 64), { ok: true, cards: deck.cards }, text.slice(0, 2));
  });

  it(`any deck of up to 64 cards on 64 hooks makes a link under ${LONG_LINK} characters`, async () => {
    const rand = random(11);
    const cards = [...Array(64)].map(() => [...Array(64)].map(() => rand() < 0.5));
    const link = await encodeLink({ deck: { hooks: 64, cards, loop: true }, follow: { hook: 63, end: 64, pick: 63 }, views: ["section", "front", "side", "3d"] });
    assert.ok(link.length + 60 < LONG_LINK, `${link.length} characters`);
  });

  it("a 64-card satin on 64 hooks takes under 50 characters", async () => {
    assert.ok((await encodeDeck(presetDeck("satin", 64).cards.concat(...Array(7).fill(presetDeck("satin", 64).cards)), 64)).length < 50);
  });
});

describe("broken and foreign links are refused with a reason", () => {
  const broken = [
    "",
    "#v=3",
    "#v=2&h=12&c=x.ff",
    "#v=2&h=8",
    "#v=2&h=8&c=x.zz",
    "#v=2&h=8&c=x.fff",
    "#v=2&h=8&c=q.ff",
    "#v=2&h=8&c=b.@@",
    "#v=2&h=8&c=z.AAAA",
    "#v=2&h=8&c=x.ff&t=q",
    "#v=2&h=8&c=x.ff&wc=red",
    "#v=2&h=8&c=x.ff&p=-1",
    "#v=2&h=8&c=x.ff&s=6",
    "#v=2&h=8&c=x.ff&x=2",
    "#v=2&h=8&c=x.ff&f=9",
    "#v=2&h=8&c=x.ff&fe=3",
    "#v=2&h=8&c=x.ff&f=1&fe=2",
    "#v=2&h=8&c=x.ff&face=side",
    "#v=2&h=8&c=x.ff&l=2",
    "#v=2&sv=far",
    "#v=2&step=Not%20a%20name",
  ];
  for (const b of broken) {
    it(JSON.stringify(b), async () => {
      const r = await decodeLink(b);
      assert.ok(!r.ok, "accepted");
      assert.match(say(r.reason, "en"), /^This link cannot be read: .+\.$/);
    });
  }

  it("a chain longer than the longest is refused", async () => {
    const r = await decodeDeck(`x.${Array(MAX_CARDS + 1).fill("ff").join("-")}`, 8);
    assert.ok(!r.ok);
  });

  it("a compressed deck that would grow past the longest chain is refused, not unpacked", async () => {
    const bomb = new Uint8Array(MAX_CARDS * 8 + 1000);
    const stream = new Blob([bomb]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const z = Buffer.from(await new Response(stream).arrayBuffer()).toString("base64url");
    assert.ok(!(await decodeDeck(`z.${z}`, 8)).ok);
  });
});

describe("a later release's link opens as well as it can", () => {
  it("unknown fields are ignored", async () => {
    assert.deepEqual(await read("#v=2&zz=1&next=thing"), DEFAULT_LINK);
  });

  it("an unknown workspace, language or view falls back to the default", async () => {
    const l = await read("#v=2&w=garden&lang=nl&view=section,microscope");
    assert.equal(l.workspace, "weave");
    assert.equal(l.lang, null);
    assert.deepEqual(l.views, ["section"]);
  });
});
