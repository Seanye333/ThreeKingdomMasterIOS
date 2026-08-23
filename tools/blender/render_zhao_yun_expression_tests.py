"""Low-resolution expression tests for the v2 Zhao Yun face."""

from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v2.blend"
MORPHS = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

EXPRESSIONS = {
    "focused": {
        "Angry": 0.30,
        "Eyebrows_Frown_Left": 0.34,
        "Eyebrows_Frown_Right": 0.34,
        "Eyes_Squint": 0.18,
        "Lower_Eyelid_Up_Left": 0.10,
        "Lower_Eyelid_Up_Right": 0.10,
        "Lips_Dn_Corner_Tight_Left": 0.10,
        "Lips_Dn_Corner_Tight_Right": 0.10,
    },
    "battle_ready": {
        "Angry": 0.55,
        "Eyebrows_Frown_Left": 0.46,
        "Eyebrows_Frown_Right": 0.46,
        "Eyes_Squint": 0.28,
        "Lower_Eyelid_Up_Left": 0.16,
        "Lower_Eyelid_Up_Right": 0.16,
        "Lips_Dn_Corner_Tight_Left": 0.15,
        "Lips_Dn_Corner_Tight_Right": 0.15,
        "Nostrils_Corners_Raise_GLOBAL_Right": 0.07,
    },
}


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def apply_expression(body, basis, values):
    coords = basis.copy()
    for name, weight in values.items():
        data = np.load(MORPHS / f"{name}.npz")
        coords[data["idx"]] += data["delta"] * weight
    for vertex, co in zip(body.data.vertices, coords):
        vertex.co = co
    body.data.update()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    basis = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.samples = 28
    scene.render.resolution_x = 480
    scene.render.resolution_y = 566
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.0
    for name, energy in {
        "ZhaoYun_Key": 58.0,
        "ZhaoYun_Fill": 18.0,
        "ZhaoYun_Rim": 38.0,
        "ZhaoYun_EyeLight": 5.0,
    }.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"

    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    camera.location = (0.055, -0.965, 1.665)
    camera.data.lens = 105
    look_at(camera, (0.0, -0.004, 1.651))
    for label, values in EXPRESSIONS.items():
        apply_expression(body, basis, values)
        path = SRC / f"zhao-yun-expression-test-{label}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        print(f"RENDER={path}")


if __name__ == "__main__":
    main()
