"""Zhang Fei v4: older facial anatomy, grounded materials and rugged hair/headwear."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at
from create_zhang_fei_reference_v1 import curve_bundle


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v3.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v4.blend"
UPPER = SRC / "zhang-fei-reference-fullbody-v4-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v4-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v4-three-quarter.png"


def principal(material_name):
    material = bpy.data.materials.get(material_name)
    if not material or not material.use_nodes:
        return None
    return next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)


def tune_ramp(material_name, dark, light):
    material = bpy.data.materials.get(material_name)
    if not material or not material.use_nodes:
        return
    ramp = next((node for node in material.node_tree.nodes if node.type == "VALTORGB"), None)
    if not ramp:
        return
    elements = ramp.color_ramp.elements
    elements[0].color = (*dark, 1.0)
    elements[-1].color = (*light, 1.0)


def bake_weathered_warlord_face():
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    keys = body.data.shape_keys.key_blocks
    for name, value in (
        ("head-square", 0.075),
        ("head-age-incr", 0.155),
        ("chin-width-incr", 0.060),
        ("chin-prominent-incr", 0.025),
        ("l-cheek-bones-incr", 0.055),
        ("r-cheek-bones-incr", 0.070),
        ("nose-point-width-incr", 0.045),
    ):
        key = keys.get(name)
        if key:
            key.value = value

    old = keys.get("Zhang Fei v4 weathered warlord anatomy")
    if old:
        body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v4 weathered warlord anatomy", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > -0.075 or ax > 0.145 or not 1.515 < co.z < 1.730:
            continue

        # Strong nose bridge and broader alae keep the face from reading as a
        # smooth young hero beneath the beard.
        if ax < 0.019 and 1.620 < co.z < 1.674:
            weight = max(0.0, 1.0 - abs(co.z - 1.646) / 0.028)
            co.y -= 0.00115 * weight
        if 0.018 < ax < 0.047 and 1.598 < co.z < 1.624:
            weight = max(0.0, 1.0 - abs(co.z - 1.610) / 0.014)
            co.x *= 1.012 + 0.008 * weight
            co.y -= 0.00055 * weight

        # Slightly uneven cheek projection adds human asymmetry without
        # changing the recognizable broad Zhang Fei silhouette.
        if 0.047 < ax < 0.108 and 1.614 < co.z < 1.659:
            weight = max(0.0, 1.0 - abs(co.z - 1.638) / 0.025)
            if co.x > 0.0:
                co.y -= 0.00065 * weight
                co.x *= 1.004
            else:
                co.y -= 0.00030 * weight

        # A dense square jaw reads through the beard in the three-quarter view.
        if 0.046 < ax < 0.114 and 1.530 < co.z < 1.602:
            weight = max(0.0, 1.0 - abs(co.z - 1.566) / 0.038)
            co.x *= 1.008 + 0.006 * weight


def lower_inner_brow_tension():
    prefixes = ("ZhangFei_Heavy_Brow_", "ZhangFeiV2_Brow_Anchor_", "ZhangFei_Brow_Fibers_")
    for obj in bpy.data.objects:
        if obj.type != "CURVE" or not obj.name.startswith(prefixes):
            continue
        for spline in obj.data.splines:
            points = spline.bezier_points if spline.bezier_points else spline.points
            for point in points:
                co = point.co
                inner = max(0.0, 1.0 - abs(co.x) / 0.072)
                co.z -= 0.00085 * inner


def tune_skin_and_armor_materials():
    skin = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if skin and skin.use_nodes:
        nodes = skin.node_tree.nodes
        shader = principal("Guan_Yu_Basemesh.body")
        mature = nodes.get("V34 restrained mature skin color")
        pores = nodes.get("Fine facial micro pores")
        pore_bump = nodes.get("Micro pore normal")
        roughness = nodes.get("Map Range.003")
        complexion = nodes.get("Natural complexion variation")
        if shader:
            shader.inputs["Subsurface Weight"].default_value = 0.018
        if mature:
            mature.inputs["Saturation"].default_value = 0.78
            mature.inputs["Value"].default_value = 0.735
        if pores:
            pores.inputs["Scale"].default_value = 350.0
            pores.inputs["Detail"].default_value = 4.0
            pores.inputs["Roughness"].default_value = 0.72
        if pore_bump:
            pore_bump.inputs["Strength"].default_value = 0.135
            pore_bump.inputs["Distance"].default_value = 0.00055
        if roughness:
            roughness.inputs["To Min"].default_value = 0.55
            roughness.inputs["To Max"].default_value = 0.71
        if complexion:
            complexion.inputs["Scale"].default_value = 6.2
            complexion.inputs["Detail"].default_value = 4.8

    tune_ramp("Zhang Fei aged beast gold", (0.090, 0.037, 0.006), (0.225, 0.095, 0.020))
    tune_ramp("Zhang Fei dark crimson accent", (0.038, 0.0016, 0.0010), (0.105, 0.0050, 0.0028))
    tune_ramp("Zhang Fei dried oxblood leather", (0.022, 0.0025, 0.0018), (0.055, 0.0070, 0.0045))
    gold = principal("Zhang Fei aged beast gold")
    crimson = principal("Zhang Fei dark crimson accent")
    oxblood = principal("Zhang Fei dried oxblood leather")
    iron = principal("Zhang Fei blackened heavy iron")
    hair = principal("Zhang Fei deep coarse hair")
    if gold:
        gold.inputs["Roughness"].default_value = 0.43
        gold.inputs["Metallic"].default_value = 0.72
    if crimson:
        crimson.inputs["Roughness"].default_value = 0.56
    if oxblood:
        oxblood.inputs["Roughness"].default_value = 0.68
    if iron:
        iron.inputs["Roughness"].default_value = 0.43
    if hair:
        hair.inputs["Roughness"].default_value = 0.78
        hair.inputs["Specular IOR Level"].default_value = 0.18


def scale_mesh_about_center(obj, factors):
    if not obj or obj.type != "MESH":
        return
    vertices = obj.data.vertices
    if not vertices:
        return
    center = sum((vertex.co for vertex in vertices), start=vertices[0].co.copy() * 0.0) / len(vertices)
    for vertex in vertices:
        delta = vertex.co - center
        vertex.co = center + type(delta)((delta.x * factors[0], delta.y * factors[1], delta.z * factors[2]))
    obj.data.update()


def ruggedize_topknot_and_headband():
    core = bpy.data.objects.get("ZhangFeiV2_Hair_Bun_Core")
    if core:
        core.scale.x *= 0.95
        core.scale.z *= 1.16
        core.location.x -= 0.003
        core.location.z += 0.002

    coils = bpy.data.objects.get("ZhangFeiV2_Hair_Bun_Coils")
    if coils and coils.type == "CURVE":
        center_x, center_z = 0.006, 1.842
        for spline in coils.data.splines:
            points = spline.bezier_points if spline.bezier_points else spline.points
            for point in points:
                point.co.x = center_x + (point.co.x - center_x) * 0.95
                point.co.z = center_z + (point.co.z - center_z) * 1.16

    tie = bpy.data.objects.get("ZhangFeiV2_Hair_Oxblood_Tie")
    if tie:
        tie.scale.x *= 0.95
        tie.scale.z *= 1.04

    crest = bpy.data.objects.get("ZhangFei_Gold_Forehead_Crest")
    inlay = bpy.data.objects.get("Headcloth_Crest_Jade_Inlay")
    scale_mesh_about_center(crest, (0.88, 0.92, 0.88))
    scale_mesh_about_center(inlay, (0.84, 0.92, 0.84))
    for obj in bpy.data.objects:
        if obj.name.startswith("Headcloth_Gold_Stud_"):
            scale_mesh_about_center(obj, (0.76, 0.82, 0.76))

    # A few escaped strands break the perfectly groomed bun silhouette.
    deep = bpy.data.materials["Zhang Fei deep coarse hair"]
    rng = random.Random(4429)
    paths = []
    for index in range(34):
        side = -1.0 if index % 2 == 0 else 1.0
        root_x = 0.002 + side * rng.uniform(0.025, 0.041)
        root_z = rng.uniform(1.827, 1.858)
        root_y = rng.uniform(-0.062, -0.040)
        length = rng.uniform(0.014, 0.034)
        path = [
            (root_x, root_y, root_z),
            (root_x + side * length * 0.30, root_y - 0.002, root_z + rng.uniform(-0.006, 0.004)),
            (root_x + side * length, root_y + rng.uniform(-0.004, 0.004), root_z - rng.uniform(0.006, 0.024)),
        ]
        paths.append((path, rng.uniform(0.55, 1.05)))
    curve_bundle("ZhangFeiV4_Topknot_Escaped_Strands", paths, deep, 0.00034)


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
    bake_weathered_warlord_face()
    lower_inner_brow_tension()
    tune_skin_and_armor_materials()
    ruggedize_topknot_and_headband()

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
