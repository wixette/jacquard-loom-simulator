# Simulator plan: Jacquard loom, 2D first, with 3D core units

- **Status:** written 2026-10-25. M0 (the logic and one cross-row in 2D) built 2026-10-25 ([notes](m0-notes.md)); M1 (the whole 2D machine) built 2026-10-25 ([notes](m1-notes.md)); M2 (the picture helper, the lessons and the learner page) built 2026-10-26 ([notes](m2-notes.md)); M3 (the 3D core units) built 2026-10-26 ([notes](m3-notes.md)); M4 (the ghosted whole machine, Parts in 3D, lessons L8–L10) built 2026-10-26 ([notes](m4-notes.md)), except its test with a teacher and more languages.
- **Inputs:** [`../research/REPORT.md`](../research/REPORT.md), [`../research/data/machine_spec.json`](../research/data/machine_spec.json), [`../research/data/component_inventory.csv`](../research/data/component_inventory.csv), [`../research/data/operation_cycle.json`](../research/data/operation_cycle.json), decision [0001](decisions/0001-2d-first-with-3d-units.md).

## 1. Goal and success criteria

Students make a Jacquard loom weave. They punch a chain of cards (or let a helper turn a small picture into cards), watch a single-lift Jacquard head read each card and lift the threads it selects, and see the cloth that results, thread by thread. Afterwards they can look at each core unit in 3D, at its real size and in its place in the machine, and learn the mechanical idea behind it.

The machine is "a Jacquard head as used on silk hand looms, c. 1810s–1900" (research §2), never labelled "Jacquard's 1804 loom".

The simulator is done when:
1. **Students can program it.** They punch, edit, reorder and loop cards in 2D. A picture of up to 16 × 16 pixels (and larger, up to the hook count) becomes a deck in one step.
2. **They can see why the cloth looks as it does.** Any thread in the cloth traces back to its pick's card, its hole, needle, hook, cord and warp end, and the pick cycle can be played, paused and stepped forwards and backwards.
3. **It teaches.** Guided lessons show the typical weaves (plain, twill, satin), a picture, a picture in damask, loops and repeats, each with its cards. It says plainly what the machine cannot do.
4. **The 3D units are true and readable.** Each unit is at Posselt's documented size, moves as the simulation says, and has nothing passing through anything else. The ghosted whole machine puts each unit in its right place.
5. **It is light.** The 2D page needs no WebGL. The 3D views total well under 50 k triangles and 3 MB, and run on a school Chromebook.

## 2. Conventions (the project's rules, as this machine uses them)

- **Units:** `params/machine.json` in millimetres and degrees. Posselt gives inches; each entry keeps them in its note. Blender in metres with the display in mm; glTF and three.js in metres.
- **Every value carries a source and a confidence** (`doc`, `drawing`, `derived`, `photo`, `est`), from the research spec.
- **Machine frame (Blender, Z up):** origin at the centre of the loom's footprint on the floor. +X runs left to right as the weaver sees the loom from the bench; +Y away from the weaver, toward the warp beam; +Z up.
- **Node names** come from the research inventory (`hooks.hook.N`, `cylinder.prism`, `griffe.frame`, `harness.mail.E`, …). A unit model holds one of each, with index 0. They are looked up through `gltfName()`, because three.js strips the dots.
- **Every moving part is its own object** with its origin on its axis, and the code sets one scalar on it. Parts that need two motions are nested objects with one scalar each: a hook tilts (pushed off its knife) inside a parent that rises (lifted); the cylinder prism turns inside the batten that swings out.
- **Web stack:** plain JavaScript ES modules with JSDoc, checked strictly, no build, tests on `node --test`; three.js vendored and reached through import maps when the 3D work starts (M3). `tsconfig.json`, `tools/vendor.mjs`, `tools/stamp.mjs` and their tests follow the earlier simulators.
- **Self-contained repository:** links only inside the repository or to public URLs.

## 3. Architecture

```
 params/machine.json ─┬─► js/view2d/layout.js ──► js/view2d/*.js (SVG / canvas)
                      │        ▲  pure: shapes and positions from state
                      │        │
 js/sim/  (pure, no DOM, no three.js) ── state: deck, tie-up, colours, pick, phase φ, direction, cloth
   deck.js       cards as bit rows; edit, duplicate, reorder, loop
   tieup.js      warp end → hook (straight, straight × repeats, point)
   cycle.js      φ → every part's scalar (phases from research/data/operation_cycle.json); step stops
   loom.js       the machine: advance, reverse, weave a pick into the cloth
   design.js     bitmap → deck (direct, damask), float lengths
   link.js       state ⇄ URL (a public contract, own test)
                      │
                      └─► blender/scripts/build_unit_*.py ──► assets/unit-*.glb, assets/context.glb
                                                                  │
                                         js/scene/ (three.js) ◄───┘  one scalar per node, from cycle.js
```

- **The simulation is the truth.** Both views only reflect it. A cloth row is the tie-up applied to the current card, so the logic is short; the care goes into the cycle timing, the step stops, reversing and the edge cases.
- **The 2D views are drawn from a pure layout function** (`js/view2d/layout.js`): state in, shapes and positions out, in params millimetres. The SVG and canvas code only draws them. This is what makes the 2D views testable in Node (§8), as the `.glb` makes the 3D views testable.
- `js/view2d/` is a folder the usual web-stack layout does not list; it sits beside `js/scene/`, and like `js/sim/` it never imports three.js.

## 4. The 2D machine (the primary surface)

### 4.1 Hooks, cards and the hole convention

- **Hook count is a parameter:** 8 × c hooks, c = 1 to 8 (8 to 64 hooks). The default is **16 hooks** (c = 2), so a 16 × 16 picture fits one end per hook.
- **A card is drawn as the real card:** 8 hole rows (one per needle tier) by c columns (one per cross-row), with a peg hole at each end, laced to its neighbours. Hook h sits in column ⌈h/8⌉, row ((h − 1) mod 8) + 1 (research §4).
- **The same card is also shown "unfolded"** as a strip of h holes lined up over the warp ends, and students can punch on either. Showing both is the lesson: the card is folded eight deep to fit the machine, and every hole has an address.
- **One fixed convention, always on screen:** **hole = 1 = warp end lifted.** A blank pushes its needle and hook back, so the end stays down (all five period texts agree, research §4).

### 4.2 The panels

| Panel | Shows | Interaction |
|---|---|---|
| **Cards** | The chain as a vertical list of laced cards; the registered card highlighted at the cylinder; a loop marker when the chain is closed | Punch or unpunch a hole by clicking it (with a short punch animation); add, duplicate, delete, move, invert a card; close or open the loop |
| **Head section** | A side section through one cross-row, to scale from Posselt: 8 needles in their tiers with their springs, 8 hooks, 8 knives of the griffe, the bottom board, the cylinder face with the card on its batten | Pick which cross-row is shown; click a hook to follow it |
| **Loom, front** | The harness fanning from the hooks to the warp ends across the width; mails and lingoes; the raised and lowered ends; the shuttle crossing through the shed; the fell of the cloth | Click a warp end to follow it |
| **Loom, side** (small) | Treadle, head lever, griffe lift, the shed opening, the batten swinging back and beating | — (shows the rhythm) |
| **Cloth** | The woven cloth, first pick at the bottom, growing one row per pick: each cell drawn as a warp or weft float with thread shading; front or back; a 0/1 matrix overlay | Click a cell to trace it; choose warp and weft colours |

- **The trace:** clicking a cloth cell, a hole, a hook or a warp end highlights the whole path in every panel: card → hole → needle → hook (the section jumps to its cross-row) → neck cord → harness cord → mail → warp end → cell. This is requirement 2 of §1.
- **The cycle controls:** play and pause, speed, Step ▸ and Step ◂, Reset machine. Each step stops at the next moment a visible change has just completed (the project's rule):
  1. **Hooks taken:** the knives have caught the selected hooks.
  2. **Shed open:** the selected ends are up; the cylinder is out and has turned to the next card.
  3. **Shuttle across:** the weft is laid in the shed.
  4. **Beaten up:** the pick has joined the cloth.
  5. **Shed closed:** the hooks have landed; the cylinder is back at the needle points.
  6. **Next card pressed:** its blanks have pushed their needles and those hooks off the knives; the griffe is at rest. This is where the next pick starts.

  (Order as documented: the card is pressed after the hooks land and before the griffe is at rest; M0 notes, decision 1.)

  The phase boundaries come from `research/data/operation_cycle.json`. The order is documented; the hand-loom fractions are estimates and stay visible as such in the params.
- **Reversing** steps backwards through the same stops and unweaves the last pick exactly. On the real loom the reverse cord turns the cylinder back for the next lift, which re-weaves the previous card; the page names this simplification where it is met.

### 4.3 The picture helper ("reading in")

Yes, a small bitmap can become cards, and this is historically what happened: the designer painted the figure on point paper, one square per thread, and a reader (*liseur*) transferred it to the card-cutting machine, one card per row. The helper is that reader.

- **Input:** draw on a grid; open an image file (it is reduced and thresholded in the browser, never uploaded); or pick a preset (arrow, heart, letters, a tiny portrait).
- **Direct mode:** column x → warp end x → hook x (straight tie); row y counted from the bottom → card y; a dark pixel → a hole → the warp end over the weft. A 16 × 16 picture becomes 16 cards on a 16-hook head. Options: invert, picks per pixel row (1 or 2, since weft and warp densities differ), repeat across the width through the tie.
- **The catch, taught rather than hidden:** a direct picture has **floats** as long as its runs of one colour. A blank row is one weft thread lying loose across the whole cloth, which would not hold together. The helper measures the longest float and marks every float over a limit (default 8 threads).
- **Damask mode,** which is how real Jacquard pictures were made (the woven portrait of Jacquard among them): each pixel becomes a block of k × k threads; figure blocks are woven in warp-faced 8-end satin, ground blocks in weft-faced 8-end satin. Floats stay about as long as the satin's own (7 threads; a little longer where block edges meet), and the picture shows by which threads lie on top. A 16 × 16 picture at k = 4 needs 64 hooks and 64 cards, within the hook range.
- **The result is an ordinary deck:** students can open, edit and weave it like any other, and see the reading step happen card by card.

### 4.4 Lessons (the guided set)

Each lesson opens the machine in a state (by a link, §4.5) with its cards, says what to do and what to notice, and asks one question. The minimal set covers the four requirements:

| # | Lesson | Cards | What it shows |
|---|---|---|---|
| L1 | **One card, one row** | 1 | What a hole does: step through one pick with the trace on |
| L2 | **Plain weave** | 2 | Two cards alternate: the simplest cloth |
| L3 | **Twill** | 4 | Each card shifts the holes by one: a diagonal; reversing the order flips it |
| L4 | **Satin** | 8 | Holes step 3 each card: a smooth face. Then step 2, which does not work: why the step must share no factor with 8 |
| L5 | **A picture** | 8 | The research's arrow: the first card is the bottom row |
| L6 | **Your picture** | 16+ | The helper: direct mode, find the floats, then damask |
| L7 | **Loops and repeats** | 4 | Close the chain to weave 40 rows from 4 cards; repeat across the width with the tie; mirror it with a point tie |

Later lessons from the research's ranked list: L8 *debug the deck* (a swapped card, a missing hole), L9 *not a computer* (Lovelace's Note A, what the machine cannot do: no branching, no arithmetic, nothing written back), L10 *make a real card* (print the deck at true size, punch and lace it).

### 4.5 Links

A link encodes the hook count, the tie, the colours, the deck, the loop, the pick and the view, so worksheets can open the machine in a state ("debug this deck"). The format lives in `js/sim/link.js` with its own test. **A link is a public contract:** fields may be added, never renamed, dropped or read differently.

## 5. The 3D core units

Each unit is one Blender build script and one small `.glb`, from `params/` at Posselt's dimensions, with one of each part (decision 0001). The page shows a unit on its own, turnable, with its moving parts driven by the same cycle scalars as the 2D views. If a hook is followed, the unit shows that hook's state (selected or not) for the current card.

| Unit | Parts (inventory node names) | Motion | The mechanical idea it teaches |
|---|---|---|---|
| **U1 Selector** | the cross-row's 8 needles `needles.needle.0`–`7` and springs, `hooks.hook.0` (rising parent and tilting child) on `selector.row`, `griffe.knife.0`, slices of `head.needle_board`, `head.bottom_board`, `springs.box`, the cylinder's face with the real facing card (made by the page), its column for the followed hook at the needles | needle in or pushed back; hook tilt; hook rise | **Selection by displacement and mechanical amplification:** a light needle decides, a heavy rising knife does the lifting. Spring return. The needle's eye round the hook. |
| **U2 Card cylinder** | `cylinder.batten`, `cylinder.s_iron`, `cylinder.prism` with `cylinder.lantern.0`, two pegs, `cylinder.hammer`, `cylinder.catch_top`, `cylinder.catch_bottom`; three laced cards | batten swing; prism turn; hammer; catches | **Indexing:** a catch on a square lantern turns the prism a quarter turn, like a ratchet and pawl; the spring hammer squares it, a detent. **Cam timing:** the S-iron slot turns the griffe's lift into "out, turn, in". Registration on the pegs. |
| **U3 Griffe and lift** | `griffe.frame`, its 8 `griffe.knife.N` as one rigid part, `griffe.plunger`, `lift.head_lever`, `lift.cord`, `lift.treadle` | treadle; lever; griffe rise | **The lever:** the weaver's foot powers every lift; the head lever's arms trade force for stroke (about 3½ in of lift). |
| **U4 Harness line** | `harness.neck_cord.0`, a slice of `harness.comber_board`, two `harness.cord.0.R` (one repeat), `harness.mail.0`, `harness.lingo.0`, `warp.end.0` | rises with its hook; lingo falls back | **Fan-out and gravity return:** one hook drives one end in every repeat; the comber board spreads the cords to the width of the warp; the weights pull everything back down. |
| **U5 Shed, shuttle and batten** | one raised and one lowered end, the two warp sheets as translucent planes, `batten.frame` with `batten.reed`, `shuttle.body` | shed opens; shuttle crosses; batten beats | **The shed:** why the shuttle can pass, and how beating packs each pick into the cloth. |

**The ghosted whole machine** (`assets/context.glb`): a low-poly, translucent shell of the loom frame, beams, batten and head housing, at the research's overall sizes (Science Museum loom 1914-469; estimated members, labelled as such). The five units sit inside at their true positions. Where the real machine repeats a unit, a translucent band marks the block with its count ("208 hooks like this", "1,600 warp ends like this"). Clicking a unit flies to it and opens it alone.

**Budget:** each unit under 10 k triangles, the shell under 10 k, all `.glb` files together under 3 MB. No instancing is needed.

## 6. The page

*(For the public app, the lessons become a step-by-step tutorial and four mini games join it: [public-app.md](public-app.md).)*


The learner page follows the maintainer's simulator practices (P1–P10, in [docs/ui-design.md](../docs/ui-design.md)):
- **The 2D machine is the primary surface** and is always on screen: cards, the mechanism, the cloth.
- **The mechanism panel has one view switch:** *Section* (2D) or *Parts in 3D* (the units and the ghosted machine). The 3D view replaces the 2D section while it is shown, so no control has two homes. The cards and the cloth stay in view either way.
- **Lessons, the picture helper and "about this machine"** share one dock, one at a time.
- **One status line** says what just happened ("Step: shed open; hooks 2, 4, 5 and 7 lifted") and why something is greyed.
- **Simplifications are named** where they are met: the hand-loom timing is estimated; reversing unweaves exactly; the head is a typical head, not Jacquard's own.

## 7. What is simplified, and why

| Simplification | Why |
|---|---|
| The phase fractions of the cycle are estimates | No period source times a treadle Jacquard (research §4); the order of events is documented |
| Reversing unweaves the last pick | The real reverse cord re-weaves the previous card; exact undo is what a learner needs to experiment |
| Cords and warp ends are straight lines | They hang taut under the lingoes, so this is physically right (research §5) |
| The cloth is drawn, not simulated | The weave structure is exact; the yarns' bending is not modelled |
| One shuttle at a time; colours per warp and per weft | Several shuttles per pick (brocading) is out of scope for the first version |

## 8. Testing

The project's four layers, with a 2D layer in place of the model checks until M3:

| Layer | Question | Where |
|---|---|---|
| 1. Logic | Do the cards make the right cloth? | `tests/sim/*.test.js` |
| 2. Cycle | Is every part's scalar right for each φ, and in the documented order? | `tests/sim/*.test.js` |
| 3a. 2D layout | Do the drawn shapes show what the simulation says, without overlapping where they must not? | `tests/accept/*.accept.test.js` on `js/view2d/layout.js` |
| 3b. 3D geometry (from M3) | Do the unit models sit, touch and clear correctly when posed by the page's code? | `tests/accept/*.accept.test.js` on `assets/*.glb` |
| 4. Visual | Does it look right and read clearly? | by hand on the developer pages |

Each milestone has a developer page (`dev/NN-name/`) with Reset machine, the step controls and a `?selftest` mode running the milestone's checks on screen.

### 8.1 M0 acceptance spec

Each statement becomes one test, named by its ID, and one `?selftest` check. Scripted decks: plain (2 cards), the arrow (8 cards, research worked example), a fully cut card and a blank card.

| ID | Statement | Kind |
|---|---|---|
| J0-1 | **Selection:** at stop 1 of every pick, needle n is pushed back exactly when the registered card is blank at n, and its hook is off its knife exactly then. | logic |
| J0-2 | **Lift:** at stop 3, warp end e is up exactly when the card has a hole at hook `tieUp(e)`, for a straight tie with 1 and 3 repeats and for a point tie. A blank card lifts nothing; a fully cut card lifts every end. | logic |
| J0-3 | **Cloth:** after k picks, cloth cell (row i, end e) is warp-over exactly when card i (mod the chain length, if looped) has a hole at `tieUp(e)`. The arrow deck weaves the arrow of the research example. | logic |
| J0-4 | **Order:** for every φ, the cylinder does not leave the needles before the knives have taken the hooks, the shed is fully open throughout the shuttle's flight, and the next card is pressed before the griffe lands (research §4). | cycle |
| J0-5 | **Index and loop:** the registered card advances by one per pick, wraps on a looped chain, and refuses to run past the end of an open chain, saying why. | logic |
| J0-6 | **Reverse:** n steps forward then n steps back restore the cloth and every part's scalar exactly; stepping back at pick 0 is refused with a reason. | logic |
| J0-7 | **Step stops:** every step changes something visible, and is one of the six named stops in order. | cycle |
| J0-8 | **Section readout:** at sampled φ, every needle, hook, knife and mail in the 2D layout is at the position the cycle gives (± 0.1 mm in params units), and the highlighted hook is the followed one. | 2D readout |
| J0-9 | **Section clearance:** at sampled φ, an unselected hook's crook clears its knife (≥ 0.5 mm) and a selected hook's crook sits on it (≤ 0.3 mm), in the layout's own geometry. | 2D contact + clearance |
| J0-10 | **Needles move with the card:** at 2,000 moments of each pick, no needle is pushed further than the card on the cylinder reaches, and no needle or hook moves more than 1 mm between moments, within a pick or from one pick to the next. (Added 2026-10-26.) | 2D readout |

The M1 spec is in [m1-notes.md](m1-notes.md); the M2–M4 specs are written in each milestone's notes when its design starts.

## 9. Milestones

| M | Deliverable | Exit criteria |
|---|---|---|
| **M0: the logic and one cross-row in 2D** | `js/sim/` (deck, tie-up, cycle, loom, step stops, reverse) with tests; `js/view2d/layout.js`; the head section of one cross-row (8 hooks); a plain card editor; the cloth as a 0/1 grid; `dev/01-section/` | The M0 spec (§8.1) passes in `pnpm test` and in `?selftest` |
| **M1: the whole 2D machine** | Hook counts 8–64; the chain editor (add, duplicate, delete, move, invert, loop) with the real and the unfolded card; straight, repeated and point ties; the loom front and side views; the woven cloth (front, back, colours); the trace; links (§4.5); `dev/02-loom/` | Every requirement of §1.2 met in 2D; link round trips tested |
| **M2: the picture helper, the lessons and the learner page** | The helper in direct and damask modes, with float marking; lessons L1–L7 (English); `index.html` as the first public-ready page (2D only) | A 16 × 16 picture weaves in both modes; the lessons open in their states; the page meets §6 |
| **M3: the 3D core units** | U1–U5 built from params; each shown alone, driven by the cycle; the *Parts in 3D* view; `dev/03-units/` | Contract, readout, contact and clearance checks on each `.glb` (needle through the hole when there is one, crook on the knife, card on the pegs, prism a quarter turn per pick); budgets met |
| **M4: the ghosted whole machine and the teaching pass** | `context.glb` with the units in place and the repeat bands; fly-to; lessons L8–L10; tested with a teacher; more languages | A teacher has run a lesson with it |

The 2D learner page is usable at the end of M2, before any 3D exists.

## 10. Risks and open questions

| Risk / question | Mitigation |
|---|---|
| The section is crowded at 8 hooks and 8 needles in Posselt's true proportions | Draw to scale, with a "spread" toggle that opens the spacing for legibility; the followed hook is always highlighted |
| The real card (8 × c) is less obvious than a strip of holes | Show both, punchable on either, and make the folding a lesson point (§4.1) |
| Damask at 64 hooks makes a long chain of cards | The chain list scrolls and groups cards in eights; the helper shows the reading step card by card only on request |
| Students take the estimated timing as fact | The params mark it `est`; the page names it (§6) |
| Hook crook, knife bevel and S-iron are drawn but not dimensioned by Posselt | Scale them from his quarter-size figures (research §9, step 1) before M0's section and M3's units; record as `drawing` |
| The loom frame is estimated | It appears only as the ghosted shell (M4), low-poly and labelled; the measuring session (research §9) can upgrade it |
| Where the learner page will live | Its own public repository, as Leibniz has (done 2026-10-26: this repository) |
