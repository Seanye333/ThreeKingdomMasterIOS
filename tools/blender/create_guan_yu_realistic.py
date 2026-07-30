"""Build a realistic Guan Yu look-dev sample from Blender's CC0 human base mesh."""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BASE = SRC / "human-base-meshes-v1.2.0/human_base_meshes_bundle.blend"
BLEND = SRC / "guan-yu-realistic-v2.blend"
PREVIEW = SRC / "guan-yu-realistic-v2-preview.png"


def mat(name: str, color, roughness=0.5, metallic=0.0, noise=0.0, bump=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Subsurface Weight" in bsdf.inputs and name == "Weathered warm skin":
        bsdf.inputs["Subsurface Weight"].default_value = 0.16
        bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.42, 0.18)
    if noise:
        tex = m.node_tree.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = noise
        tex.inputs["Detail"].default_value = 5
        tex.inputs["Roughness"].default_value = 0.72
        ramp = m.node_tree.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = tuple(max(0, c * 0.55) for c in color[:3]) + (1,)
        ramp.color_ramp.elements[1].color = tuple(min(1, c * 1.15) for c in color[:3]) + (1,)
        m.node_tree.links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
        m.node_tree.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        if bump:
            node = m.node_tree.nodes.new("ShaderNodeBump")
            node.inputs["Strength"].default_value = bump
            node.inputs["Distance"].default_value = 0.025
            m.node_tree.links.new(tex.outputs["Fac"], node.inputs["Height"])
            m.node_tree.links.new(node.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def assign(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.01, segments=3):
    mod = obj.modifiers.new("Edge softness", "BEVEL")
    mod.width = amount
    mod.segments = segments
    return obj


def cube(name, location, scale, material, rotation=(0, 0, 0), bevel_width=0.01):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(obj, bevel_width)
    assign(obj, material)
    return obj


def sphere(name, location, scale, material, segments=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    assign(obj, material)
    return obj


def tapered_panel(name, z_top, z_bottom, width_top, width_bottom, y, thickness, material, x_offset=0.0):
    verts = []
    for depth in (-thickness, thickness):
        verts.extend(
            [
                (x_offset - width_top, y + depth, z_top),
                (x_offset + width_top, y + depth, z_top),
                (x_offset + width_bottom, y + depth, z_bottom),
                (x_offset - width_bottom, y + depth, z_bottom),
            ]
        )
    faces = [
        (0, 1, 2, 3),
        (7, 6, 5, 4),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    bevel(obj, 0.012, 3)
    return obj


def cylinder_between(name, start, end, radius, material, vertices=32):
    a, b = Vector(start), Vector(end)
    direction = b - a
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=direction.length,
        location=(a + b) / 2,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    assign(obj, material)
    bevel(obj, radius * 0.12, 2)
    return obj


def cone_between(name, start, end, radius_start, radius_end, material, vertices=40):
    a, b = Vector(start), Vector(end)
    direction = b - a
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_start,
        radius2=radius_end,
        depth=direction.length,
        location=(a + b) / 2,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    assign(obj, material)
    bevel(obj, min(radius_start, radius_end) * 0.1, 3)
    return obj


def strand(name, points, radius, material, taper=True):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    count = len(points)
    for index, (point, co) in enumerate(zip(spline.bezier_points, points)):
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
        if taper:
            point.radius = max(0.24, 1.0 - index / max(1, count - 1) * 0.70)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BASE))

    keep = {
        "GEO-body_male_realistic",
        "GEO-body_male_realistic.eye.L",
        "GEO-body_male_realistic.eye.R",
    }
    for obj in list(bpy.data.objects):
        if obj.name not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)

    body = bpy.data.objects["GEO-body_male_realistic"]
    eye_l = bpy.data.objects["GEO-body_male_realistic.eye.L"]
    eye_r = bpy.data.objects["GEO-body_male_realistic.eye.R"]
    offset = Vector((2.2643, 0, 0))
    for obj in (body, eye_l, eye_r):
        obj.location += offset
        obj.hide_viewport = False
        obj.hide_render = False

    skin = mat("Weathered warm skin", (0.255, 0.082, 0.032, 1), 0.46, noise=42, bump=0.035)
    white = mat("Eye white", (0.58, 0.54, 0.48, 1), 0.32)
    iris = mat("Dark brown iris", (0.026, 0.012, 0.005, 1), 0.22)
    black = mat("Black hair", (0.008, 0.006, 0.004, 1), 0.7, noise=35, bump=0.18)
    green = mat("Han green silk", (0.018, 0.19, 0.085, 1), 0.48, noise=28, bump=0.12)
    green_dark = mat("Dark green cloth", (0.006, 0.055, 0.025, 1), 0.65, noise=32, bump=0.16)
    bronze = mat("Aged bronze", (0.16, 0.045, 0.012, 1), 0.38, 0.68, noise=12, bump=0.16)
    leather = mat("Ox-blood leather", (0.105, 0.018, 0.012, 1), 0.62, noise=16, bump=0.2)
    steel = mat("Forged steel", (0.19, 0.22, 0.23, 1), 0.2, 0.88, noise=7, bump=0.12)
    red = mat("Crimson tassel", (0.38, 0.012, 0.008, 1), 0.55, noise=26, bump=0.18)

    assign(body, skin)
    assign(eye_l, white)
    assign(eye_r, white)
    multires = body.modifiers.get("Multires")
    if multires:
        multires.levels = min(1, multires.total_levels)
        multires.render_levels = min(2, multires.total_levels)

    # Broaden the cheekbones and jaw, flatten the central nose projection and
    # slightly narrow the eyelid region for a more East Asian heroic silhouette.
    for vertex in body.data.vertices:
        x, y, z = vertex.co
        if 1.48 < z < 1.66:
            cheek = max(0.0, 1.0 - abs(z - 1.555) / 0.09)
            vertex.co.x *= 1.0 + 0.055 * cheek
        if z > 1.53 and abs(x) < 0.038 and y < -0.105:
            vertex.co.y += 0.010
        if 1.535 < z < 1.60 and abs(x) > 0.018:
            vertex.co.z -= 0.004

    # Pupils and heavy brows give the base head a specific, stern identity.
    for x in (-0.033, 0.033):
        sphere(f"Iris_{x}", (x, -0.137, 1.574), (0.008, 0.003, 0.008), iris, 32, 16)
        strand(
            f"Brow_{x}",
            [(x - 0.026, -0.157, 1.616), (x, -0.164, 1.625), (x + 0.027, -0.157, 1.614)],
            0.0045,
            black,
        )

    # Green headcloth and tied tails.
    sphere("Green_Headcloth", (0, -0.005, 1.69), (0.112, 0.104, 0.065), green_dark)
    cube("Headcloth_Band", (0, -0.104, 1.648), (0.115, 0.014, 0.018), green, bevel_width=0.006)
    strand("Headcloth_Tail_L", [(-0.055, 0.05, 1.67), (-0.11, 0.10, 1.53), (-0.08, 0.08, 1.40)], 0.015, green_dark)
    strand("Headcloth_Tail_R", [(0.055, 0.05, 1.67), (0.12, 0.11, 1.52), (0.10, 0.09, 1.39)], 0.015, green_dark)

    # Moustache and layered long beard, kept slightly in front of the face/chest.
    strand("Moustache_L", [(-0.004, -0.159, 1.536), (-0.046, -0.170, 1.521), (-0.092, -0.153, 1.497)], 0.006, black)
    strand("Moustache_R", [(0.004, -0.159, 1.536), (0.046, -0.170, 1.521), (0.092, -0.153, 1.497)], 0.006, black)
    for i in range(31):
        x = (i - 15) * 0.0052
        sway = 0.010 * math.sin(i * 1.83)
        strand(
            f"Beard_{i:02}",
            [
                (x * 0.62, -0.163, 1.510),
                (x + sway, -0.222, 1.38),
                (x * 0.78 - sway, -0.242, 1.18),
                (x * 0.30, -0.226, 0.91 + 0.08 * abs(x)),
            ],
            0.0032 + 0.0011 * (1 - abs(i - 15) / 15),
            black,
        )
    for i in range(9):
        x = (i - 4) * 0.014
        strand(
            f"Beard_Flyaway_{i:02}",
            [(x * 0.7, -0.17, 1.47), (x + 0.02 * math.sin(i), -0.245, 1.25), (x * 0.4, -0.225, 0.98)],
            0.0018,
            black,
        )

    # Robe volumes follow the intact anatomical body rather than replacing it.
    bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.31, radius2=0.215, depth=0.76, location=(0, 0.015, 0.66))
    skirt = bpy.context.object
    skirt.name = "Green_Robe_Skirt"
    skirt.scale.y = 0.62
    assign(skirt, green)
    bevel(skirt, 0.012, 3)
    cube("Robe_Belt", (0, -0.01, 1.015), (0.235, 0.16, 0.045), leather, bevel_width=0.015)
    tapered_panel("Front_Robe_Panel_L", 1.0, 0.27, 0.095, 0.125, -0.205, 0.008, green_dark, -0.085)
    tapered_panel("Front_Robe_Panel_R", 1.0, 0.27, 0.095, 0.125, -0.207, 0.008, green, 0.085)
    for i in range(-5, 6):
        x = i * 0.047
        strand(
            f"Robe_Pleat_{i}",
            [(x * 0.74, -0.204, 0.98), (x * 0.92, -0.218, 0.64), (x, -0.195, 0.30)],
            0.002,
            green_dark,
            taper=False,
        )

    # Torso cuirass, shoulder guards, sleeves and rows of lamellar plates.
    sphere("Cuirass_Base", (0, -0.015, 1.255), (0.265, 0.175, 0.265), leather)
    for side in (-1, 1):
        for layer in range(3):
            sphere(
                f"Shoulder_{side}_{layer}",
                (side * (0.274 + layer * 0.035), -0.005 + layer * 0.012, 1.39 - layer * 0.045),
                (0.115, 0.145, 0.042),
                bronze,
            )
        cone_between(
            f"Green_Sleeve_{side}",
            (side * 0.29, -0.005, 1.31),
            (side * 0.43, -0.005, 1.12),
            0.115,
            0.090,
            green_dark,
            40,
        )
        cone_between(
            f"Vambrace_{side}",
            (side * 0.43, -0.01, 1.12),
            (side * 0.49, -0.01, 0.92),
            0.088,
            0.064,
            leather,
            40,
        )

    for row in range(7):
        columns = 7 if row < 5 else 6
        for col in range(columns):
            x = (col - (columns - 1) / 2) * 0.066
            z = 1.47 - row * 0.067
            chest_curve = 0.024 * (x / 0.22) ** 2
            cube(
                f"Lamella_{row}_{col}",
                (x, -0.187 + chest_curve, z),
                (0.027, 0.008, 0.030),
                bronze,
                rotation=(0.025, 0, -x * 0.25),
                bevel_width=0.004,
            )
    cube("Chest_Ridge", (0, -0.19, 1.505), (0.238, 0.018, 0.014), bronze, bevel_width=0.006)
    strand("Armor_Binding_L", [(-0.22, -0.202, 1.48), (-0.24, -0.203, 1.27), (-0.20, -0.202, 1.06)], 0.005, red, taper=False)
    strand("Armor_Binding_R", [(0.22, -0.202, 1.48), (0.24, -0.203, 1.27), (0.20, -0.202, 1.06)], 0.005, red, taper=False)

    # Boots cover the realistic feet while preserving the human silhouette.
    for side in (-1, 1):
        cone_between(f"Boot_Shaft_{side}", (side * 0.105, 0, 0.38), (side * 0.105, 0, 0.105), 0.080, 0.092, leather, 40)
        sphere(f"Boot_Foot_{side}", (side * 0.105, -0.075, 0.065), (0.094, 0.16, 0.060), leather)

    # Green Dragon Crescent Blade.
    cylinder_between("Glaive_Pole", (-0.63, -0.03, 0.12), (-0.63, -0.03, 2.28), 0.025, leather, 40)
    blade_verts_2d = [
        (-0.63, 2.12),
        (-0.53, 2.15),
        (-0.40, 2.27),
        (-0.34, 2.48),
        (-0.45, 2.43),
        (-0.60, 2.34),
    ]
    depth = 0.018
    verts = [(x, -0.03 - depth, z) for x, z in blade_verts_2d] + [(x, -0.03 + depth, z) for x, z in blade_verts_2d]
    n = len(blade_verts_2d)
    faces = [tuple(range(n)), tuple(reversed(range(n, n * 2)))]
    faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    mesh = bpy.data.meshes.new("Crescent_Blade_Mesh")
    mesh.from_pydata(verts, [], faces)
    blade = bpy.data.objects.new("Green_Dragon_Crescent_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    assign(blade, steel)
    bevel(blade, 0.008, 3)
    sphere("Blade_Collar", (-0.63, -0.03, 2.12), (0.065, 0.055, 0.075), bronze)
    strand("Red_Tassel", [(-0.63, -0.04, 2.12), (-0.72, -0.05, 2.02), (-0.69, -0.05, 1.87)], 0.012, red)

    # Ground, camera and dramatic portrait lighting.
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "Studio_Floor"
    assign(floor, mat("Floor", (0.018, 0.014, 0.011, 1), 0.72, noise=10, bump=0.12))

    bpy.ops.object.camera_add(location=(0, -5.4, 1.22))
    camera = bpy.context.object
    camera.data.lens = 58
    look_at(camera, (0, 0, 1.18))
    bpy.context.scene.camera = camera

    bpy.context.scene.world.color = (0.003, 0.002, 0.001)
    for name, location, energy, color, size in [
        ("Key", (-2.5, -3.2, 3.7), 1120, (1.0, 0.62, 0.38), 2.4),
        ("Fill", (2.8, -2.2, 2.5), 680, (0.24, 0.39, 0.62), 2.8),
        ("Rim", (0.5, 2.6, 3.2), 1320, (1.0, 0.32, 0.12), 2.1),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, (0, 0, 1.12))

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW)
    scene.view_settings.look = "Medium High Contrast"
    scene.render.film_transparent = False

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    bpy.ops.render.render(write_still=True)
    print(f"BLEND={BLEND}")
    print(f"PREVIEW={PREVIEW}")


if __name__ == "__main__":
    main()
