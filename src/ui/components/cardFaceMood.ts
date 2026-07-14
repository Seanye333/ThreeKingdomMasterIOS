import type { Officer } from '../../game/types';

/**
 * 動態卡面 — the card's backdrop breathes with the officer's present state.
 * A card is not a static print: a wounded general's frame cracks red, a
 * captive's darkens behind bars, an elder in retirement warms to dusk, a
 * marching column kicks up dust, and winter frosts them all. Purely a
 * translucent overlay laid over the portrait (the base art is untouched), so
 * it composes with an 異畫 face or the plain one alike. The departed keep
 * their sepia (handled on the card itself) — this returns null for them.
 */
export interface CardMood {
  id: string;
  zh: string;
  en: string;
  /** Translucent CSS layered over the art. */
  overlay: string;
  /** Accent colour for the mood tag. */
  accent: string;
  glyph: string;
}

export function cardFaceMood(officer: Officer, season?: string): CardMood | null {
  // The dead already render in heirloom sepia — no mood layer over that.
  if (officer.status === 'dead') return null;

  const winter = season === 'winter';
  const frost = winter
    ? 'radial-gradient(120% 60% at 50% 0%, rgba(200,224,255,0.14), transparent 60%)'
    : '';

  let mood: CardMood | null = null;
  if (officer.status === 'wounded') {
    const grave = officer.woundSeverity === 'critical';
    mood = {
      id: 'wounded', zh: grave ? '瀕死' : '負傷', en: grave ? 'Grievously Wounded' : 'Wounded',
      overlay: `radial-gradient(90% 70% at 50% 40%, transparent 45%, rgba(150,20,20,${grave ? 0.42 : 0.26}) 100%)`,
      accent: '#e0907a', glyph: '傷',
    };
  } else if (officer.status === 'imprisoned') {
    mood = {
      id: 'imprisoned', zh: '囹圄', en: 'Captive',
      overlay: 'repeating-linear-gradient(90deg, rgba(10,12,16,0.55) 0 3px, transparent 3px 34px)',
      accent: '#8a94a0', glyph: '囚',
    };
  } else if (officer.status === 'retired') {
    mood = {
      id: 'retired', zh: '致仕', en: 'Retired',
      overlay: 'linear-gradient(180deg, rgba(180,130,50,0.16), transparent 55%)',
      accent: '#d8b060', glyph: '隱',
    };
  } else if (officer.status === 'active' && officer.task) {
    // On campaign / assigned — dust of the road.
    mood = {
      id: 'onduty', zh: '在途', en: 'On Campaign',
      overlay: 'linear-gradient(0deg, rgba(120,96,50,0.22), transparent 40%)',
      accent: '#c9b98a', glyph: '征',
    };
  }

  if (!mood && !winter) return null;
  if (!mood && winter) {
    return { id: 'winter', zh: '歲寒', en: 'Deep Winter', overlay: frost, accent: '#a8c8e8', glyph: '冬' };
  }
  // Fold winter frost onto whatever mood is showing.
  if (mood && winter) {
    return { ...mood, overlay: `${mood.overlay}, ${frost}`, zh: `${mood.zh}·歲寒`, en: `${mood.en} · Winter` };
  }
  return mood;
}
