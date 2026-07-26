/* 四時之色 — the seasonal/diurnal colour grade fed to ScenePostFx.
 *
 * A plain function, so it lives apart from the component file: React Fast
 * Refresh cannot hot-swap a module that mixes components with values
 * (react-refresh/only-export-components). */

/**
 * 四時之色 — the seasonal/diurnal grade.
 *
 * Kept as data rather than baked into lights so the whole frame shifts
 * together (terrain, units, UI-adjacent 3D) instead of only the lit surfaces.
 * Deliberately gentle: this is a tint over a palette that already changes with
 * the season, not a filter that replaces it.
 */
export function seasonGrade(
  season: 'spring' | 'summer' | 'autumn' | 'winter',
  night = false,
): { saturation: number; contrast: number; brightness: number } {
  if (night) return { saturation: -0.06, contrast: 0.16, brightness: -0.02 };
  switch (season) {
    case 'spring': return { saturation: 0.10, contrast: 0.08, brightness: 0.01 };
    case 'summer': return { saturation: 0.14, contrast: 0.10, brightness: 0.00 };
    case 'autumn': return { saturation: 0.16, contrast: 0.12, brightness: 0.00 };
    case 'winter': return { saturation: -0.04, contrast: 0.14, brightness: 0.02 };
  }
}
