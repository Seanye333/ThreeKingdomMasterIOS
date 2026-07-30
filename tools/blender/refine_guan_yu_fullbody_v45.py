"""Guan Yu v45: modeled eyelid rims and a separated, layered beard groom."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v44.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v45.blend"
UPPER = SRC / "guan-yu-reference-fullbody-v45-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v45-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v45-face-three-quarter.png"


def remove_prefix(prefix: str) -> None:
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefix):
            bpy.data.objects.remove(obj, do_unlink=True)


def make_eye_detail_materials():
    lid = mat("V45 mature warm eyelid", (0.205, 0.055, 0.026, 1), 0.50, noise=18.0, bump=0.006)
    lid.use_nodes = True
    shader = next((node for node in lid.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Subsurface Weight"].default_value = 0.055
        shader.inputs["Specular IOR Level"].default_value = 0.31

    lower_lid = mat("V45 lower eyelid warm shadow", (0.155, 0.033, 0.018, 1), 0.48, noise=21.0, bump=0.005)
    crease = mat("V45 restrained eyelid crease", (0.040, 0.0065, 0.0032, 1), 0.58)
    wetline = mat("V45 wet tear meniscus", (0.23, 0.055, 0.040, 1), 0.12)
    highlight = mat("V45 restrained corneal catchlight", (0.72, 0.61, 0.47, 1), 0.075)
    highlight.use_nodes = True
    shader = next((node for node in highlight.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Specular IOR Level"].default_value = 0.50
    return lid, lower_lid, crease, wetline, highlight


def set_curve_points(obj, points) -> None:
    spline = obj.data.splines[0]
    bezier = spline.bezier_points
    if len(bezier) != len(points):
        return
    for point, coordinates in zip(bezier, points):
        point.co = coordinates
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"


def rebuild_eyelid_rims() -> None:
    remove_prefix("V45_Eye_")
    lid, lower_lid, crease, wetline, highlight = make_eye_detail_materials()

    # The inherited black curve now serves only as a very fine lash root. The
    # visible lid volume is rebuilt in skin tones so it reads as anatomy rather
    # than a second graphic eye painted over the face.
    for side in (-1, 1):
        upper_lash = bpy.data.objects.get(f"V34_Upper_Lid_{side:+d}")
        if upper_lash:
            upper_lash.data.bevel_depth = 0.00027
            set_curve_points(
                upper_lash,
                [
                    (side * 0.0148, -0.1734, 1.6766),
                    (side * 0.0256, -0.1750, 1.6802),
                    (side * 0.0363, -0.1748, 1.6806),
                    (side * 0.0472, -0.1712, 1.6776),
                ],
            )

        old_waterline = bpy.data.objects.get(f"V39_Face_Waterline_{side:+d}")
        if old_waterline:
            old_waterline.hide_render = True

        upper_points = [
            (side * 0.0146, -0.1729, 1.6791),
            (side * 0.0255, -0.1752, 1.6831),
            (side * 0.0364, -0.1750, 1.6834),
            (side * 0.0474, -0.1710, 1.6797),
        ]
        lower_points = [
            (side * 0.0151, -0.1730, 1.6681),
            (side * 0.0259, -0.1750, 1.6654),
            (side * 0.0368, -0.1745, 1.6658),
            (side * 0.0473, -0.1709, 1.6687),
        ]
        crease_points = [
            (side * 0.0160, -0.1715, 1.6870),
            (side * 0.0270, -0.1731, 1.6907),
            (side * 0.0385, -0.1726, 1.6900),
            (side * 0.0493, -0.1689, 1.6860),
        ]
        wetline_points = [
            (side * 0.0154, -0.1739, 1.6692),
            (side * 0.0260, -0.1759, 1.6670),
            (side * 0.0367, -0.1752, 1.6673),
            (side * 0.0470, -0.1716, 1.6695),
        ]

        strand(f"V45_Eye_Upper_Lid_Rim_{side:+d}", upper_points, 0.00115, lid, taper=False)
        strand(f"V45_Eye_Lower_Lid_Rim_{side:+d}", lower_points, 0.00082, lower_lid, taper=False)
        strand(f"V45_Eye_Upper_Crease_{side:+d}", crease_points, 0.00020, crease, taper=True)
        strand(f"V45_Eye_Wetline_{side:+d}", wetline_points, 0.00019, wetline, taper=True)

        iris = bpy.data.objects.get(f"V44_Eye_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V44_Eye_Pupil_{side:+d}")
        if iris:
            iris.scale.x *= 1.04
            iris.scale.z *= 1.03
        if pupil:
            pupil.scale.x *= 0.94
            pupil.scale.z *= 0.94

        # A pin-sized catchlight gives the eye a wet corneal response without
        # reinstating the protruding full corneal shell rejected in v44.
        eye_x = side * 0.0327 - 0.0007
        sphere(
            f"V45_Eye_Catchlight_{side:+d}",
            (eye_x - side * 0.00125, -0.14116, 1.6767),
            (0.00043, 0.00014, 0.00036),
            highlight,
            24,
            12,
        )


def smoothstep(value: float) -> float:
    value = min(1.0, max(0.0, value))
    return value * value * (3.0 - 2.0 * value)


def nearest_lock(root_x: float) -> float:
    locks = (-0.072, -0.038, -0.004, 0.031, 0.066)
    return min(locks, key=lambda value: abs(value - root_x))


def groom_long_beard_bundle(obj, seed: int, keep_ratio: float) -> None:
    rng = random.Random(seed)
    splines = list(obj.data.splines)
    removals = []
    for index, spline in enumerate(splines):
        if rng.random() > keep_ratio:
            removals.append(spline)
            continue
        if not spline.points:
            continue

        points = spline.points
        root = points[0].co.copy()
        root_x = root.x
        lock = nearest_lock(root_x)
        lane = rng.uniform(-0.0068, 0.0068)
        wind = rng.uniform(0.002, 0.010)
        phase = rng.uniform(0.0, math.tau)
        depth_layer = rng.uniform(-0.0065, 0.0065)

        original_tip_z = points[-1].co.z
        side_factor = min(1.0, abs(root_x) / 0.100)
        irregular_tip = 0.995 + 0.155 * side_factor**1.25 + rng.uniform(0.0, 0.090)
        desired_tip_z = max(original_tip_z, irregular_tip)
        tip_raise = desired_tip_z - original_tip_z

        for point_index, point in enumerate(points):
            t = point_index / max(1, len(points) - 1)
            gather = smoothstep((t - 0.18) / 0.82)
            target_x = lock + lane + wind
            original_x = point.co.x
            point.co.x = original_x * (1.0 - 0.94 * gather) + target_x * (0.94 * gather)
            point.co.x += math.sin(phase + t * math.pi * 1.55) * 0.0048 * math.sin(math.pi * t)
            point.co.y += depth_layer * math.sin(math.pi * t)
            point.co.z += tip_raise * smoothstep(t)

            # Preserve dense roots, but narrow each lock toward the uneven tip.
            radius_taper = 1.0 - 0.35 * smoothstep(t)
            point.radius *= radius_taper

    for spline in removals:
        obj.data.splines.remove(spline)


def groom_moustache_bundle(obj, seed: int, keep_ratio: float) -> None:
    rng = random.Random(seed)
    removals = []
    for spline in list(obj.data.splines):
        if rng.random() > keep_ratio:
            removals.append(spline)
            continue
        if not spline.points:
            continue
        root_x = spline.points[0].co.x
        direction = -1.0 if root_x < 0 else 1.0
        depth = rng.uniform(-0.0035, 0.0035)
        for index, point in enumerate(spline.points):
            t = index / max(1, len(spline.points) - 1)
            # Bend the moustache tips down into the beard instead of letting
            # hundreds of strands form a single horizontal brush stroke.
            if t > 0.45:
                fall = smoothstep((t - 0.45) / 0.55)
                point.co.x = point.co.x * (1.0 - 0.18 * fall) + direction * 0.083 * (0.18 * fall)
                point.co.z -= 0.010 * fall
            point.co.y += depth * math.sin(math.pi * t)
            point.radius *= 1.0 - 0.34 * smoothstep(t)
    for spline in removals:
        obj.data.splines.remove(spline)


def separate_and_layer_beard() -> None:
    bundles = (
        ("V34_Groom_Beard_deep", 4511, 0.88, 0.000320),
        ("V34_Groom_Beard_warm", 4512, 0.90, 0.000305),
        ("V34_Groom_Beard_age", 4513, 0.93, 0.000285),
    )
    for name, seed, keep_ratio, bevel_depth in bundles:
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "CURVE":
            groom_long_beard_bundle(obj, seed, keep_ratio)
            obj.data.bevel_depth = bevel_depth
            obj.data.bevel_resolution = 2

    moustache = (
        ("V34_Groom_Moustache_deep", 4521, 0.78, 0.000245),
        ("V34_Groom_Moustache_warm", 4522, 0.82, 0.000240),
        ("V34_Groom_Moustache_age", 4523, 0.90, 0.000225),
    )
    for name, seed, keep_ratio, bevel_depth in moustache:
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "CURVE":
            groom_moustache_bundle(obj, seed, keep_ratio)
            obj.data.bevel_depth = bevel_depth
            obj.data.bevel_resolution = 2

    # The short jaw transition remains denser, but its fibers should be finer
    # than the long locks so cheeks blend naturally into the groom.
    for name in ("V40_Beard_Root_deep", "V40_Beard_Root_warm", "V40_Beard_Root_age"):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "CURVE":
            obj.data.bevel_depth *= 0.88
            obj.data.bevel_resolution = 2


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
    rebuild_eyelid_rims()
    separate_and_layer_beard()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.31), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98)
    render(scene, camera, THREE_QUARTER_FACE, (1100, 1100), (0.90, -2.28, 1.64), (0.0, -0.09, 1.50), 98)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER_FACE={THREE_QUARTER_FACE}")


if __name__ == "__main__":
    main()
