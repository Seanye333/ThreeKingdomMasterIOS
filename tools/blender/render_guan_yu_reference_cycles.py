"""Render the current Guan Yu bust proof with Cycles Metal."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-bust-v27.blend"
FRONT = SRC / "guan-yu-reference-bust-v27-cycles-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-bust-v27-cycles-three-quarter.png"
FACE_DETAIL = SRC / "guan-yu-reference-bust-v27-cycles-face-detail.png"
DRAGON_DETAIL = SRC / "guan-yu-reference-bust-v27-cycles-dragon-shoulder.png"


def render(camera, scene, location, output, target=(0, -0.035, 1.49), lens=None):
    camera.location = location
    if lens is not None:
        camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    preferences = bpy.context.preferences.addons["cycles"].preferences
    preferences.compute_device_type = "METAL"
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == "METAL"

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 40
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 7
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transmission_bounces = 4
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"

    camera = scene.camera
    render(camera, scene, (0, -2.08, 1.49), FRONT, lens=105)
    render(camera, scene, (0.54, -2.02, 1.52), THREE_QUARTER, lens=105)
    scene.cycles.samples = 80
    render(
        camera,
        scene,
        (0.24, -1.44, 1.67),
        FACE_DETAIL,
        target=(0, -0.145, 1.645),
        lens=125,
    )
    scene.cycles.samples = 40
    render(
        camera,
        scene,
        (-0.54, -1.32, 1.56),
        DRAGON_DETAIL,
        target=(-0.335, -0.165, 1.455),
        lens=86,
    )
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"FACE_DETAIL={FACE_DETAIL}")
    print(f"DRAGON_DETAIL={DRAGON_DETAIL}")


if __name__ == "__main__":
    main()
