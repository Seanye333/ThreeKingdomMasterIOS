"""Locate materials and disconnected geometry around v23 under-eye artifacts."""

from collections import defaultdict
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v23-warrior-prince.blend"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    groups = defaultdict(list)
    for polygon in body.data.polygons:
        center = sum((body.data.vertices[index].co for index in polygon.vertices), Vector()) / len(polygon.vertices)
        if 0.010 <= abs(center.x) <= 0.052 and 1.615 <= center.z <= 1.645 and center.y <= -0.055:
            material = body.material_slots[polygon.material_index].material
            name = material.name if material else "<none>"
            groups[name].append((polygon.index, center.copy()))

    print("UNDER_EYE_MATERIALS")
    for name, entries in sorted(groups.items()):
        xs = [entry[1].x for entry in entries]
        ys = [entry[1].y for entry in entries]
        zs = [entry[1].z for entry in entries]
        print(
            f"  {name}: count={len(entries)} "
            f"x=({min(xs):.6f},{max(xs):.6f}) "
            f"y=({min(ys):.6f},{max(ys):.6f}) "
            f"z=({min(zs):.6f},{max(zs):.6f})"
        )

    print("VISIBLE_SMALL_OBJECTS_NEAR_EYES")
    for obj in bpy.context.scene.objects:
        if obj == body or obj.hide_render or obj.type not in {"MESH", "CURVE"}:
            continue
        if obj.location.z < 1.55 or obj.location.z > 1.75:
            continue
        materials = [slot.material.name if slot.material else "<none>" for slot in obj.material_slots]
        print(f"  {obj.name}|{obj.type}|loc={tuple(round(v, 6) for v in obj.location)}|mats={materials}")

    sclera_index = next(
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "Sclera_Cornea"
    )
    polygons = {polygon.index: polygon for polygon in body.data.polygons if polygon.material_index == sclera_index}
    vertex_to_polygons = defaultdict(set)
    for polygon in polygons.values():
        for vertex in polygon.vertices:
            vertex_to_polygons[vertex].add(polygon.index)
    remaining = set(polygons)
    components = []
    while remaining:
        seed = remaining.pop()
        component = {seed}
        stack = [seed]
        while stack:
            current = stack.pop()
            for vertex in polygons[current].vertices:
                for neighbor in vertex_to_polygons[vertex]:
                    if neighbor in remaining:
                        remaining.remove(neighbor)
                        component.add(neighbor)
                        stack.append(neighbor)
        components.append(component)

    print("SCLERA_COMPONENTS")
    for index, component in enumerate(sorted(components, key=len, reverse=True)):
        vertex_indices = set()
        for polygon_index in component:
            vertex_indices.update(polygons[polygon_index].vertices)
        coords = [body.data.vertices[vertex_index].co for vertex_index in vertex_indices]
        print(
            f"  C{index}: polys={len(component)} verts={len(vertex_indices)} "
            f"x=({min(co.x for co in coords):.6f},{max(co.x for co in coords):.6f}) "
            f"y=({min(co.y for co in coords):.6f},{max(co.y for co in coords):.6f}) "
            f"z=({min(co.z for co in coords):.6f},{max(co.z for co in coords):.6f})"
        )


if __name__ == "__main__":
    main()
