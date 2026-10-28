# M11 notes: the release review

- **Status:** done 2026-10-28, on the branch `release/v1.0.0`, the milestone of release 1.0.0 ([public-app.md](public-app.md) §4): a review of the code, the docs, the tests and the translations, its fixes, and the author's decisions on the questions it left.

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

## Open questions, decided by the author (2026-10-28)

- **Not in 1.0.0, as they are:** a chain-as-timeline strip (the cards panel already shows the card on the needles); the views' arrangements below 1440 px; 3D steps pointing by a unit alone, without a glow; draw boy against Jacquard in 2D; part 6 in words, without pictures; the logo as it is, also the favicon; the phone's section and caption at 320 px; the tablet with the phone's layout; following a thread by the keyboard from the hook numbers only.
- **Done for 1.0.0:** guess the cloth's shuffle made the same in every browser (Fisher–Yates; every seed's puzzle changed once, links.md says so; three seeds pinned by a test, checked in V8 and JavaScriptCore); three.js minified in `pnpm vendor` (esbuild), from 2.3 MB to 0.8 MB; the games chosen from a list by their titles, not tabs (m9-notes, decision 7).
- **The translations and the tutorial's text:** checked by the author in a few rounds, not every string; good enough for 1.0.0.

## For the native speakers

Beyond design/m7-notes.md's list: es and pt-BR "rompecabezas"/"quebra-cabeça" for a puzzle (a jigsaw?), and es "cartones" where computing says "tarjetas perforadas"; fr "une espace" (byte.hint); it "Quadretto per quadretto"; ja 段のうち段 (drawboy.row); fr spaces before : ; ? ! not yet narrow and unbreakable.
