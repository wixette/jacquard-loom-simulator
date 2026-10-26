# Notes: images, drawings and licences

**Research question:** which freely licensed photos and public-domain technical drawings of the Jacquard loom and Jacquard head can this project use for a 3D/2D simulator, what is the copyright status of the key documentary sources, and which views are still missing.
**Searched:** 2026-10-25. Wikimedia Commons (API: categories `Jacquard looms` and its subcategories two levels deep, `Jacquard Machine`, `Jacquard machines`, `Punched cards of Jacquard looms`, `Punched cards for Jacquard looms`, `Joseph Marie Jacquard`, `Maison des Canuts`, `Textile machines in the Deutsches Museum`, `Drawlooms`, plus full-text searches; 992 files listed, metadata read for about 700; there is no "Category:Woven portrait of Jacquard", the woven portraits are in `Joseph Marie Jacquard`). Note: the Commons API now snaps `iiurlwidth=2000` to its standard sizes (it returned 3840 px or the original), so images were fetched as the standard 1920 px thumbnail; Flickr (CC-filtered search pages, licence codes CC BY, CC BY-SA, CC0, PDM, "no known restrictions"; queries "jacquard loom", "jacquard head", "jacquard mechanism", "jacquard cards"); Internet Archive (advanced search and full-text search inside items: Posselt 1887, Barlow 1878, Ure 1839, Bradbury 1912, Bell 1895, Kohl 1873, American School of Correspondence 1909, Rees plates); Science Museum Group collection pages; INPI historical patent archive (bases-brevets19e.inpi.fr); web search for the 1801 patent and for author death dates. HathiTrust and Gallica were not needed: every book wanted had a full public scan on the Internet Archive.

**Output:** 50 photos and engravings in `../images/commons/` (45 from Commons, 5 from Flickr), 16 book plates in `../images/pd-scans/`, about 36 MB in all. Every file is listed in `../data/photo_catalog.json` (what it shows, author, licence, source) and `../images/ATTRIBUTION.md`. No NC, ND or unclear-licence file was downloaded.

---

## Summary

- **The free photo record is good for the whole loom, the card chain and the harness, and weak for the inside of the head.** The best single set is Dorieo's 15 photos of one double-width hand loom with a Jacquard machine (first half of the 19th century) at the Colegio del Arte Mayor de la Seda, Valencia (CC BY-SA 4.0, originals 7000 px) [Commons-Valencia]. Other useful museum looms: the CNAM 1810 reduced model (two angles, CC0 and CC BY-SA), MOSI Manchester (CC BY 3.0 and Flickr CC BY), National Museum of Scotland (CC BY-SA), Maison des Canuts and Soierie Vivante in Lyon (CC BY-SA), the Deutsches Museum carpet loom of c. 1860 (CC BY 3.0) and the Herbert Museum's 1840 Coventry ribbon loom (Flickr CC BY 2.0, a near-orthographic front view).
- **No free photo shows the hooks, needles and griffe inside a hand-loom head, or a card with a ruler.** These must come from the public-domain drawings, which are excellent: Posselt 1887 gives labelled figures **with dimensions in inches** of the frame, griffe, hooks, needles, cylinder, hammer, needle-board, cards and comber board; Barlow 1878 gives sections of the head and the harness; Ure 1839 gives elevations and a section of an early hand-loom Jacquard.
- **Science Museum Group images are CC BY-NC-SA 4.0** (checked on the object page of the Warner & Sons silk hand loom, 1914-469) and were excluded; they remain useful references.
- **Jacquard's own patent drawings were not found online.** The INPI 1791–1901 patent archive is free to search and its reuse terms are open-data, but the Jacquard file could not be reached with our tools; secondary sources disagree on the date (see below).

---

## Best images per view

File names are under `../images/`. "Licence" is the SPDX id in the catalogue.

| View / detail | Best file(s) | Licence | Why |
|---|---|---|---|
| Whole hand loom, front | `commons/Jacquard_1810.jpg` (CNAM model); `commons/Flickr_kitmasterbloke_54141392252_1840_Jaquard_loom_by_T_Wilkinson_Ltd_of_Coventry.jpg` | CC0-1.0; CC-BY-2.0 | Square-on fronts; the Coventry loom is the closest to an elevation |
| Whole hand loom, front three-quarter | `commons/Wooden_Jacquard_loom_MOSI-11_5544.JPG`, `commons/Machine_à_tisser_Jacquard._Musée_de_la_soie.jpg`, `commons/Telar_manual_y_máquina_de_Jacquard_01.jpg`, `commons/Modèle_réduit_de_métier_à_tisser_Jacquard,_1810.jpg`, `commons/Hand-driven-jacquard-loom.jpg` | CC-BY-3.0; CC0-1.0; CC-BY-SA-4.0; CC-BY-SA-4.0; CC-BY-SA-3.0 OR GFDL | Frame, head position, card chain, beams |
| Whole loom, side | `commons/Maison_des_canuts-37_métier_jacquard.jpg`, `commons/Telar_manual_y_máquina_de_Jacquard_03.jpg`; `commons/Wooden_Jacquard_loom_MOSI-11_5610.JPG` (front-left, from above) | CC-BY-SA-4.0; CC-BY-SA-4.0; CC-BY-3.0 | Lyon loom side; Valencia batten side; MOSI overall proportions |
| Whole loom, back | none | — | See missing views |
| Head, outside | `commons/Telar_de_Jacquard,_Antequera.jpg` (400-hook head alone), `commons/Màquina_de_Jacquard,_col·legi_de_l'Art_Major_de_la_Seda_de_València.JPG`, `commons/Mecanique_Jacquard.jpg`, `commons/NMS_Jacquard_loom_2.JPG`, `commons/Jacquard_loom.jpg` (Oslo) | CC-BY-SA-4.0; CC-BY-SA-3.0; CC-BY-SA-4.0; CC-BY-SA-3.0 OR GFDL; LicenseRef-PublicDomain | Body, cylinder side, lever and pulley |
| Head, cylinder and batten | `commons/Jacquard01.jpg`, `commons/Telar_manual_y_máquina_de_Jacquard_06.jpg`, `commons/Flickr_jmenj_53024962537_Jacquard_hand_loom_detail.jpg` | CC-BY-SA-3.0 OR GFDL; CC-BY-SA-4.0; CC-BY-2.0 | Cylinder with cards; iron lever linkage (MOSI) |
| Head, inside (hooks, needles, griffe, springs) | drawings only: `pd-scans/Posselt_1887_p014_fig6-7_needles_and_hooks.jpg`, `pd-scans/Posselt_1887_p013_fig3-5_catches_griffe_hook.jpg`, `pd-scans/Barlow_1878_fig128_jacquard_machine_side_section.jpg`, `pd-scans/Barlow_1878_p151_fig130-131_needles_hooks_sections.jpg`, `pd-scans/Ure_1839_p657_fig566-568_jacquard_loom_elevations.jpg` | LicenseRef-PublicDomain | Side sections and part drawings, Posselt with dimensions |
| Cylinder, hammer, needle-board (dimensions) | `pd-scans/Posselt_1887_p016_fig9-10_cylinder_and_hammer.jpg`, `pd-scans/Posselt_1887_p017_fig11-13_needle_board_machine_loom.jpg`, `pd-scans/Ure_1839_p658_fig569-573_needles_cylinder_cards.jpg` | LicenseRef-PublicDomain | Dimensions in the text |
| Card chain, frontal (to measure cards and hole layout) | `commons/Tarjetas_perforadas_en_un_telar_de_Jacquard._Colegio_del_Arte_Mayor_de_la_Seda_de_Valencia.jpg`, `commons/17._Maison_des_Canuts_-_métier_à_tisser.JPG`, `commons/Flickr_pedrik_24093489692_Punched_cards_from_a_Jacquard_loom.jpg`, `commons/Masson_Mills_WTM_13_Hattersley_Jacquard_5976.JPG` (single power-loom card) | CC-BY-SA-4.0; CC-BY-SA-3.0 OR GFDL; CC-BY-2.0; CC-BY-SA-3.0 | Hole grid, lacing, peg holes; no scale in view |
| Cards laced, drawn | `pd-scans/Posselt_1887_p019_fig17_laced_cards.jpg`, `commons/Textiles;_a_type_of_Jacquard_card_for_silk_weaving._Engravin_Wellcome_V0024104.jpg` | LicenseRef-PublicDomain; CC-BY-4.0 | Lacing pattern |
| Harness, neck cords, comber board | `commons/Haslach_an_der_Mühl_-_Textiles_Zentrum_Haslach_-_10_-_Jacquardwebmaschine_-_Detail.jpg`, `commons/A_Jacquard_loom_showing_information_punchcards,_National_Museum_of_Scotland.jpg`, `commons/Flickr_15168532-N00_6307719950_Jacquard_Loom.jpg`, `commons/Complicated_hand-loom_for_silk_weaving,_Kanchipuram,_Tamil_Nadu.jpg` | CC-BY-SA-3.0; CC-BY-SA-4.0; CC-BY-SA-2.0; CC-BY-2.0 | Harness fan through the comber board |
| Mails and lingoes | `commons/Telar_manual_y_máquina_de_Jacquard_05.jpg`, `commons/Flickr_15168532-N00_6307720732_Jacquard_Loom_Strings.jpg`, `commons/Master_Weaver's_Thesis_Book,_..._(CH_18556803-88).jpg` and `-129` | CC-BY-SA-4.0; CC-BY-SA-2.0; LicenseRef-PublicDomain | Photo plus 1848 hand drawings |
| Harness tie-up, drawn | `pd-scans/Barlow_1878_p162_fig144-147_harness_comber_board.jpg`, `pd-scans/Posselt_1887_p022_fig18-21_comber_board_heddles.jpg`, `commons/Master_Weaver's_Thesis_Book,_..._(CH_18556803-191).jpg`, `-222` | LicenseRef-PublicDomain | How hooks reach the warp; the shed opening |
| Draw loom (what Jacquard replaced) | `pd-scans/Barlow_1878_fig126_draw_loom.jpg` | LicenseRef-PublicDomain | Weaver and draw boy |
| Power loom with Jacquard (later context) | `commons/Textiles;_a_mechanical_Jacquard_loom,_front_and_rear_elevati_Wellcome_V0024097.jpg`, `commons/PSM_V39_D325_Carpet_loom_with_jacquard_attachment.jpg`, `commons/DMM_29263ab_Jacquardwebstuhl.jpg` | CC-BY-4.0; LicenseRef-PublicDomain; CC-BY-3.0 OR GFDL | Front and rear elevations |
| Verdol paper-band variant | `commons/Jacquard_loom_p1040320.jpg` | CC-BY-SA-3.0 OR GFDL | CNAM 10145 |
| Card punching | `commons/Masson_Mills_WTM_10_Jacquard_Card_Cutter_5890.JPG` | CC-BY-SA-3.0 | Piano card cutter |
| Woven portrait | `commons/Geweven_portret_..._RP-F-2013-22-61.jpg` (Rijksmuseum), `commons/Machine-loomed_silk_portrait_of_Joseph-Marie_Jacquard_Wellcome_L0020370.jpg` (size given: 25 x 19.8 cm, image 19 x 14 cm), `commons/Picture_MET_117330.jpg` (the 1844 woven picture of Carquillat's workshop, showing a Jacquard loom) | CC0-1.0; CC-BY-4.0; CC0-1.0 | Whole object; none shows individual picks |

### Public-domain plates downloaded (`../images/pd-scans/`)

Page numbers are as printed; "leaf nN" is the 0-based page index in the Internet Archive item (use it to open the page directly: `https://archive.org/details/<id>/page/nN`).

| File | Source, page, figures | Shows |
|---|---|---|
| `Posselt_1887_p011_fig1_frame_side_view.jpg` | [Posselt1887] p. 11, Fig. I (n16) | Side view of the frame of a 200-hook machine, list of parts, frame dimensions |
| `Posselt_1887_p013_fig3-5_catches_griffe_hook.jpg` | p. 13, Figs. III–V (n18) | Cylinder catches; griffe (top view, dimensions); hook (wire gauge, dimensions) |
| `Posselt_1887_p014_fig6-7_needles_and_hooks.jpg` | p. 14, Figs. VI–VII (n19) | Needle (dimensions); 8-row arrangement of needles and hooks |
| `Posselt_1887_p015_fig8_batten_motion.jpg` | p. 15, Fig. VIII (n20) | Batten motion carrying the cylinder |
| `Posselt_1887_p016_fig9-10_cylinder_and_hammer.jpg` | p. 16, Figs. IX–X (n21) | Cylinder with lantern; hammer (dimensions) |
| `Posselt_1887_p017_fig11-13_needle_board_machine_loom.jpg` | p. 17, Figs. XI–XIII (n22) | Needle-board (208 holes for a 200 machine); perspective of a 400 machine; hand loom with head |
| `Posselt_1887_p019_fig17_laced_cards.jpg` | pp. 18–19, Figs. XVI–XVII (n24) | Laced card chain |
| `Posselt_1887_p022_fig18-21_comber_board_heddles.jpg` | p. 22, Figs. XVIII–XXI (n27) | Comber board; twine and wire heddles |
| `Barlow_1878_fig126_draw_loom.jpg` | [Barlow1878] Fig. 126, full-page plate (n153, near pp. 138–139) | Draw loom with draw boy |
| `Barlow_1878_fig128_jacquard_machine_side_section.jpg` | Fig. 128, full-page plate (n164, between pp. 148 and 151) | Section of a hand-loom Jacquard |
| `Barlow_1878_p151_fig130-131_needles_hooks_sections.jpg` | p. 151, Figs. 130–131 (n166) | Hooks, needles, spring box, griffe, down and lifted |
| `Barlow_1878_p153_fig135-139_griffe_and_frame.jpg` | p. 153, Figs. 135–139 (n168) | Griffe, slide bars, frame plans |
| `Barlow_1878_fig140-142_cylinder_batten_motion.jpg` | Figs. 140–142 (n170, about p. 155) | Cylinder batten and turning catches in three positions |
| `Barlow_1878_p162_fig144-147_harness_comber_board.jpg` | p. 162, Figs. 144–147 (n177) | Hooks to harness through the comber board; point-paper design |
| `Ure_1839_p657_fig566-568_jacquard_loom_elevations.jpg` | [Ure1839] p. 657, Figs. 566–568 (n676) | Front and side elevations of a hand loom with Jacquard head; head section |
| `Ure_1839_p658_fig569-573_needles_cylinder_cards.jpg` | p. 658, Figs. 569–573 (n677) | Needles and hooks, cylinder, card chain |

Barlow's printed page numbers on the full-page plates are not visible; the IA page-number file disagrees with the printed numbers by two pages in this range, so the plates are cited by figure number.

### Further public-domain drawings, not downloaded

- **Bradbury 1912** [Bradbury1912], *Jacquard Mechanism and Harness Mounting* (Manchester: John Heywood). Public domain **in the US** (published abroad before 1931). In the UK it is protected until 70 years after the author's death; Fred Bradbury's death date was **not found** (web searches gave no obituary), so the UK status is unknown and nothing was downloaded, in line with docs/licensing.md (pre-1900 scans only). Part II "Modern Jacquard Mechanisms" starts at leaf n72; the single-lift machine figures are at about leaves n74–n100 (pp. 69–95). Facts and dimensions may be used with a citation.
- **Bell 1895** [Bell1895], *Jacquard Weaving and Designing* (Longmans): pre-1900, IA marks it NOT_IN_COPYRIGHT. Many head and harness figures (griffe on 59 pages). Not reviewed page by page.
- **Kohl 1873** [Kohl1873], *Geschichte der Jacquard-Maschine*: history, with a portrait of Jacquard; plates not reviewed.
- **Posselt 1893** (later edition, *Jacquard Machine; Analyzed & Explained ...*, IA `gri_33125000604195`) and **American School of Correspondence 1909** [ASC1909] (US, pre-1931): alternatives to Posselt 1887.
- **Marsden 1895**, *Cotton Weaving*: four small figures already on Commons (`Jacquard 133-Marsden.png` to `Jacquard 136 Leno-Marsden.png`, PD, about 550 px).
- **Rees's Cyclopaedia** plates (1820, IA `cyclopaediaoru01rees` etc.): its weaving plates predate the spread of the Jacquard machine in Britain and were not searched page by page.
- **Diderot's Encyclopédie** draw-loom plates ("Soierie", plates volume XI, 1772): not on Commons under a findable name; Barlow's Fig. 126 covers the draw loom instead. `Encyclopédie méthodique - Planches 2, 1, Soierie, Pl1.png` (PD, 4020 x 5444) is on Commons but was not viewed.
- **Nuova enciclopedia popolare** 1849 plate (`Telaio_Jacquard_1849.jpg`) was downloaded but is only 722 px wide; BEIC holds the scan.

---

## Jacquard's 1801 patent

- **What it covered.** Secondary sources describe a French *brevet d'invention* for a machine to replace the *tireur de lacs* (draw boy) in weaving figured fabrics, for ten years [Napoleon-org]. One account says the first machine worked with a limited number of pedals and was not the card machine; the card mechanism was completed in 1804–06 [Universalis]. So the 1801 patent drawings, if they survive, would show a precursor, not the head modelled here.
- **Date and number conflict.** Napoleon.org dates the patent 23 December 1801 [Napoleon-org]; historyofinformation.com gives brevet no. 245, 23 December 1801 (per search snippet; the page itself did not load) [HoI-441]; another source dates it 2 nivôse an IX, which is 23 December **1800** (search snippet only). The year depends on converting the Republican calendar; this was **not verified** against the INPI file.
- **Availability.** The INPI has put its historical archive of French patents 1791–1901 (about 410,000 patents) online free of charge [INPI-2024]. The search site is https://bases-brevets19e.inpi.fr/ [INPI-site]; its search is driven by JavaScript and the Jacquard file could not be opened with our tools (data.inpi.fr returns a Cloudflare check). The maintainer can search by inventor name "Jacquard" in a browser.
- **Status.** The 1801 drawings themselves are long out of copyright. The INPI terms say reuse of public information follows Book III of the Code des relations entre le public et l'administration and that an open-data licence approved by the State is available on request [INPI-CGU]; the 2024 press release reports reuse is free provided the INPI is cited as the source [INPI-2024] (from the press release summary; the PDF was not read in full). Treat INPI scans as reusable with the credit "Source: INPI".
- **Other originals.** No original Jacquard drawings were found on Commons. The CNAM holds the 1810 reduced model (inv. 7641) photographed here; the Musée des Tissus, Lyon, and the Lyon municipal archives were not searched.

---

## Copyright status of the key sources

| Source | Status | Use in the repo |
|---|---|---|
| Posselt 1887 (Philadelphia) [Posselt1887] | US publication before 1931: public domain in the US; LoC scan, "no known copyright restrictions" | Plates downloaded |
| Barlow 1878 (London/Philadelphia) [Barlow1878] | Pre-1900 publication (project rule); US public domain. Author's death date not checked | Plates downloaded |
| Ure 1839 (London) [Ure1839] | Author died 1857: public domain everywhere; Wellcome scan marked Public Domain Mark | Plates downloaded |
| Master Weaver's Thesis Book 1848, Cooper Hewitt 1939-40-1 [CH1848] | 1848 manuscript, public domain; Commons PD-old-100 | 4 pages downloaded |
| Bradbury 1912 (Manchester) [Bradbury1912] | US public domain; UK status unknown (death date not found) | Reference only |
| Bell 1895, Kohl 1873 | Pre-1900 | Not downloaded (not needed yet) |
| Wellcome Collection images [Wellcome] | Engravings public domain; Wellcome photographs CC BY 4.0 | Downloaded, CC-BY-4.0 |
| Rijksmuseum, Metropolitan Museum images | CC0 | Downloaded |
| Science Museum Group collection [SMG-1914-469] [SMG-1867-model] [SMG-Archer] | Image pages say "released under a CC BY-NC-SA 4.0 Licence"; commercial use via the Science and Society Picture Library | **Excluded** (NC). Useful references: Warner & Sons silk hand loom with Jacquard machine, c. 1825–40, **400 needles**, overall 2800 x 1630 x 3050 mm (1914-469/1); 1:2 model of a Jacquard loom, 1867; W. Archer (Bolton) Jacquard hand loom, c. 1910 |
| Computer History Museum catalogue 102689079 | Licence not stated | Excluded; reference only (photo of a card mechanism, c. 1980) |
| INPI patent archive [INPI-CGU] | Open-data reuse with credit | Nothing downloaded |
| YouTube videos (museum demonstrations) | Standard YouTube licence, copyrighted | Watch for motion reference only; do not copy frames |
| Modern textbooks and museum guides | Copyrighted | Facts and dimensions only, with citation, per docs/licensing.md |

---

## Licences found and SPDX ids used

Licences seen on candidate files: CC BY-SA 4.0 (most common), CC BY-SA 3.0 (often dual with GFDL), public domain, CC0, CC BY-SA 2.0 (and 2.0 fr), CC BY 3.0, CC BY 2.0, CC BY 4.0 (Wellcome), CC BY 2.5, "No restrictions" (Internet Archive Book Images on Commons), Licence Ouverte (one French archive portrait, not downloaded), Flickr Public Domain Mark (one, not downloaded). The Science Museum Group's CC BY-NC-SA 4.0 was seen and excluded. No ND licence appeared.

**SPDX ids used in `../data/photo_catalog.json`** (for REUSE.toml):

- `CC0-1.0`
- `LicenseRef-PublicDomain`
- `CC-BY-2.0`
- `CC-BY-3.0`
- `CC-BY-4.0` (`LICENSES/CC-BY-4.0.txt` was added with this research pack)
- `CC-BY-SA-2.0`
- `CC-BY-SA-3.0`
- `CC-BY-SA-4.0`
- `GFDL-1.2-or-later` (only as the alternative in dual-licensed files: `CC-BY-SA-3.0 OR GFDL-1.2-or-later`, `CC-BY-3.0 OR GFDL-1.2-or-later`)

A REUSE.toml annotation would be (as proposed at the time; the one applied is in `REUSE.toml`):

```toml
# Wikimedia Commons and Flickr photos, engravings and public-domain book plates: mixed licences.
# The authoritative per-file licence, author and source URL are in
# research/data/photo_catalog.json
[[annotations]]
path = ["research/images/commons/**", "research/images/pd-scans/**"]
precedence = "override"
SPDX-FileCopyrightText = "Wikimedia Commons and Flickr contributors; E. A. Posselt (1887), A. Barlow (1878), A. Ure (1839) - public domain (see research/data/photo_catalog.json)"
SPDX-License-Identifier = "CC0-1.0 OR LicenseRef-PublicDomain OR CC-BY-2.0 OR CC-BY-3.0 OR CC-BY-4.0 OR CC-BY-SA-2.0 OR CC-BY-SA-3.0 OR CC-BY-SA-4.0 OR GFDL-1.2-or-later"
```

---

## Free but not downloaded (alternates if needed)

- **Commons:** the rest of the Valencia series (`Telar manual y máquina de Jacquard 02, 04, 08–11, 13–15`, CC BY-SA 4.0, up to 7000 px); `Maison du textile de Fresnoy-le-Grand - Métier Jacquard ...` (7 photos, CC0, 6000 x 4000, a room of hand looms with heads and cards); `Esporles. La Granja. Teler de Jacquard.jpg`, `Museo del tessile - Leffe, Telai Jacquard.jpg`, `MuzEtnoBv6.jpg`, `Muzeum Rumburk 06.jpg` (all CC0); `NMS Tartan and Jacquard loom.JPG`; `Herbert Art Gallery and Museum - Jacquard Loom.JPG` (CC BY-SA 3.0) and `Herbert Art Museum and Gallery, Coventry - Jacquard loom.jpg` (CC BY 2.0); `Muzeum Tkactwa ... maszyna żakardowa 15.07.2023 p.jpg` (whole loom, CC BY-SA 3.0); Joanbanjo's two photos of the same Valencia loom (`Teler manual de doble amplada amb màquina de Jacquard ...`, CC BY-SA 3.0); power looms: Sjöllingstad 1939 Schönherr series (CC BY-SA 3.0), `TEZ-Jacquardwebmaschine Hübner 7237–7287` (CC BY-SA 4.0), Masson Mills Hattersley 5970/5975/5977, `Queen Street Mill Jacquard Cards 8618.JPG`; card punching: `Kartenschlagmaschine*.JPG`, `Máquina perforadora de tarjetas ... Antequera` (CC BY-SA 4.0); engravings: `Textiles; a mechanical Jacquard loom, three-quarter view ... Wellcome V0024155EL.jpg` (CC BY 4.0), Meyers and Brockhaus-Efron loom plates (PD); woven portrait: `À la mémoire de J.M. Jacquard LCCN2002737214.tif` (Library of Congress, PD, large TIFF), `Machine-loomed silk portrait ... Wellcome L0020371.jpg` (CC BY 4.0), `A la mémoire de J.M. Jacquard.jpg` (PD); `Visite de Mgr le Duc d'Aumale à la Croix-Rousse ... 1841.jpg` (PD print of the same scene as the MET woven picture).
- **The rest of the 1848 thesis book** (333 pages on Commons, PD; mostly point-paper designs and fabric samples, with harness drawings on about a dozen pages, e.g. -56, -168, -268, -287, -300).
- **Flickr:** George Williams (ghwpix) "Jacquard Loom 1/6–6/6", MOSI (CC BY-SA 2.0, 480 x 640; the same photos are on Commons as `Jacquard loom, 1 of 6.jpg` etc.); Andrew Plumb, Ontario Science Centre working loom, 4 photos (CC BY-SA 2.0); David Baron, Maison des Canuts cards (CC BY-SA 2.0); Elliott Brown, Masson Mills (CC BY-SA 2.0); Cory Doctorow, Science Museum London card display (CC BY-SA 2.0); moof (secretagentmoof), two CNAM models (CC BY 2.0; its captions date them 1725/1728, so they are probably the Bouchon/Falcon models, not Jacquard's).

---

## Missing views (no free image found)

1. **Inside a hand-loom head**: hooks, needles, griffe knives and spring box seen from above or the side with the cover or side boards removed. Only drawings (Posselt, Barlow, Ure) show them. The Antequera 400-hook head is the best outside view.
2. **Card or cylinder with a scale** (ruler or known object). Card size and hole pitch must come from Posselt's text or from a museum. No free photo gives hand-loom card dimensions.
3. **True orthographic elevations** of a hand loom: side and back. The Coventry front (Flickr) is the only near-orthographic view; side views are oblique, and **no back view** of a hand loom with its warp beam was found.
4. **Plan (top) view** of the whole loom and of the head.
5. **Comber board** seen from above or below on a hand loom, with its hole grid. Photos show it edge-on only (Haslach, Flickr harness display).
6. **The full lift linkage on a hand loom**: treadle → cord or lever → griffe. Partial views only (`Mecanique_Jacquard.jpg`, the MOSI detail on Flickr).
7. **Needle ends and spring box** on the side opposite the cylinder.
8. **The woven portrait at macro scale** (individual picks). The free scans show the whole object at 1,200–2,500 px.
9. **Jacquard's original machines and patent drawings** (1801–1805): none found online; the CNAM reduced model of 1810 is the earliest object photographed.
10. **Museums named in the brief without free photos:** Science Museum, London (only CC BY-NC-SA collection images, plus one Flickr CC BY-SA photo of a card display); Paisley Museum (nothing found on Commons or Flickr); Lyon's Musée des Tissus (nothing found). Manchester, Edinburgh, CNAM, the Deutsches Museum and Lyon's Maison des Canuts/Soierie Vivante are covered.

Points 1, 2, 5 and 7 could be closed by asking a working museum (Soierie Vivante or Maison des Canuts in Lyon, MOSI, Paisley Thread Mill Museum) for photos under a free licence, or by photographing a loom with a scale (maintainer action). Asking the Science Museum Group for permission to use its CC BY-NC-SA images in the repo is another route.

---

## Sources

- **[Commons-cat]** Wikimedia Commons, Category:Jacquard looms and subcategories, https://commons.wikimedia.org/wiki/Category:Jacquard_looms (read through the API https://commons.wikimedia.org/w/api.php, 2026-10-25). Per-file licences from each file page.
- **[Commons-Valencia]** Dorieo, "Telar manual y máquina de Jacquard 01–15", 2016, Wikimedia Commons, CC BY-SA 4.0, e.g. https://commons.wikimedia.org/wiki/File:Telar_manual_y_m%C3%A1quina_de_Jacquard_01.jpg
- **[Flickr]** Flickr search with CC licence filter, https://www.flickr.com/search/?text=jacquard%20loom&license=4%2C5%2C7%2C9%2C10 (and "jacquard head", "jacquard mechanism", "jacquard cards"), 2026-10-25.
- **[Posselt1887]** E. A. Posselt, *The Jacquard Machine Analyzed and Explained: with an Appendix on the Preparation of Jacquard Cards*, Philadelphia: Pennsylvania Museum and School of Industrial Art, 1887. Scan: Library of Congress / Internet Archive, https://archive.org/details/jacquardmachinea00poss (166 leaves).
- **[Barlow1878]** Alfred Barlow, *The History and Principles of Weaving by Hand and by Power*, London: Sampson Low, Marston, Searle & Rivington; Philadelphia: H. Carey Baird, 1878. Scan: Getty Research Institute / Internet Archive, https://archive.org/details/historyprinciple00barl (492 leaves).
- **[Ure1839]** Andrew Ure, *A Dictionary of Arts, Manufactures, and Mines*, London: Longman, Orme, Brown, Green & Longmans, 1839, article "Jacquard loom", pp. 656–660. Scan: Wellcome Library / Internet Archive (Public Domain Mark), https://archive.org/details/b2930345x
- **[Bradbury1912]** Fred Bradbury, *Jacquard Mechanism and Harness Mounting*, Manchester: John Heywood, 1912. Scan: Smithsonian Libraries / Internet Archive, https://archive.org/details/jacquardmechanis00brad
- **[Bell1895]** T. F. Bell, *Jacquard Weaving and Designing*, London and New York: Longmans, Green, 1895. https://archive.org/details/gri_33125001153218
- **[Kohl1873]** Friedrich Kohl, *Geschichte der Jacquard-Maschine*, 1873. https://archive.org/details/11155862bsb
- **[ASC1909]** American School of Correspondence (H. W. Nelson), *Jacquard Machines; Instruction Paper*, Chicago, 1909. https://archive.org/details/jacquardmachines00amer
- **[CH1848]** *Master Weaver's Thesis Book, Systeme de la Mecanique a la Jacquard*, France, 1848, manuscript, Cooper Hewitt, Smithsonian Design Museum, 1939-40-1, https://collection.cooperhewitt.org/objects/18556803 ; page photos on Commons, Category:Systeme de la Mecanique a la Jacquard, 1848.
- **[Wellcome]** Wellcome Collection, engravings V0024097 (https://wellcomecollection.org/works/trkmvx96), V0024104 (https://wellcomecollection.org/works/yq6jrvft) and woven portrait L0020370, via Commons, CC BY 4.0.
- **[SMG-1914-469]** Science Museum Group, "Hand loom for silk weaving with Jacquard machine", Warner and Sons, c. 1825, object 1914-469, https://collection.sciencemuseumgroup.org.uk/objects/co45141/loom-shears (image licence CC BY-NC-SA 4.0; read 2026-10-25).
- **[SMG-1867-model]** Science Museum Group, "Model of a Jacquard loom, with shuttle and components", https://collection.sciencemuseumgroup.org.uk/objects/co44888/model-of-a-jacquard-loom-model-jacquard-loom (CC BY-NC-SA 4.0, per search result).
- **[SMG-Archer]** Science Museum Group, "Jacquard Hand Loom", W. Archer, Bolton, c. 1910, https://collection.sciencemuseumgroup.org.uk/objects/co8405056/jacquard-hand-loom (CC BY-NC-SA 4.0, per search result).
- **[INPI-site]** INPI, Archives historiques (brevets d'invention 1791–1901), https://bases-brevets19e.inpi.fr/
- **[INPI-CGU]** INPI, Archives historiques, "Conditions générales d'utilisation", art. 3 and 6.4, https://bases-brevets19e.inpi.fr/conditions-generales-dutilisation (read 2026-10-25).
- **[INPI-2024]** INPI, press release "Les archives historiques de l'INPI désormais accessibles librement", 13 March 2024, https://inpi.fr/sites/default/files/CP%20INPI%20les%20archives%20historiques%20de%20l'INPI%20d%C3%A9sormais%20accessibles%20librement.pdf (summary via web search; not read in full).
- **[Napoleon-org]** Fondation Napoléon, "Jacquard, Joseph-Marie (1752-1834), mécanicien, tisserand", https://www.napoleon.org/histoire-des-2-empires/biographies/jacquard-joseph-marie-1752-1834-mecanicien-tisserand/
- **[Universalis]** Encyclopædia Universalis, "Jacquard Joseph-Marie (1752-1834)", https://www.universalis.fr/encyclopedie/joseph-marie-jacquard/
- **[HoI-441]** Jeremy Norman, HistoryofInformation.com, entry 441 (Jacquard loom), https://historyofinformation.com/detail.php?id=441 (cited from search snippet; the page did not load).
