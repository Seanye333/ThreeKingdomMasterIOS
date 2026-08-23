"""Render full-body Zhao Yun v4 from front and cinematic three-quarter views."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v4-fullbody.blend"
FRONT = SRC / "zhao-yun-vitruvian-v4-fullbody-front.png"
THREE_QUARTER = SRC / "zhao-yun-vitruvian-v4-fullbody-three-quarter.png"
UPPER = SRC / "zhao-yun-vitruvian-v4-fullbody-upper.png"
PREVIEW = SRC / "zhao-yun-vitruvian-v4-fullbody-preview.png"
HERO = SRC / "zhao-yun-vitruvian-v4-fullbody-hero.png"


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
    scene.view_settings.exposure = -1.02
    for name, energy in {
        "ZhaoYun_Key": 68.0,
        "ZhaoYun_Fill": 21.0,
        "ZhaoYun_Rim": 54.0,
        "ZhaoYun_EyeLight": 4.5,
    }.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
    if "ZhaoYun_Lower_Fill" not in bpy.data.objects:
        lower_data = bpy.data.lights.new("ZhaoYun_Lower_Fill", "AREA")
        lower_data.energy = 42.0
        lower_data.shape = "DISK"
        lower_data.size = 1.7
        lower_data.color = (0.72, 0.79, 1.0)
        lower = bpy.data.objects.new("ZhaoYun_Lower_Fill", lower_data)
        bpy.context.collection.objects.link(lower)
        lower.location = (0.55, -2.15, 0.72)
        look_at(lower, (0.0, 0.0, 0.66))
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"

    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--preview" in sys.argv:
        render(scene, camera, PREVIEW, (0.24, -3.90, 1.12), (0.0, -0.01, 1.04), 72, 32, (600, 800))
        return
    if "--hero" in sys.argv:
        render(scene, camera, HERO, (1.20, -3.82, 1.20), (0.0, -0.01, 1.04), 72, 104, (1050, 1400))
        return
    render(scene, camera, FRONT, (0.24, -3.90, 1.12), (0.0, -0.01, 1.04), 72, 160, (1200, 1600))
    render(scene, camera, THREE_QUARTER, (2.15, -5.10, 1.46), (0.0, 0.0, 1.16), 70, 176, (1200, 1600))
    render(scene, camera, UPPER, (0.62, -2.55, 1.64), (0.0, -0.02, 1.43), 82, 176, (1200, 1450))


if __name__ == "__main__":
    main()
