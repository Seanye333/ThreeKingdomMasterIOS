"""Refine Liu Bei v1 into a more natural full-body v2 reference model."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, cone_between, cube, cylinder_between, look_at, mat, sphere, strand, tapered_panel
from create_liu_bei_reference_v1 import curve_bundle, remove_matching


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "liu-bei-reference-fullbody-v1.blend"
OUTPUT_BLEND = SRC / "liu-bei-reference-fullbody-v2.blend"
FRONT = SRC / "liu-bei-reference-fullbody-v2-front.png"
UPPER = SRC / "liu-bei-reference-fullbody-v2-upper.png"
FACE = SRC / "liu-bei-reference-fullbody-v2-face.png"
THREE_QUARTER = SRC / "liu-bei-reference-fullbody-v2-three-quarter.png"


def make_materials():
    lip = mat("Liu Bei v2 living muted lip", (0.185, 0.042, 0.026, 1), 0.43, noise=22.0, bump=0.006)
    lid = mat("Liu Bei v2 warm eyelid skin", (0.175, 0.054, 0.027, 1), 0.46, noise=18.0, bump=0.005)
    sclera = mat("Liu Bei v2 warm clear sclera", (0.49, 0.40, 0.315, 1), 0.28, noise=7.0, bump=0.004)
    iris_outer = mat("Liu Bei v2 deep iris limbal ring", (0.009, 0.003, 0.001, 1), 0.21, noise=25.0, bump=0.010)
    iris = mat("Liu Bei v2 warm brown iris", (0.075, 0.024, 0.006, 1), 0.20, noise=46.0, bump=0.014)
    pupil = mat("Liu Bei v2 natural pupil", (0.00008, 0.00004, 0.00002, 1), 0.12)
    tear = mat("Liu Bei v2 living tear tissue", (0.23, 0.035, 0.025, 1), 0.29)
    catchlight = mat("Liu Bei v2 restrained catchlight", (0.82, 0.76, 0.64, 1), 0.08)
    cornea = bpy.data.materials.new("Liu Bei v2 clear cornea")
    cornea.use_nodes = True
    shader = cornea.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.30, 0.34, 0.36, 1)
    shader.inputs["Roughness"].default_value = 0.07
    shader.inputs["Metallic"].default_value = 0.0
    if "Transmission Weight" in shader.inputs:
        shader.inputs["Transmission Weight"].default_value = 0.38
    if "Coat Weight" in shader.inputs:
        shader.inputs["Coat Weight"].default_value = 0.32
        shader.inputs["Coat Roughness"].default_value = 0.05
    shader.inputs["IOR"].default_value = 1.38

    hair = mat("Liu Bei v2 deep black brown hair", (0.00045, 0.00018, 0.00007, 1), 0.62, noise=36.0, bump=0.015)
    hair_warm = mat("Liu Bei v2 warm hair variation", (0.0065, 0.0018, 0.00045, 1), 0.60, noise=40.0, bump=0.013)
    hair_age = mat("Liu Bei v2 restrained age strands", (0.040, 0.031, 0.024, 1), 0.65, noise=28.0, bump=0.010)
    armor = mat("Liu Bei v2 blackened soft lamellar", (0.012, 0.014, 0.013, 1), 0.43, metallic=0.58, noise=27.0, bump=0.055)
    armor_edge = mat("Liu Bei v2 soft armour edge steel", (0.085, 0.075, 0.058, 1), 0.34, metallic=0.70, noise=19.0, bump=0.022)
    armor_back = mat("Liu Bei v2 quilted tea armour backing", (0.052, 0.027, 0.012, 1), 0.72, noise=16.0, bump=0.050)
    gold = bpy.data.materials.get("Liu Bei aged imperial gold")
    jade = bpy.data.materials.get("Liu Bei restrained Han jade")
    leather = bpy.data.materials.get("Liu Bei dark tea leather")
    yellow = bpy.data.materials.get("Liu Bei sunlit gold silk")
    yellow_shadow = bpy.data.materials.get("Liu Bei ochre robe shadow")
    return {
        "lip": lip, "lid": lid, "sclera": sclera, "iris_outer": iris_outer, "iris": iris,
        "pupil": pupil, "tear": tear, "catchlight": catchlight, "cornea": cornea,
        "hair": hair, "hair_warm": hair_warm, "hair_age": hair_age,
        "armor": armor, "armor_edge": armor_edge, "armor_back": armor_back, "gold": gold, "jade": jade,
        "leather": leather, "yellow": yellow, "yellow_shadow": yellow_shadow,
    }


def sculpt_face_v2():
    body = bpy.data.objects["Liu_Bei_Basemesh"]
    key = body.shape_key_add(name="Liu Bei v2 relaxed humane face", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > 0.07 or ax > 0.145 or not 1.51 < co.z < 1.77:
            continue

        # Round the cheek/jaw transition and keep the chin courtly rather than
        # gaunt. Liu Bei should read as compassionate but experienced.
        if 0.038 < ax < 0.108 and 1.610 < co.z < 1.665:
            weight = max(0.0, 1.0 - abs(co.z - 1.638) / 0.030)
            co.x *= 1.0 + 0.030 * weight
            co.y -= 0.0015 * weight
        if 0.040 < ax < 0.100 and 1.535 < co.z < 1.605:
            weight = max(0.0, 1.0 - abs(co.z - 1.570) / 0.038)
            co.x *= 1.0 + 0.018 * weight

        # Open the eye aperture slightly and relax the inherited inner frown.
        for center in (-0.034, 0.034):
            dx = abs(co.x - center)
            if dx < 0.032:
                horizontal = 1.0 - dx / 0.032
                if 1.674 < co.z < 1.693:
                    co.z += 0.00125 * horizontal
                if 1.653 < co.z < 1.671:
                    co.z -= 0.00065 * horizontal
        if ax < 0.024 and 1.684 < co.z < 1.716:
            co.y += 0.0015

        # Neutral benevolent mouth: lift only the outer corners, add lower-lip
        # volume, and avoid a modern smiling expression.
        if co.y < -0.135 and 0.030 < ax < 0.054 and 1.565 < co.z < 1.590:
            co.z += 0.0030 * max(0.0, 1.0 - abs(co.z - 1.578) / 0.014)
        if co.y < -0.140 and ax < 0.038 and 1.558 < co.z < 1.574:
            co.y -= 0.0012
            co.z += 0.0008

    body.data.update()


def tune_skin_v2():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material:
        return
    nodes = material.node_tree.nodes
    warm = nodes.get("Portrait warm heroic complexion")
    if warm:
        warm.inputs[0].default_value = 0.28
        warm.inputs[1].default_value = (0.285, 0.095, 0.037, 1)
        warm.inputs[2].default_value = (0.235, 0.070, 0.027, 1)
    mottled = nodes.get("Subtle mottled skin tone")
    if mottled:
        mottled.inputs[0].default_value = 0.12
    vascular = nodes.get("Subtle cheek and nose vascular warmth")
    if vascular:
        vascular.inputs[2].default_value = (0.29, 0.043, 0.020, 1)
    mature = nodes.get("V34 restrained mature skin color")
    if mature:
        mature.inputs["Saturation"].default_value = 0.82
        mature.inputs["Value"].default_value = 1.02
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Roughness"].default_value = 0.47
        shader.inputs["Subsurface Weight"].default_value = 0.070
        if "Coat Weight" in shader.inputs:
            shader.inputs["Coat Weight"].default_value = 0.055
            shader.inputs["Coat Roughness"].default_value = 0.24


def rebuild_eyes_brows_and_lips(materials):
    remove_matching(
        "LiuBei_Eye_", "LiuBei_Tear_Duct_", "LiuBei_Upper_Lid_", "LiuBei_Lower_Lid_",
        "LiuBei_Refined_Brow_Fibers", "V39_Face_UnderEye_Crease_",
    )
    for side in (-1, 1):
        x = side * 0.0342
        z = 1.6742
        sphere(f"LiuBeiV2_Eye_Sclera_{side:+d}", (x, -0.1241, z), (0.0154, 0.0147, 0.0122), materials["sclera"], 72, 36)
        sphere(f"LiuBeiV2_Eye_Limbal_{side:+d}", (x - side * 0.0002, -0.13915, z - 0.0001), (0.00735, 0.00076, 0.00645), materials["iris_outer"], 56, 28)
        sphere(f"LiuBeiV2_Eye_Iris_{side:+d}", (x - side * 0.0002, -0.13955, z - 0.0001), (0.00630, 0.00062, 0.00555), materials["iris"], 56, 28)
        sphere(f"LiuBeiV2_Eye_Pupil_{side:+d}", (x - side * 0.0002, -0.14005, z - 0.0001), (0.00255, 0.00040, 0.00250), materials["pupil"], 44, 22)
        sphere(f"LiuBeiV2_Eye_Catchlight_{side:+d}", (x - 0.0022, -0.14055, z + 0.0020), (0.00105, 0.00020, 0.00105), materials["catchlight"], 24, 12)
        sphere(f"LiuBeiV2_Tear_Duct_{side:+d}", (side * 0.0162, -0.1403, 1.6698), (0.0022, 0.00068, 0.00125), materials["tear"], 32, 16)

        upper = [
            (side * 0.0145, -0.1725, 1.6781), (side * 0.0260, -0.1752, 1.6810),
            (side * 0.0390, -0.1746, 1.6803), (side * 0.0513, -0.1701, 1.6759),
        ]
        lower = [
            (side * 0.0147, -0.1725, 1.6688), (side * 0.0264, -0.1749, 1.6666),
            (side * 0.0390, -0.1742, 1.6670), (side * 0.0510, -0.1698, 1.6700),
        ]
        crease = [
            (side * 0.017, -0.1678, 1.6864), (side * 0.032, -0.1700, 1.6892),
            (side * 0.049, -0.1670, 1.6857),
        ]
        strand(f"LiuBeiV2_Upper_Lid_{side:+d}", upper, 0.00092, materials["lid"], taper=False)
        strand(f"LiuBeiV2_Lower_Lid_{side:+d}", lower, 0.00052, materials["lid"], taper=False)
        strand(f"LiuBeiV2_Upper_Crease_{side:+d}", crease, 0.00034, materials["lid"], taper=True)

    rng = random.Random(2208)
    brows = {"deep": [], "warm": []}
    for side in (-1, 1):
        for index in range(130):
            t = rng.random()
            x = side * (0.014 + 0.064 * t)
            z = 1.696 + math.sin(t * math.pi) * 0.0052 - t * 0.0035 + rng.uniform(-0.0012, 0.0012)
            y = -0.1742 - math.sin(t * math.pi) * 0.0028
            dx = side * rng.uniform(0.0035, 0.0070)
            path = [(x, y, z), (x + dx * 0.55, y - 0.0010, z + 0.0023), (x + dx, y, z + 0.0038)]
            brows["warm" if rng.random() < 0.18 else "deep"].append((path, rng.uniform(0.50, 1.05)))
    curve_bundle("LiuBeiV2_Brow_Deep", brows["deep"], materials["hair"], 0.00032)
    curve_bundle("LiuBeiV2_Brow_Warm", brows["warm"], materials["hair_warm"], 0.00028)

    # Layered lip rims add living colour without a painted cosmetic look.
    strand("LiuBeiV2_Upper_Lip", [(-0.039, -0.1760, 1.5820), (-0.020, -0.1780, 1.5850), (0.0, -0.1790, 1.5824), (0.020, -0.1780, 1.5850), (0.039, -0.1760, 1.5820)], 0.00068, materials["lip"], taper=True)
    strand("LiuBeiV2_Lower_Lip", [(-0.036, -0.1755, 1.5732), (-0.018, -0.1785, 1.5704), (0.0, -0.1792, 1.5698), (0.018, -0.1785, 1.5704), (0.036, -0.1755, 1.5732)], 0.00072, materials["lip"], taper=True)


def rebuild_hairline_and_beard(materials):
    remove_matching(
        "LiuBei_Swept_Hair_Fibers", "LiuBei_Short_Beard_", "LiuBeiV2_Hairline_",
        "LiuBeiV2_Beard_", "LiuBeiV2_Moustache_",
    )
    rng = random.Random(2481)
    inherited_scalp = bpy.data.objects.get("LiuBei_Natural_Swept_Scalp")
    if inherited_scalp:
        assign(inherited_scalp, materials["hair"])
        for vertex in inherited_scalp.data.vertices:
            if vertex.co.y > -0.020 and vertex.co.z < 1.805:
                vertex.co.y = -0.020 + (vertex.co.y + 0.020) * 0.48
                vertex.co.x *= 0.92
        inherited_scalp.data.update()

    # A shallow ellipsoidal scalp replaces v1's long-backed shell. It follows
    # the skull and terminates at one clean hairline ring without a rigid tail.
    segments = 72
    rings = 12
    cap_verts = [(0.0, -0.025, 1.822)]
    for ring_index in range(1, rings + 1):
        theta = ring_index / rings * (math.pi / 2)
        factor = math.sin(theta)
        z = 1.722 + math.cos(theta) * 0.100
        for segment in range(segments):
            angle = segment / segments * math.tau
            cap_verts.append((math.cos(angle) * 0.102 * factor, -0.025 + math.sin(angle) * 0.125 * factor, z))
    cap_faces = []
    for segment in range(segments):
        cap_faces.append((0, 1 + segment, 1 + (segment + 1) % segments))
    for ring_index in range(rings - 1):
        start = 1 + ring_index * segments
        next_start = start + segments
        for segment in range(segments):
            following = (segment + 1) % segments
            cap_faces.append((start + segment, next_start + segment, next_start + following, start + following))
    cap_mesh = bpy.data.meshes.new("LiuBeiV2_Fitted_Scalp_Mesh")
    cap_mesh.from_pydata(cap_verts, [], cap_faces)
    cap_mesh.update()
    cap = bpy.data.objects.new("LiuBeiV2_Fitted_Swept_Scalp", cap_mesh)
    bpy.context.collection.objects.link(cap)
    assign(cap, materials["hair"])
    for polygon in cap.data.polygons:
        polygon.use_smooth = True
    cap.hide_render = True
    cap.hide_viewport = True

    scalp_fibers = {"deep": [], "warm": []}
    for index in range(420):
        theta = rng.uniform(0.24, 1.48)
        angle = rng.uniform(0.0, math.tau)
        factor = math.sin(theta)
        root = Vector((math.cos(angle) * 0.103 * factor, -0.025 + math.sin(angle) * 0.126 * factor, 1.722 + math.cos(theta) * 0.101))
        target = Vector((root.x * 0.18, -0.022, 1.830))
        path = [tuple(root), tuple(root.lerp(target, 0.34) + Vector((0, -0.002, 0.004))), tuple(root.lerp(target, 0.70) + Vector((0, 0.001, 0.006))), tuple(target)]
        scalp_fibers["warm" if rng.random() < 0.16 else "deep"].append((path, rng.uniform(0.50, 1.00)))
    hidden_deep = curve_bundle("LiuBeiV2_Scalp_Fibers_Deep", scalp_fibers["deep"], materials["hair"], 0.00023)
    hidden_warm = curve_bundle("LiuBeiV2_Scalp_Fibers_Warm", scalp_fibers["warm"], materials["hair_warm"], 0.00020)
    for hidden in (hidden_deep, hidden_warm):
        hidden.hide_render = True
        hidden.hide_viewport = True
    topknot = bpy.data.objects.get("LiuBei_Topknot_Core")
    if topknot:
        assign(topknot, materials["hair"])

    hairline = {"deep": [], "warm": [], "age": []}
    # Only temple wisps are added over the clean v1 scalp. A dense frontal row
    # reads as blunt bangs instead of swept-back Han court hair.
    for index in range(0):
        side = -1 if rng.random() < 0.5 else 1
        x = side * rng.uniform(0.055, 0.086)
        edge = abs(x) / 0.086
        root_z = 1.718 + 0.020 * edge ** 1.5 + rng.uniform(-0.0015, 0.0015)
        root_y = -0.148 + 0.016 * edge * edge
        sweep = rng.uniform(0.38, 0.62)
        path = [
            (x, root_y, root_z),
            (x * 0.92, root_y - 0.0010, root_z + rng.uniform(0.016, 0.026)),
            (x * 0.72, -0.125 + edge * 0.010, 1.770 + rng.uniform(-0.004, 0.006)),
            (x * sweep, -0.082, 1.802 + rng.uniform(-0.005, 0.008)),
        ]
        selector = rng.random()
        palette = "age" if selector < 0.025 else "warm" if selector < 0.17 else "deep"
        hairline[palette].append((path, rng.uniform(0.52, 1.10)))
    for palette, material, radius in (
        ("deep", materials["hair"], 0.00030), ("warm", materials["hair_warm"], 0.00027), ("age", materials["hair_age"], 0.00023),
    ):
        if hairline[palette]:
            curve_bundle(f"LiuBeiV2_Hairline_{palette}", hairline[palette], material, radius * 0.88)

    # Fine sideburns join the crown hair to the ears and prevent a wig-cap edge.
    sideburns = []
    for side in (-1, 1):
        for index in range(0):
            root_x = side * rng.uniform(0.078, 0.094)
            root_z = rng.uniform(1.682, 1.735)
            path = [
                (root_x, -0.104, root_z),
                (root_x + side * rng.uniform(0.002, 0.006), -0.112, root_z - 0.014),
                (root_x + side * rng.uniform(0.001, 0.005), -0.105, root_z - rng.uniform(0.024, 0.045)),
            ]
            sideburns.append((path, rng.uniform(0.45, 0.92)))
    if sideburns:
        curve_bundle("LiuBeiV2_Hairline_Sideburns", sideburns, materials["hair"], 0.00024)

    beard = {"deep": [], "warm": [], "age": []}
    # Fine moustache: continuous outward paths rather than detached root dots.
    for side in (-1, 1):
        for index in range(54):
            t = rng.random()
            root_x = side * rng.uniform(0.002, 0.030)
            root_z = 1.590 - abs(root_x) * 0.20 + rng.uniform(-0.002, 0.002)
            tip_x = side * rng.uniform(0.040, 0.064)
            tip_z = 1.570 - rng.uniform(0.0, 0.011)
            path = [
                (root_x, -0.1778, root_z),
                (side * (abs(root_x) + 0.016), -0.1810, root_z - 0.002),
                (side * (abs(root_x) + abs(tip_x)) * 0.52, -0.1820, (root_z + tip_z) * 0.50 + 0.002),
                (tip_x, -0.1760, tip_z),
            ]
            beard["warm" if rng.random() < 0.16 else "deep"].append((path, rng.uniform(0.50, 1.05)))

    # Short pointed chin beard, denser at the centre and curved around the jaw.
    for index in range(360):
        root_x = rng.triangular(-0.052, 0.052, 0.0)
        root_z = rng.uniform(1.536, 1.568)
        center = 1.0 - min(1.0, abs(root_x) / 0.052)
        length = rng.uniform(0.040, 0.082) * (0.65 + 0.55 * center)
        tip_x = root_x * rng.uniform(0.20, 0.62) + rng.uniform(-0.004, 0.004)
        phase = rng.uniform(0.0, math.tau)
        path = []
        for p in range(5):
            t = p / 4
            x = root_x + (tip_x - root_x) * t + math.sin(phase + t * math.pi) * 0.0025 * math.sin(math.pi * t)
            y = -0.1765 - math.sin(math.pi * t) * rng.uniform(0.005, 0.012)
            z = root_z - length * t
            path.append((x, y, z))
        selector = rng.random()
        palette = "age" if selector < 0.025 else "warm" if selector < 0.16 else "deep"
        beard[palette].append((path, rng.uniform(0.48, 1.08)))
    for palette, material, radius in (
        ("deep", materials["hair"], 0.00022), ("warm", materials["hair_warm"], 0.00019), ("age", materials["hair_age"], 0.00017),
    ):
        curve_bundle(f"LiuBeiV2_Beard_{palette}", beard[palette], material, radius)


def create_scale_plate(name, center, width, height, depth, material):
    x, y, z = center
    verts_2d = [(-width, height), (width, height), (width * 0.88, -height * 0.35), (0.0, -height), (-width * 0.88, -height * 0.35)]
    verts = [(x + vx, y - depth, z + vz) for vx, vz in verts_2d] + [(x + vx, y + depth, z + vz) for vx, vz in verts_2d]
    count = len(verts_2d)
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    bevel(obj, 0.0022, 3)
    return obj


def create_soft_armor_backing(material):
    top_z, bottom_z = 1.452, 1.240
    top_w, bottom_w = 0.118, 0.094
    y, depth = -0.204, 0.0025
    front = [(-top_w, y - depth, top_z), (top_w, y - depth, top_z), (bottom_w, y - depth, bottom_z), (-bottom_w, y - depth, bottom_z)]
    back = [(-top_w, y + depth, top_z), (top_w, y + depth, top_z), (bottom_w, y + depth, bottom_z), (-bottom_w, y + depth, bottom_z)]
    verts = front + back
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    mesh = bpy.data.meshes.new("LiuBeiV2_Soft_Armor_Backing_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("LiuBeiV2_Soft_Armor_Backing", mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    bevel(obj, 0.004, 3)
    return obj


def rebuild_costume_fit(materials):
    remove_matching("LiuBei_Soft_Lamella_", "LiuBei_Lamella_Rivet_", "LiuBeiV2_Chest_Scale_", "LiuBeiV2_Chest_Cord_", "V35_Sleeve_")

    # New sleeves follow the actual posed upper-arm bones instead of the old
    # static Guan Yu volumes.
    sleeves = (
        ("L", Vector((0.205, -0.010, 1.425)), Vector((0.395, -0.094, 1.286)), 0.092, 0.060),
        ("R", Vector((-0.205, -0.010, 1.425)), Vector((-0.160, -0.050, 1.178)), 0.092, 0.058),
    )
    for label, shoulder, elbow, radius_shoulder, radius_elbow in sleeves:
        cone_between(f"LiuBeiV2_Fitted_Yellow_Sleeve_{label}", shoulder, elbow, radius_shoulder, radius_elbow, materials["yellow"], 64)
        direction = (elbow - shoulder).normalized()
        cylinder_between(f"LiuBeiV2_Sleeve_Gold_Cuff_{label}", elbow - direction * 0.010, elbow + direction * 0.010, radius_elbow + 0.004, materials["gold"], 56)
    # Overlapping pointed scales read as flexible soft armour, not a grid of
    # chocolate-bar squares.
    create_soft_armor_backing(materials["armor_back"])
    for row in range(5):
        columns = 6
        z = 1.420 - row * 0.034
        for col in range(columns):
            x = (col - (columns - 1) / 2) * 0.034
            y = -0.211 + 0.012 * (x / 0.18) ** 2 - row * 0.0004
            plate = create_scale_plate(f"LiuBeiV2_Chest_Scale_{row}_{col}", (x, y, z), 0.0125, 0.0110, 0.0028, materials["armor"])
            if (row + col) % 4 == 0:
                sphere(f"LiuBeiV2_Chest_Scale_Rivet_{row}_{col}", (x, y - 0.0044, z + 0.006), (0.0020, 0.0010, 0.0020), materials["gold"], 20, 10)


def improve_grips_and_hands(materials):
    rig = bpy.data.objects.get("Liu_Bei_Game_Rig")
    if rig:
        # Tighten only the first two joints; retain the natural stagger already
        # present in v1 so the hands do not become identical fists.
        for side, sign in (("l", 1.0), ("r", -1.0)):
            for finger in ("index", "middle", "ring", "pinky"):
                for joint, delta in (("01", 0.08), ("02", 0.10)):
                    bone = rig.pose.bones.get(f"{finger}_{joint}_{side}")
                    if bone:
                        bone.rotation_euler.x += sign * delta
            thumb = rig.pose.bones.get(f"thumb_02_{side}")
            if thumb:
                thumb.rotation_euler.x += sign * 0.07
        bpy.context.view_layer.update()

    # Visible leather wraps pass through the palm centres and eliminate the
    # apparent empty C-shape around the original hidden grips.
    male_hand = Vector((-0.335, -0.188, 1.055))
    male_dir = Vector((-0.220, 0.030, -0.950)).normalized()
    female_hand = Vector((0.285, -0.258, 1.105))
    female_dir = Vector((0.365, 0.040, -0.970)).normalized()
    for label, hand, direction in (("Male", male_hand, male_dir), ("Female", female_hand, female_dir)):
        cylinder_between(f"LiuBeiV2_{label}_Visible_Grip", hand - direction * 0.040, hand + direction * 0.043, 0.0125, materials["leather"], 40)
        for index, t in enumerate((-0.024, 0.0, 0.024)):
            point = hand + direction * t
            cylinder_between(f"LiuBeiV2_{label}_Grip_Gold_Wrap_{index}", point - direction * 0.0022, point + direction * 0.0022, 0.0132, materials["gold"], 32)


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
    sculpt_face_v2()
    tune_skin_v2()
    rebuild_eyes_brows_and_lips(materials)
    rebuild_hairline_and_beard(materials)
    rebuild_costume_fit(materials)
    improve_grips_and_hands(materials)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.25
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
