# Changelog

What changed in each release. Versions follow `package.json` and are tagged `vX.Y.Z` ([docs/development.md](docs/development.md), *Versions and releases*). Each stage's details are in its notes in [design/](design/).

## Unreleased (0.2.0)

- **Design:** the picture tool as a workspace: paint a picture on point paper, take a ready-made one or open an image, and read it square by square or as damask; the cloth large, its long floats marked; Open in Weave puts its cards on your loom; Share links to the picture.
- **Games:** four games: the name game (a name or a message, wrapped into up to 16 lines), one byte per card (with a friend's secret to read), guess the cloth, and draw boy against Jacquard; each can be shared as a link.
- **Learn:** the tutorial's parts 4 (four debugging challenges, each with the cloth it should weave), 5 (your tools) and 6 (what came next: Babbage, Lovelace, Hollerith, the computer).
- The cloth as a view of its own, last in the view menu.
- The workspaces are Learn, Weave, Design and Games (the last two first called Create and Play; their links keep `w=create` and `w=play`).
- The app opens on the tab it was left on, Design and Games too (0.1.0 remembered only Learn or Weave), and Games on the game last chosen; the language chosen is kept as before.

## 0.1.0

The first public release (2026-10-27): the Jacquard loom, whole, to weave on and to learn from, in
the browser, on a computer or a phone, in ten languages.

- **Weave:** punch the cards, turn the loom and watch it weave, in the head's section, from the
  side and the front, or in 3D (the whole loom, and its five units alone), one view, two or four;
  follow any thread from its hole to the cloth; heads of 8 to 64 hooks and their tie-ups; the
  cloth's colours; share the loom as a link, save the cloth as a picture, print the cards.
- **Learn:** a tutorial of 21 steps in three parts, the story, how it works and weaving by hand,
  with historical pictures, questions to predict before weaving and tasks checked on the loom.
- The machine's sounds, the keyboard, a dark theme, and a link format that is now a contract
  ([design/links.md](design/links.md)).

**Before the release (2026-10-27)**
- A newcomer opens on Learn, with the whole loom in 3D; after that the app opens on the workspace last used.
- The tutorial's step stacks from the top: Back and Next right under the text, the cards below with the room left.
- The view menu in two groups, 2D drawings and 3D models, with the units by name (no "U1"…"U5"); a view on show is never shown twice (choosing it swaps the panes), the four-view grid holds one 3D model, and going to two or four views keeps those on show.
- The link format agreed, with tests for every field and value.
- The section labels the griffe and its knives beside the griffe, wherever it is in its lift.
- The cloth's colours: the button shows the warp and weft themselves; its panel has a row for each thread, the page's own colour picker (in place of the browser's), a swap, six ready-made pairs, Reset, and a small piece of twill in the two colours by its title; it hangs from its button.
- The tutorial's place is on the step's card only: the Learn tab no longer grows with it.
- The machine's sounds: edited from Pixabay sound effects (audio/SOURCES.md), in place of the placeholders. Each is heard on the motion that makes it (the swish as the shuttle is thrown, the clack as the batten strikes), past any silence at its file's start. Every sound plays at every speed: faster than 30 picks a minute each is cut short with a fade, near its own pitch, the batten loudest.
- Clicks are never lost while the loom plays: Pause, a hook in a drawing, a hole in the chain or on the bench, the cross-row menu and the 3D bands' labels (each had been redrawn every frame, between a click's press and its release).
- The logo is the favicon too, in place of a square card that read as a Go board.
- The popovers follow their button when the window is resized, and shut as popovers do (their button, a press elsewhere, Esc).

**M7, the tutorial, parts 1 to 3 (2026-10-27)** ([notes](design/m7-notes.md))
- Learn: 21 steps in three parts. The story (the draw loom; Bouchon, Falcon and Vaucanson; Jacquard; the woven portrait), with four historical pictures and their credits; how it works (the loom in 3D, the head cut through, a light card and a heavy lift, one card one row, the chain as a program and a loop, what the loom is not); weaving by hand (punch a card, plain weave, twill, satin and why stepping by two fails, the tie-up's repeats, a picture woven bottom-up).
- Each step on one card, with its part and place, the list of all the steps, a question to answer before weaving, and a task checked on the loom; its task line works the real controls, which glow; what the step does not use is greyed and says why.
- The tutorial's place and the steps done kept on the device; a link to every step; the section's parts a step points at glow amber.
- The tutorial in all ten languages.

**M6, the main app's frame and Weave (2026-10-27)** ([notes](design/m6-notes.md))
- The main app at `index.html`: the top bar (Learn and Weave, Share, the language, About), the cards on the left, the cloth on the right, the stage in the middle with one, two or four views (the section, the side and front views, the loom in 3D and its five units), what just happened under it, and the player along the whole bottom: the six moments as a stepper over the controls, centred; on a phone, the stage on top and a sheet with the rest.
- The machine's settings beside what they change: the head and tie-up over the cards, the colours over the cloth, the chain's loop where it ends.
- The panels resized by their edges and closed to a rail; the keyboard (Space, ← →, 1–4, F, Esc); the machine's sounds, placeholders until the recorded ones; About; Share's link keeps the moment within the pick.
- The frame, the 3D parts' names and the units' ideas in all ten languages; the chain draws a wide card whole.
- The app's own checks (`index.html?selftest`, in `pnpm selftest`).

**M5, the foundations of the main app (2026-10-27)** ([notes](design/m5-notes.md))
- The dark theme on every 2D and 3D view, from one set of tokens (`css/theme.css`); what a hole lifts shows green; iron and lead lighter in 3D, with lights that travel with the camera.
- Ten languages, the sibling Stepped Reckoner's: the loom, the trace, the drawings and the links speak in message keys.
- One store for the app, with the learner's, the tutorial's and a game's looms; every view and panel a component that mounts in any slot (`dev/07-foundations/`).
- The link format of the main app, version 2, for review before 0.1.0 ([design/links.md](design/links.md)).
- The prototype learner page moved to `dev/03-learner/`; `pnpm shots` and `pnpm selftest`; Roboto Flex and Material Symbols vendored.

- The main app's design revised (2026-10-27): it replaces the prototype learner page at `index.html`; a six-part tutorial instead of lessons; the sibling Stepped Reckoner's dark theme, ten languages, components and sounds; the tutorial and the games on looms of their own; three releases, 0.1.0, 0.2.0 and 1.0.0 ([design/public-app.md](design/public-app.md), [design/ui-layout.md](design/ui-layout.md), [docs/ui-design.md](docs/ui-design.md)).

## 0.0.1

The prototype, as it stood when the simulator moved to this repository (2026-10-26). Built in stages, each with its acceptance checks; the checks pass in `pnpm test` and in each page's `?selftest`.

**Research (2026-10-25)**
- A research pack and a feasibility report: the machine and its sources, the existing simulators, the value for teaching, licences, and what a 2D and a 3D reconstruction would take ([research/REPORT.md](research/REPORT.md)). Verdict: go, with conditions.
- The plan: a 2D machine first, with one 3D model per core unit and a ghosted whole machine, instead of a full 3D head ([decision 0001](design/decisions/0001-2d-first-with-3d-units.md), [the simulator plan](design/simulator-plan.md)).

**M0, the logic and one cross-row in 2D (2026-10-25)** ([notes](design/m0-notes.md))
- The loom's logic: cards, the tie-up, the pick's six moments, stepping forward and back, the cloth.
- A side section of one cross-row of the head, drawn to scale from Posselt (1887), driven by the same moments; any part can be followed through the cards and the cloth (`dev/01-section/`).

**M1, the whole loom in 2D (2026-10-25)** ([notes](design/m1-notes.md))
- Heads of 8 to 64 hooks, tie-ups with repeats, the chain unfolded or the real card on the bench, the loom from the side and the front, and a cell of the cloth followed back to its hole (`dev/02-loom/`).
- A link that opens the same loom elsewhere (`js/sim/link.js`, a public format).
- Fixes after M1 (2026-10-26): the cylinder's faces carry consecutive cards, and the chain moves round it as one; the needles move only when the card touches them; the drawings' labels are sized on screen, kept in view and clear of lines and shapes; a no-cache dev server (`pnpm serve`).

**M2, the learner page (2026-10-26)** ([notes](design/m2-notes.md))
- The learner page (`index.html`): the whole loom in 2D, lessons L1–L7, and a note about the machine.
- The picture helper: draw, open an image or take a preset, read it directly or as damask, and see where the threads would float loose.

**M3, the 3D core units (2026-10-26)** ([notes](design/m3-notes.md))
- Five units built in Blender from `params/machine.json`, headless: the selector, the card cylinder, the griffe and lift, the harness line, the shed with its shuttle and batten; each moves with the loom beside the 2D section (`dev/04-units/`).

**M4, the whole machine and the teaching pass (2026-10-26)** ([notes](design/m4-notes.md))
- The ghosted whole loom with the units in place; a click flies to a unit and opens it alone (`dev/05-machine/`).
- **Parts in 3D** on the learner page, loaded only when chosen.
- Lessons L8 (debug the deck), L9 (a program, but not a computer) and L10 (print the cards at true size, to punch and lace).

**After M4 (2026-10-26)**
- The cloth no longer blinks when it outgrows its box.
- The card chain lies over the cylinder as Posselt has it: the next card on top, the cards read hanging below the needle face, the face underneath bare; the cylinder turns the right way in 2D and 3D.
- The selector (U1) shows a cross-row's 8 needles reading the real card, with every hole position marked, brass pegs and faint bores; its knife is drawn at its full length.
- The ghost is the 400-hook head of the Science Museum's Spitalfields loom, with its own frame and a card rack.
- The name game, a prototype of the first mini game: a name set in the Unscii 8 × 16 font, woven as damask on the 400 head or directly on 64 hooks, and read back from the cloth (`dev/06-name-game/`, [notes](design/name-game-notes.md)).
- The public app designed: a tutorial and four mini games ([design/public-app.md](design/public-app.md)), and its layout on desktop and phone ([design/ui-layout.md](design/ui-layout.md)).
