/**
 * 諡號 — when a serving officer dies of age, their court grants a
 * posthumous name: the famous get their historical one, everyone else
 * gets one composed from how they actually lived (the 諡法: 武 for the
 * fierce, 文 for the learned, 靖 for the steady hand…). Wanderers and
 * prisoners die untitled — no court, no name.
 */
import type { Officer } from '../types';

/** Historical posthumous names, as the records gave them. */
export const HISTORICAL_POSTHUMOUS: Record<string, string> = {
  'guan-yu': '壯繆侯',
  'zhang-fei': '桓侯',
  'zhao-yun': '順平侯',
  'ma-chao': '威侯',
  'huang-zhong': '剛侯',
  'zhuge-liang': '忠武侯',
  'pang-tong': '靖侯',
  'fa-zheng': '翼侯',
  'cao-cao': '武王',
  'xiahou-dun': '忠侯',
  'zhang-liao': '剛侯',
  'xu-huang': '壯侯',
  'zhang-he': '壯侯',
  'sima-yi': '宣文侯',
  'guo-jia': '貞侯',
  'xun-yu': '敬侯',
  'zhou-yu': '平虜伯',
  'lu-su': '昭勳侯',
  'lu-meng': '孱陵侯',
  'gan-ning': '剛侯',
};

/** 諡法 — compose a name from the life lived. */
export function grantPosthumousName(officer: Officer): string | null {
  if (!officer.forceId) return null; // no court, no name
  const fixed = HISTORICAL_POSTHUMOUS[officer.id];
  if (fixed) return fixed;
  const s = officer.stats;
  const best = Math.max(s.war, s.intelligence, s.politics, s.leadership, s.charisma);
  if (best < 70) return '節侯'; // a life of quiet service
  if (best === s.war) return s.war >= 92 ? '壯侯' : '剛侯';
  if (best === s.intelligence) return s.intelligence >= 92 ? '文成侯' : '文侯';
  if (best === s.politics) return '靖侯';
  if (best === s.leadership) return '穆侯';
  return '惠侯';
}
