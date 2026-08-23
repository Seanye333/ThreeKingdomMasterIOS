"""Identify visible objects occupying suspicious screen regions in Zhao Yun v9."""

from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-fullbody-v9-clear-face.blend"


def projected_bounds(scene, camera, obj):
    points = [world_to_camera_view(scene, camera, obj.matrix_world @ Vector(corner)) for corner in obj.bound_box]
    return (
        min(point.x for point in points),
        max(point.x for point in points),
        min(point.y for point in points),
        max(point.y for point in points),
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    camera = scene.camera
    for obj in sorted(bpy.data.objects, key=lambda item: item.name):
        if obj.hide_render or obj.type not in {"MESH", "CURVE"}:
            continue
        bounds = projected_bounds(scene, camera, obj)
        x0, x1, y0, y1 = bounds
        hits_left_shoulder = x0 < 0.43 and x1 > 0.02 and y0 < 0.78 and y1 > 0.49
        if not hits_left_shoulder:
            continue
        materials = [material.name for material in getattr(obj.data, "materials", ()) if material]
        print(
            f"{obj.name}|type={obj.type}|screen={tuple(round(value, 3) for value in bounds)}|"
            f"dims={tuple(round(value, 3) for value in obj.dimensions)}|materials={materials}"
        )


if __name__ == "__main__":
    main()
