"""Print Zhao Yun v14 eye, skin, and hair material diagnostics."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-vitruvian-v18-skin-engraving.blend"

bpy.ops.wm.open_mainfile(filepath=str(BLEND))

for obj in bpy.data.objects:
    lowered = obj.name.lower()
    if any(token in lowered for token in ("eye", "body", "hair", "brow", "lash")):
        materials = [slot.material.name if slot.material else "<none>" for slot in obj.material_slots]
        print(f"OBJECT={obj.name} TYPE={obj.type} MATERIALS={materials}")

body = bpy.data.objects.get("ZhaoYun_Body")
if body:
    for z in (1.64, 1.66, 1.68, 1.70, 1.72):
        candidates = [v.co for v in body.data.vertices if abs(v.co.z - z) < 0.004 and abs(v.co.x) < 0.085]
        if candidates:
            print(f"FACE_FRONT z={z:.2f} y={min(v.y for v in candidates):.5f}")
    for slot in body.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            continue
        print(f"BODY_MATERIAL={mat.name}")
        for node in mat.node_tree.nodes:
            if node.type in {"BSDF_PRINCIPLED", "BSDF_HAIR_PRINCIPLED"}:
                values = {}
                for name in ("Base Color", "Roughness", "Specular IOR Level", "Subsurface Weight"):
                    if name in node.inputs:
                        value = node.inputs[name].default_value
                        values[name] = tuple(value) if hasattr(value, "__len__") else value
                print(f"  NODE={node.name} VALUES={values}")

emitter = bpy.data.objects.get("ZhaoYun_Strand_Hair_Emitter")
if emitter:
    print("PARTICLE_SYSTEMS")
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM":
            print(
                f"  {modifier.particle_system.name} viewport={modifier.show_viewport} "
                f"render={modifier.show_render}"
            )

for material_name in ("Pupil", "Sclera_Cornea", "Iris", "EyeHair", "UDIM.Skin"):
    material = bpy.data.materials.get(material_name)
    if not material or not material.use_nodes:
        continue
    print(f"DETAIL_MATERIAL={material_name}")
    for node in material.node_tree.nodes:
        if node.type in {"BSDF_PRINCIPLED", "RGB", "VALUE", "MIX_RGB", "TEX_IMAGE"}:
            print(f"  NODE={node.name} TYPE={node.type}")
            for output in node.outputs:
                if hasattr(output, "default_value"):
                    value = output.default_value
                    value = tuple(value) if hasattr(value, "__len__") else value
                    print(f"    OUT_{output.name}={value}")
            for socket_name in ("Base Color", "Color", "Color1", "Color2", "Fac", "Roughness", "IOR", "Alpha"):
                if socket_name not in node.inputs:
                    continue
                value = node.inputs[socket_name].default_value
                value = tuple(value) if hasattr(value, "__len__") else value
                print(f"    {socket_name}={value}")
    if material_name == "EyeHair":
        print("  ALL_NODES")
        for node in material.node_tree.nodes:
            print(f"    {node.name}|{node.type}")
        print("  LINKS")
        for link in material.node_tree.links:
            print(f"    {link.from_node.name}.{link.from_socket.name}->{link.to_node.name}.{link.to_socket.name}")
        group = material.node_tree.nodes.get("Group")
        if group and group.node_tree:
            print("  EYEHAIR_GROUP_INPUTS")
            for socket in group.inputs:
                if hasattr(socket, "default_value"):
                    value = socket.default_value
                    value = tuple(value) if hasattr(value, "__len__") else value
                    print(f"    {socket.name}={value}")
            print("  EYEHAIR_GROUP_NODES")
            for internal in group.node_tree.nodes:
                print(f"    {internal.name}|{internal.type}")
                if internal.type == "VALTORGB":
                    for index, element in enumerate(internal.color_ramp.elements):
                        print(
                            f"      RAMP_{index}=pos:{element.position} color:{tuple(element.color)}"
                        )
                for output in internal.outputs:
                    if hasattr(output, "default_value"):
                        value = output.default_value
                        value = tuple(value) if hasattr(value, "__len__") else value
                        print(f"      OUT_{output.name}={value}")
            print("  EYEHAIR_GROUP_LINKS")
            for link in group.node_tree.links:
                print(f"    {link.from_node.name}.{link.from_socket.name}->{link.to_node.name}.{link.to_socket.name}")
    if material_name == "UDIM.Skin":
        print("  SKIN_NODES")
        for node in material.node_tree.nodes:
            inputs = [socket.name for socket in node.inputs]
            outputs = [socket.name for socket in node.outputs]
            print(f"    {node.name}|{node.type}|IN={inputs}|OUT={outputs}")
            if node.name == "charmorph_settings":
                for socket in node.outputs:
                    if hasattr(socket, "default_value"):
                        value = socket.default_value
                        value = tuple(value) if hasattr(value, "__len__") else value
                        print(f"      {socket.name}={value}|min={getattr(socket, 'min_value', None)}|max={getattr(socket, 'max_value', None)}")
        print("  SKIN_LINKS")
        for link in material.node_tree.links:
            print(f"    {link.from_node.name}.{link.from_socket.name}->{link.to_node.name}.{link.to_socket.name}")
