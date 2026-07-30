"""Zhang Fei v6: tailored sleeves, stronger hands and physically readable cloth weave."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v5.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v6.blend"
FRONT = SRC / "zhang-fei-reference-fullbody-v6-front.png"
UPPER = SRC / "zhang-fei-reference-fullbody-v6-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v6-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v6-three-quarter.png"


def points_for_object(obj):
    if obj.type == "MESH":
        return [vertex.co for vertex in obj.data.vertices]
    if obj.type == "CURVE":
        points = []
        for spline in obj.data.splines:
            collection = spline.bezier_points if spline.bezier_points else spline.points
            points.extend(point.co for point in collection)
        return points
    return []


def scale_geometry_about_center(obj, factors):
    points = points_for_object(obj)
    if not points:
        return
    center = sum((Vector((point.x, point.y, point.z)) for point in points), Vector()) / len(points)
    for point in points:
        point.x = center.x + (point.x - center.x) * factors[0]
        point.y = center.y + (point.y - center.y) * factors[1]
        point.z = center.z + (point.z - center.z) * factors[2]
    if obj.type == "MESH":
        obj.data.update()


def tailor_balloon_sleeves():
    adjustments = {
        # Compress mostly in depth.  Shrinking X/Z exposed the skinned arm
        # through the static sleeve in the first v6 preview.
        "V38_Raised_Sleeve_Fitted_Core": (0.985, 0.84, 0.985),
        "V38_Raised_Sleeve_Deep_Fold": (0.985, 0.84, 0.985),
        "V35_Sleeve_Right": (0.990, 0.92, 0.995),
        "V35_Sleeve_Left": (0.990, 0.95, 0.995),
    }
    for name, factors in adjustments.items():
        obj = bpy.data.objects.get(name)
        if obj:
            scale_geometry_about_center(obj, factors)


def strengthen_visible_hands():
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    keys = body.data.shape_keys.key_blocks
    old = keys.get("Zhang Fei v6 stronger hand proportions")
    if old:
        body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v6 stronger hand proportions", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    upper_center = Vector((0.018, -0.315, 1.255))
    lower_center = Vector((-0.395, -0.160, 0.995))
    sleeved_arm_center = Vector((0.285, -0.055, 1.340))
    upper_scale = Vector((1.052, 1.035, 1.050))
    lower_scale = Vector((1.047, 1.032, 1.047))

    for point in key.data:
        co = point.co
        if 0.150 < co.x < 0.445 and -0.245 < co.y < 0.080 and 1.175 < co.z < 1.505:
            # The skinned arm remained larger than the tailored static sleeve
            # and poked through as a skin-colored oval.  Tuck only the hidden
            # upper arm inward; the exposed wrist and hand lie outside this box.
            delta = co - sleeved_arm_center
            co.x = sleeved_arm_center.x + delta.x * 0.94
            co.y = sleeved_arm_center.y + delta.y * 0.70
            co.z = sleeved_arm_center.z + delta.z * 0.95
        elif -0.080 < co.x < 0.120 and -0.375 < co.y < -0.245 and 1.205 < co.z < 1.325:
            delta = co - upper_center
            co.x = upper_center.x + delta.x * upper_scale.x
            co.y = upper_center.y + delta.y * upper_scale.y
            co.z = upper_center.z + delta.z * upper_scale.z
        elif -0.465 < co.x < -0.320 and -0.235 < co.y < -0.085 and 0.910 < co.z < 1.105:
            delta = co - lower_center
            co.x = lower_center.x + delta.x * lower_scale.x
            co.y = lower_center.y + delta.y * lower_scale.y
            co.z = lower_center.z + delta.z * lower_scale.z

    # Keep the v5 nail overlays registered to the enlarged upper hand.
    for obj in bpy.data.objects:
        if not obj.name.startswith("ZhangFeiV5_Hand_"):
            continue
        if obj.name.startswith("ZhangFeiV5_Hand_Nail_"):
            delta = obj.location - upper_center
            obj.location = upper_center + Vector((delta.x * upper_scale.x, delta.y * upper_scale.y, delta.z * upper_scale.z))
            obj.scale *= 1.035
        elif obj.type == "CURVE":
            for spline in obj.data.splines:
                points = spline.bezier_points if spline.bezier_points else spline.points
                for point in points:
                    delta = Vector((point.co.x, point.co.y, point.co.z)) - upper_center
                    point.co.x = upper_center.x + delta.x * upper_scale.x
                    point.co.y = upper_center.y + delta.y * upper_scale.y
                    point.co.z = upper_center.z + delta.z * upper_scale.z


def add_fine_cloth_weave():
    material = bpy.data.materials.get("Zhang Fei charcoal battle cloth")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    for name in ("Zhang Fei v6 weave X", "Zhang Fei v6 weave Z", "Zhang Fei v6 weave mix", "Zhang Fei v6 weave bump"):
        node = nodes.get(name)
        if node:
            nodes.remove(node)

    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return
    previous_normal = shader.inputs["Normal"].links[0].from_socket if shader.inputs["Normal"].is_linked else None

    wave_x = nodes.new("ShaderNodeTexWave")
    wave_x.name = "Zhang Fei v6 weave X"
    wave_x.label = "Fine warp threads"
    wave_x.wave_type = "BANDS"
    wave_x.bands_direction = "X"
    wave_x.inputs["Scale"].default_value = 185.0
    wave_x.inputs["Distortion"].default_value = 2.2
    wave_x.inputs["Detail"].default_value = 2.0

    wave_z = nodes.new("ShaderNodeTexWave")
    wave_z.name = "Zhang Fei v6 weave Z"
    wave_z.label = "Fine weft threads"
    wave_z.wave_type = "BANDS"
    wave_z.bands_direction = "Z"
    wave_z.inputs["Scale"].default_value = 220.0
    wave_z.inputs["Distortion"].default_value = 1.8
    wave_z.inputs["Detail"].default_value = 2.0

    mix = nodes.new("ShaderNodeMixRGB")
    mix.name = "Zhang Fei v6 weave mix"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0

    bump = nodes.new("ShaderNodeBump")
    bump.name = "Zhang Fei v6 weave bump"
    bump.inputs["Strength"].default_value = 0.085
    bump.inputs["Distance"].default_value = 0.0011

    links.new(wave_x.outputs["Color"], mix.inputs[1])
    links.new(wave_z.outputs["Color"], mix.inputs[2])
    links.new(mix.outputs["Color"], bump.inputs["Height"])
    if previous_normal:
        links.new(previous_normal, bump.inputs["Normal"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    shader.inputs["Roughness"].default_value = 0.76


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
    tailor_balloon_sleeves()
    strengthen_visible_hands()
    add_fine_cloth_weave()

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
