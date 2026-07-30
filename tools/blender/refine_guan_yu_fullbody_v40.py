"""Guan Yu v40: directed gaze, beard-root transition and wrapped headcloth band."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at, strand
from refine_guan_yu_fullbody_v34 import curve_bundle


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v39.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v40.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v40-front.png"
UPPER = SRC / "guan-yu-reference-fullbody-v40-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v40-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v40-face-three-quarter.png"


def remove_prefix(prefix):
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefix):
            bpy.data.objects.remove(obj, do_unlink=True)


def sculpt_eye_and_mouth_finish():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    existing = body.data.shape_keys and body.data.shape_keys.key_blocks.get("V40 portrait facial finish")
    if existing:
        body.shape_key_remove(existing)
    key = body.shape_key_add(name="V40 portrait facial finish", from_mix=False)
    key.value = 1.0

    for point in key.data:
        co = point.co
        if co.y > -0.070 or abs(co.x) > 0.136 or not 1.535 < co.z < 1.720:
            continue
        ax = abs(co.x)

        # Hood the eye opening, particularly at the outer corner, while the
        # lower lid retains a small aged sag.
        for eye_center in (-0.047, 0.047):
            dx = abs(co.x - eye_center)
            if dx >= 0.041:
                continue
            weight = 1.0 - dx / 0.041
            outer = max(0.0, (abs(co.x) - 0.047) / 0.041)
            if 1.674 < co.z < 1.698:
                co.z -= 0.0018 * weight
                co.y -= 0.0008 * weight
            if 1.650 < co.z < 1.673:
                co.z += 0.0008 * weight
                co.y -= 0.00035 * weight
            if outer > 0.0 and 1.657 < co.z < 1.692:
                co.z += 0.0010 * outer

        # Sharper alar crease and a compressed, downturned mouth corner.
        if 0.030 < ax < 0.052 and 1.585 < co.z < 1.617:
            co.y += 0.0010 * max(0.0, 1.0 - abs(co.z - 1.602) / 0.017)
        if ax < 0.034 and 1.568 < co.z < 1.591:
            co.y += 0.0008
        if 0.031 < ax < 0.069 and 1.567 < co.z < 1.598:
            co.z -= 0.0011
            if co.x > 0:
                co.z -= 0.00025

        # Preserve visible jaw mass beneath the new root stubble.
        if 0.058 < ax < 0.111 and 1.539 < co.z < 1.590:
            co.x *= 1.025


def direct_gaze():
    gaze_offset = -0.0035
    for side in (-1, 1):
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.location.x += gaze_offset
            iris.scale.x *= 0.96
            iris.scale.z *= 0.95
        if pupil:
            pupil.location.x += gaze_offset
            pupil.scale.x *= 0.94
            pupil.scale.z *= 0.94


def warm_weathered_skin():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    warm = nodes.get("Portrait warm heroic complexion")
    bronze = nodes.get("V34 weathered bronze complexion")
    mature = nodes.get("V34 restrained mature skin color")
    if warm:
        warm.inputs[2].default_value = (0.235, 0.043, 0.017, 1)
    if bronze:
        bronze.inputs[2].default_value = (0.285, 0.067, 0.026, 1)
    if mature:
        mature.inputs["Saturation"].default_value = 0.95
        mature.inputs["Value"].default_value = 0.87


def build_beard_root_transition():
    remove_prefix("V40_Beard_Root_")
    rng = random.Random(4040)
    deep = bpy.data.materials.get("V34 groom deep black")
    warm = bpy.data.materials.get("V34 groom warm black")
    age = bpy.data.materials.get("V34 groom charcoal age")
    if not all((deep, warm, age)):
        raise RuntimeError("Required v39 groom materials are missing")

    paths = {"deep": [], "warm": [], "age": []}
    for side in (-1, 1):
        for index in range(110):
            root_x = side * rng.uniform(0.050, 0.102)
            root_z = rng.uniform(1.555, 1.645)
            cheek_falloff = min(1.0, max(0.0, (1.645 - root_z) / 0.090))
            length = rng.uniform(0.040, 0.105) * (0.70 + cheek_falloff * 0.55)
            inward = rng.uniform(0.72, 0.92)
            path = []
            for point_index in range(5):
                t = point_index / 4
                ease = t * t * (3.0 - 2.0 * t)
                x = root_x * (1.0 - (1.0 - inward) * ease)
                x += side * math.sin(t * math.pi) * rng.uniform(0.001, 0.006)
                y = -0.163 - 0.024 * math.sin(t * math.pi * 0.85) - 0.006 * ease
                z = root_z - length * ease + math.sin(t * math.pi) * rng.uniform(-0.002, 0.003)
                path.append((x, y, z))
            selector = rng.random()
            palette = "age" if selector < 0.045 else "warm" if selector < 0.23 else "deep"
            paths[palette].append((path, rng.uniform(0.44, 0.94)))

    for palette, material in (("deep", deep), ("warm", warm), ("age", age)):
        curve_bundle(f"V40_Beard_Root_{palette}", paths[palette], material, 0.00024)


def reinforce_wrapped_headcloth():
    remove_prefix("V40_Headcloth_")
    seam = bpy.data.materials.get("V34 headcloth recessed fold")
    if not seam:
        raise RuntimeError("Required headcloth fold material is missing")

    # Three diagonal tension folds sell the tied cloth instead of a soft cap.
    for index, side in enumerate((-1, 0, 1)):
        x = side * 0.041
        strand(
            f"V40_Headcloth_Tension_Fold_{index}",
            [
                (x - 0.012, -0.150, 1.765),
                (x, -0.170, 1.746),
                (x + 0.009, -0.178, 1.729),
            ],
            0.0009,
            seam,
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
    sculpt_eye_and_mouth_finish()
    direct_gaze()
    warm_weathered_skin()
    build_beard_root_transition()
    reinforce_wrapped_headcloth()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72)
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.31), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98)
    render(scene, camera, THREE_QUARTER_FACE, (1100, 1100), (0.90, -2.28, 1.64), (0.0, -0.09, 1.50), 98)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER_FACE={THREE_QUARTER_FACE}")


if __name__ == "__main__":
    main()
