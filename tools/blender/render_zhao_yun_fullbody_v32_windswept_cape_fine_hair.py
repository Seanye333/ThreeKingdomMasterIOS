"""Render Zhao Yun V32 in preview or final quality."""

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v32-windswept-cape-fine-hair.blend"
PREVIEW = SRC / "zhao-yun-fullbody-v32-windswept-cape-fine-hair-preview.png"
FINAL = SRC / "zhao-yun-fullbody-v32-windswept-cape-fine-hair-final.png"


def set_hair_quality(final):
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for particle_system in emitter.particle_systems:
        if particle_system.name == "SceneHair_1_O4saken":
            particle_system.settings.rendered_child_count = 44 if final else 18
        elif particle_system.name == "Combover_zoro_d":
            particle_system.settings.rendered_child_count = 10 if final else 8
        elif "eyebrows" in particle_system.name.lower():
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                8,
            )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    final = "--final" in sys.argv
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.exposure = -0.82
    scene.render.resolution_x = 1050 if final else 700
    scene.render.resolution_y = 1400 if final else 920
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(FINAL if final else PREVIEW)
    scene.eevee.taa_render_samples = 48 if final else 24
    set_hair_quality(final)
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={scene.render.filepath}")


if __name__ == "__main__":
    main()
