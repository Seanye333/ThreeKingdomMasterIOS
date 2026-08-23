"""Render the cleaned Zhao Yun full-body composite."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v2-clean-hair.blend"
PREVIEW = SRC / "zhao-yun-fullbody-v2-preview.png"
FINAL = SRC / "zhao-yun-fullbody-v2-final.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as hero_render  # pylint: disable=wrong-import-position


def set_hair_quality(final):
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for particle_system in emitter.particle_systems:
        if particle_system.name == "SceneHair_1_O4saken":
            particle_system.settings.rendered_child_count = 36 if final else 12
        elif particle_system.name == "Combover_zoro_d":
            particle_system.settings.rendered_child_count = 8
        elif "eyebrows" in particle_system.name.lower():
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                8,
            )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = hero_render.configure_scene()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    scene.camera = camera
    scene.view_settings.exposure = -0.72
    final = "--final" in sys.argv
    set_hair_quality(final)
    hero_render.render(
        scene,
        camera,
        FINAL if final else PREVIEW,
        (1.92, -4.82, 0.98),
        (0.0, 0.0, 1.13),
        72,
        (1050, 1400) if final else (700, 920),
        112 if final else 40,
    )


if __name__ == "__main__":
    main()
