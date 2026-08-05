import type { BilingualName, EntityId } from './common';

/**
 * Per-scenario primary/secondary objectives. A scenario can declare a
 * narrative win condition more specific than "unify the realm" — and the
 * objective UI tracks progress live.
 */
export type ObjectiveGoal =
  | { kind: 'hold-cities';     cityIds: EntityId[]; byYear?: number }
  | { kind: 'defeat-force';    forceId: EntityId;   byYear?: number }
  /**
   * 擊破(非殲滅)—— 把某一家壓到只剩 `maxCities` 座城以內。
   *
   * `defeat-force` 問的是「他死了沒」,而有些戰役問的不是這個。184 年的朝廷
   * 要的是**亂事平定**:張角一死,八州之亂就算破了,而餘部入太行號黑山、
   * 散為青州黃巾,活過了這個王朝 —— 這張盤自己的事件文本就是這麼寫的
   * (「自此亂非一戰可平,而成積年之患」)。用 defeat-force 去要求 187 年
   * 前殲滅黃巾,是在要求連史書都沒發生的事(自走五輪 0/5)。
   *
   * 這個問法還順帶解掉**聯軍歸屬**的問題:皇甫嵩軍與朱儁軍在盤上是獨立勢力,
   * 城是他們打下來的,不會記在漢室名下 —— hold-cities 因此永遠判不對。
   * 「敵人剩幾座城」不在乎是誰打的,只在乎亂平了沒。
   */
  | { kind: 'break-force';     forceId: EntityId;   maxCities: number; byYear?: number }
  | { kind: 'recruit-officer'; officerId: EntityId; byYear?: number }
  | { kind: 'survive-until';   year: number }
  | { kind: 'control-province'; provinceId: string; byYear?: number }
  | { kind: 'declare-emperor' }
  | { kind: 'unify-realm' };

export interface ScenarioObjective {
  id: EntityId;
  /** Which force this objective applies to. */
  forceId: EntityId;
  primary: ScenarioGoal;
  secondary?: ScenarioGoal[];
}

export interface ScenarioGoal {
  title: BilingualName;
  description: string;
  descriptionZh?: string;
  goal: ObjectiveGoal;
}
