"""Thin Zhao Yun's brows and calm the blue glass-like corneal reflection."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v28-sharper-face.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v32-brows-cornea.blend"


def refine_brows():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    brows = emitter.particle_systems.get("mind_eyebrows_11_Default")
    if not brows:
        return
    settings = brows.settings
    settings.rendered_child_count = 8
    settings.child_percent = 5
    settings.root_radius = 0.00042
    settings.tip_radius = 0.00021
    settings.radius_scale = 0.00235


def calm_cornea():
    sclera = bpy.data.materials["Sclera_Cornea"]
    group = sclera.node_tree.nodes.get("Group")
    if not group or not group.node_tree:
        return
    glass = group.node_tree.nodes.get("Glass BSDF")
    if glass:
        glass.inputs["Roughness"].default_value = 0.075
        glass.inputs["IOR"].default_value = 1.34
    principled = group.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Roughness"].default_value = 0.38
        principled.inputs["Specular IOR Level"].default_value = 0.30


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    refine_brows()
    calm_cornea()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
