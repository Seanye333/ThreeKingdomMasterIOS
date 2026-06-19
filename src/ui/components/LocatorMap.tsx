// ─── Shared "you are here" locator ──────────────────────────────────────
// A small north-up minimap of the whole world that highlights the current
// view's window (city map or battle board) as a rectangle — rotated to its
// real bearing — so you always know where on the strategic map you are and
// which way is north. Driven entirely by the unified ViewWindow model.

import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { MAP_W, MAP_H } from '../../game/data/geography';
import { computeFog } from '../../game/systems/fogOfWar';
import type { ViewWindow } from '../viewWindow';
import { useT } from '../i18n';

export function LocatorMap({
  window: win, focusCityId, width = 150, onPickPx,
}: {
  window: ViewWindow | null;
  focusCityId?: string;
  width?: number;
  /** Click-to-jump: strategic-pixel coords of the clicked point. */
  onPickPx?: (px: number, py: number) => void;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const armies = useGameStore((s) => s.armies);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const espionageReveals = useGameStore((s) => s.espionageReveals);
  const t = useT();

  const visibleArmies = useMemo(() => {
    const all = Object.values(armies);
    if (!fogOfWar || !playerForceId) return all;
    const fog = computeFog(cities, armies, playerForceId, Object.keys(espionageReveals ?? {}));
    return all.filter((a) => a.forceId === playerForceId || fog.isVisiblePx(a.x, a.y));
  }, [armies, cities, fogOfWar, playerForceId, espionageReveals]);

  const height = width * (MAP_H / MAP_W);
  const sx = width / MAP_W;
  const sy = height / MAP_H;

  const cityList = Object.values(cities);
  const focus = focusCityId ? cities[focusCityId] : null;

  const winRectDeg = win ? (win.rotation * 180) / Math.PI : 0;

  return (
    <div style={{
      background: 'rgba(12, 10, 6, 0.82)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      padding: '4px 5px 2px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    }}>
      <svg
        width={width}
        height={height}
        style={{ display: 'block', cursor: onPickPx ? 'pointer' : undefined }}
        onClick={onPickPx ? (e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          onPickPx(((e.clientX - rect.left) / rect.width) * MAP_W, ((e.clientY - rect.top) / rect.height) * MAP_H);
        } : undefined}
      >
        {/* Sea backdrop */}
        <rect x={0} y={0} width={width} height={height} fill="#10202e" rx={2} />

        {/* City dots — coloured by owner; player cities brighter. */}
        {cityList.map((c) => {
          const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
          const mine = c.ownerForceId === playerForceId;
          return (
            <circle
              key={c.id}
              cx={c.coords.x * sx}
              cy={c.coords.y * sy}
              r={mine ? 1.8 : 1.3}
              fill={owner?.color ?? '#6a6050'}
              opacity={mine ? 1 : 0.6}
            />
          );
        })}

        {/* Marching columns — diamonds so they read apart from city dots;
            hostile columns get a red ring (the thing you scan for).
            Under fog of war, unseen hostile columns stay off this map too. */}
        {visibleArmies.map((a) => {
          const force = forces[a.forceId];
          const hostile = a.forceId !== playerForceId;
          const x = a.x * sx;
          const y = a.y * sy;
          return (
            <rect
              key={`army-${a.id}`}
              x={x - 1.4}
              y={y - 1.4}
              width={2.8}
              height={2.8}
              transform={`rotate(45, ${x}, ${y})`}
              fill={force?.color ?? '#9a8a6a'}
              stroke={hostile ? '#ff5040' : '#eef4f8'}
              strokeWidth={0.7}
            />
          );
        })}

        {/* The current view's window, rotated to its true bearing. */}
        {win && (
          <rect
            x={win.cx * sx - (win.spanX * sx) / 2}
            y={win.cy * sy - (win.spanY * sy) / 2}
            width={Math.max(4, win.spanX * sx)}
            height={Math.max(4, win.spanY * sy)}
            fill="rgba(240, 224, 160, 0.12)"
            stroke="#eef4f8"
            strokeWidth={1.2}
            transform={`rotate(${winRectDeg}, ${win.cx * sx}, ${win.cy * sy})`}
          />
        )}

        {/* Focused city — a gold ring + name. */}
        {focus && (
          <>
            <circle
              cx={focus.coords.x * sx}
              cy={focus.coords.y * sy}
              r={3.2}
              fill="none"
              stroke="#f2dd9a"
              strokeWidth={1.4}
            />
            <text
              x={focus.coords.x * sx}
              y={focus.coords.y * sy - 5}
              textAnchor="middle"
              fontSize={9}
              fill="#f2dd9a"
              fontFamily="Songti SC, serif"
              style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 2 }}
            >
              {focus.name.zh}
            </text>
          </>
        )}

        {/* Compass — the locator is always north-up. */}
        <g transform={`translate(${width - 12}, 12)`}>
          <line x1={0} y1={5} x2={0} y2={-5} stroke="#e6c473" strokeWidth={1.2} />
          <path d="M 0 -7 L -2.4 -3 L 2.4 -3 Z" fill="#e6c473" />
          <text x={0} y={-9} textAnchor="middle" fontSize={7} fill="#e6c473">N</text>
        </g>
      </svg>
      <div style={{
        color: '#7a8893', fontSize: '0.58rem', letterSpacing: '0.05rem',
        textAlign: 'center', marginTop: 1, fontFamily: 'var(--tkm-font-body)',
      }}>
        {win?.kind === 'battle'
          ? t('戰場位置', 'Battlefield location')
          : win?.kind === 'world'
            ? t('天下輿圖 — 點擊跳轉', 'The realm — tap to jump')
            : t('城邑位置', 'City location')}
      </div>
    </div>
  );
}
