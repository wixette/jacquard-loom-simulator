# Can we build an operable, teachable Jacquard loom simulator in 3D and 2D?

**Feasibility report** · research only, no modelling or code · 2026-10-25
The task is in [BRIEF.md](BRIEF.md). Supporting material is in this folder: [sources/](sources/), [data/](data/), [images/](images/).

> **After the report (2026-10-25):** the maintainer chose a 2D machine first, with one 3D model per core unit and a ghosted whole-machine view, in place of the 3D 24-hook head and the instanced 200/400-hook zoom-out recommended in §1. The Lyon project is not to be contacted. See [decision 0001](../design/decisions/0001-2d-first-with-3d-units.md) and the [simulator plan](../design/simulator-plan.md). The report below is kept as it was written.

---

## 1. Bottom line

**Yes. Go, with conditions.** The main risk in the brief was the source material for Jacquard's 1804 machine. That risk turned out to be real, but it does not block the project:

- **Jacquard's first head is not documented.** No source gives its hook count, card size or frame size, and no catalogued original was found online. The most careful history (Kohl 1873) dates the card machine to "most probably" 1805, with no patent of its own. The famous 1801 patent covers an earlier, pedal-worked machine.
- **The head as it was built for the rest of the century is documented to the sixteenth of an inch.** Posselt (1887) dimensions every part of a 200-hook single-lift head in a quarter-scale drawing set ([Gutenberg #54193](https://www.gutenberg.org/ebooks/54193)). Four other period textbooks (Barlow 1878, Bell 1895, Nelson 1909, Bradbury 1912) agree on how it works, down to the order of events in one pick. The principle (8 rows of hooks, a square card cylinder, two catches, springs) is the one Kohl describes for the "original form".
- **The loom under the head is the weak part.** Museum records give only overall sizes. The frame members, batten, treadle linkage and harness height are estimates.

| Target | What it means | Confidence now | After maintainer actions (§9) |
|---|---|---|---|
| **A. Didactic working head and cloth** | A reduced head of 24 hooks (3 cross-rows of the real 8-row layout), every part present and moving through the whole pick cycle, driven by cards the student writes, weaving the right cloth. Plus 2D views: a section through one row of hooks, a card editor and a cloth preview. | **High (≈ 90 %)**. The selection mechanism, the hole convention and the order of events agree across five period texts. Every head part has a documented size except the needle springs. | Very high |
| **B. Kinematically faithful full head** | A full single-lift head on a hand loom at documented dimensions: Posselt's 200-hook head (208 = 26 × 8), with 400 hooks (8 × 50, plus reserves) as a parameter; the real cylinder motion and the documented order of events | **Medium-high (≈ 70 %)**. The head is documented. The batten swing radius, the S-iron profile, the loom frame, the lift linkage, the harness height and the hand-loom timing fractions are estimates. Performance on a school Chromebook is unmeasured. | High |
| C. A specific surviving loom, measured exactly | For example the Science Museum's Spitalfields loom 1914-469 (400 needles, head c. 1820–34) | **Low (≈ 20 %)**. Only its overall size is published. Its hook layout and card size are not, and its photos are CC BY-NC-SA. | Medium, if a museum measures it or grants photo rights |

The percentages are my judgement, as in the earlier reports.

**Is it worth building? Yes** (§7). No open, web-based, operable model of the real mechanism exists. The closest is a three.js app published 17 days before this check, in which the head is a closed box, the user types a name instead of writing cards, and there is no licence. The only open geometry of a real head is a 3D-printable CC0 kit. The teaching gap is clear too (§6). Every free lesson found is static, and museums keep a person at the loom because the cards do not explain themselves. One museum built a computer simulator for exactly that reason.

**My recommendation:** start the modelling plan now.
- **Build target A as the main machine, with B's geometry.** Every part of the 24-hook head takes its size from Posselt, so the reduced head is the real head with fewer rows, not a toy.
- **Build the 2D views first,** on the same logic: the section, the card editor and the cloth. They teach the core idea better than 3D does, cost little, and give the logic a test bed before any Blender work.
- **Add B as a "zoom out to the real head":** 200 or 400 instanced hooks running the same logic. Do not attempt C.
- **Name the machine honestly:** "a Jacquard head as used on silk hand looms, c. 1810s–1900", not "Jacquard's 1804 loom". Teach what it cannot do: no branching, no arithmetic, nothing written back to the cards.
- **Tag every value** `doc`, `drawing`, `derived`, `photo` or `est`, as the earlier models did. The data files already do this.
- **Reach out early** to the LIRIS / Musée des Soieries Bonnet project in Lyon, which planned the same thing in three.js in 2025 (§7, §9).

### Against the go criteria in the brief (§5)

| Criterion | Met? |
|---|---|
| Every moving part of the head has a size from a document or a dimensioned drawing | **Yes, with one exception.** Hooks, needles, knives, griffe, plunger, bottom board, needle board, cylinder, lantern, pegs, hammer and catches all carry Posselt's dimensions. Of the 148 values in the spec, 128 are `doc`, 11 `derived` and 8 `est`. The exception is the needle spring (estimated at 4–5 mm × 25 mm).<br>• Two shapes, the hook crook and the knife bevel, are drawn but not dimensioned. I can scale them from the quarter-size figures.<br>• The batten swing radius and the S-iron profile are estimates. They set the cylinder's path, not what the cylinder does. |
| The order of events is documented, and the meaning of a hole is settled | **Yes.** The order comes from Bradbury's measured timing table and from Barlow's and Bradbury's hand-loom descriptions. "Hole means lift" in all five texts. The hand-loom *fractions* of the cycle are estimates (§4). |
| No open, operable simulator of the real mechanism exists | **Yes** (§7). |
| The chosen scale fits the browser budget (300 k triangles, 15 MB) | **Yes, by estimate.** The 24-hook head with its loom is about 50–90 k triangles. A full 400-hook head with 1,600 warp ends is about 116 k at low detail but about 335 k at mid detail, so it needs two levels of detail (§5). Nothing has been measured on a Chromebook. |
| Nothing in the licences blocks a publishable model | **Yes** (§8). The drawings are public domain. The 66 kept images are freely licensed, with nothing NC or ND. |

So target A meets the criteria today. Target B meets them once I scale the missing shapes from the period figures, and fully after one photo-and-measuring session at a working loom (§9).

## 2. Which machine to model

The history and the mechanism research gave two answers that look different. They are the same machine at two sizes.

- **The history notes** recommend a typical 19th-century single-lift head of about 400 hooks on a wooden silk hand loom. Their physical reference is the Science Museum's Spitalfields loom 1914-469: 400 needles, head c. 1820–34, loom c. 1840, 2800 × 1630 × 3050 mm ([SMG record](https://collection.sciencemuseumgroup.org.uk/objects/co45141)). Barlow calls the 400 "an ordinary 400-needle machine — such as is in common use in silk hand-loom weaving".
- **The mechanism notes** recommend Posselt's 200-hook head (208 needles = 26 cross-rows × 8), because it is the only head with every part dimensioned. A 400 head is the same machine with longer knives and cylinder: 8 × 50 hooks plus two reserve cross-rows, so 416 needles in 52 rows of 8 (Nelson). The "26 × 16" sometimes quoted is the 400's needle board seen as two halves of 26 × 8, split by a lacing groove. It is not a 16-row machine.

**My recommendation is one machine, with the hook count as a parameter:**

| Choice | Recommendation | Basis |
|---|---|---|
| Type | Single-lift, single-cylinder head: one griffe with 8 knives; one hook, one needle and one brass spring per warp control; a square card cylinder on a swing batten, thrown out by an S-iron on the griffe; two catches (forward and reverse); a spring hammer. Lifted by a treadle, a cord and a head lever. Bottom-closed shed. | Bradbury: "the only type of machine adopted for figure weaving in the hand ... looms"; Posselt; Barlow; Nelson |
| Geometry of every head part | Posselt's 200 head, Figs. I–XI, drawn at ¼ full size | Posselt, pp. 11–17 |
| Hook count | 24 for the didactic head (target A); 200 (208 needles) as the documented default for B; 400 (416 needles) as the historical silk-loom size | Posselt; Nelson; Barlow |
| What changes at 400 | 26 more cross-rows at 0.27 in, so the knives, boards and cylinder grow about 7 in; the card becomes 16½ × 2½ in (Bradbury's "ordinary 408" card) | Nelson; Bradbury p. 245; the 7 in is my derivation |
| Frame | Wood, as on European hand looms ("usually made of wood", Barlow). Posselt's head is American cast iron, so its proportions are kept and its sections estimated. | Barlow p. 149; Posselt |
| Loom | Four-post silk hand loom at the catalogued size of SMG 1914-469; frame members estimated | SMG 1914-469 |
| Cards | 200 head: French index card 9⅝ × 2 5/16 in, pegs 7½ in apart, confirmed by a Platt museum card of 245 × 62 mm. Hole pitch about 0.27 × 0.25 in (derived). | Posselt p. 97; SMG 1912-320 |
| Tie | Straight (Norwich) tie first; point tie as a lesson option; cards at the side of the loom (London/French tie) as a later option | Posselt; Bradbury pp. 270–272 |
| Label | "A Jacquard head as used on silk hand looms, c. 1810s–1900" | — |

As a check, the same 0.27 in pitch fits both documented cards: 26 cross-rows span 6.75 in inside the 200 card's 7½ in peg centres, and 51 cross-rows span 13.5 in on the 16½ in "408" card (my arithmetic).

**Why not Jacquard's own machine:**
- **Its size is unknown.** Kohl's "original form" (after the *Dictionnaire technologique*) gives the layout: 8 iron knives, a four-sided prism turned a quarter turn per card by a 4-bar lantern and two catches, brass springs, two reserve rows. It gives no counts and no sizes.
- **No original was found.** The Musée des Arts et Métiers (CNAM) shows a Jacquard object, but one study of the gallery describes a model shown with his portrait, while other sources call it an 1804 loom. The earliest object photographed is the CNAM's reduced model of 1810.
- **The date is disputed.** Kohl reads the 1801 patent as covering an earlier pedal "lacs-drawing" machine (one that replaced the draw boy). He dates the card machine to most probably 1805, rewarded in 1806 by a pension and premiums, not by a patent. 1804, the year Jacquard returned to Lyon, is the conventional date.
- **The improvement that made it reliable is undocumented.** Breton's 1815 patent is known only from search snippets.

Modelling "the 1804 machine" would mean inventing details and presenting them as fact. The principle did not change between Kohl's original form and Posselt's head, so the typical head is faithful to Jacquard's design. The lineage can be told in 2D side panels: Bouchon's paper band (1725), Falcon's card chain on a square prism (1728), Vaucanson's griffe and drum (1745–46). Real sizes exist for Vaucanson's loom (CNAM, 330 × 266 × 277 cm) and for the Science Museum's model of Falcon's (950 × 500 × 1030 mm). Details: [sources/notes-history-and-machines.md](sources/notes-history-and-machines.md) §§1–3 and §5.

## 3. What is known, subsystem by subsystem

| Subsystem | What we have | Basis | Confidence | Main gap |
|---|---|---|---|---|
| **Lineage and the first head (1725–1805)** | Bouchon 1725 (paper band), Falcon 1728 (card chain, square prism, needles in tiers), Vaucanson 1745–46 (griffe, pierced drum, self-acting). Kohl's original form: 8 knives, square prism, lantern, two catches, brass springs, two reserve rows. Card machine most probably 1805, no patent. | Barlow 1878 (after Willis 1855), Kohl 1873, CNAM and SMG records | High (lineage); medium (original form) | Hook count, card and frame size of the first head; the 1801 and 1815 patent texts |
| **Hook block** | 208 hooks (26 × 8) of No. 13¼ spring wire, 16⅝ in high, turned-up rester 6⅝ in. Bottom board 12 × 8 × ¾ in, holes 0.27 × ⅞ in apart. Fixed grate stops the hooks turning. | Posselt Figs. II, V; Bradbury | High | Crook radius (drawn, not dimensioned) |
| **Needles and springs** | 208 needles of No. 15½ wire, 10¾ in long, eye ⅜ in, at 8 eye positions (top needle's eye nearest the needle board). Protrude ½ in (Barlow: ¼ in). Brass spiral springs in a spring box. Needles about ¼ in apart vertically. | Posselt Figs. VI–VII; Barlow; Nelson | High (needles); low (spring size) | Spring size (estimate 4–5 × 25 mm) |
| **Griffe and lift** | 8 knives, 9¼ × ⅞ in at ⅞ in pitch, feather-edged and inclined. Griffe 9¾ × 6⅝ in on a ¾ in plunger. Lift about 3½ in (3⅓–4 in). Head lever over the weaver's head, cord to a treadle. | Posselt Figs. I, III–IV; Nelson; Bradbury; Barlow | High (head); medium (lift); low (hand-loom lever arms, treadle) | Knife inclination; hand-loom lever lengths |
| **Card cylinder, batten, catches, hammer** | Square prism 2 7/16 × 13 in, lantern 1½ in, two ½ in pegs per face. Moves out 2–3 in, turns 90° in the last part of the outward stroke. Top catch (forward) and bottom catch (reverse), 8 in long. Spring hammer 3 × ¼ × ⅜ in squares the cylinder. S-iron slot with dwells at both ends. | Posselt Figs. VIII–X; Bradbury pp. 72–79; Nelson; Barlow | High (parts); low (swing radius, S-iron profile) | Batten swing radius and S-iron shape (scale from the figures) |
| **Cards and chain** | 200 card 9⅝ × 2 5/16 in, pegs 7½ in apart; 408 card 16½ × 2½ in; 600 card 16⅞ × 3⅜ in. Hole pitch about 0.27 × 0.25 in; punch 7/32 in. Laced endless chain, hung on wires every 12th to 20th card. | Posselt p. 97; Bradbury p. 245; SMG 1912-320 | High (sizes); medium (pitch) | No source states the hole pitch; no free photo of a card with a scale |
| **Harness** | One neck cord per hook; one harness cord per repeat. Comber board: holes per inch = warp ends per inch, 8 rows deep, ¾ in thick. Couplings, mail, lingo (18–25 per lb, 9 in long). Straight, point, Norwich and London ties. | Posselt; Bell; Bradbury; Barlow | High (rules); low (harness height, estimated 1 m) | Hand-loom harness height; no photo of a comber board from below |
| **Loom** | Four-post frame: SMG 1914-469 2800 × 1630 × 3050 mm; Platt 1912 2885 × 1450 × 2400 mm with a 16 in reed. Batten hung on two gudgeons; silk shuttle 11 × 1 × 1 in; ratchet take-up; warp tensioned by weights. | SMG records; Barlow pp. 78–84 | High (overall size and parts); low (members) | Breast-beam and warp-line heights, treadle, batten radius; no side or back elevation |
| **Cycle timing** | Order of events documented. Bradbury measured a power loom in crank degrees. | Bradbury pp. 78–82; Barlow p. 157 | High (order); low (hand-loom fractions) | No period timing for a treadle loom |
| **Design to cards to cloth** | Point paper, piano card cutter (100–150 cards an hour), repeaters, lacing; straight and point ties; the ground weave must divide the hook count | Posselt; Bell; Barlow | High | No period end-to-end small example; ours is constructed (§4) |

The best value for each dimension is in [data/machine_spec.json](data/machine_spec.json): inches and millimetres, each with source, basis and confidence (112 values high, 25 medium, 11 low). The parts are in [data/component_inventory.csv](data/component_inventory.csv): 67 part types, with node names, what each mounts on, how it fastens, how it comes out and how it moves. Every part of the head is medium or high. The 16 low-confidence rows are the loom frame, batten, take-up, treadle and needle spring. The full findings are in [sources/notes-mechanism.md](sources/notes-mechanism.md).

## 4. The operation sequence

**One pick is one card.** The cycle is driven by one master scalar φ from 0 to 1, with φ = 0 when the treadle starts down. Each motion in [data/operation_cycle.json](data/operation_cycle.json) names a node from the inventory and the scalar it drives.

| φ | Phase | What happens | Basis |
|---|---|---|---|
| 0.00–0.06 | **Knives take the selected hooks** | The card pressed in at the end of the last pick still holds the blanked needles back, so their hooks lean clear of the knives. The griffe starts up and the knives catch under the crooks of the hooks whose needles went into holes. The cylinder must not leave yet. | Order doc (Bradbury p. 78); fraction est |
| 0.06–0.32 | **Shed opens; cylinder out and turned** | Selected hooks rise with their neck cords, harness cords, mails and lingoes, and the shed opens about 3 in at the mails. The S-iron throws the cylinder out about 2½ in, and the springs return every pushed needle. From φ ≈ 0.15 the lantern meets the top catch and the cylinder turns 90°, bringing the next card to the needle face; the hammer rides over the lantern corner. | Order doc (Bradbury pp. 74–76; Barlow p. 152; Posselt p. 15); fractions derived from Bradbury |
| 0.32–0.55 | **Shuttle** | The weaver holds the treadle down, pushes the batten back and throws the shuttle. | Order doc (Barlow pp. 83–84); fraction est |
| 0.55–0.66 | **Beat-up** | The batten is drawn forward and the reed beats the pick against the cloth (strike at φ ≈ 0.62). | Order doc for a hand loom (Barlow); timing low confidence |
| 0.66–0.95 | **Shed closes; next card pressed in** | The treadle is released and the lingoes pull the griffe down. The S-iron brings the cylinder back, and the next card meets the needles at φ ≈ 0.91, before the griffe lands. Blanks push their needles 12.7 mm back and tilt their hooks off the knives. Holes let the needles into the cylinder, so those hooks stay over their knives. | Order doc (Barlow p. 157; Bradbury); fractions derived |
| 0.95–1.00 | **Rest; take-up** | Closed shed, card pressed. Every few picks the weaver winds the cloth on through a ratchet. | Parts doc (Barlow); fraction est |

**What is documented and what is estimated.** The order of events is documented. The timing reference is Bradbury's table, measured on a single-lift power loom at 120 picks a minute, in crank degrees (checked on the page image): griffe starts up at 55°; cylinder leaves the needles at 70°; lantern meets the catch at 110°; cylinder half turned at 170°; shed fully open and cylinder fully out at 210°; griffe starts down at 230°; cylinder starts back at 235°; card meets the needles at 30°; griffe at rest at 40°. The hand-loom fractions keep Bradbury's order and overlaps but stretch the open shed to about a third of the cycle for the shuttle and the beat. **They are estimates:** no period source times a treadle Jacquard, because the weaver sets the rhythm. The default speed of 40 picks a minute is also an estimate (power single-lift heads ran 90–140).

**What a hole means.** In the machine, everywhere: **hole = needle not moved = hook stays over its knife = warp end lifted.** A blank pushes the needle and the hook back, so the end stays down. A blank card gives an "empty lift"; an empty cylinder lifts every hook (Posselt pp. 14–15; Barlow p. 150; Bradbury p. 75). On the design paper the convention varies: painted squares usually mean warp up, but some mills cut the blank squares, and Posselt labels designs "figure up" or "ground up". **The simulator should fix one convention: 1 = hole = warp up**, and say so on screen.

**Reverse and faults.** Pulling a cord lifts the top catch and engages the bottom one, so the cylinder turns backwards: the cards come in reverse order and the design is woven mirror-wise in the weft direction. Weavers did this to find a lost pick and to reverse borders. Other documented faults make good "debug" lessons: a card thrown off the pegs, a cylinder that stops on a corner and bends the needle points, a cylinder not pressed close enough so blanked hooks lift anyway. The simulator has to decide whether reversing unweaves the last pick (§5).

**The toy worked example** is one cross-row of a real head: 8 knives, 8 hooks, 8 needles and a card with one column of 8 holes, with a straight tie (hook n lifts warp end n). The motif is an upward arrow, chosen asymmetric so the reading order shows. The first card is cut from the bottom line of the design (Bradbury).

| Pick | Card (needle 1 → 8; O = hole) | Hooks lifted | Woven row (W = warp over, f = weft over) |
|---|---|---|---|
| 1–4 | `...OO...` | 4, 5 | `fffWWfff` |
| 5 | `O..OO..O` | 1, 4, 5, 8 | `WffWWffW` |
| 6 | `.O.OO.O.` | 2, 4, 5, 7 | `fWfWWfWf` |
| 7 | `..OOOO..` | 3, 4, 5, 6 | `ffWWWWff` |
| 8 | `...OO...` | 4, 5 | `fffWWfff` |

With three harness cords per neck cord the same 8 cards weave the arrow three times across 24 ends. With a point tie (15 ends on hooks 1…8…1) they weave a mirrored figure twice as wide. Two alternating cards (holes 1, 3, 5, 7 and 2, 4, 6, 8) weave plain cloth, a quick first test. The example is constructed with the documented rules; no period source gives a complete small design-to-cloth sequence.

**The real case** is a 400-hook head with a straight tie in 4 divisions, so 1,600 warp ends. Hook h sits at card column ⌈h/8⌉ and needle row ((h − 1) mod 8) + 1; warp end e hangs on hook ((e − 1) mod 400) + 1. For an 8-end satin ground, pick p lifts every hook in needle row ((p − 1) · 3 mod 8) + 1: 50 holes per card and 200 of the 1,600 ends up. Both examples are in the data file, ready to use as acceptance tests.

## 5. Technical complexity: 3D and 2D

### Part counts and triangle budget

The inventory has 67 part types. Most are single parts; the problem is the few that repeat. A 400-hook head has 416 hooks, needles and springs and 400 neck cords. With a 4-repeat tie it drives 1,600 harness cords, mails, lingoes and warp ends, and a card chain of 40 visible cards. Earlier models are small by comparison: the Leibniz stepped reckoner's M2 had 110 objects (about 164 k triangles, 6.9 MB).

| Part type (400 head, 1,600 ends) | Full head, mid detail | Full head, low detail | 24-hook head, mid detail |
|---|---|---|---|
| Hooks (400) | 76.8 k | 25.6 k | 4.6 k |
| Needles (400) and springs (400) | 57.6 k | 24.0 k | 3.5 k |
| Neck and harness cords (2,000) | 16.0 k | 0 (lines) | 1.0 k |
| Mails (1,600) | 51.2 k | 3.2 k | 3.1 k |
| Lingoes (1,600) | 38.4 k | 19.2 k | 2.3 k |
| Warp ends (1,600) | 51.2 k | 0 (lines) | 3.1 k |
| Cards, cylinder, griffe, boards | ≈ 3.5 k | ≈ 3.5 k | ≈ 2.5 k (holes as geometry) |
| Frame, batten, reed, beams, shuttle, levers | ≈ 40 k | ≈ 40 k | ≈ 30 k |
| Cloth | ≈ 0 (data texture) | ≈ 0 | 0–40 k (a close-up yarn swatch) |
| **Total** | **≈ 335 k: over budget** | **≈ 116 k** | **≈ 50–90 k** |

These are design estimates from [sources/notes-build-feasibility.md](sources/notes-build-feasibility.md) §1; no source gives triangle counts. With one instanced mesh per repeated part type, the whole machine is about 30–80 draw calls (twice that with shadows). Leibniz M3 ran at 60 fps with 588 draw calls, though on an M1 Mac. Draw calls are not the risk once instancing is used. Without it, 8,000 separate meshes would be.

### Instancing, and the conventions it strains

Hundreds of identical parts are the textbook case for three.js `InstancedMesh`. `BatchedMesh` is not needed, and users have reported it slower than merged meshes. The friction is with the project's own conventions:
- **A named node per part.** 400 named hooks would be 400 draw calls. I propose that the `.glb` carries one prototype per part type plus the static frame, and that `js/sim/` lays out the instances from the same params the Blender script uses, with a fixture test that the two layouts agree. A 400-hook `.glb` built this way would be well under 1 MB. Blender's export of `EXT_mesh_gpu_instancing` has mixed reports, so the design should not depend on it.
- **One scalar per moving part.** A hook needs two: it tilts when its needle is pushed and rises when selected. Model it as two nested objects. The cylinder likewise: batten swing, then prism rotation.
- **Acceptance ray casts in Node.** Animating in a vertex shader would be cheaper, but Node cannot see it. Instance matrices should be computed on the CPU. Even the worst case, about 4,000 matrices a frame, is far below the range where users report trouble. Ray casts against instanced meshes with three-mesh-bvh in Node are untested.
- **All-pairs clearance.** Checking every pair is O(n²) across hundreds of instances. Moving hooks meet only their neighbours, the knives and the needles, so a spatial grid on the uniform hook pitch finds the pairs that matter.
- **Levels of detail and aliasing.** Two shapes per part type, swapped as whole instanced meshes by camera distance. 1,600 warp ends one pixel wide will shimmer from afar, so the far view replaces them with a textured strip.

### Flexible parts, without physics

None of the flexible parts needs a physics engine:
- **Cords** hang taut under the lingoes, so straight segments are physically right. Each is a unit cylinder or line placed from its two endpoints.
- **Warp ends** are polylines from the back rest through the mail and the reed to the cloth. Only the mail vertex moves. All of them fit in one line buffer of 8,000 vertices.
- **The card chain** is a chain of rigid cards placed along a fixed closed path, like a tank tread, driven by one scalar. The path wraps the rotating square cylinder and a hanging loop drawn from photos.
- **The cloth** is a byte grid (warp × pick) uploaded as a data texture, with a few lines of shader that draw each cell as a warp or weft float. One row is written per pick. A close-up "magnifier" can build real yarn tubes for a 24 × 24 window only.

AdaCAD, the one open project with yarn-level 3D rendering, builds one tube mesh per yarn. That is too heavy for a whole cloth, and its licence declarations conflict (§8), so I would take ideas only.

### 2D

A 2D layer is cheap and teaches the core idea better than 3D, where 400 overlapping hooks hide the selection:
- **A side section** of one cross-row in SVG: one needle, one hook, a knife, the cylinder face with a card, the spring, the cord, the mail, the lingo, a warp end and the shuttle, about 12 moving shapes driven by the same scalars as the 3D rig. About a day of work at the project's pace.
- **A card editor:** a grid of 8 × N holes per card, a chain list (add, duplicate, loop), import and export of a drawdown as an image or 0/1 text. WIF, the weaving file format, is an optional import; no maintained JavaScript library for it was found.
- **A cloth preview** on a canvas, one row per pick, with "this row came from this card" highlighted.

A 2D-only simulator would be about 0.3× an Altair-sized 3D project. 2D plus 3D would be about 1.2× 3D alone, because the 2D reuses the logic and the readouts.

### Simulation logic

The logic is close to trivial: a cloth row is the tie-up of the current card. The state is the chain, the tie-up (warp end → hook), the weft colour per pick, the pick index, the phase, the direction and the cloth. Everything visible is a pure function of it. The work is in the cycle timing, the tie-ups (straight, point, reserve hooks for selvedges) and the edge cases: a looped chain (pick N + k equals pick k), reversing (which should remove the last row exactly), several weft colours, and refusals such as reversing at pick 0. I estimate 300–600 lines plus tests, simpler than Leibniz's carries.

### Acceptance checks

The Jacquard maps well onto the project's kinds of check. Thirteen draft checks (J-1 to J-13) are in the build-feasibility notes, §6:
- **readouts:** a needle passes through the card exactly where there is a hole; each mail is at lift height exactly when its hook is selected through the tie-up; the cloth equals the cards through the tie-up; the cylinder turns 90° per pick;
- **contacts:** a selected hook's crook sits on its knife; the card sits on the pegs; adjacent cards in the chain stay joined; each warp end passes through its own mail and dent;
- **clearances:** an unselected hook clears its knife; the shuttle clears both sheets of the shed; the chain clears the cylinder and frame;
- **logic and budget:** forward then back restores every pose; every step changes something visible; triangles, file size and draw calls under budget.

Card holes and pegs must be real geometry for the ray casts. That is cheap on the 24-hook head. On the full head, test at the logic level plus a sample of columns.

### Milestones

| M | Deliverable | Exit | Size |
|---|---|---|---|
| **M0: one row of eight** | The logic (chain, tie-up, cycle, step stops); the 2D section and card editor; in Blender, 8 needles, hooks and springs, one knife, one cylinder face with a card, 8 cords, mails, lingoes and ends, as individual nodes | Selection, hook-on-knife and lift checks pass on 8 hooks; 2D cloth equals the cards | ≈ 1.3× Leibniz M0 |
| **M1: the didactic head and the chain** | 24-hook head, full cylinder with pegs, the card chain on its path, straight and point ties, 48–96 ends, shed, 3D cloth | Checks J-1 to J-10 on 24 hooks; ≥ 30 fps on a Chromebook | Like Leibniz M1–M2 (the chain is the new hard part) |
| **M2: the whole loom and the real head** | Frame, batten, reed, shuttle, beams, lever; two weft colours; reverse; the instanced 200/400-hook zoom-out with levels of detail; a `?perf` page | J-11 to J-13; full head under 300 k triangles and 15 MB; fps measured on a Chromebook | ≈ 1.5× Altair M2 |
| **M3: teaching page** | Lessons (§6), 2D and 3D in one page, languages | Tested with a teacher | Like Leibniz M3 |

**Effort:** about **1.3–1.8× Leibniz**, whose research and M0–M3 took two calendar days in its git log. The extra is the instancing, the card chain, the cloth shader and the 2D views. **This ratio is a judgement** from earlier projects' history, not a measurement, and calendar days with AI help do not translate into human hours.

## 6. Educational value

**Curriculum fit.** No CS standard I could check names the Jacquard loom. It fits in the gaps between explicit requirements:
- England, KS3: representing pictures in binary, and how instructions are stored and executed; KS2: sequence, selection and repetition;
- Australia, Years 5–6: binary through pixel images (a Jacquard card is literally one row of a 1-bit image);
- CSTA, Impacts of Computing, K–5: computing technologies that changed the world, and life before and after them.

Teachers bring Jacquard in as a history and binary hook. They are not required to teach it, so the simulator must earn its place through the binary, sequence and history standards it serves, and say so on its page.

**Existing material is thin and static.** The free resources found are a Library of Congress primary-source lesson (2015), a Lisburn Museum binary bracelet worksheet, a CSTA 2023 conference session on weaving and computational thinking (members only), a STEM Learning "history of computers" sheet, graph-paper weave labs and videos. Each teaches "hole or no hole = two states", and some teach "a sequence of cards = a sequence of rows". **None closes the loop from card to mechanism to cloth.** Students never test a card they made, never see a missing hole show up as a flaw in the fabric, and are never shown how a short loop of cards repeats down the cloth or how one hook drives many ends across it.

**The teaching difficulty is documented by what museums do.** The Maison des Canuts in Lyon runs two guided demonstrations a day on a 19th-century hand loom; Paisley Museum's curator demonstrates its looms; the Computer Museum of America runs punch-card demonstrations. Macclesfield Silk Museum built a Raspberry Pi Jacquard simulator in 2014 because visitors found it hard to picture how the holes in the cards relate to the pattern. An ASME history article makes the same complaint about popular accounts: the "start of the computer age" claim usually comes with no explanation of how a card could control a heavy loom without electronics. The answer is mechanical amplification: one light needle bends one hook off a heavy rising griffe, repeated hundreds of times. A simulator can show exactly that.

**Research on weaving and computing is encouraging but small.** SPEERLoom (UIST 2023) and the UC Irvine "Recrafting Soft Technologies" course used an open Jacquard kit for maths, engineering and computational thinking; Keune's group (TUM) found variables, conditionals, functions and loops in children's weaving; the PENELOPE project (Deutsches Museum) treats weaving as an early binary technology. These are design papers, pilots and qualitative studies, mostly read as abstracts. **They show plausibility and engagement, not measured learning gains.** The project should not claim more. The physical kits in these studies must be built; a browser simulator would be the zero-cost way in.

**Misconceptions the simulator must correct** (my analysis; no study of Jacquard misconceptions was found):

| Misconception | What the simulator should show |
|---|---|
| "The loom computed" / "the first computer" | Nothing is calculated. Each pick copies the card straight to the hooks. A state inspector (card → hooks → lifted ends) makes this plain. |
| "Programmable in the modern sense" | The chain is a fixed stored sequence with at most an unconditional loop. No branching, no arithmetic, no memory written back. Contrast Lovelace's separate operation and variable cards and her "backing" of cards for repetition. |
| "Jacquard invented punched cards" | A history panel: Bouchon 1725, Falcon 1728, Vaucanson 1745–46, then Jacquard. |
| "One card per thread" | One card = one pick (weft row); one hole position = one hook; one hook can drive several ends through the harness. Highlight the card and its row together. |
| "A hole = 1 = on, always" | Hole = warp lifted. Whether that shows as figure depends on colour and face. "Invert card" and "show back" toggles show that 1/0 is a convention. |
| "Holes are bits like in a computer" | Three kinds of card, three meanings: a Jacquard card selects threads; Babbage's cards encode operations and variables; Hollerith's encode data to be counted. |

The history has its own myths, which the panel must not repeat: "patented 1801" (the patent covers an earlier machine), "the 24,000-card portrait" (a traditional figure with no primary source found), "weaves algebraic patterns" (Lovelace wrote "algebraical", in Note A, 1843), and "Hollerith copied Jacquard" (he credited a conductor's ticket punch).

**Ranked lesson scenarios** (my proposals, ranked by curriculum fit, the gaps above and the museum evidence; ages not yet checked with teachers):

| # | Scenario | Ages | Hook | What students do |
|---|---|---|---|---|
| 1 | **Pixel picture to punched cards** | 8–14 | Binary images | Draw a 1-bit picture; the simulator turns each row into a card and weaves it; count the bits |
| 2 | **Debug the deck** | 10–16 | Sequence; stored instructions | Open a shared link to a deck with a swapped card, a missing hole or a reversed card; predict the flaw, run it, fix it |
| 3 | **Loops and repeats** | 9–15 | Repetition | Close a 4-card plain or twill deck into a loop and weave 40 rows; then repeat across the width with the harness tie |
| 4 | **How does a card lift a thread?** | 11–18 | Mechanical amplification; history of technology | Step through one pick on the cut-away head |
| 5 | **Loom vs. Analytical Engine vs. Hollerith** | 14–18, undergraduate | Impacts; history of computing | Read Lovelace's Note A and Note C; debate whether the loom was "programmable" |
| 6 | **Weaves as binary matrices** | 14–18, undergraduate | Matrices, modular arithmetic | Build plain, twill and satin; find that satin needs a step coprime to the repeat; combine a figure mask with a ground weave |
| 7 | **Jobs and automation** | 12–18 | Impacts; history | Compare a draw-boy loom with a Jacquard head; the Lyon canuts |
| 8 | **Make a real card** | 8–14 | Unplugged extension | Print the deck at true scale, punch and lace it |

**Required features**, in rough priority: a card editor with save and load; a picture-to-cards converter; a step-by-step pick cycle (play, pause, step, reverse) with the current card and cloth row highlighted together; the cut-away head at a teachable hook count with a toggle to the real scale; a cloth preview, front and back; a 0/1 matrix view with the hole convention shown; true-scale card export; loop and harness-repeat controls; **a link that encodes the deck, the step and the view**, for worksheets and "debug this" tasks; a figure-and-ground combine tool; and an honest "what this machine cannot do" panel. Details: [sources/notes-education.md](sources/notes-education.md).

## 7. Value check: does an equivalent exist? (2026-10-25)

**No.** Searches covered Sketchfab, Printables, Thingiverse, GrabCAD, TurboSquid, CGTrader, the Smithsonian 3D collection, GitHub, GitLab, Scratch, YouTube, museum interactives and kits. Nothing open, web-based and operable models the real mechanism: needles, hooks, griffe, cylinder and springs, driven by a card chain the user writes, weaving the resulting cloth. The full tables (52 items) are in [sources/notes-value-check.md](sources/notes-value-check.md).

| Resource | What it is | Interactive? | Shows the mechanism? | Open licence? | Available? | Verdict |
|---|---|---|---|---|---|---|
| **"Jacquard"**, Anu Sirkas ([GitHub](https://github.com/anusirkas/jacquard-loom), created 2026-10-08) | three.js app: a name becomes bits, a damask draft and a chain of cards that steps through a head; harness cords light up and a 3D cloth is woven | Yes: type a name | **No.** The head is a box with no needles, hooks, griffe or cylinder; cards cannot be edited | **No** (no licence file) | Yes | **Closest digital prior art.** Shows the idea is attractive and doable in plain three.js; not mechanism-level; not reusable |
| "loom simulator", Till von Ahnen (2024) | Rust/WASM app: step through a loaded 64-card deck; a 2D cloth grows | Yes | No | No (source not public) | Yes | 2D card-to-cloth only |
| **Chris Fenton's punch-card readers** (Thingiverse, [10-hook](https://www.thingiverse.com/thing:101077) 2013, 3-hook 2012; PixelWeaver 2015) | 3D-printable single-acting heads after Fox's *Mechanism of Weaving*: crank, griffe, hooks, needles, springs, card cylinder | Physical | **Yes**, as a kit | **CC0** | Yes | **The only open geometry of a real head.** Reuse its kinematics ideas |
| LIRIS / IUT Lyon 1 with the Musée des Soieries Bonnet (2025) | Planned three.js tool: rebuild a fabric from a punched-card image, with a "simplified" mechanism | Planned | Planned, simplified | Unknown | No public output found | **Best partner lead:** same goal, same stack, a museum behind it |
| Sketchfab: Saint-Étienne workshop with two looms (2018), wboony (2021), Deutsches Technikmuseum photogrammetry (2016) | Static models | No | No | No (none stated, or store licence not offered) | View only | Visual reference |
| AdaCAD (CU Boulder) | Weave drafting for shaft and Jacquard looms, with a cloth preview | Yes | No | Library LGPL-3.0-or-later; app GPL in its manifest, no licence file | Yes | Draft or WIF path, partner; ideas only |
| Macclesfield Silk Museum Raspberry Pi simulator (2014) | Visitor demonstration of holes and pattern | On site | Not described | Not stated | Not verified | Evidence of demand |
| Museum films (Macclesfield, National Museums Scotland, V&A) and a 3D animation (Sharan Ajith) | Real looms filmed; one CAD animation | No | Yes (filmed) | No (standard YouTube) | Yes | The best things to *watch*; not operable, not reusable |
| Open looms (Elm-Y 2026, Riley Cox 2024, SPEERLoom/RoboLoom, Albaugh 2021, OSLOOM) | Physical or electronic looms | Physical | Partly | NC or none | Yes | Ideas only |

No Jacquard model was found on Printables, GrabCAD, TurboSquid or in the Smithsonian's 3D collection, and no VR or mobile simulator anywhere. CGTrader's search did not work.

**Verdict: building target A, with B as the zoom-out, is worthwhile and not duplicative.** Most digital weaving tools treat the head as a black box between the draft and the cloth. Opening that box is the value nobody else provides. No existing resource combines:
1. the **real head**: needles, hooks, griffe, cylinder, springs, harness, shed;
2. a **card chain the student writes**, then watches being read, row by row;
3. the **cloth that results**, with a trace from each thread back to its hole, hook and needle;
4. **web-native delivery** with an **open licence** and **lesson material**, so it runs on a school Chromebook and teachers can remix and translate it.

**A signal of timing.** The Sirkas app appeared on 2026-10-08, less than three weeks before this check, and the Lyon internship was advertised for 2025. Others are clearly working towards this. That argues for starting soon, for **reaching out early** (LIRIS / Soieries Bonnet, Macclesfield, the Unstable Design Lab behind AdaCAD), and for competing on **mechanism fidelity plus lessons**, not on "a 3D loom weaves your name".

## 8. Licences

- **Period books are public domain:** Posselt 1887 (US, before 1931), Barlow 1878, Bell 1895 and Kohl 1873 (before 1900), Ure 1839 (author died 1857), Nelson 1909 (US), Babbage 1864 and Lovelace 1843. The 16 plates kept in `images/pd-scans/` come from Posselt, Barlow and Ure. **Bradbury 1912** is public domain in the US, but its UK status is unknown because the author's death date was not found. I used its facts (the timing table, card sizes) with citations and kept none of its figures.
- **Photos:** 50 photos and engravings in `images/commons/` (45 from Commons, 5 from Flickr): 12 CC BY-SA 4.0, 13 CC BY-SA 3.0 (8 dual-licensed with the GFDL), 7 public domain, 5 CC0, 4 CC BY 2.0, 4 CC BY 3.0, 3 CC BY 4.0, 2 CC BY-SA 2.0. Nothing is NC or ND. Each is catalogued in [data/photo_catalog.json](data/photo_catalog.json) and [images/ATTRIBUTION.md](images/ATTRIBUTION.md), and registered in `REUSE.toml`. The CC BY 4.0 licence text the Wellcome images need is in the `LICENSES` folder, and `reuse lint` passes. As modelling references they create no obligation. **As textures, prefer the CC0, public-domain and CC BY files**, since CC BY-SA would carry share-alike into the texture.
- **Science Museum Group:** catalogue data is CC0 and description text CC BY 4.0, so the facts and sizes used here are free. **Its images are CC BY-NC-SA 4.0 and were excluded.**
- **Prior art:** the Sirkas app has no licence, so nothing in it can be reused. Fenton's CC0 readers can be reused freely, geometry and notes alike; Fox's *Mechanism of Weaving*, their basis, is public domain. AdaCAD's library says LGPL-3.0-or-later and its app GPL-3.0-or-later, with no licence file at the repository root: take ideas only and write the cloth shader from scratch. The NC-licensed open looms (Elm-Y, Riley Cox) are for ideas only.
- **Other sources:** INPI's historical patent scans may be reused with the credit "Source: INPI". Museum photos elsewhere (CHM and others) and YouTube films are references only; do not copy frames. Modern textbooks and museum guides: facts and dimensions only, with citations.
- **Our own model:** the defaults are Apache-2.0 for code and CC BY-SA 4.0 for content (§9).

## 9. Next steps

### What I can do in the modelling stage, without help

1. **Scale the shapes Posselt draws but does not dimension,** from his quarter-size figures and Barlow's sections: the hook crook, the knife bevel and inclination, the S-iron slot and the batten swing radius. Scale the card hole pitch from Posselt Fig. XIV and Bell Fig. 31. Record each value as `drawing`.
2. **Read Fox's *Mechanism of Weaving*** and Fenton's CC0 build notes for the hand-driven griffe and cylinder, and review Bell 1895's figures, which were not read page by page.
3. **Look for Kohl's source plate** (*Dictionnaire technologique*, vol. XI) and the Société d'encouragement bulletins of 1806–07 on Gallica, for the history panel.
4. **Build a `?perf` page early,** with 5–10 k instanced parts, to measure frame rates before committing to the full head.
5. **Write the modelling plan** (`design/`): the node contract (prototypes plus instance layouts from params), the two-scale design, the step stops (card registered, shed open, shuttle across, beat-up, cylinder turned), the acceptance checks and the milestones.

### Maintainer actions (things I cannot do)

1. **Contact the Lyon project.** Write to Fabrice Jaillet (LIRIS / IUT Lyon 1, with J.-P. Farrugia) and the Musée des Soieries Bonnet in Jujurieux: did the 2025 internship run, what did it produce, and under what licence? A partnership could bring a museum, a French-language review and a real loom to measure. This matters most for the project's direction. *(Not pursued: the maintainer judged the purposes similar but different, decision 0001.)*
2. **One photo-and-measuring session at a working hand Jacquard loom:** the Maison des Canuts or Soierie Vivante in Lyon, the Science and Industry Museum in Manchester, Paisley Museum, or Paradise Mill in Macclesfield. About 15 views and measurements close every estimate:
   - the inside of the head from above and the side (hooks, needles, knives, spring box);
   - a card next to a ruler;
   - the comber board from below;
   - the lift linkage from treadle to lever to griffe, with lengths;
   - the batten swing radius and the S-iron;
   - the needle spring;
   - the harness height from bottom board to comber board;
   - side and back elevations of the loom, and the breast-beam and warp-line heights.

   Ask for the photos under a free licence (CC BY or CC BY-SA).
3. **Ask the Science Museum Group about loom 1914-469:** its hook layout (rows × cross-rows, reserves) and card size, and whether its images may be used in the repository. They are CC BY-NC-SA, which this project cannot use.
4. **For the history panel (not blocking):** search the INPI archive (https://bases-brevets19e.inpi.fr/) in a browser for Jacquard (1801) and Breton (1815), and ask the CNAM what its Jacquard object is: model or loom, date, inventory number.
5. **Ask one teacher** (computing or history) whether the top four lesson scenarios fit their classes, and at what age. No teacher evidence exists for this machine yet.
6. **Run the `?perf` page on a school Chromebook,** once it exists.
7. **Optionally, contact Macclesfield Museums** about their 2014 simulator and a pre- or post-visit resource.
8. **Decide the licence and the home** of the simulator: the defaults above, in its own public repository as Leibniz has. *(Done: this repository.)*

## 10. Risks and caveats

- **Which machine, and which date?** The model is a typical head, not Jacquard's. Every page that shows it must say so, and must not print "1804" under it.
- **"The first programmable machine" is a popular claim, not a supported one.** Bouchon's paper band (1725) and Falcon's cards (1728) came first. The Science Museum calls Falcon's loom "the first machine of any kind to be controlled by punch cards", and barrel-programmed automata and organs are older still (not researched here). The simulator should teach a stored sequence driving a machine, not a computer.
- **Others are moving.** A similar three.js app appeared this month, and a Lyon group planned one in 2025. If we wait, ours may duplicate theirs. Talk first (§9).
- **Performance is unmeasured.** No Chromebook benchmark for thousands of instances was found. The full head at mid detail is over budget, `BatchedMesh` has reported slowdowns, and Blender's instancing export is unreliable. The mitigations are the didactic head as the main machine, `InstancedMesh` only, two levels of detail, a textured warp sheet from afar, and an early `?perf` page.
- **The project's conventions assume a node per part.** Prototypes plus layouts from params, CPU matrices and a spatial grid should keep them testable. Ray casts against instanced meshes in Node are untested.
- **Legibility and looks.** 400 hooks overlap, and thin lines alias. The card chain's drape and the cloth's look are drawn, not simulated, and could look wrong. The mitigations are the 24-hook head, an x-ray of one column, the 2D section, a shaded cloth shader and a yarn magnifier.
- **Estimated timing.** The hand-loom fractions of the cycle are estimates. Whether the hand weaver beat on the open shed (Barlow) or on the closing one (the power-loom setting) is low confidence.
- **Source quirks to watch:**
  - Barlow's needle spacing reads "\ in." in the OCR; the page image says ¼ in. His full-page plates are cited by figure, because the Internet Archive's page numbers differ by two.
  - Kohl's page numbers come from OCR markers and should be checked against the scan.
  - Two notes give different publishers for Bradbury 1912 (Halifax: F. King & Sons; Manchester: John Heywood).
  - The Science Museum's loom 1914-469 appears under two web addresses (co45152, co45141). Its "sixteen pattern cards" were measured as one bundle, so they give no card size.
  - Posselt's book is © 1887 and printed 1888; the notes use both years for the same book (see [sources/bibliography.md](sources/bibliography.md)).
- **Limits of this research.**
  - Many sources were seen only as search snippets or abstracts: Breton's patent, the Verdol details, the CNAM object, the Smithsonian's loom record, the LIRIS brief, and the SPEERLoom, Keune and PENELOPE papers. They are marked as such in the notes.
  - Cults3D and Free3D were not searched, and CGTrader's search did not work. Gallica and the INPI archive were not reached. The Deutsches Museum's and the Musée des Tissus's machine collections were not covered.
  - The curriculum check was partial: GCSE, Scottish, French and German curricula, Code.org, BBC Bitesize and Teach Computing were not checked.
  - There is no teacher or visitor evidence for this machine, and no study comparing 2D and 3D loom simulations.
  - The effort ratios and the confidence percentages are judgements.

---

### Index of collected material

- [BRIEF.md](BRIEF.md): the research task as set on 2026-10-25
- [sources/notes-history-and-machines.md](sources/notes-history-and-machines.md): the lineage from Bouchon to Verdol, the original head, surviving and demonstrated machines, the portrait, Lovelace, Babbage and Hollerith, popular claims checked
- [sources/notes-mechanism.md](sources/notes-mechanism.md): every part of the head, harness and loom, counts and dimensions, the cycle, design to cards, speeds and loads
- [sources/notes-value-check.md](sources/notes-value-check.md): 52 existing simulators, models, videos, code projects and kits, with licences
- [sources/notes-education.md](sources/notes-education.md): curriculum fit, existing lessons, museum evidence, research, misconceptions, ranked scenarios and features
- [sources/notes-photos-and-licences.md](sources/notes-photos-and-licences.md): the best image per view, the plates, the 1801 patent, copyright status, missing views
- [sources/notes-build-feasibility.md](sources/notes-build-feasibility.md): instancing, flexible parts, scale, 2D, logic, acceptance checks, milestones and risks
- [sources/bibliography.md](sources/bibliography.md): every source, by key, with access and licence
- [data/machine_spec.json](data/machine_spec.json): 148 values with source, basis and confidence
- [data/component_inventory.csv](data/component_inventory.csv): 67 part types with node names, mounting, motion and source of size
- [data/operation_cycle.json](data/operation_cycle.json): the per-pick cycle, conventions, faults, the toy and 400-hook worked examples
- [data/photo_catalog.json](data/photo_catalog.json): licence, author and source of all 66 images
- [images/](images/): 50 freely licensed photos and engravings and 16 public-domain plates; see [images/ATTRIBUTION.md](images/ATTRIBUTION.md)
