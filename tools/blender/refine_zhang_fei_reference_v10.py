"""Zhang Fei v10: physical hair fibers, a closed spear grip, and a tighter raised sleeve."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v9.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v10.blend"
FRONT = SRC / "zhang-fei-reference-fullbody-v10-front.png"
UPPER = SRC / "zhang-fei-reference-fullbody-v10-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v10-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v10-three-quarter.png"


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
    center = sum((Vector((point.x, point.y, point.z)) for point in points), Vector()) / len(points)
    for point in points:
        point.x = center.x + (point.x - center.x) * factors[0]
        point.y = center.y + (point.y - center.y) * factors[1]
        point.z = center.z + (point.z - center.z) * factors[2]
    if obj.type == "MESH":
        obj.data.update()


def physical_hair_material(name, melanin, redness, tint, roughness):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (260, 0)
    hair = nodes.new("ShaderNodeBsdfHairPrincipled")
    hair.location = (-80, 0)
    hair.parametrization = "MELANIN"
    hair.inputs["Melanin"].default_value = melanin
    hair.inputs["Melanin Redness"].default_value = redness
    hair.inputs["Tint"].default_value = (*tint, 1.0)
    hair.inputs["Roughness"].default_value = roughness
    hair.inputs["Radial Roughness"].default_value = min(1.0, roughness + 0.12)
    hair.inputs["Coat"].default_value = 0.12
    hair.inputs["Random Color"].default_value = 0.28
    hair.inputs["Random Roughness"].default_value = 0.32
    links.new(hair.outputs[0], output.inputs["Surface"])
    return material


def refine_hair_fibers():
    deep = physical_hair_material(
        "Zhang Fei v10 deep physical fiber", 0.96, 0.48, (0.34, 0.20, 0.12), 0.42
    )
    warm = physical_hair_material(
        "Zhang Fei v10 warm physical fiber", 0.82, 0.72, (0.42, 0.22, 0.12), 0.46
    )
    age = physical_hair_material(
        "Zhang Fei v10 age physical fiber", 0.48, 0.30, (0.48, 0.45, 0.42), 0.50
    )

    groups = (
        (("ZhangFei_Bushy_Beard_deep", "ZhangFei_Wild_Hair_deep", "ZhangFei_Moustache_Deep", "ZhangFei_Brow_Fibers_Deep", "ZhangFeiV2_Hair_Bun_Coils", "ZhangFeiV2_Hair_Pulled_Flow"), deep, 0.76),
        (("ZhangFei_Bushy_Beard_warm", "ZhangFei_Wild_Hair_warm", "ZhangFei_Moustache_Warm", "ZhangFei_Brow_Fibers_Warm"), warm, 0.68),
        (("ZhangFei_Bushy_Beard_age", "ZhangFei_Wild_Hair_age"), age, 0.62),
    )
    for names, material, width_factor in groups:
        for name in names:
            obj = bpy.data.objects.get(name)
            if not obj or obj.type != "CURVE":
                continue
            obj.data.bevel_depth *= width_factor
            obj.data.bevel_resolution = max(2, obj.data.bevel_resolution)
            if len(obj.data.materials):
                obj.data.materials[0] = material
            else:
                obj.data.materials.append(material)

            # Keep the already varied roots but make every strand taper to a
            # finer tip.  Long beard fibers retain slightly more root mass.
            for index, spline in enumerate(obj.data.splines):
                points = spline.bezier_points if spline.bezier_points else spline.points
                count = len(points)
                if count < 2:
                    continue
                jitter = 0.88 + 0.22 * ((index * 37) % 101) / 100.0
                for point_index, point in enumerate(points):
                    t = point_index / (count - 1)
                    taper = 1.0 - 0.44 * (t ** 1.25)
                    point.radius *= jitter * taper


def close_spear_hand_grip():
    rig = bpy.data.objects["Zhang_Fei_Game_Rig"]
    # The four fingers were already curved around the shaft.  Close their last
    # two joints and fold the thumb across the grip to establish contact.
    rotations = {
        "thumb_01_r": -0.28,
        "thumb_02_r": -0.38,
        "thumb_03_r": -0.26,
        "index_02_r": -0.12,
        "index_03_r": -0.16,
        "middle_02_r": -0.14,
        "middle_03_r": -0.18,
        "ring_02_r": -0.13,
        "ring_03_r": -0.17,
        "pinky_02_r": -0.11,
        "pinky_03_r": -0.14,
    }
    for name, delta in rotations.items():
        bone = rig.pose.bones.get(name)
        if bone:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.x += delta
    bpy.context.view_layer.update()


def tailor_raised_sleeve_and_arm():
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    keys = body.data.shape_keys.key_blocks
    old = keys.get("Zhang Fei v10 tighter raised arm")
    if old:
        body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v10 tighter raised arm", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    center = Vector((0.285, -0.055, 1.340))
    for point in key.data:
        co = point.co
        if 0.145 < co.x < 0.455 and -0.255 < co.y < 0.085 and 1.165 < co.z < 1.515:
            delta = co - center
            co.x = center.x + delta.x * 0.94
            co.y = center.y + delta.y * 0.82
            co.z = center.z + delta.z * 0.94

    for name, factors in (
        ("V38_Raised_Sleeve_Fitted_Core", (0.95, 0.90, 0.94)),
        ("V38_Raised_Sleeve_Deep_Fold", (0.96, 0.92, 0.95)),
        ("ZhangFeiV8_Raised_Shoulder_Underlayer", (0.94, 0.92, 0.94)),
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            scale_geometry(obj, factors)


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
    refine_hair_fibers()
    close_spear_hand_grip()
    tailor_raised_sleeve_and_arm()

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
