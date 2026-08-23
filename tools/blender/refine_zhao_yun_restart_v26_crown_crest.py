"""Add a low, solid silver dragon-wing crest behind the forehead jewel."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v25-dragon-relief.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v26-crown-crest.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def extruded_plate(name, outline, front_y, depth, material, bevel_width):
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
    bevel = obj.modifiers.new("Forged crest edge", "BEVEL")
    bevel.width = bevel_width
    bevel.segments = 3
    return obj


def add_crest(silver, dark, gold, jade):
    outer = [
        (-0.015, 1.688),
        (-0.022, 1.708),
        (-0.015, 1.726),
        (-0.008, 1.742),
        (0.000, 1.758),
        (0.008, 1.742),
        (0.015, 1.726),
        (0.022, 1.708),
        (0.015, 1.688),
    ]
    inner = [
        (-0.011, 1.690),
        (-0.016, 1.708),
        (-0.010, 1.725),
        (-0.005, 1.739),
        (0.000, 1.750),
        (0.005, 1.739),
        (0.010, 1.725),
        (0.016, 1.708),
        (0.011, 1.690),
    ]
    extruded_plate("ZhaoYun_Restart_V26_Crest_Dark_Rim", outer, -0.105, 0.006, dark, 0.00125)
    extruded_plate("ZhaoYun_Restart_V26_Crest_Silver", inner, -0.108, 0.004, silver, 0.00105)

    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V26_Crest_Wing_{int(side)}",
            [
                (side * 0.003, -0.112, 1.713),
                (side * 0.013, -0.112, 1.729),
                (side * 0.020, -0.109, 1.718),
                (side * 0.012, -0.111, 1.706),
            ],
            0.00105,
            gold,
        )
    base.add_ellipsoid(
        "ZhaoYun_Restart_V26_Crest_Top_Halo",
        (0.0, -0.113, 1.739),
        (0.0062, 0.0020, 0.0076),
        gold,
        24,
        12,
    )
    base.add_ellipsoid(
        "ZhaoYun_Restart_V26_Crest_Top_Jade",
        (0.0, -0.1155, 1.739),
        (0.0034, 0.0014, 0.0043),
        jade,
        20,
        10,
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    silver = bpy.data.materials["ZhaoYun_Restart_Antique_Silver"]
    dark = bpy.data.materials["ZhaoYun_Restart_V10_Circlet_Recess"]
    gold = bpy.data.materials["ZhaoYun_Restart_V6_Pale_Gold"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    add_crest(silver, dark, gold, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
