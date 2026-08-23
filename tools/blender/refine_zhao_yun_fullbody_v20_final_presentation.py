"""Finish Zhao Yun's presentation with a restrained midnight-blue stage."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v19-cinematic-backdrop.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v20-final-presentation.blend"


def gradient_backdrop():
    material = bpy.data.materials["ZY19_Unlit_Midnight_Backdrop"]
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 0.52
    coordinates = nodes.new("ShaderNodeTexCoord")
    separate = nodes.new("ShaderNodeSeparateXYZ")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.004, 0.009, 0.020, 1.0)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (0.055, 0.090, 0.145, 1.0)
    material.node_tree.links.new(coordinates.outputs["Generated"], separate.inputs["Vector"])
    material.node_tree.links.new(separate.outputs["Y"], ramp.inputs["Fac"])
    material.node_tree.links.new(ramp.outputs["Color"], emission.inputs["Color"])
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])


def darken_ground():
    material = bpy.data.materials["ZY4_Stone_Ground"]
    if not material.use_nodes:
        material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    bsdf.inputs["Base Color"].default_value = (0.018, 0.027, 0.045, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.08
    bsdf.inputs["Roughness"].default_value = 0.72


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    gradient_backdrop()
    darken_ground()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print("PRESENTATION=midnight-blue vertical gradient, dark stone ground")


if __name__ == "__main__":
    main()
