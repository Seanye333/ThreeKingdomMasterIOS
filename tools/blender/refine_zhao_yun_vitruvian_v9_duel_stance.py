"""Refine Zhao Yun v8 into a less rigid pre-duel stance."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v8-battle-presence.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v9-duel-stance.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v6_cloth_grip as v6  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def shift_weapon_arm_and_spear(rig):
    """Lower and open the weapon arm while preserving the shaft-to-palm grip."""
    hand_target = bpy.data.objects["ZhaoYun_Right_Hand_Spear"]
    elbow_target = bpy.data.objects["ZhaoYun_Right_Elbow"]
    free_target = bpy.data.objects["ZhaoYun_Left_Hand_Waist"]
    free_elbow = bpy.data.objects["ZhaoYun_Left_Elbow"]

    delta = Vector((-0.048, -0.035, -0.072))
    hand_target.location += delta
    elbow_target.location += Vector((-0.065, -0.010, -0.035))
    free_target.location += Vector((0.004, -0.018, -0.018))
    free_elbow.location += Vector((0.025, -0.010, -0.018))

    # V8 already tilted the spear around this grip axis. Translate it with the
    # hand, then add a small extra attack-line tilt around the new grip point.
    old_pivot = v4.point_on_spear(1.115)
    new_pivot = old_pivot + delta
    transform = (
        Matrix.Translation(new_pivot)
        @ Matrix.Rotation(math.radians(3.5), 4, "Y")
        @ Matrix.Translation(-new_pivot)
        @ Matrix.Translation(delta)
    )
    prefixes = (
        "ZhaoYun_V4_Dragon_Spear_",
        "ZhaoYun_V4_Crimson_Tassel_",
        "ZhaoYun_V5_Spear_",
    )
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.matrix_world = transform @ obj.matrix_world

    bpy.context.view_layer.update()

    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    v6.rebuild_fitted_arms_and_gloves(rig, navy, leather, silver, gold)


def build_windswept_battle_skirt(ivory, gold):
    """Replace the mirror-symmetrical skirt with a light leftward wind sweep."""
    hide_prefixes(
        (
            "ZhaoYun_V6_Pleated_Battle_Skirt_",
            "ZhaoYun_V6_Skirt_Gold_",
        )
    )
    panels = (
        (
            "Windward",
            [
                ((-0.075, -0.132, 1.050), 0.094),
                ((-0.118, -0.162, 0.900), 0.121),
                ((-0.175, -0.200, 0.725), 0.146),
                ((-0.232, -0.228, 0.555), 0.141),
            ],
            0.35,
        ),
        (
            "Leeward",
            [
                ((0.078, -0.130, 1.050), 0.092),
                ((0.092, -0.156, 0.900), 0.116),
                ((0.118, -0.188, 0.725), 0.137),
                ((0.145, -0.208, 0.555), 0.132),
            ],
            2.25,
        ),
    )
    for name, rows, phase in panels:
        v6.pleated_panel(
            f"ZhaoYun_V9_Windswept_Battle_Skirt_{name}",
            rows,
            ivory,
            phase,
            4.0,
            0.012,
            0.008,
            0.005,
            0.009,
            0.20,
        )
        outer_side = -1 if name == "Windward" else 1
        base.add_curve_strand(
            f"ZhaoYun_V9_Skirt_Gold_Outer_Trim_{name}",
            v6.edge_points(rows, outer_side, phase, 4.0, 0.005, 0.009, 0.20),
            0.0025,
            gold,
        )
        bottom_center, bottom_width = rows[-1]
        bottom = []
        for step in range(29):
            u = step / 28.0
            normalized = u * 2.0 - 1.0
            fold = math.sin(u * math.tau * 4.0 + phase + 0.70)
            fold += 0.20 * math.sin(u * math.tau * 8.0 + phase * 0.6)
            bottom.append(
                (
                    bottom_center[0] + normalized * bottom_width,
                    bottom_center[1] + fold * 0.014 - 0.003,
                    bottom_center[2]
                    + 0.013 * (0.30 + 0.70 * math.sin(u * math.tau * 2.5 + phase) ** 2),
                )
            )
        base.add_curve_strand(
            f"ZhaoYun_V9_Skirt_Gold_Hem_{name}", bottom, 0.0023, gold
        )


def widen_cape_silhouette():
    """Fan the existing pleated cape out from its shoulder anchor."""
    pivot = Vector((0.035, 0.145, 1.445))
    scale = Matrix.Diagonal((1.16, 1.0, 1.0, 1.0))
    transform = Matrix.Translation(pivot) @ scale @ Matrix.Translation(-pivot)
    prefixes = (
        "ZhaoYun_V6_Pleated_White_Cape_",
        "ZhaoYun_V6_Cape_Gold_Trim_",
    )
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.matrix_world = transform @ obj.matrix_world


def build_closed_boots(rig, leather, silver, gold):
    """Cover the base mesh toes with fitted closed cavalry boots."""
    for side in ("l", "r"):
        toe = v4.bone_point(rig, f"foot_{side}", "tail")
        upper = base.add_ellipsoid(
            f"ZhaoYun_V9_Closed_Boot_Upper_{side}",
            tuple(toe + Vector((0.0, -0.086, 0.023))),
            (0.069, 0.108, 0.050),
            leather,
            56,
            28,
        )
        upper.rotation_euler.x = math.radians(-4.0)
        cap = base.add_ellipsoid(
            f"ZhaoYun_V9_Closed_Boot_Silver_Cap_{side}",
            tuple(toe + Vector((0.0, -0.125, 0.030))),
            (0.062, 0.072, 0.040),
            silver,
            48,
            24,
        )
        cap.rotation_euler.x = math.radians(-5.0)
        v4.ring_curve(
            f"ZhaoYun_V9_Closed_Boot_Gold_Seam_{side}",
            toe + Vector((0.0, -0.075, 0.035)),
            Vector((0.0, -1.0, 0.10)),
            0.059,
            0.044,
            gold,
            0.0021,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    ivory = bpy.data.materials["ZY6_Pleated_Ivory_Silk"]
    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]

    shift_weapon_arm_and_spear(rig)
    build_windswept_battle_skirt(ivory, gold)
    widen_cape_silhouette()
    build_closed_boots(rig, leather, silver, gold)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
