"""Thin and separate the low ponytail ribbons into readable hair locks."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v29-low-ponytail.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v30-thin-ponytail.blend"


def refine_ribbons():
    keep = {0, 2, 4, 6, 8}
    for index in range(9):
        obj = bpy.data.objects[f"ZhaoYun_Restart_V29_Ponytail_Ribbon_{index}"]
        if index not in keep:
            obj.hide_render = True
            obj.hide_set(True)
            continue
        vertices = obj.data.vertices
        for pair_start in range(0, len(vertices), 2):
            left = vertices[pair_start]
            right = vertices[pair_start + 1]
            center = (left.co + right.co) * 0.5
            left.co = center + (left.co - center) * 0.52
            right.co = center + (right.co - center) * 0.52
        obj.data.update()
        obj.location.y += (index - 4) * 0.0012

    clasp = bpy.data.objects.get("ZhaoYun_Restart_V29_Ponytail_Clasp")
    if clasp:
        clasp.hide_render = True
        clasp.hide_set(True)

    for material_name in ("ZhaoYun_Restart_V29_Ribbon_Hair", "ZhaoYun_Restart_V29_Ribbon_Highlight"):
        material = bpy.data.materials[material_name]
        shader = material.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Roughness"].default_value = 0.78
            shader.inputs["Specular IOR Level"].default_value = 0.08


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    refine_ribbons()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
