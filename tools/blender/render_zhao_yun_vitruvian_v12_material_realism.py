"""Render Zhao Yun v12 material preview, hero, and full-body views."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v12-material-realism.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v12-material-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v12-face-material.png"
HERO = SRC / "zhao-yun-vitruvian-v12-material-hero.png"
FULL = SRC / "zhao-yun-vitruvian-v12-material-full.png"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def configure_scene():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 10
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 5
    scene.cycles.transmission_bounces = 7
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.13

    settings = {
        "ZhaoYun_Key": (70.0, (1.0, 0.76, 0.58)),
        "ZhaoYun_Fill": (15.0, (0.42, 0.57, 1.0)),
        "ZhaoYun_Rim": (84.0, (0.46, 0.68, 1.0)),
        "ZhaoYun_EyeLight": (3.6, (0.80, 0.89, 1.0)),
    }
    for name, (energy, color) in settings.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
            bpy.data.objects[name].data.color = color

    warmth_data = bpy.data.lights.new("ZhaoYun_V12_Skin_Warmth", "AREA")
    warmth_data.energy = 6.0
    warmth_data.shape = "DISK"
    warmth_data.size = 0.72
    warmth_data.color = (1.0, 0.60, 0.40)
    warmth = bpy.data.objects.new("ZhaoYun_V12_Skin_Warmth", warmth_data)
    bpy.context.collection.objects.link(warmth)
    warmth.location = (-1.05, -1.75, 1.88)
    look_at(warmth, (0.0, -0.03, 1.62))

    fill_data = bpy.data.lights.new("ZhaoYun_V12_Lower_Fill", "AREA")
    fill_data.energy = 52.0
    fill_data.shape = "DISK"
    fill_data.size = 1.55
    fill_data.color = (0.52, 0.66, 1.0)
    fill = bpy.data.objects.new("ZhaoYun_V12_Lower_Fill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (0.90, -2.05, 0.48)
    look_at(fill, (0.0, 0.0, 0.68))

    try:
        preferences = bpy.context.preferences.addons["cycles"].preferences
        preferences.compute_device_type = "METAL"
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"
    return scene


def render(scene, camera, path, location, target, lens, resolution, samples):
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
    scene = configure_scene()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--preview" in sys.argv:
        render(scene, camera, PREVIEW, (0.74, -2.72, 1.58), (0.0, -0.02, 1.48), 90, (700, 850), 48)
        return
    if "--face" in sys.argv:
        render(scene, camera, FACE, (0.62, -2.40, 1.69), (0.0, -0.02, 1.60), 96, (1200, 1400), 176)
        return
    if "--full" in sys.argv:
        render(scene, camera, FULL, (1.90, -4.75, 1.00), (0.0, 0.0, 1.13), 72, (1050, 1400), 144)
        return
    render(scene, camera, HERO, (1.30, -3.95, 1.22), (0.0, -0.01, 1.22), 78, (1100, 1400), 160)


if __name__ == "__main__":
    main()
