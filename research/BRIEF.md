# Jacquard loom: research brief

**Task:** find out whether the Jacquard loom is worth building as the next educational browser simulator in this series, and whether it can be reconstructed in reasonable quality in 3D and/or 2D, with its operation sequence. Education and demonstration come first.
**Opened:** 2026-10-25 · **Status:** done 2026-10-25: go, with conditions · **Kind:** research only, no modelling or code
**Outcome:** [REPORT.md](REPORT.md). This brief is kept as it was set; where the research corrected it (the 1804 machine is undocumented, so a typical 19th-century head is modelled; the "26 × 16" layout is two halves of 26 × 8), the report says so (§2, §3).

The maintainer's words:

> As the next experimental machine, a deep research to see if it's worth building or possible to reconstruct in reasonable quality (top priority is education/demonstration), the first programmable concept machine (mechanical): the Jacquard loom (1804), a key milestone in the pre-history of modern computers. Cover existing simulator/emulator projects, licences, value to reconstruct it as a simulator, tech complexity to reconstruct it in 3D or 2D and its operation sequences.

---

## 1. Why, and the main risk

The Jacquard head (Joseph Marie Jacquard, Lyon, 1801–1805) let a chain of punched cards choose which warp threads rise for each throw of the shuttle. It is the standard first chapter in the pre-history of computing: Babbage took its cards for the Analytical Engine, and Lovelace wrote that the Engine "weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves". A simulator in which a student writes the cards and watches the head read them and weave the cloth would show a stored sequence driving a machine, without any electronics in the way.

**The main risks are four:**
- **The source material for the 1804 machine.** Nobody here knows whether drawings or measurements of Jacquard's first head survive, or whether a later, documented head would have to stand in for it.
- **The claim itself.** "The first programmable machine" may be a popular simplification. The simulator must not teach a myth.
- **The shape of the machine.** The earlier simulators (the Leibniz stepped reckoner, the Altair 8800) have tens of parts. A Jacquard head has hundreds of identical hooks, needles and springs, and a loom adds hundreds or thousands of cords and warp threads and a cloth. That may strain the browser budget and the usual conventions (a named node and one scalar per moving part, acceptance tests on the `.glb` in Node).
- **The value.** Films of working looms are everywhere, and an open simulator may already exist.

This task answers these before any modelling starts.

## 2. Scope

**The machine:** a Jacquard head on a hand loom. Which head (Jacquard's own, or a documented 19th-century one) is a question for the research, not a given.

**In:**
- the Jacquard head: hooks, needles, springs, griffe and knives, card cylinder and its motion, catches, the card chain;
- the harness: neck cords, comber board, couplings, mails, lingoes;
- the hand loom under it: frame, treadle and lift, batten and reed, shuttle, beams and take-up, as far as they take part in the weaving cycle;
- the operation sequence for one pick, and how a design becomes cards and cloth;
- the history the simulator would tell: the lineage before Jacquard, and the link to Babbage, Lovelace and Hollerith.

**Out:** power looms, double-lift and double-cylinder heads, Verdol paper heads and modern electronic Jacquards, except as later "versions" or context; textile chemistry; anything about the weaver's other tools beyond what the cycle needs.

**Fidelity levels** (the usual scale, adapted to a head with hundreds of repeated parts):

| Target | What it means |
|---|---|
| **A. Didactic working head and cloth** | A reduced head (for example 24 hooks) in which every part is present and moves correctly through the full pick cycle, driven by student-written cards, weaving the right cloth; plus 2D views (a section through one row of hooks, a card editor, a cloth preview). Proportions right to within a few per cent. |
| **B. Kinematically faithful full head** | A full single-lift head on a hand loom at documented dimensions, with the real hook layout, the card cylinder's real motion and the documented order of events. Hook count as a parameter. |
| C. A specific surviving loom, measured | One museum machine reproduced to measured millimetres. Only if the sources allow it. |

**What "operation sequence" means here:** the order and timing of every motion in one pick (treadle, griffe, cylinder out, turn and in, needles, hooks, shed, shuttle, beat, take-up), each motion as one scalar of one master phase, with what is documented and what is estimated marked.

## 3. Research questions

1. **History and versions.** What did Bouchon, Falcon, Vaucanson and Jacquard each contribute? What did the first head (1801–1805) look like, and what changed later (Breton, double lift, Verdol)? Which originals, models and working looms survive, and where are they demonstrated?
2. **Mechanism.** Every part of the head, the harness and the hand loom, and how they interact. Which variant is the simplest correct one to model?
3. **Dimensions.** Hook counts and layouts, card sizes and hole pitch, cylinder, griffe stroke, needle and hook pitch, comber board, harness height, loom footprint. Sources with numbers, not only pictures.
4. **The cycle.** The order of events in one pick, with phase angles where documented; what a hole means; what a missed or reversed card does.
5. **Design to cloth.** How a design becomes cards (point paper, card cutting, lacing) and how the harness tie repeats or mirrors it across the cloth; a small worked example that can serve as a test.
6. **Value check: does it exist already?** Search for web, desktop, Scratch, museum and VR simulators, 3D models (Sketchfab, Printables, Thingiverse, GrabCAD, TurboSquid, CGTrader, the Smithsonian), open-source code and physical kits. Record what each is, whether it is interactive, whether it shows the mechanism, its licence and whether it is still available, as in the Leibniz report's value check. If an open, operable model of the real mechanism exists, we should reuse or partner rather than build.
7. **Educational value.** Where Jacquard sits in CS curricula, what lessons already exist, what learners find hard, which misconceptions a simulator can correct, and which lessons a simulator would make possible.
8. **Technical complexity.** What a 3D and a 2D reconstruction would take in the project's stack: part and triangle counts, instancing, flexible parts (cords, warp, card chain, cloth), acceptance checks, milestones and effort.
9. **Photos and licences.** A licence-checked catalogue of photos and public-domain drawings, enough to model from, and the copyright status of the key sources.

## 4. Leads to check

None of these has been checked yet. They are starting points, not findings.

- **Period technical books:** E. A. Posselt, *The Jacquard Machine Analyzed and Explained* (Philadelphia, 1887/88); A. Barlow, *The History and Principles of Weaving* (1878); T. F. Bell, *Jacquard Weaving and Designing* (1895); F. Bradbury, *Jacquard Mechanism and Harness Mounting* (1912); A. Ure's *Dictionary* (1839); F. Kohl, *Geschichte der Jacquard-Maschine* (1873). Archives: the Internet Archive, Project Gutenberg, HathiTrust, Gallica.
- **Museums:** the Science Museum Group (London, Manchester), the Musée des Arts et Métiers (CNAM, Paris), the Musée des Tissus and the Maison des Canuts (Lyon), Paisley Museum, National Museums Scotland, Macclesfield, the Deutsches Museum, the Computer History Museum, the Smithsonian.
- **Patents:** Jacquard's 1801 brevet and Breton's 1815 improvement, in the INPI's historical archive.
- **Existing simulators and models:** GitHub, Scratch, Sketchfab and the 3D-print sites; weaving software such as AdaCAD; open-source looms; museum kiosks; YouTube explainers.
- **Education:** national CS curricula, CSTA, teaching sites, museum learning pages, research on weaving and computing (HCI, learning sciences).
- **Wikimedia Commons and Flickr**, for freely licensed photos of looms, heads and cards.

## 5. Deliverables

The same shape as earlier research packs, so the modelling stage can start from it:

```
REPORT.md                    the answer: go / no-go, which machine, confidence per fidelity target and
                             per subsystem, the operation sequence, technical complexity, educational
                             value, value check, licences, gaps, risks, next steps, maintainer actions
sources/bibliography.md      every source: what it gives, its access and its licence
sources/notes-*.md           findings per area (history, mechanism, value check, education,
                             photos and licences, build feasibility)
data/machine_spec.json       every dimension found, each with its source and a confidence
data/component_inventory.csv every part to be modelled: assembly, mounting, how it moves or comes out,
                             and the source of its size
data/operation_cycle.json    the per-pick cycle as one master scalar, the conventions, faults,
                             and worked examples usable as tests
data/photo_catalog.json      the licence, author and URL of every downloaded image
images/                      reference images whose licence allows keeping them, with ATTRIBUTION.md
```

**Go** means:
- for target A, every moving part of the head has a size from a document or a dimensioned drawing, so that nothing in the selection mechanism rests on a guess;
- the order of events in one pick is documented, and the meaning of a hole is settled;
- no open, operable simulator of the real mechanism already exists;
- the chosen scale fits the browser budget (300 k triangles, 15 MB of `.glb`);
- nothing in the licences blocks a model we can publish.

**No-go** names what is missing and what would close the gap (a measurement, a scan, a contact), so the maintainer can decide whether to pursue it.

## 6. Publishing

There is no existing simulator to build into. If the machine matures, it is published in its own public repository, as the Leibniz stepped reckoner was. The research does not decide this, but the report should note anything that bears on it (dependencies, model size, licences of any reused material).

## 7. Maintainer actions (things the research may need and cannot do itself)

To be filled in by the report, for example: asking a museum for measurements, photos or permission to use its images, contacting the authors of related projects, searching an archive that our tools cannot open, or testing the lesson ideas with a teacher.
