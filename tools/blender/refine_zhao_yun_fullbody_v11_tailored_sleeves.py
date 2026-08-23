"""Replace jagged shell sleeves with continuous tailored navy sleeves."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v10-cleanup.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v11-tailored-sleeves.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    count = 0
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes) and not obj.hide_render:
            obj.hide_render = True
            obj.hide_set(True)
            count += 1
    return count


def build_tailored_sleeves(rig, navy, gold):
    created = []
    for side in ("l", "r"):
        sign = 1.0 if side == "l" else -1.0
        shoulder = v4.bone_point(rig, f"upperarm_{side}", "head")
        elbow = v4.bone_point(rig, f"lowerarm_{side}", "head")
        wrist = v4.bone_point(rig, f"hand_{side}", "head")
        upper = shoulder.lerp(elbow, 0.10) + Vector((sign * 0.012, 0.004, 0.0))
        middle = shoulder.lerp(elbow, 0.58)
        lower = elbow.lerp(wrist, 0.12)
        sleeve = v4.cloth_tube(
            f"ZhaoYun_V11_Tailored_Navy_Sleeve_{side}",
            [upper, middle, lower],
            [0.074, 0.067, 0.059],
            [0.068, 0.062, 0.055],
            navy,
            40,
        )
        created.append(sleeve.name)
        tangent = lower - middle
        v4.ring_curve(
            f"ZhaoYun_V11_Sleeve_Gold_Cuff_{side}",
            lower,
            tangent,
            0.060,
            0.056,
            gold,
            0.0020,
            64,
        )
    return created


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hidden = hide_prefixes(("ZhaoYun_V6_Fitted_Arm_Underlayer_",))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    created = build_tailored_sleeves(rig, navy, gold)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_SHELL_SLEEVES={hidden}")
    print(f"CREATED={created}")


if __name__ == "__main__":
    main()
