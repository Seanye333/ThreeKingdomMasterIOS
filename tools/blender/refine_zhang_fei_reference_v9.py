"""Zhang Fei v9: rebuild the visible facial planes and replace the open CG mouth."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v8.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v9.blend"
FRONT = SRC / "zhang-fei-reference-fullbody-v9-front.png"
UPPER = SRC / "zhang-fei-reference-fullbody-v9-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v9-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v9-three-quarter.png"


def geometry_points(obj):
    if obj.type == "MESH":
        return [vertex.co for vertex in obj.data.vertices]
    if obj.type == "CURVE":
        points = []
        for spline in obj.data.splines:
            points.extend(spline.bezier_points if spline.bezier_points else spline.points)
        return [point.co for point in points]
    return []


def scale_geometry(obj, factors):
    points = geometry_points(obj)
    if not points:
        return
    center = sum((Vector((p.x, p.y, p.z)) for p in points), Vector()) / len(points)
    for point in points:
        point.x = center.x + (point.x - center.x) * factors[0]
        point.y = center.y + (point.y - center.y) * factors[1]
        point.z = center.z + (point.z - center.z) * factors[2]
    if obj.type == "MESH":
        obj.data.update()


def bake_v9_facial_anatomy():
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    keys = body.data.shape_keys.key_blocks
    old = keys.get("Zhang Fei v9 grounded facial anatomy")
    if old:
        body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v9 grounded facial anatomy", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    eye_z = 1.674
    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > -0.104 or ax > 0.145 or not 1.505 < co.z < 1.735:
            continue

        # Pull the upper and lower orbital rims toward one another.  The
        # opening changes in the skin itself instead of relying on eyeliner.
        if 0.012 < ax < 0.066 and 1.651 < co.z < 1.698:
            horizontal = max(0.0, 1.0 - abs(ax - 0.038) / 0.030)
            if co.z >= eye_z:
                vertical = max(0.0, 1.0 - abs(co.z - 1.683) / 0.018)
                co.z -= 0.00215 * horizontal * vertical
                co.y -= 0.00075 * horizontal * vertical
            else:
                vertical = max(0.0, 1.0 - abs(co.z - 1.665) / 0.017)
                co.z += 0.00125 * horizontal * vertical
                co.y -= 0.00045 * horizontal * vertical

        # A heavier supraorbital plane and lowered inner brow make the eyes
        # look set into the skull rather than pasted onto a smooth face.
        if 0.012 < ax < 0.078 and 1.694 < co.z < 1.727:
            brow = max(0.0, 1.0 - abs(co.z - 1.708) / 0.020)
            inner = max(0.0, 1.0 - ax / 0.080)
            co.y -= 0.00170 * brow
            co.z -= 0.00085 * brow * inner

        # Square, projected nose bridge with broader, slightly asymmetric alae.
        if ax < 0.022 and 1.622 < co.z < 1.690:
            bridge = max(0.0, 1.0 - abs(co.z - 1.654) / 0.038)
            co.y -= 0.00155 * bridge
        if 0.018 < ax < 0.050 and 1.594 < co.z < 1.626:
            ala = max(0.0, 1.0 - abs(co.z - 1.610) / 0.018)
            co.x *= 1.014 + 0.010 * ala
            co.y -= (0.00085 if co.x > 0.0 else 0.00055) * ala

        # Small left/right differences keep the cheeks and jaw from reading as
        # a mirrored game avatar.  The beard still preserves the broad outline.
        if 0.050 < ax < 0.112 and 1.603 < co.z < 1.660:
            cheek = max(0.0, 1.0 - abs(co.z - 1.635) / 0.034)
            co.y -= (0.00125 if co.x > 0.0 else 0.00080) * cheek
            co.x *= 1.0035 if co.x > 0.0 else 1.0020
        if 0.044 < ax < 0.116 and 1.515 < co.z < 1.592:
            jaw = max(0.0, 1.0 - abs(co.z - 1.558) / 0.044)
            co.x *= 1.003 + 0.003 * jaw

        # Bring the native lips closer together behind the modeled lip rims.
        if ax < 0.050 and 1.552 < co.z < 1.594:
            mouth = max(0.0, 1.0 - ax / 0.052)
            if co.z >= 1.575:
                co.z -= 0.00075 * mouth
            else:
                co.z += 0.00120 * mouth


def refine_eyes_and_brows():
    # Compress the whole visible eye stack a final small amount so the iris,
    # pupil and wet limbal ring continue to fit the newly narrowed skin opening.
    for obj in bpy.data.objects:
        if obj.name.startswith((
            "ZhangFei_Eye_Sclera_",
            "ZhangFei_Eye_Iris_",
            "ZhangFei_Eye_Pupil_",
            "ZhangFeiV5_Eye_Limbal_Ring_",
        )):
            scale_geometry(obj, (0.985, 1.0, 0.92))

    for obj in bpy.data.objects:
        if obj.name.startswith("ZhangFei_Upper_Lid_") and obj.type == "CURVE":
            obj.data.bevel_depth *= 1.10
            for point in geometry_points(obj):
                point.z -= 0.00045
        elif obj.name.startswith("ZhangFei_Lower_Lid_") and obj.type == "CURVE":
            obj.data.bevel_depth *= 1.05
            for point in geometry_points(obj):
                point.z += 0.00025

    prefixes = ("ZhangFei_Heavy_Brow_", "ZhangFeiV2_Brow_Anchor_", "ZhangFei_Brow_Fibers_")
    for obj in bpy.data.objects:
        if obj.type != "CURVE" or not obj.name.startswith(prefixes):
            continue
        for point in geometry_points(obj):
            inner = max(0.0, 1.0 - abs(point.x) / 0.070)
            point.z -= 0.00045 * inner


def replace_open_mouth_with_tight_snarl():
    cavity = bpy.data.objects.get("ZhangFeiV3_Mouth_Cavity")
    upper = bpy.data.objects.get("ZhangFeiV3_Mouth_Upper_Lip")
    lower = bpy.data.objects.get("ZhangFeiV3_Mouth_Lower_Lip")
    if cavity:
        scale_geometry(cavity, (0.88, 0.82, 0.43))
    if upper and upper.type == "CURVE":
        upper.data.bevel_depth *= 0.90
        for point in geometry_points(upper):
            point.z -= 0.00055
    if lower and lower.type == "CURVE":
        lower.data.bevel_depth *= 0.88
        for point in geometry_points(lower):
            point.z += 0.00210

    # Close some of the beard parting above and below the smaller mouth slit.
    for name in ("ZhangFei_Bushy_Beard_deep", "ZhangFei_Bushy_Beard_warm", "ZhangFei_Bushy_Beard_age"):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "CURVE":
            continue
        for spline in obj.data.splines:
            points = spline.bezier_points if spline.bezier_points else spline.points
            if not points:
                continue
            root = points[0].co
            if 0.006 < abs(root.x) < 0.036 and 1.548 < root.z < 1.598:
                side = -1.0 if root.x < 0.0 else 1.0
                for index, point in enumerate(points[: min(3, len(points))]):
                    falloff = 1.0 - index / 3.0
                    point.co.x -= side * 0.0018 * falloff
                    point.co.z += 0.0010 * falloff


def tune_face_material_response():
    skin = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not skin or not skin.use_nodes:
        return
    nodes = skin.node_tree.nodes
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    pores = nodes.get("Fine facial micro pores")
    pore_bump = nodes.get("Micro pore normal")
    if shader:
        shader.inputs["Roughness"].default_value = 0.625
        if "Subsurface Weight" in shader.inputs:
            shader.inputs["Subsurface Weight"].default_value = 0.022
    if pores:
        pores.inputs["Scale"].default_value = 410.0
        pores.inputs["Detail"].default_value = 5.0
        pores.inputs["Roughness"].default_value = 0.74
    if pore_bump:
        pore_bump.inputs["Strength"].default_value = 0.155
        pore_bump.inputs["Distance"].default_value = 0.00048


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
    bake_v9_facial_anatomy()
    refine_eyes_and_brows()
    replace_open_mouth_with_tight_snarl()
    tune_face_material_response()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.55, 1.10), (-0.05, -0.03, 1.13), 71)
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.34), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.64), (0.0, -0.095, 1.56), 96)
    render(scene, camera, THREE_QUARTER, (1100, 1100), (0.92, -2.36, 1.66), (0.0, -0.08, 1.55), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
