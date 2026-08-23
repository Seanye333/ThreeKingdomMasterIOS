"""Rebuild Zhao Yun v25 toward the supplied idealized portrait identity."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v25-narrow-hero.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v26-reference-rebuild.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refine_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v15_cinematic_hero as v15  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position


REFERENCE_STRUCTURE = {
    # Narrow, upturned almond eyes instead of the generic rounded base eyes.
    "Eyes_Size": 0.010,
    "Eyes_Eyelid_hooded": -0.030,
    "Eyes_Eyelid_Monolid": 0.0,
    "Eyes_EyelidsAngle": -0.140,
    "Eyes_EyelidsAngle2": -0.065,
    "Eyes_EyelidsCrease": 0.040,
    "Eyes_UpperLidOpenness": 0.045,
    "Eyes_LowerLidOpenness": -0.010,
    "Eyes_EyeBagsProminence": -0.120,
    "Eyes_EyeBagsSize": -0.085,
    "Eyes_LacrimalCaruncle_Sharpness": 0.085,
    "Eyes_EyebrowsAngle": -0.110,
    # Straighter, narrower bridge and a cleaner tip.
    "Nose_BridgeProminence": 0.075,
    "Nose_NasalBone": 0.045,
    "Nose_NoseHeight": -0.025,
    "Nose_Width": -0.065,
    "Nose_Tip_Protrusion": 0.028,
    "Nose_TipCrease": 0.025,
    "Nose_BottomFlatness": 0.025,
    # Shorter lower third with fuller, less stretched lips.
    "Chin_Height": -0.080,
    "Chin_Width": 0.012,
    "Chin_Portrusion": 0.018,
    "Mouth_Lips_Length": -0.030,
    "Mouth_Lips_Height": 0.085,
    "Mouth_Lips_UpperLipArch": 0.038,
    "Mouth_Lips_UpperLipDepth": 0.045,
    "Mouth_Lips_BottomLipDepth": 0.065,
    "Mouth_PhiltrumHeight": -0.030,
}

REFERENCE_EXPRESSION = {
    "Eyes_Squint": 0.0,
    "Lower_Eyelid_Up_Left": 0.0,
    "Lower_Eyelid_Up_Right": 0.0,
    "Eyebrows_Frown_Left": 0.008,
    "Eyebrows_Frown_Right": 0.009,
    "Eyebrows_InnerBrow_Lower_Left": 0.006,
    "Eyebrows_InnerBrow_Lower_Right": 0.007,
    "Eyebrows_OuterBrow_Raised_Left": 0.024,
    "Eyebrows_OuterBrow_Raised_Right": 0.026,
    "Lips_Up_Tighten": -0.020,
    "Lips_Dn_Tighten": -0.018,
    "Lips_Up_Out": 0.018,
    "Lips_Dn_Out": 0.020,
    "Lips_Up_Corner_Tight_Left": 0.018,
    "Lips_Up_Corner_Tight_Right": 0.020,
    "Lips_Up_Corner_Wide_Left": 0.008,
    "Lips_Up_Corner_Wide_Right": 0.009,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for folder, weights in ((MORPHS_L2, REFERENCE_STRUCTURE), (MORPHS_L3, REFERENCE_EXPRESSION)):
        for name, weight in weights.items():
            data = np.load(folder / f"{name}.npz")
            coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def deepen_irises():
    iris = bpy.data.materials.get("Iris")
    if not iris or not iris.use_nodes:
        return
    primary = iris.node_tree.nodes.get("Primary Iris Color")
    secondary = iris.node_tree.nodes.get("Secondary Iris Color")
    if primary and "Color" in primary.outputs:
        primary.outputs["Color"].default_value = (0.0007, 0.00045, 0.00028, 1.0)
    if secondary and "Color" in secondary.outputs:
        secondary.outputs["Color"].default_value = (0.0012, 0.00055, 0.00022, 1.0)

    sclera = bpy.data.materials.get("Sclera_Cornea")
    if sclera and sclera.use_nodes:
        settings = sclera.node_tree.nodes.get("charmorph_settings")
        if settings:
            redness = settings.outputs.get("Sclera Redness")
            yellowness = settings.outputs.get("Sclera Yellowness")
            if redness and hasattr(redness, "default_value"):
                redness.default_value = 0.010
            if yellowness and hasattr(yellowness, "default_value"):
                yellowness.default_value = 0.006


def hide_old_temple_wire():
    old_lock = bpy.data.objects.get("ZhaoYun_V15_Temple_Lock")
    if old_lock:
        old_lock.hide_render = True
        old_lock.hide_set(True)


def configure_reference_hair():
    """Use the authored long layered groom instead of synthetic curve bangs."""
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"SceneHair_1_O4saken", "Combover_zoro_d", "mind_eyebrows_07", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        visible = modifier.particle_system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        modifier.particle_system.settings.material = 1

    hairstyle = emitter.particle_systems.get("SceneHair_1_O4saken")
    if hairstyle:
        for particle in hairstyle.particles:
            for key in particle.hair_keys:
                key.co_local = key.co_local * 0.58


def refine_clear_complexion():
    skin = bpy.data.materials.get("UDIM.Skin")
    if not skin or not skin.use_nodes:
        return
    settings = skin.node_tree.nodes.get("charmorph_settings")
    if not settings:
        return
    values = {
        "Saturation": 0.024,
        "Value": -0.010,
        "Hemoglobin Fraction": 0.026,
        "Subsurface Scale Multiplier": 0.055,
        "Roughness Multiplier": 0.036,
    }
    for name, value in values.items():
        socket = settings.outputs.get(name)
        if socket and hasattr(socket, "default_value"):
            socket.default_value = value


def build_reference_bangs():
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    raven = bpy.data.materials["ZY15_Raven_Hair"]
    clumps = (
        (
            "Center",
            [(0.018, -0.050, 1.752), (0.010, -0.070, 1.730), (-0.006, -0.077, 1.704), (-0.020, -0.075, 1.680)],
            (0.0034, 0.0052, 0.0038, 0.00045),
        ),
        (
            "Center_Sweep",
            [(0.048, -0.038, 1.758), (0.034, -0.062, 1.738), (0.014, -0.074, 1.712), (-0.005, -0.075, 1.688)],
            (0.0038, 0.0060, 0.0042, 0.00050),
        ),
        (
            "Far_Sweep",
            [(-0.018, -0.043, 1.752), (-0.040, -0.065, 1.728), (-0.058, -0.069, 1.696), (-0.067, -0.058, 1.663)],
            (0.0034, 0.0058, 0.0040, 0.00045),
        ),
        (
            "Near_Temple",
            [(0.054, -0.042, 1.744), (0.066, -0.061, 1.708), (0.074, -0.061, 1.665), (0.078, -0.044, 1.620), (0.081, -0.014, 1.584)],
            (0.0030, 0.0055, 0.0050, 0.0030, 0.00045),
        ),
        (
            "Far_Temple",
            [(-0.055, -0.040, 1.740), (-0.066, -0.060, 1.705), (-0.073, -0.058, 1.662), (-0.076, -0.036, 1.622)],
            (0.0028, 0.0050, 0.0040, 0.00040),
        ),
    )
    for name, points, widths in clumps:
        for index in range(7):
            lane = (index - 3.0) / 3.0
            strand_points = []
            for point_index, ((x, y, z), width) in enumerate(zip(points, widths)):
                taper = 1.0 - 0.72 * point_index / max(1, len(points) - 1)
                strand_points.append(
                    (
                        x + lane * width * 0.78 * taper,
                        y + 0.00035 * abs(lane),
                        z + 0.00075 * math.sin(index * 1.71 + point_index * 0.83),
                    )
                )
            v15.add_strand(
                f"ZhaoYun_V26_Reference_Bang_{name}_{index}",
                strand_points,
                0.00034 if index % 3 == 0 else 0.00025,
                raven,
                rig,
            )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    v22.enlarge_irises(body, scale=1.04)
    v24.lift_gaze(body, amount=0.00045)
    # Extra recess keeps the rebuilt lids clean over the wet eye shell.
    v24.recess_cornea_shell(body, depth=0.00055)
    deepen_irises()
    hide_old_temple_wire()
    configure_reference_hair()
    refine_clear_complexion()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
