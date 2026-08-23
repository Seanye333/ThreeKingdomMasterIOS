"""Clean Zhao Yun rebuild driven by the supplied portrait, with no face decal."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v26-reference-rebuild.blend"
OUTPUT_BLEND = SRC / "zhao-yun-v29-clean-reference.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v15_cinematic_hero as v15  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position


REFERENCE_FACE = {
    # Long, narrow key-art silhouette with smooth youthful cheek planes.
    "Face_Maxilla": -0.055,
    "Face_Zygomatic_Bone": -0.060,
    "Face_Puffy": -0.025,
    "Cheeks_UpperCheek_Bone": -0.045,
    "Cheeks_BoneDefinition": -0.035,
    "Cheeks_BuccalFat": 0.035,
    "Jaw_Width": -0.175,
    "Jaw_Definition": -0.025,
    "Jaw_Mandible": -0.040,
    "Jaw_Mandible_GonialAngle": -0.070,
    "Jaw_Ramus_Extrusion": -0.045,
    "Chin_Height": -0.035,
    "Chin_Width": -0.085,
    "Chin_SecondaryWidth": -0.050,
    "Chin_Portrusion": -0.035,
    # Large dark almond eyes and a clean East-Asian upper lid.
    "Eyes_Size": 0.095,
    "Eyes_Distance": -0.025,
    "Eyes_Eyelid_hooded": -0.070,
    "Eyes_Eyelid_Monolid": 0.090,
    "Eyes_EyelidsAngle": -0.105,
    "Eyes_EyelidsAngle2": -0.045,
    "Eyes_EyelidsCrease": 0.020,
    "Eyes_UpperLidOpenness": 0.070,
    "Eyes_LowerLidOpenness": -0.018,
    "Eyes_EyeBagsProminence": -0.100,
    "Eyes_EyeBagsSize": -0.080,
    "Eyes_LacrimalCaruncle_Sharpness": 0.070,
    "Eyes_EyebrowsAngle": -0.065,
    "Face_EyeSocket_Protrusion": -0.025,
    "Face_FrontalBone_BrowRidge": -0.030,
    # Narrow bridge with a distinct three-quarter-profile projection.
    "Nose_Width": -0.185,
    "Nose_NostrilSize": -0.115,
    "Nose_BridgeProminence": 0.035,
    "Nose_NasalBone": 0.020,
    "Nose_Protrusion": 0.085,
    "Nose_Tip_Protrusion": 0.055,
    "Nose_TipCrease": 0.020,
    "Nose_Tip_Z": 0.012,
    "Nose_BottomFlatness": 0.020,
    # Compact but softly full lips like the illustrated portrait.
    "Mouth_Lips_Length": -0.015,
    "Mouth_Lips_Height": 0.075,
    "Mouth_Lips_UpperLipArch": 0.050,
    "Mouth_Lips_UpperLipDepth": 0.045,
    "Mouth_Lips_BottomLipDepth": 0.060,
    "Mouth_PhiltrumHeight": -0.030,
    "Mouth_PhiltrumDepth": 0.012,
}

REFERENCE_EXPRESSION = {
    "Eyes_Squint": 0.0,
    "Eyebrows_Frown_Left": -0.004,
    "Eyebrows_Frown_Right": -0.004,
    "Eyebrows_OuterBrow_Raised_Left": 0.020,
    "Eyebrows_OuterBrow_Raised_Right": 0.022,
    "Lips_Up_Tighten": -0.020,
    "Lips_Dn_Tighten": -0.018,
    "Lips_Up_Out": 0.010,
    "Lips_Dn_Out": 0.014,
    "Lips_Up_Corner_Tight_Left": 0.012,
    "Lips_Up_Corner_Tight_Right": 0.014,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, REFERENCE_FACE), (MORPHS_L3, REFERENCE_EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def smoothstep(low, high, value):
    factor = max(0.0, min(1.0, (value - low) / (high - low)))
    return factor * factor * (3.0 - 2.0 * factor)


def sculpt_portrait_silhouette(body):
    skin_slots = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "UDIM.Skin"
    }
    skin_vertices = set()
    for polygon in body.data.polygons:
        if polygon.material_index in skin_slots:
            skin_vertices.update(polygon.vertices)

    changed = 0
    for index in skin_vertices:
        co = body.data.vertices[index].co
        if not (1.49 < co.z < 1.735 and co.y < 0.070):
            continue

        outer = smoothstep(0.028, 0.086, abs(co.x))
        if co.z < 1.595:
            co.x *= 1.0 - 0.095 * outer
            if abs(co.x) < 0.050:
                co.y += 0.0018 * (1.0 - smoothstep(1.49, 1.595, co.z))
        elif co.z < 1.665:
            co.x *= 1.0 - 0.040 * outer

        # Slim the nasal cartilage while retaining the reference's projected tip.
        if 1.610 < co.z < 1.680 and co.y < -0.070:
            nose = 1.0 - smoothstep(0.012, 0.038, abs(co.x))
            co.x *= 1.0 - 0.075 * nose
            co.y -= 0.0022 * nose
        changed += 1
    body.data.update()
    print(f"SCULPTED_REFERENCE_VERTICES={changed}")


def refine_materials():
    skin = bpy.data.materials.get("UDIM.Skin")
    if skin and skin.use_nodes:
        settings = skin.node_tree.nodes.get("charmorph_settings")
        if settings:
            values = {
                "Saturation": 0.016,
                "Value": 0.012,
                "Hemoglobin Fraction": 0.018,
                "Subsurface Scale Multiplier": 0.075,
                "Global Bump Strength": 0.018,
                "Micro Bump Strength": 0.030,
                "Roughness Multiplier": 0.032,
                "Lip Bump Strength": 0.045,
            }
            for name, value in values.items():
                socket = settings.outputs.get(name)
                if socket and hasattr(socket, "default_value"):
                    socket.default_value = value

    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        primary = iris.node_tree.nodes.get("Primary Iris Color")
        secondary = iris.node_tree.nodes.get("Secondary Iris Color")
        if primary and "Color" in primary.outputs:
            primary.outputs["Color"].default_value = (0.00010, 0.00007, 0.000045, 1.0)
        if secondary and "Color" in secondary.outputs:
            secondary.outputs["Color"].default_value = (0.00035, 0.00016, 0.00007, 1.0)


def build_reference_circlet():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    silver = bpy.data.materials.get("ZY2_Circlet_Silver") or base.make_material(
        "ZY29_Circlet_Silver", (0.34, 0.39, 0.46), 0.88, 0.20
    )
    dark = bpy.data.materials.get("ZY2_Circlet_Engraving") or base.make_material(
        "ZY29_Circlet_Engraving", (0.035, 0.045, 0.060), 0.72, 0.28
    )
    jade = bpy.data.materials.get("ZY2_Circlet_Jade") or base.make_material(
        "ZY29_Circlet_Jade", (0.010, 0.085, 0.105), 0.18, 0.18
    )

    for obj in bpy.data.objects:
        if obj.name.startswith(("ZhaoYun_Fitted_Silver_Circlet", "ZhaoYun_Circlet_")):
            obj.hide_render = True
            obj.hide_set(True)

    xs = [(-0.082 + index * 0.01025) for index in range(17)]
    upper = [(x, -0.0790 + 0.010 * (x / 0.082) ** 2, 1.700 - 0.013 * (x / 0.082) ** 2) for x in xs]
    lower = [(x, y - 0.0008, z - 0.0105) for x, y, z in upper]
    v15.add_strand("ZhaoYun_V29_Circlet_Upper", upper, 0.00225, silver, rig)
    v15.add_strand("ZhaoYun_V29_Circlet_Lower", lower, 0.00165, dark, rig)

    # Symmetrical cloud-and-leaf filigree, matching the broad ornate reference band.
    for side in (-1.0, 1.0):
        for layer in range(3):
            start = 0.010 + layer * 0.015
            points = [
                (side * start, -0.0810, 1.696 + layer * 0.0015),
                (side * (start + 0.010), -0.0830, 1.707 + layer * 0.0010),
                (side * (start + 0.022), -0.0815, 1.700 - layer * 0.0010),
                (side * (start + 0.031), -0.0785, 1.692 - layer * 0.0015),
            ]
            v15.add_strand(
                f"ZhaoYun_V29_Circlet_Leaf_{int(side)}_{layer}",
                points,
                0.00125 if layer == 0 else 0.00095,
                silver,
                rig,
            )

    halo = base.add_ellipsoid(
        "ZhaoYun_V29_Circlet_Center_Halo",
        (0.0, -0.0840, 1.704),
        (0.0125, 0.0034, 0.0155),
        silver,
        48,
        24,
    )
    gem = base.add_ellipsoid(
        "ZhaoYun_V29_Circlet_Center_Jade",
        (0.0, -0.0872, 1.704),
        (0.0068, 0.0026, 0.0090),
        jade,
        40,
        20,
    )
    for obj in (halo, gem):
        v15.v4.parent_to_bone_keep_transform(obj, rig, "head")


def tame_ponytail():
    # Preserve the windswept silhouette but remove the oversized coarse plume.
    for name in ("ZhaoYun_V24_Dense_Ponytail", "ZhaoYun_V24_Ponytail_Accents"):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "CURVE":
            continue
        for spline in obj.data.splines:
            points = spline.bezier_points if spline.type == "BEZIER" else spline.points
            if not points:
                continue
            root = points[0].co.copy()
            for index, point in enumerate(points):
                factor = index / max(1, len(points) - 1)
                point.co = root + (point.co - root) * (1.0 - 0.22 * factor)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    sculpt_portrait_silhouette(body)
    v22.enlarge_irises(body, scale=1.055)
    v24.lift_gaze(body, amount=0.00045)
    v24.recess_cornea_shell(body, depth=0.00065)
    refine_materials()
    build_reference_circlet()
    tame_ponytail()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
