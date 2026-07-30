"""Render Guan Yu v35 mature face and reinforced costume with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v35.blend"
FULL = SRC / "guan-yu-reference-fullbody-v35-cycles-full.png"
UPPER = SRC / "guan-yu-reference-fullbody-v35-cycles-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v35-cycles-face.png"


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
    scene.cycles.transmission_bounces = 4
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.43
    camera = scene.camera

    render(scene, camera, FULL, (1000, 1450), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72, 72)
    render(scene, camera, UPPER, (1100, 1300), (0.55, -3.75, 1.54), (0.0, -0.06, 1.28), 82, 104)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98, 144)
    print(f"FULL={FULL}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")


if __name__ == "__main__":
    main()
