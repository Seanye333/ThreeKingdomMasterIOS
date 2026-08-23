"""Seat the spear in Zhao Yun's hand and rebuild smooth fitted vambraces."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v12-material-depth.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v13-grip-vambraces.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def hide_old_vambraces():
    hidden = []
    for obj in bpy.data.objects:
        if obj.name.startswith(("ZhaoYun_V4_Vambrace_l", "ZhaoYun_V4_Vambrace_r")) and not obj.hide_render:
            obj.hide_render = True
            obj.hide_set(True)
            hidden.append(obj.name)
    return hidden


def move_spear_into_weapon_hand(rig):
    hand = rig.matrix_world @ rig.pose.bones["hand_r"].head
    shaft = bpy.data.objects["ZhaoYun_V4_Dragon_Spear_Shaft"]
    points = [shaft.matrix_world @ vertex.co for vertex in shaft.data.vertices]
    _distance, start, end = max(
        ((first - second).length, first, second)
        for first in points
        for second in points
    )
    axis = end - start
    factor = max(0.0, min(1.0, (hand - start).dot(axis) / axis.length_squared))
    closest = start + axis * factor
    delta = hand - closest
    # Leave a small pole radius between the bone head and shaft center.
    delta.y -= 0.018
    moved = 0
    for obj in bpy.data.objects:
        if not obj.hide_render and ("Spear" in obj.name or "Tassel" in obj.name):
            obj.location += delta
            moved += 1
    return delta, moved


def build_vambraces(rig, silver, gold):
    created = []
    for side in ("l", "r"):
        elbow = v4.bone_point(rig, f"lowerarm_{side}", "head")
        wrist = v4.bone_point(rig, f"hand_{side}", "head")
        centers = [
            elbow.lerp(wrist, 0.14),
            elbow.lerp(wrist, 0.39),
            elbow.lerp(wrist, 0.64),
            elbow.lerp(wrist, 0.86),
        ]
        guard = v4.cloth_tube(
            f"ZhaoYun_V13_Fitted_Silver_Vambrace_{side}",
            centers,
            [0.060, 0.057, 0.052, 0.047],
            [0.054, 0.052, 0.048, 0.044],
            silver,
            48,
        )
        created.append(guard.name)
        tangent = wrist - elbow
        for label, center, radius, depth in (
            ("Upper", centers[0], 0.061, 0.055),
            ("Lower", centers[-1], 0.048, 0.045),
        ):
            ring = v4.ring_curve(
                f"ZhaoYun_V13_Vambrace_{label}_Gold_Rim_{side}",
                center,
                tangent,
                radius,
                depth,
                gold,
                0.0018,
                64,
            )
            created.append(ring.name)
    return created


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    hidden = hide_old_vambraces()
    delta, moved = move_spear_into_weapon_hand(rig)
    created = build_vambraces(
        rig,
        bpy.data.materials["ZY4_Weathered_Silver"],
        bpy.data.materials["ZY4_Antique_Gold"],
    )
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_OLD_VAMBRACES={hidden}")
    print(f"SPEAR_DELTA={tuple(round(value, 5) for value in delta)} MOVED={moved}")
    print(f"CREATED={created}")


if __name__ == "__main__":
    main()
