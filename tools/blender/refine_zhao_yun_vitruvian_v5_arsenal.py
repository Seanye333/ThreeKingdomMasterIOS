"""Refine Zhao Yun v4 with a presentation-quality spear and layered armor."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v4-fullbody.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v5-arsenal.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def curved_plate(name, center, width, height, bulge, material, rotation_z=0.0):
    """Create a tapered, subtly convex overlapping armor plate."""
    center = Vector(center)
    rows, columns = 6, 10
    cosine = math.cos(rotation_z)
    sine = math.sin(rotation_z)
    verts = []
    for row in range(rows):
        v = row / (rows - 1)
        local_z = (0.5 - v) * height
        taper = 1.0 - 0.22 * v
        for column in range(columns):
            u = column / (columns - 1)
            normalized_x = u * 2.0 - 1.0
            local_x = normalized_x * width * 0.5 * taper
            local_y = -bulge * (1.0 - normalized_x * normalized_x) * (0.72 + 0.28 * math.sin(math.pi * v))
            rotated_x = local_x * cosine - local_z * sine
            rotated_z = local_x * sine + local_z * cosine
            verts.append(tuple(center + Vector((rotated_x, local_y, rotated_z))))
    faces = []
    for row in range(rows - 1):
        for column in range(columns - 1):
            a = row * columns + column
            b = a + columns
            faces.append((a, a + 1, b + 1, b))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    plate = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(plate)
    v4.assign(plate, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    solid = plate.modifiers.new(name + "_Thickness", "SOLIDIFY")
    solid.thickness = 0.008
    solid.offset = 0.0
    bevel = plate.modifiers.new(name + "_Soft_Edge", "BEVEL")
    bevel.width = 0.0028
    bevel.segments = 3
    return plate


def plate_top_points(center, width, height, rotation_z):
    center = Vector(center)
    cosine = math.cos(rotation_z)
    sine = math.sin(rotation_z)
    points = []
    for step in range(9):
        local_x = (step / 8.0 * 2.0 - 1.0) * width * 0.5
        local_z = height * 0.5
        points.append(
            tuple(
                center
                + Vector(
                    (
                        local_x * cosine - local_z * sine,
                        -0.010,
                        local_x * sine + local_z * cosine,
                    )
                )
            )
        )
    return points


def build_layered_pauldrons(rig, navy, silver, gold, crimson):
    hide_prefixes(("ZhaoYun_V4_Pauldron_",))
    for side, sign in (("l", 1.0), ("r", -1.0)):
        # Narrow leather foundation follows the shoulder without reintroducing
        # the balloon silhouette removed in v4.
        pad = base.add_ellipsoid(
            f"ZhaoYun_V5_Pauldron_Leather_Base_{side}",
            (sign * 0.202, -0.078, 1.356),
            (0.097, 0.043, 0.040),
            navy,
            56,
            28,
        )
        pad.rotation_euler.y = math.radians(sign * 10.0)

        layers = (
            ((sign * 0.190, -0.105, 1.395), 0.142, 0.074, 0.019, math.radians(-sign * 7.0)),
            ((sign * 0.218, -0.112, 1.338), 0.132, 0.075, 0.020, math.radians(-sign * 12.0)),
            ((sign * 0.239, -0.118, 1.282), 0.116, 0.071, 0.020, math.radians(-sign * 17.0)),
        )
        for index, (center, width, height, bulge, rotation) in enumerate(layers):
            curved_plate(
                f"ZhaoYun_V5_Pauldron_Curved_Plate_{side}_{index}",
                center,
                width,
                height,
                bulge,
                silver,
                rotation,
            )
            base.add_curve_strand(
                f"ZhaoYun_V5_Pauldron_Gold_Edge_{side}_{index}",
                plate_top_points(center, width * 0.92, height, rotation),
                0.0025,
                gold,
            )
            for rivet_index in range(3):
                across = (rivet_index - 1) * width * 0.29
                x = center[0] + across * math.cos(rotation)
                z = center[2] + height * 0.28 + across * math.sin(rotation)
                base.add_ellipsoid(
                    f"ZhaoYun_V5_Pauldron_Rivet_{side}_{index}_{rivet_index}",
                    (x, center[1] - bulge - 0.005, z),
                    (0.0042, 0.0022, 0.0042),
                    gold,
                    20,
                    10,
                )

        shoulder = v4.bone_point(rig, f"upperarm_{side}", "head")
        elbow = v4.bone_point(rig, f"lowerarm_{side}", "head")
        tangent = elbow - shoulder
        for factor in (0.26, 0.48):
            center = shoulder.lerp(elbow, factor) + Vector((sign * 0.018, -0.038, 0.0))
            v4.ring_curve(
                f"ZhaoYun_V5_Upperarm_Binding_{side}_{int(factor * 100)}",
                center,
                tangent,
                0.058,
                0.058,
                crimson if factor < 0.4 else gold,
                0.0023,
            )


def build_breastplate_details(silver, gold, crimson):
    # Gold framing visually binds the many small lamellae into one cuirass.
    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_V5_Breastplate_Gold_Side_{int(side)}",
            [(side * 0.188, -0.110, 1.455), (side * 0.213, -0.120, 1.350), (side * 0.225, -0.112, 1.225)],
            0.0031,
            gold,
        )
        base.add_curve_strand(
            f"ZhaoYun_V5_Breastplate_Crimson_Lacing_{int(side)}",
            [(side * 0.154, -0.126, 1.448), (side * 0.165, -0.137, 1.340), (side * 0.176, -0.126, 1.235)],
            0.0017,
            crimson,
        )
    base.add_curve_strand(
        "ZhaoYun_V5_Breastplate_Gold_Bottom",
        [(-0.220, -0.112, 1.220), (-0.110, -0.137, 1.202), (0.0, -0.143, 1.197), (0.110, -0.137, 1.202), (0.220, -0.112, 1.220)],
        0.0032,
        gold,
    )

    # A low-profile central guard reinforces the jade clasp without hiding it.
    for side in (-1.0, 1.0):
        curved_plate(
            f"ZhaoYun_V5_Clasp_Wing_{int(side)}",
            (side * 0.052, -0.147, 1.365),
            0.082,
            0.036,
            0.008,
            silver,
            math.radians(-side * 8.0),
        )


def build_waist_reinforcement(silver, gold, crimson):
    base.add_curve_strand(
        "ZhaoYun_V5_Waist_Gold_Rail",
        [(-0.215, -0.187, 1.042), (-0.108, -0.198, 1.052), (0.0, -0.202, 1.055), (0.108, -0.198, 1.052), (0.215, -0.187, 1.042)],
        0.0040,
        gold,
    )
    for side in (-1.0, 1.0):
        for index in range(3):
            center = (side * (0.210 + index * 0.024), -0.174 + index * 0.004, 0.965 - index * 0.068)
            plate = curved_plate(
                f"ZhaoYun_V5_Hip_Guard_{int(side)}_{index}",
                center,
                0.068 - index * 0.005,
                0.076,
                0.012,
                silver,
                math.radians(-side * (9.0 + index * 5.0)),
            )
            base.add_ellipsoid(
                f"ZhaoYun_V5_Hip_Guard_Rivet_{int(side)}_{index}",
                (center[0], center[1] - 0.018, center[2] + 0.021),
                (0.0038, 0.0020, 0.0038),
                gold,
                20,
                10,
            )
        base.add_curve_strand(
            f"ZhaoYun_V5_Hip_Crimson_Cord_{int(side)}",
            [(side * 0.210, -0.191, 1.015), (side * 0.232, -0.188, 0.920), (side * 0.255, -0.180, 0.815)],
            0.0018,
            crimson,
        )


def build_helmet_reinforcement(rig, silver, gold):
    # Four raised ribs break up the plain dome and catch highlights.
    ribs = (
        [(-0.010, -0.093, 1.710), (-0.028, -0.076, 1.762), (-0.022, -0.030, 1.802), (0.0, 0.004, 1.811)],
        [(0.010, -0.093, 1.710), (0.028, -0.076, 1.762), (0.022, -0.030, 1.802), (0.0, 0.004, 1.811)],
        [(-0.088, -0.030, 1.705), (-0.070, -0.020, 1.760), (-0.040, -0.005, 1.798), (0.0, 0.004, 1.811)],
        [(0.088, -0.030, 1.705), (0.070, -0.020, 1.760), (0.040, -0.005, 1.798), (0.0, 0.004, 1.811)],
    )
    for index, points in enumerate(ribs):
        rib = base.add_curve_strand(f"ZhaoYun_V5_Helmet_Rib_{index}", points, 0.0024, gold)
        v4.parent_to_bone_keep_transform(rib, rig, "head")

    for side in (-1.0, 1.0):
        guard = curved_plate(
            f"ZhaoYun_V5_Helmet_Ear_Guard_{int(side)}",
            (side * 0.102, -0.034, 1.642),
            0.029,
            0.105,
            0.009,
            silver,
            math.radians(-side * 5.0),
        )
        v4.parent_to_bone_keep_transform(guard, rig, "head")
        edge = base.add_curve_strand(
            f"ZhaoYun_V5_Helmet_Ear_Gold_{int(side)}",
            [(side * 0.096, -0.047, 1.690), (side * 0.105, -0.049, 1.648), (side * 0.108, -0.046, 1.597)],
            0.0021,
            gold,
        )
        v4.parent_to_bone_keep_transform(edge, rig, "head")


def helix_strand(name, start, end, turns, radius, phase, material, thickness):
    start, end = Vector(start), Vector(end)
    direction = (end - start).normalized()
    axis_a = Vector((0.0, 1.0, 0.0))
    axis_b = direction.cross(axis_a).normalized()
    points = []
    steps = max(48, int(turns * 20))
    for step in range(steps + 1):
        factor = step / steps
        angle = math.tau * turns * factor + phase
        center = start.lerp(end, factor)
        point = center + axis_a * math.cos(angle) * radius + axis_b * math.sin(angle) * radius
        points.append(tuple(point))
    return base.add_curve_strand(name, points, thickness, material)


def build_dragon_spear(leather, silver, gold, crimson):
    bottom = Vector((-0.42, -0.285, 0.015))
    socket = Vector((-0.25, -0.285, 2.20))
    tip = Vector((-0.232, -0.285, 2.44))
    direction = (tip - socket).normalized()

    grip_bottom = v4.point_on_spear(0.955)
    grip_top = v4.point_on_spear(1.245)
    v4.cylinder_between("ZhaoYun_V5_Spear_Leather_Grip", grip_bottom, grip_top, 0.0158, leather, 56)
    helix_strand("ZhaoYun_V5_Spear_Grip_Gold_Wrap", grip_bottom, grip_top, 9.0, 0.0164, 0.0, gold, 0.00155)
    helix_strand("ZhaoYun_V5_Spear_Grip_Crimson_Wrap", grip_bottom, grip_top, 9.0, 0.0167, math.pi, crimson, 0.00135)
    for index, point in enumerate((grip_bottom, grip_top)):
        v4.ring_curve(f"ZhaoYun_V5_Spear_Grip_Collar_{index}", point, grip_top - grip_bottom, 0.0180, 0.0180, gold, 0.0026)

    for index, z in enumerate((0.45, 0.72, 1.52, 1.88)):
        point = v4.point_on_spear(z)
        v4.ring_curve(f"ZhaoYun_V5_Spear_Shaft_Band_{index}", point, grip_top - grip_bottom, 0.0140, 0.0140, gold, 0.0019)

    # Counterweighted spear shoe at the butt.
    shoe_end = bottom + (grip_top - grip_bottom).normalized() * 0.105
    v4.cylinder_between("ZhaoYun_V5_Spear_Butt_Shoe", bottom, shoe_end, 0.0190, silver, 48)
    v4.ring_curve("ZhaoYun_V5_Spear_Butt_Gold_Ring", shoe_end, grip_top - grip_bottom, 0.0200, 0.0200, gold, 0.0025)

    # Three-part ornate socket and scale-like studs.
    for index, distance in enumerate((-0.072, -0.040, -0.010, 0.020)):
        point = socket + direction * distance
        v4.ring_curve(f"ZhaoYun_V5_Spear_Dragon_Collar_{index}", point, direction, 0.023 - index * 0.0013, 0.023 - index * 0.0013, gold, 0.0026)
    axis_a = Vector((0.0, 1.0, 0.0))
    axis_b = direction.cross(axis_a).normalized()
    for index in range(8):
        angle = math.tau * index / 8.0
        center = socket - direction * 0.038 + axis_a * math.cos(angle) * 0.020 + axis_b * math.sin(angle) * 0.020
        base.add_ellipsoid(
            f"ZhaoYun_V5_Spear_Dragon_Scale_{index}",
            tuple(center),
            (0.0048, 0.0032, 0.0060),
            gold,
            20,
            10,
        )

    # Raised blade ridge and gold edge inlay make the spearhead readable in a
    # bright rim light without changing its classical leaf silhouette.
    blade_front_y = -0.292
    base.add_curve_strand(
        "ZhaoYun_V5_Spear_Blade_Central_Ridge",
        [(socket.x, blade_front_y, socket.z + 0.010), ((socket.x + tip.x) * 0.5, blade_front_y - 0.002, (socket.z + tip.z) * 0.5), (tip.x, blade_front_y, tip.z - 0.012)],
        0.0032,
        silver,
    )
    widest = socket.lerp(tip, 0.38)
    side_vector = Vector((-direction.z, 0.0, direction.x)).normalized() * 0.048
    for side in (-1.0, 1.0):
        shoulder = widest + side_vector * side
        base.add_curve_strand(
            f"ZhaoYun_V5_Spear_Blade_Gold_Edge_{int(side)}",
            [(socket.x, blade_front_y, socket.z), (shoulder.x, blade_front_y, shoulder.z), (tip.x, blade_front_y, tip.z)],
            0.0017,
            gold,
        )

    tassel_root = socket - direction * 0.064
    for index in range(34):
        angle = math.tau * index / 34.0
        radius = 0.014 + 0.012 * ((index % 5) / 4.0)
        radial = axis_a * math.cos(angle) * radius + axis_b * math.sin(angle) * radius
        sway = Vector((0.040 + 0.020 * math.sin(index * 1.7), 0.010 * math.cos(index), -0.185 - 0.025 * math.sin(index * 2.2)))
        base.add_curve_strand(
            f"ZhaoYun_V5_Spear_Crimson_Tassel_{index}",
            [tuple(tassel_root + radial * 0.25), tuple(tassel_root + radial), tuple(tassel_root + radial * 1.45 + sway * 0.55), tuple(tassel_root + radial * 1.15 + sway)],
            0.00155 if index % 6 else 0.0019,
            gold if index % 11 == 0 else crimson,
        )


def build_boot_reinforcement(rig, navy, silver, gold):
    for side in ("l", "r"):
        ankle = v4.bone_point(rig, f"foot_{side}", "head")
        toe = v4.bone_point(rig, f"foot_{side}", "tail")
        direction = toe - ankle
        upper = base.add_ellipsoid(
            f"ZhaoYun_V5_Closed_Boot_Upper_{side}",
            tuple(toe + Vector((0.0, -0.050, 0.030))),
            (0.070, 0.092, 0.046),
            navy,
            48,
            24,
        )
        upper.rotation_euler.z = -math.atan2(direction.x, direction.y)
        cap = base.add_ellipsoid(
            f"ZhaoYun_V5_Armored_Toe_Cap_{side}",
            tuple(toe + Vector((0.0, -0.082, 0.024))),
            (0.063, 0.074, 0.038),
            silver,
            48,
            24,
        )
        cap.rotation_euler.z = -math.atan2(direction.x, direction.y)
        v4.ring_curve(
            f"ZhaoYun_V5_Toe_Cap_Gold_Seam_{side}",
            toe + Vector((0.0, -0.035, 0.035)),
            direction,
            0.058,
            0.046,
            gold,
            0.0020,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    crimson = bpy.data.materials["ZY4_Deep_Crimson"]
    leather = base.make_material("ZY5_Spear_Leather", (0.055, 0.012, 0.008), 0.05, 0.48)

    build_layered_pauldrons(rig, navy, silver, gold, crimson)
    build_breastplate_details(silver, gold, crimson)
    build_waist_reinforcement(silver, gold, crimson)
    build_helmet_reinforcement(rig, silver, gold)
    build_dragon_spear(leather, silver, gold, crimson)
    build_boot_reinforcement(rig, navy, silver, gold)

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
