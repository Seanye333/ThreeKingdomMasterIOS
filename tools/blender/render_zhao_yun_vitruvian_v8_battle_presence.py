"""Render Zhao Yun v8 battle-presence preview and final hero views."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v8-battle-presence.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v8-battle-preview.png"
HERO = SRC / "zhao-yun-vitruvian-v8-battle-hero.png"


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

    light_settings = {
        "ZhaoYun_Key": (76.0, (1.0, 0.79, 0.62)),
        "ZhaoYun_Fill": (18.0, (0.45, 0.62, 1.0)),
        "ZhaoYun_Rim": (72.0, (0.52, 0.72, 1.0)),
        "ZhaoYun_EyeLight": (3.6, (0.80, 0.89, 1.0)),
    }
    for name, (energy, color) in light_settings.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
            bpy.data.objects[name].data.color = color

    lower_data = bpy.data.lights.new("ZhaoYun_V8_Lower_Fill", "AREA")
    lower_data.energy = 52.0
    lower_data.shape = "DISK"
    lower_data.size = 1.55
    lower_data.color = (0.55, 0.69, 1.0)
    lower = bpy.data.objects.new("ZhaoYun_V8_Lower_Fill", lower_data)
    bpy.context.collection.objects.link(lower)
    lower.location = (0.85, -2.15, 0.62)
    look_at(lower, (0.0, 0.0, 0.78))

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
    preview = "--preview" in sys.argv
    camera.location = (1.48, -4.90, 1.18)
    camera.data.lens = 74
    look_at(camera, (0.0, 0.0, 1.14))
    scene.render.resolution_x, scene.render.resolution_y = (700, 900) if preview else (1050, 1400)
    scene.cycles.samples = 40 if preview else 144
    scene.render.filepath = str(PREVIEW if preview else HERO)
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={scene.render.filepath}")


if __name__ == "__main__":
    main()
