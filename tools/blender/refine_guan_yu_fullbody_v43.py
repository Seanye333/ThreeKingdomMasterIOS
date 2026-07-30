"""Guan Yu v43: true current-mesh facial sculpt and correctly fitted eyelids."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v42.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v43.blend"
UPPER = SRC / "guan-yu-reference-fullbody-v43-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v43-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v43-face-three-quarter.png"


def bake_current_shape_and_sculpt_face():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    if body.data.shape_keys:
        existing = body.data.shape_keys.key_blocks.get("V43 current-mesh commander sculpt")
        if existing:
            body.shape_key_remove(existing)

    # Capture the actual mixed portrait mesh first. Earlier passes addressed
    # basis coordinates from the stock head, which no longer lined up with the
    # final eye sockets after all character morphs were applied.
    key = body.shape_key_add(name="V43 current-mesh commander sculpt", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > -0.102 or not 1.525 < co.z < 1.725 or ax > 0.125:
            continue

        # Narrow, heavy upper lids centered on the actual +/-0.031 eye mesh.
        for side in (-1, 1):
            eye_center = side * 0.0312
            dx = abs(co.x - eye_center)
            if dx >= 0.024:
                continue
            horizontal = 1.0 - dx / 0.024
            if 1.676 < co.z < 1.692 and co.y < -0.136:
                vertical = max(0.0, 1.0 - abs(co.z - 1.684) / 0.0085)
                co.z -= 0.0024 * horizontal * vertical
                co.y -= 0.0007 * horizontal * vertical
            elif 1.660 < co.z < 1.675 and co.y < -0.136:
                vertical = max(0.0, 1.0 - abs(co.z - 1.668) / 0.0080)
                co.z += 0.0010 * horizontal * vertical

            # A slight upward outer corner produces a stern, controlled gaze.
            outer = max(0.0, side * (co.x - eye_center) / 0.024)
            if outer > 0.0 and 1.665 < co.z < 1.689 and co.y < -0.132:
                co.z += 0.0008 * outer

        # Heavier supraorbital ridge and a tighter glabella.
        if 0.012 < ax < 0.061 and 1.691 < co.z < 1.715:
            ridge = max(0.0, 1.0 - abs(co.z - 1.702) / 0.012)
            co.y -= 0.0016 * ridge
        if ax < 0.018 and 1.676 < co.z < 1.710:
            co.y += 0.0010 * (1.0 - ax / 0.018)

        # Stronger bridge, cheekbone plane and a leaner lower cheek.
        if ax < 0.020 and 1.606 < co.z < 1.678:
            co.y -= 0.0014 * max(0.0, 1.0 - abs(co.z - 1.642) / 0.038)
        if 0.040 < ax < 0.088 and 1.622 < co.z < 1.663:
            co.y -= 0.0015 * max(0.0, 1.0 - abs(co.z - 1.642) / 0.021)
        if 0.045 < ax < 0.092 and 1.585 < co.z < 1.624:
            co.y += 0.0012 * max(0.0, 1.0 - abs(co.z - 1.605) / 0.020)

        # Broader mandibular angle and compressed mouth corners under the beard.
        if 0.058 < ax < 0.111 and 1.535 < co.z < 1.590:
            co.x *= 1.018
        if 0.030 < ax < 0.064 and 1.565 < co.z < 1.598:
            co.z -= 0.0008


def set_bezier_points(name, coordinates):
    obj = bpy.data.objects.get(name)
    if not obj or obj.type != "CURVE" or not obj.data.splines:
        return
    points = obj.data.splines[0].bezier_points
    if len(points) != len(coordinates):
        return
    for point, coordinate in zip(points, coordinates):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"


def refit_eyelid_details():
    # Fit all graphic eye details to the corrected eye geometry instead of the
    # obsolete wide +/-0.047 eye-center assumption.
    for side in (-1, 1):
        set_bezier_points(
            f"V34_Upper_Lid_{side:+d}",
            [
                (side * 0.0145, -0.1718, 1.6770),
                (side * 0.0255, -0.1742, 1.6810),
                (side * 0.0365, -0.1740, 1.6812),
                (side * 0.0475, -0.1700, 1.6782),
            ],
        )
        set_bezier_points(
            f"V39_Face_Waterline_{side:+d}",
            [
                (side * 0.0155, -0.1730, 1.6690),
                (side * 0.0260, -0.1750, 1.6665),
                (side * 0.0370, -0.1738, 1.6668),
                (side * 0.0475, -0.1700, 1.6692),
            ],
        )
        set_bezier_points(
            f"V39_Face_UnderEye_Crease_{side:+d}",
            [
                (side * 0.0180, -0.1718, 1.6560),
                (side * 0.0320, -0.1730, 1.6535),
                (side * 0.0460, -0.1700, 1.6555),
            ],
        )

    eyeballs = bpy.data.objects.get("Guan_Yu_Basemesh.low-poly")
    if eyeballs and eyeballs.type == "MESH":
        center = 1.6761
        for vertex in eyeballs.data.vertices:
            vertex.co.z = center + (vertex.co.z - center) * 0.90
        eyeballs.data.update()

    for side in (-1, 1):
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.location.z = 1.6754
            iris.scale.z *= 0.91
        if pupil:
            pupil.location.z = 1.6754
            pupil.scale.z *= 0.91


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
    bake_current_shape_and_sculpt_face()
    refit_eyelid_details()

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
