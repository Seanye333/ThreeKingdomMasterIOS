/** 地圖 HUD 小部件 — the strategic map's DOM chrome, extracted verbatim from
 * StrategicMap3D.tsx: the city quick-action ring, the find-a-city search box,
 * overlay/weather label tables, the selected-army orders bar and the controls
 * cheat-sheet. */
import { useMemo, useState } from 'react';
import { useGameStore } from '../../../game/state/store';
import { cityPixel } from '../../../game/data/cityGeo';
import type { City } from '../../../game/types';
import type { WeatherKind } from '../../../game/systems/weather';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useT, useLanguage, pickName } from '../../i18n';
import { IS_MOBILE, type OverlayMode } from './shared';

export function CityQuickRing({ own, onEnter, onMarch, onRecruit, onMuster, onGovern }: {
  own: boolean;
  onEnter: () => void;
  onMarch: () => void;
  onRecruit: () => void;
  onMuster: () => void;
  onGovern: () => void;
}) {
  const t = useT();

  const radial = (emoji: string, zh: string, en: string, deg: number, onClick: () => void) => {
    const rad = (deg * Math.PI) / 180;
    const R = 54;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          position: 'absolute',
          left: Math.cos(rad) * R - 23,
          top: -Math.sin(rad) * R - 23,
          width: 46, height: 46, borderRadius: '50%',
          background: 'rgba(20,14,8,0.92)', border: '1px solid #d4a84a',
          color: '#f0e0b0', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1, padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
        }}
        title={t(zh, en)}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>
        <span style={{ fontSize: 9, letterSpacing: 1 }}>{t(zh, en)}</span>
      </button>
    );
  };

  if (!own) {
    // Enemy city — opens the muster planner (preview + options + confirm).
    return (
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onMuster(); }}
          style={{
            position: 'absolute', left: -62, top: -76, width: 124,
            background: 'rgba(20,14,8,0.92)', border: '1px solid #b8584a',
            color: '#e8b0a0', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)', fontSize: 12, letterSpacing: 2,
            padding: '0.32rem 0', borderRadius: 'var(--tkm-radius-sm)', boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
            whiteSpace: 'nowrap',
          }}
        >{t('🚩 全軍集結', '🚩 Mass muster')}</button>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: 0, height: 0 }}>
      {radial('⛩', '進城', 'Enter', 150, onEnter)}
      {radial('⚔', '出陣', 'March', 90, onMarch)}
      {radial('👥', '徵兵', 'Recruit', 30, onRecruit)}
      {/* 施政 — one-tap civil governance: idle officers here each take their
          best-fit internal order, without a trip through the city panel. */}
      {radial('📜', '施政', 'Govern', 270, onGovern)}
      {/* 勤王 — rally the realm to reinforce this own city. */}
      {radial('🚩', '集結', 'Muster', 210, onMuster)}
    </div>
  );
}

/* ─── 城市搜索 — type a name (漢字或拼音), fly there ───────────────────
   Ninety-odd cities is too many to hunt by eye in the late game. Matches
   against zh names and the pinyin-ish en names; Enter takes the first
   match, click takes any. Jumping reuses the locator's camera path and
   selects the city so its panel opens on arrival. */
export function CitySearchBox({ onJump, compact }: {
  onJump: (cityId: string, px: number, py: number) => void;
  /** 手機 — collapse to a 🔍 button; the input only exists while open, so
   *  it can't sit on top of the map chrome. */
  compact?: boolean;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const t = useT();
  const lang = useLanguage();
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return Object.values(cities)
      .filter((c) => c.name.zh.includes(q.trim()) || c.name.en.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [cities, q]);
  const jump = (c: City) => {
    const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
    onJump(c.id, px, py);
    setQ('');
    setOpen(false);
  };
  if (compact && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(20, 14, 8, 0.88)', color: '#c0a878',
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={t('尋城', 'Find city')}
      >🔍</button>
    );
  }
  return (
    <div style={{ position: 'relative', fontFamily: 'var(--tkm-font-body)', display: 'flex', gap: 4 }}>
      {compact && (
        <button
          onClick={() => { setOpen(false); setQ(''); }}
          aria-label={t('關閉搜尋', 'Close search')}
          title={t('關閉搜尋', 'Close search')}
          style={{
            width: 30, background: 'rgba(20, 14, 8, 0.88)', color: '#c0a878',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', cursor: 'pointer', fontSize: 13, order: 2,
          }}
        >✕</button>
      )}
      <input
        autoFocus={compact}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) jump(matches[0]);
          if (e.key === 'Escape') setQ('');
          e.stopPropagation(); // keep typing out of the map hotkeys
        }}
        placeholder={t('🔍 尋城(漢字/拼音)', '🔍 Find city')}
        style={{
          width: compact ? 'min(56vw, 210px)' : 138,
          background: 'rgba(20, 14, 8, 0.88)', color: '#e8d9b0',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.5rem', outline: 'none',
          fontFamily: 'inherit', fontSize: '0.75rem',
        }}
      />
      {matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 2, minWidth: 170,
          background: 'rgba(20, 14, 8, 0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)', zIndex: 30,
        }}>
          {matches.map((c) => {
            const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
            return (
              <div
                key={c.id}
                onClick={() => jump(c)}
                style={{
                  display: 'flex', justifyContent: 'space-between', gap: 10, cursor: 'pointer',
                  padding: '0.3rem 0.55rem', fontSize: '0.78rem', color: '#e8d9b0',
                  borderBottom: '1px solid #2a2014',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,168,74,0.14)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <span>{pickName(c.name, lang)}</span>
                <span style={{ color: owner?.color ?? '#6a6050', fontSize: '0.7rem' }}>
                  {owner ? pickName(owner.name, lang) : t('無主', 'free')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Top-level component ─────────────────────────────────── */
export const OVERLAY_OPTIONS: Array<{ id: OverlayMode; zh: string; en: string }> = [
  { id: 'none',     zh: '關閉', en: 'OFF' },
  { id: 'gold',     zh: '金錢', en: 'GOLD' },
  { id: 'food',     zh: '糧草', en: 'FOOD' },
  { id: 'troops',   zh: '兵力', en: 'TROOPS' },
  { id: 'loyalty',  zh: '民忠', en: 'LOYALTY' },
  { id: 'province', zh: '州郡', en: 'PROVINCE' },
  { id: 'specialty', zh: '名產', en: 'GOODS' },
  { id: 'supply',   zh: '糧道', en: 'SUPPLY' },
  { id: 'diplomacy', zh: '邦交', en: 'TIES' },
  { id: 'threat',   zh: '威脅', en: 'THREAT' },
  { id: 'intent',   zh: '兵鋒', en: 'INTENT' },
  // 米價 sits AFTER 兵鋒 on purpose: the 1–9 hotkeys index this list, so
  // inserting anywhere earlier silently pushes 威脅 off the number row.
  // 兵鋒 owns '0'; this one is click-only (and says so in its tooltip).
  { id: 'grain',    zh: '米價', en: 'GRAIN' },
];

export const WEATHER_ZH: Record<WeatherKind, string> = {
  clear: '☀ 晴', rain: '☂ 雨', snow: '❄ 雪', wind: '🌀 風', drought: '☼ 旱',
};
export const WEATHER_EN: Record<WeatherKind, string> = {
  clear: '☀ Clear', rain: '☂ Rain', snow: '❄ Snow', wind: '🌀 Wind', drought: '☼ Drought',
};

/**
 * 軍令提示 — when one of the player's columns is selected, a bar spells out
 * what tapping each thing does (the orders existed, but nothing on screen
 * said so). Also the visible way to deselect.
 */
export function ArmyOrdersHint() {
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const army = useGameStore((s) => (s.selectedArmyId ? s.armies[s.selectedArmyId] : null));
  const officers = useGameStore((s) => s.officers);
  const selectArmy = useGameStore((s) => s.selectArmy);
  // The in-place battle commander bar owns the bottom slot when up.
  const battleBarUp = useGameStore((s) => !!s.tacticalBattle && s.battleViewMinimized);
  const t = useT();
  const lang = useLanguage();
  if (!selectedArmyId || !army) return null;
  const commander = officers[army.commanderId];
  return (
    <div style={{
      position: 'absolute', bottom: battleBarUp ? 64 : 14, left: '50%', transform: 'translateX(-50%)',
      zIndex: 12, display: 'flex', alignItems: 'center', gap: '0.6rem',
      background: 'rgba(20, 14, 8, 0.92)', border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-sm)',
      padding: '0.4rem 0.8rem', fontFamily: 'var(--tkm-font-body)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.55)',
      flexWrap: 'wrap', justifyContent: 'center', maxWidth: '94vw',
    }}>
      <span style={{ color: '#f0d98a', letterSpacing: '0.1rem', fontSize: '0.85rem' }}>
        ⚑ {commander ? pickName(commander.name, lang) : '?'}{t('部', '')} {army.troops.toLocaleString()}{t('兵', '')}
      </span>
      <span style={{ color: '#8a7050', fontSize: '0.72rem', letterSpacing: '0.05rem' }}>
        {t('點城市:改道 · 點空地:進駐 · 點友軍:合流 · 點敵軍:野戰',
           'Tap city: redirect · ground: dig in · ally: merge · enemy: engage')}
      </span>
      <button
        onClick={() => selectArmy(null)}
        style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#c0a878',
          padding: '0.15rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem',
        }}
      >✕ {t('取消', 'Cancel')}</button>
    </div>
  );
}

/* ─── 操作說明 — a one-glance cheat-sheet for every map control, opened by the
   ? on the controls hint, so the many gestures/shortcuts stay discoverable. ─ */
export function MapHelpPanel({ onClose }: { onClose: () => void }) {
  // Esc closes + registers an escape layer so map hotkeys don't fire behind it.
  useEscapeKey(onClose);
  const t = useT();
  const rows: Array<[string, string]> = IS_MOBILE
    ? [
        [t('單指拖曳', '1-finger drag'), t('平移地圖', 'pan the map')],
        [t('雙指捏合', 'pinch'), t('縮放(朝手指)', 'zoom toward fingers')],
        [t('雙指擰轉', '2-finger twist'), t('旋轉視角', 'rotate the view')],
        [t('輕點城市', 'tap a city'), t('選取 · 再點進城', 'select · tap again to enter')],
        [t('輕點空地', 'tap ground'), t('選軍時下令移動', 'move a selected column')],
        ['🔍 ＋－ ⌖ 🏯', t('尋城 / 縮放 / 復位 / 回都', 'search / zoom / recenter / capital')],
        ['⛶', t('沉浸 — 收起介面只看地圖(▾▴‹ 各自喚回)', 'immersive — hide the UI; edge tabs bring it back')],
      ]
    : [
        [t('左鍵拖曳', 'left-drag'), t('平移地圖', 'pan the map')],
        [t('右鍵拖曳', 'right-drag'), t('旋轉視角', 'rotate the view')],
        [t('滾輪', 'scroll'), t('縮放(朝光標)', 'zoom toward cursor')],
        [t('雙擊空地', 'double-click ground'), t('飛近並放大', 'fly in + zoom')],
        [t('WASD / 方向鍵', 'WASD / arrows'), t('移動地圖', 'pan the map')],
        [t('滑鼠移到邊緣', 'mouse to edge'), t('滾屏', 'edge-scroll')],
        [t('點城市', 'click a city'), t('選取 · 再點進城', 'select · click again to enter')],
        ['1-9 / 0', t('切換疊圖', 'toggle overlays')],
        ['Tab', t('巡視自己的城', 'cycle your cities')],
        ['Home', t('回都城', 'jump to capital')],
        [t('空格', 'Space'), t('過旬結算', 'end the turn')],
        ['/  ⌘K', t('命令臺', 'command palette')],
        ['Esc', t('取消選取 / 逐層關閉', 'clear selection / close a layer')],
        ['＋－ ⌖ 🏯 🔍', t('縮放 / 復位 / 回都 / 尋城', 'zoom / recenter / capital / search')],
        ['⛶', t('沉浸 — 收起介面只看地圖', 'immersive — hide the UI for a full-screen map')],
      ];
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 45,
      background: 'rgba(8,5,2,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, #1c1409 0%, #120c06 100%)',
        border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius-lg)', padding: '1rem 1.2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)', maxWidth: '92vw', minWidth: 270,
        fontFamily: 'var(--tkm-font-body)', color: '#d8c4a0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <div style={{ fontWeight: 'bold', letterSpacing: '0.08rem' }}>🎮 {t('地圖操作', 'Map Controls')}</div>
          <button onClick={onClose} aria-label={t('關閉', 'Close')} title={t('關閉', 'Close')} style={{
            background: 'transparent', color: '#a89070', border: '1px solid #5a4530',
            borderRadius: 'var(--tkm-radius)', cursor: 'pointer', padding: '0.15rem 0.5rem', fontSize: '0.8rem',
          }}>✕</button>
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={i}>
                <td style={{ padding: '3px 14px 3px 0', color: '#e0c98a', whiteSpace: 'nowrap', fontWeight: 600 }}>{k}</td>
                <td style={{ padding: '3px 0', color: '#bfae86' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
