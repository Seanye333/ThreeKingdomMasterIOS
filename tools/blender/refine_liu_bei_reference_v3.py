"""Rebuild Liu Bei v2's head proportions and facial anatomy for v3.

The earlier pass established costume identity.  This pass concentrates on the
human read: a rounder skull, less planar forehead and cheeks, a wider natural
eye aperture, properly forward eye globes, a quieter mouth, finer facial hair,
and a swept-back hairline that joins the court topknot.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, look_at, mat, sphere, strand
from create_liu_bei_reference_v1 import remove_matching


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "liu-bei-reference-fullbody-v2.blend"
OUTPUT_BLEND = SRC / "liu-bei-reference-fullbody-v3.blend"
FRONT = SRC / "liu-bei-reference-fullbody-v3-front.png"
UPPER = SRC / "liu-bei-reference-fullbody-v3-upper.png"
FACE = SRC / "liu-bei-reference-fullbody-v3-face.png"
THREE_QUARTER = SRC / "liu-bei-reference-fullbody-v3-three-quarter.png"


def curve_bundle_poly(name, paths, material, radius):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 1
    data.bevel_depth = radius
    data.bevel_resolution = 2
    data.resolution_u = 2
    for path, width in paths:
        spline = data.splines.new("POLY")
        spline.points.add(len(path) - 1)
        for index, coordinates in enumerate(path):
            point = spline.points[index]
            point.co = (*coordinates, 1.0)
            t = index / max(1, len(path) - 1)
            point.radius = max(0.12, width * (1.0 - 0.72 * t))
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def make_materials():
    skin_lid = mat("Liu Bei v3 subtle eyelid tissue", (0.145, 0.040, 0.022, 1), 0.55, noise=19.0, bump=0.004)
    lip = mat("Liu Bei v3 restrained living lip", (0.135, 0.027, 0.020, 1), 0.53, noise=24.0, bump=0.004)
    sclera = mat("Liu Bei v3 ivory sclera", (0.46, 0.395, 0.325, 1), 0.38, noise=9.0, bump=0.003)
    limbal = mat("Liu Bei v3 soft limbal ring", (0.005, 0.0018, 0.0007, 1), 0.26, noise=31.0, bump=0.008)
    iris = mat("Liu Bei v3 deep amber iris", (0.055, 0.014, 0.003, 1), 0.24, noise=55.0, bump=0.012)
    pupil = mat("Liu Bei v3 pupil", (0.00004, 0.00002, 0.00001, 1), 0.18)
    tear = mat("Liu Bei v3 tear tissue", (0.205, 0.028, 0.020, 1), 0.36)
    catchlight = mat("Liu Bei v3 eye catchlight", (0.76, 0.70, 0.59, 1), 0.11)
    hair = bpy.data.materials.get("Liu Bei v2 deep black brown hair")
    hair_warm = bpy.data.materials.get("Liu Bei v2 warm hair variation")
    hair_age = bpy.data.materials.get("Liu Bei v2 restrained age strands")
    return {
        "lid": skin_lid,
        "lip": lip,
        "sclera": sclera,
        "limbal": limbal,
        "iris": iris,
        "pupil": pupil,
        "tear": tear,
        "catchlight": catchlight,
        "hair": hair,
        "hair_warm": hair_warm,
        "hair_age": hair_age,
    }


def sculpt_head_v3():
    body = bpy.data.objects["Liu_Bei_Basemesh"]
    key = body.shape_key_add(name="Liu Bei v3 natural head rebuild", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    # Broaden changes over anatomical zones instead of pushing individual
    # points.  The falloffs keep the neck and ears continuous with the head.
    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if ax > 0.142 or co.y > 0.070 or not 1.505 < co.z < 1.805:
            continue

        # Round the upper skull and reduce the oversized planar forehead.
        if 1.700 < co.z < 1.795:
            height = math.sin((co.z - 1.700) / 0.095 * math.pi)
            co.x *= 1.0 - 0.025 * height
            if co.y < -0.040:
                centre = max(0.0, 1.0 - ax / 0.115)
                co.y -= 0.0028 * height * centre

        # Lift the upper socket and lower the lower socket to reveal a real
        # almond-shaped aperture without creating a second set of eyelids.
        for eye_x in (-0.034, 0.034):
            dx = abs(co.x - eye_x)
            if dx < 0.032 and co.y < -0.090:
                lateral = max(0.0, 1.0 - dx / 0.032)
                if 1.672 < co.z < 1.696:
                    vertical = max(0.0, 1.0 - abs(co.z - 1.681) / 0.016)
                    co.z += 0.0015 * lateral * vertical
                    co.y += 0.0005 * lateral * vertical
                elif 1.650 < co.z <= 1.672:
                    vertical = max(0.0, 1.0 - abs(co.z - 1.665) / 0.014)
                    co.z -= 0.0008 * lateral * vertical

        # Soften the cheek plane and keep a mature, humane mid-face volume.
        if 0.038 < ax < 0.108 and 1.600 < co.z < 1.670 and co.y < -0.050:
            cheek = max(0.0, 1.0 - abs(co.z - 1.638) / 0.040)
            co.x *= 1.0 + 0.018 * cheek
            co.y -= 0.0016 * cheek * max(0.0, 1.0 - ax / 0.120)

        # A narrower bridge, defined tip and restrained alae replace the flat
        # inherited martial nose while preserving the original topology.
        if ax < 0.029 and 1.610 < co.z < 1.670 and co.y < -0.095:
            bridge = max(0.0, 1.0 - ax / 0.029)
            co.x *= 0.965
            co.y -= 0.0022 * bridge
        if ax < 0.037 and 1.592 < co.z <= 1.622 and co.y < -0.105:
            tip = max(0.0, 1.0 - abs(co.z - 1.608) / 0.017)
            co.y -= 0.0028 * tip * max(0.0, 1.0 - ax / 0.040)
            if ax > 0.017:
                co.x *= 0.975

        # Relax the muzzle, round the lower lip/chin transition and remove the
        # pinched game-character jaw silhouette.
        if ax < 0.054 and 1.556 < co.z < 1.594 and co.y < -0.110:
            co.y += 0.0008
        if 1.515 < co.z < 1.585 and 0.030 < ax < 0.092:
            jaw = max(0.0, 1.0 - abs(co.z - 1.555) / 0.043)
            co.x *= 1.0 + 0.022 * jaw
        if ax < 0.050 and 1.508 < co.z < 1.550 and co.y < -0.080:
            chin = max(0.0, 1.0 - abs(co.z - 1.532) / 0.025)
            co.y -= 0.0018 * chin

    body.data.update()
    for polygon in body.data.polygons:
        polygon.use_smooth = True

    old = body.modifiers.get("Liu Bei v3 facial subdivision")
    if old:
        body.modifiers.remove(old)
    subdivision = body.modifiers.new("Liu Bei v3 facial subdivision", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1
    subdivision.show_only_control_edges = True


def tune_skin_v3():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    warm = nodes.get("Portrait warm heroic complexion")
    if warm:
        warm.inputs[0].default_value = 0.22
        warm.inputs[1].default_value = (0.235, 0.072, 0.032, 1)
        warm.inputs[2].default_value = (0.205, 0.058, 0.024, 1)
    mottled = nodes.get("Subtle mottled skin tone")
    if mottled:
        mottled.inputs[0].default_value = 0.085
    pore = nodes.get("Micro pore normal")
    if pore:
        pore.inputs["Strength"].default_value = 0.070
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Roughness"].default_value = 0.56
        shader.inputs["Subsurface Weight"].default_value = 0.042
        if "Coat Weight" in shader.inputs:
            shader.inputs["Coat Weight"].default_value = 0.022
            shader.inputs["Coat Roughness"].default_value = 0.32


def rebuild_eyes_and_features(materials):
    remove_matching(
        "LiuBeiV2_Eye_", "LiuBeiV2_Tear_Duct_", "LiuBeiV2_Upper_Lid_",
        "LiuBeiV2_Lower_Lid_", "LiuBeiV2_Upper_Crease_", "LiuBeiV2_Brow_",
        "LiuBeiV2_Upper_Lip", "LiuBeiV2_Lower_Lip", "LiuBeiV3_Eye_",
        "LiuBeiV3_Tear_", "LiuBeiV3_Lid_", "LiuBeiV3_Brow_", "LiuBeiV3_Lip_",
    )

    for side in (-1, 1):
        x = side * 0.0340
        z = 1.6735
        # Seat the globe just ahead of v2, but keep its equator behind the skin
        # so the visible white is bounded by the actual socket.
        sphere(f"LiuBeiV3_Eye_Sclera_{side:+d}", (x, -0.1242, z), (0.0154, 0.0147, 0.0117), materials["sclera"], 80, 40)
        sphere(f"LiuBeiV3_Eye_Limbal_{side:+d}", (x, -0.1387, z), (0.00705, 0.00062, 0.00605), materials["limbal"], 64, 32)
        sphere(f"LiuBeiV3_Eye_Iris_{side:+d}", (x, -0.1392, z), (0.00620, 0.00046, 0.00540), materials["iris"], 64, 32)
        sphere(f"LiuBeiV3_Eye_Pupil_{side:+d}", (x, -0.1396, z), (0.00255, 0.00028, 0.00248), materials["pupil"], 48, 24)
        sphere(f"LiuBeiV3_Eye_Catchlight_{side:+d}", (x - 0.0018, -0.1399, z + 0.0018), (0.00080, 0.00014, 0.00080), materials["catchlight"], 24, 12)
        sphere(f"LiuBeiV3_Tear_{side:+d}", (side * 0.0158, -0.1400, 1.6693), (0.0017, 0.00042, 0.00100), materials["tear"], 32, 16)

        upper = [
            (side * 0.0142, -0.1710, 1.6768),
            (side * 0.0252, -0.1730, 1.6816),
            (side * 0.0383, -0.1728, 1.6822),
            (side * 0.0518, -0.1690, 1.6762),
        ]
        lower = [
            (side * 0.0144, -0.1708, 1.6686),
            (side * 0.0262, -0.1726, 1.6654),
            (side * 0.0390, -0.1722, 1.6660),
            (side * 0.0515, -0.1688, 1.6700),
        ]
        crease = [
            (side * 0.0170, -0.1670, 1.6890),
            (side * 0.0320, -0.1682, 1.6913),
            (side * 0.0490, -0.1654, 1.6880),
        ]
        strand(f"LiuBeiV3_Lid_Upper_{side:+d}", upper, 0.00054, materials["lid"], taper=True)
        strand(f"LiuBeiV3_Lid_Lower_{side:+d}", lower, 0.00030, materials["lid"], taper=True)
        strand(f"LiuBeiV3_Lid_Crease_{side:+d}", crease, 0.00022, materials["lid"], taper=True)

    rng = random.Random(314159)
    brows = {"deep": [], "warm": []}
    for side in (-1, 1):
        for _ in range(82):
            t = rng.random()
            x = side * (0.015 + 0.061 * t)
            z = 1.703 + math.sin(t * math.pi) * 0.0055 - 0.0030 * t + rng.uniform(-0.0008, 0.0008)
            y = -0.1575 - math.sin(t * math.pi) * 0.0030
            dx = side * rng.uniform(0.0030, 0.0060)
            path = [(x, y, z), (x + dx * 0.55, y - 0.0006, z + 0.0023), (x + dx, y, z + 0.0034)]
            brows["warm" if rng.random() < 0.14 else "deep"].append((path, rng.uniform(0.52, 0.98)))
    curve_bundle_poly("LiuBeiV3_Brow_Deep", brows["deep"], materials["hair"], 0.00024)
    curve_bundle_poly("LiuBeiV3_Brow_Warm", brows["warm"], materials["hair_warm"], 0.00021)

    # Thin lip colour follows the anatomy; it does not create a second mouth.
    strand("LiuBeiV3_Lip_Upper", [(-0.037, -0.1752, 1.5810), (-0.019, -0.1770, 1.5830), (0.0, -0.1778, 1.5808), (0.019, -0.1770, 1.5830), (0.037, -0.1752, 1.5810)], 0.00040, materials["lip"], taper=True)
    strand("LiuBeiV3_Lip_Lower", [(-0.034, -0.1748, 1.5732), (-0.017, -0.1772, 1.5707), (0.0, -0.1778, 1.5704), (0.017, -0.1772, 1.5707), (0.034, -0.1748, 1.5732)], 0.00043, materials["lip"], taper=True)


def rebuild_hairline_and_beard(materials):
    remove_matching("LiuBeiV2_Beard_", "LiuBeiV3_Hairline_", "LiuBeiV3_Beard_", "LiuBeiV3_Moustache_")
    rng = random.Random(271828)

    # Fine swept fibers bridge forehead and the existing topknot.  Their roots
    # follow a soft mature hairline rather than forming a helmet rim or bangs.
    hairline = {"deep": [], "warm": [], "age": []}
    # Disabled after the first v3 proof: on this inherited UV/head shell a
    # complete generated row reads as straight bangs.  The clean swept scalp
    # remains in place until a dedicated groom replaces it.
    for _ in range(0):
        x = rng.uniform(-0.086, 0.086)
        side = -1.0 if x < 0 else 1.0
        edge = min(1.0, abs(x) / 0.086)
        root_z = 1.744 + 0.022 * edge ** 1.5 + rng.uniform(-0.0016, 0.0016)
        root_y = -0.153 + 0.018 * edge * edge + rng.uniform(-0.0012, 0.0005)
        sweep = rng.uniform(0.38, 0.64)
        path = [
            (x, root_y, root_z),
            (x * 0.93, root_y + 0.017, root_z + rng.uniform(0.015, 0.025)),
            (x * 0.72, -0.095 + 0.008 * edge, 1.795 + rng.uniform(-0.004, 0.005)),
            (x * sweep, -0.052, 1.820 + rng.uniform(-0.004, 0.006)),
        ]
        selector = rng.random()
        palette = "age" if selector < 0.018 else "warm" if selector < 0.15 else "deep"
        hairline[palette].append((path, rng.uniform(0.45, 0.90)))
    for palette, material, radius in (
        ("deep", materials["hair"], 0.00015),
        ("warm", materials["hair_warm"], 0.000135),
        ("age", materials["hair_age"], 0.00012),
    ):
        curve_bundle_poly(f"LiuBeiV3_Hairline_{palette}", hairline[palette], material, radius)

    # Spread moustache roots to eliminate the two black plug-like clumps seen
    # above v2's upper lip.
    moustache = {"deep": [], "warm": [], "age": []}
    for side in (-1, 1):
        for _ in range(34):
            root_x = side * rng.uniform(0.006, 0.036)
            root_z = 1.589 - abs(root_x) * 0.15 + rng.uniform(-0.0015, 0.0015)
            tip_x = side * rng.uniform(0.042, 0.062)
            tip_z = 1.570 - rng.uniform(0.0, 0.008)
            path = [
                (root_x, -0.1680, root_z),
                (side * (abs(root_x) + 0.014), -0.1760, root_z - 0.002),
                (side * (abs(root_x) + abs(tip_x)) * 0.52, -0.1790, (root_z + tip_z) * 0.5 + 0.001),
                (tip_x, -0.1745, tip_z),
            ]
            selector = rng.random()
            palette = "age" if selector < 0.025 else "warm" if selector < 0.15 else "deep"
            moustache[palette].append((path, rng.uniform(0.42, 0.90)))

    beard = {"deep": [], "warm": [], "age": []}
    for _ in range(260):
        root_x = rng.triangular(-0.050, 0.050, 0.0)
        root_z = rng.uniform(1.535, 1.566)
        centre = 1.0 - min(1.0, abs(root_x) / 0.050)
        length = rng.uniform(0.037, 0.073) * (0.70 + 0.45 * centre)
        tip_x = root_x * rng.uniform(0.25, 0.62) + rng.uniform(-0.003, 0.003)
        phase = rng.uniform(0.0, math.tau)
        path = []
        for index in range(5):
            t = index / 4
            path.append((
                root_x + (tip_x - root_x) * t + math.sin(phase + t * math.pi) * 0.0018 * math.sin(math.pi * t),
                -0.1755 - math.sin(math.pi * t) * rng.uniform(0.004, 0.009),
                root_z - length * t,
            ))
        selector = rng.random()
        palette = "age" if selector < 0.025 else "warm" if selector < 0.15 else "deep"
        beard[palette].append((path, rng.uniform(0.42, 0.92)))

    for prefix, groups in (("Moustache", moustache), ("Beard", beard)):
        for palette, material, radius in (
            ("deep", materials["hair"], 0.00017),
            ("warm", materials["hair_warm"], 0.00015),
            ("age", materials["hair_age"], 0.00013),
        ):
            if groups[palette]:
                curve_bundle_poly(f"LiuBeiV3_{prefix}_{palette}", groups[palette], material, radius)


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
    materials = make_materials()
    sculpt_head_v3()
    tune_skin_v3()
    rebuild_eyes_and_features(materials)
    rebuild_hairline_and_beard(materials)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.32
    camera = scene.camera
    render(scene, camera, FRONT, (900, 1300), (-0.05, -6.45, 1.15), (-0.02, -0.03, 1.13), 72)
    render(scene, camera, UPPER, (1000, 1000), (0.50, -3.70, 1.45), (0.0, -0.06, 1.33), 82)
    render(scene, camera, FACE, (1000, 1000), (0.38, -2.28, 1.63), (0.0, -0.095, 1.56), 96)
    render(scene, camera, THREE_QUARTER, (1000, 1000), (0.88, -2.42, 1.64), (0.0, -0.08, 1.54), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
