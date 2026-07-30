"""Guan Yu v39: stern facial planes, eye finish and enlarged dragon pauldron relief."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at, mat, strand


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v38.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v39.blend"
FRONT = SRC / "guan-yu-reference-fullbody-v39-front.png"
UPPER = SRC / "guan-yu-reference-fullbody-v39-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v39-face.png"
DRAGON = SRC / "guan-yu-reference-fullbody-v39-dragon-pauldron.png"


def remove_prefix(prefix):
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefix):
            bpy.data.objects.remove(obj, do_unlink=True)


def sculpt_stern_face():
    body = bpy.data.objects["Guan_Yu_Basemesh"]
    existing = body.data.shape_keys and body.data.shape_keys.key_blocks.get("V39 stern commander face")
    if existing:
        body.shape_key_remove(existing)
    key = body.shape_key_add(name="V39 stern commander face", from_mix=False)
    key.value = 1.0

    for point in key.data:
        co = point.co
        if co.y > -0.070 or abs(co.x) > 0.136 or not 1.525 < co.z < 1.728:
            continue
        ax = abs(co.x)

        # Flatten the temples, lift the zygomatic plane and carve the lower cheek.
        if 0.084 < ax < 0.124 and 1.656 < co.z < 1.704:
            co.y += 0.0021 * max(0.0, 1.0 - abs(co.z - 1.680) / 0.025)
        if 0.047 < ax < 0.103 and 1.632 < co.z < 1.670:
            co.y -= 0.0028 * max(0.0, 1.0 - abs(co.z - 1.651) / 0.019)
        if 0.044 < ax < 0.101 and 1.594 < co.z < 1.632:
            co.y += 0.0030 * max(0.0, 1.0 - abs(co.z - 1.613) / 0.019)

        # Heavier sloping brow with a pinched glabella produces the Guan Yu stare.
        if 0.012 < ax < 0.105 and 1.690 < co.z < 1.719:
            shelf = max(0.0, 1.0 - abs(co.z - 1.704) / 0.015)
            co.y -= 0.0028 * shelf
            co.z += 0.0008 * shelf * min(1.0, ax / 0.080)
        if 0.005 < ax < 0.024 and 1.674 < co.z < 1.713:
            co.y += 0.0020 * (1.0 - ax / 0.024)
            co.z -= 0.0011 * (1.0 - ax / 0.024)

        # Compress the palpebral opening while leaving a small asymmetric squint.
        for eye_center in (-0.047, 0.047):
            dx = abs(co.x - eye_center)
            if dx >= 0.040:
                continue
            horizontal = 1.0 - dx / 0.040
            if 1.674 < co.z < 1.697:
                co.z -= 0.0032 * horizontal
            if 1.651 < co.z < 1.673:
                co.z += 0.0018 * horizontal
            if eye_center > 0 and 1.657 < co.z < 1.692:
                co.z -= 0.00035

        # Broader straight bridge, decisive tip and mature alar groove.
        if ax < 0.025 and 1.620 < co.z < 1.690:
            co.y -= 0.0026 * (1.0 - ax / 0.025)
        if ax < 0.022 and 1.596 < co.z < 1.625:
            co.y -= 0.0030 * max(0.0, 1.0 - abs(co.z - 1.611) / 0.016)
        if 0.021 < ax < 0.049 and 1.592 < co.z < 1.620:
            co.x *= 1.035
        if 0.031 < ax < 0.051 and 1.585 < co.z < 1.615:
            co.y += 0.0013

        # Compress the mouth and widen the mandibular angle behind the beard.
        if ax < 0.034 and 1.568 < co.z < 1.592:
            co.y += 0.0007
        if 0.031 < ax < 0.069 and 1.567 < co.z < 1.598:
            co.z -= 0.0016
        if 0.052 < ax < 0.112 and 1.532 < co.z < 1.589:
            co.x *= 1.044
            co.y -= 0.0009


def tune_eyes_and_creases():
    remove_prefix("V39_Face_")
    deep = bpy.data.materials.get("V31 natural deep black hair")
    crease = bpy.data.materials.get("Portrait facial crease")
    if not crease:
        crease = mat("V39 warm facial crease", (0.055, 0.012, 0.006, 1), 0.72)
    waterline = mat("V39 restrained eye waterline", (0.13, 0.025, 0.018, 1), 0.48)
    eye_mesh = bpy.data.objects.get("Guan_Yu_Basemesh.low-poly")
    if eye_mesh and eye_mesh.type == "MESH":
        for vertex in eye_mesh.data.vertices:
            co = vertex.co
            for eye_center in (-0.047, 0.047):
                if abs(co.x - eye_center) < 0.035 and 1.638 < co.z < 1.707:
                    co.z = 1.674 + (co.z - 1.674) * 0.94
        eye_mesh.data.update()

    for obj in bpy.data.objects:
        if obj.name.startswith("Portrait_Brow_") or obj.name.startswith("V32_Brow_Density_"):
            if obj.type == "CURVE":
                obj.data.bevel_depth *= 1.08
        elif obj.name.startswith("V34_Upper_Lid_") and obj.type == "CURVE":
            obj.data.bevel_depth *= 1.20

    for side in (-1, 1):
        # Fine lower eyelid waterline and a second mature under-eye fold.
        strand(
            f"V39_Face_Waterline_{side:+d}",
            [
                (side * 0.018, -0.1730, 1.6650),
                (side * 0.040, -0.1750, 1.6615),
                (side * 0.061, -0.1738, 1.6625),
                (side * 0.076, -0.1700, 1.6660),
            ],
            0.00025,
            waterline,
            taper=True,
        )
        strand(
            f"V39_Face_UnderEye_Crease_{side:+d}",
            [
                (side * 0.028, -0.1718, 1.6500),
                (side * 0.049, -0.1730, 1.6460),
                (side * 0.071, -0.1700, 1.6480),
            ],
            0.00023,
            crease,
            taper=True,
        )
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.scale.z *= 0.90
            iris.scale.x *= 1.02
        if pupil:
            pupil.scale.z *= 0.90

    if deep:
        for side in (-1, 1):
            strand(
                f"V39_Face_Brow_Anchor_{side:+d}",
                [
                    (side * 0.013, -0.1715, 1.704),
                    (side * 0.037, -0.1760, 1.710),
                    (side * 0.065, -0.1745, 1.708),
                    (side * 0.087, -0.1680, 1.700),
                ],
                0.00055,
                deep,
                taper=True,
            )


def tune_skin_and_headcloth():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if material and material.use_nodes:
        shader = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.57
            shader.inputs["Subsurface Weight"].default_value = 0.014
            if "Subsurface Scale" in shader.inputs:
                shader.inputs["Subsurface Scale"].default_value = 0.016
            shader.inputs["Specular IOR Level"].default_value = 0.29
        pore_bump = material.node_tree.nodes.get("Micro pore normal")
        if pore_bump:
            pore_bump.inputs["Strength"].default_value = 0.17
            pore_bump.inputs["Distance"].default_value = 0.00075

    pore_displace = bpy.data.objects["Guan_Yu_Basemesh"].modifiers.get("V32 physical facial pores")
    if pore_displace:
        pore_displace.strength = 0.00058

    headcloth = bpy.data.materials.get("V34 dark jade woven headcloth")
    if headcloth and headcloth.use_nodes:
        ramp = next((node for node in headcloth.node_tree.nodes if node.type == "VALTORGB"), None)
        shader = next((node for node in headcloth.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if ramp:
            ramp.color_ramp.elements[0].color = (0.0010, 0.012, 0.0030, 1)
            ramp.color_ramp.elements[1].color = (0.0040, 0.040, 0.0100, 1)
        if shader:
            shader.inputs["Roughness"].default_value = 0.76


def enlarge_dragon_relief():
    center = Vector((-0.335, -0.194, 1.478))
    scale = 1.18
    transform = Matrix.Translation(center) @ Matrix.Scale(scale, 4) @ Matrix.Translation(-center)
    tokens = (
        "Sculpted_Dragon_Head_-1",
        "Dragon_Gold_Eye_Socket_-1",
        "Dragon_Jade_Eye_-1",
        "Dragon_Black_Pupil_-1",
        "Dragon_Heavy_Brow_-1",
        "Dragon_Carved_Nostril_-1",
        "Dragon_Carved_Mouth_-1",
        "Dragon_Ivory_Fang_-1_",
        "Dragon_Curved_Horn_-1_",
        "Dragon_Horn_Branch_-1_",
        "Dragon_Forehead_Flame_-1",
        "Dragon_Swept_Ear_-1",
        "Dragon_Mane_Leaf_-1_",
        "Dragon_Cheek_Scale_-1_",
        "Dragon_Whisker_-1_",
    )
    for obj in bpy.data.objects:
        if any(obj.name.startswith(token) for token in tokens):
            obj.matrix_world = transform @ obj.matrix_world
            if obj.type == "CURVE":
                obj.data.bevel_depth *= 1.06


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
    sculpt_stern_face()
    tune_eyes_and_creases()
    tune_skin_and_headcloth()
    enlarge_dragon_relief()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, FRONT, (1000, 1450), (-0.10, -6.45, 1.16), (-0.05, -0.03, 1.13), 72)
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.31), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98)
    render(scene, camera, DRAGON, (1000, 1000), (-1.14, -2.55, 1.52), (-0.32, -0.12, 1.43), 92)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"FRONT={FRONT}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"DRAGON={DRAGON}")


if __name__ == "__main__":
    main()
