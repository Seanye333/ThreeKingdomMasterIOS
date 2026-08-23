"""Refine Zhao Yun v12 toward a sharper, handsomer heroic face and crest."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v12-material-realism.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v13-heroic-face.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


STRUCTURAL_INCREMENT = {
    "Jaw_Definition": 0.10,
    "Jaw_Mandible": 0.045,
    "Jaw_Ramus_Extrusion": 0.035,
    "Chin_Height": 0.025,
    "Chin_Width": 0.018,
    "Cheeks_UpperCheek_Bone": 0.075,
    "Cheeks_BoneDefinition": 0.080,
    "Face_Zygomatic_Bone": 0.035,
    "Nose_BridgeProminence": 0.095,
    "Nose_NasalBone": 0.045,
}

EXPRESSION_INCREMENT = {
    "Angry": 0.045,
    "Eyebrows_Frown_Left": 0.052,
    "Eyebrows_Frown_Right": 0.058,
    "Eyebrows_InnerBrow_Lower_Left": 0.022,
    "Eyebrows_InnerBrow_Lower_Right": 0.024,
    "Eyes_Squint": 0.032,
    "Lips_Up_Tighten": 0.018,
    "Lips_Dn_Tighten": 0.018,
}


def apply_morphs(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, increments in (
        (MORPHS_L2, STRUCTURAL_INCREMENT),
        (MORPHS_L3, EXPRESSION_INCREMENT),
    ):
        for name, weight in increments.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def rebuild_commander_plume(rig, crimson, gold):
    hide_prefixes(
        (
            "ZhaoYun_V4_Crimson_Helmet_Plume_",
            "ZhaoYun_V8_Layered_Helmet_Plume_",
        )
    )
    dark = base.make_material(
        "ZY13_Commander_Plume_Shadow", (0.042, 0.003, 0.005), 0.02, 0.53
    )
    core = [
        (0.000, 0.018, 1.842),
        (0.000, 0.045, 1.925),
        (0.052, 0.095, 1.982),
        (0.145, 0.158, 1.958),
        (0.235, 0.215, 1.892),
        (0.315, 0.258, 1.810),
    ]
    # A densely packed horsehair bundle stays narrow through most of the arc
    # and separates only at the tail. This reads as hair instead of a cloth
    # blade, without returning to the former sparse spaghetti silhouette.
    width_profile = (0.003, 0.005, 0.009, 0.016, 0.029, 0.046)
    for index in range(46):
        lane = (index - 22.5) / 45.0
        depth_lane = ((index % 7) - 3) / 3.0
        points = []
        for point_index, (x, y, z) in enumerate(core):
            factor = point_index / (len(core) - 1)
            width = width_profile[point_index] * lane
            points.append(
                (
                    x + width,
                    y + depth_lane * (0.002 + factor * 0.004),
                    z + 0.0035 * math.sin(index * 1.11 + factor * 3.0),
                )
            )
        end = Vector(points[-1])
        points.append(
            tuple(
                end
                + Vector(
                    (
                        0.038 + 0.014 * math.sin(index * 1.3),
                        0.020 + depth_lane * 0.008,
                        -0.070 - 0.026 * ((index % 5) / 4.0),
                    )
                )
            )
        )
        strand = base.add_curve_strand(
            f"ZhaoYun_V13_Commander_Plume_Hair_{index}",
            points,
            0.00115 if index % 8 else 0.00145,
            gold if index in (5, 38) else (dark if index % 5 == 0 else crimson),
        )
        v4.parent_to_bone_keep_transform(strand, rig, "head")


def darken_brows():
    material = bpy.data.materials.get("EyeHair")
    if not material or not material.use_nodes:
        return
    for node in material.node_tree.nodes:
        if node.type == "GROUP" and node.node_tree and node.node_tree.name == "HairEngine":
            if "Color" in node.inputs:
                node.inputs["Color"].default_value = (0.007, 0.005, 0.004, 1.0)
            if "Roughness" in node.inputs:
                node.inputs["Roughness"].default_value = 0.60
            if "Specular" in node.inputs:
                node.inputs["Specular"].default_value = 0.20


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    crimson = bpy.data.materials["ZY4_Deep_Crimson"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]

    apply_morphs(body)
    rebuild_commander_plume(rig, crimson, gold)
    darken_brows()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
