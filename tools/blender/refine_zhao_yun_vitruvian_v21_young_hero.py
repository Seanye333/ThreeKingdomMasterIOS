"""Soften v20's gaunt planes into a youthful but still heroic Zhao Yun face."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v21-young-hero.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refine_zhao_yun_vitruvian_v20_handsome_rebuild as v20  # pylint: disable=wrong-import-position


YOUTHFUL_PLANES = {
    "Eyes_Size": 0.235,
    "Eyes_UpperLidOpenness": 0.215,
    "Face_FrontalBone_BrowRidge": 0.22,
    "Face_Zygomatic_Bone": 0.27,
    "Cheeks_UpperCheek_Bone": 0.31,
    "Cheeks_BoneDefinition": 0.31,
    "Cheeks_BuccalFat": -0.025,
    "Jaw_Definition": 0.39,
    "Jaw_Ramus_Extrusion": 0.15,
    "Jaw_Mandible_GonialAngle": 0.12,
    "Jaw_Width": 0.11,
    "Chin_Height": 0.22,
    "Chin_Width": -0.060,
    "Chin_Portrusion": 0.10,
    "Nose_BridgeProminence": 0.43,
    "Nose_NasalBone": 0.19,
    "Nose_NoseHeight": 0.23,
    "Nose_Width": -0.25,
    "Nose_Tip_Protrusion": 0.11,
}


def main():
    v20.FACE_REBUILD.update(YOUTHFUL_PLANES)
    bpy.ops.wm.open_mainfile(filepath=str(v20.INPUT_BLEND))
    v20.apply_morphs(bpy.data.objects["ZhaoYun_Body"])
    v20.enable_natural_brows()
    v20.refine_skin_and_eyes()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
