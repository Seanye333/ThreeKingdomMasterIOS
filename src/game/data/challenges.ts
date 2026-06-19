import type { BilingualName } from '../types';
import type { ObjectiveGoal } from '../types/objectives';
import { evaluateGoal, type ObjectiveContext } from '../systems/objectives';

/**
 * Hero Mode (英雄模式) — RTK13-style timed challenge scenarios.
 *
 * A challenge pins an existing scenario + force to a single tight win
 * condition and a hard deadline. Unlike the free-play objectives (which are
 * optional flavour goals), a challenge is pass/fail: hit the goal before the
 * deadline to *win*, miss it — or get wiped out — and you *lose*. The win
 * condition reuses the existing {@link ObjectiveGoal} vocabulary so the same
 * battle-tested {@link evaluateGoal} engine scores it.
 */
export interface Challenge {
  id: string;
  name: BilingualName;
  /** Narrative setup shown on the challenge card. */
  blurb: { zh: string; en: string };
  scenarioId: string;
  forceId: string;
  /** Recommended difficulty the challenge launches at. */
  difficulty: 'easy' | 'normal' | 'hard';
  /** Win condition — reuses the objective goal vocabulary. */
  goal: ObjectiveGoal;
  /** Hard deadline; surviving past this year without winning = loss. */
  deadlineYear: number;
  /** Star rating, 1 (gentle) … 3 (brutal). */
  star: 1 | 2 | 3;
}

export type ChallengeStatus = 'won' | 'lost' | 'ongoing';

export const CHALLENGES: Challenge[] = [
  {
    id: 'ch-184-han',
    name: { zh: '蒼天當立', en: 'The Heavens Must Stand' },
    blurb: {
      zh: '黃巾蜂起，八州震動。以漢室之名，於186年前蕩平張角的黃巾軍。',
      en: 'The Yellow Turbans rise across eight provinces. In the name of Han, crush Zhang Jiao before 186 AD.',
    },
    scenarioId: 'scn-184-yellow-turban',
    forceId: 'han',
    difficulty: 'easy',
    goal: { kind: 'defeat-force', forceId: 'yellow-turban', byYear: 186 },
    deadlineYear: 186,
    star: 1,
  },
  {
    id: 'ch-190-cao',
    name: { zh: '奉天子以令不臣', en: 'Shelter the Son of Heaven' },
    blurb: {
      zh: '董卓焚洛陽、挾天子西去。曹操當興義兵，於196年前同據洛陽與許昌，奉迎漢帝。',
      en: 'Dong Zhuo burns Luoyang and drags the Emperor west. As Cao Cao, hold both Luoyang and Xuchang by 196 to shelter the Han court.',
    },
    scenarioId: 'scn-190-anti-dong-zhuo',
    forceId: 'cao',
    difficulty: 'normal',
    goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 196 },
    deadlineYear: 196,
    star: 2,
  },
  {
    id: 'ch-guandu-cao',
    name: { zh: '官渡逆襲', en: 'Against the Tide at Guandu' },
    blurb: {
      zh: '袁紹擁河北十萬之眾南下，曹操兵微糧寡。火燒烏巢，於204年前一舉殲滅袁紹勢力。',
      en: "Yuan Shao marches south with the host of Hebei; Cao Cao is outnumbered ten to one. Burn Wuchao and eliminate Yuan Shao's force before 204 AD.",
    },
    scenarioId: 'scn-200-guandu',
    forceId: 'cao',
    difficulty: 'hard',
    goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 204 },
    deadlineYear: 204,
    star: 3,
  },
  {
    id: 'ch-xiapi-lubu',
    name: { zh: '白門樓困龍', en: 'The Cornered Dragon' },
    blurb: {
      zh: '曹操水淹下邳，呂布困守孤城，陳宮高順死戰。逆轉天命，撐過曹軍圍攻，活到202年。',
      en: 'Cao Cao floods Xiapi and Lü Bu is trapped in a dying city. Defy fate, break the siege, and endure to 202 AD.',
    },
    scenarioId: 'scn-198-xiapi',
    forceId: 'lubu',
    difficulty: 'hard',
    goal: { kind: 'survive-until', year: 202 },
    deadlineYear: 999,
    star: 3,
  },
  {
    id: 'ch-chibi-sun',
    name: { zh: '赤壁鏖兵', en: 'Inferno at Red Cliffs' },
    blurb: {
      zh: '曹操率八十萬眾臨江。借得東風，以火破曹，守住江東基業至211年。',
      en: "Cao Cao's host of 800,000 looms over the river. Borrow the eastern wind, set the fleet ablaze, and hold Jiangdong through 211 AD.",
    },
    scenarioId: 'scn-208-chibi',
    forceId: 'sun',
    difficulty: 'normal',
    goal: { kind: 'survive-until', year: 211 },
    deadlineYear: 999,
    star: 2,
  },
  {
    id: 'ch-chibi-liu',
    name: { zh: '借荊圖蜀', en: 'Borrow Jing, Seize Shu' },
    blurb: {
      zh: '赤壁戰後立足未穩。劉備當西取益州，於217年前同據成都與漢中，三分天下。',
      en: 'The dust of Red Cliffs has barely settled. As Liu Bei, take the west — hold both Chengdu and Hanzhong by 217 AD to claim your third of the realm.',
    },
    scenarioId: 'scn-208-chibi',
    forceId: 'liu-bei',
    difficulty: 'hard',
    goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 217 },
    deadlineYear: 217,
    star: 3,
  },
  {
    id: 'ch-yiling-shu',
    name: { zh: '為兄復仇', en: 'Vengeance for a Brother' },
    blurb: {
      zh: '關羽敗死荊州，劉備傾國東征。於227年前消滅孫吳，雪桃園之恨。',
      en: 'Guan Yu lies dead in Jing. Liu Bei marches east with the whole of Shu. Eliminate Sun Wu before 227 AD to avenge the Peach Garden oath.',
    },
    scenarioId: 'scn-222-yiling',
    forceId: 'liu-bei',
    difficulty: 'hard',
    goal: { kind: 'defeat-force', forceId: 'sun', byYear: 227 },
    deadlineYear: 227,
    star: 3,
  },
  {
    id: 'ch-wuzhang-shu',
    name: { zh: '北伐中原', en: 'The Northern Campaign' },
    blurb: {
      zh: '丞相星落五丈原前，了卻畢生夙願。於238年前攻取長安，克復中原。',
      en: "Fulfil the Prime Minister's dying wish before his star falls at Wuzhang. Take Chang'an by 238 AD and reclaim the heartland.",
    },
    scenarioId: 'scn-234-wuzhang',
    forceId: 'liu-bei',
    difficulty: 'hard',
    goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 238 },
    deadlineYear: 238,
    star: 3,
  },
  {
    id: 'ch-200-sun',
    name: { zh: '小霸王立業', en: 'The Little Conqueror' },
    blurb: {
      zh: '孫策橫掃江東，基業初成。於208年前一統揚州諸城，奠吳國之基。',
      en: 'Sun Ce storms across Jiangdong. Control the whole of Yang province by 208 to lay the foundation of Wu.',
    },
    scenarioId: 'scn-200-guandu',
    forceId: 'sun',
    difficulty: 'normal',
    goal: { kind: 'control-province', provinceId: 'yang', byYear: 208 },
    deadlineYear: 208,
    star: 2,
  },
  {
    id: 'ch-220-wei-unify',
    name: { zh: '魏武揮鞭', en: 'Wei Unifies the Realm' },
    blurb: {
      zh: '三國鼎立，魏據其強。於240年前以魏旗一統天下諸城，終結亂世。',
      en: 'The realm stands divided in three, Wei the mightiest. Unify every city under the Wei banner by 240 to end the age of chaos.',
    },
    scenarioId: 'scn-220-declaration',
    forceId: 'cao',
    difficulty: 'hard',
    goal: { kind: 'unify-realm' },
    deadlineYear: 240,
    star: 3,
  },
  {
    id: 'ch-184-yt',
    name: { zh: '蒼天已死', en: 'The Blue Heaven is Dead' },
    blurb: {
      zh: '黃天當立，歲在甲子！率黃巾教眾，於187年前攻取洛陽，改朝換代。',
      en: 'The Yellow Heaven shall rise! Lead the Turban faithful and seize Luoyang by 187 to overturn the dynasty.',
    },
    scenarioId: 'scn-184-yellow-turban',
    forceId: 'yellow-turban',
    difficulty: 'hard',
    goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 187 },
    deadlineYear: 187,
    star: 3,
  },
];

export function findChallenge(id: string | null): Challenge | null {
  if (!id) return null;
  return CHALLENGES.find((c) => c.id === id) ?? null;
}

/** A persisted best result for a challenge (meta-progression across games). */
export interface ChallengeRecord {
  /** Earliest year the challenge was ever completed. */
  bestYear: number;
  /** Best star rating ever earned (1–3). */
  bestStars: number;
}

/** The year that actually ends the clock for a challenge. */
export function effectiveDeadline(ch: Challenge): number {
  return ch.goal.kind === 'survive-until' ? ch.goal.year : ch.deadlineYear;
}

/**
 * Stars earned for a win, by how decisively it was won. Survive-to-a-year
 * challenges can't be finished early, so holding the full term is mastery (3).
 * Objective challenges score on years to spare before the deadline.
 */
export function challengeStars(ch: Challenge, wonYear: number): 1 | 2 | 3 {
  if (ch.goal.kind === 'survive-until') return 3;
  const margin = effectiveDeadline(ch) - wonYear;
  return margin >= 6 ? 3 : margin >= 2 ? 2 : 1;
}

/** Total stars earned across all completed challenges. */
export function totalStars(records: Record<string, ChallengeRecord>): number {
  return Object.values(records).reduce((s, r) => s + (r.bestStars ?? 0), 0);
}

/**
 * Score a challenge against the current game state.
 *   - 'won'  — the win condition has been met.
 *   - 'lost' — the player force is extinct, the goal's own deadline lapsed,
 *              or the challenge deadline year has passed.
 *   - 'ongoing' — still in play.
 */
export function evaluateChallenge(
  challenge: Challenge,
  ctx: ObjectiveContext,
): ChallengeStatus {
  // Wiped off the map — instant loss, regardless of the clock.
  if (ctx.playerForceId && !ctx.liveForceIds.has(ctx.playerForceId)) return 'lost';

  const r = evaluateGoal(challenge.goal, ctx);
  if (r.status === 'success') return 'won';
  if (r.status === 'failure') return 'lost';
  if (ctx.year > challenge.deadlineYear) return 'lost';
  return 'ongoing';
}
