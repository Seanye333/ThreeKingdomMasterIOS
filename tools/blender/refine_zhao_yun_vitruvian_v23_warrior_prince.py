"""Refine Zhao Yun into a broader-jawed, shorter-faced warrior prince."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v21-young-hero.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v23-warrior-prince.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position


PRINCE_STRUCTURE = {
    "Eyes_Size": 0.0,
    "Eyes_UpperLidOpenness": 0.0,
    "Eyes_LowerLidOpenness": 0.0,
    "Eyes_EyelidsAngle": 0.0,
    "Eyes_EyelidsAngle2": 0.0,
    "Eyes_EyeBagsProminence": -0.08,
    "Eyes_EyeBagsSize": -0.05,
    "Face_Maxilla": 0.055,
    "Face_Zygomatic_Bone": 0.075,
    "Cheeks_UpperCheek_Bone": 0.095,
    "Cheeks_BoneDefinition": 0.075,
    "Cheeks_BuccalFat": -0.035,
    "Jaw_Definition": 0.22,
    "Jaw_Ramus_Extrusion": 0.115,
    "Jaw_Mandible_GonialAngle": 0.105,
    "Jaw_Width": 0.235,
    "Chin_Height": -0.105,
    "Chin_Width": 0.085,
    "Chin_SecondaryWidth": 0.060,
    "Chin_Portrusion": 0.075,
    "Nose_NoseHeight": -0.070,
    "Nose_BridgeProminence": 0.045,
    "Nose_Width": -0.095,
    "Nose_Tip_Protrusion": 0.035,
    "Mouth_Lips_Length": 0.175,
    "Mouth_Lips_Height": 0.115,
    "Mouth_Lips_UpperLipArch": 0.085,
    "Mouth_Lips_UpperLipDepth": 0.065,
    "Mouth_Lips_BottomLipDepth": 0.050,
}

PRINCE_EXPRESSION = {
    "Eyes_Squint": 0.0,
    "Lower_Eyelid_Up_Left": 0.0,
    "Lower_Eyelid_Up_Right": 0.0,
    "Eyebrows_Frown_Left": 0.026,
    "Eyebrows_Frown_Right": 0.029,
    "Lips_Up_Corner_Wide_Left": 0.022,
    "Lips_Up_Corner_Wide_Right": 0.024,
    "Lips_Up_Tighten": 0.015,
    "Lips_Dn_Tighten": 0.012,
}


def apply_morphs(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, PRINCE_STRUCTURE), (MORPHS_L3, PRINCE_EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def refine_beauty_skin():
    skin = bpy.data.materials.get("UDIM.Skin")
    if not skin or not skin.use_nodes:
        return
    settings = skin.node_tree.nodes.get("charmorph_settings")
    if not settings:
        return
    values = {
        "Saturation": 0.028,
        "Value": -0.014,
        "Hemoglobin Fraction": 0.036,
        "Subsurface Scale Multiplier": 0.050,
        "Global Bump Strength": 0.047,
        "Micro Bump Strength": 0.112,
        "Roughness Multiplier": 0.045,
        "Lip Bump Strength": 0.075,
    }
    for name, value in values.items():
        socket = settings.outputs.get(name)
        if socket and hasattr(socket, "default_value"):
            socket.default_value = value


def remove_protruding_eye_moisture():
    """Hide the legacy wet-eye shell that protrudes below the rebuilt lids."""
    for material_name in ("AqueosLayer",):
        material = bpy.data.materials.get(material_name)
        if not material:
            continue
        material.use_nodes = True
        nodes = material.node_tree.nodes
        links = material.node_tree.links
        nodes.clear()
        output = nodes.new("ShaderNodeOutputMaterial")
        transparent = nodes.new("ShaderNodeBsdfTransparent")
        links.new(transparent.outputs["BSDF"], output.inputs["Surface"])


def recess_iris_surfaces(body, depth=0.0016):
    """Move iris/pupil surfaces behind the rebuilt lids to prevent pinholes."""
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
        body.data.vertices[index].co.y += depth
    body.data.update()


def mask_lower_sclera_artifacts(body):
    """Assign the hidden lower cornea lobes to the transparent moisture slot."""
    sclera_index = next(
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "Sclera_Cornea"
    )
    transparent_index = next(
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "AqueosLayer"
    )
    changed = 0
    for polygon in body.data.polygons:
        if polygon.material_index != sclera_index:
            continue
        center = sum((body.data.vertices[index].co for index in polygon.vertices), Vector()) / len(polygon.vertices)
        if center.z < 1.6350 and center.y < -0.0545 and 0.015 < abs(center.x) < 0.046:
            polygon.material_index = transparent_index
            changed += 1
    body.data.update()
    print(f"MASKED_LOWER_SCLERA_POLYGONS={changed}")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    v22.strengthen_brow_groom()
    v22.warm_skin_and_deepen_eyes()
    refine_beauty_skin()
    remove_protruding_eye_moisture()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
