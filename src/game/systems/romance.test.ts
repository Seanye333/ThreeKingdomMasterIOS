import { describe, it, expect } from 'vitest';
import { composeRomance, romanceToText, type ChronicleEntry } from './romance';

function ev(year: number, kind: ChronicleEntry['kind'], zh: string): ChronicleEntry {
  return { year, season: 'spring', zh, kind };
}

describe('composeRomance', () => {
  it('opens an empty campaign with a 楔子', () => {
    const r = composeRomance({ chronicle: [], forceNameZh: '蜀', victoryStatus: 'playing' });
    expect(r.chapters).toHaveLength(1);
    expect(r.chapters[0].title).toContain('楔子');
    expect(r.bookTitle).toBe('《蜀演義》');
  });

  it('carves the chronicle into numbered 回 with couplet titles', () => {
    const chron: ChronicleEntry[] = [];
    for (let i = 0; i < 12; i++) chron.push(ev(200 + i, 'conquest', `某軍攻陷某城${i}`));
    const r = composeRomance({ chronicle: chron, forceNameZh: '魏', victoryStatus: 'playing' });
    // 12 events / 5 per chapter = 3 chapters.
    expect(r.chapters).toHaveLength(3);
    expect(r.chapters[0].title).toMatch(/第1回/);
    expect(r.chapters[2].title).toMatch(/第3回/);
    for (const c of r.chapters) expect(c.lines.length).toBeGreaterThan(0);
  });

  it('strips parenthetical asides from narrative lines', () => {
    const r = composeRomance({
      chronicle: [ev(208, 'works', '【水攻】火燒赤壁(折損三千)')],
      forceNameZh: '吳', victoryStatus: 'playing',
    });
    const joined = r.chapters[0].lines.join('');
    expect(joined).not.toContain('折損三千');
  });

  it('closes with a fate-aware couplet and exports to text', () => {
    const win = composeRomance({ chronicle: [ev(280, 'conquest', '一統天下')], forceNameZh: '晉', victoryStatus: 'victory' });
    expect(win.chapters.at(-1)!.lines.at(-1)).toContain('鼎定');
    const text = romanceToText(win);
    expect(text).toContain('《晉演義》');
    expect(text).toContain('說書人');
  });
});
