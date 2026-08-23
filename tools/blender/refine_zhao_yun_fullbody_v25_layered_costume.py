"""Refine Zhao Yun's skirt drape, cloth palette, and waist focal detail."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v24-armored-gloves.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v25-layered-costume.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position


SKIRT_WARP = {
    "Left_Inner": (-0.010, -0.006, 0.015, 0.90),
    "Right_Inner": (0.006, -0.010, 0.000, 0.90),
    "Left_Outer": (-0.025, 0.003, 0.030, 0.86),
    "Right_Outer": (0.020, -0.004, 0.015, 0.87),
}


def world_bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        min(point.z for point in points),
        max(point.z for point in points),
        sum(point.x for point in points) / len(points),
    )


def warp_world_point(point, bottom_z, top_z, top_x, settings):
    x_shift, y_shift, bottom_lift, bottom_width = settings
    span = max(1e-6, top_z - bottom_z)
    t = max(0.0, min(1.0, (top_z - point.z) / span))
    smooth_t = t * t * (3.0 - 2.0 * t)
    width = 1.0 + (bottom_width - 1.0) * smooth_t
    return Vector(
        (
            top_x + (point.x - top_x) * width + x_shift * smooth_t,
            point.y + y_shift * smooth_t,
            point.z + bottom_lift * smooth_t,
        )
    )


def warp_object(obj, bounds, settings):
    bottom_z, top_z, top_x = bounds
    inverse = obj.matrix_world.inverted()
    if obj.type == "MESH":
        for vertex in obj.data.vertices:
            world = obj.matrix_world @ vertex.co
            vertex.co = inverse @ warp_world_point(world, bottom_z, top_z, top_x, settings)
        obj.data.update()
    elif obj.type == "CURVE":
        for spline in obj.data.splines:
            for point in spline.bezier_points:
                point.co = inverse @ warp_world_point(
                    obj.matrix_world @ point.co,
                    bottom_z,
                    top_z,
                    top_x,
                    settings,
                )
                point.handle_left = inverse @ warp_world_point(
                    obj.matrix_world @ point.handle_left,
                    bottom_z,
                    top_z,
                    top_x,
                    settings,
                )
                point.handle_right = inverse @ warp_world_point(
                    obj.matrix_world @ point.handle_right,
                    bottom_z,
                    top_z,
                    top_x,
                    settings,
                )
            for point in spline.points:
                world = obj.matrix_world @ point.co.xyz
                warped = inverse @ warp_world_point(world, bottom_z, top_z, top_x, settings)
                point.co = (*warped, point.co.w)


def reshape_skirt():
    changed = []
    for panel_name, settings in SKIRT_WARP.items():
        panel = bpy.data.objects[f"ZhaoYun_V16_Layered_Battle_Skirt_{panel_name}"]
        trim = bpy.data.objects[f"ZhaoYun_V16_Skirt_Gold_Trim_{panel_name}"]
        bounds = world_bounds(panel)
        warp_object(panel, bounds, settings)
        warp_object(trim, bounds, settings)
        changed.extend((panel.name, trim.name))
    return changed


def set_principled(name, color, roughness):
    material = bpy.data.materials.get(name)
    if not material or not material.use_nodes:
        return False
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return False
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return True


def refine_cloth_materials():
    settings = {
        "ZY6_Pleated_Ivory_Silk": ((0.22, 0.30, 0.43), 0.62),
        "ZY16_Shadowed_Ivory_Silk": ((0.07, 0.12, 0.21), 0.68),
        "ZY4_Deep_Navy_Cloth": ((0.012, 0.035, 0.080), 0.69),
        "ZY17_Cape_Slate_Blue": ((0.025, 0.060, 0.130), 0.68),
    }
    return [name for name, values in settings.items() if set_principled(name, *values)]


def add_waist_jade():
    jade = bpy.data.materials["ZY2_Armor_Jade"]
    inset = base.add_ellipsoid(
        "ZhaoYun_V25_Waist_Jade_Inset",
        (0.0, -0.186, 1.075),
        (0.0125, 0.0060, 0.0125),
        jade,
        40,
        20,
    )
    return inset.name


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    skirt = reshape_skirt()
    materials = refine_cloth_materials()
    waist_jade = add_waist_jade()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"RESHAPED_SKIRT_OBJECTS={skirt}")
    print(f"CHANGED_MATERIALS={materials}")
    print(f"WAIST_JADE={waist_jade}")


if __name__ == "__main__":
    main()
