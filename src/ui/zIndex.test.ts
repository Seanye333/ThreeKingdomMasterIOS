/**
 * Z 軸層級表的排序不變量。
 *
 * 這張表原本零 import —— 一份寫著「the ONE ladder」卻沒人遵守的公約,實測就有
 * 一處(HudMenu 的 9999)違反它自己唯一講死的那條「fps 永遠最上」。表接上去
 * 之後,這裡釘的是**層與層的相對關係**,而不是具體數字:數字可以調,誰蓋誰不行。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Z } from './zIndex';

describe('Z — 層級表排序', () => {
  it('每一階都嚴格遞增(調數字時不會不小心對調兩層)', () => {
    const rungs = Object.values(Z);
    for (let i = 1; i < rungs.length; i++) {
      expect(rungs[i]).toBeGreaterThan(rungs[i - 1]);
    }
  });

  it('幀率計永遠最上', () => {
    for (const [name, v] of Object.entries(Z)) {
      if (name === 'fps') continue;
      expect(v).toBeLessThan(Z.fps);
    }
  });

  it('toast 蓋過教學浮層,但不蓋結局', () => {
    // 成就/稱號 toast 必須在教學之上(教學會擋住它),又不能蓋住勝敗結局卡。
    expect(Z.toast).toBeGreaterThan(Z.tutorial);
    expect(Z.toast).toBeLessThan(Z.endings);
  });

  it('全屏戰鬥蓋過一般彈窗與面板', () => {
    expect(Z.battle).toBeGreaterThan(Z.modalHigh);
    expect(Z.battle).toBeGreaterThan(Z.panel);
  });

  it('portal 出去的下拉選單蓋得過開啟它的每一層', () => {
    // HudMenu 從 HUD 開出來卻 portal 到 body,所以必須高過戰鬥/結局/彈窗。
    expect(Z.dropdown).toBeGreaterThan(Z.battle);
    expect(Z.dropdown).toBeGreaterThan(Z.endings);
  });
});

describe('Z — 沒有人再發明比表更高的數字', () => {
  it('src/ui 下不存在超過 fps 的硬編 z-index', () => {
    // 掃描而非白名單:新寫的浮層若隨手寫 9999,就會在這裡被抓到,而不是等到
    // 某天它蓋住幀率計/戰鬥層才被發現。表內的層仍可硬編(156 處舊值不在此測
    // 範圍),這條只擋「比整張表都高」的那種數字。
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.test.ts')) files.push(p);
      }
    };
    walk(join(__dirname));
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/z-?[iI]ndex:\s*(\d{3,})/g)) {
        if (Number(m[1]) > Z.fps) offenders.push(`${f}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
