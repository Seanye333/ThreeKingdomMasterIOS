"""Replace Zhao Yun's skirt grid with layered tassets and natural cloth drape."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v30-fitted-armor-elbow-twist.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v31-layered-tassets-natural-drape.blend"


def bounds_center(obj):
    return obj.matrix_world @ (
        sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    )


def drape_point(world, center_x, width, z_min, z_max, side, outer):
    height = max(0.001, z_max - z_min)
    weight = max(0.0, min(1.0, (z_max - world.z) / height)) ** 1.35
    normalized_x = (world.x - center_x) / max(0.001, width)
    phase = 0.65 if side < 0 else 2.15
    outward = side * (0.031 if outer else 0.021) * weight
    x = world.x + outward + side * 0.004 * math.sin(math.pi * weight)
    y = world.y - 0.011 * weight
    y += 0.006 * math.sin(normalized_x * math.pi * 2.0 + phase) * weight
    z = world.z
    z += 0.011 * math.sin(normalized_x * math.pi * 1.35 + phase) * weight**1.5
    return Vector((x, y, z))


def deform_mesh_drape(obj, side, outer):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center_x = sum(point.x for point in corners) / 8.0
    width = max(point.x for point in corners) - min(point.x for point in corners)
    z_min = min(point.z for point in corners)
    z_max = max(point.z for point in corners)
    inverse = obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        vertex.co = inverse @ drape_point(
            world, center_x, width, z_min, z_max, side, outer
        )
    bpy.context.view_layer.update()
    return center_x, width, z_min, z_max


def deform_curve_drape(obj, settings, side, outer):
    center_x, width, z_min, z_max = settings
    inverse = obj.matrix_world.inverted()

    def transform_local(local):
        world = obj.matrix_world @ local
        return inverse @ drape_point(
            world, center_x, width, z_min, z_max, side, outer
        )

    for spline in obj.data.splines:
        if spline.type == "BEZIER":
            for point in spline.bezier_points:
                point.co = transform_local(point.co)
                point.handle_left = transform_local(point.handle_left)
                point.handle_right = transform_local(point.handle_right)
        else:
            for point in spline.points:
                weight = point.co.w
                point.co = (*transform_local(Vector(point.co[:3])), weight)
    bpy.context.view_layer.update()


def refine_battle_skirt():
    changed = []
    for side_name, side in (("Left", -1), ("Right", 1)):
        for layer in ("Inner", "Outer"):
            mesh_name = f"ZhaoYun_V16_Layered_Battle_Skirt_{side_name}_{layer}"
            trim_name = f"ZhaoYun_V16_Skirt_Gold_Trim_{side_name}_{layer}"
            mesh = bpy.data.objects[mesh_name]
            settings = deform_mesh_drape(mesh, side, layer == "Outer")
            trim = bpy.data.objects[trim_name]
            deform_curve_drape(trim, settings, side, layer == "Outer")
            changed.extend((mesh.name, trim.name))
    return changed


def hide_old_skirt_grid():
    prefixes = (
        "ZhaoYun_V4_Skirt_Lamella_",
        "ZhaoYun_V4_Skirt_Rivet_",
        "ZhaoYun_V4_Skirt_Lacing_",
    )
    hidden = []
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)
            hidden.append(obj.name)
    return hidden


def create_curve(name, points, bevel_depth, material):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinate in zip(spline.points, points):
        point.co = (*coordinate, 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def create_tasset(index, center_x, top_z, length, material, gold, jade):
    width = 0.064
    bottom_z = top_z - length
    edge_y = -0.205 + 0.025 * (abs(center_x) / 0.18) ** 1.5
    center_y = edge_y - 0.006
    left = center_x - width / 2.0
    right = center_x + width / 2.0
    shoulder_z = bottom_z + 0.028
    vertices = [
        (left, edge_y, top_z),
        (center_x, center_y, top_z + 0.002),
        (right, edge_y, top_z),
        (left + 0.005, edge_y - 0.001, shoulder_z),
        (center_x, center_y - 0.002, shoulder_z - 0.003),
        (right - 0.005, edge_y - 0.001, shoulder_z),
        (center_x, center_y - 0.003, bottom_z),
    ]
    faces = (
        (0, 1, 4, 3),
        (1, 2, 5, 4),
        (3, 4, 6),
        (4, 5, 6),
    )
    mesh = bpy.data.meshes.new(f"ZhaoYun_V31_Front_Tasset_{index}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(f"ZhaoYun_V31_Front_Tasset_{index}", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    solidify = obj.modifiers.new(f"{obj.name}_Thickness", "SOLIDIFY")
    solidify.thickness = 0.0042
    solidify.offset = 0.0
    bevel = obj.modifiers.new(f"{obj.name}_Soft_Edge", "BEVEL")
    bevel.width = 0.0022
    bevel.segments = 3

    border_points = [
        Vector((left, edge_y - 0.0065, top_z)),
        Vector((left + 0.005, edge_y - 0.0075, shoulder_z)),
        Vector((center_x, center_y - 0.0095, bottom_z)),
        Vector((right - 0.005, edge_y - 0.0075, shoulder_z)),
        Vector((right, edge_y - 0.0065, top_z)),
    ]
    border = create_curve(
        f"ZhaoYun_V31_Front_Tasset_Gold_Edge_{index}",
        border_points,
        0.00145,
        gold,
    )

    rivets = []
    for rivet_index, x_offset in enumerate((-0.017, 0.017)):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20,
            ring_count=10,
            radius=0.0042,
            location=(center_x + x_offset, center_y - 0.009, top_z - 0.014),
        )
        rivet = bpy.context.object
        rivet.name = f"ZhaoYun_V31_Front_Tasset_Rivet_{index}_{rivet_index}"
        rivet.scale.y = 0.58
        rivet.data.materials.append(jade if index == 3 else gold)
        rivets.append(rivet)
    return [obj, border, *rivets]


def build_front_tassets():
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    centers = (-0.18, -0.12, -0.06, 0.0, 0.06, 0.12, 0.18)
    lengths = (0.145, 0.157, 0.168, 0.176, 0.165, 0.154, 0.143)
    created = []
    for index, (center_x, length) in enumerate(zip(centers, lengths)):
        top_z = 1.035 + (0.004 if index % 2 == 0 else -0.002)
        tasset_objects = create_tasset(
            index, center_x, top_z, length, silver, gold, jade
        )
        edge_y = -0.205 + 0.025 * (abs(center_x) / 0.18) ** 1.5
        pivot = Vector((center_x, edge_y, top_z))
        fan_angle = math.radians(-4.0 * center_x / 0.18)
        transform = (
            Matrix.Translation(pivot)
            @ Matrix.Rotation(fan_angle, 4, "Y")
            @ Matrix.Translation(-pivot)
        )
        for obj in tasset_objects:
            obj.matrix_world = transform @ obj.matrix_world
            created.append(obj.name)
    return created


def add_fabric_microdetail(material_name, scale, roughness_low, roughness_high):
    material = bpy.data.materials[material_name]
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return False
    coord = nodes.new("ShaderNodeTexCoord")
    coord.name = f"{material_name}_ZY31_TexCoord"
    coord.location = (-650, -160)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = f"{material_name}_ZY31_Weave"
    noise.location = (-440, -160)
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 3.5
    noise.inputs["Roughness"].default_value = 0.68
    bump = nodes.new("ShaderNodeBump")
    bump.name = f"{material_name}_ZY31_Bump"
    bump.location = (-190, -240)
    bump.inputs["Strength"].default_value = 0.075
    bump.inputs["Distance"].default_value = 0.00045
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = f"{material_name}_ZY31_Roughness"
    ramp.location = (-190, -40)
    ramp.color_ramp.elements[0].color = (roughness_low,) * 3 + (1.0,)
    ramp.color_ramp.elements[1].color = (roughness_high,) * 3 + (1.0,)
    links.new(coord.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Roughness"])
    return True


def refine_knee_guards():
    changed = []
    for side in ("l", "r"):
        guard = bpy.data.objects[f"ZhaoYun_V4_Knee_Guard_{side}.001"]
        center = bounds_center(guard)
        inverse = guard.matrix_world.inverted()
        for vertex in guard.data.vertices:
            world = guard.matrix_world @ vertex.co
            relative = world - center
            world = center + Vector(
                (relative.x * 1.12, relative.y * 1.02, relative.z * 1.18)
            )
            vertex.co = inverse @ world
        guard.data.update()
        changed.append(guard.name)
    return changed


def give_boots_dedicated_leather():
    source = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    leather = source.copy()
    leather.name = "ZY31_Embossed_Boot_Leather"
    for side in ("l", "r"):
        for stem in (
            "ZhaoYun_V16_Fitted_Boot_Shaft_",
            "ZhaoYun_V16_Tapered_Leather_Boot_",
        ):
            obj = bpy.data.objects[f"{stem}{side}"]
            obj.data.materials.clear()
            obj.data.materials.append(leather)
    add_fabric_microdetail(leather.name, 48.0, 0.46, 0.62)
    return leather.name


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hidden = hide_old_skirt_grid()
    draped = refine_battle_skirt()
    tassets = build_front_tassets()
    fabric = [
        name
        for name, scale, low, high in (
            ("ZY6_Pleated_Ivory_Silk", 72.0, 0.38, 0.52),
            ("ZY16_Shadowed_Ivory_Silk", 64.0, 0.42, 0.56),
        )
        if add_fabric_microdetail(name, scale, low, high)
    ]
    knees = refine_knee_guards()
    boot_leather = give_boots_dedicated_leather()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_OLD_SKIRT_GRID={len(hidden)}")
    print(f"DRAPED_SKIRT_OBJECTS={draped}")
    print(f"NEW_TASSET_OBJECTS={len(tassets)}")
    print(f"FABRIC_MICRODETAIL={fabric}")
    print(f"REFINED_KNEES={knees}")
    print(f"BOOT_LEATHER={boot_leather}")


if __name__ == "__main__":
    main()
