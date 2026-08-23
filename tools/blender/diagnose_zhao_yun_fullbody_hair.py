"""Render small full-body variants to identify unwanted long hair guides."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v1-composite.blend"

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as hero_render  # pylint: disable=wrong-import-position


TARGETS = ("Eve", "Bob", "Combover_zoro_d")


def set_system_visible(emitter, system_name, visible):
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM" and modifier.particle_system.name == system_name:
            modifier.show_render = visible


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = hero_render.configure_scene()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    scene.view_settings.exposure = -0.72
    for particle_system in emitter.particle_systems:
        particle_system.settings.rendered_child_count = min(
            particle_system.settings.rendered_child_count,
            8,
        )
    for target in TARGETS:
        set_system_visible(emitter, target, False)
        output = SRC / f"zhao-yun-fullbody-hair-without-{target.lower()}.png"
        hero_render.render(
            scene,
            camera,
            output,
            (1.92, -4.82, 0.98),
            (0.0, 0.0, 1.13),
            72,
            (360, 480),
            12,
        )
        set_system_visible(emitter, target, True)


if __name__ == "__main__":
    main()
