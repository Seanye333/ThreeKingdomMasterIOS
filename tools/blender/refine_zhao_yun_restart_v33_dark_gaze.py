"""Darken eyelashes and bring warm brown depth back into Zhao Yun's gaze."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v32-brows-cornea.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"


def darken_lashes():
    material = bpy.data.materials["EyeHair"]
    group = material.node_tree.nodes.get("Group")
    if group:
        group.inputs["Color"].default_value = (0.0018, 0.0014, 0.0013, 1.0)
        group.inputs["Roughness"].default_value = 0.66


def warm_irises():
    iris = bpy.data.materials["Iris"]
    primary = iris.node_tree.nodes.get("Primary Iris Color")
    secondary = iris.node_tree.nodes.get("Secondary Iris Color")
    if primary:
        primary.outputs[0].default_value = (0.0080, 0.0024, 0.00075, 1.0)
    if secondary:
        secondary.outputs[0].default_value = (0.045, 0.0135, 0.0032, 1.0)


def calm_eye_light():
    eye = bpy.data.objects.get("Restart eye light")
    if eye:
        eye.data.energy = 14.0
        eye.data.color = (1.0, 0.88, 0.78)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    darken_lashes()
    warm_irises()
    calm_eye_light()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
