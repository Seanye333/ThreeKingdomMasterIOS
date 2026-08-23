"""Refine Zhao Yun's free hand and narrow the layered shoulder silhouette."""

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v20-final-presentation.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v21-relaxed-command.blend"


def relax_free_hand():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    curls = {
        "index": (-22.0, -34.0, -20.0),
        "middle": (-27.0, -40.0, -25.0),
        "ring": (-32.0, -46.0, -30.0),
        "pinky": (-38.0, -52.0, -34.0),
        "thumb": (-18.0, -28.0, -18.0),
    }
    changed = []
    for finger, angles in curls.items():
        for joint, angle in enumerate(angles, start=1):
            bone = rig.pose.bones.get(f"{finger}_{joint:02}_l")
            if not bone:
                continue
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.x = math.radians(angle)
            changed.append(bone.name)
    return changed


def transform_point_world(obj, coordinate, anchor, factors):
    world = obj.matrix_world @ coordinate
    relative = world - anchor
    refined = anchor + Vector(
        (
            relative.x * factors[0],
            relative.y * factors[1],
            relative.z * factors[2],
        )
    )
    return obj.matrix_world.inverted() @ refined


def narrow_pauldrons():
    prefixes = (
        "ZhaoYun_V5_Pauldron_Leather_Base_",
        "ZhaoYun_V5_Pauldron_Curved_Plate_",
        "ZhaoYun_V5_Pauldron_Gold_Edge_",
        "ZhaoYun_V5_Pauldron_Rivet_",
    )
    changed = []
    for obj in bpy.data.objects:
        if obj.hide_render or not obj.name.startswith(prefixes):
            continue
        side = "l" if "_l" in obj.name else "r"
        sign = 1.0 if side == "l" else -1.0
        anchor = Vector((sign * 0.172, -0.078, 1.385))
        factors = (0.88, 0.96, 0.94)
        if obj.type == "MESH":
            for vertex in obj.data.vertices:
                vertex.co = transform_point_world(obj, vertex.co, anchor, factors)
            obj.data.update()
        elif obj.type == "CURVE":
            for spline in obj.data.splines:
                for point in spline.bezier_points:
                    point.co = transform_point_world(obj, point.co, anchor, factors)
                    point.handle_left = transform_point_world(obj, point.handle_left, anchor, factors)
                    point.handle_right = transform_point_world(obj, point.handle_right, anchor, factors)
                for point in spline.points:
                    transformed = transform_point_world(obj, point.co.xyz, anchor, factors)
                    point.co = (*transformed, point.co.w)
        else:
            continue
        changed.append(obj.name)
    return changed


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    fingers = relax_free_hand()
    pauldrons = narrow_pauldrons()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"RELAXED_FINGER_BONES={len(fingers)}")
    print(f"NARROWED_PAULDRON_OBJECTS={len(pauldrons)}")


if __name__ == "__main__":
    main()
