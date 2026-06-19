import { useState, type CSSProperties } from 'react';
import { useGameStore } from '../../game/state/store';
import type { Scenario } from '../../game/types';
import type { EventEffect } from '../../game/types/event';
import { validateDraft, buildCustomEvent, type CustomEventDraft } from '../../game/systems/customEvents';
import { useT, useLanguage } from '../i18n';

interface Props {
  scenario: Scenario;
  onClose: () => void;
}

type EffectKind = 'force-gold' | 'city-loyalty' | 'officer-loyalty' | 'force-troops-multiplier' | 'flag';

const EFFECT_KINDS: Array<{ id: EffectKind; zh: string; en: string }> = [
  { id: 'force-gold', zh: '勢力資金 ±', en: 'Force gold ±' },
  { id: 'force-troops-multiplier', zh: '勢力兵力 ×', en: 'Force troops ×' },
  { id: 'city-loyalty', zh: '城池民心 ±', en: 'City loyalty ±' },
  { id: 'officer-loyalty', zh: '武將忠誠 ±', en: 'Officer loyalty ±' },
  { id: 'flag', zh: '設置旗標', en: 'Set flag' },
];

/**
 * 事件編輯器 (Event Editor) — author custom events that fire during play.
 * Entity dropdowns are scoped to the passed scenario; the event is shaped like
 * a HistoricalEvent and fires through the same engine as scripted events.
 */
export function EventEditorModal({ scenario, onClose }: Props) {
  const customEvents = useGameStore((s) => s.customEvents);
  const addCustomEvent = useGameStore((s) => s.addCustomEvent);
  const removeCustomEvent = useGameStore((s) => s.removeCustomEvent);
  const t = useT();
  const lang = useLanguage();

  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [yearMin, setYearMin] = useState(scenario.startDate.year);
  const [yearMax, setYearMax] = useState(scenario.startDate.year + 5);
  const [descZh, setDescZh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [effects, setEffects] = useState<EventEffect[]>([]);
  const [msg, setMsg] = useState('');

  // Effect-builder local state
  const [efKind, setEfKind] = useState<EffectKind>('force-gold');
  const [efForce, setEfForce] = useState(scenario.forces[0]?.id ?? '');
  const [efCity, setEfCity] = useState(scenario.cities[0]?.id ?? '');
  const [efOfficer, setEfOfficer] = useState(scenario.officers[0]?.id ?? '');
  const [efValue, setEfValue] = useState('100');
  const [efFlag, setEfFlag] = useState('');

  const officers = [...scenario.officers].sort((a, b) =>
    (lang === 'en' ? a.name.en : a.name.zh).localeCompare(lang === 'en' ? b.name.en : b.name.zh));

  const addEffect = () => {
    const num = Number(efValue);
    let eff: EventEffect | null = null;
    switch (efKind) {
      case 'force-gold': eff = { kind: 'force-gold', forceId: efForce, delta: num }; break;
      case 'force-troops-multiplier': eff = { kind: 'force-troops-multiplier', forceId: efForce, multiplier: num }; break;
      case 'city-loyalty': eff = { kind: 'city-loyalty', cityId: efCity, delta: num }; break;
      case 'officer-loyalty': eff = { kind: 'officer-loyalty', officerId: efOfficer, delta: num }; break;
      case 'flag': if (efFlag.trim()) eff = { kind: 'flag', key: efFlag.trim() }; break;
    }
    if (eff) { setEffects((xs) => [...xs, eff!]); setMsg(''); }
  };

  const describeEffect = (e: EventEffect): string => {
    switch (e.kind) {
      case 'force-gold': return `${forceName(e.forceId)} 金 ${e.delta >= 0 ? '+' : ''}${e.delta}`;
      case 'force-troops-multiplier': return `${forceName(e.forceId)} 兵 ×${e.multiplier}`;
      case 'city-loyalty': return `${cityName(e.cityId)} 民心 ${e.delta >= 0 ? '+' : ''}${e.delta}`;
      case 'officer-loyalty': return `${officerName(e.officerId)} 忠 ${e.delta >= 0 ? '+' : ''}${e.delta}`;
      case 'flag': return `flag: ${e.key}`;
      default: return e.kind;
    }
  };
  const forceName = (id: string) => scenario.forces.find((f) => f.id === id)?.name.zh ?? id;
  const cityName = (id: string) => scenario.cities.find((c) => c.id === id)?.name.zh ?? id;
  const officerName = (id: string) => scenario.officers.find((o) => o.id === id)?.name.zh ?? id;

  const save = () => {
    const draft: CustomEventDraft = {
      nameZh, nameEn, yearMin, yearMax, descriptionZh: descZh, descriptionEn: descEn, effects,
    };
    const v = validateDraft(draft);
    if (!v.ok) { setMsg(v.error ?? 'Invalid.'); return; }
    const evt = buildCustomEvent(draft, customEvents);
    const r = addCustomEvent(evt);
    setMsg(r.message);
    if (r.ok) {
      setNameZh(''); setNameEn(''); setDescZh(''); setDescEn(''); setEffects([]);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <header style={header}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>{t('事件編輯器', 'Event Editor')}</div>
            <div style={{ fontSize: '0.8rem', color: '#7a8893', fontStyle: 'italic' }}>
              {lang === 'en' ? scenario.name.en : scenario.name.zh} · {t('自製事件於遊戲中觸發', 'Authored events fire during play')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Existing events */}
          {customEvents.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={sectionLabel}>{t('已建事件', 'Your Events')} ({customEvents.length})</div>
              {customEvents.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: '#10161e', border: '1px solid #2b3845', marginTop: '0.3rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#e6c473' }}>{lang === 'en' ? e.name.en : e.name.zh}</span>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', marginLeft: '0.5rem' }}>
                      {e.yearMin}–{e.yearMax} · {e.effects.length} {t('效果', 'effects')}
                    </span>
                  </div>
                  <button onClick={() => removeCustomEvent(e.id)} style={{ ...miniBtn, borderColor: '#c0504a', color: '#e2a07a' }}>{t('刪除', 'Delete')}</button>
                </div>
              ))}
            </div>
          )}

          {/* Authoring form */}
          <div style={sectionLabel}>{t('新建事件', 'New Event')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <input style={inp} placeholder={t('名稱(中)', 'Name (zh)')} value={nameZh} onChange={(e) => setNameZh(e.target.value)} />
            <input style={inp} placeholder={t('名稱(英)', 'Name (en)')} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#a08c6a' }}>{t('年份', 'Years')}</span>
            <input style={{ ...inp, width: 80 }} type="number" value={yearMin} onChange={(e) => setYearMin(Number(e.target.value))} />
            <span style={{ color: '#7a8893' }}>–</span>
            <input style={{ ...inp, width: 80 }} type="number" value={yearMax} onChange={(e) => setYearMax(Number(e.target.value))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <input style={inp} placeholder={t('描述(中)', 'Description (zh)')} value={descZh} onChange={(e) => setDescZh(e.target.value)} />
            <input style={inp} placeholder={t('描述(英)', 'Description (en)')} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          </div>

          {/* Effect builder */}
          <div style={{ border: '1px solid #2b3845', background: 'rgba(20,16,12,0.5)', padding: '0.6rem', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.76rem', color: '#a08c6a', marginBottom: '0.4rem' }}>{t('加入效果', 'Add an effect')}</div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select style={sel} value={efKind} onChange={(e) => setEfKind(e.target.value as EffectKind)}>
                {EFFECT_KINDS.map((k) => <option key={k.id} value={k.id}>{lang === 'en' ? k.en : k.zh}</option>)}
              </select>
              {(efKind === 'force-gold' || efKind === 'force-troops-multiplier') && (
                <select style={sel} value={efForce} onChange={(e) => setEfForce(e.target.value)}>
                  {scenario.forces.map((f) => <option key={f.id} value={f.id}>{lang === 'en' ? f.name.en : f.name.zh}</option>)}
                </select>
              )}
              {efKind === 'city-loyalty' && (
                <select style={sel} value={efCity} onChange={(e) => setEfCity(e.target.value)}>
                  {scenario.cities.map((c) => <option key={c.id} value={c.id}>{lang === 'en' ? c.name.en : c.name.zh}</option>)}
                </select>
              )}
              {efKind === 'officer-loyalty' && (
                <select style={sel} value={efOfficer} onChange={(e) => setEfOfficer(e.target.value)}>
                  {officers.map((o) => <option key={o.id} value={o.id}>{lang === 'en' ? o.name.en : o.name.zh}</option>)}
                </select>
              )}
              {efKind === 'flag'
                ? <input style={{ ...inp, width: 140 }} placeholder="flag-key" value={efFlag} onChange={(e) => setEfFlag(e.target.value)} />
                : <input style={{ ...inp, width: 90 }} type="number" value={efValue} onChange={(e) => setEfValue(e.target.value)}
                    title={efKind === 'force-troops-multiplier' ? t('倍率，如 1.2', 'multiplier e.g. 1.2') : t('增減值', 'delta')} />}
              <button style={btn(true)} onClick={addEffect}>{t('＋ 效果', '＋ Effect')}</button>
            </div>
            {effects.length > 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {effects.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#aab6c0' }}>
                    <span style={{ color: '#7ed68a' }}>•</span>
                    <span style={{ flex: 1 }}>{describeEffect(e)}</span>
                    <button style={miniBtn} onClick={() => setEffects((xs) => xs.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg && <div style={{ fontSize: '0.8rem', color: msg.includes('saved') || msg.includes('Custom') ? '#7ed68a' : '#e2a07a', marginBottom: '0.5rem' }}>{msg}</div>}
          <button style={{ ...btn(true), width: '100%', padding: '0.6rem', fontSize: '0.95rem' }} onClick={save}>
            {t('儲存事件', 'Save Event')}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' };
const panel: CSSProperties = { background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', width: 'min(720px,100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', color: '#e6edf3', fontFamily: 'var(--tkm-font-body)' };
const header: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845' };
const sectionLabel: CSSProperties = { fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.4rem' };
const inp: CSSProperties = { background: '#14100c', border: '1px solid #2b3845', color: '#e6edf3', padding: '0.35rem 0.5rem', fontFamily: 'inherit', fontSize: '0.82rem' };
const sel: CSSProperties = { ...inp };
const miniBtn: CSSProperties = { background: '#1e2832', border: '1px solid #2b3845', color: '#e6c473', padding: '0.15rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem' };
function btn(enabled: boolean): CSSProperties {
  return { background: enabled ? '#1e2832' : 'transparent', border: '1px solid #e6c473', color: enabled ? '#e6c473' : '#6a5238', padding: '0.35rem 0.7rem', cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.82rem' };
}
