"""Sharpen the fresh Zhao Yun identity and build camera-facing ribbon hair."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v3-native-hair.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v4-heroic-hair.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v22_iconic_face as v22  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position


HEROIC_INCREMENT = {
    "Eyes_Eyelid_hooded": 0.045,
    "Eyes_Eyelid_Monolid": 0.035,
    "Eyes_EyelidsAngle": -0.035,
    "Eyes_EyelidsAngle2": -0.018,
    "Eyes_UpperLidOpenness": -0.070,
    "Eyes_LowerLidOpenness": -0.030,
    "Eyes_LacrimalCaruncle_Sharpness": 0.050,
    "Face_FrontalBone_BrowRidge": 0.035,
    "Cheeks_UpperCheek_Bone": 0.035,
    "Cheeks_BoneDefinition": 0.040,
    "Jaw_Definition": 0.070,
    "Chin_Height": 0.035,
    "Chin_Width": -0.045,
    "Chin_SecondaryWidth": -0.025,
    "Nose_BridgeProminence": 0.075,
    "Nose_NasalBone": 0.050,
    "Nose_Protrusion": 0.065,
    "Nose_Tip_Protrusion": 0.030,
    "Nose_Width": -0.045,
    "Nose_NostrilSize": -0.025,
    "Mouth_Lips_Height": 0.025,
    "Mouth_Lips_UpperLipArch": 0.022,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in HEROIC_INCREMENT.items():
        data = np.load(MORPHS_L2 / f"{name}.npz")
        coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def prepare_hair_material():
    material = bpy.data.materials["ZhaoYun_Black_Hair"]
    material.diffuse_color = (0.0010, 0.0018, 0.0040, 1.0)
    if material.use_nodes:
        shader = material.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Base Color"].default_value = (0.0010, 0.0018, 0.0040, 1.0)
            shader.inputs["Roughness"].default_value = 0.48
            if "Specular IOR Level" in shader.inputs:
                shader.inputs["Specular IOR Level"].default_value = 0.16
            if "Coat Weight" in shader.inputs:
                shader.inputs["Coat Weight"].default_value = 0.0
    return material


def ribbon(name, points, widths, material, camera_location):
    vertices = []
    for index, point_tuple in enumerate(points):
        point = Vector(point_tuple)
        if index == 0:
            tangent = Vector(points[1]) - point
        elif index == len(points) - 1:
            tangent = point - Vector(points[index - 1])
        else:
            tangent = Vector(points[index + 1]) - Vector(points[index - 1])
        view = Vector(camera_location) - point
        side = tangent.cross(view)
        if side.length < 1e-6:
            side = Vector((1.0, 0.0, 0.0))
        side.normalize()
        offset = side * widths[index]
        vertices.extend((tuple(point - offset), tuple(point + offset)))
    faces = []
    for index in range(len(points) - 1):
        current = index * 2
        following = current + 2
        faces.append((current, current + 1, following + 1, following))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    solidify = obj.modifiers.new("Hair ribbon thickness", "SOLIDIFY")
    solidify.thickness = 0.00045
    solidify.offset = 0.0
    bevel = obj.modifiers.new("Hair ribbon soft edge", "BEVEL")
    bevel.width = 0.00035
    bevel.segments = 2
    subdivision = obj.modifiers.new("Hair ribbon smoothing", "SUBSURF")
    subdivision.levels = 1
    subdivision.render_levels = 1
    return obj


def configure_base_groom():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Combover_zoro_d", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        system = modifier.particle_system
        visible = system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        if system.name == "Combover_zoro_d":
            system.settings.rendered_child_count = 10
            system.settings.child_percent = 10
            system.settings.radius_scale = 0.0055
        elif system.name == "mind_eyebrows_11_Default":
            system.settings.rendered_child_count = 38
            system.settings.child_percent = 8
            system.settings.root_radius = 0.0010
            system.settings.tip_radius = 0.0008
            system.settings.radius_scale = 0.0052

    cap = bpy.data.objects.get("ZhaoYun_Fitted_HairCap")
    if cap:
        cap.hide_render = False
        cap.hide_set(False)
    for obj in bpy.data.objects:
        if obj.name.startswith(
            (
                "ZhaoYun_Restart_V2_Crown_Lock_",
                "ZhaoYun_Restart_V2_Face_Lock_",
                "ZhaoYun_Restart_V2_Wind_Hair_",
            )
        ):
            obj.hide_render = True
            obj.hide_set(True)


def build_ribbon_groom():
    random.seed(4409)
    material = prepare_hair_material()
    camera_location = (-0.68, -1.46, 1.650)

    # Layered crown locks give the scalp cap an organic swept-back structure.
    crown_roots = [(-0.070 + index * 0.014) for index in range(11)]
    for index, x in enumerate(crown_roots):
        lane = (index - 5) / 5.0
        points = [
            (x, 0.025, 1.752 + 0.014 * (1.0 - abs(lane))),
            (x * 0.72, -0.028, 1.800 + 0.012 * (1.0 - abs(lane))),
            (x * 0.48 + 0.024, -0.078, 1.770 - 0.010 * abs(lane)),
            (x * 0.68 + 0.035, -0.108, 1.710 - 0.024 * abs(lane)),
        ]
        ribbon(
            f"ZhaoYun_Restart_V4_Crown_Ribbon_{index}",
            points,
            (0.0075, 0.0090, 0.0070, 0.0015),
            material,
            camera_location,
        )

    # Long temple pieces frame the cheeks but leave both eyes visible.
    temple_paths = (
        [(-0.052, -0.086, 1.738), (-0.076, -0.112, 1.690), (-0.083, -0.104, 1.622), (-0.077, -0.060, 1.548)],
        [(-0.073, -0.061, 1.729), (-0.096, -0.087, 1.674), (-0.107, -0.068, 1.606), (-0.100, -0.018, 1.538)],
        [(0.060, -0.079, 1.736), (0.081, -0.103, 1.684), (0.089, -0.091, 1.621), (0.083, -0.045, 1.553)],
        [(0.077, -0.053, 1.726), (0.098, -0.074, 1.671), (0.108, -0.052, 1.608), (0.101, -0.004, 1.545)],
    )
    for index, path in enumerate(temple_paths):
        ribbon(
            f"ZhaoYun_Restart_V4_Temple_Ribbon_{index}",
            path,
            (0.0050, 0.0060, 0.0050, 0.0012),
            material,
            camera_location,
        )

    # A dense tied tail sweeps across the left side of the composition.
    for index in range(24):
        lane = (index - 11.5) / 11.5
        wave = math.sin(index * 1.77) * 0.018
        end_lift = random.uniform(-0.035, 0.035)
        points = [
            (lane * 0.012, 0.063, 1.790 + lane * 0.010),
            (-0.058 + lane * 0.028, 0.112, 1.842 + lane * 0.030),
            (-0.168 + lane * 0.058 + wave, 0.166, 1.820 + lane * 0.055),
            (-0.305 + lane * 0.088 + wave * 1.4, 0.215, 1.712 + lane * 0.095 + end_lift),
        ]
        ribbon(
            f"ZhaoYun_Restart_V4_Tail_Ribbon_{index}",
            points,
            (0.0038, 0.0052, 0.0040, 0.0007),
            material,
            camera_location,
        )


def refine_eyes(body):
    v22.enlarge_irises(body, scale=1.035)
    v24.recess_cornea_shell(body, depth=0.00035)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    apply_morphs(body)
    refine_eyes(body)
    configure_base_groom()
    build_ribbon_groom()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
