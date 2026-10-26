# M4 notes: the ghosted whole machine and the teaching pass

- **Status:** built 2026-10-26. The M4 spec below passes in `pnpm test` (J4-1 to J4-5) and in the browser: on the learner page with `?selftest` (every milestone's checks, 50 in all, the 3D ones on the files the page loads) and on [`dev/05-machine/`](../dev/05-machine/) with `?selftest` (the M3 and M4 checks and J4-9, 15 in all).
- **Pages:** the learner page, [`index.html`](../index.html), now has **Parts in 3D** in its mechanism pane (`?view=3d` opens it); [`dev/05-machine/`](../dev/05-machine/) is the whole loom in 3D on its own.
- **Not done from the plan's M4 row:** "tested with a teacher" and "more languages". Both need people, not code; the page is ready for the first.

## What M4 adds

| Requirement (plan §5, §6, §4.4) | Where |
|---|---|
| The ghosted whole machine | `assets/context.glb`, built by `build_context()` in `blender/scripts/build_units.py`: the loom's frame (posts, rails, the bearers the head stands on), the beams (breast beam, back rest, cloth beam, warp beam), the head's housing, the comber board and the cloth, low-poly and translucent, at the research's overall sizes (members estimated). The five units load unchanged inside it, since they were built in the machine frame (M3). |
| The repeat bands | Four translucent orange blocks in `context.glb`, each with its label, a note and the unit it stands for: 208 hooks like U1's, 208 needles and springs, 832 harness cords, mails and lingoes like U4's, 832 warp ends like U5's (Posselt's 200-hook head, 26 × 8, with a 4-repeat tie). Their labels follow them on screen, stacked so they never overlap, and kept inside the view. |
| Fly-to | Clicking a unit, or a band's label, in the whole loom flies the camera to that unit and opens it alone (`js/scene/unitsView.js`); the bar above the view goes back to the whole loom. |
| Parts in 3D on the learner page | `js/app/parts3d.js`, loaded the first time the learner chooses **Parts in 3D**, so a learner who never opens it never downloads three.js or the models. It takes the section's place and the side view's room (the 3D loom shows the side anyway); the section's own controls go with the section, so no control has two homes (plan §6). The cards, the bench, the cloth, the front view, the transport and the status line stay. The parts are posed at every redraw, U1 and U4 showing the followed hook. |
| Lessons L8–L10 | In `js/teach/lessons.js`: **L8 Debug the deck** (two repeats of the twill with two cards swapped and a hole missing; the flaws in the cloth lead to them), **L9 A program, but not a computer** (a loop of three cards; the cloth repeats with it, whatever is done; Lovelace's Notes A to C on what the Engine added), **L10 Make a real card** (prints the deck on the loom at true size: `js/teach/printCards.js`, A4, four cards to a page, every punched hole black to cut out). |

## Decisions made while building

1. **The bands count the reference head, not the learner's.** The learner's head has 8 to 64 hooks; the ghost is the reference machine (at first Posselt's 200-hook head, 208 hooks; since the change below, the 400 head of the Spitalfields loom).
2. **The warp is 600 mm (24 in) wide and the frame 1,500 mm, both estimates.** At first the warp was 800 mm in a 1,400 mm frame, and J4-2 found the shuttle running out through the frame's side: a 300 mm shuttle needs a box on each side of the warp. A 24 in warp is a common width for figured silks on the hand loom; the frame is the museum loom's class. Both are marked as estimates in `params/machine.json`.
3. **The 3D view on the learner page is loaded on demand,** with a dynamic `import()` that the page's import map versions like any other module.
4. **L9 quotes Lovelace and claims no more than the research has.** It says what the Engine added in her own terms (operation and variable cards, the store and the mill, "backing"), and does not say the loom could branch or count.
5. **L10 prints whatever deck is on the loom,** not only its own: a learner's own picture prints the same way.

## Changed after M4: the reference head (2026-10-26)

The maintainer compared the whole-loom view with a photo of a Jacquard loom (a carpet loom by Carl Engel, about 1860, Deutsches Museum) and found the head small for the loom. Part of that is the photo's machine, a carpet loom with a bigger head; but part was ours. The frame was the Science Museum's Spitalfields loom (1914-469), whose head has **400 needles**, while the ghost held Posselt's 200-hook head; and the ghost left out what gives a head its bulk. Now:

- **The ghost is a 400 head** (params `reference_head`): Posselt's parts extended to 52 cross-rows of 8, two of them reserve (416 needles; Nelson), Barlow's "ordinary 400-needle machine" of the silk hand loom. The housing is twice as deep (about 440 mm), and the bands count 416 hooks, 416 needles and springs, and 1,600 harness cords, mails, lingoes and warp ends (400 working hooks in a straight tie of 4 divisions: the research's own worked case).
- **The head has its own frame,** standing on the loom's bearers up to the loom's catalogued height (3,050 mm), and a **card rack** carries the chain off the cylinder's outer side, out past the loom's side, where it hangs (Posselt Fig. XVII; sizes estimated).
- **U3's knives (400 mm) and U2's cylinder (450 mm, 52 columns of bores) are the 400 head's.** The learner's card (8 to 64 hooks) lies on the cylinder's middle columns, and the page puts the cylinder's pegs at its peg holes (`CylinderPegs` in `js/scene/cards3d.js`); U1's face stays a slice for the learner's card.
- **Not changed: the head lever.** Nelson's overhead lever is 10½ in : 25 in, but in this frame its long arm has nowhere to go: forward, its cord would hang through the woven cloth; backward, it would land too near the treadle's pivot to give it a stroke. The photo's lever runs sideways over the card rack, which would mean redesigning the lift. The lever keeps its estimated equal arms.
- The learner's 2D head (8 to 64 hooks) is unchanged: the ghost shows the full-size machine it stands in for.

## M4 acceptance spec

J4-1 to J4-5 are tests in `tests/accept/m4.accept.test.js` (on the files in `assets/`) and checks in both pages' `?selftest`; J4-6 to J4-8 drive the learner page, and J4-9 the M4 page, in the browser only.

| ID | Statement | Kind |
|---|---|---|
| J4-1 | The ghosted machine holds the frame, the beams, the head's housing and frame, the card rack and chain, the comber board and the cloth, translucent and named, and four repeat bands, each naming its unit and its count for the reference 400 head (416 hooks and needles = 52 × 8; 400 working hooks × 4 repeats = 1,600 ends). | contract |
| J4-2 | Every unit stands inside the ghosted loom through a whole pick, and U1's needle, hook and knife inside the head's housing; the treadle stays above the floor. | 3D placement |
| J4-3 | Each repeat band holds the parts its unit shows one of, wherever they move in a pick: the hooks band U1's hook, the needles band its needle and spring, the harness band U4's cords, mails and lingoes, the warp band the warp ends of U4 and U5. | 3D placement |
| J4-4 | The ghosted machine has under 10k triangles, and all the 3D files together are under 3 MB. | budget |
| J4-5 | Lessons L8–L10 weave their points: L8's deck has one swapped pair of cards and one missing hole, and the corrected deck weaves clean; L9's cloth repeats with its loop; L10's cards print at true size on A4, every punched hole filled and every blank ringed. | logic |
| J4-6 | On the learner page, Parts in 3D takes the section's place (its controls go with it) while the cards, the bench, the cloth, the front view, the transport and the status line stay; the parts follow the loom and the followed hook; each unit opens alone and the whole loom shows the ghost with every unit. | page |
| J4-7 | In the whole loom every band's label is shown inside the 3D view, clear of the others, and opens its unit. | page |
| J4-8 | Section (2D) brings the section and its controls back. | page |
| J4-9 | On the M4 page, the whole loom shows the ghost, every unit and the band labels clear of each other; a band's label opens its unit alone, and the list brings the whole loom back. | page |

### Results (2026-10-26)

| ID | Result |
|---|---|
| J4-1 | 5 shell parts, 4 bands |
| J4-2 | 205 unit-moments; the head's housing 340 × 276 × 586 mm |
| J4-3 | 1,107 part-points over 41 moments |
| J4-4 | 416 triangles; the six files 313 kB in all |
| J4-5 | 3 lessons; 24 cards printed over 8 head sizes |
| J4-6 to J4-8 | Pass on the learner page at 1920 × 1080, 1440 × 900 and 375 × 812 (phone, no sideways scroll) |
| J4-9 | 4 band labels |

The learner page's `?selftest` passes 50/50 at those sizes (M0 10, M1 12, M2 9, the labels 2, M3 9, M4 8). As for M3, the browser pane used for checking was hidden, so camera flights were checked by rendering frames directly rather than watched.

## What is left

- **A test with a teacher** (the plan's acceptance for M4): run a lesson in a class and note what confuses.
- **More languages:** the lessons, the dock and the status line are English only; the strings are in `js/teach/lessons.js` and the page modules.
- **The S-iron** (M3 decision 4) once the cycle's timing is settled.
- **Publishing:** the learner page moved to its own public repository, as the Leibniz simulator did (plan §9); done on 2026-10-26, with this repository.
