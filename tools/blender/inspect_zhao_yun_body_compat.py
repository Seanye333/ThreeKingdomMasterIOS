"""Inspect topology and transform compatibility between the V16 and V33 Zhao Yun bodies."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
OLD_BLEND = SRC / "zhao-yun-vitruvian-v16-fullbody-polish.blend"
NEW_BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"


def body_snapshot(path, name):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    obj = bpy.data.objects[name]
    coords = [vertex.co.copy() for vertex in obj.data.vertices]
    groups = [group.name for group in obj.vertex_groups]
    print(f"{path.name}:{name}")
    print(f"  vertices={len(coords)} polygons={len(obj.data.polygons)} groups={len(groups)}")
    print(f"  location={tuple(round(value, 6) for value in obj.location)}")
    print(f"  scale={tuple(round(value, 6) for value in obj.scale)}")
    print(f"  dimensions={tuple(round(value, 6) for value in obj.dimensions)}")
    print(f"  modifiers={[(modifier.name, modifier.type) for modifier in obj.modifiers]}")
    return coords, groups


def main():
    old_coords, old_groups = body_snapshot(OLD_BLEND, "ZhaoYun_Body")
    new_coords, new_groups = body_snapshot(NEW_BLEND, "ZhaoYun_Restart_Body")
    if len(old_coords) != len(new_coords):
        print("TOPOLOGY_MATCH=False")
        return
    distances = [(old - new).length for old, new in zip(old_coords, new_coords)]
    changed = [index for index, distance in enumerate(distances) if distance > 1e-7]
    print("TOPOLOGY_MATCH=True")
    print(f"OLD_GROUPS={len(old_groups)} NEW_GROUPS={new_groups}")
    print(f"COORD_MAX_DELTA={max(distances):.9f}")
    print(f"COORD_MEAN_DELTA={sum(distances) / len(distances):.9f}")
    print(f"COORD_CHANGED={len(changed)}")
    if changed:
        xs = [new_coords[index].x for index in changed]
        ys = [new_coords[index].y for index in changed]
        zs = [new_coords[index].z for index in changed]
        print(
            "CHANGED_BOUNDS="
            f"x({min(xs):.4f},{max(xs):.4f}) "
            f"y({min(ys):.4f},{max(ys):.4f}) "
            f"z({min(zs):.4f},{max(zs):.4f})"
        )
    print(f"OLD_GROUP_SAMPLE={old_groups[:20]}")


if __name__ == "__main__":
    main()
