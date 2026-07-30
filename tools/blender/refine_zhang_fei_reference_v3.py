"""Zhang Fei v3: stockier mass, open battle roar, organic armor and a dynamic spear line."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, cone_between, cube, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v2.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v3.blend"
UPPER = SRC / "zhang-fei-reference-fullbody-v3-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v3-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v3-three-quarter.png"


def remove_prefix(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def sculpt_stockier_roaring_body():
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    if body.data.shape_keys:
        old = body.data.shape_keys.key_blocks.get("Zhang Fei v3 stocky battle roar")
        if old:
            body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v3 stocky battle roar", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)

        # Add breadth under the static armor without moving hands or feet.
        if 0.82 < co.z < 1.49 and ax < 0.255:
            vertical = max(0.0, 1.0 - abs(co.z - 1.24) / 0.30)
            co.x *= 1.018 + 0.020 * vertical

        if co.y > -0.072 or ax > 0.145 or not 1.515 < co.z < 1.725:
            continue

        # Lower jaw/chin follow the new open mouth instead of remaining frozen.
        if ax < 0.058 and 1.520 < co.z < 1.575 and co.y < -0.125:
            weight = max(0.0, 1.0 - ax / 0.058)
            co.z -= 0.0030 * weight
            co.y -= 0.0010 * weight
        if 0.024 < ax < 0.052 and 1.565 < co.z < 1.592 and co.y < -0.130:
            co.x *= 1.025


def open_eyes_under_brows():
    for side in (-1, 1):
        iris = bpy.data.objects.get(f"ZhangFei_Eye_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"ZhangFei_Eye_Pupil_{side:+d}")
        if iris:
            # A slightly fuller iris keeps the inherited fierce stare grounded
            # in a human eye instead of reopening the socket into a round globe.
            iris.scale.x *= 1.025
            iris.scale.z *= 1.020
        if pupil:
            pupil.scale.x *= 0.97
            pupil.scale.z *= 0.97


def add_face_tension_details():
    remove_prefix("ZhangFeiV3_Face_")
    crease = mat("Zhang Fei v3 subtle expression crease", (0.060, 0.010, 0.006, 1), 0.68)

    # Short, fine glabella creases add age and strain without drawing dark
    # graphic lines across the cheeks.
    for side in (-1, 1):
        strand(
            f"ZhangFeiV3_Face_Glabella_{side:+d}",
            [
                (side * 0.010, -0.1740, 1.7150),
                (side * 0.014, -0.1760, 1.7040),
                (side * 0.016, -0.1762, 1.6940),
            ],
            0.00018,
            crease,
            taper=True,
        )


def build_deeper_battle_roar():
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhangFeiV2_Mouth_"):
            obj.hide_render = True
    remove_prefix("ZhangFeiV3_Mouth_")
    cavity = mat("Zhang Fei v3 lightless mouth", (0.00012, 0.00002, 0.00001, 1), 0.92)
    lip = mat("Zhang Fei v3 strained lips", (0.090, 0.012, 0.006, 1), 0.55, noise=26.0, bump=0.010)
    tongue = mat("Zhang Fei v3 shadowed tongue", (0.085, 0.0045, 0.0030, 1), 0.48, noise=15.0, bump=0.006)
    if cavity.use_nodes:
        shader = next((node for node in cavity.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Specular IOR Level"].default_value = 0.06

    sphere("ZhangFeiV3_Mouth_Cavity", (0.0, -0.1683, 1.5750), (0.030, 0.0036, 0.0145), cavity, 64, 28)
    strand(
        "ZhangFeiV3_Mouth_Upper_Lip",
        [
            (-0.032, -0.1710, 1.5810),
            (-0.016, -0.1725, 1.5855),
            (0.0, -0.1730, 1.5835),
            (0.016, -0.1725, 1.5855),
            (0.032, -0.1710, 1.5810),
        ],
        0.00125,
        lip,
        taper=True,
    )
    strand(
        "ZhangFeiV3_Mouth_Lower_Lip",
        [
            (-0.030, -0.1710, 1.5680),
            (-0.015, -0.1724, 1.5620),
            (0.0, -0.1730, 1.5600),
            (0.015, -0.1724, 1.5620),
            (0.030, -0.1710, 1.5680),
        ],
        0.00140,
        lip,
        taper=True,
    )
    sphere("ZhangFeiV3_Mouth_Tongue", (0.0, -0.1720, 1.5640), (0.018, 0.0015, 0.0045), tongue, 40, 18)


def part_beard_around_roar():
    # The dense central beard originally crossed directly over the new mouth.
    # Keep the tiger-beard mass, but remove only selected central roots so the
    # dark mouth opening and strained lips remain legible at portrait distance.
    for name in ("ZhangFei_Bushy_Beard_deep", "ZhangFei_Bushy_Beard_warm", "ZhangFei_Bushy_Beard_age"):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "CURVE":
            continue
        for index, spline in reversed(list(enumerate(list(obj.data.splines)))):
            if not spline.points:
                continue
            root = spline.points[0].co
            if abs(root.x) < 0.020 and 1.552 < root.z < 1.596 and index % 4 == 0:
                obj.data.splines.remove(spline)


def add_heavier_chest_armor():
    remove_prefix("ZhangFeiV3_Chest_", "ZhangFeiV3_Shoulder_")
    iron = bpy.data.materials["Zhang Fei blackened heavy iron"]

    # Keep the front clean under the diagonal dragon harness.  Both the earlier
    # rectangular plaque grid and a smooth oval chest insert read as props at
    # portrait distance; the existing cloth and belt provide the more credible
    # layered silhouette here.

    # Expand the independent shoulder silhouettes safely around world origin.
    for obj in bpy.data.objects:
        if obj.name.startswith(("Pauldron_Scale_", "V33_Right_Pauldron_", "Dragon_Pauldron_Base_")):
            obj.scale.x *= 1.045
            obj.scale.y *= 1.020

    cone_between(
        "ZhangFeiV3_Shoulder_Spike_Left",
        (-0.365, -0.145, 1.470),
        (-0.415, -0.157, 1.525),
        0.012,
        0.001,
        iron,
        32,
    )
    cone_between(
        "ZhangFeiV3_Shoulder_Spike_Right",
        (0.330, -0.145, 1.472),
        (0.390, -0.157, 1.520),
        0.012,
        0.001,
        iron,
        32,
    )

    fur = bpy.data.objects.get("ZhangFeiV2_Fur_Shoulder_Collar")
    if fur:
        fur.location.y -= 0.045
        fur.data.bevel_depth *= 1.28


def angle_serpent_spear_around_grip():
    pivot = Vector((-0.350, -0.200, 0.790))
    transform = Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(-7.0), 4, "Y") @ Matrix.Translation(-pivot)
    prefixes = (
        "ZhangFei_Serpent_Spear_Pole",
        "ZhangFeiV2_EightSpan_Serpent_Blade",
        "ZhangFeiV2_Serpent_Gold_Ridge_",
        "ZhangFei_Spear_",
        "Fullbody_Crimson_Pole_Grip_",
        "Fullbody_Pole_Butt_Spike",
    )
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes):
            obj.matrix_world = transform @ obj.matrix_world


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
    sculpt_stockier_roaring_body()
    open_eyes_under_brows()
    add_face_tension_details()
    build_deeper_battle_roar()
    part_beard_around_roar()
    add_heavier_chest_armor()
    angle_serpent_spear_around_grip()

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
