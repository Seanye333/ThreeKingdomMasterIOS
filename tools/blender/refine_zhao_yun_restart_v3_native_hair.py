"""Use native strand hair on the clean restart identity and remove wire locks."""

from __future__ import annotations

from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v2-identity.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v3-native-hair.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"


def refine_almond_eyes(body):
    increments = {
        "Eyes_Eyelid_hooded": 0.025,
        "Eyes_EyelidsAngle": -0.025,
        "Eyes_EyelidsAngle2": -0.012,
        "Eyes_UpperLidOpenness": -0.045,
        "Eyes_LowerLidOpenness": -0.015,
    }
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in increments.items():
        data = np.load(MORPHS_L2 / f"{name}.npz")
        coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def replace_hair():
    for obj in bpy.data.objects:
        if obj.name == "ZhaoYun_Fitted_HairCap" or obj.name.startswith(
            (
                "ZhaoYun_Restart_V2_Crown_Lock_",
                "ZhaoYun_Restart_V2_Face_Lock_",
                "ZhaoYun_Restart_V2_Wind_Hair_",
            )
        ):
            obj.hide_render = True
            obj.hide_set(True)

    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Combover_zoro_d", "SceneHair_1_O4saken", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        system = modifier.particle_system
        visible = system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        if not visible:
            continue
        settings = system.settings
        settings.material = 1
        if system.name == "SceneHair_1_O4saken":
            settings.rendered_child_count = 58
            settings.child_percent = 34
            settings.radius_scale = 0.0065
        elif system.name == "Combover_zoro_d":
            settings.rendered_child_count = 8
            settings.child_percent = 8
            settings.radius_scale = 0.0060
        else:
            settings.rendered_child_count = 54
            settings.child_percent = 10
            settings.root_radius = 0.00115
            settings.tip_radius = 0.0010
            settings.radius_scale = 0.0062

    material = emitter.data.materials[0]
    if material and material.use_nodes:
        for node in material.node_tree.nodes:
            if node.type != "BSDF_HAIR_PRINCIPLED":
                continue
            if "Color" in node.inputs:
                node.inputs["Color"].default_value = (0.0007, 0.0012, 0.0026, 1.0)
            if "Roughness" in node.inputs:
                node.inputs["Roughness"].default_value = 0.36
            if "Radial Roughness" in node.inputs:
                node.inputs["Radial Roughness"].default_value = 0.44


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    refine_almond_eyes(body)
    replace_hair()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
