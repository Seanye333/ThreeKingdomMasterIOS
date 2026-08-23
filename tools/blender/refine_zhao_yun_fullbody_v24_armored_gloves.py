"""Add restrained silver-and-jade hand guards to Zhao Yun's fitted gloves."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v23-anatomical-weapon-pose.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v24-armored-gloves.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def bounds_center(obj):
    return obj.matrix_world @ (sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0)


def face_camera(obj, camera, local_normal="Y"):
    direction = (camera.location - obj.location).normalized()
    obj.rotation_euler = direction.to_track_quat(local_normal, "Z").to_euler()


def make_hand_guard(side, glove, camera, gold, silver, jade):
    center = bounds_center(glove)
    toward_camera = (camera.location - center).normalized()
    gold_plate = base.add_ellipsoid(
        f"ZhaoYun_V24_Glove_Gold_Frame_{side}",
        tuple(center + toward_camera * 0.010),
        (0.041, 0.0070, 0.050),
        gold,
        48,
        24,
    )
    silver_plate = base.add_ellipsoid(
        f"ZhaoYun_V24_Glove_Silver_Plate_{side}",
        tuple(center + toward_camera * 0.014),
        (0.035, 0.0065, 0.044),
        silver,
        48,
        24,
    )
    jade_stud = base.add_ellipsoid(
        f"ZhaoYun_V24_Glove_Jade_Stud_{side}",
        tuple(center + toward_camera * 0.021),
        (0.009, 0.0050, 0.011),
        jade,
        36,
        18,
    )
    for obj in (gold_plate, silver_plate, jade_stud):
        face_camera(obj, camera)
    return [gold_plate.name, silver_plate.name, jade_stud.name]


def brighten_glove_leather():
    material = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    bsdf = material.node_tree.nodes.get("Principled BSDF") if material.use_nodes else None
    if not bsdf:
        return False
    bsdf.inputs["Base Color"].default_value = (0.026, 0.050, 0.085, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.52
    return True


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    camera = bpy.context.scene.camera
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    created = []
    for side in ("l", "r"):
        glove = bpy.data.objects[f"ZhaoYun_V16_Fitted_Leather_Glove_{side}"]
        created.extend(make_hand_guard(side, glove, camera, gold, silver, jade))
    leather_changed = brighten_glove_leather()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CREATED_HAND_GUARD_OBJECTS={created}")
    print(f"LEATHER_CHANGED={leather_changed}")


if __name__ == "__main__":
    main()
