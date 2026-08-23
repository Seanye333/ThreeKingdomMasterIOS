"""Project the supplied Zhao Yun key art onto the 3D face for identity matching."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v27-stylized-portrait.blend"
OUTPUT_BLEND = SRC / "zhao-yun-v28-portrait-projection.blend"
REFERENCE = ROOT / "public/portraits/zhao-yun.webp"
UV_NAME = "ZY28_Portrait_Projection"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def make_projection_material(original):
    """Blend the reference face into the original material instead of pasting it wholesale."""
    material = bpy.data.materials.new(f"ZY28_Projected_{original.name}")
    material.name = f"ZY28_Projected_{original.name}"
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])

    uv_map = nodes.new("ShaderNodeUVMap")
    uv_map.uv_map = UV_NAME
    image = nodes.new("ShaderNodeTexImage")
    image.image = bpy.data.images.load(str(REFERENCE), check_existing=True)
    image.interpolation = "Linear"
    image.extension = "EXTEND"
    links.new(uv_map.outputs["UV"], image.inputs["Vector"])

    # A feathered oval isolates the painted eyes, nose, lips, and jaw.  Outside
    # it, the original 3D skin/eye shader remains intact, avoiding hair, armor,
    # clouds, or cloak pixels being printed onto the head and neck.
    separate = nodes.new("ShaderNodeSeparateXYZ")
    links.new(uv_map.outputs["UV"], separate.inputs["Vector"])

    def normalized_square(socket, center, radius):
        subtract = nodes.new("ShaderNodeMath")
        subtract.operation = "SUBTRACT"
        subtract.inputs[1].default_value = center
        links.new(socket, subtract.inputs[0])
        divide = nodes.new("ShaderNodeMath")
        divide.operation = "DIVIDE"
        divide.inputs[1].default_value = radius
        links.new(subtract.outputs[0], divide.inputs[0])
        square = nodes.new("ShaderNodeMath")
        square.operation = "MULTIPLY"
        links.new(divide.outputs[0], square.inputs[0])
        links.new(divide.outputs[0], square.inputs[1])
        return square.outputs[0]

    u_square = normalized_square(separate.outputs["X"], 0.615, 0.205)
    v_square = normalized_square(separate.outputs["Y"], 0.575, 0.235)
    distance = nodes.new("ShaderNodeMath")
    distance.operation = "ADD"
    links.new(u_square, distance.inputs[0])
    links.new(v_square, distance.inputs[1])

    ellipse_mask = nodes.new("ShaderNodeMapRange")
    ellipse_mask.clamp = True
    ellipse_mask.inputs["From Min"].default_value = 0.48
    ellipse_mask.inputs["From Max"].default_value = 0.94
    ellipse_mask.inputs["To Min"].default_value = 0.88
    ellipse_mask.inputs["To Max"].default_value = 0.0
    links.new(distance.outputs[0], ellipse_mask.inputs["Value"])

    # Reject the silver circlet, pale cloak/background and black flyaway hairs.
    # The reference skin has a reliable warm R > G > B relationship, so a soft
    # chroma key transfers complexion and facial shading without decal cracks.
    rgb = nodes.new("ShaderNodeSeparateColor")
    rgb.mode = "RGB"
    links.new(image.outputs["Color"], rgb.inputs["Color"])

    def soft_range(socket, low, high, out_low=0.0, out_high=1.0):
        node = nodes.new("ShaderNodeMapRange")
        node.clamp = True
        node.inputs["From Min"].default_value = low
        node.inputs["From Max"].default_value = high
        node.inputs["To Min"].default_value = out_low
        node.inputs["To Max"].default_value = out_high
        links.new(socket, node.inputs["Value"])
        return node.outputs["Result"]

    red_minus_green = nodes.new("ShaderNodeMath")
    red_minus_green.operation = "SUBTRACT"
    links.new(rgb.outputs["Red"], red_minus_green.inputs[0])
    links.new(rgb.outputs["Green"], red_minus_green.inputs[1])
    warm_rg = soft_range(red_minus_green.outputs[0], 0.010, 0.065)

    green_minus_blue = nodes.new("ShaderNodeMath")
    green_minus_blue.operation = "SUBTRACT"
    links.new(rgb.outputs["Green"], green_minus_blue.inputs[0])
    links.new(rgb.outputs["Blue"], green_minus_blue.inputs[1])
    warm_gb = soft_range(green_minus_blue.outputs[0], 0.003, 0.045)

    luminance = nodes.new("ShaderNodeRGBToBW")
    links.new(image.outputs["Color"], luminance.inputs["Color"])
    not_black = soft_range(luminance.outputs["Val"], 0.035, 0.15)
    not_white = soft_range(luminance.outputs["Val"], 0.72, 0.94, 1.0, 0.0)

    mask_product = ellipse_mask.outputs["Result"]
    for component in (warm_rg, warm_gb, not_black, not_white):
        multiply = nodes.new("ShaderNodeMath")
        multiply.operation = "MULTIPLY"
        links.new(mask_product, multiply.inputs[0])
        links.new(component, multiply.inputs[1])
        mask_product = multiply.outputs[0]

    mix = nodes.new("ShaderNodeMixRGB")
    mix.blend_type = "MIX"
    links.new(mask_product, mix.inputs[0])
    base_input = shader.inputs["Base Color"]
    mix.inputs[1].default_value = (0.49, 0.335, 0.275, 1.0)
    links.new(image.outputs["Color"], mix.inputs[2])
    links.new(mix.outputs[0], base_input)
    shader.inputs["Roughness"].default_value = 0.52
    if "Specular IOR Level" in shader.inputs:
        shader.inputs["Specular IOR Level"].default_value = 0.23
    if "Subsurface Weight" in shader.inputs:
        shader.inputs["Subsurface Weight"].default_value = 0.055
    return material


def configure_projection_camera(scene, camera):
    scene.render.resolution_x = 600
    scene.render.resolution_y = 700
    scene.render.resolution_percentage = 100
    camera.location = (-1.02, -1.57, 1.485)
    camera.data.lens = 106
    renderer.look_at(camera, (0.0, -0.008, 1.628))
    scene.camera = camera
    bpy.context.view_layer.update()


def project_face_uv(body, scene, camera):
    if UV_NAME in body.data.uv_layers:
        body.data.uv_layers.remove(body.data.uv_layers[UV_NAME])
    uv_layer = body.data.uv_layers.new(name=UV_NAME)

    # Affine fit from the current 3D portrait framing to the supplied 512px art.
    # The transform intentionally enlarges the source face so its eyes, nose,
    # mouth, and chin align with the narrower 3D head.
    scale_u = 1.295
    offset_u = -0.105
    scale_v = 1.315
    offset_v = -0.003

    for polygon in body.data.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = body.data.loops[loop_index].vertex_index
            world = body.matrix_world @ body.data.vertices[vertex_index].co
            ndc = world_to_camera_view(scene, camera, world)
            uv_layer.data[loop_index].uv = (
                ndc.x * scale_u + offset_u,
                ndc.y * scale_v + offset_v,
            )


def assign_projection_material(body):
    eligible_names = {"UDIM.Skin"}
    replacements = {}
    original_slots = list(body.material_slots)
    for index, slot in enumerate(original_slots):
        if not slot.material or slot.material.name not in eligible_names:
            continue
        projected = make_projection_material(slot.material)
        if projected is None:
            continue
        body.data.materials.append(projected)
        replacements[index] = len(body.data.materials) - 1

    changed = 0
    for polygon in body.data.polygons:
        projection_index = replacements.get(polygon.material_index)
        if projection_index is None:
            continue
        center = sum((body.data.vertices[index].co for index in polygon.vertices), body.data.vertices[polygon.vertices[0]].co * 0.0) / len(polygon.vertices)
        if 1.535 < center.z < 1.735 and center.y < 0.045 and abs(center.x) < 0.095:
            polygon.material_index = projection_index
            changed += 1
    body.data.update()
    print(f"PROJECTED_FACE_POLYGONS={changed}")


def remove_duplicate_drawn_features():
    # The color key removes painted hair and jewelry, so the authored 3D brows
    # and lashes should remain visible and provide proper parallax.
    return


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    body = bpy.data.objects["ZhaoYun_Body"]
    configure_projection_camera(scene, camera)
    project_face_uv(body, scene, camera)
    assign_projection_material(body)
    remove_duplicate_drawn_features()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
