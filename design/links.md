# Links: the format

- **Status:** draft, 2026-10-27, for review before release 0.1.0. From 0.1.0 it is a contract ([docs/ui-design.md](../docs/ui-design.md), P8): a later release may add fields, values and link types, and must read every link an earlier release wrote, as that release meant it; it never renames, drops or reads a field differently.
- **Code:** `js/sim/link.js` (no DOM), pinned by `tests/sim/link.test.js`, which decodes every example below.
- **Replaces** the prototype's format (`v=1`, 0.0.1), which is not kept: a `v=1` link is refused with a reason.

## Why links matter

A link opens the app in a state: a teacher's "debug this deck" on a worksheet, a step of the tutorial for a class, a learner's cloth sent to a friend. Worksheets are printed and kept for years, so a link must keep working, and keep meaning the same.

## The envelope

A link is the app's address with a **fragment**: `https://…/jacquard-loom-simulator/#v=2&w=weave&…`. The fields are form-encoded (`key=value`, joined by `&`), in any order.

- **The fragment, not the query:** nothing in it reaches a server or its logs; the app changes it without reloading; and a fragment has no practical length limit in a browser.
- **Unknown fields are ignored,** so a link written by a later release opens in an earlier one, as well as it can.
- **A link that cannot be read** is refused with a reason in the status line, and the app opens as it would without it. A link never half-applies: either every field is read, or none is.

| Field | Values | Default | Meaning |
|---|---|---|---|
| `v` | `2` | required | The format's version. A later format, if ever needed, takes 3; this one stays readable. |
| `w` | `weave`, `learn`, `create`, `play` | `weave` | The workspace the app opens on (design/ui-layout.md §3). |
| `lang` | a locale: `en`, `es`, `fr`, `de`, `it`, `pt-BR`, `zh`, `zh-TW`, `ja`, `ko` | the reader's | The language, when the link's writer wants one. *Copy link* does not add it: a reader's own language usually serves them better. |

## Weave: a loom (0.1.0)

The learner's loom: its head and tie-up, its cards, the moment it is at, and how it is shown.

| Field | Values | Default | Meaning |
|---|---|---|---|
| `h` | 8, 16, 24, … 64 | required with `c` | Hooks in the head (8 per cross-row) |
| `c` | a deck (below) | the app's opening deck | The chain of cards, the first card first |
| `l` | `0`, `1` | `1` | `1`: the chain is laced into a loop |
| `t` | `s1`, `s2`, `s3`, `s4`, `p` | `s1` | Tie-up: straight, repeated 1 to 4 times across the warp, or point |
| `p` | 0 … 1,000,000 | `0` | The pick being woven, from 0 |
| `s` | 0 … 5 | `0` | The moment within it: 0 at rest (the card pressed against the needles), then hooks taken, shed open, shuttle across, beaten up, shed closed |
| `wc`, `fc` | 6 hex digits | `5b3f8c`, `efe3c2` | The warp's and the weft's colours |
| `f` | 1 … h | none | The hook followed |
| `fe` | 1 … ends | none | With `f`: the warp end followed (a cell of the cloth) |
| `fp` | 1 … picks woven | none | With `fe`: the pick of that cell |
| `x` | 1 … h/8 | the followed hook's, or 1 | The cross-row the section cuts |
| `sv` | `whole`, `needles`, `crooks` | `whole` | How close the section looks |
| `face` | `front`, `back` | `front` | The face of the cloth shown |
| `bits` | `0`, `1` | `0` | The 0/1 overlay on the cloth |
| `view` | one, two or four of `section`, `side`, `front`, `3d`, `u1` … `u5`, joined by `,` | the screen's: `section,3d` where the stage is wide enough for two, else `section` | The stage's views, in order: one fills the stage, two stand side by side, four make the quad view. `3d` is the whole loom, `u1` to `u5` its units alone. A link written with the one view `section` leaves it out. |

**A deck** (`c`) is written in one of three encodings, named by its first letter and a dot. Every reader reads all three; which one a writer chooses is not part of the contract (today: readable hex up to 80 characters, so a teacher can read a small deck, and otherwise the shorter of the other two).

| Encoding | Example | For |
|---|---|---|
| `x.` readable: each card as h/4 hex digits, hook 1 in the highest bit of the first digit, cards joined by `-` | `x.a5a5-5a5a` (two 16-hook cards) | Links written by hand, for a worksheet: a teacher can read and change the holes |
| `b.` packed: every card as h/8 bytes, hook 1 in the highest bit of the first byte, the cards one after another, in base64url without padding | `b.paVaWg` | Middling decks |
| `z.` compressed: the packed bytes, compressed with DEFLATE (raw, RFC 1951), in base64url without padding | `z.…` | Most decks: patterns repeat, and a 64-card satin on 64 hooks takes 39 characters instead of 683 |

A deck holds up to 1,024 cards. **Length:** any deck of up to 64 cards on up to 64 hooks gives a link under 2,000 characters, the length that email programs and chat apps pass through whole; a longer link works, and the app says that some apps may cut it.

## Learn: a step of the tutorial (0.1.0)

| Field | Values | Default | Meaning |
|---|---|---|---|
| `step` | a step's name: lower-case letters, digits and `-` | the tutorial's start, or where the learner left it | The step to open, by its name (`weave-twill`), not its number, so a step added before it moves nothing. A step that is renamed keeps its old name as an alias for ever. |

The step sets up its own loom (design/ui-layout.md §2, rule 3), so a Learn link carries no loom. A name no step has (or a step of a later release) opens the tutorial's start, and says so in the status line. *Copy link* in Learn writes the step on show: `#v=2&w=learn&step=how-loop`.

The steps' names in 0.1.0, frozen with it (js/teach/tutorial.js, `STEPS`; a renamed step keeps its old name in `ALIASES`):

| Part | Steps |
|---|---|
| 1. The story | `story-draw-loom`, `story-holes`, `story-jacquard`, `story-portrait` |
| 2. How it works | `how-whole-loom`, `how-units`, `how-section`, `how-needles`, `how-griffe`, `how-one-row`, `how-program`, `how-loop`, `how-not-a-computer` |
| 3. Weave | `weave-punch`, `weave-plain`, `weave-twill`, `weave-satin`, `weave-satin-by-two`, `weave-tie-up`, `weave-picture`, `weave-next` |

## Later link types

`create` (a picture and how it is read) and `play` (a game: the name game's text and mode, a message woven one byte a card, a puzzle) are designed with their workspaces, in M8 and M9, as new fields of this format. Until then a link with `w=create` or `w=play` opens that workspace, or Weave if the release has not got it.

## Examples

Each is decoded by `tests/sim/link.test.js` as stated here.

| Link (the fragment) | Opens |
|---|---|
| `#v=2` | Weave, as the app opens |
| `#v=2&w=weave&h=16&c=x.a5a5-5a5a&p=3&s=2&f=5` | A 16-hook head with two cards (holes 1, 3, 6, 8, 9, 11, 14, 16, then the others), laced into a loop, straight tie; pick 4 with the shuttle across; following hook 5 |
| `#v=2&h=8&c=x.18-18-18-18-99-5a-3c-18&l=0&view=section,3d` | The research's arrow on one cross-row, an open chain, the section beside the loom in 3D |
| `#v=2&w=learn&step=weave-twill` | The tutorial at the step named `weave-twill` |
| `#v=1&h=8&d=ff` | Refused: a link of the prototype's format |
