"""Improve the face-matched full-body camera, exposure, and body-light balance."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v3-face-match.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v4-portrait-camera.blend"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Fullbody_V3_Camera"]
    camera.name = "ZhaoYun_Fullbody_V4_Camera"
    camera.data.name = "ZhaoYun_Fullbody_V4_Camera"
    camera.location = (-3.10, -7.20, 1.20)
    camera.data.lens = 106.0
    look_at(camera, (0.0, 0.0, 1.15))
    scene.camera = camera

    energies = {
        "ZhaoYun_V3_Body_Key": 105.0,
        "ZhaoYun_V3_Body_Fill": 42.0,
        "ZhaoYun_V3_Lower_Rim": 92.0,
    }
    for name, energy in energies.items():
        light = bpy.data.objects[name]
        light.data.energy = energy
    scene.view_settings.exposure = -0.92
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CAMERA_LOCATION={tuple(camera.location)} LENS={camera.data.lens}")
    print(f"BODY_LIGHTS={energies}")


if __name__ == "__main__":
    main()
