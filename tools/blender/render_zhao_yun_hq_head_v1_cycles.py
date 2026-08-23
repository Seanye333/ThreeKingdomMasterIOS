"""Cycles Metal quality-gate renders for the Zhao Yun HQ master head."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-hq-head-v1.blend"
FACE = SRC / "zhao-yun-hq-head-v1-cycles-face.png"
THREE_QUARTER = SRC / "zhao-yun-hq-head-v1-cycles-three-quarter.png"


def render(scene, camera, output, location, target, lens, samples):
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1400
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
    scene.cycles.transmission_bounces = 4
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.34
    camera = scene.camera

    render(scene, camera, FACE, (0.30, -2.28, 1.655), (0.0, -0.080, 1.625), 102, 196)
    render(scene, camera, THREE_QUARTER, (0.86, -2.42, 1.68), (0.0, -0.050, 1.620), 98, 184)
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
