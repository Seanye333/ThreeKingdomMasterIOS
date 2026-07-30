"""Refine Guan Yu v28 with fitted shoes, a tighter weapon hand and a forged blade."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v28.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v29.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v29-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-fullbody-v29-three-quarter.png"


def remove_object(name):
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)


def transparent_material():
    material = bpy.data.materials.get("V29 hidden source feet") or bpy.data.materials.new("V29 hidden source feet")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    links.new(transparent.outputs["BSDF"], output.inputs["Surface"])
    try:
        material.surface_render_method = "DITHERED"
    except (AttributeError, TypeError):
        pass
    return material


def hide_source_feet(body):
    hidden = transparent_material()
    body.data.materials.append(hidden)
    hidden_index = len(body.data.materials) - 1
    for polygon in body.data.polygons:
        heights = [body.data.vertices[index].co.z for index in polygon.vertices]
        if max(heights) < 0.205:
            polygon.material_index = hidden_index


def trim_boot_shell():
    boots = bpy.data.objects.get("Fullbody_Leather_Battle_Boots")
    if not boots or boots.type != "MESH":
        return
    mesh = boots.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    rejected = [vert for vert in bm.verts if vert.co.z < 0.165]
    bmesh.ops.delete(bm, geom=rejected, context="VERTS")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def shoe_ring(center_x, half_width, bottom, top, y):
    return [
        (center_x - half_width, y, bottom + 0.012),
        (center_x - half_width * 0.92, y, top - 0.032),
        (center_x - half_width * 0.50, y, top),
        (center_x, y, top + 0.006),
        (center_x + half_width * 0.50, y, top),
        (center_x + half_width * 0.92, y, top - 0.032),
        (center_x + half_width, y, bottom + 0.012),
        (center_x + half_width * 0.60, y, bottom),
        (center_x, y, bottom),
        (center_x - half_width * 0.60, y, bottom),
    ]


def add_fitted_riding_shoe(side, leather, sole, gold):
    center_x = side * 0.122
    sections = [
        (-0.242, 0.075, -0.006, 0.080),
        (-0.198, 0.098, -0.008, 0.105),
        (-0.112, 0.106, -0.006, 0.125),
        (-0.025, 0.092, -0.002, 0.172),
        (0.064, 0.070, 0.002, 0.238),
    ]
    rings = [shoe_ring(center_x, width, bottom, top, y) for y, width, bottom, top in sections]
    verts = [vertex for ring in rings for vertex in ring]
    ring_size = len(rings[0])
    faces = [tuple(reversed(range(ring_size))), tuple(range((len(rings) - 1) * ring_size, len(rings) * ring_size))]
    for section_index in range(len(rings) - 1):
        row = section_index * ring_size
        following_row = (section_index + 1) * ring_size
        for index in range(ring_size):
            following = (index + 1) % ring_size
            faces.append((row + index, row + following, following_row + following, following_row + index))
    mesh = bpy.data.meshes.new(f"V29_Fitted_Han_Riding_Shoe_{side}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    shoe = bpy.data.objects.new(f"V29_Fitted_Han_Riding_Shoe_{side}", mesh)
    bpy.context.collection.objects.link(shoe)
    assign(shoe, leather)
    bevel(shoe, 0.012, 4)
    subdivision = shoe.modifiers.new("Hand-lasted leather curvature", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    strand(
        f"V29_Riding_Shoe_Toe_Seam_{side}",
        [
            (center_x - 0.060, -0.259, 0.086),
            (center_x, -0.264, 0.098),
            (center_x + 0.060, -0.259, 0.086),
        ],
        0.0022,
        gold,
        taper=False,
    )
    strand(
        f"V29_Riding_Shoe_Instep_Strap_{side}",
        [
            (center_x - 0.080, -0.042, 0.178),
            (center_x, -0.065, 0.215),
            (center_x + 0.080, -0.042, 0.178),
        ],
        0.0040,
        leather,
        taper=False,
    )


def refine_hand_grip(rig):
    for finger in ("index", "middle", "ring", "pinky"):
        for joint in (1, 2, 3):
            bone = rig.pose.bones.get(f"{finger}_{joint:02}_r")
            if bone:
                bone.rotation_mode = "XYZ"
                bone.rotation_euler.x = math.radians(-55)
    for joint in (1, 2, 3):
        bone = rig.pose.bones.get(f"thumb_{joint:02}_r")
        if bone:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.x = math.radians(-27)
    bpy.context.view_layer.update()


def pole_x(z):
    return -0.300 - 0.070 * z


def extruded_blade(name, outline, y, depth, material):
    count = len(outline)
    verts = [(x, y - depth, z) for x, z in outline] + [(x, y + depth, z) for x, z in outline]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    bevel(obj, 0.0045, 4)
    return obj


def add_refined_blade(steel, ridge, polished, gold, jade):
    for name in (
        "Fullbody_Green_Dragon_Crescent_Blade",
        "Fullbody_Crescent_Polished_Edge",
        "Fullbody_Blade_Dragon_Inlay",
        "Fullbody_Blade_Dragon_Eye",
    ):
        remove_object(name)
    y = -0.200
    outline = [
        (pole_x(1.770) - 0.002, 1.770),
        (pole_x(1.845) + 0.026, 1.845),
        (pole_x(2.170) + 0.016, 2.170),
        (pole_x(2.285) - 0.048, 2.285),
        (pole_x(2.255) - 0.116, 2.255),
        (pole_x(2.165) - 0.184, 2.165),
        (pole_x(2.040) - 0.215, 2.040),
        (pole_x(1.925) - 0.172, 1.925),
        (pole_x(1.825) - 0.084, 1.825),
    ]
    extruded_blade("V29_Green_Dragon_Crescent_Blade", outline, y, 0.014, steel)
    ridge_outline = [
        (pole_x(1.820) - 0.028, 1.825),
        (pole_x(1.900) - 0.078, 1.905),
        (pole_x(2.035) - 0.118, 2.040),
        (pole_x(2.155) - 0.103, 2.155),
        (pole_x(2.230) - 0.068, 2.230),
        (pole_x(2.135) - 0.137, 2.125),
        (pole_x(2.020) - 0.155, 2.015),
        (pole_x(1.900) - 0.105, 1.900),
    ]
    extruded_blade("V29_Blade_Raised_Fuller", ridge_outline, y - 0.017, 0.0025, ridge)
    cutting_edge = [outline[index] for index in (3, 4, 5, 6, 7, 8)]
    strand(
        "V29_Crescent_Polished_Cutting_Edge",
        [(x, y - 0.020, z) for x, z in cutting_edge],
        0.0042,
        polished,
        taper=False,
    )
    dragon = [
        (pole_x(1.900) - 0.057, y - 0.021, 1.900),
        (pole_x(2.010) - 0.115, y - 0.022, 2.015),
        (pole_x(2.125) - 0.105, y - 0.022, 2.118),
        (pole_x(2.205) - 0.070, y - 0.022, 2.205),
    ]
    strand("V29_Blade_Gold_Dragon_Inlay", dragon, 0.0032, gold, taper=False)
    sphere(
        "V29_Blade_Dragon_Jade_Eye",
        (dragon[-1][0] - 0.006, dragon[-1][1] - 0.003, dragon[-1][2] + 0.005),
        (0.007, 0.003, 0.007),
        jade,
        20,
        10,
    )


def folded_silk_material(source):
    material = source.copy()
    material.name = "V29 vertically folded emerald silk"
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return material
    previous_normal = shader.inputs["Normal"].links[0].from_socket if shader.inputs["Normal"].is_linked else None
    if shader.inputs["Normal"].is_linked:
        links.remove(shader.inputs["Normal"].links[0])
    texcoord = nodes.new("ShaderNodeTexCoord")
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 5.0
    wave.inputs["Distortion"].default_value = 2.0
    wave.inputs["Detail"].default_value = 5.0
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.026
    bump.inputs["Distance"].default_value = 0.006
    links.new(texcoord.outputs["Generated"], wave.inputs["Vector"])
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    if previous_normal:
        links.new(previous_normal, bump.inputs["Normal"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return material


def refine_robe():
    source = bpy.data.materials.get("Portrait emerald silk")
    if not source:
        return
    folded = folded_silk_material(source)
    for name in (
        "Fullbody_Layered_Green_Battle_Robe",
        "Fullbody_Robe_Front_Right",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            assign(obj, folded)
    shadow = bpy.data.materials.get("Portrait shadow green")
    if shadow:
        for x in (-0.235, -0.155, -0.075, 0.075, 0.155, 0.235):
            strand(
                f"V29_Robe_Weighted_Fold_{x:+.3f}",
                [(x * 0.82, -0.258, 0.980), (x, -0.272, 0.660), (x * 1.08, -0.263, 0.345)],
                0.0015,
                shadow,
                taper=False,
            )


def render(scene, camera, path, location, target):
    camera.location = location
    camera.data.lens = 72
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]

    hide_source_feet(body)
    trim_boot_shell()
    refine_hand_grip(rig)

    leather = bpy.data.materials.get("Portrait near-black oxblood leather")
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    jade = bpy.data.materials.get("Portrait dark jade inlay")
    sole = mat("V29 compressed dark leather sole", (0.006, 0.003, 0.002, 1), 0.76, noise=28, bump=0.08)
    steel = mat("V29 folded blue-black steel", (0.018, 0.028, 0.036, 1), 0.29, 0.94, noise=13, bump=0.045)
    ridge = mat("V29 dark forged blade ridge", (0.008, 0.012, 0.016, 1), 0.36, 0.90, noise=19, bump=0.065)
    polished = mat("V29 polished cutting steel", (0.42, 0.52, 0.58, 1), 0.10, 0.98, noise=5, bump=0.018)
    if not all((leather, gold, jade)):
        raise RuntimeError("Required v28 materials are missing")

    for side in (-1, 1):
        add_fitted_riding_shoe(side, leather, sole, gold)
    add_refined_blade(steel, ridge, polished, gold, jade)
    refine_robe()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.16
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
