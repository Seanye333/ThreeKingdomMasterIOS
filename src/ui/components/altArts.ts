import { loadAchievementProgress } from '../../game/systems/achievements';

/**
 * 名場面異畫 — alternate "art" treatments for an officer's card, each unlocked
 * by living out that officer's famous moment (an achievement gate). We hold no
 * second portrait per officer, so an 異畫 is a *restyle* of the same card — a
 * themed backdrop, an accent, a corner emblem and an epithet line — that turns
 * a deed you earned into a collectible face. Pure chrome, zero mechanics; the
 * card modal offers a toggle when at least one is unlocked.
 */
export interface AltArt {
  id: string;
  officerId: string;
  /** The moment this face commemorates. */
  zh: string;
  en: string;
  /** Achievement id that unlocks it (see data/achievements.ts). */
  requires: string;
  /** CSS background layered under the portrait. */
  bg: string;
  /** Accent colour for the epithet banner + emblem. */
  accent: string;
  /** Corner emblem glyph. */
  glyph: string;
  /** Epithet couplet shown on the 異畫 face. */
  quoteZh: string;
  quoteEn: string;
}

export const ALT_ARTS: AltArt[] = [
  {
    id: 'guan-yu-qianli', officerId: 'guan-yu', zh: '千里走單騎', en: 'The Solitary Ride',
    requires: 'ach-recruit-guan-yu', accent: '#e6c473', glyph: '義',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(120,20,20,0.5), rgba(20,10,8,0.9))',
    quoteZh: '掛印封金,過五關斬六將', quoteEn: 'He sealed the gold and rode through five passes',
  },
  {
    id: 'guan-yu-yanliang', officerId: 'guan-yu', zh: '白馬斬顏良', en: 'Slaying Yan Liang',
    requires: 'ach-slay-yan-liang', accent: '#e0907a', glyph: '刀',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(150,40,30,0.5), rgba(18,10,8,0.9))',
    quoteZh: '萬軍之中,取上將首級如探囊', quoteEn: 'Through ten thousand, he took the general\'s head',
  },
  {
    id: 'zhaoyun-changban', officerId: 'zhao-yun', zh: '長坂坡救主', en: 'The Long Slope',
    requires: 'ach-recruit-zhao-yun', accent: '#8fe3ff', glyph: '膽',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(30,60,120,0.5), rgba(8,12,20,0.9))',
    quoteZh: '七進七出,懷抱幼主血染征袍', quoteEn: 'Seven charges through, the child safe at his breast',
  },
  {
    id: 'zhuge-longzhong', officerId: 'zhuge-liang', zh: '隆中對', en: 'The Longzhong Plan',
    requires: 'ach-three-visits', accent: '#a8d8a8', glyph: '龍',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(30,90,60,0.45), rgba(8,16,12,0.9))',
    quoteZh: '未出茅廬,已定三分天下', quoteEn: 'Still in his hut, he divided the realm in three',
  },
  {
    id: 'zhuge-kongcheng', officerId: 'zhuge-liang', zh: '空城撫琴', en: 'The Empty Fort',
    requires: 'ach-empty-fort', accent: '#c9b98a', glyph: '琴',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(90,70,30,0.45), rgba(16,12,8,0.9))',
    quoteZh: '焚香操琴,笑退司馬十萬兵', quoteEn: 'Incense and a zither turned back a hundred thousand',
  },
  {
    id: 'zhuge-wuzhang', officerId: 'zhuge-liang', zh: '秋風五丈原', en: 'Autumn at Wuzhang',
    requires: 'ach-wuzhang', accent: '#b7a8ff', glyph: '星',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(60,50,100,0.45), rgba(10,10,18,0.92))',
    quoteZh: '出師未捷身先死,長使英雄淚滿襟', quoteEn: 'He died ere victory — and heroes weep still',
  },
  {
    id: 'zhouyu-chibi', officerId: 'zhou-yu', zh: '談笑退曹', en: 'Fire at Red Cliff',
    requires: 'ach-chibi', accent: '#ff9a5a', glyph: '火',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(150,60,20,0.5), rgba(18,10,8,0.9))',
    quoteZh: '談笑間,檣櫓灰飛煙滅', quoteEn: 'Amid talk and laughter, a fleet turned to ash',
  },
  {
    id: 'lubu-duel', officerId: 'lu-bu', zh: '虎牢逞威', en: 'The Beast of Hulao',
    requires: 'ach-duel-lu-bu', accent: '#e05a5a', glyph: '戟',
    bg: 'radial-gradient(120% 90% at 50% 0%, rgba(120,30,30,0.5), rgba(16,8,8,0.92))',
    quoteZh: '人中呂布,馬中赤兔', quoteEn: 'Among men, Lü Bu; among horses, Red Hare',
  },
];

export function altArtsFor(officerId: string): AltArt[] {
  return ALT_ARTS.filter((a) => a.officerId === officerId);
}

/** Alt-arts for this officer whose achievement is complete. */
export function unlockedAltArts(officerId: string): AltArt[] {
  const done = loadAchievementProgress().completed;
  return altArtsFor(officerId).filter((a) => done[a.requires]);
}
