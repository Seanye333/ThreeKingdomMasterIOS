"""Create a realistic Zhao Yun face-quality gate from the CC0 Vitruvian base.

This is deliberately kept in the gitignored duel/_src workspace.  It does not
replace the game's current GLB and it does not install CharMorph globally.
"""

from __future__ import annotations

import copy
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
DUEL_SRC = ROOT / "public/models/duel/_src"
TEST_ROOT = DUEL_SRC / "charmorph-test"
ADDON_ROOT = TEST_ROOT / "addon"
DATA_ROOT = TEST_ROOT
OUT_BLEND = DUEL_SRC / "zhao-yun-vitruvian-v1.blend"


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def configure_charmorph():
    sys.path.insert(0, str(ADDON_ROOT))
    import CharMorph  # pylint: disable=import-error,import-outside-toplevel
    from CharMorph.lib import charlib  # pylint: disable=import-error,import-outside-toplevel

    # Keep the downloaded data and all add-on state inside this isolated test.
    charlib.global_data_dir.dirpath = str(DATA_ROOT)
    charlib.library.dirpath = str(DATA_ROOT)
    CharMorph.prefs.is_adult_mode = lambda: False
    CharMorph.register()
    charlib.library.dirpath = str(DATA_ROOT)
    charlib.library.load()
    return CharMorph, charlib


def import_and_shape_character(CharMorph, charlib):
    ui = bpy.context.window_manager.charmorph_ui
    print("CHARACTERS=", sorted(charlib.library.chars.keys()))
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

    obj = bpy.context.object
    obj.name = "ZhaoYun_Body"
    obj.data.name = "ZhaoYun_Body_Mesh"
    morpher = CharMorph.common.manager.morpher
    if morpher is None:
        raise RuntimeError("CharMorph did not create a morpher")

    preset = copy.deepcopy(morpher.presets["EastAsian"])
    morphs = preset.setdefault("morphs", {})
    morphs.update(
        {
            # Young adult male: athletic but not a bodybuilder.
            "Gender_Male": 1.0,
            "Age_Baby": 0.0,
            "Age_Old": 0.0,
            "BodyType_Lean": 0.18,
            "BodyType_MesoMorph": 0.24,
            "Muscle_Chest": 0.16,
            "Muscle_Shoulders": 0.18,
            "Muscle_Neck": 0.08,
            "Shoulders_ShoulderWidth": 0.20,
            # Zhao Yun: composed, clean, heroic proportions rather than a brute.
            "Cheeks_BoneDefinition": 0.22,
            "Cheeks_BuccalFat": -0.10,
            "Cheeks_UpperCheek_Bone": 0.10,
            "Face_BrowRidge_Raise": 0.54,
            "Face_FrontalBone_BrowRidge": 0.18,
            "Face_Zygomatic_Bone": 0.16,
            "Jaw_Definition": 0.34,
            "Jaw_Mandible": 0.30,
            "Jaw_Width": 0.24,
            "Jaw_Mandible_GonialAngle": 0.10,
            "Jaw_Ramus_Extrusion": 0.08,
            "Chin_Height": 0.12,
            "Chin_Width": 0.05,
            "Chin_Portrusion": 0.12,
            "Eyes_Eyelid_Monolid": 0.82,
            "Eyes_Size": -0.16,
            "Eyes_EyelidsAngle": 0.10,
            "Eyes_EyelidsAngle2": 0.05,
            "Eyes_Eyelid_Hooded": 0.10,
            "Eyes_UpperLidOpenness": -0.16,
            "Eyes_LowerLidOpenness": -0.07,
            "Eyes_EyeBagsProminence": -0.18,
            "Eyes_EyeBagsSize": -0.12,
            "Nose_Width": -0.57,
            "Nose_BridgeProminence": -0.20,
            "Nose_NasalBone": -0.16,
            "Nose_Protrusion": 0.08,
            "Nose_Tip_Protrusion": 0.05,
            "Mouth_Lips_Height": -0.20,
            "Mouth_Lips_Length": -0.03,
            "Mouth_Lips_UpperLipDepth": -0.06,
            "Mouth_PhiltrumDepth": 0.08,
            "Neck_Girth": 0.10,
        }
    )
    materials = preset.setdefault("materials", {})
    materials.update(
        {
            "EastAsian": 1.0,
            "Age (Baby)": 0.0,
            "Age (Eldery)": 0.0,
            "Five O' Clock Shadow": 0.03,
            "Melanin Fraction": 0.31,
            "Hemoglobin Fraction": 0.92,
            "Global Bump Strength": 0.78,
            "Micro Bump Strength": 0.72,
            "Roughness Multiplier": 0.93,
            "Sebum Roughness": 0.46,
            "Subsurface Scale Multiplier": 0.78,
            "Sclera Redness": 0.06,
            "Sclera Yellowness": 0.025,
            "Primary Iris Color": [0.055, 0.030, 0.016, 1.0],
            "Secondary Iris Color": [0.11, 0.052, 0.020, 1.0],
        }
    )
    morpher.apply_morph_data(preset, False)

    # Smooth the silhouette without discarding the production-ready base topology.
    for poly in obj.data.polygons:
        poly.use_smooth = True
    subdiv = obj.modifiers.new("Portrait_Subdivision", "SUBSURF")
    subdiv.subdivision_type = "CATMULL_CLARK"
    subdiv.levels = 1
    subdiv.render_levels = 2

    return obj


def make_material(name: str, color, metallic=0.0, roughness=0.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_ellipsoid(name, location, scale, material, segments=64, rings=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def add_curve_strand(name, points, radius, material):
    curve = bpy.data.curves.new(name + "_Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for bp, point in zip(spline.bezier_points, points):
        bp.co = point
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def make_strand_hair_material():
    mat = bpy.data.materials.new("ZhaoYun_Strand_Hair")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    hair = nodes.new("ShaderNodeBsdfHairPrincipled")
    hair.parametrization = "COLOR"
    hair.inputs["Color"].default_value = (0.004, 0.006, 0.010, 1.0)
    hair.inputs["Roughness"].default_value = 0.32
    hair.inputs["Radial Roughness"].default_value = 0.42
    if "Coat" in hair.inputs:
        hair.inputs["Coat"].default_value = 0.18
    links.new(hair.outputs["BSDF"], output.inputs["Surface"])
    return mat


def add_library_strand_hair():
    """Append Vitruvian's authored strand groom without using its broken fitter."""
    library_file = DATA_ROOT / "characters/Vitruvian/hair.blend"
    with bpy.data.libraries.load(str(library_file), link=False) as (data_from, data_to):
        if "cm_vitruvian" not in data_from.objects:
            return False
        data_to.objects = ["cm_vitruvian"]
    emitter = data_to.objects[0]
    if emitter is None:
        return False
    bpy.context.collection.objects.link(emitter)
    emitter.name = "ZhaoYun_Strand_Hair_Emitter"
    emitter.show_instancer_for_render = False
    emitter.show_instancer_for_viewport = False
    hair_mat = make_strand_hair_material()
    emitter.data.materials.clear()
    emitter.data.materials.append(hair_mat)

    enabled = {"Back1", "mind_eyebrows_11_Default"}
    visible = 0
    for psys in emitter.particle_systems:
        is_enabled = psys.name in enabled
        psys.settings.material = 1
        for modifier in emitter.modifiers:
            if modifier.type == "PARTICLE_SYSTEM" and modifier.particle_system == psys:
                modifier.show_viewport = is_enabled
                modifier.show_render = is_enabled
        if is_enabled:
            visible += 1
    print("STRAND_HAIR_SYSTEMS=", visible)
    return visible == len(enabled)


def add_fallback_historical_hair(body):
    """Create a fitted scalp shell and tied Han hairstyle without old particles."""
    if any("hair" in o.name.lower() for o in bpy.context.scene.objects if o != body):
        return

    hair_mat = make_material("ZhaoYun_Black_Hair", (0.003, 0.004, 0.006), 0.0, 0.48)
    bsdf = hair_mat.node_tree.nodes.get("Principled BSDF")
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.16
        bsdf.inputs["Coat Roughness"].default_value = 0.28

    # Duplicate only the actual upper-scalp surface, with a higher hairline at
    # the forehead and lower coverage toward the crown/back of the head.
    source = body.data
    source.calc_loop_triangles()
    selected_polys = []
    selected_indices = set()
    for poly in source.polygons:
        center = poly.center
        # Front of this mesh is -Y. Temple corners are lifted slightly.
        front_lift = max(0.0, -center.y) * 0.23
        side_lift = max(0.0, abs(center.x) - 0.055) * 0.18
        threshold = 1.655 + front_lift + side_lift
        if center.z > threshold and center.z > 1.625:
            selected_polys.append(poly)
            selected_indices.update(poly.vertices)
    index_map = {old: new for new, old in enumerate(sorted(selected_indices))}
    verts = []
    for old in sorted(selected_indices):
        vertex = source.vertices[old]
        verts.append(tuple(vertex.co + vertex.normal * 0.0022))
    faces = [[index_map[i] for i in poly.vertices] for poly in selected_polys]
    cap_mesh = bpy.data.meshes.new("ZhaoYun_Fitted_HairCap_Mesh")
    cap_mesh.from_pydata(verts, [], faces)
    cap_mesh.update()
    cap = bpy.data.objects.new("ZhaoYun_Fitted_HairCap", cap_mesh)
    bpy.context.collection.objects.link(cap)
    cap.data.materials.append(hair_mat)
    for poly in cap.data.polygons:
        poly.use_smooth = True
    solidify = cap.modifiers.new("Hair_Thickness", "SOLIDIFY")
    solidify.thickness = 0.0018
    solidify.offset = 1.0
    subdiv = cap.modifiers.new("Hair_Smooth", "SUBSURF")
    subdiv.levels = 1
    subdiv.render_levels = 2

    # A compact tied knot plus narrow flowing sections reads as ancient Chinese
    # military hair while preserving the face silhouette.
    for i, xoff in enumerate((-0.022, 0.0, 0.022)):
        add_curve_strand(
            f"ZhaoYun_Topknot_Loop_{i}",
            [
                (xoff, 0.025, 1.742),
                (xoff * 1.5, 0.035, 1.790),
                (-xoff * 0.55, 0.032, 1.827),
                (xoff * 0.25, 0.025, 1.790),
            ],
            0.0135,
            hair_mat,
        )
    # Back tail is visible mainly in the three-quarter view.
    for i, xoff in enumerate((-0.020, -0.007, 0.007, 0.020)):
        add_curve_strand(
            f"ZhaoYun_Tied_Hair_{i}",
            [
                (xoff, 0.052, 1.775),
                (xoff * 1.4, 0.098, 1.720),
                (xoff * 1.7, 0.116, 1.650),
                (xoff * 1.2, 0.108, 1.575),
            ],
            0.010,
            hair_mat,
        )

    # A few fine strands soften the otherwise CG-clean temple edge.
    for side in (-1, 1):
        for idx in range(3):
            x = side * (0.076 + idx * 0.006)
            add_curve_strand(
                f"ZhaoYun_Temple_{side}_{idx}",
                [(x, -0.058, 1.690), (x + side * 0.004, -0.075, 1.655), (x + side * 0.002, -0.070, 1.620)],
                0.0015,
                hair_mat,
            )

    # Narrow tie at the topknot base.
    tie_mat = make_material("ZhaoYun_HairTie", (0.22, 0.028, 0.018), 0.0, 0.34)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.035, minor_radius=0.0045, major_segments=48, minor_segments=12, location=(0.0, 0.030, 1.755))
    tie = bpy.context.object
    tie.name = "ZhaoYun_Topknot_Tie"
    tie.data.materials.append(tie_mat)


def add_portrait_costume() -> None:
    red = make_material("ZhaoYun_Red_Undergarment", (0.18, 0.012, 0.009), 0.0, 0.47)
    silver = make_material("ZhaoYun_Silver_Armor", (0.22, 0.25, 0.28), 0.72, 0.25)
    dark = make_material("ZhaoYun_Armor_Recess", (0.018, 0.022, 0.028), 0.18, 0.38)

    # Portrait-only collar and pauldrons. They establish Zhao Yun's identity
    # without hiding the skin/eye quality gate.
    bpy.ops.mesh.primitive_cone_add(vertices=96, radius1=0.245, radius2=0.105, depth=0.215, location=(0.0, 0.002, 1.422))
    collar = bpy.context.object
    collar.name = "ZhaoYun_Red_Collar"
    collar.data.materials.append(red)
    for poly in collar.data.polygons:
        poly.use_smooth = True

    for side in (-1, 1):
        pauldron = add_ellipsoid(
            f"ZhaoYun_Silver_Pauldron_{'L' if side < 0 else 'R'}",
            (0.205 * side, 0.006, 1.404),
            (0.155, 0.118, 0.072),
            silver,
            64,
            24,
        )
        pauldron.rotation_euler.y = math.radians(10 * side)
        # Dark inset gives the shoulder piece readable construction at portrait scale.
        inset = add_ellipsoid(
            f"ZhaoYun_Pauldron_Inset_{'L' if side < 0 else 'R'}",
            (0.205 * side, -0.070, 1.399),
            (0.119, 0.028, 0.044),
            dark,
            48,
            20,
        )
        inset.rotation_euler.y = math.radians(10 * side)


def add_silver_circlet() -> None:
    silver = make_material("ZhaoYun_Circlet_Silver", (0.30, 0.34, 0.38), 0.82, 0.22)
    jade = make_material("ZhaoYun_Circlet_Jade", (0.018, 0.115, 0.105), 0.18, 0.20)
    band_points = [
        (-0.103, -0.092, 1.699),
        (-0.073, -0.128, 1.698),
        (0.0, -0.145, 1.690),
        (0.073, -0.128, 1.698),
        (0.103, -0.092, 1.699),
    ]
    add_curve_strand("ZhaoYun_Silver_Circlet", band_points, 0.0038, silver)
    # A restrained jade boss gives the headwear a Zhao Yun / Shu accent without
    # turning the face gate into a fantasy crown.
    ornament = add_ellipsoid("ZhaoYun_Circlet_Jade_Boss", (0.0, -0.151, 1.692), (0.012, 0.004, 0.016), jade, 40, 20)
    ornament.rotation_euler.y = math.radians(45)


def add_camera_and_lights() -> None:
    world = bpy.context.scene.world or bpy.data.worlds.new("ZhaoYun_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.008, 0.010, 0.016, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.15

    bpy.ops.object.camera_add(location=(0.10, -1.34, 1.665))
    camera = bpy.context.object
    camera.name = "ZhaoYun_Portrait_Camera"
    camera.data.lens = 105
    camera.data.sensor_width = 36
    look_at(camera, (0.0, -0.005, 1.635))
    bpy.context.scene.camera = camera

    def area(name, location, energy, color, size, target):
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp = bpy.context.object
        lamp.name = name
        lamp.data.energy = energy
        lamp.data.color = color
        lamp.data.shape = "DISK"
        lamp.data.size = size
        look_at(lamp, target)
        return lamp

    target = (0.0, 0.0, 1.64)
    area("ZhaoYun_Key", (-0.62, -0.78, 2.16), 720.0, (1.0, 0.79, 0.64), 0.46, target)
    area("ZhaoYun_Fill", (0.64, -0.54, 1.82), 330.0, (0.48, 0.64, 1.0), 0.52, target)
    area("ZhaoYun_Rim", (0.35, 0.43, 2.05), 620.0, (0.82, 0.90, 1.0), 0.34, target)
    area("ZhaoYun_EyeLight", (0.0, -0.56, 1.78), 115.0, (1.0, 0.92, 0.83), 0.14, target)

    # A dark neutral backdrop makes silhouette and hair defects obvious.
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0.0, 0.52, 1.52), rotation=(math.radians(90), 0.0, 0.0))
    backdrop = bpy.context.object
    backdrop.name = "Portrait_Backdrop"
    backdrop.data.materials.append(make_material("Backdrop_Mat", (0.009, 0.013, 0.020), 0.0, 0.64))


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1400
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.35


def main() -> None:
    clear_scene()
    CharMorph, charlib = configure_charmorph()
    body = import_and_shape_character(CharMorph, charlib)
    if not add_library_strand_hair():
        add_fallback_historical_hair(body)
    add_portrait_costume()
    add_camera_and_lights()
    configure_render()

    # Keep texture paths portable relative to the .blend when Blender can do so.
    try:
        bpy.ops.file.make_paths_relative()
    except RuntimeError:
        pass
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND), compress=True)
    print(f"OUT_BLEND={OUT_BLEND}")
    print(f"BODY_VERTS={len(body.data.vertices)}")
    print(f"BODY_DIMS={tuple(round(v, 4) for v in body.dimensions)}")


if __name__ == "__main__":
    main()
