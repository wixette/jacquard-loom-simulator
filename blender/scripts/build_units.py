"""M3: the five 3D core units of the Jacquard loom, built from params/machine.json.

Run headless (pnpm build:model):
  Blender --background --factory-startup --python build_units.py -- [--out DIR]

Each unit is one .glb in assets/, with one of each part (decision 0001), built in the machine
frame (params machine_frame: X across the loom along the needles, Y front to back, Z up; a
point (x, y) of the 2D section is (x, section_y, section_z + y)), so the ghosted whole
machine (M4) holds them where they stand. Every moving part is one node, driven by one
scalar from the page's simulation (glTF extras "motion"):

  translate  value mm along "axis"
  rotate     value degrees about "axis", through the node's origin
  reach      a straight piece from a fixed end (the origin) to an end that moves by value mm
             along "move" (node frame): the page turns it to the moving end and stretches it,
             so a bent wire or a cord through a hole stays joined at both ends
  stretch    a spring along the node's local +Y: value is its length, mm ("length" at rest)
  show       shown when value is 1 (a card's hole, filled or open)
  segment    a cord between two moving points, which the page sets from both (the lift cord)

"label_en" names a part for the page; "anchors" mark points the acceptance checks measure
(js/accept/m3Checks.js) without re-deriving the build.

  u1-selector.glb  U1: needle, spring, hook (jointed), knife, board slices, a card on a face
  u2-cylinder.glb  U2: batten, prism with its bores, pegs and lantern, hammer, catches
  u3-griffe.glb    U3: griffe with its 8 knives, plunger, rod, head lever, lift cord, treadle
  u4-harness.glb   U4: neck cord, comber board slice, two harness cords, mails, lingoes, ends
  u5-shed.glb      U5: a raised and a lowered end, the warp sheets, batten with reed, shuttle
  context.glb      M4: the ghosted loom (frame, beams, the head's housing, comber board, cloth)
                   and the repeat bands, with the units' places inside it
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402
from lib import bl, params  # noqa: E402
from lib.bl import MeshBuilder  # noqa: E402

DEFAULT_OUT = os.path.join(params.MACHINE_DIR, "assets")

# Drawing constants of the 2D section (js/view2d/layout.js), so the 3D hook is the 2D hook.
BEND = 30.0              # the bend between the grate and a pushed hook's upper part
UPPER_BEND_ABOVE_TOP_TIER = 15.0
RESTER_OFFSET = 3.2
COLUMN_PITCH = 6.9       # the card's columns (js/view2d/cardLayout.js)


class Head:
    """The head's numbers (mm), from params; the twin of js/sim/head.js and the section layout."""

    def __init__(self, p):
        self.p = p
        v = p.v
        self.rows = int(v("head.rows"))
        self.board_t = v("head.bottom_board_thickness")
        self.nb_t = v("head.needle_board_thickness")
        self.nb_h = v("head.needle_board_height")
        self.hook_h = v("hooks.height")
        self.rester_h = v("hooks.rester_height")
        self.wire = v("hooks.wire_diameter")
        self.pitch = v("hooks.pitch_across_knives")
        self.first = v("hooks.first_from_needle_board")
        self.overhang = v("hooks.crook_overhang")
        self.tip_drop = v("hooks.crook_tip_drop")
        self.n_len = v("needles.length")
        self.n_loop = v("needles.head_to_loop")
        self.eye = v("needles.eye_length")
        self.n_wire = v("needles.wire_diameter")
        self.protrusion = v("needles.protrusion")
        self.tier = v("needles.tier_pitch")
        self.top_tier = v("needles.top_tier_height")
        self.box_inner = v("springs.box_inner_face")
        self.box_back = v("springs.box_back")
        self.coil = v("springs.coil_diameter")
        self.knife_h = v("griffe.knife_height")
        self.knife_t = v("griffe.knife_thickness")
        self.knife_gap = v("griffe.knife_to_hook_gap")
        self.rest_gap = v("griffe.rest_gap_under_crook")
        self.lift = v("griffe.lift")
        self.face = v("cylinder.face")
        self.card_t = v("cylinder.card_thickness")
        self.card_w = v("cylinder.card_width")
        self.hole_d = v("cylinder.hole_diameter")
        self.comber_t = v("harness.comber_board_thickness")
        self.lingo = v("harness.lingo_length")
        # derived, as in js/sim/head.js
        self.grate = self.rester_h
        self.crook_y = self.hook_h - self.wire / 2
        self.knife_top = self.hook_h - self.wire - self.rest_gap
        self.knife_right = -(self.wire / 2 + self.knife_gap)
        self.upper_bend = self.top_tier + UPPER_BEND_ABOVE_TOP_TIER
        self.tier_mid = self.needle_y((self.rows - 1) / 2)
        self.sy = v("machine_frame.section_y")
        self.sz = v("machine_frame.section_z")

    def hook_x(self, k):
        return self.first + k * self.pitch

    def needle_y(self, k):
        return self.top_tier - k * self.tier

    def m(self, x, y, dy=0.0):
        """A point of the 2D section (x, y) in the machine frame, dy along Y off the section."""
        return (x, self.sy + dy, self.sz + y)


# --- small helpers ---------------------------------------------------------------------------

def _world_location(obj):
    """An object's location in the scene (its parents are unrotated, as built here)."""
    loc = Vector(obj.location)
    p = obj.parent
    while p is not None:
        loc += Vector(p.location)
        p = p.parent
    return loc


def _parent(child, par):
    """bl.parent for parents that may already have parents of their own: the child keeps its
    place in the scene, its location becomes relative to the parent (no parent-inverse)."""
    world = _world_location(child)
    child.parent = par
    child.matrix_parent_inverse.identity()
    child.location = world - _world_location(par)


bl.parent = _parent

def collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def box(mb, x0, x1, y0, y1, z0, z1, mat):
    """An axis-aligned box (mm, node-local)."""
    mb.prism([(x0, z0), (x1, z0), (x1, z1), (x0, z1)], "XZ", y0, y1, mat)


def node(name, col, at, label=None):
    obj = bl.empty(name, col, at)
    if label:
        bl.set_labels(obj, label)
    return obj


def mesh_node(mb, name, col, at, label=None):
    obj = mb.build(name, col, at)
    if label:
        bl.set_labels(obj, label)
    return obj


def g_axis(v):
    """A Blender-frame direction as the glTF-frame direction the extras carry."""
    x, y, z = v
    return [x, z, -y]


def motion(obj, kind, label, **extra):
    obj["motion"] = kind
    obj["label_en"] = label
    for k, val in extra.items():
        obj[k] = val


def translate(obj, axis, label):
    motion(obj, "translate", label, axis=g_axis(axis), unit="mm")


def rotate(obj, axis, label):
    motion(obj, "rotate", label, axis=g_axis(axis), unit="deg")


def orient(obj, direction, up_hint=(0.0, 0.0, 1.0)):
    """Turn an object so its local +Z points along direction (Blender frame)."""
    z = Vector(direction).normalized()
    hint = Vector(up_hint)
    if abs(z.dot(hint)) > 0.99:
        hint = Vector((1.0, 0.0, 0.0)) if abs(z.x) < 0.9 else Vector((0.0, 1.0, 0.0))
    x = hint.cross(z).normalized()
    y = z.cross(x)
    rot = Matrix((x, y, z)).transposed()
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = rot.to_quaternion()
    return rot


def reach_piece(col, name, start, end, move_world, radius, mat, label, n=8, width=None):
    """A straight piece from start (fixed) to end (moving along move_world): the "reach" motion.

    The mesh runs along the node's local +Z from its origin (glTF +Y), length |end - start|;
    width: a flat strip that wide (local X) instead of a round wire."""
    a, b = Vector(start), Vector(end)
    length = (b - a).length
    mb = MeshBuilder()
    if width is None:
        bl.tube_path(mb, [(0.0, 0.0, 0.0), (0.0, 0.0, length)], radius, mat, n)
    else:
        w = width / 2
        box(mb, -w, w, -radius, radius, 0.0, length, mat)
    obj = mb.build(name, col, tuple(a))
    rot = orient(obj, b - a)
    mv = rot.transposed() @ Vector(move_world).normalized()
    motion(obj, "reach", label, length=length, move=g_axis(mv), unit="mm")
    bl.set_anchors(obj, "ends", [(0.0, 0.0, 0.0), (0.0, 0.0, length)])
    return obj


def ring(mb, centre, r_major, r_minor, mat, plane="XY", n_major=12, n_minor=6, stretch=0.0):
    """A torus-like wire loop (an eye, a mail's eye); stretch lengthens it along its first axis."""
    cx, cy, cz = centre
    base = len(mb.verts)
    mi = mb._mat(mat)
    for i in range(n_major):
        a = 2 * math.pi * i / n_major
        ca, sa = math.cos(a), math.sin(a)
        ex = stretch / 2 * (1 if ca >= 0 else -1)
        for j in range(n_minor):
            b = 2 * math.pi * j / n_minor
            r = r_major + r_minor * math.cos(b)
            u, w, t = ca * r + ex, sa * r, r_minor * math.sin(b)
            if plane == "XY":
                p = (cx + u, cy + w, cz + t)
            elif plane == "XZ":
                p = (cx + u, cy + t, cz + w)
            else:
                p = (cx + t, cy + u, cz + w)
            mb.verts.append(p)
    for i in range(n_major):
        for j in range(n_minor):
            i2, j2 = (i + 1) % n_major, (j + 1) % n_minor
            f = [base + i * n_minor + j, base + i2 * n_minor + j, base + i2 * n_minor + j2, base + i * n_minor + j2]
            # (u, w, t) -> (x, t, w) mirrors the loop, so its faces turn round to face out.
            mb._add(list(reversed(f)) if plane == "XZ" else f, mi, True)


def helix(mb, x0, x1, radius, wire, turns, mat):
    """A coil spring along local +Z from 0 to x1 - x0 (built along +Z, turned by its node)."""
    pts = []
    steps = int(turns * 6)
    length = x1 - x0
    for i in range(steps + 1):
        t = i / steps
        a = 2 * math.pi * turns * t
        pts.append((radius * math.cos(a), radius * math.sin(a), length * t))
    bl.tube_path(mb, pts, wire / 2, mat, 4)


def disc(mb, centre, normal_axis, r, mat, n=10, lift=0.15):
    """A flat round disc facing along normal_axis ("+X", "-X", "+Z", ...), lifted off its face."""
    cx, cy, cz = centre
    sign = 1.0 if normal_axis[0] == "+" else -1.0
    ax = normal_axis[1]
    mi = mb._mat(mat)
    base = len(mb.verts)
    ring_pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        u, w = r * math.cos(a), r * math.sin(a)
        if ax == "X":
            p = (cx + sign * lift, cy + u, cz + w)
        elif ax == "Y":
            p = (cx + u, cy + sign * lift, cz + w)
        else:
            p = (cx + u, cy + w, cz + sign * lift)
        ring_pts.append(p)
    mb.verts.extend(ring_pts)
    face = list(range(base, base + n))
    # Counter-clockwise seen from outside along the normal.
    flip = (ax == "X" and sign < 0) or (ax == "Y" and sign > 0) or (ax == "Z" and sign < 0)
    mb._add(list(reversed(face)) if flip else face, mi, False)


# --- U1 the selector --------------------------------------------------------------------------

def build_u1(p, H):
    """The selector: the 8 needles of one cross-row and their springs, one hook with its knife
    (on a parent that stands it at the followed hook's place in the row), slices of the boards,
    and a slice of the cylinder's face as long as the cylinder, which slides along it so the
    followed hook's column of the card is at the needles. The card on it is the learner's own,
    made by the page (js/scene/cards3d.js, FacingCard).

    In the head each hook passes through its own needle's eye and beside the other needles, so
    the needles run beside the hooks' line (at NEEDLE_DY), each looping round its own hook."""
    col = collection("u1")
    root = node("unit.selector", col, (0, 0, 0), "U1 · the selector: a cross-row's 8 needles, one hook and its knife")
    root["unit"] = "selector"
    d = p.v("units3d.slice_depth") / 2
    r = H.n_wire / 2
    ndy = needle_dy(H)
    root["needle_dy"] = ndy

    # The bottom board (the grate the hooks stand on), the needle board, the spring box: slices.
    mb = MeshBuilder()
    box(mb, H.hook_x(0) - 34, H.hook_x(H.rows - 1) + 26, -d, d, -H.board_t, 0.0, "oak")
    o = mesh_node(mb, "head.bottom_board", col, H.m(0, 0), "bottom board (a slice): the hooks stand on it")
    bl.parent(o, root)
    mb = MeshBuilder()
    box(mb, 0.0, H.nb_t, -d, d, H.tier_mid - H.nb_h / 2, H.tier_mid + H.nb_h / 2, "beech")
    o = mesh_node(mb, "head.needle_board", col, H.m(0, 0), "needle board (a slice): the needle points stand out of it")
    # See-through, so the card's column it stands in front of can be read through it.
    o["translucent"] = 1
    o["opacity"] = 0.3
    bl.parent(o, root)
    mb = MeshBuilder()
    top, bot = H.needle_y(0) + 12, H.needle_y(H.rows - 1) - 12
    box(mb, H.box_back, H.box_back + 8, -d, d, bot, top, "oak")
    box(mb, H.box_inner, H.box_back + 8, -d, d, top, top + 6, "oak")
    box(mb, H.box_inner, H.box_back + 8, -d, d, bot - 6, bot, "oak")
    o = mesh_node(mb, "springs.box", col, H.m(0, 0), "spring box (a slice): each needle's spring bears on its back")
    bl.parent(o, root)

    # The 8 needles, one per row of the card's column: point, eye round its own hook (each at
    # its hook's place, the top needle's nearest the board), rear loop over its spring.
    head_x = -H.protrusion
    tail_x = head_x + H.n_len
    eye_half = H.eye / 2
    loop_len = H.n_len - H.n_loop
    rest_len = H.box_back - tail_x
    for k in range(H.rows):
        ny = H.needle_y(k)
        eye_c = H.hook_x(k)
        R = H.wire / 2 + 1.0 + r
        stretch = H.eye - H.wire - 2.0
        mb = MeshBuilder()
        bl.tube_path(mb, [(head_x, ndy, ny), (eye_c - stretch / 2, ndy, ny)], r, "steel_wire", 6)
        ring(mb, (eye_c, 0.0, ny), R, r, "steel_wire", "XY", 12, 4, stretch=stretch)
        bl.tube_path(mb, [(eye_c + stretch / 2, ndy, ny), (head_x + H.n_loop, ndy, ny)], r, "steel_wire", 6)
        ring(mb, (head_x + H.n_loop + loop_len / 2, ndy, ny), 2.5, r, "steel_wire", "XY", 10, 4, stretch=loop_len - 5.0 - 2 * r)
        needle = mesh_node(mb, f"needles.needle.{k}", col, H.m(0, 0))
        translate(needle, (1, 0, 0), f"needle {k + 1} of the cross-row (row {k + 1} of the card): a blank pushes it back, and its eye pushes its hook")
        bl.set_anchors(needle, "point", [(head_x, ndy, ny)])
        bl.set_anchors(needle, "eye", [(eye_c, 0.0, ny)])
        bl.set_anchors(needle, "tail", [(tail_x, ndy, ny)])
        bl.parent(needle, root)
        mb = MeshBuilder()
        helix(mb, 0.0, rest_len, H.coil / 2, 0.7, 9, "spring_steel")
        spring = mb.build(f"springs.spring.{k}", col, H.m(H.box_back, ny, ndy))
        orient(spring, (-1.0, 0.0, 0.0))
        motion(spring, "stretch", f"spring of needle {k + 1}: pushes it back out when the card lets it go", length=rest_len, unit="mm")
        bl.set_anchors(spring, "free_end", [(0.0, 0.0, rest_len)])
        bl.parent(spring, root)

    # The followed hook and its knife, stood at the followed hook's place in the row.
    row = node("selector.row", col, H.m(0, 0))
    translate(row, (1, 0, 0), "the followed hook's place in the cross-row")
    bl.parent(row, root)
    build_hook(col, row, H, 0, 0.0)
    # The knife at its full length: it runs the depth of the head, under this row's hook in
    # every cross-row (as U3's knives do).
    mb = MeshBuilder()
    kx1 = H.hook_x(0) + H.knife_right
    kl = p.v("units3d.knife_length") / 2
    box(mb, kx1 - H.knife_t, kx1, -kl, kl, H.knife_top - H.knife_h, H.knife_top, "iron")
    knife = mesh_node(mb, "griffe.knife.0", col, H.m(0, 0))
    translate(knife, (0, 0, 1), "knife (one per row of hooks): it runs the depth of the head, under this row's hook in every cross-row, and rises with the griffe, lifting the hooks left over it")
    bl.set_anchors(knife, "top", [(kx1 - H.knife_t / 2, 0.0, H.knife_top), (kx1, 0.0, H.knife_top)])
    bl.parent(knife, row)

    # The cylinder's face (a slice the cylinder's length), sliding along the cylinder so that
    # the followed hook's column is at the needles; the page lays the card on it.
    half = H.face / 2
    L = p.v("units3d.face_slice_length")
    face = node("cylinder.face", col, H.m(0, 0))
    translate(face, (-1, 0, 0), "the card cylinder's face, with the card on it")
    bl.parent(face, root)
    column = node("cylinder.column", col, H.m(0.0, H.tier_mid, ndy))
    translate(column, (0, 1, 0), "the card's column for the followed hook's cross-row, brought to the needles")
    column["column_pitch"] = COLUMN_PITCH
    bl.set_anchors(column, "first_column", [(0.0, 0.0, 0.0)])
    bl.parent(column, face)
    mb = MeshBuilder()
    yc = 3.5 * COLUMN_PITCH
    box(mb, -H.card_t - H.face, -H.card_t, yc - L / 2, yc + L / 2, -half, half, "beech")
    for c in range(8):
        for k in range(H.rows):
            disc(mb, (-H.card_t, c * COLUMN_PITCH, H.needle_y(k) - H.tier_mid), "+X", H.hole_d / 2 - 1.0, "bore", 10, 0.05)
    o = mesh_node(mb, "cylinder.face_block", col, H.m(0.0, H.tier_mid, ndy), "the card cylinder's face: a bore under every hole of the card")
    bl.parent(o, column)
    return root


def needle_dy(H):
    """Where the needles run, off the hooks' line along Y (mm): beside the hooks, clear by 1 mm,
    each looping round its own hook (js/scene/units.js, NEEDLE_DY)."""
    return -(H.wire / 2 + 1.0 + H.n_wire / 2)


def build_hook(col, root, H, k, dy, suffix="0", label_extra=""):
    """The jointed hook k of the section, at dy off the section along Y.

    hooks.hook.N        translate Z (lift): the foot, the rester leg and the shank up to the grate
      .bend             reach (shift): the bend above the grate, to the shifted upper part
      .upper            translate X (shift): the shank past the needles
        .top            reach (deflect): the bend above the top needle, held aside by a knife
        .crook          translate X (deflect): the crook over the knife and its tip
    """
    x = H.hook_x(k)
    r = H.wire / 2
    name = f"hooks.hook.{suffix}"
    hook = MeshBuilder()
    bl.tube_path(hook, [(0.0, 0.0, 0.0), (0.0, 0.0, H.grate)], r, "steel_wire", 6)
    bl.tube_path(hook, [(0.0, 0.0, 0.0), (RESTER_OFFSET, 0.0, 0.0), (RESTER_OFFSET, 0.0, H.rester_h)], r, "steel_wire", 6)
    h = mesh_node(hook, name, col, H.m(x, 0.0, dy))
    translate(h, (0, 0, 1), f"hook{label_extra}: lifted by its knife when its needle found a hole")
    bl.set_anchors(h, "foot", [(0.0, 0.0, 0.0)])
    bl.parent(h, root)

    bend = reach_piece(col, f"{name}.bend", H.m(x, H.grate, dy), H.m(x, H.grate + BEND, dy), (1, 0, 0), r, "steel_wire", "the hook's bend above the grate: the needle pushes the upper part aside", 6)
    bl.parent(bend, h)

    up = MeshBuilder()
    bl.tube_path(up, [(0.0, 0.0, 0.0), (0.0, 0.0, H.upper_bend - H.grate - BEND)], r, "steel_wire", 6)
    upper = mesh_node(up, f"{name}.upper", col, H.m(x, H.grate + BEND, dy))
    translate(upper, (1, 0, 0), "the hook's upper part: pushed aside by its needle's eye")
    bl.set_anchors(upper, "at_needle", [(0.0, 0.0, H.needle_y(k) - H.grate - BEND)])
    bl.parent(upper, h)

    top = reach_piece(col, f"{name}.top", H.m(x, H.upper_bend, dy), H.m(x, H.crook_y, dy), (1, 0, 0), r, "steel_wire", "the hook's top: a knife passing it bends it aside", 6)
    bl.parent(top, upper)

    cr = MeshBuilder()
    bl.tube_path(cr, [(0.0, 0.0, 0.0), (-H.overhang, 0.0, 0.0), (-H.overhang, 0.0, -H.tip_drop)], r, "steel_wire", 6)
    crook = mesh_node(cr, f"{name}.crook", col, H.m(x, H.crook_y, dy))
    translate(crook, (1, 0, 0), "the crook: a rising knife catches under it")
    bl.set_anchors(crook, "underside", [(-H.overhang + 0.5, 0.0, -r), (-0.5, 0.0, -r)])
    bl.set_anchors(crook, "tip", [(-H.overhang, 0.0, -H.tip_drop - r)])
    bl.parent(crook, upper)
    return h


# --- U2 the card cylinder ---------------------------------------------------------------------

def build_u2(p, H):
    col = collection("u2")
    root = node("unit.cylinder", col, (0, 0, 0), "U2 · the card cylinder: it turns the chain on, card by card")
    root["unit"] = "cylinder"
    half = H.face / 2
    cx = -H.card_t - half
    cz = H.tier_mid
    L = p.v("units3d.prism_length")
    lh = p.v("units3d.lantern_half")
    centre = H.m(cx, cz)

    batten = node("cylinder.batten", col, centre)
    translate(batten, (-1, 0, 0), "the cylinder's batten: it carries the cylinder out from the needles and back")
    bl.parent(batten, root)
    # Two iron arms up from the axle's ends, joined by a bar; the axle.
    mb = MeshBuilder()
    for s in (-1, 1):
        y = s * (L / 2 + 14)
        box(mb, -6, 6, y - 4, y + 4, -8, 260, "iron")
    box(mb, -6, 6, -L / 2 - 18, L / 2 + 18, 250, 262, "iron")
    bl.tube_path(mb, [(0.0, -L / 2 - 18, 0.0), (0.0, L / 2 + 62, 0.0)], 5.0, "iron", 10)
    o = mesh_node(mb, "cylinder.frame", col, centre, "the batten's arms and the cylinder's axle")
    bl.parent(o, batten)

    prism = node("cylinder.prism", col, centre)
    rotate(prism, (0, -1, 0), "the cylinder (a square prism): a quarter turn brings the next card to the needles")
    bl.parent(prism, batten)
    mb = MeshBuilder()
    box(mb, -half, half, -L / 2, L / 2, -half, half, "beech")
    # The bores: 8 rows (one per needle tier) by a column for each of the reference head's 52
    # cross-rows, on each of the four faces, small and faint (as in the 2D section), so they
    # cannot pass for a card's holes. The learner's card lies on the middle columns (columns
    # 22 on: js/scene/cards3d.js), and the page puts the pegs at its peg holes.
    cols = int(p.v("reference_head.cross_rows"))
    rows_z = [H.needle_y(kk) - cz for kk in range(H.rows)]
    ys = [(c - (cols - 1) / 2) * COLUMN_PITCH for c in range(cols)]
    for u in rows_z:
        for y in ys:
            disc(mb, (half, y, u), "+X", H.hole_d / 2 - 1.0, "bore", 6, 0.05)
            disc(mb, (-half, y, u), "-X", H.hole_d / 2 - 1.0, "bore", 6, 0.05)
            disc(mb, (u, y, half), "+Z", H.hole_d / 2 - 1.0, "bore", 6, 0.05)
            disc(mb, (u, y, -half), "-Z", H.hole_d / 2 - 1.0, "bore", 6, 0.05)
    o = mesh_node(mb, "cylinder.block", col, centre, "the cylinder's faces: a bore under every hole of a 400 card")
    bl.parent(o, prism)
    # The lantern: a square plate with four pins at the cylinder's end, which the catches turn.
    mb = MeshBuilder()
    ly0, ly1 = L / 2 + 4, L / 2 + 14
    box(mb, -lh, lh, ly0, ly1, -lh, lh, "brass")
    for sx, sz in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        bl.tube_path(mb, [(sx * (lh - 6), ly1, sz * (lh - 6)), (sx * (lh - 6), ly1 + 14, sz * (lh - 6))], 3.0, "brass", 8)
    o = mesh_node(mb, "cylinder.lantern", col, centre, "the lantern: a catch takes one of its pins and turns the cylinder a quarter")
    bl.parent(o, prism)

    # The spring hammer: pivoted on the batten, pressing the lantern's bottom flat from below
    # (Posselt Fig. X); a turning corner pushes it down.
    arm = p.v("units3d.hammer_arm")
    piv = (cx + arm, H.sy + L / 2 + 9, H.sz + cz - lh)
    hammer = node("cylinder.hammer", col, piv)
    rotate(hammer, (0, -1, 0), "the spring hammer: pressing from below, it squares the lantern after each turn")
    mb = MeshBuilder()
    box(mb, -arm - 4, 0.0, -5, 5, -8, 0.0, "iron")
    box(mb, -arm - lh * 1.1, -arm + lh * 1.1, -6, 6, -3, 0.0, "iron")
    o = mb.build("cylinder.hammer_mesh", col, piv)
    bl.parent(o, hammer)
    bl.set_anchors(hammer, "face", [(-arm - lh * 1.1, 0.0, 0.0), (-arm + lh * 1.1, 0.0, 0.0)])
    bl.parent(hammer, batten)
    bl.set_anchors(batten, "lantern_centre", [(0.0, L / 2 + 9, 0.0)])

    # The catches, fixed to the head: as the batten moves out, one takes a lantern pin.
    # Posselt Fig. I: the forward catch turns "the card situated on its top towards the
    # needle-board"; the other brings back "the card hanging below".
    for name, sz, label in (("cylinder.catch_top", 1, "the upper catch: as the batten moves out it takes a lantern pin and turns the cylinder forward, bringing the card on top to the needles"),
                            ("cylinder.catch_bottom", -1, "the lower catch: put in by the reverse cord, it turns the cylinder back, bringing the card hanging below to the needles")):
        mb = MeshBuilder()
        y = H.sy + L / 2 + 26
        zc = H.sz + cz + sz * (lh + 10)
        box(mb, cx - 70, cx + 40, y - 3, y + 3, zc - 4, zc + 4, "iron")
        box(mb, cx - 70, cx - 62, y - 3, y + 3, zc - 4 - sz * 10, zc + 4, "iron")
        o = mesh_node(mb, name, col, (0, 0, 0), label)
        bl.parent(o, root)
    return root


# --- U3 the griffe and the lift ---------------------------------------------------------------

def build_u3(p, H):
    col = collection("u3")
    root = node("unit.griffe", col, (0, 0, 0), "U3 · the griffe and the lift: the weaver's foot lifts every chosen hook")
    root["unit"] = "griffe"
    kl = p.v("units3d.knife_length") / 2
    gx0 = H.hook_x(0) - 24
    gx1 = H.hook_x(H.rows - 1) + 14
    gy0 = H.knife_top - H.knife_h - 10
    gy1 = gy0 + H.knife_h + 16
    xp = (gx0 + gx1) / 2

    frame = node("griffe.frame", col, H.m(0, 0))
    translate(frame, (0, 0, 1), "the griffe: a frame of 8 knives, lifted for every pick")
    mb = MeshBuilder()
    for k in range(H.rows):
        x1 = H.hook_x(k) + H.knife_right
        box(mb, x1 - H.knife_t, x1, -kl, kl, H.knife_top - H.knife_h, H.knife_top, "iron")
    for s in (-1, 1):
        box(mb, gx0, gx1, s * kl - 5, s * kl + 5, gy0, gy1, "iron")
    o = mesh_node(mb, "griffe.knives", col, H.m(0, 0), "the knives: each runs the depth of the head, under one row of hooks")
    bl.set_anchors(o, "knife_tops", [(H.hook_x(k) + H.knife_right - H.knife_t / 2, 0.0, H.knife_top) for k in range(H.rows)])
    bl.parent(o, frame)
    mb = MeshBuilder()
    bl.tube_path(mb, [(xp, -kl, gy1), (xp, kl, gy1)], 6.0, "iron", 8)
    bl.tube_path(mb, [(xp, 0.0, gy1), (xp, 0.0, gy1 + 90)], 9.5, "iron", 10)
    o = mesh_node(mb, "griffe.plunger", col, H.m(0, 0), "the plunger: the head lever lifts the griffe by it")
    bl.set_anchors(o, "top", [(xp, 0.0, gy1 + 90)])
    bl.parent(o, frame)
    bl.parent(frame, root)

    piv_y, piv_z = p.v("units3d.lever_pivot")
    arm = p.v("units3d.lever_arm")
    plunger_top_z = H.sz + gy1 + 90
    rod = MeshBuilder()
    bl.tube_path(rod, [(0.0, 0.0, 0.0), (0.0, 0.0, piv_z - plunger_top_z)], 4.0, "iron", 8)
    o = mesh_node(rod, "lift.rod", col, (xp, H.sy, plunger_top_z))
    translate(o, (0, 0, 1), "the rod from the lever to the plunger")
    bl.set_anchors(o, "ends", [(0.0, 0.0, 0.0), (0.0, 0.0, piv_z - plunger_top_z)])
    bl.parent(o, root)

    lever = node("lift.head_lever", col, (xp, piv_y, piv_z))
    rotate(lever, (1, 0, 0), "the head lever: its back arm lifts the griffe as its front arm is pulled down")
    mb = MeshBuilder()
    box(mb, -7, 7, -arm - 14, arm + 14, -9, 9, "iron")
    bl.tube_path(mb, [(-16.0, 0.0, 0.0), (16.0, 0.0, 0.0)], 8.0, "iron", 10)
    o = mb.build("lift.head_lever_mesh", col, (xp, piv_y, piv_z))
    bl.parent(o, lever)
    bl.set_anchors(lever, "ends", [(0.0, arm, 0.0), (0.0, -arm, 0.0)])
    bl.parent(lever, root)

    ty, tz = p.v("units3d.treadle_pivot")
    cy, cz = p.v("units3d.treadle_cord")
    foot_y = p.v("units3d.treadle_foot_y")
    cord_top = (xp, piv_y - arm, piv_z)
    cord_bottom = (xp, cy, cz)
    cord = reach_piece(col, "lift.cord", cord_bottom, cord_top, (0, 0, 1), 2.0, "cord", "the lift cord, from the treadle to the head lever", 6)
    cord["motion"] = "segment"
    bl.parent(cord, root)

    treadle = node("lift.treadle", col, (xp, ty, tz))
    rotate(treadle, (1, 0, 0), "the treadle: the weaver presses it down for every pick")
    mb = MeshBuilder()
    u = Vector((0.0, cy - ty, cz - tz)).normalized()
    length = (foot_y - ty) / u.y
    box(mb, -30.0, 30.0, -15.0, 15.0, -20.0, length, "oak")
    o = mb.build("lift.treadle_mesh", col, (xp, ty, tz))
    orient(o, u)
    bl.parent(o, treadle)
    bl.set_anchors(treadle, "cord", [(0.0, cy - ty, cz - tz)])
    bl.parent(treadle, root)
    root["plunger_x"] = xp
    return root


# --- U4 the harness line ----------------------------------------------------------------------

def build_u4(p, H):
    col = collection("u4")
    root = node("unit.harness", col, (0, 0, 0), "U4 · the harness line: one hook lifts its warp end in every repeat")
    root["unit"] = "harness"
    x = H.hook_x(0)
    foot_z = H.sz
    knot_z = p.v("machine_frame.harness_knot_z")
    comber_z = p.v("machine_frame.comber_z")
    warp_z = p.v("machine_frame.warp_z")
    spacing = p.v("machine_frame.repeat_spacing")
    fell_y = p.v("machine_frame.fell_y")
    back_y = p.v("machine_frame.back_rest_y")
    centre_x = (H.hook_x(0) + H.hook_x(H.rows - 1)) / 2
    xs = [centre_x - spacing / 2, centre_x + spacing / 2]
    d = p.v("units3d.slice_depth") / 2

    mb = MeshBuilder()
    bl.tube_path(mb, [(0.0, 0.0, 0.0), (0.0, 0.0, knot_z - foot_z)], 1.0, "cord", 6)
    neck = mesh_node(mb, "harness.neck_cord.0", col, (x, H.sy, foot_z))
    translate(neck, (0, 0, 1), "the neck cord: tied to the hook's foot, it rises with the hook")
    bl.set_anchors(neck, "ends", [(0.0, 0.0, 0.0), (0.0, 0.0, knot_z - foot_z)])
    bl.parent(neck, root)

    mb = MeshBuilder()
    box(mb, xs[0] - 60, xs[1] + 60, H.sy - d, H.sy + d, comber_z - H.comber_t, comber_z, "oak")
    o = mesh_node(mb, "harness.comber_board", col, (0, 0, 0), "the comber board (a slice): its holes spread the cords across the warp")
    bl.parent(o, root)

    mail_h = 14.0
    for i, xr in enumerate(xs, start=1):
        up = reach_piece(col, f"harness.cord.0.{i}.upper", (xr, H.sy, comber_z), (x, H.sy, knot_z), (0, 0, 1), 0.8, "cord", f"harness cord, repeat {i}: from the neck cord down through the comber board", 6)
        bl.parent(up, root)
        low = reach_piece(col, f"harness.cord.0.{i}.lower", (xr, H.sy, comber_z), (xr, H.sy, warp_z + mail_h / 2), (0, 0, 1), 0.8, "cord", f"harness cord, repeat {i}: down to its mail", 6)
        bl.parent(low, root)
        mb = MeshBuilder()
        box(mb, -2.5, 2.5, -0.8, 0.8, -mail_h / 2, mail_h / 2, "brass")
        ring(mb, (0.0, 0.0, 0.0), 2.2, 0.6, "brass", "XZ", 10, 4)
        mail = mesh_node(mb, f"harness.mail.0.{i}", col, (xr, H.sy, warp_z))
        translate(mail, (0, 0, 1), f"mail, repeat {i}: its eye holds one warp end")
        bl.set_anchors(mail, "eye", [(0.0, 0.0, 0.0)])
        bl.parent(mail, root)
        mb = MeshBuilder()
        bl.tube_path(mb, [(0.0, 0.0, -mail_h / 2), (0.0, 0.0, -mail_h / 2 - 40)], 0.6, "cord", 5)
        bl.tube_path(mb, [(0.0, 0.0, -mail_h / 2 - 40), (0.0, 0.0, -mail_h / 2 - 40 - H.lingo)], 1.6, "lead", 8)
        lingo = mesh_node(mb, f"harness.lingo.0.{i}", col, (xr, H.sy, warp_z))
        translate(lingo, (0, 0, 1), f"lingo, repeat {i}: its weight pulls the end back down")
        bl.set_anchors(lingo, "top", [(0.0, 0.0, -mail_h / 2)])
        bl.parent(lingo, root)
        for part, y0 in (("back", back_y), ("front", fell_y)):
            e = reach_piece(col, f"warp.end.0.{i}.{part}", (xr, y0, warp_z), (xr, H.sy, warp_z), (0, 0, 1), 0.5, "warp_silk", f"warp end, repeat {i}", 5)
            bl.parent(e, root)
    root["repeat_x"] = xs
    return root


# --- U5 the shed, the shuttle and the batten --------------------------------------------------

def build_u5(p, H):
    col = collection("u5")
    root = node("unit.shed", col, (0, 0, 0), "U5 · the shed, the shuttle and the batten")
    root["unit"] = "shed"
    warp_z = p.v("machine_frame.warp_z")
    fell_y = p.v("machine_frame.fell_y")
    back_y = p.v("machine_frame.back_rest_y")
    centre_x = (H.hook_x(0) + H.hook_x(H.rows - 1)) / 2
    half_w = 220.0
    reed_rest = p.v("units3d.reed_rest_y")
    piv_y, piv_z = p.v("units3d.batten_pivot")
    sl, sw, sh = p.v("units3d.shuttle")
    tr0, tr1 = p.v("units3d.shuttle_travel")

    # A lowered end and a raised one; the lower sheet, flat; the upper sheet, lifted at the mails.
    e = MeshBuilder()
    bl.tube_path(e, [(centre_x + 6, fell_y, warp_z), (centre_x + 6, back_y, warp_z)], 0.8, "warp_silk", 6)
    o = mesh_node(e, "warp.end.down", col, (0, 0, 0), "a warp end left down: the weft passes over it")
    bl.parent(o, root)
    for part, y0 in (("back", back_y), ("front", fell_y)):
        up = reach_piece(col, f"warp.end.up.{part}", (centre_x - 6, y0, warp_z), (centre_x - 6, H.sy, warp_z), (0, 0, 1), 0.8, "warp_silk", "a warp end lifted: the weft passes under it", 6)
        bl.parent(up, root)
    mb = MeshBuilder()
    box(mb, centre_x - half_w, centre_x + half_w, fell_y, back_y, warp_z - 0.6, warp_z - 0.4, "sheet_glass")
    o = mesh_node(mb, "warp.sheet.lower", col, (0, 0, 0), "the lower sheet of the shed: every end not lifted")
    o["translucent"] = 1
    bl.parent(o, root)
    for part, y0 in (("back", back_y), ("front", fell_y)):
        sheet = reach_piece(col, f"warp.sheet.upper.{part}", (centre_x, y0, warp_z), (centre_x, H.sy, warp_z), (0, 0, 1), 0.1, "sheet_glass", "the upper sheet of the shed: every end lifted", width=2 * half_w)
        sheet["translucent"] = 1
        bl.parent(sheet, root)

    # The batten: swords hung from the pivot, the race, the reed and its cap. Drawn as sliding
    # front to back (as in the 2D side view): the swords reach from the pivot to the race.
    batten = node("batten.frame", col, (centre_x, reed_rest, warp_z))
    translate(batten, (0, 1, 0), "the batten: back for the shuttle, then forward to beat the weft into the cloth")
    bl.parent(batten, root)
    mb = MeshBuilder()
    race_w = 2 * (max(abs(tr0), abs(tr1)) + sl / 2 + 10)   # the race carries both shuttle boxes
    # race board: in front of the reed (toward the cloth), its top just under the warp line
    box(mb, -race_w / 2, race_w / 2, -70, 6, -32, -2, "oak")
    box(mb, -race_w / 2, race_w / 2, -6, 6, H.lift + 60, H.lift + 80, "oak")
    o = mesh_node(mb, "batten.race", col, (centre_x, reed_rest, warp_z), "the batten's race and cap: the shuttle runs on the race")
    bl.set_anchors(o, "race_top", [(0.0, -35.0, -2.0)])
    bl.parent(o, batten)
    mb = MeshBuilder()
    for i in range(int(2 * half_w / 12) + 1):
        xx = -half_w + i * 12
        box(mb, xx - 0.4, xx + 0.4, -1.5, 1.5, -2, H.lift + 60, "reed_steel")
    box(mb, -half_w, half_w, -2, 2, -4, -1, "reed_steel")
    reed = mesh_node(mb, "batten.reed", col, (centre_x, reed_rest, warp_z), "the reed: its dents keep the ends apart, and its face beats each pick")
    bl.set_anchors(reed, "face", [(0.0, -1.5, 0.0)])
    bl.parent(reed, batten)
    for s in (-1, 1):
        sx = centre_x + s * (race_w / 2 - 20)
        sword = reach_piece(col, f"batten.sword.{'left' if s < 0 else 'right'}", (sx, piv_y, piv_z), (sx, reed_rest - 20, warp_z - 32), (0, 1, 0), 9.0, "oak", "the batten's sword: it hangs from the pivot above", 8)
        bl.parent(sword, root)

    # The shuttle: on the race, against the reed's face, riding on the lower warp.
    mb = MeshBuilder()
    half_l = sl / 2
    prof = []
    for i in range(13):
        t = -1 + 2 * i / 12
        w = sw / 2 * math.sqrt(max(0.0, 1 - t ** 8))
        prof.append((t * half_l, w))
    top_pts = prof + [(x_, -w_) for x_, w_ in reversed(prof)]
    mb.prism([(x_, w_) for x_, w_ in top_pts], "XY", 0.0, sh, "shuttle_wood")
    box(mb, -half_l * 0.35, half_l * 0.35, -sw / 2 + 4, sw / 2 - 4, sh - 0.5, sh + 0.1, "weft_silk")
    shuttle_y = reed_rest - 4 - sw / 2
    shuttle = mesh_node(mb, "shuttle.body", col, (centre_x + tr0, shuttle_y, warp_z + 1.0))
    translate(shuttle, (1, 0, 0), "the shuttle: thrown across through the shed, it lays the weft")
    bl.set_anchors(shuttle, "box", [(-half_l, -sw / 2, 0.0), (half_l, sw / 2, sh)])
    bl.parent(shuttle, batten)
    root["warp_x"] = [centre_x - half_w, centre_x + half_w]
    return root


# --- the ghosted whole machine (M4) -------------------------------------------------------------

def ghost(obj, opacity, label=None):
    obj["translucent"] = 1
    obj["opacity"] = opacity
    if label:
        bl.set_labels(obj, label)
    return obj


def build_context(p, H):
    """The loom's shell, low-poly, translucent on the page, at the research's overall sizes (the
    Science Museum's silk hand loom 1914-469; members estimated), with the units' places inside
    it and a translucent band wherever the real machine repeats a unit, with its count."""
    col = collection("context")
    root = node("context", col, (0, 0, 0), "the loom (ghosted): frame, beams and the head's housing, estimated sizes")
    root["unit"] = "context"
    v = p.v
    cx = (H.hook_x(0) + H.hook_x(H.rows - 1)) / 2
    W = v("machine_frame.frame_width")
    top = v("machine_frame.frame_height")
    y0, y1 = v("machine_frame.frame_posts_y")
    warp_z = v("machine_frame.warp_z")
    fell = v("machine_frame.fell_y")
    back = v("machine_frame.back_rest_y")
    ww = v("machine_frame.warp_width")
    comber_z = v("machine_frame.comber_z")
    sy, sz = H.sy, H.sz
    xl, xr = cx - W / 2, cx + W / 2

    mb = MeshBuilder()
    for x in (xl + 30, xr - 30):
        for y in (y0, y1):
            box(mb, x - 30, x + 30, y - 30, y + 30, 0.0, top, "ghost")
        box(mb, x - 30, x + 30, y0 - 30, y1 + 30, top - 50, top, "ghost")       # top side rails
        box(mb, x - 30, x + 30, y0 - 30, y1 + 30, 280, 330, "ghost")            # lower side rails
    for y in (y0, y1):
        box(mb, xl, xr, y - 30, y + 30, top - 50, top, "ghost")                  # top cross rails
    for y in (sy - 170, sy + 170):
        box(mb, xl, xr, y - 25, y + 25, sz - H.board_t - 50, sz - H.board_t, "ghost")  # the head's bearers
    o = ghost(mesh_node(mb, "loom.frame", col, (0, 0, 0)), 0.16, "the loom's frame (estimated): posts, rails, and the bearers the head stands on")
    bl.parent(o, root)

    # The head's housing over its hooks, needles and springs: the reference 400 head, 52
    # cross-rows deep (Posselt's parts, as Nelson extends them).
    rows = int(v("reference_head.cross_rows"))
    depth = rows * COLUMN_PITCH / 2            # half the hook block's depth along Y
    hd = depth + 40
    mb = MeshBuilder()
    hx0, hx1 = -20.0, H.box_back + 30
    hz0, hz1 = sz - H.board_t, sz + H.hook_h + H.lift + 40
    for y in (sy - hd, sy + hd):
        box(mb, hx0, hx1, y - 8, y + 8, hz0, hz1, "ghost")
    box(mb, hx0, hx1, sy - hd - 8, sy + hd + 8, hz1, hz1 + 16, "ghost")
    box(mb, hx0 + 20, hx1, sy - hd, sy + hd, hz0, hz0 + H.board_t, "ghost")   # the bottom board, whole
    o = ghost(mesh_node(mb, "head.housing", col, (0, 0, 0)), 0.14, "the Jacquard head (ghosted): a 400 head, 52 cross-rows of 8, from Posselt's parts")
    bl.parent(o, root)

    # The head's own frame, standing on the loom's bearers up to the loom's catalogued height,
    # with the head lever's standard.
    top_z = v("reference_head.frame_height")
    fx0, fx1 = hx0 - 70, hx1 + 70
    fy = hd + 60
    mb = MeshBuilder()
    for x in (fx0, fx1):
        for y in (sy - fy, sy + fy):
            box(mb, x - 25, x + 25, y - 25, y + 25, sz - H.board_t - 50, top_z, "ghost")
        box(mb, x - 25, x + 25, sy - fy - 25, sy + fy + 25, top_z - 50, top_z, "ghost")
    for y in (sy - fy, sy + fy):
        box(mb, fx0 - 25, fx1 + 25, y - 25, y + 25, top_z - 50, top_z, "ghost")
    o = ghost(mesh_node(mb, "head.frame", col, (0, 0, 0)), 0.14, "the head's frame (estimated): it stands on the loom and carries the head, the lever and the cylinder's swing")
    bl.parent(o, root)

    # The card rack: the chain runs off the cylinder's outer side down a sloping rack of
    # guiding bars, out past the loom's side, and hangs there (Posselt Fig. XVII).
    card_l = v("reference_head.card_length")
    rx1, rz1 = v("reference_head.rack_end")
    rx0, rz0 = -H.card_t - H.face - v("cylinder.travel_out") - 40, sz + H.tier_mid - H.face / 2 - 30
    ry = card_l / 2 + 25
    mb = MeshBuilder()
    for y in (sy - ry, sy + ry):
        bl.tube_path(mb, [(rx0, y, rz0), (rx1, y, rz1)], 14.0, "ghost", 6)
    steps = 6
    for i in range(steps + 1):
        t = i / steps
        bl.tube_path(mb, [(rx0 + (rx1 - rx0) * t, sy - ry, rz0 + (rz1 - rz0) * t), (rx0 + (rx1 - rx0) * t, sy + ry, rz0 + (rz1 - rz0) * t)], 9.0, "ghost", 6)
    o = ghost(mesh_node(mb, "loom.card_rack", col, (0, 0, 0)), 0.2, "the card rack (estimated): it guides the chain to and from the cylinder")
    bl.parent(o, root)
    mb = MeshBuilder()
    d2 = card_l / 2
    run = math.hypot(rx1 - rx0, rz1 - rz0)
    ux, uz = (rx1 - rx0) / run, (rz1 - rz0) / run
    # The chain: a strip of cards on the rack, then hanging below its end.
    lift = 22.0
    mb.prism([(rx0 - uz * lift, rz0 + ux * lift), (rx1 - uz * lift, rz1 + ux * lift), (rx1 - uz * (lift + 2), rz1 + ux * (lift + 2)), (rx0 - uz * (lift + 2), rz0 + ux * (lift + 2))], "XZ", sy - d2, sy + d2, "card")
    hx = rx1 - uz * lift - 30
    mb.prism([(hx - 2, rz1 - 900), (hx, rz1 - 900), (hx, rz1), (hx - 2, rz1)], "XZ", sy - d2, sy + d2, "card")
    o = ghost(mesh_node(mb, "loom.card_chain", col, (0, 0, 0)), 0.3, "the card chain (ghosted): hundreds of cards laced in a loop, run over the rack and hanging beside the loom")
    bl.parent(o, root)

    mb = MeshBuilder()
    box(mb, cx - ww / 2 - 40, cx + ww / 2 + 40, sy - 90, sy + 90, comber_z - H.comber_t, comber_z, "ghost")
    o = ghost(mesh_node(mb, "loom.comber_board", col, (0, 0, 0)), 0.2, "the comber board, the warp's whole width")
    bl.parent(o, root)

    mb = MeshBuilder()
    box(mb, xl + 60, xr - 60, 220, 300, warp_z - 50, warp_z, "ghost")            # breast beam, the cloth passes over it
    bl.tube_path(mb, [(xl + 60, back, warp_z - 25), (xr - 60, back, warp_z - 25)], 25.0, "ghost", 10)   # back rest
    bl.tube_path(mb, [(xl + 60, 330, 500), (xr - 60, 330, 500)], 70.0, "ghost", 14)                    # cloth beam
    bl.tube_path(mb, [(xl + 60, 2480, 560), (xr - 60, 2480, 560)], 90.0, "ghost", 14)                  # warp beam
    o = ghost(mesh_node(mb, "loom.beams", col, (0, 0, 0)), 0.18, "the beams: breast beam and cloth beam in front, back rest and warp beam behind")
    bl.parent(o, root)

    mb = MeshBuilder()
    box(mb, cx - ww / 2, cx + ww / 2, 260, fell, warp_z - 0.5, warp_z + 0.5, "cloth")
    o = ghost(mesh_node(mb, "loom.cloth", col, (0, 0, 0)), 0.35, "the cloth woven so far, from the fell over the breast beam")
    bl.parent(o, root)

    # The repeat bands: where the real machine has many of what each unit shows one of.
    hooks = int(v("reference_head.hooks"))
    needles = rows * H.rows
    repeats = int(v("reference_head.repeats"))
    ends = hooks * repeats
    bands = [
        ("band.hooks", (H.hook_x(0) - 14, H.hook_x(H.rows - 1) + 14, sy - depth - 6, sy + depth + 6, sz - 4, sz + H.hook_h + H.lift + 6),
         f"{needles} hooks like U1's", f"{rows} cross-rows of 8 hooks, one hole of the card each ({hooks} working, 2 rows in reserve)", "selector"),
        ("band.needles", (-H.protrusion - 4, H.box_back + 10, sy - depth - 6, sy + depth + 6, sz + H.needle_y(H.rows - 1) - 10, sz + H.needle_y(0) + 10),
         f"{needles} needles and springs", f"one needle for every hook, 8 tiers deep, {rows} across", "selector"),
        ("band.harness", (cx - ww / 2, cx + ww / 2, sy - 90, sy + 90, warp_z - H.lingo - 70, comber_z),
         f"{ends:,} harness cords, mails and lingoes like U4's", f"one for every working hook in each of {repeats} repeats across the warp", "harness"),
        ("band.warp", (cx - ww / 2, cx + ww / 2, fell, back, warp_z - 6, warp_z + 100),
         f"{ends:,} warp ends like U5's", "each lifted, or left down, by its hook at every pick", "shed"),
    ]
    for name, (x0, x1, by0, by1, z0, z1), label, note, unit in bands:
        mb = MeshBuilder()
        box(mb, x0, x1, by0, by1, z0, z1, "band")
        o = ghost(mesh_node(mb, name, col, (0, 0, 0)), 0.1, label)
        o["band"] = 1
        o["note_en"] = note
        o["unit_ref"] = unit
        bl.set_anchors(o, "label_at", [((x0 + x1) / 2, (by0 + by1) / 2, z1)])
        bl.set_anchors(o, "box", [(x0, by0, z0), (x1, by1, z1)])
        bl.parent(o, root)
    bl.set_anchors(root, "extent", [(xl, y0 - 30, 0.0), (xr, y1 + 30, top)])
    return root


UNITS = (
    ("context.glb", build_context),
    ("u1-selector.glb", build_u1),
    ("u2-cylinder.glb", build_u2),
    ("u3-griffe.glb", build_u3),
    ("u4-harness.glb", build_u4),
    ("u5-shed.glb", build_u5),
)


def export(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_extras=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        **bl.EXPORT_IMAGES,
    )


def _args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = DEFAULT_OUT
    for i, a in enumerate(argv):
        if a == "--out":
            out = argv[i + 1]
    return out


if __name__ == "__main__":
    out = _args()
    p = params.load()
    for file, build in UNITS:
        bl.reset_scene()
        H = Head(p)
        build(p, H)
        export(os.path.join(out, file))
        tris = sum(sum(len(f.vertices) - 2 for f in o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
        print(f"UNIT_BUILD_OK {file} objects={len(bpy.data.objects)} triangles~{tris}")
