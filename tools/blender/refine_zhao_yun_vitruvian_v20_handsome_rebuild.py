"""Rebuild Zhao Yun's face with decisive handsome proportions and real brows."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v18-skin-engraving.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v20-handsome-rebuild.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"


FACE_REBUILD = {
    # Re-open the eye area after the accumulated v13-v18 squint/hood changes.
    "Eyes_Size": 0.27,
    "Eyes_Distance": -0.08,
    "Eyes_Eyelid_hooded": -0.38,
    "Eyes_Eyelid_Monolid": 0.10,
    "Eyes_EyelidsAngle": -0.20,
    "Eyes_EyelidsAngle2": -0.08,
    "Eyes_EyelidsCrease": 0.18,
    "Eyes_UpperLidOpenness": 0.27,
    "Eyes_LowerLidOpenness": -0.05,
    "Eyes_EyeBagsProminence": -0.30,
    "Eyes_EyeBagsSize": -0.18,
    "Eyes_LacrimalCaruncle_Sharpness": 0.22,
    "Eyes_EyebrowsAngle": 0.14,
    "Eyes_EyebrowsDroop": -0.16,
    # Idealized heroic planes rather than a soft generic oval.
    "Face_FrontalBone_BrowRidge": 0.30,
    "Face_Zygomatic_Bone": 0.42,
    "Cheeks_UpperCheek_Bone": 0.46,
    "Cheeks_BoneDefinition": 0.58,
    "Cheeks_BuccalFat": -0.34,
    "Jaw_Definition": 0.58,
    "Jaw_Ramus_Extrusion": 0.22,
    "Jaw_Mandible_GonialAngle": 0.18,
    "Jaw_Width": 0.14,
    "Chin_Height": 0.34,
    "Chin_Width": -0.10,
    "Chin_Portrusion": 0.16,
    # Straight, high bridge and a wider, better-defined mouth.
    "Nose_BridgeProminence": 0.52,
    "Nose_NasalBone": 0.24,
    "Nose_NoseHeight": 0.28,
    "Nose_Width": -0.30,
    "Nose_Tip_Protrusion": 0.14,
    "Mouth_Lips_Length": 0.58,
    "Mouth_Lips_Height": 0.20,
    "Mouth_Lips_UpperLipArch": 0.25,
    "Mouth_Lips_UpperLipDepth": 0.12,
    "Mouth_Lips_BottomLipDepth": 0.08,
    "Mouth_PhiltrumDepth": 0.10,
}

EXPRESSION = {
    "Eyes_Squint": 0.090,
    "Eyebrows_Frown_Left": 0.105,
    "Eyebrows_Frown_Right": 0.112,
    "Eyebrows_InnerBrow_Lower_Left": 0.038,
    "Eyebrows_InnerBrow_Lower_Right": 0.042,
    "Lower_Eyelid_Up_Left": 0.042,
    "Lower_Eyelid_Up_Right": 0.046,
    "Lips_Up_Corner_Tight_Left": 0.006,
    "Lips_Up_Corner_Tight_Right": 0.007,
}


def apply_morphs(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, FACE_REBUILD), (MORPHS_L3, EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def enable_natural_brows():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Combover_zoro_d", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        visible = modifier.particle_system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        modifier.particle_system.settings.material = 1
        if modifier.particle_system.name == "mind_eyebrows_11_Default":
            settings = modifier.particle_system.settings
            settings.root_radius *= 1.32
            settings.tip_radius *= 1.18
            settings.radius_scale *= 1.16

    material = emitter.data.materials[0]
    if material and material.use_nodes:
        for node in material.node_tree.nodes:
            if node.type != "BSDF_HAIR_PRINCIPLED":
                continue
            if "Color" in node.inputs:
                node.inputs["Color"].default_value = (0.0014, 0.0020, 0.0032, 1.0)
            if "Roughness" in node.inputs:
                node.inputs["Roughness"].default_value = 0.44


def refine_skin_and_eyes():
    skin = bpy.data.materials.get("UDIM.Skin")
    if skin and skin.use_nodes:
        settings = skin.node_tree.nodes.get("charmorph_settings")
        if settings:
            values = {
                "Global Bump Strength": 0.055,
                "Micro Bump Strength": 0.135,
                "Roughness Multiplier": 0.035,
                "Subsurface Scale Multiplier": 0.090,
                "Hemoglobin Fraction": 0.030,
                "Lip Bump Strength": 0.065,
                "Iris Bump Strength": 0.060,
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
            primary.outputs["Color"].default_value = (0.004, 0.003, 0.002, 1.0)
        if secondary and "Color" in secondary.outputs:
            secondary.outputs["Color"].default_value = (0.022, 0.009, 0.003, 1.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    apply_morphs(bpy.data.objects["ZhaoYun_Body"])
    enable_natural_brows()
    refine_skin_and_eyes()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
