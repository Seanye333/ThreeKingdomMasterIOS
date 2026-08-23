"""Cycles quality-gate portraits for Zhao Yun HQ head v2."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-hq-head-v2.blend"
FACE = SRC / "zhao-yun-hq-head-v2-cycles-face.png"
THREE_QUARTER = SRC / "zhao-yun-hq-head-v2-cycles-three-quarter.png"


def render(scene, camera, path, location, target, lens, samples):
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    scene.cycles.samples = samples
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    preferences = bpy.context.preferences.addons["cycles"].preferences
    try:
        preferences.compute_device_type = "METAL"
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type == "METAL"
    except (AttributeError, TypeError):
        pass

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1400
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.56
    camera = scene.camera

    # Neutral portrait lighting reveals the sculpt and stops the old orange rim
    # from turning black hair bronze.
    key = bpy.data.objects.get("V28_Warm_Key")
    if key:
        key.data.energy = 720.0
        key.data.color = (0.95, 0.80, 0.69)
    rim = bpy.data.objects.get("V28_Gold_Rim")
    if rim:
        rim.data.energy = 520.0
        rim.data.color = (0.50, 0.66, 0.95)
    fill = bpy.data.objects.get("V28_Cool_Fill")
    if fill:
        fill.data.energy = 320.0
        fill.data.color = (0.38, 0.52, 0.78)

    render(scene, camera, FACE, (0.15, -1.34, 1.680), (0.0, -0.086, 1.660), 118, 240)
    render(scene, camera, THREE_QUARTER, (0.46, -1.48, 1.686), (0.0, -0.066, 1.652), 113, 224)
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
