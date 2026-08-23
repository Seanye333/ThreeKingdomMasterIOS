"""Clean exposed body skin and clear the spear from Zhao Yun's exact V33 face."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v7-exact-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v8-clean-exact-face.blend"


def mask_body_below_neck(body):
    group = body.vertex_groups.get("ZhaoYun_V8_Hide_Body_Below_Neck")
    if not group:
        group = body.vertex_groups.new(name="ZhaoYun_V8_Hide_Body_Below_Neck")
    indices = [vertex.index for vertex in body.data.vertices if vertex.co.z < 1.42]
    group.add(indices, 1.0, "REPLACE")
    mask = body.modifiers.new("ZhaoYun V8 Hide Body Below Neck", "MASK")
    mask.vertex_group = group.name
    mask.invert_vertex_group = True
    # Keep deformation before masking, then hair/brow particle systems and subdivision.
    body.modifiers.move(len(body.modifiers) - 1, 1)
    return len(indices)


def shift_spear_left():
    spear_objects = [
        obj
        for obj in bpy.data.objects
        if not obj.hide_render and ("Spear" in obj.name or "Tassel" in obj.name)
    ]
    pivot = Vector((-0.387, -0.320, 1.029))
    rotate = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(11.0), 4, "Y")
        @ Matrix.Translation(-pivot)
    )
    translate = Matrix.Translation(Vector((-0.105, 0.0, 0.0)))
    transform = translate @ rotate
    for obj in spear_objects:
        obj.matrix_world = transform @ obj.matrix_world
    return len(spear_objects)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    masked = mask_body_below_neck(body)
    spear_count = shift_spear_left()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"MASKED_BODY_VERTICES={masked}")
    print(f"SHIFTED_SPEAR_OBJECTS={spear_count}")


if __name__ == "__main__":
    main()
