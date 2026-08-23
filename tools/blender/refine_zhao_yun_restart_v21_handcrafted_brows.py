"""Replace straight particle brows with controlled strand-built heroic brows."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v20-clean-silhouette.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v21-handcrafted-brows.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def disable_particle_brows():
    for object_name in ("ZhaoYun_Restart_Body", "ZhaoYun_Strand_Hair_Emitter"):
        obj = bpy.data.objects[object_name]
        for modifier in obj.modifiers:
            if modifier.type == "PARTICLE_SYSTEM" and "brow" in modifier.particle_system.name.lower():
                modifier.show_render = False
                modifier.show_viewport = False


def brow_points(side, z_offset=0.0, y_offset=0.0):
    # side -1 is the portrait-left brow; mirror into a restrained asymmetric arch.
    asymmetry = 0.0012 if side > 0 else 0.0
    return [
        (side * 0.0105, -0.0756 + y_offset, 1.6885 + z_offset),
        (side * 0.0220, -0.0742 + y_offset, 1.6948 + z_offset + asymmetry),
        (side * 0.0365, -0.0698 + y_offset, 1.6984 + z_offset + asymmetry),
        (side * 0.0495, -0.0634 + y_offset, 1.6954 + z_offset),
        (side * 0.0580, -0.0578 + y_offset, 1.6910 + z_offset),
    ]


def add_brows(material, soft_material):
    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V21_Brow_Core_{int(side)}",
            brow_points(side),
            0.00072,
            material,
        )
        for strand in range(7):
            vertical = (strand - 3) * 0.00072
            depth = abs(strand - 3) * 0.00006
            points = brow_points(side, vertical, depth)
            # Slightly shorten outer auxiliary hairs to preserve a tapered tail.
            if strand in {0, 6}:
                points = points[:-1]
            base.add_curve_strand(
                f"ZhaoYun_Restart_V21_Brow_Hair_{int(side)}_{strand}",
                points,
                0.00020 if strand % 2 else 0.00024,
                soft_material,
            )


def add_upper_lid_lines(material):
    left = [
        (-0.0118, -0.0754, 1.6456),
        (-0.0200, -0.0735, 1.6506),
        (-0.0300, -0.0698, 1.6514),
        (-0.0415, -0.0628, 1.6517),
        (-0.0515, -0.0538, 1.6473),
    ]
    right = [(-x, y, z + 0.0005) for x, y, z in left]
    for side, points in ((-1, left), (1, right)):
        base.add_curve_strand(
            f"ZhaoYun_Restart_V21_Upper_Lid_{side}",
            points,
            0.00030,
            material,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    disable_particle_brows()
    brow = base.make_material("ZhaoYun_Restart_V21_Brow_Dark", (0.003, 0.004, 0.007), 0.0, 0.58)
    brow_soft = base.make_material("ZhaoYun_Restart_V21_Brow_Soft", (0.008, 0.010, 0.016), 0.0, 0.62)
    add_brows(brow, brow_soft)
    add_upper_lid_lines(brow)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
