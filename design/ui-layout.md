# The public app's layout: an initial plan

- **Status:** first plan, 2026-10-26, for the public app ([public-app.md](public-app.md)); revised 2026-10-27 to take in the sibling project's patterns (the [Stepped Reckoner](https://github.com/wixette/leibniz-stepped-reckoner): its dark theme, languages, components, mode in the top bar, resizable panels and sound) and the tutorial as a mode over the workspaces. It settles where things go and how they rearrange on smaller screens; the principles behind it, the theme and the components are in [docs/ui-design.md](../docs/ui-design.md), and the detailed design of each part is done in its milestone (public-app.md §4).
- **The problem:** the simulator has many views and panels: three 2D drawings, six 3D views, the loom's setup, the card chain and the bench card, the transport, the cloth and its controls, the picture tool, the games, the tutorial. The developer pages show most of them at once, which works for checking, not for learning. The public app must show the right few at a time, on a large desktop screen and on a phone.

## 1. What there is, sorted by role

Everything on screen plays one of six roles. The layout gives each role one home, so the learner always knows where to look.

| Role | Components | Question it answers |
|---|---|---|
| **A. The machine** (the stage) | 2D: the head in section (Whole, Needles, Crooks; a cross-row), the loom from the side, the loom from the front. 3D: the whole loom, and units U1–U5. | What is the machine doing now? |
| **B. The program** (input) | The deck (presets, new, open), the chain of cards, the card on the bench, the card tools (add, duplicate, delete, move, invert, loop). Also what *makes* a program: the picture tool, the games. | What is it told to do? |
| **C. The output** | The woven cloth (front or back, 0/1), and the cloth read back as text in the name game. | What has it made? |
| **D. Time** | Step back, play or pause, step, speed, reset; the six moments of a pick; where it is (pick, card, rows); the status line that explains each step. | When are we, and what just happened? |
| **E. Attention** | The followed thread (a hook, a card, a cell of the cloth, highlighted across every view); the tutorial's pointers; hover names. | What am I looking at? |
| **F. Setup and sharing** | Head size (hooks), tie-up, warp and weft colours; copy link, save picture, print cards; about; language. | How is the loom set up, and how do I keep or share it? |

Two consequences shape the plan:

- **Causality reads left to right: program, machine, output.** Cards go in on the left, the mechanism works in the middle, the cloth comes out on the right. On a phone the same order runs top to bottom (machine on top, because it is the thing to watch).
- **Setup changes rarely,** so it leaves the main screen (a popover from the top bar), and the cloth's toolbar keeps only what is used while weaving (front/back, 0/1).

## 2. Principles, borrowed from tools that handle many views well

| From | What we borrow |
|---|---|
| **Blender** | *Workspaces*: one set of components, arranged differently for different tasks (Layout, Modeling, Animation…), switched by tabs at the top, never losing state. Each area's *editor type* can be switched in place. |
| **Unity, Godot** | The *viewport* in the middle; the *hierarchy* on one side (for us, the chain of cards), the *inspector* on the other (the selected card, hook or thread); the *timeline and console* along the bottom. Selection is shared: pick something in one view and every view shows it. |
| **CAD (quad view)** | Four synchronized views of one object: top, front, side, perspective. Ours are exactly that: the head in section, the loom from the front, from the side, and 3D. |
| **Audio workstations** | The *transport bar* (play, step, speed) and a *step sequencer*. A card chain *is* a step sequencer: one column of holes per step, a playhead moving along it. |
| **PhET simulations** | Built for learners: a big play area, few controls, large time controls at the bottom centre, "simple first, more on request". |
| **Google Maps (phone)** | A *bottom sheet* over a full-width map: peek, half, full; tabs inside it. The map stays visible. |

From these, six rules:

1. **One stage, always visible.** The machine (role A) is the largest area on every screen size, and is never covered by a panel (only by the tutorial's small pointers).
2. **Every role has one home.** Program on the left, output on the right, time at the bottom, attention in the top bar (the followed thread as a chip) and in the inspector. No control appears in two places (plan §6).
3. **Workspaces, not more panels.** Learn, Weave, Create and Play arrange the same components for their task (§3). Switching keeps each workspace's state. **The learner's own loom is changed only by the learner:** Weave works on it, Create's "Weave it" puts the picture's cards on it, and a game or a tutorial step can offer "Open in Weave". The tutorial and each game run on a loom of their own, so a step that sets up its deck never throws away the learner's cards, and the learner's cards never break a step.
4. **Selection is shared.** Following a thread is a first-class state, shown as a chip in the top bar ("Following hook 13 ×") and highlighted in every view (the 2D and 3D views already share it).
5. **Simple first, everything on request.** Each workspace opens with few controls. A "More controls" switch shows the expert ones (cross-row, tie-up, 0/1, back face, speed, quality).
6. **The same components on every screen.** A phone does not get a different app, it gets the same components in different slots (§5). Each component must fit any slot: draw to its size (the views already do), scroll inside itself, never assume a width.

## 3. Workspaces

Four workspaces, as tabs in the top bar. The home slots stay the same; what changes is which component fills them and how large they are.

| Workspace | Left (program) | Centre (stage) | Right (output, inspector) | Bottom (time) |
|---|---|---|---|---|
| **Learn** (the tutorial) | The guide: the step card (text, picture, task line) on top, Back and Next right under it; below them, the panel the step needs (the chain and the bench card, the picture editor, a game's panel), with all the height left. A step longer than its room scrolls, keeping Back and Next at its foot | The view the step asks for, chosen by the step | The cloth | Transport (a step greys what it does not use, P6) |
| **Weave** (free play; the default) | The chain of cards; the selected card on the bench, opening above the chain | Section by default; any view, or two side by side | The cloth; the inspector (the followed thread) as a second tab | Transport and timeline |
| **Create** (the picture tool) | The picture editor (grid, presets, open an image, direct or damask) | The cloth preview, large, with the loose threads marked; the machine one tab away | The cards it makes (read-only chain), then "Weave it" | Transport |
| **Play** (the mini games) | The game's panel (its input and score) | The game's main view: the cloth for the name game, the cloth and three choices for Guess the cloth, the draw boy against the cards side by side | The machine, small (picture in picture) | Transport, where the game uses it |

A newcomer's app opens on **Learn**, at the tutorial's first step, with the whole loom in 3D: an overall picture of the machine first. After that it opens on the workspace last used on the device (kept in the browser's local storage, so it lasts beyond a session): a learner who went on to Weave opens in Weave with its 2D section, one who went back to finish the tutorial opens in Learn at their step. A link decides for itself, and a link that cannot be read opens Weave, whose status line says why. (Revised after M7's review, 2026-10-27; the first plan opened on Weave with a "Take the tour" banner.) A link can open any workspace and step: `?w=learn&step=weave-twill`, `?w=play&game=name&text=Ada`. Steps are named, not numbered, so a link survives a step added before it.

**Learn is a mode,** as the sibling's lessons are (its U2 and U27): while it is on, the Learn tab carries the part and step ("Part 3 · 2/8": a part's name beside the Weave tab would read as that tab's), the stage has a thin blue frame, and the controls a step does not use (those that change the cards or the loom; the transport, the views and following stay free) are greyed, and pressed say the reason, which says the way out ("…to use everything freely, go to Weave"). Leaving Learn keeps the place, and gives Weave's loom and views back; coming back resumes it, with the step's loom as it starts.

## 4. Desktop layout (1024 px wide and up)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ◎ Jacquard loom  [Learn][Weave]                                    ⤴ Share   文A   ⓘ    │
├──────────────┬───────────────────────────────────────────────────────┬─────────────────┤
│ CARDS ▤+⧉✕↑↓◑│ [Section▾] Whole Needles Crooks [Cross-row▾]   ▣ ◫ ⊞  │ CLOTH Front|Back│
│ ⚙ 16 hooks · │                                                       │ 0/1  ◍ colours  │
│   straight ▾ │                                                       │                 │
│ the card on  │                                                       │  the woven      │
│ the bench    │                    THE STAGE                          │  cloth          │
│ ──────────   │       (one, two or four views: 2D or 3D)              │                 │
│ the chain    │                                                       │                 │
│ card 1 ●○●○  │                                                       │ ───────────     │
│ card 2 ○●○●  │ [Following hook 13 ×]                                 │ the thread      │
│ …  (scrolls) │───────────────────────────────────────────────────────│ followed,       │
│              │ Step: shed open — hooks 4 and 5 have lifted their     │ in words        │
│              │ warp ends.                                 caption    │                 │
├──────────────┴───────────────────────────────────────────────────────┴─────────────────┤
│                     ●━━━━◉────○────○────○────○        moments (stepper)                 │
│ Pick 5 (card 5) · 2 rows       ↺  |◂  (▶)  ▸|                      speed ─○──  ♪        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Sizes.** Left 300–360 px, right 320–400 px, both resizable by dragging their edge or by the keyboard (the edge is a focusable window splitter, as the sibling's U17), and collapsible to a thin rail (a click brings them back, and dragging well past the smallest size collapses it); the stage takes the rest. Sizes are remembered per device (browser storage), and every view redraws to its new size.
- **The stage.** One view, or two side by side where the stage is at least 1040 px wide (section and 3D, from about 1700 px of window). That choice is made once, when Weave opens: resizing the window never rearranges the views under the learner's hands. Each view names itself with a menu chip in its own top-left corner (`Section ▾`, `3D · Whole loom ▾`), its own tools beside it (the section's zoom and cross-row); the arrangement, single, two side by side or four, floats at the stage's top right.
- **The view menu is one flat list in two groups,** *2D drawings* (the head in section, the loom from the side, the loom from the front) and *3D models* (the whole loom, the selector, the card cylinder, the griffe and lift, the harness line, the shed and batten). The rule: an item is a different subject; a closer look at the same subject is a tool inside its view. So the five units are items (each shows its own mechanism, with its own idea card), while Whole, Needles and Crooks stay in the section, as its zoom (marked with a magnifier). The units have no codes on screen: "U1" means nothing to a learner (the codes stay in the design notes and the links, `u1` to `u5`). A 3D model's chip reads "3D · Selector", so the group always shows.
- **No view twice, and one 3D model in four.** A view already on show is marked in the menu with where it is ("shown top right"); choosing it swaps the two panes. In the four-view grid, a 3D model takes the place of the other one (each 3D view costs the graphics card a great deal). Going to two or four views keeps the views on show and fills the rest from the defaults: two, the section beside the whole loom in 3D; four, that pair on top, the front and the side below. Learn sets the views itself, so a learner is never asked to arrange them. (Rules in `js/app/arrange.js`. Fixing each pane to a kind of view, 2D on the left and 3D on the right, was weighed and left: a teacher may want the section beside the front view, and a menu that refuses choices without saying why is worse than one that swaps.) The followed thread is a chip at the stage's bottom left (× to stop following), next to what it highlights. A double-click on any view makes it fill the stage; again to go back.
- **Time:** the caption sits under the stage it explains; the player (the moments and the controls) runs along the window's whole bottom, under the cards and the cloth too, since all three move with it: the current card in the chain, the machine, the rows of the cloth. A control's container shows what it drives; inside the centre column the player looked as though it ran the stage alone, and the window's bottom ended three ways (an empty panel, three bands, a hint). From the top:
  - the **caption**, the status line: what the loom just did, or why it refused, in two lines at most (the full text in its tooltip), right under the drawing it explains, at a width a sentence reads well at (across a 1920 px window it would run to some 200 characters);
  - the **player**, the full width, its two rows one group centred on the window (not on the stage, so it does not move when a panel is resized or closed):
    - the **six moments of a pick as a stepper**, a state and not buttons: dots on a track, the moments passed filled, the one reached ringed and named in bold, no fill or border on the names (`aria-current="step"`); stacked over the controls, as stepping moves along the dots;
    - the **controls**: reset (as large as the steps, and leading them, as stop does on a player), step back, play (the largest, 56 px, filled), step; where the loom is (pick, card, rows) at the window's left; the speed (6 to 60 picks a minute, 12 to start) and the sound switch at its right.
  - No chain-as-timeline strip: the chain on the left and the stepper already show where the loom is. (The first draft had a full-width band with the strip and the moments as buttons, with the controls at its left, in the window's corner; the second put time under the stage, inside the centre column; this third keeps the second's stepper and controls, centred in a band across the window.)
- **A floating player** over the stage, as the sibling's, was weighed and left: the sibling's stage is one canvas, the thing its bar drives; here the bar would cover the section's lingoes and straddle two views, and read again as the stage's alone. On a phone it could not float at all.
- **The top bar** holds what belongs to the app, not to the machine: the logo and title, the workspaces (Learn carrying the tutorial's step while it is on), Share (copy link, save picture, print cards), the language menu (文A) and About (ⓘ, the app's one dialog: version, credits, licences, the source).
- **The machine's settings sit with what they change.** The head and its tie-up are a chip over the cards that shows their values (`⚙ 16 hooks (2 cross-rows) · Straight tie ▾`, a popover to change them), since a card has a hole for each hook; the warp and weft colours are a button in the Cloth panel's header that shows the two colours themselves, warp in front of weft, as a paint program shows its two colours, next to Front/Back and 0/1. It opens a panel: the two threads, each a row with its swatch, name, what it is and hex value, one of them chosen for the picker below; a swap button between them; the page's own picker (a square for saturation and brightness, a hue slider, a hex field), not the browser's, whose popup the page cannot keep inside its own (on a Mac it is the system's Colors window, which a click beside it does not close); six ready-made pairs of the period's dyes (the one in use marked); Reset; and by its title a small piece of twill in the two colours, which shows each change while the panel covers the cloth. The panel hangs from its button, as every popover does (opening it beside the cloth instead, to keep the cloth in view, was tried and left: a panel 300 px from its button reads as a mistake).
- **The popovers** (the head and tie-up, the colours) behave as non-modal popovers do: one at a time; their button, a press elsewhere and Esc shut them; they hang from their button (from its left edge, or its right edge on the window's right half, as the menus do) and follow it when the window is resized or the page scrolls, kept inside the window (under the button if it fits, else over it); and they shut if their button goes, as when the frame is rebuilt for a phone. Menus shut on a resize instead, as menus do. The chain's loop is in the cards' toolbar and, where the chain ends, a switch that says it ("End of the chain: open", "Laced back to card 1: a closed loop"), so what the chain does at its end can be changed where it is read.
- **Medium screens (1024–1279 px):** the left panel starts collapsed to its rail when the stage would fall under 560 px wide; the inspector shares the right panel by tab, as above.

## 5. Phone and tablet layout

The bar is lower, as agreed: everything must be operable, not everything at once.

### Phone, portrait (up to about 600 px wide)

```
┌───────────────────────────┐
│ ☰  Weave ▾        ⤴      │  app bar: menu, workspace, share
├───────────────────────────┤
│ [Section][Front][Side][3D]│  view chips (scroll sideways)
│                           │
│        THE STAGE          │  about 45 % of the height; pinch to zoom,
│   (one view at a time)    │  tap a part to follow it
│                           │
├───────────────────────────┤
│ Shed open: hooks 4 and 5… │  caption: two lines, tap to read all
│ ●━━◉──○──○──○──○          │  the moments, dots only (the caption names it)
│ ↺ |◂ (▶) ▸|   Pick 5 …   │  controls, sticky: always under the stage
├═══════════════════════════┤
│ ─── (drag)                │  bottom sheet: peek / half / full
│ [Cards][Cloth][Guide]     │  tabs: the program, the output, the workspace's own
│                           │
│  the selected tab's panel │
└───────────────────────────┘
```

- **The app bar** keeps the logo (in ☰), the workspace (with the tutorial's step while it is on), and Share; the menu ☰ holds the language and About. The head and tie-up chip sits over the cards in the Cards tab, the colours in the Cloth tab's header, as on the desktop.
- **The stage on top, one view at a time,** switched by chips. 3D starts at its lighter quality, one unit at a time; the whole loom is offered but not the default.
- **Time is sticky,** directly under the stage (caption, moments, controls, the play button 50 px and the others 42 px): the learner's thumb drives the machine while watching it.
- **The bottom sheet** holds the rest, by tab: **Cards** (the chain, with the bench card), **Cloth**, and the workspace's own (**Guide** in Learn, **Picture** in Create, **Game** in Play). It rests half open; dragging it up gives the panel the screen, dragging it down gives the stage the screen.
- **Editing cards on a phone** happens on the bench card, zoomed to finger size, not on the chain's small strips (at 64 hooks a hole in the chain is a few pixels wide). The chain is for choosing a card and seeing the order.
- **Tutorial pointers** stay small and point at things on screen; the step's text lives in the Guide tab, half open by default in Learn.

### Phone, landscape, and small tablets

The stage takes the left 60 %, the sheet becomes a side panel on the right with the same tabs, and the moments and the controls run along the stage's bottom edge (no caption: the sheet's tabs show the trace).

### Tablet, portrait

As the phone, with room for two tabs side by side in the sheet (Cards and Cloth) and the stage at 55 % of the height.

## 6. How the code needs to change to get there

The developer pages wire their elements by id (`createLoomPage`); the public app needs the components to be placeable.

1. **One state, many views.** A store holds the looms (the learner's, the tutorial's, a game's: each its deck, tie, pick and moment, §2 rule 3), the followed thread, the workspace, the tutorial's place and the layout; components subscribe and redraw when what they show changes. `createLoomPage`'s `draw()` already does this by hand; the store makes it explicit.
2. **Components with a common shape.** Each view or panel is `mount(host)`, `update(state)`, `unmount()`, and draws to its host's size (the 2D views and the label placer already measure their host; the cloth already sizes to its width since the blink fix).
3. **A layout manager** places components into slots for the current workspace and screen size, and remembers the user's changes. The breakpoints are the screen's width and its orientation, not the device.
4. **The URL carries the state worth sharing:** workspace, view, step or game, and the loom's link (the public link format of `js/sim/link.js`).
5. **Keyboard on desktop:** Space play or pause, ← and → step, 1–4 the views, F follow what is under the pointer, Esc stop following. Keys act only while no text field has the focus; the 3D view, when it has the focus, takes the arrows, + and − and Home (the sibling's U24).
6. **Every text is a message key, every colour a token.** Texts come from `js/l10n/` (the sibling's ten languages); the views take their colours from the theme's tokens, not from literals (docs/ui-design.md, *Theme*), so the dark theme is one place.
7. **The shared components** (`js/ui/`: icons, menus, tabs, dialog, tooltips, the panel edge) come from the sibling project, so each kind of control is one component (P10).

## 7. Open questions for the detailed design

- Whether a chain-as-timeline strip with a playhead (dropped from 0.1.0, §4) earns its height later, for scrubbing through long decks.
- Whether the four-view arrangement is worth it below 1440 px wide.
- How the tutorial points at things inside a 3D view. Settled for 2D in M7: a step names the parts of the section it points at, which glow amber with their labels (`data-glow`, design/m7-notes.md); a 3D step points by showing one unit alone (U1 to U5), and its words name the parts, which hover names. A glow on 3D parts (the sibling's callouts and highlights on named nodes) comes with the parts that need it, in part 4 or 5.
- How much of the 3D view the Play workspace needs: Draw boy against Jacquard probably wants the harness in 3D; the others do not.

## 8. Order of work

The store and the components come first (M5), under the developer pages, which keep working and catch regressions; the shell is built on them (M6). The milestones and releases are in [public-app.md](public-app.md) §4.
