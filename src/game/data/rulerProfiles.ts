import type { RulerPersonality } from '../types/personality';
import type { StatecraftSchool } from './statecraft';

/**
 * 君主本性譜 — a per-ruler profile of AI personality + 治國理念 + 門第政策.
 *
 * WHY THIS EXISTS: the 86 scenarios in `scenarios.ts` never wrote a
 * `personality/statecraft/recruitmentStance` onto their `Force` literals, so
 * every one of the ~297 AI forces fell back to the default 'opportunist' /
 * 雜糅 / 'balanced'. Cao Cao, Yuan Shao and Liu Bei all played identically.
 *
 * These three axes are a ruler's *nature* — stable across whichever scenario
 * they appear in — so they key off `rulerOfficerId`, not the force. A single
 * ~100-entry table therefore lights up all 297 force instances at once. It is
 * a pure back-fill: any Force that DOES set a field explicitly still wins
 * (see the spread order in `gameState.ts`).
 *
 * `imperialRank` and 建國號/年號 are deliberately NOT here — those are
 * scenario- and time-dependent (the same Cao Cao is 司空 in 200 but 魏王 in
 * 220), so they stay owned by the scenario data + the 天子/建國 systems.
 */
export interface RulerProfile {
  /** AI march/defend/diplomacy temperament. */
  personality?: RulerPersonality;
  /** 治國理念 法/儒/道/兵 — drives the statecraft loop + doctrine loyalty. */
  statecraft?: StatecraftSchool;
  /** 門第政策 — how the realm selects talent (§7.8 clans loop). */
  recruitmentStance?: 'aristocratic' | 'meritocratic' | 'balanced';
}

/**
 * Keyed by `rulerOfficerId`. Personality axis semantics (see personality.ts):
 *   aggressive 攻擊 · defensive 守勢 · opportunist 機會 · hesitant 慎重 ·
 *   tyrant 暴虐 · scholar 學者 · expansionist 擴張 · cautious 守備
 */
export const RULER_PROFILES: Record<string, RulerProfile> = {
  // ── 魏 / 曹氏 · 司馬氏 ────────────────────────────────────────────────
  'cao-cao':    { personality: 'aggressive',  statecraft: 'legalist',   recruitmentStance: 'meritocratic' }, // 唯才是舉,挾天子而略地
  'cao-pi':     { personality: 'opportunist', statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 行九品官人法,倚世族而受禪
  'cao-rui':    { personality: 'defensive',   statecraft: 'legalist',   recruitmentStance: 'aristocratic' },
  'cao-fang':   { personality: 'cautious',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 幼主受制
  'cao-shuang': { personality: 'hesitant',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 紈袴專權,終為司馬所乘
  'sima-yi':    { personality: 'opportunist', statecraft: 'legalist',   recruitmentStance: 'balanced' },     // 隱忍待時
  'sima-shi':   { personality: 'aggressive',  statecraft: 'legalist',   recruitmentStance: 'aristocratic' },
  'sima-zhao':  { personality: 'aggressive',  statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 司馬昭之心,路人皆知
  'sima-yan':   { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 受禪建晉

  // ── 蜀 / 劉氏 ────────────────────────────────────────────────────────
  'liu-bei':    { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 仁德為本,五虎不問出身
  'liu-shan':   { personality: 'cautious',    statecraft: 'daoist',     recruitmentStance: 'balanced' },     // 樂不思蜀,無為而治
  'ma-chao':    { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },

  // ── 吳 / 孫氏 ────────────────────────────────────────────────────────
  'sun-jian':   { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 江東猛虎
  'sun-ce':     { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 小霸王,武力開拓
  'sun-quan':   { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 制衡淮泗與江東,伺隙而動
  'sun-liang':  { personality: 'cautious',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'sun-xiu':    { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'sun-hao':    { personality: 'tyrant',      statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 暴虐,終致吳亡
  'sun-yi':     { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },
  'lady-sun':   { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },

  // ── 群雄 ────────────────────────────────────────────────────────────
  'yuan-shao':   { personality: 'hesitant',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 四世三公,多謀少決
  'yuan-shu':    { personality: 'expansionist',statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 僭號稱帝,眼高手低
  'yuan-tan':    { personality: 'aggressive',  statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'yuan-shang':  { personality: 'hesitant',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'gongsun-zan': { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 白馬義從
  'gongsun-du':  { personality: 'defensive',   statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 遼東自守
  'gongsun-kang':{ personality: 'defensive',   statecraft: 'legalist',   recruitmentStance: 'aristocratic' },
  'gongsun-yuan':{ personality: 'opportunist', statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 反覆稱燕王
  'liu-biao':    { personality: 'scholar',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 坐談客,守荊襄
  'liu-zhang':   { personality: 'cautious',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 闇弱守成
  'liu-yan':     { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 益州牧,陰有異志
  'liu-yao':     { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'tao-qian':    { personality: 'cautious',    statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 三讓徐州
  'kong-rong':   { personality: 'scholar',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 孔門之後,好客養士
  'dong-zhuo':   { personality: 'tyrant',      statecraft: 'militarist', recruitmentStance: 'balanced' },     // 涼州武人,廢立暴虐
  'li-jue':      { personality: 'tyrant',      statecraft: 'militarist', recruitmentStance: 'balanced' },     // 李傕郭汜亂長安
  'lu-bu':       { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 飛將,反覆無常
  'ma-teng':     { personality: 'expansionist',statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 西涼,兵分勢散
  'han-sui':     { personality: 'opportunist', statecraft: 'militarist', recruitmentStance: 'balanced' },     // 涼州反覆
  'zhang-lu':    { personality: 'defensive',   statecraft: 'daoist',     recruitmentStance: 'balanced' },     // 五斗米道,政教漢中
  'zhang-jiao':  { personality: 'expansionist',statecraft: 'daoist',     recruitmentStance: 'meritocratic' }, // 太平道,蒼天已死
  'zhang-rang':  { personality: 'opportunist', statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 十常侍
  'he-jin':      { personality: 'hesitant',    statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 屠家外戚,優柔召董
  'wang-yun':    { personality: 'hesitant',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 連環計後剛愎
  'lu-zhi':      { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 名將大儒
  'huangfu-song':{ personality: 'defensive',   statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 平黃巾良將
  'zhu-jun':     { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'meritocratic' },
  'wang-lang':   { personality: 'scholar',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 老儒,終被罵死陣前
  'hua-xin':     { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'yan-baihu':   { personality: 'cautious',    statecraft: 'militarist', recruitmentStance: 'balanced' },     // 山越自立

  // ── 南中 · 邊疆異族 ──────────────────────────────────────────────────
  'meng-huo':    { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 南蠻,七擒七縱
  'zhu-rong':    { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 祝融夫人
  'shi-xie':     { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 交趾士家,守境安民
  'tadun':       { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 烏桓蹋頓
  'kebi-neng':   { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 鮮卑軻比能

  // ── 魏末 · 淮南三叛 · 蜀漢後期 ───────────────────────────────────────
  'deng-ai':     { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 寒門名將,偷渡陰平
  'zhong-hui':   { personality: 'opportunist', statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 才高謀逆
  'zhuge-dan':   { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 淮南三叛
  'guanqiu-jian':{ personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 淮南

  // ── WHATIF · 女性君主 ────────────────────────────────────────────────
  'diaochan':    { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'balanced' },
  'da-qiao':     { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'balanced' },
  'cai-yan':     { personality: 'scholar',     statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 蔡文姬,文名冠世
  'lady-huang':  { personality: 'scholar',     statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 黃月英,機巧絕倫
  'lady-bian':   { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'balanced' },

  // ── 外傳 · 戰國 ─────────────────────────────────────────────────────
  'hist-qin-xiaogong':  { personality: 'aggressive',   statecraft: 'legalist',   recruitmentStance: 'meritocratic' }, // 商鞅變法,唯才
  'hist-qin-zhaoxiang': { personality: 'aggressive',   statecraft: 'legalist',   recruitmentStance: 'meritocratic' }, // 遠交近攻
  'hist-qin-shihuang':  { personality: 'tyrant',       statecraft: 'legalist',   recruitmentStance: 'meritocratic' }, // 掃六合,郡縣天下
  'hist-qin-ershi':     { personality: 'tyrant',       statecraft: 'legalist',   recruitmentStance: 'aristocratic' }, // 趙高指鹿為馬
  'hist-zhao-wuling':   { personality: 'aggressive',   statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 胡服騎射
  'hist-zhao-huiwen':   { personality: 'defensive',    statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 廉頗藺相如
  'hist-zhao-xiaocheng':{ personality: 'hesitant',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 長平用趙括
  'hist-zhao-liehou':   { personality: 'defensive',    statecraft: 'confucian',  recruitmentStance: 'balanced' },
  'hist-zhao-xie':      { personality: 'cautious',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'hist-yan-zhaowang':  { personality: 'expansionist', statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 築黃金台招賢
  'hist-yan-huiwang':   { personality: 'hesitant',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 疑樂毅
  'hist-qi-weiwang':    { personality: 'defensive',    statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 稷下學宮
  'hist-qi-xuanwang':   { personality: 'scholar',      statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 稷下養士
  'hist-qi-minwang':    { personality: 'expansionist', statecraft: 'militarist', recruitmentStance: 'aristocratic' }, // 驕橫,樂毅伐齊
  'hist-wei-wenhou':    { personality: 'expansionist', statecraft: 'legalist',   recruitmentStance: 'meritocratic' }, // 李悝變法,用吳起
  'hist-wei-huiwang':   { personality: 'hesitant',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 失商鞅孫臏
  'hist-han-zhaohou':   { personality: 'defensive',    statecraft: 'legalist',   recruitmentStance: 'meritocratic' }, // 申不害以術治韓
  'hist-chu-huaiwang':  { personality: 'hesitant',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 信讒逐屈原
  'hist-chu-qingxiang': { personality: 'cautious',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'hist-tian-dan-chu':  { personality: 'defensive',    statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 火牛陣復齊
  'hist-tian-fazhang':  { personality: 'defensive',    statecraft: 'confucian',  recruitmentStance: 'aristocratic' },

  // ── 外傳 · 秦末楚漢 ─────────────────────────────────────────────────
  'hist-xiang-yu':   { personality: 'aggressive',   statecraft: 'militarist', recruitmentStance: 'aristocratic' }, // 力拔山兮,剛愎失士
  'hist-xiang-liang':{ personality: 'aggressive',   statecraft: 'militarist', recruitmentStance: 'aristocratic' }, // 楚將世家
  'hist-liu-bang':   { personality: 'opportunist', statecraft: 'daoist',     recruitmentStance: 'meritocratic' }, // 黃老休養,約法三章,善將將
  'hist-chen-sheng': { personality: 'expansionist', statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 王侯將相寧有種乎
  'hist-chen-yu':    { personality: 'hesitant',     statecraft: 'confucian',  recruitmentStance: 'aristocratic' },
  'hist-zhang-han':  { personality: 'aggressive',   statecraft: 'militarist', recruitmentStance: 'meritocratic' }, // 秦末名將
  'hist-ying-bu':    { personality: 'aggressive',   statecraft: 'militarist', recruitmentStance: 'balanced' },     // 黥布,悍勇反覆
  'hist-wei-bao':    { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 魏豹,觀望反覆
  'hist-tian-rong':  { personality: 'aggressive',   statecraft: 'militarist', recruitmentStance: 'balanced' },     // 齊田榮抗楚
  'hist-tian-guang': { personality: 'cautious',     statecraft: 'confucian',  recruitmentStance: 'balanced' },

  // ── 外傳 · 隋唐 ─────────────────────────────────────────────────────
  'hist-li-yuan':       { personality: 'opportunist', statecraft: 'confucian',  recruitmentStance: 'aristocratic' }, // 關隴門閥,晉陽起兵
  'hist-li-longji':     { personality: 'expansionist', statecraft: 'confucian',  recruitmentStance: 'balanced' },     // 開元盛世,天寶而衰
  'hist-an-lushan':     { personality: 'tyrant',      statecraft: 'militarist', recruitmentStance: 'balanced' },     // 漁陽鼙鼓
  'hist-wang-shichong': { personality: 'opportunist', statecraft: 'legalist',   recruitmentStance: 'balanced' },     // 洛陽鄭帝,詐術
  'hist-dou-jiande':    { personality: 'defensive',   statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 河北夏王,得民心
  'hist-xue-ju':        { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 隴西霸王
  'hist-liu-wuzhou':    { personality: 'aggressive',  statecraft: 'militarist', recruitmentStance: 'balanced' },     // 依突厥而叛
  'hist-du-fuwei':      { personality: 'opportunist', statecraft: 'militarist', recruitmentStance: 'balanced' },     // 江淮群盜
  'hist-li-mi-sui':     { personality: 'expansionist', statecraft: 'confucian',  recruitmentStance: 'meritocratic' }, // 瓦崗霸業,眼高手低
};

/** Back-fill lookup used by `gameState.ts` when materialising scenario forces. */
export function rulerProfileFor(rulerOfficerId: string | undefined): RulerProfile {
  return (rulerOfficerId && RULER_PROFILES[rulerOfficerId]) || {};
}
