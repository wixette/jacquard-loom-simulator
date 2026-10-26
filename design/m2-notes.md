# M2 notes: the picture helper, the lessons and the learner page

- **Status:** built 2026-10-26. The M2 spec below passes in `pnpm test` (J2-1 to J2-6) and on the learner page with `?selftest` (with M0's, M1's and the label checks, 33 checks).
- **Pages:** the learner page, [`index.html`](../index.html), at the machine's root; [`dev/03-learner/`](../dev/03-learner/) links to it, with `?selftest` and each lesson. M1's page, [`dev/02-loom/`](../dev/02-loom/), runs on the same code.

## What M2 adds

| Requirement (plan §4.3, §4.4, §6) | Where |
|---|---|
| The picture helper's logic | `js/sim/design.js`: `readDirect()` (one pixel per thread; invert, picks per row, repeat across the head), `readDamask()` (each pixel k × k threads of 8-end satin, step 3), `findFloats()`, `pictureFromPixels()` (an image reduced by averaging each block, transparent as white, thresholded), the presets. The first card is the picture's bottom row (Bradbury), so the cloth grows the right way up. |
| The helper's panel | `js/app/pictureHelper.js`: a grid to paint on (8 to 32 squares), the presets, "Open an image…" (read in the page through a canvas; nothing is uploaded), a threshold slider for images, direct or damask, the head (the smallest that fits, or one chosen), and a preview of the cloth the cards will weave with every float over 8 threads marked by a red line. A reading that does not fit greys the button and says what it needs. "Put these cards on the loom" loads an ordinary open chain, which the chain editor can then change. |
| Lessons L1–L7 | `js/teach/lessons.js`: each lesson has its cards and tie, a hook to follow when useful, steps, what to notice, one question, and variants to try with one click (L3 reversed, L4 stepped by two). Each also has a check on the cloth it weaves (`shows`), so a lesson cannot quietly stop showing its point. `js/app/lessonDock.js` shows them. `?lesson=L3` opens a lesson from a link. |
| The learner page | `index.html`, `css/learner.css`, `js/main.js` and `js/app/learnerPage.js`. The page shell of M1 moved to `js/app/loomPage.js` (`createLoomPage()`), shared by both pages, and its stylesheet to `css/loom.css`. |

## Decisions made while building

1. **The dock sits in the right-hand column, between the transport and the cloth.** The plan asks for the machine always in view and one dock for lessons, the helper and "about". A fourth column would leave the drawings too narrow below 1900 px, and a dock over the drawings would hide them. So the right column is: the transport (always needed while a lesson says "press Step"), the dock (which scrolls on its own), and the cloth (shorter than on the M1 page). Below 1250 px the column moves under the drawings, as on the M1 page.
2. **Lessons open by a query (`?lesson=L3`), not by the link format.** A lesson is a page state with words around it; the link format (`js/sim/link.js`) is a public contract for the machine's state, and a lesson needs no field in it. A worksheet can still open the machine in any state with a copied link.
3. **Damask with blocks of one thread is allowed, and its long floats shown.** With k = 1 a pixel that falls on a satin point joins its neighbours' floats (up to 11 threads in the random pictures tried, against 16 for the same heart read directly). With k = 2 to 6 no float can be longer than 8: a satin point inside a block always has a neighbour of its own block that breaks the run, and a light run of exactly 7 between two dark points needs a block width of 7 or 1. The helper offers k = 1 to 4, defaults to 4, and marks whatever floats there are.
4. **The developer page for M2 is a launcher.** The learner page is M2's page, and it runs every milestone's checks with `?selftest`, so `dev/03-learner/` links to it (plain, with the checks, and at each lesson) instead of copying its markup.
5. **The step messages read for cards with no hole or one.** The heart's first card is blank: "hooks none have lifted" became "Shed open: no warp end is lifted, so the weft will lie over the whole warp."

## M2 acceptance spec

J2-1 to J2-6 are tests in `tests/accept/m2.accept.test.js` and checks in the learner page's `?selftest`; J2-7 to J2-9 drive the page itself and run only in the browser. Random pictures come from a seeded generator, so runs repeat.

| ID | Statement | Kind |
|---|---|---|
| J2-1 | Direct reading: card p is the picture's row p from the bottom (each repeated per picks-per-row), a dark pixel a hole, invert and repeat as set; woven on the loom, the cloth shows the picture the right way up; a picture wider than the head is refused with a reason. | logic |
| J2-2 | Floats: every run of weft over more than the limit (default 8) along a pick, and of warp along an end, is found exactly once, and nothing else; a blank row of a direct picture is a weft float across the whole cloth. | logic |
| J2-3 | Damask: each pixel is k × k threads, figure in warp-faced and ground in weft-faced 8-end satin (each end lifted once in 8 picks, no two points touching); no float is longer than 8 threads in the presets at k = 1 to 4, nor in any picture at k = 2 to 4; a picture too wide for 64 hooks is refused with a reason. | logic |
| J2-4 | An image is reduced in the page to the picture's size by averaging each block, transparent counts as white, and the threshold decides what is dark. | logic |
| J2-5 | Lessons L1–L7 each open with cards that fit a head, steps, a notice and a question; woven through the loom's own steps, each lesson's cloth shows its point; the twill reversed and the satin stepped by two show that they differ. | logic |
| J2-6 | The helper chooses the smallest head that fits (or the one set), and a 16 × 16 picture weaves in both modes: 16 cards on 16 hooks directly, 64 on 64 as damask; a reading that does not fit is refused, saying what it needs. | logic |
| J2-7 | The dock shows one of lessons, picture helper and about at a time, and the cards, the head, the cloth, the transport and the status line stay on screen with each. | page |
| J2-8 | Each lesson, opened from the dock, puts its own cards and tie on the loom at the first card with no cloth, shows its question, and says so in the status line. | page |
| J2-9 | On the page, the heart read directly puts its 16 cards on a 16-hook loom, bottom row first, and weaves the heart; its floats are reported and marked; as damask it puts 64 cards on 64 hooks with none marked; a reading that does not fit greys the button and says why. | page |

V-1 and V-2 (the labels, from M1) run on the learner page too, in each view of the section and with each tab of the dock open.

### Results (2026-10-26)

| ID | Result |
|---|---|
| J2-1 | 352 readings of 44 pictures (4 presets, 40 random up to 32 × 16) |
| J2-2 | 60 random cloths (915 floats) match a slow count |
| J2-3 | 176 readings; longest float 8 in the presets and in 40 random pictures at k = 2 to 4 (11 at k = 1; the heart read directly: 16) |
| J2-4 | A square, a transparent image, a grey ramp at three thresholds, an image smaller than the picture |
| J2-5 | 7 lessons woven (61 picks); 2 variants differ as taught |
| J2-6 | 16 × 16 heart: 16 cards on 16 hooks directly, 64 on 64 as damask |
| J2-7 to J2-9 | Pass at 1920 × 1080, 1100 × 900 and 375 × 812 (phone, no sideways scroll) |

In the browser: the learner page's `?selftest` 33/33 at those sizes, `dev/02-loom/?selftest` still 24/24 after the page shell moved; the heart put on the loom from the helper and played; `?lesson=L3` opened the twill.

## Not in M2 (M3 and later)

The 3D core units and the ghosted whole machine (M3, M4), lessons L8–L10, printing cards at true size, more languages, and a test with a teacher.
