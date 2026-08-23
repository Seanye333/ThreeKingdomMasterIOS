"""Test the authored pulled-back groom on the approved fresh Zhao Yun face."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v8-clean-circlet.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v9-tied-groom.blend"


def configure_tied_groom():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Back1", "Combover_zoro_d", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        system = modifier.particle_system
        visible = system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        if not visible:
            continue
        settings = system.settings
        settings.material = 1
        if system.name == "Back1":
            settings.rendered_child_count = 62
            settings.child_percent = 36
            settings.radius_scale = 0.0058
        elif system.name == "Combover_zoro_d":
            settings.rendered_child_count = 9
            settings.child_percent = 9
            settings.radius_scale = 0.0052
        else:
            settings.rendered_child_count = 18
            settings.child_percent = 6
            settings.root_radius = 0.00065
            settings.tip_radius = 0.00050
            settings.radius_scale = 0.0038


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    configure_tied_groom()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
