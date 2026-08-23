"""Build a compact dark topknot with strand texture and a restrained clasp."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v15-heroic-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v17-compact-topknot.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def add_compact_knot(hair, hair_glint):
    # A matte core prevents the strand bundle reading as a wire cage.
    core = base.add_ellipsoid(
        "ZhaoYun_Restart_V17_Topknot_Core",
        (-0.006, 0.052, 1.815),
        (0.036, 0.030, 0.050),
        hair,
        56,
        28,
    )
    core.rotation_euler.x = math.radians(-11.0)

    for index in range(34):
        angle = 2.0 * math.pi * index / 34.0
        phase = math.sin(index * 1.93)
        x = 0.026 * math.sin(angle)
        y = 0.052 + 0.010 * math.cos(angle)
        z = 1.815 + 0.040 * math.cos(angle)
        points = [
            (x * 0.45 - 0.004, y - 0.010, 1.775 + 0.004 * phase),
            (x * 0.82 - 0.005, y, 1.798 + 0.016 * math.cos(angle)),
            (x - 0.006, y + 0.004, z),
            (x * 0.68 - 0.008, y + 0.008, 1.835 - 0.020 * math.cos(angle)),
        ]
        base.add_curve_strand(
            f"ZhaoYun_Restart_V17_Topknot_Strand_{index:02d}",
            points,
            0.00115 + 0.00028 * (index % 4),
            hair_glint if index % 7 == 0 else hair,
        )

    # Short, dark flyaways echo the reference without crossing the whole frame.
    flyaways = (
        [(-0.020, 0.050, 1.838), (-0.060, 0.058, 1.865), (-0.105, 0.070, 1.850), (-0.145, 0.083, 1.820)],
        [(0.015, 0.052, 1.835), (0.050, 0.064, 1.858), (0.092, 0.080, 1.842), (0.128, 0.095, 1.812)],
        [(-0.012, 0.058, 1.825), (-0.052, 0.076, 1.836), (-0.095, 0.096, 1.805)],
    )
    for index, points in enumerate(flyaways):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V17_Flyaway_{index}",
            points,
            0.00075,
            hair_glint,
        )


def add_small_clasp(silver, jade):
    # A narrow vertical cuff sits mostly inside the black knot silhouette.
    cuff = base.add_ellipsoid(
        "ZhaoYun_Restart_V17_Hair_Clasp",
        (-0.006, 0.018, 1.803),
        (0.027, 0.0045, 0.012),
        silver,
        40,
        18,
    )
    cuff.rotation_euler.z = math.radians(-2.0)
    base.add_ellipsoid(
        "ZhaoYun_Restart_V17_Hair_Clasp_Jade",
        (-0.006, 0.0125, 1.803),
        (0.0056, 0.0020, 0.0065),
        jade,
        24,
        12,
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hair = base.make_material("ZhaoYun_Restart_V17_Matte_Hair", (0.0025, 0.0045, 0.010), 0.0, 0.55)
    hair_glint = base.make_material("ZhaoYun_Restart_V17_Hair_Glint", (0.008, 0.014, 0.028), 0.0, 0.40)
    silver = bpy.data.materials["ZhaoYun_Restart_Antique_Silver"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    add_compact_knot(hair, hair_glint)
    add_small_clasp(silver, jade)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
