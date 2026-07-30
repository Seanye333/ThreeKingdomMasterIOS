"""Guan Yu v41: natural eye proportions, matte skin and softened wrapped headcloth."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import look_at


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "guan-yu-reference-fullbody-v40.blend"
OUTPUT_BLEND = SRC / "guan-yu-reference-fullbody-v41.blend"
UPPER = SRC / "guan-yu-reference-fullbody-v41-upper.png"
FACE = SRC / "guan-yu-reference-fullbody-v41-face.png"
THREE_QUARTER_FACE = SRC / "guan-yu-reference-fullbody-v41-face-three-quarter.png"


def refine_eye_anatomy():
    # v40's directed gaze worked compositionally, but the iris was too small
    # against the visible sclera. Recover part of the offset and restore the
    # fuller dark-brown iris typical of a live-action close-up.
    for side in (-1, 1):
        iris = bpy.data.objects.get(f"V31_Eye_Dark_Iris_{side:+d}")
        pupil = bpy.data.objects.get(f"V31_Eye_Pupil_{side:+d}")
        if iris:
            iris.location.x += 0.0015
            iris.scale.x *= 1.18
            iris.scale.z *= 1.35
        if pupil:
            pupil.location.x += 0.0015
            pupil.scale.x *= 1.07
            pupil.scale.z *= 1.07

    eyeballs = bpy.data.objects.get("Guan_Yu_Basemesh.low-poly")
    if eyeballs and eyeballs.type == "MESH":
        for vertex in eyeballs.data.vertices:
            if 1.635 < vertex.co.z < 1.710:
                vertex.co.z = 1.674 + (vertex.co.z - 1.674) * 0.88
        eyeballs.data.update()

    sclera = bpy.data.materials.get("Guan_Yu_Basemesh.low-poly")
    if sclera and sclera.use_nodes:
        nodes = sclera.node_tree.nodes
        neutralize = nodes.get("Neutralize bloodshot stock eye texture")
        shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
        if neutralize:
            neutralize.inputs["Saturation"].default_value = 0.28
            neutralize.inputs["Value"].default_value = 0.74
        if shader:
            shader.inputs["Roughness"].default_value = 0.31
            shader.inputs["Specular IOR Level"].default_value = 0.38

    iris_material = bpy.data.materials.get("V31 deep brown iris")
    if iris_material and iris_material.use_nodes:
        shader = next(
            (node for node in iris_material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"),
            None,
        )
        if shader:
            shader.inputs["Base Color"].default_value = (0.018, 0.0040, 0.0012, 1)
            shader.inputs["Roughness"].default_value = 0.22
            shader.inputs["Specular IOR Level"].default_value = 0.42


def mature_matte_skin():
    material = bpy.data.materials.get("Guan_Yu_Basemesh.body")
    if not material or not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    mature = nodes.get("V34 restrained mature skin color")
    pore_bump = nodes.get("Micro pore normal")
    if mature:
        mature.inputs["Saturation"].default_value = 0.84
        mature.inputs["Value"].default_value = 0.84
    if shader:
        shader.inputs["Roughness"].default_value = 0.64
        shader.inputs["Specular IOR Level"].default_value = 0.25
        shader.inputs["Subsurface Weight"].default_value = 0.019
        if "Subsurface Scale" in shader.inputs:
            shader.inputs["Subsurface Scale"].default_value = 0.020
    if pore_bump:
        pore_bump.inputs["Strength"].default_value = 0.19
        pore_bump.inputs["Distance"].default_value = 0.00072

    surface = bpy.data.objects.get("Guan_Yu_Basemesh")
    if surface:
        subdiv = surface.modifiers.get("High resolution portrait surface")
        if subdiv and hasattr(subdiv, "render_levels"):
            subdiv.render_levels = max(subdiv.render_levels, 3)


def soften_headcloth():
    headcloth = bpy.data.objects.get("Portrait_Fitted_Headcloth")
    if headcloth and not headcloth.modifiers.get("V41 tailored cloth smoothing"):
        smooth = headcloth.modifiers.new("V41 tailored cloth smoothing", "SUBSURF")
        smooth.subdivision_type = "CATMULL_CLARK"
        smooth.levels = 1
        smooth.render_levels = 1
        headcloth.modifiers.move(len(headcloth.modifiers) - 1, 0)

    material = bpy.data.materials.get("V34 dark jade woven headcloth")
    if material and material.use_nodes:
        shader = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        bump = next((node for node in material.node_tree.nodes if node.type == "BUMP"), None)
        if shader:
            shader.inputs["Roughness"].default_value = 0.82
        if bump:
            bump.inputs["Strength"].default_value = min(0.22, bump.inputs["Strength"].default_value * 1.18)


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
    refine_eye_anatomy()
    mature_matte_skin()
    soften_headcloth()

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
