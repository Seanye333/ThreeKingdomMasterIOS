"""Create a first realistic Zhang Fei full-body prototype from the stable Guan Yu rigged base.

The inherited body/pose is used only as technical scaffolding. This pass replaces
the face, eyes, hair, beard, palette, head treatment and polearm silhouette so
the result reads as Zhang Fei instead of a recolored Guan Yu.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, cylinder_between, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v45.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v1.blend"
UPPER = SRC / "zhang-fei-reference-fullbody-v1-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v1-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v1-three-quarter.png"


def remove_matching(*prefixes: str, contains: tuple[str, ...] = ()) -> None:
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes) or any(token in obj.name for token in contains):
            bpy.data.objects.remove(obj, do_unlink=True)


def curve_bundle(name, paths, material, radius):
    curve_data = bpy.data.curves.new(name, "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 2
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 2
    for path, width in paths:
        spline = curve_data.splines.new("NURBS")
        spline.points.add(len(path) - 1)
        for index, coordinates in enumerate(path):
            point = spline.points[index]
            point.co = (*coordinates, 1.0)
            t = index / max(1, len(path) - 1)
            point.radius = max(0.08, width * (1.0 - 0.76 * t))
        spline.order_u = min(3, len(path))
        spline.use_endpoint_u = True
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def make_materials():
    black_cloth = mat("Zhang Fei charcoal battle cloth", (0.008, 0.009, 0.010, 1), 0.72, noise=8.0, bump=0.055)
    black_iron = mat("Zhang Fei blackened heavy iron", (0.012, 0.013, 0.014, 1), 0.34, metallic=0.82, noise=18.0, bump=0.080)
    oxblood = mat("Zhang Fei dried oxblood leather", (0.060, 0.007, 0.004, 1), 0.58, noise=11.0, bump=0.035)
    crimson = mat("Zhang Fei dark crimson accent", (0.18, 0.008, 0.004, 1), 0.45, noise=9.0, bump=0.020)
    aged_gold = mat("Zhang Fei aged beast gold", (0.30, 0.12, 0.018, 1), 0.31, metallic=0.78, noise=14.0, bump=0.035)
    dark_steel = mat("Zhang Fei serpent spear steel", (0.075, 0.082, 0.090, 1), 0.23, metallic=0.91, noise=20.0, bump=0.025)
    hair_deep = mat("Zhang Fei deep coarse hair", (0.00022, 0.00016, 0.00012, 1), 0.66, noise=26.0, bump=0.018)
    hair_warm = mat("Zhang Fei warm coarse hair", (0.0028, 0.0008, 0.0003, 1), 0.64, noise=31.0, bump=0.016)
    hair_age = mat("Zhang Fei charcoal hair glints", (0.014, 0.011, 0.009, 1), 0.68, noise=22.0, bump=0.012)
    eye_white = mat("Zhang Fei warm eye white", (0.285, 0.225, 0.180, 1), 0.35, noise=8.0, bump=0.008)
    iris = mat("Zhang Fei dark amber iris", (0.042, 0.010, 0.0018, 1), 0.27, noise=32.0, bump=0.014)
    pupil = mat("Zhang Fei black pupil", (0.00012, 0.00008, 0.00005, 1), 0.16)
    tear = mat("Zhang Fei living tear duct", (0.18, 0.022, 0.018, 1), 0.36)
    lid = mat("Zhang Fei weathered eyelid", (0.165, 0.040, 0.020, 1), 0.48, noise=19.0, bump=0.007)
    mouth = mat("Zhang Fei mouth shadow", (0.012, 0.0012, 0.0008, 1), 0.39)
    tooth = mat("Zhang Fei aged teeth", (0.45, 0.34, 0.21, 1), 0.44, noise=11.0, bump=0.010)
    return {
        "black_cloth": black_cloth,
        "black_iron": black_iron,
        "oxblood": oxblood,
        "crimson": crimson,
        "aged_gold": aged_gold,
        "dark_steel": dark_steel,
        "hair_deep": hair_deep,
        "hair_warm": hair_warm,
        "hair_age": hair_age,
        "eye_white": eye_white,
        "iris": iris,
        "pupil": pupil,
        "tear": tear,
        "lid": lid,
        "mouth": mouth,
        "tooth": tooth,
    }


def sculpt_zhang_fei_face():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    if body.data.shape_keys:
        old = body.data.shape_keys.key_blocks.get("Zhang Fei v1 fierce broad face")
        if old:
            body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v1 fierce broad face", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > -0.070 or ax > 0.140 or not 1.515 < co.z < 1.755:
            continue

        # Broad skull, explosive cheek mass and the square lower face associated
        # with Zhang Fei rather than Guan Yu's longer commander silhouette.
        if 1.650 < co.z < 1.725 and ax > 0.050:
            co.x *= 1.045
        if 0.045 < ax < 0.105 and 1.615 < co.z < 1.665:
            weight = max(0.0, 1.0 - abs(co.z - 1.642) / 0.026)
            co.x *= 1.095
            co.y -= 0.0028 * weight
        if 0.045 < ax < 0.110 and 1.525 < co.z < 1.605:
            jaw = max(0.0, 1.0 - abs(co.z - 1.565) / 0.041)
            co.x *= 1.135 + 0.040 * jaw
            co.y -= 0.0018 * jaw
        if ax < 0.058 and 1.520 < co.z < 1.560:
            co.z -= 0.0040 * (1.0 - ax / 0.058)

        # Thick forward brow and a deeper glabellar frown.
        if 0.012 < ax < 0.092 and 1.690 < co.z < 1.720:
            brow = max(0.0, 1.0 - abs(co.z - 1.704) / 0.015)
            co.y -= 0.0040 * brow
        if ax < 0.024 and 1.675 < co.z < 1.714:
            co.y += 0.0020 * (1.0 - ax / 0.024)

        # Open the narrow inherited eye sockets into Zhang Fei's iconic round,
        # furious gaze while retaining a slight inward-downward upper lid.
        for eye_center in (-0.034, 0.034):
            dx = abs(co.x - eye_center)
            if dx >= 0.031:
                continue
            horizontal = 1.0 - dx / 0.031
            if 1.674 < co.z < 1.694:
                co.z += 0.0010 * horizontal
                co.y -= 0.0007 * horizontal
            if 1.652 < co.z < 1.672:
                co.z -= 0.0007 * horizontal
                co.y -= 0.0005 * horizontal

        # Shorter, wider nose with flared wings.
        if ax < 0.025 and 1.600 < co.z < 1.670:
            co.y -= 0.0020 * (1.0 - ax / 0.025)
        if 0.020 < ax < 0.050 and 1.592 < co.z < 1.622:
            co.x *= 1.075
            co.y -= 0.0015

        # Compress the lips into a controlled snarl. Roaring will be handled by
        # a later expression/rig pass; a modeled tooth row here reads artificial.
        if ax < 0.040 and co.y < -0.145:
            if 1.581 < co.z < 1.593:
                co.z += 0.0004
                co.y -= 0.0005
            elif 1.565 < co.z <= 1.581:
                co.z -= 0.0008
                co.y -= 0.0006
        if 0.028 < ax < 0.055 and 1.568 < co.z < 1.591:
            co.x *= 1.035

    body.data.update()


def tune_skin_material():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    warm = nodes.get("Portrait warm heroic complexion")
    bronze = nodes.get("V34 weathered bronze complexion")
    mature = nodes.get("V34 restrained mature skin color")
    if warm:
        warm.inputs[2].default_value = (0.165, 0.030, 0.010, 1)
    if bronze:
        bronze.inputs[2].default_value = (0.195, 0.042, 0.014, 1)
    if mature:
        mature.inputs["Saturation"].default_value = 0.86
        mature.inputs["Value"].default_value = 0.78
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Roughness"].default_value = 0.57
        shader.inputs["Subsurface Weight"].default_value = 0.030


def rebuild_eyes_and_expression(materials):
    remove_matching(
        "V44_Eye_",
        "V45_Eye_",
        "V34_Upper_Lid_",
        "V39_Face_Waterline_",
    )
    for side in (-1, 1):
        eye_x = side * 0.0340
        eye_y = -0.1240
        eye_z = 1.6742
        sphere(f"ZhangFei_Eye_Sclera_{side:+d}", (eye_x, eye_y, eye_z), (0.0154, 0.0147, 0.0127), materials["eye_white"], 64, 32)
        iris_x = eye_x - 0.0003
        sphere(f"ZhangFei_Eye_Iris_{side:+d}", (iris_x, -0.1392, eye_z), (0.0074, 0.00076, 0.0064), materials["iris"], 48, 24)
        sphere(f"ZhangFei_Eye_Pupil_{side:+d}", (iris_x, -0.1398, eye_z), (0.00310, 0.00055, 0.00300), materials["pupil"], 40, 20)
        sphere(f"ZhangFei_Tear_Duct_{side:+d}", (side * 0.0163, -0.1401, 1.6695), (0.0022, 0.0007, 0.00135), materials["tear"], 28, 14)

        # Warm modeled lid rims stop the forceful eyes from becoming cartoon globes.
        upper = [
            (side * 0.0148, -0.1728, 1.6790),
            (side * 0.0260, -0.1750, 1.6821),
            (side * 0.0380, -0.1745, 1.6816),
            (side * 0.0500, -0.1703, 1.6778),
        ]
        lower = [
            (side * 0.0152, -0.1728, 1.6680),
            (side * 0.0265, -0.1748, 1.6656),
            (side * 0.0380, -0.1741, 1.6662),
            (side * 0.0498, -0.1700, 1.6690),
        ]
        strand(f"ZhangFei_Upper_Lid_{side:+d}", upper, 0.0010, materials["lid"], taper=False)
        strand(f"ZhangFei_Lower_Lid_{side:+d}", lower, 0.00072, materials["lid"], taper=False)

def build_brows(materials):
    remove_matching("Portrait_Brow_", "V32_Brow_Density_", "V39_Face_Brow_Anchor_")
    rng = random.Random(1187)
    fibers = {"deep": [], "warm": []}
    for side in (-1, 1):
        # Three heavy silhouette strokes establish the famous dense, angry brow.
        for layer in range(3):
            z_offset = layer * 0.00115
            points = [
                (side * 0.013, -0.1750, 1.687 + z_offset),
                (side * 0.030, -0.1770, 1.695 + z_offset),
                (side * 0.051, -0.1758, 1.701 + z_offset),
                (side * 0.075, -0.1688, 1.703 + z_offset),
            ]
            strand(f"ZhangFei_Heavy_Brow_{side:+d}_{layer}", points, 0.00105 + layer * 0.00012, materials["hair_deep"], taper=True)

        for index in range(80):
            t = rng.random()
            x = side * (0.014 + 0.063 * t)
            z = 1.687 + t * 0.016 + math.sin(t * math.pi) * 0.004 + rng.uniform(-0.0015, 0.0015)
            y = -0.174 - math.sin(t * math.pi) * 0.003
            direction = side * rng.uniform(0.0035, 0.0080)
            path = [
                (x, y, z),
                (x + direction * 0.50, y - 0.0010, z + rng.uniform(0.0020, 0.0040)),
                (x + direction, y, z + rng.uniform(0.0030, 0.0060)),
            ]
            fibers["warm" if rng.random() < 0.18 else "deep"].append((path, rng.uniform(0.55, 1.15)))
    curve_bundle("ZhangFei_Brow_Fibers_Deep", fibers["deep"], materials["hair_deep"], 0.00038)
    curve_bundle("ZhangFei_Brow_Fibers_Warm", fibers["warm"], materials["hair_warm"], 0.00034)


def beard_path(root, tip, curl, phase, points=7):
    path = []
    for index in range(points):
        t = index / (points - 1)
        ease = t * t * (3.0 - 2.0 * t)
        x = root[0] + (tip[0] - root[0]) * ease
        y = root[1] - 0.030 * math.sin(math.pi * t) + (tip[1] - root[1]) * t
        z = root[2] + (tip[2] - root[2]) * t
        x += math.sin(phase + t * math.pi * 2.2) * curl * math.sin(math.pi * t)
        z += math.cos(phase * 0.7 + t * math.pi * 1.8) * curl * 0.45 * math.sin(math.pi * t)
        path.append((x, y, z))
    return path


def build_bushy_beard_and_moustache(materials):
    remove_matching("V34_Groom_", "V40_Beard_Root_")
    rng = random.Random(1381)
    beard = {"deep": [], "warm": [], "age": []}

    # Chin mass: much shorter and wider than Guan Yu's long divided beard.
    for index in range(690):
        root_x = rng.triangular(-0.072, 0.072, 0.0)
        root_z = rng.uniform(1.555, 1.592)
        root_y = -0.166 + abs(root_x) * 0.16 + rng.uniform(-0.003, 0.003)
        side = min(1.0, abs(root_x) / 0.072)
        locks = (-0.084, -0.056, -0.028, 0.0, 0.028, 0.056, 0.084)
        lock = min(locks, key=lambda value: abs(value - root_x))
        tip_x = lock + rng.uniform(-0.009, 0.009)
        tip_z = rng.uniform(1.365, 1.485) + side * 0.045
        tip_y = -0.162 + rng.uniform(-0.010, 0.010)
        path = beard_path((root_x, root_y, root_z), (tip_x, tip_y, tip_z), rng.uniform(0.005, 0.016), rng.uniform(0.0, math.tau))
        selector = rng.random()
        palette = "age" if selector < 0.035 else "warm" if selector < 0.23 else "deep"
        beard[palette].append((path, rng.uniform(0.65, 1.45)))

    # Cheek and jaw fibers flare outward, creating the tiger-beard silhouette.
    for side in (-1, 1):
        for index in range(315):
            root_x = side * rng.uniform(0.050, 0.102)
            root_z = rng.uniform(1.555, 1.650)
            root_y = -0.158 + abs(root_x) * 0.10 + rng.uniform(-0.003, 0.003)
            tip_x = side * rng.uniform(0.074, 0.135)
            tip_z = root_z - rng.uniform(0.065, 0.175)
            tip_y = -0.158 + rng.uniform(-0.008, 0.012)
            path = beard_path((root_x, root_y, root_z), (tip_x, tip_y, tip_z), rng.uniform(0.006, 0.019), rng.uniform(0.0, math.tau), 6)
            selector = rng.random()
            palette = "age" if selector < 0.035 else "warm" if selector < 0.22 else "deep"
            beard[palette].append((path, rng.uniform(0.62, 1.38)))

    for palette, material, radius in (
        ("deep", materials["hair_deep"], 0.00045),
        ("warm", materials["hair_warm"], 0.00041),
        ("age", materials["hair_age"], 0.00037),
    ):
        curve_bundle(f"ZhangFei_Bushy_Beard_{palette}", beard[palette], material, radius)

    moustache = {"deep": [], "warm": []}
    for side in (-1, 1):
        for index in range(86):
            root_x = side * rng.uniform(0.002, 0.020)
            root_z = rng.uniform(1.592, 1.607)
            end_x = side * rng.uniform(0.077, 0.112)
            end_z = rng.uniform(1.585, 1.622)
            phase = rng.uniform(0.0, math.tau)
            path = []
            for p in range(7):
                t = p / 6
                ease = t * t * (3.0 - 2.0 * t)
                x = root_x + (end_x - root_x) * ease
                y = -0.169 - 0.016 * math.sin(math.pi * t)
                z = root_z + (end_z - root_z) * t
                z += math.sin(phase + t * math.pi * 1.6) * 0.003 + 0.010 * t * t
                path.append((x, y, z))
            moustache["warm" if rng.random() < 0.19 else "deep"].append((path, rng.uniform(0.58, 1.28)))
    curve_bundle("ZhangFei_Moustache_Deep", moustache["deep"], materials["hair_deep"], 0.00032)
    curve_bundle("ZhangFei_Moustache_Warm", moustache["warm"], materials["hair_warm"], 0.00029)


def build_wild_hair_and_topknot(materials):
    # Keep the fitted cap as a hidden structural scalp, but turn it into coarse
    # black hair. Remove Guan Yu's green tails, seams and cloth folds.
    cap = bpy.data.objects.get("Portrait_Fitted_Headcloth")
    if cap:
        assign(cap, materials["hair_deep"])
        cap.name = "ZhangFei_Coarse_Hair_Cap"
    remove_matching(
        "Headcloth_Long_Tail_",
        "Headcloth_Tail_Gold_Edge_",
        "Headcloth_Cloud_Filigree_",
        "V32_Headcloth_",
        "V34_Headcloth_",
        "V40_Headcloth_",
    )

    diadem = bpy.data.objects.get("Curved_Cloth_Diadem")
    if diadem:
        assign(diadem, materials["oxblood"])
        diadem.name = "ZhangFei_Black_Oxblood_Headband"
    crest = bpy.data.objects.get("Headcloth_Imperial_Cloud_Crest")
    if crest:
        assign(crest, materials["aged_gold"])
        crest.name = "ZhangFei_Gold_Forehead_Crest"
    inlay = bpy.data.objects.get("Headcloth_Crest_Jade_Inlay")
    if inlay:
        assign(inlay, materials["crimson"])
    for obj in bpy.data.objects:
        if obj.name.startswith("Headcloth_Gold_Stud_"):
            assign(obj, materials["aged_gold"])

    rng = random.Random(1419)
    hair = {"deep": [], "warm": [], "age": []}
    for index in range(760):
        angle = rng.uniform(0.0, math.tau)
        root_x = math.cos(angle) * rng.uniform(0.086, 0.104)
        root_y = -0.042 + math.sin(angle) * rng.uniform(0.090, 0.115)
        root_z = rng.uniform(1.708, 1.790)
        # Keep the headband and central forehead visible.
        if root_y < -0.115 and abs(root_x) < 0.064:
            root_x = math.copysign(rng.uniform(0.068, 0.098), root_x or 1.0)
        radial_x = root_x * rng.uniform(1.06, 1.30)
        radial_y = -0.040 + (root_y + 0.040) * rng.uniform(1.05, 1.25)
        tip_z = root_z + rng.uniform(-0.080, 0.045)
        phase = rng.uniform(0.0, math.tau)
        path = []
        for p in range(6):
            t = p / 5
            curl = math.sin(phase + t * math.pi * 3.4) * 0.009 * math.sin(math.pi * t)
            path.append(
                (
                    root_x + (radial_x - root_x) * t + curl,
                    root_y + (radial_y - root_y) * t + math.cos(phase + t * math.pi * 3.0) * 0.008 * math.sin(math.pi * t),
                    root_z + (tip_z - root_z) * t + math.sin(phase * 0.6 + t * math.pi * 2.8) * 0.009,
                )
            )
        selector = rng.random()
        palette = "age" if selector < 0.025 else "warm" if selector < 0.20 else "deep"
        hair[palette].append((path, rng.uniform(0.55, 1.22)))

    # Dense short fibers break up the smooth technical scalp cap. They remain
    # close to the skull, forming a believable coarse mass under the flyaways.
    scalp_fibers = []
    for index in range(1450):
        azimuth = rng.uniform(0.0, math.tau)
        polar = rng.uniform(0.18, 2.02)
        normal = Vector(
            (
                math.sin(polar) * math.cos(azimuth),
                math.sin(polar) * math.sin(azimuth),
                math.cos(polar),
            )
        )
        root = Vector((normal.x * 0.100, -0.043 + normal.y * 0.112, 1.742 + normal.z * 0.067))
        if root.y < -0.120 and root.z < 1.740 and abs(root.x) < 0.066:
            continue
        length = rng.uniform(0.015, 0.034)
        tangent = Vector((-normal.y, normal.x, rng.uniform(-0.25, 0.25))).normalized()
        middle = root + normal * (length * 0.52) + tangent * rng.uniform(-0.005, 0.005)
        tip = root + normal * length + tangent * rng.uniform(-0.008, 0.008)
        scalp_fibers.append(([tuple(root), tuple(middle), tuple(tip)], rng.uniform(0.65, 1.15)))
    curve_bundle("ZhangFei_Dense_Scalp_Fibers", scalp_fibers, materials["hair_deep"], 0.00033)

    core = sphere("ZhangFei_Topknot_Core", (0.0, -0.035, 1.838), (0.046, 0.041, 0.030), materials["hair_deep"], 48, 24)
    for index, obj in enumerate((core,)):
        texture = bpy.data.textures.new(f"ZhangFei knot roughness {index}", type="CLOUDS")
        texture.noise_scale = 0.012
        modifier = obj.modifiers.new("Irregular packed hair surface", "DISPLACE")
        modifier.texture = texture
        modifier.strength = 0.0055
        modifier.texture_coords = "GLOBAL"

    knot_fibers = []
    for index in range(320):
        azimuth = rng.uniform(0.0, math.tau)
        elevation = rng.uniform(-0.8, 0.8)
        normal = Vector((math.cos(elevation) * math.cos(azimuth), math.cos(elevation) * math.sin(azimuth), math.sin(elevation)))
        root = Vector((normal.x * 0.045, -0.035 + normal.y * 0.040, 1.838 + normal.z * 0.029))
        tangent = Vector((-normal.y, normal.x, rng.uniform(-0.2, 0.2))).normalized()
        middle = root + normal * 0.010 + tangent * rng.uniform(-0.006, 0.006)
        tip = root + normal * 0.018 + tangent * rng.uniform(-0.010, 0.010)
        knot_fibers.append(([tuple(root), tuple(middle), tuple(tip)], rng.uniform(0.7, 1.2)))
    curve_bundle("ZhangFei_Topknot_Fibers", knot_fibers, materials["hair_deep"], 0.00034)
    for palette, material, radius in (
        ("deep", materials["hair_deep"], 0.00043),
        ("warm", materials["hair_warm"], 0.00039),
        ("age", materials["hair_age"], 0.00035),
    ):
        curve_bundle(f"ZhangFei_Wild_Hair_{palette}", hair[palette], material, radius)


def recolor_costume(materials):
    cloth_objects = (
        "Fullbody_Layered_Green_Battle_Robe",
        "Fullbody_Robe_Dark_Inner_Gusset",
        "Fullbody_Robe_Front_Left",
        "Fullbody_Robe_Front_Right",
        "Portrait_Deep_Green_Robe",
        "V35_Sleeve_Left",
        "V35_Sleeve_Right",
        "V36_Flowing_Robe_Main",
        "V36_Flowing_Robe_Shadow_Layer",
        "V38_Raised_Sleeve_Fitted_Core",
        "V38_Raised_Sleeve_Deep_Fold",
    )
    for name in cloth_objects:
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, materials["black_cloth"])
    for obj in bpy.data.objects:
        if obj.name.startswith(("V36_Flowing_Robe_Fold_", "V29_Robe_Weighted_Fold_", "V30_Robe_Weighted_Fold_")):
            assign(obj, materials["oxblood"])
        if obj.name.startswith("V37_Cross_Sash_Jade_Stud_"):
            assign(obj, materials["crimson"])
        if hasattr(obj.data, "materials") and any(
            any(token in material.name.lower() for token in ("green", "emerald", "jade"))
            for material in obj.data.materials
            if material
        ):
            if any(token in obj.name for token in ("Eye", "Jade", "Gem", "Buckle")):
                assign(obj, materials["crimson"])
            else:
                assign(obj, materials["black_cloth"])

    armor_names = (
        "Portrait_Dragon_Armor_Harness",
        "Dragon_Pauldron_Base_-1",
        "V37_Cross_Sash_Dark_Armor",
    )
    for name in armor_names:
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, materials["black_iron"])

    pole = bpy.data.objects.get("Fullbody_Green_Dragon_Pole")
    if pole:
        assign(pole, materials["dark_steel"])
        pole.name = "ZhangFei_Serpent_Spear_Pole"


def make_serpent_blade(materials):
    remove_matching(
        "V29_Green_Dragon_Crescent_Blade",
        "V29_Crescent_",
        "V29_Blade_",
        "Fullbody_Blade_Dragon_Collar",
        "Fullbody_Blade_Collar_Jade",
        "Fullbody_Blade_Red_Tassel_",
    )
    path = [
        (-0.458, 1.975, 0.014),
        (-0.478, 2.020, 0.030),
        (-0.447, 2.072, 0.039),
        (-0.488, 2.128, 0.038),
        (-0.452, 2.184, 0.032),
        (-0.477, 2.238, 0.022),
        (-0.462, 2.286, 0.002),
    ]
    depth = 0.008
    verts = []
    for y in (-0.200 - depth, -0.200 + depth):
        for x, z, width in path:
            verts.extend(((x - width, y, z), (x + width, y, z)))
    count = len(path)
    faces = []
    for layer in (0, 1):
        base = layer * count * 2
        for index in range(count - 1):
            a = base + index * 2
            faces.append((a, a + 1, a + 3, a + 2) if layer == 0 else (a + 2, a + 3, a + 1, a))
    for index in range(count - 1):
        front = index * 2
        back = count * 2 + index * 2
        faces.append((front, front + 2, back + 2, back))
        faces.append((front + 1, back + 1, back + 3, front + 3))
    faces.extend(((0, count * 2, count * 2 + 1, 1), (count * 2 - 2, count * 2 - 1, count * 4 - 1, count * 4 - 2)))
    mesh = bpy.data.meshes.new("ZhangFei_Serpent_Blade_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    blade = bpy.data.objects.new("ZhangFei_EightSpan_Serpent_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    assign(blade, materials["dark_steel"])
    bevel(blade, 0.0022, 3)

    centerline = [(x, -0.210, z) for x, z, _ in path]
    for index in range(len(centerline) - 1):
        cylinder_between(
            f"ZhangFei_Serpent_Blade_Gold_Ridge_{index}",
            centerline[index],
            centerline[index + 1],
            0.0026,
            materials["aged_gold"],
            20,
        )
    cylinder_between("ZhangFei_Spear_Gold_Collar", (-0.455, -0.200, 1.952), (-0.462, -0.200, 2.005), 0.028, materials["aged_gold"], 48)
    sphere("ZhangFei_Spear_Crimson_Gem", (-0.469, -0.229, 1.985), (0.010, 0.005, 0.010), materials["crimson"], 32, 16)

    for index, x_offset in enumerate((-0.016, 0.0, 0.016)):
        strand(
            f"ZhangFei_Spear_Tassel_{index}",
            [
                (-0.460 + x_offset, -0.200, 1.970),
                (-0.454 + x_offset * 1.4, -0.207, 1.925),
                (-0.448 + x_offset * 1.8, -0.195, 1.865),
            ],
            0.0018,
            materials["crimson"],
            taper=True,
        )


def rename_core_objects():
    body = bpy.data.objects.get("Guan_Yu_Basemesh")
    if body:
        body.name = "Zhang_Fei_Basemesh"
    rig = bpy.data.objects.get("Guan_Yu_Game_Rig")
    if rig:
        rig.name = "Zhang_Fei_Game_Rig"


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
    sculpt_zhang_fei_face()
    tune_skin_material()
    rebuild_eyes_and_expression(materials)
    build_brows(materials)
    build_bushy_beard_and_moustache(materials)
    build_wild_hair_and_topknot(materials)
    recolor_costume(materials)
    make_serpent_blade(materials)
    rename_core_objects()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.34), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.64), (0.0, -0.095, 1.56), 96)
    render(scene, camera, THREE_QUARTER, (1100, 1100), (0.92, -2.36, 1.66), (0.0, -0.08, 1.55), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
