"""Render the completed Guan Yu v28 full-body model with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v28.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v28-cycles-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v28-cycles-three-quarter.png"


def render(scene, camera, output, location, target):
    camera.location = location
    camera.data.lens = 72
    look_at(camera, target)
    scene.render.filepath = str(output)
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
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 7
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transmission_bounces = 4
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"

    camera = scene.camera
    render(scene, camera, FRONT, (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16))
    render(scene, camera, THREE_QUARTER, (1.50, -6.18, 1.28), (-0.08, -0.02, 1.16))
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
