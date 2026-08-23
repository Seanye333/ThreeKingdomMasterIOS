"""Combine the accepted V33 Zhao Yun head with the mature V16 full-body rig and outfit."""

from __future__ import annotations

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BASE_BLEND = SRC / "zhao-yun-vitruvian-v16-fullbody-polish.blend"
HEAD_BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v1-composite.blend"

HEAD_PREFIXES = (
    "ZhaoYun_Restart_Circlet_Halo_",
    "ZhaoYun_Restart_Circlet_Jade_",
    "ZhaoYun_Restart_V10_Circlet_",
    "ZhaoYun_Restart_V10_Cloud_Scroll_",
    "ZhaoYun_Restart_V10_Dark_Engraving_",
    "ZhaoYun_Restart_V27_Crest_",
    "ZhaoYun_Restart_V27_Subtle_Crest",
)

LEGACY_HEAD_PREFIXES = (
    "ZhaoYun_Circlet_",
    "ZhaoYun_V15_Back_Hair_Clump_",
    "ZhaoYun_V15_Hair_Crown_",
)


def remove_object(obj):
    data = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if data and data.users == 0:
        collection = getattr(bpy.data, f"{data.__class__.__name__.lower()}s", None)
        if collection:
            try:
                collection.remove(data)
            except (RuntimeError, TypeError):
                pass


def remove_legacy_head_parts():
    exact = {
        "Lacrimal_Caruncle",
        "Tearline",
        "ZhaoYun_Fitted_Silver_Circlet",
        "ZhaoYun_Strand_Hair_Emitter",
    }
    targets = [
        obj
        for obj in tuple(bpy.data.objects)
        if obj.name in exact or obj.name.startswith(LEGACY_HEAD_PREFIXES)
    ]
    for obj in targets:
        remove_object(obj)
    for settings in tuple(bpy.data.particles):
        if settings.users == 0:
            bpy.data.particles.remove(settings)
    print(f"REMOVED_LEGACY_HEAD_OBJECTS={len(targets)}")


def head_object_names():
    with bpy.data.libraries.load(str(HEAD_BLEND), link=False) as (source, _destination):
        names = set(source.objects)
    selected = {
        "ZhaoYun_Restart_Body",
        "Lacrimal_Caruncle",
        "Tearline",
        "ZhaoYun_Strand_Hair_Emitter",
    }
    selected.update(name for name in names if name.startswith(HEAD_PREFIXES))
    missing = selected.difference(names)
    if missing:
        raise RuntimeError(f"Missing V33 head objects: {sorted(missing)}")
    return sorted(selected)


def append_head_objects():
    names = head_object_names()
    with bpy.data.libraries.load(str(HEAD_BLEND), link=False) as (_source, destination):
        destination.objects = names
    appended = {}
    for obj in destination.objects:
        if obj is None:
            continue
        bpy.context.scene.collection.objects.link(obj)
        appended[obj.name] = obj
    print(f"APPENDED_HEAD_OBJECTS={len(appended)}")
    return appended


def copy_vertex_groups(source, destination):
    destination.vertex_groups.clear()
    new_groups = [destination.vertex_groups.new(name=group.name) for group in source.vertex_groups]
    memberships = [[] for _group in new_groups]
    weights = [[] for _group in new_groups]
    for vertex in source.data.vertices:
        for assignment in vertex.groups:
            memberships[assignment.group].append(vertex.index)
            weights[assignment.group].append(assignment.weight)
    # Blender's API accepts one weight per call, so copy exact weights by topology.
    for group_index, (indices, group_weights) in enumerate(zip(memberships, weights)):
        group = new_groups[group_index]
        for vertex_index, weight in zip(indices, group_weights):
            group.add((vertex_index,), weight, "REPLACE")
    print(f"TRANSFERRED_VERTEX_GROUPS={len(new_groups)}")


def bind_body(old_body, new_body, rig):
    copy_vertex_groups(old_body, new_body)
    armature = new_body.modifiers.new("ZhaoYun Fullbody Rig", "ARMATURE")
    armature.object = rig
    armature.use_deform_preserve_volume = True
    new_body.modifiers.move(len(new_body.modifiers) - 1, 0)
    new_body.parent = rig
    new_body.parent_type = "OBJECT"
    new_body.matrix_parent_inverse = rig.matrix_world.inverted()
    old_body.name = "ZhaoYun_V16_Legacy_Body"
    old_body.hide_render = True
    old_body.hide_set(True)
    new_body.name = "ZhaoYun_Body"


def parent_to_head_bone(obj, rig):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = "head"
    obj.matrix_world = world


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BASE_BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    old_body = bpy.data.objects["ZhaoYun_Body"]

    remove_legacy_head_parts()
    appended = append_head_objects()
    new_body = appended["ZhaoYun_Restart_Body"]
    bind_body(old_body, new_body, rig)

    for child_name in ("Lacrimal_Caruncle", "Tearline"):
        child = appended[child_name]
        child.parent = new_body
        child.parent_type = "OBJECT"

    for name, obj in appended.items():
        if name in {"ZhaoYun_Restart_Body", "Lacrimal_Caruncle", "Tearline"}:
            continue
        parent_to_head_bone(obj, rig)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"NEW_BODY_VERTICES={len(new_body.data.vertices)}")
    print(f"NEW_BODY_GROUPS={len(new_body.vertex_groups)}")
    print(f"RIG={rig.name}")


if __name__ == "__main__":
    main()
