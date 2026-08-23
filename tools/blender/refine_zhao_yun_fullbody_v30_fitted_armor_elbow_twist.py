"""Refine Zhao Yun's torso armor, elbow articulation, and combat torso twist."""

import math
import re
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v29-articulated-hands-grounded-stance.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v30-fitted-armor-elbow-twist.blend"

LAMELLA_RE = re.compile(r"ZhaoYun_Lamella_(\d+)_(\d+)$")


def bounds_center(obj):
    return obj.matrix_world @ (
        sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    )


def reshape_world(obj, pivot, scale_x=1.0, scale_y=1.0, scale_z=1.0):
    inverse = obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        relative = world - pivot
        world = pivot + Vector(
            (
                relative.x * scale_x,
                relative.y * scale_y,
                relative.z * scale_z,
            )
        )
        vertex.co = inverse @ world
    obj.data.update()


def refine_lamellae():
    changed = []
    for obj in bpy.data.objects:
        match = LAMELLA_RE.fullmatch(obj.name)
        if not match or obj.hide_render:
            continue
        row, column = match.groups()
        center = bounds_center(obj)
        rivet = bpy.data.objects.get(f"ZhaoYun_Rivet_{row}_{column}")
        pivot = bounds_center(rivet) if rivet else center + Vector((0.0, 0.0, 0.008))
        # Extend below the fixed rivet so adjacent rows overlap like real lamellar armor.
        reshape_world(obj, pivot, scale_x=1.055, scale_y=0.92, scale_z=1.18)
        changed.append(obj.name)
    return changed


def add_metal_microdetail(material_name, scale, rough_dark, rough_light):
    material = bpy.data.materials[material_name]
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return False

    for name in (
        f"{material_name}_ZY30_TexCoord",
        f"{material_name}_ZY30_Noise",
        f"{material_name}_ZY30_Bump",
        f"{material_name}_ZY30_Roughness",
    ):
        old = nodes.get(name)
        if old:
            nodes.remove(old)

    texcoord = nodes.new("ShaderNodeTexCoord")
    texcoord.name = f"{material_name}_ZY30_TexCoord"
    texcoord.location = (-680, -120)

    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = f"{material_name}_ZY30_Noise"
    noise.location = (-470, -110)
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 4.0
    noise.inputs["Roughness"].default_value = 0.62

    bump = nodes.new("ShaderNodeBump")
    bump.name = f"{material_name}_ZY30_Bump"
    bump.location = (-220, -220)
    bump.inputs["Strength"].default_value = 0.14
    bump.inputs["Distance"].default_value = 0.0012

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = f"{material_name}_ZY30_Roughness"
    ramp.location = (-220, -20)
    ramp.color_ramp.interpolation = "EASE"
    ramp.color_ramp.elements[0].position = 0.28
    ramp.color_ramp.elements[0].color = (rough_dark,) * 3 + (1.0,)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (rough_light,) * 3 + (1.0,)

    links.new(texcoord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Roughness"])
    return True


def taper_sleeve(obj, elbow_center):
    center = bounds_center(obj)
    axis = (elbow_center - center).normalized()
    inverse = obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        along = (world - center).dot(axis)
        t = max(0.0, min(1.0, (along + 0.10) / 0.20))
        axis_point = center + axis * along
        radial = world - axis_point
        radial_scale = 1.015 - 0.105 * t
        world = axis_point + radial * radial_scale
        vertex.co = inverse @ world
    obj.data.update()


def add_torus(name, center, axis, major_radius, minor_radius, material):
    bpy.ops.mesh.primitive_torus_add(
        align="WORLD",
        major_segments=48,
        minor_segments=12,
        location=center,
        major_radius=major_radius,
        minor_radius=minor_radius,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(axis.normalized())
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def refine_elbows():
    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    created = []
    for side in ("l", "r"):
        sleeve = bpy.data.objects[f"ZhaoYun_V11_Tailored_Navy_Sleeve_{side}"]
        vambrace = bpy.data.objects[f"ZhaoYun_V13_Fitted_Silver_Vambrace_{side}"]
        sleeve_center = bounds_center(sleeve)
        vambrace_center = bounds_center(vambrace)
        axis = (vambrace_center - sleeve_center).normalized()
        elbow = sleeve_center.lerp(vambrace_center, 0.55)
        taper_sleeve(sleeve, elbow)
        created.append(
            add_torus(
                f"ZhaoYun_V30_Elbow_Leather_Joint_{side}",
                elbow,
                axis,
                0.052,
                0.0062,
                leather,
            ).name
        )
        for index, offset in enumerate((-0.010, 0.010)):
            created.append(
                add_torus(
                    f"ZhaoYun_V30_Elbow_Gold_Binding_{side}_{index}",
                    elbow + axis * offset,
                    axis,
                    0.0525,
                    0.00155,
                    gold,
                ).name
            )
    return created


def chest_or_shoulder_object(obj):
    name = obj.name
    if LAMELLA_RE.fullmatch(name) or re.fullmatch(r"ZhaoYun_Rivet_\d+_\d+", name):
        return True
    prefixes = (
        "ZhaoYun_Fitted_Cuirass_Base",
        "ZhaoYun_V26_Fitted_Cuirass_Underlay",
        "ZhaoYun_V26_Cuirass_",
        "ZhaoYun_V14_Chest_",
        "ZhaoYun_V8_Chest_",
        "ZhaoYun_V5_Pauldron_",
    )
    return name.startswith(prefixes)


def apply_torso_twist():
    pivot = Vector((0.0, 0.0, 1.335))
    angle = math.radians(2.15)
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(angle, 4, "Z")
        @ Matrix.Translation(-pivot)
    )
    changed = []
    for obj in bpy.data.objects:
        if obj.hide_render or not chest_or_shoulder_object(obj):
            continue
        obj.matrix_world = transform @ obj.matrix_world
        changed.append(obj.name)
    return changed


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    lamellae = refine_lamellae()
    microdetail = [
        name
        for name, scale, rough_dark, rough_light in (
            ("ZY2_Armor_Silver", 82.0, 0.22, 0.39),
            ("ZY4_Weathered_Silver", 58.0, 0.25, 0.46),
        )
        if add_metal_microdetail(name, scale, rough_dark, rough_light)
    ]
    elbow_objects = refine_elbows()
    twisted = apply_torso_twist()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"RESHAPED_LAMELLAE={len(lamellae)}")
    print(f"METAL_MICRODETAIL={microdetail}")
    print(f"ELBOW_OBJECTS={elbow_objects}")
    print(f"TORSO_TWIST_OBJECTS={len(twisted)}")


if __name__ == "__main__":
    main()
