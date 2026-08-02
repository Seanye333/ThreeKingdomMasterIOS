"""Create a stylized semi-realistic Zhao Yun prototype from the spear rig.

The goal is a coherent game character rather than a photoreal scan: youthful
heroic proportions, readable eyes, solid swept hair, silver dragon-scale armor,
a white cape and a clean Dragon-Gallant spear silhouette.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import (
    assign,
    bevel,
    cone_between,
    cylinder_between,
    look_at,
    mat,
    sphere,
    strand,
    tapered_panel,
)
from create_liu_bei_reference_v1 import remove_matching
from refine_liu_bei_reference_v2 import create_scale_plate, create_soft_armor_backing
from refine_liu_bei_reference_v3 import curve_bundle_poly


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
HEAD_SOURCE = SRC / "guan-yu-reference-fullbody-v44.blend"
INPUT_BLEND = HEAD_SOURCE
SKIN_SOURCE = SRC / "guan-yu-mpfb-base.blend"
OUTPUT_BLEND = SRC / "zhao-yun-stylized-v1.blend"
FRONT = SRC / "zhao-yun-stylized-v1-front.png"
UPPER = SRC / "zhao-yun-stylized-v1-upper.png"
FACE = SRC / "zhao-yun-stylized-v1-face.png"
THREE_QUARTER = SRC / "zhao-yun-stylized-v1-three-quarter.png"


def capture_human_head():
    bpy.ops.wm.open_mainfile(filepath=str(HEAD_SOURCE))
    source = bpy.data.objects["Guan_Yu_Basemesh"]
    mixed = source.shape_key_add(name="Temporary Zhao Yun head capture", from_mix=True)
    coordinates = [tuple(point.co) for point in mixed.data]
    source.shape_key_remove(mixed)
    return coordinates


def remove_guan_yu_identity():
    remove_matching(
        "V34_Groom_Beard_", "V34_Groom_Moustache_", "V40_Beard_Root_",
        "V34_Groom_Chin_Transition", "V34_Groom_Flyaways", "V34_Groom_Head_Hair_",
        "V31_Nostril_",
        "Fullbody_Blade_", "Fullbody_Crimson_Pole_Grip_", "V29_Blade_",
        "V29_Green_Dragon_Crescent_Blade", "V29_Crescent_Polished_Cutting_Edge",
    )


def prepare_source_body():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    body.name = "Zhao_Yun_Basemesh"
    rig = bpy.data.objects.get("Guan_Yu_Game_Rig")
    if rig:
        rig.name = "Zhao_Yun_Game_Rig"
    pores = body.modifiers.get("V32 physical facial pores")
    if pores:
        body.modifiers.remove(pores)
    return body


def restore_young_stylized_head(source_coordinates):
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    body.name = "Zhao_Yun_Basemesh"
    rig = bpy.data.objects.get("Zhang_Fei_Game_Rig")
    if rig:
        rig.name = "Zhao_Yun_Game_Rig"
    if len(source_coordinates) != len(body.data.vertices):
        raise RuntimeError("Zhao Yun and MPFB head topology do not match")

    key = body.shape_key_add(name="Zhao Yun youthful stylized head", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for index, point in enumerate(key.data):
        sx, sy, sz = source_coordinates[index]
        if abs(sx) < 0.150 and sy < 0.145 and 1.500 < sz < 1.835:
            point.co = (sx, sy, sz)

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if ax > 0.140 or co.y > 0.090 or not 1.505 < co.z < 1.790:
            continue

        # Handsome oval jaw and high smooth cheek plane.
        if 1.515 < co.z < 1.610 and 0.033 < ax < 0.105:
            jaw = max(0.0, 1.0 - abs(co.z - 1.565) / 0.050)
            co.x *= 1.0 - 0.050 * jaw
        if 1.625 < co.z < 1.680 and 0.040 < ax < 0.105:
            cheek = max(0.0, 1.0 - abs(co.z - 1.650) / 0.030)
            co.x *= 1.0 + 0.010 * cheek

        # Open, alert eyes for a stylized heroic read without exposing globes.
        for eye_x in (-0.0327, 0.0327):
            dx = abs(co.x - eye_x)
            if dx < 0.030 and co.y < -0.090:
                lateral = max(0.0, 1.0 - dx / 0.030)
                if 1.674 < co.z < 1.694:
                    co.z += 0.0002 * lateral
                elif 1.654 < co.z < 1.674:
                    co.z -= 0.00010 * lateral

        # Smaller straight nose and clean youthful mouth.
        if ax < 0.030 and 1.600 < co.z < 1.670 and co.y < -0.095:
            co.x *= 0.972
            co.y += 0.0008
        if 0.031 < ax < 0.052 and 1.568 < co.z < 1.590 and co.y < -0.130:
            co.z += 0.0015 * max(0.0, 1.0 - abs(co.z - 1.579) / 0.012)

    body.data.update()
    for polygon in body.data.polygons:
        polygon.use_smooth = True

    pores = body.modifiers.get("V32 physical facial pores")
    if pores:
        body.modifiers.remove(pores)
    return body


def restore_clean_young_skin(body):
    current = body.material_slots[0].material
    if current:
        current.name = "Zhang Fei skin backup"
    with bpy.data.libraries.load(str(SKIN_SOURCE), link=False) as (source, target):
        if "Guan_Yu_Basemesh.body" not in source.materials:
            raise RuntimeError("MPFB young Asian skin material is missing")
        target.materials = ["Guan_Yu_Basemesh.body"]
    skin = target.materials[0]
    skin.name = "Zhao Yun clean stylized fair skin"
    body.material_slots[0].material = skin
    if skin.use_nodes:
        shader = next((node for node in skin.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.58
            shader.inputs["Subsurface Weight"].default_value = 0.055
            if "Coat Weight" in shader.inputs:
                shader.inputs["Coat Weight"].default_value = 0.018


def make_materials():
    skin = mat("Zhao Yun warm stylized hero skin", (0.34, 0.135, 0.068, 1), 0.57, noise=17.0, bump=0.018)
    skin_shader = next((node for node in skin.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if skin_shader:
        skin_shader.inputs["Subsurface Weight"].default_value = 0.040
    silver = mat("Zhao Yun stylized moon silver", (0.36, 0.43, 0.54, 1), 0.25, metallic=0.83, noise=18.0, bump=0.018)
    silver_bright = mat("Zhao Yun bright silver edge", (0.60, 0.70, 0.84, 1), 0.19, metallic=0.90, noise=13.0, bump=0.010)
    silver_dark = mat("Zhao Yun blue shadow steel", (0.070, 0.115, 0.180, 1), 0.34, metallic=0.72, noise=23.0, bump=0.025)
    white = mat("Zhao Yun pearl white silk", (0.70, 0.73, 0.78, 1), 0.48, noise=15.0, bump=0.030)
    white_shadow = mat("Zhao Yun pale blue silk shadow", (0.28, 0.38, 0.52, 1), 0.52, noise=18.0, bump=0.035)
    blue = mat("Zhao Yun loyal Shu blue", (0.025, 0.105, 0.205, 1), 0.44, noise=24.0, bump=0.032)
    cyan = mat("Zhao Yun clear sky jade", (0.020, 0.38, 0.52, 1), 0.25, metallic=0.08, noise=15.0, bump=0.010)
    gold = mat("Zhao Yun restrained pale gold", (0.42, 0.28, 0.080, 1), 0.31, metallic=0.78, noise=14.0, bump=0.014)
    hair = mat("Zhao Yun stylized blue black hair", (0.002, 0.006, 0.014, 1), 0.54, noise=24.0, bump=0.020)
    hair_hi = mat("Zhao Yun cool hair highlight", (0.010, 0.028, 0.060, 1), 0.47, noise=28.0, bump=0.016)
    eye_white = mat("Zhao Yun warm clear sclera", (0.32, 0.27, 0.225, 1), 0.38, noise=8.0, bump=0.004)
    iris_outer = mat("Zhao Yun deep limbal ring", (0.003, 0.006, 0.010, 1), 0.22)
    iris = mat("Zhao Yun bright dark brown iris", (0.050, 0.022, 0.008, 1), 0.22, noise=42.0, bump=0.012)
    pupil = mat("Zhao Yun pupil", (0.00005, 0.00003, 0.00002, 1), 0.15)
    lid = mat("Zhao Yun stylized warm eyelid", (0.155, 0.045, 0.030, 1), 0.55, noise=18.0, bump=0.004)
    lip = mat("Zhao Yun restrained youthful lip", (0.135, 0.030, 0.025, 1), 0.52, noise=20.0, bump=0.004)
    catchlight = mat("Zhao Yun heroic eye catchlight", (0.92, 0.92, 0.88, 1), 0.08)
    return locals()


def build_stylized_face(materials):
    # Keep the v44 eye stack in place with its original socket fit.  Only
    # simplify the age lines and darken the proven brow grooming for a youthful
    # but determined Zhao Yun expression.
    remove_matching("Portrait_Brow_Furrow_", "V39_Face_UnderEye_Crease_", "V39_Face_Brow_Anchor_")
    for obj in bpy.data.objects:
        if obj.name.startswith(("Portrait_Brow_", "V32_Brow_Density_")):
            assign(obj, materials["hair"])


def build_stylized_hair_and_crown(materials):
    # Convert the fitted Han headcloth into a compact silver cavalry helmet.
    for obj in bpy.data.objects:
        name = obj.name
        if name == "Portrait_Fitted_Headcloth":
            assign(obj, materials["silver_dark"])
            obj.name = "ZhaoYun_Fitted_Silver_Helmet"
        elif name == "Curved_Cloth_Diadem":
            assign(obj, materials["silver_bright"])
            obj.name = "ZhaoYun_Silver_Helmet_Diadem"
        elif name.startswith("Diadem_Gold_"):
            assign(obj, materials["cyan"])
        elif name.startswith(("Headcloth_Cloud_Filigree_", "V34_Headcloth_Fold_", "V32_Headcloth_Seam_", "V40_Headcloth_Tension_Fold_")):
            assign(obj, materials["silver_bright"])
        elif name.startswith("Headcloth_Gold_Stud_"):
            assign(obj, materials["silver_bright"])
        elif name in ("Headcloth_Crest_Jade_Inlay", "Headcloth_Imperial_Cloud_Crest"):
            assign(obj, materials["cyan"] if "Jade" in name else materials["silver_bright"])
        elif name.startswith("Headcloth_Long_Tail_"):
            assign(obj, materials["white"])
        elif name.startswith("Headcloth_Tail_Gold_Edge_"):
            assign(obj, materials["cyan"])
        elif name.startswith("V34_Groom_Head_Hair_"):
            assign(obj, materials["hair"])

    # A clean white horsehair plume gives Zhao Yun an immediate cavalry-hero
    # silhouette while retaining historically plausible Han helmet structure.
    sphere("ZhaoYun_Helmet_Plume_Socket", (0.0, 0.015, 1.834), (0.021, 0.018, 0.024), materials["silver_bright"], 32, 16)
    for index in range(13):
        spread = (index - 6) / 6.0
        material = materials["cyan"] if index in (0, 12) else materials["white"]
        strand(
            f"ZhaoYun_White_Horsehair_Plume_{index}",
            [
                (spread * 0.008, 0.020, 1.846),
                (spread * 0.030, 0.080 + abs(spread) * 0.015, 1.940 + (1.0 - abs(spread)) * 0.030),
                (spread * 0.060, 0.205 + abs(spread) * 0.040, 1.930 - abs(spread) * 0.055),
            ],
            0.0032 if index in (0, 12) else 0.0040,
            material,
            taper=True,
        )


def recolor_costume(materials):
    for obj in bpy.data.objects:
        name = obj.name
        if name.startswith(("ZhaoYun_", "Zhao_Yun_")):
            continue
        if name.startswith("Dragon_"):
            assign(obj, materials["silver"])
        elif name.startswith("V37_Dragon_Belt_"):
            assign(obj, materials["cyan"] if "Eye" in name else materials["silver_dark"])
        elif any(token in name for token in ("Waist_Lamella", "Pauldron_Scale", "Right_Pauldron_Layer", "Fitted_Greave", "Dragon_Pauldron_Base", "Sculpted_Dragon_Head")):
            assign(obj, materials["silver"])
        elif any(token in name for token in ("Gold_Edge", "Gold_Binding", "Gold_Piping", "Gold_Cuff", "Belt_Rivet", "Waist_Rivet", "Pauldron_Rivet")):
            assign(obj, materials["silver_bright"])
        elif any(token in name for token in ("Cross_Sash", "Dark_Chest_Vest", "Dragon_Armor_Harness")):
            assign(obj, materials["blue"])
        elif "Crossed_Lapel" in name:
            assign(obj, materials["blue"])
        elif any(token in name for token in ("Sleeve", "Deep_Green_Robe", "Layered_Green_Battle_Robe", "Robe_Front", "Flowing_Robe_Main")):
            assign(obj, materials["white"])
        elif any(token in name for token in ("Flowing_Robe_Shadow", "Robe_Dark_Inner", "Side_Tasset")):
            assign(obj, materials["white_shadow"])
        elif any(token in name for token in ("Leather_Bracers", "Leather_Battle_Boots", "Fitted_Han_Riding_Shoe", "Dark_Split_Trousers")):
            assign(obj, materials["silver_dark"])
        elif any(token in name for token in ("Buckle_Jade", "Jade_Center", "Jade_Stud", "Jade_Eye", "Headcloth_Crest_Jade")):
            assign(obj, materials["cyan"])
        elif any(token in name for token in ("Curved_Leather_Belt", "Dragon_Belt_Buckle")):
            assign(obj, materials["silver_dark"])

    # Additional silver chest scales unify the upper body with the waist armor.
    backing = create_soft_armor_backing(materials["blue"])
    backing.name = "ZhaoYun_Chest_Scale_Blue_Backing"
    for row in range(5):
        z = 1.420 - row * 0.034
        for col in range(6):
            x = (col - 2.5) * 0.034
            y = -0.213 + 0.012 * (x / 0.18) ** 2
            plate = create_scale_plate(f"ZhaoYun_Silver_Dragon_Scale_{row}_{col}", (x, y, z), 0.0125, 0.0110, 0.0028, materials["silver"])
            if (row + col) % 4 == 0:
                sphere(f"ZhaoYun_Scale_Jade_Rivet_{row}_{col}", (x, y - 0.0044, z + 0.006), (0.0019, 0.0010, 0.0019), materials["cyan"], 18, 9)


def build_white_cape(materials):
    cape = tapered_panel("ZhaoYun_Pearl_White_Cape", 1.485, 0.600, 0.255, 0.365, 0.155, 0.008, materials["white"])
    cape.rotation_euler.x = math.radians(-2.5)
    for side in (-1, 1):
        strand(
            f"ZhaoYun_Cape_Blue_Edge_{side:+d}",
            [(side * 0.250, 0.144, 1.475), (side * 0.300, 0.170, 1.105), (side * 0.355, 0.205, 0.610)],
            0.0042,
            materials["white_shadow"],
            taper=False,
        )
    for x in (-0.16, -0.08, 0.0, 0.08, 0.16):
        strand("ZhaoYun_Cape_Fold_" + str(x), [(x * 0.75, 0.143, 1.450), (x, 0.168, 1.050), (x * 1.45, 0.196, 0.625)], 0.0015, materials["white_shadow"], taper=True)


def pole_endpoints(pole):
    corners = [pole.matrix_world @ Vector(corner) for corner in pole.bound_box]
    ordered = sorted(corners, key=lambda point: point.z)
    bottom = sum(ordered[:4], Vector()) / 4
    top = sum(ordered[-4:], Vector()) / 4
    return bottom, top


def rebuild_dragon_gut_spear(materials):
    pole = bpy.data.objects.get("Fullbody_Green_Dragon_Pole")
    if not pole:
        raise RuntimeError("Guan Yu polearm shaft is missing")
    pole.name = "ZhaoYun_Dragon_Gut_Spear_Shaft"
    assign(pole, materials["silver_dark"])
    bottom, top = pole_endpoints(pole)
    direction = (top - bottom).normalized()
    base = top - direction * 0.012
    collar_end = top + direction * 0.035
    tip = top + direction * 0.255
    cylinder_between("ZhaoYun_Spear_Silver_Collar", base, collar_end, 0.030, materials["silver_bright"], 40)
    cone_between("ZhaoYun_Dragon_Gut_Spearhead", collar_end, tip, 0.050, 0.0025, materials["silver_bright"], 4)
    cylinder_between("ZhaoYun_Spearhead_Blue_Ridge", collar_end + direction * 0.015, tip - direction * 0.030, 0.0060, materials["cyan"], 16)
    sphere("ZhaoYun_Spear_Jade_Gem", tuple(collar_end - direction * 0.006), (0.016, 0.016, 0.016), materials["cyan"], 32, 16)

    side = Vector((direction.y, -direction.x, 0.0))
    if side.length < 0.1:
        side = Vector((1.0, 0.0, 0.0))
    side.normalize()
    for index in range(7):
        offset = side * ((index - 3) * 0.006)
        root = collar_end - direction * 0.010 + offset
        strand(
            f"ZhaoYun_White_Spear_Tassel_{index}",
            [tuple(root), tuple(root - direction * 0.055 + side * math.sin(index) * 0.010), tuple(root - direction * 0.145 + side * (index - 3) * 0.008)],
            0.0018,
            materials["white"],
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
    remove_guan_yu_identity()
    body = prepare_source_body()
    restore_clean_young_skin(body)
    materials = make_materials()
    body.material_slots[0].material = materials["skin"]
    build_stylized_face(materials)
    build_stylized_hair_and_crown(materials)
    recolor_costume(materials)
    build_white_cape(materials)
    rebuild_dragon_gut_spear(materials)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.28
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
