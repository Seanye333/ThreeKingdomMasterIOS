"""Sharpen Zhao Yun's heroic face while preserving the accepted V27 styling."""

from __future__ import annotations

from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v27-subtle-crest.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v28-sharper-face.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"


STRUCTURE = {
    "Eyes_Eyelid_hooded": 0.020,
    "Eyes_Eyelid_Monolid": 0.016,
    "Eyes_UpperLidOpenness": -0.036,
    "Eyes_LowerLidOpenness": -0.012,
    "Eyes_EyelidsAngle": -0.010,
    "Face_FrontalBone_BrowRidge": 0.022,
    "Face_Zygomatic_Bone": 0.028,
    "Cheeks_BoneDefinition": 0.026,
    "Jaw_Definition": 0.026,
    "Chin_Height": -0.030,
    "Chin_PosZ": 0.010,
    "Chin_Width": -0.006,
    "Nose_NoseHeight": -0.018,
    "Nose_Width": -0.008,
    "Nose_BridgeProminence": 0.014,
    "Mouth_Lips_Height": -0.020,
    "Mouth_Lips_Length": -0.006,
    "Mouth_Lips_UpperLipDepth": -0.012,
    "Mouth_Lips_BottomLipDepth": -0.014,
}

EXPRESSION = {
    "Eyes_Squint": 0.024,
    "Eyebrows_Frown_Left": 0.010,
    "Eyebrows_Frown_Right": 0.012,
    "Eyebrows_InnerBrow_Lower_Left": 0.008,
    "Eyebrows_InnerBrow_Lower_Right": 0.009,
    "Lips_Up_Tighten": -0.010,
    "Lips_Dn_Tighten": -0.010,
    "Lips_Up_Corner_Tight_Left": 0.004,
    "Lips_Up_Corner_Tight_Right": 0.004,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, STRUCTURE), (MORPHS_L3, EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    apply_morphs(bpy.data.objects["ZhaoYun_Restart_Body"])
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
