"""Fit Zhao Yun's armor to his torso and rebuild a more heroic dragon spear."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v25-layered-costume.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v26-fitted-armor-hero-spear.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def bounds_center(obj):
    return obj.matrix_world @ (sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0)


def make_principled(name, color, metallic, roughness, coat=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    return material


def build_fitted_cuirass():
    navy_steel = make_principled(
        "ZY26_Fitted_Cuirass_Navy_Steel",
        (0.018, 0.045, 0.095),
        0.28,
        0.43,
        0.10,
    )
    cuirass = v4.cloth_tube(
        "ZhaoYun_V26_Fitted_Cuirass_Underlay",
        ((0.0, 0.025, 1.165), (0.0, 0.025, 1.315), (0.0, 0.025, 1.455)),
        (0.225, 0.220, 0.180),
        (0.100, 0.120, 0.090),
        navy_steel,
        64,
    )
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    upper = v4.ring_curve(
        "ZhaoYun_V26_Cuirass_Upper_Binding",
        (0.0, 0.025, 1.445),
        (0.0, 0.0, 1.0),
        0.181,
        0.091,
        gold,
        0.0022,
        72,
    )
    lower = v4.ring_curve(
        "ZhaoYun_V26_Cuirass_Lower_Binding",
        (0.0, 0.025, 1.175),
        (0.0, 0.0, 1.0),
        0.224,
        0.101,
        gold,
        0.0025,
        72,
    )
    return [cuirass.name, upper.name, lower.name]


def seat_pauldrons_on_arms():
    moved = []
    for obj in bpy.data.objects:
        if obj.hide_render or not obj.name.startswith("ZhaoYun_V5_Pauldron_"):
            continue
        if "_l" in obj.name or obj.name.endswith("_l"):
            sign = 1.0
        elif "_r" in obj.name or obj.name.endswith("_r"):
            sign = -1.0
        else:
            continue
        obj.location += Vector((-sign * 0.008, 0.052, 0.002))
        moved.append(obj.name)
    return moved


def hide_old_spearhead():
    names = (
        "ZhaoYun_V4_Dragon_Spear_Blade",
        "ZhaoYun_V5_Spear_Blade_Central_Ridge",
        "ZhaoYun_V5_Spear_Blade_Gold_Edge_-1",
        "ZhaoYun_V5_Spear_Blade_Gold_Edge_1",
    )
    hidden = []
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True
            obj.hide_set(True)
            hidden.append(name)
    return hidden


def spear_axis():
    shaft = bpy.data.objects["ZhaoYun_V4_Dragon_Spear_Shaft"]
    points = [shaft.matrix_world @ vertex.co for vertex in shaft.data.vertices]
    _distance, start, end = max(
        ((first - second).length, first, second)
        for first in points
        for second in points
    )
    direction = (end - start).normalized()
    if direction.z < 0.0:
        direction.negate()
    return direction


def build_leaf_blade():
    silver = make_principled(
        "ZY26_Spear_Blue_Steel",
        (0.22, 0.38, 0.62),
        0.96,
        0.17,
        0.18,
    )
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    socket = bounds_center(bpy.data.objects["ZhaoYun_V4_Dragon_Spear_Socket"])
    axis = spear_axis()
    side = Vector((-axis.z, 0.0, axis.x)).normalized()
    front = Vector((0.0, -1.0, 0.0))
    base_center = socket + axis * 0.040
    distances = (0.0, 0.072, 0.170, 0.295)
    widths = (0.018, 0.066, 0.049, 0.0)
    thicknesses = (0.007, 0.012, 0.009, 0.0025)
    centers = [base_center + axis * distance for distance in distances]

    vertices = []
    for center, width, thickness in zip(centers[:-1], widths[:-1], thicknesses[:-1]):
        vertices.extend(
            (
                center - side * width + front * thickness,
                center + side * width + front * thickness,
                center - side * width - front * thickness,
                center + side * width - front * thickness,
            )
        )
    tip_front = len(vertices)
    vertices.append(centers[-1] + front * thicknesses[-1])
    tip_back = len(vertices)
    vertices.append(centers[-1] - front * thicknesses[-1])

    faces = []
    for station in range(2):
        a = station * 4
        b = (station + 1) * 4
        faces.extend(
            (
                (a, a + 1, b + 1, b),
                (a + 3, a + 2, b + 2, b + 3),
                (a, b, b + 2, a + 2),
                (a + 1, a + 3, b + 3, b + 1),
            )
        )
    a = 8
    faces.extend(
        (
            (a, a + 1, tip_front),
            (a + 3, a + 2, tip_back),
            (a, tip_front, tip_back, a + 2),
            (a + 1, a + 3, tip_back, tip_front),
            (0, 2, 3, 1),
        )
    )
    mesh = bpy.data.meshes.new("ZhaoYun_V26_Hero_Leaf_Spearhead_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    blade = bpy.data.objects.new("ZhaoYun_V26_Hero_Leaf_Spearhead", mesh)
    bpy.context.collection.objects.link(blade)
    mesh.materials.append(silver)
    bevel = blade.modifiers.new("ZhaoYun V26 Forged Blade Edge", "BEVEL")
    bevel.width = 0.0022
    bevel.segments = 3

    left_edge = [
        tuple(center - side * width + front * (thickness + 0.002))
        for center, width, thickness in zip(centers, widths, thicknesses)
    ]
    right_edge = [
        tuple(center + side * width + front * (thickness + 0.002))
        for center, width, thickness in zip(centers, widths, thicknesses)
    ]
    ridge = [
        tuple(center + front * (thickness + 0.003))
        for center, thickness in zip(centers, thicknesses)
    ]
    edge_left = base.add_curve_strand("ZhaoYun_V26_Spearhead_Gold_Edge_Left", left_edge, 0.0020, gold)
    edge_right = base.add_curve_strand("ZhaoYun_V26_Spearhead_Gold_Edge_Right", right_edge, 0.0020, gold)
    center_ridge = base.add_curve_strand("ZhaoYun_V26_Spearhead_Central_Ridge", ridge, 0.0026, gold)
    jade_inset = base.add_ellipsoid(
        "ZhaoYun_V26_Spearhead_Jade_Inset",
        tuple(base_center + axis * 0.032 + front * 0.014),
        (0.011, 0.0055, 0.011),
        jade,
        36,
        18,
    )
    return [blade.name, edge_left.name, edge_right.name, center_ridge.name, jade_inset.name]


def enhance_spear_materials_and_tassel():
    changed = []
    settings = {
        "ZY4_Dark_Spear_Wood": ((0.028, 0.008, 0.005), 0.05, 0.30, 0.22),
        "ZY4_Deep_Crimson": ((0.24, 0.006, 0.012), 0.0, 0.40, 0.08),
        "ZY16_Deep_Crimson_Shadow": ((0.075, 0.002, 0.005), 0.0, 0.48, 0.04),
    }
    for name, (color, metallic, roughness, coat) in settings.items():
        material = bpy.data.materials.get(name)
        if not material or not material.use_nodes:
            continue
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = coat
        changed.append(name)

    root = bounds_center(bpy.data.objects["ZhaoYun_V16_Spear_Tassel_Knot"])
    scaled = 0
    for obj in bpy.data.objects:
        if obj.hide_render or not obj.name.startswith("ZhaoYun_V16_Spear_Tassel_Lock_"):
            continue
        inverse = obj.matrix_world.inverted()
        for vertex in obj.data.vertices:
            world = obj.matrix_world @ vertex.co
            vertex.co = inverse @ (root + (world - root) * 1.14)
        obj.data.update()
        scaled += 1
    return changed, scaled


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    underlay = build_fitted_cuirass()
    pauldrons = seat_pauldrons_on_arms()
    hidden = hide_old_spearhead()
    spearhead = build_leaf_blade()
    materials, tassels = enhance_spear_materials_and_tassel()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"ARMOR_UNDERLAY={underlay}")
    print(f"SEATED_PAULDRONS={len(pauldrons)}")
    print(f"HIDDEN_OLD_SPEARHEAD={hidden}")
    print(f"NEW_SPEARHEAD={spearhead}")
    print(f"CHANGED_SPEAR_MATERIALS={materials}")
    print(f"SCALED_TASSEL_LOCKS={tassels}")


if __name__ == "__main__":
    main()
