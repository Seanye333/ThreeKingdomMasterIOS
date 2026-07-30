"""Render Guan Yu v37 ornate armor pass with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v37.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v37-cycles-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v37-cycles-three-quarter.png"
DETAIL = SRC / "guan-yu-reference-fullbody-v37-cycles-armor-detail.png"


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

    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72, 84)
    render(
        scene,
        camera,
        THREE_QUARTER,
        (1100, 1600),
        (1.58, -6.10, 1.28),
        (0.0, -0.01, 1.12),
        72,
        92,
    )
    render(scene, camera, DETAIL, (1200, 1150), (0.62, -3.50, 1.22), (0.02, -0.10, 1.05), 88, 128)
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"DETAIL={DETAIL}")


if __name__ == "__main__":
    main()
