"""Clean the v7 experiment and fit the circlet to the actual forehead."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v7-gaze-topknot.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v8-clean-circlet.blend"


def remove_round_topknot():
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_Restart_V7_Topknot_"):
            obj.hide_render = True
            obj.hide_set(True)


def refit_circlet():
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_Restart_Circlet"):
            obj.location.y -= 0.006
            obj.location.z -= 0.026


def calm_cape():
    material = bpy.data.materials.get("ZhaoYun_Restart_V6_Pearl_Cape")
    if material and material.use_nodes:
        shader = material.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Base Color"].default_value = (0.30, 0.37, 0.48, 1.0)
            shader.inputs["Roughness"].default_value = 0.58


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    remove_round_topknot()
    refit_circlet()
    calm_cape()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
