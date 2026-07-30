"""Zhang Fei v7: bone-parent static costume parts and test a guarded battle-ready torso pose."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import cone_between, look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v6.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v7.blend"
FRONT = SRC / "zhang-fei-reference-fullbody-v7-front.png"
UPPER = SRC / "zhang-fei-reference-fullbody-v7-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v7-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v7-three-quarter.png"


def world_center(obj):
    return sum((obj.matrix_world @ Vector(corner) for corner in obj.bound_box), Vector()) / 8.0


def parent_to_bone(obj, rig, bone_name):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def assign_static_costume_to_bones():
    rig = bpy.data.objects["Zhang_Fei_Game_Rig"]
    assigned = set()

    weapon_prefixes = (
        "ZhangFei_Serpent_Spear_Pole",
        "ZhangFeiV2_EightSpan_Serpent_Blade",
        "ZhangFeiV2_Serpent_Gold_Ridge_",
        "ZhangFei_Spear_",
        "Fullbody_Crimson_Pole_Grip_",
        "Fullbody_Pole_Butt_Spike",
    )
    for obj in bpy.data.objects:
        if obj.name.startswith(weapon_prefixes):
            parent_to_bone(obj, rig, "hand_r")
            assigned.add(obj.name)

    head_prefixes = (
        "ZhangFei_Coarse_Hair_Cap",
        "ZhangFei_Black_Oxblood_Headband",
        "ZhangFei_Gold_Forehead_Crest",
        "Headcloth_Crest_",
        "Headcloth_Gold_Stud_",
        "ZhangFei_Eye_",
        "ZhangFei_Upper_Lid_",
        "ZhangFei_Lower_Lid_",
        "ZhangFei_Tear_Duct_",
        "ZhangFei_Heavy_Brow_",
        "ZhangFei_Brow_Fibers_",
        "ZhangFei_Bushy_Beard_",
        "ZhangFei_Moustache_",
        "ZhangFeiV2_Hair_",
        "ZhangFeiV2_Brow_",
        "ZhangFeiV2_Cheek_",
        "ZhangFeiV3_Face_",
        "ZhangFeiV3_Mouth_",
        "ZhangFeiV4_Topknot_",
        "ZhangFeiV5_Eye_",
    )
    for obj in bpy.data.objects:
        if obj.name in assigned or obj.name in ("Zhang_Fei_Basemesh", "Zhang_Fei_Game_Rig"):
            continue
        explicit = obj.name.startswith(head_prefixes)
        geometric = False
        if obj.type in ("MESH", "CURVE"):
            center = world_center(obj)
            geometric = center.z > 1.495 and abs(center.x) < 0.19 and max(obj.dimensions) < 0.55
        if explicit or geometric:
            parent_to_bone(obj, rig, "head")
            assigned.add(obj.name)

    groups = (
        (("Dragon_", "Sculpted_Dragon_", "Pauldron_Scale_"), "clavicle_r"),
        (("V33_Right_Pauldron_",), "clavicle_l"),
        (("V35_Sleeve_Left",), "upperarm_r"),
        (("V35_Sleeve_Right", "V38_Raised_Sleeve_Fitted_Core", "V38_Raised_Sleeve_Deep_Fold"), "upperarm_l"),
        (("V38_Raised_Sleeve_Gold_Cuff",), "lowerarm_l"),
        (("ZhangFeiV5_Hand_",), "hand_l"),
        (("Portrait_Dragon_Armor_Harness", "ZhangFeiV2_Fur_Shoulder_Collar", "Fullbody_Fitted_Leather_Bracers", "Fullbody_Bracer_Gold_Edges"), "spine_03"),
    )
    for prefixes, bone_name in groups:
        for obj in bpy.data.objects:
            if obj.name in assigned or not obj.name.startswith(prefixes):
                continue
            parent_to_bone(obj, rig, bone_name)
            assigned.add(obj.name)

    for name, bone_name in (
        ("ZhangFeiV3_Shoulder_Spike_Left", "clavicle_r"),
        ("ZhangFeiV3_Shoulder_Spike_Right", "clavicle_l"),
    ):
        obj = bpy.data.objects.get(name)
        if obj and obj.name not in assigned:
            parent_to_bone(obj, rig, bone_name)
            assigned.add(obj.name)

    print(f"BONE_PARENTED={len(assigned)}")
    return rig


def rotate_pose_bone(rig, bone_name, axis, degrees):
    bone = rig.pose.bones[bone_name]
    pivot = bone.head.copy()
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(degrees), 4, axis)
        @ Matrix.Translation(-pivot)
    )
    bone.matrix = transform @ bone.matrix
    bpy.context.view_layer.update()


def build_guarded_battle_pose(rig):
    # Shift the whole upper body toward the spear side, then let the head turn
    # back toward the opponent/camera.  Arms remain in their authored relation,
    # so the combined bracer mesh is not torn apart during this binding test.
    rotate_pose_bone(rig, "spine_01", "Z", 4.0)
    rotate_pose_bone(rig, "spine_01", "X", -2.8)
    rotate_pose_bone(rig, "spine_03", "Z", 1.5)
    rotate_pose_bone(rig, "head", "Z", -5.5)
    rotate_pose_bone(rig, "head", "X", 1.8)


def bridge_left_forearm_in_final_pose(rig):
    # The original bracers are one combined two-arm mesh.  Once the upper body
    # turns, that object cannot follow the left forearm independently and a
    # skin-colored tube becomes exposed.  A bone-parented fitted bracer closes
    # the gap while keeping the hand and sleeve free of intersections.
    bone = rig.pose.bones["lowerarm_l"]
    head = rig.matrix_world @ bone.head
    tail = rig.matrix_world @ bone.tail
    start = head.lerp(tail, 0.36)
    end = head.lerp(tail, 0.94)
    cloth = bpy.data.materials["Zhang Fei charcoal battle cloth"]

    cone_between("ZhangFeiV7_Left_Forearm_Bracer", start, end, 0.041, 0.030, cloth, 48)


def render(scene, camera, path, resolution, location, target, lens):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = assign_static_costume_to_bones()
    build_guarded_battle_pose(rig)
    bridge_left_forearm_in_final_pose(rig)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.55, 1.10), (-0.05, -0.03, 1.13), 71)
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.34), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.64), (0.0, -0.095, 1.56), 96)
    render(scene, camera, THREE_QUARTER, (1100, 1100), (0.92, -2.36, 1.66), (0.0, -0.08, 1.55), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
