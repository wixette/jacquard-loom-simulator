# M6 notes: the shell and Weave

- **Status:** built 2026-10-27, on the branch `m6-shell`; every check passes. The second milestone of release 0.1.0 ([public-app.md](public-app.md) §4). The spec below passes on the app with `?selftest` (S-1 to S-9) and in `pnpm test` (S-10); `pnpm selftest` runs the app's checks with every developer page's (S-11).
- **Page:** [`index.html`](../index.html), the main app, replacing M5's placeholder: the Weave workspace, and Learn's frame with a sample step (the tutorial itself is M7).
- **Reviewed on the way (2026-10-27):** the layout at five sizes (laptop, desktop with two and four views, tablet, phone upright and on its side), then a second pass on the controls; the changes from [ui-layout.md](ui-layout.md)'s first draft are recorded there (§4, §5).

## What M6 builds

| Part | Where | What it is |
|---|---|---|
| The frame | `js/app/shell.js`, `css/app.css` | The top bar (the workspaces, Share, the language, About); the cards on the left, the stage in the middle with time under it, the cloth on the right; on a phone, the stage, time under it, and a sheet with the rest. Rebuilt when the screen's kind or the workspace changes; relabelled when the language does |
| The stage | `js/app/shell.js` | One, two or four views, each named by its own chip; the section's zoom and cross-row beside it; a 3D view's ⓘ with its unit's idea; the arrangement at the top right; the thread followed at the bottom left. Two views where the stage holds them (1040 px and up) |
| Time | `js/app/components/panels.js`, `css/components.css` | The caption (the status line), the six moments as a stepper, and the controls: reset, step back, play (the largest), step; where the loom is; the speed (6 to 60 picks a minute, 12 to start) and the sound switch |
| The machine's settings | `js/app/shell.js`, `js/view2d/chainEditor.js` | The head and tie-up as a chip over the cards, showing their values; the colours as a palette over the cloth; the chain's end as a switch that laces it into a loop or opens it, beside the cards' loop button |
| The panels' edges | `js/ui/edge.js` | Window splitters, as the sibling's dock edge: drag or arrow keys to resize, past the end or Enter to close to a rail; remembered on the device |
| The keyboard | `js/app/keys.js` | Space, ← →, 1–4, F, Esc, never while a field that takes keys has the focus |
| The sounds | `js/app/sound.js`, `audio/`, `tools/sounds.mjs` | One sound for each moment of a pick, played going forward; placeholders until the recorded ones take their names |
| About | `js/app/about.js` | The app's one dialog, as the sibling's |
| The 3D parts' names | `js/scene/partNames.js` | A message key for each named part of the models, made from its node's name; the units' titles and ideas as message keys |
| The app's links | `js/app/links.js` | What the app shows, as a link (Share), and the app opened from one |
| The phone's sheet | `js/app/shell.js` | Its grab: dragged up or down, or tapped, it moves between peek, half and full |

## Decisions

1. **Time sits under the stage, not along the window's bottom.** The core controls are centred under what they move, and the panels run the full height. The first draft's full-width band put them in the window's corner, and its moments looked like buttons; the chain-as-timeline strip it held is left out of 0.1.0, as the chain and the stepper already show where the loom is.
2. **The moments are a stepper, a state, not buttons:** dots on a track, no fill, border or hover on their names, `aria-current="step"` on the moment reached. On a phone they are dots only: the caption above names the moment.
3. **Play is the largest control; reset is as large as the steps,** and leads the cluster, as stop does on a player.
4. **Every setting sits beside what it changes.** The top bar holds only the app's own; the head and tie-up are over the cards (a card has a hole for each hook), the colours over the cloth, the loop at the chain's end as well as in the cards' toolbar.
5. **A panel's watchers live as long as its panes.** The stage's panes are made anew when the views change; the components and the frame's watchers made with them go with them.
6. **The 3D models keep their English names;** the page names a part by a key made from its node's name (numbers dropped, a side dropped where both sides share a name), and a test checks every named part's English against its key's. Rebuilding the models with new names fails that test until the messages follow.
7. **Sound observes the loom, not the buttons:** each moment passed going forward sounds, however it was passed (stepped, played, a key); going back and jumps (a reset, a link, a tutorial step) are silent. Above 30 picks a minute only the batten sounds.
8. **The checks see the phone in a frame:** S-1 loads the app in iframes of a phone's, a tablet's and a desktop's sizes, since a page in a frame takes the frame's size as its window.

## Acceptance spec

| ID | Statement | Kind |
|---|---|---|
| S-1 | At a laptop's and a desktop's size, a tablet's, and a phone's upright and on its side, the frame has its parts, and the page neither scrolls nor reaches past the window's right edge. | page |
| S-2 | The top bar holds only the app's own controls (the workspaces, Share, the language, About); the chip over the cards shows the head and changes it; the palette over the cloth changes its colours; the chain's end laces and opens the chain, in step with the cards' loop button. | page |
| S-3 | The transport's buttons act; play is the largest, reset as large as the steps; the six moments are a stepper with no control in it, the moment reached its current step. | page |
| S-4 | Space plays and pauses, ← and → step, 1–4 choose the first view, F follows the part under the pointer and Esc stops; a field that takes keys keeps them. | page |
| S-5 | A panel's edge resizes it by the keyboard within its limits, closes it to a rail and opens it again; its size is remembered; a double-click gives the default back. | page |
| S-6 | Every view fills its pane, alone, two side by side and four; taking a 3D view away leaves no canvas behind. | page |
| S-7 | The link the app writes opens the same loom (cards, pick and moment, the thread followed), views and colours again; a link's language is taken. | page |
| S-8 | In every language nothing in the app is left in English: its texts, its names for screen readers, its tooltips. | page |
| S-9 | Each moment passed going forward sounds its own sound, once; going back, a reset and a link opened are silent; running out of cards sounds the refusal. | page |
| S-10 | Every part the 3D models name has a message key whose English is the model's own name; every unit's title and idea is a message. | logic |
| S-11 | The prototypes still work: every developer page's `?selftest` passes (`pnpm selftest`). | page |

### Results (2026-10-27)

| ID | Result |
|---|---|
| S-1 | 5 sizes: 1366 × 768 and 1920 × 1080 desktops, an 820 × 1180 tablet, a 390 × 844 phone and the same on its side: every part there, no scrolling, nothing past the right edge |
| S-2 | The top bar's controls: Share, the language, About; the head 16 → 32 → 16 from its chip; the warp from the palette; the chain laced and opened from its end, the loop button agreeing |
| S-3 | Play 3,136 px², reset and the steps 1,936 px² each; six moments, no control among them; three steps mark the third moment |
| S-4 | Space, ←, →, 1, 2, 3, F and Esc act; the speed slider keeps its arrows |
| S-5 | The cards panel: 320 → 336 → 260 px by the keyboard, remembered; closed to its rail and opened; 320 px again on a double-click |
| S-6 | 12 arrangements, 17 views, each filling its pane; no canvas left behind |
| S-7 | A twill at pick 2, at its third moment, hook 4 followed, a warp colour, the section and U2: a 70-character link opens it all again; `lang=fr` taken |
| S-8 | 9 languages × 344 keys: no English left in the frame's texts, names and tooltips |
| S-9 | A pick sounds lift, turn, shuttle, beat, fall, press; back, a reset and a link are silent; running out of cards sounds the refusal |
| S-10 | 6 models, 60 part names (87 named parts): every one's English is its key's; the 5 units' titles and ideas are messages |
| S-11 | `pnpm selftest`: all 8 pages pass (the app's 9 checks, the developer pages' 120) |
