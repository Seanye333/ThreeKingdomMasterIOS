"""Refine Zhao Yun v7 with a stronger weapon silhouette and ceremonial detail."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v7-face-presence.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v8-battle-presence.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position


def hide_prefixes(prefixes):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.hide_render = True
            obj.hide_set(True)


def tilt_dragon_spear():
    """Pivot the complete spear around the gripping hand for a diagonal line."""
    pivot = v4.point_on_spear(1.115)
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(9.0), 4, "Y")
        @ Matrix.Translation(-pivot)
    )
    prefixes = (
        "ZhaoYun_V4_Dragon_Spear_",
        "ZhaoYun_V4_Crimson_Tassel_",
        "ZhaoYun_V5_Spear_",
    )
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(prefixes):
            obj.matrix_world = transform @ obj.matrix_world


def build_layered_horsehair_plume(rig, crimson, gold):
    """Replace the sparse crest with a denser, swept horsehair silhouette."""
    hide_prefixes(("ZhaoYun_V4_Crimson_Helmet_Plume_",))
    dark_crimson = base.make_material(
        "ZY8_Dark_Crimson_Horsehair", (0.075, 0.006, 0.008), 0.08, 0.46
    )
    for index in range(38):
        lane = (index - 18.5) / 37.0
        depth = ((index % 5) - 2) * 0.0040
        length = 0.95 + 0.14 * math.sin(index * 1.73)
        points = [
            (lane * 0.010, 0.018 + depth, 1.838),
            (lane * 0.024, 0.048 + depth, 1.915 + 0.012 * math.cos(index * 0.7)),
            (0.055 + lane * 0.050, 0.105 + depth * 1.5, 1.985 - abs(lane) * 0.010),
            (0.145 + lane * 0.090, 0.165 + depth * 2.0, 1.955 - abs(lane) * 0.030),
            (
                0.205 * length + lane * 0.135,
                0.225 + depth * 2.5,
                1.865 - abs(lane) * 0.070 - 0.035 * math.sin(index * 0.91),
            ),
        ]
        strand = base.add_curve_strand(
            f"ZhaoYun_V8_Layered_Helmet_Plume_{index}",
            points,
            0.0020 if index % 7 else 0.0025,
            gold if index in (4, 19, 33) else (crimson if index % 3 else dark_crimson),
        )
        v4.parent_to_bone_keep_transform(strand, rig, "head")


def build_command_sword(leather, silver, gold, jade, crimson):
    """Place a sheathed side sword below the resting free hand."""
    pommel = Vector((0.205, -0.215, 1.125))
    guard = Vector((0.215, -0.215, 1.035))
    sheath_tip = Vector((0.515, -0.070, 0.425))
    direction = sheath_tip - guard

    v4.cylinder_between("ZhaoYun_V8_Command_Sword_Grip", guard, pommel, 0.017, leather, 48)
    for index in range(5):
        z = guard.lerp(pommel, (index + 0.5) / 5.0)
        v4.ring_curve(
            f"ZhaoYun_V8_Command_Sword_Grip_Wrap_{index}",
            z,
            pommel - guard,
            0.0180,
            0.0180,
            crimson if index % 2 else gold,
            0.0020,
        )
    guard_bar = v4.cylinder_between(
        "ZhaoYun_V8_Command_Sword_Guard",
        guard + Vector((-0.060, 0.0, 0.0)),
        guard + Vector((0.060, 0.0, 0.0)),
        0.012,
        gold,
        48,
    )
    guard_bar.scale.z = 0.68
    base.add_ellipsoid(
        "ZhaoYun_V8_Command_Sword_Pommel",
        tuple(pommel + Vector((0.0, 0.0, 0.014))),
        (0.023, 0.016, 0.025),
        jade,
        40,
        20,
    )
    v4.cylinder_between(
        "ZhaoYun_V8_Command_Sword_Scabbard",
        guard - direction.normalized() * 0.018,
        sheath_tip,
        0.026,
        leather,
        56,
    )
    for index, factor in enumerate((0.08, 0.48, 0.90)):
        center = guard.lerp(sheath_tip, factor)
        radius = 0.027 if factor < 0.2 else 0.025
        v4.ring_curve(
            f"ZhaoYun_V8_Command_Sword_Scabbard_Band_{index}",
            center,
            direction,
            radius,
            radius,
            gold,
            0.0032,
        )
    base.add_ellipsoid(
        "ZhaoYun_V8_Command_Sword_Chape",
        tuple(sheath_tip),
        (0.031, 0.022, 0.038),
        silver,
        40,
        20,
    )


def build_chest_cloudwork(gold, jade):
    """Add restrained Han cloud-scroll linework to the upper cuirass."""
    y = -0.193
    curves = (
        [(-0.150, y, 1.405), (-0.112, y - 0.004, 1.438), (-0.070, y, 1.425), (-0.042, y, 1.390)],
        [(0.150, y, 1.405), (0.112, y - 0.004, 1.438), (0.070, y, 1.425), (0.042, y, 1.390)],
        [(-0.105, y - 0.003, 1.370), (-0.060, y - 0.005, 1.345), (0.0, y - 0.006, 1.360), (0.060, y - 0.005, 1.345), (0.105, y - 0.003, 1.370)],
    )
    for index, points in enumerate(curves):
        base.add_curve_strand(f"ZhaoYun_V8_Chest_Cloudwork_{index}", points, 0.0030, gold)
    for x in (-0.150, 0.150):
        base.add_ellipsoid(
            f"ZhaoYun_V8_Chest_Jade_Stud_{int(x > 0)}",
            (x, y - 0.006, 1.405),
            (0.010, 0.005, 0.010),
            jade,
            28,
            14,
        )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    silver = bpy.data.materials["ZY4_Weathered_Silver"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    crimson = bpy.data.materials["ZY4_Deep_Crimson"]
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    leather = bpy.data.materials["ZY5_Spear_Leather"]

    tilt_dragon_spear()
    build_layered_horsehair_plume(rig, crimson, gold)
    build_command_sword(leather, silver, gold, jade, crimson)
    build_chest_cloudwork(gold, jade)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
