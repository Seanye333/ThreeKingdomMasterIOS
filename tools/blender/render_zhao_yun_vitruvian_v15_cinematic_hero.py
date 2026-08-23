"""Render Zhao Yun v15 cinematic-hero previews and finals."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v15-cinematic-hero.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v15-cinematic-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v15-cinematic-face.png"
HERO = SRC / "zhao-yun-vitruvian-v15-cinematic-hero.png"
FULL = SRC / "zhao-yun-vitruvian-v15-cinematic-full.png"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area(name, energy, color, size, location, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


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
    scene.view_settings.exposure = -0.92

    settings = {
        "ZhaoYun_Key": (76.0, (1.0, 0.74, 0.56)),
        "ZhaoYun_Fill": (8.0, (0.45, 0.60, 1.0)),
        "ZhaoYun_Rim": (54.0, (0.50, 0.70, 1.0)),
        "ZhaoYun_EyeLight": (6.5, (0.80, 0.91, 1.0)),
    }
    for name, (energy, color) in settings.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy
            bpy.data.objects[name].data.color = color

    add_area(
        "ZhaoYun_V15_Hair_Rim",
        18.0,
        (0.34, 0.51, 0.86),
        1.10,
        (-1.10, 0.88, 2.12),
        (-0.15, 0.14, 1.68),
    )
    add_area(
        "ZhaoYun_V15_Face_Warmth",
        9.0,
        (1.0, 0.64, 0.48),
        0.68,
        (-0.92, -1.55, 1.82),
        (0.0, -0.03, 1.62),
    )
    add_area(
        "ZhaoYun_V15_Lower_Fill",
        44.0,
        (0.48, 0.62, 1.0),
        1.70,
        (0.92, -2.05, 0.50),
        (0.0, 0.0, 0.74),
    )

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
        render(scene, camera, PREVIEW, (0.66, -2.35, 1.60), (0.0, -0.01, 1.625), 103, (700, 820), 64)
        return
    if "--face" in sys.argv:
        render(scene, camera, FACE, (0.66, -2.35, 1.60), (0.0, -0.01, 1.625), 103, (1200, 1400), 192)
        return
    if "--full" in sys.argv:
        render(scene, camera, FULL, (1.92, -4.82, 0.98), (0.0, 0.0, 1.13), 72, (1050, 1400), 104)
        return
    render(scene, camera, HERO, (1.27, -3.88, 1.19), (0.0, -0.01, 1.23), 82, (1100, 1400), 120)


if __name__ == "__main__":
    main()
