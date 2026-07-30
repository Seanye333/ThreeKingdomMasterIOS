"""Dress the MPFB Guan Yu base with body-conforming Han-era look-dev garments."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import (
    assign,
    bevel,
    cone_between,
    cube,
    cylinder_between,
    look_at,
    mat,
    sphere,
    strand,
    tapered_panel,
)


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BASE = SRC / "guan-yu-mpfb-base.blend"
BLEND = SRC / "guan-yu-mpfb-v23.blend"
PREVIEW = SRC / "guan-yu-mpfb-v23-preview.png"


def glaive_pole_x(z):
    """A restrained forward lean makes the stance read as combat-ready."""
    return 0.01 - 0.125 * z


def body_shell(body, name, predicate, material, thickness=0.012):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = body.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
    shell = bpy.data.objects.new(name, mesh)
    shell.matrix_world = body.matrix_world.copy()
    bpy.context.collection.objects.link(shell)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    rejected = [vert for vert in bm.verts if not predicate(vert.co)]
    bmesh.ops.delete(bm, geom=rejected, context="VERTS")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    shell.data.materials.clear()
    shell.data.materials.append(material)
    for polygon in shell.data.polygons:
        polygon.use_smooth = True
    solidify = shell.modifiers.new("Tailored thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 1.0
    bevel(shell, min(0.008, thickness * 0.6), 2)
    return shell


def lamellar_material():
    material = bpy.data.materials.new("Curved bronze lamellar")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.46
    shader.inputs["Metallic"].default_value = 0.52
    texcoord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    brick = nodes.new("ShaderNodeTexBrick")
    brick.inputs["Color1"].default_value = (0.105, 0.027, 0.008, 1)
    brick.inputs["Color2"].default_value = (0.045, 0.008, 0.003, 1)
    brick.inputs["Mortar"].default_value = (0.008, 0.003, 0.002, 1)
    brick.inputs["Scale"].default_value = 13.0
    brick.inputs["Mortar Size"].default_value = 0.025
    brick.inputs["Mortar Smooth"].default_value = 0.012
    brick.inputs["Row Height"].default_value = 0.22
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.14
    bump.inputs["Distance"].default_value = 0.012

    links.new(texcoord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], brick.inputs["Vector"])
    links.new(brick.outputs["Color"], shader.inputs["Base Color"])
    links.new(brick.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def lamella_plate(name, location, width, height, depth, material, rotation_z=0.0):
    top = width * 0.52
    bottom = width * 0.43
    verts = [
        (-top, -depth, height * 0.5),
        (top, -depth, height * 0.5),
        (bottom, -depth, -height * 0.36),
        (0, -depth, -height * 0.52),
        (-bottom, -depth, -height * 0.36),
        (-top, depth, height * 0.5),
        (top, depth, height * 0.5),
        (bottom, depth, -height * 0.36),
        (0, depth, -height * 0.52),
        (-bottom, depth, -height * 0.36),
    ]
    faces = [
        (0, 1, 2, 3, 4),
        (9, 8, 7, 6, 5),
        (0, 5, 6, 1),
        (1, 6, 7, 2),
        (2, 7, 8, 3),
        (3, 8, 9, 4),
        (4, 9, 5, 0),
    ]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    plate = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(plate)
    plate.location = location
    plate.rotation_euler.z = rotation_z
    assign(plate, material)
    bevel(plate, 0.0035, 3)
    return plate


def beard_volume(material):
    """Create a soft, tapered mass behind the individual hair curves."""
    sections = [
        (-0.002, 1.585, 0.052, -0.168),
        (-0.004, 1.485, 0.070, -0.192),
        (0.006, 1.335, 0.083, -0.220),
        (-0.004, 1.165, 0.068, -0.232),
        (0.002, 1.015, 0.041, -0.225),
        (0.000, 0.945, 0.012, -0.218),
    ]
    depth = 0.014
    verts = []
    for x, z, half_width, y in sections:
        verts.extend(
            [
                (x - half_width, y - depth, z),
                (x + half_width, y - depth, z),
                (x - half_width, y + depth, z),
                (x + half_width, y + depth, z),
            ]
        )
    faces = []
    for index in range(len(sections) - 1):
        a = index * 4
        b = (index + 1) * 4
        faces.extend(
            [
                (a, b, b + 1, a + 1),
                (a + 2, a + 3, b + 3, b + 2),
                (a, a + 2, b + 2, b),
                (a + 1, b + 1, b + 3, a + 3),
            ]
        )
    last = (len(sections) - 1) * 4
    faces.extend([(0, 1, 3, 2), (last + 2, last + 3, last + 1, last)])
    mesh = bpy.data.meshes.new("Layered_Beard_Volume_Mesh")
    mesh.from_pydata(verts, [], faces)
    beard = bpy.data.objects.new("Layered_Beard_Volume", mesh)
    bpy.context.collection.objects.link(beard)
    assign(beard, material)
    bevel(beard, 0.012, 4)
    return beard


def strengthen_face(body):
    """Push the neutral MPFB head toward a seasoned, square-jawed commander."""
    if not body.data.shape_keys:
        return
    values = {
        "head-square": 0.48,
        "head-age-incr": 0.27,
        "chin-width-incr": 0.40,
        "chin-prominent-incr": 0.24,
        "l-cheek-bones-incr": 0.30,
        "r-cheek-bones-incr": 0.30,
        "nose-scale-depth-decr": 0.07,
        "nose-point-width-incr": 0.15,
        "l-eye-epicanthus-in": 0.22,
        "r-eye-epicanthus-in": 0.22,
    }
    for name, value in values.items():
        key = body.data.shape_keys.key_blocks.get(name)
        if key:
            key.value = value


def pose_combat_stance(rig):
    """Offset the feet into a grounded front/back duel stance."""
    def target(name, location):
        obj = bpy.data.objects.new(name, None)
        obj.location = location
        obj.empty_display_type = "SPHERE"
        obj.empty_display_size = 0.04
        obj.hide_render = True
        bpy.context.collection.objects.link(obj)
        return obj

    for foot_name, target_location, knee_location, pole_angle in [
        ("foot_l", (0.255, -0.135, 0.070), (0.24, -0.48, 0.52), math.radians(-90)),
        ("foot_r", (-0.235, 0.115, 0.070), (-0.22, -0.34, 0.52), math.radians(90)),
    ]:
        foot = rig.pose.bones[foot_name]
        foot_target = target(f"{foot_name}_Duel_Target", target_location)
        foot_target.rotation_mode = "QUATERNION"
        foot_target.rotation_quaternion = (rig.matrix_world @ foot.bone.matrix_local).to_quaternion()
        knee_target = target(f"{foot_name}_Knee_Pole", knee_location)
        constraint = foot.constraints.new("IK")
        constraint.name = "Grounded duel stance"
        constraint.target = foot_target
        constraint.pole_target = knee_target
        constraint.pole_angle = pole_angle
        constraint.chain_count = 2
        constraint.use_tail = False
        constraint.use_rotation = True
        for bone in (foot, foot.parent, foot.parent.parent):
            bone.ik_stretch = 0.0
    bpy.context.view_layer.update()


def pose_for_glaive(rig):
    def target(name, location):
        obj = bpy.data.objects.new(name, None)
        obj.location = location
        obj.empty_display_type = "SPHERE"
        obj.empty_display_size = 0.035
        obj.hide_render = True
        bpy.context.collection.objects.link(obj)
        return obj

    # Keep the pole close enough to both shoulders for a natural two-hand grip.
    # MPFB's left/right labels follow the character, not the camera view.
    # Put each wrist on the opposite side of the shaft. The curled fingers then
    # meet around the wood instead of both palms occupying the same point.
    left_target = target("Left_Hand_Glaive_Target", (glaive_pole_x(1.22) + 0.055, -0.21, 1.22))
    right_target = target("Right_Hand_Glaive_Target", (glaive_pole_x(0.96) + 0.055, -0.21, 0.96))
    left_elbow = target("Left_Elbow_Pole", (0.53, -0.03, 1.19))
    right_elbow = target("Right_Elbow_Pole", (-0.48, -0.01, 1.09))

    for hand_name, hand_target, elbow_target, pole_angle in [
        ("hand_l", left_target, left_elbow, math.radians(-90)),
        ("hand_r", right_target, right_elbow, math.radians(90)),
    ]:
        hand = rig.pose.bones[hand_name]
        constraint = hand.constraints.new("IK")
        constraint.name = "Two handed glaive grip"
        constraint.target = hand_target
        constraint.pole_target = elbow_target
        constraint.pole_angle = pole_angle
        constraint.chain_count = 3
        constraint.use_tail = False
        for bone in (hand, hand.parent, hand.parent.parent):
            bone.ik_stretch = 0.0

    # The mirrored right hand needs substantially more local-X flexion because
    # its wrist is rolled inward by the lower IK chain.
    for side, curl_degrees in (("l", -34), ("r", -82)):
        for finger in ("index", "middle", "ring", "pinky"):
            for joint in (1, 2, 3):
                bone = rig.pose.bones.get(f"{finger}_{joint:02}_{side}")
                if bone:
                    bone.rotation_mode = "XYZ"
                    bone.rotation_euler.x = math.radians(curl_degrees)
        for joint in (1, 2, 3):
            bone = rig.pose.bones.get(f"thumb_{joint:02}_{side}")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(curl_degrees * 0.55)

    bpy.context.view_layer.update()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BASE))
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    strengthen_face(body)
    pose_for_glaive(rig)

    green = mat("Deep green silk", (0.012, 0.13, 0.045, 1), 0.5, noise=36, bump=0.10)
    green_dark = mat("Shadow green silk", (0.004, 0.042, 0.014, 1), 0.62, noise=42, bump=0.13)
    leather = mat("Ox blood leather", (0.075, 0.012, 0.007, 1), 0.58, noise=24, bump=0.18)
    bronze = mat("Aged bronze trim", (0.14, 0.035, 0.008, 1), 0.36, 0.7, noise=15, bump=0.16)
    steel = mat("Forged steel", (0.14, 0.17, 0.18, 1), 0.22, 0.9, noise=10, bump=0.1)
    black = mat("Black beard hair", (0.004, 0.0025, 0.0015, 1), 0.75, noise=55, bump=0.12)
    furrow = mat("Warm facial furrow", (0.12, 0.025, 0.014, 1), 0.78)
    red = mat("Crimson binding", (0.28, 0.006, 0.003, 1), 0.56, noise=32, bump=0.13)
    lamellar = lamellar_material()

    skin_material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if skin_material and skin_material.use_nodes:
        nodes = skin_material.node_tree.nodes
        links = skin_material.node_tree.links
        shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.5
            shader.inputs["Subsurface Weight"].default_value = 0.07
            base_input = shader.inputs["Base Color"]
            if base_input.is_linked:
                source_socket = base_input.links[0].from_socket
                links.remove(base_input.links[0])
                warm_tint = nodes.new("ShaderNodeMixRGB")
                warm_tint.name = "Guan Yu restrained warm complexion"
                warm_tint.blend_type = "MULTIPLY"
                warm_tint.inputs["Fac"].default_value = 0.24
                warm_tint.inputs[2].default_value = (0.58, 0.24, 0.16, 1)
                links.new(source_socket, warm_tint.inputs[1])
                links.new(warm_tint.outputs["Color"], base_input)
            pore_noise = nodes.new("ShaderNodeTexNoise")
            pore_noise.name = "Skin pore microdetail"
            pore_noise.inputs["Scale"].default_value = 190.0
            pore_noise.inputs["Detail"].default_value = 2.5
            pore_noise.inputs["Roughness"].default_value = 0.72
            pore_bump = nodes.new("ShaderNodeBump")
            pore_bump.name = "Skin pore bump"
            pore_bump.inputs["Strength"].default_value = 0.12
            pore_bump.inputs["Distance"].default_value = 0.0018
            links.new(pore_noise.outputs["Fac"], pore_bump.inputs["Height"])
            links.new(pore_bump.outputs["Normal"], shader.inputs["Normal"])

    # Clothing and armor are copied directly from the evaluated human surface,
    # which keeps the silhouette continuous around the chest, shoulders and arms.
    body_shell(body, "Tailored_Green_Underrobe", lambda co: 0.63 < co.z < 1.50, green, 0.014)
    body_shell(
        body,
        "Curved_Lamellar_Cuirass",
        lambda co: 1.02 < co.z < 1.43 and abs(co.x) < 0.305,
        bronze,
        0.024,
    )
    body_shell(
        body,
        "Leather_Vambraces",
        lambda co: 0.67 < co.z < 1.14 and abs(co.x) > 0.30,
        leather,
        0.018,
    )
    body_shell(body, "Fitted_Boots", lambda co: co.z < 0.43, leather, 0.022)
    body_shell(
        body,
        "Tailored_Shoulder_Cape",
        lambda co: 1.34 < co.z < 1.50 and abs(co.x) < 0.46,
        green_dark,
        0.018,
    )

    bpy.ops.mesh.primitive_cone_add(vertices=96, radius1=0.33, radius2=0.205, depth=0.88, location=(0, 0.012, 0.62))
    skirt = bpy.context.object
    skirt.name = "Layered_Green_Robe"
    skirt.scale.y = 0.62
    assign(skirt, green)
    bevel(skirt, 0.014, 3)
    tapered_panel("Robe_Overlap_L", 1.04, 0.25, 0.105, 0.145, -0.205, 0.006, green_dark, -0.07)
    tapered_panel("Robe_Overlap_R", 1.04, 0.25, 0.105, 0.145, -0.208, 0.006, green, 0.07)
    cube("Broad_Leather_Belt", (0, -0.002, 1.02), (0.245, 0.16, 0.042), leather, bevel_width=0.014)
    cube("Belt_Buckle", (0, -0.174, 1.02), (0.055, 0.014, 0.032), bronze, bevel_width=0.008)
    bpy.ops.mesh.primitive_cone_add(vertices=96, radius1=0.42, radius2=0.11, depth=0.25, location=(0, -0.005, 1.41))
    mantle = bpy.context.object
    mantle.name = "Continuous_Green_Shoulder_Mantle"
    mantle.scale.y = 0.57
    assign(mantle, green_dark)
    bevel(mantle, 0.012, 3)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.105,
        minor_radius=0.018,
        major_segments=64,
        minor_segments=16,
        location=(0, -0.015, 1.52),
    )
    collar = bpy.context.object
    collar.name = "Dark_Green_Collar"
    collar.scale.y = 0.72
    assign(collar, green_dark)
    for side in (-1, 1):
        sphere(
            f"Green_Shoulder_Underpad_{side}",
            (side * 0.29, -0.015, 1.38),
            (0.105, 0.13, 0.045),
            green_dark,
            56,
            24,
        )

    for row in range(7):
        columns = 8 if row % 2 == 0 else 7
        for column in range(columns):
            x = (column - (columns - 1) / 2) * 0.053
            z = 1.405 - row * 0.048
            plate = lamella_plate(
                f"Chest_Lamella_{row}_{column}",
                (x, -0.304 + 0.016 * (x / 0.19) ** 2, z),
                0.050,
                0.053,
                0.005,
                bronze,
                rotation_z=-x * 0.14,
            )
            for rivet_side in (-1, 1):
                sphere(
                    f"Chest_Rivet_{row}_{column}_{rivet_side}",
                    (x + rivet_side * 0.014, plate.location.y - 0.011, z + 0.011),
                    (0.0032, 0.0022, 0.0032),
                    bronze,
                    16,
                    8,
                )
        strand(
            f"Chest_Lacing_{row}",
            [(-0.205, -0.317, z + 0.010), (0, -0.322, z + 0.006), (0.205, -0.317, z + 0.010)],
            0.0022,
            red,
            taper=False,
        )

    for side in (-1, 1):
        for layer in range(4):
            lamella_plate(
                f"Shoulder_Lamella_{side}_{layer}",
                (side * (0.255 + layer * 0.040), -0.145 + layer * 0.012, 1.41 - layer * 0.030),
                0.083,
                0.073,
                0.007,
                bronze,
                rotation_z=-side * (0.16 + layer * 0.06),
            )
        strand(
            f"Shoulder_Red_Lacing_{side}",
            [
                (side * 0.24, -0.145, 1.40),
                (side * 0.30, -0.16, 1.32),
                (side * 0.36, -0.14, 1.26),
            ],
            0.005,
            red,
            taper=False,
        )

    # Headcloth wraps the textured MPFB head; the forehead remains visible.
    body_shell(body, "Fitted_Green_Headcloth", lambda co: co.z > 1.725, green_dark, 0.012)
    for fold_index, fold_z in enumerate((1.708, 1.720, 1.732)):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.105,
            minor_radius=0.0065,
            major_segments=64,
            minor_segments=12,
            location=(0, -0.070, fold_z),
        )
        headband_fold = bpy.context.object
        headband_fold.name = f"Wrapped_Headcloth_Band_{fold_index}"
        headband_fold.scale.y = 0.82
        assign(headband_fold, green)
    strand("Headcloth_Tail_L", [(-0.05, 0.04, 1.74), (-0.10, 0.08, 1.58), (-0.075, 0.07, 1.42)], 0.013, green_dark)
    strand("Headcloth_Tail_R", [(0.05, 0.04, 1.74), (0.11, 0.09, 1.57), (0.085, 0.07, 1.41)], 0.013, green_dark)

    # Overlapping tapered locks create beard mass without a solid "shield"
    # behind the individual flyaway hairs.
    strand("Hero_Brow_L", [(-0.064, -0.153, 1.695), (-0.038, -0.158, 1.699), (-0.010, -0.154, 1.682)], 0.0037, black)
    strand("Hero_Brow_R", [(0.064, -0.153, 1.695), (0.038, -0.158, 1.699), (0.010, -0.154, 1.682)], 0.0037, black)
    strand("Brow_Furrow_L", [(-0.012, -0.153, 1.685), (-0.006, -0.155, 1.672)], 0.0011, furrow)
    strand("Brow_Furrow_R", [(0.012, -0.153, 1.685), (0.006, -0.155, 1.672)], 0.0011, furrow)
    strand("Moustache_L", [(-0.003, -0.151, 1.606), (-0.038, -0.157, 1.592), (-0.078, -0.149, 1.574)], 0.0045, black)
    strand("Moustache_R", [(0.003, -0.151, 1.606), (0.038, -0.157, 1.592), (0.078, -0.149, 1.574)], 0.0045, black)
    rng = random.Random(280)
    for i in range(25):
        x = rng.uniform(-0.060, 0.060)
        drift_a = rng.uniform(-0.018, 0.018)
        drift_b = rng.uniform(-0.015, 0.015)
        strand(
            f"Beard_Main_Mass_{i}",
            [
                (x * 0.58, -0.149, 1.582 + rng.uniform(-0.008, 0.008)),
                (x + drift_a, -0.190, 1.445 + rng.uniform(-0.025, 0.025)),
                (x * 0.78 + drift_b, -0.235, 1.205 + rng.uniform(-0.035, 0.035)),
                (x * 0.32 - drift_a * 0.2, -0.225, rng.uniform(0.965, 1.060)),
            ],
            rng.uniform(0.0018, 0.0032),
            black,
        )
    for i in range(190):
        x = rng.uniform(-0.065, 0.065)
        sway_a = rng.uniform(-0.021, 0.021)
        sway_b = rng.uniform(-0.018, 0.018)
        strand(
            f"Long_Beard_{i:02}",
            [
                (x * 0.55, -0.150, 1.580 + rng.uniform(-0.010, 0.010)),
                (x + sway_a, -0.195, 1.425 + rng.uniform(-0.035, 0.035)),
                (x * 0.74 + sway_b, -0.240, 1.180 + rng.uniform(-0.045, 0.045)),
                (x * 0.30 - sway_a * 0.25, -0.225, rng.uniform(0.925, 1.055) + abs(x) * 0.12),
            ],
            rng.uniform(0.00045, 0.00105),
            black,
        )

    # Green Dragon Crescent Blade.
    pole_y = -0.21
    pole_start = (glaive_pole_x(0.08), pole_y, 0.08)
    pole_end = (glaive_pole_x(2.25), pole_y, 2.25)
    cylinder_between("Green_Dragon_Pole", pole_start, pole_end, 0.021, leather, 48)
    pole_tilt = math.atan2(pole_end[0] - pole_start[0], pole_end[2] - pole_start[2])
    for grip_index, grip_z in enumerate((0.96, 1.22)):
        for wrap in range(5):
            bpy.ops.mesh.primitive_torus_add(
                major_radius=0.025,
                minor_radius=0.0032,
                major_segments=32,
                minor_segments=8,
                location=(glaive_pole_x(grip_z - 0.026 + wrap * 0.013), pole_y, grip_z - 0.026 + wrap * 0.013),
            )
            grip = bpy.context.object
            grip.name = f"Crimson_Grip_Wrap_{grip_index}_{wrap}"
            grip.rotation_euler.y = pole_tilt
            assign(grip, red)
    blade_2d = [
        (0.00, 2.09),
        (0.075, 2.13),
        (0.135, 2.20),
        (0.185, 2.31),
        (0.225, 2.51),
        (0.155, 2.465),
        (0.078, 2.405),
        (0.012, 2.32),
    ]
    depth = 0.015
    verts = [(glaive_pole_x(z) + x, pole_y - depth, z) for x, z in blade_2d] + [
        (glaive_pole_x(z) + x, pole_y + depth, z) for x, z in blade_2d
    ]
    count = len(blade_2d)
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces += [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    blade_mesh = bpy.data.meshes.new("Green_Dragon_Blade_Mesh")
    blade_mesh.from_pydata(verts, [], faces)
    blade = bpy.data.objects.new("Green_Dragon_Crescent_Blade", blade_mesh)
    bpy.context.collection.objects.link(blade)
    assign(blade, steel)
    bevel(blade, 0.007, 3)
    polished_edge = mat("Polished blade edge", (0.34, 0.40, 0.43, 1), 0.14, 0.95, noise=7, bump=0.04)
    strand(
        "Crescent_Blade_Bright_Edge",
        [
            (glaive_pole_x(2.13) + 0.075, pole_y - depth - 0.002, 2.13),
            (glaive_pole_x(2.20) + 0.135, pole_y - depth - 0.002, 2.20),
            (glaive_pole_x(2.31) + 0.185, pole_y - depth - 0.002, 2.31),
            (glaive_pole_x(2.51) + 0.225, pole_y - depth - 0.002, 2.51),
        ],
        0.0045,
        polished_edge,
        taper=False,
    )
    collar_x = glaive_pole_x(2.10)
    sphere("Blade_Bronze_Collar", (collar_x, pole_y, 2.10), (0.055, 0.045, 0.065), bronze, 40, 20)
    strand(
        "Blade_Red_Tassel",
        [
            (collar_x, pole_y - 0.005, 2.10),
            (collar_x - 0.08, pole_y - 0.015, 1.98),
            (collar_x - 0.05, pole_y - 0.005, 1.84),
        ],
        0.010,
        red,
    )

    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -0.03))
    floor = bpy.context.object
    assign(floor, mat("Charcoal floor", (0.012, 0.009, 0.007, 1), 0.74, noise=12, bump=0.1))

    bpy.ops.object.camera_add(location=(0.45, -5.25, 1.18))
    camera = bpy.context.object
    camera.data.lens = 58
    look_at(camera, (0, -0.02, 1.15))
    bpy.context.scene.camera = camera

    for name, location, energy, color, size in [
        ("Warm_Key", (-2.5, -3.1, 3.6), 930, (1.0, 0.66, 0.43), 2.4),
        ("Cool_Fill", (2.6, -2.2, 2.5), 470, (0.26, 0.40, 0.66), 2.8),
        ("Bronze_Rim", (0.7, 2.6, 3.1), 1300, (1.0, 0.34, 0.14), 2.1),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, (0, 0, 1.1))

    scene = bpy.context.scene
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Studio World")
    scene.world.color = (0.002, 0.0015, 0.001)
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW)
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        scene.view_settings.look = "Medium High Contrast"

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    bpy.ops.render.render(write_still=True)
    print(f"BLEND={BLEND}")
    print(f"PREVIEW={PREVIEW}")


if __name__ == "__main__":
    main()
