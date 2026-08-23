"""Add a strand-built high tied hairstyle and light silver hair crest."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v15-heroic-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v16-bound-hair.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def add_tied_bundle(hair, hair_highlight):
    # Dense tapered arcs build a readable knot without a plastic sphere.
    for index in range(22):
        t = index / 21.0
        side = -1.0 if index % 2 == 0 else 1.0
        spread = (0.006 + 0.030 * t) * side
        depth = 0.020 + 0.030 * ((index * 7) % 11) / 10.0
        start = (spread * 0.28, depth, 1.770 + 0.012 * math.sin(index * 1.7))
        mid_a = (spread * 0.52, depth + 0.018, 1.830 + 0.035 * math.sin(t * math.pi))
        mid_b = (spread, depth + 0.010, 1.885 + 0.028 * math.cos(index * 0.8))
        end = (spread * 0.72 - 0.018, depth + 0.025, 1.835 + 0.030 * math.sin(index * 0.55))
        base.add_curve_strand(
            f"ZhaoYun_Restart_V16_Topknot_Strand_{index:02d}",
            [start, mid_a, mid_b, end],
            0.00135 + 0.00048 * (1.0 - t),
            hair_highlight if index % 5 == 0 else hair,
        )

    # A few thin flyaways make the tied silhouette organic.
    flyaways = (
        [(0.000, 0.035, 1.870), (-0.060, 0.040, 1.920), (-0.140, 0.050, 1.900), (-0.220, 0.065, 1.850)],
        [(0.005, 0.040, 1.860), (0.070, 0.055, 1.905), (0.135, 0.070, 1.875), (0.190, 0.080, 1.825)],
        [(-0.010, 0.050, 1.845), (-0.090, 0.065, 1.865), (-0.170, 0.090, 1.825), (-0.245, 0.110, 1.775)],
        [(0.012, 0.052, 1.840), (0.075, 0.072, 1.860), (0.145, 0.100, 1.820), (0.205, 0.125, 1.770)],
    )
    for index, points in enumerate(flyaways):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V16_Wind_Flyaway_{index}",
            points,
            0.00072 if index % 2 else 0.00090,
            hair_highlight,
        )


def add_hair_tie_and_crest(silver, gold, jade):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.031,
        minor_radius=0.0032,
        major_segments=56,
        minor_segments=10,
        location=(-0.004, 0.030, 1.823),
        rotation=(math.radians(90.0), 0.0, 0.0),
    )
    tie = bpy.context.object
    tie.name = "ZhaoYun_Restart_V16_Silver_Hair_Tie"
    tie.scale.x = 0.82
    tie.data.materials.append(silver)

    # Open filigree crest: visible above the knot without becoming a helmet.
    crest_y = -0.010
    crest_curves = (
        [(0.0, crest_y, 1.833), (-0.010, crest_y, 1.875), (0.0, crest_y, 1.925), (0.010, crest_y, 1.875), (0.0, crest_y, 1.833)],
        [(0.0, crest_y - 0.002, 1.850), (-0.034, crest_y, 1.878), (-0.024, crest_y, 1.905), (0.0, crest_y, 1.886)],
        [(0.0, crest_y - 0.002, 1.850), (0.034, crest_y, 1.878), (0.024, crest_y, 1.905), (0.0, crest_y, 1.886)],
    )
    for index, points in enumerate(crest_curves):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V16_Hair_Crest_{index}",
            points,
            0.0018 if index == 0 else 0.00145,
            silver,
        )
    base.add_ellipsoid(
        "ZhaoYun_Restart_V16_Hair_Crest_Gold_Halo",
        (0.0, crest_y - 0.004, 1.883),
        (0.0090, 0.0028, 0.0110),
        gold,
        28,
        14,
    )
    base.add_ellipsoid(
        "ZhaoYun_Restart_V16_Hair_Crest_Jade",
        (0.0, crest_y - 0.007, 1.883),
        (0.0052, 0.0019, 0.0067),
        jade,
        24,
        12,
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hair = bpy.data.materials["ZhaoYun_Black_Hair"]
    hair_highlight = base.make_material("ZhaoYun_Restart_V16_Hair_Highlight", (0.008, 0.014, 0.030), 0.0, 0.33)
    silver = bpy.data.materials["ZhaoYun_Restart_Antique_Silver"]
    gold = bpy.data.materials["ZhaoYun_Restart_V6_Pale_Gold"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    add_tied_bundle(hair, hair_highlight)
    add_hair_tie_and_crest(silver, gold, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
