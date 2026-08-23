"""Give the clean Zhao Yun face a narrower, calmer heroic structure."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v14-clean-brows.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v15-heroic-face.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position


STRUCTURE = {
    "Eyes_Size": -0.020,
    "Eyes_Eyelid_hooded": 0.018,
    "Eyes_Eyelid_Monolid": 0.014,
    "Eyes_UpperLidOpenness": -0.030,
    "Eyes_LowerLidOpenness": -0.010,
    "Face_Zygomatic_Bone": 0.024,
    "Cheeks_BoneDefinition": 0.022,
    "Jaw_Definition": 0.030,
    "Jaw_Width": -0.028,
    "Chin_Width": -0.018,
    "Chin_Height": -0.016,
    "Nose_BridgeProminence": 0.022,
    "Nose_NasalBone": 0.016,
    "Nose_NoseHeight": -0.012,
    "Nose_Width": -0.010,
    "Mouth_Lips_Height": -0.012,
    "Mouth_Lips_Length": -0.010,
}

EXPRESSION = {
    "Eyes_Squint": 0.018,
    "Eyebrows_Frown_Left": 0.008,
    "Eyebrows_Frown_Right": 0.009,
    "Eyebrows_InnerBrow_Lower_Left": 0.006,
    "Eyebrows_InnerBrow_Lower_Right": 0.007,
    "Lips_Up_Tighten": -0.006,
    "Lips_Dn_Tighten": -0.006,
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
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    apply_morphs(body)
    # Earlier passes enlarged the dark iris too much. Preserve dark eyes while
    # restoring a slim sclera rim and a more focused gaze.
    v22.enlarge_irises(body, scale=0.955)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
