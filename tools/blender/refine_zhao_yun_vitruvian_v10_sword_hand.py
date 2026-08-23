"""Refine Zhao Yun v9 with a proper sword-rest hand and sealed waist armor."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v9-duel-stance.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v10-sword-hand.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v6_cloth_grip as v6  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def rotate_free_hand_onto_sword(rig):
    target = bpy.data.objects["ZhaoYun_Left_Hand_Waist"]
    target.location = (0.198, -0.217, 1.137)
    hand = rig.pose.bones["hand_l"]
    constraint = next(
        (item for item in hand.constraints if item.type == "IK"),
        None,
    )
    if constraint is None:
        raise RuntimeError("Left-hand IK constraint is missing")
    bpy.context.view_layer.update()
    target.rotation_mode = "QUATERNION"
    target.rotation_quaternion = (
        (rig.matrix_world @ hand.matrix).to_quaternion()
        @ Quaternion((0.0, 1.0, 0.0), math.radians(-82.0))
    )
    constraint.use_rotation = True
    bpy.context.view_layer.update()

    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    v6.rebuild_fitted_arms_and_gloves(rig, navy, leather, silver, gold)
    hide_prefixes(("ZhaoYun_V6_Silver_Knuckle_l_",))


def build_armored_waist_seal(navy, gold):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.172,
        minor_radius=0.046,
        major_segments=96,
        minor_segments=20,
        location=(0.0, 0.018, 1.075),
    )
    sash = bpy.context.object
    sash.name = "ZhaoYun_V10_Deep_Navy_Armored_Waist_Seal"
    sash.scale.y = 0.72
    sash.data.materials.append(navy)
    bevel = sash.modifiers.new("ZhaoYun_V10_Waist_Seal_Soften", "BEVEL")
    bevel.width = 0.003
    bevel.segments = 3

    for index, z in enumerate((1.040, 1.108)):
        points = []
        for step in range(41):
            angle = math.pi * (0.12 + 0.76 * step / 40.0)
            points.append(
                (
                    math.cos(angle) * 0.205,
                    -0.010 - math.sin(angle) * 0.154,
                    z,
                )
            )
        base.add_curve_strand(
            f"ZhaoYun_V10_Waist_Seal_Gold_Rail_{index}",
            points,
            0.0028,
            gold,
        )

    base.add_ellipsoid(
        "ZhaoYun_V10_Waist_Seal_Central_Stud",
        (0.0, -0.175, 1.075),
        (0.018, 0.009, 0.018),
        gold,
        36,
        18,
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]

    rotate_free_hand_onto_sword(rig)
    build_armored_waist_seal(navy, gold)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
