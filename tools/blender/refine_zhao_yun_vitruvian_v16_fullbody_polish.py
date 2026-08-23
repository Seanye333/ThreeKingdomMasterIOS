"""Polish Zhao Yun v15 hands, boots, skirt panels, and spear tassel."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v15-cinematic-hero.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v16-fullbody-polish.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v6_cloth_grip as v6  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def configure_leather(leather):
    if not leather.use_nodes:
        return
    bsdf = leather.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.48
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.06
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.34


def pose_readable_fingers(rig):
    curls = {
        "r": {
            "index": (-54.0, -78.0, -52.0),
            "middle": (-59.0, -84.0, -58.0),
            "ring": (-64.0, -90.0, -64.0),
            "pinky": (-69.0, -96.0, -68.0),
            "thumb": (-34.0, -52.0, -34.0),
        },
        "l": {
            "index": (-38.0, -54.0, -34.0),
            "middle": (-43.0, -59.0, -39.0),
            "ring": (-49.0, -65.0, -44.0),
            "pinky": (-55.0, -71.0, -49.0),
            "thumb": (-29.0, -44.0, -30.0),
        },
    }
    for side, fingers in curls.items():
        for finger, angles in fingers.items():
            for joint, angle in enumerate(angles, start=1):
                bone = rig.pose.bones.get(f"{finger}_{joint:02}_{side}")
                if not bone:
                    continue
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(angle)
    bpy.context.view_layer.update()


def rebuild_thin_gloves(rig, leather, gold):
    hide_prefixes(
        (
            "ZhaoYun_V6_Fitted_Leather_Glove_",
            "ZhaoYun_V6_Gauntlet_",
            "ZhaoYun_V6_Silver_Knuckle_",
        )
    )
    body = bpy.data.objects["ZhaoYun_Body"]
    for side in ("l", "r"):
        groups = [f"hand_{side}"]
        groups.extend(
            f"{finger}_{joint:02}_{side}"
            for finger in ("index", "middle", "ring", "pinky", "thumb")
            for joint in (1, 2, 3)
        )
        glove = v4.body_surface_shell(
            f"ZhaoYun_V16_Fitted_Leather_Glove_{side}",
            body,
            groups,
            leather,
            threshold=0.082,
            offset=0.0042,
        )
        solidify = next((modifier for modifier in glove.modifiers if modifier.type == "SOLIDIFY"), None)
        if solidify:
            solidify.thickness = 0.0022
        wrist = v4.bone_point(rig, f"hand_{side}", "head")
        knuckle = v4.bone_point(rig, f"hand_{side}", "tail")
        v4.ring_curve(
            f"ZhaoYun_V16_Glove_Gold_Cuff_{side}",
            wrist.lerp(knuckle, 0.08),
            knuckle - wrist,
            0.040,
            0.036,
            gold,
            0.0018,
        )


def make_wedge(name, centers, widths, bottoms, tops, material, bevel=0.006):
    centers = [Vector(center) for center in centers]
    direction = centers[-1] - centers[0]
    flat = Vector((direction.x, direction.y, 0.0))
    if flat.length < 1e-6:
        flat = Vector((0.0, -1.0, 0.0))
    flat.normalize()
    lateral = Vector((-flat.y, flat.x, 0.0)).normalized()
    up = Vector((0.0, 0.0, 1.0))
    vertices = []
    for center, width, bottom, top in zip(centers, widths, bottoms, tops):
        vertices.extend(
            (
                center - lateral * width + up * bottom,
                center + lateral * width + up * bottom,
                center + lateral * width + up * top,
                center - lateral * width + up * top,
            )
        )
    faces = []
    for ring in range(len(centers) - 1):
        a = ring * 4
        b = (ring + 1) * 4
        faces.extend(
            (
                (a, a + 1, b + 1, b),
                (a + 1, a + 2, b + 2, b + 1),
                (a + 2, a + 3, b + 3, b + 2),
                (a + 3, a, b, b + 3),
            )
        )
    faces.extend(((0, 3, 2, 1), tuple(range(len(vertices) - 4, len(vertices)))))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    modifier = obj.modifiers.new(name + "_Edge_Soften", "BEVEL")
    modifier.width = bevel
    modifier.segments = 4
    return obj


def build_cavalry_boots(rig, leather, silver, gold):
    hide_prefixes(
        (
            "ZhaoYun_V4_Boot_",
            "ZhaoYun_V4_Leather_Foot_",
            "ZhaoYun_V4_Silver_Toe_",
            "ZhaoYun_V5_Closed_Boot_",
            "ZhaoYun_V5_Armored_Toe_",
            "ZhaoYun_V5_Toe_Cap_",
            "ZhaoYun_V9_Closed_Boot_",
            "ZhaoYun_V11_Grounded_Boot_",
        )
    )
    for side in ("l", "r"):
        knee = v4.bone_point(rig, f"calf_{side}", "head")
        ankle = v4.bone_point(rig, f"foot_{side}", "head")
        toe = v4.bone_point(rig, f"foot_{side}", "tail")
        forward = Vector((toe.x - ankle.x, toe.y - ankle.y, 0.0))
        if forward.length < 1e-6:
            forward = Vector((0.0, -1.0, 0.0))
        forward.normalize()

        v4.cloth_tube(
            f"ZhaoYun_V16_Fitted_Boot_Shaft_{side}",
            [
                knee.lerp(ankle, 0.62) + Vector((0.0, -0.018, 0.0)),
                knee.lerp(ankle, 0.84) + Vector((0.0, -0.025, 0.0)),
                ankle + forward * 0.012 + Vector((0.0, 0.0, 0.012)),
            ],
            [0.055, 0.058, 0.060],
            [0.050, 0.054, 0.058],
            leather,
            36,
        )

        centers = (
            ankle - forward * 0.018 + Vector((0.0, 0.0, 0.012)),
            ankle.lerp(toe, 0.58) + Vector((0.0, 0.0, 0.010)),
            toe + forward * 0.052 + Vector((0.0, 0.0, 0.008)),
            toe + forward * 0.105 + Vector((0.0, 0.0, 0.013)),
        )
        make_wedge(
            f"ZhaoYun_V16_Tapered_Leather_Boot_{side}",
            centers,
            (0.052, 0.064, 0.055, 0.036),
            (-0.036, -0.038, -0.030, -0.018),
            (0.054, 0.050, 0.034, 0.017),
            leather,
            0.007,
        )
        make_wedge(
            f"ZhaoYun_V16_Armored_Toe_Cap_{side}",
            centers[1:],
            (0.061, 0.052, 0.032),
            (0.002, -0.004, -0.010),
            (0.054, 0.038, 0.020),
            silver,
            0.004,
        )
        base.add_curve_strand(
            f"ZhaoYun_V16_Boot_Gold_Ridge_{side}",
            [
                tuple(centers[1] + Vector((0.0, 0.0, 0.058))),
                tuple(centers[2] + Vector((0.0, 0.0, 0.043))),
                tuple(centers[3] + Vector((0.0, 0.0, 0.024))),
            ],
            0.0020,
            gold,
        )
        v4.ring_curve(
            f"ZhaoYun_V16_Boot_Cuff_{side}",
            ankle + Vector((0.0, 0.0, 0.025)),
            ankle - knee,
            0.058,
            0.052,
            gold,
            0.0020,
        )


def add_panel_trim(name, rows, side, phase, gold):
    base.add_curve_strand(
        name,
        v6.edge_points(rows, side, phase, 3.2, 0.0045, 0.0080, 0.16),
        0.0018,
        gold,
    )


def rebuild_layered_battle_skirt(ivory, ivory_shadow, gold):
    hide_prefixes(
        (
            "ZhaoYun_V9_Windswept_Battle_Skirt_",
            "ZhaoYun_V9_Skirt_Gold_",
        )
    )
    panels = (
        (
            "Left_Outer",
            [((-0.132, -0.128, 1.045), 0.058), ((-0.165, -0.155, 0.910), 0.071), ((-0.210, -0.185, 0.765), 0.084), ((-0.252, -0.205, 0.635), 0.075)],
            0.20,
            ivory_shadow,
            -1,
        ),
        (
            "Left_Inner",
            [((-0.040, -0.146, 1.050), 0.066), ((-0.065, -0.178, 0.900), 0.078), ((-0.095, -0.210, 0.735), 0.088), ((-0.120, -0.232, 0.570), 0.074)],
            1.20,
            ivory,
            -1,
        ),
        (
            "Right_Inner",
            [((0.044, -0.145, 1.050), 0.064), ((0.067, -0.176, 0.905), 0.076), ((0.095, -0.205, 0.745), 0.085), ((0.116, -0.226, 0.590), 0.072)],
            2.05,
            ivory,
            1,
        ),
        (
            "Right_Outer",
            [((0.135, -0.128, 1.045), 0.056), ((0.158, -0.154, 0.915), 0.069), ((0.188, -0.181, 0.780), 0.080), ((0.220, -0.201, 0.650), 0.070)],
            3.00,
            ivory_shadow,
            1,
        ),
    )
    for name, rows, phase, material, outer_side in panels:
        v6.pleated_panel(
            f"ZhaoYun_V16_Layered_Battle_Skirt_{name}",
            rows,
            material,
            phase,
            3.2,
            0.010,
            0.0055,
            0.0045,
            0.0080,
            0.16,
        )
        add_panel_trim(f"ZhaoYun_V16_Skirt_Gold_Trim_{name}", rows, outer_side, phase, gold)


def add_tapered_tube(name, points, radii, material, sides=8):
    centers = [Vector(point) for point in points]
    view_normal = Vector((0.0, -1.0, 0.0))
    vertices = []
    for index, (center, radius) in enumerate(zip(centers, radii)):
        previous = centers[max(0, index - 1)]
        following = centers[min(len(centers) - 1, index + 1)]
        tangent = (following - previous).normalized()
        normal_a = tangent.cross(view_normal)
        if normal_a.length < 1e-6:
            normal_a = Vector((1.0, 0.0, 0.0))
        normal_a.normalize()
        normal_b = tangent.cross(normal_a).normalized()
        for side in range(sides):
            angle = math.tau * side / sides
            vertices.append(center + radius * (math.cos(angle) * normal_a + math.sin(angle) * normal_b))
    faces = []
    for ring in range(len(centers) - 1):
        for side in range(sides):
            current = ring * sides + side
            following = ring * sides + (side + 1) % sides
            upper = (ring + 1) * sides + side
            upper_following = (ring + 1) * sides + (side + 1) % sides
            faces.append((current, following, upper_following, upper))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdivision = obj.modifiers.new(name + "_Smooth", "SUBSURF")
    subdivision.levels = 1
    subdivision.render_levels = 2
    return obj


def rebuild_spear_tassel(crimson, crimson_shadow, gold):
    reference = bpy.data.objects.get("ZhaoYun_V5_Spear_Crimson_Tassel_0")
    transform = reference.matrix_world.copy() if reference else None
    hide_prefixes(("ZhaoYun_V5_Spear_Crimson_Tassel_", "ZhaoYun_V4_Crimson_Tassel_"))
    socket = Vector((-0.25, -0.285, 2.20))
    tip = Vector((-0.232, -0.285, 2.44))
    direction = (tip - socket).normalized()
    root = socket - direction * 0.064
    world_root = transform @ root if transform else root
    axis_a = Vector((0.0, 1.0, 0.0))
    axis_b = direction.cross(axis_a).normalized()
    knot = base.add_ellipsoid(
        "ZhaoYun_V16_Spear_Tassel_Knot",
        tuple(world_root),
        (0.021, 0.018, 0.026),
        crimson_shadow,
        40,
        20,
    )
    knot.rotation_euler.x = math.radians(3.0)
    for index in range(14):
        angle = math.tau * index / 14.0
        radial = axis_a * math.cos(angle) * 0.014 + axis_b * math.sin(angle) * 0.014
        sway = Vector((0.018 + 0.016 * math.sin(index * 1.4), 0.008 * math.cos(index * 1.1), 0.0))
        length = 0.145 + 0.030 * (0.5 + 0.5 * math.sin(index * 2.3))
        local_points = (
            root + radial * 0.25,
            root + radial,
            root + radial * 1.15 + sway * 0.5 + Vector((0.0, 0.0, -length * 0.35)),
            root + radial * 0.90 + sway + Vector((0.0, 0.0, -length * 0.72)),
            root + radial * 0.65 + sway * 1.35 + Vector((0.0, 0.0, -length)),
        )
        points = tuple(transform @ point for point in local_points) if transform else local_points
        add_tapered_tube(
            f"ZhaoYun_V16_Spear_Tassel_Lock_{index}",
            points,
            (0.0017, 0.0019, 0.0016, 0.0010, 0.00025),
            gold if index in {2, 9} else (crimson_shadow if index % 4 == 0 else crimson),
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    ivory = bpy.data.materials["ZY6_Pleated_Ivory_Silk"]
    crimson = bpy.data.materials["ZY4_Deep_Crimson"]

    configure_leather(leather)
    ivory_shadow = base.make_material("ZY16_Shadowed_Ivory_Silk", (0.34, 0.38, 0.44), 0.0, 0.64)
    crimson_shadow = base.make_material("ZY16_Deep_Crimson_Shadow", (0.12, 0.008, 0.012), 0.02, 0.52)
    coordinate = bpy.data.objects.get("ZhaoYun_V4_Material_Coordinates")
    if coordinate:
        v4.v3.add_cloth_microtexture(ivory_shadow, coordinate, 0.072)

    pose_readable_fingers(rig)
    rebuild_thin_gloves(rig, leather, gold)
    build_cavalry_boots(rig, leather, silver, gold)
    rebuild_layered_battle_skirt(ivory, ivory_shadow, gold)
    rebuild_spear_tassel(crimson, crimson_shadow, gold)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
