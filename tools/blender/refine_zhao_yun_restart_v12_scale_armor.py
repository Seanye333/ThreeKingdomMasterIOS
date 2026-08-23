"""Refine Zhao Yun's armor into thin overlapping scale mail and filigree."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v11-ornate-armor.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v12-scale-armor.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def hide_superseded_armor():
    prefixes = (
        "ZhaoYun_Restart_V6_Shoulder_Plate_",
        "ZhaoYun_Restart_V6_Shoulder_Gold_",
        "ZhaoYun_Restart_V6_Shoulder_Jade_",
        "ZhaoYun_Restart_V11_Shoulder_",
        "ZhaoYun_Restart_V11_Chest_Lamella_",
    )
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def scale_tile(name, location, width, height, depth, material, rotation=(0.0, 0.0, 0.0)):
    outline = [
        (-width, height),
        (width, height),
        (width, 0.10 * height),
        (0.82 * width, -0.42 * height),
        (0.46 * width, -0.82 * height),
        (0.0, -height),
        (-0.46 * width, -0.82 * height),
        (-0.82 * width, -0.42 * height),
        (-width, 0.10 * height),
    ]
    vertices = []
    for y in (-depth, depth):
        vertices.extend((x, y, z) for x, z in outline)
    count = len(outline)
    faces = [tuple(range(count)), tuple(range(count, count * 2))]
    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, next_index, count + next_index, count + index))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    modifier = obj.modifiers.new("Soft forged rim", "BEVEL")
    modifier.width = min(width, height) * 0.12
    modifier.segments = 3
    return obj


def chest_scale_mail(silver, pale_silver, dark, gold):
    # Dense, thin rows with alternate offsets create a true scale-mail read.
    for row in range(5):
        columns = 7 if row % 2 == 0 else 8
        spacing = 0.041
        z = 1.444 - row * 0.030
        for column in range(columns):
            x = (column - (columns - 1) / 2) * spacing
            y = -0.169 + abs(x) * 0.032 - row * 0.0008
            material = pale_silver if (row + column) % 3 else silver
            scale_tile(
                f"ZhaoYun_Restart_V12_Chest_Scale_{row}_{column}",
                (x, y, z),
                0.019,
                0.020,
                0.0033,
                material,
            )

    # Fine gold ribs bind the scale field without dominating the face.
    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V12_Chest_Gold_Sweep_{int(side)}",
            [
                (side * 0.018, -0.181, 1.458),
                (side * 0.070, -0.180, 1.472),
                (side * 0.128, -0.171, 1.454),
                (side * 0.158, -0.155, 1.430),
            ],
            0.0015,
            gold,
        )


def shoulder_scale_mail(silver, pale_silver, gold, jade):
    # Preserve the smooth curved V6 pauldron as the forged base, then cover the
    # visible front with overlapping rounded scales and restrained dragon curls.
    for side in (-1.0, 1.0):
        for row, (z, count, start_x) in enumerate(
            (
                (1.468, 3, 0.158),
                (1.438, 4, 0.150),
                (1.408, 4, 0.166),
            )
        ):
            for column in range(count):
                x_abs = start_x + column * 0.040
                x = side * x_abs
                y = -0.111 + column * 0.004
                material = pale_silver if (row + column) % 2 else silver
                scale_tile(
                    f"ZhaoYun_Restart_V12_Shoulder_Scale_{int(side)}_{row}_{column}",
                    (x, y, z),
                    0.0215,
                    0.021,
                    0.0038,
                    material,
                    (0.0, math.radians(side * (4.0 + column * 2.0)), 0.0),
                )

        # A small jade dragon eye, not the oversized test badge.
        base.add_ellipsoid(
            f"ZhaoYun_Restart_V12_Shoulder_Dragon_Eye_Halo_{int(side)}",
            (side * 0.205, -0.124, 1.480),
            (0.0125, 0.0032, 0.010),
            gold,
            28,
            14,
        )
        base.add_ellipsoid(
            f"ZhaoYun_Restart_V12_Shoulder_Dragon_Eye_{int(side)}",
            (side * 0.205, -0.128, 1.480),
            (0.0067, 0.0023, 0.0053),
            jade,
            24,
            12,
        )
        for curl_index, points in enumerate(
            (
                [
                    (side * 0.185, -0.130, 1.481),
                    (side * 0.225, -0.130, 1.494),
                    (side * 0.267, -0.118, 1.476),
                    (side * 0.294, -0.103, 1.448),
                ],
                [
                    (side * 0.186, -0.131, 1.467),
                    (side * 0.218, -0.132, 1.450),
                    (side * 0.254, -0.122, 1.454),
                ],
            )
        ):
            base.add_curve_strand(
                f"ZhaoYun_Restart_V12_Shoulder_Dragon_Curl_{int(side)}_{curl_index}",
                points,
                0.0017,
                gold,
            )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hide_superseded_armor()
    silver = bpy.data.materials["ZhaoYun_Restart_V6_Moon_Silver"]
    pale_silver = bpy.data.materials.get("ZhaoYun_Restart_V6_Silver") or silver
    dark = bpy.data.materials["ZhaoYun_Restart_V6_Blue_Black"]
    gold = bpy.data.materials["ZhaoYun_Restart_V6_Pale_Gold"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    chest_scale_mail(silver, pale_silver, dark, gold)
    shoulder_scale_mail(silver, pale_silver, gold, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
