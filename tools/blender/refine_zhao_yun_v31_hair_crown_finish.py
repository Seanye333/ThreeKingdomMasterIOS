"""Replace legacy wire hair and finish the portrait-matched crown and eyes."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-v30-reference-identity.blend"
OUTPUT_BLEND = SRC / "zhao-yun-v31-hair-crown-finish.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v15_cinematic_hero as v15  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position


def hide_legacy_wire_hair():
    prefixes = (
        "ZhaoYun_V15_Ponytail_",
        "ZhaoYun_V17_Flowing_Ponytail_Lock_",
        "ZhaoYun_V24_Dense_Ponytail",
        "ZhaoYun_V24_Ponytail_Accents",
    )
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def make_multi_curve(name, strand_sets, radius, material, rig):
    curve = bpy.data.curves.new(name + "_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    curve.materials.append(material)
    for points in strand_sets:
        spline = curve.splines.new("BEZIER")
        spline.bezier_points.add(len(points) - 1)
        for point, coordinate in zip(spline.bezier_points, points):
            point.co = coordinate
            point.handle_left_type = "AUTO"
            point.handle_right_type = "AUTO"
        spline.radius_interpolation = "BSPLINE"
        for index, point in enumerate(spline.bezier_points):
            point.radius = max(0.10, 1.0 - 0.88 * index / max(1, len(points) - 1))
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    v15.v4.parent_to_bone_keep_transform(obj, rig, "head")
    return obj


def build_windswept_hair():
    random.seed(3107)
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    raven = bpy.data.materials["ZY15_Raven_Hair"]
    raven_soft = bpy.data.materials.get("ZY15_Raven_Hair_Soft") or raven
    for material in (raven, raven_soft):
        material.diffuse_color = (0.0015, 0.0022, 0.0040, 1.0)
        if material.use_nodes:
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf and "Base Color" in bsdf.inputs:
                bsdf.inputs["Base Color"].default_value = (0.0015, 0.0022, 0.0040, 1.0)
            if bsdf and "Roughness" in bsdf.inputs:
                bsdf.inputs["Roughness"].default_value = 0.30

    emitter = bpy.data.objects.get("ZhaoYun_Strand_Hair_Emitter")
    if emitter and emitter.data.materials:
        hair_material = emitter.data.materials[0]
        if hair_material and hair_material.use_nodes:
            for node in hair_material.node_tree.nodes:
                if node.type == "BSDF_HAIR_PRINCIPLED" and "Color" in node.inputs:
                    node.inputs["Color"].default_value = (0.0012, 0.0018, 0.0032, 1.0)

    fine = []
    for index in range(104):
        lane = (index - 51.5) / 51.5
        jitter = random.uniform(-1.0, 1.0)
        lift = random.uniform(-0.012, 0.018)
        wave = math.sin(index * 1.713) * 0.018
        fine.append(
            [
                (lane * 0.010, 0.091 + abs(lane) * 0.003, 1.790 + lane * 0.010),
                (-0.055 + lane * 0.020, 0.126 + lane * 0.006, 1.840 + lane * 0.025 + lift),
                (-0.155 + lane * 0.047 + wave, 0.170 + lane * 0.010, 1.840 + lane * 0.050 + lift),
                (-0.275 + lane * 0.072 + wave * 1.4, 0.210 + lane * 0.016, 1.770 + lane * 0.080 + jitter * 0.018),
                (-0.405 + lane * 0.095 + wave * 2.0, 0.245 + lane * 0.022, 1.655 + lane * 0.115 + jitter * 0.030),
            ]
        )
    make_multi_curve("ZhaoYun_V31_Windswept_Hair_Fine", fine, 0.00017, raven_soft, rig)

    clumps = []
    for index in range(22):
        lane = (index - 10.5) / 10.5
        wave = math.sin(index * 2.05) * 0.022
        clumps.append(
            [
                (lane * 0.009, 0.090, 1.792 + lane * 0.008),
                (-0.060 + lane * 0.019, 0.130, 1.843 + lane * 0.028),
                (-0.170 + lane * 0.045 + wave, 0.176, 1.825 + lane * 0.050),
                (-0.295 + lane * 0.070 + wave * 1.5, 0.218, 1.735 + lane * 0.085),
                (-0.420 + lane * 0.092 + wave * 2.0, 0.255, 1.610 + lane * 0.120),
            ]
        )
    make_multi_curve("ZhaoYun_V31_Windswept_Hair_Clumps", clumps, 0.00058, raven, rig)

    # A few loose face-framing locks recreate the portrait's windblown fringe.
    fringe = []
    for side in (-1.0, 1.0):
        for index in range(8):
            lane = index / 7.0
            fringe.append(
                [
                    (side * (0.018 + lane * 0.043), -0.055 + lane * 0.012, 1.742 - lane * 0.010),
                    (side * (0.030 + lane * 0.048), -0.072 + lane * 0.006, 1.700 - lane * 0.015),
                    (side * (0.045 + lane * 0.052), -0.060 + lane * 0.010, 1.640 - lane * 0.022),
                    (side * (0.060 + lane * 0.055), -0.022 + lane * 0.015, 1.570 - lane * 0.030),
                ]
            )
    make_multi_curve("ZhaoYun_V31_Face_Framing_Locks", fringe, 0.00024, raven_soft, rig)


def refit_circlet():
    for obj in bpy.data.objects:
        if obj.name.startswith(("ZhaoYun_V29_Circlet_", "ZhaoYun_V30_Solid_Circlet_Band")):
            obj.location.y += 0.0048
            obj.location.z -= 0.0035

    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_V29_Circlet_Leaf_"):
            obj.scale.z *= 0.72

    center_halo = bpy.data.objects.get("ZhaoYun_V29_Circlet_Center_Halo")
    center_gem = bpy.data.objects.get("ZhaoYun_V29_Circlet_Center_Jade")
    if center_halo:
        center_halo.scale *= 0.82
    if center_gem:
        center_gem.scale *= 0.82

    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    silver = bpy.data.materials.get("ZY2_Circlet_Silver")
    jade = bpy.data.materials.get("ZY2_Circlet_Jade")
    for side in (-1.0, 1.0):
        halo = base.add_ellipsoid(
            f"ZhaoYun_V31_Circlet_Side_Halo_{int(side)}",
            (side * 0.035, -0.0802, 1.698),
            (0.0073, 0.0025, 0.0090),
            silver,
            32,
            16,
        )
        gem = base.add_ellipsoid(
            f"ZhaoYun_V31_Circlet_Side_Jade_{int(side)}",
            (side * 0.035, -0.0825, 1.698),
            (0.0038, 0.0019, 0.0050),
            jade,
            28,
            14,
        )
        for obj in (halo, gem):
            v15.v4.parent_to_bone_keep_transform(obj, rig, "head")


def refine_eye_frame(body):
    v22.enlarge_irises(body, scale=1.075)
    # Replace the overly arched v30 guide brows with one flatter heroic stroke.
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_V30_Reference_Brow_"):
            obj.hide_render = True
            obj.hide_set(True)
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    dark = bpy.data.materials["ZY15_Raven_Hair"]
    left = [
        (-0.010, -0.0775, 1.6670),
        (-0.024, -0.0765, 1.6700),
        (-0.039, -0.0705, 1.6695),
        (-0.053, -0.0605, 1.6660),
    ]
    for side, points in ((-1, left), (1, [(-x, y, z) for x, y, z in left])):
        v15.add_strand(f"ZhaoYun_V31_Heroic_Brow_{side}", points, 0.00095, dark, rig)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    hide_legacy_wire_hair()
    build_windswept_hair()
    refit_circlet()
    refine_eye_frame(body)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
