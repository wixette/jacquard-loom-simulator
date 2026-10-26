# UI design principles

The principles the simulator's pages follow, taken from the [Altair 8800 Simulator](https://github.com/wixette/8800-simulator), which teachers and students use in real computer-science lessons, and from its sibling the [Stepped Reckoner](https://github.com/wixette/leibniz-stepped-reckoner), whose theme, languages, components and sounds the main app shares (that project's `docs/ui-design.md` records its decisions as U1, U2…, cited here by number). The main app's plan builds on them: what it contains in [design/public-app.md](../design/public-app.md), how its many views are laid out on desktop and phone in [design/ui-layout.md](../design/ui-layout.md).

If a change needs to break a principle, change the principle here first, with its reason.

## The principles

| # | Principle | In one line |
|---|---|---|
| P1 | One primary surface | The machine is always on screen; nothing covers it or pushes it out of view |
| P2 | A control has one home | If it is wanted elsewhere, move it; never a second copy (a tutorial's task line works the real control, and is not a copy) |
| P3 | Each role has one home; workspaces arrange them | The program on the left, the machine in the middle, the output on the right, time along the bottom; Learn, Weave, Create and Play arrange the same components for their task (ui-layout.md §1–§3) |
| P4 | Occasional actions in menus and dialogs | Always-visible space is for things that change while you watch: setup, Share, the language and About live in the top bar |
| P5 | Each surface keeps its voice | The machine's own markings stay as on the machine; everything around it is ours, and translated, the parts named in each language's own weaving terms |
| P6 | Unavailable is greyed and explained, never hidden | A greyed control still answers, in the status line, with the reason |
| P7 | One status line, always visible | It says what just happened, and why something is greyed |
| P8 | A link is a public contract | From release 0.1.0, a link that opens the app in a state ends up in worksheets nobody edits again: fields may be added, never renamed, dropped or read differently (`js/sim/link.js`, pinned by its test). The prototype's links (0.0.1) are not kept. |
| P9 | A phone gets the same app | The same components in other slots, every feature; nothing depends on hover or a precise drag |
| P10 | One component per kind of thing | Menu, dialog, icon button, tab, chip, empty state: each always used the same way, following Material Design 3 in our own colours |

## Theme

The sibling's dark Material 3 scheme (its U5), with the same tokens: the views read better on dark, and the machine and its work (the wood and iron, the cards, the cloth) are the brightest, warmest things on screen, framed by cool blue on blue-grey neutrals.

**Each colour has one meaning,** everywhere it appears, in the interface and in the 2D and 3D views alike:

| Colour | Means | Where |
|---|---|---|
| Blue (primary) | The instrument: navigation, selection, where you are | The selected workspace and tab, links, the focus ring, filled buttons, the tutorial's progress and mode, **the followed thread** (its chip, and the hook, needle, hole, warp end and cell it lights in every view) |
| Blue-grey (secondary) | The machine's controls | The tonal buttons: the transport, the card tools |
| Amber (attention) | Your turn | The control a tutorial step asks for (its glow), the task line, and the parts a step points at, in 2D and 3D |
| Green (success) | Done | A finished task, step or part; a game won |
| Red (error) | Something was refused, or a fault | A refused control's reason in the status line; the chain run out; a loose thread marked on the cloth |
| The machine's own colours | What the machine is made of | Wood, iron, steel, brass and card, in the drawings and the models; the warp and the weft in the colours the learner sets |

- **A part's state is shown in its own material:** brighter when it acts (a hook caught on the knife, a lifted warp end, the card pressed), dimmer at rest. No hue is spent on it, so the meanings above stay free; the prototype's red for a lifted hook goes.
- **The 2D drawings sit on the same dark stage as the 3D view,** with no paper sheet behind them: their lines and fills are retuned for dark, the cards the lightest material. The one exception is the picture tool's grid, which is point paper (light squares, dark ink), as the designers who drew for the cards used.
- **The 3D overlays are the instrument's:** the ghosted machine is a light grey and the bands where the machine repeats a unit a pale blue; the machine's own materials (oak, iron, steel, brass, card) come from the models.
- **Every colour of every view is a token** (CSS custom properties for the page and the SVG drawings; the canvas views and three.js read the same tokens), so the theme lives in one place.
- **Contrast:** text, the drawings' labels included, reaches 7:1 on its background (WCAG AAA); the drawings' lines and the controls' outlines at least 3:1.
- **Type** is Roboto Flex with tabular figures for every number; CJK falls back to the system's fonts. **Icons** are Material Symbols as inline SVG. Both are vendored (`pnpm vendor`): the page needs no network but its own site.
- **Hover and press are visible** (a control lightens by 14% and 22%, the sibling's values).

## Also

- **The real machine first, our views second.** The cards, the head and the cloth are the primary surface; the trace, the 0/1 overlay, the ghosted 3D machine and the tutorial are instruments around it, and say so.
- **Simplifications are named where they are met,** with their reason: the estimated timing within a pick, stepping back unweaving exactly, the drawn shapes of the hooks and the cylinder's swing.
- **Historical material is real** and cited, and the research's list of myths is respected (no "patented 1801", no "24,000 cards" for the woven portrait).
- **The top bar:** what you do to the machine on the left, what you do with the app (share, language, about) on the right.
- **About** is the app's one dialog: the version, what the simulator is, the credits, the licences and the source.
- **The machine sounds; the interface does not** (the sibling's U29), with a mute switch at the end of the transport.
- **Accessibility:** every icon button has a tooltip and a screen-reader name, both translated; every control is reachable with Tab and has a visible focus ring; tabs and the panels' edges follow the WAI-ARIA patterns; motion honours `prefers-reduced-motion`.
- **Chrome is not selectable;** what is read (the tutorial's text, About, the status line) is, so a teacher can copy it (the sibling's U28).
