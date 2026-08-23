"""Create the first high-quality Zhao Yun head gate.

This is intentionally a head-and-shoulders quality pass, not another full-body
costume patch.  It preserves the proven v44 eye/socket stack and textured MPFB
skin, then rebuilds the identity as a young Zhao Yun with long swept hair, a
silver circlet and a volumetric white feather ornament.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils.kdtree import KDTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, look_at, mat, sphere, strand
from create_liu_bei_reference_v1 import remove_matching
from refine_liu_bei_reference_v3 import curve_bundle_poly


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v44.blend"
OUTPUT_BLEND = SRC / "zhao-yun-hq-head-v1.blend"
FACE = SRC / "zhao-yun-hq-head-v1-face.png"
THREE_QUARTER = SRC / "zhao-yun-hq-head-v1-three-quarter.png"
PROFILE = SRC / "zhao-yun-hq-head-v1-profile.png"
BUST = SRC / "zhao-yun-hq-head-v1-bust.png"
PONYTAIL_OBJ = SRC / "makehuman-system-assets/hair/ponytail01/ponytail01.obj"
PONYTAIL_TEXTURE = SRC / "makehuman-system-assets/hair/ponytail01/ponytail01_diffuse.png"


def remove_old_identity():
    remove_matching(
        "V34_Groom_Beard_",
        "V34_Groom_Moustache_",
        "V34_Groom_Chin_Transition",
        "V34_Groom_Flyaways",
        "V40_Beard_Root_",
        "V31_Nostril_",
        "Guan_Yu_Basemesh.teeth",
        "Portrait_Brow_Furrow_",
        "V39_Face_UnderEye_Crease_",
        "Headcloth_Long_Tail_",
        "Headcloth_Tail_Gold_Edge_",
        "Fullbody_Blade_",
        "Fullbody_Crimson_Pole_Grip_",
        "Fullbody_Green_Dragon_Pole",
        "Fullbody_Pole_Butt_Spike",
        "V29_Blade_",
        "V29_Green_Dragon_Crescent_Blade",
        "V29_Crescent_Polished_Cutting_Edge",
    )


def shader(material):
    if not material or not material.use_nodes:
        return None
    return next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)


def set_if_present(node, name, value):
    if node and name in node.inputs:
        node.inputs[name].default_value = value


def make_materials():
    hair = mat(
        "Zhao Yun HQ blue-black anisotropic hair",
        (0.0015, 0.0045, 0.012, 1),
        0.54,
        noise=95.0,
        bump=0.022,
    )
    hair_shader = shader(hair)
    set_if_present(hair_shader, "Coat Weight", 0.025)
    set_if_present(hair_shader, "Coat Roughness", 0.48)
    set_if_present(hair_shader, "Anisotropic IOR Level", 0.68)

    hair_hi = mat(
        "Zhao Yun HQ cool hair strand highlight",
        (0.004, 0.014, 0.035, 1),
        0.46,
        noise=130.0,
        bump=0.014,
    )
    hair_hi_shader = shader(hair_hi)
    set_if_present(hair_hi_shader, "Coat Weight", 0.040)
    set_if_present(hair_hi_shader, "Anisotropic IOR Level", 0.75)

    hair_under = mat(
        "Zhao Yun HQ matte scalp undercoat",
        (0.0005, 0.0012, 0.0035, 1),
        0.76,
        noise=240.0,
        bump=0.008,
    )
    hair_under_shader = shader(hair_under)
    set_if_present(hair_under_shader, "Specular IOR Level", 0.14)
    set_if_present(hair_under_shader, "Coat Weight", 0.0)

    silver = mat(
        "Zhao Yun HQ moon silver",
        (0.32, 0.40, 0.53, 1),
        0.20,
        metallic=0.92,
        noise=34.0,
        bump=0.018,
    )
    bright_silver = mat(
        "Zhao Yun HQ polished silver edge",
        (0.66, 0.76, 0.90, 1),
        0.14,
        metallic=0.96,
        noise=46.0,
        bump=0.010,
    )
    dark_silver = mat(
        "Zhao Yun HQ blue shadow steel",
        (0.055, 0.105, 0.175, 1),
        0.26,
        metallic=0.86,
        noise=38.0,
        bump=0.025,
    )
    jade = mat(
        "Zhao Yun HQ sky jade",
        (0.012, 0.32, 0.46, 1),
        0.18,
        metallic=0.06,
        noise=20.0,
        bump=0.008,
    )
    jade_shader = shader(jade)
    set_if_present(jade_shader, "Coat Weight", 0.32)
    set_if_present(jade_shader, "Coat Roughness", 0.12)

    white_silk = mat(
        "Zhao Yun HQ pearl white silk",
        (0.66, 0.72, 0.82, 1),
        0.37,
        noise=175.0,
        bump=0.035,
    )
    white_shader = shader(white_silk)
    set_if_present(white_shader, "Sheen Weight", 0.26)
    set_if_present(white_shader, "Anisotropic IOR Level", 0.30)

    blue_silk = mat(
        "Zhao Yun HQ loyal blue silk",
        (0.014, 0.070, 0.155, 1),
        0.35,
        noise=145.0,
        bump=0.030,
    )
    blue_shader = shader(blue_silk)
    set_if_present(blue_shader, "Sheen Weight", 0.22)

    plume = mat(
        "Zhao Yun HQ white feather keratin",
        (0.73, 0.78, 0.86, 1),
        0.32,
        noise=210.0,
        bump=0.028,
    )
    plume_shader = shader(plume)
    set_if_present(plume_shader, "Sheen Weight", 0.34)
    set_if_present(plume_shader, "Anisotropic IOR Level", 0.46)

    lips = mat(
        "Zhao Yun HQ natural muted lips",
        (0.13, 0.052, 0.042, 1),
        0.52,
        noise=180.0,
        bump=0.010,
    )
    lips_shader = shader(lips)
    set_if_present(lips_shader, "Subsurface Weight", 0.045)
    set_if_present(lips_shader, "Specular IOR Level", 0.26)
    return locals()


def young_hero_head(body):
    # Preserve the proven v44 body, pose and equipment registration, then
    # replace only the weighted head region with MPFB's native Asian young-male
    # anatomy. The young head is fitted to the v44 bounds so the eyes, circlet
    # and hair remain registered.
    source_key = body.data.shape_keys.key_blocks.get("V44 rebuilt human head")
    if source_key:
        source_key.value = 1.0
    key = body.shape_key_add(name="Zhao Yun HQ youthful portrait sculpt", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    asian = body.data.shape_keys.key_blocks[1]
    v44 = body.data.shape_keys.key_blocks.get("V44 rebuilt human head")
    head_group = body.vertex_groups.get("head")
    head_weights = {}
    if asian and v44 and head_group:
        for vertex in body.data.vertices:
            membership = next((group for group in vertex.groups if group.group == head_group.index), None)
            if membership and membership.weight > 0.001:
                head_weights[vertex.index] = membership.weight

        fitted_indices = [index for index, weight in head_weights.items() if weight > 0.90]
        asian_min = [min(asian.data[index].co[axis] for index in fitted_indices) for axis in range(3)]
        asian_max = [max(asian.data[index].co[axis] for index in fitted_indices) for axis in range(3)]
        v44_min = [min(v44.data[index].co[axis] for index in fitted_indices) for axis in range(3)]
        v44_max = [max(v44.data[index].co[axis] for index in fitted_indices) for axis in range(3)]
        asian_center = [(low + high) * 0.5 for low, high in zip(asian_min, asian_max)]
        v44_center = [(low + high) * 0.5 for low, high in zip(v44_min, v44_max)]
        scale = [
            (v44_max[axis] - v44_min[axis]) / (asian_max[axis] - asian_min[axis])
            for axis in range(3)
        ]

        for index, weight in head_weights.items():
            source = asian.data[index].co
            fitted = [
                v44_center[axis] + (source[axis] - asian_center[axis]) * scale[axis]
                for axis in range(3)
            ]
            target = key.data[index].co
            target.x = target.x * (1.0 - weight) + fitted[0] * weight
            target.y = target.y * (1.0 - weight) + fitted[1] * weight
            target.z = target.z * (1.0 - weight) + fitted[2] * weight

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if ax > 0.148 or co.y > 0.060 or not 1.505 < co.z < 1.790:
            continue

        # Strong V-shaped jaw from the portrait: narrow the lower face while
        # preserving width at the upper cheek and temple.
        if 1.515 < co.z < 1.610 and 0.026 < ax < 0.124:
            vertical = max(0.0, 1.0 - abs(co.z - 1.565) / 0.055)
            lateral = min(1.0, (ax - 0.026) / 0.070)
            co.x *= 1.0 - 0.145 * vertical * lateral
        if 1.610 <= co.z < 1.670 and 0.052 < ax < 0.124:
            cheek_blend = max(0.0, 1.0 - abs(co.z - 1.642) / 0.035)
            co.x *= 1.0 - 0.040 * cheek_blend

        # A slightly longer centered chin creates the clean youthful oval seen
        # in the Zhao Yun portrait instead of Guan Yu's broad mature jaw.
        if ax < 0.050 and 1.510 < co.z < 1.558 and co.y < -0.070:
            center = max(0.0, 1.0 - ax / 0.050)
            co.z -= 0.0040 * center
            co.y -= 0.0018 * center

        # Refined straight nose with a narrow tip and reduced mature projection.
        if ax < 0.034 and 1.600 < co.z < 1.665 and co.y < -0.095:
            co.x *= 0.905
            co.y += 0.0040

        # Soften the inherited mature brow ridge and gently support the
        # under-eye plane, keeping the heroic stare without an aged hollow.
        if 0.020 < ax < 0.082 and 1.685 < co.z < 1.725 and co.y < -0.105:
            co.y += 0.0015
        if 0.022 < ax < 0.078 and 1.638 < co.z < 1.674 and co.y < -0.108:
            co.y -= 0.0014

    # Compress the native young-male lip group around its own center to close
    # the inherited open mouth, then remove only the mouth asymmetry.
    lips = body.vertex_groups.get("lips")
    lip_indices = []
    if lips:
        lip_indices = [
            vertex.index
            for vertex in body.data.vertices
            if any(group.group == lips.index and group.weight > 0.10 for group in vertex.groups)
        ]
    if lip_indices:
        lip_min = min(key.data[index].co.z for index in lip_indices)
        lip_max = max(key.data[index].co.z for index in lip_indices)
        lip_center = (lip_min + lip_max) * 0.5
        for index in lip_indices:
            co = key.data[index].co
            co.z = lip_center + (co.z - lip_center) * 0.08
            center_weight = max(0.0, 1.0 - abs(co.x) / 0.032)
            co.y += 0.0030 * center_weight

    tree = KDTree(len(key.data))
    for index, point in enumerate(key.data):
        tree.insert(point.co, index)
    tree.balance()
    for index, point in enumerate(key.data):
        co = point.co
        if index not in lip_indices or not 0.001 < co.x:
            continue
        _, partner_index, distance = tree.find((-co.x, co.y, co.z))
        if partner_index == index or distance > 0.006:
            continue
        partner = key.data[partner_index].co
        average_x = (abs(co.x) + abs(partner.x)) * 0.5
        average_y = (co.y + partner.y) * 0.5
        average_z = (co.z + partner.z) * 0.5
        co.x, co.y, co.z = average_x, average_y, average_z
        partner.x, partner.y, partner.z = -average_x, average_y, average_z

    body.data.update()
    for polygon in body.data.polygons:
        polygon.use_smooth = True

    highres = body.modifiers.get("High resolution portrait surface")
    if highres:
        highres.levels = 1
        highres.render_levels = 2
    pores = body.modifiers.get("V32 physical facial pores")
    if pores and hasattr(pores, "strength"):
        pores.strength *= 0.55


def fit_eye_stack_to_young_head():
    """Move the proven wet-eye stack onto the fitted Asian young sockets."""
    for obj in bpy.data.objects:
        if not obj.name.startswith("V44_Eye_"):
            continue
        side = 1.0 if obj.location.x > 0.0 else -1.0
        obj.location.x -= side * 0.00055
        obj.location.y -= 0.0028
        obj.location.z += 0.0048


def young_skin(body):
    original = body.material_slots[0].material
    skin = original.copy()
    skin.name = "Zhao Yun HQ textured youthful skin"
    body.material_slots[0].material = skin
    nodes = skin.node_tree.nodes
    weathered = nodes.get("V34 weathered bronze complexion")
    if weathered:
        weathered.inputs[0].default_value = 0.020
    mature = nodes.get("V34 restrained mature skin color")
    if mature:
        mature.inputs[1].default_value = 0.66
        mature.inputs[2].default_value = 1.055
    roughness = nodes.get("Map Range.003")
    if roughness:
        roughness.inputs[3].default_value = 0.46
        roughness.inputs[4].default_value = 0.61
    pore_noise = nodes.get("Fine facial micro pores")
    if pore_noise:
        pore_noise.inputs[2].default_value = 520.0
        pore_noise.inputs[3].default_value = 2.6
    pore_bump = nodes.get("Micro pore normal")
    if pore_bump and "Strength" in pore_bump.inputs:
        pore_bump.inputs["Strength"].default_value = 0.16
    skin_shader = shader(skin)
    set_if_present(skin_shader, "Subsurface Weight", 0.065)
    set_if_present(skin_shader, "Coat Weight", 0.025)


def assign_natural_lips(body, material):
    lips = body.vertex_groups.get("lips")
    if not lips:
        return
    lip_indices = {
        vertex.index
        for vertex in body.data.vertices
        if any(group.group == lips.index and group.weight > 0.10 for group in vertex.groups)
    }
    body.data.materials.append(material)
    material_index = len(body.data.materials) - 1
    for polygon in body.data.polygons:
        overlap = sum(index in lip_indices for index in polygon.vertices)
        if overlap >= max(2, len(polygon.vertices) - 1):
            polygon.material_index = material_index


def ribbon(name, path, widths, material, thickness=0.004):
    vertices = []
    for (x, y, z), width in zip(path, widths):
        vertices.extend(((x - width, y, z), (x + width, y, z)))
    faces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(len(path) - 1)]
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    solidify = obj.modifiers.new(name="Feather thickness", type="SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    subdivision = obj.modifiers.new(name="Feather surface", type="SUBSURF")
    subdivision.levels = 2
    subdivision.render_levels = 2
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def textured_hair_material():
    """Build a dark, alpha-cutout material for the licensed MPFB hair mesh."""
    material = bpy.data.materials.new("Zhao Yun HQ textured blue-black hair")
    material.use_nodes = True
    material.diffuse_color = (0.005, 0.010, 0.022, 1.0)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(PONYTAIL_TEXTURE), check_existing=True)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.018

    principled.inputs["Base Color"].default_value = (0.0025, 0.0070, 0.020, 1.0)
    principled.inputs["Roughness"].default_value = 0.42
    set_if_present(principled, "Coat Weight", 0.08)
    set_if_present(principled, "Coat Roughness", 0.24)
    set_if_present(principled, "Anisotropic IOR Level", 0.70)
    links.new(texture.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])
    links.new(texture.outputs["Alpha"], principled.inputs["Alpha"])
    links.new(principled.outputs["BSDF"], output.inputs["Surface"])

    if hasattr(material, "surface_render_method"):
        try:
            material.surface_render_method = "DITHERED"
        except TypeError:
            pass
    elif hasattr(material, "blend_method"):
        material.blend_method = "HASHED"
    return material


def import_fitted_ponytail():
    """Import the real UV-mapped hair asset and fit it to the v44 MPFB head."""
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(
        filepath=str(PONYTAIL_OBJ),
        use_split_objects=False,
        use_split_groups=False,
    )
    imported = [obj for obj in bpy.data.objects if obj not in before]
    hair = next(obj for obj in imported if obj.type == "MESH")
    hair.name = "ZhaoYun_HQ_Textured_Ponytail_Hair"
    # The asset uses MakeHuman's Y-up coordinates.  This fit places the scalp
    # just outside the youthful head while retaining its modeled ponytail and
    # tapered face-framing strands.
    hair.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    hair.scale = (0.140, 0.106, 0.128)
    hair.location = (0.0, -0.003, 0.952)
    hair.data.materials.clear()
    hair.data.materials.append(textured_hair_material())
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    return hair


def build_scalp_cap(material):
    """Create a rear under-patch so alpha gaps never reveal bare scalp."""
    segments = 40
    rings = 14
    vertices = [(0.0, 0.0, 1.792)]
    for ring_index in range(1, rings + 1):
        amount = ring_index / rings
        for segment in range(segments + 1):
            # Only the rear half of the scalp is patched.  The imported UV
            # hair remains the visible front and side silhouette.
            phi = math.pi * segment / segments
            back = math.sin(phi)
            theta_max = 1.56 + 0.48 * back
            theta = theta_max * amount
            vertices.append(
                (
                    0.102 * math.sin(theta) * math.cos(phi),
                    0.116 * math.sin(theta) * math.sin(phi),
                    1.690 + 0.102 * math.cos(theta),
                )
            )

    faces = []
    for segment in range(segments):
        faces.append((0, 1 + segment, 1 + segment + 1))
    for ring_index in range(1, rings):
        previous = 1 + (ring_index - 1) * (segments + 1)
        current = 1 + ring_index * (segments + 1)
        for segment in range(segments):
            faces.append((previous + segment, current + segment, current + segment + 1, previous + segment + 1))

    mesh = bpy.data.meshes.new("Zhao Yun HQ fitted scalp cap mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    cap = bpy.data.objects.new("ZhaoYun_HQ_Fitted_Scalp_Cap", mesh)
    bpy.context.collection.objects.link(cap)
    assign(cap, material)
    solidify = cap.modifiers.new(name="Scalp cap thickness", type="SOLIDIFY")
    solidify.thickness = 0.0022
    solidify.offset = 0.0
    subdivision = cap.modifiers.new(name="Scalp cap smoothing", type="SUBSURF")
    subdivision.levels = 2
    subdivision.render_levels = 2
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return cap


def darken_exposed_scalp(body, material):
    """Use the real head surface as the undercoat instead of a helmet shell."""
    body.data.materials.append(material)
    material_index = len(body.data.materials) - 1
    vertices = body.data.vertices
    for polygon in body.data.polygons:
        center_x = sum(vertices[index].co.x for index in polygon.vertices) / len(polygon.vertices)
        center_y = sum(vertices[index].co.y for index in polygon.vertices) / len(polygon.vertices)
        center_z = sum(vertices[index].co.z for index in polygon.vertices) / len(polygon.vertices)
        is_top_scalp = center_z > 1.705 and center_y > -0.040 and abs(center_x) < 0.125
        is_rear_scalp = center_y > -0.015 and center_z > 1.610 and abs(center_x) < 0.135
        if is_top_scalp or is_rear_scalp:
            polygon.material_index = material_index


def build_hair_and_circlet(materials):
    cap = bpy.data.objects.get("Portrait_Fitted_Headcloth")
    if cap:
        bpy.data.objects.remove(cap, do_unlink=True)
    for obj in bpy.data.objects:
        name = obj.name
        if name == "Curved_Cloth_Diadem":
            assign(obj, materials["silver"])
            obj.name = "ZhaoYun_HQ_Fitted_Silver_Circlet"
            center_z = sum(vertex.co.z for vertex in obj.data.vertices) / len(obj.data.vertices)
            for vertex in obj.data.vertices:
                vertex.co.z = center_z + (vertex.co.z - center_z) * 0.72
            obj.data.update()
        elif name.startswith(("Diadem_Gold_", "Headcloth_Cloud_Filigree_", "Headcloth_Gold_Stud_")):
            assign(obj, materials["bright_silver"])
        elif name == "Headcloth_Imperial_Cloud_Crest":
            assign(obj, materials["bright_silver"])
        elif name == "Headcloth_Crest_Jade_Inlay":
            assign(obj, materials["jade"])
        elif name.startswith(("V32_Headcloth_Seam_", "V34_Headcloth_Fold_", "V40_Headcloth_Tension_Fold_")):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif name.startswith("V34_Groom_Head_Hair_"):
            assign(obj, materials["hair"])
            obj.name = name.replace("V34_Groom_Head_Hair_", "ZhaoYun_HQ_Loose_Hair_")

    body = bpy.data.objects.get("Zhao_Yun_HQ_Basemesh")
    if body:
        darken_exposed_scalp(body, materials["hair_under"])
    import_fitted_ponytail()

    # A compact bound knot integrates the high ponytail and feather with the
    # textured scalp without recreating the old oversized oval bun.
    sphere("ZhaoYun_HQ_Hair_Knot_Core", (0.0, 0.040, 1.690), (0.031, 0.024, 0.016), materials["hair"], 64, 32)
    for side in (-1, 1):
        strand(
            f"ZhaoYun_HQ_Hair_Knot_Wrap_{side:+d}",
            [
                (side * 0.026, 0.026, 1.688),
                (side * 0.015, 0.016, 1.701),
                (0.0, 0.015, 1.705),
                (-side * 0.015, 0.021, 1.699),
                (-side * 0.025, 0.038, 1.687),
            ],
            0.0020,
            materials["hair_hi"],
            taper=False,
        )

    # One restrained swept feather, angled off-axis like the portrait rather
    # than a vertical crown or paired rabbit-ear shape.
    feather_path = [
        (0.0, 0.040, 1.700),
        (0.010, 0.065, 1.758),
        (0.027, 0.105, 1.816),
        (0.054, 0.158, 1.862),
    ]
    ribbon("ZhaoYun_HQ_White_Feather", feather_path, [0.006, 0.015, 0.020, 0.0008], materials["plume"], 0.0030)
    strand("ZhaoYun_HQ_White_Feather_Spine", feather_path, 0.00058, materials["silver"], taper=True)
    # Fine paired barbs prevent the ornament from reading as a flat plastic
    # leaf in close-up while keeping its restrained single-feather silhouette.
    for index in range(1, 8):
        amount = index / 8.0
        segment = min(2, int(amount * 3.0))
        local_amount = amount * 3.0 - segment
        start = feather_path[segment]
        end = feather_path[segment + 1]
        center = tuple(start[axis] * (1.0 - local_amount) + end[axis] * local_amount for axis in range(3))
        width = 0.004 + 0.011 * math.sin(math.pi * amount)
        for side in (-1, 1):
            strand(
                f"ZhaoYun_HQ_White_Feather_Barb_{side:+d}_{index}",
                [
                    (center[0], center[1] - 0.0015, center[2]),
                    (center[0] + side * width, center[1] + 0.0015, center[2] + 0.0035 * (1.0 - amount)),
                ],
                0.00024,
                materials["plume"],
                taper=True,
            )


def recolor_shoulders(materials):
    for obj in bpy.data.objects:
        name = obj.name
        if name.startswith(("ZhaoYun_HQ_", "Zhao_Yun_HQ_")):
            continue
        if name.startswith("Dragon_") or any(token in name for token in ("Pauldron_Scale", "Right_Pauldron_Layer", "Dragon_Pauldron_Base", "Sculpted_Dragon_Head")):
            assign(obj, materials["silver"])
        elif any(token in name for token in ("Gold_Edge", "Gold_Piping", "Gold_Medallion", "Pauldron_Rivet", "Harness_Stud")):
            assign(obj, materials["bright_silver"])
        elif any(token in name for token in ("Jade_Eye", "Jade_Center", "Jade_Stud", "Buckle_Jade")):
            assign(obj, materials["jade"])
        elif any(token in name for token in ("Cross_Sash", "Crossed_Lapel", "Dark_Chest_Vest", "Dragon_Armor_Harness")):
            assign(obj, materials["blue_silk"])
        elif any(token in name for token in ("Sleeve", "Deep_Green_Robe", "Layered_Green_Battle_Robe", "Robe_Front")):
            assign(obj, materials["white_silk"])

    # The inherited portrait robe has two high collar spikes that read as
    # floating white tabs beside the ears in a tight head render.  Keep the
    # robe but lower only that out-of-range collar geometry.
    robe = bpy.data.objects.get("Portrait_Deep_Green_Robe")
    if robe and robe.type == "MESH":
        for vertex in robe.data.vertices:
            if vertex.co.z > 1.515 and abs(vertex.co.x) > 0.065:
                vertex.co.z = 1.485
        robe.data.update()


def render(scene, camera, path, resolution, location, target, lens):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    remove_old_identity()
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    body.name = "Zhao_Yun_HQ_Basemesh"
    rig = bpy.data.objects.get("Guan_Yu_Game_Rig")
    if rig:
        rig.name = "Zhao_Yun_HQ_Rig"
    materials = make_materials()
    young_hero_head(body)
    fit_eye_stack_to_young_head()
    young_skin(body)
    assign_natural_lips(body, materials["lips"])
    build_hair_and_circlet(materials)
    recolor_shoulders(materials)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.30
    camera = scene.camera
    render(scene, camera, FACE, (1200, 1200), (0.30, -2.28, 1.655), (0.0, -0.080, 1.625), 102)
    render(scene, camera, THREE_QUARTER, (1200, 1200), (0.86, -2.42, 1.68), (0.0, -0.050, 1.620), 98)
    render(scene, camera, PROFILE, (1200, 1200), (1.78, -0.30, 1.66), (0.0, -0.055, 1.620), 104)
    render(scene, camera, BUST, (1100, 1400), (0.50, -3.55, 1.50), (0.0, -0.035, 1.420), 86)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"PROFILE={PROFILE}")
    print(f"BUST={BUST}")


if __name__ == "__main__":
    main()
