import type { City, EntityId, Force, Officer } from '../types';
import type { AnnalsEntry } from '../types/event';

/**
 * 史官年鑑 — every spring the court historian reads the year just ended and
 * writes one page: the realm's rises and falls, the year's battles and
 * calamities, and where the 武評 board stands. Pure composition over data
 * the game already keeps (annals / city counts / power board) — the 史官
 * invents nothing, he only writes it down with a classical cadence.
 */
export interface YearChronicle {
  year: number;
  titleZh: string;
  paragraphs: string[];
}

export function composeYearChronicle(params: {
  year: number; // the year that just CLOSED
  annals: AnnalsEntry[];
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  /** id → rank from the power board (top slice). */
  boardTop: Map<EntityId, number>;
  /** Last spring's per-force city counts (empty on the first page). */
  prevCounts: Record<EntityId, number>;
  playerForceId: EntityId | null;
}): YearChronicle {
  const { year, annals, cities, forces, officers, boardTop, prevCounts, playerForceId } = params;
  const paragraphs: string[] = [];

  // ── 大勢 — who rose, who fell, measured in walls held.
  const counts: Record<EntityId, number> = {};
  for (const c of Object.values(cities)) {
    if (c.ownerForceId) counts[c.ownerForceId] = (counts[c.ownerForceId] ?? 0) + 1;
  }
  const living = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (living.length > 0) {
    const [topId, topN] = living[0];
    const topName = forces[topId]?.name.zh ?? topId;
    let line = `是歲,天下有主之城凡${Object.values(counts).reduce((a, b) => a + b, 0)},${topName}據${topN}城,勢冠群雄`;
    if (Object.keys(prevCounts).length > 0) {
      let riser: [string, number] | null = null;
      let faller: [string, number] | null = null;
      for (const [fid, n] of Object.entries(counts)) {
        const d = n - (prevCounts[fid] ?? 0);
        if (d > 0 && (!riser || d > riser[1])) riser = [fid, d];
      }
      for (const [fid, prev] of Object.entries(prevCounts)) {
        const d = (counts[fid] ?? 0) - prev;
        if (d < 0 && (!faller || d < faller[1])) faller = [fid, d];
      }
      if (riser) line += `;${forces[riser[0]]?.name.zh ?? riser[0]}拓地${riser[1]}城,方興未艾`;
      if (faller) line += `;${forces[faller[0]]?.name.zh ?? faller[0]}${(counts[faller[0]] ?? 0) === 0 ? '社稷傾覆,不復存焉' : `失地${-faller[1]}城,日蹙百里`}`;
    }
    paragraphs.push(line + '。');
  }

  // ── 兵事 — the year's clashes off the annals.
  const yearEntries = annals.filter((e) => e.year === year);
  const wars = yearEntries.filter((e) => ['conquest', 'battle', 'war'].includes(e.kind as string)
    || e.titleZh.includes('陷') || e.titleZh.includes('克') || e.titleZh.includes('戰'));
  if (wars.length > 0) {
    const cited = wars.slice(0, 2).map((e) => e.textZh.replace(/。$/, '')).join(';');
    paragraphs.push(`兵事${wars.length >= 4 ? '連結,烽火不絕' : '有作'}:${cited}。`);
  } else if (yearEntries.length > 0) {
    paragraphs.push('是歲干戈稍息,列國各修其政。');
  }

  // ── 災異 — omens and calamities.
  const woes = yearEntries.filter((e) => e.kind === 'disaster' || e.kind === 'omen' || e.kind === 'unrest');
  if (woes.length > 0) {
    paragraphs.push(`災異:${woes.slice(0, 2).map((e) => e.titleZh).join('、')}${woes.length > 2 ? '等' : ''},民多流離。`);
  }

  // ── 武評 — the board's crown.
  const top3 = [...boardTop.entries()].filter(([, r]) => r <= 3).sort((a, b) => a[1] - b[1]);
  if (top3.length > 0) {
    const names = top3.map(([id, r]) => `第${['一', '二', '三'][r - 1]}${officers[id]?.name.zh ?? id}`).join(',');
    paragraphs.push(`天下武評,${names},時人以為一時之選。`);
  }

  // ── 收語 — the historian addresses his lord.
  if (playerForceId) {
    const mine = counts[playerForceId] ?? 0;
    const rank = living.findIndex(([fid]) => fid === playerForceId) + 1;
    paragraphs.push(mine === 0
      ? '主公寄寓於人,臥薪嘗膽,史筆猶待後章。'
      : `主公之業,據${mine}城,居天下${rank <= 1 ? '之首,大業可期' : `第${rank},尚須勉之`}。`);
  }

  return { year, titleZh: `${year}年 史官年鑑`, paragraphs };
}
