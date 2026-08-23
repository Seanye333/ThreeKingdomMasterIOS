"""Make the handcrafted brow strands dark, readable, and skin-safe."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v21-handcrafted-brows.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v22-defined-brows.blend"


def make_unlit_dark(material, color):
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (*color, 1.0)
    emission.inputs["Strength"].default_value = 1.0
    links.new(emission.outputs["Emission"], output.inputs["Surface"])


def strengthen_curves():
    dark = bpy.data.materials["ZhaoYun_Restart_V21_Brow_Dark"]
    soft = bpy.data.materials["ZhaoYun_Restart_V21_Brow_Soft"]
    make_unlit_dark(dark, (0.0012, 0.0010, 0.0010))
    make_unlit_dark(soft, (0.0040, 0.0032, 0.0030))

    for obj in bpy.data.objects:
        if not obj.name.startswith("ZhaoYun_Restart_V21_") or obj.type != "CURVE":
            continue
        if "Brow_Core" in obj.name:
            obj.data.bevel_depth *= 1.55
        elif "Brow_Hair" in obj.name:
            obj.data.bevel_depth *= 1.40
        elif "Upper_Lid" in obj.name:
            obj.data.bevel_depth *= 1.18
        for spline in obj.data.splines:
            for point in spline.bezier_points:
                point.co.y -= 0.0045


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    strengthen_curves()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
