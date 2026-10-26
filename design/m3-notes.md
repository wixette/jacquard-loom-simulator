# M3 notes: the 3D core units

- **Status:** built 2026-10-26. The M3 spec below passes in `pnpm test` (J3-1 to J3-9, on the `.glb` files) and on [`dev/04-units/`](../dev/04-units/) with `?selftest` (with J3-10, the page's own).
- **Build:** `pnpm build:model` runs `blender/scripts/build_units.py` headless (Blender 5.2) and writes the five files to `assets/` (Git LFS). `pnpm vendor` copies three.js into `vendor/`.

## What M3 adds

| Requirement (plan §5) | Where |
|---|---|
| One build script, one small `.glb` per unit | `blender/scripts/build_units.py`, with a small helper library (`lib/bl.py`) shared with the maintainer's earlier simulators, its materials changed. Each unit is built from `params/machine.json` in one **machine frame** (new in params: X across the loom along the needles, Y front to back, Z up; a point (x, y) of the 2D section is (x, 1300, 2399 + y)), so M4's ghosted machine will hold the units where they stand. |
| One named node per moving part, driven by one scalar | glTF extras `motion` on each moving node (`translate`, `rotate`, `reach`, `stretch`, `show`, `segment`), bound by `js/scene/rig.js`. **Reach** is new: a straight piece from a fixed end to an end that moves by the scalar, turned and stretched so it stays joined; it makes the jointed hook (the bend above the grate takes the needle's push, the bend above the top needle takes the knife's hold), the cords through the comber board, and the warp ends through the mails. |
| The units, posed by the loom | `js/scene/units.js`: what each file holds, what it teaches, and `Unit.pose(snapshot, hook)`, which takes every value from the simulation and the 2D layouts (the head's state, the section's chain, the side view's batten), so the 3D parts move as the drawings do. |
| The cards, from the learner's chain | `js/scene/cards3d.js` makes the cards on and around the cylinder at runtime, placed where the 2D section's chain puts them, at their true size, with a dark disc for every punched hole in every column. |
| The page | `js/scene/unitsView.js` (one unit at a time, framed on its working parts, a part named under the pointer) and `js/scene/viewer.js` (shared with the earlier simulators, with `fit()` and translucent parts). [`dev/04-units/`](../dev/04-units/) shows a unit beside the 2D section at the same moment, with the transport, the deck and the hook the single-part units show. |

### The units

| Unit | Holds | Moves |
|---|---|---|
| U1 the selector | the 8 needles of a cross-row (point, eye round its own hook, rear loop) and their springs, the followed hook (jointed) with its knife at full length (it runs the head's depth, under that row's hook in every cross-row), slices of the bottom board, needle board (see-through) and spring box, the cylinder's face as long as the cylinder with its bores, and the card facing the needles (made by the page) | every needle by its own hole or blank; the springs squeezed; the hook lifted, pushed aside above the grate and held aside at its top, at the followed hook's place in the row; the knife with the griffe; the face out and back, slid along so the followed hook's column is at the needles; the card changes at the turn |
| U2 the card cylinder | batten (arms, axle), the prism (since M4's change, the 400 head's: 450 mm, 4 × 52 columns of bores; the page puts its 8 pegs at the learner's card's peg holes) and the lantern, the spring hammer under the lantern, the two catches (the upper one forward, the lower one reverse); the learner's cards | the batten out and back; the prism a quarter turn forward (clockwise seen from the front: the top card comes to the needles); the hammer, pressing from below, rides the lantern's lowest corner |
| U3 the griffe and the lift | griffe (8 knives, end plates), plunger, rod, head lever, lift cord, treadle | the griffe and rod up; the lever about its pivot; the treadle about its pivot; the cord between them |
| U4 the harness line | neck cord, a slice of the comber board, two harness cords (one per repeat), two mails, two lingoes, two warp ends | everything below the hook rises with it; the cords stay joined through the comber board; the ends pass through their mails |
| U5 the shed, the shuttle and the batten | a raised and a lowered end, the lower and upper warp sheets (translucent), the batten (race, reed, cap, swords), the shuttle | the raised end and the upper sheet rise at the mails; the batten back for the shuttle and forward to beat; the shuttle across on the race |

## Decisions made while building

1. **The units are built in the machine frame, not each at its own origin.** The page frames each unit on its working parts; M4 will load them unchanged inside the ghosted machine.
2. **U1 shows a whole cross-row's needles, and the real card.** *(Changed 2026-10-26; at first U1 had one needle at the top row showing the followed hook's state, so the hole always appeared at the same place on a tall card slice, which suggested every hole sits there.)* Each column of the card is read by the 8 needles of one cross-row, one per row, so U1 has those 8 needles and their springs, each moving with its own hole; the followed hook's needle is solid and the others lighter. The followed hook and its knife stand at its own place in the row (a parent node, `selector.row`). The cylinder's face slides along the cylinder (`cylinder.column`) so the followed hook's column is at the needles, and the page lays the facing card on it at true size, every punched hole dark and the followed one ringed (`FacingCard` in `js/scene/cards3d.js`). In the head each hook passes through its own needle's eye and beside the others, so the needles run 3 mm beside the hooks' line, each looping round its own hook, 1 mm clear of the rest. The needle board is drawn see-through: the column being read stands right behind it. "One of each part" is relaxed for the needles only, since the 8 rows are the point of the selector. Every hole position on the 3D cards (U1's and U2's) is shown, as on the 2D cards and the printed ones: punched holes dark, blank positions as faint rings, so a column always reads as 8 positions. The card's peg holes carry the cylinder's brass pegs (9.5 mm, the card's peg-hole size, for both U1 and U2), and the cylinder's bores are small and faint, as in the 2D section, so neither can pass for a punched hole. The 3D pages open on a 24-hook head (3 columns), following hook 12 (column 2, row 4).
3. **The cards are made in the page, not in Blender.** They are the learner's own; the chain near the cylinder is already worked out for the 2D section, so the 3D cards are placed from it and the two views cannot disagree (J3-5).
4. **The S-iron is left out.** The plan listed it: it drives the cylinder's batten from the griffe. But the cycle's timings for "out" and "back" are estimated separately (research §4: no source times a hand loom), and as functions of the griffe's height they differ by up to 15 mm; a rigid S-iron would show its roller leaving its slot. It returns when the timing is settled (the plan's open question on timing).
5. **The cylinder's batten slides, and the loom's batten slides on swords that reach to it,** as in the 2D views. A batten hung from 1.5 m above swings its race up by about 20 mm when pulled back 300 mm, which with the estimated frame would lift the race into the warp; the slide keeps the race level. The swords lengthen by under 2 % to stay joined. Named on the page.
6. **The cylinder is built for the 64-hook card.** A smaller card registers on the first column and the first peg; its second peg hole falls short of the cylinder's second peg.
7. **The warp runs level through the mails in U4 and U5** (the 2D side view has the back rest 40 mm higher); a level warp makes the shed exact at the mails.
8. **Fixed in 2D along the way: the side view's shuttle and batten.** Planning U5 showed that M1's side view put the shuttle behind the reed (toward the mails), where the reed could not beat its weft into the cloth, and swung the batten back only 120 mm, where the shed is lower than the shuttle (by 3 mm). The shuttle now runs on the race in front of the reed, and the batten goes back to 900 mm (params `units3d.reed_back_y`), leaving 14.5 mm above the shuttle. J1-9 now checks both, and fails on the old drawing. The side view reads its sizes from the params it now shares with the 3D units.

## M3 acceptance spec

Each statement is one test in `tests/accept/m3.accept.test.js` (on the files in `assets/`) and one `?selftest` check on `dev/04-units/` (on the files the page loaded). The units are posed through the page's own code (`Unit.pose`) and measured through anchors the build writes (glTF extras), against the 2D layouts at the same moments.

| ID | Statement | Kind |
|---|---|---|
| J3-1 | Each unit's file holds its parts, every moving part one named node with its motion and a label (plan §5). | contract |
| J3-2 | U1 moves as the 2D section of the followed hook's cross-row: its 8 needles and springs, the followed hook (lift, push, held aside) at its own place, its knife, and the card on the cylinder's face, whose column for that cross-row is at the needles with every punched hole level and in line with its needle. | 3D readout |
| J3-3 | In U1 a caught hook rests on its knife, its crook spanning it; a hook not caught stands clear of the knife while the knife passes its crook, and no crook's tip goes through a knife; the hook passes inside its own needle's eye and beside the other seven needles; every needle bears on a blank and goes into the bore at a hole. | contact + clearance |
| J3-4 | U2: the cylinder turns forward by the cycle's quarter turn, its top face coming round to the needles; the spring hammer always presses from below on the lantern's lowest corner; at rest the card at the needles has every punched hole level with its needle at the needle board's face, and the pegs stand at the card's peg holes. | 3D readout + contact |
| J3-5 | U2's cards are the 2D section's chain: the same cards, in the same places and directions, fading as they do, the card at the needles marked. | 3D readout |
| J3-6 | U3: the griffe's 8 knives and its plunger rise by the griffe's lift; the rod joins the plunger to the head lever's back arm, which rises as much; the treadle's cord point drops as much (as in the 2D side view); the cord stays joined to the treadle and the lever and does not stretch. | 3D readout + contact |
| J3-7 | U4: as the hook rises, the neck cord, both harness cords (through the comber board), both mails and lingoes rise with it, and both warp ends pass through their mails; every cord stays joined end to end. | contact |
| J3-8 | U5: the raised end and the upper sheet rise at the mails by the shed's opening; the reed moves as in the 2D side view, beats up to the fell and never passes it; the shuttle is in the warp only while the shed is fully open, in front of the reed, on the lower sheet and clear under the upper one. | 3D readout + clearance |
| J3-9 | Each unit has under 10k triangles and the files together under 3 MB. | budget |
| J3-10 | On the page, each unit chosen from the list is shown alone and framed. | page |

### Results (2026-10-26)

| ID | Result |
|---|---|
| J3-1 | 5 units, 39 moving parts |
| J3-2 | 7,680 hook-moments over 3 decks (8 and 16 hooks), every position within 0.01 mm of the 2D section; 21,856 hole positions (U1 rebuilt with the cross-row's needles and the real card, 2026-10-26) |
| J3-3 | 4,620 caught and 1,596 passing hook-moments; a passing crook keeps at least 1.0 mm from its knife, and the hook 1.0 mm from the other needles |
| J3-4 | 720 moments; the hammer stays on the lantern to within 0.001 mm |
| J3-5 | 2,764 card-moments over 3 decks |
| J3-6 | 201 moments of a pick; the cord's length changes by 0.32 mm |
| J3-7 | 4 lifts × 2 repeats |
| J3-8 | 401 moments; the shuttle is in the warp in 37 of them, at least 10.0 mm under the upper sheet (45 since M4 narrowed the warp to 600 mm) |
| J3-9 | U1 1,936, U2 2,040, U3 292, U4 448, U5 744 triangles; 293 kB in all (U1 8,132 since it has the cross-row's 8 needles and springs and the card's placeholders) |
| J3-10 | 5 units |

In the browser: `dev/04-units/?selftest` 10/10 at 1440 × 900; each unit looked at, posed through a pick. The browser pane used for checking was hidden, which slows animation frames, so the units' camera flights were checked frame by frame rather than watched.

**Corrected after M3 (2026-10-26).** U2 turned counter-clockwise (the next card coming up from underneath), its hammer pressed the lantern from above, and its catches had each other's names. Posselt's Fig. I and Fig. X have the forward catch turning the top card to the needles and the hammer pressing from below; all three are fixed, with the 2D chain (M1 notes, "The chain the right way round"), and J3-4 checks the turn's direction and the hammer from below.

## Not in M3 (M4)

The ghosted whole machine with the units in place and the repeat bands, flying to a unit, the "Parts in 3D" view on the learner page, and lessons L8–L10.
