# M7 notes: the tutorial, parts 1 to 3

- **Status:** built 2026-10-27, on the branch `m7-tutorial`. The last milestone of release 0.1.0 ([public-app.md](public-app.md) §4). The spec below passes in `pnpm test` (T-1 to T-4) and on the app with `?selftest` (L-1 to L-9), with M6's checks.
- **Page:** [`index.html`](../index.html): the Learn workspace, which M6 left with a sample step.
- **The steps:** [`js/teach/tutorial.js`](../js/teach/tutorial.js); their texts in [`js/l10n/en.js`](../js/l10n/en.js) (`tut.*`, `learn.*`, `img.*`) and the nine other languages.

## What M7 builds

| Part | Where | What it is |
|---|---|---|
| The steps | `js/teach/tutorial.js` | 21 steps in three parts, as data: each its name (for links and progress), its picture, the views it puts on the stage, the loom it sets up, the parts it points at, its question and its task. No DOM: the tests run the same steps |
| The guide | `js/app/components/guide.js`, `css/app.css` | The step as one card: the part and place over it, with the list of all the steps; the part's aim at its first step; the picture and its credit; the text; the question; the task line, whose buttons work the real controls; what the task showed, once done; the part's recap at its last step; Back and Next under it |
| Learn as a mode | `js/app/learn.js`, `js/app/shell.js` | The tutorial's own loom set up for each step; the place and the steps done kept on the device; Weave's loom and views given back on leaving; the stage framed in blue; what a step does not use greyed and locked |
| The locks | `js/app/looms.js` | On the tutorial's loom, the actions that change the cards or the loom (punch, the card tools, the loop, the head and tie-up, the colours) refuse unless the step asks for them, and say why |
| Pointing at parts | `js/app/components/views.js`, `js/view2d/sectionView.js`, `css/views.css` | The section's parts a step names glow amber, their labels amber and bold |
| Links to steps | `js/app/links.js` | Share in Learn writes the step; a link opens it (design/links.md, Learn) |
| The pictures | `images/tutorial/`, `REUSE.toml` | Four historical pictures from the research's freely licensed set, scaled to 720 px, each with its credit and licence |

## The tutorial

| Part | Step | What it does | Task |
|---|---|---|---|
| 1. The story | `story-draw-loom` | The draw loom and its draw boy (Barlow 1878) | |
| | `story-holes` | Bouchon 1725, Falcon 1728, Vaucanson 1745: holes before Jacquard, and why none of them took | |
| | `story-jacquard` | Jacquard puts them together, about 1804–1805 (the CNAM model of 1810); the spread by 1812 and 1834 | |
| | `story-portrait` | The woven portrait, 1839, and Babbage | |
| 2. How it works | `how-whole-loom` | The loom in 3D | |
| | `how-units` | The units, U1 shown | |
| | `how-section` | The head cut through; one card with two holes; hook 4 followed | |
| | `how-needles` | A hole or a blank | step to "Hooks taken" |
| | `how-griffe` | A light card, a heavy lift: mechanical amplification | step to "Shed open" |
| | `how-one-row` | One card, one row | predict which ends, then step until beaten up |
| | `how-program` | The chain is a program | play until the open chain runs out |
| | `how-loop` | A loop | lace the chain, weave to row 8 |
| | `how-not-a-computer` | No choice, no arithmetic, nothing written back; Lovelace's Note A | |
| 3. Weave | `weave-punch` | Punch a card | punch holes 1, 3, 5, 7; weave the row |
| | `weave-plain` | Plain weave | punch card 2's even holes; weave four rows |
| | `weave-twill` | Twill | predict the diagonal; weave eight rows |
| | `weave-satin` | Satin, stepped by three | weave eight rows |
| | `weave-satin-by-two` | Stepped by two, which fails | predict; weave eight rows |
| | `weave-tie-up` | One hook, many threads: the tie-up's repeats | set the tie-up to Straight × 2; weave four rows |
| | `weave-picture` | A picture, woven bottom-up | predict the arrow's way; play until the chain runs out |
| | `weave-next` | What was learnt; Go to Weave | |

## Decisions

1. **A step is data, and its texts are keys made from its name** (`tut.<name>.title`, `.text`, `.task`, `.q`, `.a1`…, `.right`, `.wrong`, `.done`). A test (T-1) checks that every key a step uses exists and that no tutorial text is left over, so a step added or renamed cannot lose its words in any language.
2. **A step's loom is the last loom set up, with every task since done.** A step that sets up no loom goes on with the one before it (stepping on to "Hooks taken", then "Shed open", then weaving the row), and going Back or opening a step from a link gives the same loom every time (T-2), as the sibling's lessons replay their steps.
3. **Tasks check the loom, not the clicks** (public-app.md §1): "punch holes 1, 3, 5, 7 and weave the row" is done when card 1 is that card and the cloth's first row is that row, however the learner got there. Each task also names a likely mistake, which its check must refuse (T-2).
4. **Predict, then weave:** a question comes before the task, and the task line appears once it has an answer, right or wrong. Next waits for an answer, not for the right one: being wrong, then weaving and seeing why, is the lesson.
5. **What a step locks is what changes the cards or the loom.** The transport, the views, the cloth's face and following a thread are always free, so a learner can always look and step; the card tools, punching, the loop, the head and tie-up and the colours are greyed unless the step's task asks for them, and pressed say why and the way out (Weave). The lock is in the actions, so the keyboard and every path are locked alike.
6. **In Learn the guide has the left panel's room:** the story's steps show the guide alone; later steps show the cards under it, the bench only where the step punches, the chain only as tall as its cards.
7. **The place is on the step's card, not in the top bar.** The Learn tab first carried "Part 2 · 6/9"; it made the tab grow and shrink as the workspace changed, moving the Weave tab and outgrowing its own underline, and repeated what the card already says (revised after the review, 2026-10-27).
8. **Pointing at parts, in 2D:** a step names the section's parts it points at (`glow`), drawn with an amber halo that keeps their own colours (lifted green, followed blue), and their labels amber. In 3D a step points by showing one unit alone; a glow on 3D parts waits for the steps that need it (design/ui-layout.md §7).
9. **The history follows the research, not the legends** (research REPORT §6, notes-history-and-machines.md §6): no patent of 1801, no card count for the portrait ("many thousands"), "in about 1804–1805", Bouchon, Falcon and Vaucanson before Jacquard, Lovelace's own words. T-3 keeps the English that way. Two changes from public-app.md's plan: part 1 has four screens, not two or three (the portrait earns its own); and the closed chain is not called "the first loop in the history of programming", since Falcon's cards of 1728 were already an endless chain and barrel organs repeated long before: the step says a loop repeats instructions without writing them out again, and credits Falcon.
10. **The pictures are the research's freely licensed ones,** scaled and re-encoded (720 px on the long side, for a panel about 320 px wide on a screen of twice its pixels); each step shows its credit under its picture, REUSE.toml records each file's licence, and About names the licences.

## After the review (2026-10-27, on `release/v0.1.0`)

11. **A newcomer opens on Learn,** at the first step with the whole loom in 3D; after that the app opens on the workspace last used on the device (local storage), so a learner who went on to Weave opens there, and one who went back to the tutorial opens at their step (design/ui-layout.md §3). The author's first idea was a flag set once Weave is visited; the last workspace used covers that and also the learner who returns to finish the tutorial.
12. **The step stacks from the top:** the card, Back and Next right under it, the cards with the height left. Pinned to the panel's foot, Back and Next sat far from the text on a tall window, and the cards were squeezed.
13. **The view menu, flat in two groups,** without the units' codes; **no view twice** (choosing one on show swaps the panes), **one 3D model in the four-view grid**, and going to two or four keeps the views on show; the four-view grid is the two-view pair on top, the front and side below (design/ui-layout.md §4). The two views on a wide window stay as they were: chosen once, when Weave opens.

## Acceptance spec

| ID | Statement | Kind |
|---|---|---|
| T-1 | Every step has a name a link can carry, once; the parts come in order, each with its name, aim and recap; every text a step uses is in English, and every tutorial text belongs to a step; every question's answer is one of its choices. | logic |
| T-2 | Each task is not done at its step's start, refuses its likely mistake and takes its solution; a step's loom is the same however the step is reached; a step with no loom goes on from the one before. | logic |
| T-3 | The history keeps out of the research's myths (no patent, no 24,000 cards, no "first computer", no "invented the punched card") and quotes Lovelace as she wrote. | logic |
| T-4 | Every picture is there, at the size its step gives, with its credit and its licence in REUSE.toml. | logic |
| L-1 | Every step, reached by Next from the first, shows its title, its picture and credit, its views and cards; Next waits for its question and its task, and takes the learner on once both are done; every step is counted done. | page |
| L-2 | A task line's button works the real control, which glows while the task waits; a step greys and locks what it does not use (pressed, it says why and changes nothing) and frees what it asks for. | page |
| L-3 | Share in Learn links to the step; a step's link opens it with its loom; a name no step has opens the start and says so. | page |
| L-4 | The place is kept on the device; leaving for Weave gives Weave's loom and views back; Learn resumes where it was left; the step's card says where, and the tabs keep their size whichever workspace is on. | page |
| L-5 | The parts a step points at glow in the section, their labels in amber; nothing glows in Weave. | page |
| L-6 | In every language every step speaks it, with no English left. | page |
| L-7 | On a phone, Learn opens the sheet on the guide, at the step, with the controls under the stage. | page |
| L-8 | The view menu is one list in two groups, the 2D drawings and the 3D models, with no unit codes; a view on show elsewhere says where, and choosing it swaps the two; four views keep one 3D model; going to two keeps the view on show. | page |
| L-9 | Without a link a newcomer opens on Learn, with the whole loom in 3D; after Weave, the app opens on Weave; a link decides for itself. | page |
| L-10 | M6's checks and the prototypes' still pass (`pnpm selftest`). | page |

### Results (2026-10-27)

| ID | Result |
|---|---|
| T-1 | 21 steps, names unique and link-safe; three parts with their names, aims and recaps; every text a step uses in English, none left over |
| T-2 | 12 tasks: none done at its step's start, each refusing its mistake and taking its solution; every step's loom the same twice; how-loop goes on from how-program's four rows |
| T-3 | No patent, no 24,000, no "first computer", no "invented the punched card"; Lovelace's Note A as written |
| T-4 | 4 pictures, each at its size, with its credit and its licence in REUSE.toml |
| L-1 | 21 steps by Next, 4 pictures loaded with their credits, every step counted done |
| L-2 | Step pressed from the task line; the card tools greyed, refusing with the reason; a hole punched on the bench in weave-punch |
| L-3 | Share in Learn: `v=2&w=learn&step=weave-twill`, which opens the step with its loom; `step=no-such-step` opens the start, saying so |
| L-4 | Resumed at how-loop; Weave's loom and views as they were; 21 steps kept done; the card saying where; the tabs the same size in Learn and Weave |
| L-5 | how-section: the cylinder, needles, hooks and knives glowing, the labels amber; nothing glowing in Weave |
| L-6 | 9 languages × 21 steps: no English left |
| L-7 | 390 × 844: the sheet on the guide, at weave-plain, the controls under the stage |
| L-8 | In four views, the section chosen from the bottom left (marked "shown top left") swapped with the front; a unit chosen bottom right replaced the whole loom; two views from the selector kept it, beside the section |
| L-9 | A newcomer: Learn, "3D · Whole loom"; after Weave: Weave; a Weave link: Weave |
| L-10 | `pnpm selftest`: all 8 pages pass (the app's 18 checks: M6's 9 and M7's 9; the developer pages' 120) |

### Translations to check by hand

The translators' least sure choices, for the native speakers' check before 0.1.0:

- **The draw loom and the draw boy:** es "telar de lazos" / "muchacho tirador"; pt-BR "tear de tiragem" / "menino puxador" (the least sure); fr "tireur de lacs"; it "telaio al tiro" / "ragazzo addetto al tiro" (no settled term found); de "Zugwebstuhl" / "Ziehjunge" (or "Zampelstuhl"); zh 花楼机 / 拉花工; zh-TW 花樓機 / 拉花工; ja 空引機 / 引き手の少年; ko 드로 직기 (the least sure; 문직기?).
- **Floats:** es "bastas", pt-BR "flutuações", fr "flottés", it "slegature", de "Flottungen", zh 浮长, ko 뜬 실.
- **A satin's step:** fr "décochement", it "scoccamento", de "Steigung", ja 送り, ko 뜀수, as the presets already name it; zh and ja add "greater than 1" to "no common factor", to be exact.
- **The loop:** es "lazo" and it "anello" (the files' word for the laced chain) rather than the programmer's "bucle", "ciclo"; zh-TW 迴圈 in the title, 環 for the chain.
- **The ruled paper of the portrait:** de "kariertes Papier" (or "Patronenpapier"), fr "papier quadrillé" (or "papier de mise en carte"), zh 意匠纸.
- **Italian:** a step of the tutorial is "tappa", since "passo" is the shed.
- **Jacquard the man and the machine:** ja ジャカール but ジャカード機, ko 자카르 but 자카드 기계, as the files already name the machine.
