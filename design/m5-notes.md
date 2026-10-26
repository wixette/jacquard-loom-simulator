# M5 notes: the foundations of the main app

- **Status:** in progress, from 2026-10-27, on the branch `m5-foundations`. The first milestone of release 0.1.0 ([public-app.md](public-app.md) §4).
- **Page:** `dev/07-foundations/`: every view and panel as a component, placed in any slot of a grid, on any of the app's looms, in any of the ten languages.
- **Done so far:** the dark theme on every 2D and 3D view (reviewed 2026-10-27: lifted is green, iron and lead lighter in 3D); the font and icons vendored; the prototype learner page moved to [`dev/03-learner/`](../dev/03-learner/); `pnpm shots` and `pnpm selftest`.

## What M5 builds

| Part | Where | What it is |
|---|---|---|
| The theme | `css/theme.css`, `css/views.css`, `js/ui/theme.js` | The tokens every page and view takes its colours from ([docs/ui-design.md](../docs/ui-design.md), *Theme*) |
| The languages | `js/l10n/` | The sibling project's machinery: one module per locale, English the reference and fallback, `t()` and `tn()` for plurals, and lists of numbers formatted for each language. Every text the shared views and the loom show is a message key |
| The loom's words | `js/sim/loom.js`, `js/sim/trace.js`, `js/sim/tieup.js`, `js/sim/deck.js` | The machine speaks in messages (a key and its values), not in English sentences; the page puts them into words in the reader's language |
| The components of the interface | `js/ui/components.js`, `js/ui/splitter.js` | From the sibling: icons, elements, translated texts and tooltips, menus, tabs, and the panel's edge (a WAI-ARIA window splitter) |
| The store | `js/app/store.js`, `js/app/looms.js` | One state for the whole app: the looms (the learner's, the tutorial's, a game's), each with its cards, its moment, the card selected, the thread followed, its colours and its status line; the language; the section's view. Every change goes through an action, and every component hears of the changes it shows |
| The components of the app | `js/app/components/` | Each view and panel as `mount(host)`, `update(state, before)`, `unmount()`, drawing to its host's size: the section, the side and front views, the 3D loom and units, the cloth, the chain, the bench card, the transport, the status line and the trace |
| The prototypes on the new code | `js/app/loomPage.js` | The prototype pages that share the loom (`dev/02-loom/`, `dev/03-learner/`) run on the store and the components, and their checks still pass |
| The links | `js/sim/link.js`, `design/links.md` | Every link type the app will publish, designed now and frozen from 0.1.0 (after review) |

## Decisions

1. **A component never finds its elements by id.** It is given a host, makes its own elements inside it, and takes them away again when it is unmounted, so the same component can sit in any slot, twice if need be.
2. **The store holds plain values and the looms; the looms stay classes.** `Loom` (js/sim/loom.js) keeps its methods and its tests. A loom's entry in the store carries a revision number that every action raises, so a component can tell whether the loom has changed without comparing cards.
3. **The machine's messages are data.** `{ key, n?, params? }`: `n` chooses the plural form, a list of numbers is a parameter of its own, formatted with `Intl.ListFormat` in the reader's language ("2, 4 and 7", "2、4和7"). Free text from a prototype (a lesson's English) passes through as `{ text }`.
4. **What is translated in M5:** everything the shared views, the loom and the trace say, and the components' names for screen readers. The prototype pages' own chrome stays English: they are prototypes. The 3D parts' names and the units' descriptions are translated with the 3D stage in M6; the picture tool's and the games' words with their workspaces (M8, M9).
5. **English is loaded with the page, statically;** another language is loaded when chosen, so the page's first draw never waits for a language.
6. **The labels in the drawings are measured as each language needs:** a wide character (Chinese, Japanese, Korean) counts as a full em, not as a Latin letter's share of one.

## Acceptance spec

| ID | Statement | Kind |
|---|---|---|
| F-1 | The store tells a component of a change only when the part of the state it listens to has changed, once per action; an action that changes nothing tells no one. | logic |
| F-2 | The looms are apart: steps, cards and threads followed on one loom never change another, and a component shows the loom it is given. | logic |
| F-3 | Every component mounts in any slot, draws to its host's size (and again when the host is resized), and unmounts leaving no element and no listener behind; moved to another slot, it shows the same state. | page |
| F-4 | Ten locales, each with every key of English, the same placeholders, and no key English lacks; the reader's languages choose the nearest locale; plurals and lists of numbers are formatted for each locale. | logic |
| F-5 | Every message the loom and the trace can give (every stop of every preset deck, at every head size, stepping forward and back, every refusal, every thread followed) has its key, and renders in every locale with no placeholder left unfilled. | logic |
| F-6 | On the M5 page, choosing a language redraws every component in it: no English word left in a component's text in another language (the machine's numbers aside). | page |
| F-7 | Every link type round-trips; a 400-hook deck of 64 cards fits in a link of the agreed length; the format's examples (links.md) decode as documented; a damaged or unknown link is refused with a reason. | logic |
| F-8 | No colour is written into a view: `js/view2d/` and `js/scene/` name colours only through the theme's tokens, and every token a stylesheet or a module uses is defined in `css/theme.css`. | logic |
| F-9 | The prototypes still work: every developer page's `?selftest` passes (`pnpm selftest`). | page |
