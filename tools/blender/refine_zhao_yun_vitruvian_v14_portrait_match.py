"""Match Zhao Yun's 3D head more closely to the established game portrait."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v13-heroic-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v14-portrait-match.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


STRUCTURAL_INCREMENT = {
    "Jaw_Definition": 0.13,
    "Jaw_Width": 0.035,
    "Jaw_Ramus_Extrusion": 0.045,
    "Chin_Height": 0.060,
    "Chin_Width": -0.022,
    "Cheeks_UpperCheek_Bone": 0.100,
    "Cheeks_BoneDefinition": 0.120,
    "Cheeks_BuccalFat": -0.105,
    "Face_Zygomatic_Bone": 0.070,
    "Nose_BridgeProminence": 0.110,
    "Nose_NasalBone": 0.060,
    "Nose_NoseHeight": 0.050,
    "Eyes_EyelidsAngle": 0.065,
    "Eyes_UpperLidOpenness": -0.030,
}

EXPRESSION_INCREMENT = {
    "Eyebrows_Frown_Left": 0.038,
    "Eyebrows_Frown_Right": 0.042,
    "Eyebrows_InnerBrow_Lower_Left": 0.018,
    "Eyebrows_InnerBrow_Lower_Right": 0.020,
    "Eyes_Squint": 0.018,
    "Lips_Up_Corner_Tight_Left": 0.012,
    "Lips_Up_Corner_Tight_Right": 0.014,
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


def hide_helmet():
    prefixes = (
        "ZhaoYun_V4_Silver_Helmet_Cap",
        "ZhaoYun_V4_Helmet_",
        "ZhaoYun_V5_Helmet_",
        "ZhaoYun_V13_Commander_Plume_",
    )
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def select_hair_and_brows():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Back1", "Combover_zoro_d", "mind_eyebrows_14"}
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM":
            visible = modifier.particle_system.name in enabled
            modifier.show_viewport = visible
            modifier.show_render = visible


def make_hair_material():
    material = base.make_material("ZY14_Black_Hair", (0.003, 0.006, 0.012), 0.0, 0.43)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = 0.16
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.22
        if "Anisotropic IOR Level" in bsdf.inputs:
            bsdf.inputs["Anisotropic IOR Level"].default_value = 0.46
    return material


def add_parented_strand(name, points, thickness, material, rig):
    strand = base.add_curve_strand(name, points, thickness, material)
    v4.parent_to_bone_keep_transform(strand, rig, "head")
    return strand


def build_high_ponytail(rig, hair, silver, jade):
    knot = base.add_ellipsoid(
        "ZhaoYun_V14_High_Ponytail_Knot",
        (0.0, 0.086, 1.772),
        (0.032, 0.026, 0.034),
        hair,
        48,
        24,
    )
    v4.parent_to_bone_keep_transform(knot, rig, "head")
    clasp = v4.cylinder_between(
        "ZhaoYun_V14_High_Ponytail_Silver_Clasp",
        (0.0, 0.082, 1.752),
        (0.0, 0.088, 1.790),
        0.019,
        silver,
        48,
    )
    v4.parent_to_bone_keep_transform(clasp, rig, "head")
    jewel = base.add_ellipsoid(
        "ZhaoYun_V14_High_Ponytail_Jade",
        (0.0, 0.056, 1.772),
        (0.008, 0.004, 0.010),
        jade,
        32,
        16,
    )
    v4.parent_to_bone_keep_transform(jewel, rig, "head")

    # The portrait's high ponytail sweeps strongly toward the character's left
    # and backward. Strands stay dense at the knot, then fan into the wind.
    for index in range(48):
        lane = (index - 23.5) / 47.0
        depth = ((index % 9) - 4) / 4.0
        wave = math.sin(index * 1.27)
        points = [
            (lane * 0.008, 0.088 + depth * 0.003, 1.778 + 0.006 * wave),
            (-0.020 + lane * 0.018, 0.125 + depth * 0.005, 1.842 + 0.008 * math.cos(index)),
            (-0.140 + lane * 0.035, 0.195 + depth * 0.008, 1.848 + 0.012 * wave),
            (-0.300 + lane * 0.060, 0.280 + depth * 0.012, 1.775 + 0.017 * math.sin(index * 0.71)),
            (-0.480 + lane * 0.090, 0.355 + depth * 0.016, 1.655 + 0.025 * wave),
            (-0.625 + lane * 0.120, 0.420 + depth * 0.020, 1.515 + 0.035 * math.sin(index * 0.53)),
        ]
        add_parented_strand(
            f"ZhaoYun_V14_Windswept_Ponytail_{index}",
            points,
            0.00105 if index % 8 else 0.00130,
            hair,
            rig,
        )


def build_face_locks_and_back_hair(rig, hair):
    for side in (-1.0, 1.0):
        for index in range(5):
            lane = index / 4.0
            x = side * (0.050 + lane * 0.018)
            length = 0.88 + 0.12 * math.sin(index * 1.9 + side)
            points = [
                (x, -0.060 + lane * 0.004, 1.742 - lane * 0.010),
                (x + side * (0.010 + lane * 0.005), -0.078, 1.665 - lane * 0.012),
                (x + side * (0.018 + lane * 0.008), -0.052, 1.555 - lane * 0.018),
                (x + side * (0.028 + lane * 0.012), 0.005, 1.455 - lane * 0.025 - (1.0 - length) * 0.20),
            ]
            add_parented_strand(
                f"ZhaoYun_V14_Face_Lock_{int(side)}_{index}",
                points,
                0.00110 if index % 4 else 0.00135,
                hair,
                rig,
            )

    for index in range(20):
        lane = (index - 9.5) / 19.0
        points = [
            (lane * 0.070, 0.085, 1.775 - abs(lane) * 0.015),
            (lane * 0.095, 0.130, 1.650 - abs(lane) * 0.020),
            (lane * 0.125, 0.170, 1.505 - abs(lane) * 0.028),
            (lane * 0.155, 0.205, 1.355 - abs(lane) * 0.035),
        ]
        add_parented_strand(
            f"ZhaoYun_V14_Long_Back_Hair_{index}",
            points,
            0.00105 if index % 7 else 0.00130,
            hair,
            rig,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]

    apply_morphs(body)
    hide_helmet()
    select_hair_and_brows()
    hair = make_hair_material()
    build_high_ponytail(rig, hair, silver, jade)
    build_face_locks_and_back_hair(rig, hair)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
