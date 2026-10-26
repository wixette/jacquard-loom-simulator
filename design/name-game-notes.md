# The name game: prototype notes

- **Status:** prototype built 2026-10-26, to show the simulator is ready for games ([design/public-app.md](public-app.md) §2). The checks below pass in `pnpm test` (G-1 to G-4) and on [`dev/06-name-game/`](../dev/06-name-game/) with `?selftest` (with G-5, the page's own).
- **Page:** type a name (up to 8 characters a line, up to 4 lines, plain ASCII); choose **Real cloth** (damask) or **Quick** (direct); press **Weave** to watch the loom read the cards one by one, or **Weave it all**; the page then reads the cloth back as text. **Save a picture** gives a PNG of the cloth, **Copy a link** a link that opens the game with that name (`?text=…&mode=damask|direct`).

## How it works

| Part | Where |
|---|---|
| The font | `js/game/unscii16.js`: Unscii 8 × 16 by Viznut, the 95 printable ASCII characters, taken from `unscii-16.hex` (http://viznut.fi/unscii/) on 2026-10-26. Unscii is in the public domain (its "full" variant, GPL because of GNU Unifont, is not used); REUSE.toml marks the file so. |
| Text to picture | `checkText()` and `textPicture()` in `js/game/nameGame.js`: lines centred in the widest line's width, each character an 8 × 16 glyph. |
| Picture to cards | `planName()`: the picture helper's readers (`js/sim/design.js`). **Real cloth:** damask, each pixel 4 × 4 threads of 8-end satin, on up to 256 hooks of the reference 400 head (8 characters: 256 hooks, 64 cards a line). **Quick:** direct, one pixel per thread, on up to 64 hooks (16 cards a line), its loose threads counted and reported. The first card is the picture's bottom row, so the cloth reads from the top. |
| Weaving | The loom of the 2D views (`js/sim/loom.js`), stepped or played; the cloth drawn by `js/view2d/clothView.js`. |
| Cloth back to text | `decodeCloth()`: a pixel is dark where most of its threads show the warp (in damask, the warp-faced satin of the letters); each character's 8 × 16 cell is matched against the font. |

## Decisions

1. **Unscii, not Terminus.** Both suit the game; Unscii is public domain, so it needs no licence file beside it. Terminus (SIL Open Font License) can replace it with its licence.
2. **Damask is the default.** It is the real cloth (no thread loose over more than 8 others) and it uses the real head of the whole-loom view; the quick mode is there to show why weavers did not weave letters pixel for pixel.
3. **The loom's own simulation weaves it,** not a shortcut: the game is the simulator with a different way of making the cards. The checks weave every test text through the loom and read the cloth back.
4. **The link carries the text and the mode, not the cards** (design/public-app.md §2).
5. **A 256-hook damask head is shown only as cloth.** The 2D section and the 3D units show the learner's 8 to 64 hooks; a game that needs the head itself would show one cross-row of it, as the learner page does.

## Acceptance spec

| ID | Statement | Kind |
|---|---|---|
| G-1 | The font (Unscii 8 × 16) has all 95 printable ASCII characters, each 8 × 16 pixels, no two alike, none blank but the space. | data |
| G-2 | Up to 8 printable ASCII characters a line, up to 4 lines, are accepted; anything else is refused with a reason; 8 characters fit the 400 head as damask (256 hooks) and the 64-hook head directly. | logic |
| G-3 | As damask (4 × 4 threads of satin a pixel, on up to 256 of the 400 head's hooks), with no loose thread longer than 8, every text's cards, woven through the loom, give a cloth that reads back as the text. | logic |
| G-4 | Directly (one pixel per thread, on up to 64 hooks), every text's cards, woven through the loom, give a cloth that reads back as the text. | logic |
| G-5 | On the page, a name typed is woven (all at once) into its rows and read back from the cloth, in both modes; a text outside the font greys Weave and says why; the cloth saves as a PNG picture; the link carries the text and the mode. | page |

### Results (2026-10-26)

| ID | Result |
|---|---|
| G-1 | 95 glyphs |
| G-2 | 5 texts accepted, 6 refused |
| G-3 | 6 texts, 512 cards; longest float 8 |
| G-4 | 6 texts, 128 cards |
| G-5 | 2 names woven and read back; a 32 kB picture; at 1440 × 900 and 375 × 812 (phone, no sideways scroll) |

## Next, for the public app

The other three games of design/public-app.md (one byte per card, guess the cloth, draw boy against Jacquard) reuse the same pieces: a way to make cards, the loom, the cloth view, and a reading of the cloth.
