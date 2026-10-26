"""bpy helpers: scene reset, materials, and a mesh builder working in millimetres.

The materials are the loom's."""

import math

import bpy
from mathutils import Matrix, Vector

MM = 0.001  # Blender scene is in metres; all helper inputs are in mm.


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 1.0
    sc.unit_settings.length_unit = "MILLIMETERS"
    return sc


# --- materials -------------------------------------------------------------------

MATERIALS = {
    # name: (base colour, linear RGB; metallic; roughness; texture kind or None)
    # A guide only, read from museum photos of hand-loom heads (research/images): oak and
    # beech boards, steel wire, iron knives and frames, brass, pasteboard cards, linen cord.
    "oak": ((0.42, 0.25, 0.11), 0.0, 0.62, None),            # boards, frame, batten
    "beech": ((0.55, 0.36, 0.18), 0.0, 0.58, None),          # the cylinder, the needle board
    "steel_wire": ((0.62, 0.63, 0.65), 1.0, 0.32, None),     # hooks, needles
    "spring_steel": ((0.70, 0.55, 0.30), 1.0, 0.35, None),   # springs (brass-coloured, as drawn in 2D)
    "iron": ((0.10, 0.10, 0.11), 0.7, 0.48, None),           # knives, griffe, lever, catches, hammer
    "brass": ((0.80, 0.55, 0.22), 1.0, 0.30, None),          # mails, pegs, lantern
    "card": ((0.80, 0.66, 0.40), 0.0, 0.70, None),           # pasteboard
    "hole_dark": ((0.03, 0.02, 0.01), 0.0, 0.80, None),      # a punched hole, seen dark
    "bore": ((0.36, 0.22, 0.10), 0.0, 0.70, None),           # the cylinder's bores: faint, so they cannot pass for a card's holes
    "cord": ((0.72, 0.66, 0.52), 0.0, 0.85, None),           # linen harness and neck cords
    "lead": ((0.22, 0.23, 0.25), 0.8, 0.45, None),           # lingoes (lead or iron weights)
    "warp_silk": ((0.24, 0.12, 0.40), 0.0, 0.55, None),      # warp, the 2D views' purple
    "weft_silk": ((0.86, 0.78, 0.55), 0.0, 0.55, None),
    "reed_steel": ((0.35, 0.36, 0.38), 0.9, 0.40, None),
    "shuttle_wood": ((0.45, 0.24, 0.08), 0.0, 0.40, None),
    "sheet_glass": ((0.40, 0.25, 0.60), 0.0, 0.50, None),    # the warp sheets, translucent on the page
    "ghost": ((0.50, 0.55, 0.62), 0.0, 0.60, None),          # the ghosted machine, translucent on the page
    "band": ((0.95, 0.60, 0.12), 0.0, 0.50, None),           # a repeat band, translucent on the page
    "cloth": ((0.30, 0.18, 0.45), 0.0, 0.70, None),          # the woven cloth
}

# Textures repeat every UV_MM millimetres (box-projected UVs, see MeshBuilder.build).
UV_MM = 250.0
TEX_SIZE = {"brushed": 512}


def _periodic_noise(rng, n, stretch_u, scale, beta=1.0):
    """Seamless (periodic) noise, n x n, rows = v and columns = u, normalised to 0..1.

    White noise filtered in Fourier space with a 1/f^beta falloff above 1/scale cycles
    per tile; stretch_u > 1 makes features long along u (grain, brushing)."""
    import numpy as np

    fv = np.fft.fftfreq(n)[:, None] * n
    fu = np.fft.fftfreq(n)[None, :] * n
    f = np.sqrt((fu * stretch_u) ** 2 + fv ** 2)
    amp = 1.0 / np.maximum(f, 1.0) ** beta * np.exp(-((f / scale) ** 2))
    amp[0, 0] = 0.0
    w = np.fft.ifft2(np.fft.fft2(rng.standard_normal((n, n))) * amp).real
    w -= w.min()
    return w / max(w.max(), 1e-9)


def _image(name, rgb, non_color):
    """Blender image from an (n, n, 3) array of linear values (rows = v, bottom row first)."""
    import numpy as np

    n = rgb.shape[0]
    img = bpy.data.images.new(name, n, n, alpha=False, float_buffer=False)
    # set the colour space first: changing it regenerates (blanks) a generated image
    img.colorspace_settings.name = "Non-Color" if non_color else "sRGB"
    c = np.clip(rgb, 0.0, 1.0)
    if not non_color:  # pixels of an sRGB byte image are sRGB-encoded
        c = np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)
    px = np.ones((n, n, 4), np.float32)
    px[..., :3] = c
    img.pixels.foreach_set(px.ravel())
    return img


def _texture_images(name, kind, rgb, metallic, rough):
    """(base colour image or None, ORM image: G = roughness, B = metallic) for a material.

    Generated with a fixed seed, so rebuilds give the same .glb."""
    import numpy as np

    rng = np.random.default_rng(sum(map(ord, name)))
    n = TEX_SIZE[kind]
    if kind == "brushed":
        streak = _periodic_noise(rng, n, 40.0, n / 3)        # fine brushing along u
        patch = _periodic_noise(rng, n, 2.0, 12.0)           # soft wear patches
        r = rough * (0.82 + 0.28 * streak + 0.18 * (patch - 0.5))
        color = None
    else:
        raise ValueError(kind)
    orm = np.stack([np.ones_like(r), r, np.full_like(r, metallic)], -1)
    img_c = _image(f"{name}_color", color, False) if color is not None else None
    return img_c, _image(f"{name}_orm", orm, True)


def material(name):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    rgb, metallic, rough, kind = MATERIALS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_backface_culling = True   # exported single-sided: every part is closed or faces the viewer
    if kind:
        img_c, img_orm = _texture_images(name, kind, rgb, metallic, rough)
        orm = nodes.new("ShaderNodeTexImage")
        orm.image = img_orm
        sep = nodes.new("ShaderNodeSeparateColor")
        links.new(orm.outputs["Color"], sep.inputs["Color"])
        links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
        links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])
        if img_c:
            col = nodes.new("ShaderNodeTexImage")
            col.image = img_c
            links.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def is_textured(name):
    return MATERIALS[name][3] is not None


# glTF export settings shared by the build scripts: textures as JPEG.
EXPORT_IMAGES = dict(export_image_format="JPEG", export_image_quality=88)


# --- mesh building -------------------------------------------------------------------

# Plane mappings for 2D profiles (u, w) and the extrusion axis.
# "XZ": profile in the X-Z plane, extruded along +Y (shafts running front to back).
# "XY": profile in the X-Y plane, extruded along +Z (vertical shafts).
def _map(plane, u, w, t):
    if plane == "XZ":
        return (u, t, w)
    if plane == "XY":
        return (u, w, t)
    if plane == "YZ":
        return (t, u, w)
    raise ValueError(plane)


def _signed_area(poly):
    a = 0.0
    for i in range(len(poly)):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % len(poly)]
        a += x0 * y1 - x1 * y0
    return a / 2.0


class MeshBuilder:
    """Accumulates polygons (mm, in the node's local frame) with material slots."""

    def __init__(self):
        self.verts = []
        self.faces = []
        self.mat_idx = []
        self.smooth = []
        self.mats = []

    def _mat(self, name):
        if name not in self.mats:
            self.mats.append(name)
        return self.mats.index(name)

    def prism(self, poly, plane, t0, t1, mat, smooth=False, offset=(0.0, 0.0, 0.0)):
        """Extrude a closed 2D polygon from t0 to t1 along the plane's normal axis."""
        if _signed_area(poly) < 0:
            poly = list(reversed(poly))
        mi = self._mat(mat)
        n = len(poly)
        base = len(self.verts)
        ox, oy, oz = offset
        for t in (t0, t1):
            for u, w in poly:
                x, y, z = _map(plane, u, w, t)
                self.verts.append((x + ox, y + oy, z + oz))
        # Orientation: for XZ the extrusion axis +Y gives a left-handed (u,w,t) frame.
        flip = plane == "XZ"
        cap0 = list(range(base, base + n))
        cap1 = list(range(base + n, base + 2 * n))
        if flip:
            self._add(cap0, mi, False)
            self._add(list(reversed(cap1)), mi, False)
        else:
            self._add(list(reversed(cap0)), mi, False)
            self._add(cap1, mi, False)
        for i in range(n):
            a, b = base + i, base + (i + 1) % n
            c, d = b + n, a + n
            self._add([a, d, c, b] if flip else [a, b, c, d], mi, smooth)

    def lathe(self, profile, n, mat, axis="Y", offset=(0.0, 0.0, 0.0)):
        """Surface of revolution: profile is a list of (radius, t) from one end to the other,
        turned about the local axis ("Y" or "Z"); a radius of 0 closes that end."""
        mi = self._mat(mat)
        ox, oy, oz = offset
        rings = []
        for r, t in profile:
            ring = []
            for i in range(n if r > 1e-9 else 1):
                a = 2.0 * math.pi * i / n
                u, w = r * math.cos(a), r * math.sin(a)
                x, y, z = (u, t, w) if axis == "Y" else (u, w, t)
                ring.append(len(self.verts))
                self.verts.append((x + ox, y + oy, z + oz))
            rings.append(ring)
        # Unflipped faces point outward when t decreases along the profile for axis Y
        # ((u, t, w) is a left-handed frame) and when it increases for axis Z.
        rising = profile[-1][1] > profile[0][1]
        flip = rising if axis == "Y" else not rising
        for k in range(len(rings) - 1):
            r0, r1 = rings[k], rings[k + 1]
            for i in range(n):
                j = (i + 1) % n
                if len(r0) == 1 and len(r1) == 1:
                    continue
                if len(r0) == 1:
                    f = [r0[0], r1[j], r1[i]]
                elif len(r1) == 1:
                    f = [r0[i], r0[j], r1[0]]
                else:
                    f = [r0[i], r0[j], r1[j], r1[i]]
                self._add(list(reversed(f)) if flip else f, mi, True)

    def tube(self, r_out, r_in, n, plane, t0, t1, mat, offset=(0.0, 0.0, 0.0)):
        """Hollow cylinder (a bushing) from t0 to t1 along the plane's normal axis."""
        mi = self._mat(mat)
        ox, oy, oz = offset
        base = len(self.verts)
        for t in (t0, t1):
            for r in (r_out, r_in):
                for i in range(n):
                    a = 2.0 * math.pi * i / n
                    x, y, z = _map(plane, r * math.cos(a), r * math.sin(a), t)
                    self.verts.append((x + ox, y + oy, z + oz))
        o0, i0, o1, i1 = base, base + n, base + 2 * n, base + 3 * n
        flip = plane == "XZ"
        for i in range(n):
            j = (i + 1) % n
            quads = [
                [o0 + i, o0 + j, o1 + j, o1 + i],      # outer wall
                [i0 + j, i0 + i, i1 + i, i1 + j],      # inner wall
                [o0 + j, o0 + i, i0 + i, i0 + j],      # cap at t0
                [o1 + i, o1 + j, i1 + j, i1 + i],      # cap at t1
            ]
            for k, q in enumerate(quads):
                self._add(list(reversed(q)) if flip else q, mi, k < 2)

    def hexa(self, bottom, top, mat):
        """A solid with a quadrilateral bottom and top (each 4 (x, y, z) points, counter-clockwise
        seen from above, top[i] over bottom[i]): a tapered post."""
        mi = self._mat(mat)
        base = len(self.verts)
        self.verts += [tuple(v) for v in bottom] + [tuple(v) for v in top]
        b = [base + i for i in range(4)]
        t = [base + 4 + i for i in range(4)]
        self._add(list(reversed(b)), mi, False)
        self._add(t, mi, False)
        for i in range(4):
            j = (i + 1) % 4
            self._add([b[i], b[j], t[j], t[i]], mi, False)

    def _add(self, face, mi, smooth):
        self.faces.append(face)
        self.mat_idx.append(mi)
        self.smooth.append(smooth)

    def add_mesh_data(self, verts, faces, matrix, mat):
        """Append raw mesh data (e.g. a converted text glyph) transformed by matrix (mm)."""
        mi = self._mat(mat)
        base = len(self.verts)
        for v in verts:
            p = matrix @ Vector(v)
            self.verts.append((p.x, p.y, p.z))
        for f in faces:
            self._add([base + i for i in f], mi, False)

    def build(self, name, collection, location_mm=(0, 0, 0)):
        me = bpy.data.meshes.new(name)
        me.from_pydata([(x * MM, y * MM, z * MM) for x, y, z in self.verts], [], self.faces)
        me.update()
        for m in self.mats:
            me.materials.append(material(m))
        me.polygons.foreach_set("material_index", self.mat_idx)
        me.polygons.foreach_set("use_smooth", self.smooth)
        me.validate()
        if any(is_textured(m) for m in self.mats):
            _box_uvs(me)
        if hasattr(me, "set_sharp_from_angle"):
            me.set_sharp_from_angle(angle=math.radians(40))
        obj = bpy.data.objects.new(name, me)
        obj.location = tuple(c * MM for c in location_mm)
        collection.objects.link(obj)
        return obj


def _box_uvs(me):
    """Box-projected UVs (1 unit = UV_MM): each face uses the plane across its normal's
    largest axis, with u along X where it can (grain and brushing run along the machine)."""
    import numpy as np

    n = len(me.polygons)
    nrm = np.empty(n * 3, np.float32)
    me.polygons.foreach_get("normal", nrm)
    axis = np.abs(nrm.reshape(n, 3)).argmax(1)
    loop_start = np.empty(n, np.int64)
    loop_total = np.empty(n, np.int64)
    me.polygons.foreach_get("loop_start", loop_start)
    me.polygons.foreach_get("loop_total", loop_total)
    lv = np.empty(len(me.loops), np.int64)
    me.loops.foreach_get("vertex_index", lv)
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3) / (UV_MM * MM)
    loop_axis = np.repeat(axis, loop_total)
    p = co[lv]
    u = np.where(loop_axis == 0, p[:, 1], p[:, 0])
    v = np.where(loop_axis == 2, p[:, 1], p[:, 2])
    uv = me.uv_layers.new(name="UVMap")
    uv.data.foreach_set("uv", np.stack([u, v], 1).ravel().astype(np.float32))


def empty(name, collection, location_mm=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    obj.location = tuple(c * MM for c in location_mm)
    collection.objects.link(obj)
    return obj


def parent(child, par):
    """Parent keeping the child's world position (build-time objects are unrotated).

    The child's location becomes relative to the parent and no parent-inverse matrix
    is used, so the glTF local transforms stay clean and easy to animate."""
    child.parent = par
    child.matrix_parent_inverse.identity()
    child.location = child.location - par.location


def glyph_mesh(text, size_mm, depth_mm):
    """Mesh data (verts in mm, faces) of a centred, extruded text string, facing +Z."""
    curve = bpy.data.curves.new("glyph_tmp", "FONT")
    curve.body = text
    curve.size = size_mm
    curve.extrude = depth_mm / 2.0
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.resolution_u = 3
    obj = bpy.data.objects.new("glyph_tmp", curve)
    bpy.context.scene.collection.objects.link(obj)
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    verts = [tuple(v.co) for v in me.vertices]
    faces = [tuple(p.vertices) for p in me.polygons]
    bpy.data.objects.remove(obj)
    bpy.data.curves.remove(curve)
    bpy.data.meshes.remove(me)
    return verts, faces


def glyph_mesh_flat(text, size_mm, align="CENTER", bold_mm=0.0):
    """Mesh data (verts in mm, faces) of flat lettering facing +Z: printed ink, no depth.

    align is "CENTER" or "LEFT" (the text starts at x = 0); bold_mm thickens the strokes."""
    curve = bpy.data.curves.new("glyph_tmp", "FONT")
    curve.body = text
    curve.size = size_mm
    curve.extrude = 0.0
    curve.offset = bold_mm
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.resolution_u = 3
    curve.fill_mode = "FRONT"
    obj = bpy.data.objects.new("glyph_tmp", curve)
    bpy.context.scene.collection.objects.link(obj)
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    verts = [tuple(v.co) for v in me.vertices]
    faces = [tuple(p.vertices) for p in me.polygons]
    bpy.data.objects.remove(obj)
    bpy.data.curves.remove(curve)
    bpy.data.meshes.remove(me)
    return verts, faces


def frame_matrix(origin, x_axis, y_axis):
    """4x4 matrix mapping local X/Y/Z (Z = X x Y) to the given axes at origin (mm)."""
    x = Vector(x_axis).normalized()
    y = Vector(y_axis).normalized()
    z = x.cross(y)
    m = Matrix.Identity(4)
    for i in range(3):
        m[i][0], m[i][1], m[i][2], m[i][3] = x[i], y[i], z[i], origin[i]
    return m


def gltf_point(p_mm):
    """Blender-local point (mm) -> glTF-local point (m, Y-up)."""
    x, y, z = p_mm
    return [x * MM, z * MM, -y * MM]


def set_anchors(obj, key, points_mm):
    """Store points (node-local, Blender mm) as a flat glTF-local list in extras[key].

    Acceptance tests use anchors to identify features (which glyph is which digit,
    where the gear plane is) without re-deriving the build geometry."""
    flat = []
    for p in points_mm:
        flat += gltf_point(p)
    obj[key] = flat


def set_labels(obj, label_en):
    """Hover/callout name (glTF extras), for parts without motion too. More languages later."""
    obj["label_en"] = label_en


def set_explode(obj, offset_mm):
    """Exploded-view offset (Blender mm, in the parent's frame) as glTF-frame mm in extras."""
    x, y, z = offset_mm
    obj["explode"] = [x, z, -y]


def set_motion(obj, motion, axis_blender, label_en, unit="deg"):
    """Record how the web code animates this node (glTF extras, axis in glTF Y-up)."""
    bx, by, bz = axis_blender
    obj["motion"] = motion
    obj["axis"] = [bx, bz, -by]  # Blender (x, y, z) -> glTF (x, z, -y)
    obj["unit"] = unit
    obj["label_en"] = label_en


def mesh_data(obj):
    """(verts in mm, faces) of an object's evaluated mesh, in its local frame."""
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    verts = [tuple(c / MM for c in v.co) for v in me.vertices]
    faces = [tuple(p.vertices) for p in me.polygons]
    bpy.data.meshes.remove(me)
    return verts, faces


def cut_holes(mb, holes, plane, t0, t1, collection, segments=32, polys=()):
    """Mesh data of MeshBuilder mb's single prism with holes cut through it.

    holes: (u, w, radius) round holes; polys: polygons [(u, w), ...] (slots, cut-outs); both in
    the plane's coordinates, cut from t0 - 1 to t1 + 1 mm.
    Returns (verts, faces) in mm, ready for MeshBuilder.add_mesh_data."""
    plate = mb.build("__plate", collection)
    cut = MeshBuilder()
    for u, w, r in holes:
        cut.prism([(u + du, w + dw) for du, dw in _circle(r, segments)], plane, t0 - 1.0, t1 + 1.0, mb.mats[0])
    for poly in polys:
        cut.prism(poly, plane, t0 - 1.0, t1 + 1.0, mb.mats[0])
    cutter = cut.build("__cutter", collection)
    mod = plate.modifiers.new("holes", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    data = mesh_data(plate)
    for o in (plate, cutter):
        me = o.data
        bpy.data.objects.remove(o)
        bpy.data.meshes.remove(me)
    return data


def _circle(r, n):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def set_path(obj, moves_mm):
    """A unit's way out (glTF extras "path"): cumulative waypoints from its seated place, in
    glTF-frame mm, flattened; moves are Blender-frame (x, y, z) steps."""
    pts = [0.0, 0.0, 0.0]
    x = y = z = 0.0
    for dx, dy, dz in moves_mm:
        x, y, z = x + dx, y + dy, z + dz
        pts += [x, z, -y]
    obj["motion"] = "path"
    obj["path"] = pts


def tube_path(mb, points, radius, mat, n=10):
    """A round tube along a polyline of (x, y, z) mm points: a capped cylinder per segment,
    each but the last run on by one radius so the bends close up."""
    from mathutils import Vector
    mi = mb._mat(mat)
    last = len(points) - 2
    for k, (a, b) in enumerate(zip(points, points[1:])):
        va, vb = Vector(a), Vector(b)
        if (vb - va).length < 1e-6:
            continue
        z = (vb - va).normalized()
        x = z.orthogonal().normalized()
        y = z.cross(x)                       # (x, y, z) right-handed: the side faces point outward
        ends = (va, vb + z * radius if k < last else vb)
        base = len(mb.verts)
        for c in ends:
            for i in range(n):
                ang = 2 * math.pi * i / n
                p = c + (x * math.cos(ang) + y * math.sin(ang)) * radius
                mb.verts.append((p.x, p.y, p.z))
        for i in range(n):
            j = (i + 1) % n
            mb._add([base + i, base + j, base + n + j, base + n + i], mi, True)
        mb._add(list(reversed(range(base, base + n))), mi, False)
        mb._add(list(range(base + n, base + 2 * n)), mi, False)
