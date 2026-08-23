"""Measure whether the full-body rig changed the accepted V33 face geometry."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-fullbody-v2-clean-hair.blend"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    for modifier in body.modifiers:
        modifier.show_viewport = modifier.type == "ARMATURE"
    bpy.context.view_layer.update()
    evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    head_index = body.vertex_groups["head"].index
    distances = []
    for source, posed in zip(body.data.vertices, mesh.vertices):
        head_weight = next(
            (assignment.weight for assignment in source.groups if assignment.group == head_index),
            0.0,
        )
        if head_weight >= 0.5:
            distances.append((source.co - posed.co).length)
    print(f"HEAD_VERTEX_COUNT={len(distances)}")
    print(f"HEAD_MAX_DEFORMATION={max(distances):.9f}")
    print(f"HEAD_MEAN_DEFORMATION={sum(distances) / len(distances):.9f}")
    print(f"HEAD_CHANGED_OVER_0.1MM={sum(distance > 0.0001 for distance in distances)}")
    evaluated.to_mesh_clear()


if __name__ == "__main__":
    main()
