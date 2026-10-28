// The app's links (js/app/links.js; design/links.md): what the app shows, written as a link and
// opened again in another app, gives the same loom; in Learn, the step; a link names its views
// or leaves the stage's; one that cannot be read changes nothing and says why.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openLearn } from "../../js/app/learn.js";
import { linkOf, openLink } from "../../js/app/links.js";
import * as act from "../../js/app/looms.js";
import { appState } from "../../js/app/looms.js";
import { Store } from "../../js/app/store.js";
import { cardToString } from "../../js/sim/deck.js";
import { decodeLink, encodeLink } from "../../js/sim/link.js";
import { STOPS } from "../../js/sim/loom.js";
import { stepIndex } from "../../js/teach/tutorial.js";

const store = () => new Store(appState());
/** The loom as a link carries it. @param {Store<import("../../js/app/looms.js").AppState>} s */
const seen = (s) => {
  const ls = s.state.looms[s.state.current];
  return { cards: ls.loom.deck.cards.map(cardToString), loop: ls.loom.deck.loop, tie: ls.loom.tie, pick: ls.loom.pick, phi: ls.loom.phi, rows: ls.loom.cloth.length, follow: ls.follow, crossRow: ls.crossRow, warp: ls.warp, weft: ls.weft, face: ls.face, bits: ls.bits };
};

describe("a Weave link", () => {
  it("opens the same loom, at the same moment, in another app", async () => {
    const a = store();
    act.loadPreset(a, "twill");
    act.setTie(a, { kind: "straight", repeats: 2 });
    for (let i = 0; i < 9; i++) act.step(a);
    act.followEnd(a, 11);
    act.setColours(a, { warp: "#123456", weft: "#abcdef" });
    act.setFace(a, "back");
    act.setBits(a, true);
    act.setViews(a, ["front", "3d"]);
    const fragment = await encodeLink(linkOf(a));
    const b = store();
    assert.equal(await openLink(b, `#${fragment}`), true);
    assert.deepEqual(seen(b), seen(a));
    assert.equal(b.state.workspace, "weave");
    assert.deepEqual(b.state.views, ["front", "3d"]);
  });
  it("keeps the moment within the pick: the third, shuttle across", async () => {
    const a = store();
    act.moveTo(a, 1, STOPS[2]);
    const b = store();
    await openLink(b, `#${await encodeLink(linkOf(a))}`);
    assert.equal(b.state.looms.mine.loom.pick, 1);
    assert.equal(b.state.looms.mine.loom.phi, STOPS[2]);
  });
  it("a link's views are kept to the stage's rules: four hold one 3D model at most", async () => {
    const b = store();
    await openLink(b, "#v=2&view=3d,u1,u2,u3");
    assert.deepEqual(b.state.views, ["3d", "section", "front", "side"]);
  });
  it("a link that names no views leaves the stage's as they are", async () => {
    const b = store();
    act.setViews(b, ["u3"]);
    await openLink(b, "#v=2&h=8&c=x.aa-55");
    assert.deepEqual(b.state.views, ["u3"]);
  });
});

describe("a Learn link", () => {
  it("is the step on show, and opens it, with its own loom", async () => {
    const a = store();
    openLearn(a, "weave-satin");
    assert.deepEqual(linkOf(a), { workspace: "learn", step: "weave-satin" });
    const b = store();
    assert.equal(await openLink(b, `#${await encodeLink(linkOf(a))}`), true);
    assert.equal(b.state.workspace, "learn");
    assert.equal(b.state.learn.step, stepIndex("weave-satin"));
    assert.equal(b.state.looms.tutorial.loom.deck.cards.length, 8);
  });
});

describe("a link that cannot be read", () => {
  it("changes nothing, and says why in the status line", async () => {
    const b = store();
    const before = b.state.looms.mine.loom;
    assert.equal(await openLink(b, "#v=2&h=8&c=x.zz"), false);
    assert.equal(b.state.looms.mine.loom, before);
    assert.equal(b.state.looms.mine.status.warn, true);
    assert.equal(/** @type {{ key: string }} */ (b.state.looms.mine.status.msg).key, "link.cannot");
  });
  it("no fragment at all is no link", async () => {
    const b = store();
    assert.equal(await openLink(b, ""), false);
    assert.equal(await openLink(b, "#"), false);
    assert.equal(b.state.looms.mine.status.warn, false);
  });
});

describe("a Create link (0.2.0)", () => {
  it("is the picture and how it is read, and opens it on Create's loom, the learner's untouched", async () => {
    const a = store();
    const { presetPicture } = await import("../../js/sim/picture.js");
    act.setPicture(a, { rows: presetPicture("letter"), mode: "damask", k: 3 }, "create");
    act.setWorkspace(a, "create");
    const fragment = await encodeLink(linkOf(a));
    const b = store();
    const mine = b.state.looms.mine.loom;
    assert.equal(await openLink(b, `#${fragment}`), true);
    assert.equal(b.state.workspace, "create");
    assert.deepEqual(b.state.pictures.create.rows, presetPicture("letter"));
    assert.equal(b.state.pictures.create.mode, "damask");
    assert.equal(b.state.looms.create.loom.deck.cards.length, 48);
    assert.deepEqual(b.state.views, ["cloth"]);
    assert.equal(b.state.looms.mine.loom, mine);
  });
});

describe("a Play link (0.2.0)", () => {
  it("one byte a card: the sender's message reaches the friend as cards, a secret to read", async () => {
    const { openPlay, setMessage } = await import("../../js/app/play.js");
    const a = store();
    openPlay(a, "byte");
    setMessage(a, "Hi!");
    const fragment = await encodeLink(linkOf(a));
    assert.doesNotMatch(fragment, /Hi/, "the words are not in the link");
    const b = store();
    await openLink(b, `#${fragment}`);
    assert.equal(b.state.workspace, "play");
    assert.equal(b.state.play.game, "byte");
    assert.equal(b.state.play.byte.secret, true);
    const { readMessage } = await import("../../js/game/byteGame.js");
    assert.equal(readMessage(b.state.looms.game.loom.deck.cards), "Hi!");
  });
  it("guess the cloth: the same puzzle for the friend", async () => {
    const { openPlay, nextPuzzle } = await import("../../js/app/play.js");
    const a = store();
    openPlay(a, "guess");
    nextPuzzle(a);
    nextPuzzle(a);
    const b = store();
    await openLink(b, `#${await encodeLink(linkOf(a))}`);
    assert.equal(b.state.play.guess.seed, 3);
    assert.deepEqual(b.state.looms.game.loom.deck, a.state.looms.game.loom.deck);
  });
});

describe("after the 1.0.0 review", () => {
  it("an open chain woven to its end reopens woven to its end", async () => {
    const a = store();
    act.loadPreset(a, "twill");
    act.lace(a, false);
    act.moveTo(a, a.state.looms.mine.loom.deck.cards.length, 0);
    const b = store();
    await openLink(b, `#${await encodeLink(linkOf(a))}`);
    assert.deepEqual(seen(b), seen(a));
  });
  it("paused between two moments, a link keeps the moment just passed, and the rows woven", async () => {
    const a = store();
    act.moveTo(a, 3, (STOPS[3] + STOPS[4]) / 2);
    const b = store();
    await openLink(b, `#${await encodeLink(linkOf(a))}`);
    assert.equal(b.state.looms.mine.loom.pick, 3);
    assert.equal(b.state.looms.mine.loom.phi, STOPS[3]);
    assert.equal(b.state.looms.mine.loom.cloth.length, a.state.looms.mine.loom.cloth.length);
  });
  it("a Weave link with no cross-row and no thread opens on the first cross-row", async () => {
    const b = store();
    await openLink(b, "#v=2&h=16&c=x.a5a5-5a5a&x=2");
    assert.equal(b.state.looms.mine.crossRow, 1);
    await openLink(b, "#v=2&h=16&c=x.a5a5-5a5a");
    assert.equal(b.state.looms.mine.crossRow, 0);
  });
  it("a Games link opens its views, and the name game's reading without a text", async () => {
    const b = store();
    await openLink(b, "#v=2&w=play&game=name&mode=direct&view=cloth,section");
    assert.equal(b.state.play.name.mode, "direct");
    assert.deepEqual(b.state.views, ["cloth", "section"]);
  });
  it("a friend's secret stays on the loom when another game is chosen and the secret again", async () => {
    const { chooseGame, openPlay, setMessage } = await import("../../js/app/play.js");
    const { readMessage } = await import("../../js/game/byteGame.js");
    const a = store();
    openPlay(a, "byte");
    setMessage(a, "Hi!");
    const b = store();
    await openLink(b, `#${await encodeLink(linkOf(a))}`);
    chooseGame(b, "name");
    chooseGame(b, "byte");
    assert.equal(readMessage(b.state.looms.game.loom.deck.cards), "Hi!");
    assert.ok((await decodeLink(`#${await encodeLink(linkOf(b))}`)).ok, "and its link still reads");
  });
  it("the next puzzle after the last a link can name is the first", async () => {
    const { nextPuzzle } = await import("../../js/app/play.js");
    const { MAX_SEED } = await import("../../js/sim/link.js");
    const b = store();
    await openLink(b, `#v=2&w=play&game=guess&seed=${MAX_SEED}`);
    nextPuzzle(b);
    assert.equal(b.state.play.guess.seed, 1);
  });
  it("whatever Weave can make, its link reads: a chain holds at most a link's cards", async () => {
    const { MAX_CARDS } = await import("../../js/sim/link.js");
    const b = store();
    act.loadPreset(b, "plain");
    while (b.state.looms.mine.loom.deck.cards.length < MAX_CARDS) act.duplicate(b);
    act.add(b);
    act.duplicate(b);
    assert.equal(b.state.looms.mine.loom.deck.cards.length, MAX_CARDS);
    const m = b.state.looms.mine.status.msg;
    assert.equal("key" in m && m.key, "status.full");
    assert.ok((await decodeLink(`#${await encodeLink(linkOf(b))}`)).ok);
  });
  it("a thread followed to an end the new tie gives another hook keeps its hook, not the end", () => {
    const b = store();
    act.loadPreset(b, "twill");
    act.setTie(b, { kind: "straight", repeats: 2 });
    // the end three past the first repeat: hook 3 of a straight tie, another hook of the point tie
    act.followEnd(b, b.state.looms.mine.loom.deck.hooks + 3);
    const hook = b.state.looms.mine.follow?.hook;
    assert.equal(hook, 2);
    act.setTie(b, { kind: "point" });
    assert.deepEqual(b.state.looms.mine.follow, { hook, end: null, pick: null });
  });
});
