"""Complete the v27 Guan Yu portrait look-dev as a coherent full-body character.

The v27 file remains untouched.  This pass removes bust-only artifacts, adds a
layered Han-inspired battle robe, lamellar waist defenses, boots, bracers and a
complete Green Dragon Crescent Blade, then saves and renders a v28 review file.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_mpfb_v3 import body_shell, lamella_plate
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
INPUT_BLEND = SRC / "guan-yu-reference-bust-v27.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v28.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v28-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v28-three-quarter.png"


def existing_or_material(name, color, roughness=0.5, metallic=0.0, noise=0.0, bump=0.0):
    return bpy.data.materials.get(name) or mat(name, color, roughness, metallic, noise, bump)


def remove_object(obj):
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)


def clean_bust_artifacts():
    for name in (
        "Cylinder",
        "Portrait_Leather_Belt",
        "Portrait_Lion_Belt_Buckle",
    ):
        remove_object(bpy.data.objects.get(name))
    for obj in list(bpy.data.objects):
        if obj.name.startswith("Fullbody_") or obj.name.startswith("V28_"):
            remove_object(obj)


def pose_weapon_stance(rig):
    """Keep the proven bust arm pose, adding only a relaxed finger curl."""
    for finger in ("index", "middle", "ring", "pinky"):
        for joint in (1, 2, 3):
            bone = rig.pose.bones.get(f"{finger}_{joint:02}_r")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(-50)
    for joint in (1, 2, 3):
        bone = rig.pose.bones.get(f"thumb_{joint:02}_r")
        if bone:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.x = math.radians(-26)
    bpy.context.view_layer.update()


def trim_bust_sleeve_hands():
    """End the original robe shell at the wrist and reveal the textured hand."""
    robe = bpy.data.objects.get("Portrait_Deep_Green_Robe")
    if not robe or robe.type != "MESH":
        return
    mesh = robe.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    rejected = [vert for vert in bm.verts if vert.co.z < 1.035 and abs(vert.co.x) > 0.225]
    bmesh.ops.delete(bm, geom=rejected, context="VERTS")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def ellipse_shell(name, rings, material, segments=96, thickness=0.010):
    """Make a softly folded elliptical robe shell from z/radius rings."""
    verts = []
    ring_count = len(rings)
    for ring_index, (z, radius_x, radius_y) in enumerate(rings):
        progress = ring_index / max(1, ring_count - 1)
        for index in range(segments):
            angle = math.tau * index / segments
            fold = 1.0 + progress * (
                0.030 * math.sin(angle * 8.0 + 0.35) + 0.014 * math.sin(angle * 15.0)
            )
            x = radius_x * math.sin(angle) * fold
            y = -radius_y * math.cos(angle) * fold + 0.010 * progress
            verts.append((x, y, z))
    faces = []
    for ring_index in range(ring_count - 1):
        row = ring_index * segments
        next_row = (ring_index + 1) * segments
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((row + index, row + following, next_row + following, next_row + index))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    solidify = obj.modifiers.new("Woven robe thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    bevel(obj, 0.004, 3)
    return obj


def ellipse_band(name, z_top, z_bottom, radius_x, radius_y, material, segments=96):
    verts = []
    for z in (z_top, z_bottom):
        for index in range(segments):
            angle = math.tau * index / segments
            verts.append((radius_x * math.sin(angle), -radius_y * math.cos(angle), z))
    faces = []
    for index in range(segments):
        following = (index + 1) % segments
        faces.append((index, following, segments + following, segments + index))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    solidify = obj.modifiers.new("Belt thickness", "SOLIDIFY")
    solidify.thickness = 0.016
    solidify.offset = 0.0
    bevel(obj, 0.006, 3)
    return obj


def ellipse_curve(name, z, radius_x, radius_y, material, radius=0.0035, y_offset=0.0):
    points = []
    for index in range(73):
        angle = math.tau * index / 72
        points.append((radius_x * math.sin(angle), -radius_y * math.cos(angle) + y_offset, z))
    return strand(name, points, radius, material, taper=False)


def extruded_relief(name, outline, y, depth, material, bevel_width=0.004):
    count = len(outline)
    verts = [(x, y - depth, z) for x, z in outline] + [(x, y + depth, z) for x, z in outline]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    bevel(obj, bevel_width, 3)
    return obj


def add_belt(gold, jade, leather):
    ellipse_band("Fullbody_Curved_Leather_Belt", 1.075, 0.985, 0.286, 0.177, leather)
    ellipse_curve("Fullbody_Belt_Top_Gold_Piping", 1.071, 0.286, 0.185, gold, 0.0030)
    ellipse_curve("Fullbody_Belt_Bottom_Gold_Piping", 0.991, 0.286, 0.185, gold, 0.0030)
    buckle_outline = [
        (-0.060, 1.055),
        (-0.040, 1.080),
        (0.000, 1.090),
        (0.040, 1.080),
        (0.060, 1.055),
        (0.050, 1.010),
        (0.000, 0.992),
        (-0.050, 1.010),
    ]
    extruded_relief("Fullbody_Dragon_Belt_Buckle", buckle_outline, -0.198, 0.012, gold, 0.006)
    extruded_relief(
        "Fullbody_Buckle_Jade",
        [(0.0, 1.071), (0.026, 1.042), (0.0, 1.008), (-0.026, 1.042)],
        -0.212,
        0.006,
        jade,
        0.003,
    )
    for side in (-1, 1):
        sphere(
            f"Fullbody_Belt_Rivet_{side}",
            (side * 0.093, -0.201, 1.035),
            (0.010, 0.004, 0.010),
            gold,
            24,
            12,
        )


def add_lower_robe(green, green_shadow, gold):
    ellipse_shell(
        "Fullbody_Layered_Green_Battle_Robe",
        [
            (1.025, 0.235, 0.155),
            (0.88, 0.270, 0.175),
            (0.67, 0.302, 0.195),
            (0.46, 0.333, 0.212),
            (0.315, 0.345, 0.222),
        ],
        green,
    )
    # A dark inner gusset and two asymmetric crossed front panels keep the robe
    # from reading as a rigid cone while retaining a ceremonial Guan Yu silhouette.
    tapered_panel("Fullbody_Robe_Dark_Inner_Gusset", 0.995, 0.325, 0.145, 0.185, -0.229, 0.008, green_shadow)
    tapered_panel(
        "Fullbody_Robe_Front_Left",
        1.005,
        0.335,
        0.115,
        0.155,
        -0.242,
        0.007,
        green_shadow,
        -0.095,
    )
    tapered_panel(
        "Fullbody_Robe_Front_Right",
        1.005,
        0.335,
        0.115,
        0.155,
        -0.247,
        0.007,
        green,
        0.095,
    )
    for side in (-1, 1):
        x_top = side * 0.205
        x_bottom = side * 0.250
        strand(
            f"Fullbody_Robe_Gold_Front_Edge_{side}",
            [(x_top, -0.254, 0.995), (side * 0.225, -0.258, 0.67), (x_bottom, -0.258, 0.340)],
            0.0035,
            gold,
            taper=False,
        )
        # Restrained cloud-scroll embroidery, mirrored but not perfectly identical.
        strand(
            f"Fullbody_Robe_Cloud_Embroidery_{side}",
            [
                (side * 0.145, -0.260, 0.70),
                (side * 0.205, -0.266, 0.675),
                (side * 0.235, -0.262, 0.625),
                (side * 0.190, -0.266, 0.595),
                (side * 0.135, -0.263, 0.615),
            ],
            0.0024,
            gold,
            taper=False,
        )
    ellipse_curve("Fullbody_Robe_Gold_Hem", 0.322, 0.344, 0.230, gold, 0.0040)


def add_waist_lamellar(dark_metal, gold, red):
    # Compact, curved tassets protect the waist without obscuring the long robe.
    for row in range(3):
        columns = 7 if row != 1 else 8
        z = 0.965 - row * 0.073
        for column in range(columns):
            x = (column - (columns - 1) / 2) * 0.073
            y = -0.284 + 0.025 * (x / 0.255) ** 2
            plate = lamella_plate(
                f"Fullbody_Waist_Lamella_{row}_{column}",
                (x, y, z),
                0.067,
                0.076,
                0.006,
                dark_metal,
                rotation_z=-x * 0.36,
            )
            for rivet_side in (-1, 1):
                sphere(
                    f"Fullbody_Waist_Rivet_{row}_{column}_{rivet_side}",
                    (x + rivet_side * 0.018, plate.location.y - 0.010, z + 0.015),
                    (0.0035, 0.0020, 0.0035),
                    gold,
                    14,
                    8,
                )
        strand(
            f"Fullbody_Waist_Crimson_Lacing_{row}",
            [(-0.255, -0.267, z + 0.012), (0.0, -0.297, z + 0.008), (0.255, -0.267, z + 0.012)],
            0.0026,
            red,
            taper=False,
        )
    for side in (-1, 1):
        for layer in range(3):
            angle = math.radians(46 + layer * 16)
            x = side * 0.275 * math.sin(angle)
            y = -0.178 * math.cos(angle)
            lamella_plate(
                f"Fullbody_Side_Tasset_{side}_{layer}",
                (x, y, 0.900 - layer * 0.055),
                0.076,
                0.086,
                0.007,
                dark_metal,
                rotation_z=-side * angle,
            )


def add_legwear(body, green_shadow, leather, gold):
    body_shell(
        body,
        "Fullbody_Dark_Split_Trousers",
        lambda co: 0.16 < co.z < 0.94 and abs(co.x) < 0.31,
        green_shadow,
        0.014,
    )
    boots = body_shell(
        body,
        "Fullbody_Leather_Battle_Boots",
        lambda co: co.z < 0.355 and abs(co.x) < 0.31,
        leather,
        0.026,
    )
    boot_smooth = boots.modifiers.new("Hand-shaped leather boot smoothing", "SMOOTH")
    boot_smooth.factor = 0.62
    boot_smooth.iterations = 5
    body_shell(
        body,
        "Fullbody_Boot_Gold_Cuffs",
        lambda co: 0.325 < co.z < 0.365 and abs(co.x) < 0.27,
        gold,
        0.030,
    )
def add_riding_shoe(side, leather, gold):
    """Build a low Han riding shoe with an upturned toe and sloped instep."""
    center_x = side * 0.122
    sections = [
        (-0.238, 0.080, 0.018, 0.092),
        (-0.195, 0.104, 0.014, 0.118),
        (-0.105, 0.112, 0.014, 0.132),
        (-0.020, 0.098, 0.018, 0.185),
        (0.070, 0.078, 0.022, 0.168),
    ]
    verts = []
    for y, half_width, bottom, top in sections:
        verts.extend(
            [
                (center_x - half_width, y, bottom),
                (center_x + half_width, y, bottom),
                (center_x + half_width, y, top),
                (center_x - half_width, y, top),
            ]
        )
    faces = [(0, 1, 2, 3), (16, 19, 18, 17)]
    for index in range(len(sections) - 1):
        a = index * 4
        b = (index + 1) * 4
        faces.extend(
            [
                (a, b, b + 1, a + 1),
                (a + 1, b + 1, b + 2, a + 2),
                (a + 2, b + 2, b + 3, a + 3),
                (a + 3, b + 3, b, a),
            ]
        )
    mesh = bpy.data.meshes.new(f"Fullbody_Han_Riding_Shoe_{side}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    shoe = bpy.data.objects.new(f"Fullbody_Han_Riding_Shoe_{side}", mesh)
    bpy.context.collection.objects.link(shoe)
    assign(shoe, leather)
    bevel(shoe, 0.014, 4)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    strand(
        f"Fullbody_Han_Riding_Shoe_Toe_Seam_{side}",
        [
            (center_x - 0.062, -0.246, 0.091),
            (center_x, -0.251, 0.100),
            (center_x + 0.062, -0.246, 0.091),
        ],
        0.0022,
        gold,
        taper=False,
    )


def add_bracers(body, leather, gold):
    body_shell(
        body,
        "Fullbody_Fitted_Leather_Bracers",
        lambda co: 1.035 < co.z < 1.235 and abs(co.x) > 0.255,
        leather,
        0.020,
    )
    body_shell(
        body,
        "Fullbody_Bracer_Gold_Edges",
        lambda co: ((1.040 < co.z < 1.065) or (1.205 < co.z < 1.230)) and abs(co.x) > 0.260,
        gold,
        0.024,
    )


def pole_x(z):
    # The planted weapon stands beside the relaxed screen-left hand.
    return -0.300 - 0.070 * z


def blade_mesh(name, outline, y, depth, material):
    count = len(outline)
    verts = [(x, y - depth, z) for x, z in outline] + [(x, y + depth, z) for x, z in outline]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((index, (index + 1) % count, count + (index + 1) % count, count + index) for index in range(count))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    bevel(obj, 0.006, 3)
    return obj


def add_green_dragon_blade(wood, leather, steel, polished, gold, jade, red):
    pole_y = -0.200
    start = (pole_x(0.055), pole_y, 0.055)
    end = (pole_x(1.990), pole_y, 1.990)
    cylinder_between("Fullbody_Green_Dragon_Pole", start, end, 0.019, wood, 56)
    direction = Vector(end) - Vector(start)
    pole_rotation = Vector((0, 0, 1)).rotation_difference(direction.normalized())

    for grip_index, grip_z in enumerate((0.96, 1.22)):
        for wrap_index in range(5):
            z = grip_z - 0.024 + wrap_index * 0.012
            bpy.ops.mesh.primitive_torus_add(
                major_radius=0.0225,
                minor_radius=0.0027,
                major_segments=40,
                minor_segments=10,
                location=(pole_x(z), pole_y, z),
            )
            grip = bpy.context.object
            grip.name = f"Fullbody_Crimson_Pole_Grip_{grip_index}_{wrap_index}"
            grip.rotation_mode = "QUATERNION"
            grip.rotation_quaternion = pole_rotation
            assign(grip, red)

    outline = [
        (pole_x(1.77) - 0.002, 1.770),
        (pole_x(1.84) + 0.030, 1.840),
        (pole_x(2.14) + 0.025, 2.140),
        (pole_x(2.250) - 0.045, 2.250),
        (pole_x(2.225) - 0.120, 2.225),
        (pole_x(2.130) - 0.205, 2.130),
        (pole_x(2.000) - 0.235, 2.000),
        (pole_x(1.885) - 0.190, 1.885),
        (pole_x(1.800) - 0.100, 1.800),
    ]
    blade_mesh("Fullbody_Green_Dragon_Crescent_Blade", outline, pole_y, 0.016, steel)
    # Bright cutting edge and a restrained gold dragon inlay make the head read
    # as forged weaponry rather than a flat procedural cutout.
    cutting_edge = [outline[index] for index in (3, 4, 5, 6, 7, 8)]
    strand(
        "Fullbody_Crescent_Polished_Edge",
        [(x, pole_y - 0.020, z) for x, z in cutting_edge],
        0.0050,
        polished,
        taper=False,
    )
    dragon_points = [
        (pole_x(1.91) - 0.055, pole_y - 0.020, 1.91),
        (pole_x(2.02) - 0.145, pole_y - 0.021, 2.03),
        (pole_x(2.14) - 0.135, pole_y - 0.021, 2.13),
        (pole_x(2.22) - 0.075, pole_y - 0.021, 2.23),
    ]
    strand("Fullbody_Blade_Dragon_Inlay", dragon_points, 0.0040, gold, taper=False)
    sphere(
        "Fullbody_Blade_Dragon_Eye",
        (dragon_points[-1][0] - 0.008, dragon_points[-1][1] - 0.004, dragon_points[-1][2] + 0.006),
        (0.009, 0.003, 0.009),
        jade,
        24,
        12,
    )
    collar_z = 1.790
    sphere(
        "Fullbody_Blade_Dragon_Collar",
        (pole_x(collar_z), pole_y, collar_z),
        (0.052, 0.043, 0.062),
        gold,
        48,
        24,
    )
    sphere(
        "Fullbody_Blade_Collar_Jade",
        (pole_x(collar_z) - 0.020, pole_y - 0.043, collar_z + 0.012),
        (0.011, 0.004, 0.011),
        jade,
        24,
        12,
    )
    for index, lateral in enumerate((-0.035, 0.0, 0.035)):
        strand(
            f"Fullbody_Blade_Red_Tassel_{index}",
            [
                (pole_x(1.79) + lateral * 0.3, pole_y - 0.010, 1.79),
                (pole_x(1.69) + lateral, pole_y - 0.025, 1.68),
                (pole_x(1.57) + lateral * 1.5, pole_y - 0.015, 1.55),
            ],
            0.0055,
            red,
        )
    cone_between(
        "Fullbody_Pole_Butt_Spike",
        (pole_x(0.065), pole_y, 0.065),
        (pole_x(-0.035), pole_y, -0.035),
        0.025,
        0.002,
        gold,
        40,
    )


def setup_stage():
    for obj in list(bpy.data.objects):
        if obj.type == "LIGHT" or obj.name == "Full_Body_Inspection_Floor":
            remove_object(obj)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0.20, -0.040))
    floor = bpy.context.object
    floor.name = "V28_Charcoal_Studio_Floor"
    floor_material = existing_or_material(
        "V28 dark charcoal floor", (0.007, 0.006, 0.004, 1), 0.74, noise=18, bump=0.08
    )
    assign(floor, floor_material)

    for name, location, energy, color, size, target in [
        ("V28_Warm_Key", (-2.7, -3.8, 3.6), 980, (1.0, 0.69, 0.50), 2.8, (-0.05, 0, 1.20)),
        ("V28_Cool_Fill", (2.8, -2.6, 2.4), 390, (0.31, 0.44, 0.70), 3.1, (0.0, 0, 1.10)),
        ("V28_Gold_Rim", (0.6, 2.8, 3.2), 1200, (1.0, 0.36, 0.14), 2.3, (-0.05, 0, 1.25)),
        ("V28_Lower_Fill", (-1.8, -2.0, 0.55), 230, (0.62, 0.43, 0.28), 2.0, (0.0, 0, 0.50)),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, target)

    camera = bpy.context.scene.camera
    if camera is None:
        bpy.ops.object.camera_add()
        camera = bpy.context.object
        bpy.context.scene.camera = camera
    camera.name = "V28_Fullbody_Camera"
    camera.data.lens = 72
    camera.data.dof.use_dof = False
    return camera


def render(scene, camera, path, location, target, lens=72):
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]

    clean_bust_artifacts()
    pose_weapon_stance(rig)
    trim_bust_sleeve_hands()

    green = existing_or_material("Portrait emerald silk", (0.004, 0.058, 0.018, 1), 0.60, noise=38, bump=0.065)
    green_shadow = existing_or_material(
        "Portrait shadow green", (0.002, 0.019, 0.006, 1), 0.68, noise=42, bump=0.070
    )
    gold = existing_or_material(
        "Portrait aged imperial gold", (0.115, 0.045, 0.005, 1), 0.30, 0.90, noise=18, bump=0.075
    )
    jade = existing_or_material("Portrait dark jade inlay", (0.003, 0.070, 0.038, 1), 0.24, 0.15, noise=36, bump=0.05)
    dark_metal = existing_or_material(
        "Portrait blackened lamellar", (0.008, 0.010, 0.009, 1), 0.42, 0.80, noise=24, bump=0.080
    )
    leather = existing_or_material(
        "Portrait near-black oxblood leather", (0.018, 0.003, 0.002, 1), 0.58, noise=30, bump=0.075
    )
    red = existing_or_material("Portrait deep crimson", (0.30, 0.006, 0.003, 1), 0.48, noise=36, bump=0.12)
    wood = existing_or_material("V28 dark jujube wood", (0.070, 0.012, 0.004, 1), 0.42, noise=15, bump=0.10)
    steel = existing_or_material("V28 folded forged steel", (0.035, 0.045, 0.052, 1), 0.34, 0.88, noise=9, bump=0.06)
    polished = existing_or_material("V28 polished blade edge", (0.52, 0.60, 0.64, 1), 0.11, 0.98, noise=5, bump=0.02)

    add_lower_robe(green, green_shadow, gold)
    add_legwear(body, green_shadow, leather, gold)
    add_bracers(body, leather, gold)
    add_belt(gold, jade, leather)
    add_waist_lamellar(dark_metal, gold, red)
    add_green_dragon_blade(wood, leather, steel, polished, gold, jade, red)
    camera = setup_stage()

    scene = bpy.context.scene
    if scene.world is None:
        scene.world = bpy.data.worlds.new("V28 Studio World")
    scene.world.color = (0.0025, 0.0020, 0.0015)
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.exposure = -0.18
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        scene.view_settings.look = "Medium High Contrast"

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FRONT, (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72)
    render(scene, camera, THREE_QUARTER, (1.50, -6.18, 1.28), (-0.08, -0.02, 1.16), 72)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
