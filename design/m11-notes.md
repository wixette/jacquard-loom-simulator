# M11 notes: the release review

- **Status:** under way since 2026-10-28, on the branch `release/v1.0.0`, the milestone of release 1.0.0 ([public-app.md](public-app.md) §4). The first pass, a review of the code, the docs, the tests and the translations, is done; the open questions below wait for the author.

## How the review was done

Five reviews read the code side by side: the logic and the links (js/sim, js/game, js/teach, the app's state); the interface and its accessibility (js/app/shell.js, the components, js/ui, js/view2d, js/scene, css); the tests and the tools; the docs against the code; the ten languages. Alongside them, measured checks on the app itself:

- **Phones:** every workspace and sheet tab at 320 × 640 and 375 × 667 in all ten languages, for anything past the window's edge, controls clipped and errors, with a picture of each.
- **Accessibility:** axe-core 4.10 on each workspace at 1440 × 900 and 390 × 844, and a walk with the Tab key through each.
- **Weak devices:** the first load on a phone's size with the processor slowed four times (ready in about 1 s; 85 requests, 3.8 MB as decoded, three.js 2.1 MB of it), and the 3D view's own fall-back to its lighter quality.

Every finding was checked in the code before it was fixed, and each fix has a test or a check (CHANGELOG, *Unreleased*).

## What was found, in short

- **Links:** two links that did not reopen as they were written (an open chain woven to its end; a loom paused between two moments); fields written and not read (a game's views, the name game's reading without a text); a pick past an open chain's end silently dropped; a looped link of a million picks using gigabytes. The format itself is unchanged: every link that read before reads the same, but for the pick past an open chain's end, now refused.
- **State:** a friend's secret lost when another game was chosen; a Design link's picture lost after a visit to Weave; a followed end left on a hook that no longer lifts it; a chain longer than a link can carry.
- **Interface:** the phone sheet's watchers piling up; every pane, 3D ones too, made again at any change of views; work done every frame that need not be.
- **Accessibility:** the chain of cards a Tab stop per hole (over 130 in Weave), focus lost at every redraw; three of the four games not reachable by the keyboard; the status line announcing several moments a second while the loom played; no reduced motion. After: no serious axe finding, 37 Tab stops to the controls in Weave.
- **Phones:** at 320 px the frame was 368 px wide, its right side cut off, in every language (the frame's one column could not shrink).
- **Docs:** 30 mismatches (links.md's rules, the layouts, the plan, the notes' specs, licensing, development); all fixed.
- **Translations:** one tooltip never translated after its English changed; a handful of errors; the rest for the native speakers (below).

## Open questions, for the author

From the plan (ui-layout.md §7) and the review:

1. A chain-as-timeline strip with a playhead, for long decks.
2. The four-view arrangement below 1440 px wide.
3. A glow on parts in 3D, as the section has.
4. The harness in 3D for draw boy against Jacquard.
5. Pictures of Babbage's and Hollerith's machines for part 6.
6. A logo and favicon drawn as a pair.
7. **Guess the cloth's puzzles differ between browsers.** The deck is shuffled by `sort` with a random comparator, whose result each engine decides: seed 1 gives another puzzle in Safari than in Chrome. A Fisher–Yates shuffle fixes it, but changes every seed's puzzle, so the links of 0.2.0 would show other puzzles. To decide before 1.0.0.
8. **three.js unminified:** the minified build would halve the scripts a first visit loads.
9. **The phone's section and caption:** at 320 px the section is small in its pane and the caption is cut at two lines; and Design's cloth shows its top rows only.
10. **The tablet's own layout** (ui-layout.md §5) is not built: an upright tablet has the phone's.
11. **Following a thread by the keyboard** is by the hook numbers over the chain; the cloth and the drawings are still followed by the pointer only.

## For the native speakers

Beyond design/m7-notes.md's list: es and pt-BR "rompecabezas"/"quebra-cabeça" for a puzzle (a jigsaw?), and es "cartones" where computing says "tarjetas perforadas"; fr "une espace" (byte.hint); fr and it the draw boy's tab, long on a phone; it "Quadretto per quadretto"; ja 段のうち段 (drawboy.row); fr spaces before : ; ? ! not yet narrow and unbreakable.
