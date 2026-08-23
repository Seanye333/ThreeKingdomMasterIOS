"""Refine Zhao Yun's existing face optics and rebuild the rigid white collar."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v32-windswept-cape-fine-hair.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v33-skin-eyes-cross-collar.blend"


def set_value_node(group, name, value):
    node = group.nodes.get(name)
    if not node or node.bl_idname != "ShaderNodeValue":
        raise RuntimeError(f"Missing CharMorph value node: {name}")
    node.outputs["Value"].default_value = value


def refine_face_materials():
    skin = bpy.data.materials["UDIM.Skin"]
    settings_node = skin.node_tree.nodes["charmorph_settings"]
    settings = settings_node.node_tree
    values = {
        "Global Bump Strength": 0.26,
        "Micro Bump Strength": 0.31,
        "Roughness Multiplier": 0.78,
        "Subsurface Scale Multiplier": 0.82,
        "Sebum Roughness": 0.34,
        "Hemoglobin Fraction": 0.58,
        "Melanin Fraction": 0.23,
        "Value": 0.80,
        "Saturation": 0.98,
        "Lip Bump Strength": 0.86,
        "Iris Bump Strength": 0.82,
        "Sclera Bump Strength": 0.40,
        "Sclera Redness": 0.012,
        "Sclera Yellowness": 0.004,
    }
    for name, value in values.items():
        set_value_node(settings, name, value)

    aqueous = bpy.data.materials["AqueosLayer"]
    eye_surface = aqueous.node_tree.nodes["Principled BSDF"]
    eye_surface.inputs["Roughness"].default_value = 0.025
    eye_surface.inputs["IOR"].default_value = 1.336
    eye_surface.inputs["Alpha"].default_value = 0.26
    eye_surface.inputs["Transmission Weight"].default_value = 0.92
    eye_surface.inputs["Coat Weight"].default_value = 0.28
    eye_surface.inputs["Coat Roughness"].default_value = 0.018

    eye_hair = bpy.data.materials["EyeHair"].node_tree.nodes["Group"]
    eye_hair.inputs["Specular"].default_value = 0.54
    eye_hair.inputs["Roughness"].default_value = 0.50
    eye_hair.inputs["Radial Roughness"].default_value = 0.42

    eye_light = bpy.data.objects.get("Restart eye light")
    if eye_light and eye_light.type == "LIGHT":
        eye_light.data.energy = 18.0
        eye_light.data.color = (1.0, 0.90, 0.82)
    return values


def add_fabric_microdetail(material_name, scale, rough_low, rough_high):
    material = bpy.data.materials[material_name]
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return False
    coord = nodes.new("ShaderNodeTexCoord")
    coord.name = f"{material_name}_ZY33_TexCoord"
    coord.location = (-650, -160)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = f"{material_name}_ZY33_Weave"
    noise.location = (-440, -160)
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 3.4
    noise.inputs["Roughness"].default_value = 0.66
    bump = nodes.new("ShaderNodeBump")
    bump.name = f"{material_name}_ZY33_Bump"
    bump.location = (-190, -230)
    bump.inputs["Strength"].default_value = 0.065
    bump.inputs["Distance"].default_value = 0.00042
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = f"{material_name}_ZY33_Roughness"
    ramp.location = (-190, -40)
    ramp.color_ramp.elements[0].color = (rough_low,) * 3 + (1.0,)
    ramp.color_ramp.elements[1].color = (rough_high,) * 3 + (1.0,)
    links.new(coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Roughness"])
    return True


def create_strip(name, lower_outer, upper_inner, width, material):
    direction = (upper_inner - lower_outer).normalized()
    perpendicular = Vector((-direction.z, 0.0, direction.x)) * (width / 2.0)
    vertices = (
        lower_outer - perpendicular,
        lower_outer + perpendicular,
        upper_inner + perpendicular,
        upper_inner - perpendicular,
    )
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    solidify = obj.modifiers.new(f"{name}_Thickness", "SOLIDIFY")
    solidify.thickness = 0.0032
    solidify.offset = 0.0
    bevel = obj.modifiers.new(f"{name}_Soft_Edge", "BEVEL")
    bevel.width = 0.0018
    bevel.segments = 3
    return obj, vertices


def create_seam_curve(name, points, material):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = 0.00115
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinate in zip(spline.points, points):
        point.co = (*coordinate, 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def rebuild_cross_collar():
    hidden = []
    for name in ("ZhaoYun_White_Collar_-1", "ZhaoYun_White_Collar_1"):
        obj = bpy.data.objects[name]
        obj.hide_render = True
        obj.hide_set(True)
        hidden.append(obj.name)

    white = bpy.data.materials["ZY2_White_Collar"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    created = []
    sides = (
        ("l", Vector((-0.078, -0.112, 1.425)), Vector((-0.022, -0.115, 1.497))),
        ("r", Vector((0.078, -0.112, 1.425)), Vector((0.022, -0.115, 1.497))),
    )
    for side, lower, upper in sides:
        collar, vertices = create_strip(
            f"ZhaoYun_V33_Cross_Collar_{side}", lower, upper, 0.024, white
        )
        created.append(collar.name)
        seam = create_seam_curve(
            f"ZhaoYun_V33_Cross_Collar_Gold_Seam_{side}",
            (vertices[1] + Vector((0.0, -0.004, 0.0)), vertices[2] + Vector((0.0, -0.004, 0.0))),
            gold,
        )
        created.append(seam.name)
    return hidden, created


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    face_values = refine_face_materials()
    fabric = [
        name
        for name, scale, low, high in (
            ("ZY2_Navy_Under_Robe", 74.0, 0.55, 0.70),
            ("ZY4_Deep_Navy_Cloth", 68.0, 0.58, 0.73),
            ("ZY2_White_Collar", 82.0, 0.42, 0.56),
        )
        if add_fabric_microdetail(name, scale, low, high)
    ]
    hidden, collar = rebuild_cross_collar()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"FACE_VALUES={face_values}")
    print(f"FABRIC_MICRODETAIL={fabric}")
    print(f"HIDDEN_OLD_COLLAR={hidden}")
    print(f"NEW_CROSS_COLLAR={collar}")


if __name__ == "__main__":
    main()
