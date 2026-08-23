"""Isolated game-rig compatibility test for the v3 Zhao Yun body."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT = SRC / "zhao-yun-vitruvian-v3.blend"
OUTPUT = SRC / "zhao-yun-vitruvian-v4-rig-test.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def main():
    CharMorph, _charlib = base.configure_charmorph()
    bpy.ops.wm.open_mainfile(filepath=str(INPUT))
    body = bpy.data.objects["ZhaoYun_Body"]
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    CharMorph.common.manager.on_select()
    if CharMorph.common.manager.morpher is None:
        raise RuntimeError("Could not restore CharMorph morpher from v3 body")
    ui = bpy.context.window_manager.charmorph_ui
    ui.rig = "game-rig"
    ui.rig_manual_sculpt = False
    ui.rig_manual_joints = False
    ui.rig_manual_weights = False
    result = bpy.ops.charmorph.rig()
    if "FINISHED" not in result:
        raise RuntimeError(f"Game rig failed: {result}")
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")
    rig = armatures[0]
    print("RIG=", rig.name)
    print("BONES=", [bone.name for bone in rig.data.bones])
    print("POSE_BONES=", [bone.name for bone in rig.pose.bones])
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT), compress=True)
    print(f"OUTPUT={OUTPUT}")


if __name__ == "__main__":
    main()
