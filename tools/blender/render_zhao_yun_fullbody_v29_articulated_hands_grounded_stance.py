"""Render Zhao Yun V29 in preview or final quality."""

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v29-articulated-hands-grounded-stance.blend"
FINAL = "--final" in sys.argv
OUTPUT = SRC / (
    "zhao-yun-fullbody-v29-articulated-hands-grounded-stance-final.png"
    if FINAL
    else "zhao-yun-fullbody-v29-articulated-hands-grounded-stance-preview.png"
)


def set_hair_quality(final):
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for particle_system in emitter.particle_systems:
        if particle_system.name == "SceneHair_1_O4saken":
            particle_system.settings.rendered_child_count = 36 if final else 14
        elif particle_system.name == "Combover_zoro_d":
            particle_system.settings.rendered_child_count = 8
        elif "eyebrows" in particle_system.name.lower():
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                8,
            )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.exposure = -0.82
    scene.render.resolution_percentage = 100
    if FINAL:
        scene.render.resolution_x = 1050
        scene.render.resolution_y = 1400
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.image_settings.color_depth = "8"
        scene.render.film_transparent = False
        scene.render.resolution_percentage = 100
        scene.render.image_settings.compression = 18
    else:
        scene.render.resolution_x = 700
        scene.render.resolution_y = 920
        scene.render.image_settings.color_mode = "RGBA"
        scene.render.image_settings.color_depth = "8"
        scene.render.image_settings.compression = 35
    scene.eevee.taa_render_samples = 48 if FINAL else 24
    set_hair_quality(FINAL)
    scene.render.filepath = str(OUTPUT)
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={OUTPUT}")


if __name__ == "__main__":
    main()
