"""Restore the proven v45 MPFB head into Liu Bei while preserving his v3 body.

Liu Bei v1-v3 accidentally baked the deactivated fallback face when attempting
to remove Guan Yu's identity.  Both files share the same 19,158-vertex MPFB
topology, so v4 safely transfers the evaluated v45 head coordinates by vertex
index, then applies only restrained Liu Bei-specific proportion changes.
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
from refine_liu_bei_reference_v3 import curve_bundle_poly


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
SOURCE_HEAD_BLEND = SRC / "guan-yu-reference-fullbody-v45.blend"
INPUT_BLEND = SRC / "liu-bei-reference-fullbody-v3.blend"
OUTPUT_BLEND = SRC / "liu-bei-reference-fullbody-v4.blend"
FRONT = SRC / "liu-bei-reference-fullbody-v4-front.png"
UPPER = SRC / "liu-bei-reference-fullbody-v4-upper.png"
FACE = SRC / "liu-bei-reference-fullbody-v4-face.png"
THREE_QUARTER = SRC / "liu-bei-reference-fullbody-v4-three-quarter.png"


def capture_v45_head_coordinates():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE_HEAD_BLEND))
    source = bpy.data.objects["Guan_Yu_Basemesh"]
    mixed = source.shape_key_add(name="Temporary v45 coordinate capture", from_mix=True)
    coordinates = [tuple(point.co) for point in mixed.data]
    source.shape_key_remove(mixed)
    return coordinates


def restore_human_head(source_coordinates):
    body = bpy.data.objects["Liu_Bei_Basemesh"]
    if len(source_coordinates) != len(body.data.vertices):
        raise RuntimeError(f"MPFB topology mismatch: {len(source_coordinates)} != {len(body.data.vertices)}")

    extra_subdivision = body.modifiers.get("Liu Bei v3 facial subdivision")
    if extra_subdivision:
        body.modifiers.remove(extra_subdivision)

    key = body.shape_key_add(name="Liu Bei v4 restored MPFB human head", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for index, point in enumerate(key.data):
        source = source_coordinates[index]
        sx, sy, sz = source
        if abs(sx) < 0.150 and sy < 0.145 and 1.500 < sz < 1.835:
            point.co = source

    # Differentiate Liu Bei with small anatomical changes only.  Avoid the
    # large coordinate pushes that flattened the earlier face.
    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if ax > 0.140 or co.y > 0.090 or not 1.505 < co.z < 1.790:
            continue

        # Courtly oval silhouette: retain cheek support but soften Guan Yu's
        # square lower jaw and pronounced outer temple.
        if 1.515 < co.z < 1.610 and 0.034 < ax < 0.105:
            jaw = max(0.0, 1.0 - abs(co.z - 1.565) / 0.050)
            co.x *= 1.0 - 0.032 * jaw
        if 1.625 < co.z < 1.680 and 0.045 < ax < 0.105:
            cheek = max(0.0, 1.0 - abs(co.z - 1.650) / 0.030)
            co.x *= 1.0 - 0.010 * cheek

        # Relax the heavy Guan Yu supraorbital shelf without changing the
        # v45 socket topology responsible for the good eye integration.
        if 0.012 < ax < 0.080 and 1.692 < co.z < 1.720 and co.y < -0.100:
            brow = max(0.0, 1.0 - abs(co.z - 1.705) / 0.014)
            co.y += 0.0018 * brow

        # Neutral, humane mouth corners and a slightly rounder chin.
        if 0.031 < ax < 0.052 and 1.568 < co.z < 1.590 and co.y < -0.130:
            co.z += 0.0013 * max(0.0, 1.0 - abs(co.z - 1.579) / 0.012)
        if ax < 0.045 and 1.510 < co.z < 1.550 and co.y < -0.080:
            co.y -= 0.0009 * max(0.0, 1.0 - abs(co.z - 1.531) / 0.022)

    body.data.update()
    for polygon in body.data.polygons:
        polygon.use_smooth = True
    return body


def restore_v45_skin(body):
    current = body.material_slots[0].material
    if current:
        current.name = "Liu Bei v3 skin backup"
    with bpy.data.libraries.load(str(SOURCE_HEAD_BLEND), link=False) as (source, target):
        if "Guan_Yu_Basemesh.body" not in source.materials:
            raise RuntimeError("v45 MPFB skin material is missing")
        target.materials = ["Guan_Yu_Basemesh.body"]
    skin = target.materials[0]
    skin.name = "Liu Bei v4 restored middle-aged Asian skin"
    body.material_slots[0].material = skin

    if skin.use_nodes:
        nodes = skin.node_tree.nodes
        warm = nodes.get("Portrait warm heroic complexion")
        if warm:
            warm.inputs[0].default_value = 0.28
        mature = nodes.get("V34 restrained mature skin color")
        if mature:
            mature.inputs["Saturation"].default_value = 0.82
            mature.inputs["Value"].default_value = 1.00
        mottled = nodes.get("Subtle mottled skin tone")
        if mottled:
            mottled.inputs[0].default_value = 0.10
        shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.52
            shader.inputs["Subsurface Weight"].default_value = 0.052
            if "Coat Weight" in shader.inputs:
                shader.inputs["Coat Weight"].default_value = 0.028
                shader.inputs["Coat Roughness"].default_value = 0.28


def make_face_materials():
    lid = mat("Liu Bei v4 mature warm eyelid", (0.170, 0.043, 0.024, 1), 0.53, noise=19.0, bump=0.005)
    lower_lid = mat("Liu Bei v4 lower eyelid shadow", (0.125, 0.028, 0.017, 1), 0.55, noise=22.0, bump=0.004)
    crease = mat("Liu Bei v4 restrained eye crease", (0.032, 0.0055, 0.0030, 1), 0.63)
    wetline = mat("Liu Bei v4 wet tear meniscus", (0.205, 0.044, 0.033, 1), 0.16)
    sclera = mat("Liu Bei v4 warm living sclera", (0.34, 0.285, 0.235, 1), 0.36, noise=8.0, bump=0.007)
    limbal = mat("Liu Bei v4 dark limbal ring", (0.0035, 0.0009, 0.0003, 1), 0.28)
    iris = mat("Liu Bei v4 layered calm brown iris", (0.037, 0.009, 0.0025, 1), 0.29, noise=39.0, bump=0.015)
    pupil = mat("Liu Bei v4 natural pupil", (0.00015, 0.00008, 0.00004, 1), 0.19)
    tear = mat("Liu Bei v4 tear duct", (0.175, 0.025, 0.020, 1), 0.40, noise=20.0, bump=0.009)
    catchlight = mat("Liu Bei v4 restrained catchlight", (0.70, 0.60, 0.47, 1), 0.09)
    lip = mat("Liu Bei v4 natural lip edge", (0.120, 0.024, 0.018, 1), 0.56, noise=22.0, bump=0.004)
    hair = bpy.data.materials.get("Liu Bei v2 deep black brown hair")
    hair_warm = bpy.data.materials.get("Liu Bei v2 warm hair variation")
    return {
        "lid": lid, "lower_lid": lower_lid, "crease": crease, "wetline": wetline,
        "sclera": sclera, "limbal": limbal, "iris": iris, "pupil": pupil,
        "tear": tear, "catchlight": catchlight, "lip": lip,
        "hair": hair, "hair_warm": hair_warm,
    }


def rebuild_v45_aligned_features(materials):
    remove_matching(
        "LiuBeiV2_Eye_", "LiuBeiV2_Tear_", "LiuBeiV2_Upper_", "LiuBeiV2_Lower_",
        "LiuBeiV2_Brow_", "LiuBeiV3_Eye_", "LiuBeiV3_Tear_", "LiuBeiV3_Lid_",
        "LiuBeiV3_Brow_", "LiuBeiV3_Lip_", "LiuBeiV4_Eye_", "LiuBeiV4_Lid_",
        "LiuBeiV4_Brow_", "LiuBeiV4_Lip_",
    )

    gaze_offset = -0.00035
    eye_z = 1.6740
    for side in (-1, 1):
        eye_x = side * 0.0327
        iris_x = eye_x + gaze_offset
        sphere(f"LiuBeiV4_Eye_Sclera_{side:+d}", (eye_x, -0.1245, eye_z), (0.0148, 0.0145, 0.0125), materials["sclera"], 72, 36)
        sphere(f"LiuBeiV4_Eye_Limbal_{side:+d}", (iris_x, -0.13935, eye_z), (0.00605, 0.00082, 0.00510), materials["limbal"], 56, 28)
        sphere(f"LiuBeiV4_Eye_Iris_{side:+d}", (iris_x, -0.13995, eye_z), (0.00530, 0.00070, 0.00450), materials["iris"], 56, 28)
        sphere(f"LiuBeiV4_Eye_Pupil_{side:+d}", (iris_x, -0.14045, eye_z), (0.00210, 0.00056, 0.00210), materials["pupil"], 44, 22)
        sphere(f"LiuBeiV4_Eye_Tear_{side:+d}", (side * 0.0160, -0.1402, 1.6700), (0.0020, 0.00072, 0.00128), materials["tear"], 32, 16)
        sphere(f"LiuBeiV4_Eye_Catchlight_{side:+d}", (iris_x - side * 0.00125, -0.14116, 1.6767), (0.00043, 0.00014, 0.00036), materials["catchlight"], 24, 12)

        upper = [
            (side * 0.0146, -0.1729, 1.6791), (side * 0.0255, -0.1752, 1.6831),
            (side * 0.0364, -0.1750, 1.6834), (side * 0.0474, -0.1710, 1.6797),
        ]
        lower = [
            (side * 0.0151, -0.1730, 1.6681), (side * 0.0259, -0.1750, 1.6654),
            (side * 0.0368, -0.1745, 1.6658), (side * 0.0473, -0.1709, 1.6687),
        ]
        crease = [
            (side * 0.0160, -0.1715, 1.6870), (side * 0.0270, -0.1731, 1.6907),
            (side * 0.0385, -0.1726, 1.6900), (side * 0.0493, -0.1689, 1.6860),
        ]
        wetline = [
            (side * 0.0154, -0.1739, 1.6692), (side * 0.0260, -0.1759, 1.6670),
            (side * 0.0367, -0.1752, 1.6673), (side * 0.0470, -0.1716, 1.6695),
        ]
        strand(f"LiuBeiV4_Lid_Upper_{side:+d}", upper, 0.00094, materials["lid"], taper=False)
        strand(f"LiuBeiV4_Lid_Lower_{side:+d}", lower, 0.00062, materials["lower_lid"], taper=False)
        strand(f"LiuBeiV4_Lid_Crease_{side:+d}", crease, 0.00018, materials["crease"], taper=True)
        strand(f"LiuBeiV4_Lid_Wetline_{side:+d}", wetline, 0.00016, materials["wetline"], taper=True)

    rng = random.Random(40404)
    brows = {"deep": [], "warm": []}
    for side in (-1, 1):
        for _ in range(105):
            t = rng.random()
            x = side * (0.012 + 0.064 * t)
            z = 1.704 + math.sin(t * math.pi) * 0.0050 - 0.0035 * t + rng.uniform(-0.0009, 0.0009)
            y = -0.1685 - math.sin(t * math.pi) * 0.0040
            dx = side * rng.uniform(0.0030, 0.0060)
            path = [(x, y, z), (x + dx * 0.55, y - 0.0008, z + 0.0021), (x + dx, y, z + 0.0032)]
            brows["warm" if rng.random() < 0.14 else "deep"].append((path, rng.uniform(0.48, 0.95)))
    curve_bundle_poly("LiuBeiV4_Brow_Deep", brows["deep"], materials["hair"], 0.00023)
    curve_bundle_poly("LiuBeiV4_Brow_Warm", brows["warm"], materials["hair_warm"], 0.00020)

    strand("LiuBeiV4_Lip_Upper", [(-0.037, -0.1735, 1.5810), (-0.019, -0.1755, 1.5830), (0.0, -0.1760, 1.5808), (0.019, -0.1755, 1.5830), (0.037, -0.1735, 1.5810)], 0.00036, materials["lip"], taper=True)
    strand("LiuBeiV4_Lip_Lower", [(-0.034, -0.1732, 1.5730), (-0.017, -0.1756, 1.5708), (0.0, -0.1762, 1.5705), (0.017, -0.1756, 1.5708), (0.034, -0.1732, 1.5730)], 0.00038, materials["lip"], taper=True)


def rebuild_v4_moustache(materials):
    remove_matching("LiuBeiV2_Moustache_", "LiuBeiV3_Moustache_", "LiuBeiV4_Moustache_")
    rng = random.Random(40428)
    groups = {"deep": [], "warm": []}
    for side in (-1, 1):
        for _ in range(30):
            root_x = side * rng.uniform(0.006, 0.032)
            root_z = 1.606 - abs(root_x) * 0.12 + rng.uniform(-0.0015, 0.0015)
            tip_x = side * rng.uniform(0.047, 0.068)
            tip_z = 1.580 - rng.uniform(0.000, 0.010)
            path = [
                (root_x, -0.1600, root_z),
                (side * (abs(root_x) + 0.014), -0.1700, root_z - 0.004),
                (side * (abs(root_x) + abs(tip_x)) * 0.52, -0.1740, (root_z + tip_z) * 0.5),
                (tip_x, -0.1680, tip_z),
            ]
            groups["warm" if rng.random() < 0.14 else "deep"].append((path, rng.uniform(0.42, 0.88)))
    curve_bundle_poly("LiuBeiV4_Moustache_Deep", groups["deep"], materials["hair"], 0.00015)
    curve_bundle_poly("LiuBeiV4_Moustache_Warm", groups["warm"], materials["hair_warm"], 0.00013)


def render(scene, camera, path, resolution, location, target, lens):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    source_coordinates = capture_v45_head_coordinates()
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = restore_human_head(source_coordinates)
    restore_v45_skin(body)
    materials = make_face_materials()
    rebuild_v45_aligned_features(materials)
    rebuild_v4_moustache(materials)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.34
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
