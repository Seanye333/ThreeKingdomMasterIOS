/**
 * Tiny synthesized sound effects via Web Audio API. No external audio files —
 * just oscillator-based stings for atmosphere.
 *
 * Call `playSfx(name)` from UI events; it's a no-op if disabled or unsupported.
 */

let ctx: AudioContext | null = null;
let enabled = true;
let unlockAttempted = false;
let ambienceNode: { oscillators: OscillatorNode[]; gain: GainNode } | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const Ctor = (window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Browsers require user interaction before audio can play. Call this from
 * any click handler to unlock the context.
 */
export function unlockAudio(): void {
  if (unlockAttempted) return;
  unlockAttempted = true;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => undefined);
  }
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (!on && ambienceNode) {
    stopAmbience();
  }
  if (!on) {
    stopMapAmbience();
  }
}

export type SfxName =
  | 'click'         // UI click
  | 'open-modal'    // panel pops up
  | 'sword'         // attack
  | 'horn'          // end-of-turn / season
  | 'gong'          // historical event
  | 'arrow'         // ranged attack
  | 'fire'          // fire stratagem
  | 'coin'          // gold transaction
  | 'defeat'        // bad news
  | 'victory'       // good news
  | 'march'         // march issued
  | 'bell'          // recruit success / officer joins
  | 'dirge'         // officer death
  | 'crash'         // stratagem succeeds / city falls
  | 'whoosh'        // modal close
  | 'pluck'         // hover / subtle tick
  | 'quake'         // critical event
  | 'thud'          // ram hits a gate / repair hammering
  | 'shout';        // war cry — charge, sally, rout

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  attack?: number;
  decay?: number;
  gain?: number;
  detune?: number;
  /** Cents/sec frequency sweep. */
  sweep?: number;
}

const SFX_PATTERNS: Record<SfxName, Tone[]> = {
  click: [{ freq: 700, duration: 0.04, type: 'square', gain: 0.06 }],
  'open-modal': [
    { freq: 440, duration: 0.07, type: 'sine', gain: 0.1 },
    { freq: 660, duration: 0.07, type: 'sine', gain: 0.1 },
  ],
  sword: [
    { freq: 220, duration: 0.08, type: 'sawtooth', gain: 0.16, sweep: -800 },
    { freq: 110, duration: 0.1, type: 'sawtooth', gain: 0.12 },
  ],
  horn: [
    { freq: 196, duration: 0.5, type: 'square', gain: 0.12 },
    { freq: 261, duration: 0.6, type: 'square', gain: 0.12 },
  ],
  gong: [
    { freq: 110, duration: 1.2, type: 'sine', gain: 0.22, sweep: -40 },
    { freq: 165, duration: 1.2, type: 'sine', gain: 0.18 },
  ],
  arrow: [{ freq: 1500, duration: 0.12, type: 'sawtooth', gain: 0.08, sweep: -3000 }],
  fire: [
    { freq: 80, duration: 0.5, type: 'sawtooth', gain: 0.1 },
    { freq: 60, duration: 0.5, type: 'sawtooth', gain: 0.1 },
  ],
  coin: [
    { freq: 1200, duration: 0.05, type: 'triangle', gain: 0.1 },
    { freq: 1600, duration: 0.05, type: 'triangle', gain: 0.1 },
  ],
  defeat: [
    { freq: 300, duration: 0.3, type: 'sawtooth', gain: 0.18, sweep: -200 },
    { freq: 150, duration: 0.5, type: 'sawtooth', gain: 0.18, sweep: -100 },
  ],
  victory: [
    { freq: 523, duration: 0.15, type: 'triangle', gain: 0.18 },
    { freq: 659, duration: 0.15, type: 'triangle', gain: 0.18 },
    { freq: 784, duration: 0.25, type: 'triangle', gain: 0.18 },
  ],
  march: [
    { freq: 110, duration: 0.12, type: 'square', gain: 0.14 },
    { freq: 165, duration: 0.12, type: 'square', gain: 0.14 },
    { freq: 220, duration: 0.2, type: 'square', gain: 0.14 },
  ],
  bell: [
    { freq: 880, duration: 0.6, type: 'sine', gain: 0.18, sweep: -300 },
    { freq: 660, duration: 0.4, type: 'sine', gain: 0.12 },
  ],
  dirge: [
    { freq: 196, duration: 0.5, type: 'sine', gain: 0.12 },
    { freq: 165, duration: 0.5, type: 'sine', gain: 0.12 },
    { freq: 130, duration: 0.8, type: 'sine', gain: 0.14 },
  ],
  crash: [
    { freq: 200, duration: 0.08, type: 'sawtooth', gain: 0.2, sweep: -2000 },
    { freq: 80, duration: 0.25, type: 'square', gain: 0.16 },
  ],
  whoosh: [
    { freq: 600, duration: 0.15, type: 'sine', gain: 0.08, sweep: -1200 },
  ],
  pluck: [
    { freq: 1100, duration: 0.03, type: 'triangle', gain: 0.05 },
  ],
  quake: [
    { freq: 50, duration: 0.6, type: 'sawtooth', gain: 0.22 },
    { freq: 70, duration: 0.4, type: 'sawtooth', gain: 0.18 },
  ],
  thud: [
    { freq: 95, duration: 0.12, type: 'sine', gain: 0.22, sweep: -300 },
    { freq: 60, duration: 0.18, type: 'triangle', gain: 0.18 },
  ],
  shout: [
    { freq: 220, duration: 0.18, type: 'sawtooth', gain: 0.07, sweep: 280 },
    { freq: 165, duration: 0.22, type: 'sawtooth', gain: 0.06, sweep: 220, detune: 18 },
    { freq: 330, duration: 0.14, type: 'square', gain: 0.03, sweep: 240 },
  ],
};

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  unlockAudio();
  const pattern = SFX_PATTERNS[name];
  if (!pattern) return;
  let t = c.currentTime;
  for (const tone of pattern) {
    playTone(c, tone, t);
    t += tone.duration;
  }
}

function playTone(c: AudioContext, t: Tone, when: number): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = t.type ?? 'sine';
  osc.frequency.setValueAtTime(t.freq, when);
  if (t.sweep) {
    osc.frequency.linearRampToValueAtTime(
      Math.max(20, t.freq + t.sweep * t.duration),
      when + t.duration,
    );
  }
  if (t.detune) osc.detune.setValueAtTime(t.detune, when);
  const peak = t.gain ?? 0.1;
  const attack = t.attack ?? 0.005;
  const decay = t.decay ?? 0.02;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(peak, when + attack);
  gain.gain.linearRampToValueAtTime(0, when + t.duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(when);
  osc.stop(when + t.duration + decay);
}

/**
 * Layered drone ambience — three slow detuned oscillators evoking distant
 * windborne flutes. Loops until stopAmbience() is called.
 */
export function startAmbience(): void {
  if (!enabled) return;
  if (ambienceNode) return;
  const c = getCtx();
  if (!c) return;
  unlockAudio();

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.04, c.currentTime + 4);
  gain.connect(c.destination);

  // Bordun: A2, E3, A3 — slightly detuned for a shimmer.
  const freqs = [110, 165, 220];
  const oscs: OscillatorNode[] = [];
  for (const f of freqs) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = (Math.random() - 0.5) * 12;
    osc.connect(gain);
    osc.start();
    oscs.push(osc);
  }
  ambienceNode = { oscillators: oscs, gain };
}

/* ─── 大地圖環境音 — wind, birds, crickets, war drums ──────────────────
   A quiet bed under the strategic map: looped filtered noise as wind,
   plus mode-dependent flourishes on a slow timer — bird chirps by day,
   crickets at dusk, distant war drums while a battle burns. All
   synthesized; no files, nothing to load. */
type MapAmbienceMode = 'day' | 'dusk' | 'war';
let mapAmb: {
  src: AudioBufferSourceNode;
  gain: GainNode;
  timer: number;
  mode: MapAmbienceMode;
} | null = null;

function noiseBuffer(c: AudioContext, seconds = 2): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function birdChirp(c: AudioContext, when: number): void {
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    const t0 = when + i * 0.14 + Math.random() * 0.04;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2900 + Math.random() * 700, t0);
    osc.frequency.exponentialRampToValueAtTime(2200, t0 + 0.07);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.014, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  }
}

function cricketChirp(c: AudioContext, when: number): void {
  for (let i = 0; i < 5; i++) {
    const t0 = when + i * 0.055;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 4300;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.01, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.05);
  }
}

function ambWarDrum(c: AudioContext, when: number): void {
  for (const dt of [0, 0.42]) {
    const t0 = when + dt;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(82, t0);
    osc.frequency.exponentialRampToValueAtTime(46, t0 + 0.2);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.4);
  }
}

export function startMapAmbience(mode: MapAmbienceMode = 'day'): void {
  if (!enabled || mapAmb) return;
  const c = getCtx();
  if (!c) return;
  unlockAudio();
  // Mounted outside a user gesture the context may still be suspended —
  // resume on the next pointer tap.
  if (c.state === 'suspended') {
    const resume = () => {
      c.resume().catch(() => undefined);
      window.removeEventListener('pointerdown', resume);
    };
    window.addEventListener('pointerdown', resume);
  }

  // Wind bed — looped noise through a gentle bandpass.
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.018, c.currentTime + 3);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();

  const timer = window.setInterval(() => {
    if (!mapAmb || !enabled) return;
    const ctx2 = getCtx();
    if (!ctx2 || ctx2.state !== 'running') return;
    const when = ctx2.currentTime + 0.05;
    if (mapAmb.mode === 'war') ambWarDrum(ctx2, when);
    else if (mapAmb.mode === 'dusk') { if (Math.random() < 0.75) cricketChirp(ctx2, when); }
    else if (Math.random() < 0.55) birdChirp(ctx2, when);
  }, 2800);

  mapAmb = { src, gain, timer, mode };
}

export function setMapAmbienceMode(mode: MapAmbienceMode): void {
  if (mapAmb) mapAmb.mode = mode;
}

export function stopMapAmbience(): void {
  if (!mapAmb) return;
  const amb = mapAmb;
  mapAmb = null;
  window.clearInterval(amb.timer);
  const c = getCtx();
  if (!c) return;
  amb.gain.gain.cancelScheduledValues(c.currentTime);
  amb.gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
  setTimeout(() => {
    try { amb.src.stop(); } catch { /* already stopped */ }
  }, 600);
}

export function stopAmbience(): void {
  if (!ambienceNode) return;
  const c = getCtx();
  if (!c) {
    ambienceNode = null;
    return;
  }
  ambienceNode.gain.gain.cancelScheduledValues(c.currentTime);
  ambienceNode.gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
  setTimeout(() => {
    if (!ambienceNode) return;
    for (const o of ambienceNode.oscillators) {
      try {
        o.stop();
      } catch {
        // ignore
      }
    }
    ambienceNode = null;
  }, 600);
}

// ─── City-interior ambience ──────────────────────────────────────────
// A warm low drone + a soft filtered-noise murmur (crowd/breeze) + the odd
// bird chirp. Played while the 城内 view is open. All synthesised, no assets.
let cityAmb: {
  sources: Array<OscillatorNode | AudioBufferSourceNode>;
  gain: GainNode;
  timer: ReturnType<typeof setInterval>;
} | null = null;

export function startCityAmbience(): void {
  if (!enabled) return;
  if (cityAmb) return;
  const c = getCtx();
  if (!c) return;
  unlockAudio();

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 3);
  gain.connect(c.destination);

  const sources: Array<OscillatorNode | AudioBufferSourceNode> = [];

  // Warm low drone — two detuned triangles.
  for (const f of [98, 147]) {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 10;
    const g = c.createGain();
    g.gain.value = 0.45;
    o.connect(g); g.connect(gain); o.start();
    sources.push(o);
  }

  // Soft murmur bed — looping low-passed noise (distant crowd + breeze).
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = buf; noise.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.6;
  const ng = c.createGain(); ng.gain.value = 0.5;
  noise.connect(lp); lp.connect(ng); ng.connect(gain); noise.start();
  sources.push(noise);

  // Occasional bird chirp — a quick up-down whistle.
  const chirp = () => {
    if (!cityAmb) return;
    const o = c.createOscillator(); o.type = 'sine';
    const g = c.createGain();
    const t = c.currentTime;
    const base = 1600 + Math.random() * 900;
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.06);
    o.frequency.exponentialRampToValueAtTime(base * 0.85, t + 0.15);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(gain); o.start(t); o.stop(t + 0.26);
  };
  const timer = setInterval(() => {
    if (!enabled) return;
    if (Math.random() < 0.5) {
      chirp();
      if (Math.random() < 0.4) setTimeout(chirp, 150);
    }
  }, 1800);

  cityAmb = { sources, gain, timer };
}

export function stopCityAmbience(): void {
  if (!cityAmb) return;
  const old = cityAmb;
  cityAmb = null;
  clearInterval(old.timer);
  const c = getCtx();
  if (!c) return;
  old.gain.gain.cancelScheduledValues(c.currentTime);
  old.gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
  setTimeout(() => {
    for (const s of old.sources) { try { s.stop(); } catch { /* ignore */ } }
  }, 600);
}

// ─── Battlefield ambience — war drums + low rumble + distant cries ──
let battleAmb: { sources: Array<OscillatorNode | AudioBufferSourceNode>; gain: GainNode; timer: ReturnType<typeof setInterval> } | null = null;

export function startBattleAmbience(): void {
  if (!enabled || battleAmb) return;
  const c = getCtx();
  if (!c) return;
  unlockAudio();

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.055, c.currentTime + 2.5);
  gain.connect(c.destination);

  const sources: Array<OscillatorNode | AudioBufferSourceNode> = [];

  // Ominous low drone — a war field hum.
  for (const f of [55, 82.5]) {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 8;
    const g = c.createGain();
    g.gain.value = 0.4;
    o.connect(g); g.connect(gain); o.start();
    sources.push(o);
  }

  // Wind / distant host — looping low-passed noise.
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = buf; noise.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.7;
  const ng = c.createGain(); ng.gain.value = 0.55;
  noise.connect(lp); lp.connect(ng); ng.connect(gain); noise.start();
  sources.push(noise);

  // War drums — a slow double-beat heartbeat, slightly humanized.
  const drum = (t: number, loud = 1) => {
    const o = c.createOscillator(); o.type = 'sine';
    const g = c.createGain();
    o.frequency.setValueAtTime(72, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5 * loud, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(gain); o.start(t); o.stop(t + 0.34);
  };
  const timer = setInterval(() => {
    if (!enabled || !battleAmb) return;
    const t = c.currentTime + 0.05 + Math.random() * 0.06;
    drum(t);
    drum(t + 0.34, 0.6);
    // Now and then, a distant massed cry rolls over the field.
    if (Math.random() < 0.18) {
      const cry = c.createBufferSource();
      cry.buffer = buf; cry.loop = false;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 300; bp.Q.value = 1.6;
      const cg = c.createGain();
      const ct = c.currentTime + 0.2;
      cg.gain.setValueAtTime(0, ct);
      cg.gain.linearRampToValueAtTime(0.10, ct + 0.25);
      cg.gain.exponentialRampToValueAtTime(0.001, ct + 1.4);
      cry.connect(bp); bp.connect(cg); cg.connect(gain);
      cry.start(ct); cry.stop(ct + 1.5);
    }
  }, 2400);

  battleAmb = { sources, gain, timer };
}

export function stopBattleAmbience(): void {
  if (!battleAmb) return;
  const old = battleAmb;
  battleAmb = null;
  clearInterval(old.timer);
  const c = getCtx();
  if (!c) return;
  old.gain.gain.cancelScheduledValues(c.currentTime);
  old.gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
  setTimeout(() => {
    for (const s of old.sources) { try { s.stop(); } catch { /* ignore */ } }
  }, 700);
}

// ─── Music tracks ────────────────────────────────────────────────────

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicGainNode: GainNode | null = null;
let musicExtra: AudioNode[] = [];

export type MusicTrack = 'peace' | 'tension' | 'battle' | 'victory' | 'defeat' | null;

interface TrackDef {
  /** Milliseconds per step. */
  tempo: number;
  /** Master music gain. */
  gain: number;
  /** Reverb (feedback-delay) wet amount, 0–1. */
  reverb: number;
  /** Melody line — one frequency per step (0 = rest). */
  melody: number[];
  melodyType: OscillatorType;
  /** Bass line — sparser, lower. */
  bass: number[];
  bassType: OscillatorType;
  /** Sustained chord re-struck at the top of each loop. */
  pad?: number[];
  /** Step indices (mod melody length) that strike a war drum. */
  drumSteps?: number[];
}

/**
 * Layered procedural score — each track stacks a guzheng-pluck melody, a bass
 * line, an optional soft pad and war-drum percussion through a feedback-delay
 * reverb. Pentatonic throughout so the voices stay consonant. No audio files.
 */
const MUSIC_TRACKS: Record<Exclude<MusicTrack, null>, TrackDef> = {
  peace: {
    tempo: 500, gain: 0.06, reverb: 0.38,
    melody: [392, 0, 440, 392, 0, 330, 294, 0, 330, 392, 0, 262, 294, 330, 0, 0],
    melodyType: 'triangle',
    bass: [131, 0, 0, 0, 98, 0, 0, 0, 131, 0, 0, 0, 110, 0, 0, 0],
    bassType: 'sine',
    pad: [262, 330, 392],
  },
  tension: {
    tempo: 360, gain: 0.055, reverb: 0.3,
    melody: [330, 0, 294, 0, 262, 0, 294, 330, 0, 247, 262, 0, 294, 0, 247, 0],
    melodyType: 'triangle',
    bass: [110, 0, 110, 0, 98, 0, 98, 0, 110, 0, 110, 0, 82, 0, 82, 0],
    bassType: 'triangle',
    drumSteps: [0, 8],
  },
  battle: {
    tempo: 230, gain: 0.065, reverb: 0.18,
    melody: [330, 392, 440, 392, 330, 294, 330, 440, 392, 330, 294, 330, 392, 440, 494, 440],
    melodyType: 'sawtooth',
    bass: [110, 0, 110, 0, 110, 0, 110, 0, 98, 0, 98, 0, 110, 0, 110, 0],
    bassType: 'sawtooth',
    drumSteps: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  victory: {
    tempo: 300, gain: 0.07, reverb: 0.3,
    melody: [392, 392, 440, 494, 587, 0, 494, 440, 392, 440, 494, 587, 659, 0, 587, 0],
    melodyType: 'triangle',
    bass: [131, 0, 196, 0, 131, 0, 196, 0, 131, 0, 196, 0, 131, 0, 131, 0],
    bassType: 'sine',
    pad: [262, 330, 392],
    drumSteps: [0, 4, 8, 12],
  },
  defeat: {
    tempo: 640, gain: 0.05, reverb: 0.42,
    melody: [330, 0, 294, 0, 262, 0, 247, 0, 220, 0, 196, 0, 220, 0, 0, 0],
    melodyType: 'sine',
    bass: [110, 0, 0, 0, 98, 0, 0, 0, 87, 0, 0, 0, 82, 0, 0, 0],
    bassType: 'sine',
    pad: [220, 262, 330],
  },
};

/** A plucked/struck note with a fast attack + exponential decay (guzheng-ish). */
function pluck(c: AudioContext, freq: number, type: OscillatorType, dur: number, peak: number, dry: AudioNode, wet: AudioNode | null): void {
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(dry);
  if (wet) g.connect(wet);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** A soft sustained chord under the melody. */
function padChord(c: AudioContext, freqs: number[], dur: number, dry: AudioNode): void {
  const t = c.currentTime;
  for (const f of freqs) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(dry);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

/** A war drum — a pitch-dropping sine thump. */
function warDrum(c: AudioContext, dry: AudioNode, wet: AudioNode | null): void {
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(155, t);
  osc.frequency.exponentialRampToValueAtTime(52, t + 0.16);
  const g = c.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(g);
  g.connect(dry);
  if (wet) g.connect(wet);
  osc.start(t);
  osc.stop(t + 0.25);
}

export function playMusic(track: MusicTrack): void {
  stopMusic();
  if (!track || !enabled) return;
  const c = getCtx();
  if (!c) return;
  unlockAudio();
  const def = MUSIC_TRACKS[track];
  if (!def) return;

  // Master music bus.
  musicGainNode = c.createGain();
  musicGainNode.gain.setValueAtTime(0, c.currentTime);
  musicGainNode.gain.linearRampToValueAtTime(def.gain, c.currentTime + 2);
  musicGainNode.connect(c.destination);

  // Feedback-delay reverb send — gives the voices space.
  const delay = c.createDelay(1.0);
  delay.delayTime.value = 0.27;
  const feedback = c.createGain();
  feedback.gain.value = 0.3;
  const wetGain = c.createGain();
  wetGain.gain.value = def.reverb;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(musicGainNode);
  musicExtra = [delay, feedback, wetGain];

  const dry: AudioNode = musicGainNode;
  const wet: AudioNode = delay;
  const len = def.melody.length;
  const stepDur = def.tempo / 1000;
  let i = 0;
  musicTimer = setInterval(() => {
    if (!enabled || !c || !musicGainNode) {
      stopMusic();
      return;
    }
    const step = i % len;
    const mf = def.melody[step];
    if (mf) pluck(c, mf, def.melodyType, stepDur * 0.92, 0.5, dry, wet);
    const bf = def.bass[step % def.bass.length];
    if (bf) pluck(c, bf, def.bassType, stepDur * 1.7, 0.4, dry, null);
    if (def.drumSteps && def.drumSteps.includes(step)) warDrum(c, dry, wet);
    if (def.pad && step === 0) padChord(c, def.pad, stepDur * len, dry);
    i++;
  }, def.tempo);
}

export function stopMusic(): void {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  const c = getCtx();
  if (c && musicGainNode) {
    musicGainNode.gain.cancelScheduledValues(c.currentTime);
    musicGainNode.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
    const old = musicGainNode;
    const extra = musicExtra;
    setTimeout(() => {
      try { old.disconnect(); } catch { /* ignore */ }
      for (const n of extra) { try { n.disconnect(); } catch { /* ignore */ } }
    }, 600);
    musicGainNode = null;
    musicExtra = [];
  }
}
