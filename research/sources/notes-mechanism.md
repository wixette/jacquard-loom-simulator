# Notes: mechanism and the operation cycle

**Scope.** How a single-lift Jacquard head, its harness and the treadle hand loom under it work, in enough mechanical detail to model every moving part in 3D (Blender → three.js) and in 2D, each part driven by one scalar from a master cycle. Companion data: [`../data/machine_spec.json`](../data/machine_spec.json) (dimensions), [`../data/component_inventory.csv`](../data/component_inventory.csv) (parts and node names), [`../data/operation_cycle.json`](../data/operation_cycle.json) (per-pick cycle, conventions, faults, worked examples).

**Research questions answered here**

1. Which Jacquard parts exist and how do they interact (needles, springs, hooks, griffe and knives, grate and bottom board, cylinder with pegs, lantern, catches and hammer, swing or slide motion, cards and lacing, card springs, neck cords)? Which variant is the simplest correct one to model?
2. Harness and loom: neck cords, harness cords and tie-ups, comber board, couplings, mails, lingoes; warp beam, back rest, batten and reed, shuttle and fly shuttle, breast beam, take-up, treadle and head lever.
3. Counts, layouts and dimensions: hook counts and row × column layouts, card sizes and hole pitch (French, Verdol, English), cylinder, griffe stroke, needle and hook pitch, comber board, harness height, loom footprint.
4. The cycle for one pick, in order, with phase angles where documented; what a missed or reversed card does; what a hole means.
5. Design to cards: point paper, reading, piano card cutters, repeaters, lacing; repeats through the harness tie; a toy 8-hook example and a 400-hook case.
6. Speeds and loads.

**What was searched, and when (all on 2026-10-25)**

- archive.org advanced search (titles "jacquard", creator "Posselt", "Barlow", "Fox"). Full texts downloaded and read: Posselt 1888 (Project Gutenberg #54193, proofread), Nelson 1909 (Gutenberg #50532), Bell 1895 (Gutenberg #53318), Bradbury 1912 (archive.org OCR), Barlow 1878 (archive.org OCR). Fox 1894 was downloaded and searched for speeds only; nothing used.
- Page images checked where the OCR mattered: Barlow p. 150 and p. 157 (needle protrusion and spacing), Bradbury p. 82 (timing table) and p. 245 (card sizes).
- Science Museum Group collection records for three hand Jacquard looms; Centre for Computing History card record; Google Patents US4438787 (Verdol paper layout); Humphries Weaving history page.
- Web searches for card pitch in mm (French, English, Verdol, Vincenzi) and for hand-loom picks per minute. Both returned little that could be sourced (see Gaps).

**Conventions in these notes.** Every fact carries a source key (full references at the end). Statements marked **[inference]** are my own deductions and are not stated in any source. Inch values are the sources' own; mm = in × 25.4. Page numbers for Posselt match the printed pages (the Gutenberg image file names `i_0NN` carry the page number). No source here is in French or German, so no translations were needed.

---

## 1. Parts of the Jacquard head and how they interact; which variant to model

### Takeaway
The single-lift, single-cylinder head is the original, the simplest, and the only type used on hand looms. Model it. It has one griffe with one knife per hook row, one hook and one horizontal needle per warp control, a spring behind every needle, and a square cylinder that swings out, turns a quarter turn and comes back once per pick. A hole in the card lets the needle stay put, so the hook stays over its knife and is lifted.

### Cited findings
- **Definition and use.** Bradbury calls the single lift "still representative of the original invention" and "the only type of machine adopted for figure weaving in the hand and smallware looms". It works on the "bottom" and "closed shed" principle, so it is not suited to high speed. — [BRADBURY1912](https://archive.org/details/jacquardmechanis00brad) pp. 67-68. Bell: "The single-acting is the real jacquard, and much the simplest machine" — [BELL1895](https://www.gutenberg.org/ebooks/53318). The silk trade kept single-cylinder machines because the cards cannot get "crossed" — [NELSON1909](https://www.gutenberg.org/ebooks/50532).
- **Part list.** Frame and perforated (bottom) board; griffe and its lift; hooks; needles; springs and spring frame; needle board; cylinder, hammer and batten; catches; cards; harness — [POSSELT1888](https://www.gutenberg.org/ebooks/54193) p. 11. Nelson gives the same list with the coupling parts named (lingo, hanger, mail eye, mid-piece or sleeper) — [NELSON1909].
- **Hooks.** Vertical wires bent over at the top ("crook") to hang on a knife. Bradbury's hooks are doubled at the base and turned up about one third of their length through a fixed grate, which stops them turning; the double loop rests in a hole of the tug (resting) board — [BRADBURY1912] p. 68. Barlow shows an older hand-loom form in which a wooden grate engages the lower bends and is hung from the griffe, rising with it; unlifted hooks stay in hollowed holes of the bottom board — [BARLOW1878](https://archive.org/details/historyprinciple00barl) p. 152. Nelson traces the hook forms (flat, French springing hook, deep and alternate blades) to the modern hook, with the griffe lowered to about 1 in above the top needle — [NELSON1909] Figs. 1-8.
- **Needles.** Horizontal wires, one per hook. Each passes through the needle board at the front, has an eye (a half-loop) round its own hook, and a loop at the rear. A pin through the loops of each vertical row limits forward travel, and a brass spiral spring presses each needle forward — [POSSELT1888] p. 14 Figs. VI-VII; [BARLOW1878] pp. 150-151. The eye sits at a different distance from the head in each of the 8 rows. The top needle's eye is nearest the needle board and the bottom needle's nearest the spring box. Each hook passes through its own needle's eye and outside the others — [NELSON1909] Fig. 10 text.
- **Springs.** Thin brass wire, either in a removable spring box (one hole per needle, one pin per vertical row) or on the needle loop itself (common in the US) — [BARLOW1878] p. 151; [NELSON1909]; [POSSELT1888] p. 14.
- **Selection rule.** "If a blank card is pressed against the 208 needles ... all the needles and hooks will be pushed back, out of the way of contact with the griffe-bars, thus causing an empty lift". With an empty cylinder or a fully cut card "raising the griffe will lift every hook" — [POSSELT1888] pp. 14-15. Barlow: "wherever a perforation was made opposite to a needle, then the corresponding hook would be raised" — [BARLOW1878] p. 150. Bradbury describes the same with a full, a blank and a partly cut card — [BRADBURY1912] p. 75.
- **Griffe and knives.** A frame with one knife per hook row (8 for an 8-row machine), guided by a plunger or slides and lifted from above or below — [POSSELT1888] pp. 12-13; [NELSON1909]. The knives are "strong hoop iron with feather edges" — [BARLOW1878] p. 150. When the griffe comes down and a hook has not been pushed back, "the inclined face of the griffe bars will strike against the face of the hook and force it backwards until the bars have passed below the points of the hooks". This is how the falling knife gets back under a crook that is standing upright — [BARLOW1878] p. 157. When set, the top of the knife should "just touch" the hook — [NELSON1909].
- **Cylinder.** A square prism of hard seasoned wood with iron ends, bored on each face to match the needles. It carries two adjustable brass pegs per face that locate the cards and enter peg holes in the needle board — [NELSON1909] Fig. 17; [BRADBURY1912] pp. 71-72; [POSSELT1888] pp. 16-17.
- **Turning.** As the cylinder moves out, a catch fixed to the frame meets the lantern (square end with rounded corners) and turns it. Bradbury: 45° at mid-travel, 90° at the end of the outward stroke — [BRADBURY1912] pp. 74-76. Barlow's lantern has four pins instead of a square — [BARLOW1878] p. 153. A spring hammer presses on the lantern square so the cylinder stops square to the needles: from below in Posselt Fig. X, from above in Bradbury Fig. 66 and Barlow p. 154. A spring "protecting catch" squares a cylinder that has stopped on a corner — [BRADBURY1912] p. 76; [BARLOW1878] p. 154.
- **Reversing.** A bottom catch is normally clear. Pulling a cord within the weaver's reach lifts the top catch and engages the bottom one, so the cylinder turns backwards. This is used to find a lost pick or to reverse the cards for bordered goods — [BRADBURY1912] pp. 72-73, 76; [NELSON1909]; [POSSELT1888] p. 12 (catches y and z).
- **Swing versus slide.** In the "swing batten", the cylinder is carried in a frame hung on two pointed centre screws at the top of the machine. In the slide type, it rides on a slide bar or spindle. On a hand loom the motion comes from the griffe: a bowl on the griffe runs in an S-shaped iron (Barlow) or "swan neck" (Bradbury) fixed to the batten — [BARLOW1878] p. 152; [BRADBURY1912] pp. 72, 78. Posselt's hand-loom version uses a triangular lever and a vertical lever from a bolt on the guide rod — [POSSELT1888] p. 15 Fig. VIII. Nelson lists five combinations of overhead or cradle lift with swing, spindle or slide cylinder motions — [NELSON1909].
- **Swan-neck dwell.** The swan-neck slot has a vertical lower part, an incline, and a vertical upper part. The cylinder therefore stays on the needles at the start of the lift ("sufficient time for the knives to reach and catch under the hooks"), is thrown out on the incline, and stays out at the top — [BRADBURY1912] pp. 78-79.
- **Card springs.** Flat springs on the batten hold the cards against the cylinder so they do not swing onto the needle points or slip off the pegs — [NELSON1909]; [BRADBURY1912] p. 74; [BARLOW1878] p. 156.
- **Neck cords.** Fixed to the hooks by a double hitch, not a knot, which wears less and still holds if one strand breaks — [BARLOW1878] p. 152.
- **Variants.** The four classes are: single action (single cylinder); double-lift single cylinder; double action (double lift, two cylinders); and rise-and-fall (close-shed) machines — [NELSON1909]. In the double-lift single cylinder there are two griffes working in opposition, two hooks per needle (so 800 hooks in a "400" machine), and the shed is never fully closed — [POSSELT1888] pp. 67-69; [NELSON1909]. The double-lift double cylinder joins two complete selecting sets to each harness cord, and the cards are split odd/even between the cylinders — [POSSELT1888] p. 69; [NELSON1909]. Shed types: single lift = bottom-closed shed; double lift = semi-open shed — [BRADBURY1912] pp. 68, 84; [BELL1895].

### Inferences
- **[inference]** The simplest correct model is a single-lift, single-cylinder 200-hook head (26 cross-rows × 8, 208 needles) with a swing batten driven by an S-iron, lifted by a head lever and treadle cord. Posselt dimensions exactly this machine (Figs. I-XI, drawn at 1/4 size), so almost every part can carry a documented size. A 400 head differs only in length (52 cross-rows) and can be a parameter.
- **[inference]** For the 2D view, use the cross-section of one cross-row (8 hooks, 8 knives, 8 needles stacked, spring box, needle board, cylinder) as in Posselt Fig. VII and Bradbury Fig. 67. That one section shows the whole selection logic.
- **[inference]** For the 3D animation, each hook needs two scalars (tilt when its needle is pushed, lift when selected) and the cylinder two (batten swing, prism rotation). Model them as nested objects (see the inventory notes) to keep one scalar per object.

### Gaps
- Exact knife inclination and crook geometry: drawings exist (Posselt Figs. IV-V, VII; Nelson Figs. 5-8) but no numbers. Scale them from the Posselt figures (1/4 size) if needed.
- Swing radius of the batten and the S-iron profile: not given as numbers anywhere found.

---

## 2. Harness and loom

### Takeaway
Each hook has one neck cord. Below the bottom board, one harness cord per repeat is tied to it. Each harness cord goes through its own hole in the comber board and ends in a coupling with a mail (eye) for one warp end and a lingo (weight) below. Lingoes pull everything down again. The loom is an ordinary hand loom (warp beam, back rest, batten with reed and shuttle race, breast beam, cloth beam with ratchet), but the treadle lifts the griffe instead of shafts.

### Cited findings
- **Harness chain.** Hook → tug or neck cord through the tug board → any number of harness cords tied to it → comber board → knot → upper coupling (double cord) → mail → lower coupling → iron lingo — [BRADBURY1912] p. 70 Fig. 65; [NELSON1909] list (a)-(f). Harness cords are tied to the neck cords "about 1/2 to 1 inch above the frame containing the rods which guide the neck-cords" — [POSSELT1888] p. 19.
- **Comber board rule.** "The number of holes to one inch in the comber-board must equal the texture of the fabric to one inch in loom" — [POSSELT1888] p. 20. Rows in depth normally equal the hook rows. Example: 100 ends/in × 36 in = 3600 holes; a 600 machine with 12 rows needs 300 holes across — [POSSELT1888] p. 20. A strip comber board (8 deep, 10 strips × 5 cross-rows = 400 holes) gives a 4 in wide harness at 100 ends/in, and the strips can be spread for a coarser set — [POSSELT1888] pp. 21-22 Figs. XVIII-XX.
- **Comber board build.** Solid boards about 3/4 in thick (strong enough to bolt to brackets) or about 1/4 in thick and framed, in beech, sycamore or walnut; or slips 1/4-5/16 in thick and about 1 1/2 in broad in a grooved frame — [BELL1895]. The board is set a little finer than the reed: reed on 37 in, board on 36 in (Scotland) — [BELL1895].
- **Heddles.** Twine heddle with mail (usual) or wire heddle (low textures only) — [POSSELT1888] p. 22 Fig. XXI. Mails are glass for silk, steel or brass otherwise — [BARLOW1878] p. 79. Posselt's ingrain-carpet coupling measures: connecting cord 6 in, upper heddle 10 in, mail 3/4 in, lower heddle 8 in, lingo 9 in — [POSSELT1888] p. 75 Fig. CXI. Bell gives sleepers of 5 in — [BELL1895].
- **Lingo weights.** Moderate lingoes run "18 to 25 per lb." (about 18-25 g each) — [BELL1895] (double-lift section). Heavier "leads" run 11-15 per lb, and curtain harnesses use about 60-70 per lb — [BELL1895].
- **Levelling and leasing.** Mails are levelled on a frame. The back rows can be set slightly higher — [BELL1895]. Every row of the comber board is leased separately onto lease twines, giving one continuous line of heddles for drawing in — [POSSELT1888] p. 23 Fig. XXIV. The mail height is set to suit the race of the going part — [BRADBURY1912] p. 301.
- **Tie systems.** *Norwich* (Posselt's "English system"): machine and cylinder parallel to the comber board, so the cards work over the warp at the back or above the weaver's head at the front — [BRADBURY1912] p. 270; [POSSELT1888] p. 29 Fig. XXX. *London or French*: machine at right angles to the comber board, cards at the side of the loom. This is "a convenient method for the hand loom weaver since he can watch, reach and control the cards", but each harness row takes a quarter twist — [BRADBURY1912] p. 272. Barlow's Spitalfields hand loom has the cards hanging over the side — [BARLOW1878] p. 160.
- **Heck.** Wide harnesses need a heck because cords that slope rise less. Bell works a 96 in harness with 84 in to the heck and a 3 1/2 in lift, and finds an edge cord rises about 2.7 in. Narrow harnesses need no heck — [BELL1895] Fig. 48. Bradbury: 90 in from the tug cord to the comber board, 4 in lift; a cord 45 in off centre rises about 3.6 in — [BRADBURY1912] pp. 301-302.
- **Hand loom (common).** The warp is tensioned by weights on a rope wound once or twice round the warp beam. The cloth beam has a ratchet wheel, pawl and handle. The reed is held in a pendulous batten "suspended from two gudgeons", with shuttle boxes at each end level with the bottom of the reed — [BARLOW1878] pp. 78-81.
- **Weaving motions (common hand loom).** Tread to open the shed, push the batten back a few inches, throw the shuttle, draw the batten forward to beat, then change the shed — [BARLOW1878] pp. 83-84. A silk fly shuttle is "eleven inches in length and about one inch square", about 3 oz. Throwing the shuttle by hand was still frequent among silk weavers in 1878 — [BARLOW1878] p. 84.
- **Jacquard lift on a hand loom.** "The lever for raising the griffe, passes over the weaver's head, and to the end of it is attached a cord connecting it with the treadle" — [BARLOW1878] p. 157. Bradbury: head lever 22 pivoted on an upright 24, cord 25 to "a simple tread lever of the second order adjusted near the weaver's foot" — [BRADBURY1912] pp. 70, 74. Posselt shows an alternative: a 3 1/2 in wooden drum in a 14 1/4 in triangular frame, with a leather strap to the plunger — [POSSELT1888] p. 12.
- **Counterpoise.** A heavily loaded single-acting machine "will turn round the loom so that it will rest in no position but with the griffe down", so weights or springs are added — [BELL1895].
- **Museum looms.** Silk hand loom with a 400-needle Jacquard (loom c. 1840, Jacquard probably 1820-1834, Warner & Sons): 2800 × 1630 × 3050 mm; oak treadle; shuttle 245 × 22 × 17 mm, 81 g; "sixteen pattern cards" sewn into a round — [SMG-1914-469](https://collection.sciencemuseumgroup.org.uk/objects/co45141). Platt Bros. Jacquard hand loom dated 1912: 2885 × 1450 × 2400 mm, 16 in reed spaces, three shuttle boxes; punched cards 245 × 62 × 1 mm; shuttles 310-312 mm — [SMG-1912-320](https://collection.sciencemuseumgroup.org.uk/objects/co9019100/jacquard-hand-loom). W. Archer, Bolton, c. 1910: 3048 × 1524 × 1830 mm, worked by a foot lever — [SMG-Y1973.43](https://collection.sciencemuseumgroup.org.uk/objects/co8405056/jacquard-hand-loom).

### Inferences
- **[inference]** For a first model, use a straight (single) Norwich tie, which keeps the cords untwisted and easy to draw, with the cylinder at the side as the London/French hand-loom option. The selection logic is identical; only the cord routing changes.
- **[inference]** Footprint for the model: about 2.8 m (front to back) × 1.5-1.6 m wide × 2.4-3.05 m high, from the two catalogued looms. The 1830 mm Archer figure is probably a different axis order or the loom without the head.

### Gaps
- No documented hand-loom dimensions for the breast beam height, warp line height, batten swing radius, treadle length or head-lever arms. The spec marks these as estimates (est, low).
- No measured lingo weight for a hand silk loom beyond Bell's per-pound ranges.

---

## 3. Counts, layouts and dimensions

### Takeaway
Machine size = needles = hooks. Rows = knives = hooks per cross-row (8, 10, 12; 16 in French fine pitch). A "400" machine is 8 rows × 50 cross-rows plus two reserve cross-rows (416 needles; Bradbury's 408 = 8 × 51). A "200" machine is 8 × 25 used plus a reserve row (208 = 26 × 8). Posselt gives a fully dimensioned 200 machine.

### Cited findings — counts and layouts
- Common sizes: 100, 200, 400, 600, 900, 1200, not counting the reserve rows "of which there are generally two". Reserve rows serve selvedges, front harness, shuttle boxes, take-up, or a bell on hand looms — [POSSELT1888] p. 9.
- Range 100 to 2600 hooks — [NELSON1909].
- Usually 208, 304, 408, 608 or 612 uprights, "designated ... 200, 300, 400 or 600 machines" — [BRADBURY1912] p. 83 (checked on the page image).
- **200:** card of 26 × 8 = 208 holes (Fig. XIV, p. 18); needle board with 208 needles (Fig. XI); the 26th row is the reserve row — [POSSELT1888] pp. 17-18, 91. Bradbury Fig. 65 shows 28 rows of 8 with 25 in use and the first and last two reserved — [BRADBURY1912] p. 70.
- **400:** "four hundred hooks and four hundred needles ... in rows of eight hooks and eight needles". The needle board has 416 holes "in 52 rows with 8 holes in a row", split by a groove into 26 rows each side, with lace grooves at the ends — [NELSON1909]. Posselt's 400 bottom board: neck cords 1-8 in the first row, 393-400 in the 50th — [POSSELT1888] p. 28 Fig. XXIX. So the "26 × 16" in the brief is two halves of 26 × 8, not a 16-row machine.
- **600:** 12 rows (a comber board of 12 rows; "50th row ... 589 to 600") — [POSSELT1888] pp. 20, 29. A card-cutter's account: "12 holes across x 50 rows" for 600, 8 across for 400 — [CHC-48028](https://www.computinghistory.org.uk/det/48028/Jacquard-Cards/).
- **900 / 1200 (French index):** piano-machine racks have 88 and 114 pins — [POSSELT1888] p. 88.
- **French fine pitch:** 16 needle rows "much closer set"; half card 440 holes, full card 880 — [BELL1895] Fig. 31. McMurdo's 1296-hook machine uses 16-row cards at the French pitch — [BELL1895] Fig. 107. "1200 hooks and needles took the space of 400 on earlier models" (lead-level source) — [HUMPHRIES](https://www.humphriesweaving.co.uk/refining-jacquard/).
- **Verdol:** an 896 machine with a continuous paper roll on a spiked roller; feelers and intermediate needles drive the ordinary needles because the paper pitch is too fine to act directly — [BRADBURY1912] pp. 245-249. The paper is punched in zones of "fifty six rows of eight holes", each row two staggered lines, i.e. 448 per zone — [US4438787](https://patents.google.com/patent/US4438787A/en). Bell's French paper machine: "two rows of 8 making one row of 16 hooks" — [BELL1895].

### Cited findings — dimensions of Posselt's 200 machine (drawn at 1/4 size; pp. 11-17)
| Part | Value (in) | mm | Fig. |
|---|---|---|---|
| Frame main width | 9 1/2 | 241.3 | I |
| Frame main height | 2 + 6 + 1 1/2 + 5 + 1 3/4 = 16 1/4 | 412.8 | I |
| Plunger diameter | 3/4 | 19.1 | I |
| Bottom board | 12 × 8 × 3/4 | 304.8 × 203.2 × 19.1 | II |
| Bottom-board hole pitch | 0.27 (along) × 7/8 (across) | 6.9 × 22.2 | II |
| Griffe | 9 3/4 × 6 5/8, 1 1/2 extensions | 247.7 × 168.3, 38.1 | III |
| Knife pitch / length / height | 7/8 / 9 1/4 / 7/8 | 22.2 / 235.0 / 22.2 | III-IV |
| Hook height / rester | 16 5/8 / 6 5/8 (No. 13 1/4 wire) | 422.3 / 168.3 | V |
| Needle length / head-loop / loop | 10 3/4 / 9 1/8 / 1 5/8 (No. 15 1/2 wire) | 273.1 / 231.8 / 41.3 | VI |
| Needle head-to-eye (example) / eye | 7 / 3/8 | 177.8 / 9.5 | VI |
| Needle protrusion | about 1/2 | 12.7 | VII |
| Cylinder face × length / lantern / spindle | 2 7/16 × 13 / 1 1/2 / 2 | 61.9 × 330.2 / 38.1 / 50.8 | IX |
| Cylinder peg length | about 1/2 | 12.7 | XI text |
| Hammer head | 3 × 1/4 × 3/8; rod 10 1/2 high; guides 9 apart | 76.2 × 6.4 × 9.5; 266.7; 228.6 | X |
| Catches | 8 long (5 1/4 + 2 3/4); screws 4 3/4 apart | 203.2; 120.7 | I |
| Needle board face | 9 1/2 × 2 3/8 | 241.3 × 60.3 | XI |

Source: [POSSELT1888].

### Cited findings — other dimensions
- Needle protrusion "about 1/4 in." and needles "placed at about 1/4 in. apart" (both checked on the page images) — [BARLOW1878] pp. 150, 157. Nelson: needle points protrude 3/8 or 1/2 in — [NELSON1909]. Needle wire No. 15 or 16 B.W.G., hooks No. 14 and 15 — [BARLOW1878] p. 157.
- **Cards (lacing-frame data):** 200 French index card 9 5/8 × 2 5/16 in, peg centres 7 1/2 in apart, pegs 3/8 in diameter at the bottom. 600 French index 16 7/8 × 3 3/8 in, peg centres 14 5/8 in. Ingrain (American index) 13 1/4 × 2 3/4 in, peg centres 11 3/8 in — [POSSELT1888] p. 97. Ordinary 408 card "16 1/2" x 2 1/2" = 41.25 sq. ins."; Verdol 896 paper "12 5/8" x 1 1/16" = 13.4" per pick — [BRADBURY1912] p. 245 (both checked on the page image). The Platt 1912 cards measure 245 × 62 mm — [SMG-1912-320].
- Royle piano-machine punch: 7/32 in diameter — [POSSELT1888] p. 89 Fig. 14. Card guide adjusts to card widths from 3/4 to 3 1/2 in — [POSSELT1888] p. 89 Figs. 16-17.
- **Lift:** overhead lever 10 1/2 in : 25 in with an 8 in crank stroke gives 3 1/3 in of griffe lift and "about a three-inch shed in the harnesses"; a cradle lever of 28 in : 10 in gives "about a four-inch lift" — [NELSON1909]. Bradbury's problems use a 4 in head lift — [BRADBURY1912] pp. 301-302. Bell's example draws 3 1/2 in — [BELL1895].
- **Cylinder travel:** "moved out from the needle board from two to three inches". It should be about 1/4 in from the needle points when it starts to turn. The batten cam is about 3 1/2 in from centre to tip — [NELSON1909].

### Inferences
- **[inference]** Card hole pitch for the 200 French-index card is about 0.27 in along the card × 0.25 in across (6.9 × 6.4 mm). This takes the hook cross-row pitch (Posselt) and the needle tier spacing (Barlow), and fits the documented card: 25 × 0.27 = 6.75 in inside the 7 1/2 in peg centres, and 7 × 0.25 = 1.75 in inside the 2 5/16 in width.
- **[inference]** The museum card 245 × 62 mm (Platt) matches Posselt's 200 French-index card (244.5 × 58.7 mm) in length. The Platt loom therefore probably carried a 200-class head.
- **[inference]** In the brief, "French" (Posselt's "French index"), "English" (Bradbury's "ordinary 408 ... pitch", the Norwich/English system) and "Verdol" refer to card formats as much as to tie systems. Posselt's "French index" versus "American index" concerns how the piano cutter's rack indexes the card rows.

### Gaps
- No source found with the hole pitch in mm for French fine (16-row), Vincenzi or Verdol cards, or a stated hole pitch for the English 408 card. Bradbury's areas give overall sizes only. Scaling Bell Fig. 31 and Posselt Fig. XIV (1/4 size) would give pitches with drawing-level confidence.
- Spring dimensions, griffe weight and hook crook radius were not found.

---

## 4. The cycle for one pick

### Takeaway
Treadle down: the griffe rises. The card already pressed in has pushed the blanked hooks off the knives, so only the hooks opposite holes rise, with their harness, mails and warp ends, and the shed opens. As the griffe rises the cylinder swings out and turns a quarter turn. The weaver throws the shuttle and beats. Treadle up: the griffe falls under the lingo weight, the shed closes, and the cylinder swings back, pressing the *next* card onto the needles just before the griffe lands. A hole means lift.

### Cited findings
- **Measured timing (power loom, single lift, 120 picks/min).** Crank angle from top centre, 12 divisions of 30°. Card cylinder: first contact with the needles at 30°; dwell in contact 40° (to 70°); first contact with the turning catch at 110°; on its corner (45° turned) at 170°; limit of outward travel at 210°; dwell out 25° (to 235°); travel back 155° (to 30°). Griffe: starts to rise at 55°; shed fully open at 210°; dwells to 230°; reaches rest at 40°, then a closed-shed dwell. — [BRADBURY1912] pp. 80-82, Fig. 74 (table checked on the page image). In this loom the cylinder was driven by a separate eccentric.
- **Hand-loom order (swan neck / S-iron).** No cylinder motion until the bowl reaches the bend, "sufficient time for the knives to reach and catch under the hooks"; the cylinder is out while the griffe is up and returns as it falls — [BRADBURY1912] p. 78; [BARLOW1878] p. 152; [POSSELT1888] p. 15.
- **Card arrives before the griffe lands.** "the card strikes the needles before the hooks have landed upon the bottom board, consequently the weight upon the hooks adds to their friction". Barlow says it would be better to let the griffe drop fully first, which power-loom Jacquards achieve with a separate cam — [BARLOW1878] p. 157.
- **Weaver's order on a hand loom.** Open the shed, push the batten back, throw the shuttle, draw the batten forward to beat, then change the shed — [BARLOW1878] pp. 83-84. The Jacquard is worked "by means of a foot-operated lever" — [SMG-Y1973.43].
- **Power-loom setting.** Set the crank so the shed is level when the reed is about 1 1/2 in from the cloth — [NELSON1909] (double-action section). This means beating on a crossing shed. It is a power setting; the hand-loom sequence above beats with the shed still open.
- **Single-lift consequence.** "the same griffe lifts the hooks for every shed, so the griffe must descend before the next shed can be lifted" — [NELSON1909]. A warp end that stays up for 7 picks moves 14 times on a single lift, against 8 complete movements on a double lift — [POSSELT1888] p. 68.

### Cited findings — missed, reversed and wrong cards
- **Lost pick:** the weaver pulls the cord, the bottom catch reverses the cylinder, and he turns back to find the pick — [BRADBURY1912] pp. 72-73, 76; [NELSON1909]; [BARLOW1878] p. 154.
- **Reversed cards:** the swing lever is "well adapted for reversing the Jacquard cards, whether for finding the broken pick and pattern, or for reversing the pattern cards when weaving bordered goods" — [BRADBURY1912] p. 76. Which catch engages decides whether the card on top or the card hanging below comes to the needles next — [POSSELT1888] p. 12.
- **Card off the pegs:** warped or damp cards catch on the needle points, "throw the cards off the pegs and cause a pick-out" — [NELSON1909]. Badly fitting cards get new holes punched by the pegs, causing wrong lifts — [POSSELT1888] p. 18.
- **Cylinder half-turned:** when the lay is pushed back by hand, the cylinder corner can bend the needle points down, so some hooks that should rise do not and some that should not do — [NELSON1909]; the protecting catch prevents this — [BARLOW1878] p. 154.
- **Mis-set cylinder:** test by greasing the needle heads and reading the marks on a card — [POSSELT1888] p. 18 Fig. XVI. Not pressed close enough: hooks are not pushed fully off the knives and a wrong shed is lifted — [POSSELT1888] p. 18.
- **Double cylinder out of time:** one cylinder gets a pick ahead and the twill breaks up — [BELL1895]; "wrong picks are often placed in the cloth by a double cylinder machine through the skipping of the cards" — [NELSON1909].

### Cited findings — what a hole means
- In the machine, everywhere: **hole = lift**, blank = stay down — [POSSELT1888] pp. 14-15; [BARLOW1878] p. 150; [BRADBURY1912] p. 75. In the Verdol paper machine, uncut paper raises a feeler and its hitting wire, which then pushes the needle back. So a hole again means lift — [BELL1895] (French paper machine); [BRADBURY1912] pp. 247-249.
- On paper the convention varies: Barlow's design shows "the black squares may represent the warp" — [BARLOW1878] pp. 162-163. Bell's double-cloth tie has the cutter "cutting the coloured squares ... on the first half of the card, and ... the blank squares on the second half" — [BELL1895]. Posselt labels designs "figure up"/"ground up" and "warp up"/"filling up" — [POSSELT1888] pp. 63, 117.
- Reading order: cut the first card from the bottom-left of the point paper. Where the first hook is reckoned from the back of the loom, the cutter reads from the top right, "which to say the least is somewhat confusing" — [BRADBURY1912] p. 269.

### Inferences
- **[inference]** The hand-loom phase fractions in `operation_cycle.json` keep Bradbury's order and overlaps. Contact continues after the griffe starts up. The card arrives about 0.03 of a cycle before the griffe lands. The cylinder turns in the last part of its outward travel. The open-shed dwell is stretched from Bradbury's 20° to about a third of the cycle, for the shuttle throw and beat. The fractions are estimates. The order is documented.
- **[inference]** A reversed cylinder replays the design lines backwards, which mirrors the figure in the weft direction. A missed pick (card advanced, no weft) drops one design line.

### Gaps
- No period source gives timing for a treadle Jacquard as fractions or angles. The weaver sets the rhythm.

---

## 5. From design to cards; repeats through the harness

### Takeaway
The figure is painted on squared design (point) paper: one column per hook, one line per pick. A card cutter on a "piano" machine punches one card per line, or a repeater copies a set. The cards are laced into an endless chain. The harness tie makes N hooks control many more warp ends: a straight repeating tie repeats the figure across the width, and a point tie mirrors it.

### Cited findings
- **Design paper.** Bell: "8 × 9 meaning that each of the large squares, or designs, contains 72 small checks". Ten by ten was the old standard, so "a 400 jacquard is called a 40-design machine". Use 8 × 8 paper for an 8-row machine with equal warp and weft density — [BELL1895] Fig. 68.
- **Reading and lashing (draw-loom and French practice).** For each design line the lasher takes a turn of twine round every simple cord opposite a painted check. The French card-cutting machine is set up from such a lashed design, with cords that drop punches and two operators — [BELL1895] Figs. 4, 108.
- **Piano card cutters.** These are worked by foot or belt. For 8-row cards the eight fingers work the keys and the right thumb the peg-hole key; for 12 rows the thumbs take keys 1-2 and 11-12. A carriage steps the card one row per pin of a rack; a reading board with guide rules holds the design — [POSSELT1888] pp. 86-91. A good cutter does 100-150 cards an hour — [BELL1895]. A 1926 cutter's recollection: "cut a 400 card in less than one minute" on a piano cutter — [CHC-48028].
- **Repeaters.** These copy a set by reading it on a pattern cylinder with selecting needles that move keys over punches — [POSSELT1888] pp. 92-96. Copying speed is 40-60 cards per minute — [BELL1895].
- **Lacing.** By hand on a frame with pegs, 30-50 cards at a time — [POSSELT1888] p. 97. By machine with three series of lace holes for 400/600 cards — [POSSELT1888] p. 98. A Bradbury lacing machine averages 28 cards a minute — [BRADBURY1912] (lacing-machine section, Fig. 345). Long sets are hung in a rack by wires 1-1 1/2 in longer than the card every 12th to 20th card — [POSSELT1888] p. 19 Fig. XVII; [BARLOW1878] p. 156.
- **One card per pick:** "each card corresponding to one pick" in an endless band — [BARLOW1878] pp. 159-160 (one selection per throw of the shuttle). Posselt's example set has 156 cards — [POSSELT1888] p. 19.
- **Ties.** The straight-through tie has one harness cord per division on each neck cord. With 3 divisions there are 3 cords per neck — [POSSELT1888] pp. 23-24. A 400 machine with a 4-section comber board weaves 1600 ends, with "400 ends, or any number dividing into 400" as the repeat — [POSSELT1888] p. 28. A point harness lets "any design consisting of two similar parts ... be woven by merely cutting half of the design"; the centre hook carries a single cord and the others two each — [BARLOW1878] p. 164. Barlow's 40-hook example harness (Figs. 144-149) shows 13 figure ends plus selvedge hooks raised alternately for a tabby selvedge — [BARLOW1878] pp. 161-164.
- **Ground weave must divide the hooks:** 400 ÷ 8 = 50 repeats of an 8-leaf satin. For a 12-leaf satin use 396 hooks (33 repeats) or 408 (34, borrowing 8 reserve hooks) — [POSSELT1888] pp. 9, 28.
- **Scale.** A Spitalfields silk scarf is 24-36 in wide at about 400 threads per inch, i.e. 9600 ends in 24 in. A hook per end "would of course take 9600 hooks — a number quite unknown in practice" — [BARLOW1878] p. 160.

### Worked examples (full data in `operation_cycle.json`)
- **Toy 8-hook machine** **[inference: constructed with the documented rules]**. It is one cross-row of a real head: 8 knives, 8 hooks, 8 needles in one vertical tier, and a card with one column of 8 holes between two peg holes. The motif is an upward arrow, chosen asymmetric so the reading order shows. Lines are woven bottom first (Bradbury), and hole = lift.

  | pick | card (needle 1 → 8) | hooks lifted | woven row (W = warp over, f = weft over) |
  |---|---|---|---|
  | 1-4 | `...OO...` | 4, 5 | `fffWWfff` |
  | 5 | `O..OO..O` | 1, 4, 5, 8 | `WffWWffW` |
  | 6 | `.O.OO.O.` | 2, 4, 5, 7 | `fWfWWfWf` |
  | 7 | `..OOOO..` | 3, 4, 5, 6 | `ffWWWWff` |
  | 8 | `...OO...` | 4, 5 | `fffWWfff` |

  With a 3-repeat straight tie (end e on hook ((e−1) mod 8)+1) the same 8 cards weave the arrow three times across 24 ends. With a point tie (15 ends on hooks 1…8…1) one card set gives a mirrored figure 15 ends wide. Two alternating cards (holes 1,3,5,7 / 2,4,6,8) give plain cloth, a quick simulator test.
- **400-hook case.** 8 rows × 50 cross-rows (+2 reserve = 416 needles). Hook h sits at card column ⌈h/8⌉ and needle row ((h−1) mod 8)+1. Bottom-board row 1 carries neck cords 1-8 and row 50 carries 393-400 (Posselt Fig. XXIX). Use a straight tie in 4 divisions, so end e (1-1600) hangs on hook ((e−1) mod 400)+1. For an 8-end satin ground (counter 3), pick p lifts every hook in needle row ((p−1)·3 mod 8)+1: 50 holes per card, 200 of 1600 ends up.

### Gaps
- No pre-1900 figure was found that shows a complete small design → card set → cloth sequence. The toy example is constructed, not copied.

---

## 6. Speeds and loads

### Takeaway
Power single-lift Jacquards ran about 90-140 picks/min and double-lift double-cylinder machines 160-200. No period figure was found for a treadle-worked hand Jacquard. Use 30-60 picks/min (default 40) as an estimate.

### Cited findings
- Single action: "ninety to one hundred thirty picks per minute being the most suitable speeds" — [NELSON1909]. About 120 picks/min "a fair average for 5/4 looms" — [BRADBURY1912] p. 68. 120-140 "a very good speed" — [BELL1895]. A single-shuttle loom at 120 can rise to 180 with a double lift — [BRADBURY1912] p. 83.
- Double action: 170-180 picks/min — [NELSON1909]; 160-200, with the cylinders at half speed — [BELL1895]; a 140-pick loom needs only 70 from each half — [POSSELT1888] p. 69.
- Load example (power, twilling Jacquards): two heads weigh 265 lb, plus 215 lb as the "half load of 2448 hooks, 4408 harness and lingoes" — [BRADBURY1912] p. 170. **[inference]** That is about 44 g per lifted harness cord, including the hooks.
- Hand weaving effort grew with the pattern because the weaver's leg opened the shed (lead-level) — [HUMPHRIES].
- A record-attempt handloom silk sari (not stated to be Jacquard) at "around 65 picks per minute" — [DECCAN-2026](https://www.deccanchronicle.com/southern-states/telangana/sircilla-weaver-completes-silk-sari-in-170-minutes-1976342). Treat this as an anecdotal upper bound.

### Gaps
- A sourced pick rate for a hand Jacquard (Spitalfields, Lyon, Paisley) was not found. One search result attributed "up to 40 picks/min" for a skilled fly-shuttle hand loom to a 1983 textbook, but I could not reach or identify the text, so it is not used.

---

## Sources

- **POSSELT1888** — Posselt, Emanuel Anthony. *The Jacquard Machine Analyzed and Explained: with an appendix on the preparation of Jacquard cards, and practical hints to learners of Jacquard designing.* Philadelphia: Pennsylvania Museum and School of Industrial Art, 1888 (copyright 1887). 230 illustrations; the dimensioned 200 machine (Figs. I-XI, pp. 11-17) is drawn at 1/4 full size. Public domain. Text: Project Gutenberg #54193, https://www.gutenberg.org/ebooks/54193 (mirror https://archive.org/details/thejacquardmachi54193gut, figures as `54193-h/images/i_0NN.jpg`, NN = page). Scan: https://archive.org/details/jacquardmachinea00poss.
- **BRADBURY1912** — Bradbury, Fred. *Jacquard Mechanism and Harness Mounting.* Halifax: F. King & Sons, 1912. Ch. VII single lift pp. 67-83 (timing table p. 82, Fig. 74); Ch. VIII p. 83-84; Ch. XVI Verdol pp. 245-249; Ch. XVIII ties pp. 269-273; Ch. XIX problems pp. 301-302. https://archive.org/details/jacquardmechanis00brad (pp. 82 and 245 checked on the page images, leaves n87 and n250). Public domain in the US; check the author's death date before reproducing figures elsewhere.
- **NELSON1909** — Nelson, H. William. *Jacquard Machines: Instruction Paper.* Chicago: American School of Correspondence, 1909. Project Gutenberg #50532, https://www.gutenberg.org/ebooks/50532 (figures 1-27). Public domain in the US.
- **BELL1895** — Bell, T. F. *Jacquard Weaving and Designing.* London: Longmans, Green & Co., 1895. Project Gutenberg #53318, https://www.gutenberg.org/ebooks/53318 (cited by figure: 4, 31, 48, 68, 107, 108). Public domain.
- **BARLOW1878** — Barlow, Alfred. *The History and Principles of Weaving by Hand and by Power.* London: Sampson Low, Marston, Searle & Rivington, 1878. Hand loom pp. 78-84; Jacquard machine pp. 147-158; harness pp. 159-165. https://archive.org/details/historyprinciple00barl (pp. 150 and 157 checked on page images, leaves n165 and n172). Public domain.
- **SMG-1914-469** — Science Museum Group. "Hand loom for silk weaving with Jacquard machine", object 1914-469 (Warner & Sons; London and Macclesfield; loom c. 1840). https://collection.sciencemuseumgroup.org.uk/objects/co45141. Accessed 2026-10-25.
- **SMG-1912-320** — Science Museum Group. "Jacquard Hand Loom", object 1912-320 (Platt Bros. & Co., 1912). https://collection.sciencemuseumgroup.org.uk/objects/co9019100/jacquard-hand-loom (also co44906). Accessed 2026-10-25.
- **SMG-Y1973.43** — Science Museum Group. "Jacquard Hand Loom", object Y1973.43 (W. Archer, Bolton, c. 1910). https://collection.sciencemuseumgroup.org.uk/objects/co8405056/jacquard-hand-loom. Accessed 2026-10-25.
- **CHC-48028** — Centre for Computing History. "Jacquard Cards" (Warner & Sons, 1926, with the donor's notes). https://www.computinghistory.org.uk/det/48028/Jacquard-Cards/. Accessed 2026-10-25.
- **US4438787** — Mutschler et al. US Patent 4,438,787 (Verdol paper card reading). https://patents.google.com/patent/US4438787A/en. Used for the zone layout only.
- **HUMPHRIES** — Humphries Weaving. "The Refinement of the Jacquard Machine." https://www.humphriesweaving.co.uk/refining-jacquard/. Lead-level (modern, unreferenced).
- **DECCAN-2026** — Deccan Chronicle. "Sircilla weaver completes silk sari in 170 minutes", 3 Aug 2026. https://www.deccanchronicle.com/southern-states/telangana/sircilla-weaver-completes-silk-sari-in-170-minutes-1976342. Anecdotal.
