"""Refine Zhao Yun's cape silhouette and reduce oversized hair-strand thickness."""

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v31-layered-tassets-natural-drape.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v32-windswept-cape-fine-hair.blend"


def cape_point(world, center_x, width, z_min, z_max, layer_index):
    height = max(0.001, z_max - z_min)
    weight = max(0.0, min(1.0, (z_max - world.z) / height)) ** 1.25
    normalized_x = (world.x - center_x) / max(0.001, width)
    phase = 0.55 + layer_index * 0.78
    sweep = (0.026 + layer_index * 0.010) * weight
    x = world.x + sweep
    x += 0.010 * math.sin(normalized_x * math.pi * 1.8 + phase) * weight
    y = world.y + 0.032 * weight
    y += 0.007 * math.cos(normalized_x * math.pi * 2.0 + phase) * weight
    z = world.z
    z += 0.024 * math.sin(normalized_x * math.pi * 1.55 + phase) * weight**1.55
    return Vector((x, y, z))


def cape_bounds(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center_x = sum(point.x for point in corners) / 8.0
    width = max(point.x for point in corners) - min(point.x for point in corners)
    z_min = min(point.z for point in corners)
    z_max = max(point.z for point in corners)
    return center_x, width, z_min, z_max


def deform_cape_mesh(obj, layer_index):
    settings = cape_bounds(obj)
    inverse = obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        vertex.co = inverse @ cape_point(world, *settings, layer_index)
    obj.data.update()
    return settings


def deform_cape_curve(obj, settings, layer_index):
    inverse = obj.matrix_world.inverted()

    def transform(local):
        world = obj.matrix_world @ local
        return inverse @ cape_point(world, *settings, layer_index)

    for spline in obj.data.splines:
        if spline.type == "BEZIER":
            for point in spline.bezier_points:
                point.co = transform(point.co)
                point.handle_left = transform(point.handle_left)
                point.handle_right = transform(point.handle_right)
        else:
            for point in spline.points:
                weight = point.co.w
                point.co = (*transform(Vector(point.co[:3])), weight)
    bpy.context.view_layer.update()


def add_cloth_microdetail(material, scale):
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return
    coord = nodes.new("ShaderNodeTexCoord")
    coord.name = f"{material.name}_ZY32_TexCoord"
    coord.location = (-650, -150)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = f"{material.name}_ZY32_Weave"
    noise.location = (-440, -150)
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 3.2
    noise.inputs["Roughness"].default_value = 0.64
    bump = nodes.new("ShaderNodeBump")
    bump.name = f"{material.name}_ZY32_Bump"
    bump.location = (-180, -180)
    bump.inputs["Strength"].default_value = 0.065
    bump.inputs["Distance"].default_value = 0.00055
    links.new(coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def refine_cape():
    source = bpy.data.materials["ZY17_Cape_Slate_Blue"]
    layers = (
        ("Inner", (0.034, 0.076, 0.150, 1.0), 0.58, 72.0),
        ("Middle", (0.025, 0.058, 0.126, 1.0), 0.64, 66.0),
        ("Outer", (0.016, 0.038, 0.086, 1.0), 0.70, 60.0),
    )
    changed = []
    for layer_index, (layer, base_color, roughness, noise_scale) in enumerate(layers):
        mesh = bpy.data.objects[f"ZhaoYun_V6_Pleated_White_Cape_{layer}"]
        material = source.copy()
        material.name = f"ZY32_Cape_{layer}_Slate_Blue"
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = 0.045
        add_cloth_microdetail(material, noise_scale)
        mesh.data.materials.clear()
        mesh.data.materials.append(material)
        settings = deform_cape_mesh(mesh, layer_index)
        for suffix in ("-1", "1"):
            trim = bpy.data.objects[f"ZhaoYun_V6_Cape_Gold_Trim_{layer}_{suffix}"]
            deform_cape_curve(trim, settings, layer_index)
            changed.append(trim.name)
        changed.append(mesh.name)
    return changed


def refine_hair():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    major_systems = {
        "Eve": (0.0042, 0.0010, 0.012),
        "Back1": (0.0038, 0.0009, 0.014),
        "Bob": (0.0040, 0.0009, 0.010),
        "Combover_zoro_d": (0.0036, 0.0008, 0.008),
        "SceneHair_1_O4saken": (0.0042, 0.0009, 0.012),
        "SlickedBack": (0.0038, 0.0008, 0.010),
    }
    changed = []
    for system in emitter.particle_systems:
        settings = major_systems.get(system.name)
        if not settings:
            continue
        root, tip, roughness = settings
        system.settings.root_radius = root
        system.settings.tip_radius = tip
        system.settings.roughness_2 = roughness
        system.settings.roughness_2_size = 0.55
        changed.append((system.name, root, tip))

    material = bpy.data.materials["ZhaoYun_Strand_Hair"]
    hair = material.node_tree.nodes.get("Principled Hair BSDF")
    hair.inputs["Color"].default_value = (0.0035, 0.0065, 0.014, 1.0)
    hair.inputs["Roughness"].default_value = 0.30
    hair.inputs["Radial Roughness"].default_value = 0.38
    hair.inputs["Coat"].default_value = 0.30
    return changed


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    cape = refine_cape()
    hair = refine_hair()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"REFINED_CAPE_OBJECTS={cape}")
    print(f"REFINED_HAIR_SYSTEMS={hair}")


if __name__ == "__main__":
    main()
