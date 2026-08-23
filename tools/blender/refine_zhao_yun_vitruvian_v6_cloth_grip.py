"""Refine Zhao Yun v5 with a true spear grip and pleated silk garments."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v5-arsenal.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v6-cloth-grip.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def refine_weapon_hand_pose(rig):
    target = bpy.data.objects["ZhaoYun_Right_Hand_Spear"]
    # Bring the palm onto the actual shaft axis. The original wrist target sat
    # in front/right of the pole, which read as a hand hovering beside it.
    target.location.x -= 0.055
    target.location.y += 0.085
    bpy.context.view_layer.update()

    curls = {
        "r": ((-72.0, -112.0, -88.0), (-38.0, -72.0, -55.0)),
        "l": ((-82.0, -116.0, -94.0), (-44.0, -76.0, -58.0)),
    }
    for side, (finger_curl, thumb_curl) in curls.items():
        for finger in ("index", "middle", "ring", "pinky"):
            for joint, angle in enumerate(finger_curl, start=1):
                bone = rig.pose.bones.get(f"{finger}_{joint:02}_{side}")
                if bone:
                    bone.rotation_mode = "XYZ"
                    bone.rotation_euler.x = math.radians(angle)
        for joint, angle in enumerate(thumb_curl, start=1):
            bone = rig.pose.bones.get(f"thumb_{joint:02}_{side}")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(angle)
    bpy.context.view_layer.update()


def rebuild_fitted_arms_and_gloves(rig, navy, leather, silver, gold):
    hide_prefixes(
        (
            "ZhaoYun_V4_Fitted_Arm_Underlayer_",
            "ZhaoYun_V4_Vambrace_",
            "ZhaoYun_V4_Elbow_Guard_",
            "ZhaoYun_V4_Leather_Glove_",
            "ZhaoYun_V4_Glove_",
            "ZhaoYun_V5_Upperarm_Binding_",
        )
    )
    body = bpy.data.objects["ZhaoYun_Body"]
    for side in ("l", "r"):
        v4.body_surface_shell(
            f"ZhaoYun_V6_Fitted_Arm_Underlayer_{side}",
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
            offset=0.0075,
        )
        hand_groups = [f"hand_{side}"]
        hand_groups.extend(
            f"{finger}_{joint:02}_{side}"
            for finger in ("index", "middle", "ring", "pinky", "thumb")
            for joint in (1, 2, 3)
        )
        v4.body_surface_shell(
            f"ZhaoYun_V6_Fitted_Leather_Glove_{side}",
            body,
            hand_groups,
            leather,
            threshold=0.075,
            offset=0.009,
        )

    # Regenerate posed metal forearm guards after the right hand is moved.
    v4.build_arm_layers(rig, navy, silver, gold)

    for side in ("l", "r"):
        wrist = v4.bone_point(rig, f"hand_{side}", "head")
        knuckle = v4.bone_point(rig, f"hand_{side}", "tail")
        v4.ring_curve(
            f"ZhaoYun_V6_Gauntlet_Gold_Cuff_{side}",
            wrist.lerp(knuckle, 0.06),
            knuckle - wrist,
            0.044,
            0.039,
            gold,
            0.0025,
        )
        backplate_center = wrist.lerp(knuckle, 0.62) + Vector((0.0, -0.035, 0.008))
        v4.v2.add_shield_plate(
            f"ZhaoYun_V6_Gauntlet_Backplate_{side}",
            tuple(backplate_center),
            0.056,
            0.070,
            0.010,
            silver,
            rotation_z=math.radians(4.0 if side == "l" else -4.0),
            bevel=0.0028,
        )
        base.add_ellipsoid(
            f"ZhaoYun_V6_Gauntlet_Backplate_Rivet_{side}",
            tuple(backplate_center + Vector((0.0, -0.012, 0.012))),
            (0.0038, 0.0020, 0.0038),
            gold,
            20,
            10,
        )
        for finger in ("index", "middle", "ring", "pinky"):
            first = rig.pose.bones.get(f"{finger}_01_{side}")
            if not first:
                continue
            center = rig.matrix_world @ first.head
            base.add_ellipsoid(
                f"ZhaoYun_V6_Silver_Knuckle_{side}_{finger}",
                tuple(center + Vector((0.0, -0.018, 0.0))),
                (0.0115, 0.0075, 0.0090),
                silver,
                24,
                12,
            )


def pleated_panel(
    name,
    rows,
    material,
    phase=0.0,
    folds=4.0,
    hem_wave=0.012,
    thickness=0.006,
    fold_base=0.005,
    fold_growth=0.008,
    secondary=0.18,
):
    """Create a tapered cloth panel with modeled longitudinal folds."""
    columns = 25
    verts = []
    for row_index, (center, half_width) in enumerate(rows):
        center = Vector(center)
        row_factor = row_index / max(1, len(rows) - 1)
        for column in range(columns):
            u = column / (columns - 1)
            normalized = u * 2.0 - 1.0
            x = center.x + normalized * half_width
            fold = math.sin(u * math.tau * folds + phase + row_factor * 0.70)
            fold += secondary * math.sin(u * math.tau * folds * 2.0 + phase * 0.6)
            y = center.y + fold * (fold_base + row_factor * fold_growth)
            z = center.z
            if row_index == len(rows) - 1:
                z += hem_wave * (0.35 + 0.65 * math.sin(u * math.tau * 2.5 + phase) ** 2)
            verts.append((x, y, z))
    faces = []
    for row in range(len(rows) - 1):
        for column in range(columns - 1):
            a = row * columns + column
            b = a + columns
            faces.append((a, a + 1, b + 1, b))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    cloth = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(cloth)
    v4.assign(cloth, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdiv = cloth.modifiers.new(name + "_Fold_Smoothing", "SUBSURF")
    subdiv.levels = 1
    subdiv.render_levels = 2
    solid = cloth.modifiers.new(name + "_Thickness", "SOLIDIFY")
    solid.thickness = thickness
    solid.offset = 0.0
    return cloth


def edge_points(rows, side, phase, folds, fold_base=0.005, fold_growth=0.008, secondary=0.18):
    points = []
    for row_index, (center, half_width) in enumerate(rows):
        center = Vector(center)
        u = 0.0 if side < 0 else 1.0
        row_factor = row_index / max(1, len(rows) - 1)
        fold = math.sin(u * math.tau * folds + phase + row_factor * 0.70)
        fold += secondary * math.sin(u * math.tau * folds * 2.0 + phase * 0.6)
        points.append((center.x + side * half_width, center.y + fold * (fold_base + row_factor * fold_growth) - 0.003, center.z))
    return points


def build_pleated_skirt(ivory, gold):
    hide_prefixes(("ZhaoYun_V4_White_Skirt_",))
    panels = (
        (
            "Left",
            [((-0.080, -0.130, 1.050), 0.092), ((-0.105, -0.155, 0.900), 0.118), ((-0.128, -0.182, 0.725), 0.142), ((-0.150, -0.202, 0.555), 0.136)],
            0.5,
        ),
        (
            "Right",
            [((0.080, -0.130, 1.050), 0.092), ((0.105, -0.155, 0.900), 0.118), ((0.128, -0.182, 0.725), 0.142), ((0.150, -0.202, 0.555), 0.136)],
            2.1,
        ),
    )
    for name, rows, phase in panels:
        pleated_panel(f"ZhaoYun_V6_Pleated_Battle_Skirt_{name}", rows, ivory, phase, 4.0, 0.011, 0.007, 0.005, 0.008, 0.18)
        outer_side = -1 if name == "Left" else 1
        base.add_curve_strand(
            f"ZhaoYun_V6_Skirt_Gold_Outer_Trim_{name}",
            edge_points(rows, outer_side, phase, 4.0, 0.005, 0.008, 0.18),
            0.0025,
            gold,
        )
        bottom_center, bottom_width = rows[-1]
        bottom = []
        for step in range(25):
            u = step / 24.0
            normalized = u * 2.0 - 1.0
            fold = math.sin(u * math.tau * 4.0 + phase + 0.70) + 0.18 * math.sin(u * math.tau * 8.0 + phase * 0.6)
            bottom.append(
                (
                    bottom_center[0] + normalized * bottom_width,
                    bottom_center[1] + fold * 0.013 - 0.003,
                    bottom_center[2] + 0.011 * (0.35 + 0.65 * math.sin(u * math.tau * 2.5 + phase) ** 2),
                )
            )
        base.add_curve_strand(f"ZhaoYun_V6_Skirt_Gold_Hem_{name}", bottom, 0.0023, gold)


def build_pleated_cape(ivory, gold):
    hide_prefixes(("ZhaoYun_V4_White_Cape_", "ZhaoYun_V4_Cape_Gold_"))
    panels = (
        (
            "Inner",
            [((-0.080, 0.125, 1.445), 0.105), ((-0.095, 0.185, 1.205), 0.125), ((-0.085, 0.255, 0.920), 0.145), ((-0.035, 0.315, 0.610), 0.145), ((0.030, 0.355, 0.285), 0.112)],
            0.3,
        ),
        (
            "Middle",
            [((0.020, 0.132, 1.448), 0.102), ((0.055, 0.200, 1.200), 0.125), ((0.120, 0.268, 0.905), 0.143), ((0.215, 0.325, 0.585), 0.140), ((0.315, 0.370, 0.255), 0.104)],
            1.7,
        ),
        (
            "Outer",
            [((0.120, 0.140, 1.430), 0.088), ((0.195, 0.210, 1.180), 0.108), ((0.300, 0.278, 0.885), 0.126), ((0.425, 0.338, 0.565), 0.122), ((0.555, 0.382, 0.300), 0.088)],
            3.2,
        ),
    )
    for name, rows, phase in panels:
        pleated_panel(f"ZhaoYun_V6_Pleated_White_Cape_{name}", rows, ivory, phase, 3.5, 0.018, 0.006, 0.004, 0.007, 0.16)
        for side in (-1, 1):
            base.add_curve_strand(
                f"ZhaoYun_V6_Cape_Gold_Trim_{name}_{side}",
                edge_points(rows, side, phase, 3.5, 0.004, 0.007, 0.16),
                0.0022,
                gold,
            )


def make_materials():
    ivory = base.make_material("ZY6_Pleated_Ivory_Silk", (0.46, 0.50, 0.55), 0.0, 0.66)
    leather = base.make_material("ZY6_Deep_Leather_Glove", (0.018, 0.025, 0.035), 0.05, 0.58)
    coordinate = bpy.data.objects.get("ZhaoYun_V4_Material_Coordinates")
    if coordinate:
        v4.v3.add_cloth_microtexture(ivory, coordinate, 0.085)
        v4.v3.add_cloth_microtexture(leather, coordinate, 0.045)
    return ivory, leather


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    navy = bpy.data.materials["ZY4_Deep_Navy_Cloth"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    ivory, leather = make_materials()

    refine_weapon_hand_pose(rig)
    rebuild_fitted_arms_and_gloves(rig, navy, leather, silver, gold)
    build_pleated_skirt(ivory, gold)
    build_pleated_cape(ivory, gold)

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
