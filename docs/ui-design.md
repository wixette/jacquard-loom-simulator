# UI design principles

The principles the simulator's pages follow, taken from the [Altair 8800 Simulator](https://github.com/wixette/8800-simulator), which teachers and students use in real computer-science lessons. The public app's plan builds on them: what it contains in [design/public-app.md](../design/public-app.md), how its many views are laid out on desktop and phone in [design/ui-layout.md](../design/ui-layout.md).

If a change needs to break a principle, change the principle here first, with its reason.

## The principles

| # | Principle | In one line |
|---|---|---|
| P1 | One primary surface | The machine is always on screen; nothing covers it or pushes it out of view |
| P2 | A control has one home | If it is wanted elsewhere, move it; never a second copy |
| P3 | Tools in one dock, one at a time | Lessons, the picture tool and About share a dock the reader picks from |
| P4 | Occasional actions in menus and dialogs | Always-visible space is for things that change while you watch |
| P5 | Each surface keeps its voice | The machine's own parts keep their period names; the instruments around it are ours, and translated |
| P6 | Unavailable is greyed and explained, never hidden | A greyed control still answers, in the status line, with the reason |
| P7 | One status line, always visible | It says what just happened, and why something is greyed |
| P8 | A link is a public contract | A link that opens the simulator in a state ends up in worksheets nobody edits again: fields may be added, never renamed, dropped or read differently (`js/sim/link.js`, pinned by its test) |
| P9 | A phone gets the same app | Same regions, same order; nothing depends on hover or a precise drag |
| P10 | One component per kind of thing | Menu, dialog, icon button, empty state: each always used the same way |

## Also

- **The real machine first, our views second.** The cards, the head and the cloth are the primary surface; the trace, the 0/1 overlay, the ghosted 3D machine and the lessons are instruments around it, and say so.
- **Simplifications are named where they are met,** with their reason: the estimated timing within a pick, stepping back unweaving exactly, the drawn shapes of the hooks and the cylinder's swing.
- **Historical material is real** and cited, and the research's list of myths is respected (no "patented 1801", no "24,000 cards" for the woven portrait).
- **The toolbar:** what you do to the machine on the left, what you do with the app (share, language, about) on the right.
- **About** shows the version and the licences.
- **Accessibility:** every icon button has a tooltip and a screen-reader name; keyboard handling is specified.
