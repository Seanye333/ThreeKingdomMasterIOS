"""Add restrained tapered black hair ribbons for a low windswept ponytail."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v28-sharper-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v29-low-ponytail.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def add_ribbon(name, points, half_widths, material):
    centers = [Vector(point) for point in points]
    view_normal = Vector((0.0, -1.0, 0.0))
    vertices = []
    for index, (center, width) in enumerate(zip(centers, half_widths)):
        if index == 0:
            tangent = centers[1] - center
        elif index == len(centers) - 1:
            tangent = center - centers[index - 1]
        else:
            tangent = centers[index + 1] - centers[index - 1]
        side = tangent.cross(view_normal)
        if side.length < 1e-6:
            side = Vector((1.0, 0.0, 0.0))
        else:
            side.normalize()
        vertices.extend((center - side * width, center + side * width))
    faces = []
    for index in range(len(centers) - 1):
        start = index * 2
        faces.append((start, start + 1, start + 3, start + 2))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    solidify = obj.modifiers.new("Fine hair thickness", "SOLIDIFY")
    solidify.thickness = 0.00045
    solidify.offset = 0.0
    bevel = obj.modifiers.new("Soft hair edge", "BEVEL")
    bevel.width = 0.00038
    bevel.segments = 2
    return obj


def add_low_ponytail(hair, highlight):
    for index in range(9):
        lane = (index - 4) / 4.0
        wave = math.sin(index * 1.37) * 0.014
        points = [
            (lane * 0.008, 0.070, 1.735 + lane * 0.012),
            (-0.060 + lane * 0.012, 0.105, 1.708 + lane * 0.018),
            (-0.145 + lane * 0.024 + wave, 0.145, 1.680 + lane * 0.026),
            (-0.245 + lane * 0.040 + wave, 0.185, 1.635 + lane * 0.038),
            (-0.345 + lane * 0.055, 0.220, 1.575 + lane * 0.048),
        ]
        widths = (
            0.0065 - abs(lane) * 0.0012,
            0.0075 - abs(lane) * 0.0015,
            0.0062 - abs(lane) * 0.0012,
            0.0040 - abs(lane) * 0.0007,
            0.00055,
        )
        add_ribbon(
            f"ZhaoYun_Restart_V29_Ponytail_Ribbon_{index}",
            points,
            widths,
            highlight if index in {2, 6} else hair,
        )

    # Small dark clasp sits behind the existing head silhouette.
    clasp = base.add_ellipsoid(
        "ZhaoYun_Restart_V29_Ponytail_Clasp",
        (-0.018, 0.076, 1.725),
        (0.025, 0.010, 0.014),
        bpy.data.materials["ZhaoYun_Restart_V13_Engraved_Silver"],
        32,
        16,
    )
    clasp.rotation_euler.z = math.radians(-14.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hair = base.make_material("ZhaoYun_Restart_V29_Ribbon_Hair", (0.0012, 0.0022, 0.0060), 0.0, 0.72)
    highlight = base.make_material("ZhaoYun_Restart_V29_Ribbon_Highlight", (0.0040, 0.0080, 0.0180), 0.0, 0.58)
    for material in (hair, highlight):
        shader = material.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Specular IOR Level"].default_value = 0.12
    add_low_ponytail(hair, highlight)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
