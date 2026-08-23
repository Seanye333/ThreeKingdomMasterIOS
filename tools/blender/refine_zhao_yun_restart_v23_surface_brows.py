"""Shrinkwrap the handcrafted brow and eyelid curves onto the face surface."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v22-defined-brows.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v23-surface-brows.blend"


def add_surface_constraints():
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    for obj in bpy.data.objects:
        if not obj.name.startswith("ZhaoYun_Restart_V21_") or obj.type != "CURVE":
            continue
        modifier = obj.modifiers.new("Face surface fit", "SHRINKWRAP")
        modifier.target = body
        modifier.wrap_method = "NEAREST_SURFACEPOINT"
        modifier.wrap_mode = "OUTSIDE_SURFACE"
        modifier.offset = 0.0010 if "Brow" in obj.name else 0.00065


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    add_surface_constraints()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
