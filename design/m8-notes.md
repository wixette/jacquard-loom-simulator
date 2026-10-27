# M8 notes: Design (first called Create), and the tutorial's parts 4 and 5

- **Status:** built 2026-10-27/28, on the branch `release/v0.2.0`. The first milestone of release 0.2.0 ([public-app.md](public-app.md) §4). The spec below passes in `pnpm test` (the picture's reading in `tests/sim/picture.test.js`, the tutorial's steps in `tests/teach/tutorial.test.js`, the links in `tests/sim/link.test.js` and `tests/app/links.test.js`) and on the app with `?selftest` (C-1 to C-6, and M7's L-1 walking the new steps).
- **Page:** [`index.html`](../index.html): a third workspace, Create, after Learn and Weave.

## What M8 builds

| Part | Where | What it is |
|---|---|---|
| The picture's reading | `js/sim/picture.js` | A square picture (8, 16, 24 or 32 squares) read as cards, square by square (1 to 3 picks a row) or as damask (blocks of 2 to 6 threads, a warp-faced and a weft-faced satin); what it needs (warp ends, hooks); its long floats, and the status line's words for them. Pure |
| Create | `js/app/create.js`, `js/app/looms.js` (`create`, `pictures`, `setPicture`, `weavePicture`) | Its own loom, woven to the end each time the picture changes; the picture kept on the device; Weave it puts its cards on the learner's own loom, in Weave |
| The picture tool | `js/app/components/picture.js`, `css/app.css` | How it is read (on top, where a short panel still shows it), the size, the ready-made pictures, an image opened and thresholded in the browser (never uploaded), invert, clear, and the point paper, painted by drag |
| The cloth view | `js/view2d/clothView.js`, `js/app/components/panels.js` | The cloth alone on the stage, as large as its pane holds, its long floats marked in red where the picture tool is on |
| Links | `js/sim/link.js`, `js/app/links.js` | `w=create` with `pic`, `pw`, `rd`, `k`, `pp` (design/links.md, Create) |
| The tutorial | `js/teach/tutorial.js`, `js/app/components/guide.js` | Part 4 (four challenges, each with the cloth it should weave), part 5 (the picture tool on the tutorial's loom, the setup, sharing, the way to Create and Play) |

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
| | `tools-create` | Go to Create | |
| | `tools-games` | The four games; Go to Play | |

## Decisions

1. **A challenge is checked by its cloth, not by its cards.** Each shows the cloth it should weave beside the guide (a thumbnail) and is done when the loom weaves those rows, however the learner fixed it; the tests check that each challenge's own broken loom fails and its solution passes.
2. **The picture tool reads, it does not guess.** Two readings, chosen by the learner: square by square, which shows a picture's long floats (marked on the cloth, counted in the status line), and damask, the period's answer to them. The research's float limit (`FLOAT_LIMIT`) decides what is loose.
3. **Create's loom is the picture's.** Its cards change only with the picture; the card tools, punching and the loop refuse there and say why (`pic.locked`); its colours, its face and the transport are free. Weave it hands the cards to Weave, where they are the learner's to change.
4. **An image is read in the browser and never leaves it:** reduced to 256 pixels, then thresholded at the slider's level into the paper's squares.
5. **The cloth view is a 2D view like the others** (`cloth` in the view menu), the default in Create and Play; each workspace keeps its own views (`viewsBy`).
6. **The link format grows, it does not change** (design/links.md): Create's fields are new names, read only with `w=create`.

## After the review (2026-10-28)

7. **The cloth view sizes its squares as the side panel's cloth does:** by the width only, so they keep their size as rows are woven, and rows past the pane's height scroll (newest on top, where the scroll starts). Its squares are at most 33 px, 1.5 times the panel's 22, which leaves room for the red float marks; it first fitted the whole cloth in its pane, so its squares shrank as the cloth grew and started much larger than the panel's.
8. **Design's cards are under the picture, and the machine is on the right,** as Learn stacks its guide over the cards and Games shows the machine: the left panel is what the learner works on (the picture, and the cards it makes, with Weave it), the stage shows the cloth, and the right the head in section on the picture's loom.
9. **The workspaces are named Learn, Weave, Design and Games.** Create was too general for a picture tool, and Play could be read as "play the machine" (the transport's Play button); Design is the trade's own word (designers drew the figure on point paper, from which the cards were cut), and Games says what is there. The links keep `w=create` and `w=play`, and the code its ids: the link format is a contract (design/links.md).
10. **The view menu lists the 2D drawings, the 3D models, then the cloth,** set apart by a divider: the cloth is what the loom makes, not a drawing of the machine.
