"""Render Zhao Yun v6 cloth, full-body and spear-grip views."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v6-cloth-grip.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v6-cloth-grip-preview.png"
HERO = SRC / "zhao-yun-vitruvian-v6-cloth-grip-hero.png"
GRIP = SRC / "zhao-yun-vitruvian-v6-cloth-grip-detail.png"
CLOTH = SRC / "zhao-yun-vitruvian-v6-cloth-detail.png"


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


def configure_scene():
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
    scene.view_settings.exposure = -0.86
    for name, energy in {
        "ZhaoYun_Key": 72.0,
        "ZhaoYun_Fill": 26.0,
        "ZhaoYun_Rim": 62.0,
        "ZhaoYun_EyeLight": 4.5,
    }.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
    lower_data = bpy.data.lights.new("ZhaoYun_V6_Lower_Fill", "AREA")
    lower_data.energy = 48.0
    lower_data.shape = "DISK"
    lower_data.size = 1.8
    lower_data.color = (0.72, 0.79, 1.0)
    lower = bpy.data.objects.new("ZhaoYun_V6_Lower_Fill", lower_data)
    bpy.context.collection.objects.link(lower)
    lower.location = (0.60, -2.20, 0.72)
    look_at(lower, (0.0, 0.0, 0.68))
    try:
        preferences = bpy.context.preferences.addons["cycles"].preferences
        preferences.compute_device_type = "METAL"
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"
    return scene


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure_scene()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--preview" in sys.argv:
        render(scene, camera, PREVIEW, (0.95, -4.55, 1.25), (-0.02, -0.01, 1.20), 68, 32, (600, 800))
        return
    if "--grip" in sys.argv:
        render(scene, camera, GRIP, (-0.38, -2.10, 1.15), (-0.31, -0.285, 1.10), 92, 112, (1000, 1000))
        return
    if "--cloth" in sys.argv:
        render(scene, camera, CLOTH, (1.65, -3.30, 1.25), (0.10, 0.02, 1.02), 78, 120, (1100, 1400))
        return
    render(scene, camera, HERO, (0.95, -4.55, 1.25), (-0.02, -0.01, 1.20), 68, 112, (1050, 1400))


if __name__ == "__main__":
    main()
