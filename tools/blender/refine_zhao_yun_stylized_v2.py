"""Refine the Zhao Yun stylized prototype with a younger face and richer armor."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, look_at, mat, sphere, strand
from create_liu_bei_reference_v1 import remove_matching
from refine_liu_bei_reference_v3 import curve_bundle_poly


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-stylized-v1.blend"
OUTPUT_BLEND = SRC / "zhao-yun-stylized-v2.blend"
FRONT = SRC / "zhao-yun-stylized-v2-front.png"
UPPER = SRC / "zhao-yun-stylized-v2-upper.png"
FACE = SRC / "zhao-yun-stylized-v2-face.png"
THREE_QUARTER = SRC / "zhao-yun-stylized-v2-three-quarter.png"


def existing_material(name):
    material = bpy.data.materials.get(name)
    if material is None:
        raise RuntimeError(f"Required v1 material is missing: {name}")
    return material


def make_materials():
    materials = {
        "silver": existing_material("Zhao Yun stylized moon silver"),
        "silver_bright": existing_material("Zhao Yun bright silver edge"),
        "silver_dark": existing_material("Zhao Yun blue shadow steel"),
        "white": existing_material("Zhao Yun pearl white silk"),
        "white_shadow": existing_material("Zhao Yun pale blue silk shadow"),
        "blue": existing_material("Zhao Yun loyal Shu blue"),
        "cyan": existing_material("Zhao Yun clear sky jade"),
        "hair": existing_material("Zhao Yun stylized blue black hair"),
    }
    materials["lip"] = mat(
        "Zhao Yun v2 youthful muted lip",
        (0.180, 0.040, 0.028, 1),
        0.62,
        noise=17.0,
        bump=0.003,
    )
    materials["plume_shadow"] = mat(
        "Zhao Yun v2 cool plume shadow",
        (0.20, 0.32, 0.46, 1),
        0.56,
        noise=22.0,
        bump=0.015,
    )
    return materials


def youth_face(body):
    key = body.shape_key_add(name="Zhao Yun v2 youthful heroic face", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if ax > 0.145 or co.y > 0.095 or not 1.505 < co.z < 1.785:
            continue

        # Narrow the old square jaw into a cleaner youthful oval without
        # losing the strong cavalry-general silhouette.
        if 1.515 < co.z < 1.605 and 0.032 < ax < 0.120:
            jaw_weight = max(0.0, 1.0 - abs(co.z - 1.565) / 0.052)
            co.x *= 1.0 - 0.072 * jaw_weight
        if 1.605 <= co.z < 1.675 and 0.050 < ax < 0.118:
            co.x *= 0.982

        # Shorter, straighter nose and a slightly projected rounded chin.
        if ax < 0.032 and 1.600 < co.z < 1.665 and co.y < -0.095:
            co.x *= 0.965
            co.y += 0.0016
        if ax < 0.046 and 1.515 < co.z < 1.558 and co.y < -0.085:
            co.y -= 0.0012 * max(0.0, 1.0 - ax / 0.046)

        # Lift only the mouth corners; keep the expression composed rather
        # than smiling so he still reads as a battlefield hero.
        if 0.018 < ax < 0.047 and 1.568 < co.z < 1.592 and co.y < -0.125:
            co.z += 0.0013 * (ax - 0.018) / 0.029

    body.data.update()
    for polygon in body.data.polygons:
        polygon.use_smooth = True

    skin = body.material_slots[0].material
    if skin and skin.use_nodes:
        shader = next((node for node in skin.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.63
            shader.inputs["Subsurface Weight"].default_value = 0.060


def refine_mouth(materials):
    remove_matching("ZhaoYunV2_Lip_")
    # The base mesh already carries a restrained closed-mouth shape.  Extra
    # floating lip curves looked doubled at close range, so v2 keeps that
    # native surface and relies on the youthful corner lift above.


def refine_plume(materials):
    remove_matching("ZhaoYun_White_Horsehair_Plume_", "ZhaoYunV2_Plume_")
    rng = random.Random(2005)
    white_fibers = []
    shadow_fibers = []
    cyan_fibers = []
    for index in range(33):
        spread = (index - 16) / 16.0
        jitter = rng.uniform(-0.004, 0.004)
        points = [
            (spread * 0.004, 0.020, 1.850 + rng.uniform(-0.002, 0.002)),
            (spread * 0.018, 0.075, 1.966 + (1.0 - abs(spread)) * 0.020),
            (spread * 0.036 + jitter, 0.205, 1.930 - abs(spread) * 0.035),
            (spread * 0.058 + jitter, 0.375 + abs(spread) * 0.025, 1.805 - abs(spread) * 0.060),
        ]
        fiber = (points, rng.uniform(0.72, 1.08))
        if index in (0, 32):
            cyan_fibers.append(fiber)
        elif index % 6 == 0:
            shadow_fibers.append(fiber)
        else:
            white_fibers.append(fiber)

    curve_bundle_poly("ZhaoYunV2_Plume_White_Horsehair", white_fibers, materials["white"], 0.00155)
    curve_bundle_poly("ZhaoYunV2_Plume_Cool_Depth", shadow_fibers, materials["plume_shadow"], 0.00145)
    curve_bundle_poly("ZhaoYunV2_Plume_Cyan_Edge", cyan_fibers, materials["cyan"], 0.00170)


def diamond(name, location, scale, material):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler.y = math.radians(45.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(obj, 0.0035, 3)
    assign(obj, material)
    return obj


def refine_armor(materials):
    # Remove the remaining warm-gold holdovers so the white/silver/sky-blue
    # Zhao Yun palette is coherent from head to waist.
    for obj in bpy.data.objects:
        name = obj.name
        if any(token in name for token in ("Gold_Medallion", "Harness_Stud", "Crimson_Lacing")):
            assign(obj, materials["cyan"] if "Stud" in name or "Lacing" in name else materials["silver_bright"])
        elif name.startswith("Fullbody_Belt_Rivet_"):
            assign(obj, materials["silver_bright"])

    remove_matching("ZhaoYunV2_Chest_Crest_")
    diamond("ZhaoYunV2_Chest_Crest_Silver", (0.0, -0.2265, 1.335), (0.031, 0.0042, 0.031), materials["silver_bright"])
    diamond("ZhaoYunV2_Chest_Crest_Jade", (0.0, -0.2330, 1.335), (0.020, 0.0030, 0.020), materials["cyan"])
    for side in (-1, 1):
        strand(
            f"ZhaoYunV2_Chest_Crest_Wing_{side:+d}",
            [
                (side * 0.012, -0.235, 1.340),
                (side * 0.045, -0.234, 1.354),
                (side * 0.078, -0.230, 1.340),
                (side * 0.104, -0.224, 1.352),
            ],
            0.0028,
            materials["silver_bright"],
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
    body = bpy.data.objects["Zhao_Yun_Basemesh"]
    materials = make_materials()
    youth_face(body)
    refine_mouth(materials)
    refine_plume(materials)
    refine_armor(materials)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.30
    camera = scene.camera
    render(scene, camera, FRONT, (900, 1300), (-0.05, -6.55, 1.17), (-0.01, -0.03, 1.18), 72)
    render(scene, camera, UPPER, (1000, 1000), (0.50, -3.72, 1.47), (0.0, -0.06, 1.34), 82)
    render(scene, camera, FACE, (1000, 1000), (0.38, -2.32, 1.64), (0.0, -0.095, 1.57), 96)
    render(scene, camera, THREE_QUARTER, (1000, 1000), (0.90, -2.45, 1.66), (0.0, -0.08, 1.55), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
