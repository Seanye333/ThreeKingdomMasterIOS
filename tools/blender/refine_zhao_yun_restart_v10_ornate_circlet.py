"""Build the ornate silver-and-jade forehead crown from the portrait reference."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v8-clean-circlet.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v10-ornate-circlet.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def centerline(x):
    normalized = x / 0.088
    return (
        x,
        -0.110 + 0.036 * normalized * normalized,
        1.683 - 0.010 * normalized * normalized,
    )


def hide_old_band():
    old = bpy.data.objects.get("ZhaoYun_Restart_Circlet")
    if old:
        old.hide_render = True
        old.hide_set(True)


def build_solid_band(silver, dark):
    columns = 41
    vertices = []
    for row in range(2):
        for index in range(columns):
            x = -0.088 + 0.176 * index / (columns - 1)
            _, y, z = centerline(x)
            vertices.append((x, y, z + (0.0065 if row == 0 else -0.0065)))
    faces = []
    for index in range(columns - 1):
        faces.append((index, index + 1, columns + index + 1, columns + index))
    mesh = bpy.data.meshes.new("ZhaoYun_Restart_V10_Circlet_Band_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    band = bpy.data.objects.new("ZhaoYun_Restart_V10_Circlet_Band", mesh)
    bpy.context.collection.objects.link(band)
    band.data.materials.append(silver)
    solidify = band.modifiers.new("Forged crown thickness", "SOLIDIFY")
    solidify.thickness = 0.0018
    solidify.offset = 0.0
    bevel = band.modifiers.new("Rounded crown edges", "BEVEL")
    bevel.width = 0.00075
    bevel.segments = 3

    upper = []
    lower = []
    for index in range(25):
        x = -0.088 + 0.176 * index / 24
        _, y, z = centerline(x)
        upper.append((x, y - 0.0020, z + 0.0064))
        lower.append((x, y - 0.0020, z - 0.0064))
    base.add_curve_strand("ZhaoYun_Restart_V10_Circlet_Upper_Edge", upper, 0.00115, silver)
    base.add_curve_strand("ZhaoYun_Restart_V10_Circlet_Lower_Edge", lower, 0.00085, dark)


def build_cloud_filigree(silver, dark):
    # Layered mirrored cloud scrolls sit just ahead of the band, creating real
    # relief and shadow instead of a flat painted ornament.
    for side in (-1.0, 1.0):
        for layer in range(3):
            start = 0.010 + layer * 0.017
            x0 = side * start
            x1 = side * (start + 0.010)
            x2 = side * (start + 0.021)
            x3 = side * (start + 0.031)
            p0 = centerline(x0)
            p1 = centerline(x1)
            p2 = centerline(x2)
            p3 = centerline(x3)
            points = [
                (p0[0], p0[1] - 0.0040, p0[2] - 0.0010),
                (p1[0], p1[1] - 0.0043, p1[2] + 0.0048),
                (p2[0], p2[1] - 0.0042, p2[2] + 0.0015),
                (p3[0], p3[1] - 0.0038, p3[2] - 0.0038),
            ]
            base.add_curve_strand(
                f"ZhaoYun_Restart_V10_Cloud_Scroll_{int(side)}_{layer}",
                points,
                0.00090 if layer == 0 else 0.00072,
                silver,
            )
        # Dark recessed curl underneath separates the silver scrolls visually.
        roots = [side * value for value in (0.012, 0.027, 0.043, 0.060, 0.074)]
        points = []
        for index, x in enumerate(roots):
            _, y, z = centerline(x)
            points.append((x, y - 0.0029, z - 0.0015 + math.sin(index * math.pi / 2) * 0.0022))
        base.add_curve_strand(f"ZhaoYun_Restart_V10_Dark_Engraving_{int(side)}", points, 0.00055, dark)


def add_wind_flyaways():
    hair = bpy.data.materials.get("ZhaoYun_Strand_Hair")
    if not hair:
        return
    random.seed(1010)
    for index in range(18):
        lane = (index - 8.5) / 8.5
        wave = math.sin(index * 1.61) * 0.018
        end_z = 1.660 + lane * 0.115 + random.uniform(-0.025, 0.025)
        points = [
            (lane * 0.010, 0.060, 1.782 + lane * 0.006),
            (-0.050 + lane * 0.024, 0.105, 1.822 + lane * 0.028),
            (-0.150 + lane * 0.052 + wave, 0.150, 1.795 + lane * 0.055),
            (-0.275 + lane * 0.085 + wave * 1.5, 0.195, end_z),
        ]
        obj = base.add_curve_strand(f"ZhaoYun_Restart_V10_Flyaway_{index}", points, 0.00014, hair)
        spline = obj.data.splines[0]
        for point_index, point in enumerate(spline.bezier_points):
            point.radius = max(0.08, 1.0 - 0.90 * point_index / max(1, len(spline.bezier_points) - 1))


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    silver = bpy.data.materials["ZhaoYun_Restart_Antique_Silver"]
    dark = base.make_material("ZhaoYun_Restart_V10_Circlet_Recess", (0.012, 0.022, 0.040), 0.45, 0.34)
    hide_old_band()
    build_solid_band(silver, dark)
    build_cloud_filigree(silver, dark)
    add_wind_flyaways()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
