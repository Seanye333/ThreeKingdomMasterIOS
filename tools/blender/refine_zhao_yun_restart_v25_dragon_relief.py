"""Replace modern straight pauldron ribs with ornate cloud-dragon relief."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v24-skin-eyes.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v25-dragon-relief.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def hide_straight_ribs():
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_Restart_V13_Pauldron_Rib_"):
            obj.hide_render = True
            obj.hide_set(True)


def add_shoulder_dragons(silver, gold, jade):
    for side in (-1.0, 1.0):
        def p(x, y, z):
            return (side * x, y, z)

        curves = (
            ("Spine", [p(0.146, -0.123, 1.464), p(0.195, -0.126, 1.489), p(0.252, -0.120, 1.477), p(0.310, -0.108, 1.447)], 0.00215, silver),
            ("Upper_Horn", [p(0.193, -0.129, 1.487), p(0.214, -0.131, 1.504), p(0.236, -0.126, 1.493)], 0.00145, gold),
            ("Jaw", [p(0.180, -0.129, 1.478), p(0.208, -0.132, 1.458), p(0.245, -0.126, 1.461)], 0.00165, gold),
            ("Lower_Cloud", [p(0.154, -0.121, 1.442), p(0.196, -0.126, 1.427), p(0.239, -0.122, 1.441), p(0.276, -0.113, 1.428)], 0.00155, silver),
            ("Outer_Curl", [p(0.263, -0.117, 1.468), p(0.297, -0.112, 1.479), p(0.323, -0.103, 1.459), p(0.300, -0.110, 1.447)], 0.00145, gold),
        )
        for name, points, radius, material in curves:
            base.add_curve_strand(
                f"ZhaoYun_Restart_V25_Pauldron_Dragon_{int(side)}_{name}",
                points,
                radius,
                material,
            )
        base.add_ellipsoid(
            f"ZhaoYun_Restart_V25_Dragon_Eye_{int(side)}",
            p(0.197, -0.134, 1.483),
            (0.0043, 0.0017, 0.0036),
            jade,
            20,
            10,
        )


def add_chest_dragons(silver, gold):
    for side in (-1.0, 1.0):
        def p(x, y, z):
            return (side * x, y, z)

        base.add_curve_strand(
            f"ZhaoYun_Restart_V25_Chest_Dragon_Neck_{int(side)}",
            [
                p(0.018, -0.199, 1.406),
                p(0.046, -0.196, 1.442),
                p(0.087, -0.190, 1.458),
                p(0.132, -0.176, 1.443),
                p(0.152, -0.162, 1.420),
            ],
            0.00175,
            gold,
        )
        base.add_curve_strand(
            f"ZhaoYun_Restart_V25_Chest_Dragon_Cloud_{int(side)}",
            [
                p(0.038, -0.197, 1.394),
                p(0.072, -0.193, 1.409),
                p(0.105, -0.181, 1.396),
                p(0.131, -0.169, 1.410),
            ],
            0.00130,
            silver,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hide_straight_ribs()
    silver = bpy.data.materials["ZhaoYun_Restart_V13_Edge_Silver"]
    gold = bpy.data.materials["ZhaoYun_Restart_V6_Pale_Gold"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]
    add_shoulder_dragons(silver, gold, jade)
    add_chest_dragons(silver, gold)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
