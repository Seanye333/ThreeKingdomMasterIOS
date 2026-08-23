"""Refine Zhao Yun v17 skin response, gaze, and commander armor engraving."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v17-hair-cape-armor.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v18-skin-engraving.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


GAZE_L2 = {
    "Eyes_Eyelid_hooded": 0.025,
    "Eyes_EyelidsAngle": 0.018,
    "Eyes_UpperLidOpenness": -0.014,
    "Face_FrontalBone_BrowRidge": 0.015,
}

GAZE_L3 = {
    "Eyes_Squint": 0.010,
    "Eyebrows_Frown_Left": 0.007,
    "Eyebrows_Frown_Right": 0.008,
    "Eyebrows_InnerBrow_Lower_Left": 0.004,
    "Eyebrows_InnerBrow_Lower_Right": 0.005,
}


def apply_gaze_refinement(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, values in ((MORPHS_L2, GAZE_L2), (MORPHS_L3, GAZE_L3)):
        for name, weight in values.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def set_group_output(group, name, value):
    socket = group.outputs.get(name)
    if socket and hasattr(socket, "default_value"):
        socket.default_value = value


def refine_skin_material():
    skin = bpy.data.materials.get("UDIM.Skin")
    if not skin or not skin.use_nodes:
        return
    settings = skin.node_tree.nodes.get("charmorph_settings")
    if not settings:
        return
    # Subtle values: enough for high-resolution pore breakup without a noisy face.
    set_group_output(settings, "Global Bump Strength", 0.075)
    set_group_output(settings, "Micro Bump Strength", 0.185)
    set_group_output(settings, "Roughness Multiplier", 0.045)
    set_group_output(settings, "Subsurface Scale Multiplier", 0.085)
    set_group_output(settings, "Hemoglobin Fraction", 0.018)
    set_group_output(settings, "Lip Bump Strength", 0.070)
    set_group_output(settings, "Iris Bump Strength", 0.055)
    set_group_output(settings, "Sclera Redness", 0.0)
    set_group_output(settings, "Sclera Yellowness", 0.0)


def ring_points(center, radius_x, radius_z, steps=48):
    cx, cy, cz = center
    return [
        (
            cx + math.cos(math.tau * step / steps) * radius_x,
            cy,
            cz + math.sin(math.tau * step / steps) * radius_z,
        )
        for step in range(steps + 1)
    ]


def build_chest_filigree(gold, jade, dark_silver):
    # One short paired wing motif complements the existing jade clasp without
    # competing with the v17 pauldron ornament.
    left_points = [
        (-0.025, -0.188, 1.404),
        (-0.055, -0.189, 1.418),
        (-0.090, -0.187, 1.407),
        (-0.126, -0.181, 1.384),
    ]
    base.add_curve_strand("ZhaoYun_V18_Chest_Filigree_Left", left_points, 0.00175, gold)
    base.add_curve_strand(
        "ZhaoYun_V18_Chest_Filigree_Right",
        [(-x, y, z) for x, y, z in left_points],
        0.00175,
        gold,
    )


def build_waist_buckle(gold, jade, silver):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("ZhaoYun_V10_Waist_Seal_Central_Stud"):
            obj.hide_render = True
            obj.hide_set(True)
    v4.v2.add_shield_plate(
        "ZhaoYun_V18_Commander_Waist_Buckle",
        (0.0, -0.178, 1.075),
        0.060,
        0.050,
        0.009,
        gold,
        rotation_z=0.0,
        bevel=0.0035,
    )
    base.add_ellipsoid(
        "ZhaoYun_V18_Waist_Buckle_Silver_Halo",
        (0.0, -0.190, 1.078),
        (0.026, 0.0045, 0.023),
        silver,
        36,
        18,
    )
    base.add_ellipsoid(
        "ZhaoYun_V18_Waist_Buckle_Jade",
        (0.0, -0.195, 1.078),
        (0.014, 0.0035, 0.013),
        jade,
        32,
        16,
    )
    for side in (-1.0, 1.0):
        base.add_curve_strand(
            f"ZhaoYun_V18_Waist_Buckle_Wing_{int(side)}",
            [
                (side * 0.016, -0.194, 1.080),
                (side * 0.052, -0.190, 1.094),
                (side * 0.094, -0.181, 1.078),
                (side * 0.122, -0.174, 1.062),
            ],
            0.0020,
            gold,
        )


def simplify_pauldron_ornament():
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("ZhaoYun_V17_Pauldron_Filigree_") and obj.name.rsplit("_", 1)[-1] in {"1", "2"}:
            obj.hide_render = True
            obj.hide_set(True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    dark_silver = bpy.data.materials.get("ZY2_Plate_Dark") or silver

    apply_gaze_refinement(body)
    refine_skin_material()
    simplify_pauldron_ornament()
    build_waist_buckle(gold, jade, silver)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
