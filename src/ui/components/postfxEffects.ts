/* 自訂後處理效果 — colour-grade (色溫/色調/提黑/增益) and heat-haze (熱浪扭曲).
 *
 * postprocessing's stock passes stop at saturation/contrast; a believable
 * 四時之色 needs temperature (winter's steel blue, autumn's amber) and a
 * gentle lift/gain so the grade behaves like a LUT without shipping LUT
 * textures. Both effects are ~a dozen shader instructions — cheap enough to
 * run wherever the composer runs.
 *
 * Plain classes + factory functions (no React) so Fast Refresh stays happy;
 * ScenePostFx wraps them in <primitive>. */

import { Effect, BlendFunction } from 'postprocessing';
import { Uniform } from 'three';

/* ─── 色彩分級 ─────────────────────────────────────────────────────── */

/**
 * 一顆效果做完整套分級 —— 而且**在色調映射之後**。
 *
 * ## 為什麼不用 library 的 HueSaturation / BrightnessContrast
 *
 * 因為它們會把畫面弄出**整格整格的純黑**,而且是在這個專案裡實際發生過的
 * (2026-07-30 目視驗收查到)。`hue-saturation.frag` 的最後一行是
 * `outputColor = vec4(min(color, 1.0), inputColor.a)` —— **只夾上限,不夾
 * 下限**。而它的飽和公式在 saturation = 0.10 時是
 *
 *     color' = 1.10988 · color − 0.10988 · average
 *
 * 於是任何低於該像素平均值約 10% 的通道會直接變成**負值**。負值流進 AgX
 * 色調映射就是黑。大地圖的六角格是純色平面,一整格的像素同時跨過門檻,
 * 所以壞掉的形狀正好是「整格整格的黑」。
 *
 * 它作用在**線性 HDR** 空間更是雪上加霜:飽和的暗部(深水、夜色)在線性空間
 * 裡最弱的通道本來就只有平均值的百分之幾,踩線的機會遠比在顯示參照空間高。
 *
 * ## 所以這裡的兩個原則
 *
 * 1. **分級跑在 ToneMapping 之後**,拿到的是 0..1 的顯示參照值 —— 對比以
 *    0.5 為樞軸、亮度加減、飽和度插值,全都是為這個範圍設計的運算。
 * 2. **最後一定 clamp(0, 1)**。上面那個 bug 的完整版本就是「有人只寫了一半」。
 */

const GRADE_FRAG = /* glsl */ `
  uniform float uSat;    // 飽和度增減(0 = 原樣)
  uniform float uCon;    // 對比增減
  uniform float uBri;    // 亮度加減
  uniform float uTemp;   // −1 寒 … +1 暖
  uniform float uTint;   // −1 洋紅 … +1 綠
  uniform float uLift;   // 黑位抬升
  uniform float uGain;   // 整體增益

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    c += uBri;
    c = (c - 0.5) * (1.0 + uCon) + 0.5;
    // 飽和 — 以感知亮度為軸插值,而不是三通道平均:灰軸取對了,推飽和才不會
    // 把綠色推成螢光。
    float y = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(y), c, 1.0 + uSat);
    c.r += uTemp * 0.075;
    c.b -= uTemp * 0.085;
    c.g += uTint * 0.05;
    c = c * uGain + vec3(uLift);
    outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
  }
`;

export interface ToneGrade {
  /** −1 (寒/青) … +1 (暖/金)。 */
  temperature: number;
  tint?: number;
  lift?: number;
  gain?: number;
}

export interface LookGrade {
  saturation: number;
  contrast: number;
  brightness?: number;
}

export class ColorGradeEffect extends Effect {
  constructor(look: LookGrade | null, tone: ToneGrade | null) {
    super('ColorGradeEffect', GRADE_FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['uSat', new Uniform(look?.saturation ?? 0)],
        ['uCon', new Uniform(look?.contrast ?? 0)],
        ['uBri', new Uniform(look?.brightness ?? 0)],
        ['uTemp', new Uniform(tone?.temperature ?? 0)],
        ['uTint', new Uniform(tone?.tint ?? 0)],
        ['uLift', new Uniform(tone?.lift ?? 0)],
        ['uGain', new Uniform(tone?.gain ?? 1)],
      ]),
    });
  }

  set(look: LookGrade | null, tone: ToneGrade | null): void {
    this.uniforms.get('uSat')!.value = look?.saturation ?? 0;
    this.uniforms.get('uCon')!.value = look?.contrast ?? 0;
    this.uniforms.get('uBri')!.value = look?.brightness ?? 0;
    this.uniforms.get('uTemp')!.value = tone?.temperature ?? 0;
    this.uniforms.get('uTint')!.value = tone?.tint ?? 0;
    this.uniforms.get('uLift')!.value = tone?.lift ?? 0;
    this.uniforms.get('uGain')!.value = tone?.gain ?? 1;
  }
}

/* ─── 熱浪扭曲 ─────────────────────────────────────────────────────── */

const HAZE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uHaze;   // 0 關 … 1 全開

  void mainUv(inout vec2 uv) {
    // 熱氣自地面升騰 — the wobble concentrates on the lower two thirds of the
    // frame and fades to nothing at the sky line.
    float mask = smoothstep(0.05, 0.6, 1.0 - uv.y);
    float w1 = sin(uv.y * 62.0 + uTime * 3.1) * cos(uv.x * 41.0 + uTime * 2.3);
    float w2 = cos(uv.y * 53.0 - uTime * 2.6);
    uv.x += w1 * 0.0016 * uHaze * mask;
    uv.y += w2 * 0.0010 * uHaze * mask;
  }
`;

export class HeatHazeEffect extends Effect {
  constructor(intensity = 1) {
    super('HeatHazeEffect', HAZE_FRAG, {
      uniforms: new Map<string, Uniform>([
        ['uTime', new Uniform(0)],
        ['uHaze', new Uniform(intensity)],
      ]),
    });
  }

  override update(_renderer: unknown, _inputBuffer: unknown, deltaTime?: number): void {
    this.uniforms.get('uTime')!.value += deltaTime ?? 0.016;
  }

  setIntensity(v: number): void {
    this.uniforms.get('uHaze')!.value = v;
  }
}

/* ─── 鏡頭光暈 ─────────────────────────────────────────────────────────
 *
 * Hand-rolled rather than @react-three/postprocessing's <LensFlare>, for two
 * separate reasons — both worth remembering before anyone "simplifies" this
 * back to the library component:
 *
 * 1. **It crashes.** That wrapper is built by the library's generic props
 *    factory, whose memo key is `JSON.stringify(props)`. Our flare position
 *    is derived from scene objects, and anything reachable from an Object3D
 *    closes a `children → parent` cycle: `TypeError: Converting circular
 *    structure to JSON`, thrown during render, taking the whole app down at
 *    campaign start. (Bisected 2026-07-29: tone/heatHaze clean, flare fatal.)
 * 2. **The same factory re-creates the effect on every render**, because the
 *    memo deps are the props object itself.
 *
 * This version is ~40 instructions of screen-space maths with the sun's UV fed
 * in from the CPU (see ScenePostFx), so it costs one pass and nothing else.
 */

const FLARE_FRAG = /* glsl */ `
  uniform vec2  uSunUv;     // sun in screen UV
  uniform float uFlare;     // 0 off … 1 full
  uniform vec3  uFlareColor;
  uniform float uAspect;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    if (uFlare > 0.001) {
      // Work in aspect-corrected space so ghosts stay round.
      vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
      vec2 s = (uSunUv - 0.5) * vec2(uAspect, 1.0);

      // 光斑 — the bloom around the disc itself.
      float glare = exp(-length(p - s) * 13.0) * 0.5;

      // 橫向拉絲 — the anamorphic streak a wide lens throws.
      float streak = exp(-abs(p.y - s.y) * 110.0) * exp(-abs(p.x - s.x) * 1.7) * 0.3;

      // 鬼影 — internal reflections march back through the frame centre.
      float ghosts = 0.0;
      for (int i = 1; i <= 5; i++) {
        vec2 gp = s * (-0.42 * float(i));
        float r = 0.05 + float(i) * 0.022;
        ghosts += smoothstep(r, 0.0, length(p - gp)) * (0.14 / float(i));
      }

      // 光環 — a faint ring opposite the sun.
      float halo = smoothstep(0.05, 0.0, abs(length(p + s * 0.55) - 0.26)) * 0.1;

      c += uFlareColor * (glare + streak + ghosts + halo) * uFlare;
    }
    outputColor = vec4(c, inputColor.a);
  }
`;

export class SunFlareEffect extends Effect {
  constructor() {
    super('SunFlareEffect', FLARE_FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['uSunUv', new Uniform({ x: 0.5, y: 0.5 })],
        ['uFlare', new Uniform(0)],
        ['uFlareColor', new Uniform({ r: 1, g: 0.95, b: 0.85 })],
        ['uAspect', new Uniform(1.78)],
      ]),
    });
  }

  /** Called from a useFrame in ScenePostFx once the sun is projected. */
  setSun(uvX: number, uvY: number, intensity: number, aspect: number): void {
    const uv = this.uniforms.get('uSunUv')!.value as { x: number; y: number };
    uv.x = uvX; uv.y = uvY;
    this.uniforms.get('uFlare')!.value = intensity;
    this.uniforms.get('uAspect')!.value = aspect;
  }

  setColor(r: number, g: number, b: number): void {
    const c = this.uniforms.get('uFlareColor')!.value as { r: number; g: number; b: number };
    c.r = r; c.g = g; c.b = b;
  }
}

/* ─── 畫風濾鏡 ─────────────────────────────────────────────────────────
 *
 * 絹本設色 — the whole frame read as a painting on silk: desaturated toward
 * a warm ground, paper grain over the top, edges of things darkened into
 * something like ink. It is deliberately a *post* effect rather than a
 * different set of materials, so it costs one pass and works identically on
 * all three 3D scenes plus every future one.
 *
 * The ink line is a cheap luminance Sobel on the colour buffer. That is not
 * a real edge detector — it finds contrast, not silhouettes — but on this
 * game's flat-shaded, high-contrast geometry it lands on the same lines a
 * brush would, and it needs no depth/normal buffer (which is the whole point:
 * see the NormalPass note in ScenePostFx — an extra scene pass would cost
 * more than everything else in the frame).
 */

const SILK_FRAG = /* glsl */ `
  uniform float uSilk;    // 0 off … 1 full
  uniform float uInk;     // ink-line strength
  uniform vec2  uTexel;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    if (uSilk > 0.001) {
      // 墨線 — Sobel over luminance; only the strong edges survive.
      float l00 = luma(texture(inputBuffer, uv + uTexel * vec2(-1.0, -1.0)).rgb);
      float l10 = luma(texture(inputBuffer, uv + uTexel * vec2( 0.0, -1.0)).rgb);
      float l20 = luma(texture(inputBuffer, uv + uTexel * vec2( 1.0, -1.0)).rgb);
      float l01 = luma(texture(inputBuffer, uv + uTexel * vec2(-1.0,  0.0)).rgb);
      float l21 = luma(texture(inputBuffer, uv + uTexel * vec2( 1.0,  0.0)).rgb);
      float l02 = luma(texture(inputBuffer, uv + uTexel * vec2(-1.0,  1.0)).rgb);
      float l12 = luma(texture(inputBuffer, uv + uTexel * vec2( 0.0,  1.0)).rgb);
      float l22 = luma(texture(inputBuffer, uv + uTexel * vec2( 1.0,  1.0)).rgb);
      float gx = (l20 + 2.0 * l21 + l22) - (l00 + 2.0 * l01 + l02);
      float gy = (l02 + 2.0 * l12 + l22) - (l00 + 2.0 * l10 + l20);
      float edge = smoothstep(0.16, 0.62, sqrt(gx * gx + gy * gy));

      // 絹底 — pull toward a warm silk ground and flatten the palette.
      vec3 silk = mix(vec3(luma(c)), c, 0.42) * vec3(1.06, 1.00, 0.86) + vec3(0.05, 0.04, 0.02);

      // 紙紋 — a still, fine grain locked to screen space (a moving grain
      // reads as video noise, not as paper).
      float grain = fract(sin(dot(uv * vec2(1024.0, 768.0), vec2(12.9898, 78.233))) * 43758.5453);
      silk *= 0.97 + grain * 0.06;

      silk = mix(silk, vec3(0.13, 0.11, 0.10), edge * uInk);
      c = mix(c, silk, uSilk);
    }
    outputColor = vec4(c, inputColor.a);
  }
`;

export class SilkPaintingEffect extends Effect {
  constructor(strength = 0, ink = 0.8) {
    super('SilkPaintingEffect', SILK_FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['uSilk', new Uniform(strength)],
        ['uInk', new Uniform(ink)],
        ['uTexel', new Uniform({ x: 1 / 1280, y: 1 / 720 })],
      ]),
    });
  }

  set(strength: number, ink: number): void {
    this.uniforms.get('uSilk')!.value = strength;
    this.uniforms.get('uInk')!.value = ink;
  }

  setSize(w: number, h: number): void {
    const t = this.uniforms.get('uTexel')!.value as { x: number; y: number };
    t.x = 1 / Math.max(1, w);
    t.y = 1 / Math.max(1, h);
  }
}
