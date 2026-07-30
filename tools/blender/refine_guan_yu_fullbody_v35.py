"""Guan Yu v35: mature skin, heroic robe volume and layered battle armor."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_mpfb_v3 import lamella_plate
from create_guan_yu_realistic import assign, bevel, look_at, mat, sphere, strand
from create_guan_yu_reference_bust import cloth_ribbon


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v34.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v35.blend"
FULL = SRC / "guan-yu-reference-fullbody-v35-full.png"
UPPER = SRC / "guan-yu-reference-fullbody-v35-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v35-face.png"
OLD_SKIN = SRC / "makehuman-system-assets/skins/old_asian_male/old_lightskinned_male_diffuse2.png"


def remove_prefixes(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def replace_with_mature_skin():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    image = bpy.data.images.load(str(OLD_SKIN), check_existing=True)
    image.filepath = bpy.path.relpath(str(OLD_SKIN))
    nodes = material.node_tree.nodes
    for name in ("DiffuseTexture", "AlphaMapTexture"):
        node = nodes.get(name)
        if node and node.type == "TEX_IMAGE":
            node.image = image

    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if shader:
        shader.inputs["Roughness"].default_value = 0.57
        shader.inputs["Subsurface Weight"].default_value = 0.017
        if "Subsurface Scale" in shader.inputs:
            shader.inputs["Subsurface Scale"].default_value = 0.018
        shader.inputs["Specular IOR Level"].default_value = 0.31
    bronze = nodes.get("V34 weathered bronze complexion")
    if bronze:
        bronze.inputs["Fac"].default_value = 0.24
        bronze.inputs[2].default_value = (0.24, 0.085, 0.038, 1)
    restrained = nodes.get("V34 restrained mature skin color")
    if restrained:
        restrained.inputs["Saturation"].default_value = 0.88
        restrained.inputs["Value"].default_value = 0.92

    body = bpy.data.objects["Guan_Yu_Basemesh"]
    pores = body.modifiers.get("V32 physical facial pores")
    if pores:
        pores.strength = 0.00068


def sculpt_mature_hero_face():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    key = body.shape_key_add(name="V35 mature heroic face", from_mix=False)
    key.value = 1.0
    for point in key.data:
        co = point.co
        if co.y > -0.070 or abs(co.x) > 0.132 or not 1.530 < co.z < 1.725:
            continue
        ax = abs(co.x)

        # Temple hollow and high cheekbone make the face older and less generic.
        if 0.083 < ax < 0.122 and 1.645 < co.z < 1.704:
            weight = max(0.0, 1.0 - abs(co.z - 1.674) / 0.030)
            co.y += 0.0026 * weight
        if 0.047 < ax < 0.100 and 1.635 < co.z < 1.668:
            weight = max(0.0, 1.0 - abs(co.z - 1.651) / 0.017)
            co.y -= 0.0024 * weight
        if 0.046 < ax < 0.096 and 1.596 < co.z < 1.629:
            co.y += 0.0021 * max(0.0, 1.0 - abs(co.z - 1.613) / 0.017)

        # Heavier orbital rim and unequal eye bags.
        for eye_center in (-0.047, 0.047):
            dx = abs(co.x - eye_center)
            if dx < 0.039 and 1.688 < co.z < 1.714:
                co.y -= 0.0017 * (1.0 - dx / 0.039)
            if dx < 0.039 and 1.637 < co.z < 1.659:
                ellipse = (dx / 0.039) ** 2 + ((co.z - 1.648) / 0.012) ** 2
                if ellipse < 1.0:
                    co.y -= 0.0019 * (1.0 - ellipse)
                    if eye_center > 0:
                        co.z -= 0.00030

        # Two modeled brow furrows converge above the nose.
        if 0.005 < ax < 0.018 and 1.680 < co.z < 1.714:
            co.y += 0.0018 * (1.0 - abs(ax - 0.0115) / 0.0065)
        if ax < 0.026 and 1.665 < co.z < 1.692:
            co.z -= 0.0011 * (1.0 - ax / 0.026)

        # More decisive nose tip and alar crease.
        if ax < 0.020 and 1.594 < co.z < 1.625:
            co.y -= 0.0018 * (1.0 - ax / 0.020)
        if 0.020 < ax < 0.047 and 1.590 < co.z < 1.619:
            co.x *= 1.025
        if 0.030 < ax < 0.049 and 1.584 < co.z < 1.615:
            co.y += 0.0010

        # Deepen nasolabial grooves and keep the mouth firmly compressed.
        if 1.568 < co.z < 1.632:
            progress = (1.632 - co.z) / 0.064
            for side in (-1, 1):
                fold_x = side * (0.031 + progress * 0.032)
                distance = abs(co.x - fold_x)
                if distance < 0.006:
                    co.y += 0.0015 * (1.0 - distance / 0.006)
        if ax < 0.034 and 1.569 < co.z < 1.589:
            co.y += 0.00065
        if 0.032 < ax < 0.067 and 1.568 < co.z < 1.596:
            co.z -= 0.00125

        # A broad, weighty mandibular angle remains visible behind the groom.
        if 0.055 < ax < 0.108 and 1.535 < co.z < 1.586:
            co.x *= 1.038
            co.y -= 0.0009


def deepen_eyes():
    iris_material = bpy.data.materials.get("V31 deep brown iris")
    if iris_material and iris_material.use_nodes:
        shader = next((node for node in iris_material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Base Color"].default_value = (0.0012, 0.00038, 0.00012, 1)
            shader.inputs["Roughness"].default_value = 0.38
            shader.inputs["Specular IOR Level"].default_value = 0.20
    for side in (-1, 1):
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.scale.x *= 1.04
            iris.scale.z *= 1.04
        if pupil:
            pupil.scale.x *= 1.34
            pupil.scale.z *= 1.34


def silk_material():
    material = bpy.data.materials.get("V35 deep jade battle silk") or bpy.data.materials.new(
        "V35 deep jade battle silk"
    )
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.64
    if "Sheen Weight" in shader.inputs:
        shader.inputs["Sheen Weight"].default_value = 0.24
        shader.inputs["Sheen Roughness"].default_value = 0.58
    coordinates = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 8.0
    noise.inputs["Detail"].default_value = 4.5
    noise.inputs["Roughness"].default_value = 0.72
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.0007, 0.0035, 0.0014, 1)
    ramp.color_ramp.elements[1].color = (0.0028, 0.0160, 0.0060, 1)
    ramp.color_ramp.elements[0].position = 0.20
    ramp.color_ramp.elements[1].position = 0.82
    weave_a = nodes.new("ShaderNodeTexWave")
    weave_a.wave_type = "BANDS"
    weave_a.bands_direction = "X"
    weave_a.inputs["Scale"].default_value = 145.0
    weave_a.inputs["Distortion"].default_value = 3.0
    weave_b = nodes.new("ShaderNodeTexWave")
    weave_b.wave_type = "BANDS"
    weave_b.bands_direction = "Z"
    weave_b.inputs["Scale"].default_value = 170.0
    weave_b.inputs["Distortion"].default_value = 2.0
    multiply = nodes.new("ShaderNodeMath")
    multiply.operation = "MULTIPLY"
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.13
    bump.inputs["Distance"].default_value = 0.0014
    links.new(coordinates.outputs["Generated"], noise.inputs["Vector"])
    links.new(coordinates.outputs["Generated"], weave_a.inputs["Vector"])
    links.new(coordinates.outputs["Generated"], weave_b.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(weave_a.outputs["Color"], multiply.inputs[0])
    links.new(weave_b.outputs["Color"], multiply.inputs[1])
    links.new(multiply.outputs["Value"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def shadow_silk_material():
    material = bpy.data.materials.get("V35 shadow jade battle silk") or bpy.data.materials.new(
        "V35 shadow jade battle silk"
    )
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.0022, 0.011, 0.005, 1)
    shader.inputs["Roughness"].default_value = 0.72
    if "Sheen Weight" in shader.inputs:
        shader.inputs["Sheen Weight"].default_value = 0.16
    return material


def cloth_tube(name, centers, radii, depths, material, segments=24):
    centers = [Vector(center) for center in centers]
    verts = []
    for index, center in enumerate(centers):
        previous = centers[max(0, index - 1)]
        following = centers[min(len(centers) - 1, index + 1)]
        tangent = (following - previous).normalized()
        depth_axis = Vector((0.0, 1.0, 0.0))
        side_axis = depth_axis.cross(tangent).normalized()
        for segment in range(segments):
            angle = math.tau * segment / segments
            offset = side_axis * math.cos(angle) * radii[index]
            offset += depth_axis * math.sin(angle) * depths[index]
            verts.append(tuple(center + offset))
    faces = []
    for row in range(len(centers) - 1):
        start = row * segments
        following = (row + 1) * segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((start + segment, start + nxt, following + nxt, following + segment))
    faces.append(tuple(reversed(range(segments))))
    final = (len(centers) - 1) * segments
    faces.append(tuple(range(final, final + segments)))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdivision = obj.modifiers.new("Tailored sleeve smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 2
    bevel(obj, 0.004, 3)
    return obj


def ring_curve(name, center, tangent, radius, depth, material, thickness=0.0026, segments=48):
    center = Vector(center)
    tangent = Vector(tangent).normalized()
    depth_axis = Vector((0.0, 1.0, 0.0))
    side_axis = depth_axis.cross(tangent).normalized()
    curve_data = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = thickness
    curve_data.bevel_resolution = 2
    spline = curve_data.splines.new("POLY")
    spline.points.add(segments - 1)
    for index in range(segments):
        angle = math.tau * index / segments
        point = center + side_axis * math.cos(angle) * radius + depth_axis * math.sin(angle) * depth
        spline.points[index].co = (*point, 1.0)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    assign(obj, material)
    return obj


def build_heroic_upper_robe(silk, shadow, gold):
    remove_prefixes("V35_Robe_", "V35_Sleeve_")
    torso = bpy.data.objects.get("Portrait_Deep_Green_Robe")
    if torso:
        assign(torso, silk)
        solidify = next((modifier for modifier in torso.modifiers if modifier.type == "SOLIDIFY"), None)
        if solidify:
            solidify.thickness = 0.024

    # Thick crossing panels give the torso the layered Han robe silhouette.
    left = cloth_ribbon(
        "V35_Robe_Cross_Panel_Left",
        [
            (-0.225, -0.202, 1.500),
            (-0.145, -0.225, 1.430),
            (-0.070, -0.240, 1.365),
            (-0.005, -0.246, 1.310),
        ],
        [0.020, 0.023, 0.026, 0.021],
        shadow,
        0.012,
    )
    right = cloth_ribbon(
        "V35_Robe_Cross_Panel_Right",
        [
            (0.225, -0.198, 1.500),
            (0.145, -0.224, 1.430),
            (0.070, -0.240, 1.365),
            (0.005, -0.247, 1.310),
        ],
        [0.020, 0.023, 0.026, 0.021],
        silk,
        0.011,
    )
    for panel in (left, right):
        panel.modifiers["Soft cloth surface"].levels = 2
        panel.modifiers["Soft cloth surface"].render_levels = 2

    strand(
        "V35_Robe_Left_Gold_Piping",
        [(-0.244, -0.218, 1.507), (-0.162, -0.244, 1.431), (-0.086, -0.257, 1.366), (-0.020, -0.260, 1.306)],
        0.0024,
        gold,
        taper=False,
    )
    strand(
        "V35_Robe_Right_Gold_Piping",
        [(0.244, -0.214, 1.507), (0.162, -0.244, 1.431), (0.086, -0.257, 1.366), (0.020, -0.261, 1.306)],
        0.0024,
        gold,
        taper=False,
    )

    # The existing torso shell already carries a fitted cross-collar. Separate
    # padded collar strips read as floating accessories at portrait distance,
    # so retain the integrated collar and keep this pass focused on sleeve volume.
    remove_prefixes(
        "V35_Robe_Cross_Panel_",
        "V35_Robe_Left_Gold_Piping",
        "V35_Robe_Right_Gold_Piping",
    )

    sleeve_specs = [
        (
            "Right",
            [(0.255, -0.055, 1.445), (0.315, -0.070, 1.382), (0.355, -0.078, 1.300), (0.375, -0.078, 1.218)],
            [0.083, 0.095, 0.087, 0.066],
            [0.071, 0.082, 0.075, 0.057],
        ),
        (
            "Left",
            [(-0.250, -0.052, 1.440), (-0.315, -0.066, 1.374), (-0.365, -0.078, 1.295), (-0.392, -0.075, 1.220)],
            [0.080, 0.091, 0.084, 0.064],
            [0.068, 0.078, 0.072, 0.055],
        ),
    ]
    for label, centers, radii, depths in sleeve_specs:
        cloth_tube(f"V35_Sleeve_{label}", centers, radii, depths, silk, 28)


def worn_armor_materials():
    worn_black = mat(
        "V35 battle-worn blackened iron",
        (0.006, 0.008, 0.007, 1),
        0.39,
        0.72,
        noise=34,
        bump=0.045,
    )
    leather = mat(
        "V35 dark oxblood armored leather",
        (0.012, 0.0035, 0.0018, 1),
        0.48,
        0.08,
        noise=28,
        bump=0.055,
    )
    for obj in bpy.data.objects:
        if (
            obj.name.startswith("Pauldron_Scale_")
            or obj.name.startswith("V33_Right_Pauldron_Layer_")
            or obj.name.startswith("V30_Waist_Lamella_")
        ):
            assign(obj, worn_black)
    bracers = bpy.data.objects.get("Fullbody_Fitted_Leather_Bracers")
    if bracers:
        assign(bracers, leather)
    return worn_black, leather


def add_layered_bracer_plates(black, gold):
    remove_prefixes("V35_Bracer_")
    specs = [
        (1, 0.372, -0.180, -0.060),
        (-1, -0.392, -0.180, 0.070),
    ]
    for side, center_x, center_y, rotation in specs:
        for row in range(3):
            z = 1.075 + row * 0.060
            plate = lamella_plate(
                f"V35_Bracer_Plate_{side:+d}_{row}",
                (center_x + side * row * 0.003, center_y - row * 0.002, z),
                0.085,
                0.064,
                0.006,
                black,
                rotation_z=rotation,
            )
            for rivet_side in (-1, 1):
                sphere(
                    f"V35_Bracer_Rivet_{side:+d}_{row}_{rivet_side:+d}",
                    (plate.location.x + rivet_side * 0.022, plate.location.y - 0.010, z + 0.014),
                    (0.0035, 0.0020, 0.0035),
                    gold,
                    16,
                    8,
                )


def refine_headcloth():
    material = bpy.data.materials.get("V34 dark jade woven headcloth")
    if material and material.use_nodes:
        ramp = next((node for node in material.node_tree.nodes if node.type == "VALTORGB"), None)
        shader = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if ramp:
            ramp.color_ramp.elements[0].color = (0.0007, 0.0045, 0.0018, 1)
            ramp.color_ramp.elements[1].color = (0.0040, 0.0250, 0.0090, 1)
        if shader:
            shader.inputs["Roughness"].default_value = 0.82

    # Reduce the central jewel again so the wrapped cloth, not a fantasy crown, dominates.
    for name in ("Headcloth_Imperial_Cloud_Crest", "Headcloth_Crest_Jade_Inlay"):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "MESH":
            for vertex in obj.data.vertices:
                vertex.co.x *= 0.80
                vertex.co.z = 1.720 + (vertex.co.z - 1.720) * 0.80
            obj.data.update()


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
    replace_with_mature_skin()
    sculpt_mature_hero_face()
    deepen_eyes()
    refine_headcloth()

    silk = bpy.data.materials.get("Portrait emerald silk") or silk_material()
    shadow = shadow_silk_material()
    gold = bpy.data.materials.get("Portrait aged imperial gold")
    if not gold:
        raise RuntimeError("Required aged gold material is missing")
    build_heroic_upper_robe(silk, shadow, gold)
    black, _leather = worn_armor_materials()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.exposure = -0.36
    camera = scene.camera

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    render(scene, camera, FULL, (1000, 1450), (-0.10, -6.45, 1.16), (-0.10, -0.03, 1.16), 72)
    render(scene, camera, UPPER, (1100, 1300), (0.55, -3.75, 1.54), (0.0, -0.06, 1.28), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FULL={FULL}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")


if __name__ == "__main__":
    main()
