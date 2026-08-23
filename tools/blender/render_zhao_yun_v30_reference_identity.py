"""Render Zhao Yun v30 from the supplied portrait angle."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-v30-reference-identity.blend"
PREVIEW = SRC / "zhao-yun-v30-reference-identity-preview.png"
FACE = SRC / "zhao-yun-v30-reference-identity-face.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v27_stylized_portrait as v27  # pylint: disable=wrong-import-position
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v27.configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    for obj in bpy.data.objects:
        if "spear" in obj.name.lower() or "tassel" in obj.name.lower():
            obj.hide_render = True
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (-1.26, -1.92, 1.475), (0.0, -0.010, 1.636), 112, (1200, 1400), 144)
        return
    renderer.render(scene, camera, PREVIEW, (-1.02, -1.57, 1.485), (0.0, -0.008, 1.628), 106, (600, 700), 48)


if __name__ == "__main__":
    main()
