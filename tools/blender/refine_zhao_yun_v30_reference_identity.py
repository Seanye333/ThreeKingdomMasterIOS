"""Second clean-reference pass: stronger eyes, slimmer jaw, brows and a real crown band."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-v29-clean-reference.blend"
OUTPUT_BLEND = SRC / "zhao-yun-v30-reference-identity.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refine_zhao_yun_vitruvian_v15_cinematic_hero as v15  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position


IDENTITY_INCREMENT = {
    "Eyes_Size": 0.120,
    "Eyes_Eyelid_hooded": -0.035,
    "Eyes_Eyelid_Monolid": 0.045,
    "Eyes_UpperLidOpenness": 0.080,
    "Eyes_LowerLidOpenness": -0.025,
    "Eyes_EyelidsAngle": -0.050,
    "Eyes_EyelidsAngle2": -0.025,
    "Eyes_EyeBagsProminence": -0.055,
    "Eyes_EyeBagsSize": -0.050,
    "Jaw_Width": -0.115,
    "Jaw_Mandible_GonialAngle": -0.060,
    "Jaw_Ramus_Extrusion": -0.040,
    "Chin_Width": -0.070,
    "Chin_SecondaryWidth": -0.045,
    "Cheeks_BuccalFat": 0.025,
    "Nose_Width": -0.080,
    "Nose_NostrilSize": -0.060,
    "Nose_TipCrease": 0.035,
    "Mouth_Lips_Height": 0.085,
    "Mouth_Lips_UpperLipArch": 0.035,
    "Mouth_Lips_UpperLipDepth": 0.035,
    "Mouth_Lips_BottomLipDepth": 0.045,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in IDENTITY_INCREMENT.items():
        data = np.load(MORPHS_L2 / f"{name}.npz")
        coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def sculpt_lower_face(body):
    skin_slots = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "UDIM.Skin"
    }
    indices = set()
    for polygon in body.data.polygons:
        if polygon.material_index in skin_slots:
            indices.update(polygon.vertices)
    for index in indices:
        co = body.data.vertices[index].co
        if 1.49 < co.z < 1.600 and co.y < 0.055 and abs(co.x) > 0.025:
            vertical = max(0.0, min(1.0, (1.600 - co.z) / 0.110))
            co.x *= 1.0 - 0.070 * vertical
        if 1.615 < co.z < 1.680 and co.y < -0.072 and abs(co.x) < 0.038:
            co.x *= 0.935
    body.data.update()


def add_brows_and_lashes():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    dark = bpy.data.materials["ZY15_Raven_Hair"]
    # In local coordinates the face points toward -Y.  These curves sit just
    # above the skin and give the bold, clean eye framing visible in the art.
    left_brow = [
        (-0.010, -0.0770, 1.6710),
        (-0.022, -0.0765, 1.6760),
        (-0.037, -0.0715, 1.6765),
        (-0.052, -0.0620, 1.6710),
    ]
    left_lash = [
        (-0.010, -0.0780, 1.6500),
        (-0.022, -0.0770, 1.6545),
        (-0.037, -0.0715, 1.6550),
        (-0.052, -0.0610, 1.6500),
    ]
    for side, brow, lash in (
        (-1, left_brow, left_lash),
        (1, [(-x, y, z) for x, y, z in left_brow], [(-x, y, z) for x, y, z in left_lash]),
    ):
        for lane in (-0.00065, 0.00065):
            v15.add_strand(
                f"ZhaoYun_V30_Reference_Brow_{side}_{lane:+.5f}",
                [(x, y - 0.0003, z + lane) for x, y, z in brow],
                0.00072,
                dark,
                rig,
            )
        v15.add_strand(
            f"ZhaoYun_V30_Reference_Lash_{side}",
            lash,
            0.00032,
            dark,
            rig,
        )


def add_solid_circlet_band():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    silver = bpy.data.materials.get("ZY2_Circlet_Silver")
    mesh = bpy.data.meshes.new("ZhaoYun_V30_Solid_Circlet_Band_Mesh")
    vertices = []
    columns = 25
    for row in range(2):
        for index in range(columns):
            x = -0.084 + 0.168 * index / (columns - 1)
            normalized = x / 0.084
            y = -0.0788 + 0.0105 * normalized * normalized
            z = 1.7005 - 0.0130 * normalized * normalized - row * 0.0105
            vertices.append((x, y, z))
    faces = []
    for index in range(columns - 1):
        faces.append((index, index + 1, columns + index + 1, columns + index))
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("ZhaoYun_V30_Solid_Circlet_Band", mesh)
    bpy.context.collection.objects.link(obj)
    if silver:
        obj.data.materials.append(silver)
    solidify = obj.modifiers.new("Circlet thickness", "SOLIDIFY")
    solidify.thickness = 0.0018
    bevel = obj.modifiers.new("Circlet soft edges", "BEVEL")
    bevel.width = 0.00065
    bevel.segments = 2
    v15.v4.parent_to_bone_keep_transform(obj, rig, "head")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    sculpt_lower_face(body)
    v22.enlarge_irises(body, scale=1.065)
    v24.lift_gaze(body, amount=0.00025)
    v24.recess_cornea_shell(body, depth=0.00045)
    add_brows_and_lashes()
    add_solid_circlet_band()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
