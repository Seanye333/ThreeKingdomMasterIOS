# 真實音效 / 配樂 / 配音 (optional recorded audio)

The game ships with **synthesized** sound (oscillator stings + a procedural
score in `src/game/systems/sound.ts`) and **system TTS** for spoken lines. It
needs **no audio files at all** to sound complete.

Recorded files are an **optional override**: drop them here and flip
**Settings → 音響 → 真實音效包 (Real audio pack)** on. Anything you don't provide
falls back to the synth/TTS automatically — partial packs are fine.

The paths below are already wired (`App.tsx` calls `enableAudioFiles()` +
`registerOfficerVoiceClips(...)` at startup), so you only need to **add files
matching these names** and turn the toggle on. Nothing is fetched while the
toggle is off, so an empty folder causes no 404s.

> Format: **mp3** is safest (works in iOS WKWebView / Tauri). Avoid `.ogg` on iOS.

---

## 1) 音效 SFX — `public/audio/sfx/<name>.mp3`  (23 files)

The `<name>` values are the `SfxName` union in `sound.ts`:

```
click   open-modal   sword   horn    gong     arrow    fire    coin
defeat  victory      march   bell    dirge    crash    whoosh  pluck
quake   thud         shout   wardrum retreat  forge    wedding
```

## 2) 配樂 Music — `public/audio/music/<track>.mp3`  (5 files)

```
peace   tension   battle   victory   defeat
```

These loop; pick something seamless.

## 3) 武將配音 Voice — `public/audio/voice/<id>-<kind>.mp3`

`<kind>` is `taunt` (pre-duel goad) or `ult` (cried on a finisher). The 12
officers with signature lines (`src/game/data/officerLines.ts`):

```
lu-bu       guan-yu     zhang-fei   zhao-yun
ma-chao     dian-wei    xu-chu      taishi-ci
gan-ning    huang-zhong zhang-liao  sun-ce
```

→ 24 files, e.g. `lu-bu-taunt.mp3`, `lu-bu-ult.mp3`, `guan-yu-taunt.mp3`, …
Any clip you skip keeps the system-TTS voice for that line.

---

## Notes

- **Stratagem-cast stings** (火/雷/弓/騎… the 37 `StratagemFxKind` families) and
  **event mood cues** are synth-only — there is no file-override path for them.
- To register only a subset by hand instead of the convention helpers, see
  `registerSfxSamples` / `registerMusicFiles` / `registerVoiceClips` in
  `sound.ts`.
