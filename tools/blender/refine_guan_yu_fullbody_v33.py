"""Refine Guan Yu v32 toward the established portrait silhouette and stance."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, look_at, mat, sphere, strand
from create_guan_yu_reference_bust import cloth_ribbon


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v32.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v33.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v33-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v33-three-quarter.png"
FACE = SRC / "guan-yu-reference-fullbody-v33-face.png"


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def move_shoe_parts(side_sign, delta):
    for name in (
        f"V29_Fitted_Han_Riding_Shoe_{side_sign}",
        f"V29_Riding_Shoe_Toe_Seam_{side_sign}",
        f"V29_Riding_Shoe_Instep_Strap_{side_sign}",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.location.x += delta[0]
            obj.location.y += delta[1]


def apply_weighted_stance():
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    targets = {
        "l": ((0.255, -0.055, 0.071), (0.067, -0.057)),
        "r": ((-0.245, 0.045, 0.071), (-0.057, 0.043)),
    }
    for side, (location, shoe_delta) in targets.items():
        target = bpy.data.objects.new(f"V33_Foot_Target_{side}", None)
        target.location = location
        target.hide_render = True
        target.empty_display_type = "SPHERE"
        target.empty_display_size = 0.026
        bpy.context.collection.objects.link(target)
        foot = rig.pose.bones[f"foot_{side}"]
        constraint = foot.constraints.new("IK")
        constraint.name = "V33 weighted combat stance"
        constraint.target = target
        constraint.chain_count = 2
        constraint.use_tail = False
        for bone in (foot, foot.parent, foot.parent.parent):
            bone.ik_stretch = 0.0
        move_shoe_parts(1 if side == "l" else -1, shoe_delta)

    boots = bpy.data.objects.get("Fullbody_Leather_Battle_Boots")
    if boots and boots.type == "MESH":
        for vertex in boots.data.vertices:
            if vertex.co.x > 0:
                vertex.co.x += 0.067
                vertex.co.y -= 0.057
            else:
                vertex.co.x -= 0.057
                vertex.co.y += 0.043
        boots.data.update()
    bpy.context.view_layer.update()


def add_greave(name, center_x, center_y, leather, gold):
    segments = 20
    sections = [
        (0.145, 0.074, 0.074),
        (0.205, 0.070, 0.068),
        (0.300, 0.066, 0.064),
        (0.385, 0.078, 0.070),
    ]
    verts = []
    for z, radius_x, radius_y in sections:
        for index in range(segments):
            angle = math.tau * index / segments
            verts.append(
                (
                    center_x + math.cos(angle) * radius_x,
                    center_y + math.sin(angle) * radius_y,
                    z,
                )
            )
    faces = []
    for row in range(len(sections) - 1):
        start = row * segments
        following = (row + 1) * segments
        for index in range(segments):
            nxt = (index + 1) % segments
            faces.append((start + index, start + nxt, following + nxt, following + index))
    faces.append(tuple(reversed(range(segments))))
    top = (len(sections) - 1) * segments
    faces.append(tuple(range(top, top + segments)))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    greave = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(greave)
    assign(greave, leather)
    bevel(greave, 0.006, 4)
    subdivision = greave.modifiers.new("Hand-shaped greave curvature", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    for label, z, radius in (("Top", 0.385, 0.0040), ("Ankle", 0.172, 0.0025)):
        strand(
            f"{name}_{label}_Gold_Binding",
            [
                (center_x - 0.068, center_y - 0.042, z),
                (center_x, center_y - 0.072, z + 0.003),
                (center_x + 0.068, center_y - 0.042, z),
            ],
            radius,
            gold,
            taper=False,
        )
    strand(
        f"{name}_Central_Ridge",
        [(center_x, center_y - 0.074, 0.180), (center_x, center_y - 0.070, 0.360)],
        0.0022,
        gold,
        taper=False,
    )


def add_fitted_greaves(leather, gold):
    remove_prefixes("V33_Fitted_Greave_")
    add_greave("V33_Fitted_Greave_Left", 0.189, -0.057, leather, gold)
    add_greave("V33_Fitted_Greave_Right", -0.179, -0.020, leather, gold)


def add_balancing_right_pauldron(black, gold):
    remove_prefixes("V33_Right_Pauldron_")
    rows = [
        [
            (0.165, -0.133, 1.492),
            (0.245, -0.157, 1.476),
            (0.325, -0.158, 1.440),
            (0.397, -0.132, 1.382),
        ],
        [
            (0.180, -0.138, 1.448),
            (0.260, -0.164, 1.430),
            (0.342, -0.162, 1.392),
            (0.420, -0.130, 1.337),
        ],
        [
            (0.195, -0.140, 1.405),
            (0.278, -0.166, 1.386),
            (0.360, -0.160, 1.350),
            (0.437, -0.126, 1.302),
        ],
    ]
    half_widths = [0.033, 0.044, 0.048, 0.035]
    for row, centers in enumerate(rows):
        panel = cloth_ribbon(
            f"V33_Right_Pauldron_Layer_{row}",
            centers,
            half_widths,
            black,
            thickness=0.011,
        )
        panel.modifiers["Soft cloth surface"].levels = 1
        panel.modifiers["Soft cloth surface"].render_levels = 1
        edge = strand(
            f"V33_Right_Pauldron_Gold_Edge_{row}",
            [(x, y - 0.012, z + 0.018) for x, y, z in centers],
            0.0025,
            gold,
            taper=False,
        )
        for spline in edge.data.splines:
            for point in spline.bezier_points:
                point.handle_left_type = "VECTOR"
                point.handle_right_type = "VECTOR"
        for index, point in enumerate(centers[1:]):
            x, y, z = point
            sphere(
                f"V33_Right_Pauldron_Rivet_{row}_{index}",
                (x, y - 0.015, z + 0.004),
                (0.0040, 0.0023, 0.0040),
                gold,
                16,
                8,
            )

    sphere(
        "V33_Right_Pauldron_Gold_Medallion",
        (0.300, -0.183, 1.438),
        (0.027, 0.006, 0.027),
        gold,
        28,
        14,
    )
    sphere(
        "V33_Right_Pauldron_Jade_Center",
        (0.300, -0.190, 1.438),
        (0.012, 0.003, 0.012),
        bpy.data.materials.get("Portrait dark jade inlay"),
        24,
        12,
    )


def flatten_and_fold_headcloth():
    headcloth = bpy.data.objects.get("Portrait_Fitted_Headcloth")
    if headcloth and headcloth.type == "MESH":
        for vertex in headcloth.data.vertices:
            co = vertex.co
            if co.z > 1.745:
                co.z = 1.745 + (co.z - 1.745) * 0.62
                co.z -= 0.0025 * min(abs(co.x) / 0.085, 1.0)
        headcloth.data.update()
    for obj in bpy.data.objects:
        if obj.type != "CURVE" or not obj.name.startswith("V32_Headcloth_Seam_"):
            continue
        for spline in obj.data.splines:
            for point in spline.bezier_points:
                if point.co.z > 1.745:
                    point.co.z = 1.745 + (point.co.z - 1.745) * 0.62


def simplify_inner_collar_and_dark_shaft():
    remove_prefixes("Portrait_Inner_Collar")
    pole = bpy.data.objects.get("Fullbody_Green_Dragon_Pole")
    if pole:
        ironwood = mat(
            "V33 black lacquered ironwood pole",
            (0.0045, 0.0022, 0.0012, 1),
            0.40,
            noise=15,
            bump=0.028,
        )
        assign(pole, ironwood)


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
    black = bpy.data.materials.get("Portrait blackened lamellar")
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    leather = bpy.data.materials.get("Portrait near-black oxblood leather")
    if not all((black, gold, leather)):
        raise RuntimeError("Required v32 armor materials are missing")

    apply_weighted_stance()
    add_fitted_greaves(leather, gold)
    add_balancing_right_pauldron(black, gold)
    flatten_and_fold_headcloth()
    simplify_inner_collar_and_dark_shaft()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.12
    camera = scene.camera

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FRONT, (1100, 1600), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72)
    render(
        scene,
        camera,
        THREE_QUARTER,
        (1100, 1600),
        (1.50, -6.18, 1.28),
        (-0.08, -0.02, 1.16),
        72,
    )
    render(scene, camera, FACE, (1000, 1000), (0.72, -2.28, 1.57), (0.0, -0.08, 1.48), 92)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"FACE={FACE}")


if __name__ == "__main__":
    main()
