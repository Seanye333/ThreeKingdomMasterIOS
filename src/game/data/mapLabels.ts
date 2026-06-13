/**
 * 大地圖地名 — named geography drawn straight onto the strategic map the way
 * the 三國志 series and Total War campaign maps label their terrain: the great
 * ranges, the rivers, the seas. Positions are real (lon, lat), placed along
 * the feature but nudged clear of the dense city clusters. Renderer-only.
 */
export type GeoLabelKind = 'mountain' | 'river' | 'sea';

export interface GeoLabel {
  kind: GeoLabelKind;
  zh: string;
  en: string;
  lon: number;
  lat: number;
}

export const GEO_LABELS: GeoLabel[] = [
  // ── 山脈 (ranges; mirror the MOUNTAINS ridges in geography.ts) ──
  { kind: 'mountain', zh: '秦嶺',   en: 'Qinling',     lon: 109.4, lat: 33.65 },
  { kind: 'mountain', zh: '巴山',   en: 'Ba Mts.',     lon: 108.2, lat: 32.0 },
  { kind: 'mountain', zh: '太行山', en: 'Taihang',     lon: 113.6, lat: 37.2 },
  { kind: 'mountain', zh: '燕山',   en: 'Yan Mts.',    lon: 117.6, lat: 41.2 },
  { kind: 'mountain', zh: '岷山',   en: 'Min Mts.',    lon: 98.2,  lat: 30.0 },
  { kind: 'mountain', zh: '隴山',   en: 'Long Mts.',   lon: 105.6, lat: 35.9 },
  { kind: 'mountain', zh: '祁連山', en: 'Qilian',      lon: 99.5,  lat: 38.4 },
  { kind: 'mountain', zh: '陰山',   en: 'Yin Mts.',    lon: 110.6, lat: 41.4 },
  { kind: 'mountain', zh: '武夷山', en: 'Wuyi',        lon: 117.4, lat: 26.4 },
  { kind: 'mountain', zh: '南嶺',   en: 'Nanling',     lon: 112.6, lat: 25.0 },
  { kind: 'mountain', zh: '橫斷山', en: 'Hengduan',    lon: 101.0, lat: 27.0 },
  // ── 大河 (the two great rivers labelled twice along their course) ──
  { kind: 'river', zh: '黃河', en: 'Yellow R.', lon: 104.2, lat: 37.2 },
  { kind: 'river', zh: '黃河', en: 'Yellow R.', lon: 115.6, lat: 36.0 },
  { kind: 'river', zh: '長江', en: 'Yangtze',   lon: 108.6, lat: 30.6 },
  { kind: 'river', zh: '長江', en: 'Yangtze',   lon: 119.2, lat: 31.2 },
  { kind: 'river', zh: '漢水', en: 'Han R.',    lon: 110.6, lat: 32.3 },
  { kind: 'river', zh: '淮河', en: 'Huai R.',   lon: 116.0, lat: 32.9 },
  { kind: 'river', zh: '渭水', en: 'Wei R.',    lon: 107.4, lat: 34.55 },
  { kind: 'river', zh: '珠江', en: 'Pearl R.',  lon: 110.0, lat: 23.2 },
  { kind: 'river', zh: '湘江', en: 'Xiang R.',  lon: 112.4, lat: 27.6 },
  // ── 海 (seas; render in the open water) ──
  { kind: 'sea', zh: '東海', en: 'East Sea',   lon: 123.0, lat: 31.0 },
  { kind: 'sea', zh: '南海', en: 'South Sea',  lon: 112.0, lat: 18.6 },
  { kind: 'sea', zh: '渤海', en: 'Bohai Sea',  lon: 120.4, lat: 38.7 },
];
