"""Refine Guan Yu v29 with a stable polearm grip and articulated lower costume."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_mpfb_v3 import lamella_plate
from create_guan_yu_realistic import assign, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v29.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v30.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v30-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v30-three-quarter.png"


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def poly_strand(name, points, radius, material, taper=False):
    """Create a stable non-overshooting garment seam from exact control points."""
    curve_data = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 1
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 3
    curve_data.resolution_u = 2
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for index, point in enumerate(points):
        spline.points[index].co = (*point, 1.0)
        if taper:
            normalized = index / max(len(points) - 1, 1)
            spline.points[index].radius = 1.0 - 0.38 * normalized
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def lock_natural_weapon_grip():
    """Use the tested wrist solution that preserves the sleeve/forearm junction."""
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    hand = rig.pose.bones["hand_r"]
    target = bpy.data.objects["Portrait_Hand_Target_r"]
    constraint = next(item for item in hand.constraints if item.type == "IK")

    # Capture the already-good wrist orientation before asking IK to respect it.
    current_world_rotation = (rig.matrix_world @ hand.matrix).to_quaternion()
    target.rotation_mode = "QUATERNION"
    target.rotation_quaternion = current_world_rotation
    constraint.use_rotation = True

    curls = {
        "index": (-72, -76, -70),
        "middle": (-74, -78, -72),
        "ring": (-72, -76, -70),
        "pinky": (-68, -72, -66),
    }
    for finger, angles in curls.items():
        for joint, degrees in enumerate(angles, 1):
            bone = rig.pose.bones.get(f"{finger}_{joint:02}_r")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(degrees)
    for joint, degrees in enumerate((-39, -34, -29), 1):
        bone = rig.pose.bones.get(f"thumb_{joint:02}_r")
        if bone:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.x = math.radians(degrees)
    bpy.context.view_layer.update()


def curved_y(x, radius=0.245):
    normalized = min(abs(x) / radius, 1.0)
    return -0.292 + 0.070 * normalized * normalized


def rebuild_curved_waist_lamellar(black, gold, crimson):
    """Replace the flat grid with overlapping plates that wrap around the waist."""
    remove_prefixes(
        "Fullbody_Waist_Lamella_",
        "Fullbody_Waist_Rivet_",
        "Fullbody_Waist_Crimson_Lacing_",
        "V30_Waist_",
    )

    for row in range(4):
        count = 8 if row % 2 == 0 else 7
        spacing = 0.062
        row_offset = 0.012 if row % 2 else -0.006
        center_z = 0.948 - row * 0.064
        lace_points = []
        for column in range(count):
            x = (column - (count - 1) * 0.5) * spacing + row_offset
            y = curved_y(x) - row * 0.002
            wrap_angle = -0.50 * math.atan2(x, 0.205)
            plate = lamella_plate(
                f"V30_Waist_Lamella_{row}_{column}",
                (x, y, center_z),
                0.067,
                0.075,
                0.009,
                black,
                rotation_z=wrap_angle,
            )
            plate.rotation_euler.x = math.radians(-2.5 - row * 1.3)

            # Two warm metal rivets per plate; their offsets follow the wrap.
            for rivet_side in (-1, 1):
                local_x = rivet_side * 0.017
                rivet_x = x + local_x * math.cos(wrap_angle)
                rivet_y = y - 0.011 + local_x * math.sin(wrap_angle)
                sphere(
                    f"V30_Waist_Rivet_{row}_{column}_{rivet_side:+d}",
                    (rivet_x, rivet_y, center_z + 0.014),
                    (0.0042, 0.0025, 0.0042),
                    gold,
                    16,
                    8,
                )
            lace_points.append((x, y - 0.014, center_z + 0.016))

        strand(
            f"V30_Waist_Crimson_Lacing_{row}",
            lace_points,
            0.0021,
            crimson,
            taper=False,
        )

    # Curved bindings visually separate the belt and hanging tassets.
    binding_x = [-0.245 + index * 0.035 for index in range(15)]
    for suffix, z in (("Upper", 0.986), ("Lower", 0.702)):
        strand(
            f"V30_Waist_{suffix}_Gold_Binding",
            [(x, curved_y(x) - 0.012, z) for x in binding_x],
            0.0042 if suffix == "Upper" else 0.0030,
            gold,
            taper=False,
        )


def reshape_lower_robe(gold, shadow, crimson):
    robe = bpy.data.objects.get("Fullbody_Layered_Green_Battle_Robe")
    if robe and robe.type == "MESH":
        for vertex in robe.data.vertices:
            co = vertex.co
            if co.z < 0.53:
                weight = min((0.53 - co.z) / 0.25, 1.0)
                co.x *= 1.0 + 0.055 * weight * min(abs(co.x) / 0.35, 1.0)
            if co.z < 0.39:
                angle = math.atan2(co.y, co.x)
                # A tiny irregular hem reads as fabric weight rather than a rigid cone.
                co.z += 0.009 * math.sin(angle * 3.0 + 0.55)
        robe.data.update()

    # Side openings expose a darker inner layer and give the legs room to move.
    for side in (-1, 1):
        x_top = side * 0.300
        x_bottom = side * 0.355
        poly_strand(
            f"V30_Robe_Side_Slit_Shadow_{side:+d}",
            [(x_top, -0.058, 0.706), (side * 0.327, -0.071, 0.515), (x_bottom, -0.080, 0.330)],
            0.010,
            shadow,
            taper=True,
        )
        poly_strand(
            f"V30_Robe_Side_Slit_Gold_Edge_{side:+d}",
            [(x_top, -0.071, 0.710), (side * 0.327, -0.084, 0.515), (x_bottom, -0.093, 0.326)],
            0.0027,
            gold,
            taper=False,
        )
        poly_strand(
            f"V30_Robe_Slit_Crimson_Tack_{side:+d}",
            [(x_top - side * 0.014, -0.077, 0.690), (x_top + side * 0.014, -0.077, 0.690)],
            0.0020,
            crimson,
            taper=False,
        )

    # Add a few non-uniform shadow folds so the fabric no longer reads as radial geometry.
    folds = [
        (-0.276, -0.255, -0.302),
        (-0.112, -0.132, -0.154),
        (0.045, 0.068, 0.082),
        (0.204, 0.234, 0.286),
    ]
    for index, (top_x, mid_x, bottom_x) in enumerate(folds):
        poly_strand(
            f"V30_Robe_Weighted_Fold_{index}",
            [(top_x, -0.277, 0.916), (mid_x, -0.287, 0.605), (bottom_x, -0.273, 0.340)],
            0.0021 if index in (0, 3) else 0.0017,
            shadow,
            taper=True,
        )


def improve_costume_materials():
    """Add restrained wear so large costume regions do not look uniformly plastic."""
    leather = bpy.data.materials.get("Portrait near-black oxblood leather")
    if leather and leather.use_nodes:
        shader = next((node for node in leather.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.46


def refine_footwear_and_remove_floating_ornament():
    # Earlier procedural cloud strokes read as loose wire from a distance.
    remove_prefixes("Fullbody_Robe_Cloud_Embroidery_", "Portrait_Robe_Cloud_Embroidery_")

    for obj in bpy.data.objects:
        if obj.name.startswith("V29_Fitted_Han_Riding_Shoe_") and obj.type == "MESH":
            side = 1 if obj.name.endswith("_1") else -1
            center_x = side * 0.122
            for vertex in obj.data.vertices:
                vertex.co.x = center_x + (vertex.co.x - center_x) * 0.91
                vertex.co.y = -0.09 + (vertex.co.y + 0.09) * 0.93
                vertex.co.z *= 0.96
            obj.data.update()

        if obj.type == "CURVE" and (
            obj.name.startswith("V29_Riding_Shoe_Toe_Seam_")
            or obj.name.startswith("V29_Riding_Shoe_Instep_Strap_")
        ):
            side = 1 if obj.name.endswith("_1") else -1
            center_x = side * 0.122
            for spline in obj.data.splines:
                points = spline.bezier_points if spline.type == "BEZIER" else spline.points
                for point in points:
                    point.co.x = center_x + (point.co.x - center_x) * 0.91
                    point.co.y = -0.09 + (point.co.y + 0.09) * 0.93
                    point.co.z *= 0.96


def render(scene, camera, path, location, target):
    camera.location = location
    camera.data.lens = 72
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))

    lock_natural_weapon_grip()
    improve_costume_materials()
    refine_footwear_and_remove_floating_ornament()

    black = bpy.data.materials.get("Portrait blackened lamellar")
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    crimson = bpy.data.materials.get("Portrait deep crimson")
    shadow = bpy.data.materials.get("Portrait shadow green")
    if not all((black, gold, crimson, shadow)):
        raise RuntimeError("Required costume materials are missing")

    rebuild_curved_waist_lamellar(black, gold, crimson)
    reshape_lower_robe(gold, shadow, crimson)

    # Less uniform roughness and micro-scratching on the newly dominant armor region.
    worn_black = mat(
        "V30 worn blackened waist lamellar",
        (0.012, 0.016, 0.015, 1),
        0.38,
        0.78,
        noise=22,
        bump=0.070,
    )
    for obj in bpy.data.objects:
        if obj.name.startswith("V30_Waist_Lamella_"):
            assign(obj, worn_black)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.14
    camera = scene.camera

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FRONT, (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16))
    render(scene, camera, THREE_QUARTER, (1.50, -6.18, 1.28), (-0.08, -0.02, 1.16))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
