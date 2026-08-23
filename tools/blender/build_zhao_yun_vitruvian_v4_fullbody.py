"""Build Zhao Yun v4: rigged spear pose, full armor, boots and white cape."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v4-rig-test.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v4-fullbody.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v2 as v2  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v3 as v3  # pylint: disable=wrong-import-position


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def parent_to_bone_keep_transform(obj, rig, bone_name):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def attach_existing_costume(rig):
    for obj in list(bpy.context.scene.objects):
        name = obj.name
        if obj in {rig, bpy.data.objects.get("ZhaoYun_Body")}:
            continue
        if name == "ZhaoYun_Strand_Hair_Emitter" or name.startswith("ZhaoYun_Circlet") or name.startswith("ZhaoYun_Fitted_Silver_Circlet"):
            parent_to_bone_keep_transform(obj, rig, "head")
        elif "Pauldron" in name:
            # These pieces were authored for the static bust. Bone parenting
            # pulls one of the broad bases across the chest in the spear pose;
            # purpose-built posed pauldrons are added below.
            obj.hide_render = True
            obj.hide_set(True)
        elif name.startswith(
            (
                "ZhaoYun_Fitted_",
                "ZhaoYun_Lamella_",
                "ZhaoYun_Rivet_",
                "ZhaoYun_Lacing_",
                "ZhaoYun_White_Collar_",
                "ZhaoYun_Jade_Armor_Clasp",
                "ZhaoYun_Clasp_Gold_Rim",
                "ZhaoYun_Continuous_Inner_Collar",
                "ZhaoYun_Padded_Gorget",
            )
        ):
            parent_to_bone_keep_transform(obj, rig, "spine_03")


def empty_target(name, location):
    obj = bpy.data.objects.new(name, None)
    obj.location = location
    obj.empty_display_type = "SPHERE"
    obj.empty_display_size = 0.035
    obj.hide_render = True
    bpy.context.collection.objects.link(obj)
    return obj


def point_on_spear(z):
    bottom = Vector((-0.42, -0.285, 0.015))
    top = Vector((-0.25, -0.285, 2.20))
    factor = (z - bottom.z) / (top.z - bottom.z)
    return bottom.lerp(top, factor)


def pose_grounded_stance(rig):
    # Vitruvian's game rig uses intentionally disconnected deform bones in the
    # legs. A conventional IK chain pulls the foot bones upward across those
    # gaps. Keep the authored neutral leg pose: its ankle and toe positions are
    # already planted at z=.094 and z=.017 respectively.
    for bone_name in ("thigh_l", "calf_l", "foot_l", "thigh_r", "calf_r", "foot_r"):
        bone = rig.pose.bones[bone_name]
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion.identity()
        bone.location = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
        for constraint in list(bone.constraints):
            bone.constraints.remove(constraint)
    bpy.context.view_layer.update()


def pose_two_hand_spear(rig):
    # Weapon hand holds the spear outside the face silhouette; the free hand
    # rests near the belt for a composed commander's stance.
    left_target = empty_target("ZhaoYun_Left_Hand_Waist", (0.180, -0.200, 1.160))
    # The target controls the wrist, not the middle of the palm. Offset it to
    # the inside/front of the shaft so the curled fingers close around the pole
    # instead of stopping beside it.
    right_target = empty_target(
        "ZhaoYun_Right_Hand_Spear",
        tuple(point_on_spear(1.115) + Vector((0.070, 0.040, 0.0))),
    )
    left_elbow = empty_target("ZhaoYun_Left_Elbow", (0.43, -0.025, 1.19))
    right_elbow = empty_target("ZhaoYun_Right_Elbow", (-0.49, -0.04, 1.18))
    constraints = {}
    for hand_name, target, pole, angle in (
        ("hand_l", left_target, left_elbow, math.radians(-90)),
        ("hand_r", right_target, right_elbow, math.radians(90)),
    ):
        hand = rig.pose.bones[hand_name]
        constraint = hand.constraints.new("IK")
        constraint.name = "Zhao Yun two-hand spear grip"
        constraint.target = target
        constraint.pole_target = pole
        constraint.pole_angle = angle
        constraint.chain_count = 3
        constraint.use_tail = False
        constraints[hand_name] = constraint
        for bone in (hand, hand.parent, hand.parent.parent):
            bone.ik_stretch = 0.0

    bpy.context.view_layer.update()
    # Roll the weapon wrist around the hand bone's local Y axis. The stock rig
    # otherwise presents the open palm upward even when the fingers are curled.
    weapon_hand = rig.pose.bones["hand_r"]
    right_target.rotation_mode = "QUATERNION"
    right_target.rotation_quaternion = (
        (rig.matrix_world @ weapon_hand.matrix).to_quaternion()
        @ Quaternion((0.0, 1.0, 0.0), math.radians(-92.0))
    )
    constraints["hand_r"].use_rotation = True

    for side, amount in (("l", -74), ("r", -78)):
        for finger in ("index", "middle", "ring", "pinky"):
            for joint in (1, 2, 3):
                bone = rig.pose.bones.get(f"{finger}_{joint:02}_{side}")
                if bone:
                    bone.rotation_mode = "XYZ"
                    bone.rotation_euler.x = math.radians(amount)
        for joint in (1, 2, 3):
            bone = rig.pose.bones.get(f"thumb_{joint:02}_{side}")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(amount * 0.52)
    bpy.context.view_layer.update()


def bone_point(rig, bone_name, endpoint="head"):
    bone = rig.pose.bones[bone_name]
    return rig.matrix_world @ (bone.head if endpoint == "head" else bone.tail)


def cloth_tube(name, centers, radii, depths, material, segments=28):
    centers = [Vector(center) for center in centers]
    verts = []
    for index, center in enumerate(centers):
        previous = centers[max(0, index - 1)]
        following = centers[min(len(centers) - 1, index + 1)]
        tangent = (following - previous).normalized()
        depth_axis = Vector((0.0, 1.0, 0.0))
        side_axis = depth_axis.cross(tangent).normalized()
        for segment in range(segments):
            angle = math.tau * segment / segments
            offset = side_axis * math.cos(angle) * radii[index]
            offset += depth_axis * math.sin(angle) * depths[index]
            verts.append(tuple(center + offset))
    faces = []
    for row in range(len(centers) - 1):
        a = row * segments
        b = (row + 1) * segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((a + segment, a + nxt, b + nxt, b + segment))
    faces.append(tuple(reversed(range(segments))))
    last = (len(centers) - 1) * segments
    faces.append(tuple(range(last, last + segments)))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    for poly in mesh.polygons:
        poly.use_smooth = True
    subdiv = obj.modifiers.new(name + "_Smooth", "SUBSURF")
    subdiv.levels = 1
    subdiv.render_levels = 2
    return obj


def cloth_ribbon(name, centers, half_widths, material, thickness=0.006):
    verts = []
    for index, center in enumerate(centers):
        current = Vector(center)
        previous = Vector(centers[max(0, index - 1)])
        following = Vector(centers[min(len(centers) - 1, index + 1)])
        tangent = following - previous
        perpendicular = Vector((-tangent.z, 0.0, tangent.x))
        if perpendicular.length < 1e-6:
            perpendicular = Vector((1.0, 0.0, 0.0))
        perpendicular.normalize()
        offset = perpendicular * half_widths[index]
        verts.extend((tuple(current - offset), tuple(current + offset)))
    faces = [(i * 2, i * 2 + 1, i * 2 + 3, i * 2 + 2) for i in range(len(centers) - 1)]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    solidify = obj.modifiers.new(name + "_Thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    subdiv = obj.modifiers.new(name + "_Smooth", "SUBSURF")
    subdiv.levels = 2
    subdiv.render_levels = 2
    return obj


def ring_curve(name, center, tangent, radius, depth, material, thickness=0.0027, segments=56):
    center = Vector(center)
    tangent = Vector(tangent).normalized()
    depth_axis = Vector((0.0, 1.0, 0.0))
    side_axis = depth_axis.cross(tangent).normalized()
    curve = bpy.data.curves.new(name + "_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = thickness
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(segments - 1)
    for index in range(segments):
        angle = math.tau * index / segments
        point = center + side_axis * math.cos(angle) * radius + depth_axis * math.sin(angle) * depth
        spline.points[index].co = (*point, 1.0)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def cylinder_between(name, start, end, radius, material, vertices=48):
    start = Vector(start)
    end = Vector(end)
    direction = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=(start + end) * 0.5)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(direction.normalized())
    assign(obj, material)
    bevel = obj.modifiers.new(name + "_Edge", "BEVEL")
    bevel.width = radius * 0.10
    bevel.segments = 3
    return obj


def body_surface_shell(name, body, group_names, material, threshold=0.16, offset=0.006):
    """Extract a posed, body-fitted garment shell from weighted skin faces."""
    subdivision = next((modifier for modifier in body.modifiers if modifier.type == "SUBSURF"), None)
    subdivision_visible = subdivision.show_viewport if subdivision else None
    if subdivision:
        subdivision.show_viewport = False
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_object = body.evaluated_get(depsgraph)
    evaluated_mesh = evaluated_object.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
    source_mesh = body.data
    if len(evaluated_mesh.vertices) != len(source_mesh.vertices):
        evaluated_object.to_mesh_clear()
        if subdivision:
            subdivision.show_viewport = subdivision_visible
        raise RuntimeError(f"Topology changed while extracting {name}")

    group_indices = {body.vertex_groups[group].index for group in group_names if group in body.vertex_groups}
    weights = [
        sum(link.weight for link in vertex.groups if link.group in group_indices)
        for vertex in source_mesh.vertices
    ]
    selected = [
        polygon
        for polygon in evaluated_mesh.polygons
        if sum(weights[index] for index in polygon.vertices) / len(polygon.vertices) >= threshold
    ]
    vertex_map = {}
    verts = []
    faces = []
    normal_matrix = body.matrix_world.to_3x3()
    for polygon in selected:
        face = []
        for source_index in polygon.vertices:
            if source_index not in vertex_map:
                vertex = evaluated_mesh.vertices[source_index]
                normal = normal_matrix @ vertex.normal
                if normal.length:
                    normal.normalize()
                point = body.matrix_world @ vertex.co + normal * offset
                vertex_map[source_index] = len(verts)
                verts.append(tuple(point))
            face.append(vertex_map[source_index])
        faces.append(tuple(face))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    garment = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(garment)
    assign(garment, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    solid = garment.modifiers.new(name + "_Cloth_Thickness", "SOLIDIFY")
    solid.thickness = 0.0035
    solid.offset = 0.25
    bevel = garment.modifiers.new(name + "_Cloth_Edge_Soften", "BEVEL")
    bevel.width = 0.0015
    bevel.segments = 2

    evaluated_object.to_mesh_clear()
    if subdivision:
        subdivision.show_viewport = subdivision_visible
    bpy.context.view_layer.update()
    return garment


def build_fitted_underlayers(body, navy):
    for side in ("l", "r"):
        body_surface_shell(
            f"ZhaoYun_V4_Fitted_Arm_Underlayer_{side}",
            body,
            [
                f"clavicle_{side}",
                f"upperarm_{side}",
                f"upperarm_twist_01_{side}",
                f"upperarm_twist_02_{side}",
                f"lowerarm_{side}",
                f"lowerarm_twist_01_{side}",
                f"lowerarm_twist_02_{side}",
            ],
            navy,
            threshold=0.12,
            offset=0.007,
        )
    body_surface_shell(
        "ZhaoYun_V4_Fitted_Trouser_Underlayer",
        body,
        [
            "thigh_l", "thigh_twist_01_l", "thigh_twist_02_l", "calf_l", "calf_twist_01_l", "calf_twist_02_l",
            "thigh_r", "thigh_twist_01_r", "thigh_twist_02_r", "calf_r", "calf_twist_01_r", "calf_twist_02_r",
        ],
        navy,
        threshold=0.12,
        offset=0.007,
    )


def build_arm_layers(rig, navy, silver, gold):
    for side in ("l", "r"):
        sign = 1.0 if side == "l" else -1.0
        shoulder = bone_point(rig, f"upperarm_{side}", "head")
        elbow = bone_point(rig, f"lowerarm_{side}", "head")
        wrist = bone_point(rig, f"hand_{side}", "head")
        shoulder_shell = shoulder + Vector((sign * 0.050, -0.060, 0.012))
        elbow_shell = elbow + Vector((sign * 0.030, -0.040, 0.0))
        cloth_tube(
            f"ZhaoYun_V4_Vambrace_{side}",
            [elbow_shell, elbow_shell.lerp(wrist, 0.48), elbow_shell.lerp(wrist, 0.88)],
            [0.062, 0.055, 0.048],
            [0.068, 0.060, 0.052],
            silver,
            32,
        )
        v2.add_shield_plate(
            f"ZhaoYun_V4_Elbow_Guard_{side}",
            tuple(elbow_shell + Vector((0.0, -0.070, 0.0))),
            0.068,
            0.074,
            0.012,
            silver,
            rotation_z=math.radians(-sign * 4.0),
            bevel=0.0030,
        )
        tangent = wrist - elbow
        for index, factor in enumerate((0.12, 0.36, 0.60, 0.82)):
            center = elbow.lerp(wrist, factor)
            ring_curve(f"ZhaoYun_V4_Vambrace_Band_{side}_{index}", center, tangent, 0.058 - factor * 0.012, 0.052 - factor * 0.010, gold, 0.0020)


def build_pauldrons_and_gauntlets(rig, navy, silver, gold):
    # Compact layered shoulder guards, placed after posing so they follow the
    # arm silhouette instead of crossing the breastplate.
    for side, sign in (("l", 1.0), ("r", -1.0)):
        shoulder = Vector((sign * 0.205, -0.025, 1.355))
        underpad = base.add_ellipsoid(
            f"ZhaoYun_V4_Pauldron_Underpad_{side}",
            tuple(shoulder + Vector((0.0, -0.055, 0.0))),
            (0.090, 0.040, 0.030),
            navy,
            48,
            24,
        )
        underpad.rotation_euler.y = math.radians(sign * 8.0)
        for index in range(4):
            x = sign * (0.175 + index * 0.027)
            z = 1.385 - index * 0.042
            plate = v2.add_shield_plate(
                f"ZhaoYun_V4_Pauldron_Plate_{side}_{index}",
                (x, -0.098 - index * 0.006, z),
                0.073 - index * 0.003,
                0.058,
                0.012,
                silver,
                rotation_z=math.radians(-sign * (5.0 + index * 4.0)),
                bevel=0.0035,
            )
            base.add_ellipsoid(
                f"ZhaoYun_V4_Pauldron_Rivet_{side}_{index}",
                (x, -0.111 - index * 0.006, z + 0.016),
                (0.0040, 0.0020, 0.0040),
                gold,
                20,
                10,
            )

        wrist = bone_point(rig, f"hand_{side}", "head")
        knuckle = bone_point(rig, f"hand_{side}", "tail")
        cloth_tube(
            f"ZhaoYun_V4_Leather_Glove_{side}",
            [wrist, wrist.lerp(knuckle, 0.55), knuckle],
            [0.044, 0.047, 0.040],
            [0.038, 0.041, 0.036],
            navy,
            32,
        )
        tangent = knuckle - wrist
        ring_curve(
            f"ZhaoYun_V4_Glove_Cuff_{side}",
            wrist.lerp(knuckle, 0.08),
            tangent,
            0.045,
            0.039,
            gold,
            0.0022,
        )

        # Articulated leather finger sleeves follow the actual rigged digits.
        # They hide the raw base-mesh hand while retaining a readable grip.
        for finger in ("index", "middle", "ring", "pinky", "thumb"):
            for joint in (1, 2, 3):
                bone_name = f"{finger}_{joint:02}_{side}"
                if bone_name not in rig.pose.bones:
                    continue
                start = bone_point(rig, bone_name, "head")
                end = bone_point(rig, bone_name, "tail")
                radius = (0.0090, 0.0078, 0.0068)[joint - 1]
                cylinder_between(
                    f"ZhaoYun_V4_Glove_{side}_{finger}_{joint}",
                    start,
                    end,
                    radius,
                    navy,
                    24,
                )
                base.add_ellipsoid(
                    f"ZhaoYun_V4_Glove_Joint_{side}_{finger}_{joint}",
                    tuple(start),
                    (radius * 1.08, radius * 1.08, radius * 1.08),
                    silver if joint == 1 else navy,
                    20,
                    10,
                )


def build_helmet(rig, silver, gold, crimson):
    # Open-bottom late-Han inspired war cap: the face, ears and side hair stay
    # visible while a segmented silver crown gives Zhao Yun his iconic martial
    # silhouette.
    center = Vector((0.0, 0.005, 1.695))
    radius_x, radius_y, radius_z = 0.104, 0.098, 0.116
    rings, segments = 10, 64
    verts = [(center.x, center.y, center.z + radius_z)]
    for ring in range(1, rings + 1):
        theta = (math.pi * 0.5) * ring / rings
        for segment in range(segments):
            phi = math.tau * segment / segments
            verts.append(
                (
                    center.x + math.sin(theta) * math.cos(phi) * radius_x,
                    center.y + math.sin(theta) * math.sin(phi) * radius_y,
                    center.z + math.cos(theta) * radius_z,
                )
            )
    faces = []
    for segment in range(segments):
        faces.append((0, 1 + segment, 1 + (segment + 1) % segments))
    for ring in range(rings - 1):
        start = 1 + ring * segments
        following = start + segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((start + segment, following + segment, following + nxt, start + nxt))
    mesh = bpy.data.meshes.new("ZhaoYun_V4_Silver_Helmet_Cap_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    helmet = bpy.data.objects.new("ZhaoYun_V4_Silver_Helmet_Cap", mesh)
    bpy.context.collection.objects.link(helmet)
    assign(helmet, silver)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    solid = helmet.modifiers.new("Helmet_Thickness", "SOLIDIFY")
    solid.thickness = 0.0045
    bevel = helmet.modifiers.new("Helmet_Rim_Soften", "BEVEL")
    bevel.width = 0.0022
    bevel.segments = 3
    parent_to_bone_keep_transform(helmet, rig, "head")

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.099,
        minor_radius=0.0065,
        major_segments=96,
        minor_segments=16,
        location=(0.0, 0.005, 1.695),
    )
    rim = bpy.context.object
    rim.name = "ZhaoYun_V4_Helmet_Gold_Rim"
    rim.scale.y = 0.94
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(rim, gold)
    parent_to_bone_keep_transform(rim, rig, "head")

    crest = v2.add_shield_plate(
        "ZhaoYun_V4_Helmet_Forehead_Crest",
        (0.0, -0.099, 1.718),
        0.042,
        0.069,
        0.009,
        silver,
        bevel=0.0030,
    )
    parent_to_bone_keep_transform(crest, rig, "head")
    jewel = base.add_ellipsoid(
        "ZhaoYun_V4_Helmet_Jade_Setting",
        (0.0, -0.110, 1.727),
        (0.009, 0.004, 0.012),
        bpy.data.materials.get("ZhaoYun_Jade") or gold,
        32,
        16,
    )
    parent_to_bone_keep_transform(jewel, rig, "head")

    ridge_points = [(0.0, -0.092, 1.710), (0.0, -0.070, 1.770), (0.0, 0.005, 1.812), (0.0, 0.078, 1.770)]
    ridge = base.add_curve_strand("ZhaoYun_V4_Helmet_Gold_Ridge", ridge_points, 0.0040, gold)
    parent_to_bone_keep_transform(ridge, rig, "head")
    socket = cylinder_between(
        "ZhaoYun_V4_Helmet_Plume_Socket",
        (0.0, 0.010, 1.800),
        (0.0, 0.018, 1.845),
        0.016,
        gold,
        40,
    )
    parent_to_bone_keep_transform(socket, rig, "head")

    for index in range(22):
        spread = (index - 10.5) / 21.0
        points = [
            (spread * 0.008, 0.018, 1.838),
            (spread * 0.025, 0.045 + abs(spread) * 0.012, 1.915 + 0.012 * math.cos(index)),
            (0.045 + spread * 0.060, 0.100 + abs(spread) * 0.025, 1.970 - abs(spread) * 0.015),
            (0.135 + spread * 0.100, 0.155 + abs(spread) * 0.040, 1.925 - abs(spread) * 0.055),
        ]
        strand = base.add_curve_strand(f"ZhaoYun_V4_Crimson_Helmet_Plume_{index}", points, 0.0022, crimson)
        parent_to_bone_keep_transform(strand, rig, "head")


def build_waist_and_skirt(navy, white, silver, gold, crimson):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.173, minor_radius=0.017, major_segments=96, minor_segments=16, location=(0.0, 0.016, 1.045))
    belt = bpy.context.object
    belt.name = "ZhaoYun_V4_Armored_Belt"
    belt.scale.y = 0.72
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(belt, gold)

    # Flowing white split battle skirt, visible beneath the armor panels.
    for side in (-1, 1):
        cloth_ribbon(
            f"ZhaoYun_V4_White_Skirt_{side}",
            [
                (side * 0.075, -0.105, 1.055),
                (side * 0.105, -0.145, 0.910),
                (side * 0.135, -0.165, 0.735),
                (side * 0.175, -0.185, 0.565),
            ],
            [0.105, 0.125, 0.140, 0.125],
            white,
            0.009,
        )

    # Five segmented skirt guards continue the chest lamellar language.
    for panel in range(7):
        center_x = (panel - 3) * 0.060
        for row in range(5):
            z = 1.015 - row * 0.061 - (panel % 2) * 0.006
            y = -0.166 + abs(center_x) * 0.08
            plate = v2.add_shield_plate(
                f"ZhaoYun_V4_Skirt_Lamella_{panel}_{row}",
                (center_x, y, z),
                0.054,
                0.070,
                0.010,
                silver,
                rotation_z=math.radians(-center_x * 18.0),
                bevel=0.0028,
            )
            rivet = base.add_ellipsoid(
                f"ZhaoYun_V4_Skirt_Rivet_{panel}_{row}",
                (center_x, y - 0.008, z + 0.019),
                (0.0030, 0.0017, 0.0030),
                gold,
                20,
                10,
            )
            rivet.rotation_euler.x = math.radians(90)
        base.add_curve_strand(
            f"ZhaoYun_V4_Skirt_Lacing_{panel}",
            [(center_x, -0.158, 1.030), (center_x, -0.172, 0.735)],
            0.0015,
            crimson,
        )


def build_legs(rig, navy, silver, gold):
    for side in ("l", "r"):
        sign = 1.0 if side == "l" else -1.0
        hip = bone_point(rig, f"thigh_{side}", "head")
        knee = bone_point(rig, f"calf_{side}", "head")
        ankle = bone_point(rig, f"foot_{side}", "head")
        toe = bone_point(rig, f"foot_{side}", "tail")
        cloth_tube(
            f"ZhaoYun_V4_Greave_{side}",
            [knee.lerp(ankle, 0.04), knee.lerp(ankle, 0.46), knee.lerp(ankle, 0.86)],
            [0.071, 0.061, 0.049],
            [0.064, 0.055, 0.046],
            silver,
            32,
        )
        knee_guard = v2.add_shield_plate(
            f"ZhaoYun_V4_Knee_Guard_{side}",
            tuple(knee + Vector((sign * 0.018, -0.180, 0.006))),
            0.075,
            0.072,
            0.012,
            silver,
            rotation_z=math.radians(-sign * 4.0),
            bevel=0.0032,
        )
        tangent = ankle - knee
        for index, factor in enumerate((0.12, 0.38, 0.64, 0.86)):
            center = knee.lerp(ankle, factor)
            ring_curve(f"ZhaoYun_V4_Greave_Band_{side}_{index}", center, tangent, 0.069 - factor * 0.018, 0.061 - factor * 0.015, gold, 0.0022)
        cloth_tube(
            f"ZhaoYun_V4_Boot_{side}",
            [
                knee.lerp(ankle, 0.72) + Vector((0.0, -0.055, 0.0)),
                ankle + Vector((0.0, -0.060, 0.0)),
                ankle.lerp(toe, 0.58) + Vector((0.0, -0.045, 0.0)),
                toe + Vector((0.0, -0.035, 0.0)),
            ],
            [0.054, 0.061, 0.068, 0.056],
            [0.052, 0.060, 0.086, 0.072],
            navy,
            32,
        )
        direction = toe - ankle
        boot_foot = base.add_ellipsoid(
            f"ZhaoYun_V4_Leather_Foot_{side}",
            tuple(ankle.lerp(toe, 0.62) + Vector((0.0, -0.025, 0.008))),
            (0.074, 0.130, 0.058),
            navy,
            48,
            24,
        )
        boot_foot.rotation_euler.z = -math.atan2(direction.x, direction.y)
        toe_cap = base.add_ellipsoid(
            f"ZhaoYun_V4_Silver_Toe_{side}",
            tuple(ankle.lerp(toe, 0.82) + Vector((0.0, -0.006, 0.016))),
            (0.061, 0.060, 0.034),
            silver,
            48,
            20,
        )
        toe_cap.rotation_euler.z = -math.atan2(direction.x, direction.y)
        ring_curve(f"ZhaoYun_V4_Boot_Cuff_{side}", ankle, ankle - knee, 0.052, 0.050, gold, 0.0024)


def build_cape(white, gold):
    # Three independently flowing panels create folds, negative space and an
    # irregular hem. This avoids the flat triangular silhouette of one sheet.
    panels = (
        (
            "Left",
            [(-0.115, 0.125, 1.445), (-0.145, 0.175, 1.225), (-0.155, 0.245, 0.965), (-0.115, 0.295, 0.675), (-0.055, 0.330, 0.315)],
            [0.105, 0.125, 0.145, 0.140, 0.105],
        ),
        (
            "Center",
            [(0.000, 0.120, 1.450), (0.020, 0.195, 1.220), (0.070, 0.255, 0.940), (0.145, 0.305, 0.630), (0.225, 0.345, 0.255)],
            [0.100, 0.125, 0.145, 0.145, 0.105],
        ),
        (
            "Right",
            [(0.115, 0.125, 1.440), (0.175, 0.185, 1.205), (0.265, 0.250, 0.920), (0.375, 0.310, 0.600), (0.490, 0.355, 0.300)],
            [0.095, 0.115, 0.130, 0.125, 0.085],
        ),
    )
    for name, centers, widths in panels:
        cloth_ribbon(f"ZhaoYun_V4_White_Cape_{name}", centers, widths, white, 0.007)
        # A narrow gold stitched seam catches rim light between the panels.
        base.add_curve_strand(
            f"ZhaoYun_V4_Cape_Gold_Seam_{name}",
            [(center[0] + widths[index], center[1] - 0.003, center[2]) for index, center in enumerate(centers)],
            0.0022,
            gold,
        )


def build_spear(wood, silver, gold, crimson):
    bottom = Vector((-0.42, -0.285, 0.015))
    socket = Vector((-0.25, -0.285, 2.20))
    tip = Vector((-0.232, -0.285, 2.44))
    cylinder_between("ZhaoYun_V4_Dragon_Spear_Shaft", bottom, socket, 0.0115, wood, 56)
    cylinder_between("ZhaoYun_V4_Dragon_Spear_Socket", socket - (tip - socket).normalized() * 0.055, socket + (tip - socket).normalized() * 0.035, 0.021, gold, 48)

    direction = (tip - socket).normalized()
    side = Vector((-direction.z, 0.0, direction.x)).normalized()
    depth = Vector((0.0, 0.006, 0.0))
    widest = socket.lerp(tip, 0.38)
    verts = [
        tuple(socket - depth), tuple(widest + side * 0.048 - depth), tuple(tip - depth), tuple(widest - side * 0.048 - depth),
        tuple(socket + depth), tuple(widest + side * 0.048 + depth), tuple(tip + depth), tuple(widest - side * 0.048 + depth),
    ]
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    mesh = bpy.data.meshes.new("ZhaoYun_V4_Dragon_Spear_Blade_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    blade = bpy.data.objects.new("ZhaoYun_V4_Dragon_Spear_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    assign(blade, silver)
    bevel = blade.modifiers.new("Spear_Blade_Edge", "BEVEL")
    bevel.width = 0.003
    bevel.segments = 3

    tassel_root = socket - direction * 0.060
    for index in range(14):
        angle = math.tau * index / 14.0
        radial = Vector((math.cos(angle) * 0.022, math.sin(angle) * 0.012, 0.0))
        end = tassel_root + Vector((radial.x * 2.0, radial.y, -0.17 - 0.018 * math.sin(angle * 3.0)))
        base.add_curve_strand(
            f"ZhaoYun_V4_Crimson_Tassel_{index}",
            [tuple(tassel_root + radial * 0.3), tuple(tassel_root + radial), tuple(end)],
            0.0022,
            crimson,
        )


def make_new_materials():
    navy = base.make_material("ZY4_Deep_Navy_Cloth", (0.008, 0.020, 0.043), 0.0, 0.62)
    white = base.make_material("ZY4_White_Silk", (0.55, 0.60, 0.64), 0.0, 0.58)
    silver = base.make_material("ZY4_Weathered_Silver", (0.20, 0.25, 0.30), 0.80, 0.31)
    gold = base.make_material("ZY4_Antique_Gold", (0.28, 0.13, 0.030), 0.76, 0.29)
    crimson = base.make_material("ZY4_Deep_Crimson", (0.12, 0.008, 0.005), 0.0, 0.56)
    wood = base.make_material("ZY4_Dark_Spear_Wood", (0.025, 0.010, 0.006), 0.0, 0.42)
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.0, 0.0, 0.0))
    coord = bpy.context.object
    coord.name = "ZhaoYun_V4_Material_Coordinates"
    coord.hide_render = True
    v3.add_cloth_microtexture(navy, coord, 0.08)
    v3.add_cloth_microtexture(white, coord, 0.06)
    v3.add_weathered_metal(silver, coord, (0.075, 0.095, 0.12), (0.31, 0.36, 0.40), 0.40, 0.26)
    v3.add_weathered_metal(gold, coord, (0.09, 0.025, 0.006), (0.38, 0.18, 0.035), 0.39, 0.25)
    return navy, white, silver, gold, crimson, wood


def build_ground():
    ground = bpy.data.objects.get("ZhaoYun_V4_Stone_Ground")
    if ground:
        return
    material = base.make_material("ZY4_Stone_Ground", (0.016, 0.021, 0.029), 0.0, 0.78)
    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0.0, 0.0, -0.004))
    ground = bpy.context.object
    ground.name = "ZhaoYun_V4_Stone_Ground"
    assign(ground, material)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["game_rig_vitruvian"]
    rig.name = "ZhaoYun_Game_Rig"
    attach_existing_costume(rig)
    pose_grounded_stance(rig)
    pose_two_hand_spear(rig)
    navy, white, silver, gold, crimson, wood = make_new_materials()
    build_fitted_underlayers(bpy.data.objects["ZhaoYun_Body"], navy)
    build_cape(white, gold)
    build_arm_layers(rig, navy, silver, gold)
    build_pauldrons_and_gauntlets(rig, navy, silver, gold)
    build_helmet(rig, silver, gold, crimson)
    build_waist_and_skirt(navy, white, silver, gold, crimson)
    build_legs(rig, navy, silver, gold)
    build_spear(wood, silver, gold, crimson)
    build_ground()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
