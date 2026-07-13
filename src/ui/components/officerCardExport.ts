import type { Officer } from '../../game/types';
import { officerGrade, officerLevel, gradeMeta } from '../../game/systems/officerGrade';
import { combatBP } from '../../game/systems/battlePower';
import { SKILLS_BY_ID } from '../../game/data/skills';
import { OATH_BONDS, isFeudKind } from '../../game/data/bonds';
import { OFFICER_RELATIONSHIPS } from '../../game/data/relationships';
import { pickName, type Language } from '../i18n';

/**
 * 卡片存圖 — draw the officer card straight onto a canvas and hand it out as
 * a PNG. Pure Canvas 2D (no html-to-image library): the DOM card is CSS-heavy
 * (conic borders, animated sheens) so the exporter re-renders a clean, static
 * 800×1240 keepsake instead of screenshotting the live node.
 */

const W = 400;
const H = 620;
const ART_H = 330;

const STAT_ROWS: Array<{ k: keyof Officer['stats']; zh: string; en: string; color: string }> = [
  { k: 'leadership', zh: '統', en: 'LED', color: '#7ec0e0' },
  { k: 'war', zh: '武', en: 'WAR', color: '#e07a5f' },
  { k: 'intelligence', zh: '智', en: 'INT', color: '#b78ae0' },
  { k: 'politics', zh: '政', en: 'POL', color: '#8ac88a' },
  { k: 'charisma', zh: '魅', en: 'CHA', color: '#e0c068' },
];

/** Frame gradient stops per grade — mirrors OfficerCardModal's frameStyle. */
function frameStops(grade: string): string[] {
  switch (grade) {
    case 'diamond': return ['#8ee8ff', '#b7a8ff', '#eafcff', '#7ec0e0'];
    case 'platinum': return ['#eaf0f4', '#9fb3c0', '#f6fbff', '#8fa5b4'];
    case 'gold': return ['#e6c473', '#8a6a2a', '#ffe9a8', '#a8842e'];
    case 'silver': return ['#cfd8e0', '#6a7682', '#cfd8e0'];
    case 'bronze': return ['#c8884e', '#6a4426', '#b87a3e'];
    default: return ['#4a545e', '#4a545e'];
  }
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportOfficerCardPNG(officer: Officer, lang: Language): Promise<boolean> {
  const grade = officerGrade(officer);
  const meta = gradeMeta(grade.grade);
  const level = officerLevel(officer);
  const { bp } = combatBP(officer);
  const zh = lang !== 'en';

  const base = `${import.meta.env.BASE_URL}portraits/${officer.id}`;
  const art = (await loadImage(`${base}-full.webp`)) ?? (await loadImage(`${base}.webp`));

  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.scale(dpr, dpr);

  // Frame — the grade gradient as a 3px border band.
  const frame = ctx.createLinearGradient(0, 0, W, H);
  const stops = frameStops(grade.grade);
  stops.forEach((c, i) => frame.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = frame;
  rr(ctx, 0, 0, W, H, 12);
  ctx.fill();
  ctx.fillStyle = '#0c1118';
  rr(ctx, 3, 3, W - 6, H - 6, 9);
  ctx.fill();

  // Art zone — cover-fit, top-anchored, over a soft vignette.
  ctx.save();
  rr(ctx, 3, 3, W - 6, ART_H, 9);
  ctx.clip();
  const vig = ctx.createRadialGradient(W / 2, 72, 30, W / 2, 72, 360);
  vig.addColorStop(0, '#24303e');
  vig.addColorStop(1, '#0c1118');
  ctx.fillStyle = vig;
  ctx.fillRect(3, 3, W - 6, ART_H);
  if (art) {
    const scale = Math.max((W - 6) / art.width, ART_H / art.height);
    const dw = art.width * scale;
    ctx.drawImage(art, 3 + (W - 6 - dw) / 2, 3, dw, art.height * scale);
  } else {
    ctx.fillStyle = meta.color;
    ctx.font = '96px "Ma Shan Zheng", "Songti SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(pickName(officer.name, lang).slice(0, 1), W / 2, 190);
  }
  // Name-plate fade.
  const fade = ctx.createLinearGradient(0, ART_H - 96, 0, ART_H + 3);
  fade.addColorStop(0, 'rgba(10,13,18,0)');
  fade.addColorStop(0.62, 'rgba(10,13,18,0.92)');
  fade.addColorStop(1, 'rgba(10,13,18,0.95)');
  ctx.fillStyle = fade;
  ctx.fillRect(3, ART_H - 96, W - 6, 99);
  ctx.restore();

  // Grade badge (top-left) and BP (top-right).
  ctx.textAlign = 'left';
  ctx.font = '700 13px system-ui, sans-serif';
  const badge = `${pickName(meta.name, lang)} · ${pickName(meta.rank, lang)}`;
  const bw = ctx.measureText(badge).width + 16;
  ctx.fillStyle = 'rgba(10,14,20,0.82)';
  rr(ctx, 12, 11, bw, 22, 6);
  ctx.fill();
  ctx.strokeStyle = meta.color;
  ctx.stroke();
  ctx.fillStyle = meta.color;
  ctx.fillText(badge, 20, 26);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(10,14,20,0.82)';
  rr(ctx, W - 108, 11, 96, 38, 6);
  ctx.fill();
  ctx.strokeStyle = '#3c4f5e';
  ctx.stroke();
  ctx.fillStyle = '#7a8893';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText(zh ? '戰力' : 'POWER', W - 20, 24);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '700 17px ui-monospace, monospace';
  ctx.fillText(bp.toLocaleString(), W - 20, 43);

  // Stars.
  const stars = officer.stars ?? 0;
  if (stars > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd66e';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('★'.repeat(stars) + '☆'.repeat(Math.max(0, 6 - stars)), 14, 56);
  }

  // Name plate.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2e2b8';
  ctx.font = '700 26px "Ma Shan Zheng", "Songti SC", serif';
  const nm = pickName(officer.name, lang);
  ctx.fillText(nm, 15, ART_H - 34);
  let nx = 15 + ctx.measureText(nm).width + 8;
  ctx.font = '12px system-ui, sans-serif';
  if (officer.courtesyName) {
    ctx.fillStyle = '#c0a878';
    const cy = `${zh ? '字 ' : 'style '}${pickName(officer.courtesyName, lang)}`;
    ctx.fillText(cy, nx, ART_H - 36);
    nx += ctx.measureText(cy).width + 8;
  }
  ctx.fillStyle = '#8ac88a';
  ctx.fillText(`Lv.${level}`, 15, ART_H - 14);

  // Stat bars.
  let y = ART_H + 24;
  for (const row of STAT_ROWS) {
    const v = officer.stats[row.k];
    ctx.fillStyle = '#7a8893';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(zh ? row.zh : row.en, 16, y + 4);
    ctx.fillStyle = '#1a222c';
    rr(ctx, 48, y - 4, W - 48 - 52, 9, 4);
    ctx.fill();
    ctx.fillStyle = row.color;
    const frac = Math.min(1, v / 150);
    if (frac > 0) {
      rr(ctx, 48, y - 4, (W - 48 - 52) * frac, 9, 4);
      ctx.fill();
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = v >= 90 ? '#ffe9a8' : '#b6c2cc';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(String(v), W - 16, y + 4);
    y += 22;
  }

  // Skills — one wrapped line of chips' text.
  const skills = officer.skills.map((s) => SKILLS_BY_ID[s]).filter(Boolean).slice(0, 8);
  if (skills.length > 0) {
    y += 10;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7a8893';
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText(zh ? '技　能' : 'SKILLS', 16, y);
    y += 16;
    ctx.fillStyle = '#e6c473';
    ctx.font = '12px system-ui, sans-serif';
    let line = '';
    for (const sk of skills) {
      const next = line ? `${line} · ${pickName(sk.name, lang)}` : pickName(sk.name, lang);
      if (ctx.measureText(next).width > W - 32 && line) {
        ctx.fillText(line, 16, y);
        y += 16;
        line = pickName(sk.name, lang);
      } else line = next;
    }
    if (line) ctx.fillText(line, 16, y);
    y += 8;
  }

  // 緣分 — the bond lines, one wrapped block (mirrors the card face's strip).
  {
    const seen = new Set<string>();
    const bondBits: string[] = [];
    for (const r of OFFICER_RELATIONSHIPS) {
      if (r.a !== officer.id && r.b !== officer.id) continue;
      const other = r.a === officer.id ? r.b : r.a;
      if (seen.has(other)) continue;
      seen.add(other);
      bondBits.push(`◌ ${pickName(r.note, lang)}`);
    }
    for (const b of OATH_BONDS) {
      if (b.officerA !== officer.id && b.officerB !== officer.id) continue;
      const other = b.officerA === officer.id ? b.officerB : b.officerA;
      if (seen.has(other)) continue;
      seen.add(other);
      bondBits.push(`${isFeudKind(b.kind) ? '⚡' : '❦'} ${b.label}`);
    }
    if (bondBits.length > 0) {
      y += 10;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7a8893';
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillText(zh ? '緣　分' : 'BONDS', 16, y);
      y += 16;
      ctx.fillStyle = '#a8b8a8';
      ctx.font = '11px system-ui, sans-serif';
      let line = '';
      for (const bit of bondBits.slice(0, 8)) {
        const next = line ? `${line} · ${bit}` : bit;
        if (ctx.measureText(next).width > W - 32 && line) {
          ctx.fillText(line, 16, y);
          y += 15;
          line = bit;
        } else line = next;
        if (y > H - 40) break; // keep clear of the footer
      }
      if (line && y <= H - 40) ctx.fillText(line, 16, y);
    }
  }

  // Footer — the game's mark, so shared cards say where they came from.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a6672';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(zh ? '三國名將錄 · Three Kingdom Masters' : 'Three Kingdom Masters', W / 2, H - 14);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${officer.id}-card.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

// ─── 名品卡導出 — the item card as a 720×1040 PNG keepsake ───────────────
import {
  ITEMS_BY_ID, liveItemById, itemRarity, itemLoreLevel, itemLoreTitle,
  itemAwakeningIds, AWAKENING_BY_ID,
} from '../../game/data/items';

const ITEM_W = 360;
const ITEM_H = 520;

const ITEM_FRAME: Record<string, string[]> = {
  gold: ['#e6c473', '#8a6a2a', '#ffe9a8', '#a8842e'],
  silver: ['#cfd8e0', '#6a7682', '#cfd8e0'],
  bronze: ['#c8884e', '#6a4426', '#b87a3e'],
};

export async function exportItemCardPNG(
  itemId: string,
  lang: Language,
  inscription?: { name?: string; motto?: string },
): Promise<boolean> {
  const base = ITEMS_BY_ID[itemId];
  const live = liveItemById(itemId);
  if (!base || !live) return false;
  const zh = lang !== 'en';
  const rarity = itemRarity(base);
  const stops = ITEM_FRAME[rarity] ?? ITEM_FRAME.bronze;
  const lore = itemLoreLevel(itemId);
  const title = itemLoreTitle(lore);
  const awakened = itemAwakeningIds(itemId).map((a) => AWAKENING_BY_ID[a]).filter(Boolean);

  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = ITEM_W * dpr;
  canvas.height = ITEM_H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.scale(dpr, dpr);

  const frame = ctx.createLinearGradient(0, 0, ITEM_W, ITEM_H);
  stops.forEach((c, i) => frame.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = frame;
  rr(ctx, 0, 0, ITEM_W, ITEM_H, 12);
  ctx.fill();
  ctx.fillStyle = '#0c1118';
  rr(ctx, 3, 3, ITEM_W - 6, ITEM_H - 6, 9);
  ctx.fill();

  const accent = stops[0];
  // 圖騰 — the kind's calligraphic seal, big and centred.
  const glyph = base.kind === 'horse' ? '馬' : base.kind === 'book' ? '書' : base.kind === 'armor' ? '甲' : base.kind === 'weapon' ? '兵' : '寶';
  const vig = ctx.createRadialGradient(ITEM_W / 2, 120, 20, ITEM_W / 2, 120, 240);
  vig.addColorStop(0, '#232d3a');
  vig.addColorStop(1, '#0c1118');
  ctx.fillStyle = vig;
  ctx.fillRect(3, 3, ITEM_W - 6, 230);
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.font = '110px "Ma Shan Zheng", "Songti SC", serif';
  ctx.fillText(glyph, ITEM_W / 2, 160);

  // 名牌 — inscription first, born name beneath.
  ctx.font = '700 26px "Ma Shan Zheng", "Songti SC", serif';
  ctx.fillStyle = '#f2e2b8';
  ctx.fillText(inscription?.name ?? pickName(base.name, lang), ITEM_W / 2, 262);
  if (inscription?.name) {
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#7a8893';
    ctx.fillText(`${zh ? '本名 ' : 'born '}${pickName(base.name, lang)} ✒`, ITEM_W / 2, 282);
  }
  if (title) {
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#e0a868';
    ctx.fillText(`〈${zh ? title.zh : title.en}〉 ${zh ? '威名' : 'renown'} ${lore}`, ITEM_W / 2, inscription?.name ? 302 : 284);
  }

  // 效果 — live numbers.
  let y = 330;
  ctx.textAlign = 'left';
  for (const [k, v] of Object.entries(live.effects)) {
    ctx.fillStyle = '#7a8893';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(k.slice(0, 3).toUpperCase(), 28, y);
    ctx.fillStyle = '#9ed0ea';
    ctx.font = '700 14px ui-monospace, monospace';
    ctx.fillText(`+${v}`, 70, y);
    y += 22;
  }
  // 覺醒詞條.
  for (const p2 of awakened) {
    ctx.fillStyle = '#ffd66e';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`⚡ ${zh ? p2!.name.zh : p2!.name.en}`, 28, y);
    y += 20;
  }
  if (inscription?.motto) {
    ctx.fillStyle = '#e0c98a';
    ctx.font = 'italic 13px system-ui, sans-serif';
    ctx.fillText(`「${inscription.motto}」`, 28, y + 6);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a6672';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(zh ? '三國名將錄 · Three Kingdom Masters' : 'Three Kingdom Masters', ITEM_W / 2, ITEM_H - 14);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${itemId}-card.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
