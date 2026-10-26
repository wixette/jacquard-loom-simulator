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
| **Learn** (the tutorial) | The guide: the step card (text, picture, task line, Back and Next) on top; below it, the panel the step needs (the chain and the bench card, the picture editor, a game's panel), with the step card shrinking to its task line while that panel is in use | The view the step asks for, chosen by the step | The cloth | Transport (a step greys what it does not use, P6) |
| **Weave** (free play; the default) | The chain of cards; the selected card on the bench, opening above the chain | Section by default; any view, or two side by side | The cloth; the inspector (the followed thread) as a second tab | Transport and timeline |
| **Create** (the picture tool) | The picture editor (grid, presets, open an image, direct or damask) | The cloth preview, large, with the loose threads marked; the machine one tab away | The cards it makes (read-only chain), then "Weave it" | Transport |
| **Play** (the mini games) | The game's panel (its input and score) | The game's main view: the cloth for the name game, the cloth and three choices for Guess the cloth, the draw boy against the cards side by side | The machine, small (picture in picture) | Transport, where the game uses it |

The app opens on **Weave**, already weaving a pretty pattern, with a small banner the first time: "New here? Take the tour" (which opens Learn); after that it opens where the learner left it. A link can open any workspace and step: `?w=learn&step=weave-twill`, `?w=play&game=name&text=Ada`. Steps are named, not numbered, so a link survives a step added before it.

**Learn is a mode,** as the sibling's lessons are (its U2 and U27): while it is on, the Learn tab carries the part and step ("Weave · 3/9"), the stage has a thin blue frame, and the controls a step does not use are greyed with the reason, which says the way out ("…to use it freely, go to Weave"). Leaving Learn keeps the place; coming back resumes it.

## 4. Desktop layout (1024 px wide and up)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ◎ Jacquard loom [Learn][Weave][Create][Play] Following hook 13 × ⚙ Loom ⤴ Share  文A ⓘ │  top bar, 56 px
├──────────────┬───────────────────────────────────────────────────────┬─────────────────┤
│ PROGRAM      │ [Section▾][Side][Front][3D▾]   ▣ single ◫ two ⊞ four   │ OUTPUT          │
│              │                                                       │ [Cloth][Inspect]│
│ the card on  │                                                       │                 │
│ the bench    │                  THE STAGE                            │  the woven      │
│ (selected)   │          (the machine view(s): 2D or 3D)              │  cloth          │
│ ──────────   │                                                       │                 │
│ the chain    │                                                       │  front/back 0/1 │
│ card 1 ●○●○  │                                                       │                 │
│ card 2 ○●○●  │                                                       │                 │
│ …  (scrolls) │                                                       │                 │
│ + ⧉ ✕ ↑ ↓ ⇄ │                                                       │                 │
├──────────────┴───────────────────────────────────────────────────────┴─────────────────┤
│ ◂  ▶  ▸   speed ─○──   ● hooks taken ● shed open ○ shuttle ○ beaten ○ closed ○ next 🔊 │  transport, 56 px
│ [card 1][card 2][card 3]▌[card 4] … the chain as a timeline, the playhead on the card │  timeline, 40 px
│ Step: shed open — hooks 4 and 5 have lifted their warp ends.                           │  status line
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Sizes.** Left 300–360 px, right 320–400 px, both resizable by dragging their edge or by the keyboard (the edge is a focusable window splitter, as the sibling's U17), and collapsible to a thin rail (a click brings them back, and dragging well past the smallest size collapses it); the stage takes the rest. Sizes are remembered per device (browser storage), and every view redraws to its new size.
- **The stage.** One view by default. The toolbar above it switches the view (`Section ▾` holds Whole, Needles, Crooks and the cross-row; `3D ▾` holds the whole loom and U1–U5) and the arrangement: single, two side by side (any two: the section with the 3D selector is the classic pair), or four (CAD's quad view: section, front, side, 3D). A double-click on any view makes it fill the stage; again to go back.
- **The bottom band** holds time. The transport (step back, play, step, speed) sits at the left, large; the six moments of a pick are its timeline; the machine's sound switch ends it. Below, the chain runs as a strip of cards with a playhead (a step sequencer): click a card to go to it, drag the playhead to scrub through a pick. In the first version the strip mirrors the chain on the left rather than replacing it. The status line explains every step and holds the warnings ("The chain has run out…"). The band, not a toolbar floating on the stage (the sibling's U18), because the loom's time has a timeline the width of the window, and the stage may hold up to four views.
- **The top bar** holds the logo and title, the workspaces (Learn carrying the tutorial's step while it is on), the followed thread (a chip, × to stop following), the loom's setup (a popover: head size, tie-up, colours), Share (copy link, save picture, print cards), the language menu (文A) and About (ⓘ, the app's one dialog: version, credits, licences, the source). What acts on the machine is on the left, what acts on the app on the right.
- **Medium screens (1024–1279 px):** the left panel starts collapsed to its rail when the stage would fall under 560 px wide; the inspector shares the right panel by tab, as above.

## 5. Phone and tablet layout

The bar is lower, as agreed: everything must be operable, not everything at once.

### Phone, portrait (up to about 600 px wide)

```
┌───────────────────────────┐
│ ☰  Weave ▾        ⤴  ⚙   │  app bar: menu, workspace, share, setup
├───────────────────────────┤
│ [Section][Front][Side][3D]│  view chips (scroll sideways)
│                           │
│        THE STAGE          │  about 45 % of the height; pinch to zoom,
│   (one view at a time)    │  tap a part to follow it
│                           │
├───────────────────────────┤
│  ◂    ▶    ▸    ● ● ○ ○ ○ │  transport, sticky: always under the stage
│ Shed open: hooks 4 and 5… │  status line: one line, tap to read all
├═══════════════════════════┤
│ ─── (drag)                │  bottom sheet: peek / half / full
│ [Cards][Cloth][Guide]     │  tabs: the program, the output, the workspace's own
│                           │
│  the selected tab's panel │
└───────────────────────────┘
```

- **The app bar** keeps the logo (in ☰), the workspace (with the tutorial's step while it is on), Share and setup; the menu ☰ holds the language and About.
- **The stage on top, one view at a time,** switched by chips. 3D starts at its lighter quality, one unit at a time; the whole loom is offered but not the default.
- **The transport is sticky,** directly under the stage, with 48 px targets: the learner's thumb drives the machine while watching it.
- **The bottom sheet** holds the rest, by tab: **Cards** (the chain, with the bench card), **Cloth**, and the workspace's own (**Guide** in Learn, **Picture** in Create, **Game** in Play). It rests half open; dragging it up gives the panel the screen, dragging it down gives the stage the screen.
- **Editing cards on a phone** happens on the bench card, zoomed to finger size, not on the chain's small strips (at 64 hooks a hole in the chain is a few pixels wide). The chain is for choosing a card and seeing the order.
- **Tutorial pointers** stay small and point at things on screen; the step's text lives in the Guide tab, half open by default in Learn.

### Phone, landscape, and small tablets

The stage takes the left 60 %, the sheet becomes a side panel on the right with the same tabs, and the transport runs along the stage's bottom edge.

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

- Whether the chain-as-timeline (§4, bottom band) should later replace the chain list on the left. The first version mirrors it.
- Whether the four-view arrangement is worth it below 1440 px wide.
- How the tutorial points at things inside a view (a hook in the section, a part in 3D): the views would need to expose where their parts are on screen (the label placer knows already, for 2D; the sibling's callouts name 3D nodes). Settled in M7.
- How much of the 3D view the Play workspace needs: Draw boy against Jacquard probably wants the harness in 3D; the others do not.

## 8. Order of work

The store and the components come first (M5), under the developer pages, which keep working and catch regressions; the shell is built on them (M6). The milestones and releases are in [public-app.md](public-app.md) §4.
