"""Refine Zhao Yun v6 facial presence, eyes and skin response."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v6-cloth-grip.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v7-face-presence.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refine_zhao_yun_vitruvian_v3 as v3  # pylint: disable=wrong-import-position


EXPRESSION_INCREMENT = {
    "Angry": 0.055,
    "Eyebrows_Frown_Left": 0.070,
    "Eyebrows_Frown_Right": 0.080,
    "Eyes_Squint": 0.050,
    "Lower_Eyelid_Up_Left": 0.028,
    "Lower_Eyelid_Up_Right": 0.034,
    "Lips_Dn_Corner_Tight_Left": 0.025,
    "Lips_Dn_Corner_Tight_Right": 0.030,
}


def apply_expression_increment(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in EXPRESSION_INCREMENT.items():
        data = np.load(v3.MORPHS / f"{name}.npz")
        coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def set_value_node(group, name, value):
    node = group.nodes.get(name)
    if node and node.type == "VALUE":
        node.outputs[0].default_value = value


def refine_skin_and_eye_settings():
    settings = bpy.data.node_groups.get("CharMorphSettings")
    if settings:
        set_value_node(settings, "Sclera Redness", 0.014)
        set_value_node(settings, "Sclera Yellowness", 0.010)
        set_value_node(settings, "Iris Bump Strength", 0.72)
        set_value_node(settings, "Sclera Bump Strength", 0.46)
        set_value_node(settings, "Micro Bump Strength", 0.84)
        set_value_node(settings, "Roughness Multiplier", 0.98)
        set_value_node(settings, "Sebum Roughness", 0.50)
        set_value_node(settings, "Subsurface Scale Multiplier", 0.92)

    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        primary = iris.node_tree.nodes.get("Primary Iris Color")
        secondary = iris.node_tree.nodes.get("Secondary Iris Color")
        if primary:
            primary.outputs[0].default_value = (0.024, 0.012, 0.006, 1.0)
        if secondary:
            secondary.outputs[0].default_value = (0.070, 0.030, 0.010, 1.0)
        for node in iris.node_tree.nodes:
            if node.type == "GROUP" and node.node_tree and node.node_tree.name == "Iris":
                bsdf = node.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    bsdf.inputs["Coat Weight"].default_value = 0.22
                    bsdf.inputs["Coat Roughness"].default_value = 0.035
                    bsdf.inputs["Coat IOR"].default_value = 1.38

    sclera = bpy.data.materials.get("Sclera_Cornea")
    if sclera and sclera.use_nodes:
        for node in sclera.node_tree.nodes:
            if node.type == "GROUP" and node.node_tree and node.node_tree.name == "Sclera":
                bsdf = node.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    bsdf.inputs["Coat Weight"].default_value = 0.34
                    bsdf.inputs["Coat Roughness"].default_value = 0.028
                    bsdf.inputs["Coat IOR"].default_value = 1.376

    pupil = bpy.data.materials.get("Pupil")
    if pupil and pupil.use_nodes:
        diffuse = pupil.node_tree.nodes.get("Diffuse BSDF")
        if diffuse:
            diffuse.inputs["Color"].default_value = (0.0025, 0.0015, 0.0010, 1.0)
            diffuse.inputs["Roughness"].default_value = 0.34

    eye_hair = bpy.data.materials.get("EyeHair")
    if eye_hair and eye_hair.use_nodes:
        for node in eye_hair.node_tree.nodes:
            if node.type == "GROUP" and node.node_tree and node.node_tree.name == "HairEngine":
                if "Color" in node.inputs:
                    node.inputs["Color"].default_value = (0.016, 0.011, 0.009, 1.0)
                if "Specular" in node.inputs:
                    node.inputs["Specular"].default_value = 0.24
                if "Roughness" in node.inputs:
                    node.inputs["Roughness"].default_value = 0.56


def refine_eye_light():
    eye_light = bpy.data.objects.get("ZhaoYun_EyeLight")
    if eye_light and hasattr(eye_light.data, "color"):
        eye_light.data.color = (0.82, 0.90, 1.0)
        eye_light.data.energy = 3.8
        eye_light.data.shape = "DISK"
        eye_light.data.size = 0.18


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_expression_increment(body)
    refine_skin_and_eye_settings()
    refine_eye_light()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
