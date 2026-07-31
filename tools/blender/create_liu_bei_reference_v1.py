"""Create Liu Bei reference v1 from the stable rigged Three Kingdoms human base.

This is a character rebuild, not a palette swap: Guan Yu's beard, headcloth,
dragon pauldrons and polearm are removed.  Liu Bei receives a distinct oval
benevolent face, swept court hair, a small Han gold crown, yellow brocade over
soft lamellar armour, and the paired male/female swords from the project roster.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, cone_between, cube, cylinder_between, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v45.blend"
OUTPUT_BLEND = SRC / "liu-bei-reference-fullbody-v1.blend"
FRONT = SRC / "liu-bei-reference-fullbody-v1-front.png"
UPPER = SRC / "liu-bei-reference-fullbody-v1-upper.png"
FACE = SRC / "liu-bei-reference-fullbody-v1-face.png"
THREE_QUARTER = SRC / "liu-bei-reference-fullbody-v1-three-quarter.png"


def remove_matching(*prefixes: str, contains: tuple[str, ...] = ()) -> None:
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes) or any(token in obj.name for token in contains):
            bpy.data.objects.remove(obj, do_unlink=True)


def curve_bundle(name, paths, material, radius):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 2
    data.bevel_depth = radius
    data.bevel_resolution = 2
    for path, width in paths:
        spline = data.splines.new("NURBS")
        spline.points.add(len(path) - 1)
        for index, coordinates in enumerate(path):
            point = spline.points[index]
            point.co = (*coordinates, 1.0)
            t = index / max(1, len(path) - 1)
            point.radius = max(0.10, width * (1.0 - 0.70 * t))
        spline.order_u = min(3, len(path))
        spline.use_endpoint_u = True
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def make_materials():
    return {
        "yellow": mat("Liu Bei imperial yellow brocade", (0.31, 0.155, 0.018, 1), 0.49, noise=13.0, bump=0.045),
        "yellow_light": mat("Liu Bei sunlit gold silk", (0.54, 0.29, 0.042, 1), 0.43, noise=18.0, bump=0.035),
        "yellow_shadow": mat("Liu Bei ochre robe shadow", (0.135, 0.057, 0.008, 1), 0.60, noise=11.0, bump=0.055),
        "jade": mat("Liu Bei restrained Han jade", (0.016, 0.135, 0.084, 1), 0.34, metallic=0.04, noise=17.0, bump=0.018),
        "armor": mat("Liu Bei black gold soft lamellar", (0.018, 0.020, 0.018, 1), 0.48, metallic=0.50, noise=24.0, bump=0.055),
        "leather": mat("Liu Bei dark tea leather", (0.055, 0.020, 0.009, 1), 0.62, noise=18.0, bump=0.065),
        "gold": mat("Liu Bei aged imperial gold", (0.42, 0.19, 0.028, 1), 0.29, metallic=0.80, noise=12.0, bump=0.030),
        "steel": mat("Liu Bei folded sword steel", (0.25, 0.29, 0.31, 1), 0.18, metallic=0.93, noise=38.0, bump=0.018),
        "steel_dark": mat("Liu Bei dark female sword fuller", (0.055, 0.068, 0.074, 1), 0.22, metallic=0.88, noise=31.0, bump=0.015),
        "hair": mat("Liu Bei natural black brown hair", (0.0015, 0.0007, 0.00035, 1), 0.64, noise=28.0, bump=0.016),
        "hair_warm": mat("Liu Bei warm beard glints", (0.008, 0.0025, 0.0007, 1), 0.62, noise=32.0, bump=0.015),
        "eye_white": mat("Liu Bei warm living sclera", (0.37, 0.30, 0.235, 1), 0.34, noise=7.0, bump=0.006),
        "iris": mat("Liu Bei calm dark brown iris", (0.028, 0.008, 0.002, 1), 0.22, noise=28.0, bump=0.010),
        "pupil": mat("Liu Bei natural black pupil", (0.0001, 0.00007, 0.00004, 1), 0.15),
        "lid": mat("Liu Bei warm eyelid rim", (0.145, 0.043, 0.020, 1), 0.47, noise=17.0, bump=0.006),
        "tear": mat("Liu Bei restrained tear duct", (0.16, 0.025, 0.018, 1), 0.31),
    }


def sculpt_liu_bei_face():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    key = body.shape_key_add(name="Liu Bei v1 benevolent oval face", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > 0.075 or ax > 0.145 or not 1.505 < co.z < 1.790:
            continue

        # Liu Bei is slimmer and more courtly than the inherited martial face:
        # long oval jaw, softly filled cheeks and a calm open forehead.
        if 1.625 < co.z < 1.685 and 0.035 < ax < 0.105:
            cheek = max(0.0, 1.0 - abs(co.z - 1.650) / 0.034)
            co.x *= 1.028 + cheek * 0.025
            co.y -= cheek * 0.0018
        if 1.525 < co.z < 1.615 and ax > 0.038:
            jaw = max(0.0, 1.0 - abs(co.z - 1.565) / 0.052)
            co.x *= 0.925 + 0.025 * jaw
        if ax < 0.050 and 1.510 < co.z < 1.555:
            co.z -= 0.0055 * (1.0 - ax / 0.050)

        # Smooth the inherited heavy brow; retain a dignified inner focus.
        if 0.010 < ax < 0.090 and 1.690 < co.z < 1.722:
            weight = max(0.0, 1.0 - abs(co.z - 1.705) / 0.018)
            co.y += 0.0020 * weight
        if ax < 0.022 and 1.682 < co.z < 1.715:
            co.y -= 0.0010

        # Slightly longer but narrower nose, fair heroic profile rather than a
        # bulky general's nose.
        if ax < 0.022 and 1.605 < co.z < 1.670:
            co.y -= 0.0015 * (1.0 - ax / 0.022)
        if 0.020 < ax < 0.050 and 1.592 < co.z < 1.622:
            co.x *= 0.965

        # Relaxed mouth corners and a fuller lower lip support the benevolent
        # expression without turning it into a modern smile.
        if ax < 0.048 and co.y < -0.135:
            if 1.570 < co.z < 1.583:
                co.y -= 0.0008
            if 0.032 < ax < 0.052 and 1.568 < co.z < 1.590:
                co.z += 0.0011

        # The roster's famous large earlobes are sculpted into the side mass.
        if 0.086 < ax < 0.128 and -0.060 < co.y < 0.055 and 1.590 < co.z < 1.675:
            lower = max(0.0, 1.0 - abs(co.z - 1.615) / 0.032)
            co.z -= 0.0065 * lower
            co.x *= 1.0 + 0.025 * lower

    body.data.update()


def tune_skin():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    for name, color in (
        ("Portrait warm heroic complexion", (0.245, 0.092, 0.040, 1)),
        ("V34 weathered bronze complexion", (0.225, 0.075, 0.030, 1)),
    ):
        node = nodes.get(name)
        if node:
            node.inputs[2].default_value = color
    mature = nodes.get("V34 restrained mature skin color")
    if mature:
        mature.inputs["Saturation"].default_value = 0.76
        mature.inputs["Value"].default_value = 1.08
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Roughness"].default_value = 0.52
        shader.inputs["Subsurface Weight"].default_value = 0.052


def build_calm_eyes_and_brows(materials):
    remove_matching(
        "Portrait_Brow_", "V32_Brow_Density_", "V34_Upper_Lid_", "V39_Face_Brow_Anchor_",
        "V39_Face_Waterline_", "V44_Eye_", "V45_Eye_",
    )
    for side in (-1, 1):
        x = side * 0.0340
        z = 1.6740
        sphere(f"LiuBei_Eye_Sclera_{side:+d}", (x, -0.1240, z), (0.0152, 0.0145, 0.0119), materials["eye_white"], 64, 32)
        sphere(f"LiuBei_Eye_Iris_{side:+d}", (x - side * 0.00025, -0.1391, z - 0.0002), (0.0068, 0.00072, 0.0058), materials["iris"], 48, 24)
        sphere(f"LiuBei_Eye_Pupil_{side:+d}", (x - side * 0.00025, -0.1397, z - 0.0002), (0.00275, 0.00048, 0.00270), materials["pupil"], 40, 20)
        sphere(f"LiuBei_Tear_Duct_{side:+d}", (side * 0.0164, -0.1400, 1.6700), (0.0020, 0.00065, 0.00115), materials["tear"], 28, 14)
        upper = [
            (side * 0.0148, -0.1724, 1.6774),
            (side * 0.0265, -0.1748, 1.6803),
            (side * 0.0390, -0.1740, 1.6798),
            (side * 0.0510, -0.1700, 1.6758),
        ]
        lower = [
            (side * 0.0150, -0.1723, 1.6690),
            (side * 0.0270, -0.1744, 1.6669),
            (side * 0.0390, -0.1738, 1.6673),
            (side * 0.0506, -0.1698, 1.6701),
        ]
        strand(f"LiuBei_Upper_Lid_{side:+d}", upper, 0.00090, materials["lid"], taper=False)
        strand(f"LiuBei_Lower_Lid_{side:+d}", lower, 0.00058, materials["lid"], taper=False)

    rng = random.Random(2014)
    fibers = []
    for side in (-1, 1):
        for index in range(82):
            t = rng.random()
            x = side * (0.014 + 0.062 * t)
            z = 1.691 + math.sin(t * math.pi) * 0.0048 + t * 0.003 + rng.uniform(-0.0011, 0.0011)
            y = -0.174 - math.sin(t * math.pi) * 0.0025
            dx = side * rng.uniform(0.003, 0.006)
            fibers.append(([(x, y, z), (x + dx * 0.55, y - 0.0008, z + 0.0028), (x + dx, y, z + 0.0042)], rng.uniform(0.55, 1.05)))
    curve_bundle("LiuBei_Refined_Brow_Fibers", fibers, materials["hair"], 0.00034)


def build_hair_crown_and_short_beard(materials):
    remove_matching(
        "Diadem_", "Headcloth_", "V32_Headcloth_", "V34_Headcloth_", "V40_Headcloth_",
        "V34_Groom_", "V40_Beard_Root_", "Curved_Cloth_Diadem",
    )
    cap = bpy.data.objects.get("Portrait_Fitted_Headcloth")
    if cap:
        bpy.data.objects.remove(cap, do_unlink=True)

    # A thin asymmetric scalp shell replaces the inherited scalloped cloth cap.
    # The front hairline is higher than the temples/back and the shell has no
    # helmet-like thickness or overhanging brim.
    segments = 64
    rings = 10
    verts = [(0.0, -0.006, 1.815)]
    for ring_index in range(1, rings + 1):
        theta = (ring_index / rings) * (math.pi / 2)
        radius_x = math.sin(theta) * 0.101
        radius_y = math.sin(theta) * 0.112
        dome_z = 1.675 + math.cos(theta) * 0.140
        for segment in range(segments):
            angle = segment / segments * math.tau
            front = max(0.0, -math.sin(angle))
            side = abs(math.cos(angle))
            hairline = (front * 0.038 + side * 0.005) * math.sin(theta) ** 7
            verts.append((math.cos(angle) * radius_x, -0.006 + math.sin(angle) * radius_y, dome_z + hairline))
    faces = []
    for segment in range(segments):
        faces.append((0, 1 + segment, 1 + (segment + 1) % segments))
    for ring_index in range(rings - 1):
        start = 1 + ring_index * segments
        next_start = start + segments
        for segment in range(segments):
            following = (segment + 1) % segments
            faces.append((start + segment, next_start + segment, next_start + following, start + following))
    mesh = bpy.data.meshes.new("LiuBei_Natural_Scalp_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    scalp = bpy.data.objects.new("LiuBei_Natural_Swept_Scalp", mesh)
    bpy.context.collection.objects.link(scalp)
    assign(scalp, materials["hair"])
    for polygon in scalp.data.polygons:
        polygon.use_smooth = True

    rng = random.Random(2217)
    hair_paths = []
    for index in range(980):
        azimuth = rng.uniform(0.0, math.tau)
        polar = rng.uniform(0.18, 1.95)
        normal = Vector((math.sin(polar) * math.cos(azimuth), math.sin(polar) * math.sin(azimuth), math.cos(polar)))
        root = Vector((normal.x * 0.100, -0.041 + normal.y * 0.111, 1.744 + normal.z * 0.068))
        if root.y < -0.122 and root.z < 1.735 and abs(root.x) < 0.060:
            continue
        # Hair is brushed upward/back toward the topknot, unlike Zhang Fei's flyaways.
        target = Vector((root.x * 0.36, -0.008, 1.822))
        middle = root.lerp(target, 0.42) + Vector((0, rng.uniform(-0.004, 0.004), rng.uniform(0.002, 0.010)))
        tip = root.lerp(target, 0.74)
        hair_paths.append(([tuple(root), tuple(middle), tuple(tip)], rng.uniform(0.60, 1.10)))
    curve_bundle("LiuBei_Swept_Hair_Fibers", hair_paths, materials["hair"], 0.00031)

    sphere("LiuBei_Topknot_Core", (0.0, -0.008, 1.835), (0.037, 0.033, 0.045), materials["hair"], 48, 24)
    # Small court crown: low, open and martial, not a later-dynasty hat.
    bpy.ops.mesh.primitive_torus_add(major_radius=0.048, minor_radius=0.006, major_segments=64, minor_segments=12, location=(0.0, -0.008, 1.828))
    crown_band = bpy.context.object
    crown_band.name = "LiuBei_Han_Crown_Base"
    crown_band.scale.y = 0.82
    assign(crown_band, materials["gold"])
    for index, x in enumerate((-0.040, -0.020, 0.0, 0.020, 0.040)):
        height = 0.048 + (0.020 if index == 2 else 0.008 if index in (1, 3) else 0.0)
        cylinder_between(f"LiuBei_Crown_Spire_{index}", (x, -0.050, 1.825), (x * 0.72, -0.022, 1.825 + height), 0.0032, materials["gold"], 20)
        sphere(f"LiuBei_Crown_Finial_{index}", (x * 0.72, -0.022, 1.825 + height), (0.005, 0.004, 0.005), materials["gold"], 24, 12)
    strand("LiuBei_Crown_Central_Arch", [(-0.036, -0.047, 1.836), (0.0, -0.053, 1.872), (0.036, -0.047, 1.836)], 0.0031, materials["gold"], taper=False)
    sphere("LiuBei_Crown_Jade_Seal", (0.0, -0.057, 1.851), (0.009, 0.0038, 0.012), materials["jade"], 32, 16)

    # Refined moustache and short pointed goatee; the lower face remains visible.
    beard = {"deep": [], "warm": []}
    for side in (-1, 1):
        for index in range(58):
            t = rng.random()
            root = (side * (0.003 + 0.043 * t), -0.170 - rng.uniform(0.0, 0.003), 1.590 - 0.014 * t + rng.uniform(-0.002, 0.002))
            tip = (side * (0.045 + 0.045 * t), -0.177, 1.560 - 0.025 * t + rng.uniform(-0.003, 0.003))
            mid = ((root[0] + tip[0]) * 0.52, -0.179 - rng.uniform(0.0, 0.004), (root[2] + tip[2]) * 0.50 + rng.uniform(-0.002, 0.002))
            beard["warm" if rng.random() < 0.16 else "deep"].append(([root, mid, tip], rng.uniform(0.48, 0.92)))
    for index in range(185):
        root_x = rng.triangular(-0.050, 0.050, 0.0)
        root_z = rng.uniform(1.535, 1.570)
        center_weight = 1.0 - min(1.0, abs(root_x) / 0.050)
        length = rng.uniform(0.045, 0.115) * (0.50 + center_weight * 0.70)
        tip_x = root_x * rng.uniform(0.20, 0.65) + rng.uniform(-0.006, 0.006)
        root = (root_x, -0.169, root_z)
        middle_a = (root_x * 0.82 + tip_x * 0.18, -0.179 - rng.uniform(0.0, 0.005), root_z - length * 0.28)
        middle_b = (root_x * 0.38 + tip_x * 0.62 + rng.uniform(-0.003, 0.003), -0.181 - rng.uniform(0.0, 0.006), root_z - length * 0.67)
        tip = (tip_x, -0.174, root_z - length)
        beard["warm" if rng.random() < 0.13 else "deep"].append(([root, middle_a, middle_b, tip], rng.uniform(0.45, 0.96)))
    curve_bundle("LiuBei_Short_Beard_Deep", beard["deep"], materials["hair"], 0.00021)
    curve_bundle("LiuBei_Short_Beard_Warm", beard["warm"], materials["hair_warm"], 0.00018)


def recolor_and_simplify_costume(materials):
    remove_matching(
        "Dragon_", "Sculpted_Dragon_Head_", "Pauldron_Scale_", "V33_Right_Pauldron_",
        "V29_Blade_", "Fullbody_Blade_", "Fullbody_Crimson_Pole_", "Fullbody_Green_Dragon_Pole",
        "Fullbody_Pole_Butt_Spike", "V29_Green_Dragon_Crescent_Blade", "V29_Crescent_", "V38_Raised_Sleeve_",
    )

    yellow_names = (
        "Fullbody_Layered_Green_Battle_Robe", "Fullbody_Robe_Front_Right", "Portrait_Deep_Green_Robe",
        "Portrait_Right_Crossed_Lapel", "V35_Sleeve_Left", "V35_Sleeve_Right", "V36_Flowing_Robe_Main",
    )
    shadow_names = (
        "Fullbody_Robe_Dark_Inner_Gusset", "Fullbody_Robe_Front_Left", "Portrait_Left_Crossed_Lapel",
        "V36_Flowing_Robe_Shadow_Layer",
    )
    for name in yellow_names:
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, materials["yellow_light"] if "Lapel" in name or "Sleeve" in name else materials["yellow"])
    for name in shadow_names:
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, materials["yellow_shadow"])
    # Pull the stylized balloon sleeves closer to the upper arms.  Scaling the
    # mesh about its own world-space centre preserves their placement.
    for name in ("V35_Sleeve_Left", "V35_Sleeve_Right"):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "MESH":
            center = sum((vertex.co for vertex in obj.data.vertices), Vector()) / max(1, len(obj.data.vertices))
            for vertex in obj.data.vertices:
                offset = vertex.co - center
                vertex.co = center + Vector((offset.x * 0.84, offset.y * 0.82, offset.z * 0.86))
            obj.data.update()
    for obj in bpy.data.objects:
        if obj.name.startswith(("V29_Robe_Weighted_Fold_", "V30_Robe_Weighted_Fold_", "V36_Flowing_Robe_Fold_")):
            assign(obj, materials["yellow_shadow"])
        elif obj.name.startswith(("V36_Waist_Lamella_", "Fullbody_Side_Tasset_", "V36_Side_Tasset_")):
            assign(obj, materials["armor"])
        elif obj.name.startswith(("V33_Fitted_Greave_", "V29_Fitted_Han_Riding_Shoe_")):
            assign(obj, materials["leather"])

    for name in ("Portrait_Dark_Chest_Vest", "Portrait_Dragon_Armor_Harness", "V37_Cross_Sash_Dark_Armor"):
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, materials["armor"])
    for name in ("Fullbody_Curved_Leather_Belt", "Fullbody_Fitted_Leather_Bracers", "Fullbody_Leather_Battle_Boots"):
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, materials["leather"])
    for obj in bpy.data.objects:
        if hasattr(obj.data, "materials") and any(m and "jade" in m.name.lower() for m in obj.data.materials):
            assign(obj, materials["jade"])

    # A fitted soft-armour bib sits beneath the open yellow lapels.
    for row in range(6):
        columns = 7 if row < 5 else 6
        for col in range(columns):
            x = (col - (columns - 1) / 2) * 0.042
            z = 1.465 - row * 0.034
            plate = cube(
                f"LiuBei_Soft_Lamella_{row}_{col}",
                (x, -0.208 + 0.014 * (x / 0.18) ** 2, z),
                (0.0175, 0.0035, 0.0125), materials["armor"], rotation=(0.02, 0, -x * 0.20), bevel_width=0.0025,
            )
            if (row + col) % 3 == 0:
                sphere(f"LiuBei_Lamella_Rivet_{row}_{col}", (x, -0.213, z + 0.004), (0.0023, 0.0011, 0.0023), materials["gold"], 20, 10)

    # Restrained Han cloud embroidery on the robe front.
    for side in (-1, 1):
        for level, z in enumerate((0.88, 0.67, 0.46)):
            x = side * (0.12 + 0.012 * level)
            strand(
                f"LiuBei_Brocade_Cloud_{side:+d}_{level}",
                [(x - side * 0.045, -0.229, z), (x, -0.234, z + 0.030), (x + side * 0.050, -0.228, z), (x + side * 0.018, -0.232, z - 0.027)],
                0.0024, materials["gold"], taper=False,
            )


def repose_hands_for_twin_swords():
    targets = {
        "Portrait_Hand_Target_l": (0.285, -0.245, 1.105),
        "Portrait_Hand_Target_r": (-0.335, -0.175, 1.055),
        "Portrait_Elbow_Pole_l": (0.550, -0.110, 1.255),
        "Portrait_Elbow_Pole_r": (-0.545, -0.110, 1.245),
    }
    for name, location in targets.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.location = location
    bpy.context.view_layer.update()


def build_fitted_forearm_bracers(materials):
    # The original bracers were static accessories for Guan Yu's old polearm
    # pose.  These new cuffs follow Liu Bei's reposed lower arms exactly.
    old = bpy.data.objects.get("Fullbody_Fitted_Leather_Bracers")
    if old:
        old.hide_render = True
        old.hide_viewport = True
    arms = (
        ("L", Vector((0.400, -0.095, 1.281)), Vector((0.285, -0.245, 1.105))),
        ("R", Vector((-0.158, -0.050, 1.172)), Vector((-0.331, -0.179, 1.030))),
    )
    for label, elbow, wrist in arms:
        start = elbow.lerp(wrist, 0.43)
        end = elbow.lerp(wrist, 0.88)
        cone_between(f"LiuBei_Fitted_Bracer_{label}", start, end, 0.052, 0.043, materials["leather"], 48)
        direction = (end - start).normalized()
        for index, point in enumerate((start + direction * 0.006, end - direction * 0.006)):
            cylinder_between(
                f"LiuBei_Bracer_Gold_Band_{label}_{index}",
                point - direction * 0.006, point + direction * 0.006, 0.054 if index == 0 else 0.046,
                materials["gold"], 48,
            )


def create_sword(name, hand, tip, materials, female=False):
    hand = Vector(hand)
    tip = Vector(tip)
    direction = (tip - hand).normalized()
    side = Vector((direction.z, 0.0, -direction.x)).normalized()
    normal = Vector((0.0, 1.0, 0.0))
    guard_center = hand + direction * 0.072
    blade_root = guard_center + direction * 0.015
    blade_length = (tip - blade_root).length
    shoulder = blade_root + direction * min(0.10, blade_length * 0.16)
    half_root = 0.021 if female else 0.024
    half_shoulder = 0.025 if female else 0.029
    half_tip = 0.0035
    thickness = 0.0036
    centers = (blade_root, shoulder, tip)
    widths = (half_root, half_shoulder, half_tip)
    verts = []
    for center, width in zip(centers, widths):
        verts.extend([
            tuple(center - side * width - normal * thickness), tuple(center + side * width - normal * thickness),
            tuple(center - side * width + normal * thickness), tuple(center + side * width + normal * thickness),
        ])
    faces = []
    for section in range(2):
        a = section * 4
        b = (section + 1) * 4
        faces.extend(((a, b, b + 1, a + 1), (a + 2, a + 3, b + 3, b + 2), (a, a + 2, b + 2, b), (a + 1, b + 1, b + 3, a + 3)))
    faces.extend(((0, 1, 3, 2), (8, 10, 11, 9)))
    mesh = bpy.data.meshes.new(f"{name}_Blade_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    blade = bpy.data.objects.new(f"{name}_Folded_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    assign(blade, materials["steel"])
    bevel(blade, 0.0018, 3)

    # Polished central ridge and distinct jade/gold hilts differentiate the pair.
    cylinder_between(f"{name}_Blade_Ridge", blade_root, tip - direction * 0.022, 0.0015, materials["steel"] if female else materials["gold"], 16)
    grip_start = hand - direction * 0.078
    grip_end = guard_center - direction * 0.012
    cylinder_between(f"{name}_Grip", grip_start, grip_end, 0.013, materials["leather"], 32)
    guard_half = 0.075 if female else 0.083
    cylinder_between(f"{name}_Guard", guard_center - side * guard_half, guard_center + side * guard_half, 0.010, materials["gold"], 32)
    for sign in (-1, 1):
        sphere(f"{name}_Guard_Jade_{sign:+d}", guard_center + side * guard_half * sign, (0.012, 0.009, 0.012), materials["jade"], 28, 14)
    pommel = hand - direction * 0.096
    sphere(f"{name}_Pommel", pommel, (0.021, 0.017, 0.024), materials["gold"], 36, 18)
    sphere(f"{name}_Pommel_Jade", pommel - normal * 0.016, (0.008, 0.004, 0.008), materials["jade"], 24, 12)


def build_twin_swords(materials):
    create_sword("LiuBei_Male_Sword", (-0.335, -0.175, 1.055), (-0.555, -0.145, 0.105), materials, female=False)
    create_sword("LiuBei_Female_Sword", (0.285, -0.245, 1.105), (0.650, -0.205, 0.135), materials, female=True)


def rename_core_objects():
    body = bpy.data.objects.get("Guan_Yu_Basemesh")
    if body:
        body.name = "Liu_Bei_Basemesh"
    rig = bpy.data.objects.get("Guan_Yu_Game_Rig")
    if rig:
        rig.name = "Liu_Bei_Game_Rig"


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
    sculpt_liu_bei_face()
    tune_skin()
    build_calm_eyes_and_brows(materials)
    build_hair_crown_and_short_beard(materials)
    recolor_and_simplify_costume(materials)
    repose_hands_for_twin_swords()
    build_fitted_forearm_bracers(materials)
    build_twin_swords(materials)
    rename_core_objects()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.22
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
