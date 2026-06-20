# 寫實單挑 3D 模型資產 — Realistic Duel Assets

The 3D duel arena loads rigged fighters from this folder. **Currently wired up
and working** with the Mixamo **FBX** files here, on the default **"X Bot"** rig.

## Current state

- `X Bot.fbx` — the character mesh + skeleton (Mixamo's grey placeholder robot).
- the other `*.fbx` — animation-only clips (idle / attacks / blocks / hits /
  reactions / taunts), all on the same X Bot rig so they retarget onto the mesh.
- `src/ui/components/duel/duelAssets.ts` maps each duel action → a pool of these
  clips. `DUEL_ASSETS_READY = true`, so the arena uses these (not the procedural
  fallback). Multiple attack/hit clips are rotated through for variety.

## ⚠️ X Bot is a placeholder robot — not a real warrior

The animations are real mocap and look great, but the *character* is Mixamo's
grey test dummy with no weapon. To get a real 三國 warrior:

1. On Mixamo, pick a proper character (e.g. **Knight, Paladin, Warrior**, or
   upload your own model) and download it **with skin** as `.fbx`.
2. Drop it in this folder and point `DUEL_CHARACTER_URL` in `duelAssets.ts` at
   its basename. Every clip above keeps working (same Mixamo skeleton).
3. A weapon isn't part of these "standing melee" clips — either pick a character
   that includes one, or attach a sword mesh to the hand bone later.

## Adding / swapping animations

Each entry in `RAW` (in `duelAssets.ts`) is a list of clip basenames (filenames
here without the `.fbx`). Add a downloaded clip's basename to the right action's
list and it joins the rotation. A dedicated **"Dying"** clip is still missing —
`death` currently reuses a heavy stagger; download one and add it to `death`.

## iOS performance note

These FBX files total ~23 MB and are parsed at runtime (only when a duel opens,
then cached). For best iOS performance, convert the *used* clips to `.glb` later
(e.g. with `FBX2glTF` or Blender), drop them in, and set `DUEL_FORMAT = 'glb'` —
the loader already supports both.
