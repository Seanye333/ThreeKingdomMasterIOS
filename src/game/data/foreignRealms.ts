import type { ForeignRealm, RealmRegion } from '../types';

/**
 * 異域遠邦目錄 — the distant lands a 遠使 embassy can reach, all historically
 * attested in the era. Travel times are long (5–12 seasons one leg); rewards
 * and danger rise with distance. See systems/foreignRealm.ts for resolution.
 */
export const FOREIGN_REALMS: ForeignRealm[] = [
  // ── 西域 — Silk Road oasis states (Cao Wei's 戊己校尉 held 高昌) ──
  {
    id: 'gaochang',
    name: { en: 'Gaochang (Turfan)', zh: '高昌(吐魯番)' },
    region: 'xiyu',
    blurb: 'The Cheshi oasis at Turfan, gateway to the Western Regions.',
    blurbZh: '車師高昌,吐魯番綠洲,西域之門戶。',
    homeland: { lon: 89.2, lat: 42.9 },
    baseSeasons: 5,
    danger: 0.25,
    reward: { gold: [600, 1400], food: [400, 900], itemIds: ['yutian-meiyu'], prestige: 4 },
  },
  {
    id: 'shanshan',
    name: { en: 'Shanshan (Loulan)', zh: '鄯善(樓蘭)' },
    region: 'xiyu',
    blurb: 'The vanished kingdom of Loulan by the salt-marsh of Lop Nur.',
    blurbZh: '羅布泊畔之樓蘭古國,鄯善。',
    homeland: { lon: 89.8, lat: 40.5 },
    baseSeasons: 5,
    danger: 0.32,
    reward: { gold: [500, 1300], itemIds: ['yutian-meiyu'], prestige: 3 },
  },
  {
    id: 'qiuci',
    name: { en: 'Kucha', zh: '龜茲' },
    region: 'xiyu',
    blurb: 'The great oasis of Kucha, famed for its music and dance.',
    blurbZh: '西域大國龜茲,以樂舞名動天下。',
    homeland: { lon: 82.9, lat: 41.7 },
    baseSeasons: 6,
    danger: 0.33,
    reward: { gold: [600, 1500], itemIds: ['qiuci-yuepu'], prestige: 4 },
  },
  {
    id: 'yutian',
    name: { en: 'Khotan', zh: '于闐' },
    region: 'xiyu',
    blurb: 'Khotan of the Jade Rivers, source of the finest jade.',
    blurbZh: '玉河之國于闐,美玉甲於天下。',
    homeland: { lon: 79.9, lat: 37.1 },
    baseSeasons: 7,
    danger: 0.36,
    reward: { gold: [700, 1600], itemIds: ['yutian-meiyu'], prestige: 4 },
  },
  {
    id: 'dayuan',
    name: { en: 'Dayuan (Ferghana)', zh: '大宛' },
    region: 'xiyu',
    blurb: 'Ferghana of the blood-sweating heavenly horses.',
    blurbZh: '大宛,出汗血天馬之國。',
    homeland: { lon: 71.8, lat: 40.4 },
    baseSeasons: 8,
    danger: 0.42,
    reward: { gold: [500, 1200], itemIds: ['hanxue-baoma'], auxTroops: [800, 2000], prestige: 5 },
  },

  // ── 東夷海外 — the eastern seas ──
  {
    id: 'sanhan',
    name: { en: 'The Three Han', zh: '三韓' },
    region: 'dongyi',
    blurb: 'The Mahan, Jinhan and Byeonhan confederacies of the Korean south.',
    blurbZh: '朝鮮半島南之馬韓、辰韓、弁韓。',
    homeland: { lon: 127.0, lat: 35.8 },
    baseSeasons: 4,
    danger: 0.22,
    reward: { gold: [400, 1000], food: [600, 1400], auxTroops: [500, 1200], prestige: 3 },
  },
  {
    id: 'wa',
    name: { en: 'Wa (Yamatai)', zh: '倭・邪馬台' },
    region: 'dongyi',
    blurb: "Queen Himiko's Yamatai — she who was named 親魏倭王 by the Wei court.",
    blurbZh: '女王卑彌呼之邪馬台國,魏封「親魏倭王」。',
    homeland: { lon: 130.3, lat: 33.2 },
    baseSeasons: 6,
    danger: 0.35,
    minYear: 230,
    reward: { gold: [500, 1200], itemIds: ['nanhai-xiangya'], prestige: 10 },
  },

  // ── 南方海外 — the southern seas (Sun Quan sent 朱應/康泰 to 扶南) ──
  {
    id: 'funan',
    name: { en: 'Funan', zh: '扶南' },
    region: 'nanhai',
    blurb: 'The Mekong-delta maritime kingdom of Funan, visited by Wu envoys.',
    blurbZh: '湄公河口之海國扶南,吳使朱應、康泰所至。',
    homeland: { lon: 104.9, lat: 11.5 },
    baseSeasons: 7,
    danger: 0.4,
    reward: { gold: [700, 1700], itemIds: ['nanhai-xiangya'], auxTroops: [600, 1500], prestige: 5 },
  },

  // ── 極遠 — Rome, India, Parthia ──
  {
    id: 'tianzhu',
    name: { en: 'Tianzhu (India)', zh: '天竺' },
    region: 'jiyuan',
    blurb: 'India of the Buddha, beyond the snow mountains and the southern seas.',
    blurbZh: '佛陀之天竺,雪山與南海之外。',
    homeland: { lon: 78.0, lat: 22.0 },
    baseSeasons: 8,
    danger: 0.5,
    reward: { gold: [800, 2000], itemIds: ['tianzhu-beiye'], prestige: 6 },
  },
  {
    id: 'anxi',
    name: { en: 'Anxi (Parthia)', zh: '安息' },
    region: 'jiyuan',
    blurb: 'The Parthian empire astride the Silk Road to the far west.',
    blurbZh: '橫亙絲路西陲之安息(帕提亞)帝國。',
    homeland: { lon: 52.0, lat: 33.0 },
    baseSeasons: 9,
    danger: 0.55,
    reward: { gold: [900, 2200], itemIds: ['anxi-xiangliao'], prestige: 7 },
  },
  {
    id: 'daqin',
    name: { en: 'Da Qin (Rome)', zh: '大秦(羅馬)' },
    region: 'jiyuan',
    blurb: 'Da Qin — the Roman empire, the fabled mirror-realm at the world’s far end.',
    blurbZh: '大秦,即羅馬帝國,天下西極之國,世所謂與中國相埒者。',
    homeland: { lon: 12.5, lat: 41.9 },
    baseSeasons: 10,
    danger: 0.6,
    reward: { gold: [1200, 3000], itemIds: ['daqin-liuli'], prestige: 12 },
  },
];

export const FOREIGN_REALMS_BY_ID: Record<string, ForeignRealm> = Object.fromEntries(
  FOREIGN_REALMS.map((r) => [r.id, r]),
);

export const REGION_LABEL: Record<RealmRegion, { zh: string; en: string }> = {
  xiyu: { zh: '西域', en: 'Western Regions' },
  dongyi: { zh: '東夷海外', en: 'Eastern Seas' },
  nanhai: { zh: '南方海外', en: 'Southern Seas' },
  jiyuan: { zh: '極遠', en: 'Far West' },
};
