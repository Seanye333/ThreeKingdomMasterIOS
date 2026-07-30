"""Build the first Blender-authored Guan Yu duel character.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background --factory-startup --python tools/blender/create_guan_yu.py

The script imports the existing Mixamo X Bot solely for its compatible
armature, replaces the visible robot surfaces with a lightweight late-Han
character, saves an editable .blend source, renders a preview, and exports GLB.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
DUEL_DIR = ROOT / "public" / "models" / "duel"
SRC_DIR = DUEL_DIR / "_src"
FBX_PATH = DUEL_DIR / "X Bot.fbx"
BLEND_PATH = SRC_DIR / "guan-yu.blend"
PREVIEW_PATH = SRC_DIR / "guan-yu-blender-preview.png"
GLB_PATH = DUEL_DIR / "guan-yu.glb"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def principled(
    name: str,
    base: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    noise_scale: float | None = None,
    bump_strength: float = 0.12,
    subsurface: float = 0.0,
) -> bpy.types.Material:
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    links = m.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = subsurface
    if noise_scale:
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = noise_scale
        noise.inputs["Detail"].default_value = 5.0
        noise.inputs["Roughness"].default_value = 0.72
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.08
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def smooth(obj: bpy.types.Object, bevel: float = 0.0, subdivision: int = 0) -> bpy.types.Object:
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True
        if bevel:
            mod = obj.modifiers.new("Micro bevel", "BEVEL")
            mod.width = bevel
            mod.segments = 2
        if subdivision:
            mod = obj.modifiers.new("Subdivision", "SUBSURF")
            mod.levels = subdivision
            mod.render_levels = subdivision
    return obj


def materialize(obj: bpy.types.Object, material: bpy.types.Material) -> bpy.types.Object:
    obj.data.materials.append(material)
    return obj


def uv_sphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    segments: int = 40,
    rings: int = 24,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj, subdivision=1)
    return materialize(obj, material)


def cube(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    rotation: tuple[float, float, float] = (0, 0, 0),
    bevel: float = 0.01,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj, bevel=bevel)
    return materialize(obj, material)


def cone(
    name: str,
    location: tuple[float, float, float],
    radius_bottom: float,
    radius_top: float,
    depth: float,
    material: bpy.types.Material,
    rotation: tuple[float, float, float] = (math.pi / 2, 0, 0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=40,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    smooth(obj, bevel=0.008)
    return materialize(obj, material)


def cylinder_between(
    name: str,
    a: Vector,
    b: Vector,
    radius: float,
    material: bpy.types.Material,
    vertices: int = 24,
) -> bpy.types.Object:
    mid = (a + b) * 0.5
    delta = b - a
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=delta.length,
        location=mid,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    smooth(obj, bevel=0.006)
    return materialize(obj, material)


def curve_strand(
    name: str,
    points: list[tuple[float, float, float]],
    radius: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 3
    data.bevel_depth = radius
    data.bevel_resolution = 3
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = "AUTO"
        p.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return materialize(obj, material)


def skin_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> bpy.types.Object:
    # Curves (beard/headcloth ties) must become meshes before vertex weighting.
    if obj.type == "CURVE":
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target="MESH")
        obj = bpy.context.object
        obj.select_set(False)
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()
    obj.matrix_world = world
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    modifier = obj.modifiers.new("Mixamo armature", "ARMATURE")
    modifier.object = armature
    return obj


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def main() -> None:
    SRC_DIR.mkdir(parents=True, exist_ok=True)
    clear_scene()

    bpy.ops.import_scene.fbx(filepath=str(FBX_PATH))
    armatures = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    if not armatures:
        raise RuntimeError("Mixamo armature was not found in X Bot.fbx")
    arm = armatures[0]
    arm.name = "GuanYu_Rig"
    arm.animation_data_clear()
    for pose_bone in arm.pose.bones:
        pose_bone.matrix_basis = Matrix.Identity(4)

    # Match the colon-free names emitted by Three.js FBXLoader animation clips.
    for bone in arm.data.bones:
        bone.name = bone.name.replace("mixamorig:", "mixamorig")

    # Remove only the visible robot; the compatible armature is retained.
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH" and obj.name.startswith(("Beta_Surface", "Beta_Joints")):
            bpy.data.objects.remove(obj, do_unlink=True)

    skin = principled("Skin_Red_Warm", (0.42, 0.115, 0.065, 1), 0.48, noise_scale=28, bump_strength=0.08, subsurface=0.09)
    skin_dark = principled("Skin_Shadow", (0.19, 0.045, 0.025, 1), 0.56, noise_scale=35, bump_strength=0.06)
    eye = principled("Eye_White", (0.62, 0.57, 0.49, 1), 0.24)
    iris = principled("Iris", (0.018, 0.012, 0.008, 1), 0.15)
    hair = principled("Hair_Black", (0.006, 0.004, 0.003, 1), 0.36, noise_scale=75, bump_strength=0.22)
    green = principled("Jade_Green_Cloth", (0.018, 0.19, 0.095, 1), 0.78, noise_scale=42, bump_strength=0.2)
    green_dark = principled("Deep_Green_Cloth", (0.006, 0.055, 0.032, 1), 0.84, noise_scale=50, bump_strength=0.24)
    bronze = principled("Aged_Bronze", (0.22, 0.095, 0.018, 1), 0.32, 0.82, noise_scale=18, bump_strength=0.2)
    gold = principled("Antique_Gold", (0.48, 0.235, 0.045, 1), 0.26, 0.88, noise_scale=22, bump_strength=0.12)
    iron = principled("Blackened_Iron", (0.035, 0.045, 0.04, 1), 0.3, 0.74, noise_scale=24, bump_strength=0.28)
    leather = principled("Dark_Leather", (0.055, 0.018, 0.008, 1), 0.76, noise_scale=38, bump_strength=0.3)
    red = principled("Red_Cord", (0.32, 0.015, 0.008, 1), 0.66, noise_scale=50, bump_strength=0.15)
    steel = principled("Blade_Steel", (0.34, 0.39, 0.41, 1), 0.16, 0.92, noise_scale=60, bump_strength=0.06)

    created: list[tuple[bpy.types.Object, str]] = []

    def add(obj: bpy.types.Object, bone: str) -> bpy.types.Object:
        created.append((obj, bone))
        return obj

    # Face: sculpt-like layered forms rather than a flat image.
    add(uv_sphere("Head", (0, 1.69, 0.012), (0.089, 0.116, 0.083), skin), "mixamorigHead")
    add(uv_sphere("Jaw", (0, 1.63, 0.03), (0.075, 0.055, 0.07), skin_dark), "mixamorigHead")
    add(uv_sphere("Nose", (0, 1.685, 0.086), (0.018, 0.038, 0.026), skin_dark, 28, 16), "mixamorigHead")
    for side in (-1, 1):
        add(uv_sphere(f"Ear_{side}", (side * 0.086, 1.69, 0.008), (0.018, 0.032, 0.012), skin_dark, 24, 14), "mixamorigHead")
        add(uv_sphere(f"Eye_{side}", (side * 0.034, 1.718, 0.083), (0.025, 0.012, 0.009), eye, 24, 14), "mixamorigHead")
        add(uv_sphere(f"Iris_{side}", (side * 0.034, 1.718, 0.091), (0.008, 0.008, 0.004), iris, 20, 12), "mixamorigHead")
        add(cube(f"Brow_{side}", (side * 0.034, 1.748, 0.088), (0.035, 0.006, 0.007), hair, rotation=(0, side * -0.12, side * -0.13), bevel=0.004), "mixamorigHead")

    # Moustache, five long beard masses, and fine outer strands.
    for side in (-1, 1):
        add(curve_strand(
            f"Moustache_{side}",
            [(side * 0.006, 1.654, 0.091), (side * 0.035, 1.645, 0.095), (side * 0.07, 1.63, 0.082)],
            0.009,
            hair,
        ), "mixamorigHead")
    for i, x in enumerate((-0.045, -0.022, 0, 0.022, 0.045)):
        length = 0.49 - abs(x) * 2.6
        add(curve_strand(
            f"Beard_Main_{i}",
            [(x * 0.45, 1.63, 0.072), (x, 1.47, 0.08), (x * 0.8, 1.63 - length, 0.045)],
            0.019 if i == 2 else 0.015,
            hair,
        ), "mixamorigHead")
    for i in range(18):
        x = -0.062 + (i / 17) * 0.124
        wave = math.sin(i * 1.7) * 0.012
        add(curve_strand(
            f"Beard_Fine_{i:02}",
            [(x * 0.55, 1.64, 0.084), (x + wave, 1.43, 0.088), (x * 0.85 - wave, 1.18 + (i % 3) * 0.018, 0.042)],
            0.0045,
            hair,
        ), "mixamorigHead")

    # Headcloth and ties.
    add(uv_sphere("Green_Headcloth", (0, 1.78, -0.003), (0.096, 0.074, 0.09), green, 36, 20), "mixamorigHead")
    add(cube("Gold_Brow_Band", (0, 1.755, 0.075), (0.091, 0.012, 0.009), gold, bevel=0.006), "mixamorigHead")
    for side in (-1, 1):
        add(curve_strand(
            f"Headcloth_Tie_{side}",
            [(side * 0.045, 1.76, -0.06), (side * 0.065, 1.58, -0.09), (side * 0.045, 1.35, -0.075)],
            0.018,
            green_dark,
        ), "mixamorigHead")

    # Torso, chest armour, shoulder guards.
    add(uv_sphere("Torso_Robe", (0, 1.245, 0), (0.205, 0.285, 0.135), green_dark), "mixamorigSpine1")
    add(cube("Chest_Armour", (0, 1.34, 0.07), (0.205, 0.225, 0.055), iron, bevel=0.025), "mixamorigSpine1")
    for row in range(6):
        for col in range(-4, 5):
            px = col * 0.041 + (row % 2) * 0.02
            if abs(px) > 0.185:
                continue
            add(cube(
                f"Lamella_{row}_{col}",
                (px, 1.50 - row * 0.068, 0.137),
                (0.018, 0.03, 0.007),
                bronze if (row + col) % 2 else gold,
                rotation=(-0.08, 0, 0),
                bevel=0.004,
            ), "mixamorigSpine1")
    for side in (-1, 1):
        add(uv_sphere(
            f"Pauldron_{side}",
            (side * 0.255, 1.47, 0.012),
            (0.18, 0.095, 0.145),
            bronze,
            36,
            20,
        ), "mixamorigSpine2")
        for tier in range(3):
            add(cube(
                f"Shoulder_Plate_{side}_{tier}",
                (side * (0.245 + tier * 0.022), 1.46 - tier * 0.054, 0.095),
                (0.12, 0.032, 0.026),
                gold if tier == 0 else iron,
                rotation=(0.08, side * -0.12, side * 0.18),
                bevel=0.009,
            ), "mixamorigSpine2")

    # Waist, robe skirt, side tassets.
    add(cone("Long_Green_Robe", (0, 0.82, 0), 0.32, 0.19, 0.82, green), "mixamorigHips")
    add(cube("Belt", (0, 1.02, 0.035), (0.23, 0.045, 0.085), leather, bevel=0.018), "mixamorigHips")
    add(uv_sphere("Belt_Medallion", (0, 1.02, 0.13), (0.072, 0.072, 0.022), gold, 36, 18), "mixamorigHips")
    for side in (-1, 1):
        add(cube(f"Red_Waist_Cord_{side}", (side * 0.115, 0.98, 0.12), (0.025, 0.18, 0.018), red, rotation=(0.08, 0, side * 0.12), bevel=0.009), "mixamorigHips")
        add(cube(f"Tasset_{side}", (side * 0.22, 0.79, 0.085), (0.105, 0.28, 0.035), iron, rotation=(0.05, 0, side * 0.04), bevel=0.016), "mixamorigHips")
        for row in range(6):
            for col in (-1, 0, 1):
                add(cube(
                    f"Tasset_Lamella_{side}_{row}_{col}",
                    (side * 0.22 + col * 0.052, 0.99 - row * 0.08, 0.129),
                    (0.022, 0.035, 0.007),
                    bronze,
                    bevel=0.004,
                ), "mixamorigHips")

    # Limbs follow the exact imported Mixamo bones.
    limb_specs = [
        ("mixamorigRightArm", green, 0.075),
        ("mixamorigLeftArm", green, 0.075),
        ("mixamorigRightForeArm", iron, 0.082),
        ("mixamorigLeftForeArm", iron, 0.082),
        ("mixamorigRightUpLeg", green_dark, 0.105),
        ("mixamorigLeftUpLeg", green_dark, 0.105),
        ("mixamorigRightLeg", iron, 0.095),
        ("mixamorigLeftLeg", iron, 0.095),
    ]
    for bone_name, material, radius in limb_specs:
        bone = arm.data.bones[bone_name]
        a = arm.matrix_world @ bone.head_local
        b = arm.matrix_world @ bone.tail_local
        add(cylinder_between(f"{bone_name}_Body", a, b, radius, material), bone_name)
    for side in ("Right", "Left"):
        hand_bone = f"mixamorig{side}Hand"
        foot_bone = f"mixamorig{side}Foot"
        hand = arm.matrix_world @ arm.data.bones[hand_bone].head_local
        foot = arm.matrix_world @ arm.data.bones[foot_bone].head_local
        add(uv_sphere(f"{side}_Hand", tuple(hand), (0.055, 0.07, 0.045), skin, 28, 16), hand_bone)
        add(cube(f"{side}_Boot", tuple(foot + Vector((0, 0.015, 0.06))), (0.085, 0.07, 0.15), leather, bevel=0.02), foot_bone)

    # Green Dragon Crescent Blade, parented to the right hand.
    pole_a = Vector((-0.70, 0.10, 0.34))
    pole_b = Vector((-0.70, 2.35, 0.34))
    add(cylinder_between("Green_Dragon_Pole", pole_a, pole_b, 0.026, leather, 32), "mixamorigRightHand")
    blade_points = [
        (-0.70, 2.13, 0.34),
        (-0.58, 2.20, 0.34),
        (-0.47, 2.34, 0.34),
        (-0.44, 2.55, 0.34),
        (-0.58, 2.47, 0.34),
        (-0.69, 2.39, 0.34),
    ]
    mesh = bpy.data.meshes.new("Crescent_Blade_Mesh")
    verts = []
    thickness = 0.018
    for zoff in (-thickness, thickness):
        verts.extend([(x, y, z + zoff) for x, y, z in blade_points])
    n = len(blade_points)
    faces = [tuple(range(n)), tuple(range(n, n * 2))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    mesh.from_pydata(verts, [], faces)
    blade = bpy.data.objects.new("Green_Dragon_Crescent_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    smooth(blade, bevel=0.012)
    materialize(blade, steel)
    add(blade, "mixamorigRightHand")
    add(uv_sphere("Dragon_Blade_Collar", (-0.70, 2.12, 0.34), (0.07, 0.09, 0.045), gold, 32, 18), "mixamorigRightHand")
    add(curve_strand("Blade_Red_Tassel", [(-0.70, 2.14, 0.34), (-0.78, 1.98, 0.35), (-0.74, 1.82, 0.32)], 0.012, red), "mixamorigRightHand")

    # Studio floor.
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, -0.02, 0), rotation=(math.pi / 2, 0, 0))
    floor = bpy.context.object
    floor.name = "Studio_Floor"
    materialize(floor, principled("Floor", (0.018, 0.015, 0.012, 1), 0.72, noise_scale=12, bump_strength=0.16))

    # Camera and cinematic three-point lighting.
    bpy.ops.object.camera_add(location=(0, 1.25, 6.4), rotation=(0, 0, 0))
    camera = bpy.context.object
    camera.name = "GuanYu_Preview_Camera"
    camera.data.lens = 67
    bpy.context.scene.camera = camera

    world = bpy.context.scene.world
    world.color = (0.004, 0.003, 0.002)
    for name, location, energy, color, size in [
        ("Key", (3.2, 4.2, 4.4), 1500, (1.0, 0.57, 0.28), 3.0),
        ("Fill", (-3.4, 2.7, 2.8), 900, (0.22, 0.38, 0.62), 3.5),
        ("Rim", (-1.3, 4.5, -3.5), 1700, (1.0, 0.35, 0.12), 2.0),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, (0, 1.1, 0))

    # Render + colour management.
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.render.render(write_still=True)

    # Keep the authored Blender file and beauty preview in the intact rest pose.
    # Skin a copy in memory only for the web GLB export; this isolates binding
    # problems from the visual review of the character itself.
    skinned: list[tuple[bpy.types.Object, str]] = []
    for obj, bone_name in created:
        skinned.append((skin_to_bone(obj, arm, bone_name), bone_name))
    created = skinned

    # Export only the character and armature, not the preview studio.
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    for obj, _ in created:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_apply=True,
    )

    print(f"BLEND={BLEND_PATH}")
    print(f"PREVIEW={PREVIEW_PATH}")
    print(f"GLB={GLB_PATH}")


if __name__ == "__main__":
    main()
