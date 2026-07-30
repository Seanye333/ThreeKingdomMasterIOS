"""Render the first Guan Yu v34 high-model pass with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v34.blend"
FULL = SRC / "guan-yu-reference-fullbody-v34-cycles-full.png"
FACE_FRONT = SRC / "guan-yu-reference-fullbody-v34-cycles-face-front.png"
FACE_THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v34-cycles-face-three-quarter.png"


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
    scene.view_settings.exposure = -0.38
    camera = scene.camera

    render(scene, camera, FULL, (1000, 1450), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72, 72)
    render(scene, camera, FACE_FRONT, (1100, 1100), (0.0, -2.28, 1.61), (0.0, -0.095, 1.50), 102, 128)
    render(
        scene,
        camera,
        FACE_THREE_QUARTER,
        (1100, 1100),
        (0.50, -2.30, 1.62),
        (0.0, -0.095, 1.50),
        98,
        128,
    )
    print(f"FULL={FULL}")
    print(f"FACE_FRONT={FACE_FRONT}")
    print(f"FACE_THREE_QUARTER={FACE_THREE_QUARTER}")


if __name__ == "__main__":
    main()
