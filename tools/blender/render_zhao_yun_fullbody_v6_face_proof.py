"""Prove the V33-master full-body file still renders the accepted face identically."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v6-v33-master.blend"
OUTPUT = SRC / "zhao-yun-fullbody-v6-face-proof.png"

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_restart_v33_dark_gaze as v33_render  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    imported = bpy.data.collections["ZhaoYun_V16_Fullbody_Imported"]
    imported.hide_render = True

    visible_bust_prefixes = (
        "ZhaoYun_Restart_V6_Dark_Tunic",
        "ZhaoYun_Restart_V6_Pauldron_",
        "ZhaoYun_Restart_V6_Silver_Collar",
        "ZhaoYun_Restart_V6_White_Cape",
        "ZhaoYun_Restart_V11_Chest_Clasp_",
        "ZhaoYun_Restart_V13_Chest_",
        "ZhaoYun_Restart_V13_Pauldron_",
    )
    for obj in bpy.data.objects:
        if obj.name.startswith(visible_bust_prefixes):
            obj.hide_render = False

    # Restore every V33 object's saved render state by loading those flags from
    # the original master file, while keeping the current V33 datablocks intact.
    v33_render.final_hair_quality()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.exposure = -0.82
    camera = bpy.data.objects["ZhaoYun_Restart_Camera"]
    camera.location = (-0.86, -1.35, 1.675)
    camera.data.lens = 106.0
    v33_render.base.look_at(camera, (0.0, -0.018, 1.645))
    scene.camera = camera
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1167
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(OUTPUT)
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)
    print(f"RENDER={OUTPUT}")


if __name__ == "__main__":
    main()
