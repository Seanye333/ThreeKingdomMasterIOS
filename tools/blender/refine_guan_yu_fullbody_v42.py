"""Guan Yu v42: remove the duplicated stock iris beneath the controllable eyes."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v41.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v42.blend"
UPPER = SRC / "guan-yu-reference-fullbody-v42-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v42-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v42-face-three-quarter.png"


def replace_stock_eye_texture_with_sclera():
    """Keep the MakeHuman opacity mask, but remove its painted iris/pupil."""
    material = bpy.data.materials.get("Guan_Yu_Basemesh.low-poly")
    if not material or not material.use_nodes:
        raise RuntimeError("Base eyeball material is missing")

    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        raise RuntimeError("Base eyeball shader is missing")

    # The stock brown_eye.png color already paints an iris. The separate V31
    # iris and pupil objects sit in front of it, so both were visible whenever
    # the directed gaze moved. Disconnect only the color path; its alpha map
    # still clips the original eye geometry correctly.
    for link in list(shader.inputs["Base Color"].links):
        links.remove(link)

    for name in ("V42 sclera coordinate", "V42 subtle sclera variation", "V42 natural sclera tone"):
        old = nodes.get(name)
        if old:
            nodes.remove(old)

    coordinate = nodes.new("ShaderNodeTexCoord")
    coordinate.name = "V42 sclera coordinate"
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = "V42 subtle sclera variation"
    noise.noise_dimensions = "3D"
    noise.inputs["Scale"].default_value = 5.5
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.58
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "V42 natural sclera tone"
    ramp.color_ramp.elements[0].position = 0.27
    ramp.color_ramp.elements[0].color = (0.095, 0.065, 0.048, 1)
    ramp.color_ramp.elements[1].position = 0.76
    ramp.color_ramp.elements[1].color = (0.285, 0.225, 0.170, 1)

    links.new(coordinate.outputs["Generated"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    shader.inputs["Roughness"].default_value = 0.29
    shader.inputs["Specular IOR Level"].default_value = 0.37


def settle_iris_depth():
    # Keep the controllable v41 gaze, but separate the surfaces enough to stop
    # z-fighting with the newly neutral sclera. The current eye mesh centers
    # are near +/-0.0312; the old +/-0.047 values belonged to an earlier head
    # proportion and pushed both irises against the eye corners.
    gaze_offset = -0.0012
    for side in (-1, 1):
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.location.x = side * 0.0312 + gaze_offset
            iris.location.y -= 0.00035
        if pupil:
            pupil.location.x = side * 0.0312 + gaze_offset
            pupil.location.y -= 0.00055


def render(scene, camera, path, resolution, location, target, lens):
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    replace_stock_eye_texture_with_sclera()
    settle_iris_depth()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    camera = scene.camera
    render(scene, camera, UPPER, (1100, 1100), (0.55, -3.75, 1.45), (0.0, -0.06, 1.31), 82)
    render(scene, camera, FACE, (1100, 1100), (0.42, -2.30, 1.62), (0.0, -0.095, 1.50), 98)
    render(scene, camera, THREE_QUARTER_FACE, (1100, 1100), (0.90, -2.28, 1.64), (0.0, -0.09, 1.50), 98)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"BLEND={OUTPUT_BLEND}")
    print(f"UPPER={UPPER}")
    print(f"FACE={FACE}")
    print(f"THREE_QUARTER_FACE={THREE_QUARTER_FACE}")


if __name__ == "__main__":
    main()
