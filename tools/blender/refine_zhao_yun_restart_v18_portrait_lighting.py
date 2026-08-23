"""Reveal Zhao Yun's hair and facial structure with a pale atmospheric backdrop."""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v15-heroic-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v18-portrait-lighting.blend"


def add_atmospheric_backdrop():
    material = bpy.data.materials.new("ZhaoYun_Restart_V18_Atmosphere")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    noise = nodes.new("ShaderNodeTexNoise")
    ramp = nodes.new("ShaderNodeValToRGB")
    texcoord = nodes.new("ShaderNodeTexCoord")
    noise.inputs["Scale"].default_value = 1.8
    noise.inputs["Detail"].default_value = 2.2
    noise.inputs["Roughness"].default_value = 0.62
    ramp.color_ramp.elements[0].position = 0.20
    ramp.color_ramp.elements[0].color = (0.035, 0.050, 0.078, 1.0)
    ramp.color_ramp.elements[1].position = 0.82
    ramp.color_ramp.elements[1].color = (0.27, 0.33, 0.42, 1.0)
    shader.inputs["Roughness"].default_value = 1.0
    shader.inputs["Specular IOR Level"].default_value = 0.08
    links.new(texcoord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])

    bpy.ops.mesh.primitive_plane_add(
        size=2.0,
        location=(0.0, 0.62, 1.66),
        rotation=(math.radians(90.0), 0.0, 0.0),
    )
    backdrop = bpy.context.object
    backdrop.name = "ZhaoYun_Restart_V18_Atmospheric_Backdrop"
    backdrop.scale = (1.45, 1.45, 1.45)
    backdrop.data.materials.append(material)


def refine_lights():
    key = bpy.data.objects.get("Restart soft key")
    if key:
        key.data.energy = 76.0
        key.data.size = 1.05
    fill = bpy.data.objects.get("Restart cool fill")
    if fill:
        fill.data.energy = 42.0
        fill.data.size = 0.82
    eye = bpy.data.objects.get("Restart eye light")
    if eye:
        eye.data.energy = 17.0
    rim = bpy.data.objects.get("Restart hair rim")
    if rim:
        rim.data.energy = 118.0
        rim.data.size = 0.95

    bpy.ops.object.light_add(type="AREA", location=(-0.44, 0.30, 1.92))
    edge = bpy.context.object
    edge.name = "ZhaoYun_Restart_V18_Hair_Edge"
    edge.data.energy = 46.0
    edge.data.color = (0.54, 0.67, 1.0)
    edge.data.shape = "DISK"
    edge.data.size = 0.70
    direction = Vector((0.0, -0.02, 1.68)) - edge.location
    edge.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    world = bpy.context.scene.world
    if world and world.use_nodes:
        background = world.node_tree.nodes.get("Background")
        if background:
            background.inputs["Color"].default_value = (0.028, 0.038, 0.060, 1.0)
            background.inputs["Strength"].default_value = 0.36


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    add_atmospheric_backdrop()
    refine_lights()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
