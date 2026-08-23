"""Render Zhao Yun with the accepted portrait face angle and cleared spear silhouette."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v5-original-face-angle.blend"
PREVIEW = SRC / "zhao-yun-fullbody-v5-original-face-angle-preview.png"
FINAL = SRC / "zhao-yun-fullbody-v5-original-face-angle-final.png"


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


def configure_cycles(scene, final):
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.samples = 112 if final else 40
    scene.cycles.max_bounces = 10
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 5
    scene.cycles.transmission_bounces = 7
    try:
        preferences = bpy.context.preferences.addons["cycles"].preferences
        preferences.compute_device_type = "METAL"
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    final = "--final" in sys.argv
    scene = bpy.context.scene
    configure_cycles(scene, final)
    scene.render.resolution_x = 1050 if final else 700
    scene.render.resolution_y = 1400 if final else 920
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(FINAL if final else PREVIEW)
    set_hair_quality(final)
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={scene.render.filepath}")


if __name__ == "__main__":
    main()
