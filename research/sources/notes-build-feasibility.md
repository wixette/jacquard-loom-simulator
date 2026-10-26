# Notes: technical feasibility of a 3D and 2D simulator

**Area:** how to build a classroom-quality browser simulator of a Jacquard loom (three.js 3D and/or 2D) within the project's rules: no-build JavaScript with JSDoc, procedural Blender models from params, one scalar per moving part, under 300 k triangles and 15 MB of `.glb` for a school Chromebook, and acceptance tests on the `.glb` in Node. What is new here is that the machine has hundreds of near-identical parts (hooks, needles, springs, cords, mails, lingoes, warp ends) and flexible things (cords, warp, the card chain, the cloth).
**Searched and read:** 2026-10-25. Web searches covered the three.js docs and forum, WebGL multi-draw, glTF GPU instancing, yarn and woven-cloth rendering papers, AdaCAD and open weave tools, museum and open-source Jacquard models, and a Jacquard machine manual (Nelson, Project Gutenberg). AdaCAD's source was read through the GitHub API (`gh api`). Nothing was downloaded into the repository.
**Baselines** come from the Leibniz stepped reckoner simulator's design notes and git log (https://github.com/wixette/leibniz-stepped-reckoner):
- Leibniz M2: 110 objects, about 164 k triangles, 6.9 MB `.glb`.
- Leibniz M3 teaching page (`?perf` on an M1 Mac): 60 fps, 588 draw calls, 328 k triangles per frame, both counts including the shadow pass.
- Time: Leibniz research plus M0–M3 ran 2026-10-17 to 10-18.

**Labels used below:** *Cited* means the source says it. *Inference* means it is this note's own reasoning or a design estimate. The triangle counts per part are design estimates. No source gives them.

---

## 1. Rendering many repeated parts in three.js

### Takeaway
A full 400-hook head with about 1,600 warp ends fits the budget only if each part type is one `InstancedMesh`, the cords and warp are drawn as lines or very low-poly tubes, and the parts use low-poly shapes. That comes to roughly 30–80 draw calls and about 120–200 k triangles. `BatchedMesh` is not needed, and it has had performance problems. Thousands of instances per frame are well within what three.js handles. The real friction is the project's conventions: named nodes per part, and ray-cast acceptance tests in Node.

### Cited findings
- `InstancedMesh` is meant for "a large number of objects with the same geometry and material(s) but with different world transformations" and reduces draw calls. Each instance is set with `setMatrixAt` (and optionally `setColorAt`), after which `instanceMatrix.needsUpdate = true` must be set once per batch of updates. — [threejs-instancedmesh]
- The `InstancedMesh` bounding sphere is computed automatically for culling and ray casts. It "may need to recompute" after `setMatrixAt`. The bounding box is never computed automatically. — [threejs-instancedmesh]; the manual says the same in [threejs-howtoupdate]
- `BatchedMesh` renders many objects with one material but *different* geometries. Each instance gets `setMatrixAt`, `setColorAt` and `setVisibleAt`. It has `perObjectFrustumCulled` and `sortObjects`, both on by default, and needs capacities reserved up front (`maxInstanceCount`, `maxVertexCount`, `maxIndexCount`). — [threejs-batchedmesh]
- `BatchedMesh` falls back to "a less performant" path without `WEBGL_multi_draw`, and the fallback issues ordinary draw calls. — [threejs-batchedmesh-legacy], [threejs-pr28404]
- Reports of `BatchedMesh` being slower than a merged mesh:
  - One user saw about 20 fps against about 60 fps for a 12 M-triangle model with the same number of draw calls and higher CPU load. Turning off `sortObjects` and `perObjectFrustumCulled` helped but did not close the gap.
  - A second user found it still about 30 % slower with both turned off.
  - No root cause was established. The thread points to three.js issue #28776.

  — [forum-batched-perf]
- gkjohnson (forum, 2025-10-25) says `BatchedMesh` supports "per-geometry sorting, frustum culling, visibility toggling, and instancing", but that "there seems to be a performance bottleneck with multidraw in WebGL". — [forum-lod]
- The official `webgl_instancing_performance` example compares INSTANCED, MERGED and NAIVE rendering of one geometry. It defaults to 1,000 objects, its slider goes to 10,000, and the page shows that NAIVE costs one draw call per object. — [threejs-ex-instancing]
- Per-frame cost at very large counts: a forum reply put a 100 k-instance slowdown down to matrix composition every frame. A Babylon.js thread says per-instance world matrices start to hurt at "a few ten thousand" instances. — [forum-instanced-convert], [babylon-instances]. The Babylon figure is from another engine and is only an analogy.
- Draw-call guidance found was general advice, not Chromebook measurements:
  - "about 100 to 10,000" usable draw calls depending on the CPU and GPU — [forum-browsers]
  - under 100 recommended — [utsubo-tips]
  - integrated GPUs may struggle around 400 (Unity forum) — [unity-drawcalls]

  **No Chromebook-specific three.js benchmark was found.**
- glTF GPU instancing (`EXT_mesh_gpu_instancing`): `GLTFLoader` turns it into `InstancedMesh` automatically. Forum reports (2023–24) disagree on whether Blender's exporter writes it. A suggested route is "Make Instances Real" in Blender, then gltf-transform to create the instances, then `gltf-transform inspect` to check. There is also a reported bug where several instanced meshes in one file all get the first mesh. — [forum-blender-instancing], [forum-gpu-instancing-multi]
- `TubeGeometry` defaults are `tubularSegments = 64` and `radialSegments = 8`. It emits two triangles per segment × side, so a tube has 2 × tubular × radial triangles. — [threejs-tubegeometry-src]
- WebGL lines are drawn 1 px wide whatever `linewidth` is set to, on most platforms. Wide lines need the `Line2` / `LineMaterial` addon. — [threejs-linebasicmaterial], [threejs-ex-fatlines]. These two were not re-fetched in this session; this is long-standing three.js behaviour.

### Part counts for a 400-hook single-lift head (cited)
From Nelson's *Jacquard Machines* [nelson-gutenberg]:
- 400 hooks and 400 needles "in rows of eight", plus 16–26 extra hooks.
- A needle board of 416 holes in 52 rows of eight.
- 400 brass needle springs in a spring box.
- A griffe with eight blades (knives).
- A four-sided cylinder (prism), with brass card pegs near each end of each face.
- Each hook's coupling is a lingo (weighted wire), a hanger and a mail eye.
- "400 harness threads per maximum repeat".

A collector's page describes 400-hook cards as 8 holes across × 50 rows [computinghistory-cards]. A textbook chapter gives a card of about 6 × 40 cm and a four-sided wooden prism [inflibnet-jacquard]. The machine counts themselves come from a parallel research note, not this one.

### Triangle and draw-call estimate (inference, design figures)
Assumptions: full head, straight tie, 4 repeats, 1,600 warp ends. "Low" is the shape used when the camera is zoomed out to the whole machine. The didactic head is 24 hooks.

| Part type | Count (full head) | Triangles each (mid / low) | Full head, mid | Full head, low | 24-hook didactic head, mid |
|---|---|---|---|---|---|
| Hook (bent wire, swept: 6 sides × 16 / 4 × 8) | 400 | 192 / 64 | 76.8 k | 25.6 k | 4.6 k |
| Needle with eye loop (6 × 10 / 4 × 6) | 400 | 120 / 48 | 48.0 k | 19.2 k | 2.9 k |
| Needle spring (cylinder stand-in; a true helix is 10× more) | 400 | 24 / 12 | 9.6 k | 4.8 k | 0.6 k |
| Neck cord, hook to comber board (straight tube, 4 sides / line) | 400 | 8 / 0 | 3.2 k | 0 | 0.2 k |
| Harness cord, comber board to mail (tube / line) | 1,600 | 8 / 0 | 12.8 k | 0 | 0.8 k |
| Mail eye (low-poly plate / alpha-textured quad) | 1,600 | 32 / 2 | 51.2 k | 3.2 k | 3.1 k |
| Lingo weight (6-sided / 4-sided cylinder) | 1,600 | 24 / 12 | 38.4 k | 19.2 k | 2.3 k |
| Warp end, back beam → mail → reed → fell (4 sides × 4 segments / line) | 1,600 | 32 / 0 | 51.2 k | 0 | 3.1 k |
| Cards (box, holes as texture; 40 visible) | 40 | 12 | 0.5 k | 0.5 k | (holes as geometry: about 0.5 k per card) |
| Cylinder, griffe, needle board, spring box (holes as texture) | 1 each | — | about 3 k | about 3 k | about 2 k (holes as geometry) |
| Frame, batten, reed (1,600 dents as instanced quads), beams, shuttle, levers | — | — | about 40 k | about 40 k | about 30 k |
| Cloth (plane + data texture; or a woven heightfield up close) | 1 | 2 / — | about 0 | about 0 | about 0–40 k |
| **Total** | | | **about 335 k (over budget)** | **about 116 k** | **about 50–90 k** |

- **Draw calls (inference):** about 10 instanced or line batches for the repeated parts, plus about 20–60 frame meshes and materials. That is about 30–80 calls, doubled with shadows, against Leibniz M3's 588 at 60 fps on an M1 Mac. Draw calls are not the risk once instancing is used. Without instancing, 8,000+ separate meshes would be.
- **Update cost per frame (inference):** the worst case moves every lifted hook, cord, mail, lingo and warp end, about 4,000 matrices × 64 B = 256 KB uploaded per frame plus about 4,000 `Matrix4` compositions in JS. That is far below the 100 k-instance range where forum users saw trouble. A cheaper pattern sends each pick's selection as one per-instance float attribute and the griffe height as one uniform, so nothing is re-uploaded per frame. But the project's Node acceptance tests ray-cast CPU-side geometry and cannot see vertex-shader displacement. **Recommendation: matrices on the CPU**, because that keeps "one scalar per part" testable.
- **`BatchedMesh` vs `InstancedMesh` (inference):** every repeated part here is one geometry repeated, which is the textbook `InstancedMesh` case. `BatchedMesh` would only help to merge different static frame parts, and the reported multi-draw slowdowns argue against it on Chromebooks.
- **LOD (inference):** use two shapes per part type (mid and low), swapped by camera distance as whole `InstancedMesh` objects, since all instances of a type sit together in the head. Per-instance LOD is not needed. three.js's `LOD` object works per `Object3D`, so it can hold two `InstancedMesh` children.
- **Node contract (inference):** 400 named nodes (`head.hook.000`…) would mean 400 draw calls unless they are instanced after loading. Options:
  - **(a)** The `.glb` carries one prototype per part type plus the static frame, and `js/sim/` lays out instances from the same params the Blender script uses. A Python→JS fixture test proves the two layouts agree.
  - **(b)** `EXT_mesh_gpu_instancing` through gltf-transform, with the instance index as the hook number.

  (a) keeps the `.glb` small. A 400-hook `.glb` with prototypes would be well under 1 MB. It also fits the project's "one source of truth for motion" rule.
- **Aliasing (inference):** 1,600 warp ends 1 px wide, seen from across the room, will shimmer and show moiré. The far view should swap the warp sheet for a textured, semi-transparent strip, with lines or tubes only up close.

### Gaps
- No measured three.js frame rates on a Chromebook-class GPU (Intel UHD 600 or a Mali-G52-class ARM GPU) for 5–10 k instances were found. This should be measured at M1/M2 with a `?perf` page, as Leibniz did.
- Whether Blender 4.x's built-in glTF exporter writes `EXT_mesh_gpu_instancing` reliably is unconfirmed (the forum posts are from 2023–24).
- Ray casts against `InstancedMesh` in Node with three-mesh-bvh were not tested. A BVH is built per geometry, and each instance would need the ray moved into its local space.

---

## 2. Flexible elements without physics

### Takeaway
None of the flexible parts needs a physics engine:
- **Cords** are held taut by the lingo weights, so straight segments are physically right.
- **Warp ends** are polylines with one moving vertex, the mail eye.
- **The card chain** is a chain of rigid plates placed along a fixed path, like a tank tread, driven by one scalar.
- **The cloth** is a data texture written from the pick history, with an over/under shader.

AdaCAD is the one open project with yarn-level 3D draft rendering. It uses one `TubeGeometry` per yarn, which is too heavy for a whole cloth but a good model for a zoomed-in swatch.

### Cited findings
- Each hook's harness is weighted by a lingo (a wire "of varying weight"). Heavier lingoes are used with cam-driven sheds, and lingoes that are too light "cause trouble at high speed". — [nelson-gutenberg]. These are the weights that keep the cords taut.
- The motion cycle, which defines the kinematics:
  - The griffe lifts the hooks for each shed. In a single-action machine "the griffe must descend before the next shed can be lifted".
  - The cylinder moves out 2–3 in from the needle board. It should be "about one-quarter inch from the needle points when commencing to turn". It turns when a catch strikes the square casting on its end, then returns.
  - Hooks that are not to be lifted are pressed off the griffe by the cylinder, through the card.
  - Shed: about 3 in with a 36 in overhead lever. Griffe lift: about 4 in with a cradle lever.

  — [nelson-gutenberg]
- The cards are laced into an endless chain over the four-sided prism. — [inflibnet-jacquard]. The needle board has grooves so the lacing is not cut, and cards warped by damp can catch the needle points and throw off the pegs. — [nelson-gutenberg]
- **AdaCAD's yarn renderer:**
  - The library (`adacad-drafting-lib`) computes a yarn simulation from a draft: contact neighbourhoods, floats, layers, then weft and warp paths as `YarnVertex` lists. Its about 2,855-line `simulation.ts` does not use three.js.
  - The Angular UI turns each path into `new THREE.CatmullRomCurve3(pts, …)` and `new THREE.TubeGeometry(curve, vtxs.length * 10, diameter/2, 8, false)`, one `Mesh` with `MeshPhysicalMaterial` per yarn, not instanced.
  - Licences: the library's `package.json` says LGPL-3.0-or-later, the UI's says GPL-3.0-or-later. GitHub finds no LICENSE file in the repository root (API `license: null`) [adacad-repo]. Search snippets describe the project as GPL-3.0 [adacad-search], which conflicts with the library's LGPL declaration.
  - The UI pins three `^0.150.1`.

  — [adacad-repo], [adacad-sim-src], [adacad-simsvc-src]
- Yarn-level research is offline and far heavier than a classroom view needs:
  - Kaldor, James and Marschner (SIGGRAPH 2008) simulate knits as "inextensible, yet otherwise flexible, B-spline" yarn tubes, with penalty contact and velocity filters. — [kaldor2008]
  - Zhao, Jakob, Marschner and Bala (SIGGRAPH 2011) build volumetric fabric appearance from micro-CT scans. Their 2012 follow-up synthesises woven-fabric volumes from exemplars. — [zhao2011], [zhao2012]
  - Irawan and Marschner (TOG 2012) give a *procedural* woven-cloth scattering and texture model, driven by fibre, yarn-geometry and weave-pattern parameters, that "doesn't require image data". — [irawan2012]
- A drawdown is "just a rectangular array of zeros and ones" for software. — [arizona-fabric-analysis]
- Open weave tools found:
  - handweaving.net, a web WIF library with a draft editor. — [handwoven-handweavingnet]
  - PyWeaving (Python), which reads and writes WIF and renders drafts to images or SVG. — [pyweaving]
  - WeaveDreamer (Java, GPL v2), which reads and writes WIF. — [linuxlinks-weavedreamer]
  - Network Drafter (a single-file HTML/JS page). — [patreon-networkdrafter]
  - An Observable notebook, "the art of weaving". — [observable-weaving]

  **No maintained, pure-JavaScript WIF viewer library was found.**

### Inferences (how to build each element)
- **Neck and harness cords:** with the lingoes hanging, each cord is a straight segment from the hook (or comber-board hole) to the mail, so the endpoints are the whole state. A catenary (y = a·cosh(x/a), with a few Newton steps to fit a given length) is only needed for slack lacing or a cord shown cut. That is a cosmetic option, not a requirement. In the instanced form, each cord is a unit cylinder or line whose instance matrix is built from its two endpoints: position at the midpoint, rotation along the direction, scale by the length.
- **Warp ends:** each end runs back beam → back rest → lease rods → mail eye → reed dent → fell. Only the mail-eye vertex moves, by (lifted ? lift : 0) × griffe phase (single-lift, bottom closed shed). All ends can be one `LineSegments` buffer (1,600 × 5 vertices = 8,000 vertices, 96 KB) rewritten in place each frame, or one instanced tube per segment. The shed's upper and lower sheets come out of this automatically.
- **Card chain:**
  - Model the chain as N rigid cards whose hinge points lie on a fixed closed path: the cylinder's square section, plus a hanging loop drawn as a spline or catenary through the card cradle.
  - One scalar `s` gives each card's arc position: s = pick index + the cylinder's rotation within the pick.
  - Card k's leading hinge is at arc position s + k·pitch, refined by a circle–path intersection so that the chord equals the card pitch. The card's orientation is along the chord.
  - While the cylinder turns, the four cards on the faces are rigidly attached to it. The path simply wraps the rotating square.
  - This is the standard "tread on a path" technique: cheap, deterministic and testable (adjacent hinges coincide).
- **Card holes:** use geometry on the didactic head, where 24 holes per card are cheap, because the acceptance test "needle passes through a hole" needs ray-castable holes. Use a per-card `DataTexture` with an alpha cutout on the full head, where 416 holes × 40 cards as geometry would cost more than 250 k triangles.
- **Cloth:**
  - Keep a `Uint8Array` with one byte per cell (warp × pick), holding warp-over or weft-over and the weft colour index, uploaded as a `DataTexture` with `NearestFilter`.
  - A fragment shader draws each cell as a lens-shaped yarn float, warp vertical or weft horizontal, shaded with a cosine across the yarn and darkened where the yarn dives under. That is a few lines of GLSL.
  - The cloth grows by writing one row per pick and moving the take-up offset. Cost: 400 B per pick.
  - For a "magnifier" view, build AdaCAD-style tubes for a 24 × 24 window only, at 3 segments per crossing × 6 sides. That is about 0.9 k triangles per yarn and about 40 k for the swatch, against AdaCAD's 10 segments per vertex × 8 sides at about 3.8 k per yarn.
  - The same byte matrix drives the 2D cloth preview (section 4).
- **What to reuse from AdaCAD:** its float and layer analysis targets multi-layer and complex structures, which is more than single-cloth Jacquard needs. Its licence (GPL or LGPL, unclear) would also bind a CC BY-SA or Apache simulator, so take **ideas only, no code**.

### Gaps
- No three.js example of instanced *tubes between moving endpoints* was found. The endpoint-to-matrix technique above is standard practice but not cited.
- The Irawan–Marschner model is meant for offline rendering. No WebGL implementation was found, and none was searched for in depth.
- Whether "hole means lift" holds for the machine to be modelled (and so whether a punched hole shows warp on the face) depends on the cutting convention. Nelson's manual was not read for it. See the mechanism notes.

---

## 3. Scale choices for teaching

### Takeaway
Build a **reduced didactic head** (16–24 hooks, so 2–3 rows of the real eight-across layout) as the operable, fully detailed and fully tested machine. Then add a **"zoom out to the real head"** of 400 instanced hooks with the same logic, and the cloth swatch to show that resolution is the point. Museum demonstrators do not show a standard small hook count. Reducing the count is a teaching choice the page should name.

### Cited findings
- Science Museum, London: a 1961 "working model to demonstrate jacquard mechanism" (steel and wood), and a separate collection category of "model to demonstrate jacquard principle". — [sciencemuseum-models]
- Historische Schauweberei Braunsdorf: a 1980 East German demonstration model built to teach the principle of Jacquard control, with **1,320 hooks** plus 28 spares, about 120 cm long and 200 kg. — [braunsdorf-model]. This is from a search summary of a German-language museum record and has not been verified in the original.
- McCarl Gallery: a motorised 1963 London-made wooden model showing "how a Jacquard card triggers the individual heddles". — [mccarl-model]
- Science Museum: an 1867 1:2 scale model of a Jacquard loom with shuttle, and an 1870 ribbon-loom model "reputed to be the smallest working model figure loom in the World". — [sciencemuseum-1867], [sciencemuseum-models]
- Modern open-source Jacquards use few, actuated ends rather than hook heads:
  - RoboLoom, for classroom use (version 3). — [roboloom]
  - Lea Albaugh's CMU loom, about $200 against about $30,000 for comparable commercial hand Jacquards. — [hackster-albaugh]
  - A punch-card design anyone can build at a fablab. — [textileacademy-cox]
  - OSLOOM (2012). — [osloom]
- Machines ranged "from 100 to 2600 hooks", and smaller patterns on a 400 machine were made "by casting out hooks". — [nelson-gutenberg]
- Existing browser simulations: only Luke Duncalfe's Shockwave piece *Jacquard Loom Panels* (needs Flash) and a 2025 LIRIS student project brief to reproduce fabric from a card image were found. — [rhizome-duncalfe], [liris-brief]

### Inferences
- **Why reduce:** with 400 hooks a student cannot follow one card hole to one hook to one warp end. With 24 hooks every hook, needle, cord and end can be labelled and highlighted, and a card fits on screen at a readable hole size. Since cards are eight holes across, 24 = 3 rows of 8 keeps the real layout. Point-tie and repeat lessons need at least 2 repeats, so 48–96 warp ends.
- **The two-scale design:** both scales run the same `js/sim/` with H = 24 or 400 as a parameter. The zoom-out is a camera move plus a model swap (instanced), and the cloth texture is recomputed at full resolution. Precedent: Leibniz built slices (M0, M1) before the full machine.
- **Honesty statement for the page:** "This head has 24 hooks so you can follow each one; Jacquard's had 400 (some later machines over 2,000)."

### Gaps
- No source documented how museums choose a hook count for a demonstrator, or found a common small count like 8 or 24.
- The open-source looms' end counts were not checked.

---

## 4. 2D options and 2D vs 3D

### Takeaway
A 2D layer is cheap and teaches the core idea (a hole in the card becomes a lifted thread, which becomes a pixel in the cloth) better than 3D does:
- a side cross-section of one hook–needle–card column in SVG;
- a top-down card editor;
- a cloth preview on a canvas.

It costs roughly 15–25 % of the 3D effort (inference). The best design is **2D + 3D sharing one sim**: 2D is the editor and the clear readout, 3D is the machine. Doing 2D first also gives the logic and step stops a test bed before any Blender work.

### Cited findings
- The maintainer's Altair 8800 Simulator (https://github.com/wixette/8800-simulator) is a 2D (SVG panel) simulator; a 3D view of such a machine is best a view that replaces the 2D panel rather than duplicating it (inference).
- Weaving software is built around the 2D draft and drawdown, for example handweaving.net's draft editor [handwoven-handweavingnet], PyWeaving's draft-to-image and SVG output [pyweaving], and the drawdown as a 0/1 array [arizona-fabric-analysis].

### Inferences (concrete 2D pieces and their size)
- **Side section (SVG), one column:**
  - About 12 moving shapes: one needle (sliding), one hook (sliding up, and tilting when pushed off), a griffe knife (rising), a cylinder face with a card (out, turn, in), a spring, the neck cord, the mail, the lingo, a warp end, the shuttle as a dot in the shed.
  - Every shape is driven by the same per-part scalars as the 3D rig, so the 2D view is a second "rig" over `js/sim/`.
  - About a day of work at the project's pace, with the same step-stop and `?selftest` conventions.
- **Card editor (canvas or SVG grid):**
  - 8 × N holes per card, plus a chain list (add, duplicate, loop).
  - Import or export a drawdown as PNG or 0/1 text.
  - WIF import is optional. WIF is a 1997 text format, and a small parser is a contained task (no JS library was found).
- **Cloth preview (canvas `putImageData`, or the 3D shader in an orthographic view):** one row per pick, with a "this row came from this card" highlight.
- **Teaching value:** the side section shows the *selection* mechanism, which 3D hides under 400 overlapping hooks. The editor plus preview gives students the "program the loom" experience, the link to computing. 3D gives scale, the whole cycle (shed, shuttle, beat, take-up) and the card chain.
- **Effort comparison:**
  - 2D-only is about 0.3× an Altair-sized 3D project: no Blender, no `.glb`, no geometric acceptance tests, but logic tests and step stops all the same.
  - 3D-only carries all the modelling and instancing risk and less clarity about selection.
  - 2D + 3D is about 1.2× 3D-only, because the 2D reuses the sim and the readouts.

### Gaps
- No classroom study comparing 2D and 3D loom simulations was found or searched for.

---

## 5. Simulation logic

### Takeaway
The logic is close to trivial: a cloth row is the tie-up of the current card. It is simpler than Leibniz (stored carries, crank-angle windows) and far simpler than the Altair's 8080, which was delegated to the existing simulator. The work is in the **cycle timing** (griffe, cylinder out/turn/in, shed, shuttle, batten, take-up, with overlapping windows), the **tie-up mapping**, and the edge cases: a looped chain, reversing, several weft colours.

### Cited findings
- Cycle order and roles (single-lift): the griffe rises with the selected hooks, then must descend before the next shed. The cylinder moves out, turns one face, and presses back in, pushing unselected hooks off the knives through the blank card positions. — [nelson-gutenberg]
- Reversing: to find a lost pick, the underneath catch is engaged and the top catch raised clear, so the cylinder turns backwards. — [nelson-gutenberg]
- Double-lift machines have two griffes and 800 hooks for a 400 machine (each needle controls two hooks). Double-action machines have two cylinders and ran at "170 or 180 picks per minute". — [nelson-gutenberg]
- Tie-up: "400 harness threads per maximum repeat". Straight tie and cross tie are named for how the machine sits relative to the loom. Nelson's text does **not** detail repeats across the width. — [nelson-gutenberg]
- There are 16–26 extra hooks beyond the 400. — [nelson-gutenberg]. Their uses (selvedge, box motion) were not given in what was read.

### Inferences: state and functions
- **State:** `{ chain: Card[] (bits H), tieUp: Int32Array(ends → hook), weftColours: per pick, pick: int, phase: [0,1), dir: ±1, cloth: Uint8Array rows }`. Everything visible is a pure function of the state:
  - `selected = chain[pick mod N]`, so hook h is lifted iff the bit is set (single-lift, "cut for lift");
  - `griffeHeight(phase)`, `cylinderOffset(phase)`, `cylinderAngle(phase)`, `batten(phase)`, `shuttleX(phase)`, `takeUp(pick, phase)`;
  - end e is up iff `selected[tieUp[e]]`;
  - on beat-up, row `pick` is appended to the cloth.
- **Tie-ups (H hooks, R repeats):**
  - straight: end e = r·H + h;
  - point (centre, mirrored) tie: e = r·H + (r even ? h : H−1−h);
  - extra hooks for selvedges;
  - "casting out" means unused hooks.

  Each is a pure array, testable by enumeration.
- **Edge cases:**
  - Chain loop: the index is taken modulo N, and the cloth repeats every N picks. Test that pick N+k equals pick k.
  - Reverse: `dir = −1` turns the cylinder backwards and **removes** the last cloth row (unweaving a pick). Decide whether the page models picking out the weft. Test that forward-then-reverse restores the state exactly.
  - Colours: k shuttles. Each pick names its shuttle, from a per-card colour field (didactic) or from extra hooks or a box chain (historical). Cloth cell colour = weft colour where the weft is over, warp colour where the warp is over. Two-colour figure on ground = alternate picks.
  - Partial cycle and Step:
    - The step stops (project rule) are: card registered, griffe up (shed open), shuttle across, beat-up, cylinder turned.
    - "Every step changes something visible" is easy to assert.
  - Invalid states are few: a card shorter than H (pad with blanks), a chain of length 0, and a reverse at pick 0 (refuse, with a message, like Leibniz's refusals).
- **Size comparison:** Leibniz needed carry storage, a ten-state stepped-drum mapping and refusal rules. The Jacquard sim is perhaps 300–600 lines plus tests (inference). The kinematic timing table is the larger part.

### Gaps
- The exact phase timings (the cylinder's turn against the griffe dwell, the batten against the shuttle) for a specific historical machine belong to the mechanism research. Nelson gives distances but no cam timing diagram.

---

## 6. Acceptance-testable readouts

### Takeaway
The Jacquard maps well onto the project's three kinds of check:
- **readouts:** the cloth row equals the card bits through the tie-up, the hook state equals the hole, the cylinder face equals the card index;
- **contacts:** selected hook on the knife, card on the pegs, warp end in its mail and dent;
- **clearances:** unselected hook nose clear of the knife, shuttle clear of both shed sheets, card chain clear of the cylinder and needles.

The only catch is that holes and positions must be geometry or CPU matrices for the Node ray casts to see them.

### Inferences (proposed spec items, modelled on the Leibniz and Altair specs; tolerances to be set per machine)
| ID (draft) | Statement | Kind |
|---|---|---|
| J-1 | Contract: the `.glb` holds each part-type prototype and every static node the page binds, with motion extras. Instance layouts from `js/sim/` equal the Blender layout (fixture). | contract |
| J-2 | Selection: for every pick of a scripted chain, a ray from each needle tip along its axis passes through the registered card iff that card has a hole there. The needle's pose (forward or pushed back) matches. | readout |
| J-3 | Hook on knife: at griffe start-of-lift, each selected hook's nose touches its knife (≤ 0.3 mm) and each unselected hook's nose clears it (≥ tolerance), at sampled phases. | contact + clearance |
| J-4 | Lift: at full lift, each end's mail eye sits at the lift height iff its hook is selected through the tie-up (± 0.1 mm), for straight and point ties. | readout |
| J-5 | Shed clearance: at the shuttle's flight window, the shuttle's swept box clears every warp end in both sheets. | clearance |
| J-6 | Cloth readout: after k picks, cloth cell (row i, end e) equals warp-over iff `card[i mod N][tieUp[e]]`, read from the cloth texture or mesh as the page builds it, and the weft colour equals pick i's shuttle. | readout |
| J-7 | Registration: at each cylinder dwell, the registered card's peg holes sit on the face's two pegs (≤ tolerance) and its hole grid lies over the face's holes. | contact |
| J-8 | Chain continuity: at sampled phases, adjacent cards' hinge points coincide (≤ tolerance) and no card intersects the cylinder, needle board or frame. | contact + clearance |
| J-9 | Cylinder index: after each full pick the cylinder has turned 90° (± 1°) and the registered card is the next (or previous when reversing). | readout |
| J-10 | Threading: every warp end passes through its own mail eye and reed dent (point-in-hole), and through no other. | contact |
| J-11 | Reverse: forward n picks then back n picks restores the cloth and every part's pose. | logic |
| J-12 | Step stops: every step changes something visible (project rule). | logic |
| J-13 | Budget: triangles and `.glb` size under budget; draw calls under a set ceiling (for example 150) at the zoomed-out view. | budget |

- **All-pairs clearance** (project rule) across hundreds of instances is O(n²). Moving hooks only meet their neighbours, the knives and the needles, so a spatial grid gives the "all pairs that can move relatively" set without hand-picking. A uniform hook pitch makes a cell index trivial.
- **What the tests need from the model:** J-2 and J-7 need card holes and pegs as geometry. That is cheap on the 24-hook head; on the 400 head, test at the sim level plus a sample of columns.

### Gaps
- Instanced ray casts with three-mesh-bvh in Node have not been tested here (see section 1).

---

## 7. Effort estimate in milestones, and main risks

### Takeaway
The work is comparable to Leibniz (research plus M0–M3 in about two calendar days in the git log), about 1.3–1.8× once instancing, the card chain, the cloth shader and the 2D views are counted (inference). The risks are not in the logic. They are in performance on Chromebooks, legibility, testing instanced parts, and the dimensional sources (parallel notes).

### Proposed milestones (inference)
| M | Deliverable | Exit criteria | Relative size |
|---|---|---|---|
| **M0: one row of eight** | `js/sim/` (chain, tie-up, cycle, step stops); the 2D side section and card editor; Blender: 8 needles, 8 hooks, springs, 1 knife, one cylinder face with a card, 8 cords, mails, lingoes, ends; individual nodes, no instancing yet | J-2, J-3, J-4 pass on 8 hooks; cloth preview (2D) equals card bits | like Leibniz M0 plus the 2D page (about 1.3×) |
| **M1: the didactic head and the chain** | 24-hook head (3 rows), full cylinder with pegs, card chain on its path (out, turn, in), harness with straight and point ties, 48–96 ends, shed, 3D cloth texture growing | J-1 to J-10 on 24 hooks; ≥ 30 fps on a Chromebook | like Leibniz M1–M2 (the chain is the new hard part) |
| **M2: the whole loom and the real head** | Frame, batten, reed, shuttle, beams, lever; 2 shuttles (two-colour); reverse; the 400-hook instanced "zoom out" with LODs and line or textured warp; `?perf` page | J-11 to J-13; full head under 300 k triangles and 15 MB; measured fps on a Chromebook | like Altair M2 plus the instancing infrastructure (about 1.5×) |
| **M3: teaching page** | Lessons (a hole becomes a thread becomes a pixel; program the loom; repeats; scale), 2D + 3D in one page, languages | Tested with a teacher | like Leibniz M3 |

### Main risks (inference unless cited)
| Risk | Why | Mitigation |
|---|---|---|
| Chromebook fps with thousands of instances and thin lines | No Chromebook benchmark found; multi-draw slowdowns reported for `BatchedMesh` [forum-batched-perf], [forum-lod] | `InstancedMesh` only; low-LOD shapes; textured warp sheet when far; a `?perf` page measured at M1 |
| Project conventions assume per-part nodes | 400 named nodes means 400 draw calls; shader animation is invisible to Node ray casts | Prototypes in `.glb` + layout from params with a fixture test; CPU matrices; spatial-grid all-pairs |
| Card chain looks wrong (rigid plates on a hanging loop) | No physics; the drape is drawn | Path-follow with a hand-tuned spline from photos; J-8 continuity test |
| Legibility at full scale | 400 hooks overlap; 1 px lines alias | Didactic 24-hook head as the main machine; x-ray and highlight of one column; 2D section |
| Cloth reads as a flat grid | A texture without shading looks like pixels | Over/under lens shader; tube swatch magnifier up close |
| Licence contamination | AdaCAD is GPL or LGPL (conflicting declarations) [adacad-repo], [adacad-search] | Ideas only, no code; write the cloth shader from scratch |
| Machine dimensions and cam timing | Nelson gives some distances, no timing diagram [nelson-gutenberg] | From the parallel mechanism and sources notes; `est` confidence in params |
| `EXT_mesh_gpu_instancing` from Blender unreliable | Mixed forum reports [forum-blender-instancing], [forum-gpu-instancing-multi] | Don't depend on it (layout in JS), or gltf-transform as the instancing step |

### Gaps
- The effort ratios are judgement calls from earlier projects' history, not measurements. AI-assisted calendar days do not translate to human-hours.

---

## Sources

- [threejs-instancedmesh] three.js docs, "InstancedMesh". https://threejs.org/docs/pages/InstancedMesh.html (read 2026-10-25)
- [threejs-batchedmesh] three.js docs, "BatchedMesh". https://threejs.org/docs/pages/BatchedMesh.html (read 2026-10-25)
- [threejs-batchedmesh-legacy] three.js docs (older page), "BatchedMesh", which states the `WEBGL_multi_draw` fallback. https://threejs.org/docs/api/en/objects/BatchedMesh.html (search snippet)
- [threejs-pr28404] mrdoob/three.js pull request #28404 (BatchedMesh fallback discussion). https://github.com/mrdoob/three.js/pull/28404 (search snippet)
- [threejs-howtoupdate] three.js manual, "How to update things". https://threejs.org/manual/en/how-to-update-things (search snippet)
- [threejs-ex-instancing] three.js example source, `webgl_instancing_performance.html`. https://github.com/mrdoob/three.js/blob/dev/examples/webgl_instancing_performance.html (raw source read 2026-10-25)
- [threejs-tubegeometry-src] three.js source, `src/geometries/TubeGeometry.js`. https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js (read 2026-10-25)
- [threejs-linebasicmaterial] three.js docs, "LineBasicMaterial" (`linewidth` limited to 1 on most platforms). https://threejs.org/docs/#api/en/materials/LineBasicMaterial (not re-fetched)
- [threejs-ex-fatlines] three.js example, "webgl_lines_fat" (`Line2` / `LineMaterial`). https://threejs.org/examples/#webgl_lines_fat (not re-fetched)
- [forum-batched-perf] three.js forum, "Significant Performance Drop and High CPU Usage with BatchedMesh", June–Aug 2024. https://discourse.threejs.org/t/significant-performance-drop-and-high-cpu-usage-with-batchedmesh/67324
- [forum-lod] three.js forum, "When is it actually beneficial to use LOD in Three.js for performance?", post #11 by gkjohnson, 2025-10-25. https://discourse.threejs.org/t/when-is-it-actually-beneficial-to-use-lod-in-three-js-for-performance/87697/11
- [forum-instanced-convert] three.js forum, "Is it possible to have a generic buffergeometry to instancedbuffergeometry converter?". https://discourse.threejs.org/t/is-it-possible-to-have-a-generic-buffergeometry-to-instancedbuffergeometry-converter/15708 (search snippet)
- [babylon-instances] Babylon.js forum, "Instanced Meshes and Performance". https://forum.babylonjs.com/t/instanced-meshes-and-performance/4794 (search snippet)
- [forum-browsers] three.js forum, "One scene on one computer slows down differently in different browsers". https://discourse.threejs.org/t/one-scene-on-one-computer-slows-down-differently-in-different-browsers/24791 (search snippet)
- [utsubo-tips] Utsubo, "100 Three.js Tips That Actually Improve Performance (2026)". https://www.utsubo.com/blog/threejs-best-practices-100-tips (search snippet; vendor blog)
- [unity-drawcalls] Unity Discussions, "What is a reasonable number of draw calls relative to one hardware configuration?". https://discussions.unity.com/t/what-is-a-reasonable-number-of-draw-calls-relative-to-one-hardware-configuration/812 (search snippet; other engine)
- [forum-blender-instancing] three.js forum, "Blender export InstancedMesh directly". https://discourse.threejs.org/t/blender-export-instancedmesh-directly/73769 (search snippet)
- [forum-gpu-instancing-multi] three.js forum, "EXT_mesh_gpu_instancing not supporting multiple geometries". https://discourse.threejs.org/t/ext-mesh-gpu-instancing-not-supporting-multiple-geometries/49611 (search snippet)
- [adacad-repo] Unstable Design Lab, AdaCAD monorepo (GitHub API: no repository licence detected; `packages/adacad-drafting-lib/package.json` "LGPL-3.0-or-later", v1.3.31; `projects/ui/package.json` "GPL-3.0-or-later", three ^0.150.1; last push 2026-10-23). https://github.com/UnstableDesign/AdaCAD
- [adacad-sim-src] AdaCAD, `packages/adacad-drafting-lib/src/simulation/simulation.ts`. https://github.com/UnstableDesign/AdaCAD/blob/main/packages/adacad-drafting-lib/src/simulation/simulation.ts (read 2026-10-25)
- [adacad-simsvc-src] AdaCAD, `projects/ui/src/app/core/provider/simulation.service.ts` (CatmullRomCurve3 + TubeGeometry at about lines 431–432 and 500). https://github.com/UnstableDesign/AdaCAD/blob/main/projects/ui/src/app/core/provider/simulation.service.ts (read 2026-10-25)
- [adacad-search] Search summaries describing AdaCAD as GPL-3.0: https://github.com/UnstableDesign ; https://www.goodfirstissue.org/UnstableDesign/AdaCAD-UI ; and CU Boulder ATLAS, "AdaCAD". https://www.colorado.edu/atlas/adacad
- [kaldor2008] J. M. Kaldor, D. L. James, S. Marschner, "Simulating Knitted Cloth at the Yarn Level", ACM TOG 27(3), SIGGRAPH 2008. https://www.cs.cornell.edu/~srm/publications/SG08-knit.html
- [zhao2011] S. Zhao, W. Jakob, S. Marschner, K. Bala, "Building Volumetric Appearance Models of Fabric using Micro CT Imaging", ACM TOG 30(4), SIGGRAPH 2011, doi:10.1145/2010324.1964939. https://rgl.epfl.ch/publications/Zhao2011Building
- [zhao2012] S. Zhao, W. Jakob, S. Marschner, K. Bala, "Structure-aware Synthesis for Predictive Woven Fabric Appearance", SIGGRAPH 2012. https://research.cs.cornell.edu/ctcloth/download/ct12/ctcloth-sg12.pdf
- [irawan2012] P. Irawan, S. Marschner, "Specular Reflection from Woven Cloth", ACM TOG 31(1), art. 11, 2012. https://www.cs.cornell.edu/~srm/publications/TOG12-cloth.html
- [arizona-fabric-analysis] University of Arizona weaving documents, "Fabric Analysis: From Drawdown to Draft". https://www2.cs.arizona.edu/patterns/weaving/webdocs/mo/D/FabricAnalysis.pdf (search snippet)
- [handwoven-handweavingnet] Handwoven magazine, "Weave a Wonderland of WIFs: Handweaving.net". https://handwovenmagazine.com/weave-a-wonderland-of-wifs-handweaving-net/ (search snippet)
- [pyweaving] PyWeaving documentation. https://pyweaving.readthedocs.io/ (search snippet)
- [linuxlinks-weavedreamer] LinuxLinks, "WeaveDreamer". https://www.linuxlinks.com/weavedreamer-fabric-design-software-hand-weavers/ (search snippet)
- [patreon-networkdrafter] "Tool release: Network Drafter". https://www.patreon.com/posts/53835168 (search snippet)
- [observable-weaving] Observable, "@galopin/the-art-of-weaving". https://observablehq.com/@galopin/the-art-of-weaving (search result; not opened)
- [nelson-gutenberg] H. William Nelson, *Jacquard Machines: Instruction Paper* (American School of Correspondence), Project Gutenberg eBook #50532. https://gutenberg.org/cache/epub/50532/pg50532-images.html (read 2026-10-25)
- [computinghistory-cards] Centre for Computing History, "Jacquard Cards". https://www.computinghistory.org.uk/det/48028/Jacquard-Cards/ (search snippet)
- [inflibnet-jacquard] INFLIBNET e-PG Pathshala, "9 Jacquard weaving". https://ebooks.inflibnet.ac.in/hsp08/chapter/jacquard-weaving/ (search snippet)
- [sciencemuseum-models] Science Museum Group, "model to demonstrate jacquard principle" (object type listing). https://collection.sciencemuseumgroup.org.uk/search/objects/object_type/model-to-demonstrate-jacquard-principle (search snippet)
- [sciencemuseum-1867] Science Museum Group, "Model of a Jacquard loom, with shuttle and components" (co44888). https://collection.sciencemuseumgroup.org.uk/objects/co44888/model-of-a-jacquard-loom-model-jacquard-loom (search snippet)
- [braunsdorf-model] museum-digital Sachsen, object 23517 (Historische Schauweberei Braunsdorf demonstration model). https://sachsen.museum-digital.de/pdf/object/23517.pdf?lang=en (search snippet; not verified in the original)
- [mccarl-model] McCarl Gallery, "Loom model". https://hub.catalogit.app/mccarl-gallery/folder/entry/loom-model (search snippet)
- [roboloom] "RoboLoom: An Open Source Jacquard Loom for Classroom Use". https://sites.google.com/view/roboloom/ (search snippet)
- [hackster-albaugh] Hackster.io, "Mechanical and AI Innovations Make Jacquard Weaving Affordable at Home". https://hackster.io/news/mechanical-and-ai-innovations-make-jacquard-weaving-affordable-at-home-cd8b93945cdc (search snippet)
- [textileacademy-cox] Fabricademy, Riley Cox final project. https://class.textile-academy.org/2024/riley-cox/project/ (search snippet)
- [osloom] OSHWA 2012, "OSLOOM – An Open Source Jacquard Loom". https://2012.oshwa.org/osloom-an-open-source-jacquard-loom/ (search snippet)
- [rhizome-duncalfe] Luke Duncalfe, *Jacquard Loom Panels* (Shockwave). https://static-files.rhizome.org/Q3188/Jacquard/ (search snippet)
- [liris-brief] F. Jaillet (LIRIS), "BUT JacquardSoieries 2025" project brief. https://perso.liris.cnrs.fr/fabrice.jaillet/data/BUT-JacquardSoieries_2025.pdf (search snippet)
- [leibniz-notes] The Leibniz stepped reckoner simulator's M2/M3 notes and git log, https://github.com/wixette/leibniz-stepped-reckoner (baselines quoted in the header).
