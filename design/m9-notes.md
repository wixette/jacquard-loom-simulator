# M9 notes: Play, the four games

- **Status:** built 2026-10-27/28, on the branch `release/v0.2.0` ([public-app.md](public-app.md) §2, §4). The games' logic passes in `pnpm test` (`tests/game/games.test.js`, `tests/accept/game.accept.test.js`), their links in `tests/sim/link.test.js` and `tests/app/links.test.js`, and the app with `?selftest` (P-1 to P-6).
- **Page:** [`index.html`](../index.html): a fourth workspace, Play.

## What M9 builds

| Part | Where | What it is |
|---|---|---|
| The games' logic | `js/game/nameGame.js`, `js/game/byteGame.js`, `js/game/guessGame.js`, `js/game/drawBoy.js` | Pure: no DOM |
| Play | `js/app/playState.js`, `js/app/play.js` | The game on show and each game's state; the game loom set up for it; the actions the panel calls |
| The panel | `js/app/components/games.js`, `css/app.css` | A tab per game; the game's controls; on the right, the machine (the section) as it weaves |
| Links | `js/sim/link.js`, `js/app/links.js` | `w=play` with `game`, `text`, `mode`, `seed`; one byte per card's message as its cards only (design/links.md, Play) |

## The games

| Game | What the player does | What it shows |
|---|---|---|
| The name game | types up to three short lines; chooses real cloth (damask) or quick (square by square); Weave it all | the cards, the cloth, and the cloth read back into letters |
| One byte per card | types a message of up to 32 ASCII characters | a card a character, each row's bits, code and letter; Share sends a friend the cards only, to read back |
| Guess the cloth | picks which of three cloths a small looped deck weaves | the wrong ones are the deck misread (reversed, mirrored, inverted, shifted), and a wrong pick says which |
| Draw boy against Jacquard | pulls the cords for each row and throws the shuttle, eight rows; then lets the cards do it | the cords pulled against the fewest needed, the rows woven wrong; then the same figure from eight cards |

## Decisions

1. **The games run on a loom of their own** (`game`), as Learn and Create do, so a game never touches the learner's cards in Weave; like Create's, its cards are the game's (`play.locked`).
2. **A friend's secret is only cards.** One byte per card's link carries the deck in `c` and no text, so the message is read from the holes or the cloth, not from the link.
3. **A puzzle is its seed:** guess the cloth draws a deck from a seeded generator (mulberry32), so a link gives a friend the same puzzle and the tests the same cloths.
4. **No historical speeds:** draw boy against Jacquard counts cords pulled and cards, not minutes, since none of the research's sources gives a draw boy's speed.
