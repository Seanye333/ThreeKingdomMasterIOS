import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { setVoiceEnabled, setAudioFilesEnabled, isAudioFilesEnabled } from '../../game/systems/sound';
import { exportAllSaves, importAllSaves } from '../../game/state/saveTransfer';
import { installMod, loadMods, parseModBundle, removeMod } from '../../game/systems/mods';
import { applyUiPrefs, getStoredUiPrefs, type UiPrefs, type UiScale } from '../uiPrefs';
import { getRenderQualityPref, setRenderQualityPref, type RenderQualityPref } from '../renderQuality';
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
  // 3D 畫質 — frozen at module load (RENDER_HI), so changing it reloads to apply.
  const [renderQuality, setRenderQualityState] = useState<RenderQualityPref>(getRenderQualityPref);
  const changeRenderQuality = (pref: RenderQualityPref) => {
    if (pref === renderQuality) return;
    setRenderQualityState(pref);
    setRenderQualityPref(pref);
    // Persisted game state rehydrates on reload, so this is safe mid-campaign.
    setTimeout(() => window.location.reload(), 120);
  };
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  const romanceMode = useGameStore((s) => s.romanceMode);
  const setRomanceMode = useGameStore((s) => s.setRomanceMode);
  const roguelikeMode = useGameStore((s) => s.roguelikeMode);
  const setRoguelikeMode = useGameStore((s) => s.setRoguelikeMode);
  const lifespanMode = useGameStore((s) => s.lifespanMode ?? 'historical');
  const setLifespanMode = useGameStore((s) => s.setLifespanMode);
  const noBattleDeath = useGameStore((s) => s.noBattleDeath ?? false);
  const setNoBattleDeath = useGameStore((s) => s.setNoBattleDeath);
  const reviveDeadOfficers = useGameStore((s) => s.reviveDeadOfficers ?? false);
  const setReviveDeadOfficers = useGameStore((s) => s.setReviveDeadOfficers);
  const aiStrength = useGameStore((s) => s.aiStrength ?? 3);
  const setAiStrength = useGameStore((s) => s.setAiStrength);
  const victoryGoal = useGameStore((s) => s.victoryGoal ?? 'free');
  const setVictoryGoal = useGameStore((s) => s.setVictoryGoal);
  const battleDifficulty = useGameStore((s) => s.battleDifficulty ?? null);
  const setBattleDifficulty = useGameStore((s) => s.setBattleDifficulty);
  const lifespanLength = useGameStore((s) => s.lifespanLength ?? 'historical');
  const setLifespanLength = useGameStore((s) => s.setLifespanLength);
  const agingStatLock = useGameStore((s) => s.agingStatLock ?? false);
  const setAgingStatLock = useGameStore((s) => s.setAgingStatLock);
  const talentDiscovery = useGameStore((s) => s.talentDiscovery ?? 'normal');
  const setTalentDiscovery = useGameStore((s) => s.setTalentDiscovery);
  const duelFrequency = useGameStore((s) => s.duelFrequency ?? 'normal');
  const setDuelFrequency = useGameStore((s) => s.setDuelFrequency);
  const disasterFrequency = useGameStore((s) => s.disasterFrequency ?? 'normal');
  const setDisasterFrequency = useGameStore((s) => s.setDisasterFrequency);
  const ironman = useGameStore((s) => s.ironman ?? false);
  const setIronman = useGameStore((s) => s.setIronman);
  const newOfficers = useGameStore((s) => s.newOfficers ?? 'off');
  const setNewOfficers = useGameStore((s) => s.setNewOfficers);
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
  // 真實音效包 — opt-in override that plays recorded files from public/audio/
  // instead of the built-in synth/TTS (missing files fall back automatically).
  const [audioPackOn, setAudioPackOn] = useState(isAudioFilesEnabled);
  const toggleAudioPack = (on: boolean) => { setAudioPackOn(on); setAudioFilesEnabled(on); };
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
            <Toggle label={t('真實音效包', 'Real audio pack')} hint={t('改用 public/audio/ 內的錄音(缺檔自動回落合成)', 'Use recordings in public/audio/ (missing files fall back to synth)')} checked={audioPackOn} onChange={toggleAudioPack} />
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
            <Row label={t('3D 畫質', '3D quality')} hint={t('精緻：陰影＋光暈＋更高解析（重啟生效）', 'High: shadows + bloom + higher res (reloads to apply)')}>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['auto', t('自動', 'Auto')], ['low', t('流暢', 'Low')], ['high', t('精緻', 'High')]] as Array<[RenderQualityPref, string]>).map(([q, lbl]) => (
                  <button
                    key={q}
                    onClick={() => changeRenderQuality(q)}
                    style={{
                      background: renderQuality === q ? '#26323e' : 'transparent',
                      border: '1px solid ' + (renderQuality === q ? '#e6c473' : '#2b3845'),
                      color: renderQuality === q ? '#e6c473' : '#7a8893',
                      padding: '0.25rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </Row>
            <Toggle label={t('戰霧', 'Fog of war')} hint={t('隱藏未偵察的城邑', 'Hide unscouted cities')} checked={fogOfWar} onChange={setFogOfWar} />
            <Toggle
              label={t('幀率計', 'FPS meter')}
              hint={t('左上顯示即時幀率(除錯/調校用)', 'Live FPS readout for perf tuning')}
              checked={typeof window !== 'undefined' && localStorage.getItem('tkm-fps') === '1'}
              onChange={(v) => { localStorage.setItem('tkm-fps', v ? '1' : '0'); window.location.reload(); }}
            />
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
            <Row label={t('字體大小', 'Text size')} hint={t('整體縮放介面字級(重載生效)', 'Scales the whole UI text (reloads)')}>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['16', t('標準', 'Std')], ['18', t('大', 'Large')], ['20', t('特大', 'XL')]] as Array<[string, string]>).map(([px, lbl]) => {
                  const cur = (typeof window !== 'undefined' && localStorage.getItem('tkm-font-px')) || '16';
                  const on = cur === px;
                  return (
                    <button
                      key={px}
                      onClick={() => { localStorage.setItem('tkm-font-px', px); window.location.reload(); }}
                      style={{
                        background: on ? '#26323e' : 'transparent',
                        border: '1px solid ' + (on ? '#e6c473' : '#2b3845'),
                        color: on ? '#e6c473' : '#7a8893',
                        padding: '0.25rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >{lbl}</button>
                  );
                })}
              </div>
            </Row>
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
            <Toggle
              label={t('閒置自動全屏地圖', 'Auto full-screen map')}
              hint={t('數秒不操作即淡去頂欄/側欄,輕觸地圖喚回', 'Fade the bar & panel after a few idle seconds; tap the map to bring them back')}
              checked={uiPrefs.autoHideChrome}
              onChange={(v) => updateUiPref({ autoHideChrome: v })}
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
            <Row
              label={t('武將壽命', 'Officer lifespan')}
              hint={
                lifespanMode === 'historical'
                  ? t('史實:武將在史實卒年前後謝世', 'Historical: officers pass around their real death year')
                  : lifespanMode === 'fictionalImmortal'
                    ? t('虛構不老:自創/虛構武將不因壽命而亡,史實武將照常', 'Fictional immortal: invented officers never die of age; historical ones still do')
                    : t('全員不老:無人因壽命而亡', 'All immortal: no one dies of old age')
              }
            >
              <select
                value={lifespanMode}
                onChange={(e) => setLifespanMode(e.target.value as 'historical' | 'fictionalImmortal' | 'immortal')}
                style={selectStyle}
              >
                <option value="historical">{t('史實', 'Historical')}</option>
                <option value="fictionalImmortal">{t('虛構不老', 'Fictional immortal')}</option>
                <option value="immortal">{t('全員不老', 'All immortal')}</option>
              </select>
            </Row>
            <Toggle
              label={t('不會戰死', 'No battle death')}
              hint={t('武將不會在戰陣/單挑/重傷中喪命,改為負傷或被俘', 'Officers are never killed in battle — wounded or captured instead')}
              checked={noBattleDeath}
              onChange={setNoBattleDeath}
            />
            <Toggle
              label={t('起死回生', 'Revive the dead')}
              hint={t('已故武將(含戰役開始前去世者)或會逐年復活,現身故鄉', 'Dead officers (even those fallen before the campaign) may return over the years, appearing in their hometown')}
              checked={reviveDeadOfficers}
              onChange={setReviveDeadOfficers}
            />
            <Row label={t('AI 強度', 'AI strength')} hint={t('AI 的進取與戰術水平(獨立於難度)', "The AI's aggression & tactical skill (independent of difficulty)")}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setAiStrength(lv)}
                    style={{
                      background: aiStrength === lv ? '#26323e' : 'transparent',
                      border: '1px solid ' + (aiStrength === lv ? '#e6c473' : '#2b3845'),
                      color: aiStrength === lv ? '#e6c473' : '#7a8893',
                      padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >{lv}</button>
                ))}
              </div>
            </Row>
            <Row label={t('勝利條件', 'Victory condition')} hint={t('達成即獲勝;「自由」則任意結局皆可', 'Reaching it wins; "Free" allows any of the nine endings')}>
              <select
                value={victoryGoal}
                onChange={(e) => setVictoryGoal(e.target.value as 'free' | 'unify' | 'hegemon' | 'tripartite')}
                style={selectStyle}
              >
                <option value="free">{t('自由', 'Free')}</option>
                <option value="unify">{t('統一天下', 'Unify')}</option>
                <option value="hegemon">{t('稱霸中原', 'Hegemony')}</option>
                <option value="tripartite">{t('三分天下', 'Tripartite')}</option>
              </select>
            </Row>
            <Row label={t('戰鬥難度', 'Battle difficulty')} hint={t('戰術 AI 水平(可獨立於戰役難度)', 'Tactical-AI skill (can differ from campaign difficulty)')}>
              <select
                value={battleDifficulty ?? 'follow'}
                onChange={(e) => setBattleDifficulty(e.target.value === 'follow' ? null : e.target.value as 'easy' | 'normal' | 'hard')}
                style={selectStyle}
              >
                <option value="follow">{t('跟隨戰役', 'Follow')}</option>
                <option value="easy">{t('易', 'Easy')}</option>
                <option value="normal">{t('普通', 'Normal')}</option>
                <option value="hard">{t('困難', 'Hard')}</option>
              </select>
            </Row>
            <Row label={t('武將壽命長短', 'Lifespan length')} hint={t('老死速度;疊在「武將壽命」模式之上', 'Old-age death rate; layered on the lifespan mode')}>
              <select
                value={lifespanLength}
                onChange={(e) => setLifespanLength(e.target.value as 'short' | 'historical' | 'long')}
                style={selectStyle}
              >
                <option value="short">{t('短命', 'Short')}</option>
                <option value="historical">{t('史實', 'Historical')}</option>
                <option value="long">{t('長壽', 'Long')}</option>
              </select>
            </Row>
            <Toggle
              label={t('變老不影響屬性', 'Aging keeps stats')}
              hint={t('開啟後五圍不隨年齡增減(無遲暮衰退,亦無智政晚成);武將照常衰老、得失性格、終老', 'Five stats stay frozen against age (no decline, no late-bloom); officers still age, drift traits, and die')}
              checked={agingStatLock}
              onChange={setAgingStatLock}
            />
            <Row label={t('在野登場', 'Talent discovery')} hint={t('搜索人才的成功率', 'How readily Search for Talent finds officers')}>
              <select
                value={talentDiscovery}
                onChange={(e) => setTalentDiscovery(e.target.value as 'scarce' | 'normal' | 'plentiful')}
                style={selectStyle}
              >
                <option value="scarce">{t('稀少', 'Scarce')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="plentiful">{t('眾多', 'Plentiful')}</option>
              </select>
            </Row>
            <Row label={t('單挑頻率', 'Duel frequency')} hint={t('陣前一騎討的觸發機率', 'How often field duels break out')}>
              <select
                value={duelFrequency}
                onChange={(e) => setDuelFrequency(e.target.value as 'rare' | 'normal' | 'frequent')}
                style={selectStyle}
              >
                <option value="rare">{t('罕見', 'Rare')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="frequent">{t('頻繁', 'Frequent')}</option>
              </select>
            </Row>
            <Row label={t('天災頻率', 'Disaster frequency')} hint={t('饑荒/瘟疫/水患的發生率', 'Famine / plague / flood rate')}>
              <select
                value={disasterFrequency}
                onChange={(e) => setDisasterFrequency(e.target.value as 'low' | 'normal' | 'high')}
                style={selectStyle}
              >
                <option value="low">{t('少', 'Low')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="high">{t('多', 'High')}</option>
              </select>
            </Row>
            <Toggle
              label={t('鐵人模式', 'Ironman')}
              hint={t('禁止手動存檔,只保留每季自動存檔', 'Disables manual save — only the per-season autosave remains')}
              checked={ironman}
              onChange={setIronman}
            />
            <Row label={t('新武將登場', 'New officers')} hint={t('虛構新秀隨年代以在野身分登場', 'Fictional newcomers appear over time as free agents')}>
              <select
                value={newOfficers}
                onChange={(e) => setNewOfficers(e.target.value as 'off' | 'rare' | 'normal' | 'common')}
                style={selectStyle}
              >
                <option value="off">{t('關閉', 'Off')}</option>
                <option value="rare">{t('稀少', 'Rare')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="common">{t('頻繁', 'Common')}</option>
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
    background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#e6c473',
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
    background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#e6c473',
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
