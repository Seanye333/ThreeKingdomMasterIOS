import type { BilingualName } from '../types';

/**
 * Curated 國號 / 年號 the player may proclaim at the 建國大典. Free choice is
 * also allowed in the UI; these are historically flavoured presets.
 */
export const DYNASTY_TITLES: BilingualName[] = [
  { zh: '魏', en: 'Wei' },
  { zh: '蜀漢', en: 'Shu-Han' },
  { zh: '吳', en: 'Wu' },
  { zh: '晉', en: 'Jin' },
  { zh: '漢', en: 'Han' },
  { zh: '新', en: 'Xin' },
  { zh: '燕', en: 'Yan' },
  { zh: '楚', en: 'Chu' },
  { zh: '趙', en: 'Zhao' },
  { zh: '秦', en: 'Qin' },
  { zh: '齊', en: 'Qi' },
  { zh: '梁', en: 'Liang' },
];

export const ERA_NAMES: BilingualName[] = [
  { zh: '章武', en: 'Zhangwu' },
  { zh: '黃初', en: 'Huangchu' },
  { zh: '黃龍', en: 'Huanglong' },
  { zh: '景初', en: 'Jingchu' },
  { zh: '建興', en: 'Jianxing' },
  { zh: '太康', en: 'Taikang' },
  { zh: '永安', en: "Yong'an" },
  { zh: '神鳳', en: 'Shenfeng' },
  { zh: '天紀', en: 'Tianji' },
  { zh: '建初', en: 'Jianchu' },
  { zh: '龍興', en: 'Longxing' },
  { zh: '開元', en: 'Kaiyuan' },
];
