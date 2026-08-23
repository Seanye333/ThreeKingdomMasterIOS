"""Refine the realistic Zhao Yun prototype with authored hair and silver armor."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v1.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v2.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


def delete_blockout_costume():
    prefixes = (
        "ZhaoYun_Red_Collar",
        "ZhaoYun_Silver_Pauldron_",
        "ZhaoYun_Pauldron_Inset_",
    )
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def set_combined_hair():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Back1", "Combover_zoro_d", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM":
            visible = modifier.particle_system.name in enabled
            modifier.show_viewport = visible
            modifier.show_render = visible


def surface_shell(body, name, predicate, material, offset=0.004, thickness=0.003):
    source = body.data
    selected = [poly for poly in source.polygons if predicate(poly)]
    indices = sorted({index for poly in selected for index in poly.vertices})
    index_map = {old: new for new, old in enumerate(indices)}
    verts = []
    for index in indices:
        vertex = source.vertices[index]
        verts.append(tuple(vertex.co + vertex.normal * offset))
    faces = [[index_map[index] for index in poly.vertices] for poly in selected]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    solidify = obj.modifiers.new(name + "_Thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 1.0
    bevel = obj.modifiers.new(name + "_Soft_Edge", "BEVEL")
    bevel.width = 0.0015
    bevel.segments = 2
    return obj


def front_y(body, x, z):
    candidates = sorted(
        body.data.vertices,
        key=lambda vertex: (vertex.co.x - x) ** 2 + (vertex.co.z - z) ** 2,
    )[:24]
    return min(vertex.co.y for vertex in candidates)


def add_beveled_plate(name, location, scale, material, rotation=(0.0, 0.0, 0.0), bevel=0.004):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    modifier = obj.modifiers.new(name + "_Rounded", "BEVEL")
    modifier.width = bevel
    modifier.segments = 3
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def add_shield_plate(name, location, width, height, depth, material, rotation_z=0.0, bevel=0.0025):
    """Create a compact pointed-bottom lamella, oriented toward the camera."""
    w = width * 0.5
    h = height * 0.5
    d = depth * 0.5
    front = [(-w, -d, h), (w, -d, h), (w, -d, -h * 0.35), (0.0, -d, -h), (-w, -d, -h * 0.35)]
    back = [(x, d, z) for x, _, z in front]
    verts = front + back
    faces = [
        (0, 1, 2, 3, 4),
        (9, 8, 7, 6, 5),
        (0, 5, 6, 1),
        (1, 6, 7, 2),
        (2, 7, 8, 3),
        (3, 8, 9, 4),
        (4, 9, 5, 0),
    ]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler.z = rotation_z
    obj.data.materials.append(material)
    modifier = obj.modifiers.new(name + "_Soft_Edge", "BEVEL")
    modifier.width = bevel
    modifier.segments = 3
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def add_flat_lapel(name, start, end, width, depth, material):
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cube_add(location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.scale = (width * 0.5, depth * 0.5, direction.length * 0.5)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    bevel = obj.modifiers.new(name + "_Folded_Edge", "BEVEL")
    bevel.width = min(width, depth) * 0.24
    bevel.segments = 3
    return obj


def add_fitted_circlet():
    silver = base.make_material("ZY2_Circlet_Silver", (0.34, 0.39, 0.44), 0.84, 0.24)
    dark_silver = base.make_material("ZY2_Circlet_Engraving", (0.055, 0.070, 0.082), 0.65, 0.29)
    jade = base.make_material("ZY2_Circlet_Jade", (0.012, 0.090, 0.085), 0.18, 0.24)

    # Head slice at z=1.69 is centered near y=.028 with radii x=.082/y=.100.
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.100,
        minor_radius=0.0024,
        major_segments=128,
        minor_segments=12,
        location=(0.0, 0.028, 1.690),
    )
    band = bpy.context.object
    band.name = "ZhaoYun_Fitted_Silver_Circlet"
    band.scale.x = 0.82
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    band.data.materials.append(silver)

    # Layered central boss and two short engraved wings, fitted to the forehead.
    boss = base.add_ellipsoid("ZhaoYun_Circlet_Boss", (0.0, -0.0745, 1.690), (0.0085, 0.0028, 0.0115), silver, 40, 20)
    boss.rotation_euler.y = math.radians(45)
    gem = base.add_ellipsoid("ZhaoYun_Circlet_Jade", (0.0, -0.0780, 1.690), (0.0042, 0.0017, 0.0060), jade, 32, 16)
    gem.rotation_euler.y = math.radians(45)
    for side in (-1, 1):
        base.add_curve_strand(
            f"ZhaoYun_Circlet_Wing_{side}",
            [
                (0.008 * side, -0.0755, 1.691),
                (0.028 * side, -0.0740, 1.697),
                (0.051 * side, -0.0685, 1.692),
            ],
            0.00125,
            dark_silver,
        )


def add_silver_armor(body):
    navy = base.make_material("ZY2_Navy_Under_Robe", (0.010, 0.022, 0.043), 0.0, 0.54)
    white = base.make_material("ZY2_White_Collar", (0.50, 0.55, 0.59), 0.0, 0.58)
    plate_dark = base.make_material("ZY2_Armor_Dark_Silver", (0.075, 0.095, 0.115), 0.68, 0.30)
    plate = base.make_material("ZY2_Armor_Silver", (0.25, 0.30, 0.35), 0.80, 0.31)
    edge = base.make_material("ZY2_Armor_Antique_Gold", (0.24, 0.125, 0.040), 0.76, 0.27)
    jade = base.make_material("ZY2_Armor_Jade", (0.010, 0.075, 0.073), 0.20, 0.25)

    # Fitted dark robe under all armor. The front V remains open at the neck.
    def robe_predicate(poly):
        center = poly.center
        if not (1.08 < center.z < 1.505 and abs(center.x) < 0.36):
            return False
        front = center.y < -0.035
        in_v = front and center.z > 1.37 + abs(center.x) * 1.45
        return not in_v

    surface_shell(body, "ZhaoYun_Fitted_Navy_Robe", robe_predicate, navy, 0.0055, 0.004)

    # A dark fitted foundation under overlapping lamellar plates.
    surface_shell(
        body,
        "ZhaoYun_Fitted_Cuirass_Base",
        lambda poly: 1.15 < poly.center.z < 1.455 and abs(poly.center.x) < 0.285 and poly.center.y < 0.025,
        plate_dark,
        0.010,
        0.004,
    )

    # Continuous fitted inner collar hides the raw garment boundary.
    bpy.ops.mesh.primitive_cone_add(
        vertices=96,
        radius1=0.098,
        radius2=0.077,
        depth=0.074,
        location=(0.0, 0.016, 1.472),
    )
    inner_collar = bpy.context.object
    inner_collar.name = "ZhaoYun_Continuous_Inner_Collar"
    inner_collar.scale.y = 0.80
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    inner_collar.data.materials.append(navy)
    collar_bevel = inner_collar.modifiers.new("Inner_Collar_Soft_Edge", "BEVEL")
    collar_bevel.width = 0.003
    collar_bevel.segments = 3
    for poly in inner_collar.data.polygons:
        poly.use_smooth = True

    # Smooth padded gorget protects the collar base.
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.080,
        minor_radius=0.008,
        major_segments=96,
        minor_segments=16,
        location=(0.0, 0.016, 1.496),
    )
    gorget = bpy.context.object
    gorget.name = "ZhaoYun_Padded_Gorget"
    gorget.scale.y = 0.80
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    gorget.data.materials.append(navy)

    # White crossed collar uses flattened cloth strips, not cylindrical ropes.
    for side in (-1, 1):
        add_flat_lapel(
            f"ZhaoYun_White_Collar_{side}",
            (0.073 * side, -0.072, 1.495),
            (0.0, -0.154, 1.362),
            0.025,
            0.008,
            white,
        )

    # Dense, pointed-bottom Han lamellae with individually raised gold rivets.
    rows = 8
    for row in range(rows):
        z = 1.430 - row * 0.031
        half_width = 0.175 + row * 0.010
        columns = 9 + (row // 2) * 2
        step = (half_width * 2) / columns
        for column in range(columns):
            x = -half_width + step * (column + 0.5)
            # Preserve the V-shaped collar opening in the upper rows.
            if row < 3 and abs(x) < 0.030 + (2 - row) * 0.020:
                continue
            y = front_y(body, x, z) - 0.018 - row * 0.0008
            add_shield_plate(
                f"ZhaoYun_Lamella_{row}_{column}",
                (x, y, z),
                step * 0.88,
                0.034,
                0.009,
                plate,
                rotation_z=math.radians(-x * 22.0),
                bevel=0.0022,
            )
            # Raised rivet catches a restrained highlight on each scale.
            rivet = base.add_ellipsoid(
                f"ZhaoYun_Rivet_{row}_{column}",
                (x, y - 0.0070, z + 0.009),
                (0.0022, 0.0015, 0.0022),
                edge,
                20,
                10,
            )
            rivet.rotation_euler.x = math.radians(90)

    # Layered shoulder guards: dark base plus a fan of pointed silver plates.
    for side in (-1, 1):
        shoulder_base = base.add_ellipsoid(
            f"ZhaoYun_Pauldron_Base_{side}",
            (side * 0.245, 0.010, 1.405),
            (0.155, 0.064, 0.048),
            plate_dark,
            64,
            24,
        )
        shoulder_base.rotation_euler.y = math.radians(side * 10)
        for layer in range(5):
            x = side * (0.180 + layer * 0.044)
            z = 1.438 - layer * 0.018
            y = -0.076 - layer * 0.001
            add_shield_plate(
                f"ZhaoYun_Pauldron_Plate_{side}_{layer}",
                (x, y, z),
                0.068,
                0.054,
                0.010,
                plate,
                rotation_z=math.radians(-side * (10 + layer * 5)),
                bevel=0.0035,
            )
            rivet = base.add_ellipsoid(
                f"ZhaoYun_Pauldron_Rivet_{side}_{layer}",
                (x, y - 0.007, z + 0.012),
                (0.0030, 0.0018, 0.0030),
                edge,
                20,
                10,
            )
            rivet.rotation_euler.x = math.radians(90)

    # Central jade clasp provides a restrained Shu accent.
    clasp = base.add_ellipsoid("ZhaoYun_Jade_Armor_Clasp", (0.0, -0.171, 1.365), (0.018, 0.006, 0.022), jade, 48, 24)
    clasp.rotation_euler.y = math.radians(45)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.021,
        minor_radius=0.0019,
        major_segments=48,
        minor_segments=10,
        location=(0.0, -0.175, 1.365),
        rotation=(math.radians(90), 0.0, 0.0),
    )
    bpy.context.object.name = "ZhaoYun_Clasp_Gold_Rim"
    bpy.context.object.data.materials.append(edge)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    delete_blockout_costume()
    set_combined_hair()
    body = bpy.data.objects["ZhaoYun_Body"]
    add_fitted_circlet()
    add_silver_armor(body)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
