"""Correct knee jade placement and finish Zhao Yun's armor material hierarchy."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v14-silhouette-details.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v15-armor-finish.blend"


def bound_center(obj):
    center = sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    return obj.matrix_world @ center


def correct_knee_jade():
    corrected = []
    for side in ("l", "r"):
        guard = bpy.data.objects[f"ZhaoYun_V4_Knee_Guard_{side}.001"]
        inset = bpy.data.objects[f"ZhaoYun_V14_Knee_Jade_{side}"]
        center = bound_center(guard)
        # Move toward the camera-facing surface of the existing knee guard.
        inset.location = center + Vector((0.0, -0.014, 0.0))
        inset.scale = (0.82, 0.70, 0.82)
        corrected.append((inset.name, tuple(round(value, 4) for value in inset.location)))
    return corrected


def set_material(name, color, metallic, roughness, coat=0.0):
    material = bpy.data.materials.get(name)
    if not material or not material.use_nodes:
        return False
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return False
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    return True


def finish_materials():
    settings = {
        "ZY2_Armor_Silver": ((0.34, 0.43, 0.55), 0.86, 0.25, 0.12),
        "ZY2_Armor_Dark_Silver": ((0.055, 0.082, 0.12), 0.72, 0.38, 0.06),
        "ZY2_Armor_Antique_Gold": ((0.47, 0.22, 0.045), 0.78, 0.27, 0.08),
        "ZY2_Armor_Jade": ((0.005, 0.16, 0.16), 0.12, 0.19, 0.32),
        "ZY4_Weathered_Silver": ((0.22, 0.31, 0.44), 0.82, 0.29, 0.12),
    }
    changed = []
    for name, values in settings.items():
        if set_material(name, *values):
            changed.append(name)
    return changed


def smooth_armor():
    prefixes = (
        "ZhaoYun_Lamella_",
        "ZhaoYun_V5_Pauldron_Curved_Plate_",
        "ZhaoYun_V4_Skirt_Lamella_",
        "ZhaoYun_V4_Knee_Guard_",
        "ZhaoYun_V5_Hip_Guard_",
    )
    smoothed = 0
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.name.startswith(prefixes) and not obj.hide_render:
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
            smoothed += 1
    return smoothed


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    corrected = correct_knee_jade()
    changed = finish_materials()
    smoothed = smooth_armor()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CORRECTED_KNEE_JADE={corrected}")
    print(f"CHANGED_MATERIALS={changed}")
    print(f"SMOOTHED_ARMOR_OBJECTS={smoothed}")


if __name__ == "__main__":
    main()
