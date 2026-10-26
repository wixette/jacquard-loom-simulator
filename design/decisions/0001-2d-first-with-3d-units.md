# 0001: A 2D machine first, with one 3D model per core unit and a ghosted whole-machine view

- **Status:** accepted, 2026-10-25 (the maintainer's decision, after the research report)
- **Context:** research [REPORT.md](../../research/REPORT.md) §1, §5, §9; plan [simulator-plan.md](../simulator-plan.md)

## Decision

1. **The 2D machine is the primary surface.** Students operate the loom in 2D: they punch cards, step or play the pick cycle in a side section of the head, and watch the cloth grow. Everything the minimal lesson set needs is in 2D.
2. **3D shows each core unit once, never repeated.** One needle with its spring and hook on one knife; the card cylinder with its catches and hammer; the griffe and its lift; one harness line from neck cord to lingo; the shed, shuttle and batten. Each is modelled at its documented size (Posselt's head, research §2), driven by the same simulation as the 2D view, and explains the mechanical principle it embodies.
3. **A whole-machine 3D view gives the context:** a low-poly, translucent shell of the loom and head with the concrete units inside at their true positions. Where the real machine repeats a unit hundreds of times, the shell shows a labelled translucent band ("×400 like this"), not copies.
4. **No full instanced 200- or 400-hook head.** The report's "zoom out to the real head" (target B as a 3D view) is dropped. Target B's *geometry* is kept: every unit is drawn at real size.
5. **No outreach to the LIRIS / Musée des Soieries Bonnet project** (report §9, maintainer action 1). Its purpose is similar but different, so the two can proceed independently.

## Why

- **2D teaches the core idea best and costs least** (report §5). In 3D, hundreds of overlapping hooks hide the selection; a section through one cross-row shows it at a glance.
- **3D still earns a place,** for what a section cannot show: how a hook's crook sits on a knife and is pushed off it, how the needle's eye loops round the hook, how a square cylinder is turned a quarter turn by a catch on its lantern and squared by a hammer, how a card sits on its pegs. Seen once, a unit explains every copy of it.
- **The unit approach removes the report's main technical risks:** no instancing, no Chromebook performance question, no conflict with the project's conventions (a named node per moving part, one scalar each, acceptance ray casts on the `.glb`). The whole 3D content stays well under 50 k triangles.
- **The ghosted view keeps the scale honest.** Without it, students would see a few parts floating in space and could not tell that one card drives hundreds of hooks across a loom three metres high.

## Rejected

- **A full 3D head and loom as the main surface** (report target B). Costly (instancing, levels of detail, measured frame rates), and less legible than 2D for the main lesson.
- **2D only.** Loses the shapes and the mechanical principles above, which are a large part of why the machine is in a computing-history course: mechanical amplification, indexing, cam timing.
- **A reduced 24-hook head in 3D** (report target A in 3D). Still repeated parts, without the full head's truthfulness; the 2D machine already covers its teaching role.

## Consequences

- The plan is 2D-first: a usable 2D learner page (cards, cycle, cloth, bitmap helper, lessons) comes before any 3D (plan §9).
- The 2D and 3D views are both pure reflections of one simulation (`js/sim/`), so they can never disagree. A "followed hook" chosen in either view is the one shown in both.
- 2D gets its own acceptance layer: the section is drawn from a pure layout function that the Node tests check, as the `.glb` is checked for 3D (plan §8).
- The report's §9 actions about a Chromebook `?perf` page and the instanced head no longer apply. The measuring session (maintainer action 2) still upgrades the units' estimated values.
