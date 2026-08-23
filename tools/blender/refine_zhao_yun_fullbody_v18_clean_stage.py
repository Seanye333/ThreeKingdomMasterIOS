"""Clean Zhao Yun's full-body stage and finish his hand proportions."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v17-hero-silhouette.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v18-clean-stage.blend"


def scale_mesh_about_bounds(obj, factor):
    center = sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    for vertex in obj.data.vertices:
        vertex.co = center + (vertex.co - center) * factor
    obj.data.update()


def finish_hand_scale():
    changed = []
    # Rig side r is the spear hand.  Keep it slightly larger so the shaft stays
    # seated; the relaxed free hand benefits from a stronger reduction.
    for side, factor in (("r", 0.92), ("l", 0.88)):
        obj = bpy.data.objects[f"ZhaoYun_V16_Fitted_Leather_Glove_{side}"]
        scale_mesh_about_bounds(obj, factor)
        changed.append((obj.name, factor))
    return changed


def clean_background():
    atmospheric = bpy.data.objects.get("ZhaoYun_Restart_V18_Atmospheric_Backdrop")
    if atmospheric:
        atmospheric.hide_render = True
        atmospheric.hide_set(True)

    material = bpy.data.materials.get("Backdrop_Mat")
    if material and material.use_nodes:
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (0.012, 0.022, 0.040, 1.0)
            bsdf.inputs["Roughness"].default_value = 0.80
    return atmospheric.name if atmospheric else None


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    gloves = finish_hand_scale()
    hidden_backdrop = clean_background()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"GLOVE_SCALE={gloves}")
    print(f"HIDDEN_ATMOSPHERIC_BACKDROP={hidden_backdrop}")


if __name__ == "__main__":
    main()
