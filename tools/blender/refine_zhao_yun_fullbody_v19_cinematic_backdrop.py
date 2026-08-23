"""Give Zhao Yun a clean cinematic backdrop while preserving V33 face lights."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v18-clean-stage.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v19-cinematic-backdrop.blend"


def make_unlit_backdrop():
    source = bpy.data.materials["Backdrop_Mat"]
    material = bpy.data.materials.get("ZY19_Unlit_Midnight_Backdrop")
    if material is None:
        material = bpy.data.materials.new("ZY19_Unlit_Midnight_Backdrop")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (0.008, 0.017, 0.032, 1.0)
    emission.inputs["Strength"].default_value = 0.12
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])

    backdrop = bpy.data.objects["Portrait_Backdrop"]
    for index in range(len(backdrop.data.materials)):
        backdrop.data.materials[index] = material
    if not backdrop.data.materials:
        backdrop.data.materials.append(material)
    return source.name, material.name


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    materials = make_unlit_backdrop()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"BACKDROP_MATERIAL={materials}")


if __name__ == "__main__":
    main()
