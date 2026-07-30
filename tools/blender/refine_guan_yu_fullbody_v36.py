"""Guan Yu v36: combat stance, articulated lamellar and wind-swept lower robe."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_mpfb_v3 import lamella_plate
from create_guan_yu_realistic import assign, bevel, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v35.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v36.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v36-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v36-three-quarter.png"
WAIST = SRC / "guan-yu-reference-fullbody-v36-waist-detail.png"


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def move_named_objects(names, delta):
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj:
            obj.location.x += delta[0]
            obj.location.y += delta[1]


def apply_wider_combat_stance():
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    targets = {
        "l": ((0.315, -0.105, 0.071), (0.060, -0.050), 1, "Left"),
        "r": ((-0.305, 0.095, 0.071), (-0.060, 0.050), -1, "Right"),
    }
    for side, (location, delta, shoe_sign, greave_label) in targets.items():
        target = bpy.data.objects.get(f"V33_Foot_Target_{side}")
        if not target:
            raise RuntimeError(f"Missing foot target for {side}")
        target.location = location
        foot = rig.pose.bones[f"foot_{side}"]
        for bone in (foot, foot.parent, foot.parent.parent):
            bone.ik_stretch = 0.0

        move_named_objects(
            (
                f"V29_Fitted_Han_Riding_Shoe_{shoe_sign}",
                f"V29_Riding_Shoe_Toe_Seam_{shoe_sign}",
                f"V29_Riding_Shoe_Instep_Strap_{shoe_sign}",
            ),
            delta,
        )
        for obj in bpy.data.objects:
            if obj.name.startswith(f"V33_Fitted_Greave_{greave_label}"):
                obj.location.x += delta[0]
                obj.location.y += delta[1]

    # Static garment shells were cut from the posed body and need the same offsets.
    for name in ("Fullbody_Leather_Battle_Boots", "Fullbody_Dark_Split_Trousers", "Fullbody_Boot_Gold_Cuffs"):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "MESH":
            continue
        for vertex in obj.data.vertices:
            if vertex.co.x > 0:
                vertex.co.x += 0.060
                vertex.co.y -= 0.050
            else:
                vertex.co.x -= 0.060
                vertex.co.y += 0.050
        obj.data.update()
    bpy.context.view_layer.update()


def curved_y(x, radius=0.255):
    normalized = min(abs(x) / radius, 1.0)
    return -0.292 + 0.074 * normalized * normalized


def rebuild_dense_waist_lamellar(black, gold, crimson):
    remove_prefixes(
        "V30_Waist_Lamella_",
        "V30_Waist_Rivet_",
        "V30_Waist_Crimson_Lacing_",
        "V30_Waist_Upper_Gold_Binding",
        "V30_Waist_Lower_Gold_Binding",
        "V36_Waist_",
        "V36_Side_Tasset_",
    )

    for row in range(5):
        count = 10 if row % 2 == 0 else 9
        spacing = 0.050
        stagger = 0.0 if count == 10 else 0.025
        center_z = 0.958 - row * 0.052
        lace_points = []
        for column in range(count):
            x = (column - (count - 1) * 0.5) * spacing + (stagger if row % 2 else 0.0)
            y = curved_y(x) - row * 0.0015
            wrap_angle = -0.43 * math.atan2(x, 0.210)
            plate = lamella_plate(
                f"V36_Waist_Lamella_{row}_{column}",
                (x, y, center_z),
                0.056,
                0.061,
                0.0075,
                black,
                rotation_z=wrap_angle,
            )
            plate.rotation_euler.x = math.radians(-3.0 - row * 1.0)
            for rivet_side in (-1, 1):
                local_x = rivet_side * 0.0135
                rivet_x = x + local_x * math.cos(wrap_angle)
                rivet_y = y - 0.010 + local_x * math.sin(wrap_angle)
                sphere(
                    f"V36_Waist_Rivet_{row}_{column}_{rivet_side:+d}",
                    (rivet_x, rivet_y, center_z + 0.012),
                    (0.0028, 0.0017, 0.0028),
                    gold,
                    14,
                    7,
                )
            lace_points.append((x, y - 0.012, center_z + 0.012))
        strand(
            f"V36_Waist_Crimson_Lacing_{row}",
            lace_points,
            0.0017,
            crimson,
            taper=False,
        )

    binding_x = [-0.255 + index * 0.030 for index in range(18)]
    for label, z, radius in (("Upper", 0.992, 0.0037), ("Lower", 0.716, 0.0028)):
        strand(
            f"V36_Waist_{label}_Gold_Binding",
            [(x, curved_y(x) - 0.011, z) for x in binding_x],
            radius,
            gold,
            taper=False,
        )

    # Long articulated side tassets break the square apron silhouette.
    for side in (-1, 1):
        for row in range(5):
            x = side * (0.277 + row * 0.008)
            y = -0.225 + row * 0.008
            z = 0.910 - row * 0.069
            plate = lamella_plate(
                f"V36_Side_Tasset_{side:+d}_{row}",
                (x, y, z),
                0.074,
                0.079,
                0.008,
                black,
                rotation_z=-side * math.radians(6.0 + row * 1.5),
            )
            plate.rotation_euler.x = math.radians(-5.0)
            sphere(
                f"V36_Side_Tasset_Rivet_{side:+d}_{row}",
                (x, y - 0.011, z + 0.015),
                (0.0035, 0.0020, 0.0035),
                gold,
                14,
                7,
            )


def flowing_panel(name, centers, half_widths, material, thickness=0.009):
    centers = [Vector(center) for center in centers]
    verts = []
    left_edge = []
    right_edge = []
    for index, center in enumerate(centers):
        previous = centers[max(0, index - 1)]
        following = centers[min(len(centers) - 1, index + 1)]
        tangent = following - previous
        perpendicular = Vector((-tangent.z, 0.0, tangent.x))
        if perpendicular.length < 1e-6:
            perpendicular = Vector((1.0, 0.0, 0.0))
        perpendicular.normalize()
        left = center - perpendicular * half_widths[index]
        right = center + perpendicular * half_widths[index]
        left_edge.append(tuple(left))
        right_edge.append(tuple(right))
        verts.extend((tuple(left), tuple(right)))
    faces = [(index * 2, index * 2 + 1, index * 2 + 3, index * 2 + 2) for index in range(len(centers) - 1)]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdivision = obj.modifiers.new("Weighted cloth smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1
    solidify = obj.modifiers.new("Heavy silk thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    bevel(obj, 0.003, 3)
    return obj, left_edge, right_edge


def build_windswept_robe(green, shadow, gold):
    remove_prefixes("V36_Flowing_Robe_")
    main, left_edge, right_edge = flowing_panel(
        "V36_Flowing_Robe_Main",
        [
            (0.180, -0.238, 1.000),
            (0.235, -0.258, 0.875),
            (0.300, -0.268, 0.735),
            (0.365, -0.258, 0.595),
            (0.425, -0.225, 0.465),
            (0.475, -0.175, 0.375),
        ],
        [0.055, 0.072, 0.087, 0.092, 0.075, 0.006],
        green,
        0.010,
    )
    strand("V36_Flowing_Robe_Main_Gold_Edge", right_edge, 0.0030, gold, taper=False)
    for index, offset in enumerate((-0.030, 0.018, 0.055)):
        strand(
            f"V36_Flowing_Robe_Fold_{index}",
            [
                (0.195 + offset, -0.274, 0.950),
                (0.250 + offset, -0.286, 0.790),
                (0.335 + offset, -0.278, 0.610),
                (0.430 + offset, -0.235, 0.450),
            ],
            0.0018 if index != 1 else 0.0022,
            shadow,
            taper=True,
        )

    under, _left, under_right = flowing_panel(
        "V36_Flowing_Robe_Shadow_Layer",
        [
            (0.125, -0.218, 0.980),
            (0.165, -0.225, 0.840),
            (0.220, -0.215, 0.690),
            (0.285, -0.180, 0.550),
            (0.355, -0.120, 0.430),
        ],
        [0.040, 0.052, 0.062, 0.057, 0.005],
        shadow,
        0.008,
    )
    strand("V36_Flowing_Robe_Shadow_Gold_Edge", under_right, 0.0023, gold, taper=False)

    robe = bpy.data.objects.get("Fullbody_Layered_Green_Battle_Robe")
    if robe and robe.type == "MESH":
        for vertex in robe.data.vertices:
            co = vertex.co
            if co.z < 0.58:
                weight = min(1.0, max(0.0, (0.58 - co.z) / 0.28))
                co.x += 0.018 * weight
                co.y += 0.010 * math.sin((co.x + 0.36) * 9.0) * weight
            if co.z < 0.39:
                angle = math.atan2(co.y, co.x)
                co.z += 0.007 * math.sin(angle * 5.0 + 0.7)
        robe.data.update()


def refine_boots_and_blade():
    for side in (-1, 1):
        shoe = bpy.data.objects.get(f"V29_Fitted_Han_Riding_Shoe_{side}")
        if shoe and shoe.type == "MESH":
            center_x = side * 0.122
            for vertex in shoe.data.vertices:
                vertex.co.x = center_x + (vertex.co.x - center_x) * 0.96
                vertex.co.y = -0.090 + (vertex.co.y + 0.090) * 0.96
                vertex.co.z *= 0.96
            shoe.data.update()

    steel = mat(
        "V36 folded dark weapon steel",
        (0.055, 0.065, 0.070, 1),
        0.22,
        0.92,
        noise=48,
        bump=0.030,
    )
    blade = bpy.data.objects.get("V29_Green_Dragon_Crescent_Blade")
    if blade:
        assign(blade, steel)


def render(scene, camera, path, resolution, location, target, lens):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    apply_wider_combat_stance()

    black = bpy.data.materials.get("V35 battle-worn blackened iron")
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    crimson = bpy.data.materials.get("Portrait deep crimson")
    green = bpy.data.materials.get("Portrait emerald silk")
    shadow = bpy.data.materials.get("Portrait shadow green")
    if not all((black, gold, crimson, green, shadow)):
        raise RuntimeError("Required v35 costume materials are missing")

    rebuild_dense_waist_lamellar(black, gold, crimson)
    build_windswept_robe(green, shadow, gold)
    refine_boots_and_blade()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.38
    camera = scene.camera

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72)
    render(scene, camera, THREE_QUARTER, (1100, 1600), (1.58, -6.10, 1.28), (0.0, -0.01, 1.12), 72)
    render(scene, camera, WAIST, (1200, 1000), (0.60, -3.35, 1.05), (0.10, -0.10, 0.78), 88)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"WAIST={WAIST}")


if __name__ == "__main__":
    main()
