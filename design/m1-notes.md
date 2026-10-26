# M1 notes: the whole loom in 2D

- **Status:** built 2026-10-25. The M1 spec below passes in `pnpm test` and on the page with `?selftest` (with M0's, 21 checks).
- **Page:** [`dev/02-loom/`](../dev/02-loom/). M0's page, [`dev/01-section/`](../dev/01-section/), still works on the same code.

## What M1 adds

| Requirement (plan §9) | Where |
|---|---|
| Hook counts 8–64 | `HOOK_COUNTS`, `presetDeck()` and `resizeDeck()` in `js/sim/deck.js`. The simulation was already per hook; the section now cuts any cross-row (`sectionLayout(snap, crossRow)`), and the page offers a cross-row menu. |
| The real and the unfolded card | `js/view2d/cardLayout.js` (the real card's geometry: 8 rows × c columns at 6.9 × 6.3 mm, peg and lacing holes) and `js/view2d/chainEditor.js`: the selected card lies "on the bench" as the real card; the chain lists every card unfolded into a strip of holes in hook order. Either can be punched; `holeOfHook()` and `hookOfHole()` are the one mapping both use. |
| The full chain editor | Add, duplicate, delete, move, invert, loop: the deck functions of M0, on the selected card. |
| Straight, repeated and point ties | Straight × 1 to 4 and point; a new tie or head restarts the loom, because the warp changes. |
| The loom's front and side views | `js/view2d/frontView.js`: hooks, the harness fanning to every warp end through the comber board, mails and lingoes, the shed end-on, the shuttle laying the weft. `js/view2d/sideView.js`: treadle, lever, head, harness, warp and shed, batten, cloth, roughly to scale. Each is a pure layout plus a renderer. |
| The woven cloth, with colours | `js/view2d/clothView.js`: a canvas, each cell shaded as a warp or a weft float, front or back (the back is the front turned over), warp and weft colours, a 0/1 overlay; the newest 400 rows. |
| The trace across panels | `js/sim/trace.js`: from a cloth cell (pick, end) or a hook to the card, its hole (column, row), the cross-row, the needle, the knife, the harness cords and the ends. Every panel highlights from the one `Trace`, and the page says it in words. |
| Links | `js/sim/link.js`: the format is documented at the top of the file and pinned by `tests/sim/link.test.js`. "Copy link" writes it to the address bar and the clipboard. |

## Decisions made while building

1. **The chain is shown unfolded, the bench card is shown real.** A list of real cards (8 rows each) would be long and hard to compare; a list of strips reads like point paper, row by row over the warp. The selected card is shown as the real card beside it, so the folding (8 deep, one column per cross-row) is always in view. This is the plan's §4.1, arranged for space.
2. **The front view is schematic.** The hooks sit in a row in hook order under the head; the cords fan straight to the comber board. The real harness is a metre long and the hooks stand 8 deep; neither would read at this size. The page names it.
3. **A wide warp is drawn taller.** At 256 ends (64 hooks × 4) the front view's height grows with its width, so it stays readable; its checks measure the drawn shed, whatever its size.
4. **The side view takes its frame from estimates** (the Science Museum loom's overall size; members, heights and the lever's arms estimated). It shows the rhythm, not dimensions, and says so.
5. **A link records the followed hook, not the followed cell,** and the moment as a stop index (0 at rest, 1–5 the stops up to "shed closed"). Copying a link while playing settles on the stop just passed.
6. **Step messages count past a dozen** ("card 6's blanks have pushed needles (56 of them) back") instead of listing 56 numbers.
7. **The page draws on every action and every frame of Play only** (as M0 after its fix); the chain list redraws only when what it shows changes, because at 64 hooks it is thousands of buttons.

## M1 acceptance spec

Each statement is one test in `tests/accept/m1.accept.test.js` and one `?selftest` check on `dev/02-loom/`. The checks drive the loom through the page's methods and measure the page's own layouts. Random decks come from a seeded generator, so runs repeat.

| ID | Statement | Kind |
|---|---|---|
| J1-1 | For 8 to 64 hooks, hook h has its hole at column ⌈h/8⌉, row ((h−1) mod 8)+1 of the real card, on the 6.9 × 6.3 mm grid, on the card and clear of the peg holes; punching hole h in the strip and the hole at its column and row of the card is one act. | logic + 2D readout |
| J1-2 | For 16, 24 and 64 hooks, the section of each cross-row shows that cross-row's 8 hooks and the card's column for it: needle k is pushed exactly when hole 8c + k is blank. | 2D readout |
| J1-3 | In the front view, for 8, 16 and 64 hooks and five ties, warp end e is up (by the full drawn shed) exactly when the hole of hook tie(e) is punched, and its cord runs from that hook. | 2D readout |
| J1-4 | No edit of the chain (punch, add, duplicate, delete, move, invert, open the loop) rewrites cloth already woven; the next pick is woven from the edited chain. | logic |
| J1-5 | The cloth shows the warp's colour exactly where an end was lifted, row by row, first pick first; the back is the front with every float turned over and left and right swapped; the row in the shed is marked. | 2D readout |
| J1-6 | Every cloth cell (pick, end), over five ties, traces to its card, its hook tie(e), its hole and cross-row; the hole's bit is the cell's bit; the end is among the hook's ends; the hook is in that cross-row's section. | logic |
| J1-7 | Links round-trip 60 random states exactly; the documented example reads as documented; ten broken links are refused with a reason and never throw. | logic (contract) |
| J1-8 | In the front view the shuttle enters the warp only in its time, and crosses clear of every end (≥ 0.5 units), laying the weft between the sheets. | 2D clearance |
| J1-9 | In the side view the shed at the mails equals the hooks' lift, the treadle's cord point drops by the griffe's lift, the reed reaches the fell at the beat and never passes it, and the shuttle shows only in a fully open shed, in front of the reed. | 2D readout + clearance |
| J1-10 | On 16 hooks (straight × 3) and 64 hooks (point), every step is the next named stop and changes the machine; stepping back the same number of steps returns to the start. | logic |
| J1-11 | The chain rides the cylinder in order: the next card on the face below, the card at the needles, the card just read on the face above (and a fourth card on the back face only when a loop of 4 or fewer wraps the whole prism); an open chain has no card past its ends. Every drawn card spans one pitch of the chain, is laced to its neighbours, has hole 1 at the end laced to the card before it, and shows its eight holes as the card has them; at rest each punched hole of the card at the needles is level with its needle. The expected cards are worked out in the check, not taken from the simulation. | 2D readout |
| J1-12 | The chain moves continuously, over loops of 2 to 12 cards and open chains, at 400 moments of every pick: no card or card number jumps (≤ 4 mm between moments), appears or vanishes (only by fading, ≤ 5 % opacity); no card is drawn twice at once (except a loop shorter than the four faces, which repeats by design); no hanging card enters the cylinder; the two strands never cross; and the drawing at the end of each pick equals the start of the next. | 2D readout + clearance |

### Results (2026-10-25)

| ID | Result |
|---|---|
| J1-1 | All 8 head sizes; the 64-hook card is 132.3 × 58.7 mm |
| J1-2 | 520 hook-moments over 16, 24 and 64 hooks |
| J1-3 | 3,159 warp ends over 3 heads × 5 ties |
| J1-4 | 7 kinds of edit after 3 picks |
| J1-5 | 7 rows (one in the shed) × 32 ends, front and back |
| J1-6 | 1,722 cells over 5 ties |
| J1-7 | 60 random states; 10 broken links refused |
| J1-8 | The closest end to the shuttle is 11 units away |
| J1-9 | 400 moments of one pick |
| J1-10 | 108 steps out and back |
| J1-11 | 180 sections over 3 decks and 5 moments of every pick (added 2026-10-26, rewritten for the chain the same day) |
| J1-12 | 24,060 moments over 8 chains (added 2026-10-26) |

In the browser (2026-10-25): `?selftest` 19/19 (24/24 with J0-10, J1-11, J1-12, V-1 and V-2, 2026-10-26) with no console errors; a cloth cell traced through the bench card, the chain, the section, the front view and the cloth; a copied link reopened the loom at the same pick, moment, tie, head, loop and followed hook; a broken link was refused with its reason; at 64 hooks × 4 (256 ends) a step redraws in about 8 ms on an M-series Mac (16 ms at worst). No school Chromebook has been tried.

## Fixed after M1 (2026-10-26)

**The cylinder's faces.** Seen on the 2/2 twill: one face of the cylinder read as punched all over. The face holding the card just used (the one before this pick's) asked the chain for "pick −1", which counted as no card even in a closed loop, so the bare face showed its bored holes, which look like a card cut all over. In a loop the card before card 1 is now the last card (`cardIndexForPick` wraps both ways), and an open chain's bare faces say "no card". The cylinder is also redrawn to be read: each card is a strip with its punched holes as dark dots, as in the card editor; each face carries its card's number, the one at the needles highlighted; an arrow shows the way the prism turns; and the "Needles" view is framed on the cylinder. J1-11 checks it, and fails on the old code with the reported symptom.

**The cylinder, drawn to be read (second pass).** Each card on a face is a pasteboard strip with all eight hole positions marked as in the card editor: a filled dark dot is punched, a hollow circle is blank. The card at the needles is gold. A face with no card has a dashed edge and its bored holes, small and faint (so they cannot pass for a card's holes); the words "no card" were tried and dropped, since the drawing already says it and the text wandered round as the prism turned. The strips span their eight marks rather than the card's full 58.7 mm, so neighbouring faces do not overlap at the corners. The turn is a 45° arc, centred on the lower-left corner (clear of the needle board), with its arrowhead computed along the arc. J1-11 now also checks every face's eight marks against its card.

**No caching while developing.** The pages name every file with the release's version (`?v=0.0.1`), so between releases a changed stylesheet keeps its name, and a browser that cached it under `python3 -m http.server` went on showing the old one: new cylinder shapes were drawn with no style rule, as solid black. `pnpm serve` is now `tools/serve.mjs`, a file server that sends `Cache-Control: no-store`. A browser that cached files before needs one hard reload.

**The chain and the cylinder (third pass).** *(Its arrangement of the chain was the wrong way round, and was replaced on 2026-10-26: see "The chain the right way round" below. The fading, the dashed rest of the chain and the checks of continuity stand.)* The four faces used to be four fixed places whose cards were renamed at every pick, so a face's card changed on the spot; and nothing showed that the cylinder sits in a long chain. Now the section draws the chain itself near the cylinder (`chainNearCylinder()` in `js/view2d/layout.js`):

- The chain wraps the prism over three faces: the next card below, the card at the needles, the card just read above. The cards already read hang straight down the outer side (the first of them along the back face at rest); the cards to come rise to the face below, inside them, at 70° from the vertical. Cards are laced at their ends (dots).
- As the prism turns a quarter, the chain moves on by one card: cards on the faces ride round with it; the card leaving the top swings down the outer side; the next card swings from the incoming strand onto the face coming round underneath; the hanging cards slide along. Card numbers ride with their cards and stay upright; a card changing between lying on a face and hanging crossfades its number from inside the prism to outside.
- Only a few cards are drawn on each strand, fading out (two cards' reach); the rest of the chain is a dashed line, joined below into a dashed loop for a closed chain, or a dashed tail where an open chain goes on. Exact counts are left to the chain list. In a short loop the reach shrinks so that no card shows on both strands at once: it fades out of one and into the other, as if it had gone round the hidden part of the loop.
- A loop of 4 cards really wraps all four faces, and is drawn so; a loop of 2 or 3 is drawn repeated round the prism (a real chain that short could not run on a four-faced cylinder; weavers repeat cards).
- The turn arrow moved to the prism's upper outer corner, clear of the hanging chain; the "Needles" view is framed on the cylinder and the chain; the "card cylinder" label sits above the cylinder.

J1-11 was rewritten for the chain and J1-12 added: its key statement, that each pick ends exactly where the next begins, is the reported surprise turned into a test.

**Labels sized on screen (2026-10-26).** Labels on the 2D drawings were sized in the drawing's own units (the section's as a share of the view's height), so they came out tiny in a wide view (5.5 px card numbers) and huge in a close-up (33 px), and the close-ups placed labels for parts out of view, which ran off the drawing and under the side bar. Now every label goes through `js/view2d/labels.js`: about 12 px on screen (numbers 10–11 px) at whatever scale the drawing is shown; drawn only when the part it names is in view; kept inside the visible area; moved aside, or left out, rather than laid on another label. Card numbers are left out when the cylinder is drawn too small to carry them (the chain list shows them), and the bench card's column numbers are sized the same way. The pages redraw when the window is resized. A browser check, **V-1** in both pages' `?selftest`, measures every label as shown, in every view of the section: 9–19 px tall, inside its drawing, not covered by anything else on the page (the point under it belongs to its drawing), and clear of every other label. It passed on both pages at 2560 × 1440, 1920 × 1080, 1280 × 800, 1100 × 900 and 375 × 812 (phone). V-1 runs only in the browser, since Node cannot measure text.

**Labels clear of the drawing (2026-10-26, second pass).** The first pass kept labels off each other but not off the drawing, and keeping a label in view could push it onto a part ("knives" inside the griffe frame, "hooks" across hooks, "harness, shortened" across the break lines, "needle board" over the cylinder, "mails: warp down" over a mail). Now each view hands the placer its parts as obstacles, each over its whole range of motion in a pick (the hooks with full lift and push, the griffe over its stroke, the cylinder over its travel and turn, the mails over the shed, the shuttle's path, the lever, treadle and batten over their strokes), so a label never has to move mid-pick. Each label tries a few spots beside its part and takes the first one wholly in view and clear; a long label may wrap onto two lines ("needle / board" in the close-up); a part with no room beside it may get its label further off with a thin leader line that crosses nothing ("needle board" in the whole view); a label with no clear spot is left out (the section module records which and why, in `LEFT_OUT`). A second browser check, **V-2**, samples points across every name label and fails if any shape of its drawing lies under one (a label planted on the needle board was caught). Both checks pass on both pages at the five sizes, and through a whole pick no label moves.

**The cloth blinked as it outgrew its box (2026-10-26).** The cloth's cells were sized to the width inside its box, and that width lost 15 px when the box's scrollbar appeared. So the cloth overflowed, its scrollbar appeared, the cells shrank, the cloth fitted again, the scrollbar went, the cells grew and it overflowed again, at every redraw, for a second or two of Play until the cloth was tall enough to overflow even at the smaller size. (The box's height not being a whole number of rows was not the cause.) The cells are now sized to the width less room for a scrollbar whether one shows or not, and the cloth's box and the side panels reserve that room (`scrollbar-gutter: stable`); without the second part, the M1 page still changed size once, when its whole side panel first needed a scrollbar. A browser check, **V-3**, in the `?selftest` of `dev/02-loom/` and the learner page, weaves a looped chain until the cloth is 30 steps past its box and requires one cell size throughout; it fails on the old code ("2 widths, 306px and 290px").

**The chain the right way round (2026-10-26).** The maintainer asked what holds the next card against the cylinder's underside, where the drawings put it: nothing would. The third pass had taken the arrangement from the drawing's needs, not from a source, and had it upside down: the next card on the bottom face, a counter-clockwise turn, the read cards over the top and down the outer side. Posselt (1887, Fig. I, "the catches") says the forward catch "will turn the card situated on its top towards the needle-board", and the reverse catch brings back "the card hanging below the needle-board". So the chain lies over the prism: the card at the needles on the needle face, the next card on top, the one after it down the outer face, the cards to come hanging from the outer face's lower corner, and the cards already read hanging straight down below the needle face; the face underneath is bare. The forward turn is clockwise in the drawing: the top card rides round to the needles, and the card that was there swings off its face and hangs from its upper corner. Hole 1 is the card's top edge on the needle face, the end laced to the next card. Which card is read at each pick did not change, so neither did the cloth. J1-11 now expects this order (worked out in the check), and J1-12 adds that every card lies on a face that does not look downward or hangs straight down; on the old drawing it fails with "card 2 lies under the cylinder, with nothing to hold it up". The 3D cylinder (U2) turns the same way, its spring hammer now presses from below as in Posselt's Fig. X, and its catches carry the right names (the upper one forward).

## Not in M1 (M2 and later)

The picture helper (direct and damask), the lessons, the learner page `index.html`, printing cards at true size, more languages, and the 3D units.
