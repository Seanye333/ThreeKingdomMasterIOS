"""Remove duplicate legacy hair, wing-like sashes, and stacked sleeve shells."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v9-clear-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v10-cleanup.blend"

HIDE_EXACT = {
    "ZhaoYun_Strand_Hair_Emitter.001",
    "ZhaoYun_V15_Wind_Sash_Upper",
    "ZhaoYun_V15_Wind_Sash_Lower",
    "ZhaoYun_V6_Fitted_Arm_Underlayer_l.001",
    "ZhaoYun_V6_Fitted_Arm_Underlayer_l.002",
    "ZhaoYun_V6_Fitted_Arm_Underlayer_r.001",
    "ZhaoYun_V6_Fitted_Arm_Underlayer_r.002",
}


def smooth_object(obj):
    if obj.type != "MESH":
        return
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hidden = []
    for name in sorted(HIDE_EXACT):
        obj = bpy.data.objects.get(name)
        if not obj:
            continue
        obj.hide_render = True
        obj.hide_set(True)
        hidden.append(name)

    for name in (
        "ZhaoYun_V6_Fitted_Arm_Underlayer_l",
        "ZhaoYun_V6_Fitted_Arm_Underlayer_r",
        "ZhaoYun_V16_Fitted_Leather_Glove_l",
        "ZhaoYun_V16_Fitted_Leather_Glove_r",
        "ZhaoYun_V4_Vambrace_l.003",
        "ZhaoYun_V4_Vambrace_r.003",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            smooth_object(obj)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_OBJECTS={hidden}")
    print(
        "VISIBLE_HAIR_EMITTERS="
        f"{[obj.name for obj in bpy.data.objects if 'Strand_Hair_Emitter' in obj.name and not obj.hide_render]}"
    )


if __name__ == "__main__":
    main()
