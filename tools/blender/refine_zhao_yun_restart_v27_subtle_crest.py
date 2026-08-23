"""Add a restrained dark-silver crest to the clean V24 portrait."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v24-skin-eyes.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v27-subtle-crest.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def extruded_plate(name, outline, front_y, depth, material):
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
    bevel = obj.modifiers.new("Subtle forged edge", "BEVEL")
    bevel.width = 0.00075
    bevel.segments = 3
    return obj


def add_subtle_crest(dark_silver, edge_silver, jade):
    outline = [
        (-0.0090, 1.688),
        (-0.0110, 1.699),
        (-0.0060, 1.708),
        (0.0000, 1.723),
        (0.0060, 1.708),
        (0.0110, 1.699),
        (0.0090, 1.688),
    ]
    extruded_plate("ZhaoYun_Restart_V27_Subtle_Crest", outline, -0.106, 0.0045, dark_silver)
    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V27_Crest_Edge_{int(side)}",
            [
                (side * 0.001, -0.111, 1.691),
                (side * 0.006, -0.111, 1.704),
                (0.0, -0.111, 1.718),
            ],
            0.00072,
            edge_silver,
        )
    base.add_ellipsoid(
        "ZhaoYun_Restart_V27_Crest_Jade",
        (0.0, -0.113, 1.706),
        (0.0030, 0.00135, 0.0037),
        jade,
        20,
        10,
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    dark_silver = bpy.data.materials["ZhaoYun_Restart_V13_Engraved_Silver"]
    edge_silver = bpy.data.materials["ZhaoYun_Restart_V13_Edge_Silver"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    add_subtle_crest(dark_silver, edge_silver, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
