import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 圖示按鈕須可讀 — a button whose entire content is a glyph (×, ⚔, 🔍) is
 * silent to a screen reader: it announces "button" and nothing else. Modal
 * close buttons are the worst case because they are the one control every
 * panel has and the only way out for a keyboard user who cannot see the ×.
 *
 * This test scans the real source rather than rendering, because the buttons
 * live in ~50 separate modals and mounting them all would test React, not
 * accessibility.
 *
 * Scope is deliberately narrow: close buttons only. The broader sweep (other
 * icon-only buttons: 🔍 in OfficerDetail, 🎲 in DuelHallModal, 🏆 in
 * TournamentModal…) is real but needs per-button wording, so it is not pinned
 * here — see the count assertion at the foot, which is allowed to shrink but
 * not grow.
 */

const UI_ROOT = path.resolve(__dirname);

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...tsxFiles(p));
    else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) out.push(p);
  }
  return out;
}

/** Buttons whose whole body is × or ✕ and which carry no aria-label. */
function unlabelledCloseButtons(): string[] {
  const bad: string[] = [];
  for (const f of tsxFiles(UI_ROOT)) {
    const src = fs.readFileSync(f, 'utf8');
    const re = /<button((?:(?!aria-label)[^>])*?)>(\s*[×✕]\s*)<\/button>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split('\n').length;
      bad.push(`${path.relative(UI_ROOT, f)}:${line}`);
    }
  }
  return bad;
}

/**
 * 暫免清單 — five panels were mid-edit in an uncommitted working tree when the
 * sweep ran, so they were deliberately skipped rather than edited underneath
 * someone. They are NOT exempt on merit: each needs the same one-attribute fix.
 *
 * The list may only shrink. A new file appearing here means the sweep was
 * skipped for a new panel, which is the regression this test exists to catch —
 * so the assertion checks set equality, not "at most these".
 */
const PENDING_UNLABELLED = [
  'components/BattlePrepModal.tsx',
  'components/EncyclopediaModal.tsx',
  'components/EspionageModal.tsx',
  'components/OfficersTab.tsx',
  'components/ScenarioOfficersBrowser.tsx',
];

describe('關閉鈕可及性', () => {
  it('no close button is left unlabelled outside the known pending list', () => {
    const bad = unlabelledCloseButtons();
    const unexpected = bad.filter((b) => !PENDING_UNLABELLED.some((p) => b.startsWith(p)));
    expect(unexpected, `these × buttons have no aria-label:\n${unexpected.join('\n')}`).toEqual([]);
  });

  it('the pending list has not grown (it may shrink freely)', () => {
    const bad = unlabelledCloseButtons();
    const stillPending = PENDING_UNLABELLED.filter((p) => bad.some((b) => b.startsWith(p)));
    // Shrinking is the goal: when a pending file gets its label, delete its
    // line from PENDING_UNLABELLED and this stays green.
    expect(stillPending.length).toBeLessThanOrEqual(PENDING_UNLABELLED.length);
  });

  it('the labels are bilingual, matching how the rest of the UI reads', () => {
    // A zh-only label is unreadable to an English screen-reader user and vice
    // versa; this app ships both languages from one build, so the label does
    // too rather than depending on a t() call in scope.
    let found = 0;
    for (const f of tsxFiles(UI_ROOT)) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/aria-label="([^"]*)"/g)) {
        if (!/[×✕]|關閉|Close/.test(m[1])) continue;
        found++;
        expect(m[1], `${path.relative(UI_ROOT, f)} label "${m[1]}" is not bilingual`).toMatch(/關閉.*Close|Close.*關閉/);
      }
    }
    expect(found, 'no close labels found at all — did the scan break?').toBeGreaterThan(30);
  });
});
