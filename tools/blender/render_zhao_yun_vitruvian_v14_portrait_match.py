"""Render Zhao Yun v14 portrait-match previews and finals."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v14-portrait-match.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v14-portrait-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v14-portrait-face.png"
HERO = SRC / "zhao-yun-vitruvian-v14-portrait-hero.png"
FULL = SRC / "zhao-yun-vitruvian-v14-portrait-full.png"


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
    scene.view_settings.exposure = -1.08

    settings = {
        "ZhaoYun_Key": (72.0, (1.0, 0.77, 0.59)),
        "ZhaoYun_Fill": (17.0, (0.46, 0.61, 1.0)),
        "ZhaoYun_Rim": (98.0, (0.55, 0.76, 1.0)),
        "ZhaoYun_EyeLight": (4.2, (0.82, 0.91, 1.0)),
    }
    for name, (energy, color) in settings.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
            bpy.data.objects[name].data.color = color

    hair_data = bpy.data.lights.new("ZhaoYun_V14_Hair_Rim", "AREA")
    hair_data.energy = 85.0
    hair_data.shape = "DISK"
    hair_data.size = 1.0
    hair_data.color = (0.42, 0.63, 1.0)
    hair = bpy.data.objects.new("ZhaoYun_V14_Hair_Rim", hair_data)
    bpy.context.collection.objects.link(hair)
    hair.location = (-1.10, 0.90, 2.15)
    look_at(hair, (-0.12, 0.10, 1.68))

    warmth_data = bpy.data.lights.new("ZhaoYun_V14_Face_Warmth", "AREA")
    warmth_data.energy = 8.0
    warmth_data.shape = "DISK"
    warmth_data.size = 0.60
    warmth_data.color = (1.0, 0.60, 0.40)
    warmth = bpy.data.objects.new("ZhaoYun_V14_Face_Warmth", warmth_data)
    bpy.context.collection.objects.link(warmth)
    warmth.location = (-1.0, -1.65, 1.88)
    look_at(warmth, (0.0, -0.03, 1.62))

    lower_data = bpy.data.lights.new("ZhaoYun_V14_Lower_Fill", "AREA")
    lower_data.energy = 55.0
    lower_data.shape = "DISK"
    lower_data.size = 1.65
    lower_data.color = (0.50, 0.65, 1.0)
    lower = bpy.data.objects.new("ZhaoYun_V14_Lower_Fill", lower_data)
    bpy.context.collection.objects.link(lower)
    lower.location = (0.88, -2.10, 0.52)
    look_at(lower, (0.0, 0.0, 0.72))

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
        render(scene, camera, PREVIEW, (0.62, -2.42, 1.72), (0.0, -0.01, 1.62), 98, (700, 820), 56)
        return
    if "--face" in sys.argv:
        render(scene, camera, FACE, (0.62, -2.42, 1.72), (0.0, -0.01, 1.62), 98, (1200, 1400), 184)
        return
    if "--full" in sys.argv:
        render(scene, camera, FULL, (1.90, -4.75, 1.02), (0.0, 0.0, 1.14), 72, (1050, 1400), 148)
        return
    render(scene, camera, HERO, (1.24, -3.82, 1.26), (0.0, -0.01, 1.24), 80, (1100, 1400), 168)


if __name__ == "__main__":
    main()
