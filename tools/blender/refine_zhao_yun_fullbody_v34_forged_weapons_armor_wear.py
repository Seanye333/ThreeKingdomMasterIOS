"""Refine Zhao Yun's spear, tassel, wood/leather, and subtle armor edge wear."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v33-skin-eyes-cross-collar.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v34-forged-weapons-armor-wear.blend"


def make_principled_material(name, base_color, metallic, roughness):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def create_poly_curve(name, points, bevel_depth, material):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def add_spearhead_engravings():
    engraving = make_principled_material(
        "ZY34_Spearhead_Engraved_Steel",
        (0.018, 0.038, 0.066, 1.0),
        0.88,
        0.30,
    )
    base = Vector((0.354, 0.0235, 1.786))
    tip = Vector((0.568, 0.0235, 1.979))
    axis = (tip - base).normalized()
    perpendicular = Vector((-axis.z, 0.0, axis.x)).normalized()
    length = (tip - base).length
    created = []
    for sign in (-1.0, 1.0):
        points = (
            base + axis * (length * 0.13) + perpendicular * (sign * 0.010),
            base + axis * (length * 0.35) + perpendicular * (sign * 0.032),
            base + axis * (length * 0.61) + perpendicular * (sign * 0.027),
            base + axis * (length * 0.83) + perpendicular * (sign * 0.008),
        )
        created.append(
            create_poly_curve(
                f"ZhaoYun_V34_Spearhead_Engraved_Groove_{'l' if sign < 0 else 'r'}",
                points,
                0.00135,
                engraving,
            ).name
        )
    for sign in (-1.0, 1.0):
        points = (
            base + axis * (length * 0.20) + perpendicular * (sign * 0.006),
            base + axis * (length * 0.43) + perpendicular * (sign * 0.017),
            base + axis * (length * 0.66) + perpendicular * (sign * 0.012),
        )
        created.append(
            create_poly_curve(
                f"ZhaoYun_V34_Spearhead_Inner_Groove_{'l' if sign < 0 else 'r'}",
                points,
                0.00072,
                engraving,
            ).name
        )
    return created


def refine_blue_steel():
    material = bpy.data.materials["ZY26_Spear_Blue_Steel"]
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes["Principled BSDF"]
    coord = nodes.new("ShaderNodeTexCoord")
    coord.name = "ZY34_Blade_TexCoord"
    coord.location = (-650, -160)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = "ZY34_Blade_Micro_Scratches"
    noise.location = (-430, -160)
    noise.inputs["Scale"].default_value = 165.0
    noise.inputs["Detail"].default_value = 2.2
    noise.inputs["Roughness"].default_value = 0.56
    bump = nodes.new("ShaderNodeBump")
    bump.name = "ZY34_Blade_Scratch_Bump"
    bump.location = (-180, -210)
    bump.inputs["Strength"].default_value = 0.10
    bump.inputs["Distance"].default_value = 0.00028
    layer = nodes.new("ShaderNodeLayerWeight")
    layer.name = "ZY34_Blade_Facing"
    layer.location = (-430, 50)
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "ZY34_Blade_Blue_Steel_Ramp"
    ramp.location = (-180, 70)
    ramp.color_ramp.elements[0].position = 0.08
    ramp.color_ramp.elements[0].color = (0.085, 0.15, 0.245, 1.0)
    ramp.color_ramp.elements[1].position = 0.92
    ramp.color_ramp.elements[1].color = (0.42, 0.55, 0.69, 1.0)
    links.new(coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(layer.outputs["Facing"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.96
    bsdf.inputs["Roughness"].default_value = 0.18
    return material.name


def add_wood_grain():
    material = bpy.data.materials["ZY4_Dark_Spear_Wood"]
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes["Principled BSDF"]
    coord = nodes.new("ShaderNodeTexCoord")
    coord.name = "ZY34_Wood_TexCoord"
    coord.location = (-650, -80)
    wave = nodes.new("ShaderNodeTexWave")
    wave.name = "ZY34_Longitudinal_Wood_Grain"
    wave.location = (-430, -60)
    wave.wave_type = "BANDS"
    wave.bands_direction = "Z"
    wave.inputs["Scale"].default_value = 13.0
    wave.inputs["Distortion"].default_value = 6.0
    wave.inputs["Detail"].default_value = 5.0
    wave.inputs["Detail Scale"].default_value = 2.2
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "ZY34_Dark_Wood_Color"
    ramp.location = (-190, 10)
    ramp.color_ramp.elements[0].position = 0.24
    ramp.color_ramp.elements[0].color = (0.014, 0.004, 0.002, 1.0)
    ramp.color_ramp.elements[1].position = 0.76
    ramp.color_ramp.elements[1].color = (0.105, 0.028, 0.010, 1.0)
    bump = nodes.new("ShaderNodeBump")
    bump.name = "ZY34_Wood_Grain_Bump"
    bump.location = (-180, -180)
    bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.00075
    links.new(coord.outputs["Generated"], wave.inputs["Vector"])
    links.new(wave.outputs["Color"], ramp.inputs["Fac"])
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Metallic"].default_value = 0.02
    bsdf.inputs["Roughness"].default_value = 0.48
    return material.name


def add_leather_wear():
    material = bpy.data.materials["ZY5_Spear_Leather"]
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes["Principled BSDF"]
    coord = nodes.new("ShaderNodeTexCoord")
    coord.name = "ZY34_Grip_TexCoord"
    coord.location = (-650, -100)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = "ZY34_Grip_Leather_Pores"
    noise.location = (-430, -100)
    noise.inputs["Scale"].default_value = 42.0
    noise.inputs["Detail"].default_value = 4.5
    noise.inputs["Roughness"].default_value = 0.70
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "ZY34_Grip_Worn_Color"
    ramp.location = (-190, 20)
    ramp.color_ramp.elements[0].color = (0.018, 0.006, 0.004, 1.0)
    ramp.color_ramp.elements[1].color = (0.12, 0.032, 0.018, 1.0)
    bump = nodes.new("ShaderNodeBump")
    bump.name = "ZY34_Grip_Pore_Bump"
    bump.location = (-180, -180)
    bump.inputs["Strength"].default_value = 0.13
    bump.inputs["Distance"].default_value = 0.00065
    links.new(coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.54
    return material.name


def add_tassel_fiber(material, base_color, roughness, scale):
    bsdf = material.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.18
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 3.5
    noise.inputs["Roughness"].default_value = 0.72
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    bump.inputs["Distance"].default_value = 0.00028
    links.new(coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def scale_mesh_world_xy(obj, factor):
    center = obj.matrix_world @ (
        sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    )
    inverse = obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        relative = world - center
        world = center + Vector((relative.x * factor, relative.y * factor, relative.z))
        vertex.co = inverse @ world
    obj.data.update()


def refine_tassel():
    source = bpy.data.materials["ZY4_Deep_Crimson"]
    variants = []
    settings = (
        ((0.075, 0.004, 0.009, 1.0), 0.72, 84.0),
        ((0.17, 0.008, 0.016, 1.0), 0.66, 92.0),
        ((0.30, 0.022, 0.030, 1.0), 0.60, 100.0),
    )
    for index, (color, roughness, scale) in enumerate(settings):
        material = source.copy()
        material.name = f"ZY34_Tassel_Fiber_{index}"
        add_tassel_fiber(material, color, roughness, scale)
        variants.append(material)

    changed = []
    strands = sorted(
        [
            obj
            for obj in bpy.data.objects
            if obj.name.startswith("ZhaoYun_V16_Spear_Tassel_Lock_")
            and obj.type == "MESH"
        ],
        key=lambda obj: obj.name,
    )
    for index, strand in enumerate(strands):
        if strand.active_material and "Gold" in strand.active_material.name:
            continue
        scale_mesh_world_xy(strand, 0.76)
        strand.data.materials.clear()
        strand.data.materials.append(variants[index % len(variants)])
        changed.append(strand.name)
    return changed


def add_clean_armor_edge_wear():
    material = bpy.data.materials["ZY2_Armor_Silver"]
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes["Principled BSDF"]
    base_input = bsdf.inputs["Base Color"]
    old_link = next((link for link in links if link.to_socket == base_input), None)
    if not old_link:
        return False
    base_socket = old_link.from_socket
    links.remove(old_link)
    facing = nodes.new("ShaderNodeLayerWeight")
    facing.name = "ZY34_Armor_Edge_Facing"
    facing.location = (-240, 180)
    mask = nodes.new("ShaderNodeValToRGB")
    mask.name = "ZY34_Armor_Edge_Mask"
    mask.location = (-20, 180)
    mask.color_ramp.elements[0].position = 0.08
    mask.color_ramp.elements[0].color = (1.0, 1.0, 1.0, 1.0)
    mask.color_ramp.elements[1].position = 0.56
    mask.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
    mix = nodes.new("ShaderNodeMixRGB")
    mix.name = "ZY34_Subtle_Armor_Edge_Wear"
    mix.blend_type = "MIX"
    mix.location = (210, 110)
    mix.inputs[2].default_value = (0.46, 0.53, 0.61, 1.0)
    links.new(facing.outputs["Facing"], mask.inputs["Fac"])
    links.new(mask.outputs["Color"], mix.inputs[0])
    links.new(base_socket, mix.inputs[1])
    links.new(mix.outputs["Color"], base_input)
    return True


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    engravings = add_spearhead_engravings()
    blade = refine_blue_steel()
    wood = add_wood_grain()
    leather = add_leather_wear()
    tassel = refine_tassel()
    armor = add_clean_armor_edge_wear()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"SPEARHEAD_ENGRAVINGS={engravings}")
    print(f"BLADE_MATERIAL={blade}")
    print(f"WOOD_MATERIAL={wood}")
    print(f"LEATHER_MATERIAL={leather}")
    print(f"REFINED_TASSEL_STRANDS={len(tassel)}")
    print(f"ARMOR_EDGE_WEAR={armor}")


if __name__ == "__main__":
    main()
