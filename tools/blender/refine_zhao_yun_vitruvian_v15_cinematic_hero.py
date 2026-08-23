"""Rebuild Zhao Yun around the established portrait's handsome heroic silhouette."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v14-portrait-match.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v15-cinematic-hero.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


HERO_FACE_INCREMENT = {
    "Eyes_Eyelid_hooded": 0.210,
    "Eyes_EyelidsAngle": 0.162,
    "Eyes_Size": -0.012,
    "Eyes_UpperLidOpenness": -0.045,
    "Face_FrontalBone_BrowRidge": 0.120,
    "Face_Zygomatic_Bone": 0.125,
    "Cheeks_UpperCheek_Bone": 0.105,
    "Cheeks_BoneDefinition": 0.115,
    "Cheeks_BuccalFat": -0.085,
    "Jaw_Definition": 0.150,
    "Jaw_Ramus_Extrusion": 0.045,
    "Jaw_Width": -0.012,
    "Chin_Height": 0.080,
    "Chin_Width": -0.032,
    "Nose_BridgeProminence": 0.090,
    "Nose_NoseHeight": 0.045,
    "Nose_Width": -0.080,
    "Mouth_Lips_Length": 0.080,
    "Mouth_Lips_Height": -0.015,
    "Mouth_Lips_UpperLipArch": 0.040,
}

HERO_EXPRESSION_INCREMENT = {
    "Eyebrows_Frown_Left": 0.040,
    "Eyebrows_Frown_Right": 0.044,
    "Eyebrows_InnerBrow_Lower_Left": 0.012,
    "Eyebrows_InnerBrow_Lower_Right": 0.014,
    "Eyes_Squint": 0.034,
    "Lips_Up_Corner_Tight_Left": 0.014,
    "Lips_Up_Corner_Tight_Right": 0.016,
}


def apply_morph_increment(body):
    coords = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, increments in (
        (MORPHS_L2, HERO_FACE_INCREMENT),
        (MORPHS_L3, HERO_EXPRESSION_INCREMENT),
    ):
        for name, weight in increments.items():
            data = np.load(folder / f"{name}.npz")
            coords[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coords):
        vertex.co = coordinate
    body.data.update()


def remove_v14_hair():
    for obj in list(bpy.data.objects):
        if obj.name.startswith("ZhaoYun_V14_"):
            bpy.data.objects.remove(obj, do_unlink=True)


def configure_authored_hair():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Combover_zoro_d"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        visible = modifier.particle_system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        modifier.particle_system.settings.material = 1

    material = emitter.data.materials[0]
    if material and material.use_nodes:
        for node in material.node_tree.nodes:
            if node.type == "BSDF_HAIR_PRINCIPLED":
                if "Color" in node.inputs:
                    node.inputs["Color"].default_value = (0.0012, 0.0020, 0.0040, 1.0)
                if "Roughness" in node.inputs:
                    node.inputs["Roughness"].default_value = 0.40
                if "Radial Roughness" in node.inputs:
                    node.inputs["Radial Roughness"].default_value = 0.50


def configure_eyes_and_neck():
    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        primary = iris.node_tree.nodes.get("Primary Iris Color")
        secondary = iris.node_tree.nodes.get("Secondary Iris Color")
        if primary and "Color" in primary.outputs:
            primary.outputs["Color"].default_value = (0.006, 0.008, 0.011, 1.0)
        if secondary and "Color" in secondary.outputs:
            secondary.outputs["Color"].default_value = (0.036, 0.020, 0.008, 1.0)

    # The former high gorget compressed his neck and made the portrait feel toy-like.
    collar = bpy.data.objects.get("ZhaoYun_Continuous_Inner_Collar")
    if collar:
        collar.scale.z *= 0.68
        collar.location.z -= 0.019
    gorget = bpy.data.objects.get("ZhaoYun_Padded_Gorget")
    if gorget:
        gorget.location.z -= 0.020


def make_hair_material(name, color, roughness):
    material = base.make_material(name, color, 0.0, roughness)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.28
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = 0.10
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.30
        if "Anisotropic IOR Level" in bsdf.inputs:
            bsdf.inputs["Anisotropic IOR Level"].default_value = 0.48
    return material


def add_ribbon(name, points, half_widths, material, rig, thickness=0.0012, bone="head"):
    centers = [Vector(point) for point in points]
    view_normal = Vector((0.0, -1.0, 0.0))
    vertices = []
    for index, (center, width) in enumerate(zip(centers, half_widths)):
        if index == 0:
            tangent = centers[1] - center
        elif index == len(centers) - 1:
            tangent = center - centers[index - 1]
        else:
            tangent = centers[index + 1] - centers[index - 1]
        side = tangent.cross(view_normal)
        if side.length < 1e-6:
            side = Vector((1.0, 0.0, 0.0))
        else:
            side.normalize()
        vertices.extend((center - side * width, center + side * width))

    faces = []
    for index in range(len(centers) - 1):
        a = index * 2
        faces.append((a, a + 1, a + 3, a + 2))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    subdivision = obj.modifiers.new("Hair_Clump_Subdivision", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 2
    subdivision.render_levels = 2
    solidify = obj.modifiers.new("Hair_Clump_Thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    v4.parent_to_bone_keep_transform(obj, rig, bone)
    return obj


def add_tapered_tube(name, points, radii, material, rig, bone="head", sides=10):
    centers = [Vector(point) for point in points]
    view_normal = Vector((0.0, -1.0, 0.0))
    vertices = []
    for index, (center, radius) in enumerate(zip(centers, radii)):
        if index == 0:
            tangent = centers[1] - center
        elif index == len(centers) - 1:
            tangent = center - centers[index - 1]
        else:
            tangent = centers[index + 1] - centers[index - 1]
        tangent.normalize()
        normal_a = tangent.cross(view_normal)
        if normal_a.length < 1e-6:
            normal_a = Vector((1.0, 0.0, 0.0))
        normal_a.normalize()
        normal_b = tangent.cross(normal_a).normalized()
        for side in range(sides):
            angle = math.tau * side / sides
            vertices.append(center + radius * (math.cos(angle) * normal_a + math.sin(angle) * normal_b))

    faces = []
    for ring in range(len(centers) - 1):
        for side in range(sides):
            current = ring * sides + side
            following = ring * sides + (side + 1) % sides
            upper = (ring + 1) * sides + side
            upper_following = (ring + 1) * sides + (side + 1) % sides
            faces.append((current, following, upper_following, upper))
    faces.append(tuple(reversed(range(sides))))
    start = (len(centers) - 1) * sides
    faces.append(tuple(start + side for side in range(sides)))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdivision = obj.modifiers.new("Hair_Lock_Subdivision", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 2
    subdivision.render_levels = 2
    v4.parent_to_bone_keep_transform(obj, rig, bone)
    return obj


def add_strand(name, points, radius, material, rig):
    strand = base.add_curve_strand(name, points, radius, material)
    v4.parent_to_bone_keep_transform(strand, rig, "head")
    return strand


def build_heroic_ponytail(rig, raven, raven_soft, silver, jade):
    # A small silver hair crown hides the join; no spherical top-knot is exposed.
    clasp = v4.cylinder_between(
        "ZhaoYun_V15_Hair_Crown_Core",
        (0.0, 0.087, 1.765),
        (0.0, 0.091, 1.803),
        0.014,
        silver,
        40,
    )
    v4.parent_to_bone_keep_transform(clasp, rig, "head")
    for side in (-1.0, 1.0):
        add_strand(
            f"ZhaoYun_V15_Hair_Crown_Arch_{int(side)}",
            [
                (side * 0.014, 0.086, 1.770),
                (side * 0.024, 0.089, 1.795),
                (side * 0.013, 0.092, 1.817),
                (0.0, 0.094, 1.826),
            ],
            0.0017,
            silver,
            rig,
        )
    jewel = base.add_ellipsoid(
        "ZhaoYun_V15_Hair_Crown_Jade",
        (0.0, 0.074, 1.789),
        (0.0065, 0.0030, 0.0080),
        jade,
        32,
        16,
    )
    v4.parent_to_bone_keep_transform(jewel, rig, "head")

    # Rounded, tapered locks read as hair from every camera angle; they avoid flat ribbon silhouettes.
    for index in range(9):
        lane = (index - 4.0) / 4.0
        wave = math.sin(index * 1.91)
        cross_wave = math.cos(index * 1.37)
        vertical = lane * 0.064
        points = [
            (lane * 0.0025, 0.096 + abs(lane) * 0.002, 1.793 + lane * 0.004),
            (-0.045 + lane * 0.010, 0.132 + lane * 0.004, 1.842 + vertical * 0.45),
            (-0.165 + lane * 0.025 + wave * 0.010, 0.205 + lane * 0.008, 1.875 + vertical + cross_wave * 0.012),
            (-0.335 + lane * 0.045 + wave * 0.024, 0.290 + lane * 0.012, 1.825 + vertical * 1.15 + cross_wave * 0.025),
            (-0.515 + lane * 0.068 + cross_wave * 0.038, 0.382 + lane * 0.016 + wave * 0.008, 1.715 + vertical * 1.65 + wave * 0.042),
            (-0.675 + lane * 0.092 + wave * 0.070, 0.470 + lane * 0.020 + cross_wave * 0.014, 1.570 + vertical * 2.15 + cross_wave * 0.068),
        ]
        add_tapered_tube(
            f"ZhaoYun_V15_Ponytail_Clump_{index}",
            points,
            (0.0022, 0.0038, 0.0056, 0.0058, 0.0035, 0.00045),
            raven_soft if index % 3 == 1 else raven,
            rig,
        )

    for index in range(5):
        lane = (index - 2.0) / 2.0
        add_strand(
            f"ZhaoYun_V15_Ponytail_Flyaway_{index}",
            [
                (lane * 0.003, 0.098, 1.795),
                (-0.085 + lane * 0.018, 0.150, 1.865 + lane * 0.022),
                (-0.290 + lane * 0.045, 0.275, 1.845 + lane * 0.060),
                (-0.560 + lane * 0.095, 0.425, 1.675 + lane * 0.105),
                (-0.720 + lane * 0.125, 0.505, 1.505 + lane * 0.145),
            ],
            0.00065,
            raven_soft,
            rig,
        )


def build_long_hair(rig, raven, raven_soft):
    # Back locks deliberately cross and separate so the silhouette never becomes a curtain.
    for index in range(3):
        lane = (index - 1.0)
        side_sweep = -0.035 + lane * 0.030
        points = [
            (lane * 0.055, 0.070 + abs(lane) * 0.010, 1.755 - abs(lane) * 0.010),
            (lane * 0.060 + side_sweep * 0.5, 0.108, 1.665 - abs(lane) * 0.020),
            (lane * 0.070 - 0.060 + side_sweep * 0.8, 0.150, 1.565 - abs(lane) * 0.030),
            (lane * 0.075 - 0.145 + side_sweep * 1.2, 0.190, 1.460 - abs(lane) * 0.035),
            (lane * 0.080 - 0.255 + side_sweep * 1.7, 0.230, 1.365 - abs(lane) * 0.045),
        ]
        add_tapered_tube(
            f"ZhaoYun_V15_Back_Hair_Clump_{index}",
            points,
            (0.0018, 0.0037, 0.0046, 0.0037, 0.00045),
            raven_soft if index % 2 else raven,
            rig,
        )

    # One loose lock on the far temple adds motion without masking the eyes.
    add_tapered_tube(
        "ZhaoYun_V15_Temple_Lock",
        [
            (-0.057, -0.048, 1.721),
            (-0.066, -0.070, 1.676),
            (-0.074, -0.077, 1.617),
            (-0.071, -0.055, 1.558),
            (-0.080, -0.018, 1.505),
        ],
        (0.0007, 0.0018, 0.0022, 0.0015, 0.0003),
        raven,
        rig,
    )


def build_hero_brows(rig, raven):
    for side in (-1.0, 1.0):
        points = [
            (side * 0.010, -0.0770, 1.663),
            (side * 0.030, -0.0775, 1.671),
            (side * 0.051, -0.0730, 1.678),
            (side * 0.071, -0.0650, 1.669),
        ]
        add_ribbon(
            f"ZhaoYun_V15_Hero_Brow_{int(side)}",
            points,
            (0.0015, 0.0040, 0.0032, 0.0006),
            raven,
            rig,
            0.00045,
        )


def build_windswept_sashes(rig, silk):
    add_ribbon(
        "ZhaoYun_V15_Wind_Sash_Upper",
        [
            (0.135, 0.070, 1.475),
            (-0.030, 0.145, 1.510),
            (-0.225, 0.250, 1.535),
            (-0.430, 0.360, 1.485),
            (-0.640, 0.470, 1.380),
        ],
        (0.020, 0.037, 0.047, 0.036, 0.004),
        silk,
        rig,
        0.0024,
        "spine_03",
    )
    add_ribbon(
        "ZhaoYun_V15_Wind_Sash_Lower",
        [
            (-0.115, 0.075, 1.445),
            (-0.245, 0.175, 1.430),
            (-0.405, 0.290, 1.385),
            (-0.580, 0.410, 1.305),
            (-0.735, 0.515, 1.215),
        ],
        (0.018, 0.033, 0.041, 0.030, 0.004),
        silk,
        rig,
        0.0022,
        "spine_03",
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]

    remove_v14_hair()
    apply_morph_increment(body)
    configure_authored_hair()
    configure_eyes_and_neck()
    raven = make_hair_material("ZY15_Raven_Hair", (0.0020, 0.0035, 0.0070), 0.38)
    raven_soft = make_hair_material("ZY15_Raven_Hair_Soft", (0.0040, 0.0070, 0.0140), 0.44)
    silk = base.make_material("ZY15_Wind_Silk", (0.56, 0.60, 0.64), 0.0, 0.60)
    build_heroic_ponytail(rig, raven, raven_soft, silver, jade)
    build_long_hair(rig, raven, raven_soft)
    build_windswept_sashes(rig, silk)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
