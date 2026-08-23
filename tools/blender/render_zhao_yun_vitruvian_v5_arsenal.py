"""Render Zhao Yun v5 arsenal hero and armor-detail views."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v5-arsenal.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v5-arsenal-preview.png"
HERO = SRC / "zhao-yun-vitruvian-v5-arsenal-hero.png"
ARMOR = SRC / "zhao-yun-vitruvian-v5-arsenal-armor-detail.png"
WEAPON = SRC / "zhao-yun-vitruvian-v5-arsenal-weapon-detail.png"


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
    scene.view_settings.exposure = -0.92
    for name, energy in {
        "ZhaoYun_Key": 72.0,
        "ZhaoYun_Fill": 24.0,
        "ZhaoYun_Rim": 58.0,
        "ZhaoYun_EyeLight": 4.5,
    }.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
    lower_data = bpy.data.lights.new("ZhaoYun_V5_Lower_Fill", "AREA")
    lower_data.energy = 45.0
    lower_data.shape = "DISK"
    lower_data.size = 1.7
    lower_data.color = (0.72, 0.79, 1.0)
    lower = bpy.data.objects.new("ZhaoYun_V5_Lower_Fill", lower_data)
    bpy.context.collection.objects.link(lower)
    lower.location = (0.55, -2.15, 0.72)
    look_at(lower, (0.0, 0.0, 0.66))
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
    if "--armor" in sys.argv:
        render(scene, camera, ARMOR, (0.72, -2.68, 1.60), (0.0, -0.02, 1.43), 82, 128, (1200, 1400))
        return
    if "--weapon" in sys.argv:
        render(scene, camera, WEAPON, (-0.34, -3.60, 1.68), (-0.31, -0.285, 1.68), 78, 120, (900, 1400))
        return
    render(scene, camera, HERO, (0.95, -4.55, 1.25), (-0.02, -0.01, 1.20), 68, 112, (1050, 1400))


if __name__ == "__main__":
    main()
