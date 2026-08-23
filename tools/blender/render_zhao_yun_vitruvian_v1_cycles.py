"""Render Zhao Yun Vitruvian v1 face-quality gate in Cycles."""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v1.blend"
FACE = SRC / "zhao-yun-vitruvian-v1-cycles-face.png"
THREE_QUARTER = SRC / "zhao-yun-vitruvian-v1-cycles-three-quarter.png"


def look_at(obj: bpy.types.Object, target) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render(scene, camera, path, location, target, lens, samples):
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    scene.cycles.samples = samples
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={path}")


def main() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.preview_samples = 32
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 6
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1180
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.00

    # The Vitruvian character is human-scale in metres. The earlier procedural
    # busts were much larger, so their light wattages would clip the skin here.
    calibrated_energy = {
        "ZhaoYun_Key": 58.0,
        "ZhaoYun_Fill": 18.0,
        "ZhaoYun_Rim": 38.0,
        "ZhaoYun_EyeLight": 5.0,
    }
    for name, energy in calibrated_energy.items():
        lamp = bpy.data.objects.get(name)
        if lamp:
            lamp.data.energy = energy

    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"

    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    render(scene, camera, FACE, (0.055, -0.965, 1.665), (0.0, -0.004, 1.651), 105, 96)
    if "--face-only" not in __import__("sys").argv:
        render(scene, camera, THREE_QUARTER, (0.330, -1.015, 1.675), (0.0, 0.003, 1.646), 103, 112)


if __name__ == "__main__":
    main()
