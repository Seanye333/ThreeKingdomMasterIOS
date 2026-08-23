"""Remove the duplicate heavy brow system that obscures Zhao Yun's eyes."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v13-forged-armor.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v14-clean-brows.blend"


def disable_duplicate_body_brows():
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    for modifier in body.modifiers:
        if modifier.type == "PARTICLE_SYSTEM" and modifier.particle_system.name == "EyebrowsDefault":
            modifier.show_render = False
            modifier.show_viewport = False

    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    brows = emitter.particle_systems.get("mind_eyebrows_11_Default")
    if brows:
        brows.settings.rendered_child_count = 12
        brows.settings.child_percent = 6
        brows.settings.root_radius = 0.00055
        brows.settings.tip_radius = 0.00032
        brows.settings.radius_scale = 0.0032


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    disable_duplicate_body_brows()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
