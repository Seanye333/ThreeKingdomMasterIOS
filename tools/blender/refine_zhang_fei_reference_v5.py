"""Zhang Fei v5: wet eyes, a readable restrained roar and detailed visible hand."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at, mat, sphere, strand
from create_zhang_fei_reference_v1 import curve_bundle


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v4.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v5.blend"
UPPER = SRC / "zhang-fei-reference-fullbody-v5-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v5-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v5-three-quarter.png"


def remove_prefix(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def transparent_material(name, color, roughness, transmission, alpha, ior):
    material = mat(name, (*color, 1.0), roughness)
    material.diffuse_color = (*color, alpha)
    shader = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Base Color"].default_value = (*color, 1.0)
        shader.inputs["Roughness"].default_value = roughness
        shader.inputs["IOR"].default_value = ior
        shader.inputs["Transmission Weight"].default_value = transmission
        shader.inputs["Alpha"].default_value = alpha
        shader.inputs["Coat Weight"].default_value = 0.18
        shader.inputs["Coat Roughness"].default_value = 0.08
    if hasattr(material, "surface_render_method"):
        try:
            material.surface_render_method = "DITHERED"
        except TypeError:
            pass
    return material


def build_wet_cornea_and_limbal_ring():
    remove_prefix("ZhangFeiV5_Eye_")
    tear = transparent_material("Zhang Fei v5 tearline", (0.82, 0.28, 0.20), 0.10, 0.38, 0.62, 1.34)
    limbal = mat("Zhang Fei v5 dark limbal ring", (0.006, 0.0012, 0.00035, 1), 0.34)

    # A separate transparent cornea shell turned milky in Eevee.  Coating the
    # existing eye surfaces gives the same wet specular response without a grey
    # film or doubled refraction.
    for material_name, coat, roughness in (
        ("Zhang Fei warm eye white", 0.24, 0.30),
        ("Zhang Fei dark amber iris", 0.42, 0.19),
        ("Zhang Fei black pupil", 0.48, 0.13),
    ):
        material = bpy.data.materials.get(material_name)
        if not material or not material.use_nodes:
            continue
        shader = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = roughness
            shader.inputs["Coat Weight"].default_value = coat
            shader.inputs["Coat Roughness"].default_value = 0.045

    for side in (-1, 1):
        eye_x = side * 0.0340
        eye_z = 1.6742
        ring = []
        for index in range(33):
            angle = math.tau * index / 32
            ring.append(
                (
                    eye_x + math.cos(angle) * 0.00735,
                    -0.14015,
                    eye_z + math.sin(angle) * 0.00635,
                )
            )
        curve_bundle(f"ZhangFeiV5_Eye_Limbal_Ring_{side:+d}", [(ring, 1.0)], limbal, 0.00022)

        lower = [
            (side * 0.0158, -0.1741, 1.6681),
            (side * 0.0265, -0.1751, 1.6659),
            (side * 0.0380, -0.1745, 1.6665),
            (side * 0.0494, -0.1704, 1.6692),
        ]
        strand(f"ZhangFeiV5_Eye_Tearline_{side:+d}", lower, 0.00025, tear, taper=True)


def part_beard_for_restrained_roar():
    # Push only the first few control points of central chin hairs down and
    # outward.  This reveals the mouth without cutting a circular hole in the
    # beard, the failure mode of the earlier aggressive thinning test.
    for name in ("ZhangFei_Bushy_Beard_deep", "ZhangFei_Bushy_Beard_warm", "ZhangFei_Bushy_Beard_age"):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "CURVE":
            continue
        for spline in list(obj.data.splines):
            points = spline.bezier_points if spline.bezier_points else spline.points
            if not points:
                continue
            root = points[0].co
            if not (abs(root.x) < 0.031 and 1.552 < root.z < 1.596):
                continue
            if abs(root.x) < 0.006:
                obj.data.splines.remove(spline)
                continue
            side = -1.0 if root.x < 0.0 else 1.0
            for index, point in enumerate(points[: min(3, len(points))]):
                falloff = 1.0 - index / 3.0
                point.co.x += side * 0.0045 * falloff
                point.co.z -= 0.0040 * falloff

    cavity = bpy.data.objects.get("ZhangFeiV3_Mouth_Cavity")
    tongue = bpy.data.objects.get("ZhangFeiV3_Mouth_Tongue")
    upper = bpy.data.objects.get("ZhangFeiV3_Mouth_Upper_Lip")
    lower = bpy.data.objects.get("ZhangFeiV3_Mouth_Lower_Lip")
    if cavity:
        cavity.scale.x *= 0.96
        cavity.scale.z *= 1.10
    if tongue:
        tongue.hide_render = True
    if upper and upper.type == "CURVE":
        upper.data.bevel_depth *= 0.78
        for spline in upper.data.splines:
            points = spline.bezier_points if spline.bezier_points else spline.points
            for point in points:
                point.co.z += 0.00025
    if lower and lower.type == "CURVE":
        lower.data.bevel_depth *= 0.78
        for spline in lower.data.splines:
            points = spline.bezier_points if spline.bezier_points else spline.points
            for point in points:
                point.co.z -= 0.00110

    lip_material = upper.active_material if upper else None
    if lip_material and lip_material.use_nodes:
        ramp = next((node for node in lip_material.node_tree.nodes if node.type == "VALTORGB"), None)
        if ramp:
            ramp.color_ramp.elements[0].color = (0.018, 0.0015, 0.0010, 1.0)
            ramp.color_ramp.elements[-1].color = (0.060, 0.0060, 0.0035, 1.0)
        shader = next((node for node in lip_material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.64


def add_visible_hand_nails_and_knuckles():
    remove_prefix("ZhangFeiV5_Hand_")
    nail = mat("Zhang Fei v5 weathered fingernail", (0.19, 0.075, 0.045, 1), 0.52, noise=18.0, bump=0.004)
    crease = mat("Zhang Fei v5 hand crease", (0.055, 0.010, 0.006, 1), 0.67)
    rig = bpy.data.objects.get("Zhang_Fei_Game_Rig")
    if not rig:
        return

    finger_bones = ("index_03_l", "middle_03_l", "ring_03_l", "pinky_03_l", "thumb_03_l")
    for name in finger_bones:
        bone = rig.pose.bones.get(name)
        if not bone:
            continue
        head = rig.matrix_world @ bone.head
        tail = rig.matrix_world @ bone.tail
        direction = tail - head
        length = direction.length
        if length <= 0.0:
            continue
        direction.normalize()
        position = head.lerp(tail, 0.70)
        position.y -= 0.0014
        obj = sphere(
            f"ZhangFeiV5_Hand_Nail_{name}",
            position,
            (0.0038 if "pinky" not in name else 0.0032, 0.00072, min(0.0058, length * 0.26)),
            nail,
            32,
            16,
        )
        obj.rotation_euler.y = math.atan2(direction.x, direction.z)

    # Fine folds on the back of the upper hand are intentionally subtle; they
    # disappear in the full-body view but help the portrait avoid a smooth mitt.
    for index, (x, y, z) in enumerate(
        (
            (0.001, -0.316, 1.278),
            (0.014, -0.337, 1.267),
            (0.028, -0.351, 1.256),
        )
    ):
        strand(
            f"ZhangFeiV5_Hand_Knuckle_Crease_{index}",
            [(x - 0.006, y - 0.001, z + 0.002), (x, y - 0.0015, z), (x + 0.006, y - 0.001, z - 0.001)],
            0.00013,
            crease,
            taper=True,
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
    build_wet_cornea_and_limbal_ring()
    part_beard_for_restrained_roar()
    add_visible_hand_nails_and_knuckles()

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
