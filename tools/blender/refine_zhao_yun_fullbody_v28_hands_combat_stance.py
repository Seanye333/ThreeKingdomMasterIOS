"""Slim Zhao Yun's gloves and establish an asymmetric, grounded combat stance."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v27-wrapped-lamella-blue-steel.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v28-hands-combat-stance.blend"


LEFT_DELTA = Vector((0.025, -0.050, 0.0))
RIGHT_DELTA = Vector((-0.012, 0.025, 0.0))


def bounds_center(obj):
    return obj.matrix_world @ (sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0)


def hide_heavy_hand_guards():
    hidden = []
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_V24_Glove_"):
            obj.hide_render = True
            obj.hide_set(True)
            hidden.append(obj.name)
    return hidden


def scale_mesh_about_bounds(obj, factors):
    local_center = sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    for vertex in obj.data.vertices:
        relative = vertex.co - local_center
        vertex.co = local_center + Vector(
            (
                relative.x * factors[0],
                relative.y * factors[1],
                relative.z * factors[2],
            )
        )
    obj.data.update()


def refine_hands():
    changed = []
    for side in ("l", "r"):
        glove = bpy.data.objects[f"ZhaoYun_V16_Fitted_Leather_Glove_{side}"]
        dimensions = tuple(glove.dimensions)
        longest = max(range(3), key=dimensions.__getitem__)
        factors = [0.86, 0.86, 0.86]
        factors[longest] = 0.94
        scale_mesh_about_bounds(glove, factors)
        changed.append((glove.name, tuple(factors)))

    material = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.012, 0.026, 0.052, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.54
    return changed


def lower_leg_weight(z):
    return max(0.0, min(1.0, (0.88 - z) / 0.68))


def warp_trousers():
    trousers = bpy.data.objects["ZhaoYun_V11_Fitted_Trouser_Underlayer"]
    inverse = trousers.matrix_world.inverted()
    changed = 0
    for vertex in trousers.data.vertices:
        world = trousers.matrix_world @ vertex.co
        weight = lower_leg_weight(world.z)
        if weight <= 0.0:
            continue
        side_blend = max(-1.0, min(1.0, world.x / 0.055))
        left_weight = max(0.0, side_blend)
        right_weight = max(0.0, -side_blend)
        delta = LEFT_DELTA * left_weight + RIGHT_DELTA * right_weight
        world += delta * weight
        vertex.co = inverse @ world
        changed += 1
    trousers.data.update()
    return changed


def side_from_name(name):
    if name.endswith("_l") or "_l." in name:
        return "l"
    if name.endswith("_r") or "_r." in name:
        return "r"
    return None


def move_leg_armor():
    prefixes = (
        "ZhaoYun_V4_Knee_Guard_",
        "ZhaoYun_V11_Knee_Gold_Boss_",
        "ZhaoYun_V11_Knee_Jade_Inset_",
        "ZhaoYun_V14_Knee_Jade_",
        "ZhaoYun_V16_Fitted_Boot_Shaft_",
        "ZhaoYun_V16_Tapered_Leather_Boot_",
        "ZhaoYun_V16_Armored_Toe_Cap_",
        "ZhaoYun_V16_Boot_Gold_Ridge_",
        "ZhaoYun_V16_Boot_Cuff_",
    )
    moved = []
    for obj in bpy.data.objects:
        if obj.hide_render or not obj.name.startswith(prefixes):
            continue
        side = side_from_name(obj.name)
        if not side:
            continue
        center = bounds_center(obj)
        weight = lower_leg_weight(center.z)
        delta = (LEFT_DELTA if side == "l" else RIGHT_DELTA) * weight
        obj.location += delta
        moved.append((obj.name, tuple(round(value, 4) for value in delta)))
    return moved


def rotate_forefeet():
    rotated = []
    settings = {
        "l": (math.radians(8.0), Vector((0.200, -0.105, 0.080)) + LEFT_DELTA),
        "r": (math.radians(-6.0), Vector((-0.189, -0.014, 0.080)) + RIGHT_DELTA),
    }
    prefixes = (
        "ZhaoYun_V16_Tapered_Leather_Boot_",
        "ZhaoYun_V16_Armored_Toe_Cap_",
        "ZhaoYun_V16_Boot_Gold_Ridge_",
    )
    for obj in bpy.data.objects:
        if obj.hide_render or not obj.name.startswith(prefixes):
            continue
        side = side_from_name(obj.name)
        if not side:
            continue
        angle, pivot = settings[side]
        transform = (
            Matrix.Translation(pivot)
            @ Matrix.Rotation(angle, 4, "Z")
            @ Matrix.Translation(-pivot)
        )
        obj.matrix_world = transform @ obj.matrix_world
        rotated.append((obj.name, round(math.degrees(angle), 2)))
    return rotated


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hidden_guards = hide_heavy_hand_guards()
    hands = refine_hands()
    trouser_vertices = warp_trousers()
    leg_armor = move_leg_armor()
    feet = rotate_forefeet()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_HAND_GUARDS={hidden_guards}")
    print(f"REFINED_HANDS={hands}")
    print(f"WARPED_TROUSER_VERTICES={trouser_vertices}")
    print(f"MOVED_LEG_ARMOR={len(leg_armor)}")
    print(f"ROTATED_FOREFOOT_OBJECTS={feet}")


if __name__ == "__main__":
    main()
