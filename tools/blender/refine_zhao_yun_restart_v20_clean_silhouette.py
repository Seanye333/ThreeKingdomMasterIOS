"""Remove obsolete wire-like flyaways and keep a clean portrait silhouette."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-restart-v18-portrait-lighting.blend"
OUTPUT_BLEND = SRC / "zhao-yun-restart-v20-clean-silhouette.blend"


def hide_obsolete_flyaways():
    for obj in bpy.data.objects:
        if obj.name.startswith("ZhaoYun_Restart_V10_Flyaway_"):
            obj.hide_render = True
            obj.hide_set(True)


def keep_clean_brows():
    body = bpy.data.objects["ZhaoYun_Restart_Body"]
    for modifier in body.modifiers:
        if modifier.type == "PARTICLE_SYSTEM" and modifier.particle_system.name == "EyebrowsDefault":
            modifier.show_render = False
            modifier.show_viewport = False

    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM" and modifier.particle_system.name == "mind_eyebrows_11_Default":
            modifier.show_render = True
            modifier.show_viewport = True
            settings = modifier.particle_system.settings
            settings.rendered_child_count = 12
            settings.child_percent = 6
            settings.root_radius = 0.00055
            settings.tip_radius = 0.00032
            settings.radius_scale = 0.0032


def make_backdrop_unlit():
    material = bpy.data.materials["ZhaoYun_Restart_V18_Atmosphere"]
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    output = nodes.get("Material Output")
    ramp = next((node for node in nodes if node.type == "VALTORGB"), None)
    if not output or not ramp:
        return
    ramp.color_ramp.elements[0].color = (0.024, 0.036, 0.060, 1.0)
    ramp.color_ramp.elements[1].color = (0.20, 0.26, 0.36, 1.0)
    emission = nodes.new("ShaderNodeEmission")
    emission.name = "ZhaoYun V20 Unlit Atmosphere"
    emission.inputs["Strength"].default_value = 0.82
    for link in tuple(output.inputs["Surface"].links):
        links.remove(link)
    links.new(ramp.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])


def tune_hair_rim():
    rim = bpy.data.objects.get("Restart hair rim")
    if rim:
        rim.data.energy = 94.0
    edge = bpy.data.objects.get("ZhaoYun_Restart_V18_Hair_Edge")
    if edge:
        edge.data.energy = 32.0


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hide_obsolete_flyaways()
    keep_clean_brows()
    make_backdrop_unlit()
    tune_hair_rim()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
