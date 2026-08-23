"""Refine Zhao Yun v10 with an offset, grounded lower-body duel stance."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v10-sword-hand.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v11-grounded-stance.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def pose_offset_legs(rig):
    """Advance the left leg, brace the right leg, and keep both toes grounded."""
    rotations = {
        "thigh_l": (14.0, 0.0, 0.0),
        "calf_l": (-20.0, 0.0, 0.0),
        "foot_l": (-4.0, 0.0, 0.0),
        "thigh_r": (-8.0, 0.0, 0.0),
        "calf_r": (12.0, 0.0, 0.0),
        "foot_r": (-9.0, 0.0, 0.0),
    }
    for bone_name, degrees in rotations.items():
        bone = rig.pose.bones[bone_name]
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = tuple(math.radians(value) for value in degrees)
    # The game rig's local thigh X axis points inward on each side. These
    # opposite local offsets widen the planted feet without separating the
    # pelvis or lifting either toe from the ground.
    rig.pose.bones["thigh_l"].location = (-0.035, 0.0, 0.0)
    rig.pose.bones["thigh_r"].location = (0.035, 0.0, 0.0)
    bpy.context.view_layer.update()


def rebuild_leg_layers(rig, navy, silver, gold):
    hide_prefixes(
        (
            "ZhaoYun_V4_Fitted_Trouser_Underlayer",
            "ZhaoYun_V4_Greave_",
            "ZhaoYun_V4_Knee_Guard_",
            "ZhaoYun_V4_Boot_",
            "ZhaoYun_V4_Leather_Foot_",
            "ZhaoYun_V4_Silver_Toe_",
            "ZhaoYun_V4_Boot_Cuff_",
            "ZhaoYun_V5_Closed_Boot_Upper_",
            "ZhaoYun_V5_Armored_Toe_Cap_",
            "ZhaoYun_V5_Toe_Cap_Gold_Seam_",
            "ZhaoYun_V9_Closed_Boot_",
        )
    )
    body = bpy.data.objects["ZhaoYun_Body"]
    v4.body_surface_shell(
        "ZhaoYun_V11_Fitted_Trouser_Underlayer",
        body,
        [
            "thigh_l",
            "thigh_twist_01_l",
            "thigh_twist_02_l",
            "calf_l",
            "calf_twist_01_l",
            "calf_twist_02_l",
            "thigh_r",
            "thigh_twist_01_r",
            "thigh_twist_02_r",
            "calf_r",
            "calf_twist_01_r",
            "calf_twist_02_r",
        ],
        navy,
        threshold=0.12,
        offset=0.0075,
    )
    v4.build_legs(rig, navy, silver, gold)


def build_grounded_boot_caps(rig, leather, silver, gold):
    for side in ("l", "r"):
        ankle = v4.bone_point(rig, f"foot_{side}", "head")
        toe = v4.bone_point(rig, f"foot_{side}", "tail")
        direction = toe - ankle
        upper_center = ankle.lerp(toe, 0.72) + Vector((0.0, -0.030, 0.020))
        upper = base.add_ellipsoid(
            f"ZhaoYun_V11_Grounded_Boot_Upper_{side}",
            tuple(upper_center),
            (0.070, 0.120, 0.052),
            leather,
            56,
            28,
        )
        upper.rotation_euler.z = -math.atan2(direction.x, direction.y)
        toe_mask = base.add_ellipsoid(
            f"ZhaoYun_V11_Grounded_Boot_Toe_Mask_{side}",
            tuple(toe + Vector((0.0, -0.060, 0.020))),
            (0.073, 0.092, 0.043),
            leather,
            52,
            26,
        )
        toe_mask.rotation_euler.z = -math.atan2(direction.x, direction.y)
        cap_center = toe + Vector((0.0, -0.045, 0.026))
        cap = base.add_ellipsoid(
            f"ZhaoYun_V11_Grounded_Boot_Silver_Cap_{side}",
            tuple(cap_center),
            (0.063, 0.076, 0.041),
            silver,
            48,
            24,
        )
        cap.rotation_euler.z = -math.atan2(direction.x, direction.y)
        v4.ring_curve(
            f"ZhaoYun_V11_Grounded_Boot_Gold_Seam_{side}",
            ankle.lerp(toe, 0.50) + Vector((0.0, -0.015, 0.035)),
            direction,
            0.060,
            0.046,
            gold,
            0.0022,
        )


def add_knee_emblems(rig, gold, jade):
    for side in ("l", "r"):
        sign = 1.0 if side == "l" else -1.0
        knee = v4.bone_point(rig, f"calf_{side}", "head")
        center = knee + Vector((sign * 0.018, -0.194, 0.008))
        base.add_ellipsoid(
            f"ZhaoYun_V11_Knee_Gold_Boss_{side}",
            tuple(center),
            (0.018, 0.008, 0.018),
            gold,
            32,
            16,
        )
        base.add_ellipsoid(
            f"ZhaoYun_V11_Knee_Jade_Inset_{side}",
            tuple(center + Vector((0.0, -0.007, 0.0))),
            (0.010, 0.004, 0.010),
            jade,
            28,
            14,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]

    pose_offset_legs(rig)
    rebuild_leg_layers(rig, navy, silver, gold)
    build_grounded_boot_caps(rig, leather, silver, gold)
    add_knee_emblems(rig, gold, jade)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
