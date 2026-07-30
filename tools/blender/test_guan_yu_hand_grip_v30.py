"""Render wrist-roll variants for selecting a stable Guan Yu polearm grip."""

from pathlib import Path
import math
import sys

import bpy
from mathutils import Quaternion, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-fullbody-v29.blend"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    hand = rig.pose.bones["hand_r"]
    target = bpy.data.objects["Portrait_Hand_Target_r"]
    constraint = next(item for item in hand.constraints if item.type == "IK")
    current_world_rotation = (rig.matrix_world @ hand.matrix).to_quaternion()
    constraint.use_rotation = True
    target.rotation_mode = "QUATERNION"

    for finger in ("index", "middle", "ring", "pinky"):
        for joint in (1, 2, 3):
            bone = rig.pose.bones.get(f"{finger}_{joint:02}_r")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(-68)
    for joint in (1, 2, 3):
        bone = rig.pose.bones.get(f"thumb_{joint:02}_r")
        if bone:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.x = math.radians(-34)

    camera = bpy.context.scene.camera
    camera.location = (-0.30, -1.72, 1.02)
    camera.data.lens = 92
    look_at(camera, (-0.35, -0.14, 0.98))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 620
    scene.render.resolution_y = 620
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"

    variants = [
        ("base", Vector((1, 0, 0)), 0),
        ("x_pos_45", Vector((1, 0, 0)), 45),
        ("x_neg_45", Vector((1, 0, 0)), -45),
        ("y_pos_45", Vector((0, 1, 0)), 45),
        ("y_neg_45", Vector((0, 1, 0)), -45),
        ("z_pos_45", Vector((0, 0, 1)), 45),
        ("z_neg_45", Vector((0, 0, 1)), -45),
        ("z_pos_80", Vector((0, 0, 1)), 80),
        ("z_neg_80", Vector((0, 0, 1)), -80),
    ]
    for label, axis, degrees in variants:
        target.rotation_quaternion = current_world_rotation @ Quaternion(axis, math.radians(degrees))
        bpy.context.view_layer.update()
        output = SRC / f"guan-yu-v30-hand-test-{label}.png"
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        print(f"OUTPUT={output}")


if __name__ == "__main__":
    main()
