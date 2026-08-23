"""Build clearly separated forged scale mail and wing-shaped pauldrons."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v11-ornate-armor.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v13-forged-armor.blend"

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


def extruded_plate(name, outline, front_y, depth, material, bevel_width=0.002):
    count = len(outline)
    vertices = [(x, front_y, z) for x, z in outline]
    vertices.extend((x, front_y + depth, z) for x, z in outline)
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, next_index, count + next_index, count + index))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    modifier = obj.modifiers.new("Forged edge", "BEVEL")
    modifier.width = bevel_width
    modifier.segments = 3
    return obj


def scale_outline(cx, cz, width, height):
    return [
        (cx - width, cz + height),
        (cx + width, cz + height),
        (cx + width, cz + 0.08 * height),
        (cx + 0.82 * width, cz - 0.46 * height),
        (cx + 0.45 * width, cz - 0.84 * height),
        (cx, cz - height),
        (cx - 0.45 * width, cz - 0.84 * height),
        (cx - 0.82 * width, cz - 0.46 * height),
        (cx - width, cz + 0.08 * height),
    ]


def add_bordered_scale(name, cx, y, cz, border, silver):
    extruded_plate(
        name + "_Border",
        scale_outline(cx, cz, 0.0195, 0.0190),
        y + 0.0030,
        0.0040,
        border,
        0.0014,
    )
    extruded_plate(
        name + "_Silver",
        scale_outline(cx, cz + 0.0004, 0.0160, 0.0155),
        y,
        0.0030,
        silver,
        0.0012,
    )


def chest_mail(silver, bright_silver, border, gold):
    for row in range(5):
        columns = 7 if row % 2 == 0 else 6
        z = 1.447 - row * 0.034
        for column in range(columns):
            x = (column - (columns - 1) / 2) * 0.042
            y = -0.169 + abs(x) * 0.028
            add_bordered_scale(
                f"ZhaoYun_Restart_V13_Chest_Scale_{row}_{column}",
                x,
                y,
                z,
                border,
                bright_silver if (row + column) % 3 == 0 else silver,
            )

    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V13_Chest_Gold_Rib_{int(side)}",
            [
                (side * 0.018, -0.186, 1.467),
                (side * 0.064, -0.183, 1.480),
                (side * 0.112, -0.176, 1.468),
                (side * 0.151, -0.160, 1.445),
            ],
            0.0016,
            gold,
        )


def shoulder_wings(silver, bright_silver, border, gold, jade):
    for side in (-1.0, 1.0):
        def sx(value):
            return side * value

        outer = [
            (sx(0.124), 1.482),
            (sx(0.176), 1.508),
            (sx(0.248), 1.502),
            (sx(0.330), 1.466),
            (sx(0.342), 1.438),
            (sx(0.300), 1.405),
            (sx(0.226), 1.414),
            (sx(0.158), 1.440),
        ]
        inner = [
            (sx(0.134), 1.480),
            (sx(0.181), 1.499),
            (sx(0.244), 1.493),
            (sx(0.317), 1.463),
            (sx(0.324), 1.442),
            (sx(0.293), 1.417),
            (sx(0.230), 1.424),
            (sx(0.164), 1.447),
        ]
        # Keep mirrored winding consistent for the front face.
        if side < 0:
            outer.reverse()
            inner.reverse()
        extruded_plate(
            f"ZhaoYun_Restart_V13_Pauldron_Border_{int(side)}",
            outer,
            -0.111,
            0.012,
            border,
            0.0030,
        )
        extruded_plate(
            f"ZhaoYun_Restart_V13_Pauldron_Wing_{int(side)}",
            inner,
            -0.116,
            0.008,
            silver,
            0.0025,
        )

        # Three raised ribs make the wing feel forged rather than flat.
        for rib, z_offset in enumerate((0.0, -0.018, -0.036)):
            base.add_curve_strand(
                f"ZhaoYun_Restart_V13_Pauldron_Rib_{int(side)}_{rib}",
                [
                    (sx(0.151), -0.122, 1.480 + z_offset),
                    (sx(0.205), -0.123, 1.490 + z_offset),
                    (sx(0.264), -0.119, 1.476 + z_offset),
                    (sx(0.309), -0.111, 1.454 + z_offset),
                ],
                0.00165 if rib else 0.0021,
                gold if rib == 0 else bright_silver,
            )

        # Small central cloud-dragon eye.
        base.add_ellipsoid(
            f"ZhaoYun_Restart_V13_Pauldron_Eye_Halo_{int(side)}",
            (sx(0.198), -0.128, 1.480),
            (0.0115, 0.0030, 0.0090),
            gold,
            28,
            14,
        )
        base.add_ellipsoid(
            f"ZhaoYun_Restart_V13_Pauldron_Eye_{int(side)}",
            (sx(0.198), -0.132, 1.480),
            (0.0058, 0.0022, 0.0045),
            jade,
            24,
            12,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hide_superseded_armor()
    silver = base.make_material("ZhaoYun_Restart_V13_Engraved_Silver", (0.20, 0.25, 0.33), 0.86, 0.29)
    bright_silver = base.make_material("ZhaoYun_Restart_V13_Edge_Silver", (0.34, 0.40, 0.50), 0.90, 0.22)
    border = base.make_material("ZhaoYun_Restart_V13_Scale_Border", (0.014, 0.025, 0.046), 0.52, 0.30)
    gold = bpy.data.materials["ZhaoYun_Restart_V6_Pale_Gold"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    chest_mail(silver, bright_silver, border, gold)
    shoulder_wings(silver, bright_silver, border, gold, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
