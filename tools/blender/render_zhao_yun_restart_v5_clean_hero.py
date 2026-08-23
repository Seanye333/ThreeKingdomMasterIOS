"""Render the clean fresh Zhao Yun hero head."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-restart-v5-clean-hero.blend"
PREVIEW = SRC / "zhao-yun-restart-v5-clean-hero-preview.png"
FACE = SRC / "zhao-yun-restart-v5-clean-hero-face.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def render(path, resolution):
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Restart_Camera"]
    camera.location = (-0.68, -1.46, 1.650)
    camera.data.lens = 112
    base.look_at(camera, (0.0, -0.022, 1.645))
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
    if "--face" in sys.argv:
        render(FACE, (1000, 1167))
        return
    render(PREVIEW, (600, 700))


if __name__ == "__main__":
    main()
