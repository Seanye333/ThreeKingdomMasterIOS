"""Refine Zhao Yun's skin response and warm dark-brown eyes."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v20-clean-silhouette.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v24-skin-eyes.blend"


def tune_iris():
    iris = bpy.data.materials["Iris"]
    primary = iris.node_tree.nodes.get("Primary Iris Color")
    secondary = iris.node_tree.nodes.get("Secondary Iris Color")
    if primary:
        primary.outputs[0].default_value = (0.0045, 0.0014, 0.00045, 1.0)
    if secondary:
        secondary.outputs[0].default_value = (0.026, 0.0075, 0.0018, 1.0)

    pupil = bpy.data.materials["Pupil"]
    diffuse = pupil.node_tree.nodes.get("Diffuse BSDF")
    if diffuse:
        diffuse.inputs["Color"].default_value = (0.00015, 0.00010, 0.00008, 1.0)
        diffuse.inputs["Roughness"].default_value = 0.32


def tune_sclera():
    sclera = bpy.data.materials["Sclera_Cornea"]
    group = sclera.node_tree.nodes.get("Group")
    if not group:
        return
    group.inputs["Yellowness"].default_value = 0.032
    group.inputs["Redness"].default_value = 0.055
    group.inputs["Bump Strength"].default_value = 0.58


def tune_skin():
    skin = bpy.data.materials["UDIM.Skin"]
    group = skin.node_tree.nodes.get("Group")
    if not group:
        return
    group.inputs["Subsurface Scale Multiplier"].default_value = 0.76
    group.inputs["Roughness Multiplier"].default_value = 1.16
    group.inputs["Sebum Roughness"].default_value = 0.54
    group.inputs["Global Bump Strength"].default_value = 0.78
    group.inputs["Micro Normal Strength"].default_value = 0.72
    group.inputs["Melanin Fraction"].default_value = 0.36
    group.inputs["Hemoglobin Fraction"].default_value = 0.92
    group.inputs["Saturation"].default_value = 0.96
    group.inputs["Value"].default_value = 0.985


def balance_cool_lights():
    fill = bpy.data.objects.get("Restart cool fill")
    if fill:
        fill.data.energy = 34.0
        fill.data.color = (0.64, 0.73, 1.0)
    edge = bpy.data.objects.get("ZhaoYun_Restart_V18_Hair_Edge")
    if edge:
        edge.data.energy = 27.0


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    tune_iris()
    tune_sclera()
    tune_skin()
    balance_cool_lights()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
