"""Finish the fresh Zhao Yun gaze and add a solid high topknot silhouette."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v6-warrior-read.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v7-gaze-topknot.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


STRUCTURE = {
    "Eyes_Size": 0.018,
    "Eyes_Eyelid_hooded": 0.035,
    "Eyes_Eyelid_Monolid": 0.030,
    "Eyes_UpperLidOpenness": -0.095,
    "Eyes_LowerLidOpenness": -0.040,
    "Eyes_EyelidsAngle": -0.025,
    "Eyes_EyelidsAngle2": -0.012,
    "Jaw_Definition": 0.045,
    "Jaw_Mandible": 0.030,
    "Chin_Portrusion": 0.020,
    "Nose_NasalAngle": 0.035,
    "Nose_Tip_Protrusion": 0.040,
    "Nose_TipCrease": 0.025,
}

EXPRESSION = {
    "Eyes_Squint": 0.045,
    "Eyebrows_Frown_Left": 0.012,
    "Eyebrows_Frown_Right": 0.014,
    "Eyebrows_InnerBrow_Lower_Left": 0.010,
    "Eyebrows_InnerBrow_Lower_Right": 0.012,
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


def thin_brows():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    brows = emitter.particle_systems.get("mind_eyebrows_11_Default")
    if not brows:
        return
    settings = brows.settings
    settings.rendered_child_count = 18
    settings.child_percent = 6
    settings.root_radius = 0.00065
    settings.tip_radius = 0.00050
    settings.radius_scale = 0.0038


def add_topknot():
    hair = bpy.data.materials["ZhaoYun_Black_Hair"]
    silver = bpy.data.materials["ZhaoYun_Restart_Antique_Silver"]
    jade = bpy.data.materials["ZhaoYun_Restart_Blue_Jade"]

    lower = base.add_ellipsoid(
        "ZhaoYun_Restart_V7_Topknot_Lower",
        (0.0, 0.058, 1.790),
        (0.055, 0.045, 0.050),
        hair,
        56,
        28,
    )
    lower.rotation_euler.x = math.radians(-12.0)
    upper = base.add_ellipsoid(
        "ZhaoYun_Restart_V7_Topknot_Upper",
        (-0.012, 0.073, 1.835),
        (0.042, 0.035, 0.048),
        hair,
        56,
        28,
    )
    upper.rotation_euler.x = math.radians(-20.0)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.041,
        minor_radius=0.0042,
        major_segments=56,
        minor_segments=12,
        location=(-0.008, 0.066, 1.814),
        rotation=(math.radians(90.0), 0.0, 0.0),
    )
    clasp = bpy.context.object
    clasp.name = "ZhaoYun_Restart_V7_Topknot_Silver_Clasp"
    clasp.scale.y = 0.82
    clasp.data.materials.append(silver)

    gem = base.add_ellipsoid(
        "ZhaoYun_Restart_V7_Topknot_Jade",
        (-0.008, 0.022, 1.816),
        (0.009, 0.004, 0.012),
        jade,
        32,
        16,
    )
    gem.rotation_euler.y = math.radians(10.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    apply_morphs(body)
    thin_brows()
    add_topknot()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
