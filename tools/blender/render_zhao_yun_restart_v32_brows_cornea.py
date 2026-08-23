"""Render Zhao Yun's thinner brows and calmer cornea."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-restart-v32-brows-cornea.blend"
PREVIEW = SRC / "zhao-yun-restart-v32-brows-cornea-preview.png"
FACE = SRC / "zhao-yun-restart-v32-brows-cornea-face.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def render(path, resolution):
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Restart_Camera"]
    camera.location = (-0.86, -1.35, 1.675)
    camera.data.lens = 106
    base.look_at(camera, (0.0, -0.018, 1.645))
    scene.camera = camera
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(path)
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={path}")


def reduce_hair(max_children, samples):
    for obj in bpy.data.objects:
        for particle_system in obj.particle_systems:
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                max_children,
            )
    bpy.context.scene.eevee.taa_render_samples = samples


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    if "--polished" in sys.argv:
        reduce_hair(20, 32)
        render(FACE, (800, 933))
        return
    reduce_hair(8, 16)
    render(PREVIEW, (450, 525))


if __name__ == "__main__":
    main()
