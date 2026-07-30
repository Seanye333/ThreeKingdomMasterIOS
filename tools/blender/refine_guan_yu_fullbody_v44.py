"""Guan Yu v44: rebuild malformed temples and replace the flat eye system."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at, mat, sphere


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v43.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v44.blend"
UPPER = SRC / "guan-yu-reference-fullbody-v44-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v44-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v44-face-three-quarter.png"


def remove_objects(*names):
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def rebuild_temple_and_orbital_shape():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    if body.data.shape_keys:
        existing = body.data.shape_keys.key_blocks.get("V44 rebuilt human head")
        if existing:
            body.shape_key_remove(existing)
    key = body.shape_key_add(name="V44 rebuilt human head", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if not 1.615 < co.z < 1.755 or ax > 0.135:
            continue

        # The inherited head flared from about 0.087m at the cheek to 0.115m
        # at eye level. Bring that band back into a continuous adult skull arc.
        temple_band = math.exp(-((co.z - 1.680) / 0.030) ** 2)
        if ax > 0.052:
            outer_weight = min(1.0, (ax - 0.052) / 0.060)
            contraction = 0.28 * temple_band * outer_weight
            new_ax = 0.052 + (ax - 0.052) * (1.0 - contraction)
            co.x = math.copysign(new_ax, co.x)

            # Recede the shelf-like outer brow without flattening the central
            # brow, nose or cheekbone landmarks.
            if co.y < -0.098 and 1.657 < co.z < 1.713:
                depth_weight = min(1.0, (ax - 0.052) / 0.045)
                co.y += 0.0042 * temple_band * max(0.0, depth_weight)

        # Smooth the transition from forehead to supraorbital ridge.
        if 0.030 < ax < 0.078 and 1.690 < co.z < 1.724 and co.y < -0.105:
            brow_weight = max(0.0, 1.0 - abs(co.z - 1.706) / 0.018)
            co.y += 0.0014 * brow_weight

        # Keep a firm but human cheek plane after the temple correction.
        if 0.042 < ax < 0.083 and 1.625 < co.z < 1.660 and co.y < -0.105:
            cheek_weight = max(0.0, 1.0 - abs(co.z - 1.643) / 0.019)
            co.y -= 0.0008 * cheek_weight


def make_eye_materials():
    sclera = mat("V44 warm living sclera", (0.33, 0.275, 0.225, 1), 0.34, noise=7.0, bump=0.010)
    sclera.use_nodes = True
    shader = next((node for node in sclera.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Specular IOR Level"].default_value = 0.34

    limbal = mat("V44 dark limbal ring", (0.0040, 0.0010, 0.00035, 1), 0.27)
    iris = mat("V44 layered dark-brown iris", (0.038, 0.010, 0.0028, 1), 0.30, noise=34.0, bump=0.018)
    pupil = mat("V44 natural black pupil", (0.0002, 0.00012, 0.00008, 1), 0.18)
    tear = mat("V44 restrained tear duct", (0.19, 0.030, 0.023, 1), 0.39, noise=24.0, bump=0.012)
    return sclera, limbal, iris, pupil, tear


def rebuild_eyes():
    remove_objects(
        "Guan_Yu_Basemesh.low-poly",
        "Guan_Yu_Basemesh.eyebrow003",
        "Guan_Yu_Basemesh.eyelashes01",
        "V31_Eye_Dark_Iris_-1",
        "V31_Eye_Dark_Iris_+1",
        "V31_Eye_Pupil_-1",
        "V31_Eye_Pupil_+1",
        "V31_Tear_Duct_-1",
        "V31_Tear_Duct_+1",
    )
    for obj in list(bpy.data.objects):
        if obj.name.startswith("V44_Eye_"):
            bpy.data.objects.remove(obj, do_unlink=True)

    sclera, limbal, iris, pupil, tear = make_eye_materials()
    gaze_offset = -0.0007
    eye_z = 1.6740
    # The face surface is near y=-0.170, while the stock eye cavity sits near
    # y=-0.139. Keep the sphere behind the lids; the first v44 draft placed its
    # front surface on the skin and exposed the entire globe.
    eye_y = -0.1245
    for side in (-1, 1):
        eye_x = side * 0.0327
        sphere(
            f"V44_Eye_Sclera_{side:+d}",
            (eye_x, eye_y, eye_z),
            (0.0148, 0.0145, 0.0125),
            sclera,
            64,
            32,
        )
        iris_x = eye_x + gaze_offset
        sphere(
            f"V44_Eye_Limbal_Ring_{side:+d}",
            (iris_x, -0.13935, eye_z),
            (0.0059, 0.00082, 0.0050),
            limbal,
            48,
            24,
        )
        sphere(
            f"V44_Eye_Iris_{side:+d}",
            (iris_x, -0.13995, eye_z),
            (0.0051, 0.00070, 0.0043),
            iris,
            48,
            24,
        )
        sphere(
            f"V44_Eye_Pupil_{side:+d}",
            (iris_x, -0.14045, eye_z),
            (0.00215, 0.00056, 0.00215),
            pupil,
            40,
            20,
        )
        sphere(
            f"V44_Eye_Tear_Duct_{side:+d}",
            (side * 0.0160, -0.1402, 1.6700),
            (0.0021, 0.00075, 0.00135),
            tear,
            32,
            16,
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
    rebuild_temple_and_orbital_shape()
    rebuild_eyes()

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
