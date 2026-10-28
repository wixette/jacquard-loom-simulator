# M9 notes: Games (first called Play), the four games

- **Status:** built 2026-10-27/28, on the branch `release/v0.2.0` ([public-app.md](public-app.md) §2, §4). The games' logic passes in `pnpm test` (`tests/game/games.test.js`, `tests/accept/game.accept.test.js`), their links in `tests/sim/link.test.js` and `tests/app/links.test.js`, and the app with `?selftest` (P-1 to P-6).
- **Page:** [`index.html`](../index.html): a fourth workspace, Games (`w=play`; first called Play).

## What M9 builds

| Part | Where | What it is |
|---|---|---|
| The games' logic | `js/game/nameGame.js`, `js/game/byteGame.js`, `js/game/guessGame.js`, `js/game/drawBoy.js` | Pure: no DOM |
| Games | `js/app/playState.js`, `js/app/play.js` | The game on show and each game's state; the game loom set up for it; the actions the panel calls |
| The panel | `js/app/components/games.js`, `css/app.css` | A list of the games by their titles (tabs until 1.0.0); the game's controls; on the right, the machine (the section) as it weaves |
| Links | `js/sim/link.js`, `js/app/links.js` | `w=play` with `game`, `text`, `mode`, `seed`; one byte per card's message as its cards only (design/links.md, Games) |

## The games

| Game | What the player does | What it shows |
|---|---|---|
| The name game | types a name or a message, wrapped at the spaces into up to 16 lines of 8 characters; chooses how it is read, square by square or as damask (as Design reads a picture); Weave to the end | the cards, the cloth, and the cloth read back into letters |
| One byte per card | types a message of up to 32 ASCII characters | a card a character, each row's bits, code and letter; Share sends a friend the cards only, to read back |
| Guess the cloth | picks which of three cloths a small looped deck weaves | the wrong ones are the deck misread (reversed, mirrored, inverted, shifted), and a wrong pick says which |
| Draw boy against Jacquard | pulls the cords for each row and throws the shuttle, eight rows; then lets the cards do it | the cords pulled against the fewest needed, the rows woven wrong; then the same figure from eight cards |

## Decisions

1. **The games run on a loom of their own** (`game`), as Learn and Create do, so a game never touches the learner's cards in Weave; like Create's, its cards are the game's (`play.locked`).
2. **A friend's secret is only cards.** One byte per card's link carries the deck in `c` and no text, so the message is read from the holes or the cloth, not from the link.
3. **A puzzle is its seed:** guess the cloth draws a deck from a seeded generator (mulberry32), so a link gives a friend the same puzzle and the tests the same cloths.
4. **No historical speeds:** draw boy against Jacquard counts cords pulled and cards, not minutes, since none of the research's sources gives a draw boy's speed.

## After the review (2026-10-28)

5. **The name game takes a message, not only a name:** the text wraps at the spaces into lines of 8 characters (a word longer than a line is cut; a line break typed is kept), up to 16 lines, about 100 characters, with two blank pixel rows between lines so that a descender never meets the line below. Sixteen lines as damask are 1,144 cards on 256 hooks; a link's `text` takes up to 144 characters. The cloth, read back, shows the text as typed.
6. **The cloth view draws a long cloth cheaply:** it lays two tiles (warp over, weft over) as patterns, a rectangle for each run of squares alike, instead of a gradient for every square (about 110 ms instead of 420 for 1,000 rows on 256 ends); and while the loom plays, it draws again only when a row is woven or the row in the shed appears or goes, not at every frame. It shows up to 1,200 rows, the newest.
7. **The games are chosen from a list, not tabs** (1.0.0, the author's call): a list holds as many games as there come to be, where four tabs were already tight on a phone; and a game is chosen, not a page of the panel shown. Each game is listed by its title, which the list shows as the panel's heading.

## Acceptance spec

The games' logic is checked in `pnpm test` (above); these are the app's own, on `index.html?selftest` (`js/accept/m9Checks.js`).

| ID | Statement | Kind |
|---|---|---|
| P-1 | Games opens on its loom with the cloth, and the list of the four games, by their titles, opens each. | page |
| P-2 | The name game: the text typed, woven to the end, reads back as typed, as damask and square by square. | page |
| P-3 | One byte per card: a card a character, the cloth reads back as the message; its link gives only the cards, to be read. | page |
| P-4 | Guess the cloth: three cloths; a wrong pick is told why, the right one counted; Next brings another. | page |
| P-5 | Draw boy against Jacquard: the figure woven cord by cord by hand, then by the cards, the same cloth. | page |
| P-6 | A game's link opens the same game; guess the cloth, the same puzzle. | page |

### Results (2026-10-28)

All pass (`pnpm selftest`, 2026-10-28). What each reports:

| ID | Result |
|---|---|
| P-1 | name, byte, guess, drawboy |
| P-2 | JACQUARD both ways |
| P-3 | Loom in 4 cards; the link's length, in characters, with no text in it |
| P-4 | The puzzle's seed, and its answer (1 to 3) |
| P-5 | 22 cords pulled for 8 rows |
| P-6 | The link itself, with `w=play`, `game=guess` and the puzzle's `seed` |
