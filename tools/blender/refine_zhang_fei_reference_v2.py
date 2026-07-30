"""Zhang Fei v2: integrated roar, pulled hair flow, coiled topknot and organic serpent blade."""

from __future__ import annotations

import math
import random
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, bevel, cylinder_between, look_at, mat, sphere, strand
from create_zhang_fei_reference_v1 import curve_bundle


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v1.blend"
OUTPUT_BLEND = SRC / "zhang-fei-reference-fullbody-v2.blend"
UPPER = SRC / "zhang-fei-reference-fullbody-v2-upper.png"
FACE = SRC / "zhang-fei-reference-fullbody-v2-face.png"
THREE_QUARTER = SRC / "zhang-fei-reference-fullbody-v2-three-quarter.png"


def remove_prefix(*prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def refine_face_shape():
    body = bpy.data.objects["Zhang_Fei_Basemesh"]
    if body.data.shape_keys:
        old = body.data.shape_keys.key_blocks.get("Zhang Fei v2 roaring structure")
        if old:
            body.shape_key_remove(old)
    key = body.shape_key_add(name="Zhang Fei v2 roaring structure", from_mix=True)
    for block in body.data.shape_keys.key_blocks:
        if block.name not in ("Basis", key.name):
            block.value = 0.0
    key.value = 1.0

    for point in key.data:
        co = point.co
        ax = abs(co.x)
        if co.y > -0.072 or ax > 0.145 or not 1.515 < co.z < 1.730:
            continue

        # Reinforce the broad cheek and jaw silhouette without touching eyes.
        if 0.046 < ax < 0.110 and 1.610 < co.z < 1.660:
            weight = max(0.0, 1.0 - abs(co.z - 1.638) / 0.028)
            co.x *= 1.025
            co.y -= 0.0010 * weight
        if 0.042 < ax < 0.116 and 1.525 < co.z < 1.602:
            weight = max(0.0, 1.0 - abs(co.z - 1.565) / 0.040)
            co.x *= 1.035
            co.y -= 0.0010 * weight

        # Recess the center of the inherited closed lips behind the new modeled
        # mouth cavity, while the lip corners push forward into a snarl.
        if ax < 0.032 and co.y < -0.135 and 1.566 < co.z < 1.592:
            center = 1.0 - ax / 0.032
            co.y += 0.0038 * center
            if co.z > 1.580:
                co.z += 0.0012 * center
            else:
                co.z -= 0.0020 * center
        if 0.030 < ax < 0.056 and 1.568 < co.z < 1.590:
            corner = max(0.0, 1.0 - abs(co.z - 1.579) / 0.012)
            co.y -= 0.0014 * corner
            co.z -= 0.0010 * corner


def build_integrated_roar():
    remove_prefix("ZhangFeiV2_Mouth_")
    cavity = bpy.data.materials.get("Zhang Fei mouth shadow") or mat(
        "Zhang Fei mouth shadow", (0.006, 0.0004, 0.00025, 1), 0.42
    )
    if cavity.use_nodes:
        shader = next((node for node in cavity.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Base Color"].default_value = (0.00025, 0.00004, 0.00002, 1)
            shader.inputs["Roughness"].default_value = 0.88
            shader.inputs["Specular IOR Level"].default_value = 0.12
    teeth = mat("Zhang Fei v2 dark aged teeth", (0.22, 0.135, 0.070, 1), 0.52, noise=12.0, bump=0.008)
    lip = mat("Zhang Fei v2 weathered lips", (0.105, 0.018, 0.010, 1), 0.50, noise=22.0, bump=0.009)
    wet = mat("Zhang Fei v2 mouth wetness", (0.14, 0.012, 0.007, 1), 0.16)

    sphere("ZhangFeiV2_Mouth_Cavity", (0.0, -0.1674, 1.5764), (0.0275, 0.0032, 0.0125), cavity, 56, 24)
    upper_lip = [
        (-0.0280, -0.1702, 1.5820),
        (-0.0140, -0.1718, 1.5840),
        (0.0000, -0.1724, 1.5825),
        (0.0140, -0.1718, 1.5840),
        (0.0280, -0.1702, 1.5820),
    ]
    lower_lip = [
        (-0.0270, -0.1700, 1.5742),
        (-0.0140, -0.1717, 1.5690),
        (0.0000, -0.1723, 1.5678),
        (0.0140, -0.1717, 1.5690),
        (0.0270, -0.1700, 1.5742),
    ]
    strand("ZhangFeiV2_Mouth_Upper_Lip", upper_lip, 0.00115, lip, taper=True)
    strand("ZhangFeiV2_Mouth_Lower_Lip", lower_lip, 0.00135, lip, taper=True)
    strand(
        "ZhangFeiV2_Mouth_Lower_Wetline",
        [(-0.021, -0.1720, 1.5748), (0.0, -0.1731, 1.5694), (0.021, -0.1720, 1.5748)],
        0.00028,
        wet,
        taper=True,
    )

    # Teeth remain lost in the deep shadow at this distance; exposing them as
    # separate geometry made the mouth read as a smile rather than a battle roar.


def refine_hair_and_topknot():
    deep = bpy.data.materials["Zhang Fei deep coarse hair"]
    oxblood = bpy.data.materials["Zhang Fei dried oxblood leather"]
    gold = bpy.data.materials["Zhang Fei aged beast gold"]
    if deep.use_nodes:
        shader = next((node for node in deep.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.74
            shader.inputs["Specular IOR Level"].default_value = 0.22

    remove_prefix("ZhangFei_Topknot_Core", "ZhangFei_Topknot_Fibers", "ZhangFeiV2_Hair_")

    # Flow lines follow the skull into the knot, turning the technical cap into
    # pulled coarse hair rather than a smooth helmet shell.
    rng = random.Random(2247)
    flow_paths = []
    for index in range(150):
        root_x = rng.uniform(-0.094, 0.094)
        side = abs(root_x) / 0.094
        root_z = rng.uniform(1.718, 1.750) + side * 0.012
        root_y = -0.166 + side * 0.030 + rng.uniform(-0.002, 0.002)
        end_x = root_x * rng.uniform(0.10, 0.32)
        path = [
            (root_x, root_y, root_z),
            (root_x * 0.84, -0.147 + side * 0.018, 1.760 + rng.uniform(-0.004, 0.004)),
            (root_x * 0.58, -0.110, 1.787 + rng.uniform(-0.004, 0.004)),
            (end_x, -0.062, 1.810 + rng.uniform(-0.003, 0.003)),
        ]
        flow_paths.append((path, rng.uniform(0.65, 1.20)))
    curve_bundle("ZhangFeiV2_Hair_Pulled_Flow", flow_paths, deep, 0.00053)

    # A solid irregular bun replaces the earlier ring silhouette. Fine coil
    # fibers below provide the wrapped-hair read without a visible central hole.
    sphere("ZhangFeiV2_Hair_Bun_Core", (0.006, -0.043, 1.842), (0.046, 0.022, 0.024), deep, 48, 24)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.031,
        minor_radius=0.0042,
        major_segments=48,
        minor_segments=12,
        location=(0.0, -0.039, 1.814),
    )
    tie = bpy.context.object
    tie.name = "ZhangFeiV2_Hair_Oxblood_Tie"
    tie.scale.y = 0.72
    assign(tie, oxblood)
    sphere("ZhangFeiV2_Hair_Tie_Gold_Stud", (0.0, -0.071, 1.814), (0.006, 0.003, 0.006), gold, 24, 12)

    coils = []
    for index in range(120):
        level = rng.uniform(-1.0, 1.0)
        half_width = 0.042 * math.sqrt(max(0.08, 1.0 - level * level))
        z = 1.842 + level * 0.022
        points = [
            (-half_width + 0.006, -0.064, z),
            (-half_width * 0.35 + 0.006, -0.067, z + rng.uniform(-0.003, 0.003)),
            (half_width * 0.35 + 0.006, -0.067, z + rng.uniform(-0.003, 0.003)),
            (half_width + 0.006, -0.064, z),
        ]
        coils.append((points, rng.uniform(0.65, 1.15)))
    curve_bundle("ZhangFeiV2_Hair_Bun_Coils", coils, deep, 0.00039)


def add_brow_and_face_details():
    deep = bpy.data.materials["Zhang Fei deep coarse hair"]
    crease = mat("Zhang Fei v2 facial crease", (0.035, 0.0045, 0.0025, 1), 0.61)
    for side in (-1, 1):
        # Lower inner brow anchor makes the expression read as a challenge, not
        # uncertainty, while preserving the individual v1 eyebrow fibers.
        strand(
            f"ZhangFeiV2_Brow_Anchor_{side:+d}",
            [
                (side * 0.012, -0.1764, 1.6870),
                (side * 0.029, -0.1775, 1.6938),
                (side * 0.052, -0.1750, 1.7005),
                (side * 0.075, -0.1680, 1.7030),
            ],
            0.00105,
            deep,
            taper=True,
        )
        strand(
            f"ZhangFeiV2_Cheek_Scar_{side:+d}",
            [
                (side * 0.061, -0.1680, 1.640),
                (side * 0.070, -0.1668, 1.629),
                (side * 0.076, -0.1635, 1.617),
            ],
            0.00022,
            crease,
            taper=True,
        )


def build_fur_neck_mass():
    remove_prefix("ZhangFeiV2_Fur_")
    deep = bpy.data.materials["Zhang Fei deep coarse hair"]
    rng = random.Random(2291)
    paths = []
    for index in range(420):
        x = rng.uniform(-0.245, 0.245)
        normalized = abs(x) / 0.245
        root = (x, -0.080 - (1.0 - normalized) * 0.035, 1.455 - normalized * 0.025)
        length = rng.uniform(0.025, 0.070)
        direction = -1 if x < 0 else 1
        tip = (
            x + direction * rng.uniform(0.002, 0.018),
            root[1] - rng.uniform(0.004, 0.016),
            root[2] - length,
        )
        paths.append(
            (
                [
                    root,
                    ((root[0] + tip[0]) * 0.5, root[1] - 0.010, (root[2] + tip[2]) * 0.5),
                    tip,
                ],
                rng.uniform(0.55, 1.20),
            )
        )
    curve_bundle("ZhangFeiV2_Fur_Shoulder_Collar", paths, deep, 0.00042)


def rebuild_serpent_blade():
    remove_prefix("ZhangFei_EightSpan_Serpent_Blade", "ZhangFei_Serpent_Blade_Gold_Ridge_")
    steel = bpy.data.materials["Zhang Fei serpent spear steel"]
    gold = bpy.data.materials["Zhang Fei aged beast gold"]
    path = [
        (-0.458, 1.975, 0.015),
        (-0.468, 2.020, 0.027),
        (-0.448, 2.070, 0.036),
        (-0.474, 2.120, 0.035),
        (-0.451, 2.173, 0.030),
        (-0.469, 2.226, 0.021),
        (-0.456, 2.284, 0.002),
    ]
    depth = 0.008
    verts = []
    for y in (-0.200 - depth, -0.200 + depth):
        for x, z, width in path:
            verts.extend(((x - width, y, z), (x + width, y, z)))
    count = len(path)
    faces = []
    for layer in (0, 1):
        base = layer * count * 2
        for index in range(count - 1):
            a = base + index * 2
            faces.append((a, a + 1, a + 3, a + 2) if layer == 0 else (a + 2, a + 3, a + 1, a))
    for index in range(count - 1):
        front = index * 2
        back = count * 2 + index * 2
        faces.append((front, front + 2, back + 2, back))
        faces.append((front + 1, back + 1, back + 3, front + 3))
    mesh = bpy.data.meshes.new("ZhangFeiV2_Serpent_Blade_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    blade = bpy.data.objects.new("ZhangFeiV2_EightSpan_Serpent_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    assign(blade, steel)
    bevel(blade, 0.0026, 3)
    centerline = [(x, -0.210, z) for x, z, _ in path]
    for index in range(len(centerline) - 1):
        cylinder_between(
            f"ZhangFeiV2_Serpent_Gold_Ridge_{index}",
            centerline[index],
            centerline[index + 1],
            0.0025,
            gold,
            20,
        )


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
    refine_face_shape()
    build_integrated_roar()
    refine_hair_and_topknot()
    add_brow_and_face_details()
    build_fur_neck_mass()
    rebuild_serpent_blade()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.34), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.64), (0.0, -0.095, 1.56), 96)
    render(scene, camera, THREE_QUARTER, (1100, 1100), (0.92, -2.36, 1.66), (0.0, -0.08, 1.55), 94)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER={THREE_QUARTER}")


if __name__ == "__main__":
    main()
