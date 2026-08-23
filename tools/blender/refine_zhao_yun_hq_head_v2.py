"""Rebuild the Zhao Yun HQ face gate after the v1 quality review.

The v1 file proved the body registration, but it accidentally retained an old
Asian male skin map and flattened the entire lip group to eight percent of its
native height.  This pass corrects those structural issues, restores youthful
facial volume, narrows the eye aperture, replaces the string-like loose groom
with UV hair cards, and reduces the oversized circlet.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-hq-head-v1.blend"
OUTPUT_BLEND = SRC / "zhao-yun-hq-head-v2.blend"
YOUNG_SKIN = SRC / "makehuman-system-assets/skins/young_asian_male/young_lightskinned_male_diffuse3.png"
LONG_HAIR_OBJ = SRC / "makehuman-system-assets/hair/long01/long01.obj"
LONG_HAIR_TEXTURE = SRC / "makehuman-system-assets/hair/long01/long01_diffuse.png"
SHORT_HAIR_OBJ = SRC / "makehuman-system-assets/hair/short04/short04.obj"
SHORT_HAIR_TEXTURE = SRC / "makehuman-system-assets/hair/short04/short04_diffuse.png"
BROW_OBJ = SRC / "makehuman-system-assets/eyebrows/eyebrow008/eyebrow008.obj"
BROW_TEXTURE = SRC / "makehuman-system-assets/eyebrows/eyebrow008/eyebrow008.png"


def principled(material):
    if not material or not material.use_nodes:
        return None
    return next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)


def set_input(node, name, value):
    if node and name in node.inputs:
        node.inputs[name].default_value = value


def replace_youth_skin(body):
    skin = bpy.data.materials.get("Zhao Yun HQ textured youthful skin")
    if not skin:
        raise RuntimeError("Zhao Yun v1 skin material was not found")

    skin.name = "Zhao Yun HQ v2 young Asian skin"
    nodes = skin.node_tree.nodes
    image = bpy.data.images.load(str(YOUNG_SKIN), check_existing=True)
    image.colorspace_settings.name = "sRGB"
    for name in ("DiffuseTexture", "AlphaMapTexture"):
        if nodes.get(name):
            nodes[name].image = image

    # Remove the inherited Guan Yu weathering and desaturation.  Youthful skin
    # still keeps subtle color and pore breakup, but avoids waxy clear coat.
    warm = nodes.get("Portrait warm heroic complexion")
    if warm:
        warm.inputs[0].default_value = 0.44
        warm.inputs[2].default_value = (0.84, 0.66, 0.56, 1.0)
    weathered = nodes.get("V34 weathered bronze complexion")
    if weathered:
        weathered.inputs[0].default_value = 0.0
    mature = nodes.get("V34 restrained mature skin color")
    if mature:
        set_input(mature, "Saturation", 0.98)
        set_input(mature, "Value", 0.98)

    roughness = nodes.get("Map Range.003")
    if roughness:
        set_input(roughness, "To Min", 0.47)
        set_input(roughness, "To Max", 0.59)
    pore = nodes.get("Micro pore normal")
    if pore:
        set_input(pore, "Strength", 0.085)
        set_input(pore, "Distance", 0.00034)
    macro = nodes.get("Bump")
    if macro:
        set_input(macro, "Strength", 0.055)
        set_input(macro, "Distance", 0.00040)

    shader = principled(skin)
    set_input(shader, "Subsurface Weight", 0.038)
    set_input(shader, "Subsurface Scale", 0.012)
    set_input(shader, "Specular IOR Level", 0.23)
    set_input(shader, "Coat Weight", 0.006)
    set_input(shader, "Coat Roughness", 0.32)

    # Ensure the body continues using the renamed material.
    for slot in body.material_slots:
        if slot.material == skin:
            slot.material = skin


def group_indices(body, name, threshold=0.10):
    group = body.vertex_groups.get(name)
    if not group:
        return []
    return [
        vertex.index
        for vertex in body.data.vertices
        if any(item.group == group.index and item.weight > threshold for item in vertex.groups)
    ]


def rebuild_face_volume(body):
    keys = body.data.shape_keys.key_blocks
    current = keys.get("Zhao Yun HQ youthful portrait sculpt")
    source = keys.get("V44 rebuilt human head")
    if not current or not source:
        raise RuntimeError("Required Zhao Yun/V44 head shapes were not found")

    current.value = 1.0
    refined = body.shape_key_add(name="Zhao Yun HQ v2 facial anatomy correction", from_mix=True)
    for key in keys:
        if key.name not in ("Basis", refined.name):
            key.value = 0.0
    refined.value = 1.0

    # Restore real lip anatomy from the intact V44 topology.  It is kept
    # gently closed, not crushed into the horizontal slit seen in v1.
    lips = group_indices(body, "lips")
    src_center_y = sum(source.data[i].co.y for i in lips) / len(lips)
    src_center_z = sum(source.data[i].co.z for i in lips) / len(lips)
    for index in lips:
        src = source.data[index].co
        dst = refined.data[index].co
        dst.x = src.x * 0.965
        dst.y = -0.1417 + (src.y - src_center_y) * 0.82
        dst.z = 1.6000 + (src.z - src_center_z) * 0.32

        # Slightly fuller center, tapered corners, and a relaxed closed seam.
        center = max(0.0, 1.0 - abs(dst.x) / 0.030)
        dst.y -= 0.00035 * center
        if abs(dst.z - 1.6000) < 0.0014:
            dst.y += 0.0008

    # Narrow the eye aperture for Zhao Yun's calm, focused stare.  This acts on
    # the facial lids while leaving the proven wet eye objects registered.
    eye_indices = set(group_indices(body, "helper-l-eye") + group_indices(body, "helper-r-eye"))
    for index in eye_indices:
        co = refined.data[index].co
        mid = 1.6785
        co.z = mid + (co.z - mid) * 0.84
        if co.z > mid:
            co.y -= 0.0008

    # Build the slimmer, longer Zhao Yun silhouette from the portrait: defined
    # cheekbones, tapered jaw and a small projected chin rather than the round
    # MakeHuman default.
    for point in refined.data:
        co = point.co
        ax = abs(co.x)
        if co.y > 0.060 or not 1.515 < co.z < 1.720 or ax > 0.145:
            continue
        if 1.620 < co.z < 1.660 and 0.045 < ax < 0.108 and co.y < -0.090:
            weight = max(0.0, 1.0 - abs(co.z - 1.642) / 0.022)
            co.y -= 0.0018 * weight
            co.x *= 1.0 - 0.018 * weight
        if 1.525 < co.z < 1.610 and 0.030 < ax < 0.112:
            height = max(0.0, 1.0 - abs(co.z - 1.568) / 0.043)
            lateral = min(1.0, (ax - 0.030) / 0.070)
            co.x *= 1.0 - 0.085 * height * lateral
        if ax < 0.045 and 1.515 < co.z < 1.555 and co.y < -0.075:
            center = 1.0 - ax / 0.045
            co.y -= 0.0018 * center
            co.z -= 0.0042 * center

    subdiv = body.modifiers.get("V44 Portrait High Resolution")
    if subdiv:
        subdiv.levels = 2
        subdiv.render_levels = 2


def remove_string_groom_and_soften_brows():
    for obj in list(bpy.data.objects):
        if obj.name.startswith("ZhaoYun_HQ_Loose_Hair_") or obj.name in (
            "ZhaoYun_HQ_Textured_Ponytail_Hair",
            "ZhaoYun_HQ_Hair_Knot_Core",
        ) or obj.name.startswith("ZhaoYun_HQ_Hair_Knot_Wrap_"):
            bpy.data.objects.remove(obj, do_unlink=True)

    # V1 stacked two full eyebrow systems.  Keep the authored main brow and
    # remove the duplicate density pass that made them read as black stickers.
    for obj in list(bpy.data.objects):
        if obj.name.startswith("V32_Brow_Density_"):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif obj.name.startswith("V39_Face_Brow_Anchor_"):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif obj.name.startswith("Portrait_Brow_"):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif obj.name.startswith("V39_Face_Waterline_") or obj.name.startswith("V44_Eye_Tear_Duct_"):
            bpy.data.objects.remove(obj, do_unlink=True)


def uv_card_material(name, texture_path, darkness=0.105):
    material = bpy.data.materials.get(name)
    if material:
        return material
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.surface_render_method = "DITHERED"
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    darken = nodes.new("ShaderNodeHueSaturation")
    texture.image = bpy.data.images.load(str(texture_path), check_existing=True)
    texture.image.colorspace_settings.name = "sRGB"
    darken.inputs["Hue"].default_value = 0.52
    darken.inputs["Saturation"].default_value = 0.28
    darken.inputs["Value"].default_value = darkness
    darken.inputs["Fac"].default_value = 1.0
    links.new(texture.outputs["Color"], darken.inputs["Color"])
    links.new(darken.outputs["Color"], shader.inputs["Base Color"])
    links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    set_input(shader, "Roughness", 0.48)
    set_input(shader, "Specular IOR Level", 0.28)
    set_input(shader, "Coat Weight", 0.018)
    set_input(shader, "Coat Roughness", 0.42)
    set_input(shader, "Alpha", 1.0)
    return material


def import_long_hair():
    bpy.ops.wm.obj_import(filepath=str(LONG_HAIR_OBJ))
    hair = bpy.context.selected_objects[0]
    hair.name = "ZhaoYun_HQ_v2_Long_UV_Hair"
    hair.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    hair.scale = (0.105, 0.106, 0.128)
    hair.location = (0.0, 0.008, 0.952)
    hair.data.materials.clear()
    hair.data.materials.append(uv_card_material("Zhao Yun HQ v2 long UV hair cards", LONG_HAIR_TEXTURE))
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    return hair


def import_short_crown_hair():
    bpy.ops.wm.obj_import(filepath=str(SHORT_HAIR_OBJ))
    hair = bpy.context.selected_objects[0]
    hair.name = "ZhaoYun_HQ_v2_Swept_Crown_Hair"
    hair.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    hair.scale = (0.135, 0.058, 0.122)
    hair.location = (0.0, 0.0, 1.300)
    hair.data.materials.clear()
    hair.data.materials.append(uv_card_material("Zhao Yun HQ v2 crown UV hair cards", SHORT_HAIR_TEXTURE, 0.085))
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    return hair


def import_natural_brows():
    bpy.ops.wm.obj_import(filepath=str(BROW_OBJ))
    brows = bpy.context.selected_objects[0]
    brows.name = "ZhaoYun_HQ_v2_Natural_UV_Brows"
    brows.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    brows.scale = (0.100, 0.100, 0.120)
    brows.location = (0.0, 0.005, 0.940)
    brows.data.materials.clear()
    brows.data.materials.append(uv_card_material("Zhao Yun HQ v2 natural brow cards", BROW_TEXTURE, 0.050))
    for polygon in brows.data.polygons:
        polygon.use_smooth = True
    return brows


def reshape_circlet_and_plume():
    circlet = bpy.data.objects.get("ZhaoYun_HQ_Fitted_Silver_Circlet")
    if circlet and circlet.type == "MESH":
        zs = [vertex.co.z for vertex in circlet.data.vertices]
        center = (min(zs) + max(zs)) * 0.5
        for vertex in circlet.data.vertices:
            vertex.co.z = center + (vertex.co.z - center) * 0.62

    # These curves were decorative top/bottom piping for Guan Yu's much wider
    # headcloth.  Keeping them after thinning the circlet produced floating
    # horizontal bars across Zhao Yun's forehead.
    for obj in list(bpy.data.objects):
        if obj.name in ("Diadem_Gold_Top_Edge", "Diadem_Gold_Bottom_Edge") or obj.name.startswith(
            "Headcloth_Cloud_Filigree_"
        ) or obj.name.startswith("Headcloth_Gold_Stud_"):
            bpy.data.objects.remove(obj, do_unlink=True)

    # The flat v1 feather read as a plastic knife.  Hide it for this facial
    # quality gate; the proper layered plume will be rebuilt with the costume.
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_HQ_White_Feather"):
            obj.hide_render = True
            obj.hide_viewport = True


def tune_eye_color_and_lips(body):
    for name in ("V44 layered dark-brown iris", "V44 dark limbal ring"):
        material = bpy.data.materials.get(name)
        shader = principled(material)
        if shader:
            if name.endswith("iris"):
                set_input(shader, "Base Color", (0.035, 0.018, 0.010, 1.0))
                set_input(shader, "Roughness", 0.31)
            else:
                set_input(shader, "Base Color", (0.004, 0.002, 0.001, 1.0))

    # Use the photographed lips already present in the young Asian albedo.  V1
    # assigned a flat uniform lip shader, which made the mouth look painted on.
    skin_slot = next(
        (index for index, slot in enumerate(body.material_slots) if slot.material and slot.material.name == "Zhao Yun HQ v2 young Asian skin"),
        0,
    )
    lip_slots = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "Zhao Yun HQ natural muted lips"
    }
    for polygon in body.data.polygons:
        if polygon.material_index in lip_slots:
            polygon.material_index = skin_slot


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["Zhao_Yun_HQ_Basemesh"]
    replace_youth_skin(body)
    rebuild_face_volume(body)
    remove_string_groom_and_soften_brows()
    import_long_hair()
    import_short_crown_hair()
    import_natural_brows()
    reshape_circlet_and_plume()
    tune_eye_color_and_lips(body)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
