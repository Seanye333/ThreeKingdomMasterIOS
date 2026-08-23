"""Render Zhao Yun v7 cinematic hero and facial-detail views."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v7-face-presence.blend"
FACE_PREVIEW = SRC / "zhao-yun-vitruvian-v7-face-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v7-face-detail.png"
HERO = SRC / "zhao-yun-vitruvian-v7-cinematic-hero.png"


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
    scene.cycles.max_bounces = 10
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 5
    scene.cycles.transmission_bounces = 7
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.02

    light_settings = {
        "ZhaoYun_Key": (70.0, (1.0, 0.82, 0.68)),
        "ZhaoYun_Fill": (22.0, (0.54, 0.68, 1.0)),
        "ZhaoYun_Rim": (60.0, (0.60, 0.76, 1.0)),
        "ZhaoYun_EyeLight": (3.8, (0.82, 0.90, 1.0)),
    }
    for name, (energy, color) in light_settings.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
            bpy.data.objects[name].data.color = color

    lower_data = bpy.data.lights.new("ZhaoYun_V7_Lower_Fill", "AREA")
    lower_data.energy = 44.0
    lower_data.shape = "DISK"
    lower_data.size = 1.8
    lower_data.color = (0.66, 0.76, 1.0)
    lower = bpy.data.objects.new("ZhaoYun_V7_Lower_Fill", lower_data)
    bpy.context.collection.objects.link(lower)
    lower.location = (0.75, -2.25, 0.75)
    look_at(lower, (0.0, 0.0, 0.70))

    warm_data = bpy.data.lights.new("ZhaoYun_V7_Face_Warmth", "AREA")
    warm_data.energy = 8.0
    warm_data.shape = "DISK"
    warm_data.size = 0.65
    warm_data.color = (1.0, 0.64, 0.42)
    warm = bpy.data.objects.new("ZhaoYun_V7_Face_Warmth", warm_data)
    bpy.context.collection.objects.link(warm)
    warm.location = (-1.15, -1.70, 1.90)
    look_at(warm, (0.0, -0.03, 1.63))

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
        render(scene, camera, FACE_PREVIEW, (0.52, -2.28, 1.70), (0.0, -0.02, 1.61), 92, 36, (700, 800))
        return
    if "--face" in sys.argv:
        render(scene, camera, FACE, (0.52, -2.28, 1.70), (0.0, -0.02, 1.61), 92, 168, (1200, 1400))
        return
    render(scene, camera, HERO, (1.42, -4.28, 1.36), (0.02, 0.0, 1.18), 72, 128, (1050, 1400))


if __name__ == "__main__":
    main()
