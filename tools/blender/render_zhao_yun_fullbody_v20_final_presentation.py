"""Render Zhao Yun V20 presentation preview, final, or V33-angle face proof."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v20-final-presentation.blend"
PREVIEW = SRC / "zhao-yun-fullbody-v20-final-presentation-preview.png"
FINAL = SRC / "zhao-yun-fullbody-v20-final-presentation-final.png"
FACE_PROOF = SRC / "zhao-yun-fullbody-v20-face-proof.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_restart_v33_dark_gaze as v33_render  # pylint: disable=wrong-import-position


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


def configure_face_proof(scene):
    camera = bpy.data.objects["ZhaoYun_Restart_Camera"]
    camera.location = (-0.86, -1.35, 1.675)
    camera.data.lens = 106.0
    v33_render.base.look_at(camera, (0.0, -0.018, 1.645))
    scene.camera = camera
    scene.render.resolution_x = 700
    scene.render.resolution_y = 817
    scene.render.filepath = str(FACE_PROOF)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    final = "--final" in sys.argv
    face_proof = "--face-proof" in sys.argv
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.exposure = -0.82
    scene.render.resolution_x = 1050 if final else 700
    scene.render.resolution_y = 1400 if final else 920
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(FINAL if final else PREVIEW)
    scene.eevee.taa_render_samples = 48 if final or face_proof else 24
    set_hair_quality(final or face_proof)
    if face_proof:
        configure_face_proof(scene)
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={scene.render.filepath}")


if __name__ == "__main__":
    main()
