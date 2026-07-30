"""Blender batch: convert every shipped Mixamo FBX to GLB in one process.

Draco is on: pure-animation files have no mesh so it is a no-op there, but the
character mesh (X Bot) is 1794 KB without it and 232 KB with it — an
uncompressed GLB is actually LARGER than the source FBX.

Run:  blender -b -P batch_fbx2glb.py
Idempotent: skips a file whose .glb already exists and is newer.
"""
import bpy, os, sys

ROOT = "/Users/sean/Developer/ThreeKingdomMastersIOS/public/models/duel"
KEEP_DIRS = {
    "Sword and Shield Pack", "Great Sword Pack", "Pro Melee Axe Pack-2",
    "Pro Longbow Pack", "Pro Magic Pack", "Gestures Pack Basic",
}
KEEP_FILES = {"X Bot.fbx", "Dodging.fbx", "Quick Roll To Run.fbx", "Jump.fbx"}

targets = []
for e in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, e)
    if os.path.isdir(p) and e in KEEP_DIRS:
        targets += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.endswith(".fbx")]
    elif os.path.isfile(p) and e in KEEP_FILES:
        targets.append(p)

print(f"BATCH: {len(targets)} files", flush=True)
ok = skip = fail = 0
before = after = 0

for i, src in enumerate(targets, 1):
    dst = src[:-4] + ".glb"
    sb = os.path.getsize(src)
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        before += sb; after += os.path.getsize(dst); skip += 1
        continue
    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        # global_scale=100 is NOT optional. Mixamo FBX is authored in
        # centimetres; Blender's importer normalises to metres, so a plain
        # import/export round-trip yields a rig 1/100th the size — the duel
        # arena renders a 1.8-unit figure where it expects 180, i.e. nothing
        # visible at all. Keeping the source units means DUEL_FORMAT can flip
        # between 'fbx' and 'glb' with no code change anywhere else.
        bpy.ops.import_scene.fbx(filepath=src, automatic_bone_orientation=True, global_scale=100.0)
        bpy.ops.export_scene.gltf(
            filepath=dst,
            export_format="GLB",
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_draco_position_quantization=14,
            export_draco_normal_quantization=10,
            export_draco_texcoord_quantization=12,
            export_animations=True,
            export_frame_range=False,
            export_skins=True,
            export_yup=True,
            export_apply=False,
        )
        before += sb; after += os.path.getsize(dst); ok += 1
    except Exception as e:
        print(f"FAIL {os.path.relpath(src, ROOT)}: {e}", flush=True)
        fail += 1
    if i % 25 == 0:
        print(f"  {i}/{len(targets)}  {before/2**20:.0f} -> {after/2**20:.0f} MiB", flush=True)

print(f"\nBATCH DONE  converted={ok} skipped={skip} failed={fail}", flush=True)
print(f"  {before/2**20:.1f} MiB -> {after/2**20:.1f} MiB  (saved {100*(before-after)/before:.0f}%)", flush=True)
