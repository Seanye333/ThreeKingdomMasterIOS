"""Polish Zhao Yun v16 hair flow, cape layering, and commander pauldrons."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v16-fullbody-polish.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v17-hair-cape-armor.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v5_arsenal as v5  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v6_cloth_grip as v6  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def add_flattened_lock(name, points, radii, material, rig, depth_ratio=0.44, sides=10):
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
            offset = math.cos(angle) * radius * normal_a
            offset += math.sin(angle) * radius * depth_ratio * normal_b
            vertices.append(center + offset)

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
    v4.parent_to_bone_keep_transform(obj, rig, "head")
    return obj


def add_parented_strand(name, points, thickness, material, rig):
    strand = base.add_curve_strand(name, points, thickness, material)
    v4.parent_to_bone_keep_transform(strand, rig, "head")
    return strand


def rebuild_flowing_hair(rig, raven, raven_soft):
    hide_prefixes(
        (
            "ZhaoYun_V15_Ponytail_Clump_",
            "ZhaoYun_V15_Ponytail_Flyaway_",
            "ZhaoYun_V15_Back_Hair_Clump_",
            "ZhaoYun_V15_Temple_Lock",
        )
    )
    for index in range(16):
        lane = (index - 7.5) / 7.5
        depth = ((index % 4) - 1.5) * 0.0042
        wave = math.sin(index * 1.41)
        cross_wave = math.cos(index * 1.83)
        length = 0.93 + 0.12 * math.sin(index * 2.17)
        points = (
            (lane * 0.003, 0.097 + depth, 1.793 + lane * 0.003),
            (-0.042 + lane * 0.012, 0.132 + depth, 1.842 + lane * 0.014),
            (-0.158 + lane * 0.030 + wave * 0.012, 0.202 + depth * 1.6, 1.872 + lane * 0.060 + cross_wave * 0.010),
            (-0.320 + lane * 0.058 + cross_wave * 0.026, 0.286 + depth * 2.0, 1.818 + lane * 0.095 + wave * 0.025),
            (-0.495 * length + lane * 0.090 + wave * 0.035, 0.376 + depth * 2.4, 1.705 + lane * 0.145 + cross_wave * 0.045),
            (-0.650 * length + lane * 0.125 + cross_wave * 0.060, 0.458 + depth * 2.8, 1.545 + lane * 0.205 + wave * 0.070),
        )
        add_flattened_lock(
            f"ZhaoYun_V17_Flowing_Ponytail_Lock_{index}",
            points,
            (0.0012, 0.0022, 0.0032, 0.0035, 0.0021, 0.00025),
            raven_soft if index % 4 in {1, 2} else raven,
            rig,
            0.42 + 0.05 * (index % 3),
        )

    for index in range(8):
        lane = (index - 3.5) / 3.5
        wave = math.sin(index * 2.31)
        add_parented_strand(
            f"ZhaoYun_V17_Ponytail_Flyaway_{index}",
            (
                (lane * 0.003, 0.099, 1.796),
                (-0.080 + lane * 0.018, 0.150, 1.858 + lane * 0.026),
                (-0.265 + lane * 0.050 + wave * 0.025, 0.265, 1.842 + lane * 0.074),
                (-0.515 + lane * 0.105 + wave * 0.050, 0.405, 1.675 + lane * 0.135),
                (-0.705 + lane * 0.145 + wave * 0.080, 0.500, 1.475 + lane * 0.200),
            ),
            0.00042 if index % 3 else 0.00055,
            raven_soft,
            rig,
        )

    for index in range(7):
        lane = (index - 3.0) / 3.0
        wave = math.sin(index * 1.75)
        points = (
            (lane * 0.052, 0.074 + abs(lane) * 0.006, 1.754 - abs(lane) * 0.010),
            (lane * 0.064 - 0.012, 0.112, 1.665 - abs(lane) * 0.018),
            (lane * 0.078 - 0.068 + wave * 0.018, 0.153, 1.565 - abs(lane) * 0.026),
            (lane * 0.090 - 0.150 + wave * 0.028, 0.196, 1.455 - abs(lane) * 0.035),
            (lane * 0.105 - 0.255 + wave * 0.040, 0.238, 1.350 - abs(lane) * 0.045),
        )
        add_flattened_lock(
            f"ZhaoYun_V17_Back_Hair_Lock_{index}",
            points,
            (0.0012, 0.0024, 0.0029, 0.0021, 0.00025),
            raven_soft if index % 2 else raven,
            rig,
            0.40,
        )

    add_parented_strand(
        "ZhaoYun_V17_Temple_Wisp",
        ((-0.056, -0.049, 1.720), (-0.067, -0.071, 1.675), (-0.073, -0.075, 1.610), (-0.071, -0.050, 1.548)),
        0.00055,
        raven,
        rig,
    )


def rebuild_commander_pauldrons(rig, silver, gold, jade):
    for side, sign in (("l", 1.0), ("r", -1.0)):
        hide_prefixes(
            (
                f"ZhaoYun_V5_Pauldron_Curved_Plate_{side}_0",
                f"ZhaoYun_V5_Pauldron_Gold_Edge_{side}_0",
                f"ZhaoYun_V5_Pauldron_Rivet_{side}_0_",
            )
        )
        center = (sign * 0.194, -0.111, 1.400)
        width = 0.128
        height = 0.080
        rotation = math.radians(-sign * 6.0)
        v5.curved_plate(
            f"ZhaoYun_V17_Commander_Pauldron_Cap_{side}",
            center,
            width,
            height,
            0.024,
            silver,
            rotation,
        )
        base.add_curve_strand(
            f"ZhaoYun_V17_Commander_Pauldron_Gold_Crest_{side}",
            v5.plate_top_points(center, width * 0.91, height, rotation),
            0.0028,
            gold,
        )
        boss_center = Vector((sign * 0.202, -0.143, 1.412))
        base.add_ellipsoid(
            f"ZhaoYun_V17_Pauldron_Gold_Boss_{side}",
            tuple(boss_center),
            (0.016, 0.0055, 0.016),
            gold,
            32,
            16,
        )
        base.add_ellipsoid(
            f"ZhaoYun_V17_Pauldron_Jade_Boss_{side}",
            tuple(boss_center + Vector((0.0, -0.005, 0.0))),
            (0.0095, 0.0035, 0.0095),
            jade,
            28,
            14,
        )
        front_y = -0.143
        motifs = (
            [
                (sign * 0.135, front_y, 1.402),
                (sign * 0.165, front_y - 0.002, 1.425),
                (sign * 0.202, front_y - 0.004, 1.412),
            ],
            [
                (sign * 0.202, front_y - 0.004, 1.412),
                (sign * 0.240, front_y - 0.002, 1.430),
                (sign * 0.292, front_y, 1.394),
            ],
            [
                (sign * 0.151, front_y, 1.382),
                (sign * 0.202, front_y - 0.004, 1.397),
                (sign * 0.274, front_y, 1.372),
            ],
        )
        for index, points in enumerate(motifs):
            base.add_curve_strand(
                f"ZhaoYun_V17_Pauldron_Filigree_{side}_{index}",
                points,
                0.0015,
                gold,
            )


def rebuild_layered_cape(ivory, ivory_shadow, gold):
    hide_prefixes(("ZhaoYun_V6_Pleated_White_Cape_", "ZhaoYun_V6_Cape_Gold_Trim_"))
    panels = (
        (
            "Inner",
            [((-0.120, 0.128, 1.444), 0.082), ((-0.130, 0.175, 1.225), 0.098), ((-0.128, 0.235, 0.980), 0.112), ((-0.105, 0.300, 0.720), 0.118), ((-0.062, 0.352, 0.440), 0.102), ((-0.018, 0.380, 0.305), 0.070)],
            0.25,
            ivory,
        ),
        (
            "Middle_Inner",
            [((-0.025, 0.132, 1.448), 0.084), ((-0.008, 0.185, 1.220), 0.101), ((0.030, 0.250, 0.960), 0.117), ((0.092, 0.315, 0.675), 0.121), ((0.170, 0.370, 0.390), 0.099), ((0.225, 0.398, 0.250), 0.066)],
            1.15,
            ivory_shadow,
        ),
        (
            "Middle_Outer",
            [((0.070, 0.136, 1.442), 0.081), ((0.112, 0.192, 1.205), 0.099), ((0.185, 0.258, 0.935), 0.114), ((0.280, 0.325, 0.650), 0.117), ((0.380, 0.382, 0.375), 0.095), ((0.445, 0.410, 0.245), 0.062)],
            2.05,
            ivory,
        ),
        (
            "Outer",
            [((0.155, 0.142, 1.428), 0.070), ((0.222, 0.202, 1.180), 0.088), ((0.325, 0.270, 0.905), 0.102), ((0.445, 0.338, 0.625), 0.105), ((0.565, 0.395, 0.385), 0.084), ((0.640, 0.425, 0.300), 0.052)],
            3.00,
            ivory_shadow,
        ),
    )
    for name, rows, phase, material in panels:
        v6.pleated_panel(
            f"ZhaoYun_V17_Layered_Cape_{name}",
            rows,
            material,
            phase,
            4.2,
            0.024,
            0.0048,
            0.0050,
            0.0120,
            0.23,
        )
        for side in (-1, 1):
            base.add_curve_strand(
                f"ZhaoYun_V17_Cape_Gold_Trim_{name}_{side}",
                v6.edge_points(rows, side, phase, 4.2, 0.0050, 0.0120, 0.23),
                0.0017,
                gold,
            )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    raven = bpy.data.materials["ZY15_Raven_Hair"]
    raven_soft = bpy.data.materials["ZY15_Raven_Hair_Soft"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    ivory = bpy.data.materials["ZY6_Pleated_Ivory_Silk"]
    ivory_shadow = bpy.data.materials["ZY16_Shadowed_Ivory_Silk"]

    rebuild_flowing_hair(rig, raven, raven_soft)
    rebuild_commander_pauldrons(rig, silver, gold, jade)
    rebuild_layered_cape(ivory, ivory_shadow, gold)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
