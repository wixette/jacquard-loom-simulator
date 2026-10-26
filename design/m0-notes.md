# M0 notes: the logic and one cross-row in 2D

- **Status:** built 2026-10-25. The M0 spec (plan §8.1) passes in `pnpm test` and on the page with `?selftest`.
- **Page:** [`dev/01-section/`](../dev/01-section/)

## What M0 is

An eight-hook Jacquard head (one cross-row of a real 8-row head) drawn in side section to Posselt's dimensions, with a chain of eight-hole cards the student punches and a 0/1 cloth that grows pick by pick. The machine logic, the cycle and the 2D layout are pure modules, so everything the page shows is tested in Node.

| Module | What it does |
|---|---|
| `js/sim/params.js` | Reads `params/machine.json` (every value with its source and confidence) into plain numbers |
| `js/sim/deck.js` | The chain: cards as rows of holes; edits that return new decks; open or looped; the presets (plain, 2/2 twill, 8-end satin, the research's arrow, blank, fully cut) |
| `js/sim/tieup.js` | Warp end → hook: straight (with repeats) and point ties |
| `js/sim/cycle.js` | One pick as functions of φ: griffe height, cylinder out and turned, shuttle, batten |
| `js/sim/head.js` | The selection: which needles a card pushes, which hooks are caught, lifted or held aside |
| `js/sim/loom.js` | The machine: pick and φ, the six step stops, reversing, the cloth, refusals with reasons |
| `js/view2d/layout.js` | The section as shapes in mm: needles, springs, hooks, knives, the cylinder with its cards, the harness to the mails |
| `js/view2d/sectionView.js`, `cardEditor.js`, `clothGrid.js` | Drawing only: SVG and HTML from the layout and the snapshot |
| `js/accept/m0Checks.js` | J0-1 to J0-9, shared by `tests/accept/m0.accept.test.js` and `?selftest` |

## Decisions made while building

1. **The step stops follow the documented order,** which puts the card press after "shed closed": hooks taken (φ 0.06) · shed open, cylinder turned (0.32) · shuttle across (0.55) · beaten up (0.66) · shed closed, hooks landed (0.92) · next card pressed, griffe at rest (1.0 = the next pick's start). The plan's list (§4.2) named the same six moments starting from "card pressed"; it is the same cycle.
2. **The card meets the needles at φ 0.93,** after the hooks have landed and before the griffe is at rest. Bradbury measured 0.931. Barlow (p. 157) has the card strike just *before* the hooks land, which needs springy hooks; M0's hooks are rigid, so they land first. Named on the page.
3. **A hook's crook tip must stay above its knife at rest.** With a 6 mm tip and the knife 4 mm under the crook, a needle pushing its hook dragged the tip through the knife (J0-9 found it). The tip is now 2 mm (est), and the card presses only once the knife is clear below the tip.
4. **Only unselected hooks are held aside by a passing knife, and only at the top.** On the way up, a pushed hook whose needle the cylinder has let go rests against the knife's face until the knife has passed; on the way down, the knife's bevel pushes every upright unselected hook aside until it springs back under the knife (Barlow p. 157). Selected hooks stand upright for their knife. The knife acts on the crook, so the hook bends above the top needle and **its needle does not move**: a needle moves only when the card touches it. The hook springs back smoothly as the knife goes on down below its crook. (Revised 2026-10-26: at first a held hook dragged its needle 10 mm back while the card was still about 26 mm away, and was released in one step just before the card pushed the blanks, so needles and hooks seemed to jump back and forth before the card arrived. J0-10 now checks it.)
5. **A pushed hook is drawn moving sideways above the grate** by its needle's stroke (12.7 mm). The real wire flexes. Tilting the whole hook about its foot would amplify the push about 1.5× at the crook, and drive the crook into the *next* knife (only 15.7 mm away at Posselt's pitch). The research estimated the hook's shift at the knife as about the needle stroke.
6. **The cylinder's swing is drawn as a slide,** and the harness is shortened and hangs straight down under its hooks. Both are named on the page. **The needles are drawn over the cylinder,** so a needle that goes into a hole is seen inside it, and a blank's needle stops at the card.
7. **Cloth already woven stays as woven** when a card is edited afterwards, as on a real loom. Reversing still unweaves exactly, because a row joins the cloth at the beat and leaves it when stepped back past the beat.
8. **An open chain that runs out** shows the empty cylinder face: no needle is pushed, so every hook would rise (Posselt: "an empty cylinder lifts every hook"). The next pick is refused with the reason.

## Estimated values M0 relies on

All are in `params/machine.json` with `conf: "est"` or `"design"`: hook 1's distance from the needle board (40 mm), the needles' height (top tier 300 mm), the crook's overhang (10 mm) and tip (2 mm), the knife's thickness (3.2 mm) and its rest gap under the crooks (4 mm), the needle board's thickness, the spring box, and the cycle's fractions. Scaling the crook and the needle tier from Posselt's quarter-size Figs. I and V (research §9, step 1) would turn most of them into `drawing` values.

## Results (2026-10-25)

| ID | Result |
|---|---|
| J0-1 | 4 decks, every pick, every hook |
| J0-2 | 564 warp ends over 3 ties; full lift 84.9 mm at the mails |
| J0-3 | The arrow deck weaves the research's arrow; plain over 3 ties |
| J0-4 | The card meets the needles at φ 0.930, the griffe 1.2 mm above rest |
| J0-5 | Refused past the end: "The chain has run out after 8 cards: close the loop, add cards, or step back." |
| J0-6 | 30 steps (5 picks) out and back restore everything; refused at pick 0 |
| J0-7 | 120 steps over 4 decks, each a visible change and the next named stop |
| J0-8 | 3,208 hook-moments drawn within 0.1 mm of the simulation |
| J0-9 | Every hook against every knife (all pairs): closest 0.94 mm; caught crooks on their knives within 0.000 mm; the turning cylinder 4.8 mm from the needle points |
| J0-10 | 2,000 moments a pick over 4 decks: no needle pushed further than the card reaches; the largest move of a needle or hook between moments 0.43 mm (added 2026-10-26) |
| V-1 | In the browser only: every label as shown, in each view, is 9–19 px tall, inside its drawing, uncovered and clear of the others; passed from 375 to 2560 px wide (added 2026-10-26, see m1-notes) |
| V-2 | In the browser only: no name label lies over a line or shape of its drawing, in each view; passed from 375 to 2560 px wide (added 2026-10-26, see m1-notes) |

## Not in M0 (M1 and later)

Hook counts above 8 and the real card (8 × c) beside the unfolded strip; the loom's front and side views; the woven-looking cloth with colours; the trace across all panels (M0 follows one hook through the section, the cards and the cloth); links; the picture helper; lessons.
