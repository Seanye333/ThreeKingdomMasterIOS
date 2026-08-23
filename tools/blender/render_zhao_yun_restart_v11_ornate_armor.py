"""Render the ornate-armor Zhao Yun restart."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-restart-v11-ornate-armor.blend"
PREVIEW = SRC / "zhao-yun-restart-v11-ornate-armor-preview.png"
FACE = SRC / "zhao-yun-restart-v11-ornate-armor-face.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def render(path, resolution):
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Restart_Camera"]
    camera.location = (-0.68, -1.46, 1.665)
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
    if "--draft" in sys.argv:
        for obj in bpy.data.objects:
            for particle_system in obj.particle_systems:
                settings = particle_system.settings
                settings.rendered_child_count = min(settings.rendered_child_count, 8)
        bpy.context.scene.eevee.taa_render_samples = 16
        render(PREVIEW, (450, 525))
        return
    if "--face" in sys.argv:
        render(FACE, (1000, 1167))
        return
    render(PREVIEW, (600, 700))


if __name__ == "__main__":
    main()
