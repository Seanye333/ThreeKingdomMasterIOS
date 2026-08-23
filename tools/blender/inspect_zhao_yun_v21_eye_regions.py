"""Inspect v21 eyelid and eyebrow morph vertices for fitted detail curves."""

from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v21-young-hero.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"
MORPHS_L3 = SRC / "charmorph-test/characters/Vitruvian/morphs/L3"


def summarize(body, folder, name):
    data = np.load(folder / f"{name}.npz")
    coords = np.array([body.data.vertices[index].co[:] for index in data["idx"]])
    print(f"REGION={name} COUNT={len(coords)}")
    print(f"  MIN={coords.min(axis=0)} MAX={coords.max(axis=0)}")
    for side, condition in (("LEFT", coords[:, 0] < 0.0), ("RIGHT", coords[:, 0] > 0.0)):
        subset = coords[condition]
        print(f"  SIDE={side} COUNT={len(subset)}")
        if not len(subset):
            continue
        xmin, xmax = subset[:, 0].min(), subset[:, 0].max()
        for bin_index in range(9):
            lo = xmin + (xmax - xmin) * bin_index / 9.0
            hi = xmin + (xmax - xmin) * (bin_index + 1) / 9.0
            bucket = subset[(subset[:, 0] >= lo) & (subset[:, 0] <= hi)]
            if len(bucket):
                # Uppermost, frontmost sample is a useful upper-lid landmark.
                score = bucket[:, 2] * 10.0 - bucket[:, 1]
                point = bucket[np.argmax(score)]
                print(f"    P{bin_index}={tuple(round(float(value), 6) for value in point)}")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    summarize(body, MORPHS_L2, "Eyes_UpperLidOpenness")
    summarize(body, MORPHS_L2, "Eyes_EyebrowsAngle")
    summarize(body, MORPHS_L3, "Eyebrows_Frown_Left")
    summarize(body, MORPHS_L3, "Eyebrows_Frown_Right")
    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        print("IRIS_NODES")
        for node in iris.node_tree.nodes:
            print(f"  {node.name}|{node.type}")
            for socket in node.inputs:
                if hasattr(socket, "default_value"):
                    value = socket.default_value
                    value = tuple(value) if hasattr(value, "__len__") else value
                    print(f"    IN_{socket.name}={value}")


if __name__ == "__main__":
    main()
