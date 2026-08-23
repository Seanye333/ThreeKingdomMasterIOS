"""Rotate only the upper spear around the grip to clear Zhao Yun's face."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v8-clean-exact-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v9-clear-face.blend"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    pivot = Vector((-0.492, -0.320, 1.029))
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(13.0), 4, "Y")
        @ Matrix.Translation(-pivot)
    )
    count = 0
    for obj in bpy.data.objects:
        if not obj.hide_render and ("Spear" in obj.name or "Tassel" in obj.name):
            obj.matrix_world = transform @ obj.matrix_world
            count += 1
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"ROTATED_SPEAR_OBJECTS={count}")


if __name__ == "__main__":
    main()
