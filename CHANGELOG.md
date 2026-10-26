# Changelog

What changed in each release. Versions follow `package.json` and are tagged `vX.Y.Z` ([docs/development.md](docs/development.md), *Versions and releases*). Each stage's details are in its notes in [design/](design/).

## Unreleased

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
