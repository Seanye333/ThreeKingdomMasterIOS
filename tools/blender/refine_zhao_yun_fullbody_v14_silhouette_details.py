"""Clear the spear from the crown and refine Zhao Yun's chest/knee focal details."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v13-grip-vambraces.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v14-silhouette-details.blend"


def hide_floating_rings():
    prefixes = (
        "ZhaoYun_V11_Sleeve_Gold_Cuff_",
        "ZhaoYun_V13_Vambrace_Upper_Gold_Rim_",
    )
    hidden = []
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes) and not obj.hide_render:
            obj.hide_render = True
            obj.hide_set(True)
            hidden.append(obj.name)
    return hidden


def rotate_spear_away_from_crown(rig):
    pivot = rig.matrix_world @ rig.pose.bones["hand_r"].head
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(8.0), 4, "Y")
        @ Matrix.Translation(-pivot)
    )
    moved = 0
    for obj in bpy.data.objects:
        if not obj.hide_render and ("Spear" in obj.name or "Tassel" in obj.name):
            obj.matrix_world = transform @ obj.matrix_world
            moved += 1
    return moved


def add_jade_boss(name, location, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def refine_focal_details():
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    gold = bpy.data.materials["ZY4_Antique_Gold"]
    created = []
    chest = add_jade_boss(
        "ZhaoYun_V14_Chest_Jade_Focal",
        (0.0, -0.206, 1.383),
        (0.026, 0.010, 0.032),
        jade,
    )
    created.append(chest.name)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.034,
        minor_radius=0.0030,
        major_segments=48,
        minor_segments=12,
        location=(0.0, -0.198, 1.383),
        rotation=(math.radians(90.0), 0.0, 0.0),
    )
    ring = bpy.context.object
    ring.name = "ZhaoYun_V14_Chest_Gold_Halo"
    ring.data.materials.append(gold)
    created.append(ring.name)
    for side, x in (("l", 0.165), ("r", -0.165)):
        inset = add_jade_boss(
            f"ZhaoYun_V14_Knee_Jade_{side}",
            (x, -0.183, 0.510),
            (0.016, 0.007, 0.019),
            jade,
        )
        created.append(inset.name)
    return created


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    hidden = hide_floating_rings()
    moved = rotate_spear_away_from_crown(rig)
    created = refine_focal_details()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_FLOATING_RINGS={hidden}")
    print(f"ROTATED_SPEAR_OBJECTS={moved}")
    print(f"CREATED={created}")


if __name__ == "__main__":
    main()
