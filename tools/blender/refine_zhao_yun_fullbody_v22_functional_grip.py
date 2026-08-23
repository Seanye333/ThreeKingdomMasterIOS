"""Create true three-dimensional weapon contact and smoother gloves for Zhao Yun."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v21-relaxed-command.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v22-functional-grip.blend"


def bounds_center(obj):
    return obj.matrix_world @ (sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0)


def move_spear_to_weapon_hand():
    glove = bpy.data.objects["ZhaoYun_V16_Fitted_Leather_Glove_r"]
    hand = bounds_center(glove)
    shaft = bpy.data.objects["ZhaoYun_V4_Dragon_Spear_Shaft"]
    points = [shaft.matrix_world @ vertex.co for vertex in shaft.data.vertices]
    _distance, start, end = max(
        ((first - second).length, first, second)
        for first in points
        for second in points
    )
    axis = end - start
    factor = max(0.0, min(1.0, (hand - start).dot(axis) / axis.length_squared))
    closest = start + axis * factor
    delta = hand - closest
    moved = []
    for obj in bpy.data.objects:
        if obj.hide_render:
            continue
        if "Spear" in obj.name or "Tassel" in obj.name:
            obj.location += delta
            moved.append(obj.name)
    return delta, moved


def place_free_hand_on_sword():
    glove = bpy.data.objects["ZhaoYun_V16_Fitted_Leather_Glove_l"]
    cuff = bpy.data.objects.get("ZhaoYun_V16_Glove_Gold_Cuff_l")
    grip = bpy.data.objects["ZhaoYun_V8_Command_Sword_Grip"]
    hand = bounds_center(glove)
    target = bounds_center(grip) + Vector((0.0, -0.012, -0.015))
    delta = target - hand
    glove.location += delta
    if cuff:
        cuff.location += delta
    return delta


def smooth_gloves():
    changed = []
    for side in ("l", "r"):
        glove = bpy.data.objects[f"ZhaoYun_V16_Fitted_Leather_Glove_{side}"]
        modifier = glove.modifiers.get("ZhaoYun V22 Glove Surface Polish")
        if modifier is None:
            modifier = glove.modifiers.new("ZhaoYun V22 Glove Surface Polish", "SUBSURF")
            modifier.subdivision_type = "CATMULL_CLARK"
            modifier.levels = 1
            modifier.render_levels = 1
            while glove.modifiers.find(modifier.name) > 0:
                bpy.context.view_layer.objects.active = glove
                bpy.ops.object.modifier_move_up(modifier=modifier.name)
        changed.append(glove.name)
    return changed


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    spear_delta, spear_objects = move_spear_to_weapon_hand()
    sword_hand_delta = place_free_hand_on_sword()
    gloves = smooth_gloves()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"SPEAR_DELTA={tuple(round(value, 5) for value in spear_delta)}")
    print(f"MOVED_SPEAR_OBJECTS={len(spear_objects)}")
    print(f"SWORD_HAND_DELTA={tuple(round(value, 5) for value in sword_hand_delta)}")
    print(f"SMOOTHED_GLOVES={gloves}")


if __name__ == "__main__":
    main()
