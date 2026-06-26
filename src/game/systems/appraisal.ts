/**
 * 月旦評 — talent appraisal. A famed 名士 (許劭 之於曹操, 司馬徽 之於臥龍鳳雛) sizes
 * an officer up and pronounces a 定評 — a one-line verdict drawn from the target's
 * stat profile and nature. The verdict:
 *   • makes a name — the appraised gains 名望 (renown), the more so under a famous
 *     appraiser (and the appraiser earns a little 識人之名 in turn);
 *   • lifts the fog — once appraised, the officer's 成長資質 (latent aptitude) is
 *     known, so you can scout an 在野 talent's ceiling before courting them.
 *
 * Pure functions; the store action threads them onto live state.
 */
import type { Officer } from '../types';

export type AppraisalGrade = 'upper' | 'middle' | 'lower'; // 上品 / 中品 / 下品
export interface AppraisalVerdict { zh: string; en: string; grade: AppraisalGrade }

/** A 名士 of real discernment may appraise — the bar is a keen eye for talent. */
export const APPRAISER_MIN_INT = 78;
export function canAppraise(o: Officer): boolean {
  return o.status !== 'dead' && o.stats.intelligence >= APPRAISER_MIN_INT;
}

const has = (o: Officer, t: string) => (o.traits as string[] | undefined ?? []).includes(t);
const peakStat = (o: Officer) =>
  Math.max(o.stats.war, o.stats.leadership, o.stats.intelligence, o.stats.politics, o.stats.charisma);

/** 品第 — a coarse read of worth from the officer's peak & breadth. */
export function appraisalGrade(o: Officer): AppraisalGrade {
  const peak = peakStat(o);
  const sum = o.stats.war + o.stats.leadership + o.stats.intelligence + o.stats.politics + o.stats.charisma;
  if (peak >= 90 || sum >= 400) return 'upper';
  if (peak >= 72 || sum >= 300) return 'middle';
  return 'lower';
}

export const GRADE_LABEL: Record<AppraisalGrade, { zh: string; en: string }> = {
  upper:  { zh: '上品', en: 'Upper' },
  middle: { zh: '中品', en: 'Middle' },
  lower:  { zh: '下品', en: 'Lower' },
};

/**
 * 定評 — the verdict line, chosen by the officer's dominant nature. The famous
 * 治世之能臣，亂世之奸雄 is reserved for the ambitious schemer of real ability.
 */
export function appraisalVerdict(o: Officer): AppraisalVerdict {
  const { war, leadership, intelligence: int, politics: pol, charisma: cha } = o.stats;
  const grade = appraisalGrade(o);
  const v = (zh: string, en: string): AppraisalVerdict => ({ zh, en, grade });

  // 奸雄 — the ambitious, cunning mind of high ability (許劭評曹操).
  if ((has(o, 'ambitious') || has(o, 'cunning')) && int >= 80 && (war >= 70 || pol >= 70)) {
    return v('治世之能臣,亂世之奸雄。', 'A capable minister in an age of order — a wily hero in an age of chaos.');
  }
  // 王佐 — statesman-strategist of the first rank (荀彧/諸葛之屬).
  if (int >= 88 && pol >= 80) return v('王佐之才,經天緯地。', 'A talent fit to aid a king — he can order heaven and earth.');
  // 國士 — a paragon of presence & virtue.
  if (cha >= 88 && (pol >= 75 || int >= 75)) return v('雅量高致,有國士之風。', 'Of magnanimous bearing — he has the air of a peerless gentleman.');
  // 萬人敵 — the matchless warrior (with a barb if proud).
  if (war >= 90) {
    return has(o, 'arrogant') || has(o, 'haughty')
      ? v('萬人之敵也,然性矜高,難為人下。', 'A match for ten thousand — yet proud, and ill-suited to serve beneath another.')
      : v('萬人之敵,世之虎臣。', 'A match for ten thousand — a tiger-general of the age.');
  }
  // 良將 — a capable independent commander.
  if (war >= 78 && leadership >= 78) return v('將才也,可獨當一面。', 'A true commander — fit to hold a front alone.');
  // 謀士 — the schemer.
  if (int >= 84) return v('腹隱機謀,算無遺策。', 'A mind full of stratagems — his plans leave nothing to chance.');
  // 能吏 — the administrator.
  if (pol >= 82) return v('干國之器,蕭曹之亞。', 'An instrument of the state — second only to Xiao He and Cao Shen.');
  // 庸才 — nothing to write home about.
  if (peakStat(o) < 60) return v('碌碌之才,不足道也。', 'A middling sort — nothing worth remarking upon.');
  // 中庸 — serviceable.
  return v('中人之姿,可堪驅策。', 'An ordinary talent — serviceable enough if put to use.');
}

/** 名望 — renown the verdict confers on the appraised (and, lesser, the appraiser).
 *  A famed appraiser (high 智) and a glowing verdict (high 品第) make a bigger name. */
export function appraisalRenownGain(appraiser: Officer, target: Officer): { target: number; appraiser: number } {
  const fame = Math.max(0, Math.round((appraiser.stats.intelligence - 60) * 0.35)); // 0..~13
  const gradeBonus = { upper: 8, middle: 4, lower: 0 }[appraisalGrade(target)];
  const tgt = Math.max(3, Math.min(20, fame + gradeBonus));
  return { target: tgt, appraiser: Math.max(1, Math.round(tgt * 0.4)) }; // 識人之名
}
