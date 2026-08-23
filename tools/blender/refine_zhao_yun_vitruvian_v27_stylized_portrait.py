"""Match the supplied Zhao Yun key-art design instead of generic realism."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v26-reference-rebuild.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v27-stylized-portrait.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refine_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v15_cinematic_hero as v15  # pylint: disable=wrong-import-position


PORTRAIT_STRUCTURE = {
    # Deliberately illustrated proportions: larger, cleaner, upturned eyes.
    "Eyes_Size": 0.055,
    "Eyes_Eyelid_hooded": -0.100,
    "Eyes_Eyelid_Monolid": 0.045,
    "Eyes_EyelidsAngle": -0.180,
    "Eyes_EyelidsAngle2": -0.080,
    "Eyes_EyelidsCrease": 0.030,
    "Eyes_UpperLidOpenness": 0.065,
    "Eyes_LowerLidOpenness": -0.025,
    "Eyes_LacrimalCaruncle_Sharpness": 0.080,
    "Eyes_EyeBagsProminence": -0.080,
    "Eyes_EyeBagsSize": -0.060,
    "Eyes_EyebrowsAngle": -0.100,
    "Eyes_EyebrowsDroop": -0.060,
    # Fine straight nose from the key art, not a broad realistic nose.
    "Nose_BridgeProminence": 0.080,
    "Nose_NasalBone": 0.040,
    "Nose_Width": -0.110,
    "Nose_NostrilSize": -0.080,
    "Nose_Protrusion": -0.035,
    "Nose_Tip_Protrusion": -0.045,
    "Nose_TipCrease": 0.030,
    "Nose_BottomFlatness": 0.020,
    # Compact lower third and soft key-art lips.
    "Chin_Height": -0.040,
    "Chin_Width": -0.010,
    "Mouth_Lips_Length": -0.040,
    "Mouth_Lips_Height": 0.065,
    "Mouth_Lips_UpperLipArch": 0.040,
    "Mouth_Lips_UpperLipDepth": 0.015,
    "Mouth_Lips_BottomLipDepth": 0.020,
}

PORTRAIT_EXPRESSION = {
    "Eyes_Squint": 0.0,
    "Eyebrows_Frown_Left": -0.004,
    "Eyebrows_Frown_Right": -0.004,
    "Eyebrows_OuterBrow_Raised_Left": 0.016,
    "Eyebrows_OuterBrow_Raised_Right": 0.018,
    "Lips_Up_Corner_Tight_Left": 0.014,
    "Lips_Up_Corner_Tight_Right": 0.016,
    "Lips_Up_Corner_Wide_Left": 0.008,
    "Lips_Up_Corner_Wide_Right": 0.009,
    "Lips_Up_Tighten": -0.018,
    "Lips_Dn_Tighten": -0.016,
    "Lips_Up_Out": -0.025,
    "Lips_Dn_Out": -0.025,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, PORTRAIT_STRUCTURE), (MORPHS_L3, PORTRAIT_EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def shorten_side_groom():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    hairstyle = emitter.particle_systems.get("SceneHair_1_O4saken")
    if not hairstyle:
        return
    for particle in hairstyle.particles:
        for key in particle.hair_keys:
            key.co_local = key.co_local * 0.66


def add_stylized_upper_lashes():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    material = bpy.data.materials["ZY15_Raven_Hair"]
    left = [
        (-0.0115, -0.0752, 1.6460),
        (-0.0190, -0.0742, 1.6512),
        (-0.0290, -0.0704, 1.6528),
        (-0.0395, -0.0630, 1.6520),
        (-0.0510, -0.0520, 1.6470),
    ]
    right = [(-x, y, z) for x, y, z in left]
    for side, points in ((-1, left), (1, right)):
        v15.add_strand(
            f"ZhaoYun_V27_Stylized_Upper_Lash_{side}",
            points,
            0.00016,
            material,
            rig,
        )


def stylize_materials():
    skin = bpy.data.materials.get("UDIM.Skin")
    if skin and skin.use_nodes:
        settings = skin.node_tree.nodes.get("charmorph_settings")
        if settings:
            values = {
                "Saturation": 0.014,
                "Value": 0.008,
                "Hemoglobin Fraction": 0.014,
                "Subsurface Scale Multiplier": 0.070,
                "Global Bump Strength": 0.020,
                "Micro Bump Strength": 0.035,
                "Roughness Multiplier": 0.030,
                "Lip Bump Strength": 0.055,
            }
            for name, value in values.items():
                socket = settings.outputs.get(name)
                if socket and hasattr(socket, "default_value"):
                    socket.default_value = value

    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        primary = iris.node_tree.nodes.get("Primary Iris Color")
        secondary = iris.node_tree.nodes.get("Secondary Iris Color")
        if primary and "Color" in primary.outputs:
            primary.outputs["Color"].default_value = (0.00018, 0.00012, 0.00008, 1.0)
        if secondary and "Color" in secondary.outputs:
            secondary.outputs["Color"].default_value = (0.00050, 0.00022, 0.00010, 1.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    v24.lift_gaze(body, amount=0.00045)
    v24.recess_cornea_shell(body, depth=0.00065)
    shorten_side_groom()
    add_stylized_upper_lashes()
    stylize_materials()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
