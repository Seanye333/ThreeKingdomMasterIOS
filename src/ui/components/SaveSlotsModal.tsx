import { useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { renameSlot } from '../../game/state/saveSlots';
import { SCENARIOS } from '../../game/data/scenarios';
import styles from './SaveSlotsModal.module.css';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
  /** Mode: from title screen (load-only) vs in-game (save + load). */
  mode: 'save' | 'load';
}

type SortKey = 'date' | 'year' | 'label';

export function SaveSlotsModal({ onClose, mode }: Props) {
  const saveSlot = useGameStore((s) => s.saveSlot);
  const loadSlot = useGameStore((s) => s.loadSlot);
  const deleteSlotAction = useGameStore((s) => s.deleteSlot);
  const listSlotsFn = useGameStore((s) => s.listSlots);

  const [newLabel, setNewLabel] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  const t = useT();

  // Build a scenario id → name map for nicer display
  const scenarioName = (id: string | null): string => {
    if (!id) return '';
    const scen = SCENARIOS.find((s) => s.id === id);
    return scen ? `${scen.name.zh}` : id;
  };

  const slots = listSlotsFn().slice().sort((a, b) => {
    if (sortKey === 'date')  return b.savedAt - a.savedAt;
    if (sortKey === 'year')  return b.year - a.year;
    return a.label.localeCompare(b.label);
  });

  const doSave = (slotId?: string) => {
    const id = slotId ?? `slot-${Date.now()}`;
    saveSlot(id, newLabel.trim() || `Save ${new Date().toLocaleString()}`);
    setNewLabel('');
    setRefresh((n) => n + 1);
  };

  const doLoad = (id: string) => {
    const ok = loadSlot(id);
    if (ok) onClose();
    else alert('Failed to load save.');
  };

  const doDelete = (id: string) => {
    if (!confirm(t('永久刪除此存檔？', 'Delete this save permanently?'))) return;
    deleteSlotAction(id);
    setRefresh((n) => n + 1);
  };

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameLabel(current);
  };
  const commitRename = (id: string) => {
    if (renameLabel.trim()) renameSlot(id, renameLabel.trim());
    setRenamingId(null);
    setRefresh((n) => n + 1);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>
              {mode === 'save' ? '保存' : '載入'}
            </div>
            <div className={styles.titleEn}>
              {mode === 'save' ? t('保存', 'Save Game') : t('載入', 'Load Game')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: '#a89070' }}>
              {t('排序', 'Sort')}：
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={{
                  marginLeft: 4, background: '#1a1410',
                  color: '#f0e0b0', border: '1px solid #5a4530',
                  padding: '2px 4px', fontSize: 11,
                }}
              >
                <option value="date">{t('日期', 'Date')}</option>
                <option value="year">{t('年份', 'Year')}</option>
                <option value="label">{t('名稱', 'Label')}</option>
              </select>
            </label>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
        </header>

        <div className={styles.body}>
          {mode === 'save' && (
            <div className={styles.newSlot}>
              <input
                className={styles.newSlotInput}
                placeholder={t('存檔名（可選）', 'Save label (optional)')}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <button className={styles.actionBtn} onClick={() => doSave()}>
                {t('新建保存', 'New Save')}
              </button>
            </div>
          )}

          {slots.length === 0 ? (
            <div className={styles.empty}>
              {mode === 'save' ? t('尚無存檔，可從上方新建。', 'No saves yet. Create one above.') : t('沒有存檔。', 'No saved games.')}
              <div style={{ marginTop: 8, fontSize: 11 }}>refresh #{refresh}</div>
            </div>
          ) : (
            slots.map((s) => {
              const isRenaming = renamingId === s.id;
              return (
                <div key={s.id} className={styles.slotRow} style={{
                  borderLeft: `4px solid ${s.forceColor ?? '#5a4530'}`,
                  paddingLeft: 10,
                }}>
                  <div className={styles.slotInfo}>
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameLabel}
                        onChange={(e) => setRenameLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(s.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => commitRename(s.id)}
                        style={{
                          background: '#1a1410', color: '#f0e0b0',
                          border: '1px solid #d4a84a',
                          padding: '2px 6px', fontSize: 13,
                          fontFamily: 'Songti SC, serif',
                          width: '100%',
                        }}
                      />
                    ) : (
                      <span
                        className={styles.slotLabel}
                        onDoubleClick={() => startRename(s.id, s.label)}
                        title={t('雙擊重命名', 'Double-click to rename')}
                      >{s.label}</span>
                    )}
                    <span className={styles.slotMeta}>
                      <strong style={{ color: s.forceColor ?? '#d4a84a' }}>
                        {s.playerForceName}
                      </strong>
                      {s.scenarioId && (
                        <> · <span style={{ color: '#a89070' }}>{scenarioName(s.scenarioId)}</span></>
                      )}
                      {' · '}{s.year} {s.season}
                      {s.cityCount !== undefined && (
                        <> · 城 <strong>{s.cityCount}</strong></>
                      )}
                      {s.troopTotal !== undefined && s.troopTotal > 0 && (
                        <> · 兵 <strong>{(s.troopTotal / 1000).toFixed(0)}k</strong></>
                      )}
                    </span>
                    <span style={{ fontSize: 10, color: '#7a6750' }}>
                      {new Date(s.savedAt).toLocaleString()}
                    </span>
                  </div>
                  {mode === 'save' && (
                    <button
                      className={styles.loadBtn}
                      onClick={() => {
                        if (confirm(t(`覆蓋「${s.label}」？`, `Overwrite "${s.label}"?`))) doSave(s.id);
                      }}
                      title={t('用當前進度覆蓋此存檔', 'Overwrite this save with current state')}
                      style={{ background: '#5a4530' }}
                    >{t('覆蓋', 'Overwrite')}</button>
                  )}
                  <button
                    className={styles.loadBtn}
                    onClick={() => doLoad(s.id)}
                  >{t('載入', 'Load')}</button>
                  <button
                    className={styles.delBtn}
                    onClick={() => doDelete(s.id)}
                  >{t('刪除', 'Delete')}</button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
