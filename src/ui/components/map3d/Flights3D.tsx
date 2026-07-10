/* 飛鏡與回放 — split out of StrategicMap3D.tsx (2026-07).
   The battle-ignition camera dive, the event flying-mirror sweep, the
   per-season replay recorder, and the replay scrub panel. */
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../../game/state/store';
import { useReplayStore } from '../replayHistory';
import { renderTerritorySnapshot } from '../territoryOverlay';
import { EmptyState } from '../EmptyState';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useT } from '../../i18n';
import type { Season } from '../../../game/types';
import { cityPixel } from '../../../game/data/cityGeo';
import { IS_MOBILE, pxToWorld, sampleTerrainHeight, SEASON_ZH } from './shared';

/**
 * 戰場引燃 — when a battle ignites, fly the world camera down to the clash
 * site (its geoAnchor) BEFORE the battle screen drops over the map, and leave
 * it there so the post-battle reveal shows the scar you made. One continuous
 * camera line: world → battle → world.
 */
export function BattleFocusFly({ controlsRef, onSettled }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onSettled: (target: [number, number, number]) => void;
}) {
  const { camera } = useThree();
  const geoAnchor = useGameStore((s) => s.tacticalBattle?.geoAnchor ?? null);
  const anim = useRef<null | {
    from: THREE.Vector3; to: THREE.Vector3;
    fromT: THREE.Vector3; toT: THREE.Vector3; t: number;
  }>(null);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!geoAnchor) { lastKey.current = null; return; }
    const key = `${Math.round(geoAnchor.x)},${Math.round(geoAnchor.y)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const [wx, wz] = pxToWorld(geoAnchor.x, geoAnchor.y);
    const h = sampleTerrainHeight(wx, wz);
    anim.current = {
      from: camera.position.clone(),
      to: new THREE.Vector3(wx, h + 2.8, wz + 2.3),
      fromT: controlsRef.current?.target.clone() ?? new THREE.Vector3(0, 0, 0),
      toT: new THREE.Vector3(wx, h, wz),
      t: 0,
    };
  }, [geoAnchor, camera, controlsRef]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    const ctrl = controlsRef.current;
    if (ctrl) ctrl.enabled = false;
    a.t = Math.min(1, a.t + delta / 0.85);
    const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2; // easeInOutQuad
    camera.position.lerpVectors(a.from, a.to, e);
    if (ctrl) {
      ctrl.target.lerpVectors(a.fromT, a.toT, e);
      ctrl.update();
    }
    if (a.t >= 1) {
      anim.current = null;
      if (ctrl) ctrl.enabled = true;
      onSettled([a.toT.x, a.toT.y, a.toT.z]);
    }
  });
  return null;
}

/* ─── 大事飛鏡 — a cinematic sweep when a city changes hands ───────────
   When YOU take a city (cityCaptured) or lose one (cityLost), the camera
   dives to it and slowly arcs around the newly-won (or newly-burning) walls
   before handing control back — a beat that makes a conquest *feel* like one.
   Battle ignitions keep their own fly (BattleFocusFly); this defers to them,
   and honours prefers-reduced-motion. */
export function EventFocusFly({ controlsRef, onSettled }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onSettled: (target: [number, number, number]) => void;
}) {
  const { camera } = useThree();
  const capturedKey = useGameStore((s) => s.cityCaptured?.key ?? 0);
  const lostKey = useGameStore((s) => s.cityLost?.key ?? 0);
  const battleActive = useGameStore((s) => !!s.tacticalBattle);
  const seen = useRef<{ cap: number; lost: number }>({ cap: capturedKey, lost: lostKey });
  const anim = useRef<null | {
    from: THREE.Vector3; orbitCenter: THREE.Vector3; radius: number;
    ang0: number; ang1: number; height: number;
    fromT: THREE.Vector3; toT: THREE.Vector3; t: number;
  }>(null);

  useEffect(() => {
    // Battle fly owns the camera while a fight is live; just keep our markers
    // current so we don't replay the move the instant the battle clears.
    if (battleActive) { seen.current = { cap: capturedKey, lost: lostKey }; return; }
    const capBumped = capturedKey !== seen.current.cap;
    const lostBumped = lostKey !== seen.current.lost;
    if (!capBumped && !lostBumped) return;
    seen.current = { cap: capturedKey, lost: lostKey };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const st = useGameStore.getState();
    const cityId = capBumped ? st.cityCaptured?.cityId : st.cityLost?.cityId;
    const city = cityId ? st.cities[cityId] : null;
    if (!city) return;
    const [wx, wz] = pxToWorld(...cityPixel(city.id, city.coords.x, city.coords.y));
    const h = sampleTerrainHeight(wx, wz);
    const ang0 = Math.PI * 0.28;
    anim.current = {
      from: camera.position.clone(),
      orbitCenter: new THREE.Vector3(wx, h, wz),
      radius: 3.2, ang0, ang1: ang0 + 0.95, height: h + 2.9,
      fromT: controlsRef.current?.target.clone() ?? new THREE.Vector3(0, 0, 0),
      toT: new THREE.Vector3(wx, h, wz),
      t: 0,
    };
  }, [capturedKey, lostKey, battleActive, camera, controlsRef]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    const ctrl = controlsRef.current;
    if (ctrl) ctrl.enabled = false;
    a.t = Math.min(1, a.t + delta / 2.1);          // ~2.1s: dive then slow arc
    const FLY = 0.45;
    if (a.t < FLY) {
      const e = a.t / FLY;
      const ease = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
      const start = new THREE.Vector3(
        a.orbitCenter.x + Math.cos(a.ang0) * a.radius, a.height, a.orbitCenter.z + Math.sin(a.ang0) * a.radius);
      camera.position.lerpVectors(a.from, start, ease);
      if (ctrl) { ctrl.target.lerpVectors(a.fromT, a.toT, ease); ctrl.update(); }
    } else {
      const e = (a.t - FLY) / (1 - FLY);
      const ang = a.ang0 + (a.ang1 - a.ang0) * e;
      camera.position.set(
        a.orbitCenter.x + Math.cos(ang) * a.radius, a.height, a.orbitCenter.z + Math.sin(ang) * a.radius);
      if (ctrl) { ctrl.target.copy(a.toT); ctrl.update(); }
    }
    if (a.t >= 1) {
      anim.current = null;
      if (ctrl) ctrl.enabled = true;
      onSettled([a.toT.x, a.toT.y, a.toT.z]);
    }
  });
  return null;
}

/* ─── 戰役回放 — record one territory snapshot per season (headless) ───── */
export function ReplayRecorder() {
  const dateSig = useGameStore((s) => `${s.date.year}-${s.date.season}-${s.date.phase}`);
  useEffect(() => {
    const st = useGameStore.getState();
    const owners: Record<string, string | null> = {};
    for (const c of Object.values(st.cities)) owners[c.id] = c.ownerForceId ?? null;
    const colors: Record<string, string> = {};
    for (const f of Object.values(st.forces)) colors[f.id] = f.color;
    const ph = st.date.phase === 'lower' ? '下' : st.date.phase === 'middle' ? '中' : '上';
    const label = `${st.date.year} ${SEASON_ZH[st.date.season as Season]}${ph}`;
    useReplayStore.getState().record({ label, owners }, colors);
  }, [dateSig]);
  return null;
}

/* ─── 戰役回放面板 — scrub / play the campaign's territory timelapse ───── */
export function ReplayPanel({ onClose }: { onClose: () => void }) {
  // Esc closes + registers an escape layer so map hotkeys don't fire behind it.
  useEscapeKey(onClose);
  const snapshots = useReplayStore((s) => s.snapshots);
  const colors = useReplayStore((s) => s.colors);
  const cities = useGameStore((s) => s.cities);
  const t = useT();
  const maxIdx = Math.max(0, snapshots.length - 1);
  const [idx, setIdx] = useState(maxIdx);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cur = Math.min(idx, maxIdx);

  useEffect(() => {
    if (!playing) return;
    const h = window.setInterval(() => {
      setIdx((i) => { if (i >= maxIdx) { setPlaying(false); return maxIdx; } return i + 1; });
    }, 300);
    return () => window.clearInterval(h);
  }, [playing, maxIdx]);

  useEffect(() => {
    const snap = snapshots[cur];
    const canvas = canvasRef.current;
    if (!snap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const src = renderTerritorySnapshot(cities, snap.owners, colors);
    ctx.fillStyle = '#0e0a06';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  }, [cur, snapshots, cities, colors]);

  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (cur >= maxIdx) setIdx(0);    // at the end → replay from the start
    setPlaying(true);
  };

  const cw = IS_MOBILE ? 320 : 520;
  const ch = Math.round((cw * 720) / 1000);

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(8,5,2,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, #1c1409 0%, #120c06 100%)',
        border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius-lg)', padding: '0.9rem 1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)', maxWidth: '94vw',
        fontFamily: 'var(--tkm-font-body)', color: '#d8c4a0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 'bold', letterSpacing: '0.08rem' }}>🎞 {t('戰役回放', 'Campaign Timelapse')}</div>
          <button onClick={onClose} aria-label={t('關閉', 'Close')} title={t('關閉', 'Close')} style={{
            background: 'transparent', color: '#a89070', border: '1px solid #5a4530',
            borderRadius: 'var(--tkm-radius)', cursor: 'pointer', padding: '0.15rem 0.5rem', fontSize: '0.8rem',
          }}>✕</button>
        </div>
        {snapshots.length === 0 ? (
          <div style={{ width: cw }}>
            <EmptyState
              icon="⏳"
              title={t('尚無記錄', 'No history yet')}
              hint={t('推進幾季後即可回放天下消長。', 'Advance a few seasons to build the timelapse.')}
            />
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} width={cw} height={ch} style={{
              width: cw, height: ch, borderRadius: 'var(--tkm-radius)', border: '1px solid #3a2c18', display: 'block', background: '#0e0a06',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
              <button onClick={togglePlay} style={{
                background: '#d4a84a', color: '#1a1410', border: 'none', borderRadius: 'var(--tkm-radius)',
                cursor: 'pointer', padding: '0.3rem 0.7rem', fontWeight: 'bold', fontSize: '0.85rem', minWidth: 64,
              }}>{playing ? t('⏸ 暫停', '⏸ Pause') : t('▶ 播放', '▶ Play')}</button>
              <input type="range" min={0} max={maxIdx} value={cur}
                onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
                style={{ flex: 1, accentColor: '#d4a84a', cursor: 'pointer' }} />
              <div style={{ minWidth: 86, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', color: '#e0c98a' }}>
                {snapshots[cur]?.label ?? ''}
              </div>
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: '#7a6a4a', textAlign: 'right' }}>
              {cur + 1} / {snapshots.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
