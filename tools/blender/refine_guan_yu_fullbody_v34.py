"""Begin the Guan Yu high-model rebuild from the stable v33 blockout.

This pass concentrates detail where the portrait camera is least forgiving:
facial planes, narrowed stern eyes, bronze skin response, a layered beard groom,
and a properly wrapped dark-jade Guan Yu headcloth.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v33.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v34.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v34-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v34-three-quarter.png"
FACE = SRC / "guan-yu-reference-fullbody-v34-face.png"


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def sculpt_high_model_face(body):
    """Push the MPFB head toward the supplied angular, mature Guan Yu portrait."""
    key = body.shape_key_add(name="V34 high model facial rebuild", from_mix=False)
    key.value = 1.0

    for point in key.data:
        co = point.co
        if co.y > -0.070 or not 1.525 < co.z < 1.730 or abs(co.x) > 0.135:
            continue

        ax = abs(co.x)

        # A broad warrior skull, high cheek plane and leaner lower cheek.
        if 0.055 < ax < 0.116 and 1.660 < co.z < 1.715:
            co.x *= 1.022
        if 0.047 < ax < 0.108 and 1.628 < co.z < 1.671:
            cheek = max(0.0, 1.0 - abs(co.z - 1.651) / 0.023)
            co.x *= 1.035
            co.y -= 0.0038 * cheek
        if 0.043 < ax < 0.098 and 1.594 < co.z < 1.632:
            hollow = max(0.0, 1.0 - abs(co.z - 1.614) / 0.020)
            co.y += 0.0032 * hollow

        # Square and weight the jaw so it does not disappear beneath the beard.
        if 0.035 < ax < 0.104 and 1.535 < co.z < 1.595:
            jaw = max(0.0, 1.0 - abs(co.z - 1.565) / 0.031)
            co.x *= 1.075 + 0.035 * jaw
            co.y -= 0.0018 * jaw
        if ax < 0.055 and 1.530 < co.z < 1.563:
            co.z -= 0.0022 * (1.0 - ax / 0.055)
            co.y -= 0.0022 * (1.0 - ax / 0.055)

        # Strong straight nose bridge, defined tip and mature nasal wings.
        if ax < 0.026 and 1.621 < co.z < 1.690:
            bridge = 1.0 - ax / 0.026
            co.y -= 0.0044 * bridge
            co.x *= 0.985
        if ax < 0.023 and 1.596 < co.z < 1.628:
            tip = max(0.0, 1.0 - abs(co.z - 1.612) / 0.017)
            co.y -= 0.0048 * tip * (1.0 - ax / 0.023)
        if 0.020 < ax < 0.048 and 1.592 < co.z < 1.621:
            wing = max(0.0, 1.0 - abs(co.z - 1.607) / 0.015)
            co.x *= 1.055 + 0.030 * wing
            co.y -= 0.0011 * wing
        if 0.010 < ax < 0.030 and 1.590 < co.z < 1.606:
            co.y += 0.0012

        # Heavy brow shelf and a deep central frown, matching the portrait.
        if 0.014 < ax < 0.100 and 1.691 < co.z < 1.718:
            brow = max(0.0, 1.0 - abs(co.z - 1.704) / 0.014)
            co.y -= 0.0035 * brow
        if ax < 0.023 and 1.674 < co.z < 1.711:
            furrow = max(0.0, 1.0 - ax / 0.023)
            co.y += 0.0015 * furrow
            co.z -= 0.0015 * furrow

        # Close the round eye opening into an older, narrower, upturned gaze.
        for eye_center in (-0.047, 0.047):
            dx = abs(co.x - eye_center)
            if dx >= 0.041:
                continue
            horizontal = 1.0 - dx / 0.041
            if 1.674 < co.z < 1.696:
                upper = max(0.0, 1.0 - abs(co.z - 1.684) / 0.011)
                co.z -= 0.0041 * horizontal * upper
                co.y -= 0.0010 * horizontal * upper
            if 1.651 < co.z < 1.673:
                lower = max(0.0, 1.0 - abs(co.z - 1.663) / 0.011)
                co.z += 0.0020 * horizontal * lower
                co.y -= 0.0006 * horizontal * lower
            if ax > abs(eye_center) and 1.658 < co.z < 1.690:
                co.z += 0.0018 * (dx / 0.041)

        # Under-eye volume and nasolabial structure are modeled, not painted on.
        for eye_center in (-0.047, 0.047):
            dx = abs(co.x - eye_center)
            if dx < 0.038 and 1.637 < co.z < 1.658:
                bag = (dx / 0.038) ** 2 + ((co.z - 1.648) / 0.011) ** 2
                if bag < 1.0:
                    co.y -= 0.0017 * (1.0 - bag)
        if 1.572 < co.z < 1.633:
            progress = (1.633 - co.z) / 0.061
            for side in (-1, 1):
                fold_x = side * (0.031 + 0.030 * progress)
                distance = abs(co.x - fold_x)
                if distance < 0.0065:
                    co.y += 0.0018 * (1.0 - distance / 0.0065)
                elif distance < 0.014:
                    co.y -= 0.0008 * (1.0 - (distance - 0.0065) / 0.0075)

        # Firm philtrum, compressed lips and a visibly downturned mouth corner.
        if ax < 0.010 and 1.577 < co.z < 1.608:
            co.y += 0.0012
        if ax < 0.031 and 1.570 < co.z < 1.591:
            co.y -= 0.0009
        if 0.030 < ax < 0.068 and 1.568 < co.z < 1.600:
            co.z -= 0.0023
            co.y += 0.0010

        # Minute imbalance prevents the rebuilt face from reading as procedural.
        if co.x > 0.026 and 1.648 < co.z < 1.695:
            co.z -= 0.00035
        if co.x < -0.042 and 1.605 < co.z < 1.665:
            co.y -= 0.00042


def narrow_and_tune_eyes():
    eye_mesh = bpy.data.objects.get("Guan_Yu_Basemesh.low-poly")
    if eye_mesh and eye_mesh.type == "MESH":
        for vertex in eye_mesh.data.vertices:
            co = vertex.co
            for eye_center in (-0.047, 0.047):
                if abs(co.x - eye_center) < 0.034 and 1.638 < co.z < 1.707:
                    co.z = 1.674 + (co.z - 1.674) * 0.88
        eye_mesh.data.update()

    for side in (-1, 1):
        for prefix in ("V31_Eye_Dark_Iris_", "Portrait_Dark_Iris_"):
            iris = bpy.data.objects.get(f"{prefix}{side:+d}") or bpy.data.objects.get(f"{prefix}{side}")
            if iris:
                iris.scale.z *= 0.86
                iris.scale.x *= 0.98
                iris.location.z = 1.6735
        for prefix in ("V31_Eye_Pupil_", "Portrait_Pupil_"):
            pupil = bpy.data.objects.get(f"{prefix}{side:+d}") or bpy.data.objects.get(f"{prefix}{side}")
            if pupil:
                pupil.scale.z *= 0.86
                pupil.scale.x *= 0.95
                pupil.location.z = 1.6735

    iris_material = bpy.data.materials.get("V31 deep brown iris")
    if iris_material and iris_material.use_nodes:
        iris_shader = next(
            (node for node in iris_material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None
        )
        if iris_shader:
            iris_shader.inputs["Base Color"].default_value = (0.0035, 0.0012, 0.00045, 1)
            iris_shader.inputs["Roughness"].default_value = 0.31

    deep = bpy.data.materials.get("V31 natural deep black hair")
    if deep:
        remove_prefixes("V34_Upper_Lid_")
        for side in (-1, 1):
            points = [
                (side * 0.014, -0.1718, 1.6768),
                (side * 0.034, -0.1742, 1.6810),
                (side * 0.056, -0.1740, 1.6818),
                (side * 0.078, -0.1690, 1.6810),
            ]
            lid = strand(f"V34_Upper_Lid_{side:+d}", points, 0.00048, deep, taper=True)
            for spline in lid.data.splines:
                for point in spline.bezier_points:
                    point.handle_left_type = "AUTO"
                    point.handle_right_type = "AUTO"


def tune_skin_material():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return
    shader.inputs["Roughness"].default_value = 0.54
    shader.inputs["Subsurface Weight"].default_value = 0.022
    if "Subsurface Scale" in shader.inputs:
        shader.inputs["Subsurface Scale"].default_value = 0.022
    shader.inputs["Specular IOR Level"].default_value = 0.34

    base = shader.inputs["Base Color"]
    source = base.links[0].from_socket if base.is_linked else None
    if source:
        links.remove(base.links[0])
        bronze = nodes.new("ShaderNodeMixRGB")
        bronze.name = "V34 weathered bronze complexion"
        bronze.blend_type = "MULTIPLY"
        bronze.inputs["Fac"].default_value = 0.42
        bronze.inputs[2].default_value = (0.20, 0.070, 0.030, 1)
        links.new(source, bronze.inputs[1])
        desaturate = nodes.new("ShaderNodeHueSaturation")
        desaturate.name = "V34 restrained mature skin color"
        desaturate.inputs["Saturation"].default_value = 0.82
        desaturate.inputs["Value"].default_value = 0.90
        links.new(bronze.outputs["Color"], desaturate.inputs["Color"])
        links.new(desaturate.outputs["Color"], base)

    pores = body_modifier = bpy.data.objects["Guan_Yu_Basemesh"].modifiers.get("V32 physical facial pores")
    if pores:
        pores.strength = 0.00052


def groom_material(name, color, roughness, anisotropy):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Specular IOR Level"].default_value = 0.26
    if "Anisotropic IOR Level" in shader.inputs:
        shader.inputs["Anisotropic IOR Level"].default_value = anisotropy
    elif "Anisotropic" in shader.inputs:
        shader.inputs["Anisotropic"].default_value = anisotropy
    shader.inputs["Coat Weight"].default_value = 0.035
    shader.inputs["Coat Roughness"].default_value = 0.34
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def curve_bundle(name, paths, material, radius):
    curve_data = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 1
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 2
    curve_data.resolution_u = 2
    curve_data.use_fill_caps = False
    for path, width in paths:
        spline = curve_data.splines.new("NURBS")
        spline.points.add(len(path) - 1)
        for index, coordinates in enumerate(path):
            point = spline.points[index]
            point.co = (*coordinates, 1.0)
            t = index / max(1, len(path) - 1)
            point.radius = width * (1.0 - 0.86 * t) + 0.045
        spline.order_u = min(3, len(path))
        spline.use_endpoint_u = True
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def beard_path(root_x, root_y, root_z, tip_x, tip_z, wave, phase, points=7):
    path = []
    for index in range(points):
        t = index / (points - 1)
        ease = t * t * (3.0 - 2.0 * t)
        x = root_x + (tip_x - root_x) * ease
        x += math.sin(phase + t * math.pi * 1.65) * wave * math.sin(math.pi * t)
        y = root_y - 0.060 * math.sin(math.pi * t) - 0.022 * t
        y += math.cos(phase * 0.7 + t * math.pi * 1.2) * wave * 0.22 * t
        z = root_z + (tip_z - root_z) * t
        z += math.sin(phase * 0.55 + t * math.pi * 1.4) * wave * 0.20 * math.sin(math.pi * t)
        path.append((x, y, z))
    return path


def build_layered_beard_groom():
    remove_prefixes(
        "Portrait_Beard_",
        "Portrait_Side_Beard_",
        "Portrait_Chin_Fiber_",
        "Portrait_Moustache_",
        "V31_Beard_Flyaway_",
        "V34_Groom_",
    )

    deep = groom_material("V34 groom deep black", (0.0011, 0.00065, 0.00042, 1), 0.46, 0.70)
    warm = groom_material("V34 groom warm black", (0.0058, 0.0021, 0.0009, 1), 0.50, 0.64)
    age = groom_material("V34 groom charcoal age", (0.025, 0.020, 0.016, 1), 0.56, 0.58)
    rng = random.Random(340134)
    palettes = {"deep": [], "warm": [], "age": []}

    # Broad chin mass: multiple lengths and a subtle lateral wind avoid a curtain silhouette.
    for index in range(840):
        root_x = rng.triangular(-0.088, 0.088, 0.0)
        side = min(1.0, abs(root_x) / 0.088)
        root_z = rng.triangular(1.548, 1.590, 1.575) - side * 0.012
        root_y = -0.166 + abs(root_x) * 0.27 + rng.uniform(-0.004, 0.003)
        if rng.random() < 0.27:
            tip_z = rng.uniform(1.205, 1.390) + side * 0.045
        else:
            tip_z = rng.uniform(0.985, 1.155) + side**1.55 * 0.095
        lock_index = min(3, max(0, int((root_x + 0.088) / 0.044)))
        lock_center = (-0.048, -0.010, 0.030, 0.072)[lock_index]
        wind = rng.uniform(0.014, 0.036) * (0.45 + 0.55 * (1.0 - side))
        tip_x = lock_center * rng.uniform(0.52, 0.84) + wind + rng.uniform(-0.021, 0.021)
        wave = rng.uniform(0.0035, 0.0130)
        phase = rng.uniform(0.0, math.tau)
        width = rng.uniform(0.62, 1.45)
        selector = rng.random()
        palette = "age" if selector < 0.025 else "warm" if selector < 0.20 else "deep"
        palettes[palette].append((beard_path(root_x, root_y, root_z, tip_x, tip_z, wave, phase), width))

    # Side beard grows from the jaw and merges into the long center mass.
    for side_sign in (-1, 1):
        for index in range(190):
            root_x = side_sign * rng.uniform(0.058, 0.103)
            root_z = rng.uniform(1.555, 1.654)
            root_y = -0.143 + abs(root_x) * 0.10 + rng.uniform(-0.004, 0.004)
            tip_z = rng.uniform(1.115, 1.315)
            tip_x = side_sign * rng.uniform(0.018, 0.070) + rng.uniform(0.006, 0.030)
            path = beard_path(
                root_x,
                root_y,
                root_z,
                tip_x,
                tip_z,
                rng.uniform(0.004, 0.012),
                rng.uniform(0.0, math.tau),
                6,
            )
            selector = rng.random()
            palette = "age" if selector < 0.025 else "warm" if selector < 0.18 else "deep"
            palettes[palette].append((path, rng.uniform(0.52, 1.25)))

    for palette, material in (("deep", deep), ("warm", warm), ("age", age)):
        curve_bundle(f"V34_Groom_Beard_{palette}", palettes[palette], material, 0.00033)

    # Dense moustache fibers sweep into the side beard instead of forming two tubes.
    moustache = {"deep": [], "warm": [], "age": []}
    for side_sign in (-1, 1):
        for index in range(115):
            root_x = side_sign * rng.uniform(0.002, 0.020)
            root_z = rng.uniform(1.598, 1.612)
            end_x = side_sign * rng.uniform(0.078, 0.116) + rng.uniform(0.002, 0.014)
            end_z = rng.uniform(1.550, 1.578)
            phase = rng.uniform(0.0, math.tau)
            path = []
            for point_index in range(6):
                t = point_index / 5
                ease = t * t * (3.0 - 2.0 * t)
                path.append(
                    (
                        root_x + (end_x - root_x) * ease,
                        -0.168 - 0.015 * math.sin(math.pi * t) + rng.uniform(-0.0015, 0.0015),
                        root_z + (end_z - root_z) * t + math.sin(phase + t * math.pi) * 0.0025,
                    )
                )
            selector = rng.random()
            palette = "age" if selector < 0.020 else "warm" if selector < 0.17 else "deep"
            moustache[palette].append((path, rng.uniform(0.48, 1.08)))
    for palette, material in (("deep", deep), ("warm", warm), ("age", age)):
        curve_bundle(f"V34_Groom_Moustache_{palette}", moustache[palette], material, 0.00030)

    # Short chin transition removes the pasted-on edge between skin and long groom.
    chin_paths = []
    for index in range(180):
        root_x = rng.uniform(-0.050, 0.050)
        root_z = rng.uniform(1.562, 1.585)
        length = rng.uniform(0.070, 0.145)
        path = beard_path(
            root_x,
            -0.164 + abs(root_x) * 0.18,
            root_z,
            root_x * 0.82 + rng.uniform(-0.009, 0.012),
            root_z - length,
            rng.uniform(0.002, 0.006),
            rng.uniform(0.0, math.tau),
            5,
        )
        chin_paths.append((path, rng.uniform(0.42, 0.95)))
    curve_bundle("V34_Groom_Chin_Transition", chin_paths, deep, 0.00028)

    # A few long flyaways catch rim light and give a genuinely groomed edge.
    flyaways = []
    for index in range(38):
        side_sign = -1 if index % 2 == 0 else 1
        root_x = side_sign * rng.uniform(0.028, 0.090)
        root_z = rng.uniform(1.525, 1.590)
        tip_x = root_x + side_sign * rng.uniform(0.035, 0.105) + rng.uniform(0.010, 0.040)
        tip_z = rng.uniform(1.035, 1.360)
        flyaways.append(
            (
                beard_path(root_x, -0.174, root_z, tip_x, tip_z, rng.uniform(0.010, 0.025), rng.random() * math.tau),
                rng.uniform(0.28, 0.62),
            )
        )
    curve_bundle("V34_Groom_Flyaways", flyaways, warm, 0.00024)


def woven_headcloth_material():
    material = bpy.data.materials.get("V34 dark jade woven headcloth") or bpy.data.materials.new(
        "V34 dark jade woven headcloth"
    )
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.72
    if "Sheen Weight" in shader.inputs:
        shader.inputs["Sheen Weight"].default_value = 0.18
        shader.inputs["Sheen Roughness"].default_value = 0.62
    coordinates = nodes.new("ShaderNodeTexCoord")
    texture = nodes.new("ShaderNodeTexNoise")
    texture.inputs["Scale"].default_value = 12.0
    texture.inputs["Detail"].default_value = 4.0
    texture.inputs["Roughness"].default_value = 0.70
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.0018, 0.0090, 0.0038, 1)
    ramp.color_ramp.elements[1].color = (0.0090, 0.0440, 0.0170, 1)
    ramp.color_ramp.elements[0].position = 0.23
    ramp.color_ramp.elements[1].position = 0.78
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 165.0
    wave.inputs["Distortion"].default_value = 2.8
    wave.inputs["Detail"].default_value = 3.0
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.0012
    links.new(coordinates.outputs["Generated"], texture.inputs["Vector"])
    links.new(coordinates.outputs["Generated"], wave.inputs["Vector"])
    links.new(texture.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def tailor_headcloth():
    woven = woven_headcloth_material()
    for name in (
        "Portrait_Fitted_Headcloth",
        "Curved_Cloth_Diadem",
        "Headcloth_Long_Tail_-1",
        "Headcloth_Long_Tail_1",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, woven)

    # v33 flattened the cap silhouette without moving the scalp.  Give the
    # tailored shell real clearance so skin cannot poke through under Cycles.
    headcloth = bpy.data.objects.get("Portrait_Fitted_Headcloth")
    if headcloth and headcloth.type == "MESH":
        for vertex in headcloth.data.vertices:
            vertex.co.x *= 1.035
            vertex.co.y = -0.020 + (vertex.co.y + 0.020) * 1.035
            vertex.co.z = 1.690 + (vertex.co.z - 1.690) * 1.020 + 0.004
            if vertex.co.z > 1.714:
                lift = min(1.0, max(0.0, (vertex.co.z - 1.714) / 0.036))
                vertex.co.z += 0.012 * lift
                if vertex.co.y < -0.090:
                    vertex.co.y -= 0.0045 * lift
        headcloth.data.update()
        solidify = next((modifier for modifier in headcloth.modifiers if modifier.type == "SOLIDIFY"), None)
        if solidify:
            solidify.thickness = 0.020

    # The old large diamond crest dominated the face; make it a restrained Han ornament.
    for name in ("Headcloth_Imperial_Cloud_Crest", "Headcloth_Crest_Jade_Inlay"):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "MESH":
            for vertex in obj.data.vertices:
                vertex.co.x *= 0.73
                vertex.co.z = 1.720 + (vertex.co.z - 1.720) * 0.73
            obj.data.update()
    for obj in bpy.data.objects:
        if obj.name.startswith("Headcloth_Gold_Stud_"):
            obj.location.x *= 0.86
            obj.scale *= 0.78
        elif obj.name.startswith("Headcloth_Cloud_Filigree_") and obj.type == "CURVE":
            for spline in obj.data.splines:
                for point in spline.bezier_points:
                    point.co.x *= 0.84
                    point.co.z = 1.720 + (point.co.z - 1.720) * 0.78

    remove_prefixes("V34_Headcloth_Fold_")
    fold_material = mat("V34 headcloth recessed fold", (0.0025, 0.010, 0.004, 1), 0.80)
    fold_paths = [
        [(0.000, -0.154, 1.709), (0.000, -0.132, 1.738), (0.000, -0.078, 1.762), (0.000, -0.010, 1.758)],
        [(-0.050, -0.143, 1.711), (-0.060, -0.112, 1.740), (-0.055, -0.058, 1.758), (-0.037, 0.008, 1.750)],
        [(0.050, -0.143, 1.711), (0.060, -0.112, 1.740), (0.055, -0.058, 1.758), (0.037, 0.008, 1.750)],
        [(-0.079, -0.126, 1.707), (-0.085, -0.085, 1.733), (-0.074, -0.025, 1.748)],
        [(0.079, -0.126, 1.707), (0.085, -0.085, 1.733), (0.074, -0.025, 1.748)],
    ]
    for index, points in enumerate(fold_paths):
        fold = strand(f"V34_Headcloth_Fold_{index:02}", points, 0.00048 if index else 0.00062, fold_material, taper=True)
        for spline in fold.data.splines:
            for point in spline.bezier_points:
                point.handle_left_type = "AUTO"
                point.handle_right_type = "AUTO"


def build_head_hair_groom():
    """Replace the old rigid side curtains with layered temple and back hair."""
    remove_prefixes("Portrait_Head_Hair_", "V34_Groom_Head_Hair_")
    deep = bpy.data.materials.get("V34 groom deep black")
    warm = bpy.data.materials.get("V34 groom warm black")
    age = bpy.data.materials.get("V34 groom charcoal age")
    if not all((deep, warm, age)):
        return
    rng = random.Random(340220)
    palettes = {"deep": [], "warm": [], "age": []}
    for side_sign in (-1, 1):
        for index in range(280):
            root_x = side_sign * rng.uniform(0.067, 0.103)
            root_y = rng.uniform(-0.096, -0.020)
            root_z = rng.uniform(1.640, 1.711)
            length = rng.uniform(0.265, 0.515)
            end_z = root_z - length
            end_x = side_sign * rng.uniform(0.075, 0.145) + rng.uniform(0.012, 0.042)
            phase = rng.uniform(0.0, math.tau)
            wave = rng.uniform(0.004, 0.014)
            path = []
            for point_index in range(7):
                t = point_index / 6
                ease = t * t * (3.0 - 2.0 * t)
                path.append(
                    (
                        root_x + (end_x - root_x) * ease
                        + math.sin(phase + t * math.pi * 1.7) * wave * math.sin(math.pi * t),
                        root_y - 0.028 * math.sin(math.pi * t) + rng.uniform(-0.001, 0.001),
                        root_z + (end_z - root_z) * t,
                    )
                )
            selector = rng.random()
            palette = "age" if selector < 0.018 else "warm" if selector < 0.14 else "deep"
            palettes[palette].append((path, rng.uniform(0.52, 1.18)))
    for palette, material in (("deep", deep), ("warm", warm), ("age", age)):
        curve_bundle(f"V34_Groom_Head_Hair_{palette}", palettes[palette], material, 0.00029)


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
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    sculpt_high_model_face(body)
    narrow_and_tune_eyes()
    tune_skin_material()
    build_layered_beard_groom()
    tailor_headcloth()
    build_head_hair_groom()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.28
    camera = scene.camera

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72)
    render(scene, camera, THREE_QUARTER, (1100, 1600), (1.50, -6.18, 1.28), (-0.08, -0.02, 1.16), 72)
    render(scene, camera, FACE, (1100, 1100), (0.48, -2.30, 1.62), (0.0, -0.095, 1.50), 96)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"FACE={FACE}")


if __name__ == "__main__":
    main()
