"""Give the fresh Zhao Yun head a confident gaze and recognizable silver-armored read."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v5-clean-hero.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v6-warrior-read.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position


STRUCTURE = {
    "Face_Zygomatic_Bone": 0.045,
    "Cheeks_BoneDefinition": 0.045,
    "Jaw_Definition": 0.065,
    "Chin_Portrusion": 0.035,
    "Chin_Width": -0.020,
    "Nose_BridgeProminence": 0.050,
    "Nose_NasalBone": 0.035,
    "Nose_Tip_Protrusion": 0.055,
    "Nose_TipCrease": 0.035,
}

EXPRESSION = {
    "Eyes_Squint": 0.022,
    "Eyebrows_Frown_Left": 0.016,
    "Eyebrows_Frown_Right": 0.018,
    "Eyebrows_InnerBrow_Lower_Left": 0.014,
    "Eyebrows_InnerBrow_Lower_Right": 0.016,
    "Eyebrows_OuterBrow_Raised_Left": 0.012,
    "Eyebrows_OuterBrow_Raised_Right": 0.014,
    "Lips_Up_Corner_Tight_Left": 0.008,
    "Lips_Up_Corner_Tight_Right": 0.009,
    "Lips_Up_Tighten": -0.010,
    "Lips_Dn_Tighten": -0.010,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, STRUCTURE), (MORPHS_L3, EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def make_armor_materials():
    return {
        "silver": base.make_material("ZhaoYun_Restart_V6_Moon_Silver", (0.26, 0.32, 0.40), 0.82, 0.24),
        "dark": base.make_material("ZhaoYun_Restart_V6_Blue_Black", (0.012, 0.025, 0.052), 0.12, 0.44),
        "white": base.make_material("ZhaoYun_Restart_V6_Pearl_Cape", (0.62, 0.68, 0.78), 0.0, 0.52),
        "jade": bpy.data.materials["ZhaoYun_Restart_Blue_Jade"],
        "gold": base.make_material("ZhaoYun_Restart_V6_Pale_Gold", (0.35, 0.20, 0.055), 0.76, 0.25),
    }


def bevel(obj, width=0.006, segments=3):
    modifier = obj.modifiers.new("Soft forged edges", "BEVEL")
    modifier.width = width
    modifier.segments = segments


def add_armor_bust(materials):
    for name in ("ZhaoYun_Restart_Neutral_Robe", "ZhaoYun_Restart_Collar_Edge"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True
            obj.hide_set(True)

    # White cape sits behind the shoulders and recreates the reference silhouette.
    cape = base.add_ellipsoid(
        "ZhaoYun_Restart_V6_White_Cape",
        (0.0, 0.095, 1.390),
        (0.405, 0.080, 0.245),
        materials["white"],
        72,
        32,
    )
    cape.scale.z = 1.05

    bpy.ops.mesh.primitive_cone_add(
        vertices=96,
        radius1=0.330,
        radius2=0.112,
        depth=0.300,
        location=(0.0, 0.020, 1.345),
    )
    tunic = bpy.context.object
    tunic.name = "ZhaoYun_Restart_V6_Dark_Tunic"
    tunic.data.materials.append(materials["dark"])
    for polygon in tunic.data.polygons:
        polygon.use_smooth = True

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.106,
        minor_radius=0.011,
        major_segments=72,
        minor_segments=16,
        location=(0.0, 0.0, 1.495),
    )
    collar = bpy.context.object
    collar.name = "ZhaoYun_Restart_V6_Silver_Collar"
    collar.scale.y = 0.82
    collar.data.materials.append(materials["silver"])

    for side in (-1.0, 1.0):
        pauldron = base.add_ellipsoid(
            f"ZhaoYun_Restart_V6_Pauldron_{int(side)}",
            (side * 0.215, -0.005, 1.420),
            (0.160, 0.105, 0.075),
            materials["silver"],
            64,
            28,
        )
        pauldron.rotation_euler.y = math.radians(side * 9.0)
        for layer in range(3):
            bpy.ops.mesh.primitive_cube_add(
                location=(side * (0.175 + layer * 0.035), -0.090, 1.455 - layer * 0.035),
            )
            plate = bpy.context.object
            plate.name = f"ZhaoYun_Restart_V6_Shoulder_Plate_{int(side)}_{layer}"
            plate.scale = (0.062, 0.014, 0.036)
            plate.rotation_euler.y = math.radians(side * (8.0 + layer * 3.0))
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            plate.data.materials.append(materials["silver"])
            bevel(plate, 0.005, 3)
        gem = base.add_ellipsoid(
            f"ZhaoYun_Restart_V6_Shoulder_Jade_{int(side)}",
            (side * 0.205, -0.112, 1.455),
            (0.017, 0.006, 0.017),
            materials["jade"],
            32,
            16,
        )
        halo = base.add_ellipsoid(
            f"ZhaoYun_Restart_V6_Shoulder_Gold_{int(side)}",
            (side * 0.205, -0.108, 1.455),
            (0.024, 0.004, 0.024),
            materials["gold"],
            32,
            16,
        )
        # Keep the jade in front of the gold halo from the portrait camera.
        gem.location.y -= 0.006
        halo.location.y += 0.001


def refine_eyes(body):
    v22.enlarge_irises(body, scale=1.145)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    apply_morphs(body)
    refine_eyes(body)
    add_armor_bust(make_armor_materials())
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
