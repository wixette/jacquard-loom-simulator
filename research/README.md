# Jacquard loom: research pack

Reference material for an educational browser simulator (three.js 3D and 2D) of a Jacquard head on a hand loom: a single-lift, single-cylinder head of the kind used on silk hand looms from about 1810 to 1900, in which the student writes the card chain, watches the head read it pick by pick, and sees the cloth it weaves.

**Start with [REPORT.md](REPORT.md)**, the feasibility report. The task as it was set is in [BRIEF.md](BRIEF.md).

```
REPORT.md                                  feasibility report: go / no-go, which machine, confidence, the operation
                                           sequence, technical complexity, educational value, value check, next steps
BRIEF.md                                   the research task as set on 2026-10-25
README.md                                  this file
sources/
  notes-history-and-machines.md            lineage from Bouchon to Verdol, the original head, surviving and demonstrated
                                           machines, the woven portrait, Lovelace, Babbage, Hollerith, popular claims checked
  notes-mechanism.md                       every part of the head, harness and hand loom; counts and dimensions; the
                                           per-pick cycle; design to cards; speeds and loads
  notes-value-check.md                     existing simulators, 3D models, videos, open-source code and kits, with licences
  notes-education.md                       curriculum fit, existing lessons, museum evidence, research, misconceptions,
                                           ranked lesson scenarios and features
  notes-photos-and-licences.md             best image per view, the public-domain plates, the 1801 patent, copyright
                                           status of the sources, missing views
  notes-build-feasibility.md               instancing, flexible parts, scale choices, 2D, simulation logic, acceptance
                                           checks, milestones and risks
  bibliography.md                          every source, by key (with aliases), with access and licence
data/
  machine_spec.json                        best value per dimension, in inches and mm, with source, basis and confidence
  component_inventory.csv                  67 part types: node name, mounting, fastening, how each comes out, motion
  operation_cycle.json                     the per-pick cycle as one master scalar; conventions, faults, worked examples
  photo_catalog.json                       licence, author, source and content of every image
images/
  ATTRIBUTION.md                           author, licence and source of every image
  commons/                                 50 freely licensed photos and engravings (45 from Wikimedia Commons, 5 from Flickr)
  pd-scans/                                16 public-domain book plates:
    Posselt_1887_p011_fig1_frame_side_view.jpg                 frame of a 200-hook head, with dimensions
    Posselt_1887_p013_fig3-5_catches_griffe_hook.jpg           cylinder catches; griffe; hook
    Posselt_1887_p014_fig6-7_needles_and_hooks.jpg             needle; the 8-row needle and hook arrangement
    Posselt_1887_p015_fig8_batten_motion.jpg                   batten motion carrying the cylinder
    Posselt_1887_p016_fig9-10_cylinder_and_hammer.jpg          cylinder with lantern; hammer
    Posselt_1887_p017_fig11-13_needle_board_machine_loom.jpg   208-hole needle board; a 400 head; hand loom with head
    Posselt_1887_p019_fig17_laced_cards.jpg                    laced card chain
    Posselt_1887_p022_fig18-21_comber_board_heddles.jpg        comber board; twine and wire heddles
    Barlow_1878_fig126_draw_loom.jpg                           draw loom with draw boy (what Jacquard replaced)
    Barlow_1878_fig128_jacquard_machine_side_section.jpg       section of a hand-loom Jacquard head
    Barlow_1878_p151_fig130-131_needles_hooks_sections.jpg     hooks, needles, spring box and griffe, down and lifted
    Barlow_1878_p153_fig135-139_griffe_and_frame.jpg           griffe, slide bars, frame plans
    Barlow_1878_fig140-142_cylinder_batten_motion.jpg          cylinder batten and catches in three positions
    Barlow_1878_p162_fig144-147_harness_comber_board.jpg       hooks to harness through the comber board; point paper
    Ure_1839_p657_fig566-568_jacquard_loom_elevations.jpg      front and side elevations of a hand loom; head section
    Ure_1839_p658_fig569-573_needles_cylinder_cards.jpg        needles and hooks, cylinder, card chain
```

Only public-domain plates and freely licensed photos (CC0, public domain, CC BY, CC BY-SA, some dual-licensed with the GFDL) are kept here. Nothing NC or ND is kept: the Science Museum Group's CC BY-NC-SA images and all YouTube material are cited as references only, and so are Bradbury's 1912 figures, whose UK copyright status is unknown.
