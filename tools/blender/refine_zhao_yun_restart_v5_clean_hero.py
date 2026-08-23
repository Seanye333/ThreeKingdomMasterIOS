"""Keep the v4 facial gains while restoring the clean native long groom."""

from __future__ import annotations

from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v3-native-hair.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v5-clean-hero.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"


HEROIC_INCREMENT = {
    "Eyes_Eyelid_hooded": 0.045,
    "Eyes_Eyelid_Monolid": 0.035,
    "Eyes_EyelidsAngle": -0.035,
    "Eyes_EyelidsAngle2": -0.018,
    "Eyes_UpperLidOpenness": -0.070,
    "Eyes_LowerLidOpenness": -0.030,
    "Eyes_LacrimalCaruncle_Sharpness": 0.050,
    "Face_FrontalBone_BrowRidge": 0.035,
    "Cheeks_UpperCheek_Bone": 0.035,
    "Cheeks_BoneDefinition": 0.040,
    "Jaw_Definition": 0.070,
    "Chin_Height": 0.035,
    "Chin_Width": -0.045,
    "Chin_SecondaryWidth": -0.025,
    "Nose_BridgeProminence": 0.075,
    "Nose_NasalBone": 0.050,
    "Nose_Protrusion": 0.065,
    "Nose_Tip_Protrusion": 0.030,
    "Nose_Width": -0.045,
    "Nose_NostrilSize": -0.025,
    "Mouth_Lips_Height": 0.025,
    "Mouth_Lips_UpperLipArch": 0.022,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in HEROIC_INCREMENT.items():
        data = np.load(MORPHS_L2 / f"{name}.npz")
        coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def tune_native_groom():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Combover_zoro_d", "SceneHair_1_O4saken", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        system = modifier.particle_system
        visible = system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        if not visible:
            continue
        settings = system.settings
        settings.material = 1
        if system.name == "SceneHair_1_O4saken":
            settings.rendered_child_count = 52
            settings.child_percent = 32
            settings.radius_scale = 0.0058
        elif system.name == "Combover_zoro_d":
            settings.rendered_child_count = 8
            settings.child_percent = 8
            settings.radius_scale = 0.0052
        else:
            settings.rendered_child_count = 34
            settings.child_percent = 7
            settings.root_radius = 0.0009
            settings.tip_radius = 0.0007
            settings.radius_scale = 0.0048


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    apply_morphs(body)
    tune_native_groom()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
