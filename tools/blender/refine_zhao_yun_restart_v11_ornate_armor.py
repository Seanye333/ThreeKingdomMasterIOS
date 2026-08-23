"""Replace blocky test armor with layered silver lamellae and jade ornament."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v10-ornate-circlet.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v11-ornate-armor.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def bevel(obj, width=0.0035, segments=3):
    modifier = obj.modifiers.new("Forged edge bevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments


def hide_blocky_test_plates():
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_Restart_V6_Shoulder_Plate_"):
            obj.hide_render = True
            obj.hide_set(True)


def create_lamella(name, location, scale, material, rotation=(0.0, 0.0, 0.0)):
    x, y, z = scale
    vertices = [
        (-x, -y, z * 0.55),
        (x, -y, z * 0.55),
        (x * 0.78, -y, -z * 0.58),
        (0.0, -y, -z),
        (-x * 0.78, -y, -z * 0.58),
        (-x, y, z * 0.55),
        (x, y, z * 0.55),
        (x * 0.78, y, -z * 0.58),
        (0.0, y, -z),
        (-x * 0.78, y, -z * 0.58),
    ]
    faces = [
        (0, 1, 2, 3, 4),
        (9, 8, 7, 6, 5),
        (0, 5, 6, 1),
        (1, 6, 7, 2),
        (2, 7, 8, 3),
        (3, 8, 9, 4),
        (4, 9, 5, 0),
    ]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    bevel(obj, min(x, z) * 0.14, 3)
    return obj


def layered_shoulders(silver, dark, gold, jade):
    for side in (-1.0, 1.0):
        for layer in range(4):
            x = side * (0.155 + layer * 0.042)
            z = 1.466 - layer * 0.030
            plate = create_lamella(
                f"ZhaoYun_Restart_V11_Shoulder_Lamella_{int(side)}_{layer}",
                (x, -0.107 + layer * 0.004, z),
                (0.057 + layer * 0.004, 0.010, 0.045),
                silver if layer % 2 == 0 else dark,
                (0.0, math.radians(side * (7.0 + layer * 3.0)), math.radians(-side * 4.0)),
            )
            if layer % 2:
                plate.data.materials[0] = silver
            # Gold crest along the upper shoulder arc.
            base.add_curve_strand(
                f"ZhaoYun_Restart_V11_Shoulder_Gold_Ridge_{int(side)}_{layer}",
                [
                    (x - side * 0.046, -0.119, z + 0.023),
                    (x, -0.122, z + 0.032),
                    (x + side * 0.046, -0.116, z + 0.022),
                ],
                0.00145,
                gold,
            )
        halo = base.add_ellipsoid(
            f"ZhaoYun_Restart_V11_Shoulder_Jade_Halo_{int(side)}",
            (side * 0.202, -0.128, 1.463),
            (0.022, 0.0042, 0.022),
            gold,
            36,
            18,
        )
        gem = base.add_ellipsoid(
            f"ZhaoYun_Restart_V11_Shoulder_Jade_{int(side)}",
            (side * 0.202, -0.133, 1.463),
            (0.014, 0.0033, 0.014),
            jade,
            32,
            16,
        )
        halo.rotation_euler.y = math.radians(side * 8.0)
        gem.rotation_euler.y = math.radians(side * 8.0)


def chest_lamellae(silver, dark, gold, jade):
    for row in range(4):
        columns = 5 if row % 2 == 0 else 6
        spacing = 0.048
        offset = 0.0 if columns == 5 else spacing * 0.5
        for column in range(columns):
            x = (column - (columns - 1) / 2) * spacing
            z = 1.430 - row * 0.043
            y = -0.162 + abs(x) * 0.030
            create_lamella(
                f"ZhaoYun_Restart_V11_Chest_Lamella_{row}_{column}",
                (x + (offset if columns == 6 else 0.0) * 0.0, y, z),
                (0.022, 0.0065, 0.025),
                silver if (row + column) % 3 else dark,
            )

    # Central reference-style jeweled clasp and winged cloud flourish.
    halo = base.add_ellipsoid(
        "ZhaoYun_Restart_V11_Chest_Clasp_Halo",
        (0.0, -0.184, 1.405),
        (0.035, 0.006, 0.035),
        gold,
        48,
        24,
    )
    gem = base.add_ellipsoid(
        "ZhaoYun_Restart_V11_Chest_Clasp_Jade",
        (0.0, -0.191, 1.405),
        (0.023, 0.0045, 0.023),
        jade,
        40,
        20,
    )
    halo.rotation_euler.y = math.radians(45.0)
    gem.rotation_euler.y = math.radians(45.0)
    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V11_Chest_Clasp_Wing_{int(side)}",
            [
                (side * 0.015, -0.194, 1.410),
                (side * 0.060, -0.190, 1.425),
                (side * 0.105, -0.178, 1.409),
                (side * 0.142, -0.162, 1.426),
            ],
            0.0022,
            gold,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    silver = bpy.data.materials["ZhaoYun_Restart_V6_Moon_Silver"]
    dark = bpy.data.materials["ZhaoYun_Restart_V6_Blue_Black"]
    gold = bpy.data.materials["ZhaoYun_Restart_V6_Pale_Gold"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    hide_blocky_test_plates()
    layered_shoulders(silver, dark, gold, jade)
    chest_lamellae(silver, dark, gold, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
