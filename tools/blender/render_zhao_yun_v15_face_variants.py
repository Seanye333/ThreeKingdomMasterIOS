"""Render low-cost facial proportion variants for Zhao Yun v15."""

from pathlib import Path
import sys

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v15-cinematic-hero.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


VARIANTS = {
    "idealized": ({
        "Eyes_Size": 0.018,
        "Eyes_Eyelid_hooded": 0.115,
        "Eyes_EyelidsAngle": 0.120,
        "Eyes_UpperLidOpenness": -0.045,
        "Face_FrontalBone_BrowRidge": 0.070,
        "Face_Zygomatic_Bone": 0.090,
        "Cheeks_UpperCheek_Bone": 0.105,
        "Cheeks_BoneDefinition": 0.115,
        "Cheeks_BuccalFat": -0.085,
        "Jaw_Definition": 0.095,
        "Jaw_Ramus_Extrusion": 0.045,
        "Jaw_Width": -0.012,
        "Chin_Height": 0.080,
        "Chin_Width": -0.020,
        "Nose_BridgeProminence": 0.090,
        "Nose_NoseHeight": 0.045,
        "Nose_Width": -0.045,
        "Mouth_Lips_Length": 0.080,
        "Mouth_Lips_Height": -0.015,
        "Mouth_Lips_UpperLipArch": 0.040,
    }, {
        "Eyes_Squint": 0.018,
        "Eyebrows_Frown_Left": 0.022,
        "Eyebrows_Frown_Right": 0.024,
        "Lips_Up_Corner_Tight_Left": 0.014,
        "Lips_Up_Corner_Tight_Right": 0.016,
    }),
    "balanced": ({
        "Eyes_Size": 0.012,
        "Eyes_Eyelid_hooded": 0.045,
        "Eyes_EyelidsAngle": 0.040,
        "Eyes_UpperLidOpenness": -0.024,
        "Face_FrontalBone_BrowRidge": 0.025,
        "Cheeks_BoneDefinition": 0.025,
        "Jaw_Definition": 0.025,
    }, {
        "Eyes_Squint": 0.010,
        "Eyebrows_Frown_Left": 0.012,
        "Eyebrows_Frown_Right": 0.014,
    }),
    "sharp": ({
        "Eyes_Size": -0.045,
        "Eyes_Eyelid_hooded": 0.120,
        "Eyes_EyelidsAngle": 0.080,
        "Eyes_UpperLidOpenness": -0.052,
        "Face_FrontalBone_BrowRidge": 0.060,
        "Cheeks_BoneDefinition": 0.055,
        "Cheeks_BuccalFat": -0.040,
        "Jaw_Definition": 0.060,
        "Chin_Height": 0.020,
    }, {
        "Eyes_Squint": 0.020,
        "Eyebrows_Frown_Left": 0.020,
        "Eyebrows_Frown_Right": 0.022,
    }),
    "portrait": ({
        "Eyes_Size": 0.004,
        "Eyes_Eyelid_hooded": 0.085,
        "Eyes_EyelidsAngle": 0.070,
        "Eyes_UpperLidOpenness": -0.034,
        "Face_FrontalBone_BrowRidge": 0.035,
        "Cheeks_UpperCheek_Bone": 0.060,
        "Cheeks_BoneDefinition": 0.070,
        "Cheeks_BuccalFat": -0.052,
        "Jaw_Width": 0.018,
        "Jaw_Definition": 0.045,
        "Chin_Width": -0.014,
        "Nose_BridgeProminence": 0.045,
        "Nose_Width": -0.020,
        "Mouth_Lips_Length": 0.030,
        "Mouth_Lips_UpperLipArch": 0.020,
    }, {
        "Eyes_Squint": 0.014,
        "Eyebrows_Frown_Left": 0.016,
        "Eyebrows_Frown_Right": 0.018,
    }),
}


def apply_delta(body, base_coords, l2, l3):
    coords = base_coords.copy()
    for folder, values in ((MORPHS_L2, l2), (MORPHS_L3, l3)):
        for name, weight in values.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()
    bpy.context.view_layer.update()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = renderer.configure_scene()
    scene.cycles.samples = 34
    scene.render.resolution_x = 460
    scene.render.resolution_y = 540
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    camera.location = (0.66, -2.35, 1.60)
    camera.data.lens = 103
    renderer.look_at(camera, (0.0, -0.01, 1.625))
    body = bpy.data.objects["ZhaoYun_Body"]
    base_coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)

    selected = VARIANTS
    only = next((arg.split("=", 1)[1] for arg in sys.argv if arg.startswith("--only=")), None)
    if only:
        selected = {only: VARIANTS[only]}
    for name, (l2, l3) in selected.items():
        apply_delta(body, base_coords, l2, l3)
        path = SRC / f"zhao-yun-v15-face-variant-{name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        print(f"RENDER={path}")


if __name__ == "__main__":
    main()
