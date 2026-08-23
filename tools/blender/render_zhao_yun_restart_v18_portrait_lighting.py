"""Render Zhao Yun with the atmospheric portrait lighting pass."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-restart-v18-portrait-lighting.blend"
PREVIEW = SRC / "zhao-yun-restart-v18-portrait-lighting-preview.png"
FACE = SRC / "zhao-yun-restart-v18-portrait-lighting-face.png"
COMBOVER_ONLY = SRC / "zhao-yun-restart-v18-combover-only.png"
SCENEHAIR_ONLY = SRC / "zhao-yun-restart-v18-scenehair-only.png"

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


def reduce_hair(max_children, samples):
    for obj in bpy.data.objects:
        for particle_system in obj.particle_systems:
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                max_children,
            )
    bpy.context.scene.eevee.taa_render_samples = samples


def set_hair_system(name_to_keep):
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        system_name = modifier.particle_system.name
        if system_name in {"Combover_zoro_d", "SceneHair_1_O4saken"}:
            enabled = system_name == name_to_keep
            modifier.show_render = enabled
            modifier.show_viewport = enabled


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    if "--combover-only" in sys.argv:
        set_hair_system("Combover_zoro_d")
        reduce_hair(8, 16)
        render(COMBOVER_ONLY, (450, 525))
        return
    if "--scenehair-only" in sys.argv:
        set_hair_system("SceneHair_1_O4saken")
        reduce_hair(8, 16)
        render(SCENEHAIR_ONLY, (450, 525))
        return
    if "--polished" in sys.argv:
        reduce_hair(20, 32)
        render(FACE, (800, 933))
        return
    reduce_hair(8, 16)
    render(PREVIEW, (450, 525))


if __name__ == "__main__":
    main()
