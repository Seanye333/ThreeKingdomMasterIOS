import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { setVoiceEnabled } from '../../game/systems/sound';
import { exportAllSaves, importAllSaves } from '../../game/state/saveTransfer';
import { installMod, loadMods, parseModBundle, removeMod } from '../../game/systems/mods';
import { applyUiPrefs, getStoredUiPrefs, type UiPrefs, type UiScale } from '../uiPrefs';
import { useT } from '../i18n';
import { Modal } from './Modal';

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
  // 配音 — device-level voice-line (TTS) preference; lives in localStorage.
  const [voiceOn, setVoiceOn] = useState(() => (typeof localStorage === 'undefined' ? true : localStorage.getItem('tkm-voice') !== 'off'));
  useEffect(() => { setVoiceEnabled(voiceOn); }, [voiceOn]);
  const toggleVoice = (on: boolean) => {
    setVoiceOn(on);
    try { localStorage.setItem('tkm-voice', on ? 'on' : 'off'); } catch { /* ignore */ }
  };
  // 輔助偏好 — device-level, not campaign state; lives in localStorage.
  const [uiPrefs, setUiPrefs] = useState<UiPrefs>(getStoredUiPrefs);
  const updateUiPref = (patch: Partial<UiPrefs>) => {
    const next = { ...uiPrefs, ...patch };
    setUiPrefs(next);
    applyUiPrefs(next);
  };
  const t = useT();

  return (
    <Modal
      onClose={onClose}
      scrollBody
      padding="1rem 1.5rem"
      width="min(520px, 100%)"
      maxHeight="90vh"
      title={t('設定', 'Settings')}
      badge={t('遊戲偏好', 'Preferences')}
    >
          <Section title={t('音響', 'Audio')}>
            <Toggle label={t('音效', 'Sound effects')} hint={t('UI 點擊、刀劍、號角', 'UI clicks, swords, horns')} checked={soundEnabled} onChange={setSoundEnabled} />
            <Toggle label={t('武將配音', 'Voice lines')} hint={t('單挑/舌戰台詞語音(系統 TTS)', 'Spoken duel/debate barbs (system TTS)')} checked={voiceOn} onChange={toggleVoice} />
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

          <Section title={t('輔助', 'Accessibility')}>
            <Toggle
              label={t('減少動畫', 'Reduce motion')}
              hint={t('關閉畫面閃動、脈動警示與彈跳提示', 'Stop flashes, pulses & bouncing toasts')}
              checked={uiPrefs.reduceMotion}
              onChange={(v) => updateUiPref({ reduceMotion: v })}
            />
            <Toggle
              label={t('血腥畫面', 'Blood effects')}
              hint={t('受創時屏幕邊緣的紅暈', 'The red vignette when your troops are hit')}
              checked={uiPrefs.gore}
              onChange={(v) => updateUiPref({ gore: v })}
            />
            <Row label={t('介面字號', 'Text size')} hint={t('縮放全介面文字', 'Scale all interface text')}>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['sm', t('小', 'S')], ['md', t('中', 'M')], ['lg', t('大', 'L')]] as Array<[UiScale, string]>).map(([s, lbl]) => (
                  <button
                    key={s}
                    onClick={() => updateUiPref({ uiScale: s })}
                    style={{
                      background: uiPrefs.uiScale === s ? '#26323e' : 'transparent',
                      border: '1px solid ' + (uiPrefs.uiScale === s ? '#e6c473' : '#2b3845'),
                      color: uiPrefs.uiScale === s ? '#e6c473' : '#7a8893',
                      padding: '0.25rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
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

          <Section title={t('Mod 數據包', 'Mod packs')}>
            <ModRows />
          </Section>

          <Section title={t('戰鬥', 'Combat')}>
            <Row label={t('戰鬥速度', 'Battle speed')}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBattleSpeed(s)}
                    style={{
                      background: battleSpeed === s ? '#26323e' : 'transparent',
                      border: '1px solid ' + (battleSpeed === s ? '#e6c473' : '#2b3845'),
                      color: battleSpeed === s ? '#e6c473' : '#7a8893',
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
    </Modal>
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
    background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e6c473',
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

/** Mod 數據包 — install/remove JSON content bundles (officers + events).
 *  Applied on every NEW game; existing campaigns are untouched. */
function ModRows() {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mods, setMods] = useState(() => loadMods());
  const [status, setStatus] = useState<string | null>(null);

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseModBundle(String(reader.result ?? ''));
      if (res.ok) {
        installMod(res.bundle);
        setMods(loadMods());
        setStatus(t(
          `已安裝「${res.bundle.name}」:${res.bundle.officers?.length ?? 0} 武將 / ${res.bundle.events?.length ?? 0} 事件(開新局生效)`,
          `Installed "${res.bundle.name}" — applies on new games`,
        ));
      } else {
        setStatus(t('安裝失敗:不是有效的數據包', 'Import failed: not a valid mod bundle'));
      }
    };
    reader.readAsText(file);
  };

  const btn: React.CSSProperties = {
    background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e6c473',
    padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
  };

  return (
    <>
      <Row
        label={t('安裝數據包', 'Install bundle')}
        hint={status ?? t('JSON 格式:{kind:"tkm-mod", name, officers[], events[]} — 自製武將與事件,開新局時注入', 'JSON: {kind:"tkm-mod", name, officers[], events[]} — applied to new games')}
      >
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
      </Row>
      {mods.map((m) => (
        <Row key={m.name} label={`📦 ${m.name}`} hint={t(`${m.officers?.length ?? 0} 武將 · ${m.events?.length ?? 0} 事件 · ${m.scenarios?.length ?? 0} 劇本`, `${m.officers?.length ?? 0} officers · ${m.events?.length ?? 0} events · ${m.scenarios?.length ?? 0} scenarios`)}>
          <button
            style={{ ...btn, borderColor: '#b8442e', color: '#e8a890' }}
            onClick={() => { removeMod(m.name); setMods(loadMods()); }}
          >{t('移除', 'Remove')}</button>
        </Row>
      ))}
    </>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.08rem', color: '#c9a64e', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
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
        background: '#10161e',
        border: '1px solid #26323e',
        marginBottom: '0.3rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>
        <span style={{ fontSize: '0.9rem', color: '#e6c473' }}>{label}</span>
        {hint && (
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>
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
        background: '#10161e',
        border: '1px solid #26323e',
        marginBottom: '0.3rem',
        gap: '0.6rem',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', color: '#e6c473' }}>{label}</div>
        {hint && (
          <div style={{ fontSize: '0.72rem', color: '#7a8893', marginTop: 2, lineHeight: 1.3 }}>{hint}</div>
        )}
      </div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: '#080b0e',
  border: '1px solid #2b3845',
  color: '#e6c473',
  padding: '0.3rem',
  fontFamily: 'inherit',
};
