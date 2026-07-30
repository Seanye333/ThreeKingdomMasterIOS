"""Build a Guan Yu bust proof from the existing portrait and turnaround references.

This intentionally creates a new look-dev file instead of extending the earlier
full-body procedural prototype.  The mesh remains rigged through the MPFB base;
the costume pieces are separate high-detail Blender geometry for visual review.
"""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_mpfb_v3 import beard_volume, body_shell, lamella_plate, strengthen_face
from create_guan_yu_realistic import assign, bevel, cone_between, cube, look_at, mat, sphere, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BASE = SRC / "guan-yu-mpfb-base.blend"
PORTRAIT = ROOT / "portraits-src/關羽.png"
TURNAROUND = SRC / "guan-yu-turnaround.png"
BLEND = SRC / "guan-yu-reference-bust-v27.blend"
FRONT = SRC / "guan-yu-reference-bust-v27-front.png"
THREE_QUARTER = SRC / "guan-yu-reference-bust-v27-three-quarter.png"
FACE_DETAIL = SRC / "guan-yu-reference-bust-v27-face-detail.png"
DRAGON_DETAIL = SRC / "guan-yu-reference-bust-v27-dragon-shoulder.png"


def add_reference(name, path, location, rotation, scale):
    image = bpy.data.images.load(str(path), check_existing=True)
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "IMAGE"
    obj.data = image
    obj.location = location
    obj.rotation_euler = rotation
    obj.empty_display_size = scale
    obj.color[3] = 0.55
    obj.hide_render = True
    bpy.context.collection.objects.link(obj)
    return obj


def relief_panel(name, outline, y, material, thickness=0.006):
    """Create a thin front-facing ornamental relief from an x/z outline."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata([(x, y, z) for x, z in outline], [], [tuple(range(len(outline)))])
    panel = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(panel)
    assign(panel, material)
    solidify = panel.modifiers.new("Relief thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    bevel(panel, min(0.0025, thickness * 0.35), 3)
    return panel


def cloth_ribbon(name, centers, half_widths, material, thickness=0.005):
    """Build a tapered cloth/trim strip along 3D center points."""
    verts = []
    for index, center in enumerate(centers):
        current = Vector(center)
        previous = Vector(centers[max(0, index - 1)])
        following = Vector(centers[min(len(centers) - 1, index + 1)])
        tangent = following - previous
        perpendicular = Vector((-tangent.z, 0.0, tangent.x))
        if perpendicular.length < 1e-6:
            perpendicular = Vector((1.0, 0.0, 0.0))
        perpendicular.normalize()
        offset = perpendicular * half_widths[index]
        verts.extend([tuple(current - offset), tuple(current + offset)])
    faces = [(index * 2, index * 2 + 1, index * 2 + 3, index * 2 + 2) for index in range(len(centers) - 1)]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    ribbon = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ribbon)
    assign(ribbon, material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    subdivision = ribbon.modifiers.new("Soft cloth surface", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 2
    subdivision.render_levels = 2
    solidify = ribbon.modifiers.new("Cloth thickness", "SOLIDIFY")
    solidify.thickness = thickness
    solidify.offset = 0.0
    bevel(ribbon, min(0.003, thickness * 0.45), 3)
    return ribbon


def tune_skin(body):
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return
    shader.inputs["Roughness"].default_value = 0.56
    shader.inputs["Subsurface Weight"].default_value = 0.022
    base = shader.inputs["Base Color"]
    if base.is_linked:
        source = base.links[0].from_socket
        links.remove(base.links[0])
        tint = nodes.new("ShaderNodeMixRGB")
        tint.name = "Portrait warm heroic complexion"
        tint.blend_type = "MULTIPLY"
        tint.inputs["Fac"].default_value = 0.88
        tint.inputs[2].default_value = (0.205, 0.052, 0.026, 1)
        links.new(source, tint.inputs[1])
        complexion_noise = nodes.new("ShaderNodeTexNoise")
        complexion_noise.name = "Natural complexion variation"
        complexion_noise.inputs["Scale"].default_value = 7.5
        complexion_noise.inputs["Detail"].default_value = 4.0
        complexion_noise.inputs["Roughness"].default_value = 0.72
        complexion_ramp = nodes.new("ShaderNodeValToRGB")
        complexion_ramp.color_ramp.elements[0].position = 0.18
        complexion_ramp.color_ramp.elements[0].color = (0.52, 0.30, 0.23, 1)
        complexion_ramp.color_ramp.elements[1].position = 0.82
        complexion_ramp.color_ramp.elements[1].color = (1.0, 0.84, 0.72, 1)
        complexion_mix = nodes.new("ShaderNodeMixRGB")
        complexion_mix.name = "Subtle mottled skin tone"
        complexion_mix.blend_type = "MULTIPLY"
        complexion_mix.inputs["Fac"].default_value = 0.14
        links.new(complexion_noise.outputs["Fac"], complexion_ramp.inputs["Fac"])
        links.new(tint.outputs["Color"], complexion_mix.inputs[1])
        links.new(complexion_ramp.outputs["Color"], complexion_mix.inputs[2])
        # Subtle vascular warmth over cheeks and nose reduces the uniform
        # mannequin complexion without painting over the source texture.
        geometry = nodes.new("ShaderNodeNewGeometry")
        regional_masks = []
        for region_name, center, radius in [
            ("Left cheek warmth", (-0.064, -0.145, 1.646), 0.060),
            ("Right cheek warmth", (0.064, -0.145, 1.646), 0.060),
            ("Nose warmth", (0.000, -0.165, 1.625), 0.048),
        ]:
            distance = nodes.new("ShaderNodeVectorMath")
            distance.name = region_name
            distance.operation = "DISTANCE"
            distance.inputs[1].default_value = center
            mask = nodes.new("ShaderNodeMapRange")
            mask.inputs["From Min"].default_value = 0.0
            mask.inputs["From Max"].default_value = radius
            mask.inputs["To Min"].default_value = 1.0
            mask.inputs["To Max"].default_value = 0.0
            mask.clamp = True
            links.new(geometry.outputs["Position"], distance.inputs[0])
            links.new(distance.outputs["Value"], mask.inputs["Value"])
            regional_masks.append(mask.outputs["Result"])
        combined = nodes.new("ShaderNodeMath")
        combined.operation = "MAXIMUM"
        links.new(regional_masks[0], combined.inputs[0])
        links.new(regional_masks[1], combined.inputs[1])
        combined_all = nodes.new("ShaderNodeMath")
        combined_all.operation = "MAXIMUM"
        links.new(combined.outputs["Value"], combined_all.inputs[0])
        links.new(regional_masks[2], combined_all.inputs[1])
        strength = nodes.new("ShaderNodeMath")
        strength.operation = "MULTIPLY"
        strength.inputs[1].default_value = 0.085
        links.new(combined_all.outputs["Value"], strength.inputs[0])
        regional_mix = nodes.new("ShaderNodeMixRGB")
        regional_mix.name = "Subtle cheek and nose vascular warmth"
        regional_mix.blend_type = "MIX"
        regional_mix.inputs[2].default_value = (0.34, 0.055, 0.026, 1)
        links.new(strength.outputs["Value"], regional_mix.inputs["Fac"])
        links.new(complexion_mix.outputs["Color"], regional_mix.inputs[1])
        links.new(regional_mix.outputs["Color"], base)
        roughness_map = nodes.new("ShaderNodeMapRange")
        roughness_map.inputs["To Min"].default_value = 0.50
        roughness_map.inputs["To Max"].default_value = 0.68
        links.new(complexion_noise.outputs["Fac"], roughness_map.inputs["Value"])
        links.new(roughness_map.outputs["Result"], shader.inputs["Roughness"])
    pores = nodes.new("ShaderNodeTexNoise")
    pores.inputs["Scale"].default_value = 230.0
    pores.inputs["Detail"].default_value = 3.2
    pores.inputs["Roughness"].default_value = 0.76
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.115
    bump.inputs["Distance"].default_value = 0.00065
    links.new(pores.outputs["Fac"], bump.inputs["Height"])
    fine_pores = nodes.new("ShaderNodeTexNoise")
    fine_pores.name = "Fine facial micro pores"
    fine_pores.inputs["Scale"].default_value = 520.0
    fine_pores.inputs["Detail"].default_value = 2.0
    fine_pores.inputs["Roughness"].default_value = 0.58
    fine_bump = nodes.new("ShaderNodeBump")
    fine_bump.name = "Micro pore normal"
    fine_bump.inputs["Strength"].default_value = 0.050
    fine_bump.inputs["Distance"].default_value = 0.00028
    links.new(fine_pores.outputs["Fac"], fine_bump.inputs["Height"])
    links.new(bump.outputs["Normal"], fine_bump.inputs["Normal"])
    links.new(fine_bump.outputs["Normal"], shader.inputs["Normal"])


def arc_points(z, count=25):
    points = []
    for index in range(count):
        t = -1.18 + 2.36 * index / (count - 1)
        points.append((0.112 * math.sin(t), -0.047 - 0.111 * math.cos(t), z))
    return points


def add_diadem_band(green, gold, jade):
    # Guan Yu's traditional green warrior headcloth uses a narrow wrapped band,
    # not the wide modern-looking ring from earlier versions.
    top = arc_points(1.730)
    bottom = arc_points(1.700)
    verts = top + bottom
    count = len(top)
    faces = [(index, index + 1, count + index + 1, count + index) for index in range(count - 1)]
    mesh = bpy.data.meshes.new("Curved_Cloth_Diadem_Mesh")
    mesh.from_pydata(verts, [], faces)
    band = bpy.data.objects.new("Curved_Cloth_Diadem", mesh)
    bpy.context.collection.objects.link(band)
    assign(band, green)
    solidify = band.modifiers.new("Diadem cloth thickness", "SOLIDIFY")
    solidify.thickness = 0.007
    solidify.offset = -0.2
    bevel(band, 0.003, 3)
    strand("Diadem_Gold_Top_Edge", top, 0.0027, gold, taper=False)
    strand("Diadem_Gold_Bottom_Edge", bottom, 0.0027, gold, taper=False)

    # Layered cloud-flame crest based on the supplied Guan Yu portrait.
    crest_outline = [
        (0.000, 1.758),
        (0.012, 1.744),
        (0.029, 1.738),
        (0.022, 1.721),
        (0.034, 1.710),
        (0.017, 1.697),
        (0.000, 1.685),
        (-0.017, 1.697),
        (-0.034, 1.710),
        (-0.022, 1.721),
        (-0.029, 1.738),
        (-0.012, 1.744),
    ]
    relief_panel("Headcloth_Imperial_Cloud_Crest", crest_outline, -0.174, gold, 0.007)
    relief_panel(
        "Headcloth_Crest_Jade_Inlay",
        [(0.000, 1.742), (0.012, 1.725), (0.000, 1.702), (-0.012, 1.725)],
        -0.180,
        jade,
        0.004,
    )
    for side in (-1, 1):
        strand(
            f"Headcloth_Cloud_Filigree_{side}",
            [
                (side * 0.018, -0.181, 1.719),
                (side * 0.052, -0.174, 1.713),
                (side * 0.078, -0.164, 1.720),
                (side * 0.094, -0.150, 1.710),
            ],
            0.0022,
            gold,
            taper=False,
        )
        for stud in range(2):
            sphere(
                f"Headcloth_Gold_Stud_{side}_{stud}",
                (side * (0.050 + stud * 0.034), -0.174 + stud * 0.008, 1.712),
                (0.0050, 0.0025, 0.0050),
                gold,
                24,
                12,
            )


def add_headcloth(body, green, green_shadow, gold, jade):
    body_shell(
        body,
        "Portrait_Fitted_Headcloth",
        lambda co: co.z > 1.695 and (co.y > -0.115 or co.z > 1.715),
        green_shadow,
        0.014,
    )
    add_diadem_band(green_shadow, gold, jade)

    # Broad, gold-edged cloth tails gather behind the head.
    for side in (-1, 1):
        cloth_ribbon(
            f"Headcloth_Long_Tail_{side}",
            [
                (side * 0.057, 0.028, 1.748),
                (side * 0.092, 0.060, 1.625),
                (side * 0.120, 0.070, 1.485),
                (side * 0.112, 0.060, 1.365),
            ],
            [0.023, 0.026, 0.023, 0.012],
            green_shadow,
            0.006,
        )
        strand(
            f"Headcloth_Tail_Gold_Edge_{side}",
            [
                (side * 0.080, 0.021, 1.748),
                (side * 0.118, 0.054, 1.625),
                (side * 0.143, 0.065, 1.485),
                (side * 0.124, 0.056, 1.365),
            ],
            0.0018,
            gold,
            taper=False,
        )


def add_head_hair(black):
    rng = random.Random(901)
    for side in (-1, 1):
        for index in range(110):
            root_x = side * rng.uniform(0.058, 0.092)
            root_z = rng.uniform(1.640, 1.708)
            strand(
                f"Portrait_Head_Hair_{side}_{index:02}",
                [
                    (root_x, -0.085 + rng.uniform(-0.010, 0.010), root_z),
                    (side * rng.uniform(0.075, 0.115), -0.070, 1.540),
                    (side * rng.uniform(0.085, 0.135), -0.050, 1.390),
                    (side * rng.uniform(0.070, 0.125), -0.020, rng.uniform(1.235, 1.335)),
                ],
                rng.uniform(0.00028, 0.00072),
                black,
            )


def tune_eyes():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.low-poly")
    if not material or not material.use_nodes:
        return
    shader = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return
    shader.inputs["Roughness"].default_value = 0.08
    if "Coat Weight" in shader.inputs:
        shader.inputs["Coat Weight"].default_value = 0.28
    if "Coat Roughness" in shader.inputs:
        shader.inputs["Coat Roughness"].default_value = 0.06
    base = shader.inputs["Base Color"]
    if base.is_linked:
        source = base.links[0].from_socket
        material.node_tree.links.remove(base.links[0])
        neutralize = material.node_tree.nodes.new("ShaderNodeHueSaturation")
        neutralize.name = "Neutralize bloodshot stock eye texture"
        neutralize.inputs["Saturation"].default_value = 0.52
        neutralize.inputs["Value"].default_value = 1.08
        material.node_tree.links.new(source, neutralize.inputs["Color"])
        material.node_tree.links.new(neutralize.outputs["Color"], base)


def add_dark_irises(iris, pupil):
    """Neutralize the reddish stock irises with restrained dark-brown overlays."""
    for side in (-1, 1):
        sphere(
            f"Portrait_Dark_Iris_{side}",
            (side * 0.047, -0.1694, 1.674),
            (0.0082, 0.0016, 0.0063),
            iris,
            40,
            20,
        )
        sphere(
            f"Portrait_Pupil_{side}",
            (side * 0.047, -0.1712, 1.674),
            (0.0031, 0.0011, 0.0031),
            pupil,
            32,
            16,
        )


def hair_material():
    material = bpy.data.materials.new("Portrait deep black anisotropic hair")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.44
    if "Anisotropic IOR Level" in shader.inputs:
        shader.inputs["Anisotropic IOR Level"].default_value = 0.62
    if "Coat Weight" in shader.inputs:
        shader.inputs["Coat Weight"].default_value = 0.08
    if "Coat Roughness" in shader.inputs:
        shader.inputs["Coat Roughness"].default_value = 0.20
    object_info = nodes.new("ShaderNodeObjectInfo")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.00025, 0.00020, 0.00018, 1)
    ramp.color_ramp.elements[1].color = (0.012, 0.0032, 0.0012, 1)
    links.new(object_info.outputs["Random"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def facial_hair_material():
    material = bpy.data.materials.new("Portrait stable deep black facial hair")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = (0.00035, 0.00028, 0.00024, 1)
    shader.inputs["Roughness"].default_value = 0.72
    if "Anisotropic IOR Level" in shader.inputs:
        shader.inputs["Anisotropic IOR Level"].default_value = 0.08
    if "Coat Weight" in shader.inputs:
        shader.inputs["Coat Weight"].default_value = 0.0
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def hair_volume_material():
    material = bpy.data.materials.new("Portrait dense black beard core")
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.0025, 0.002, 0.0015, 1)
    shader.inputs["Roughness"].default_value = 0.58
    shader.inputs["Metallic"].default_value = 0.0
    return material


def sculpt_portrait_face(body):
    """Add a restrained portrait-specific sculpt layer over MPFB morphs."""
    key = body.shape_key_add(name="Portrait likeness sculpt", from_mix=False)
    key.value = 1.0
    for point in key.data:
        co = point.co
        if co.y > -0.075 or not 1.535 < co.z < 1.725:
            continue
        # Broader heroic jaw and cheek plane.
        if 1.545 < co.z < 1.625 and 0.038 < abs(co.x) < 0.105:
            co.x *= 1.105
            co.y += 0.002
        if 1.615 < co.z < 1.680 and 0.042 < abs(co.x) < 0.105:
            co.x *= 1.065
            co.y -= 0.0045
        # Project the upper cheekbone while leaving a shallow hollow below it.
        if 0.048 < abs(co.x) < 0.095 and 1.635 < co.z < 1.670:
            cheek_weight = 1.0 - abs(co.z - 1.652) / 0.018
            co.y -= 0.0035 * max(0.0, cheek_weight)
        if 0.048 < abs(co.x) < 0.092 and 1.605 < co.z < 1.635:
            co.y += 0.0018
        # Stronger bridge and less generic flat nose.
        if abs(co.x) < 0.026 and 1.615 < co.z < 1.690:
            weight = 1.0 - abs(co.x) / 0.026
            co.y -= 0.012 * weight
        # Heavy inner brow from the reference portrait.
        if abs(co.x) < 0.034 and 1.676 < co.z < 1.708:
            weight = 1.0 - abs(co.x) / 0.034
            co.z -= 0.0070 * weight
        # A projecting brow shelf makes the eyes read older and less generic.
        if 0.018 < abs(co.x) < 0.095 and 1.690 < co.z < 1.716:
            brow_weight = 1.0 - abs(co.z - 1.703) / 0.014
            co.y -= 0.0040 * max(0.0, brow_weight)
        # Deeper eye sockets and heavier upper lids.
        for eye_center in (-0.047, 0.047):
            eye_x = abs(co.x - eye_center)
            if eye_x < 0.040 and 1.658 < co.z < 1.696:
                ellipse = (eye_x / 0.040) ** 2 + ((co.z - 1.677) / 0.022) ** 2
                if 0.45 < ellipse < 1.45:
                    co.y += 0.0038 * max(0.0, 1.45 - ellipse)
                if 1.677 < co.z < 1.691:
                    co.z -= 0.0034 * (1.0 - eye_x / 0.040)
                if 1.659 < co.z < 1.674:
                    co.z += 0.0014 * (1.0 - eye_x / 0.040)
                # Pull the outer corner slightly upward for a stern, narrow eye.
                if abs(co.x) > abs(eye_center) and eye_x < 0.032:
                    co.z += 0.0013 * (eye_x / 0.032)
        # Broader nose wings with a firmer tip.
        if 0.018 < abs(co.x) < 0.047 and 1.598 < co.z < 1.632:
            co.x *= 1.090
            co.y -= 0.0034
        if abs(co.x) < 0.022 and 1.600 < co.z < 1.628:
            co.y -= 0.0040 * (1.0 - abs(co.x) / 0.022)
        # Subtle philtrum groove and fuller upper-lip center.
        if abs(co.x) < 0.010 and 1.585 < co.z < 1.610:
            co.y += 0.0015
        if abs(co.x) < 0.024 and 1.575 < co.z < 1.594:
            co.y -= 0.0012
        # Slightly downturned mouth corners create a reserved, severe expression.
        if 0.030 < abs(co.x) < 0.066 and 1.575 < co.z < 1.604:
            co.z -= 0.0032
            co.y += 0.0010
        # Square the visible chin plane under the beard.
        if 1.540 < co.z < 1.575 and 0.025 < abs(co.x) < 0.080:
            co.x *= 1.080
            co.y -= 0.0015
        # Sculpt lower-lid volume instead of drawing wrinkle tubes over skin.
        for eye_center in (-0.047, 0.047):
            eye_x = abs(co.x - eye_center)
            if eye_x < 0.037 and 1.642 < co.z < 1.663:
                bag = (eye_x / 0.037) ** 2 + ((co.z - 1.653) / 0.011) ** 2
                if bag < 1.0:
                    co.y -= 0.0015 * (1.0 - bag)
        # Recess a narrow nasolabial groove and project the adjacent cheek pad.
        if 1.574 < co.z < 1.632:
            progress = (1.632 - co.z) / 0.058
            for side in (-1, 1):
                fold_x = side * (0.030 + 0.029 * progress)
                distance = abs(co.x - fold_x)
                if distance < 0.007:
                    co.y += 0.0018 * (1.0 - distance / 0.007)
                elif distance < 0.014:
                    co.y -= 0.0007 * (1.0 - (distance - 0.007) / 0.007)


def sculpt_natural_asymmetry(body):
    """Add tiny real-world asymmetries that break the procedural mirror look."""
    key = body.shape_key_add(name="Portrait natural asymmetry", from_mix=False)
    key.value = 1.0
    for point in key.data:
        co = point.co
        if co.y > -0.075 or not 1.545 < co.z < 1.715:
            continue
        # The right eyelid sits fractionally lower and deeper.
        if 0.020 < co.x < 0.085 and 1.655 < co.z < 1.695:
            co.z -= 0.00065
            co.y += 0.00045
        # Nose tip deviates imperceptibly from the center line.
        if abs(co.x) < 0.024 and 1.595 < co.z < 1.635:
            co.x += 0.00085 * (1.0 - abs(co.x) / 0.024)
        # Unequal cheek fullness and mouth corners keep the stern expression alive.
        if co.x < -0.040 and 1.610 < co.z < 1.665:
            co.y -= 0.00075
        if 0.030 < co.x < 0.066 and 1.574 < co.z < 1.602:
            co.z -= 0.00055


def add_render_subdivision(body):
    subdivision = body.modifiers.new("High resolution portrait surface", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 2
    subdivision.show_only_control_edges = True


def pose_bust_arms(rig):
    """Bring the MPFB A-pose arms down into a natural portrait stance."""
    def target(name, location):
        obj = bpy.data.objects.new(name, None)
        obj.location = location
        obj.empty_display_type = "SPHERE"
        obj.empty_display_size = 0.035
        obj.hide_render = True
        bpy.context.collection.objects.link(obj)
        return obj

    for side, x_sign, pole_angle in (("l", 1, math.radians(-90)), ("r", -1, math.radians(90))):
        hand = rig.pose.bones[f"hand_{side}"]
        hand_target = target(f"Portrait_Hand_Target_{side}", (x_sign * 0.315, -0.105, 0.985))
        elbow_target = target(f"Portrait_Elbow_Pole_{side}", (x_sign * 0.520, -0.175, 1.230))
        constraint = hand.constraints.new("IK")
        constraint.name = "Natural bust arm pose"
        constraint.target = hand_target
        constraint.pole_target = elbow_target
        constraint.pole_angle = pole_angle
        constraint.chain_count = 2
        constraint.use_tail = False
        for bone in (hand, hand.parent, hand.parent.parent):
            bone.ik_stretch = 0.0
    bpy.context.view_layer.update()


def add_face_hair(black, warm_shadow, facial_black):
    rng = random.Random(418)
    # Brows are built from many tapered fibers instead of a single hard tube.
    for side in (-1, 1):
        for index in range(26):
            offset = rng.uniform(-0.0034, 0.0034)
            outer_x = side * rng.uniform(0.067, 0.076)
            inner_x = side * rng.uniform(0.008, 0.014)
            strand(
                f"Portrait_Brow_{side}_{index:02}",
                [
                    (outer_x, -0.158 + rng.uniform(-0.001, 0.001), 1.696 + offset),
                    (side * 0.042, -0.163, 1.700 + offset * 0.4),
                    (inner_x, -0.160, 1.681 + offset * 0.25),
                ],
                rng.uniform(0.00034, 0.00066),
                facial_black,
            )
    for x_sign in (-1, 1):
        strand(
            f"Portrait_Brow_Furrow_{x_sign}",
            [(x_sign * 0.012, -0.155, 1.682), (x_sign * 0.005, -0.157, 1.663)],
            0.00025,
            warm_shadow,
        )

    # Fine, varied moustache fibers replace the earlier rigid paired bundles.
    for side in (-1, 1):
        for index in range(66):
            lift = rng.uniform(-0.005, 0.004)
            spread = rng.uniform(0.078, 0.110)
            middle = side * (0.062 + rng.uniform(-0.008, 0.008))
            strand(
                f"Portrait_Moustache_{side}_{index:02}",
                [
                    (side * rng.uniform(0.003, 0.018), -0.161, 1.606 + lift),
                    (side * rng.uniform(0.030, 0.044), -0.171, 1.595 + lift),
                    (middle, -0.168, 1.580 + lift),
                    (side * spread, -0.153, 1.558 + lift + rng.uniform(-0.004, 0.003)),
                ],
                rng.uniform(0.00018, 0.00046),
                facial_black,
            )

    # Short chin fibers soften the transition from lip to the long beard.
    for index in range(110):
        root_x = rng.uniform(-0.040, 0.040)
        strand(
            f"Portrait_Chin_Fiber_{index:03}",
            [
                (root_x, -0.160, 1.575 + rng.uniform(-0.006, 0.006)),
                (root_x * 1.08 + rng.uniform(-0.006, 0.006), -0.181, 1.535),
                (root_x * 0.95 + rng.uniform(-0.008, 0.008), -0.197, 1.488 + rng.uniform(-0.012, 0.012)),
            ],
            rng.uniform(0.00017, 0.00040),
            facial_black,
        )

    # A dense, subtly wavy beard with a broad jaw root and tapered lower mass.
    for index in range(650):
        root_x = rng.uniform(-0.080, 0.080)
        root_z = 1.578 + rng.uniform(-0.010, 0.012) - abs(root_x) * 0.16
        mid_x = root_x * 1.12 + rng.uniform(-0.022, 0.022)
        lower_x = root_x * 0.78 + rng.uniform(-0.023, 0.023)
        tip_x = root_x * 0.28 + rng.uniform(-0.013, 0.013)
        strand(
            f"Portrait_Beard_{index:03}",
            [
                (root_x * 0.70, -0.157, root_z),
                (mid_x, -0.203, 1.445 + rng.uniform(-0.030, 0.030)),
                (lower_x, -0.236, 1.285 + rng.uniform(-0.040, 0.040)),
                (lower_x * 0.76 + rng.uniform(-0.014, 0.014), -0.249, 1.120 + rng.uniform(-0.040, 0.040)),
                (tip_x, -0.235, rng.uniform(0.995, 1.075)),
            ],
            rng.uniform(0.00022, 0.00062),
            black,
        )
    for side in (-1, 1):
        for index in range(92):
            root_x = side * rng.uniform(0.045, 0.086)
            strand(
                f"Portrait_Side_Beard_{side}_{index:02}",
                [
                    (root_x, -0.147, rng.uniform(1.555, 1.595)),
                    (root_x + side * rng.uniform(0.005, 0.024), -0.193, 1.455),
                    (side * rng.uniform(0.058, 0.096), -0.232, 1.280),
                    (side * rng.uniform(0.025, 0.060), -0.228, rng.uniform(1.050, 1.155)),
                ],
                rng.uniform(0.00022, 0.00058),
                black,
            )


def sculpted_dragon_head(side, center, gold, jade):
    """Create one fused, relief-like Chinese dragon head for the pauldron."""
    head_x, head_y, head_z = center
    meta_data = bpy.data.metaballs.new(f"Sculpted_Dragon_Head_{side}_Volume")
    meta_data.resolution = 0.007
    meta_data.render_resolution = 0.004
    meta_data.threshold = 0.62
    dragon = bpy.data.objects.new(f"Sculpted_Dragon_Head_{side}", meta_data)
    dragon.location = center
    dragon.scale = (1.0, 0.55, 1.0)
    bpy.context.collection.objects.link(dragon)

    # Overlapping volumes form a single skull, long muzzle, cheek and lower jaw.
    volumes = [
        ((0.000, 0.000, 0.012), 0.058, 2.0),
        ((side * 0.044, -0.012, 0.003), 0.055, 2.0),
        ((side * 0.086, -0.020, -0.008), 0.045, 2.0),
        ((side * 0.118, -0.024, -0.012), 0.029, 1.7),
        ((side * 0.072, -0.018, -0.040), 0.043, 1.8),
        ((-side * 0.024, 0.004, -0.018), 0.042, 1.8),
        ((side * 0.018, -0.020, 0.045), 0.037, 1.7),
    ]
    for coordinates, radius, stiffness in volumes:
        element = meta_data.elements.new()
        element.co = coordinates
        element.radius = radius
        element.stiffness = stiffness

    bpy.context.view_layer.objects.active = dragon
    dragon.select_set(True)
    bpy.ops.object.convert(target="MESH")
    dragon = bpy.context.object
    dragon.name = f"Sculpted_Dragon_Head_{side}"
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(dragon, gold)
    for polygon in dragon.data.polygons:
        polygon.use_smooth = True
    subdivision = dragon.modifiers.new("Dragon sculpt smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1

    dragon_shadow = mat("Dragon carved shadow", (0.002, 0.0015, 0.001, 1), 0.48, 0.28)
    ivory = mat("Dragon aged ivory", (0.25, 0.12, 0.035, 1), 0.40, 0.05, noise=26, bump=0.04)

    # Raised eye socket, jade iris and black pupil.
    eye_x = head_x + side * 0.024
    sphere(
        f"Dragon_Gold_Eye_Socket_{side}",
        (eye_x, head_y - 0.044, head_z + 0.030),
        (0.010, 0.0040, 0.0080),
        gold,
        32,
        16,
    )
    sphere(
        f"Dragon_Jade_Eye_{side}",
        (eye_x + side * 0.001, head_y - 0.050, head_z + 0.030),
        (0.0054, 0.0023, 0.0040),
        jade,
        28,
        14,
    )
    sphere(
        f"Dragon_Black_Pupil_{side}",
        (eye_x + side * 0.002, head_y - 0.053, head_z + 0.030),
        (0.0017, 0.0011, 0.0026),
        dragon_shadow,
        20,
        10,
    )
    strand(
        f"Dragon_Heavy_Brow_{side}",
        [
            (head_x - side * 0.004, head_y - 0.046, head_z + 0.046),
            (head_x + side * 0.027, head_y - 0.052, head_z + 0.050),
            (head_x + side * 0.052, head_y - 0.047, head_z + 0.038),
        ],
        0.0060,
        gold,
        taper=False,
    )

    snout_tip_x = head_x + side * 0.118
    sphere(
        f"Dragon_Carved_Nostril_{side}",
        (snout_tip_x - side * 0.006, head_y - 0.047, head_z + 0.004),
        (0.0032, 0.0018, 0.0028),
        dragon_shadow,
        20,
        10,
    )
    strand(
        f"Dragon_Carved_Mouth_{side}",
        [
            (head_x + side * 0.032, head_y - 0.048, head_z - 0.020),
            (head_x + side * 0.078, head_y - 0.052, head_z - 0.035),
            (snout_tip_x + side * 0.012, head_y - 0.048, head_z - 0.019),
        ],
        0.0028,
        dragon_shadow,
        taper=False,
    )
    for fang_index, fang_x in enumerate((head_x + side * 0.070, head_x + side * 0.104)):
        cone_between(
            f"Dragon_Ivory_Fang_{side}_{fang_index}",
            (fang_x, head_y - 0.052, head_z - 0.024),
            (fang_x + side * 0.004, head_y - 0.058, head_z - 0.049 - fang_index * 0.003),
            0.0050,
            0.0010,
            ivory,
            20,
        )

    # Curved, branching deer-like horns are a hallmark of Chinese dragons.
    for horn_index in range(2):
        root_x = head_x - side * (0.006 + horn_index * 0.028)
        main_points = [
            (root_x, head_y + 0.006, head_z + 0.048 - horn_index * 0.006),
            (root_x - side * 0.018, head_y + 0.018, head_z + 0.082 + horn_index * 0.006),
            (root_x - side * 0.006, head_y + 0.008, head_z + 0.105 + horn_index * 0.008),
            (root_x + side * 0.015, head_y - 0.002, head_z + 0.115 + horn_index * 0.006),
        ]
        strand(
            f"Dragon_Curved_Horn_{side}_{horn_index}",
            main_points,
            0.0065 - horn_index * 0.0008,
            ivory,
        )
        strand(
            f"Dragon_Horn_Branch_{side}_{horn_index}",
            [
                main_points[1],
                (
                    main_points[1][0] - side * 0.026,
                    main_points[1][1] - 0.002,
                    main_points[1][2] + 0.018,
                ),
                (
                    main_points[1][0] - side * 0.036,
                    main_points[1][1] - 0.006,
                    main_points[1][2] + 0.032,
                ),
            ],
            0.0038,
            ivory,
        )

    # Forehead flame and swept-back ear sharpen the silhouette.
    relief_panel(
        f"Dragon_Forehead_Flame_{side}",
        [
            (head_x + side * 0.005, head_z + 0.074),
            (head_x + side * 0.022, head_z + 0.044),
            (head_x - side * 0.002, head_z + 0.028),
            (head_x - side * 0.018, head_z + 0.052),
        ],
        head_y - 0.039,
        gold,
        0.006,
    )
    relief_panel(
        f"Dragon_Swept_Ear_{side}",
        [
            (head_x - side * 0.030, head_z + 0.045),
            (head_x - side * 0.082, head_z + 0.069),
            (head_x - side * 0.056, head_z + 0.020),
            (head_x - side * 0.026, head_z + 0.008),
        ],
        head_y - 0.032,
        gold,
        0.006,
    )

    # Layered flame-shaped mane plates integrate the dragon with the shoulder.
    for mane_index, (offset_x, offset_z, size) in enumerate(
        [
            (-side * 0.040, 0.044, 0.021),
            (-side * 0.052, 0.016, 0.023),
            (-side * 0.055, -0.012, 0.023),
            (-side * 0.045, -0.039, 0.021),
        ]
    ):
        cx = head_x + offset_x
        cz = head_z + offset_z
        relief_panel(
            f"Dragon_Mane_Leaf_{side}_{mane_index}",
            [
                (cx, cz + size),
                (cx + size * 0.48, cz),
                (cx, cz - size * 0.58),
                (cx - size * 0.48, cz),
            ],
            head_y - 0.036,
            gold,
            0.006,
        )

    # Small raised cheek scales break up the smooth animal-like surface.
    for scale_index, (offset_x, offset_z) in enumerate(
        [
            (side * 0.010, 0.006),
            (side * 0.036, -0.002),
            (side * 0.060, -0.011),
        ]
    ):
        cx = head_x + offset_x
        cz = head_z + offset_z
        relief_panel(
            f"Dragon_Cheek_Scale_{side}_{scale_index}",
            [(cx, cz + 0.009), (cx + 0.007, cz), (cx, cz - 0.009), (cx - 0.007, cz)],
            head_y - 0.046,
            gold,
            0.004,
        )

    # Two long whiskers complete the Chinese-dragon silhouette.
    for whisker_index, z_offset in enumerate((0.002, -0.012)):
        strand(
            f"Dragon_Whisker_{side}_{whisker_index}",
            [
                (snout_tip_x, head_y - 0.052, head_z + z_offset),
                (snout_tip_x + side * 0.045, head_y - 0.045, head_z + 0.010 + z_offset),
                (snout_tip_x + side * 0.085, head_y - 0.030, head_z - 0.006 + z_offset),
                (snout_tip_x + side * 0.105, head_y - 0.010, head_z + 0.004 + z_offset),
            ],
            0.0014,
            ivory,
        )
    return dragon


def add_dragon_pauldron(side, gold, jade, dark_metal, green_shadow, red, with_dragon):
    x = side * (0.335 if with_dragon else 0.305)
    base_scale = (0.160, 0.115, 0.082) if with_dragon else (0.142, 0.112, 0.068)
    sphere(
        f"Dragon_Pauldron_Base_{side}",
        (x, -0.045, 1.405),
        base_scale,
        dark_metal,
        64,
        32,
    )
    # Layered lamella under the sculpted dragon head.
    row_count = 4 if with_dragon else 3
    for row in range(row_count):
        columns = 3 + row if with_dragon else 3
        for column in range(columns):
            spread = 0.060 if with_dragon else 0.055
            local = (column - (columns - 1) / 2) * spread
            lamella_plate(
                f"Pauldron_Scale_{side}_{row}_{column}",
                (x + local, -0.160 + row * 0.008, 1.455 - row * 0.052),
                0.060,
                0.066,
                0.006,
                dark_metal,
                rotation_z=-side * local * 0.8,
            )

    if not with_dragon:
        strand(
            f"Plain_Pauldron_Gold_Rim_{side}",
            [
                (x - 0.095, -0.165, 1.455),
                (x, -0.183, 1.500),
                (x + 0.095, -0.165, 1.455),
            ],
            0.008,
            gold,
            taper=False,
        )
        return

    # One fused, side-facing Chinese dragon relief replaces the old collection
    # of spheres and spikes.
    sculpted_dragon_head(side, (x, -0.194, 1.478), gold, jade)


def add_robe_details(green, green_shadow, gold, leather):
    """Layer Han-style crossed collars and decorated armor straps over the robe."""
    # Dark inner collar hugging the neck.
    strand(
        "Portrait_Inner_Collar",
        [(-0.155, -0.150, 1.485), (0.0, -0.187, 1.430), (0.155, -0.150, 1.485)],
        0.010,
        green_shadow,
        taper=False,
    )
    strand(
        "Portrait_Inner_Collar_Gold_Piping",
        [(-0.155, -0.169, 1.488), (0.0, -0.204, 1.437), (0.155, -0.169, 1.488)],
        0.0022,
        gold,
        taper=False,
    )

    # Traditional crossed robe lapels; their layered overlap remains visible
    # around the long beard and breaks up the previous skin-tight torso.
    left_lapel = [
        (-0.205, -0.160, 1.470),
        (-0.145, -0.187, 1.365),
        (-0.070, -0.202, 1.255),
        (0.018, -0.205, 1.145),
    ]
    right_lapel = [
        (0.205, -0.160, 1.470),
        (0.135, -0.190, 1.365),
        (0.042, -0.205, 1.255),
        (-0.042, -0.207, 1.165),
    ]
    cloth_ribbon("Portrait_Left_Crossed_Lapel", left_lapel, [0.020, 0.024, 0.027, 0.023], green_shadow, 0.006)
    cloth_ribbon("Portrait_Right_Crossed_Lapel", right_lapel, [0.020, 0.024, 0.027, 0.023], green, 0.006)
    for name, points, direction in [
        ("Left", left_lapel, -1),
        ("Right", right_lapel, 1),
    ]:
        strand(
            f"Portrait_{name}_Lapel_Gold_Edge",
            [(x + direction * 0.020, y - 0.005, z) for x, y, z in points],
            0.0024,
            gold,
            taper=False,
        )

    # Gold-edged diagonal harness visible in the supplied turnaround.
    harness = [
        (-0.285, -0.138, 1.455),
        (-0.220, -0.180, 1.350),
        (-0.145, -0.203, 1.235),
        (-0.055, -0.209, 1.105),
    ]
    cloth_ribbon("Portrait_Dragon_Armor_Harness", harness, [0.017, 0.020, 0.022, 0.019], leather, 0.007)
    for offset, label in ((-0.016, "Outer"), (0.016, "Inner")):
        strand(
            f"Portrait_Harness_Gold_{label}",
            [(x + offset, y - 0.008, z) for x, y, z in harness],
            0.0020,
            gold,
            taper=False,
        )
    for index in range(5):
        t = index / 4
        x = -0.268 + t * 0.190
        z = 1.430 - t * 0.285
        sphere(
            f"Portrait_Harness_Stud_{index}",
            (x, -0.219, z),
            (0.005, 0.0025, 0.005),
            gold,
            20,
            10,
        )

    # Restrained cloud embroidery peeking around the beard.
    for side in (-1, 1):
        strand(
            f"Portrait_Robe_Cloud_Embroidery_{side}",
            [
                (side * 0.145, -0.215, 1.205),
                (side * 0.205, -0.205, 1.180),
                (side * 0.225, -0.190, 1.135),
                (side * 0.180, -0.203, 1.105),
            ],
            0.0020,
            gold,
            taper=False,
        )


def add_costume(body, green, green_shadow, gold, jade, dark_metal, leather, red):
    body_shell(
        body,
        "Portrait_Deep_Green_Robe",
        lambda co: 0.86 < co.z < 1.505 or (0.86 < co.z < 1.660 and abs(co.x) > 0.085),
        green,
        0.016,
    )
    body_shell(
        body,
        "Portrait_Dark_Chest_Vest",
        lambda co: 1.04 < co.z < 1.445 and abs(co.x) < 0.30,
        green_shadow,
        0.022,
    )
    cube("Portrait_Leather_Belt", (0, -0.005, 1.020), (0.265, 0.165, 0.046), leather, bevel_width=0.014)
    sphere("Portrait_Lion_Belt_Buckle", (0, -0.183, 1.025), (0.066, 0.018, 0.060), gold, 48, 24)

    add_robe_details(green, green_shadow, gold, leather)
    # The supplied portrait has one signature dragon pauldron; the opposite
    # shoulder remains robe-led, avoiding the toy-like symmetrical shield look.
    add_dragon_pauldron(-1, gold, jade, dark_metal, green_shadow, red, with_dragon=True)


def setup_camera_and_lights():
    bpy.ops.object.camera_add(location=(0, -2.08, 1.49))
    camera = bpy.context.object
    camera.name = "Portrait_Front_Camera"
    camera.data.lens = 105
    look_at(camera, (0, -0.035, 1.49))
    bpy.context.scene.camera = camera

    for name, location, energy, color, size in [
        ("Portrait_Warm_Key", (-2.0, -2.7, 2.8), 470, (1.0, 0.76, 0.62), 2.4),
        ("Portrait_Soft_Fill", (2.1, -2.3, 2.1), 155, (0.32, 0.43, 0.62), 2.8),
        ("Portrait_Gold_Rim", (0.8, 1.8, 2.7), 510, (1.0, 0.42, 0.20), 2.0),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, (0, -0.02, 1.48))
    return camera


def render(scene, camera, path, camera_location, target=(0, -0.035, 1.49), lens=None):
    camera.location = camera_location
    if lens is not None:
        camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BASE))
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    rig = bpy.data.objects["Guan_Yu_Game_Rig"]
    strengthen_face(body)
    # Move closer to the strong, broad features in the user's reference.
    for name, value in {
        "head-square": 0.98,
        "head-age-incr": 0.72,
        "chin-width-incr": 0.90,
        "chin-prominent-incr": 0.58,
        "l-cheek-bones-incr": 0.72,
        "r-cheek-bones-incr": 0.72,
        "nose-scale-depth-decr": 0.02,
        "nose-point-width-incr": 0.36,
        "l-eye-epicanthus-in": 0.36,
        "r-eye-epicanthus-in": 0.36,
    }.items():
        key = body.data.shape_keys.key_blocks.get(name)
        if key:
            key.value = value
    sculpt_portrait_face(body)
    sculpt_natural_asymmetry(body)
    pose_bust_arms(rig)

    add_reference("Reference_Portrait", PORTRAIT, (-2.2, 0.8, 1.2), (math.pi / 2, 0, 0), 2.2)
    add_reference("Reference_Turnaround", TURNAROUND, (2.2, 0.8, 1.2), (math.pi / 2, 0, 0), 2.2)

    green = mat("Portrait emerald silk", (0.004, 0.058, 0.018, 1), 0.60, noise=38, bump=0.065)
    green_shadow = mat("Portrait shadow green", (0.002, 0.019, 0.006, 1), 0.68, noise=42, bump=0.070)
    head_green = mat("Portrait Guan Yu deep green headcloth", (0.003, 0.050, 0.015, 1), 0.64, noise=44, bump=0.10)
    gold = mat("Portrait aged imperial gold", (0.115, 0.045, 0.005, 1), 0.30, 0.90, noise=18, bump=0.075)
    jade = mat("Portrait dark jade inlay", (0.003, 0.070, 0.038, 1), 0.24, 0.15, noise=36, bump=0.05)
    dark_metal = mat("Portrait blackened lamellar", (0.008, 0.010, 0.009, 1), 0.42, 0.80, noise=24, bump=0.080)
    leather = mat("Portrait near-black oxblood leather", (0.018, 0.003, 0.002, 1), 0.58, noise=30, bump=0.075)
    red = mat("Portrait deep crimson", (0.30, 0.006, 0.003, 1), 0.48, noise=36, bump=0.12)
    black = hair_material()
    facial_black = facial_hair_material()
    warm_shadow = mat("Portrait facial crease", (0.18, 0.055, 0.030, 1), 0.84)

    tune_skin(body)
    tune_eyes()
    add_costume(body, green, green_shadow, gold, jade, dark_metal, leather, red)
    add_headcloth(body, head_green, green_shadow, gold, jade)
    add_head_hair(black)
    add_face_hair(black, warm_shadow, facial_black)
    # Add subdivision only after all fitted shells have been sampled from the
    # original topology, keeping their silhouette stable while the skin gains
    # a denser final render surface.
    add_render_subdivision(body)

    # Bust pedestal is outside camera crop but catches a natural lower shadow.
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.52, depth=0.05, location=(0, 0.03, 0.82))
    pedestal = bpy.context.object
    assign(pedestal, dark_metal)

    camera = setup_camera_and_lights()
    scene = bpy.context.scene
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Portrait World")
    scene.world.color = (0.003, 0.002, 0.0015)
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.28
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        scene.view_settings.look = "Medium High Contrast"

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    render(scene, camera, FRONT, (0, -2.08, 1.49), lens=105)
    render(scene, camera, THREE_QUARTER, (0.54, -2.02, 1.52), lens=105)
    render(
        scene,
        camera,
        FACE_DETAIL,
        (0.24, -1.44, 1.67),
        target=(0, -0.145, 1.645),
        lens=125,
    )
    render(
        scene,
        camera,
        DRAGON_DETAIL,
        (-0.54, -1.32, 1.56),
        target=(-0.335, -0.165, 1.455),
        lens=86,
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    print(f"BLEND={BLEND}")
    print(f"FRONT={FRONT}")
    print(f"THREE_QUARTER={THREE_QUARTER}")
    print(f"FACE_DETAIL={FACE_DETAIL}")
    print(f"DRAGON_DETAIL={DRAGON_DETAIL}")


if __name__ == "__main__":
    main()
