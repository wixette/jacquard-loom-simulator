# M5 notes: the foundations of the main app

- **Status:** built 2026-10-27, on the branch `m5-foundations`. The first milestone of release 0.1.0 ([public-app.md](public-app.md) §4). The spec below passes in `pnpm test` (F-1, F-2, F-4, F-5, F-7, F-8) and on the M5 page with `?selftest` (F-3, F-6); `pnpm selftest` runs every page's checks (F-9).
- **Page:** [`dev/07-foundations/`](../dev/07-foundations/): every view and panel as a component, placed in any slot of a grid, on any of the app's looms, in any of the ten languages.
- **Reviewed on the way (2026-10-27):** the dark theme on every 2D and 3D view; what a hole lifts is green (brightness alone was too faint); iron and lead are built lighter in 3D, with lights that travel with the camera.
- **For review before 0.1.0:** the link format, [links.md](links.md).

## What M5 builds

| Part | Where | What it is |
|---|---|---|
| The theme | `css/theme.css`, `css/views.css`, `js/ui/theme.js` | The tokens every page and view takes its colours from ([docs/ui-design.md](../docs/ui-design.md), *Theme*) |
| The languages | `js/l10n/` | The sibling project's machinery: one module per locale, English the reference and fallback, `t()` and `tn()` for plurals, and lists of numbers formatted for each language. Every text the shared views and the loom show is a message key |
| The loom's words | `js/sim/loom.js`, `js/sim/trace.js`, `js/sim/tieup.js`, `js/sim/deck.js` | The machine speaks in messages (a key and its values), not in English sentences; the page puts them into words in the reader's language |
| The components of the interface | `js/ui/components.js`, `css/ui.css` | From the sibling: icons, elements, translated texts and tooltips, menus, tabs, buttons and chips. (The panel's edge, a WAI-ARIA window splitter, comes with the layout in M6.) |
| The store | `js/app/store.js`, `js/app/looms.js` | One state for the whole app: the looms (the learner's, the tutorial's, a game's), each with its cards, its moment, the card selected, the thread followed, its colours and its status line; the language; the section's view. Every change goes through an action, and every component hears of the changes it shows |
| The components of the app | `js/app/components/`, `css/components.css` | Each view and panel as `mount(host)`, `watch(state)`, `update(state)`, `unmount()`, drawing to its host's size: the section, the side and front views, the 3D loom and units, the cloth, the chain, the bench card, the transport, the status line and the trace |
| The language | `js/app/language.js` | Chosen by `?lang=`, then the reader's last choice, then the browser's languages; changing it loads its texts, then redraws every component at once |
| The prototypes on the new code | `js/app/loomPage.js` | The prototype pages that share the loom (`dev/02-loom/`, `dev/03-learner/`) run on the store and the components, and their checks still pass |
| The links |  `js/sim/link.js`, [links.md](links.md) | Every link type the app will publish, designed now and frozen from 0.1.0 (after review) |

## Decisions

1. **A component never finds its elements by id.** It is given a host, makes its own elements inside it, and takes them away again when it is unmounted, so the same component can sit in any slot, twice if need be.
2. **The store holds plain values and the looms; the looms stay classes.** `Loom` (js/sim/loom.js) keeps its methods and its tests. A loom's entry in the store carries a revision number that every action raises, so a component can tell whether the loom has changed without comparing cards.
3. **The machine's messages are data.** `{ key, n?, params? }`: `n` chooses the plural form, a list of numbers is a parameter of its own, formatted with `Intl.ListFormat` in the reader's language ("2, 4 and 7", "2、4和7"). Free text from a prototype (a lesson's English) passes through as `{ text }`.
4. **What is translated in M5:** everything the shared views, the loom, the trace and the links say, the 3D view's bands, and the components' names for screen readers. The prototype pages' own chrome stays English: they are prototypes. The 3D parts' names (shown on hover) and the units' descriptions are translated with the 3D stage in M6; the picture tool's and the games' words with their workspaces (M8, M9).
5. **English is loaded with the page, statically;** another language is loaded when chosen, so the page's first draw never waits for a language.
6. **The labels in the drawings are measured as each language needs:** a wide character (Chinese, Japanese, Korean) counts as a full em, not as a Latin letter's share of one; and a label is escaped, since a translation may hold characters SVG gives a meaning to.
7. **Translations, as the sibling's:** Japanese and Korean in the polite register (です・ます, 합니다); each language's own weaving terms (Lyon's in French, the German Jacquard trade's, 提花 terms in Chinese). Chinese, Japanese and Korean have no singular form, so their general form must also read right for one: "its cords", not "its 1 cords".
8. **Links are asynchronous,** because a deck may be compressed (the browser's CompressionStream); the M1 link check (J1-7) awaits them, and checks the new format.
9. **Every developer page's checks run headless:** `pnpm selftest` opens each page with `?selftest` in Chrome and reports, so the browser half of the checks (layer 4) runs as easily as `pnpm test`.

## Acceptance spec

| ID | Statement | Kind |
|---|---|---|
| F-1 | The store tells a component of a change only when the part of the state it listens to has changed, once per action; an action that changes nothing tells no one. | logic |
| F-2 | The looms are apart: steps, cards and threads followed on one loom never change another, and a component shows the loom it is given. | logic |
| F-3 | Every component mounts in any slot, draws to its host's size (and again when the host is resized), and unmounts leaving no element and no listener behind; moved to another slot, it shows the same state. | page |
| F-4 | Ten locales, each with every key of English, the same placeholders, and no key English lacks; the reader's languages choose the nearest locale; plurals and lists of numbers are formatted for each locale. | logic |
| F-5 | Every message the loom and the trace can give (every stop of every preset deck, at every head size, stepping forward and back, every refusal, every thread followed) has its key, and renders in every locale with no placeholder left unfilled. | logic |
| F-6 | On the M5 page, choosing a language redraws every component in it: no English word left in a component's text in another language (the machine's numbers aside). | page |
| F-7 | Every link type round-trips; any deck of up to 64 cards on 64 hooks fits in a link under 2,000 characters; the format's examples (links.md) decode as documented; a damaged or unknown link is refused with a reason, and a compressed deck that would grow past the longest chain is refused unread. | logic |
| F-8 | No colour is written into a view: `js/view2d/` and `js/scene/` name colours only through the theme's tokens, and every token a stylesheet or a module uses is defined in `css/theme.css`. | logic |
| F-9 | The prototypes still work: every developer page's `?selftest` passes (`pnpm selftest`). | page |

### Results (2026-10-27)

| ID | Result |
|---|---|
| F-1 | One action, one telling, to the watchers whose part changed; 11 actions that change nothing tell no one; a refused step changes the status line, not the loom |
| F-2 | Loading, punching, stepping, following, resizing and saying on each of the three looms leaves the other two untouched; playing runs only the looms that play |
| F-3 | 10 components, 20 placements in two slots: each fills its host, redraws when resized, shows the same state as in the other slot, and unmounts leaving no element, class, canvas or watcher |
| F-4 | 10 locales × 184 keys, placeholders alike; nearest locale chosen; plurals and lists ("2, 4 and 7", "2, 4 et 7", "2、4和7") |
| F-5 | 11,514 messages from 6 decks × 8 heads × 2 chains, stepping forward and back, threads followed, refused links: every key known, every message in words in all 10 locales |
| F-6 | 9 languages × 9 components: no English word left |
| F-7 | 38 tests: the 5 examples of links.md, 200 random links round-trip, decks of 64 × 64 under 2,000 characters (a satin's in 39), 21 broken links refused with a reason, a compressed "bomb" refused |
| F-8 | 94 tests: no colour literal in `js/view2d/` or `js/scene/` but the 11 lines that say why (lights, the models' brass, the learner's colours); every token used is defined |
| F-9 | `pnpm selftest`: all 7 pages pass (120 checks) |
