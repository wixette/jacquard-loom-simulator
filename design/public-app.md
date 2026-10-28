# The public app: design

- **Status:** agreed on 2026-10-26; revised on 2026-10-27 for the main app at `index.html`, which replaces the prototype learner page. The developer pages (`dev/`) are prototypes; the lessons of M2 and M4 are not carried over as lessons, only as material for the tutorial (§1).
- **Built so far:** the main app's frame and Weave (M6, [notes](m6-notes.md)); the tutorial's parts 1 to 3 (M7, [notes](m7-notes.md)); Design (`w=create`, first called Create) and the tutorial's parts 4 and 5 (M8, [notes](m8-notes.md)); Games (`w=play`, first called Play), the four games (M9, [notes](m9-notes.md)); the tutorial's part 6 (M10, [notes](m10-notes.md)); the name game's prototype, [`dev/06-name-game/`](../dev/06-name-game/) ([notes](name-game-notes.md)); the release review for 1.0.0 (M11, [notes](m11-notes.md)).
- **Layout:** how the many views and panels are organized on desktop and phone: [ui-layout.md](ui-layout.md). The look (a dark theme), the languages and the components are shared with the sibling project, the [Stepped Reckoner](https://github.com/wixette/leibniz-stepped-reckoner) ([docs/ui-design.md](../docs/ui-design.md)).
- **Releases:** §4.

## 1. A tutorial, not lessons

The app has no list of lessons. One tutorial, in a guide panel, takes the learner from the machine's history, through how it works and what it is, to weaving tasks from the easiest to rather hard ones, and then to the app's own tools. Each step is about one screen, with "predict, then weave" wherever possible. Progress is kept in the browser, and every step has a link, so a teacher can send a class straight to it.

| Part | What it does | Built from |
|---|---|---|
| **1. The story** (four steps) | The draw boy calling the cords by hand; Bouchon's paper band (1725), Falcon's card chain (1728), Vaucanson (1745); Jacquard putting it together (in about 1804–1805). With the research's pictures, each with its credit. Kept inside the research's list of myths: no "patented 1801", no "24,000 cards" for the woven portrait (research REPORT §6). | the research's history notes and images |
| **2. How it works, and what it is** | First the mechanism: the parts in 3D (the whole loom, then the five units), and one pick stepped through the head in section: a light needle pushes a hook off a heavy rising griffe, so a card can lift threads without any power of its own (mechanical amplification). One card is one row of the cloth, one hole one hook, and a hole lifts its warp end. Then the concept: the chain is a program, a fixed sequence of instructions read in order, and a closed chain (4 cards weaving 40 rows) is the first loop in the history of programming. And what the loom is not: no choice, no arithmetic, nothing written back. Lovelace: "weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves" (Note A). | the research's scenario 4 and misconceptions (REPORT §6); L9; the loop half of L7 |
| **3. Weave** | Practical tasks in steps, from the easiest pattern to a picture: one card, one row; plain weave; twill; satin; a picture. Two moments kept as they are: the satin stepped by two, which fails (predict, then see why the step must share no factor with 8), and the picture woven bottom-up (the first card is the bottom row). The tie-up's repeats across the warp are explained here, as operating the machine. | L1–L5; the tie-up half of L7 |
| **4. Challenge** | The hardest weaving tasks: debugging, as levels of rising difficulty: a swapped card, a missing hole, a wrong tie-up, a loop one card too long. The learner reasons from the cloth back to the program. | L8, extended |
| **5. Your tools** | The app's utilities, each by using it: the picture tool, ending on its reveal (why a picture read pixel for pixel would fall apart into loose threads, and how weavers fixed it: damask in satin; `tools-picture`, `tools-loose`); following a thread across the views (`tools-follow`); the loom's setup (head size, tie-up, colours; `tools-setup`); keeping and sharing (a link, a picture, printing the cards; `tools-share`); then the way to Design (`tools-create`) and to the four games in Games (`tools-games`), each step sending the learner there. | L6; the games; L10's printing |
| **6. What came next** | Babbage's operation and variable cards (and Lovelace's "backing"), Hollerith, the computer. Careful with the myths: Hollerith credited a conductor's ticket punch. | the research's history and education notes |

The weaving tasks (parts 3 and 4) come before the tools (part 5), so the learner has woven by hand before a tool cuts the cards for them.

**How a step behaves** (as in the sibling project, docs/ui-design.md there, U2, U18, U26, U27):

- **A step is one card:** its picture (if any, with its credit), its text, and a task line when the learner has something to do. Back and Next sit under it. Each part opens with what it will teach and ends with a one-line recap.
- **A step names what it needs on screen:** the workspace arrangement, the view on the stage, and what it highlights (parts glow amber in 2D and 3D); it can also put a deck, a tie-up and a moment on the tutorial's own loom (ui-layout.md §2, rule 3).
- **A task** is checked on the machine as it is (the cards, the moment, the cloth), not on the clicks that got there. Its task line shows the control it asks for, which works the real control, and that control glows; the controls the step does not use are greyed and say why (P6).
- **The tutorial is a mode,** shown by the Learn tab and a thin blue frame round the stage; its part and step are on the step's card, not in the top bar (since 0.1.0: ui-layout.md §3). Leaving it keeps the place, to resume later.

**L10 (make a real card) leaves the tutorial as a lesson.** *Print the cards* is in the Share menu, for teachers running a classroom activity; part 5 shows where it is (`tools-share`).

## 2. Four mini games

| Game | What the player does | Why it teaches |
|---|---|---|
| **The name game** | Types a name (printable ASCII, up to 8 characters a line, several lines); the page sets it in an 8 × 16 pixel font, cuts the cards, weaves it, and offers a picture of the cloth, a link, and the count of cards it took. | Woven lettering and portraits were the showpieces of Jacquard weaving; the player sees text become a program of cards become cloth. |
| **One byte per card** | On an 8-hook head one card is one byte: a message in ASCII becomes a short chain. The player weaves a secret message, sends the link, and a friend decodes the cloth back into text. | The plainest line from the loom to punched-card data and the computer. |
| **Guess the cloth** | Shown a small deck and three cloths, the player picks the one it weaves. Quick, and good on a phone. | Reading cards as a program; predicting its output. |
| **Draw boy against Jacquard** | The same figure woven twice: once by calling out cords one at a time, as a draw boy did, once with the cards. | Why the invention mattered. Speed figures go on screen only if a source gives them. |

### The name game's rules (from the prototype)

- **Font:** Unscii 8 × 16 (public domain; the "full" variant, which is GPL, is not used); Terminus 8 × 16 (SIL Open Font License) is the alternative, with its licence file. The IBM VGA font is not used: its artwork's status is unclear.
- **Square by square or as damask,** the two readings of Design's picture tool. Read square by square, one pixel per thread, eight characters need 64 hooks, but letters on a blank ground leave long loose threads (the picture tool's lesson again). As damask, 4 × 4 threads of satin per pixel, eight characters need 256 hooks: the real 400 head of the whole-loom view. The status line says what it takes: "8 characters on 1 line, as damask on 256 hooks: 64 cards. Press Play, or Weave to the end."
- **Several lines** are stacked with the first line woven last, so the cloth reads from the top. A text wraps at the spaces into lines of 8 characters (a word longer than a line is cut), up to 16 lines, with two blank pixel rows between lines: a name, or a short message (0.2.0; the prototype took 4 lines typed).
- **The link carries the text, not the cards** (a 256-hook damask deck would make a very long link).

## 3. Making it attractive

- **The first 30 seconds:** a newcomer opens on Learn's first step, with the whole loom in 3D: the machine as a whole before its parts; a later visit reopens where the learner left it (ui-layout.md §3). The first plan opened on a loom already weaving, with one big Play button; it was changed after M7's review.
- **The look:** the sibling project's dark Material 3 theme, so the wood, the iron and above all the cards and the cloth are the brightest things on screen (docs/ui-design.md, *Theme*).
- **Sound:** the machine sounds, the interface does not, with a mute button at the end of the transport (as the sibling's U29). The sound files to prepare:

  | What moves (the moments of a pick) | Sound |
  |---|---|
  | The cylinder pressed against the needles (next card pressed) | the wooden clack of the cylinder, with the needles' short rattle |
  | The griffe rising, hooks taken (by the treadle) | the knives' iron clunk and the harness lifting |
  | The shuttle thrown (shuttle across) | the swish of the shuttle |
  | The batten beating up | the clack of the batten, the loudest |
  | The griffe falling, shed closed | a softer thud |
  | The cylinder swinging out and turning to the next card | the card chain's wooden knock |
  | Refused (the chain has run out) | a dull stop |

  Each play varies a little in pitch and loudness, and is heard on the motion that makes it; playing fast, every sound still plays, cut short with a fade to fit within half a pick, near its own pitch, the batten loudest. A tutorial step setting the loom up is silent.
- **Languages:** the sibling project's ten (English, Español, Français, Deutsch, Italiano, Português (Brasil), 简体中文, 繁體中文, 日本語, 한국어), with its machinery: one module per language holding every string of the page, the tutorial, the games and the part names, English the reference and the fallback, and a test that every language has every key (docs/conventions.md, *Code*). Part names are each language's own weaving terms (in French, Lyon's: griffe, crochet, aiguille, carton).
- **Phones and Chromebooks:** the same app on every screen (ui-layout.md §5); the 3D view starts in its lighter quality on weak devices.
- **Sharing:** every cloth can be saved as a picture and reopened by a link.

## 4. Releases

The work runs in milestones as before (M5 onward, each with its notes, acceptance spec and checks), grouped into three public releases. Every release is complete in all ten languages for what it contains.

| Release | Milestones | What a learner gets |
|---|---|---|
| **0.1.0: the loom** | **M5, the foundations:** one store for the state; every view and panel a component that mounts in any slot; the dark theme on every 2D and 3D view; the languages; the vendored font and icons; the shared components (menus, dialogs, tabs, the resizable panel edge). The prototype learner page moves into `dev/03-learner/`, keeping its `?selftest`, so `index.html` is free. **M6, the shell and Weave:** the top bar, the panels, the stage with every view (the three 2D drawings, the whole loom and the five units in 3D) and its arrangements, time (the caption under the stage, the moments and the controls along the bottom), the phone's bottom sheet; the Weave workspace; setup, Share (link, picture, print cards), About; the keyboard; sound. **M7, the tutorial, parts 1–3:** the step player, the story, how it works, weave. | The whole simulator, free to play with, and the tutorial up to weaving a picture |
| **0.2.0: make and play** | **M8, Design** (first called Create): the picture tool as a workspace; tutorial parts 4 and 5. **M9, Games** (first called Play): the four games. **M10, what came next:** tutorial part 6. | Every tool, every game, the whole tutorial |
| **1.0.0: release** | **M11, the release review:** accessibility, the phone and tablet layouts in all ten languages at 320 and 375 px, the 3D view on weak devices, the README with screenshots, the feedback from the test with learners. | The same app, reviewed |

- **Links** (docs/ui-design.md, P8): every link type the app supports (the loom, a workspace and view, a tutorial step, the picture tool's picture, each game's state) is designed in M5 with the store, in one module and one design note, compressed where a state is large (a 400-hook deck, a picture), and frozen from 0.1.0: a later release may add fields or link types, never rename, drop or reread one. The format is reviewed before 0.1.0 ships. The prototype's links (0.0.1) are not kept.
- **Placeholders:** the sound files, the logo and the other artwork are provided later; until then each has a placeholder at its final path and name, so the real file drops in without a code change. The sounds came on 2026-10-27, edited from Pixabay sound effects (`audio/SOURCES.md`, the Pixabay Content License). The logo (`images/logo.svg`) stays for 0.1.0 to 1.0.0, and serves as the favicon too, until a logo and favicon are drawn as a pair.
- **Translations:** written and reviewed by Claude; native speakers check them by hand before each release.
- **The test with learners:** run by the project's author with friends; their feedback goes into the next milestone.
