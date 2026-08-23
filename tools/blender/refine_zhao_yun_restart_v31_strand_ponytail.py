"""Turn the ponytail ribbons into nine narrow separated wind locks."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v30-thin-ponytail.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v31-strand-ponytail.blend"


def scale_ribbon_width(obj, factor):
    vertices = obj.data.vertices
    for pair_start in range(0, len(vertices), 2):
        left = vertices[pair_start]
        right = vertices[pair_start + 1]
        center = (left.co + right.co) * 0.5
        left.co = center + (left.co - center) * factor
        right.co = center + (right.co - center) * factor
    obj.data.update()


def refine_strands():
    for index in range(9):
        obj = bpy.data.objects[f"ZhaoYun_Restart_V29_Ponytail_Ribbon_{index}"]
        obj.hide_render = False
        obj.hide_set(False)
        if index % 2 == 0:
            # Even ribbons were already reduced to 52% in V30.
            scale_ribbon_width(obj, 0.43)
        else:
            scale_ribbon_width(obj, 0.22)
        obj.location.y = (index - 4) * 0.0018


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    refine_strands()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
