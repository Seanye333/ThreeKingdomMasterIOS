"""Push Zhao Yun v23 toward a sharper, cinematic leading-man likeness."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v23-warrior-prince.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v24-cinematic-lead.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


# v23 already has the youthful hero rebuild. These are deliberately smaller
# finishing increments: sharper eyes, a straighter nose, a fuller mouth, and a
# strong but not blocky lower face.
LEADING_MAN_STRUCTURE = {
    "Eyes_Eyelid_hooded": 0.020,
    "Eyes_EyelidsAngle": 0.040,
    "Eyes_EyelidsAngle2": 0.012,
    "Eyes_EyelidsCrease": 0.015,
    "Eyes_LacrimalCaruncle_Sharpness": 0.030,
    "Eyes_EyebrowsAngle": 0.065,
    "Face_FrontalBone_BrowRidge": 0.045,
    "Face_Zygomatic_Bone": 0.035,
    "Cheeks_UpperCheek_Bone": 0.035,
    "Cheeks_BoneDefinition": 0.030,
    "Cheeks_BuccalFat": 0.020,
    "Jaw_Definition": 0.085,
    "Jaw_Ramus_Extrusion": 0.040,
    "Jaw_Mandible_GonialAngle": 0.025,
    "Jaw_Width": 0.045,
    "Chin_Height": -0.030,
    "Chin_Width": 0.035,
    "Chin_SecondaryWidth": 0.020,
    "Chin_Portrusion": 0.028,
    "Nose_BridgeProminence": 0.060,
    "Nose_NasalBone": 0.030,
    "Nose_Width": -0.050,
    "Nose_BottomFlatness": 0.028,
    "Nose_Tip_Protrusion": 0.018,
    "Mouth_Lips_Length": 0.105,
    "Mouth_Lips_Height": 0.110,
    "Mouth_Lips_UpperLipArch": 0.050,
    "Mouth_Lips_UpperLipDepth": 0.042,
    "Mouth_Lips_BottomLipDepth": 0.052,
    "Mouth_PhiltrumDepth": 0.030,
}

LEADING_MAN_EXPRESSION = {
    "Eyes_Squint": 0.0,
    "Eyebrows_Frown_Left": 0.018,
    "Eyebrows_Frown_Right": 0.020,
    "Eyebrows_InnerBrow_Lower_Left": 0.018,
    "Eyebrows_InnerBrow_Lower_Right": 0.020,
    "Eyebrows_OuterBrow_Raised_Left": 0.020,
    "Eyebrows_OuterBrow_Raised_Right": 0.022,
    # Counter the old lip-tightening pose, then give the mouth quiet confidence.
    "Lips_Up_Tighten": -0.025,
    "Lips_Dn_Tighten": -0.020,
    "Lips_Up_Out": 0.018,
    "Lips_Dn_Out": 0.016,
    "Lips_Up_Corner_Wide_Left": 0.010,
    "Lips_Up_Corner_Wide_Right": 0.011,
    "Lips_Up_Corner_Tight_Left": 0.010,
    "Lips_Up_Corner_Tight_Right": 0.011,
}


def apply_morphs(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, LEADING_MAN_STRUCTURE), (MORPHS_L3, LEADING_MAN_EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def add_multi_spline_hair(name, strands, bevel_depth, material, rig):
    curve = bpy.data.curves.new(name + "_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 2
    curve.resolution_u = 2
    curve.materials.append(material)
    for points in strands:
        spline = curve.splines.new("BEZIER")
        spline.bezier_points.add(len(points) - 1)
        for point, coordinate in zip(spline.bezier_points, points):
            point.co = coordinate
            point.handle_left_type = "AUTO"
            point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    v4.parent_to_bone_keep_transform(obj, rig, "head")
    return obj


def replace_coarse_ponytail(rig, raven, raven_soft):
    for obj in bpy.data.objects:
        if obj.name.startswith(("ZhaoYun_V15_Ponytail_Clump_", "ZhaoYun_V15_Ponytail_Flyaway_")):
            obj.hide_render = True
            obj.hide_set(True)

    # Many fine splines read as flowing hair instead of the nine heavy tubes in v23.
    dense = []
    for index in range(54):
        lane = (index - 26.5) / 26.5
        wave = math.sin(index * 1.79)
        cross = math.cos(index * 1.21)
        dense.append(
            [
                (lane * 0.006, 0.096 + abs(lane) * 0.002, 1.792 + lane * 0.006),
                (-0.042 + lane * 0.018, 0.140 + lane * 0.004, 1.840 + lane * 0.032),
                (-0.155 + lane * 0.040 + wave * 0.010, 0.215 + lane * 0.009, 1.874 + lane * 0.055),
                (-0.325 + lane * 0.070 + wave * 0.020, 0.300 + lane * 0.014, 1.820 + lane * 0.085),
                (-0.505 + lane * 0.100 + cross * 0.030, 0.385 + lane * 0.019, 1.710 + lane * 0.120),
                (-0.685 + lane * 0.135 + wave * 0.050, 0.465 + lane * 0.024, 1.560 + lane * 0.170 + cross * 0.025),
            ]
        )
    add_multi_spline_hair("ZhaoYun_V24_Dense_Ponytail", dense, 0.00034, raven, rig)

    accents = []
    for index in range(18):
        lane = (index - 8.5) / 8.5
        wave = math.sin(index * 2.13)
        accents.append(
            [
                (lane * 0.004, 0.098, 1.796 + lane * 0.006),
                (-0.060 + lane * 0.020, 0.150, 1.855 + lane * 0.040),
                (-0.210 + lane * 0.055, 0.245, 1.870 + lane * 0.080),
                (-0.420 + lane * 0.100 + wave * 0.035, 0.355, 1.760 + lane * 0.130),
                (-0.720 + lane * 0.170 + wave * 0.070, 0.490, 1.500 + lane * 0.210),
            ]
        )
    add_multi_spline_hair("ZhaoYun_V24_Ponytail_Accents", accents, 0.00012, raven_soft, rig)


def add_face_framing_strands(rig, raven_soft):
    strands = []
    for side in (-1.0, 1.0):
        for index in range(9):
            lane = index / 8.0
            ripple = math.sin(index * 1.67 + side)
            root_x = side * (0.043 + lane * 0.018)
            end_z = 1.515 + lane * 0.055 + 0.012 * ripple
            strands.append(
                [
                    (root_x, -0.054 + lane * 0.004, 1.735 - lane * 0.010),
                    (root_x + side * 0.008, -0.069, 1.690 - lane * 0.014),
                    (root_x + side * (0.016 + lane * 0.006), -0.066, 1.635 - lane * 0.018),
                    (root_x + side * (0.022 + lane * 0.010), -0.040, 1.575 - lane * 0.025),
                    (root_x + side * (0.030 + lane * 0.012), -0.006, end_z),
                ]
            )
    add_multi_spline_hair("ZhaoYun_V24_Face_Framing_Hair", strands, 0.00022, raven_soft, rig)


def refine_hair_and_crown():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    raven = bpy.data.materials["ZY15_Raven_Hair"]
    raven_soft = bpy.data.materials["ZY15_Raven_Hair_Soft"]
    for material in (raven, raven_soft):
        material.diffuse_color = (0.002, 0.004, 0.009, 1.0)
        if material.use_nodes:
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf and "Roughness" in bsdf.inputs:
                bsdf.inputs["Roughness"].default_value = 0.32 if material == raven else 0.38

    # The old crown core was visually blocky. Slim it without disturbing the rig.
    core = bpy.data.objects.get("ZhaoYun_V15_Hair_Crown_Core")
    if core:
        core.scale.x *= 0.76
        core.scale.y *= 0.76

    replace_coarse_ponytail(rig, raven, raven_soft)


def refine_complexion():
    skin = bpy.data.materials.get("UDIM.Skin")
    if skin and skin.use_nodes:
        settings = skin.node_tree.nodes.get("charmorph_settings")
        if settings:
            values = {
                "Saturation": 0.033,
                "Value": -0.020,
                "Hemoglobin Fraction": 0.038,
                "Subsurface Scale Multiplier": 0.060,
                "Global Bump Strength": 0.043,
                "Micro Bump Strength": 0.095,
                "Roughness Multiplier": 0.038,
                "Lip Bump Strength": 0.086,
            }
            for name, value in values.items():
                socket = settings.outputs.get(name)
                if socket and hasattr(socket, "default_value"):
                    socket.default_value = value

    sclera = bpy.data.materials.get("Sclera_Cornea")
    if sclera and sclera.use_nodes:
        settings = sclera.node_tree.nodes.get("charmorph_settings")
        if settings:
            values = {
                "Sclera Redness": 0.055,
                "Sclera Yellowness": 0.018,
                "Sclera Bump Strength": 0.28,
            }
            for name, value in values.items():
                socket = settings.outputs.get(name)
                if socket and hasattr(socket, "default_value"):
                    socket.default_value = value


def lift_gaze(body, amount=0.00065):
    """Raise both irises slightly for a focused, alert gaze."""
    material_indices = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name in {"Iris", "Pupil"}
    }
    vertices = set()
    for polygon in body.data.polygons:
        if polygon.material_index in material_indices:
            vertices.update(polygon.vertices)
    for index in vertices:
        body.data.vertices[index].co.z += amount
    body.data.update()


def recess_cornea_shell(body, depth=0.0012):
    """Seat the wet sclera/cornea surface behind the lower eyelid skin."""
    material_indices = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "Sclera_Cornea"
    }
    vertices = set()
    for polygon in body.data.polygons:
        if polygon.material_index in material_indices:
            vertices.update(polygon.vertices)
    for index in vertices:
        body.data.vertices[index].co.y += depth
    body.data.update()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    lift_gaze(body)
    recess_cornea_shell(body)
    refine_hair_and_crown()
    refine_complexion()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
