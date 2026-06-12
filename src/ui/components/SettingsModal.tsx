import { useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { exportAllSaves, importAllSaves } from '../../game/state/saveTransfer';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
}

/**
 * Consolidated settings menu — gathers every toggle the player can flip
 * during a campaign in one place.
 */
export function SettingsModal({ onClose }: Props) {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  const romanceMode = useGameStore((s) => s.romanceMode);
  const setRomanceMode = useGameStore((s) => s.setRomanceMode);
  const roguelikeMode = useGameStore((s) => s.roguelikeMode);
  const setRoguelikeMode = useGameStore((s) => s.setRoguelikeMode);
  const careerMode = useGameStore((s) => s.careerMode);
  const battleSpeed = useGameStore((s) => s.battleSpeed);
  const setBattleSpeed = useGameStore((s) => s.setBattleSpeed);
  const musicTrack = useGameStore((s) => s.musicTrack);
  const setMusicTrack = useGameStore((s) => s.setMusicTrack);
  const language = useGameStore((s) => s.language ?? 'zh');
  const setLanguage = useGameStore((s) => s.setLanguage);
  const placementMode = useGameStore((s) => s.placementMode ?? 'historical');
  const setPlacementMode = useGameStore((s) => s.setPlacementMode);
  const t = useT();

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'grid', placeItems: 'center',
        zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '1px solid #5a4530',
          width: 'min(520px,100%)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '1rem 1.5rem', borderBottom: '1px solid #4a3520',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>{t('設定', 'Settings')}</div>
            <div style={{ fontSize: '0.85rem', color: '#8a7050', fontStyle: 'italic' }}>{t('遊戲偏好', 'Preferences')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>
        <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          <Section title={t('音響', 'Audio')}>
            <Toggle label={t('音效', 'Sound effects')} hint={t('UI 點擊、刀劍、號角', 'UI clicks, swords, horns')} checked={soundEnabled} onChange={setSoundEnabled} />
            <Row label={t('背景音樂', 'Music')}>
              <select
                value={musicTrack ?? 'auto'}
                onChange={(e) => setMusicTrack(e.target.value === 'auto' ? null : e.target.value)}
                style={selectStyle}
              >
                <option value="auto">{t('自動（依場景）', 'Auto (by scene)')}</option>
                <option value="peace">{t('平時', 'Peace')}</option>
                <option value="tension">{t('緊張', 'Tension')}</option>
                <option value="battle">{t('戰鬥', 'Battle')}</option>
                <option value="victory">{t('勝利', 'Victory')}</option>
                <option value="defeat">{t('敗北', 'Defeat')}</option>
              </select>
            </Row>
          </Section>

          <Section title={t('畫面', 'Display')}>
            <Toggle label={t('戰霧', 'Fog of war')} hint={t('隱藏未偵察的城邑', 'Hide unscouted cities')} checked={fogOfWar} onChange={setFogOfWar} />
            <Row label={t('語言', 'Language')}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'zh' | 'en' | 'both')}
                style={selectStyle}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="both">中英 Both</option>
              </select>
            </Row>
          </Section>

          <Section title={t('遊戲', 'Gameplay')}>
            <Toggle
              label={t('演義模式', 'Romance mode')}
              hint={t('歷史事件 100% 按時觸發', 'Historical events fire 100% on schedule')}
              checked={romanceMode}
              onChange={setRomanceMode}
            />
            <Toggle
              label={t('永久死亡', 'Roguelike')}
              hint={careerMode ? t('武將生涯死亡即結束戰役', 'Career officer death ends the campaign') : t('需先開啟「武將生涯」模式', 'Requires Career mode')}
              checked={roguelikeMode}
              onChange={setRoguelikeMode}
              disabled={!careerMode}
            />
            <Row
              label={t('武將與名品出現位置', 'Talent & item placement')}
              hint={
                placementMode === 'historical'
                  ? t('依歷史:諸葛亮在琅琊,倚天劍在許昌…', 'Historical: Zhuge Liang waits in Langya, Yitian Sword in Xuchang…')
                  : t('虛構:全隨機散落,每局都不同', 'Fictional: scattered randomly, every campaign plays differently')
              }
            >
              <select
                value={placementMode}
                onChange={(e) => setPlacementMode(e.target.value as 'historical' | 'random')}
                style={selectStyle}
              >
                <option value="historical">{t('歷史', 'Historical')}</option>
                <option value="random">{t('虛構', 'Fictional')}</option>
              </select>
            </Row>
          </Section>

          <Section title={t('存檔互傳', 'Save transfer')}>
            <SaveTransferRows />
          </Section>

          <Section title={t('戰鬥', 'Combat')}>
            <Row label={t('戰鬥速度', 'Battle speed')}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBattleSpeed(s)}
                    style={{
                      background: battleSpeed === s ? '#3a2d20' : 'transparent',
                      border: '1px solid ' + (battleSpeed === s ? '#d4a84a' : '#4a3520'),
                      color: battleSpeed === s ? '#d4a84a' : '#8a7050',
                      padding: '0.25rem 0.7rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </Row>
          </Section>
        </div>
      </div>
    </div>
  );
}

/** 存檔互傳 — download every save as one JSON; import it on another
 *  device. The no-backend "cloud save" that makes the PWA portable. */
function SaveTransferRows() {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const doExport = () => {
    const bundle = exportAllSaves();
    const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `三國志大師存檔-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(t(`已導出 ${Object.keys(bundle.entries).length} 項`, `Exported ${Object.keys(bundle.entries).length} keys`));
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importAllSaves(String(reader.result ?? ''));
      if (res.ok) {
        setStatus(t(`已導入 ${res.count} 項,即將重新載入…`, `Imported ${res.count} keys, reloading…`));
        window.setTimeout(() => window.location.reload(), 900);
      } else {
        setStatus(t('導入失敗:不是有效的存檔文件', 'Import failed: not a valid save bundle'));
      }
    };
    reader.readAsText(file);
  };

  const btn: React.CSSProperties = {
    background: '#2a1f15', border: '1px solid #5a4530', color: '#d4a84a',
    padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
  };

  return (
    <Row
      label={t('跨設備搬家', 'Move between devices')}
      hint={status ?? t('導出成文件 → 傳到另一台設備 → 導入即接著玩(含全部存檔槽與偏好)', 'Export to a file → send it to the other device → import and keep playing (all slots & prefs)')}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={btn} onClick={doExport}>⬇ {t('導出', 'Export')}</button>
        <button style={btn} onClick={() => fileRef.current?.click()}>⬆ {t('導入', 'Import')}</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = '';
          }}
        />
      </div>
    </Row>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.25rem', color: '#c19a3b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.65rem',
        background: '#1a1410',
        border: '1px solid #3a2d20',
        marginBottom: '0.3rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>
        <span style={{ fontSize: '0.9rem', color: '#d4a84a' }}>{label}</span>
        {hint && (
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#8a7050', fontStyle: 'italic' }}>
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: import('react').ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: hint ? 'flex-start' : 'center',
        padding: '0.5rem 0.65rem',
        background: '#1a1410',
        border: '1px solid #3a2d20',
        marginBottom: '0.3rem',
        gap: '0.6rem',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', color: '#d4a84a' }}>{label}</div>
        {hint && (
          <div style={{ fontSize: '0.72rem', color: '#8a7050', marginTop: 2, lineHeight: 1.3 }}>{hint}</div>
        )}
      </div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: '#0a0805',
  border: '1px solid #4a3520',
  color: '#d4a84a',
  padding: '0.3rem',
  fontFamily: 'inherit',
};
