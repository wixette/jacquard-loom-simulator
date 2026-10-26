# The public app: design

- **Status:** agreed on 2026-10-26, for the learner page in this public repository. Nothing here changes the developer pages or the lessons as built in M2 and M4; it says what the public app does with them.
- **Built so far:** the name game's prototype, [`dev/06-name-game/`](../dev/06-name-game/) ([notes](name-game-notes.md)).
- **Layout:** how the many views and panels are organized on desktop and phone: [ui-layout.md](ui-layout.md).

## 1. A tutorial instead of a list of lessons

The ten lessons of M2 and M4 are reorganized into one step-by-step tutorial, each step about one screen, with "predict, then weave" wherever possible. Progress is kept in the browser, and every step has a link, so a teacher can send a class straight to it.

| Part | What it does | Built from |
|---|---|---|
| **1. The story** (2 or 3 screens) | The draw boy calling the cords by hand; Bouchon's paper band (1725), Falcon's card chain (1728), Vaucanson (1745); Jacquard putting it together (1801–1804). Kept inside the research's list of myths: no "patented 1801", no "24,000 cards" for the woven portrait (research REPORT §8). | the research's history notes |
| **2. The concept** | A program is a fixed sequence of instructions read in order, and the loop (a closed chain of 4 cards weaving 40 rows) is the first loop in the history of programming. Then what the loom is not: no choice, no arithmetic, nothing written back. Lovelace: "weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves" (Note A). | L9; the loop half of L7 |
| **3. Operate the machine** | One lesson in steps, from the easiest pattern to a picture: one card, one row; plain weave; twill; satin; a picture. Two moments kept as they are: the satin stepped by two, which fails (predict, then see why the step must share no factor with 8), and the picture woven bottom-up (the first card is the bottom row). The tie-up's repeats across the warp are explained here, as operating the machine. | L1–L5; the tie-up half of L7 |
| **4. Create** | The picture tool, as a tutorial on using it; it ends on its reveal: why a picture read pixel for pixel would fall apart (loose threads), and how weavers fixed it (damask in satin). Then the name game. | L6; the name game |
| **5. Challenge** | Debugging, as a series of levels of rising difficulty: a swapped card, a missing hole, a wrong tie-up, a loop one card too long. The learner reasons from the cloth back to the program. | L8, extended |
| **6. What came next** | Babbage's operation and variable cards (and Lovelace's "backing"), Hollerith, the computer. Careful with the myths: Hollerith credited a conductor's ticket punch. | the research's history and education notes |

**L10 (make a real card) leaves the tutorial.** Simulator users will not print cards; teachers running a classroom activity will, so "Print these cards" stays as an item in the deck's menu (or on a page for teachers).

## 2. Four mini games

| Game | What the player does | Why it teaches |
|---|---|---|
| **The name game** | Types a name (printable ASCII, up to 8 characters a line, several lines); the page sets it in an 8 × 16 pixel font, cuts the cards, weaves it, and offers a picture of the cloth, a link, and the count of cards it took. | Woven lettering and portraits were the showpieces of Jacquard weaving; the player sees text become a program of cards become cloth. |
| **One byte per card** | On an 8-hook head one card is one byte: a message in ASCII becomes a short chain. The player weaves a secret message, sends the link, and a friend decodes the cloth back into text. | The plainest line from the loom to punched-card data and the computer. |
| **Guess the cloth** | Shown a small deck and three cloths, the player picks the one it weaves. Quick, and good on a phone. | Reading cards as a program; predicting its output. |
| **Draw boy against Jacquard** | The same figure woven twice: once by calling out cords one at a time, as a draw boy did, once with the cards. | Why the invention mattered. Speed figures go on screen only if a source gives them. |

### The name game's rules (from the prototype)

- **Font:** Unscii 8 × 16 (public domain; the "full" variant, which is GPL, is not used); Terminus 8 × 16 (SIL Open Font License) is the alternative, with its licence file. The IBM VGA font is not used: its artwork's status is unclear.
- **Real cloth or a quick one.** Read directly, one pixel per thread, eight characters need 64 hooks, but letters on a blank ground leave long loose threads (the picture tool's lesson again). As damask, 4 × 4 threads of satin per pixel, eight characters need 256 hooks: the real 400 head of the whole-loom view. The game says so: "your name, on a real 400 head: 64 cards a line".
- **Several lines** are stacked with the first line woven last, so the cloth reads from the top.
- **The link carries the text, not the cards** (a 256-hook damask deck would make a very long link).

## 3. Making it attractive

- **The first 30 seconds:** the page opens on a loom already weaving something pretty, with one big Play button; reading comes after playing.
- **Sound,** optional: the clack of the batten and the swish of the shuttle.
- **Languages:** French (Lyon, where Jacquard worked) and Chinese (a large silk-weaving audience) first. The tutorial's text lives in one module per part, ready for translation.
- **Phones and Chromebooks:** the 2D page already works on a phone; the 3D view should start in its lighter quality on weak devices.
- **Sharing:** every cloth can be saved as a picture and reopened by a link.
