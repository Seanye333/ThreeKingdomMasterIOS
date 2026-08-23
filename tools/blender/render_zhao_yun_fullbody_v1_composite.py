"""Render preview and full-size images for the V33/V16 Zhao Yun full-body composite."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v1-composite.blend"
PREVIEW = SRC / "zhao-yun-fullbody-v1-preview.png"
FULL = SRC / "zhao-yun-fullbody-v1-final.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as hero_render  # pylint: disable=wrong-import-position


def reduce_hair(max_children):
    for obj in bpy.data.objects:
        for particle_system in obj.particle_systems:
            settings = particle_system.settings
            settings.rendered_child_count = min(settings.rendered_child_count, max_children)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = hero_render.configure_scene()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    scene.camera = camera
    scene.view_settings.exposure = -0.72

    if "--final" in sys.argv:
        reduce_hair(28)
        hero_render.render(
            scene,
            camera,
            FULL,
            (1.92, -4.82, 0.98),
            (0.0, 0.0, 1.13),
            72,
            (1050, 1400),
            112,
        )
        return

    reduce_hair(8)
    hero_render.render(
        scene,
        camera,
        PREVIEW,
        (1.92, -4.82, 0.98),
        (0.0, 0.0, 1.13),
        72,
        (700, 920),
        40,
    )


if __name__ == "__main__":
    main()
