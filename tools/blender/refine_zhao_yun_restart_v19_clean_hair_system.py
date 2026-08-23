"""Remove stray emitter-brow guides and keep the clean long-hair system."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v18-portrait-lighting.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v19-clean-hair-system.blend"


def configure_particle_systems():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        name = modifier.particle_system.name
        if name == "SceneHair_1_O4saken":
            modifier.show_render = True
            modifier.show_viewport = True
        elif name in {"Combover_zoro_d", "mind_eyebrows_11_Default"}:
            modifier.show_render = False
            modifier.show_viewport = False

    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    for modifier in body.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        if modifier.particle_system.name == "EyebrowsDefault":
            modifier.show_render = True
            modifier.show_viewport = True
            settings = modifier.particle_system.settings
            settings.rendered_child_count = 10
            settings.child_percent = 5
            settings.root_radius = 0.00048
            settings.tip_radius = 0.00026
            settings.radius_scale = 0.0029


def make_backdrop_unlit():
    material = bpy.data.materials["ZhaoYun_Restart_V18_Atmosphere"]
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    output = nodes.get("Material Output")
    ramp = next((node for node in nodes if node.type == "VALTORGB"), None)
    if not output or not ramp:
        return
    for element, color in zip(
        ramp.color_ramp.elements,
        ((0.018, 0.028, 0.050, 1.0), (0.16, 0.21, 0.30, 1.0)),
    ):
        element.color = color
    emission = nodes.new("ShaderNodeEmission")
    emission.name = "ZhaoYun V19 Unlit Atmosphere"
    emission.inputs["Strength"].default_value = 0.78
    for link in tuple(output.inputs["Surface"].links):
        links.remove(link)
    links.new(ramp.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    configure_particle_systems()
    make_backdrop_unlit()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
