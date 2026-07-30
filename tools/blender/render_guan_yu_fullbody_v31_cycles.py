"""Render the facially refined Guan Yu v31 with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v31.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v31-cycles-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v31-cycles-three-quarter.png"
FACE = SRC / "guan-yu-reference-fullbody-v31-cycles-face.png"


def render(scene, camera, output, resolution, location, target, lens):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
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
    scene.cycles.samples = 80
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 4
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    camera = scene.camera

    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72)
    render(
        scene,
        camera,
        THREE_QUARTER,
        (1100, 1600),
        (1.50, -6.18, 1.28),
        (-0.08, -0.02, 1.16),
        72,
    )
    render(scene, camera, FACE, (1000, 1000), (0.03, -2.35, 1.52), (0.0, -0.08, 1.48), 92)
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"FACE={FACE}")


if __name__ == "__main__":
    main()
