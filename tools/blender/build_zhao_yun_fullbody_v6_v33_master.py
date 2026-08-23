"""Build a full-body Zhao Yun with the accepted V33 portrait file as the master scene."""

from __future__ import annotations

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
MASTER_BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"
FULLBODY_BLEND = SRC / "zhao-yun-vitruvian-v16-fullbody-polish.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v6-v33-master.blend"

EXCLUDE_EXACT = {
    "ZhaoYun_Body",
    "ZhaoYun_Strand_Hair_Emitter",
    "Lacrimal_Caruncle",
    "Tearline",
    "ZhaoYun_Portrait_Camera",
}
EXCLUDE_PREFIXES = (
    "ZhaoYun_Circlet_",
    "ZhaoYun_Fitted_Silver_Circlet",
    "ZhaoYun_V15_Back_Hair_Clump_",
    "ZhaoYun_V15_Hair_Crown_",
    "ZhaoYun_V15_Ponytail_Clump_",
    "ZhaoYun_V15_Ponytail_Flyaway_",
    "ZhaoYun_V15_Temple_Lock",
    "ZhaoYun_V13_Commander_Plume_",
)


def inspect_fullbody_objects():
    """Read object visibility/type without changing the V33 master scene."""
    with bpy.data.libraries.load(str(FULLBODY_BLEND), link=False) as (source, _destination):
        all_names = set(source.objects)
    # Append all object datablocks first; unused hidden generations are removed below.
    return sorted(all_names)


def append_fullbody_objects():
    names = inspect_fullbody_objects()
    with bpy.data.libraries.load(str(FULLBODY_BLEND), link=False) as (_source, destination):
        destination.objects = names
    appended = []
    for obj in destination.objects:
        if obj is None:
            continue
        bpy.context.scene.collection.objects.link(obj)
        appended.append(obj)
    return appended


def remove_unwanted_appended(appended):
    removed = 0
    kept = []
    for obj in tuple(appended):
        exclude = (
            obj.name in EXCLUDE_EXACT
            or obj.name.startswith(EXCLUDE_PREFIXES)
            or obj.type in {"CAMERA", "LIGHT"}
            or obj.hide_render
        )
        if exclude:
            bpy.data.objects.remove(obj, do_unlink=True)
            removed += 1
        else:
            kept.append(obj)
    return kept, removed


def organize_imported_objects(appended):
    collection = bpy.data.collections.get("ZhaoYun_V16_Fullbody_Imported")
    if not collection:
        collection = bpy.data.collections.new("ZhaoYun_V16_Fullbody_Imported")
        bpy.context.scene.collection.children.link(collection)
    moved = 0
    for obj in appended:
        if obj.name == "ZhaoYun_Game_Rig" or obj.name.startswith("ZhaoYun_V16_Weight_Source"):
            continue
        for owner in tuple(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
        obj["zhao_yun_v16_fullbody_import"] = True
        moved += 1
    return collection, moved


def copy_vertex_groups(source, destination):
    destination.vertex_groups.clear()
    groups = [destination.vertex_groups.new(name=group.name) for group in source.vertex_groups]
    for vertex in source.data.vertices:
        for assignment in vertex.groups:
            groups[assignment.group].add((vertex.index,), assignment.weight, "REPLACE")
    return len(groups)


def append_weight_source():
    with bpy.data.libraries.load(str(FULLBODY_BLEND), link=False) as (_source, destination):
        destination.objects = ["ZhaoYun_Body"]
    source = destination.objects[0]
    bpy.context.scene.collection.objects.link(source)
    source.name = "ZhaoYun_V16_Weight_Source"
    return source


def bind_v33_body(rig):
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    weight_source = append_weight_source()
    group_count = copy_vertex_groups(weight_source, body)
    bpy.data.objects.remove(weight_source, do_unlink=True)

    armature = body.modifiers.new("ZhaoYun V33 Fullbody Rig", "ARMATURE")
    armature.object = rig
    armature.use_deform_preserve_volume = True
    body.modifiers.move(len(body.modifiers) - 1, 0)
    body.parent = rig
    body.parent_type = "OBJECT"
    body.matrix_parent_inverse = rig.matrix_world.inverted()
    return body, group_count


def keep_v33_head_and_hide_v33_bust_costume():
    # These V33 armor pieces are camera-authored bust geometry and would overlap
    # the mature V16 full-body armor. The face, hair, circlet and materials remain untouched.
    costume_prefixes = (
        "ZhaoYun_Restart_V6_Dark_Tunic",
        "ZhaoYun_Restart_V6_Pauldron_",
        "ZhaoYun_Restart_V6_Silver_Collar",
        "ZhaoYun_Restart_V6_White_Cape",
        "ZhaoYun_Restart_V11_Chest_",
        "ZhaoYun_Restart_V13_Chest_",
        "ZhaoYun_Restart_V13_Pauldron_",
    )
    hidden = 0
    for obj in bpy.data.objects:
        if obj.name.startswith(costume_prefixes):
            obj.hide_render = True
            obj.hide_set(True)
            hidden += 1
    return hidden


def main():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER_BLEND))
    original_skin = bpy.data.materials["UDIM.Skin"]
    original_iris = bpy.data.materials["Iris"]

    appended = append_fullbody_objects()
    kept_imported, removed = remove_unwanted_appended(appended)
    imported_collection, moved = organize_imported_objects(kept_imported)
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    body, group_count = bind_v33_body(rig)
    hidden_costume = keep_v33_head_and_hide_v33_bust_costume()

    # The V33 body must retain the exact original material datablocks, not copied .001 variants.
    assert body.data.materials.get("UDIM.Skin") == original_skin
    assert body.data.materials.get("Iris") == original_iris

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"APPENDED={len(appended)} REMOVED={removed} VISIBLE_IMPORTED={len(appended) - removed}")
    print(f"IMPORTED_COLLECTION={imported_collection.name} MOVED={moved}")
    print(f"BODY_VERTICES={len(body.data.vertices)} GROUPS={group_count}")
    print(f"SKIN_MATERIAL={body.data.materials.get('UDIM.Skin').name}")
    print(f"IRIS_MATERIAL={body.data.materials.get('Iris').name}")
    print(f"HIDDEN_V33_BUST_COSTUME={hidden_costume}")


if __name__ == "__main__":
    main()
