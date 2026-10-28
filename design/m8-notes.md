# M8 notes: Design (first called Create), and the tutorial's parts 4 and 5

- **Status:** built 2026-10-27/28, on the branch `release/v0.2.0`. The first milestone of release 0.2.0 ([public-app.md](public-app.md) §4). The spec below passes in `pnpm test` (the picture's reading in `tests/sim/picture.test.js`, the tutorial's steps in `tests/teach/tutorial.test.js`, the links in `tests/sim/link.test.js` and `tests/app/links.test.js`) and on the app with `?selftest` (C-1 to C-7, and M7's L-1 walking the new steps).
- **Page:** [`index.html`](../index.html): a third workspace, Design (`w=create`; first called Create), after Learn and Weave.

## What M8 builds

| Part | Where | What it is |
|---|---|---|
| The picture's reading | `js/sim/picture.js` | A square picture (8, 16, 24 or 32 squares) read as cards, square by square (1 to 3 picks a row) or as damask (blocks of 2 to 6 threads, a warp-faced and a weft-faced satin); what it needs (warp ends, hooks); its long floats, and the status line's words for them. Pure |
| Design | `js/app/create.js`, `js/app/looms.js` (`create`, `pictures`, `setPicture`, `weavePicture`) | Its own loom, woven to the end each time the picture changes; the picture kept on the device; Open in Weave puts its cards on the learner's own loom, in Weave |
| The picture tool | `js/app/components/picture.js`, `css/app.css` | How it is read (on top, where a short panel still shows it), the size, the ready-made pictures, an image opened and thresholded in the browser (never uploaded), invert, clear, and the point paper, painted by drag |
| The cloth view | `js/view2d/clothView.js`, `js/app/components/panels.js` | The cloth alone on the stage, as large as its pane holds, its long floats marked in red where the picture tool is on |
| Links | `js/sim/link.js`, `js/app/links.js` | `w=create` with `pic`, `pw`, `rd`, `k`, `pp` (design/links.md, Design) |
| The tutorial | `js/teach/tutorial.js`, `js/app/components/guide.js` | Part 4 (four challenges, each with the cloth it should weave), part 5 (the picture tool on the tutorial's loom, the setup, sharing, the way to Design and Games) |

## The tutorial's new parts

| Part | Step | What it does | Task |
|---|---|---|---|
| 4. Challenge | `debug-swapped` | A twill with two cards swapped | fix the cards, weave the target |
| | `debug-hole` | A satin with a blank card | punch the missing hole |
| | `debug-tie-up` | The right cards on the wrong tie-up | set the tie-up |
| | `debug-loop` | A loop with a card too many | remove it |
| 5. Your tools | `tools-picture` | The picture tool, on the tutorial's loom | |
| | `tools-loose` | Why a picture read square by square falls apart: long floats | predict; read it as damask |
| | `tools-follow` | Following a thread, in the front view | |
| | `tools-setup` | The head and its tie-up | set 16 hooks |
| | `tools-share` | Links, the cloth as a picture, printing the cards | |
| | `tools-create` | Go to Design | |
| | `tools-games` | The four games; Go to Games | |

## Decisions

1. **A challenge is checked by its cloth, not by its cards.** Each shows the cloth it should weave beside the guide (a thumbnail) and is done when the loom weaves those rows, however the learner fixed it; the tests check that each challenge's own broken loom fails and its solution passes.
2. **The picture tool reads, it does not guess.** Two readings, chosen by the learner: square by square, which shows a picture's long floats (marked on the cloth, counted in the status line), and damask, the period's answer to them. The research's float limit (`FLOAT_LIMIT`) decides what is loose.
3. **Create's loom is the picture's.** Its cards change only with the picture; the card tools, punching and the loop refuse there and say why (`pic.locked`); its colours, its face and the transport are free. Open in Weave hands the cards to Weave, where they are the learner's to change.
4. **An image is read in the browser and never leaves it:** reduced to 256 pixels, then thresholded at the slider's level into the paper's squares (see 11).
5. **The cloth view is a 2D view like the others** (`cloth` in the view menu), the default in Create and Play; each workspace keeps its own views (`viewsBy`).
6. **The link format grows, it does not change** (design/links.md): Create's fields are new names, read only with `w=create` (from 1.0.0, checked in any link, whatever `w` says: design/links.md).

## After the review (2026-10-28)

7. **The cloth view sizes its squares as the side panel's cloth does:** by the width only, so they keep their size as rows are woven, and rows past the pane's height scroll (newest on top, where the scroll starts). Its squares are at most 33 px, 1.5 times the panel's 22, which leaves room for the red float marks; it first fitted the whole cloth in its pane, so its squares shrank as the cloth grew and started much larger than the panel's.
8. **Design's cards are under the picture, and the machine is on the right,** as Learn stacks its guide over the cards and Games shows the machine: the left panel is what the learner works on (the picture, and the cards it makes, with Open in Weave), the stage shows the cloth, and the right the head in section on the picture's loom.
9. **The workspaces are named Learn, Weave, Design and Games.** Create was too general for a picture tool, and Play could be read as "play the machine" (the transport's Play button); Design is the trade's own word (designers drew the figure on point paper, from which the cards were cut), and Games says what is there. The links keep `w=create` and `w=play`, and the code its ids: the link format is a contract (design/links.md).
10. **The view menu lists the 2D drawings, the 3D models, then the cloth,** set apart by a divider: the cloth is what the loom makes, not a drawing of the machine.
11. **Before the file dialog, the image button says what an image becomes:** the formats (any the browser shows: PNG, JPEG, GIF, WebP, SVG), that it is shrunk to the paper's size (each square the average of the image under it; for more detail, a larger size first), that each square is then made dark or light against a level, and that bold shapes on a light ground work best; then Choose an image… opens the dialog. Its icon is the open folder, not a picture. An image that is not square is fitted inside the paper, light around it, where it was first stretched to a square; once open, the note and the level (with a line on what it does: the image made two-tone) sit above the paper, where a short panel still shows them.
12. **The buttons say where they act:** Design's *Open in Weave* (first "Weave it") leaves for Weave with the cards, as "Open in …" does in any app; the games' *Weave to the end* (first "Weave it all") weaves the chain out where it is. The name game's choice of reading is Design's own: *Read it*, *Square by square* then *As damask*, by the same words in every language (it was "Weave it": *Real cloth* or *Quick*); the name game still starts on damask, the better cloth.

## Acceptance spec

The picture's reading, the steps and the links are checked in `pnpm test` (above); these are the app's own, on `index.html?selftest` (`js/accept/m8Checks.js`).

| ID | Statement | Kind |
|---|---|---|
| C-1 | Design opens on its loom: the paper on the left with its cards and Open in Weave under it, the cloth alone and large, the machine on the right. | page |
| C-2 | A stroke on the paper paints its squares, dark or light as the first decides, and the loom weaves the picture again. | page |
| C-3 | Read square by square the heart floats, and the status line says so; as damask it holds together, on more cards. | page |
| C-4 | Open in Weave puts the picture's cards on the learner's own loom, in Weave, and says so. | page |
| C-5 | Design's link holds the picture and its reading, and opens them again. | page |
| C-6 | Design's loom refuses a change to its cards and says why; its colours are free. | page |
| C-7 | The image button says first what an image becomes (formats, the paper's size, the level of dark); an image opened is fitted in the paper, its level above it. | page |

### Results (2026-10-28)

All pass (`pnpm selftest`, 2026-10-28). What each reports:

| ID | Result |
|---|---|
| C-1 | 16 cards, 16 hooks (the opening picture, read square by square, woven to its end) |
| C-2 | 3 squares dark |
| C-3 | 16 cards square by square, 64 as damask |
| C-4 | 16 cards on Weave's loom |
| C-5 | The link's length, in characters: `w=create` with `pic`, opened again as the same picture, as damask in blocks of 3 |
| C-6 | Add refused with `pic.locked`; the warp recoloured |
| C-7 | A 2 : 1 image on 16 × 16: 8 dark rows, the paper's top and bottom quarters light |
