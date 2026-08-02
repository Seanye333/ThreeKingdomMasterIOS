"""Render the Zhao Yun stylized v1 prototype with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-stylized-v1.blend"
FRONT = SRC / "zhao-yun-stylized-v1-cycles-front.png"
UPPER = SRC / "zhao-yun-stylized-v1-cycles-upper.png"
FACE = SRC / "zhao-yun-stylized-v1-cycles-face.png"
THREE_QUARTER = SRC / "zhao-yun-stylized-v1-cycles-three-quarter.png"


def render(scene, camera, output, resolution, location, target, lens, samples):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.cycles.samples = samples
    camera.location = location
    camera.data.lens = lens
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
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.34
    camera = scene.camera
    render(scene, camera, FRONT, (1100, 1600), (-0.05, -6.65, 1.16), (-0.01, -0.03, 1.18), 72, 112)
    render(scene, camera, UPPER, (1200, 1200), (0.50, -3.74, 1.47), (0.0, -0.06, 1.34), 82, 148)
    render(scene, camera, FACE, (1200, 1200), (0.38, -2.34, 1.64), (0.0, -0.095, 1.57), 96, 192)
    render(scene, camera, THREE_QUARTER, (1200, 1200), (0.92, -2.47, 1.66), (0.0, -0.08, 1.55), 94, 184)
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
