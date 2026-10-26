# Notes: educational value and classroom use

**Compiled:** 2026-10-25. All URLs were accessed on 2026-10-25 unless noted otherwise.

**What was searched:** web searches (about 30 queries and fetches) covering:
- curriculum documents: the England National Curriculum on gov.uk, the CSTA standards as republished by the California CDE, and the Australian Digital Technologies Hub;
- teaching sites: cs4fn, CS Unplugged, Code.org, Teach Computing / STEM Learning, BBC Bitesize, Isaac CS and the Library of Congress teacher blog;
- museum pages: Science and Industry Museum, CHM, Paisley/NMS, Maison des Canuts, Macclesfield and Lisburn;
- research: SPEERLoom/RoboLoom (CMU/UCI), Keune (TUM), PENELOPE (Deutsches Museum), AdaCAD (CU Boulder), ETHW, and Lovelace's 1843 Notes (Fourmilab transcription).

**How to read these notes:**
- **Evidence vs opinion.** "Cited Findings" are things a source states. Where a source is giving an opinion or framing, the bullet says so. "Inferences" are my own reasoning and are not sourced.
- **Snippet-only items.** Some academic items could only be seen as search-engine snippets or abstracts, because the full text would not load. These are marked *(snippet/abstract only)*:
  - par.nsf.gov and pedocs.de refused connections from this environment;
  - the CACM blog returned 403;
  - the CSTA resource page is for members only;
  - mediatum.ub.tum.de timed out.

  None of them is paywalled as such, except CSTA (membership) and possibly the Springer KI article.

---

## 1. Curriculum: where the Jacquard loom appears in CS standards and curricula

### Takeaway
No major CS standard that I could check names the Jacquard loom. It sits in the **gaps between** explicit requirements:
- binary representation of images and data (England KS3, Australian Years 5–6);
- "how instructions are stored and executed" (England KS3);
- "computing technologies that changed the world" and before/after comparisons (CSTA Impacts of Computing).

Teachers bring Jacquard in as a history and binary hook. They are not required to teach it, so a simulator has to justify itself through the binary, data, sequence and history standards it serves.

### Cited Findings
- **England, National Curriculum for Computing**
  - The text does not contain "history", "Jacquard", "Babbage" or "Lovelace".
  - KS3 requires pupils to "understand how numbers can be represented in binary" and to "understand how instructions are stored and executed within a computer system". It says data such as text, sound and pictures "can be represented and manipulated digitally, in the form of binary digits".
  - KS2 requires "use sequence, selection, and repetition in programs". — [NC-ENG]
- **US, CSTA K-12 standards (Impacts of Computing strand, as republished in California's CS standards)**
  - K-2: "Compare how people lived and worked before and after the adoption of new computing technologies".
  - Grades 3–5: "Discuss computing technologies that have changed the world, and express how those technologies influence, and are influenced by, cultural practices". Suggested activities include building a class timeline of computing advances.
  - The standards do not name Jacquard. — [CA-CS-STDS] *(snippet only)*. I believe these correspond to CSTA 1A-IC-16 and 1B-IC-18, but I did not verify the IDs.
- **AP CSP and CSTA:** I found no official AP Computer Science Principles material that mentions Jacquard. — [CA-CS-STDS] search; I did not read the AP CSP Course and Exam Description directly.
- **Australia, Digital Technologies Hub (Years 5–6)**
  - Its scope and sequence includes a unit that "explores binary numbers through pixel-based image creation", mapped to AC9TDI6K03/AC9TDI6K04.
  - The v8.1 equivalent, ACTDIK024, asks students to investigate how digital systems represent text, image and audio data in binary.
  - I found no elaboration that mentions weaving. — [DTH-56] *(snippet only)*
- **STEM Learning (UK)** hosts a secondary computing "history of computers" classroom resource covering the Jacquard loom, Babbage's Difference Engine and later developments, with a word search, homework and an activity sheet. — [STEM-HIST] *(snippet only)*
- **Crash Course Computer Science #10 ("Early Programming")** is a free video often listed as a classroom resource. It opens with Jacquard's 1801 loom as the first clear case of machines needing instructions. — [CRASHCOURSE-10] *(snippet only)*
- **CSTA 2023 Annual Conference session "Weaving Projects that Promote CT and Coding Skills"** is in the CSTA resource library. Participants:
  - analyse common fabric weaves;
  - map them on graph paper;
  - weave them.

  It frames Jacquard looms as "a precursor to punch cards and programming". The session is described as "creative, low-cost, hands-on". The full text is for members only and no grade band is given. — [CSTA-WEAVE-2023]
- **Let's Talk Science (Canada)** "Coding Unplugged" traces programming "as a means of communicating to a computer which electrical signals should be off or on" back to Jacquard looms. — [LTS-CODING] *(snippet only)*
- **CS Unplugged** is CC BY-NC-SA and covers binary numbers, among other topics. I found no weaving or Jacquard activity in it. — [CSUNPLUGGED] *(search only)*

### Inferences
- **Strongest standards hooks:**
  - England KS3 binary representation of pictures, and "instructions stored and executed";
  - Australian Years 5–6 binary pixel images, where a Jacquard card is literally one row of a 1-bit image;
  - CSTA Impacts of Computing at K-5, plus history and timeline work.

  A simulator page could list these alignments explicitly. The Leibniz report found that teachers value this.
- **The "stored instructions" requirement is double-edged.** Jacquard cards can illustrate *storage on a medium* and *sequential read-out*. They cannot illustrate a stored *program* with selection; see §5. A simulator is a good place to make that distinction explicit.
- **The AP CSP Big Idea on data** (binary representation of images) probably also fits. This is unverified (see Gaps).

### Gaps
- **Not checked.** For the following I found **no evidence either way**, because searches did not surface them:
  - Scottish CfE / National 5 Computing Science;
  - GCSE specifications (AQA, OCR J277, Edexcel) and A-level;
  - German Länder Informatik curricula;
  - French SNT/NSI (Eduscol);
  - Code.org CSF/CSD/CSP lessons;
  - BBC Bitesize;
  - Isaac Computer Science;
  - cs4fn;
  - Barefoot Computing;
  - Raspberry Pi Foundation / Teach Computing curriculum units.

  None of these should be cited as containing Jacquard without a direct check.
- **Leads I recall but did not verify:**
  - cs4fn published Ada Lovelace material that touches on Jacquard;
  - Teach Computing KS3 has a unit on the history of representation ("Representations: from clay to silicon").

  Worth a direct look.

---

## 2. Existing lesson plans and activities using Jacquard

### Takeaway
Free Jacquard material exists but is **thin and static**:
- photo-analysis prompts;
- "hole = binary" worksheets and bracelets;
- graph-paper weaving;
- history timelines and videos.

None that I found shows the **mechanism**, meaning how a hole leads to a lifted warp, then a shed, then a pick, then a woven row. None lets students write a card deck and see the resulting cloth. That cause-and-effect loop is the gap.

### Cited Findings
- **Library of Congress, "Computer Science and Programming with Punched Cards", Part 1** (Trey Smith, LoC Science Teacher in Residence, 2 Dec 2015). A primary-source lesson in which students:
  - analyse 1994 photos of a Paterson NJ weaver and the folded punched "cards" that control the pattern;
  - listen to a plant-employee interview;
  - research Jacquard looms;
  - compare punched cards with switches, tubes, tape, transistors and ICs;
  - consider how open and closed holes relate to binary "on" and "off".

  No grade level or standards are cited. It is free. — [LOC-2015]
- **Irish Linen Centre & Lisburn Museum worksheet, "Binary, Handloom Weaving and Your Very Own Bracelet"**
  - Free PDF: students "create a message on a punch card" and cut out a bracelet.
  - Binary is described as storing information with "only two options". The page claims binary "is the principle behind the Jacquard loom", which changed damask hand-loom weaving (slowly).
  - It does not explain the mechanism and states no target age. — [LISBURN]
- **Loyola University Chicago "Countdown" activity N0012, "Jacquard/Babbage/Binary"**: a binary sequence-table activity linked to punch cards. — [LUC-N0012] *(snippet only)*
- **Calderdale Industrial Museum "Magnificent Mills"**: a schools topic in which pupils investigate how a sequence of codes creates woven patterns. Resources need registration. — [CALDERDALE] *(snippet only)*
- **Classroom weave-structure worksheets and labs** cover plain, twill and satin in paper:
  - a CUNY City Tech textiles lab: paper tabby, twill and satin, documented stage by stage;
  - a Lesson Planet lesson;
  - a Tes worksheet. A Tes reviewer flags that its "satin" diagram actually shows sateen (weft floats), an example of the error-prone hand-drawn diagrams a tool could check.

  — [CUNY-LAB4]; [LESSONPLANET-WEAVE]; [TES-WEAVE] *(snippets only)*
- **Lovelace's Note A (1843)** is the standard Babbage link. In it the Analytical Engine "weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves". The Engine's cards are "applied on the principle of those used in the Jacquard-loom". — [LOVELACE-1843]
  - The full sentence begins "We may say most aptly, that…". That is from memory of the text and consistent with the transcription.
- **Lovelace's other notes** distinguish card types and describe card repetition:
  - Operation-cards "merely determine the succession of operations in a general manner" (Note B).
  - Variable-cards "might… be even more appropriately designated the Distributive-cards" (Note B).
  - Note C describes "backing the cards in certain groups according to certain laws", "to secure the possibility of bringing any particular card or set of cards into use any number of times successively".

  — [LOVELACE-1843]
- **The Hollerith link** appears in museum and popular summaries, but no lesson plan was found. Typical statements:
  - Hollerith used punched cards for the 1890 US census, reducing staff and time [ETHW-WOODS];
  - punched cards remained "the dominant form of data and program storage through the 1970s" [CHM-ADOPT] *(snippet)*.
- **Computer Museum of America (Roswell GA)** runs a punch-card exhibit that starts with an 1850 portable Jacquard loom and moves on to Hollerith and IBM. During demos visitors punch a souvenir card on an IBM 029. Its staff describe artists drawing designs "on squares of paper", which were punched row by row and laced together. — [CMOA-2020] *(snippet; listings 2024 and earlier)*

### Inferences
- **Every free activity found is static.** They teach "hole/no-hole = two states", and some teach "a sequence of cards = a sequence of rows". None closes the loop from card to cloth. Students never test a card they made, or see a mistake (a missing hole) show up as a flaw in the fabric.
- **Debugging is impossible on paper.** Paper-bracelet and graph-paper exercises cannot show what happens when a card is out of order or upside down.
- **The repeat is never taught.** None of these resources explains how a short card chain is looped to produce a long repeating cloth (the "loop" lesson), or how one hook can drive many warp ends across the width.
- **The Lovelace quote is used everywhere, but its referent is not.** Students are rarely shown what "weaves flowers and leaves" means mechanically. A simulator that runs a deck and grows the cloth row by row gives the quote a concrete referent.
- **Lovelace's own text supports a "loom vs Engine" lesson.** Her distinction between Operation-cards and Variable-cards, and her "backing" (repeating cards), mark what the Analytical Engine added beyond the loom.

### Gaps
- I found no Code.org, BBC Bitesize, cs4fn or Barefoot Jacquard lesson. This is absence of search evidence, not proof of absence.
- I did not verify Hollerith-specific lesson plans.
- I found no usage numbers (downloads, class counts) for any of the resources above.

---

## 3. Museum education programmes, visitor demand, and what visitors find hard

### Takeaway
Several museums run **live hand-loom Jacquard demonstrations**, a strong signal that the mechanism needs to be *seen moving* to be understood:
- Maison des Canuts, Lyon: twice-daily guided demos;
- Paisley Museum: curator demos;
- CMoA: punch-card demos.

The most direct evidence of a teaching difficulty is that **Macclesfield Silk Museum built a Raspberry Pi Jacquard simulator** in 2014. They did so because "it can be hard to visualise the relationship between the holes in the cards" and the woven pattern.

### Cited Findings
- **Macclesfield Silk Museum** "put a Raspberry Pi to work to make this demonstration model for museum visitors" (Raspberry Pi blog, 14 Nov 2014). The stated reason: "It can be hard to visualise the relationship between the holes in the cards" and the pattern. The article does not describe the interface or visitor reaction. — [RPI-2014]
- **ETHW / ASME (Robert Woods, ASME Fellow, from Mechanical Engineering, Dec 2007)**
  - Claim: Jacquard's controller is often called the "beginning of the computer age". This is "usually accompanied by a bit of 19th century history, but no explanation as to how he used a punched card to control a powerful machine like a loom in the absence of electronics".
  - The answer it gives: one simple linkage is replicated hundreds or thousands of times, so a light needle force bends a hook off a heavy rising griffe. — [ETHW-WOODS]
- **Maison des Canuts, Lyon**
  - Advertised as the only place in Lyon to see "Jacquard" hand looms working.
  - The guided visit includes a demonstration on a 19th-century hand loom.
  - Pupil and student reduced rate: €7 for the guided visit; free under 11.
  - Guided visits Tue–Sat at 11:00 and 15:30. Another listing gives different seasonal times.
  - No dedicated school-group page found. — [MDC-LYON]; [VISITERLYON] *(snippets)*
- **Paisley Museum (Scotland)**
  - National Museums Scotland says visitors can see a Jacquard loom in action at Paisley Museum [NMS-JACQ].
  - A Dress and Textile Specialists visit notice (undated) describes a loom gallery with a Jacquard card-cutting machine and "one of Dan's legendary weaving demonstrations", by the curator Dan Coughlan [PAISLEY-DATS].
  - Canmore's 2015 survey video captions record the curator explaining that "one card at a time is presented to the needles", and a card-lacing frame joining cards into a repeat [CANMORE].
- **Science and Industry Museum, Manchester**
  - A museum blog describes its Jacquard loom as linking Manchester's textile and computing industries, "on display in our Textiles Gallery".
  - The SMG archive holds a historical photo titled "Jacquard loom demonstration" (CORP/SCM/Z/111/14/26).
  - No current demo schedule found. — [SIM-BLOG]; [SMG-PHOTO] *(snippets)*
- **Computer History Museum**
  - Holds an ~1825 tabletop Jacquard demonstration model with paper cards. The catalogue calls it "considered one of the first programmable devices".
  - Also holds an 1830 woven portrait of Jacquard. — [CHM-B117]; [CHM-ADOPT] *(snippets)*
- **Science Museum, London**
  - A Smithsonian resource page says the Science Museum holds a Jacquard loom example [SI-PUNCH].
  - No Science Museum schools resource pairing Jacquard, Babbage and Lovelace was found.

### Inferences
- **Demo-dependence is the main evidence of difficulty.** Museums keep a human demonstrator at the loom, and one museum built a computer simulator, because a static loom and a stack of cards do not explain themselves. A free browser simulator would carry that "demonstrator" experience into classrooms that cannot visit:
  - most US schools;
  - UK schools outside Manchester, Paisley and Macclesfield.
- **What visitors likely find hard**, based on [RPI-2014] and [ETHW-WOODS] plus mechanism logic. This is inference, not visitor research:
  1. mapping card holes to individual warp threads;
  2. understanding that a *hole* leaves a hook *engaged*, so the thread is *lifted*, rather than the hole "doing" something;
  3. how a light card controls heavy warp (amplification via griffe);
  4. that each card is one weft row (pick), not one thread;
  5. how the cloth face pattern emerges from lifted vs. down warps;
  6. how a closed loop of cards repeats a design.
- **Museum partnership is plausible.** Lyon, Paisley, Macclesfield, Manchester and CHM all already explain this machine. An open simulator could be offered as a pre- or post-visit resource, as the Leibniz report recommended with GWLB.

### Gaps
- I found **no visitor statistics or evaluation data** on Jacquard demos: attendance, dwell time, or what visitors misunderstand.
- I could not identify the Macclesfield simulator's design or whether it still runs.
- I did not check Musée des Arts et Métiers (Paris) education pages, or Science and Industry Museum learning programmes, in detail.

---

## 4. Maths, art and textile angles; research evidence that weaving teaches computing

### Takeaway
There is a small but growing body of **HCI and learning-sciences research** (2021–2024) treating weaving as a context for computing and maths. It includes:
- matrix and binary drafts;
- loops and functions in weaving patterns;
- equity and broadening participation.

The evidence is mostly design papers, pilot studies and qualitative analyses. It shows *plausibility and engagement*, not large controlled learning gains. The physical classroom looms these studies use (SPEERLoom/RoboLoom) are kits that must be built. A browser simulator would be a zero-cost entry point to the same activities.

### Cited Findings
- **SPEERLoom** (CMU and UC Irvine; UIST '23, 29 Oct–1 Nov 2023, San Francisco)
  - An "open source Jacquard loom kit designed to support an interdisciplinary curriculum teaching engineering, mathematics, and weaving".
  - Motivation: existing looms "are not optimized to provide hands-on interdisciplinary learning in collegiate classrooms".
  - A pilot in a post-secondary class found that it supports hands-on interdisciplinary learning of maths, engineering and textiles.
  - Superseded by RoboLoom (V3). — [SPEERLOOM-SITE]; [SPEERLOOM-UIST23] *(abstract/snippet only; full text at par.nsf.gov not reachable)*
- **UC Irvine "Recrafting Soft Technologies" course** (spring 2023, NSF-funded "Recrafting Computer Science" project)
  - Student teams did projects combining matrix maths, mechatronics, computational thinking and weaving on the Robo-Loom.
  - The Robo-Loom has a graphical interface for exploring weaving maths.
  - Goal: test whether a physical loom makes CT more tangible and broadens participation. — [UCI-RECRAFT] *(snippet only; page refused TLS)*
- **Yankova, Speer, Huang, Peppler, Robinson & Orta Martinez, "Weaving with Ropes to Parse Mathematical Abstraction"** (poster)
  - A group rope-weaving activity in an undergraduate Informatics class targeted "cloth separability and the matrix representation of weaving patterns".
  - It reports meaningful gains, with two groups taking different routes: one hands-on, one mathematical.
  - The authors conclude that tangible engagement helps with abstract ideas. Sample size and statistics were not visible to me. — [YANKOVA-ROPES] *(snippet only)*
- **Anna Keune (TUM), 2022 journal article**
  - Presents fiber crafts "as a context for performing computational concepts (i.e., variables, conditionals, functions)".
  - Finds that "weaving drove computing as the performance of automation", and that materials shape what can be learned. — [KEUNE-2022] *(abstract only)*
- **Keune et al., ICLS 2023, "Sewing and weaving data"**
  - CS experts examined middle-school craft projects for evidence of "challenging computer science concepts".
  - They found weaving and sewing to be a context for data processing and storing. — [KEUNE-ICLS23] *(abstract only)*
- **Keune group, children's weaving patterns study**
  - "Transformed all students' weaving patterns into Python to uncover the computational concepts inherent in them". Patterns used "functions, loops, and ranges".
  - The child and loom shared the computation. — [KEUNE-PY] *(snippet only; PDF timed out)*
- **Equity framing (Keune).** The domestic associations of fiber crafts were historically "utilized as strategic tools to prevent women and other non-dominant populations from entering" STEM. Weaving, though, is "recognized for their connections with computation". — [KEUNE-ICLS23] *(abstract)*
  - Buechley's e-textiles line of work is cited in this literature as "a cogent context for introducing youth, especially girls, to STEM concepts". — via [KEUNE-PY] *(snippet)*
- **Harlizius-Klück & McLean, "The PENELOPE Project: A Case Study in Computational Thinking"** (2021, CC BY 4.0)
  - Frames ancient weaving through decomposition, pattern recognition, abstraction and algorithms. Presents weaving as the earliest binary and digital technology.
  - In a student course "a binary system was sufficient for notating the structure, and easy to transfer into zeros and ones". — [PENELOPE-2021] *(snippet only; pedocs refused connection)*
- **PENELOPE project** (Deutsches Museum Munich, ERC-funded 2016–2021)
  - Its hypothesis: textile technology helped bring about Greek science. Woven fabrics "are basically constructed of threads crossing over or under each other", which makes weaving digital and binary.
  - It built a lab with replica warp-weighted looms, pattern matrices and a live-codable loom. — [DM-PENELOPE]; [CORDIS-PENELOPE] *(snippets)*
- **AdaCAD** (Laura Devendorf, CU Boulder ATLAS)
  - Open-source parametric weave-drafting software for shaft and Jacquard looms.
  - CHI 2023: parametric design "helps weavers notate and explain the logics behind the complex structures they generate".
  - Described as possibly "the only open-source software" for many weavers. A 2024 NSF grant supports community maintenance and training. — [ADACAD-CHI23]; [CU-ATLAS-2024] *(snippets)*
- **Weave structures as binary matrices** (maths background)
  - Weave diagrams are naturally represented as binary matrices, and matrix relations can generate weave families [TWILL-NIELIT].
  - A combinatorial classification gives plain, twill and satin in terms of crossing sequences (p, q). Satin construction uses a step *a* with gcd(*a*, *m*) = 1, after Lucas's 1867 formulation [ARXIV-2108.09464] *(snippets)*.
- **Other open-source physical Jacquard looms exist:**
  - OSLOOM (2012);
  - Riley Cox's "Two threads meet" punch-card loom with ~100 individually controlled threads (Fabricademy 2024).

  These are hardware builds, not classroom-ready tools. — [OSLOOM]; [RILEY-COX] *(snippets)*

### Inferences
- **Maths lessons a simulator could support** (my design, unsourced):
  - **Binary matrices:** the card deck *is* a binary matrix with picks × hooks. Plain weave is a checkerboard; twill is a diagonal shift (cyclic permutation); satin is a shift by a step coprime to the repeat size (modular arithmetic and gcd).
  - **Symmetry and repeats:** looping the chain is periodicity in time (the vertical repeat). Harness ties are periodicity across width (horizontal repeat). Point and mirror repeats are reflections.
  - **Boolean operations:** combining a ground-weave matrix with a figure mask (AND/OR/NOT) is exactly how damask figure/ground is designed. This needs confirmation from textile sources.
  - **Inversion:** NOT of the card is the cloth seen from the back.
- **A simulator is the cheap end of a research-backed path.** The research tools (SPEERLoom/RoboLoom kits, AdaCAD) target college and expert weavers. A browser simulator could serve ages 8–18 and also act as a front end for these.
- **Evidence strength is moderate.** The claim that "weaving helps teach computing" rests on small qualitative studies and pilots. The report should not overstate it.

### Gaps
- I could not read full texts of the SPEERLoom, Yankova or PENELOPE papers, so sample sizes, effect sizes and instruments are unknown.
- I did not find a randomised or controlled study of weaving vs. standard instruction.
- I did not find Harlizius-Klück's "weaving as binary art" text specifically. Searches returned PENELOPE material instead.

---

## 5. Common misconceptions a simulator can correct

### Takeaway
Popular and even museum sources routinely compress the story into claims that are wrong or misleading:
- "the first computer/program";
- "Jacquard invented punched cards";
- "holes are 1s".

An operable model can correct these by *showing* what the machine does and does not do. It *reads* a fixed sequence of rows and *selects* threads. It does not compute, branch or do arithmetic.

### Cited Findings
- **"Beginning of the computer age" without mechanism.** ETHW/ASME says the claim is usually made with "no explanation as to how he used a punched card to control a powerful machine like a loom". — [ETHW-WOODS]
- **"First computer program" claims exist in teaching-adjacent sources.** One source cited by search calls the loom "one of the earliest instances of data storage, and the first example of a computer program". The CHM catalogue calls it "one of the first programmable devices". — [CUNY-INFOTECH] *(snippet)*; [CHM-B117]
  - A French industry blog says, by contrast, that the loom is not strictly a computer but introduced punched cards to control mechanical operations. — [TRAVAIL-INDUSTRIE] *(snippet, via search summary)*
- **"Jacquard invented punched cards" is wrong.** Precursors:
  - Basile Bouchon (Lyon, 1725) used perforated paper tape;
  - Jean-Baptiste Falcon (1728) used linked cards;
  - Vaucanson's 1745 automatic loom also preceded Jacquard.

  — [COMPHOPE]; [TRAVAIL-INDUSTRIE]; [CHM-PIONEER] *(snippets)*
- **"Jacquard loom" is itself a misnomer.** Wikipedia calls the term "somewhat inaccurate", because the Jacquard is a *head* fitted to a loom. A Sotheby's specialist is quoted in a University of Chicago Magazine piece: "there's no such thing as a Jacquard loom — there's a Jacquard mechanism that hooks onto a loom". — [WIKI-JACQ]; [UCHICAGO-MAG] *(snippets)*
- **"One card per thread" is wrong.** Each card is one row of the design, and cards "are strung together in order". — [WIKI-JACQ] *(snippet)*
  - Curator's description: "one card at a time is presented to the needles". — [CANMORE]
- **What a hole actually does.** Spring-loaded needles pass through holes. Where there is no hole, the needle is pushed back and bends its hook off the rising griffe, so that warp end stays down. — [ETHW-WOODS]
- **Dates conflict across teaching sources.** Some give 1801, others 1804 or 1805. Teaching material repeats both. — [CRASHCOURSE-10]; [STEM-HIST]; [CHM-PIONEER] *(snippets)*
- **What the Analytical Engine added.** Lovelace treats the Engine's separate Operation and Variable cards, and "backing" (reusing card groups "any number of times successively"), as things that were devised for the Engine. — [LOVELACE-1843]
- **Labour history is part of the story.** Popular accounts note that Lyon silk weavers attacked the machines and Jacquard. — [GALAXUS] *(popular source, snippet)*

### Inferences
These are my analysis for the simulator design. Check them against the mechanism notes.

| Misconception | What the simulator should show |
|---|---|
| "The loom computed" | Nothing is calculated. The card state is copied straight to hook positions every pick. A "state inspector" showing just card → hooks → lifted warps makes this obvious. |
| "A hole = 1 = on, always" | Hole = needle passes = hook stays on griffe = warp *lifted*. Whether a lifted warp shows as "figure" depends on colour and face. Inverting the deck gives the reverse side of the cloth. So 1/0 is a *convention* about lift, not intrinsic meaning. A toggle ("show cloth front/back", "invert card") demonstrates this. |
| "One card per thread" | One card = one pick (weft row). One hole position = one hook. One hook may drive several warp ends via the harness (repeats across width). Highlighting the active card and the woven row in sync fixes this. |
| "Programmable in the modern sense" | The chain is a **fixed stored sequence** (data/pattern) with at most an unconditional loop (the closed chain). There is no branching, no arithmetic, no memory written back. Contrast with the Analytical Engine's operation cards and backing [LOVELACE-1843], and with a modern program. "Program vs data" is a good debate prompt. |
| "Jacquard invented punch cards / the first loom with cards" | A history panel covering Bouchon → Falcon → Vaucanson → Jacquard. |
| "Holes are bits like in a computer" | Partly fine as an analogy. But Hollerith cards encoded *data to be counted*, and Analytical Engine cards encoded *operations and variables*. The Jacquard card encodes a *row of thread selections*. Three kinds of card, three meanings. |

### Gaps
- I found **no published study of student misconceptions specifically about the Jacquard loom**. The table above is reasoned, not measured.
- I could not read the CACM blog "Charles Babbage and the loom" (403), which may discuss what Babbage took from the loom.

---

## 6. Concrete, ranked lesson scenarios a simulator would enable, and required features

### Takeaway
The highest-value lessons are those that close the **card → mechanism → cloth** loop, which no existing free resource does:
1. **pixel art → cards → cloth** (binary images);
2. **debug the deck** (sequence, order, off-by-one);
3. **loops and repeats** (closed chain);
4. **loom vs. Analytical Engine** (program vs. data; Lovelace).

The ranking is my judgement, informed by the curriculum hooks in §1, the activity gaps in §2, the museum difficulty evidence in §3 and the research in §4.

### Cited Findings (supporting evidence for the ranking)
- **Binary images are explicit curriculum content:**
  - England KS3: pictures as binary digits [NC-ENG];
  - Australia Years 5–6: binary through pixel images [DTH-56].
- **"Instructions stored and executed"** is England KS3 content [NC-ENG].
- **Repetition is KS2 content** [NC-ENG]. Weaving patterns were found to embody "functions, loops, and ranges" [KEUNE-PY].
- **The relationship between card holes and pattern is the reported difficulty.** — [RPI-2014]
- **Graph-paper weave mapping is already used by teachers.** — [CSTA-WEAVE-2023]
- **Weave drafts as matrices work with undergraduates.** — [YANKOVA-ROPES]; [SPEERLOOM-UIST23]
- **Museums teach with live demos and card-cutting machines.** — [MDC-LYON]; [PAISLEY-DATS]

### Inferences: ranked scenarios
These are my proposals. Features are listed as **F-codes** after the table.

| # | Scenario | Ages | Curriculum hook | What students do | Features |
|---|---|---|---|---|---|
| 1 | **Pixel picture to punched cards** | 8–14 | Binary images (Eng KS3; AU AC9TDI6K03) | Draw a 1-bit picture on a grid (initials, emoji). The simulator turns each row into a card, then weaves it. Students see that the cloth reproduces the picture and count the bits. | F1, F2, F4, F5, F6 |
| 2 | **Debug the deck** | 10–16 | Sequence; stored instructions (Eng KS3) | Teacher shares a link to a deck with a swapped card, a missing hole or a reversed card. Students predict the flaw, run it and fix it. | F1, F3, F5, F7 |
| 3 | **Loops and repeats** | 9–15 | Repetition (Eng KS2); CT | Make a 4-card plain or twill deck. Close the chain into a loop, then weave 40 rows. Compare deck length to cloth length. Then repeat across width with harness ties. | F1, F3, F5, F8 |
| 4 | **How does a card lift a thread?** (mechanism) | 11–18 | History of technology; mechanical amplification; KS3 D&T | Step through one pick: the cylinder presses the card, needles pass or are blocked, hooks stay or are pushed off, the griffe rises, the shed opens, the shuttle passes, the beater beats. A cutaway shows 8–16 hooks. | F3, F4 |
| 5 | **Loom vs. Analytical Engine vs. Hollerith** (program vs. data) | 14–18, undergrad | CSTA Impacts; history of computing; AP CSP data (unverified) | Read Lovelace's Note A sentence and Note C on backing. Compare a loom card deck (fixed sequence) with Engine operation and variable cards (and loops) and Hollerith data cards. Debate whether the loom was "programmable". | F5, F9, a history panel |
| 6 | **Weave structures as binary matrices** | 14–18, undergrad maths and textiles | Matrices, modular arithmetic, symmetry | Build plain, twill and satin as matrices. Discover that satin needs a step coprime to n. Combine a figure mask with ground weaves using AND/OR/NOT (damask). Inverting gives the reverse side. | F1, F2, F6, F10 |
| 7 | **Jobs and automation (Lyon canuts)** | 12–18 | CSTA Impacts; history | Compare weaving speed and labour with a draw-boy loom vs. a Jacquard head. Discuss canut revolts. | F4, F11, a history panel |
| 8 | **Make a real card** | 8–14 | Unplugged extension | Print the deck at true scale, punch it with a hole punch, lace it. Optionally use it with a museum or classroom loom. | F7 |

**Features implied** (rough priority order):
- **F1 Card editor:** click holes on/off. Load and save decks.
- **F2 Pattern → cards converter:** draw or import a small bitmap. Choose a ground weave and figure weave.
- **F3 Step-by-step pick cycle:** play, pause, single-step and reverse, with the current card and current cloth row highlighted together.
- **F4 Cutaway of the Jacquard head:** needles, hooks, griffe, cylinder, harness cords and warp. Scaled down to a teachable hook count, with a toggle to show how a real head scales up (e.g. 400 or more hooks).
- **F5 Woven cloth preview:** grows row by row, front and back, with optional colour-coded warp and weft.
- **F6 Matrix view:** show the deck as a 0/1 matrix, with a configurable hole = 1 or 0 convention. Supports scenarios 1 and 6.
- **F7 Export/print cards:** true-scale PDF or SVG for paper punching, plus a PNG of the cloth.
- **F8 Chain loop and harness repeat controls.**
- **F9 Link-to-state:** the URL encodes the deck, the step and the view. This was a key teacher feature in the Altair simulator context, for worksheets and "debug this" tasks.
- **F10 Boolean combine tool:** figure mask with ground weave.
- **F11 Speed comparison:** with a draw loom.

**Design implications from the misconceptions in §5:**
- Never label the machine a "computer".
- Show the hole convention explicitly.
- Keep one card ↔ one pick visually tied.
- Include an honest "what this machine cannot do" panel: no branching, no arithmetic, no writing to cards.

### Gaps
- I found **no direct teacher-survey evidence** asking whether teachers want a Jacquard simulator, unlike the Altair simulator's observed adoption.
- I found no search evidence of an existing free, operable, mechanism-level browser Jacquard simulator. Weave-draft tools like AdaCAD exist but do not show the mechanism. This should be confirmed by whoever covers prior-art simulators.
- Ages and curriculum mappings for scenarios 4–7 are my proposals and have not been validated with teachers.

---

## Sources

All accessed 2026-10-25.

- **[ADACAD-CHI23]** Devendorf, L. et al. AdaCAD parametric weave drafting, CHI 2023 (NSF PAR record). https://par.nsf.gov/servlets/purl/10482917 (snippet only; server unreachable)
- **[ARXIV-2108.09464]** "Construction and Classification of Combinatorial Weaving Diagrams", arXiv:2108.09464. https://arxiv.org/pdf/2108.09464 (snippet only)
- **[CA-CS-STDS]** California Department of Education, Computer Science Standards (CSTA-based), Impacts of Computing. https://www2.cde.ca.gov/cacs/cs?c1=4%2C10 (snippet only)
- **[CALDERDALE]** Calderdale Industrial Museum, "Magnificent Mills" schools topic. https://calderdaleindustrial.co.uk/?p=1440 (snippet only)
- **[CANMORE]** Canmore (HES), Paisley Museum loom gallery survey photos and video captions, 2015. https://canmore.org.uk/collection/1548985 (snippet only)
- **[CHM-ADOPT]** Computer History Museum blog, "Artifact Adopted! Preserving the Legend of J. M. Jacquard". https://computerhistory.org/blog/artifact-adopted-preserving-the-legend-of-j-m-jacquard/ (snippet only)
- **[CHM-B117]** Computer History Museum catalogue, Jacquard loom model, ~1825, B117.80. https://www.computerhistory.org/collections/catalog/B117.80/ (snippet only)
- **[CHM-PIONEER]** IEEE Computer Society, Computer Pioneers: J. M. Jacquard. https://history.computer.org/pioneers/pdfs/j/Jacquard.pdf (snippet only)
- **[CMOA-2020]** Computer Museum of America, "CMoA Displays a Jacquard Loom in Nook Look", 7 Nov 2020; punch-card demo listings. https://mimmsmuseum.org/2020/11/07/cmoa-displays-a-jacquard-loom-in-nook-look/ ; https://visitroswellga.com/events/punch-card-machine-demo-august (snippets only)
- **[CORDIS-PENELOPE]** CORDIS, "Unravelling weaving's role in the history of science and technology" (ERC project 682711). https://cordis.europa.eu/article/id/442326-unravelling-weaving-s-role-in-the-history-of-science-and-technology (snippet only)
- **[CRASHCOURSE-10]** Crash Course Computer Science #10, "Early Programming" (PBS/WGBH listing). https://wgbh.org/tv-shows/crash-course-computer-science/early-programming-crash-course-computer-science-10-ybhhtu (snippet only)
- **[CSTA-WEAVE-2023]** CSTA Resource Library, "Weaving Projects that Promote CT and Coding Skills", CSTA 2023 Annual Conference. https://csteachers.org/?p=77450 (fetched; full content member-only)
- **[CSUNPLUGGED]** CS Unplugged (classic site). https://classic.csunplugged.org/ (search only)
- **[CU-ATLAS-2024]** CU Boulder ATLAS, "Devendorf bridges engineering and craft communities", 13 Aug 2024. https://www.colorado.edu/atlas/2024/08/13/devendorf-bridges-engineering-and-craft-communities-new-initiative (snippet only)
- **[CUNY-INFOTECH]** CUNY Commons, "Early computer programming". https://infotech.commons.gc.cuny.edu/?p=55 (snippet only)
- **[CUNY-LAB4]** CUNY City Tech OpenLab textiles lab (paper weaving of tabby, twill, satin). https://openlab.citytech.cuny.edu/jeseniabravo/files/2024/12/Lad4.pdf (snippet only)
- **[DM-PENELOPE]** Deutsches Museum, PENELOPE project page. https://www.deutsches-museum.de/en/forschung/forschungsinstitut/projekte-und-forschungsbereiche/projects/detail-page/penelope (snippet only)
- **[DTH-56]** Digital Technologies Hub (Australia), Scope and sequence F–10, Years 5–6. https://www.digitaltechnologieshub.edu.au/plan-and-prepare/scope-and-sequence-f-10/years-5-6/ (snippet only)
- **[ETHW-WOODS]** Woods, R. "Jacquard Loom", Engineering and Technology History Wiki, from ASME Mechanical Engineering, Dec 2007. https://ethw.org/Jacquard_Loom (fetched)
- **[GALAXUS]** Galaxus, "What do looms and computers have in common? History of computing part 2" (popular article). https://www.galaxus.de/en/page/what-do-looms-and-computers-have-in-common-history-of-computing-part-2-7658 (snippet only)
- **[KEUNE-2022]** Keune, A. (2022), fiber crafts as context for computational concepts, KI – Künstliche Intelligenz (Springer). https://link.springer.com/10.1007/s13218-021-00747-1 (abstract/snippet only)
- **[KEUNE-ICLS23]** Keune, A. et al. "Sewing and weaving data: analyzing fiber crafts as context for…", ICLS 2023 (TUM portal). https://portal.fis.tum.de/en/publications/sewing-and-weaving-data-analyzing-fiber-crafts-as-context-for-per/ (abstract only)
- **[KEUNE-PY]** Keune group (TUM), children's weaving patterns translated to Python. https://mediatum.ub.tum.de/doc/1687271/1687271.pdf (snippet only; fetch timed out)
- **[LESSONPLANET-WEAVE]** Lesson Planet, "Weaving Activity". https://www.lessonplanet.com/teachers/weaving-activity (snippet only)
- **[LISBURN]** Irish Linen Centre & Lisburn Museum, "Traditional Industry Worksheet: Binary, Handloom Weaving and Your Very Own Bracelet". https://www.lisburnmuseum.com/educational-workshops/worksheet-binary-handloom-weaving-and-your-very-own-bracelet/ (fetched)
- **[LOC-2015]** Smith, T. "Primary Sources in Science Classrooms: Computer Science and Programming with Punched Cards, Part 1", Library of Congress Teaching with the LoC blog, 2 Dec 2015. https://blogs.loc.gov/teachers/2015/12/primary-sources-in-science-classrooms-computer-science-and-programming-with-punched-cards-part-1/ (fetched)
- **[LOVELACE-1843]** Menabrea, L. F., trans. and Notes by A. A. Lovelace, "Sketch of the Analytical Engine…", Taylor's Scientific Memoirs, 1843 (Fourmilab transcription). https://www.fourmilab.ch/babbage/sketch.html (fetched; first 100k characters read)
- **[LTS-CODING]** Let's Talk Science, "Coding Unplugged". https://letstalkscience.ca/volunteer-hands-on-activities/coding-unplugged (snippet only)
- **[LUC-N0012]** Loyola University Chicago "Countdown", N0012 Jacquard/Babbage/Binary activity. https://countdown.luc.edu/InstructionActivity/NumberOperation/pdfs/N0012_Jac_Babbage_Binary.pdf (snippet only)
- **[MDC-LYON]** Ville de Lyon, "Maison des canuts – Musée du tissage". https://www.lyon.fr/node/28792 (snippet only)
- **[NC-ENG]** Department for Education, "National curriculum in England: computing programmes of study" (2013). https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study/national-curriculum-in-england-computing-programmes-of-study (fetched)
- **[NMS-JACQ]** National Museums Scotland, "Jacquard loom" story. https://www.nms.ac.uk/explore-our-collections/stories/science-and-technology/jacquard-loom/ (snippet only)
- **[OSLOOM]** OSLOOM – An Open Source Jacquard Loom, OSHWA 2012. https://2012.oshwa.org/osloom-an-open-source-jacquard-loom/ (snippet only)
- **[PAISLEY-DATS]** Dress and Textile Specialists, "DATS visit to Paisley Museum" (undated). https://dressandtextilespecialists.org.uk/conferences-and-events/dats-visit-to-paisley-museum-25th-may (snippet only)
- **[PENELOPE-2021]** Harlizius-Klück, E. & McLean, A. (2021), "The PENELOPE Project: A Case Study in Computational Thinking", CC BY 4.0 (peDOCS). https://www.pedocs.de/volltexte/2021/22496/pdf/Harlizius_Kluck_McLea_The_penelope_2021.pdf (snippet only; server refused connection)
- **[RILEY-COX]** Cox, R. "Two threads meet" open-source punch-card Jacquard loom, Fabricademy 2024. https://class.textile-academy.org/2024/riley-cox/project/ (snippet only)
- **[RPI-2014]** Raspberry Pi Foundation blog, "Jacquard loom simulator" (Macclesfield Silk Museum), 14 Nov 2014. https://www.raspberrypi.com/news/jacquard-loom-simulator/ (fetched)
- **[SI-PUNCH]** Smithsonian, Punch Cards spotlight resources. https://si.edu/es/spotlight/punch-cards/punch-cards-resources (snippet only)
- **[SIM-BLOG]** Science and Industry Museum blog, textiles tag. https://blog.scienceandindustrymuseum.org.uk/tag/textiles/page/2/ (snippet only)
- **[SMG-PHOTO]** Science Museum Group collection, photo "Jacquard loom demonstration", CORP/SCM/Z/111/14/26. https://collection.sciencemuseumgroup.org.uk/documents/aa110144791 (snippet only)
- **[SPEERLOOM-SITE]** SPEERLoom / RoboLoom project sites. https://sites.google.com/view/speerloom ; https://sites.google.com/view/roboloom/ (snippets only)
- **[SPEERLOOM-UIST23]** Speer, S. et al. "SPEERLoom: An Open-Source Loom Kit for Interdisciplinary Engineering Education", UIST '23 (NSF PAR). https://par.nsf.gov//servlets/purl/10435020 (abstract/snippet only; server refused connection)
- **[STEM-HIST]** STEM Learning (UK), history of computers secondary computing resource. https://www.stem.org.uk/rx34zu (snippet only)
- **[TES-WEAVE]** Tes, "Weave worksheet" (with reviewer correction on satin/sateen). https://www.tes.com/teaching-resource/weave-worksheet-11038466 (snippet only)
- **[TRAVAIL-INDUSTRIE]** travail-industrie.com, "Le métier à tisser Jacquard, premier pas de l'humanité vers la programmation" (industry blog). https://travail-industrie.com/blog/article-titre/metier-tisser-jacquard-premier-pas-humanite-programmation (snippet only)
- **[TWILL-NIELIT]** Yumnam, B. "YuBraj Twill: A family of generalized twill weaves", NIELIT journal. https://journal.nielit.edu.in/index.php/01/article/download/88/29/240 (snippet only)
- **[UCHICAGO-MAG]** University of Chicago Magazine, "Pattern progress". https://mag.uchicago.edu/science-medicine/pattern-progress (snippet only)
- **[UCI-RECRAFT]** UCI Informatics, "'Recrafting Soft Technologies' Course Offers Tangible Lessons in Computer Science" (2023). https://www.informatics.uci.edu/?p=8061 (snippet only; TLS error on fetch)
- **[VISITERLYON]** OnlyLyon / visiterlyon.com, "Visite commentée d'un atelier de tissage à la Maison des Canuts". https://www.visiterlyon.com/sortir/culture-et-loisirs/culture-et-musees/visites-et-ateliers/visite-commentee-d-un-atelier-de-tissage-a-la-maison-des-canuts (snippet only)
- **[WIKI-JACQ]** Wikipedia, "Jacquard machine". https://en.wikipedia.org/wiki/Jacquard_machine (snippet only)
- **[YANKOVA-ROPES]** Yankova, N., Speer, S., Huang, J., Peppler, K., Robinson, O. & Orta Martinez, M. "Weaving with Ropes to Parse Mathematical Abstraction" (poster; NSF PAR). https://par.nsf.gov/biblio/10544766 (snippet only)
- **[COMPHOPE]** Computer Hope, "Jacquard Loom". https://www.computerhope.com/jargon/j/jacquard-loom.htm (snippet only)
