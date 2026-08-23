"""Refine Zhao Yun v11 skin, brushed armor, leather, and silk response."""

from __future__ import annotations

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v11-grounded-stance.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v12-material-realism.blend"


def set_value_node(group, name, value):
    node = group.nodes.get(name)
    if node and node.type == "VALUE":
        node.outputs[0].default_value = value


def refine_skin():
    settings = bpy.data.node_groups.get("CharMorphSettings")
    if settings:
        values = {
            "Melanin Fraction": 0.365,
            "Hemoglobin Fraction": 0.80,
            "Saturation": 1.045,
            "Value": 0.955,
            "Five O' Clock Shadow": 0.052,
            "Global Bump Strength": 0.87,
            "Micro Bump Strength": 0.92,
            "Roughness Multiplier": 1.075,
            "Sebum Roughness": 0.57,
            "Subsurface Scale Multiplier": 0.74,
        }
        for name, value in values.items():
            set_value_node(settings, name, value)


def add_brushed_metal_detail(material, edge_color, brush_strength=0.055):
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf or nodes.get("ZY12 Brushed Wave"):
        return

    coord = nodes.get("Texture Coordinate")
    if coord is None:
        coord = nodes.new("ShaderNodeTexCoord")
        coord.name = "ZY12 Metal Coordinates"

    previous_color = bsdf.inputs["Base Color"].links[0].from_socket if bsdf.inputs["Base Color"].is_linked else None
    previous_normal = bsdf.inputs["Normal"].links[0].from_socket if bsdf.inputs["Normal"].is_linked else None

    layer = nodes.new("ShaderNodeLayerWeight")
    layer.name = "ZY12 Edge Facing"
    layer.inputs["Blend"].default_value = 0.28
    edge_ramp = nodes.new("ShaderNodeValToRGB")
    edge_ramp.name = "ZY12 Edge Wear Mask"
    edge_ramp.color_ramp.elements[0].position = 0.06
    edge_ramp.color_ramp.elements[0].color = (0.18, 0.18, 0.18, 1.0)
    edge_ramp.color_ramp.elements[1].position = 0.62
    edge_ramp.color_ramp.elements[1].color = (0.0, 0.0, 0.0, 1.0)
    links.new(layer.outputs["Facing"], edge_ramp.inputs["Fac"])

    mix = nodes.new("ShaderNodeMixRGB")
    mix.name = "ZY12 Subtle Edge Wear"
    mix.blend_type = "MIX"
    mix.inputs[2].default_value = (*edge_color, 1.0)
    links.new(edge_ramp.outputs["Color"], mix.inputs["Fac"])
    if previous_color:
        links.new(previous_color, mix.inputs[1])
    else:
        mix.inputs[1].default_value = bsdf.inputs["Base Color"].default_value
    links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])

    wave = nodes.new("ShaderNodeTexWave")
    wave.name = "ZY12 Brushed Wave"
    wave.wave_type = "BANDS"
    wave.bands_direction = "Z"
    wave.inputs["Scale"].default_value = 310.0
    wave.inputs["Distortion"].default_value = 4.0
    wave.inputs["Detail"].default_value = 4.0
    wave.inputs["Detail Scale"].default_value = 2.2
    links.new(coord.outputs["Object"], wave.inputs["Vector"])

    bump = nodes.new("ShaderNodeBump")
    bump.name = "ZY12 Brushed Metal Bump"
    bump.inputs["Strength"].default_value = brush_strength
    bump.inputs["Distance"].default_value = 0.00065
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    if previous_normal:
        links.new(previous_normal, bump.inputs["Normal"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    bsdf.inputs["Metallic"].default_value = max(0.82, bsdf.inputs["Metallic"].default_value)


def refine_leather():
    material = bpy.data.materials.get("ZY6_Deep_Leather_Glove")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf or nodes.get("ZY12 Leather Grain"):
        return

    coord = nodes.get("Texture Coordinate")
    if coord is None:
        coord = nodes.new("ShaderNodeTexCoord")
        coord.name = "ZY12 Leather Coordinates"
    previous_normal = bsdf.inputs["Normal"].links[0].from_socket if bsdf.inputs["Normal"].is_linked else None

    grain = nodes.new("ShaderNodeTexNoise")
    grain.name = "ZY12 Leather Grain"
    grain.noise_dimensions = "3D"
    grain.inputs["Scale"].default_value = 82.0
    grain.inputs["Detail"].default_value = 7.0
    grain.inputs["Roughness"].default_value = 0.76
    links.new(coord.outputs["Object"], grain.inputs["Vector"])

    color_ramp = nodes.new("ShaderNodeValToRGB")
    color_ramp.name = "ZY12 Leather Color Variation"
    color_ramp.color_ramp.elements[0].position = 0.22
    color_ramp.color_ramp.elements[0].color = (0.006, 0.009, 0.015, 1.0)
    color_ramp.color_ramp.elements[1].position = 0.78
    color_ramp.color_ramp.elements[1].color = (0.032, 0.045, 0.065, 1.0)
    links.new(grain.outputs["Fac"], color_ramp.inputs["Fac"])
    links.new(color_ramp.outputs["Color"], bsdf.inputs["Base Color"])

    rough_ramp = nodes.new("ShaderNodeValToRGB")
    rough_ramp.name = "ZY12 Leather Roughness Variation"
    rough_ramp.color_ramp.elements[0].color = (0.48, 0.48, 0.48, 1.0)
    rough_ramp.color_ramp.elements[1].color = (0.68, 0.68, 0.68, 1.0)
    links.new(grain.outputs["Fac"], rough_ramp.inputs["Fac"])
    links.new(rough_ramp.outputs["Color"], bsdf.inputs["Roughness"])

    bump = nodes.new("ShaderNodeBump")
    bump.name = "ZY12 Leather Pore Bump"
    bump.inputs["Strength"].default_value = 0.13
    bump.inputs["Distance"].default_value = 0.0007
    links.new(grain.outputs["Fac"], bump.inputs["Height"])
    if previous_normal:
        links.new(previous_normal, bump.inputs["Normal"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.28


def refine_silk():
    for name, roughness, sheen in (
        ("ZY6_Pleated_Ivory_Silk", 0.66, 0.16),
        ("ZY4_Deep_Navy_Cloth", 0.70, 0.10),
    ):
        material = bpy.data.materials.get(name)
        if not material or not material.use_nodes:
            continue
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        bsdf.inputs["Roughness"].default_value = roughness
        if "Sheen Weight" in bsdf.inputs:
            bsdf.inputs["Sheen Weight"].default_value = sheen
        if "Sheen Roughness" in bsdf.inputs:
            bsdf.inputs["Sheen Roughness"].default_value = 0.62


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    refine_skin()
    add_brushed_metal_detail(
        bpy.data.materials.get("ZY4_Weathered_Silver"),
        (0.46, 0.52, 0.57),
        0.050,
    )
    add_brushed_metal_detail(
        bpy.data.materials.get("ZY4_Antique_Gold"),
        (0.48, 0.24, 0.055),
        0.036,
    )
    refine_leather()
    refine_silk()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
