"""Turn the clean restart head into Zhao Yun's portrait identity."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v1.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v2-identity.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position


IDENTITY_INCREMENT = {
    "Eyes_Size": 0.045,
    "Eyes_Eyelid_hooded": 0.030,
    "Eyes_Eyelid_Monolid": 0.060,
    "Eyes_UpperLidOpenness": -0.085,
    "Eyes_LowerLidOpenness": -0.025,
    "Eyes_EyelidsAngle": -0.035,
    "Eyes_EyelidsAngle2": -0.020,
    "Eyes_LacrimalCaruncle_Sharpness": 0.060,
    "Nose_BridgeProminence": 0.055,
    "Nose_NasalBone": 0.045,
    "Nose_NoseHeight": 0.025,
    "Nose_Protrusion": 0.105,
    "Nose_Tip_Protrusion": 0.045,
    "Nose_Width": -0.055,
    "Nose_NostrilSize": -0.035,
    "Chin_Width": -0.035,
    "Chin_SecondaryWidth": -0.020,
    "Cheeks_UpperCheek_Bone": 0.030,
    "Mouth_Lips_Height": 0.030,
    "Mouth_Lips_UpperLipArch": 0.025,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in IDENTITY_INCREMENT.items():
        data = np.load(MORPHS_L2 / f"{name}.npz")
        coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def add_tapered_strand(name, points, radius, material):
    obj = base.add_curve_strand(name, points, radius, material)
    spline = obj.data.splines[0]
    for index, point in enumerate(spline.bezier_points):
        point.radius = max(0.10, 1.0 - 0.85 * index / max(1, len(spline.bezier_points) - 1))
    return obj


def rebuild_portrait_hair():
    tie = bpy.data.objects.get("ZhaoYun_Topknot_Tie")
    if tie:
        tie.hide_render = True
        tie.hide_set(True)

    hair = bpy.data.materials["ZhaoYun_Black_Hair"]
    hair.diffuse_color = (0.0012, 0.0022, 0.0055, 1.0)
    if hair.use_nodes:
        shader = hair.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Base Color"].default_value = (0.0012, 0.0022, 0.0055, 1.0)
            shader.inputs["Roughness"].default_value = 0.34

    # Broad swept crown locks break the helmet-like scalp shell into readable hair.
    crown_paths = (
        [(-0.068, 0.018, 1.746), (-0.052, -0.048, 1.779), (-0.020, -0.102, 1.733), (0.006, -0.119, 1.695)],
        [(-0.044, 0.030, 1.770), (-0.030, -0.040, 1.804), (0.012, -0.095, 1.756), (0.038, -0.114, 1.704)],
        [(-0.018, 0.040, 1.786), (0.010, -0.025, 1.816), (0.054, -0.074, 1.774), (0.071, -0.092, 1.724)],
        [(0.012, 0.042, 1.786), (0.038, -0.016, 1.811), (0.076, -0.054, 1.774), (0.088, -0.070, 1.728)],
        [(0.046, 0.032, 1.768), (0.068, -0.010, 1.790), (0.092, -0.036, 1.750), (0.096, -0.045, 1.704)],
    )
    for index, path in enumerate(crown_paths):
        for lane in (-0.006, 0.0, 0.006):
            points = [(x + lane, y, z + 0.002 * math.sin(index + step)) for step, (x, y, z) in enumerate(path)]
            add_tapered_strand(f"ZhaoYun_Restart_V2_Crown_Lock_{index}_{lane:+.3f}", points, 0.0036, hair)

    # Asymmetric face-framing locks echo the reference without obscuring the eyes.
    locks = (
        [(-0.050, -0.085, 1.739), (-0.073, -0.119, 1.694), (-0.078, -0.118, 1.626), (-0.070, -0.078, 1.557)],
        [(-0.070, -0.060, 1.730), (-0.096, -0.090, 1.675), (-0.106, -0.070, 1.603), (-0.096, -0.024, 1.535)],
        [(0.057, -0.078, 1.736), (0.078, -0.108, 1.681), (0.086, -0.096, 1.616), (0.080, -0.050, 1.552)],
        [(0.075, -0.052, 1.724), (0.098, -0.078, 1.666), (0.108, -0.054, 1.595), (0.101, -0.004, 1.530)],
    )
    for index, path in enumerate(locks):
        add_tapered_strand(f"ZhaoYun_Restart_V2_Face_Lock_{index}", path, 0.0032, hair)

    # Shorter, denser windswept tail: clumps for mass plus fine flyaways.
    rng = random.Random(2209)
    for index in range(34):
        lane = (index - 16.5) / 16.5
        jitter = rng.uniform(-0.014, 0.014)
        path = [
            (lane * 0.010, 0.060, 1.790 + lane * 0.008),
            (-0.055 + lane * 0.024, 0.110, 1.830 + lane * 0.025),
            (-0.155 + lane * 0.055 + jitter, 0.165, 1.810 + lane * 0.052),
            (-0.285 + lane * 0.080 + jitter * 1.5, 0.215, 1.705 + lane * 0.090),
        ]
        add_tapered_strand(
            f"ZhaoYun_Restart_V2_Wind_Hair_{index}",
            path,
            0.0011 if index % 4 else 0.0018,
            hair,
        )


def refine_eyes(body):
    v22.enlarge_irises(body, scale=1.055)
    v24.recess_cornea_shell(body, depth=0.00045)
    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        primary = iris.node_tree.nodes.get("Primary Iris Color")
        secondary = iris.node_tree.nodes.get("Secondary Iris Color")
        if primary and "Color" in primary.outputs:
            primary.outputs["Color"].default_value = (0.00020, 0.00010, 0.00005, 1.0)
        if secondary and "Color" in secondary.outputs:
            secondary.outputs["Color"].default_value = (0.00065, 0.00025, 0.00008, 1.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    apply_morphs(body)
    refine_eyes(body)
    rebuild_portrait_hair()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
