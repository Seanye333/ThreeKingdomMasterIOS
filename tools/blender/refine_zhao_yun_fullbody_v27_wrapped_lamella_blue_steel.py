"""Wrap chest lamellae around Zhao Yun's torso and deepen the spear's blue steel."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v26-fitted-armor-hero-spear.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v27-wrapped-lamella-blue-steel.blend"


def bounds_center(obj):
    return obj.matrix_world @ (sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0)


def rotate_world_about(obj, pivot, angle):
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(angle, 4, "Z")
        @ Matrix.Translation(-pivot)
    )
    obj.matrix_world = transform @ obj.matrix_world


def wrap_lamellae():
    changed = []
    for plate in bpy.data.objects:
        if plate.hide_render or not plate.name.startswith("ZhaoYun_Lamella_"):
            continue
        suffix = plate.name.removeprefix("ZhaoYun_Lamella_")
        rivet = bpy.data.objects.get(f"ZhaoYun_Rivet_{suffix}")
        center = bounds_center(plate)
        normalized = max(-1.0, min(1.0, center.x / 0.23))
        angle = math.radians(23.0 * normalized)
        rotate_world_about(plate, center, angle)
        if rivet:
            rotate_world_about(rivet, center, angle)
        changed.append((plate.name, round(math.degrees(angle), 2), bool(rivet)))
    return changed


def deepen_blue_steel():
    material = bpy.data.materials["ZY26_Spear_Blue_Steel"]
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.070, 0.155, 0.300, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.98
    bsdf.inputs["Roughness"].default_value = 0.14
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.22
    return material.name


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    lamellae = wrap_lamellae()
    steel = deepen_blue_steel()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"WRAPPED_LAMELLAE={len(lamellae)}")
    print(f"SIDE_ROTATION_RANGE={(min(item[1] for item in lamellae), max(item[1] for item in lamellae))}")
    print(f"BLUE_STEEL_MATERIAL={steel}")


if __name__ == "__main__":
    main()
