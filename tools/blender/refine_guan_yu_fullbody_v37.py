"""Guan Yu v37: ornate armor focal points and embroidered heroic costume."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, look_at, mat, sphere, strand
from create_guan_yu_reference_bust import cloth_ribbon


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v36.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v37.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v37-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v37-three-quarter.png"
DETAIL = SRC / "guan-yu-reference-fullbody-v37-armor-detail.png"


def remove_prefix(prefix):
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefix):
            bpy.data.objects.remove(obj, do_unlink=True)


def dragon_face(prefix, center, scale, gold, jade, shadow):
    """Build a compact late-Han taotie/dragon relief facing the camera."""
    x, y, z = center
    sphere(prefix + "_Brow_Mass", (x, y, z + 0.010 * scale), (0.058 * scale, 0.014 * scale, 0.046 * scale), gold, 32, 16)
    sphere(prefix + "_Snout", (x, y - 0.015 * scale, z - 0.010 * scale), (0.020 * scale, 0.012 * scale, 0.018 * scale), shadow, 28, 14)
    sphere(prefix + "_Nose_Gold", (x, y - 0.029 * scale, z - 0.005 * scale), (0.011 * scale, 0.006 * scale, 0.008 * scale), gold, 24, 12)
    for side in (-1, 1):
        sphere(
            f"{prefix}_Eye_{side:+d}",
            (x + side * 0.026 * scale, y - 0.030 * scale, z + 0.016 * scale),
            (0.0045 * scale, 0.003 * scale, 0.0045 * scale),
            jade,
            20,
            10,
        )
        strand(
            f"{prefix}_Horn_{side:+d}",
            [
                (x + side * 0.031 * scale, y - 0.012 * scale, z + 0.039 * scale),
                (x + side * 0.060 * scale, y - 0.009 * scale, z + 0.073 * scale),
                (x + side * 0.049 * scale, y - 0.007 * scale, z + 0.096 * scale),
                (x + side * 0.071 * scale, y - 0.005 * scale, z + 0.111 * scale),
            ],
            0.0042 * scale,
            gold,
            taper=True,
        )
        strand(
            f"{prefix}_Whisker_{side:+d}",
            [
                (x + side * 0.018 * scale, y - 0.038 * scale, z - 0.020 * scale),
                (x + side * 0.052 * scale, y - 0.030 * scale, z - 0.034 * scale),
                (x + side * 0.087 * scale, y - 0.018 * scale, z - 0.017 * scale),
            ],
            0.0022 * scale,
            gold,
            taper=True,
        )
        sphere(
            f"{prefix}_Fang_{side:+d}",
            (x + side * 0.018 * scale, y - 0.034 * scale, z - 0.040 * scale),
            (0.005 * scale, 0.003 * scale, 0.014 * scale),
            gold,
            18,
            9,
        )
    strand(
        prefix + "_Jaw",
        [
            (x - 0.038 * scale, y - 0.022 * scale, z - 0.030 * scale),
            (x, y - 0.038 * scale, z - 0.052 * scale),
            (x + 0.038 * scale, y - 0.022 * scale, z - 0.030 * scale),
        ],
        0.0040 * scale,
        gold,
        taper=False,
    )


def upgrade_dragon_focal_points(gold, jade, black):
    remove_prefix("V37_Dragon_")
    for name in ("Fullbody_Dragon_Belt_Buckle", "Fullbody_Buckle_Jade"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True
    dragon_face("V37_Dragon_Belt", (0.0, -0.222, 1.035), 0.88, gold, jade, black)

    for name in ("V33_Right_Pauldron_Gold_Medallion", "V33_Right_Pauldron_Jade_Center"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = False


def add_ornate_cross_sash(gold, jade, black):
    remove_prefix("V37_Cross_Sash_")
    centers = [
        (-0.245, -0.218, 1.468),
        (-0.170, -0.238, 1.380),
        (-0.092, -0.251, 1.290),
        (-0.015, -0.252, 1.205),
        (0.055, -0.238, 1.125),
    ]
    band = cloth_ribbon("V37_Cross_Sash_Dark_Armor", centers, [0.031, 0.034, 0.035, 0.034, 0.029], black, 0.010)
    band.modifiers["Soft cloth surface"].levels = 1
    band.modifiers["Soft cloth surface"].render_levels = 1
    for side, offset in (("Left", -0.026), ("Right", 0.026)):
        strand(
            f"V37_Cross_Sash_{side}_Gold_Edge",
            [(x + offset, y - 0.010, z) for x, y, z in centers],
            0.0024,
            gold,
            taper=False,
        )
    for index, (x, y, z) in enumerate(centers[1:-1], start=1):
        sphere(
            f"V37_Cross_Sash_Jade_Stud_{index}",
            (x, y - 0.023, z),
            (0.0065, 0.003, 0.0065),
            jade,
            20,
            10,
        )
        strand(
            f"V37_Cross_Sash_Cloud_{index}",
            [(x - 0.019, y - 0.020, z - 0.018), (x, y - 0.024, z - 0.007), (x + 0.019, y - 0.020, z - 0.018)],
            0.0016,
            gold,
            taper=True,
        )


def add_robe_brocade_panel(gold, jade, shadow):
    remove_prefix("V37_Robe_Embroidery_")
    remove_prefix("V37_Robe_Brocade_")
    centers = [(0.0, -0.307, 0.704), (0.0, -0.312, 0.600), (0.006, -0.312, 0.495), (0.020, -0.305, 0.390)]
    panel = cloth_ribbon("V37_Robe_Brocade_Central_Taward", centers, [0.112, 0.122, 0.116, 0.085], shadow, 0.008)
    panel.modifiers["Soft cloth surface"].levels = 1
    panel.modifiers["Soft cloth surface"].render_levels = 1
    strand(
        "V37_Robe_Brocade_Left_Gold_Edge",
        [(-0.112, -0.318, 0.704), (-0.122, -0.323, 0.600), (-0.110, -0.323, 0.495), (-0.065, -0.316, 0.390)],
        0.0027,
        gold,
        taper=False,
    )
    strand(
        "V37_Robe_Brocade_Right_Gold_Edge",
        [(0.112, -0.318, 0.704), (0.122, -0.323, 0.600), (0.122, -0.323, 0.495), (0.105, -0.316, 0.390)],
        0.0027,
        gold,
        taper=False,
    )
    sphere("V37_Robe_Brocade_Gold_Medallion", (0.004, -0.326, 0.565), (0.044, 0.005, 0.054), gold, 32, 16)
    sphere("V37_Robe_Brocade_Jade_Inset", (0.004, -0.334, 0.565), (0.022, 0.003, 0.028), jade, 28, 14)
    for side in (-1, 1):
        strand(
            f"V37_Robe_Brocade_Cloud_{side:+d}",
            [
                (side * 0.025, -0.329, 0.505),
                (side * 0.075, -0.326, 0.480),
                (side * 0.045, -0.324, 0.450),
                (side * 0.085, -0.319, 0.425),
            ],
            0.0026,
            gold,
            taper=True,
        )


def add_greave_relief(gold):
    remove_prefix("V37_Greave_Relief_")
    specs = ((0.249, -0.182, 1), (-0.239, -0.082, -1))
    for index, (x, y, handed) in enumerate(specs):
        strand(
            f"V37_Greave_Relief_Spine_{index}",
            [(x, y, 0.190), (x + handed * 0.022, y - 0.002, 0.245), (x - handed * 0.014, y - 0.001, 0.305), (x, y, 0.355)],
            0.0030,
            gold,
            taper=True,
        )
        for z in (0.235, 0.300):
            strand(
                f"V37_Greave_Relief_Wing_{index}_{z:.3f}",
                [(x, y - 0.002, z), (x + handed * 0.038, y + 0.002, z + 0.018), (x + handed * 0.052, y + 0.006, z + 0.005)],
                0.0020,
                gold,
                taper=True,
            )


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
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    jade = bpy.data.materials.get("Portrait dark jade") or bpy.data.materials.get("Portrait jade")
    black = bpy.data.materials.get("V35 battle-worn blackened iron")
    if not gold or not black:
        raise RuntimeError("Required v36 armor materials are missing")
    if not jade:
        jade = mat("V37 deep jade", (0.005, 0.07, 0.035, 1), 0.36, 0.08, noise=9, bump=0.015)

    upgrade_dragon_focal_points(gold, jade, black)
    harness = bpy.data.objects.get("Portrait_Dragon_Armor_Harness")
    if harness:
        assign(harness, black)
    add_ornate_cross_sash(gold, jade, black)
    add_greave_relief(gold)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72)
    render(scene, camera, THREE_QUARTER, (1000, 1450), (1.58, -6.10, 1.28), (0.0, -0.01, 1.12), 72)
    render(scene, camera, DETAIL, (1100, 1100), (0.62, -3.50, 1.22), (0.02, -0.10, 1.05), 88)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"DETAIL={DETAIL}")


if __name__ == "__main__":
    main()
