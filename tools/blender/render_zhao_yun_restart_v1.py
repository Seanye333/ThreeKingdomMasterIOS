"""Render the fresh Zhao Yun head calibration views."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-restart-v1.blend"
THREE_QUARTER = SRC / "zhao-yun-restart-v1-three-quarter.png"
FRONT = SRC / "zhao-yun-restart-v1-front.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def render(path, location, target, lens, resolution):
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Restart_Camera"]
    camera.location = location
    camera.data.lens = lens
    base.look_at(camera, target)
    scene.camera = camera
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(path)
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={path}")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    if "--front" in sys.argv:
        render(FRONT, (0.0, -1.50, 1.650), (0.0, -0.022, 1.645), 112, (900, 1050))
        return
    render(THREE_QUARTER, (-0.68, -1.46, 1.650), (0.0, -0.022, 1.645), 112, (600, 700))


if __name__ == "__main__":
    main()
