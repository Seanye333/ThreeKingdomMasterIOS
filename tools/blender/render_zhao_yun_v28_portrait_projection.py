"""Render the portrait-projected Zhao Yun v28 identity test."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-v28-portrait-projection.blend"
PREVIEW = SRC / "zhao-yun-v28-portrait-projection-preview.png"
FACE = SRC / "zhao-yun-v28-portrait-projection-face.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v27_stylized_portrait as v27  # pylint: disable=wrong-import-position
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v27.configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (-1.28, -1.96, 1.460), (0.0, -0.008, 1.628), 110, (1200, 1400), 164)
        return
    renderer.render(scene, camera, PREVIEW, (-1.02, -1.57, 1.485), (0.0, -0.008, 1.628), 106, (600, 700), 48)


if __name__ == "__main__":
    main()
