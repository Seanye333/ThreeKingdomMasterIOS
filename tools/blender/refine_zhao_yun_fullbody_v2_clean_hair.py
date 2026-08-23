"""Remove legacy tube-like ponytail pieces exposed by the new full-body camera."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v1-composite.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v2-clean-hair.blend"

REMOVE_PREFIXES = (
    "ZhaoYun_V15_Ponytail_Clump_",
    "ZhaoYun_V15_Ponytail_Flyaway_",
    "ZhaoYun_V15_Temple_Lock",
)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    removed = 0
    for obj in tuple(bpy.data.objects):
        if obj.name.startswith(REMOVE_PREFIXES):
            bpy.data.objects.remove(obj, do_unlink=True)
            removed += 1
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"REMOVED_LEGACY_PONYTAIL_OBJECTS={removed}")
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
