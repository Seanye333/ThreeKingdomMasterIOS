"""Render Zhang Fei reference v10 with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhang-fei-reference-fullbody-v10.blend"
FRONT = SRC / "zhang-fei-reference-fullbody-v10-cycles-front.png"
UPPER = SRC / "zhang-fei-reference-fullbody-v10-cycles-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v10-cycles-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v10-cycles-three-quarter.png"


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
    scene.cycles.transmission_bounces = 5
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.30
    camera = scene.camera
    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.55, 1.10), (-0.05, -0.03, 1.13), 71, 112)
    render(scene, camera, UPPER, (1200, 1200), (0.55, -3.75, 1.45), (0.0, -0.06, 1.34), 82, 144)
    render(scene, camera, FACE, (1200, 1200), (0.42, -2.30, 1.64), (0.0, -0.095, 1.56), 96, 208)
    render(scene, camera, THREE_QUARTER, (1200, 1200), (0.92, -2.36, 1.66), (0.0, -0.08, 1.55), 94, 196)
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
