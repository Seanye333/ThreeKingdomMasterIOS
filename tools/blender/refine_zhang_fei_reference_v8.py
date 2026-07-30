"""Zhang Fei v8: remove duplicate sleeve bulk and refine eyes, grip, and silhouette."""

from __future__ import annotations

import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v7.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v8.blend"
FRONT = SRC / "zhang-fei-reference-fullbody-v8-front.png"
UPPER = SRC / "zhang-fei-reference-fullbody-v8-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v8-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v8-three-quarter.png"


def geometry_points(obj):
    if obj.type == "MESH":
        return [vertex.co for vertex in obj.data.vertices]
    if obj.type == "CURVE":
        points = []
        for spline in obj.data.splines:
            points.extend(spline.bezier_points if spline.bezier_points else spline.points)
        return [point.co for point in points]
    return []


def scale_geometry(obj, factors):
    points = geometry_points(obj)
    if not points:
        return
    center = sum((Vector((p.x, p.y, p.z)) for p in points), Vector()) / len(points)
    for point in points:
        point.x = center.x + (point.x - center.x) * factors[0]
        point.y = center.y + (point.y - center.y) * factors[1]
        point.z = center.z + (point.z - center.z) * factors[2]
    if obj.type == "MESH":
        obj.data.update()


def remove_duplicate_raised_sleeve():
    # v6 kept both the original hanging sleeve and the later bent-arm sleeve.
    # In the guarded pose the old sleeve reads as a second, open-ended arm.
    old = bpy.data.objects.get("V35_Sleeve_Right")
    if old:
        old.hide_render = True
        old.hide_viewport = True


def remove_unposed_robe_arm():
    # The original robe is a single static torso-and-sleeves mesh.  Its left
    # sleeve remains hanging even though the replacement V38 sleeve and hand
    # form the raised guard, creating a very obvious second arm.  Remove only
    # vertices weighted to that old arm; the shoulder plate hides the seam.
    robe = bpy.data.objects.get("Portrait_Deep_Green_Robe")
    if not robe or robe.type != "MESH":
        return
    arm_groups = {
        group.index
        for name in ("upperarm_l", "lowerarm_l")
        if (group := robe.vertex_groups.get(name)) is not None
    }
    remove_indices = {
        vertex.index
        for vertex in robe.data.vertices
        if vertex.co.x > 0.145
        and any(element.group in arm_groups and element.weight > 0.15 for element in vertex.groups)
    }
    mesh = robe.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(
        bm,
        geom=[bm.verts[index] for index in sorted(remove_indices)],
        context="VERTS",
    )
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    print(f"REMOVED_OLD_ROBE_ARM_VERTICES={len(remove_indices)}")


def remove_floating_combined_bracer_half():
    # These two meshes contain both bracers in one object.  Their positive-X
    # component belonged to the robe arm removed above and otherwise floats at
    # the waist.  Preserve the negative-X spear-hand bracer.
    for name in ("Fullbody_Fitted_Leather_Bracers", "Fullbody_Bracer_Gold_Edges"):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "MESH":
            continue
        remove_indices = {vertex.index for vertex in obj.data.vertices if vertex.co.x > 0.10}
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(
            bm,
            geom=[bm.verts[index] for index in sorted(remove_indices)],
            context="VERTS",
        )
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()


def add_raised_shoulder_underlayer():
    # A compact padded under-sleeve bridges the cleanly cut robe edge to the
    # raised-arm pauldron.  It sits behind both the pauldron and V38 sleeve.
    material = bpy.data.materials.get("Zhang Fei charcoal battle cloth")
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64,
        ring_count=32,
        location=(0.205, -0.010, 1.465),
    )
    obj = bpy.context.object
    obj.name = "ZhangFeiV8_Raised_Shoulder_Underlayer"
    obj.scale = (0.122, 0.046, 0.064)
    obj.rotation_euler.z = -0.20
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def tailor_raised_arm_volume():
    body = bpy.data.objects.get("Zhang_Fei_Basemesh")
    if body and body.data.shape_keys:
        old = body.data.shape_keys.key_blocks.get("Zhang Fei v8 raised arm tuck")
        if old:
            body.shape_key_remove(old)
        key = body.shape_key_add(name="Zhang Fei v8 raised arm tuck", from_mix=True)
        for block in body.data.shape_keys.key_blocks:
            if block.name not in ("Basis", key.name):
                block.value = 0.0
        key.value = 1.0
        center = Vector((0.285, -0.055, 1.340))
        for point in key.data:
            co = point.co
            if 0.145 < co.x < 0.455 and -0.255 < co.y < 0.085 and 1.165 < co.z < 1.515:
                delta = co - center
                co.x = center.x + delta.x * 0.88
                co.y = center.y + delta.y * 0.60
                co.z = center.z + delta.z * 0.88

    for name, factors in (
        ("V38_Raised_Sleeve_Fitted_Core", (0.92, 0.86, 0.92)),
        ("V38_Raised_Sleeve_Deep_Fold", (0.94, 0.90, 0.94)),
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            scale_geometry(obj, factors)


def refine_eye_slits():
    # The under-eye curve objects caught the key light as two pale bars and
    # could be read as an extra pair of eyes.  The skin shader already carries
    # subtler under-eye breakup, so the geometry is removed from the render.
    for obj in bpy.data.objects:
        if obj.name.startswith("V39_Face_UnderEye_Crease_"):
            obj.hide_render = True
            obj.hide_viewport = True

    # Narrow the exposed eye components together for a more focused stare.
    for obj in bpy.data.objects:
        if obj.name.startswith((
            "ZhangFei_Eye_Sclera_",
            "ZhangFei_Eye_Iris_",
            "ZhangFei_Eye_Pupil_",
            "ZhangFeiV5_Eye_Limbal_Ring_",
        )):
            scale_geometry(obj, (1.0, 1.0, 0.87))

    # Heavier, closer lid rims reduce the remaining round CG-eye silhouette.
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhangFei_Upper_Lid_") and obj.type == "CURVE":
            obj.data.bevel_depth *= 1.34
            for point in geometry_points(obj):
                point.z -= 0.0012
        elif obj.name.startswith("ZhangFei_Lower_Lid_") and obj.type == "CURVE":
            obj.data.bevel_depth *= 1.18
            for point in geometry_points(obj):
                point.z += 0.0007


def refine_spear_grips():
    material = bpy.data.materials.get("Portrait deep crimson")
    if material and material.use_nodes:
        shader = next((n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Base Color"].default_value = (0.075, 0.010, 0.006, 1.0)
            shader.inputs["Roughness"].default_value = 0.62

    # Tighten the oversized floating rings so they read as leather bindings.
    for obj in bpy.data.objects:
        if not obj.name.startswith("Fullbody_Crimson_Pole_Grip_"):
            continue
        obj.scale.x *= 0.72
        obj.scale.y *= 0.72


def tune_skin_and_hair_response():
    skin = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if skin and skin.use_nodes:
        shader = next((n for n in skin.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.61
            if "Coat Weight" in shader.inputs:
                shader.inputs["Coat Weight"].default_value = 0.08
            if "Coat Roughness" in shader.inputs:
                shader.inputs["Coat Roughness"].default_value = 0.38

    eye_white = bpy.data.materials.get("Zhang Fei warm eye white")
    if eye_white and eye_white.use_nodes:
        shader = next((n for n in eye_white.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.38


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
    remove_duplicate_raised_sleeve()
    remove_unposed_robe_arm()
    remove_floating_combined_bracer_half()
    add_raised_shoulder_underlayer()
    tailor_raised_arm_volume()
    refine_eye_slits()
    refine_spear_grips()
    tune_skin_and_hair_response()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.55, 1.10), (-0.05, -0.03, 1.13), 71)
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.34), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.64), (0.0, -0.095, 1.56), 96)
    render(scene, camera, THREE_QUARTER, (1100, 1100), (0.92, -2.36, 1.66), (0.0, -0.08, 1.55), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
