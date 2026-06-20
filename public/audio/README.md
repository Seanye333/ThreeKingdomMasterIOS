# 真實音效 / 配樂 (optional recorded audio)

The game ships with **synthesized** sound (oscillator stings + a procedural
score in `src/game/systems/sound.ts`). You can layer **real recordings** on top
with zero code changes — anything you don't provide keeps the synth fallback.

## How to add files

Drop audio (mp3/ogg/m4a) here:

```
public/audio/sfx/<name>.mp3      e.g. sfx/sword.mp3, sfx/crash.mp3, sfx/wardrum.mp3
public/audio/music/<track>.mp3   tracks: peace, tension, battle, victory, defeat
```

The SFX `<name>` values are the `SfxName` union in `sound.ts`
(`click, sword, horn, gong, arrow, fire, coin, defeat, victory, march, bell,
dirge, crash, whoosh, pluck, quake, thud, shout, wardrum, retreat, forge,
wedding`, plus `open-modal`).

## How to turn them on

Call once at startup (e.g. in `src/main.tsx`), after the files exist:

```ts
import { enableAudioFiles } from './game/systems/sound';
enableAudioFiles();                 // maps every name → /audio/sfx|music/<name>.mp3
// or register only the ones you have:
import { registerSfxSamples, registerMusicFiles } from './game/systems/sound';
registerSfxSamples({ sword: '/audio/sfx/sword.mp3', crash: '/audio/sfx/crash.mp3' });
registerMusicFiles({ battle: '/audio/music/battle.mp3' });
```

Missing names/tracks silently fall back to the synth, so partial packs are fine.
`enableAudioFiles()` is intentionally **not** called by default (so no 404s when
the folder is empty) — wire it once you've added a pack.

## 真人配音 (recorded voice lines)

The duel/debate barbs speak via the device's system TTS by default. To use real
recordings instead, drop clips in `public/audio/voice/` and register them:

```
public/audio/voice/<key>.mp3     e.g. voice/lu-bu-ult.mp3, voice/guan-yu-taunt.mp3
```

```ts
import { registerVoiceClips } from './game/systems/sound';
registerVoiceClips({
  'lu-bu-ult': '/audio/voice/lu-bu-ult.mp3',
  'guan-yu-taunt': '/audio/voice/guan-yu-taunt.mp3',
});
```

The keys the 單挑 currently passes are `<officerId>-ult` (on a finisher) and
`<officerId>-taunt` (on the pre-duel goad), for the famous officers in
`src/game/data/officerLines.ts`. A registered clip plays instead of TTS; anything
unregistered keeps the TTS voice.
