"""Refine Guan Yu v31 with anatomical face sculpting and physical skin detail."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, look_at, mat, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v31.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v32.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v32-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v32-three-quarter.png"
FACE = SRC / "guan-yu-reference-fullbody-v32-face.png"


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def sculpt_facial_anatomy(body):
    """Add a restrained secondary sculpt without replacing the established likeness."""
    if body.data.shape_keys and "V32 facial anatomy sculpt" in body.data.shape_keys.key_blocks:
        key = body.data.shape_keys.key_blocks["V32 facial anatomy sculpt"]
    else:
        key = body.shape_key_add(name="V32 facial anatomy sculpt", from_mix=False)
    key.value = 1.0

    for point in key.data:
        co = point.co
        if co.y > -0.075 or not 1.548 < co.z < 1.720 or abs(co.x) > 0.125:
            continue

        # Stronger cheek plane and a slightly leaner hollow below it.
        if 0.046 < abs(co.x) < 0.102 and 1.635 < co.z < 1.675:
            weight = max(0.0, 1.0 - abs(co.z - 1.653) / 0.021)
            co.y -= 0.0019 * weight
        if 0.042 < abs(co.x) < 0.094 and 1.602 < co.z < 1.634:
            weight = max(0.0, 1.0 - abs(co.z - 1.618) / 0.017)
            co.y += 0.0015 * weight

        # Heavier lids wrap the eyeball and reduce the remaining doll-like opening.
        for eye_center in (-0.047, 0.047):
            eye_x = abs(co.x - eye_center)
            if eye_x < 0.039:
                horizontal = 1.0 - eye_x / 0.039
                if 1.675 < co.z < 1.696:
                    vertical = max(0.0, 1.0 - abs(co.z - 1.685) / 0.011)
                    co.z -= 0.00225 * horizontal * vertical
                    co.y -= 0.00085 * horizontal * vertical
                if 1.654 < co.z < 1.674:
                    vertical = max(0.0, 1.0 - abs(co.z - 1.664) / 0.010)
                    co.z += 0.00105 * horizontal * vertical
                    co.y -= 0.00045 * horizontal * vertical
                if abs(co.x) > abs(eye_center) and 1.660 < co.z < 1.690:
                    co.z += 0.00045 * (eye_x / 0.039)

        # Brow shelf and glabella retain Guan Yu's severe expression.
        if 0.018 < abs(co.x) < 0.096 and 1.692 < co.z < 1.716:
            weight = max(0.0, 1.0 - abs(co.z - 1.704) / 0.012)
            co.y -= 0.0013 * weight
        if abs(co.x) < 0.024 and 1.672 < co.z < 1.705:
            co.z -= 0.0010 * (1.0 - abs(co.x) / 0.024)

        # More structured nose: projected bridge/tip, wider alae and recessed nostril plane.
        if abs(co.x) < 0.025 and 1.615 < co.z < 1.684:
            co.y -= 0.0021 * (1.0 - abs(co.x) / 0.025)
        if abs(co.x) < 0.021 and 1.598 < co.z < 1.626:
            co.y -= 0.0023 * (1.0 - abs(co.x) / 0.021)
        if 0.018 < abs(co.x) < 0.047 and 1.594 < co.z < 1.621:
            co.x *= 1.037
            co.y -= 0.00065
        if 0.010 < abs(co.x) < 0.030 and 1.591 < co.z < 1.607:
            co.y += 0.0010

        # A firmer philtrum and asymmetric, slightly downturned mouth.
        if abs(co.x) < 0.009 and 1.579 < co.z < 1.609:
            co.y += 0.00075
        if abs(co.x) < 0.027 and 1.574 < co.z < 1.592:
            co.y -= 0.00085
        if 0.030 < abs(co.x) < 0.064 and 1.572 < co.z < 1.600:
            co.z -= 0.0010
            co.y += 0.00045

        # Tiny real asymmetries are visible only at portrait distance.
        if co.x > 0 and 1.654 < co.z < 1.694:
            co.z -= 0.00025
        if co.x < -0.040 and 1.615 < co.z < 1.666:
            co.y -= 0.00035
        if abs(co.x) < 0.022 and 1.594 < co.z < 1.632:
            co.x += 0.00035 * (1.0 - abs(co.x) / 0.022)


def add_face_microdisplacement(body):
    group_name = "V32 face microdetail mask"
    group = body.vertex_groups.get(group_name) or body.vertex_groups.new(name=group_name)
    all_indices = [vertex.index for vertex in body.data.vertices]
    if all_indices:
        try:
            group.remove(all_indices)
        except RuntimeError:
            pass
    for vertex in body.data.vertices:
        co = vertex.co
        if co.y > -0.075 or abs(co.x) >= 0.125 or not 1.535 < co.z < 1.720:
            continue
        x_fade = min(1.0, max(0.0, (0.125 - abs(co.x)) / 0.028))
        lower_fade = min(1.0, max(0.0, (co.z - 1.535) / 0.030))
        upper_fade = min(1.0, max(0.0, (1.720 - co.z) / 0.025))
        weight = x_fade * lower_fade * upper_fade
        if weight > 0.01:
            group.add([vertex.index], weight, "REPLACE")

    texture = bpy.data.textures.get("V32 irregular skin surface") or bpy.data.textures.new(
        "V32 irregular skin surface", type="CLOUDS"
    )
    texture.noise_scale = 0.0055
    texture.noise_depth = 2
    texture.noise_type = "SOFT_NOISE"
    texture.noise_basis = "IMPROVED_PERLIN"

    modifier = body.modifiers.get("V32 physical facial pores") or body.modifiers.new(
        "V32 physical facial pores", "DISPLACE"
    )
    modifier.texture = texture
    modifier.texture_coords = "LOCAL"
    modifier.direction = "NORMAL"
    modifier.vertex_group = group_name
    modifier.strength = 0.00042
    modifier.mid_level = 0.50


def refine_eye_material_and_details():
    eye_material = bpy.data.materials.get("Guan_Yu_Basemesh.low-poly")
    if eye_material and eye_material.use_nodes:
        nodes = eye_material.node_tree.nodes
        shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.22
            shader.inputs["Coat Weight"].default_value = 0.12
            shader.inputs["Coat Roughness"].default_value = 0.10
        neutralize = nodes.get("Neutralize bloodshot stock eye texture")
        if neutralize:
            neutralize.inputs["Saturation"].default_value = 0.40
            neutralize.inputs["Value"].default_value = 0.88

    eye_mesh = bpy.data.objects.get("Guan_Yu_Basemesh.low-poly")
    if eye_mesh:
        eye_mesh.scale.y = 0.985

    for side in (-1, 1):
        nostril = bpy.data.objects.get(f"V31_Nostril_{side:+d}")
        if nostril:
            nostril.location.y -= 0.0017
            nostril.scale = (1.13, 1.18, 1.10)
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.location.y += 0.0012
            iris.location.z -= 0.00015 if side > 0 else 0.0
            iris.scale.x = 0.96
            iris.scale.z = 0.96
        if pupil:
            pupil.location.y += 0.00135
            pupil.location.z -= 0.00015 if side > 0 else 0.0


def strengthen_heroic_brows():
    deep = bpy.data.materials.get("V31 natural deep black hair")
    if not deep:
        return
    for obj in bpy.data.objects:
        if obj.type == "CURVE" and obj.name.startswith("Portrait_Brow_") and "Furrow" not in obj.name:
            obj.data.bevel_depth *= 1.10

    remove_prefixes("V32_Brow_Density_")
    rng = random.Random(32032)
    for side in (-1, 1):
        for index in range(16):
            offset = rng.uniform(-0.0025, 0.0025)
            brow = strand(
                f"V32_Brow_Density_{side:+d}_{index:02}",
                [
                    (side * rng.uniform(0.069, 0.078), -0.1585, 1.6955 + offset),
                    (side * rng.uniform(0.041, 0.048), -0.1640, 1.6990 + offset * 0.45),
                    (side * rng.uniform(0.009, 0.015), -0.1610, 1.6815 + offset * 0.25),
                ],
                rng.uniform(0.00024, 0.00044),
                deep,
            )
            for spline in brow.data.splines:
                for point in spline.bezier_points:
                    point.handle_left_type = "VECTOR"
                    point.handle_right_type = "VECTOR"


def add_headcloth_tailoring():
    remove_prefixes("V32_Headcloth_Seam_")
    seam = mat("V32 dark hand-stitched headcloth seam", (0.004, 0.010, 0.006, 1), 0.78, noise=55, bump=0.02)
    paths = [
        (
            "Center",
            [
                (0.000, -0.153, 1.713),
                (0.000, -0.148, 1.742),
                (0.000, -0.108, 1.772),
                (0.000, -0.045, 1.784),
                (0.000, 0.012, 1.771),
            ],
            0.00072,
        ),
        (
            "LeftFold",
            [(-0.061, -0.139, 1.713), (-0.067, -0.106, 1.744), (-0.056, -0.055, 1.768)],
            0.00040,
        ),
        (
            "RightFold",
            [(0.061, -0.139, 1.713), (0.067, -0.106, 1.744), (0.056, -0.055, 1.768)],
            0.00040,
        ),
    ]
    for label, points, radius in paths:
        seam_obj = strand(f"V32_Headcloth_Seam_{label}", points, radius, seam, taper=False)
        for spline in seam_obj.data.splines:
            for point in spline.bezier_points:
                point.handle_left_type = "VECTOR"
                point.handle_right_type = "VECTOR"


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
    sculpt_facial_anatomy(body)
    add_face_microdisplacement(body)
    refine_eye_material_and_details()
    strengthen_heroic_brows()
    add_headcloth_tailoring()

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
