# Notes: value check (existing simulators, models and kits)

**Research question:** does an open, web-native, operable simulator of the Jacquard loom (or a reusable model or kit) already exist, so that we should reuse or partner instead of building?
**Searched:** 2026-10-25. Sketchfab (public API: `jacquard`, `jacquard loom`, `jacquard head`, `punch card loom`, `loom`, plus model detail calls); Printables (GraphQL API: `jacquard`, `jacquard loom`, `punch card loom`, `loom punch card`); Thingiverse, GrabCAD, TurboSquid and CGTrader (searched in a browser); GitHub (REST search API, about 25 queries such as `jacquard loom`, `jacquard simulator`, `punch card loom`, `weave draft`, `weaving information file`, `loom three.js`, `adacad`, `tc2 loom`, `pixeloom`; READMEs, licence files and `package.json` read for the relevant hits); GitLab API (WeaveMe); Scratch API (project search for `jacquard`, `jacquard loom`); Smithsonian Open Access API; Crossref API (HCI papers); YouTube (search page in a browser, titles checked by oEmbed); web search engine for museum interactives, kits, LEGO, Hackaday, Instructables, unplugged lessons and French museum projects. Two live web apps (Sirkas, von Ahnen) were opened and operated in a browser.
**Not reachable or not checked:** the LIRIS internship PDF (connection refused, then HTTP 429 from the Wayback Machine); cgcookie.com (HTTP 403); handweaving.net (the fetch returned only the page title); Paisley Museum "interactive weaving studio" page (HTTP 404); MIT K12Maker weaving page (HTTP 404); the CSULB Jacquard lab page (TLS certificate rejected); Cults3D and Free3D (not checked this time; Cults3D showed a bot check in an earlier check on 2026-10-20, which was not bypassed).

Licence rule used throughout: "none stated" = all rights reserved by default = not reusable. NC (non-commercial) licences are treated as **not compatible** with our CC BY-SA 4.0 / Apache-2.0 outputs.

---

## Verdict

**No.** Nothing open, web-based and operable models the **real Jacquard mechanism**: the needles, the hooks, the griffe (knife box) lifting the hooks, the card cylinder (prism) turning and pressing the card chain, and the needle springs pushing the needles back, driven by a card chain the user writes and weaving the cloth that results. We found **no** such thing in any form: web, desktop, Flash-era, Scratch, VR/Unity, mobile app or museum kiosk.

**Closest prior art (digital):** "Jacquard" by Anu Sirkas, a three.js web app published on **2026-10-08**, less than three weeks before this check ([sirkas2026]). It shows the cause and effect well: a chain of punch cards steps through a head, harness cords light up and lift warp threads, and a damask cloth is woven in 3D. But it is abstract. The head is a closed box with **no needles, hooks, griffe or cylinder**. The user cannot write cards: the only input is a name, which is encoded as UTF-8 bits. It also has **no licence file**, so it is not reusable. The second closest is Till von Ahnen's Rust/WASM "loom simulator" ([vonahnen2024]). It is 2D: you step through a loaded deck of cards and see the cloth grow. There is no mechanism view and the source is not public.

**Closest prior art (mechanism):** Chris Fenton's 3D-printable **3-hook (2012) and 10-hook (2013) Jacquard-style punch-card readers** on Thingiverse ([fenton2012], [fenton2013]). They have a crank, a griffe, hooks, needles with springs and a card cylinder, and they are based on T. W. Fox's *The Mechanism of Weaving*. They are released under **CC0 (Public Domain Dedication)**, so their geometry and assembly notes can be reused freely. They are physical kits, not software.

**Best view-only explainers:** Macclesfield Museums' Paradise Mill videos ([macc-yt1], [macc-yt2]), National Museums Scotland ([nms-yt]), the V&A ([vam-yt]) and a 3D animation by Sharan Ajith ([ajith-yt]). Students can watch them but cannot operate anything, and none of them can be reused.

**So a browser simulator of the real mechanism would be new work.** The open ground is the same as in the Leibniz and Altair checks:
1. the real head (needles, hooks, griffe, cylinder, springs, harness, heddles, shed), not a box;
2. a card chain the student writes, then watches being read, row by row;
3. the cloth that results, with a link back from each thread to its card hole;
4. web-native delivery with an open licence and lesson material.

**Reuse and partner leads:**
- **Fenton's CC0 readers**, for geometry and kinematics ideas.
- **AdaCAD's drafting library** ([adacad]), whose `package.json` says LGPL-3.0-or-later. It could serve as an optional draft or WIF import/export path, or a partnership with Laura Devendorf's Unstable Design Lab. Check how LGPL applies to bundled JavaScript before using it as code.
- **LIRIS / IUT Lyon 1 with the Musée des Soieries Bonnet** ([liris2025]). A 2025 internship aimed at a **three.js** tool that reproduces a fabric from a punched-card image and includes a simplified reproduction of the mechanism. This is the same goal as ours. No public code was found. It is a strong partner lead.
- **Macclesfield Museums** (Paradise Mill), who demonstrate the mechanism on video and had a Raspberry Pi visitor simulator in 2014 ([rpi2014]).
- The **Saint-Étienne Musée d'Art et d'Industrie** model on Sketchfab ([farhi2018]), for model data.

---

## Q1. Interactive simulators (web, desktop, Scratch, museum kiosks, VR, mobile)

### Takeaway
Ten or more interactive items exist, but **none animates the mechanism inside the head**. The two web apps (Sirkas 2026, von Ahnen 2024) both map cards to cloth, and neither has a usable licence. Museum interactives are on-site only or broken. No VR/Unity or mobile Jacquard simulator was found.

### Table

| # | Item (author, date) | What it is | Interactive? | Shows mechanism? | Licence | Available 2026-10-25? | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | **"Jacquard"** ([sirkas2026]): Anu Sirkas, repo created 2026-10-08, last push 2026-10-14, [live](https://jacquard-loom.vercel.app) | three.js + TypeScript + Vite web app. Name → UTF-8 bits → 4×4 blocks → five-end satin damask draft → one punch card per row. A chain of 4 visible cards steps through the head, harness cords to each warp turn brass when lifted, and the cloth is 2 × 4,096 instanced capsules that ripple off the loom and turn over. Reduced-motion support, PNG download, unit and e2e tests | Yes: type a name, weave, turn the cloth, download | **Partly.** Card → cord → thread is shown. The head is a box: `src/loom.ts` (466 lines) has cards, cords, a beam and heddles, but no needles, hooks, griffe or cylinder. The user cannot edit cards | **None stated** (no LICENSE file) | Yes | **Closest prior art**, and very recent. It shows the idea is attractive and doable in plain three.js. Not mechanism-level, not reusable |
| 2 | **"loom simulator"** ([vonahnen2024]): Till von Ahnen (GitHub user xoryouyou), blog post 2024-11-24, [live](https://xoryouyou.github.io/loom/) | Rust + egui compiled to WASM. A deck of 64 cards (25 × 5 holes) is loaded. Controls: step back/forward, AutoStep, "show current card", weft/warp colour, drawing scale, File menu. A 2D cloth grid grows | Yes (operated on the check date) | **No.** The blog text explains hooks, needles, needleboard, springbox and heddles, but the app shows only the card and the cloth | **None stated**. No public source repo found under the user | Yes | 2D card-to-cloth only |
| 3 | **Scratch "Jacquard Loom - The Game"** ([scratch-bitme]): Paulo Tavares (bitme), 2016-09-13, 1,060 views | 12-level puzzle: "program" a colour switch with `>`, `<`, `=`, `0` to match a target pattern | Yes | No | Scratch's site terms put shared projects under CC BY-SA 2.0 | Yes | A nice unplugged-style CS puzzle. Not the loom |
| 4 | **Other Scratch projects** ([scratch-misc]): "The jacquard loom!" (darmax99, 2010, 29 views); "Victorian Programming" (2014; uses Sydney Padua drawings and Google Images photos, so its rights are doubtful); K12Maker "Weave Plain and Basket" (2020, 421 views, 15 remixes; draws plain and basket weaves with pen and stamp); about 10 school "history of computers" slideshows | Animations, slideshows, weave drawing | Some | No | CC BY-SA 2.0 (Scratch terms) | Yes | Context only |
| 5 | **Macclesfield Silk Museum Raspberry Pi Jacquard simulator** ([rpi2014]), 2014 | Visitor demonstration model showing how card holes relate to woven lines | Yes (on site) | Not described | Not stated; no source linked | Not verified | Shows demand. Contact via Macclesfield Museums |
| 6 | **FIRGELLI "Jacquard Repeated-Tie Allocation Explorer"** ([firgelli2026]), 2026-04-26 | Animated calculator: hooks × repeats → harness-cord ties and warp ends. Says it is "a topology and allocation illustration, not a dimensional machine simulation" | Yes (sliders, play) | Hooks and harness ties only, as a diagram | © all rights reserved | Yes | Good idea for a "harness tie" side panel. Not reusable |
| 7 | **Herbert Art Gallery & Museum, Coventry: Jacquard demonstration terminal** ([register2026]) | Kiosk screen meant to show a Jacquard loom in action. On 2026-10-19 it was showing a PC battery warning instead | Kiosk | Unknown | n/a | On site; reported broken | Shows that kiosk interactives decay. Not online |
| 8 | **Paisley Museum reimagined: game with Paisley YMCA** (search snippet only, page 404) ([paisley]) | Planned visitor game about the Jacquard loom, alongside live weaving demonstrations | Planned | Unknown | Unknown | Page gone | Lead only |
| 9 | **LIRIS / IUT Lyon 1 internship "animation de tissu Jacquard"** with the Musée des Soieries Bonnet, Jujurieux (F. Jaillet, J.-P. Farrugia), 2025 ([liris2025]) | Planned tool that rebuilds a fabric in 3D from a **punched-card image**, with a simplified reproduction of the mechanism and a playful museum activity. **three.js**, possibly OpenCV and Blender. Extensions: satin sheen, cloth in the wind | Planned (web) | Planned, "simplified" | Unknown | PDF not reachable; no code found on GitHub or the Lyon 1 GitLab | **Best partner lead**: same goal and stack, academic and museum backing |
| 10 | **Haus der Seidenkultur** (Krefeld) AR/MR silk-heritage presentations ([doaj-silk]) | Multimodal and AR/MR museum presentation, in a former silk works where Jacquard weaving still runs | On site | Unknown | Article open access | Not checked in depth | Context |
| 11 | **Luke Duncalfe, "Jacquard Loom Panels 1, 2, 4, 5 & 7"** (Rhizome ArtBase) ([rhizome]) | Clickable Shockwave/Flash art piece about the card panels | Was | No | Artwork | Needs the Flash/Shockwave plugin, so effectively dead | Shows the plugin-death risk |
| 12 | **CHM "Revolution" online, "Automating an Art: The Jacquard Loom"** ([chm-rev]) | Text and 4 images (fabric, card chain, card close-up, weaver) | No | No | © CHM | Yes | Context. No interactive online |
| 13 | **Commercial Jacquard CAD**: ArahWeave ([arahne]), NedGraphics ([nedgraphics]); TC2 controller software ([tc2]); AVL Jacq3G ([avl]) | Industrial and studio design software with fabric simulation; loom drivers | Yes (paid desktop) | No (design → cloth) | Proprietary | Yes | Not for classrooms. Shows how the modern workflow (image → draft → loom) works |
| 14 | VR/Unity, mobile apps | Web searches for Jacquard + VR, Unity, "virtual museum", App Store, Google Play found nothing | — | — | — | — | **None found** |

---

## Q2. 3D models

### Takeaway
There are **four** 3D Jacquard looms on Sketchfab: one photogrammetry scan, one workshop model made with a museum, and two others. **None is openly licensed, rigged or animated, and none is downloadable for free.** There are no Jacquard models on Printables, GrabCAD, TurboSquid or the Smithsonian 3D collection. CGTrader search does not work. The only **openly licensed mechanism geometry** is Fenton's CC0 Thingiverse readers (Q5).

### Table

| # | Item (author, date) | What it is | Faces | Rigged/animated? | Licence | Available? | Verdict |
|---|---|---|---|---|---|---|---|
| 15 | [Sketchfab "Jacquard Loom"](https://sketchfab.com/3d-models/jacquard-loom-813f886ee1ff489c986785c4838fb58a) (wboony, 2021-01-19) ([sf-wboony]) | Exterior model of a Jacquard loom, no description; 3,981 views | 149,888 | No (0 animations) | **None stated**, not downloadable | Yes (view) | Visual reference only |
| 16 | [Sketchfab "Métier à tisser Jacquard"](https://sketchfab.com/3d-models/metier-a-tisser-jacquard-22ddec1d97e44c2eb1f019745af2696a) (farhi.abdel, 2018-05-18) ([farhi2018]) | Virtual model of a workshop with **2 Jacquard looms**, made in a Saint-Étienne heritage digitisation project with the Musée d'Art et d'Industrie | 541,660 | No | Sketchfab "Standard" (store licence), but not offered for download | Yes (view) | Best-looking visual reference. **Partner/data lead** (author and museum) |
| 17 | [Sketchfab "Jaquardloom2"](https://sketchfab.com/3d-models/jaquardloom2-4c767cc3ba724337b81bff5b97f02796) (demondawson, 2016-08-11) ([sf-dawson]) | **Photogrammetry** of a Jacquard loom at the Deutsches Technikmuseum Berlin, 2016 | 136,674 | No | **None stated** | Yes (view) | The only museum scan found. Proportions reference only |
| 18 | [Sketchfab "Dobby Loom"](https://sketchfab.com/3d-models/dobby-loom-07ba2b15ffb7425cab23f700828fd7f3) (Spiacente, 2022-03-31) ([sf-dobby]) | A home-made dobby loom (a related peg/lag-controlled shedding device) | 127,786 | No | **CC BY 4.0**, downloadable | Yes | Related machine, open. At most a modelling reference |
| 19 | [Sketchfab "Woolen Mills Historic Loom"](https://sketchfab.com/3d-models/woolen-mills-historic-loom-6ccc03aa7fb04d68a6010013aa8d69c1) (camryn-schroder, 2023-07-03) ([sf-crompton]) | Recreation of Crompton's 1837 patent-model power loom (NMAH) | 20,451 | No | None stated | Yes (view) | Not Jacquard |
| 20 | Other Sketchfab looms ([sf-search]): "Traditional Wooden Loom" (Azura_SQ, 2026, 1.8 M faces, CC BY); "Greco-Roman loom" (AlbertGregl, 2023, CC BY); "loom" (jbryk, 2021, CC BY); "Tradition Latvian Loom" (1 animation, no licence); "Horizontal Broad Loom" (Wessex Archaeology, 1 animation); "Warp Weighted Loom" and "Tapestry Loom" (wboony); "The IBM 029 Card Punch" (wboony) | Hand looms and others | — | Two have 1 animation | Mixed | Yes | Not Jacquard. CC BY ones could serve as generic loom-frame references |
| 21 | **Printables** API, 4 queries ([printables]) | Only a "Jacquard ink/die holder" (a craft dye brand) | — | — | — | — | **No Jacquard models** |
| 22 | **Thingiverse** "jacquard" (19 results) ([tv-search]) | Relevant: thing:33696, thing:101077 and thing:855144 by Chris Fenton (Q5, rows 40–41). Others are knitting shuttles, dye holders and unrelated things | — | — | — | Yes | See Q5 |
| 23 | **GrabCAD** "jacquard" ([grabcad]) | "No CAD models found" | — | — | — | — | None |
| 24 | **TurboSquid** "jacquard loom" ([turbosquid]) | "0 free and premium jacquard loom 3D models" | — | — | — | — | None |
| 25 | **CGTrader** `3d-models?keywords=jacquard+loom` ([cgtrader]) | Redirects to `/not_found` (same as on 2026-10-20) | — | — | — | — | Could not search |
| 26 | **Smithsonian Open Access API** ([si-api]) | "jacquard loom": 164 records (NMAH looms and parts, SIL patents), **0 with 3D media**; "loom" + 3D: 0 | — | — | CC0 metadata | — | No 3D scan |
| 27 | cgcookie.com "jacquard loom" project ([cgcookie]) | A student Blender project (title only) | ? | ? | ? | HTTP 403 | Not assessed |
| 28 | "Animation of partial 3D model of the Weav3r Loom" (Jerry Nicholls, YouTube, about 2019) ([weav3r-yt]) | CAD animation of a 3D-printable loom design | — | Animated (video) | Standard YouTube | Yes | Not Jacquard; context |

---

## Q3. Animations and explainer videos (view-only)

### Takeaway
There is plenty of good film of real looms and two museum mechanism explainers (Macclesfield). There are a few 3D CAD animations of the Jacquard machine, but they are low-key and of unknown accuracy. All are view-only under the standard YouTube licence.

| # | Video (channel, age on 2026-10-25, views) | What it shows | Verdict |
|---|---|---|---|
| 29 | "Paradise Mill How The Jacquard Mechanism Works" (Macclesfield Museums, about 6 y, 94K) ([macc-yt1]) | A museum guide explains a working hand Jacquard | **Best mechanism explainer on real hardware** |
| 30 | "Binary and the Jacquard Mechanism - demonstration" (Macclesfield Museums, about 4 y, 82K) ([macc-yt2]) | Links card holes to binary on a working head | Best for the CS angle |
| 31 | "A Jacquard loom in action" (National Museums Scotland, about 10 y, 253K) ([nms-yt]) | A working loom | Good footage |
| 32 | "How was it Made? Jacquard weaving" (V&A, about 11 y, 454K) ([vam-yt]) | The weaving process | Good footage |
| 33 | "How an 1803 Jacquard Loom Led to Computer Technology" (The Henry Ford, about 8 y, 234K) ([henryford-yt]) | History plus loom demonstration | Context |
| 34 | "Jacquard Design Machine Simulation 3D" (Sharan Ajith, about 9 y, 193K) ([ajith-yt]) | 3D animation of a Jacquard machine; the same channel has a Banaras Jacquard design intro | The most-watched 3D animation. Accuracy not checked |
| 35 | "Jacquard Shedding Mechanism" and "How Jacquard Loom Weaves" (Textile Technology, about 7 mo, under 3K) ([textiletech-yt]) | Short textile-school animations | Low profile |
| 36 | "Jacquard mechanism demo" (Attoparsec, about 13 y, 3.6K) ([attoparsec-yt]) | Not watched | Unknown |
| 37 | "3D Printed Jacquard Machine - Open Sauce 2024" (jamonitMack) ([opensauce-yt]) | A talk on a 3D-printed mechanical Jacquard head; it inspired row 42 | Files not found |
| 38 | "Digital Jacquard loom - TC2 demonstration" ([tc2-yt]); CHI 2021 talk videos for Albaugh et al. on Vimeo ([albaugh-vimeo]) | The modern digital Jacquard | Context |

---

## Q4. Open-source code (Jacquard, weave drafts, WIF, renderers)

### Takeaway
There is a healthy ecosystem of **weave-draft** tools: AdaCAD and many small WIF editors and viewers, several under MIT, BSD, LGPL, GPL or AGPL. **None models the Jacquard head.** They work at the draft/drawdown level. AdaCAD is the important one: it is active and NSF-funded, and its core library is LGPL-3.0-or-later, but the UI repo has no licence file.

| # | Repo (owner) | What it is | Licence | Activity | Verdict |
|---|---|---|---|---|---|
| 39a | **AdaCAD** ([adacad]): UnstableDesign/AdaCAD (monorepo, created 2026-01-29, last push 2026-10-23); old UnstableDesign/AdaCAD-UI (65★, "MIGRATED"); [adacad.org](https://adacad.org), [docs](https://docs.adacad.org) | Angular web app plus TypeScript library `adacad-drafting-lib` (v1.3.31, on npm) for parametric weave drafting for **shaft and Jacquard looms**; renders drafts for cloth simulation. Laura Devendorf, Unstable Design Lab, CU Boulder; NSF grants #2346150, #1943109, #1755587 | Library: **LGPL-3.0-or-later** (its `package.json`). Monorepo root and UI: **no licence file** | Very active | Reuse candidate for draft/WIF import or export; partner. No mechanism |
| 39b | Loom Pedals (TEI 2024) ([loompedals]); UnstableDesign/Loom-Pedals-AdaCAD | AdaCAD extension for improvised Jacquard weaving workflows | None stated | 2022–2024 | Research context |
| 39c | teriyake/jacquard ([teriyake]) | Qt6/C++ macOS app: SDF and PBR real-time **weave renderer** (threading, tie-up, treadling; up to 64 shafts, 256 × 256) | None stated | 2025-04 (single push) | Rendering ideas only |
| 39d | stoatworks-labs/jacquard ([stoatworks]) | FFGL effect for Resolume: weaves a video clip as Jacquard cloth "under the loom's own rules" (one weft colour per pick, float limits) | **MIT** | 2026-09 to 2026-10, active | Possible reference for cloth-rendering rules |
| 39e | elenaOnline/jacquard ([elena]) | "Digital lace" graphic design studio (dither, halftone, ASCII) | None stated | 2026-07 | Unrelated to the mechanism |
| 39f | apmasell/gacquard ([gacquard]) | Jacquard loom pattern editor | GPL-3.0 | 2023-11 | Small |
| 39g | WIF tools ([wif-tools]): RemiNelson/Wifferalls (web WIF viewer, editor and printer, weaving.threadlyintent.com); WIF-Format/wif-format.github.io (plain-language WIF guide); JGalego/WIFViewer (VS Code extension); EZfan/texere (text → WIF); IirisSundin/weaving-draft-designer; ejmelias/loom-logic (React); TereseBo/nextweave; jamespbarrett/tabletweave (28★, tablet weaving) | Draft and WIF viewers and editors | AGPL-3.0; BSD-3-Clause; MIT; MIT; MIT; none; none; NOASSERTION | Most active in 2026 | The WIF guide (BSD) is a good reference if we add WIF export |
| 39h | Loom hardware/software interfaces ([loom-io]): yaxu/py-tc2 (TC2 interface); parin23/ep-utils (Bonas EP files); friedrich-goetze/punch-card-maker (software and machine to make Jacquard cards); DEBONDIUM/loompy (mesh generation for weaving simulations); fo-am/penelope-warpweighted-2.0 (online warp-weighted loom simulation; README says "More info soon") | Various | GPL-3.0; MIT; **Apache-2.0**; MIT; AGPL-3.0 | 2021–2026 | Context. punch-card-maker is Apache-2.0 (card-making, not simulation) |
| 39i | "PixeLoom", "Jacq3G" | No open "PixeLoom" found (two unrelated GitHub repos). Jacq3G is AVL's commercial solenoid Jacquard (360 hooks, up to 2,160) ([avl]) | — | — | Not open software |
| 39j | handweaving.net ([handweaving]) | Large online draft archive with a browser draft viewer (from general knowledge; the fetch returned only the title) | Not assessed | — | Not verified |

---

## Q5. Physical and educational kits, builds and lessons

### Takeaway
The **best-documented and freest** source is Chris Fenton's set: a 3-hook reader (2012) and a 10-hook reader (2013) that are true single-cylinder, single-acting Jacquard heads with griffe, hooks, needles, springs and card cylinder, and the 32-hook PixelWeaver (2015). All are **CC0** on Thingiverse, with assembly notes. Newer open looms (Riley Cox 2024, Elm-Y 2026) are **NC-licensed or unlicensed**. Unplugged lessons exist but are thin (worksheets and grid paper).

| # | Item (author, date) | What it is | Mechanism? | Documentation | Licence | Verdict |
|---|---|---|---|---|---|---|
| 40 | **3-bit and 10-hook mechanical punch card readers** (Chris Fenton, Thingiverse [thing:33696](https://www.thingiverse.com/thing:33696) 2012-11-04 and [thing:101077](https://www.thingiverse.com/thing:101077) 2013-06-10) ([fenton2012], [fenton2013]) | 3D-printed Jacquard-style heads. "Single-cylinder, single-acting, positive-action", based on Fox, *The Mechanism of Weaving*. The 10-hook version: turning the crank (either direction) reads a card and raises hooks where there are holes. Parts include a griff drive wheel, hooks, needles, 1/4 in springs, 693 bearings and brass rods | **Yes: the real head** | STLs (21 and 24 files) plus step-by-step instructions | **CC0 (Public Domain Dedication)** | **Most reusable item found.** Borrow kinematics and part proportions for the head; cite Fox for the historic geometry |
| 41 | **PixelWeaver** (Chris Fenton, 2015) ([fenton2015], [fenton-tv855144]); Hackaday ([hackaday-jacq]) | 32-hook (4 × 8) Jacquard-style reader with a lever-driven griff and a scotch-yoke-driven swinging card cylinder, driving a 6 × 5 mechanical pixel display; 26 mm pixel pitch; 15 mm T-slot frame; laser-cut plywood cards | Yes | Write-up plus Thingiverse files for the display | Display files CC0; write-up has no licence | Great "card → bitmap" teaching analogy |
| 42 | **Hand-weaver's Jacquard loom** (Elm-Y, GitHub, 2026-03-05) ([elmy2026]) | Fully mechanical, punch-card-programmed Jacquard for hand weaving; laser-cut 2 mm parts; based on Fox's drawings; inspired by the Open Sauce 2024 talk | Yes | Early prototype ("high risk ... won't work properly") | **CC BY-NC 4.0** | NC: ideas only |
| 43 | **"Two Threads Meet" / Open-Jacquard-Loom-** (Riley Cox, Fabricademy, 2024) ([cox2024]) | Punch-card-controlled loom, 100 threads, mostly laser-cut (DXF) with a few 3D-printed parts and Arduino code; "motorized"; build guide on class.textile-academy.org | Partly (card → heddle lift, simplified) | Good (DXFs plus a build guide) | Repo: none; site footer: "Creative Commons Attribution Non-commercial" | NC: ideas only |
| 44 | **Jacques** (festwertspeicher, HAW Hamburg master's project, 2022) ([jacques2022]) | Computerized open-hardware tabletop Jacquard with a "new warp selection mechanism" | Modern variant | Build log; files promised | No licence file | Context |
| 45 | **OSLOOM** (osloom.org, OSHWA 2012) ([osloom]) | Open Source Jacquard Loom Project: 64-thread prototype driven by Arduino and a Centipede shield; last news "Summer 13 Update – It weaves (crappily...)"; the site also lists a "cardboard loom" | Modern (electronic) | Blog | Not checked | Dormant since 2013; site still up |
| 46 | **WeaveMe** (Kurt / electronicsnufkin, GitLab, 2018; Hackaday 2019) ([weaveme]) | 60-thread computer-controlled loom driven by an iPhone app over Bluetooth; PCB, firmware and code | Electronic | Repo (33★, 10 forks) | **MIT** | Open, but electronic, not card-driven |
| 47 | **Albaugh, McCann, Yao, Hudson, CHI 2021** ([albaugh2021]) | Low-cost (under US $200) 3D-printed Jacquard loom with bistable heddle switches and a RAMPS 1.4 controller | Electronic | Open-access paper and talk | Design files not found | Research context |
| 48 | **Nico71 LEGO Technic loom** (Fanabriques 2012) ([make2012], [hackspace-lego]) | Working miniature loom on one motor. Its pin-and-track programme was "inspired by" punch cards but drives a gearbox, not hooks | No (not a true Jacquard) | Photos and video; no instructions found | — | Not a Jacquard LEGO build. **No true LEGO Jacquard build found** |
| 49 | **Morrison Polkinghorne's full-size hand Jacquard loom** (2016–) ([polkinghorne]) | Late-19th-century loom traced from an example in Lyon | Yes (real) | Blog; no drawings published | © | Photos only |
| 50 | **Unplugged lessons** ([lisburn], [sim-blog], [csta], [loc2015], [hku], [scratch-k12]) | Lisburn Museum binary punch-card worksheet (free PDF); Science and Industry Museum blog (grid paper → card: empty square = hole); CSTA weaving-and-algorithms session (members only); Library of Congress teaching blog (2015); HKU machine-knitting punch-card guide (recommends AdaCAD); MIT K12Maker Scratch weaving (page now 404, Scratch project live) | Card ↔ binary only | Short | Lisburn © all rights reserved; others mostly not open | Shows teachers want this. No lesson connects the card to the **mechanism** |
| 51 | 3D-printed power loom (Fraens; Printables and Thingiverse) ([rpimag-loom]) | Motorised miniature power loom | Not Jacquard | Video plus BOM | Not checked | Context |
| 52 | Museum objects: Science Museum Group "Model of a Jacquard loom, with shuttle and components" (1867, co44888) and "Jacquard Hand Loom" (co8405056) ([smg]); NMAH Jacquard looms and parts ([si-api]) | Physical models and machines | Yes (real) | Catalogue photos | Image rights not checked here | Reference for the photo catalogue task |

---

## Q6. Is there any open, web-based, operable model of the real mechanism?

### Takeaway
**No.** The closest digital work (Sirkas 2026) stops at the head's outer box and takes a name, not a card chain. The closest mechanism work (Fenton's CC0 readers) is physical. The closest *planned* digital work (LIRIS/Soieries Bonnet 2025, three.js, "simplified" mechanism) has no public output we could find.

### What the closest prior art is missing (gap analysis)

| Capability | Sirkas 2026 | von Ahnen 2024 | AdaCAD | Fenton CC0 readers | Macclesfield videos |
|---|---|---|---|---|---|
| Runs in a browser, no install | Yes | Yes (WASM) | Yes | — | Yes (video) |
| 3D | Yes | No | No (2D draft, cloth preview) | Physical | Film |
| Needles, hooks, griffe, cylinder visible and moving | **No** | No | No | **Yes** (physical) | Yes (filmed) |
| User writes the card chain | **No** (name only) | Loads a deck; editing not seen | Draws drafts (exports for real looms) | Cut your own cards | No |
| Cloth woven from the cards | Yes (damask) | Yes (2D grid) | Yes (draft/sim) | — | Yes (real) |
| Trace a thread back to its hole, hook and needle | Cord glows per lifted warp | No | No | — | — |
| Open licence | **No** | **No** | Library LGPL; UI none | **CC0** | No |
| Lesson material | No (history timeline only) | Blog | Docs for weavers | Build notes | Talk |

### Inferences
- A web simulator of the **real head**, with student-written cards and a hole → needle → hook → griffe → cord → heddle → warp → cloth trace, would be new. It would also be the only one with an open licence.
- The Sirkas app appeared 17 days before this check. Building this is not hard, and others are likely to try soon (the LIRIS internship also points that way). This argues for **reaching out early** (LIRIS/Bonnet, Macclesfield, Unstable Design Lab) and for differentiating on **mechanism fidelity plus lessons**, not on "3D loom weaves a name".
- Fenton's CC0 heads and Fox's *The Mechanism of Weaving* (public domain) together give a fully open basis for modelling the single-lift head. NC items (Elm-Y, Riley Cox) can inspire, but no geometry or text can be taken from them.
- Most digital weaving tools treat the Jacquard head as a black box between "draft" and "cloth". Opening that box is the teaching value nobody else provides.

### Gaps
- **LIRIS / Soieries Bonnet**: whether the internship ran, what it produced, and under what licence. PDF unreachable. Ask F. Jaillet directly (maintainer action).
- **Macclesfield Raspberry Pi simulator**: software, current status and source not found.
- **Museum kiosks**: the Science and Industry Museum (Manchester), Musée des Arts et Métiers, Maison des Canuts and Musée des Tissus (Lyon) and the CHM gallery may have on-site interactives. Nothing about them was found online, so their existence and quality are unknown.
- **Cults3D, Free3D**: not searched this time. handweaving.net: not assessed (fetch failed).
- **jamonitMack Open Sauce 2024** head and **Albaugh 2021** loom: design files not located.
- **Sharan Ajith animation**: accuracy and which machine it models (probably a modern machine, not an 1800s head) not checked.
- **AdaCAD UI licence**: no LICENSE file in either the monorepo root or the UI. Only the library declares LGPL-3.0-or-later. Confirm with the AdaCAD team before reusing anything beyond the npm library.

---

## Sources

Accessed 2026-10-25 unless stated otherwise.

- [sirkas2026] Anu Sirkas, "Jacquard" (GitHub anusirkas/jacquard-loom, created 2026-10-08, last push 2026-10-14; no LICENSE). https://github.com/anusirkas/jacquard-loom ; live https://jacquard-loom.vercel.app
- [vonahnen2024] Till von Ahnen, "Jacquard loom function and simulator" (blog, 2024-11-24). https://tillvonahnen.de/blog/jacquard-loom-rust/ ; live app https://xoryouyou.github.io/loom/
- [scratch-bitme] Paulo Tavares (bitme), "Jacquard Loom - The Game", Scratch project 120884593, 2016-09-13. https://scratch.mit.edu/projects/120884593/
- [scratch-misc] Scratch projects 1479653 ("The jacquard loom!", 2010), 17695133 ("Victorian Programming", 2014), 387190963 (K12Maker "Weave Plain and Basket", 2020). https://scratch.mit.edu/projects/1479653/ ; https://scratch.mit.edu/projects/17695133/ ; https://scratch.mit.edu/projects/387190963/
- [scratch-k12] MIT Edgerton Center K12 Maker, weaving activity (page 404 on the check date; Scratch project above still live). https://k12maker.mit.edu/weaving.html
- [rpi2014] Raspberry Pi Foundation, "Jacquard looms, and a Pi simulator" (news, 2014-11-14). https://www.raspberrypi.com/news/jacquard-loom-simulator/ ; also Linebaugh Library Techblog, 2014-11-14, https://linebaughtech.blogspot.com/2014/11/jacquard-looms-and-pi-simulator.html
- [firgelli2026] FIRGELLI Automations, "Loom Jacquard Mechanism: How It Works…" with the "Jacquard Repeated-Tie Allocation Explorer" (2026-04-26). https://www.firgelliauto.com/blogs/mechanisms/loom-jacquard-mechanism
- [register2026] The Register, "Museum exhibit reveals the intricate workings of a knackered Dell" (2026-10-19). https://www.theregister.com/offbeat/2026/10/19/museum-exhibit-reveals-the-intricate-workings-of-a-knackered-dell/5303250
- [paisley] Paisley Museum Reimagined, "Interactive weaving studio" (HTTP 404 on the check date; known from a search snippet). https://reimagined.paisleymuseum.org/news-stories/interactive-weaving-studio/
- [liris2025] F. Jaillet and J.-P. Farrugia (LIRIS / IUT Lyon 1, Bourg-en-Bresse), internship offer "BUT JacquardSoieries 2025", with the Musée des Soieries Bonnet, Jujurieux (PDF unreachable; content from search-engine summaries). https://perso.liris.cnrs.fr/fabrice.jaillet/data/BUT-JacquardSoieries_2025.pdf
- [doaj-silk] "Multimodal Narratives for the Presentation of Silk Heritage in the Museum" (DOAJ record). https://doaj.org/article/ee9fe6f4e52f451e83d60876ed616d7a
- [rhizome] Luke Duncalfe, "Jacquard Loom Panels 1, 2, 4, 5 & 7" (Shockwave), Rhizome ArtBase. https://static-files.rhizome.org/Q3188/Jacquard/
- [chm-rev] Computer History Museum, Revolution online exhibit, "Punched Cards: Automating an Art: The Jacquard Loom". https://www.computerhistory.org/revolution/punched-cards/2/4
- [arahne] Arahne, ArahWeave CAD/CAM for weaving. https://www.arahne.si/products/arahweave/
- [nedgraphics] NedGraphics, Jacquard Design Software. https://www.nedgraphics.com/product/jacquard-design-software-cad-cam/
- [tc2] Digital Weaving Norway / Tronrud Engineering, TC2 loom. https://digitalweaving.no/tc2-loom/ ; https://tronrud.no/en/industrialized-products/products/tc2-loom ; Tien Chiu, review, https://tienchiu.com/how-tos/weaving/a-comparison-of-jacquard-looms/the-digital-weaving-norway-tc-2-jacquard-loom/
- [avl] AVL Jacquard loom (Jacq3G) product page via reseller. https://shuttlesandneedles.com/products/avl-jacquard-loom
- [sf-search] Sketchfab Data API v3 search, queries `jacquard`, `jacquard loom`, `jacquard head`, `punch card loom`, `loom`. https://api.sketchfab.com/v3/search?type=models&q=jacquard
- [sf-wboony] wboony, "Jacquard Loom", Sketchfab, 2021-01-19. https://sketchfab.com/3d-models/jacquard-loom-813f886ee1ff489c986785c4838fb58a
- [farhi2018] farhi.abdel, "Métier à tisser Jacquard", Sketchfab, 2018-05-18. https://sketchfab.com/3d-models/metier-a-tisser-jacquard-22ddec1d97e44c2eb1f019745af2696a
- [sf-dawson] demondawson, "Jaquardloom2" (Museum of Technology Berlin capture), Sketchfab, 2016-08-11. https://sketchfab.com/3d-models/jaquardloom2-4c767cc3ba724337b81bff5b97f02796
- [sf-dobby] Spiacente, "Dobby Loom", Sketchfab, 2022-03-31, CC BY 4.0. https://sketchfab.com/3d-models/dobby-loom-07ba2b15ffb7425cab23f700828fd7f3
- [sf-crompton] camryn-schroder, "Woolen Mills Historic Loom", Sketchfab, 2023-07-03. https://sketchfab.com/3d-models/woolen-mills-historic-loom-6ccc03aa7fb04d68a6010013aa8d69c1
- [printables] Printables GraphQL API `searchPrints2`, queries listed in the header. https://api.printables.com/graphql/
- [tv-search] Thingiverse search "jacquard". https://www.thingiverse.com/search?q=jacquard&type=things&sort=relevant
- [grabcad] GrabCAD library search "jacquard". https://grabcad.com/library?page=1&time=all_time&sort=popular&query=jacquard
- [turbosquid] TurboSquid search "jacquard loom". https://www.turbosquid.com/Search/3D-Models/jacquard-loom
- [cgtrader] CGTrader search (redirects to /not_found). https://www.cgtrader.com/3d-models?keywords=jacquard+loom
- [si-api] Smithsonian Open Access API, queries "jacquard loom", "jacquard AND online_media_type:3D Images", "loom AND online_media_type:3D Images". https://api.si.edu/openaccess/api/v1.0/search
- [cgcookie] CG Cookie, "jacquard loom" project (HTTP 403). https://cgcookie.com/projects/jacquard-loom
- [weav3r-yt] Jerry Nicholls (Jander), "Animation of partial 3D model of the Weav3r Loom", YouTube. https://www.youtube.com/watch?v=VJLQ7yNeXAA
- [macc-yt1] Macclesfield Museums, "Paradise Mill How The Jacquard Mechanism Works", YouTube. https://www.youtube.com/watch?v=x_ijmjx7Xys
- [macc-yt2] Macclesfield Museums, "Binary and the Jacquard Mechanism - demonstration", YouTube. https://www.youtube.com/watch?v=pzYucg3Tmho
- [nms-yt] National Museums Scotland, "A Jacquard loom in action", YouTube. https://www.youtube.com/watch?v=OlJns3fPItE
- [vam-yt] Victoria and Albert Museum, "How was it Made? Jacquard weaving", YouTube. https://www.youtube.com/watch?v=K6NgMNvK52A
- [henryford-yt] The Henry Ford, "How an 1803 Jacquard Loom Led to Computer Technology", YouTube. https://www.youtube.com/watch?v=MQzpLLhN0fY
- [ajith-yt] Sharan Ajith, "Jacquard Design Machine Simulation 3D", YouTube. https://www.youtube.com/watch?v=awGjOGo_Mis
- [textiletech-yt] Textile Technology, "Jacquard Shedding Mechanism" (https://www.youtube.com/watch?v=_taqvaVv62g) and "How Jacquard Loom Weaves" (https://www.youtube.com/watch?v=J49TTfG3H8w), YouTube.
- [attoparsec-yt] Attoparsec, "Jacquard mechanism demo", YouTube. https://www.youtube.com/watch?v=cNcG4w3Ff8c
- [opensauce-yt] jamonitMack, "3D Printed Jacquard Machine - Open Sauce 2024", YouTube. https://www.youtube.com/watch?v=_GzxMYS83Pw
- [tc2-yt] "Digital Jacquard loom - TC2 demonstration", YouTube. https://www.youtube.com/watch?v=UK6IqovdKLA
- [albaugh-vimeo] "CHI 2021 Paper Talk: Personal Jacquard Handweaving", Vimeo. https://vimeo.com/547544195 ; https://vimeo.com/547558657
- [adacad] Unstable Design Lab (L. Devendorf), AdaCAD monorepo (adacad-drafting-lib `package.json`: LGPL-3.0-or-later, v1.3.31). https://github.com/UnstableDesign/AdaCAD ; https://github.com/UnstableDesign/AdaCAD-UI ; https://adacad.org ; https://docs.adacad.org
- [loompedals] "Loom Pedals: Retooling Jacquard Weaving for Improvisational Design Workflows", TEI 2024, doi:10.1145/3623509.3633358 ; https://github.com/UnstableDesign/Loom-Pedals-AdaCAD
- [teriyake] teriyake, "Jacquard" weave renderer. https://github.com/teriyake/jacquard
- [stoatworks] stoatworks-labs, "jacquard" FFGL plugin (MIT). https://github.com/stoatworks-labs/jacquard
- [elena] elenaOnline, "JACQUARD — a loom for digital lace". https://github.com/elenaOnline/jacquard
- [gacquard] apmasell, "gacquard" Jacquard loom pattern editor (GPL-3.0). https://github.com/apmasell/gacquard
- [wif-tools] https://github.com/RemiNelson/Wifferalls ; https://github.com/WIF-Format/wif-format.github.io ; https://github.com/JGalego/WIFViewer ; https://github.com/EZfan/texere ; https://github.com/IirisSundin/weaving-draft-designer ; https://github.com/ejmelias/loom-logic ; https://github.com/TereseBo/nextweave ; https://github.com/jamespbarrett/tabletweave
- [loom-io] https://github.com/yaxu/py-tc2 ; https://github.com/parin23/ep-utils ; https://github.com/friedrich-goetze/punch-card-maker ; https://github.com/DEBONDIUM/loompy ; https://github.com/fo-am/penelope-warpweighted-2.0
- [handweaving] Handweaving.net (not assessed). https://handweaving.net/
- [fenton2012] Chris Fenton ("chris"), "3-bit Mechanical Punch Card Reader", Thingiverse thing:33696, 2012-11-04, CC0. https://www.thingiverse.com/thing:33696
- [fenton2013] Chris Fenton, "10-hook mechanical punch card reader", Thingiverse thing:101077, 2013-06-10, CC0. https://www.thingiverse.com/thing:101077
- [fenton-tv855144] Chris Fenton, "Mechanical Display", Thingiverse thing:855144, 2015-05-30, CC0. https://www.thingiverse.com/thing:855144
- [fenton2015] Chris Fenton, "The PixelWeaver" (about May 2015). https://www.chrisfenton.com/the-pixelweaver/
- [hackaday-jacq] Hackaday, tag "jacquard" ("Jacquard Loom Becomes A Display", 2015-06-04; "Open Source Computer Controlled Loom Weaves Pikachu For You", 2019-06-18). https://hackaday.com/tag/jacquard/
- [elmy2026] Elm-Y, "hand-weavers-jacquard-loom" (CC BY-NC 4.0), 2026-03-05. https://github.com/Elm-Y/hand-weavers-jacquard-loom
- [cox2024] Riley Cox, "Two Threads Meet" open-source punch-card Jacquard loom, Fabricademy 2024. https://class.textile-academy.org/2024/riley-cox/project/ ; https://github.com/Rileycoxx/Open-Jacquard-Loom-
- [jacques2022] festwertspeicher, "Jacques" open-hardware Jacquard loom (HAW Hamburg). https://festwertspeicher.github.io/jacques-loom/ ; https://github.com/festwertspeicher/jacques-loom
- [osloom] Open Source Jacquard Loom Project (OSLOOM). http://osloom.org ; OSHWA 2012, https://2012.oshwa.org/osloom-an-open-source-jacquard-loom/
- [weaveme] electronicsnufkin (Kurt), "WeaveMe", GitLab (MIT, created 2018-06-04). https://gitlab.com/electronicsnufkin/WeaveMe
- [albaugh2021] L. Albaugh, J. McCann, L. Yao, S. E. Hudson, "Enabling Personal Computational Handweaving with a Low-Cost Jacquard Loom", CHI 2021, doi:10.1145/3411764.3445750.
- [make2012] Make, "Lego Mechanical Loom" (2012-07-30). https://makezine.com/2012/07/30/lego-mechanical-loom
- [hackspace-lego] HackSpace magazine, "LEGO loom". https://hackspace.raspberrypi.com/articles/lego-loom ; Eurobricks "Nico71's creations", https://www.eurobricks.com/forum/forums/topic/59250-nico71s-creations/page/12
- [polkinghorne] Morrison Polkinghorne, "Building My Jacquard Loom" (2016). https://morrisonpolkinghorne.com/my-jacquard-loom/
- [lisburn] Irish Linen Centre & Lisburn Museum, "Traditional Industry Worksheet: Binary". https://www.lisburnmuseum.com/educational-workshops/worksheet-binary-handloom-weaving-and-your-very-own-bracelet/
- [sim-blog] Science and Industry Museum blog, "Jacquard loom". https://blog.scienceandindustrymuseum.org.uk/jacquard-loom/
- [csta] CSTA session on weaving, algorithms and coding (members only). https://csteachers.org/?p=77450
- [loc2015] Library of Congress Teaching with the LoC blog, "Primary Sources in Science Classrooms: Computer Science and Programming with Punched Cards, Part 1" (2015-12). https://blogs.loc.gov/teachers/2015/12/primary-sources-in-science-classrooms-computer-science-and-programming-with-punched-cards-part-1/
- [hku] HKU Bookstack, "Designing your own punch card" (machine knitting). https://bookstack.hku.nl/books/machine-knitting/page/designing-your-own-punch-card
- [rpimag-loom] Raspberry Pi Official Magazine, "3D-printed Power Loom". https://magazine.raspberrypi.com/articles/3d-printed-power-loom
- [smg] Science Museum Group collection: "Model of a Jacquard loom, with shuttle and components" (co44888), https://collection.sciencemuseumgroup.org.uk/objects/co44888/model-of-a-jacquard-loom-model-jacquard-loom ; "Jacquard Hand Loom" (co8405056), https://collection.sciencemuseum.org.uk/objects/co8405056
- [fox] T. W. Fox, *The Mechanism of Weaving* (cited by Fenton and Elm-Y as their design basis; public-domain scan). https://archive.org/details/mechanismofweavi00foxt
