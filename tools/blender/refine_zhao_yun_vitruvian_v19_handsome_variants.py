"""Build three deliberately different Zhao Yun v19 handsome-face variants."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v18-skin-engraving.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"


VARIANTS = {
    # A mature commander: strongest bone structure and the firmest gaze.
    "angular": {
        "strength": 3.00,
        "l2": {
            "Eyes_Eyelid_hooded": -0.080,
            "Eyes_EyelidsAngle": 0.100,
            "Eyes_EyelidsAngle2": 0.080,
            "Eyes_Size": 0.025,
            "Eyes_UpperLidOpenness": 0.030,
            "Face_FrontalBone_BrowRidge": 0.050,
            "Face_Zygomatic_Bone": 0.090,
            "Cheeks_UpperCheek_Bone": 0.100,
            "Cheeks_BoneDefinition": 0.125,
            "Cheeks_BuccalFat": -0.085,
            "Jaw_Definition": 0.145,
            "Jaw_Ramus_Extrusion": 0.055,
            "Jaw_Mandible_GonialAngle": 0.060,
            "Jaw_Width": 0.018,
            "Chin_Height": 0.100,
            "Chin_Width": -0.025,
            "Chin_Portrusion": 0.035,
            "Nose_BridgeProminence": 0.105,
            "Nose_NoseHeight": 0.055,
            "Nose_Width": -0.045,
            "Nose_Tip_Protrusion": 0.030,
            "Mouth_Lips_Length": 0.105,
            "Mouth_Lips_Height": 0.012,
            "Mouth_Lips_UpperLipArch": 0.040,
        },
        "l3": {
            "Eyes_Squint": 0.012,
            "Eyebrows_Frown_Left": 0.018,
            "Eyebrows_Frown_Right": 0.020,
            "Lips_Up_Corner_Tight_Left": 0.010,
            "Lips_Up_Corner_Tight_Right": 0.011,
        },
        "brow": (0.0024, 0.0015, 0.0010, 1.0),
    },
    # The closest construction to the established painted portrait: open,
    # sharp almond eyes, a high straight bridge, and a longer lower face.
    "portrait": {
        "strength": 3.40,
        "l2": {
            "Eyes_Eyelid_hooded": -0.145,
            "Eyes_EyelidsAngle": -0.090,
            "Eyes_EyelidsAngle2": -0.050,
            "Eyes_Size": 0.032,
            "Eyes_UpperLidOpenness": 0.070,
            "Face_FrontalBone_BrowRidge": 0.030,
            "Face_Zygomatic_Bone": 0.105,
            "Cheeks_UpperCheek_Bone": 0.125,
            "Cheeks_BoneDefinition": 0.140,
            "Cheeks_BuccalFat": -0.105,
            "Jaw_Definition": 0.120,
            "Jaw_Ramus_Extrusion": 0.040,
            "Jaw_Mandible_GonialAngle": 0.035,
            "Jaw_Width": -0.020,
            "Chin_Height": 0.125,
            "Chin_Width": -0.045,
            "Chin_Portrusion": 0.045,
            "Nose_BridgeProminence": 0.125,
            "Nose_NoseHeight": 0.070,
            "Nose_Width": -0.060,
            "Nose_Tip_Protrusion": 0.040,
            "Mouth_Lips_Length": 0.125,
            "Mouth_Lips_Height": 0.018,
            "Mouth_Lips_UpperLipArch": 0.052,
        },
        "l3": {
            "Eyes_Squint": -0.008,
            "Eyebrows_Frown_Left": 0.008,
            "Eyebrows_Frown_Right": 0.010,
            "Lips_Up_Corner_Tight_Left": 0.004,
            "Lips_Up_Corner_Tight_Right": 0.005,
        },
        "brow": (0.0030, 0.0017, 0.0010, 1.0),
    },
    # Younger and cleaner, with slightly larger eyes and less severe angles.
    "balanced": {
        "strength": 2.65,
        "l2": {
            "Eyes_Eyelid_hooded": -0.180,
            "Eyes_EyelidsAngle": 0.025,
            "Eyes_EyelidsAngle2": -0.010,
            "Eyes_Size": 0.050,
            "Eyes_UpperLidOpenness": 0.060,
            "Face_FrontalBone_BrowRidge": 0.018,
            "Face_Zygomatic_Bone": 0.075,
            "Cheeks_UpperCheek_Bone": 0.090,
            "Cheeks_BoneDefinition": 0.100,
            "Cheeks_BuccalFat": -0.060,
            "Jaw_Definition": 0.105,
            "Jaw_Ramus_Extrusion": 0.035,
            "Jaw_Mandible_GonialAngle": 0.025,
            "Jaw_Width": -0.010,
            "Chin_Height": 0.080,
            "Chin_Width": -0.030,
            "Chin_Portrusion": 0.025,
            "Nose_BridgeProminence": 0.090,
            "Nose_NoseHeight": 0.050,
            "Nose_Width": -0.040,
            "Nose_Tip_Protrusion": 0.025,
            "Mouth_Lips_Length": 0.115,
            "Mouth_Lips_Height": 0.024,
            "Mouth_Lips_UpperLipArch": 0.045,
        },
        "l3": {
            "Eyes_Squint": -0.015,
            "Eyebrows_Frown_Left": -0.006,
            "Eyebrows_Frown_Right": -0.004,
            "Lips_Up_Corner_Tight_Left": -0.004,
            "Lips_Up_Corner_Tight_Right": -0.003,
        },
        "brow": (0.0038, 0.0020, 0.0011, 1.0),
    },
}


def requested_variant():
    for argument in sys.argv:
        if argument.startswith("--variant="):
            name = argument.split("=", 1)[1]
            if name in VARIANTS:
                return name
            raise ValueError(f"Unknown variant: {name}")
    return "portrait"


def apply_morphs(body, definition):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    strength = definition.get("strength", 1.0)
    for folder, weights in ((MORPHS_L2, definition["l2"]), (MORPHS_L3, definition["l3"])):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight * strength
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def refine_real_brows(color):
    """Strengthen the existing texture/fiber brows without overlay geometry."""
    material = bpy.data.materials.get("EyeHair")
    if not material or not material.use_nodes:
        return
    group = material.node_tree.nodes.get("Group")
    if not group:
        return
    if "Color" in group.inputs:
        group.inputs["Color"].default_value = color
    if "Specular" in group.inputs:
        group.inputs["Specular"].default_value = 0.12
    if "Roughness" in group.inputs:
        group.inputs["Roughness"].default_value = 0.52


def build_fiber_brows(rig):
    """Add fine individual hairs that follow the existing brow surface."""
    material = bpy.data.materials.get("ZY15_Raven_Hair")
    if not material:
        return
    for side in (-1.0, 1.0):
        for index in range(19):
            t = index / 18.0
            x = side * (0.012 + 0.058 * t)
            y = -0.0785 + 0.0130 * t - 0.0010 * np.sin(np.pi * t)
            z = 1.6635 + 0.0138 * np.sin(np.pi * t) + 0.0040 * t
            length = 0.0068 - 0.0018 * t
            rise = 0.0035 * (1.0 - t) - 0.0010 * t
            points = [
                (x - side * length * 0.46, y - 0.0010, z - rise * 0.46),
                (x, y - 0.0015, z),
                (x + side * length * 0.54, y - 0.0010, z + rise * 0.54),
            ]
            strand = base.add_curve_strand(
                f"ZhaoYun_V19_Fiber_Brow_{int(side)}_{index}",
                points,
                0.00024 if index % 4 else 0.00029,
                material,
            )
            v4.parent_to_bone_keep_transform(strand, rig, "head")


def refine_skin():
    skin = bpy.data.materials.get("UDIM.Skin")
    if not skin or not skin.use_nodes:
        return
    settings = skin.node_tree.nodes.get("charmorph_settings")
    if not settings:
        return
    values = {
        "Global Bump Strength": 0.060,
        "Micro Bump Strength": 0.145,
        "Roughness Multiplier": 0.030,
        "Subsurface Scale Multiplier": 0.105,
        "Hemoglobin Fraction": 0.026,
        "Lip Bump Strength": 0.060,
        "Iris Bump Strength": 0.060,
        "Sclera Redness": 0.0,
        "Sclera Yellowness": 0.0,
    }
    for name, value in values.items():
        socket = settings.outputs.get(name)
        if socket and hasattr(socket, "default_value"):
            socket.default_value = value


def main():
    variant = requested_variant()
    definition = VARIANTS[variant]
    output = SRC / f"zhao-yun-vitruvian-v19-{variant}.blend"
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    apply_morphs(body, definition)
    refine_real_brows(definition["brow"])
    build_fiber_brows(rig)
    refine_skin()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(output), compress=True)
    print(f"VARIANT={variant}")
    print(f"OUTPUT_BLEND={output}")


if __name__ == "__main__":
    main()
