"""Third Zhao Yun refinement: focused expression and battle-worn materials."""

from pathlib import Path
import sys

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v2.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v3.blend"
MORPHS = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v2 as v2  # pylint: disable=wrong-import-position


FOCUSED_EXPRESSION = {
    "Angry": 0.30,
    "Eyebrows_Frown_Left": 0.32,
    "Eyebrows_Frown_Right": 0.36,
    "Eyes_Squint": 0.18,
    "Lower_Eyelid_Up_Left": 0.09,
    "Lower_Eyelid_Up_Right": 0.11,
    "Lips_Dn_Corner_Tight_Left": 0.08,
    "Lips_Dn_Corner_Tight_Right": 0.10,
}


def apply_expression(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in FOCUSED_EXPRESSION.items():
        data = np.load(MORPHS / f"{name}.npz")
        coords[data["idx"]] += data["delta"] * weight
    for vertex, co in zip(body.data.vertices, coords):
        vertex.co = co
    body.data.update()


def set_brow_and_hair():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Back1", "Combover_zoro_d", "mind_eyebrows_07"}
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM":
            visible = modifier.particle_system.name in enabled
            modifier.show_viewport = visible
            modifier.show_render = visible


def add_weathered_metal(material, coord_obj, dark, light, rough_dark=0.37, rough_light=0.25):
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    texcoord = nodes.new("ShaderNodeTexCoord")
    texcoord.object = coord_obj

    broad = nodes.new("ShaderNodeTexNoise")
    broad.noise_dimensions = "3D"
    broad.inputs["Scale"].default_value = 17.0
    broad.inputs["Detail"].default_value = 5.0
    broad.inputs["Roughness"].default_value = 0.68
    links.new(texcoord.outputs["Object"], broad.inputs["Vector"])

    color_ramp = nodes.new("ShaderNodeValToRGB")
    color_ramp.color_ramp.elements[0].position = 0.24
    color_ramp.color_ramp.elements[0].color = (*dark, 1.0)
    color_ramp.color_ramp.elements[1].position = 0.78
    color_ramp.color_ramp.elements[1].color = (*light, 1.0)
    links.new(broad.outputs["Fac"], color_ramp.inputs["Fac"])
    links.new(color_ramp.outputs["Color"], bsdf.inputs["Base Color"])

    rough_ramp = nodes.new("ShaderNodeValToRGB")
    rough_ramp.color_ramp.elements[0].color = (rough_dark,) * 3 + (1.0,)
    rough_ramp.color_ramp.elements[1].color = (rough_light,) * 3 + (1.0,)
    links.new(broad.outputs["Fac"], rough_ramp.inputs["Fac"])
    links.new(rough_ramp.outputs["Color"], bsdf.inputs["Roughness"])

    micro = nodes.new("ShaderNodeTexNoise")
    micro.noise_dimensions = "3D"
    micro.inputs["Scale"].default_value = 145.0
    micro.inputs["Detail"].default_value = 3.0
    micro.inputs["Roughness"].default_value = 0.72
    links.new(texcoord.outputs["Object"], micro.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.11
    bump.inputs["Distance"].default_value = 0.0018
    links.new(micro.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def add_cloth_microtexture(material, coord_obj, strength=0.16):
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    texcoord = nodes.new("ShaderNodeTexCoord")
    texcoord.object = coord_obj
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 210.0
    wave.inputs["Distortion"].default_value = 3.0
    wave.inputs["Detail"].default_value = 4.0
    links.new(texcoord.outputs["Object"], wave.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = 0.0012
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.62


def weather_materials():
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.0, 0.0, 0.0))
    coord = bpy.context.object
    coord.name = "ZhaoYun_V3_Material_Coordinates"
    coord.hide_render = True

    recipes = {
        "ZY2_Armor_Silver": ((0.11, 0.14, 0.17), (0.34, 0.39, 0.43), 0.39, 0.25),
        "ZY2_Armor_Dark_Silver": ((0.020, 0.028, 0.038), (0.105, 0.135, 0.165), 0.45, 0.31),
        "ZY2_Armor_Antique_Gold": ((0.105, 0.038, 0.010), (0.39, 0.19, 0.045), 0.38, 0.24),
        "ZY2_Circlet_Silver": ((0.12, 0.15, 0.18), (0.39, 0.44, 0.48), 0.36, 0.22),
        "ZY2_Circlet_Engraving": ((0.018, 0.025, 0.033), (0.09, 0.11, 0.13), 0.43, 0.29),
    }
    for name, values in recipes.items():
        material = bpy.data.materials.get(name)
        if material:
            add_weathered_metal(material, coord, *values)

    for name, strength in (("ZY2_Navy_Under_Robe", 0.13), ("ZY2_White_Collar", 0.10)):
        material = bpy.data.materials.get(name)
        if material:
            add_cloth_microtexture(material, coord, strength)


def add_lamellar_lacing(body):
    cord = base.make_material("ZY3_Deep_Crimson_Lacing", (0.085, 0.009, 0.006), 0.0, 0.58)
    for row in range(1, 8):
        z = 1.443 - row * 0.031
        half_width = 0.170 + row * 0.010
        points = []
        for index in range(9):
            x = -half_width + 2.0 * half_width * index / 8.0
            y = v2.front_y(body, x, z) - 0.010
            points.append((x, y, z))
        base.add_curve_strand(f"ZhaoYun_Lacing_Row_{row}", points, 0.00125, cord)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_expression(body)
    set_brow_and_hair()
    weather_materials()
    add_lamellar_lacing(body)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
