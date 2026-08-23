"""Cycles renders for the focused, weathered Zhao Yun v3."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v3.blend"
FACE = SRC / "zhao-yun-vitruvian-v3-cycles-face.png"
THREE_QUARTER = SRC / "zhao-yun-vitruvian-v3-cycles-three-quarter.png"
UPPER = SRC / "zhao-yun-vitruvian-v3-cycles-upper.png"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render(scene, camera, path, location, target, lens, samples, resolution):
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.cycles.samples = samples
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={path}")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 6
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.05

    for name, energy in {
        "ZhaoYun_Key": 54.0,
        "ZhaoYun_Fill": 16.0,
        "ZhaoYun_Rim": 41.0,
        "ZhaoYun_EyeLight": 4.5,
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
    render(scene, camera, FACE, (0.055, -0.965, 1.665), (0.0, -0.004, 1.651), 105, 128, (1000, 1180))
    render(scene, camera, THREE_QUARTER, (0.330, -1.015, 1.675), (0.0, 0.003, 1.646), 103, 144, (1000, 1180))
    render(scene, camera, UPPER, (0.24, -1.48, 1.62), (0.0, -0.015, 1.485), 96, 160, (1100, 1350))


if __name__ == "__main__":
    main()
