/**
 * 神兵共鳴 — the storied pairings of officer and treasure (本命神兵).
 * When the rightful hero carries their own legend — 關羽提青龍偃月、呂布跨
 * 赤兔 — the weapon answers: 兵器駕馭 (gradeCombat.itemMasteryMul) rises past
 * full effect to 115%, and the officer card marks the line with ✦本命.
 * Data-only module; the effect lives in gradeCombat.ts.
 */

import { CANONICAL_ITEMS_PRIMARY } from './officers';

export interface SignaturePair {
  officerId: string;
  itemId: string;
}

/** Hand-picked pairs — mostly SECOND items (horses, seized blades) beyond an
 *  officer's canonical primary, plus the classic weapon pairings. */
const MANUAL_PAIRS: SignaturePair[] = [
  // 蜀 — the oath brothers and their arms.
  { officerId: 'guan-yu', itemId: 'green-dragon' },      // 青龍偃月刀
  { officerId: 'guan-yu', itemId: 'red-hare' },          // 赤兔 — 曹操所贈,忠義同馳
  { officerId: 'zhang-fei', itemId: 'snake-spear' },     // 丈八蛇矛
  { officerId: 'liu-bei', itemId: 'twin-swords' },       // 雌雄一對劍
  { officerId: 'liu-bei', itemId: 'dilu' },              // 的盧 — 躍檀溪
  { officerId: 'zhao-yun', itemId: 'qing-gang' },        // 青釭劍 — 長坂奪劍
  { officerId: 'zhao-yun', itemId: 'dragon-gut' },       // 龍膽槍
  { officerId: 'zhao-yun', itemId: 'zhaoye-yushizi' },   // 照夜玉獅子
  { officerId: 'huang-zhong', itemId: 'tietai-gong' },   // 鐵胎弓 — 老將神射
  { officerId: 'zhuge-liang', itemId: 'yu-mao-shan' },   // 白羽扇 — 綸巾羽扇
  { officerId: 'jiang-wei', itemId: 'bingfa-ershisi' },  // 兵法二十四篇 — 武侯衣缽
  // 魏 — the Cao court.
  { officerId: 'cao-cao', itemId: 'yitian' },            // 倚天劍
  { officerId: 'cao-cao', itemId: 'jue-ying' },          // 絕影 — 宛城捨命之駒
  { officerId: 'cao-cao', itemId: 'zhuahuang-feidian' }, // 爪黃飛電
  { officerId: 'dian-wei', itemId: 'twin-halberds' },    // 雙鐵戟
  { officerId: 'dian-wei', itemId: 'guzhi-shuang-ji' },  // 古之雙戟(正典起始持有)
  { officerId: 'pang-de', itemId: 'phoenix-beak' },      // 鳳嘴刀 — 抬櫬決死之將
  // 吳 — the Sun line.
  { officerId: 'sun-jian', itemId: 'gu-ding' },          // 古錠刀
  { officerId: 'cheng-pu', itemId: 'tiejisha-mao' },     // 鐵脊蛇矛
  // 群 — the wider stage.
  { officerId: 'lu-bu', itemId: 'sky-piercer' },         // 方天畫戟
  { officerId: 'lu-bu', itemId: 'red-hare' },            // 人中呂布,馬中赤兔
  { officerId: 'zhang-jiao', itemId: 'taiping' },        // 太平要術
  { officerId: 'hua-tuo', itemId: 'qing-nang-shu' },     // 青囊書
  { officerId: 'zhou-yu', itemId: 'zhou-yu-yu-shan' },   // 周瑜羽扇 — 談笑間檣櫓灰飛
  // 歷代名將 — the wider dynasties' legends answer their own arms too.
  { officerId: 'hist-xiang-yu', itemId: 'baqiang' },     // 霸王槍
  { officerId: 'hist-yue-fei', itemId: 'liquan-qiang' }, // 瀝泉槍
  { officerId: 'hist-goujian', itemId: 'zhanlu-jian' },  // 越王勾踐劍
  { officerId: 'hist-yang-youji', itemId: 'vermilion-bow' }, // 彤弓 — 百步穿楊
];

/** 代主所負,非其本命 — canonical bearers who merely CARRY the treasure
 *  (夏侯恩背青釭為曹操),excluded from auto-derived resonance. */
const DERIVED_EXCLUDE = new Set(['xiahou-en']);

/** The full resonance table: the hand-picked pairs plus every canonical
 *  primary ownership (officers.ts CANONICAL_ITEMS_PRIMARY) — the game
 *  already curates who历史ally owns what, so 本命 derives from it wholesale. */
export const SIGNATURE_ITEMS: SignaturePair[] = (() => {
  const out = [...MANUAL_PAIRS];
  const seen = new Set(out.map((p) => `${p.officerId}|${p.itemId}`));
  for (const [officerId, itemId] of Object.entries(CANONICAL_ITEMS_PRIMARY)) {
    if (DERIVED_EXCLUDE.has(officerId)) continue;
    const key = `${officerId}|${itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ officerId, itemId });
  }
  return out;
})();

const KEYS = new Set(SIGNATURE_ITEMS.map((p) => `${p.officerId}|${p.itemId}`));

/** Is this treasure the officer's 本命 (signature) item? */
export function isSignaturePair(officerId: string, itemId: string): boolean {
  return KEYS.has(`${officerId}|${itemId}`);
}

/** All signature item ids for one officer (for card/tooltip surfaces). */
export function signatureItemsOf(officerId: string): string[] {
  return SIGNATURE_ITEMS.filter((p) => p.officerId === officerId).map((p) => p.itemId);
}
