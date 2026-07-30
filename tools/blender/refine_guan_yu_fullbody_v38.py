"""Guan Yu v38: raised-hand hero pose, rebuilt sleeve and wind-swept beard."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, look_at, strand
from refine_guan_yu_fullbody_v35 import cloth_tube, ring_curve


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v37.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v38.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v38-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v38-three-quarter.png"
UPPER = SRC / "guan-yu-reference-fullbody-v38-upper.png"


def remove_prefix(prefix):
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefix):
            bpy.data.objects.remove(obj, do_unlink=True)


def point_world(rig, bone_name, endpoint):
    bone = rig.pose.bones[bone_name]
    coordinate = bone.head if endpoint == "head" else bone.tail
    return rig.matrix_world @ coordinate


def raise_free_hand():
    """Bring the free hand toward the beard while keeping the weapon-side grip untouched."""
    hand_target = bpy.data.objects["Portrait_Hand_Target_l"]
    elbow_pole = bpy.data.objects["Portrait_Elbow_Pole_l"]
    hand_target.location = (0.105, -0.300, 1.285)
    elbow_pole.location = (0.510, -0.265, 1.245)
    constraint = bpy.data.objects["Guan_Yu_Game_Rig"].pose.bones["hand_l"].constraints.get("Natural bust arm pose")
    if constraint:
        constraint.iterations = 96
        constraint.influence = 1.0
    bpy.context.view_layer.update()


def curl_free_hand():
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    curls = {
        "index": (0.72, 0.92, 0.76),
        "middle": (0.82, 1.02, 0.84),
        "ring": (0.91, 1.10, 0.91),
        "pinky": (0.96, 1.13, 0.94),
        "thumb": (0.38, 0.52, 0.42),
    }
    for finger, rotations in curls.items():
        for segment, rotation in enumerate(rotations, start=1):
            bone = rig.pose.bones.get(f"{finger}_{segment:02d}_l")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = rotation
    bpy.context.view_layer.update()


def rebuild_raised_sleeve(silk, shadow, gold):
    old_sleeve = bpy.data.objects.get("V35_Sleeve_Right")
    if old_sleeve:
        old_sleeve.hide_render = True
        old_sleeve.hide_viewport = True
    remove_prefix("V38_Raised_Sleeve_")

    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    shoulder = point_world(rig, "upperarm_l", "head")
    elbow = point_world(rig, "lowerarm_l", "head")
    wrist = point_world(rig, "hand_l", "head")
    centers = [
        shoulder.lerp(elbow, 0.10),
        shoulder.lerp(elbow, 0.52),
        elbow,
        elbow.lerp(wrist, 0.52),
        elbow.lerp(wrist, 0.88),
    ]
    cloth_tube(
        "V38_Raised_Sleeve_Fitted_Core",
        [tuple(point) for point in centers],
        [0.082, 0.098, 0.105, 0.090, 0.060],
        [0.075, 0.095, 0.100, 0.085, 0.060],
        silk,
        32,
    )

    tangent = (wrist - elbow).normalized()
    cuff_center = elbow.lerp(wrist, 0.90)
    ring_curve("V38_Raised_Sleeve_Gold_Cuff", cuff_center, tangent, 0.061, 0.052, gold, 0.0030, 56)

    fold_points = [
        tuple(centers[0] + Vector((0.0, -0.076, 0.018))),
        tuple(centers[1] + Vector((0.0, -0.088, 0.010))),
        tuple(centers[2] + Vector((0.0, -0.083, -0.004))),
        tuple(centers[3] + Vector((0.0, -0.071, -0.012))),
    ]
    strand("V38_Raised_Sleeve_Deep_Fold", fold_points, 0.0022, shadow, taper=True)
    print("RAISED_ARM", "shoulder", tuple(round(v, 3) for v in shoulder), "elbow", tuple(round(v, 3) for v in elbow), "wrist", tuple(round(v, 3) for v in wrist))


def displace_curve_points(obj, threshold, x_amount, y_amount):
    if obj.type != "CURVE":
        return
    for spline in obj.data.splines:
        if spline.type == "BEZIER":
            for point in spline.bezier_points:
                z = point.co.z
                weight = min(1.0, max(0.0, (threshold - z) / 0.48))
                if weight <= 0.0:
                    continue
                shift = Vector((x_amount * weight * weight, y_amount * weight, 0.012 * weight))
                point.co += shift
                point.handle_left += shift
                point.handle_right += shift
        else:
            for point in spline.points:
                z = point.co.z
                weight = min(1.0, max(0.0, (threshold - z) / 0.48))
                if weight > 0.0:
                    point.co.x += x_amount * weight * weight
                    point.co.y += y_amount * weight
                    point.co.z += 0.012 * weight


def add_wind_to_hair():
    for obj in bpy.data.objects:
        if obj.name.startswith("V34_Groom_Beard_"):
            displace_curve_points(obj, 1.500, 0.220, 0.014)
        elif obj.name.startswith("V34_Groom_Head_Hair_"):
            displace_curve_points(obj, 1.460, 0.115, 0.010)


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
    silk = bpy.data.materials.get("Portrait emerald silk")
    shadow = bpy.data.materials.get("Portrait shadow green")
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    if not all((silk, shadow, gold)):
        raise RuntimeError("Required v37 costume materials are missing")

    raise_free_hand()
    curl_free_hand()
    rebuild_raised_sleeve(silk, shadow, gold)
    add_wind_to_hair()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72)
    render(scene, camera, THREE_QUARTER, (1000, 1450), (1.58, -6.10, 1.28), (0.0, -0.01, 1.12), 72)
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.31), 82)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"UPPER={UPPER}")


if __name__ == "__main__":
    main()
