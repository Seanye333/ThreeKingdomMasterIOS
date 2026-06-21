# Project instructions — Three Kingdom Masters

## Keep the docs in sync with the code (required)

Whenever you **add or change a game mechanic, system, constant, or content set**, update the documentation in the same change — do not leave it for later:

1. **docs/GUIDE.md** — the hand-written "source of truth" (player guide + design/number doc, 11 chapters + flowcharts). Edit the relevant chapter:
   - New system → add a numbered subsection in the right chapter (and its entry in the chapter's TOC coverage list + the Quick Reference table if it introduces a key constant/formula). Renumber later subsections if you insert one.
   - Changed number/formula/mechanic → fix it in both the chapter body AND the Quick Reference, and any flowchart that depicts it.
   - Wire a new per-season system into the §11.1 season-order list + the flowchart (圖1).
2. **docs/CATALOG.md** — machine-generated content index (items / policies / tactics / titles / etc.). It is regenerated, never hand-edited. After changing any `src/game/data/*.ts` content set, run:
   ```
   npm run docs:catalog
   ```
   (This also refreshes the auto appendix of GUIDE.md. Your hand-written GUIDE chapters are preserved.)

GUIDE.md's own header already says "改了機制請同步更新本文" — honor it. When you finish a mechanic change, the GUIDE/CATALOG edits are part of "done," same as a passing build.

## Verifying changes

Build/typecheck with `npm run build` (runs `tsc -b`), **not** `tsc --noEmit` — Vercel's build fails on unused imports that `--noEmit` lets through. Game logic lives in `src/game/`; most systems have a `*.test.ts` — run `npx vitest run`.
