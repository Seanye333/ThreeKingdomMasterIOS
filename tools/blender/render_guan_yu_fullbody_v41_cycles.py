"""Render Guan Yu v41 realism pass with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v41.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v41-cycles-front.png"
UPPER = SRC / "guan-yu-reference-fullbody-v41-cycles-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v41-cycles-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v41-cycles-face-three-quarter.png"


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

    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72, 96)
    render(scene, camera, UPPER, (1200, 1200), (0.55, -3.75, 1.45), (0.0, -0.06, 1.31), 82, 128)
    render(scene, camera, FACE, (1200, 1200), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98, 192)
    render(
        scene,
        camera,
        THREE_QUARTER_FACE,
        (1200, 1200),
        (0.90, -2.28, 1.64),
        (0.0, -0.09, 1.50),
        98,
        184,
    )
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER_FACE={THREE_QUARTER_FACE}")


if __name__ == "__main__":
    main()
