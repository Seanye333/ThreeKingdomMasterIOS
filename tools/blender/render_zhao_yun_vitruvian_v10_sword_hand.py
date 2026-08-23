"""Render close and full views of Zhao Yun v10."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v10-sword-hand.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v10-sword-hand-preview.png"
FULL = SRC / "zhao-yun-vitruvian-v10-sword-hand-full.png"
HERO = SRC / "zhao-yun-vitruvian-v10-sword-hand-hero.png"


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
        "ZhaoYun_Key": (78.0, (1.0, 0.78, 0.60)),
        "ZhaoYun_Fill": (17.0, (0.43, 0.59, 1.0)),
        "ZhaoYun_Rim": (78.0, (0.49, 0.70, 1.0)),
        "ZhaoYun_EyeLight": (3.8, (0.80, 0.89, 1.0)),
    }
    for name, (energy, color) in settings.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
            bpy.data.objects[name].data.color = color

    fill_data = bpy.data.lights.new("ZhaoYun_V10_Lower_Fill", "AREA")
    fill_data.energy = 54.0
    fill_data.shape = "DISK"
    fill_data.size = 1.6
    fill_data.color = (0.54, 0.68, 1.0)
    fill = bpy.data.objects.new("ZhaoYun_V10_Lower_Fill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (0.80, -2.15, 0.60)
    look_at(fill, (0.0, 0.0, 0.76))

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
        render(scene, camera, PREVIEW, (1.25, -3.92, 1.30), (0.0, -0.01, 1.24), 78, (700, 900), 44)
        return
    if "--full" in sys.argv:
        render(scene, camera, FULL, (1.48, -4.90, 1.18), (0.0, 0.0, 1.14), 74, (1050, 1400), 144)
        return
    render(scene, camera, HERO, (1.25, -3.92, 1.30), (0.0, -0.01, 1.24), 78, (1100, 1400), 160)


if __name__ == "__main__":
    main()
