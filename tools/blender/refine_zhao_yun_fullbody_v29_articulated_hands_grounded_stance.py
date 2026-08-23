"""Give Zhao Yun slimmer articulated gloves and a clearer bent-knee combat stance."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v28-hands-combat-stance.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v29-articulated-hands-grounded-stance.blend"


def bounds_center(obj):
    return obj.matrix_world @ (
        sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    )


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


def refine_glove_volume():
    settings = {
        "l": (0.91, 0.90, 0.98),
        "r": (0.90, 0.98, 0.90),
    }
    changed = []
    for side, factors in settings.items():
        glove = bpy.data.objects[f"ZhaoYun_V16_Fitted_Leather_Glove_{side}"]
        before = tuple(round(value, 4) for value in glove.dimensions)
        scale_mesh_about_bounds(glove, factors)
        after = tuple(round(value, 4) for value in glove.dimensions)
        changed.append((glove.name, before, after))
    return changed


def side_from_name(name):
    if name.endswith("_l") or "_l." in name:
        return "l"
    if name.endswith("_r") or "_r." in name:
        return "r"
    return None


def knee_profile(z):
    """Smoothly push the knee forward while keeping hip and sole nearly fixed."""
    return math.exp(-((z - 0.50) / 0.23) ** 2)


def leg_offset(side, z):
    profile = knee_profile(z)
    if side == "l":
        return Vector((0.010 * profile, -0.042 * profile, 0.0))
    return Vector((-0.006 * profile, 0.020 * profile, 0.0))


def warp_trouser_knees():
    trousers = bpy.data.objects["ZhaoYun_V11_Fitted_Trouser_Underlayer"]
    inverse = trousers.matrix_world.inverted()
    changed = 0
    for vertex in trousers.data.vertices:
        world = trousers.matrix_world @ vertex.co
        if world.z > 0.90 or world.z < 0.12:
            continue
        side_blend = max(-1.0, min(1.0, world.x / 0.055))
        left_weight = max(0.0, side_blend)
        right_weight = max(0.0, -side_blend)
        delta = leg_offset("l", world.z) * left_weight
        delta += leg_offset("r", world.z) * right_weight
        world += delta
        vertex.co = inverse @ world
        changed += 1
    trousers.data.update()
    return changed


def move_knee_layers():
    prefixes = (
        "ZhaoYun_V4_Knee_Guard_",
        "ZhaoYun_V11_Knee_Gold_Boss_",
        "ZhaoYun_V11_Knee_Jade_Inset_",
        "ZhaoYun_V14_Knee_Jade_",
        "ZhaoYun_V16_Fitted_Boot_Shaft_",
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
        delta = leg_offset(side, center.z)
        obj.location += delta
        moved.append((obj.name, tuple(round(value, 4) for value in delta)))
    return moved


def rotate_front_foot_more():
    rotated = []
    settings = {
        "l": (math.radians(3.0), Vector((0.225, -0.155, 0.080))),
        "r": (math.radians(-2.0), Vector((-0.201, 0.011, 0.080))),
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
    hands = refine_glove_volume()
    trouser_vertices = warp_trouser_knees()
    knee_layers = move_knee_layers()
    feet = rotate_front_foot_more()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"REFINED_HANDS={hands}")
    print(f"WARPED_TROUSER_VERTICES={trouser_vertices}")
    print(f"MOVED_KNEE_LAYERS={len(knee_layers)}")
    print(f"ROTATED_FOREFOOT_OBJECTS={feet}")


if __name__ == "__main__":
    main()
