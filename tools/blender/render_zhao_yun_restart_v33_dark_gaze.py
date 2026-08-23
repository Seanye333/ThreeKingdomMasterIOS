"""Render Zhao Yun's darker lashes and warm brown gaze."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"
PREVIEW = SRC / "zhao-yun-restart-v33-dark-gaze-preview.png"
FACE = SRC / "zhao-yun-restart-v33-dark-gaze-face.png"
FINAL = SRC / "zhao-yun-restart-v33-dark-gaze-final.png"

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


def final_hair_quality():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for particle_system in emitter.particle_systems:
        name = particle_system.name
        if name == "SceneHair_1_O4saken":
            particle_system.settings.rendered_child_count = 36
        elif name == "Combover_zoro_d":
            particle_system.settings.rendered_child_count = 8
        elif "eyebrows" in name.lower():
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                8,
            )
    bpy.context.scene.eevee.taa_render_samples = 48


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    if "--final" in sys.argv:
        final_hair_quality()
        render(FINAL, (1000, 1167))
        return
    if "--polished" in sys.argv:
        reduce_hair(20, 32)
        render(FACE, (800, 933))
        return
    reduce_hair(8, 16)
    render(PREVIEW, (450, 525))


if __name__ == "__main__":
    main()
