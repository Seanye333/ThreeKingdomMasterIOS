"""Create a genuinely fresh Zhao Yun head from the untouched Vitruvian source."""

from __future__ import annotations

import copy
import math
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v1.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


FRESH_FACE = {
    # Young male rather than the older, broad-jawed hero accumulated earlier.
    "Gender_Male": 0.92,
    "Gender_MaleHeadOnly": 0.88,
    "Age_Baby": 0.0,
    "Age_Old": 0.0,
    "BodyType_EctoMorph": 0.24,
    "BodyType_Lean": 0.24,
    "BodyType_MesoMorph": 0.10,
    "Neck_Girth": -0.08,
    # Reference: long oval face, high soft cheek, narrow lower third.
    "Cheeks_BuccalFat": 0.06,
    "Cheeks_UpperCheek_Bone": 0.17,
    "Cheeks_BoneDefinition": 0.04,
    "Face_Zygomatic_Bone": -0.05,
    "Face_Maxilla": -0.01,
    "Face_Puffy": -0.03,
    "Jaw_Definition": 0.15,
    "Jaw_Mandible": -0.12,
    "Jaw_Mandible_GonialAngle": -0.22,
    "Jaw_Ramus_Extrusion": -0.04,
    "Jaw_Ramus_LocY": -0.12,
    "Jaw_Width": -0.08,
    "Chin_Height": 0.015,
    "Chin_Width": -0.18,
    "Chin_SecondaryWidth": 0.10,
    "Chin_Tilt": -0.10,
    "Chin_Portrusion": -0.05,
    # Reference: dark, open almond eyes with a slight heroic upsweep.
    "Eyes_Distance": -0.025,
    "Eyes_Size": -0.060,
    "Eyes_Eyelid_Monolid": 0.66,
    "Eyes_Eyelid_Hooded": -0.025,
    "Eyes_EyelidsAngle": -0.12,
    "Eyes_EyelidsAngle2": -0.055,
    "Eyes_EyelidsCrease": 0.025,
    "Eyes_UpperLidOpenness": 0.0,
    "Eyes_LowerLidOpenness": -0.010,
    "Eyes_EyeBagsProminence": -0.16,
    "Eyes_EyeBagsSize": -0.12,
    "Eyes_EyebrowsDroop": -0.18,
    "Eyes_LacrimalCaruncle_Sharpness": 0.22,
    "Face_BrowRidge_Raise": 0.34,
    "Face_FrontalBone_BrowRidge": -0.08,
    "Face_EyeSocket_Protrusion": -0.04,
    # Reference: slim straight bridge, small nostrils, defined profile tip.
    "Nose_Width": -0.50,
    "Nose_BridgeProminence": -0.10,
    "Nose_NasalBone": -0.04,
    "Nose_NasalAngle": 0.34,
    "Nose_NostrilSize": -0.20,
    "Nose_Protrusion": 0.12,
    "Nose_Tip_Protrusion": 0.02,
    "Nose_TipCrease": 0.08,
    "Nose_BottomFlatness": 0.05,
    # Reference: compact, softly full closed lips.
    "Mouth_Lips_Length": 0.12,
    "Mouth_Lips_Height": 0.12,
    "Mouth_Lips_UpperLipArch": 0.08,
    "Mouth_Lips_UpperLipDepth": 0.045,
    "Mouth_Lips_BottomLipDepth": 0.075,
    "Mouth_PhiltrumHeight": -0.14,
    "Mouth_PhiltrumDepth": 0.05,
}


def import_fresh_character():
    charmorph, charlib = base.configure_charmorph()
    ui = bpy.context.window_manager.charmorph_ui
    ui.base_model = "Vitruvian"
    ui.material_mode = "NS"
    ui.material_local = True
    ui.tex_set = "4K"
    ui.tex_downscale = "2K"
    ui.use_sk = False
    ui.import_morphs = False
    ui.import_expressions = False
    ui.alt_topo = "<Base>"
    result = bpy.ops.charmorph.import_char()
    if "FINISHED" not in result:
        raise RuntimeError(f"CharMorph import failed: {result}")

    body = bpy.context.object
    body.name = "ZhaoYun_Restart_Body"
    body.data.name = "ZhaoYun_Restart_Mesh"
    morpher = charmorph.common.manager.morpher
    preset = copy.deepcopy(morpher.presets["EastAsian"])
    preset.setdefault("morphs", {}).update(FRESH_FACE)
    preset.setdefault("materials", {}).update(
        {
            "EastAsian": 1.0,
            "Age (Baby)": 0.0,
            "Age (Eldery)": 0.0,
            "Estrogen": 0.14,
            "Five O' Clock Shadow": 0.0,
            "Melanin Fraction": 0.22,
            "Hemoglobin Fraction": 0.55,
            "Global Bump Strength": 0.20,
            "Micro Bump Strength": 0.24,
            "Roughness Multiplier": 0.86,
            "Subsurface Scale Multiplier": 0.92,
            "Value": 0.78,
            "Sclera Redness": 0.018,
            "Sclera Yellowness": 0.006,
            "Primary Iris Color": [0.0028, 0.0015, 0.0008, 1.0],
            "Secondary Iris Color": [0.010, 0.0042, 0.0015, 1.0],
        }
    )
    morpher.apply_morph_data(preset, False)
    for polygon in body.data.polygons:
        polygon.use_smooth = True
    subdiv = body.modifiers.new("Restart portrait subdivision", "SUBSURF")
    subdiv.subdivision_type = "CATMULL_CLARK"
    subdiv.levels = 1
    subdiv.render_levels = 2
    return body


def configure_authored_hair(body):
    # Use a light fitted scalp shell for this face gate.  The heavy long-hair
    # particle systems took minutes to render and made the soft face read as a
    # woman; the final groom is added only after the identity is approved.
    base.add_fallback_historical_hair(body)
    for obj in bpy.data.objects:
        if obj.name.startswith(("ZhaoYun_Topknot_Loop_", "ZhaoYun_Tied_Hair_", "ZhaoYun_Temple_")):
            obj.hide_render = True
            obj.hide_set(True)
    if not base.add_library_strand_hair():
        raise RuntimeError("Vitruvian strand hair could not be loaded")
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        visible = modifier.particle_system.name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        modifier.particle_system.settings.material = 1
    material = emitter.data.materials[0]
    if material and material.use_nodes:
        for node in material.node_tree.nodes:
            if node.type == "BSDF_HAIR_PRINCIPLED":
                if "Color" in node.inputs:
                    node.inputs["Color"].default_value = (0.0007, 0.0012, 0.0024, 1.0)
                if "Roughness" in node.inputs:
                    node.inputs["Roughness"].default_value = 0.34


def add_simple_reference_circlet():
    silver = base.make_material("ZhaoYun_Restart_Antique_Silver", (0.24, 0.28, 0.34), 0.80, 0.25)
    jade = base.make_material("ZhaoYun_Restart_Blue_Jade", (0.010, 0.090, 0.135), 0.15, 0.20)
    points = [
        (-0.088, -0.068, 1.699),
        (-0.045, -0.094, 1.706),
        (0.0, -0.104, 1.709),
        (0.045, -0.094, 1.706),
        (0.088, -0.068, 1.699),
    ]
    base.add_curve_strand("ZhaoYun_Restart_Circlet", points, 0.0034, silver)
    for x, scale in ((0.0, 1.0), (-0.036, 0.64), (0.036, 0.64)):
        halo = base.add_ellipsoid(
            f"ZhaoYun_Restart_Circlet_Halo_{x:+.3f}",
            (x, -0.106 + abs(x) * 0.12, 1.710 - abs(x) * 0.08),
            (0.010 * scale, 0.0032, 0.013 * scale),
            silver,
            36,
            18,
        )
        gem = base.add_ellipsoid(
            f"ZhaoYun_Restart_Circlet_Jade_{x:+.3f}",
            (x, -0.109 + abs(x) * 0.12, 1.710 - abs(x) * 0.08),
            (0.0055 * scale, 0.0025, 0.0075 * scale),
            jade,
            32,
            16,
        )
        halo.rotation_euler.y = math.radians(4.0)
        gem.rotation_euler.y = math.radians(4.0)


def add_neutral_bust():
    dark = base.make_material("ZhaoYun_Restart_Dark_Robe", (0.020, 0.030, 0.050), 0.0, 0.54)
    silver = bpy.data.materials["ZhaoYun_Restart_Antique_Silver"]
    bpy.ops.mesh.primitive_cone_add(vertices=96, radius1=0.31, radius2=0.12, depth=0.25, location=(0.0, 0.025, 1.335))
    robe = bpy.context.object
    robe.name = "ZhaoYun_Restart_Neutral_Robe"
    robe.data.materials.append(dark)
    for polygon in robe.data.polygons:
        polygon.use_smooth = True
    bpy.ops.mesh.primitive_torus_add(major_radius=0.105, minor_radius=0.010, major_segments=72, minor_segments=16, location=(0.0, 0.0, 1.475))
    collar = bpy.context.object
    collar.name = "ZhaoYun_Restart_Collar_Edge"
    collar.scale.y = 0.82
    collar.data.materials.append(silver)


def add_camera_lights():
    world = bpy.context.scene.world or bpy.data.worlds.new("ZhaoYun_Restart_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.015, 0.020, 0.032, 1.0)
    background.inputs["Strength"].default_value = 0.24

    bpy.ops.object.camera_add(location=(-0.68, -1.46, 1.650))
    camera = bpy.context.object
    camera.name = "ZhaoYun_Restart_Camera"
    camera.data.lens = 112
    camera.data.sensor_width = 36
    base.look_at(camera, (0.0, -0.025, 1.645))
    bpy.context.scene.camera = camera

    def area(name, location, energy, color, size):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        base.look_at(light, (0.0, -0.02, 1.65))

    area("Restart soft key", (-0.52, -0.78, 2.05), 92.0, (1.0, 0.84, 0.72), 0.58)
    area("Restart cool fill", (0.48, -0.56, 1.82), 32.0, (0.56, 0.68, 1.0), 0.52)
    area("Restart hair rim", (0.28, 0.34, 2.06), 78.0, (0.72, 0.82, 1.0), 0.42)
    area("Restart eye light", (0.0, -0.58, 1.77), 12.0, (1.0, 0.92, 0.82), 0.16)


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.82


def main():
    base.clear_scene()
    body = import_fresh_character()
    configure_authored_hair(body)
    add_simple_reference_circlet()
    add_neutral_bust()
    add_camera_lights()
    configure_render()
    try:
        bpy.ops.file.make_paths_relative()
    except RuntimeError:
        pass
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"BODY_VERTS={len(body.data.vertices)}")


if __name__ == "__main__":
    main()
