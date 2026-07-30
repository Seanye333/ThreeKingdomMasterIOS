"""Refine Guan Yu v30 facial realism, hair breakup, eyes and headcloth."""

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
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v30.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v31.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v31-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v31-three-quarter.png"
FACE = SRC / "guan-yu-reference-fullbody-v31-face.png"


def stable_seed(name):
    return sum((index + 1) * ord(character) for index, character in enumerate(name))


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def principled_hair_material(name, color, roughness, radial_roughness, coat=0.08):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    hair = nodes.new("ShaderNodeBsdfPrincipled")
    hair.inputs["Base Color"].default_value = color
    hair.inputs["Roughness"].default_value = roughness
    hair.inputs["Specular IOR Level"].default_value = 0.23
    if "Anisotropic IOR Level" in hair.inputs:
        hair.inputs["Anisotropic IOR Level"].default_value = 0.36
    elif "Anisotropic" in hair.inputs:
        hair.inputs["Anisotropic"].default_value = 0.36
    hair.inputs["Coat Weight"].default_value = coat
    hair.inputs["Coat Roughness"].default_value = radial_roughness
    links.new(hair.outputs["BSDF"], output.inputs["Surface"])
    return material


def hair_palette():
    return (
        principled_hair_material(
            "V31 natural deep black hair",
            (0.0015, 0.0008, 0.0005, 1),
            0.50,
            0.62,
            0.025,
        ),
        principled_hair_material(
            "V31 warm black-brown hair",
            (0.0045, 0.0018, 0.0008, 1),
            0.53,
            0.64,
            0.020,
        ),
        principled_hair_material(
            "V31 charcoal age strands",
            (0.022, 0.017, 0.013, 1),
            0.58,
            0.67,
            0.015,
        ),
    )


def curve_points(spline):
    return spline.bezier_points if spline.type == "BEZIER" else spline.points


def assign_hair_variation(obj, deep, warm, charcoal):
    seed = stable_seed(obj.name)
    selector = seed % 100
    if selector < 3:
        assign(obj, charcoal)
    elif selector < 18:
        assign(obj, warm)
    else:
        assign(obj, deep)


def break_up_beard_and_hair(deep, warm, charcoal):
    for obj in list(bpy.data.objects):
        if obj.type != "CURVE":
            continue
        is_main = obj.name.startswith("Portrait_Beard_")
        is_side = obj.name.startswith("Portrait_Side_Beard_")
        is_chin = obj.name.startswith("Portrait_Chin_Fiber_")
        is_moustache = obj.name.startswith("Portrait_Moustache_")
        is_brow = obj.name.startswith("Portrait_Brow_") and "Furrow" not in obj.name
        is_head = obj.name.startswith("Portrait_Head_Hair_")
        if not any((is_main, is_side, is_chin, is_moustache, is_brow, is_head)):
            continue

        assign_hair_variation(obj, deep, warm, charcoal)
        rng = random.Random(31000 + stable_seed(obj.name))
        if is_main:
            obj.data.bevel_depth *= rng.uniform(0.95, 1.05)
        elif is_side or is_head:
            obj.data.bevel_depth *= rng.uniform(0.88, 1.00)
        elif is_moustache or is_brow:
            obj.data.bevel_depth *= rng.uniform(0.74, 0.90)
        else:
            obj.data.bevel_depth *= rng.uniform(0.80, 0.94)

        if not (is_main or is_side or is_head):
            continue
        for spline in obj.data.splines:
            points = curve_points(spline)
            count = len(points)
            phase = rng.uniform(0.0, math.tau)
            amplitude = rng.uniform(0.003, 0.009) if is_main else rng.uniform(0.002, 0.006)
            for index, point in enumerate(points):
                t = index / max(count - 1, 1)
                point.co.x += math.sin(phase + t * math.tau * 1.15) * amplitude * t
                point.co.y += math.cos(phase * 0.7 + t * math.pi) * amplitude * 0.32 * t
                if spline.type == "BEZIER":
                    point.handle_left_type = "VECTOR"
                    point.handle_right_type = "VECTOR"
            if is_main and count > 2 and rng.random() < 0.10:
                # Layered shortening breaks the single triangular curtain silhouette.
                lift = rng.uniform(0.035, 0.095)
                points[-1].co.z += lift
                points[-2].co.z += lift * 0.30
                points[-1].co.x += rng.uniform(-0.020, 0.020)

    # Sparse flyaways keep the beard edge alive without turning it into fuzz.
    rng = random.Random(31415)
    for index in range(20):
        side = -1 if index % 2 == 0 else 1
        root_x = side * rng.uniform(0.030, 0.082)
        root_z = rng.uniform(1.545, 1.585)
        material = charcoal if index % 17 == 0 else warm if index % 5 == 0 else deep
        flyaway = strand(
            f"V31_Beard_Flyaway_{index:02}",
            [
                (root_x, -0.165, root_z),
                (root_x + side * rng.uniform(0.012, 0.032), -0.207, rng.uniform(1.390, 1.485)),
                (side * rng.uniform(0.070, 0.120), -0.230, rng.uniform(1.245, 1.390)),
                (side * rng.uniform(0.078, 0.145), -0.205, rng.uniform(1.130, 1.285)),
            ],
            rng.uniform(0.00014, 0.00028),
            material,
        )
        for spline in flyaway.data.splines:
            for point in spline.bezier_points:
                point.handle_left_type = "VECTOR"
                point.handle_right_type = "VECTOR"


def tune_skin_realism():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Subsurface Weight"].default_value = 0.034
        shader.inputs["Subsurface Scale"].default_value = 0.034
        shader.inputs["Specular IOR Level"].default_value = 0.39
    warm = nodes.get("Portrait warm heroic complexion")
    if warm:
        warm.inputs["Factor"].default_value = 0.76
    mottled = nodes.get("Subtle mottled skin tone")
    if mottled:
        mottled.inputs["Factor"].default_value = 0.19
    pores = nodes.get("Fine facial micro pores")
    if pores:
        pores.inputs["Scale"].default_value = 430.0
        pores.inputs["Detail"].default_value = 3.2
        pores.inputs["Roughness"].default_value = 0.68
    pore_bump = nodes.get("Micro pore normal")
    if pore_bump:
        pore_bump.inputs["Strength"].default_value = 0.085
        pore_bump.inputs["Distance"].default_value = 0.00038


def transparent_wet_material():
    material = bpy.data.materials.get("V31 clear corneal moisture") or bpy.data.materials.new(
        "V31 clear corneal moisture"
    )
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = (0.90, 0.96, 1.0, 1)
    shader.inputs["Roughness"].default_value = 0.025
    shader.inputs["IOR"].default_value = 1.376
    shader.inputs["Transmission Weight"].default_value = 0.96
    shader.inputs["Coat Weight"].default_value = 0.24
    shader.inputs["Coat Roughness"].default_value = 0.015
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def add_eye_anatomy():
    remove_prefixes("V31_Eye_", "V31_Tear_", "V31_Nostril_")
    iris = mat("V31 deep brown iris", (0.042, 0.010, 0.0025, 1), 0.27, noise=19, bump=0.025)
    pupil = mat("V31 soft black pupil", (0.0003, 0.0002, 0.00015, 1), 0.20)
    pink = mat("V31 restrained tear-duct flesh", (0.22, 0.052, 0.040, 1), 0.38, noise=35, bump=0.020)
    nostril = mat("V31 soft nostril occlusion", (0.018, 0.0025, 0.0015, 1), 0.72)
    for side in (-1, 1):
        eye_x = side * 0.047
        sphere(
            f"V31_Eye_Dark_Iris_{side:+d}",
            (eye_x, -0.1699, 1.674),
            (0.0062, 0.00075, 0.0048),
            iris,
            40,
            20,
        )
        sphere(
            f"V31_Eye_Pupil_{side:+d}",
            (eye_x + side * 0.0003, -0.17075, 1.6741),
            (0.00235, 0.00060, 0.00235),
            pupil,
            32,
            16,
        )
        sphere(
            f"V31_Tear_Duct_{side:+d}",
            (side * 0.0140, -0.1685, 1.6693),
            (0.0025, 0.00065, 0.0015),
            pink,
            28,
            14,
        )

    for side in (-1, 1):
        sphere(
            f"V31_Nostril_{side:+d}",
            (side * 0.0165, -0.1734, 1.6045),
            (0.0048, 0.00075, 0.0021),
            nostril,
            28,
            14,
        )


def woven_headcloth_material(source):
    material = source.copy()
    material.name = "V31 woven dark-jade headcloth"
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return material
    shader.inputs["Roughness"].default_value = 0.66
    old_normal = shader.inputs["Normal"].links[0].from_socket if shader.inputs["Normal"].is_linked else None
    if shader.inputs["Normal"].is_linked:
        links.remove(shader.inputs["Normal"].links[0])
    texcoord = nodes.new("ShaderNodeTexCoord")
    horizontal = nodes.new("ShaderNodeTexWave")
    horizontal.wave_type = "BANDS"
    horizontal.bands_direction = "X"
    horizontal.inputs["Scale"].default_value = 92.0
    horizontal.inputs["Distortion"].default_value = 1.4
    vertical = nodes.new("ShaderNodeTexWave")
    vertical.wave_type = "BANDS"
    vertical.bands_direction = "Z"
    vertical.inputs["Scale"].default_value = 104.0
    vertical.inputs["Distortion"].default_value = 1.1
    weave = nodes.new("ShaderNodeMath")
    weave.operation = "MULTIPLY"
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.14
    bump.inputs["Distance"].default_value = 0.0018
    links.new(texcoord.outputs["Generated"], horizontal.inputs["Vector"])
    links.new(texcoord.outputs["Generated"], vertical.inputs["Vector"])
    links.new(horizontal.outputs["Color"], weave.inputs[0])
    links.new(vertical.outputs["Color"], weave.inputs[1])
    links.new(weave.outputs["Value"], bump.inputs["Height"])
    if old_normal:
        links.new(old_normal, bump.inputs["Normal"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return material


def refine_headcloth():
    source = bpy.data.materials.get("Portrait shadow green")
    if not source:
        return
    woven = woven_headcloth_material(source)
    for name in (
        "Portrait_Fitted_Headcloth",
        "Curved_Cloth_Diadem",
        "Headcloth_Long_Tail_-1",
        "Headcloth_Long_Tail_1",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, woven)


def remove_hidden_gold_crossing_beard():
    # These old harness piping curves sit behind the beard and read as loose wire
    # wherever strand density naturally opens up.
    remove_prefixes(
        "Portrait_Harness_Gold_Inner",
        "Portrait_Harness_Gold_Outer",
        "Portrait_Inner_Collar_Gold_Piping",
    )


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
    deep, warm, charcoal = hair_palette()
    tune_skin_realism()
    break_up_beard_and_hair(deep, warm, charcoal)
    add_eye_anatomy()
    refine_headcloth()
    remove_hidden_gold_crossing_beard()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.12
    camera = scene.camera

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72)
    render(
        scene,
        camera,
        THREE_QUARTER,
        (1100, 1600),
        (1.50, -6.18, 1.28),
        (-0.08, -0.02, 1.16),
        72,
    )
    render(scene, camera, FACE, (1000, 1000), (0.03, -2.35, 1.52), (0.0, -0.08, 1.48), 92)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"FACE={FACE}")


if __name__ == "__main__":
    main()
