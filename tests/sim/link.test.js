// The link format (design/links.md, F-7): every example decodes as documented, every link
// type round-trips, decks are written short, and broken or foreign links are refused with a
// reason. The format is a public contract from release 0.1.0: change these tests only by
// adding to them.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { say } from "../../js/l10n/l10n.js";
import { presetDeck } from "../../js/sim/deck.js";
import { decodeDeck, decodeLink, DEFAULT_LINK, encodeDeck, encodeLink, LONG_LINK, MAX_CARDS, packCards, STAGE_VIEWS } from "../../js/sim/link.js";
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

  it("a picture for Create, read as damask (0.2.0)", async () => {
    const l = await read("#v=2&w=create&pw=8&pic=x.18-3c-5a-99-18-18-18-18&rd=damask&k=3");
    assert.equal(l.workspace, "create");
    assert.equal(l.picture?.rows.length, 8);
    assert.deepEqual(l.picture?.rows[0].map(Number), [0, 0, 0, 1, 1, 0, 0, 0]);
    assert.equal(l.picture?.mode, "damask");
    assert.equal(l.picture?.k, 3);
  });

  it("the name game, the guessing game's puzzle, a byte game's secret (0.2.0)", async () => {
    const name = await read("#v=2&w=play&game=name&text=Ada&mode=direct");
    assert.deepEqual(name.game, { name: "name", text: "Ada", mode: "direct", seed: 1 });
    const guess = await read("#v=2&w=play&game=guess&seed=7");
    assert.equal(guess.game?.name, "guess");
    assert.equal(guess.game?.seed, 7);
    const secret = await read("#v=2&w=play&game=byte&h=8&c=x.48-69");
    assert.equal(secret.game?.name, "byte");
    assert.equal(secret.game?.text, "");
    assert.deepEqual(secret.deck?.cards.map((c) => c.reduce((n, x) => (n << 1) | Number(x), 0)), [0x48, 0x69]);
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

// ---- the contract, field by field (added 2026-10-27, when design/links.md was agreed) ----------
// Every value each table of design/links.md allows is read as it says, the values just outside
// are refused, and the writer's rules hold. These pin the format for 0.1.0 and after.

/**
 * The fields a fragment reads as, beside the defaults: a loom of one 8-hook card unless the
 * fragment gives its own.
 * @param {string} rest
 */
const loomLink = (rest) => read(`#v=2&h=8&c=x.ff${rest}`);

/** @param {string} fragment */
async function refused(fragment) {
  const r = await decodeLink(fragment);
  assert.ok(!r.ok, `${fragment} was accepted`);
}

describe("the envelope (design/links.md, The envelope)", () => {
  it("a fragment reads the same with or without its #, and in any order", async () => {
    const a = await read("#v=2&h=16&c=x.a5a5&p=3&f=5");
    assert.deepEqual(await read("v=2&h=16&c=x.a5a5&p=3&f=5"), a);
    assert.deepEqual(await read("#f=5&p=3&c=x.a5a5&h=16&v=2"), a);
  });
  it("v is required, and only 2 is read", async () => {
    for (const f of ["#h=8&c=x.ff", "#v=0", "#v=02", "#v=2.0", "#v=1"]) await refused(f);
  });
  it("w: every workspace is read", async () => {
    for (const w of ["weave", "learn", "create", "play"]) assert.equal((await read(`#v=2&w=${w}`)).workspace, w);
  });
  it("lang: every locale is read, others fall back to the reader's", async () => {
    for (const lang of ["en", "es", "fr", "de", "it", "pt-BR", "zh", "zh-TW", "ja", "ko"]) assert.equal((await read(`#v=2&lang=${lang}`)).lang, lang);
    for (const lang of ["EN", "pt", "zh-CN", ""]) assert.equal((await read(`#v=2&lang=${lang}`)).lang, null, lang);
  });
});

describe("Weave: a loom, field by field (design/links.md, Weave)", () => {
  it("h: every head from 8 to 64 hooks, and no other", async () => {
    for (let h = 8; h <= 64; h += 8) assert.equal((await read(`#v=2&h=${h}&c=x.${"0".repeat(h / 4)}`)).deck?.hooks, h);
    for (const h of ["0", "4", "7", "12", "72", "080", "-8", "8.0"]) await refused(`#v=2&h=${h}&c=x.ff`);
  });
  it("c, x.: h/4 hex digits a card, hook 1 the highest bit, either case; an empty chain", async () => {
    assert.deepEqual((await loomLink("")).deck?.cards, [card("11111111")]);
    assert.deepEqual((await read("#v=2&h=8&c=x.80-01-A5")).deck?.cards, [card("10000000"), card("00000001"), card("10100101")]);
    assert.deepEqual((await read("#v=2&h=8&c=x.")).deck?.cards, []);
    for (const c of ["x.8", "x.800", "x.80--01", "x.80-", "x.g0"]) await refused(`#v=2&h=8&c=${c}`);
  });
  it("c, b.: h/8 bytes a card, hook 1 the highest bit of the first byte, base64url without padding", async () => {
    // 64 hooks: hook 1 alone, then hook 64 alone
    const bytes = new Uint8Array(16);
    bytes[0] = 0x80;
    bytes[15] = 0x01;
    const r = await decodeDeck(`b.${Buffer.from(bytes).toString("base64url")}`, 64);
    assert.ok(r.ok);
    assert.deepEqual(r.cards, [[true, ...Array(63).fill(false)], [...Array(63).fill(false), true]]);
    // a length that is not a whole number of cards, padding, and the standard alphabet's + / are refused
    for (const b of ["b.gA", "b.gIA=", "b.+/8"]) assert.ok(!(await decodeDeck(b, 16)).ok, b);
  });
  it("c, z.: the packed bytes, raw DEFLATE, base64url; a chain of 1,024 cards is the longest", async () => {
    const most = await decodeDeck(`x.${Array(MAX_CARDS).fill("a5").join("-")}`, 8);
    assert.ok(most.ok && most.cards.length === MAX_CARDS);
    const packed = new Uint8Array(MAX_CARDS).fill(0xa5);
    const stream = new Blob([packed]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const z = Buffer.from(await new Response(stream).arrayBuffer()).toString("base64url");
    const r = await decodeDeck(`z.${z}`, 8);
    assert.ok(r.ok && r.cards.length === MAX_CARDS && r.cards.every((x) => x.join() === card("10100101").join()));
  });
  it("l: 1 (or none) a loop, 0 an open chain", async () => {
    assert.equal((await loomLink("")).deck?.loop, true);
    assert.equal((await loomLink("&l=1")).deck?.loop, true);
    assert.equal((await loomLink("&l=0")).deck?.loop, false);
    for (const l of ["", "yes", "00"]) await refused(`#v=2&h=8&c=x.ff&l=${l}`);
  });
  it("t: straight 1 to 4 times, or point; nothing else", async () => {
    for (const n of [1, 2, 3, 4]) assert.deepEqual((await loomLink(`&t=s${n}`)).tie, { kind: "straight", repeats: n });
    assert.deepEqual((await loomLink("&t=p")).tie, { kind: "point" });
    for (const t of ["s0", "s5", "S1", "point", ""]) await refused(`#v=2&h=8&c=x.ff&t=${t}`);
  });
  it("p: 0 to 1,000,000, written as plain digits", async () => {
    assert.equal((await loomLink("&p=0")).pick, 0);
    assert.equal((await loomLink("&p=1000000")).pick, 1_000_000);
    for (const p of ["1000001", "1.5", "+3", "1e3", "", "%203"]) await refused(`#v=2&h=8&c=x.ff&p=${p}`);
  });
  it("s: the six moments, 0 to 5", async () => {
    for (let s = 0; s <= 5; s++) assert.equal((await loomLink(`&s=${s}`)).stop, s);
    for (const s of ["6", "-1", ""]) await refused(`#v=2&h=8&c=x.ff&s=${s}`);
  });
  it("wc, fc: 6 hex digits, either case, read in lower case", async () => {
    const l = await read("#v=2&wc=ABCDEF&fc=012345");
    assert.equal(l.warp, "#abcdef");
    assert.equal(l.weft, "#012345");
    for (const c of ["fff", "#abcdef", "abcdeg", "abcdef0"]) await refused(`#v=2&wc=${encodeURIComponent(c)}`);
    await refused("#v=2&fc=red");
  });
  it("f: 1 to h; fe: 1 to the ends, the end of f's hook; fp: with fe", async () => {
    assert.deepEqual((await read("#v=2&h=16&c=x.ffff&f=16")).follow, { hook: 15, end: null, pick: null });
    for (const f of ["0", "17"]) await refused(`#v=2&h=16&c=x.ffff&f=${f}`);
    // straight × 2 on 8 hooks: 16 ends, end 9 on hook 1, end 16 on hook 8
    assert.deepEqual((await read("#v=2&h=8&c=x.ff&t=s2&f=1&fe=9&fp=4")).follow, { hook: 0, end: 9, pick: 3 });
    assert.deepEqual((await read("#v=2&h=8&c=x.ff&t=s2&f=8&fe=16")).follow, { hook: 7, end: 16, pick: null });
    await refused("#v=2&h=8&c=x.ff&t=s2&f=8&fe=17");
    await refused("#v=2&h=8&c=x.ff&t=s2&f=2&fe=9");
    await refused("#v=2&h=8&c=x.ff&f=1&fp=2");
    await refused("#v=2&h=8&c=x.ff&f=1&fe=1&fp=0");
  });
  it("x: 1 to h/8; with none, the followed hook's cross-row, or the first", async () => {
    assert.equal((await read("#v=2&h=24&c=x.ffffff&x=3")).crossRow, 2);
    assert.equal((await read("#v=2&h=24&c=x.ffffff")).crossRow, null);
    for (const x of ["0", "4"]) await refused(`#v=2&h=24&c=x.ffffff&x=${x}`);
  });
  it("sv, face, bits: each value, and nothing else", async () => {
    for (const sv of ["whole", "needles", "crooks"]) assert.equal((await read(`#v=2&sv=${sv}`)).sectionView, sv);
    for (const face of ["front", "back"]) assert.equal((await read(`#v=2&face=${face}`)).face, face);
    assert.equal((await read("#v=2&bits=1")).bits, true);
    assert.equal((await read("#v=2&bits=0")).bits, false);
    for (const f of ["#v=2&sv=Whole", "#v=2&face=Back", "#v=2&bits=true", "#v=2&bits=2"]) await refused(f);
  });
  it("view: one, two or four of the nine views, in order; anything else falls back", async () => {
    for (const v of STAGE_VIEWS) assert.deepEqual((await read(`#v=2&view=${v}`)).views, [v]);
    assert.deepEqual((await read("#v=2&view=u3,section")).views, ["u3", "section"]);
    assert.deepEqual((await read("#v=2&view=3d,side,front,section")).views, ["3d", "side", "front", "section"]);
    for (const v of ["section,side,front", "section,section", "", "section,side,front,3d,u1"]) assert.deepEqual((await read(`#v=2&view=${v}`)).views, DEFAULT_LINK.views, v);
  });
  it("the loom's fields need a deck: a head alone is refused, and without c they are not read", async () => {
    await refused("#v=2&h=8");
    const l = await read("#v=2&p=5&s=3&f=2&t=p&l=0");
    assert.deepEqual([l.deck, l.pick, l.stop, l.follow, l.tie], [null, 0, 0, null, DEFAULT_LINK.tie]);
  });
});

describe("what a link is written as (design/links.md: only what differs, decks short)", () => {
  it("a field at its default is left out; a cross-row that is the followed hook's is left out", async () => {
    const deck = presetDeck("plain", 24);
    assert.equal(await encodeLink({ deck, follow: { hook: 17, end: null, pick: null }, crossRow: 2 }), `v=2&h=24&c=${await encodeDeck(deck.cards, 24)}&f=18`);
    assert.equal(await encodeLink({ deck, crossRow: 0 }), `v=2&h=24&c=${await encodeDeck(deck.cards, 24)}`);
    assert.match(await encodeLink({ deck, crossRow: 1 }), /&x=2$/);
  });
  it("colours in lower case without #, views joined by a plain comma", async () => {
    assert.equal(await encodeLink({ warp: "#ABCDEF", weft: "#00FF00", views: ["section", "3d"] }), "v=2&wc=abcdef&fc=00ff00&view=section,3d");
  });
  it("a deck whose hex is 80 characters or fewer is written readable; a longer one in the shorter of b. and z.", async () => {
    const small = presetDeck("twill", 64);
    assert.match(await encodeDeck(small.cards, 64), /^x\./);
    const rand = random(3);
    const noisy = [...Array(20)].map(() => [...Array(64)].map(() => rand() < 0.5));
    const text = await encodeDeck(noisy, 64);
    assert.match(text, /^[bz]\./);
    const b = `b.${Buffer.from(packCards(noisy, 64)).toString("base64url")}`;
    assert.ok(text.length <= b.length);
    assert.deepEqual(await decodeDeck(text, 64), { ok: true, cards: noisy });
  });
  it("every tie, section view, face and set of views round-trips, with both colours", async () => {
    const ties = /** @type {AppLink["tie"][]} */ ([...[1, 2, 3, 4].map((n) => ({ kind: "straight", repeats: n })), { kind: "point" }]);
    const views = /** @type {AppLink["views"][]} */ ([["u1"], ["u5", "3d"], ["side", "front", "u2", "u4"]]);
    for (const tie of ties)
      for (const sectionView of /** @type {const} */ (["whole", "needles", "crooks"]))
        for (const v of views) {
          const l = { ...DEFAULT_LINK, deck: presetDeck("satin", 16), tie, sectionView, face: /** @type {const} */ ("back"), warp: "#010203", weft: "#fafbfc", views: v };
          assert.deepEqual(await read(await encodeLink(l)), l);
        }
  });
});

describe("Learn: a step, by its name (design/links.md, Learn)", () => {
  it("a name of lower-case letters, digits and -, up to 64 of them", async () => {
    assert.equal((await read(`#v=2&w=learn&step=${"a".repeat(64)}`)).step, "a".repeat(64));
    for (const s of ["a".repeat(65), "Weave-twill", "weave_twill", "weave%20twill", ""]) await refused(`#v=2&w=learn&step=${s}`);
  });
  it("every step of the tutorial, and every old name, opens by a link written for it", async () => {
    const { ALIASES, stepIndex, STEPS } = await import("../../js/teach/tutorial.js");
    for (const name of [...STEPS.map((s) => s.id), ...Object.keys(ALIASES)]) {
      const l = await read(`#${await encodeLink({ workspace: "learn", step: name })}`);
      assert.equal(l.step, name);
      assert.ok(stepIndex(name) >= 0, name);
    }
  });
  it("the step names of 0.1.0 are the ones design/links.md lists, and stay", async () => {
    const { stepIndex } = await import("../../js/teach/tutorial.js");
    const frozen = [
      "story-draw-loom", "story-holes", "story-jacquard", "story-portrait",
      "how-whole-loom", "how-units", "how-section", "how-needles", "how-griffe", "how-one-row", "how-program", "how-loop", "how-not-a-computer",
      "weave-punch", "weave-plain", "weave-twill", "weave-satin", "weave-satin-by-two", "weave-tie-up", "weave-picture", "weave-next",
    ];
    for (const name of frozen) assert.ok(stepIndex(name) >= 0, `${name} no longer opens a step: keep it as an alias`);
  });
});

describe("Create: a picture (design/links.md, Create; 0.2.0)", () => {
  /** @param {string} rows @returns {boolean[][]} */
  const pic = (rows) => rows.split("/").map(card);
  it("a picture's rows, top first, as a deck as wide as it is, and its reading", async () => {
    const rows = pic(["00011000", "00111100", "01011010", "10011001", "00011000", "00011000", "00011000", "00011000"].join("/"));
    const l = await read("#v=2&w=create&pw=8&pic=x.18-3c-5a-99-18-18-18-18&rd=damask&k=3");
    assert.equal(l.workspace, "create");
    assert.deepEqual(l.picture, { rows, mode: "damask", k: 3, perRow: 1 });
    assert.deepEqual((await read("#v=2&w=create&pw=8&pic=x.18-3c-5a-99-18-18-18-18&pp=2")).picture, { rows, mode: "direct", k: 4, perRow: 2 });
  });
  it("round-trips, with only what differs written", async () => {
    const rows = [...Array(16)].map((_, y) => [...Array(16)].map((_, x) => (x * y) % 3 === 0));
    for (const p of [
      { rows, mode: /** @type {const} */ ("direct"), k: 4, perRow: 1 },
      { rows, mode: /** @type {const} */ ("damask"), k: 2, perRow: 1 },
      { rows, mode: /** @type {const} */ ("direct"), k: 4, perRow: 3 },
    ]) {
      const fragment = await encodeLink({ workspace: "create", picture: p, views: ["cloth"] });
      assert.deepEqual((await read(fragment)).picture, p);
    }
    assert.doesNotMatch(await encodeLink({ workspace: "create", picture: { rows, mode: "direct", k: 4, perRow: 1 } }), /rd=|k=|pp=/);
  });
  it("a picture that is not one of the sizes, not square, or a width with no picture, is refused", async () => {
    for (const f of ["#v=2&w=create&pw=12&pic=x.fff", "#v=2&w=create&pw=8&pic=x.ff-ff", "#v=2&w=create&pw=8", "#v=2&w=create&pw=8&pic=x.18-3c-5a-99-18-18-18-18&rd=satin", "#v=2&w=create&pw=8&pic=x.18-3c-5a-99-18-18-18-18&k=7", "#v=2&w=create&pw=8&pic=x.18-3c-5a-99-18-18-18-18&pp=4"]) {
      const r = await decodeLink(f);
      assert.ok(!r.ok, f);
    }
  });
  it("the cloth, large, is a view a link can name", async () => {
    assert.deepEqual((await read("#v=2&view=cloth,section")).views, ["cloth", "section"]);
  });
});

describe("Play: a game (design/links.md, Play; 0.2.0)", () => {
  it("the name game's text and reading; the guessing game's puzzle; a game not known yet opens the first", async () => {
    assert.deepEqual((await read("#v=2&w=play&game=name&text=Ada%0ALovelace&mode=direct")).game, { name: "name", text: "Ada\nLovelace", mode: "direct", seed: 1 });
    assert.deepEqual((await read("#v=2&w=play&game=guess&seed=77")).game, { name: "guess", text: "", mode: "damask", seed: 77 });
    assert.equal((await read("#v=2&w=play&game=chess")).game?.name, "name");
  });
  it("one byte a card carries its message as cards, so the friend has to read them", async () => {
    const l = await read("#v=2&w=play&game=byte&h=8&c=x.48-69");
    assert.equal(l.game?.name, "byte");
    assert.deepEqual(l.deck?.cards.map((c) => c.map(Number).join("")), ["01001000", "01101001"]);
  });
  it("round-trips, writing only what each game needs", async () => {
    for (const g of [{ name: /** @type {const} */ ("name"), text: "Jacquard", mode: /** @type {const} */ ("damask"), seed: 1 }, { name: /** @type {const} */ ("guess"), text: "", mode: /** @type {const} */ ("damask"), seed: 123456 }, { name: /** @type {const} */ ("drawboy"), text: "", mode: /** @type {const} */ ("damask"), seed: 1 }]) {
      const f = await encodeLink({ workspace: "play", game: g });
      assert.deepEqual((await read(f)).game, g);
    }
    assert.equal(await encodeLink({ workspace: "play", game: { name: "drawboy", text: "x", mode: "direct", seed: 9 } }), "v=2&w=play&game=drawboy");
  });
  it("a text too long, a reading or a seed out of range is refused", async () => {
    for (const f of [`#v=2&w=play&game=name&text=${"x".repeat(65)}`, "#v=2&w=play&game=name&text=Ada&mode=fast", "#v=2&w=play&game=guess&seed=0"]) assert.ok(!(await decodeLink(f)).ok, f);
  });
});
