# Jacquard Loom Simulator

[![Tests](https://github.com/wixette/jacquard-loom-simulator/actions/workflows/test.yml/badge.svg)](https://github.com/wixette/jacquard-loom-simulator/actions/workflows/test.yml)

An interactive simulator of the Jacquard loom: punch the cards, turn the loom, and watch the head choose every thread. Mechanism in 2D and 3D, lessons and games.

**[Open the simulator](https://wixette.github.io/jacquard-loom-simulator/)**: nothing to install, free.

## What is the Jacquard loom?

The Jacquard head (Joseph Marie Jacquard, Lyon, 1801–1805) let a chain of punched cards choose which warp threads rise for each throw of the shuttle, so a loom could weave any figure without a draw boy calling the cords by hand. Babbage took its cards for his Analytical Engine, which makes it the usual first chapter in the pre-history of computing.

This simulator shows a single-lift Jacquard head on a silk hand loom, of the kind used from about 1810 to 1900. You write the cards, watch the needles, hooks and griffe select the threads pick by pick, and see the cloth that results. It also shows what the machine cannot do: it reads a fixed sequence of cards; it does not compute.

## Status

**0.0.1, a working prototype.** Everything below works and is tested; the public app designed for it (a step-by-step tutorial, four mini games, a layout for desktop and phone) is not built yet. Its design is in [design/public-app.md](design/public-app.md) and [design/ui-layout.md](design/ui-layout.md), and the history so far in [CHANGELOG.md](CHANGELOG.md).

## What is in it

- **The learner page** (`dev/03-learner/`; the address above shows a page pointing to it until the main app arrives): the whole loom in 2D, with ten lessons (the last prints the cards at true size, to punch and lace); a picture-to-cards helper (draw, open an image, or take a preset; read it directly or as damask, and see where the threads would float loose); a note about the machine; and **Parts in 3D**, the ghosted loom with its five core units in place, each opened alone with a click.
- **The developer pages** (`dev/`), one per stage of the work:
  - `dev/01-section/`: one cross-row of the head in a side section, drawn to scale from Posselt (1887); punch eight-hole cards and watch them select the hooks.
  - `dev/02-loom/`: the whole loom in 2D: a head of 8 to 64 hooks and a tie-up, the cards in the chain or on the bench, and any cell of the cloth followed back through the front view and the head to its hole. "Copy link" opens the same loom elsewhere.
  - `dev/04-units/`: the five core units in 3D (the selector, the card cylinder, the griffe and lift, the harness line, the shed with its shuttle and batten), turned with the mouse and moving with the loom beside the 2D section.
  - `dev/05-machine/`: the ghosted whole loom, with the 400-hook head of the Science Museum's Spitalfields loom.
  - `dev/06-name-game/`: a prototype of the first mini game: type a name, and the page sets it in a pixel font, cuts the cards, weaves it, and reads the cloth back.
  - `dev/07-foundations/`: the main app's foundations: every view and panel as a component, placed in any slot, on any of the app's looms, in any of ten languages.

Add `?selftest` to any page to run its acceptance checks in the browser (`pnpm selftest` runs them all, headless).

## How faithful is it?

The head is drawn to scale from E. A. Posselt's *The Jacquard Machine Analysed and Explained* (1887), and the whole loom is sized after the Science Museum Group's Spitalfields loom (1914-469), where its catalogue gives a size, and estimated where it does not. Every dimension and angle, with its source and how sure we are of it, is in [params/machine.json](params/machine.json). The research behind it, including what the sources do not tell us and the myths left out, is in [research/REPORT.md](research/REPORT.md); the design choices are in [design/](design/), starting with [the simulator plan](design/simulator-plan.md) and [decision 0001](design/decisions/0001-2d-first-with-3d-units.md) (2D first, with 3D models of the core units).

## Running it on your own computer

There is nothing to build: the simulator is plain HTML, CSS and JavaScript. You need [Git LFS](https://git-lfs.com) for the 3D models, and any static web server:

```
git lfs install
git clone https://github.com/wixette/jacquard-loom-simulator.git
cd jacquard-loom-simulator
python3 -m http.server 8000
```

Then open <http://localhost:8000/dev/> (the developer pages, the learner page among them). Opening `index.html` straight from disk does not work, because browsers do not load JavaScript modules from `file://`.

## For developers

The code is plain JavaScript modules with JSDoc types, three.js is vendored, and the 3D units are built from [params/machine.json](params/machine.json) by headless Blender scripts.

```
pnpm install
pnpm serve        # http://localhost:8000/, with caching off
pnpm check:refs   # no private references, local paths or broken links
pnpm typecheck    # the JSDoc types, checked strictly; nothing is compiled
pnpm test         # the logic, the 2D and 3D acceptance tests (Node, no browser)
pnpm selftest     # every page's checks in headless Chrome
```

Start with **[docs/development.md](docs/development.md)**: requirements, page options, commands, versions and releases, publishing. The rules the code follows are in [docs/conventions.md](docs/conventions.md), and the page's design principles in [docs/ui-design.md](docs/ui-design.md).

### Folder layout

| Folder | Contents |
|---|---|
| `index.html`, `css/`, `js/` | The main app (being built) and the code shared with the prototypes: `js/sim/` the machine, the picture reader, the trace and the links (pure logic); `js/view2d/` the 2D drawings; `js/scene/` the 3D units (three.js); `js/app/` the app's store, components and the prototypes' shells; `js/ui/` the interface's components and theme; `js/l10n/` the ten languages; `js/teach/` the lessons; `js/game/` the name game; `js/accept/` the acceptance checks |
| `dev/` | The developer pages, one per stage |
| `params/` | `machine.json`: every dimension and angle, each with a source and a confidence |
| `blender/scripts/` | Headless build scripts (params → parts → `.glb`) |
| `assets/` | The generated `.glb` models (Git LFS, always rebuildable) |
| `tests/` | `node --test` tests, including acceptance tests on the `.glb` |
| `research/` | Sources, notes, data and reference images, with [REPORT.md](research/REPORT.md) as the entry point |
| `design/` | The plan, the decision records, each stage's notes, and the public app's design |
| `docs/` | How to develop, the conventions, the licences, the design principles |
| `tools/`, `vendor/` | Version stamps, the dev server, the reference check; three.js |

## Credits

The research relies above all on the public-domain textbooks of E. A. Posselt (1887), A. Barlow (1878), T. F. Bell (1895), H. W. Nelson (1909) and F. Kohl (1873), F. Bradbury's *Jacquard Mechanism and Harness Mounting* (1912, facts only), and the Science Museum Group's catalogue records. Reference photos are by Wikimedia Commons and Flickr contributors, listed with their licences in [research/images/ATTRIBUTION.md](research/images/ATTRIBUTION.md). Full sources: [research/sources/bibliography.md](research/sources/bibliography.md).

The name game's lettering uses the [Unscii](http://viznut.fi/unscii/) 8 × 16 font by Viznut (public domain). Built with [three.js](https://threejs.org).

## Licence

- **Code:** [Apache-2.0](LICENSE)
- **Original content** (3D models, research notes, design notes, lessons, docs): [CC BY-SA 4.0](LICENSES/CC-BY-SA-4.0.txt)
- **Third-party material** keeps its own licence, declared per path in [REUSE.toml](REUSE.toml) and summarised in [docs/licensing.md](docs/licensing.md)
