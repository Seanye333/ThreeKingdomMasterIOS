import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { POLICY_DEFS, TACTIC_DEFS, type TacticId } from '../../game/data/officerAttributes';
import { trainingCost, eligiblePolicies, cityHasAcademy, trainingDurationSeasons, policyTier, academyLevel, academyCapacity, trainingsInCity, eligibleMentors, mentorDurationSeasons, cityHasMentors, busyOfficerIds, isParentMentor, eligibleTactics, eligibleTacticMentors, tacticDurationSeasons, tacticMentorDurationSeasons, tacticTier, tacticTrainingCost } from '../../game/systems/training';
import type { EntityId, Officer, PolicyId } from '../../game/types';
import { useT, useLanguage } from '../i18n';
import styles from './OfficerPicker.module.css';

interface Props {
  cityId: EntityId;
  onClose: () => void;
}

/**
 * Academy training picker — pick an idle officer in this city, then pick a
 * policy they're eligible to learn. Locked policies are visible (so the
 * player can plan ahead) but greyed out with the missing-prereq listed.
 */
export function TrainingPicker({ cityId, onClose }: Props) {
  const city = useGameStore((s) => s.cities[cityId]);
  const officers = useGameStore((s) => s.officers);
  const buildings = useGameStore((s) => s.buildings);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const family = useGameStore((s) => s.family);
  const officerWishes = useGameStore((s) => s.officerWishes);
  const startTraining = useGameStore((s) => s.startTraining);
  const startTacticTraining = useGameStore((s) => s.startTacticTraining);
  const [mode, setMode] = useState<'policy' | 'tactic'>('policy');
  const t = useT();
  const lang = useLanguage();

  const busyIds = useMemo(() => busyOfficerIds(pendingTrainings), [pendingTrainings]);
  const eligibleOfficers = useMemo(
    () =>
      Object.values(officers).filter(
        (o) =>
          o.locationCityId === cityId &&
          o.forceId === city?.ownerForceId &&
          o.status === 'idle' &&
          !o.task &&
          !busyIds.has(o.id),
      ),
    [officers, cityId, city?.ownerForceId, busyIds],
  );

  const [pickedOfficer, setPickedOfficer] = useState<Officer | null>(
    eligibleOfficers[0] ?? null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!city) return null;
  const hasAcademy = cityHasAcademy(city, buildings);
  const hasMentors = cityHasMentors(city, officers, pendingTrainings);
  if (!hasAcademy && !hasMentors) {
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header className={styles.header}>
            <div className={styles.titleZh}>{t('武將培訓', 'Officer Training')}</div>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </header>
          <div style={{ padding: '1rem 1.25rem', color: '#aab6c0' }}>
            {t('此城尚無書院,也無可任教武將。', 'No academy in this city, and no officer here can teach.')}
          </div>
        </div>
      </div>
    );
  }

  const cost = pickedOfficer ? trainingCost(pickedOfficer) : 0;
  const { available, locked } = pickedOfficer
    ? eligiblePolicies(pickedOfficer)
    : { available: [] as PolicyId[], locked: [] as Array<{ id: PolicyId; missing: PolicyId[] }> };

  const handleAcademyPick = (policyId: PolicyId) => {
    if (!pickedOfficer) return;
    const dur = trainingDurationSeasons(pickedOfficer, city, policyId, buildings);
    const r = startTraining(pickedOfficer.id, cityId, policyId);
    if (r.ok) {
      setFeedback(
        dur === 0
          ? t('書院 lv3,當場習得!', 'Imperial Academy — learned instantly!')
          : t(`培訓開始,${dur} 季後完成。`, `Training begun — completes in ${dur} season${dur > 1 ? 's' : ''}.`),
      );
      setTimeout(onClose, 1000);
    } else {
      setFeedback(r.reason ?? t('無法開始培訓。', 'Cannot start training.'));
    }
  };
  const handleMentorPick = (policyId: PolicyId, mentorId: EntityId) => {
    if (!pickedOfficer) return;
    const mentor = officers[mentorId];
    const dur = mentorDurationSeasons(pickedOfficer, city, policyId, mentor, family);
    const r = startTraining(pickedOfficer.id, cityId, policyId, mentorId);
    if (r.ok) {
      setFeedback(
        t(`${mentor?.name.zh ?? '師者'} 開始傳授,${dur} 季後完成。`,
          `${mentor?.name.en ?? 'Mentor'} began teaching — completes in ${dur} season${dur > 1 ? 's' : ''}.`),
      );
      setTimeout(onClose, 1000);
    } else {
      setFeedback(r.reason ?? t('無法開始培訓。', 'Cannot start training.'));
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{hasAcademy ? t('書院培訓', 'Academy Training') : t('師徒傳授', 'Mentor Teaching')}</div>
            <div className={styles.titleEn}>
              {lang === 'en' ? city.name.en : city.name.zh} · {t('金錢', 'Gold')} {city.gold}
              {!hasAcademy && hasMentors && (
                <span style={{ marginLeft: 8, color: '#7ed68a' }}>· {t('無書院,以師徒制', 'No academy — mentor mode')}</span>
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div style={{ padding: '0.5rem 1.25rem', background: '#10161e', borderBottom: '1px solid #2b3845' }}>
          <div style={{ fontSize: '0.7rem', color: '#7a8893', marginBottom: '0.3rem' }}>
            {t('選武將', 'Pick officer')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {eligibleOfficers.length === 0 && (
              <span style={{ color: '#7a8893', fontStyle: 'italic', fontSize: '0.78rem' }}>
                {t('無閒置武將', 'No idle officers')}
              </span>
            )}
            {eligibleOfficers.map((o) => (
              <button
                key={o.id}
                onClick={() => { setPickedOfficer(o); setFeedback(null); }}
                style={{
                  background: pickedOfficer?.id === o.id ? '#26323e' : 'transparent',
                  border: '1px solid ' + (pickedOfficer?.id === o.id ? '#e6c473' : '#2b3845'),
                  color: pickedOfficer?.id === o.id ? '#e6c473' : '#aab6c0',
                  padding: '0.25rem 0.6rem',
                  fontFamily: 'inherit', fontSize: '0.8rem',
                  letterSpacing: '0.1rem', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? o.name.en : o.name.zh}
                <span style={{ marginLeft: 4, fontSize: '0.72rem', color: '#7a8893' }}>
                  ({(o.policies ?? []).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {pickedOfficer && (
          <>
            <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.78rem', color: '#aab6c0' }}>
              {t('費用', 'Cost')}: <strong style={{ color: city.gold >= cost ? '#e6c473' : '#b8442e' }}>{cost} {t('金', 'gold')}</strong>
              {' · '}{t('書院', 'Academy')}: lv{academyLevel(city, buildings)}
              {(() => {
                const lvl = academyLevel(city, buildings);
                if (lvl >= 3) return <> · <span style={{ color: '#7ed68a' }}>{t('即時', 'instant')}</span></>;
                const cap = academyCapacity(lvl);
                const inUse = trainingsInCity(cityId, pendingTrainings);
                const full = inUse >= cap;
                return <> · {t('容量', 'Slots')}: <span style={{ color: full ? '#b8442e' : '#aab6c0' }}>{inUse}/{cap}</span></>;
              })()}
              {' · '}{t('知力', 'Int')}: {pickedOfficer.stats.intelligence}{pickedOfficer.stats.intelligence >= 80 && <span style={{ color: '#7ed68a' }}> ({t('俊才 −1 季', 'genius −1')})</span>}
              {' · '}{t('政策', 'Policies')}: {(pickedOfficer.policies ?? []).length}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 1.25rem 0', borderBottom: '1px solid #2b3845' }}>
              {(['policy', 'tactic'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setFeedback(null); }}
                  style={{
                    background: mode === m ? '#26323e' : 'transparent',
                    border: '1px solid ' + (mode === m ? '#e6c473' : '#2b3845'),
                    borderBottom: mode === m ? '1px solid #1b2531' : '1px solid #2b3845',
                    color: mode === m ? '#e6c473' : '#7a8893',
                    padding: '0.3rem 0.8rem',
                    fontFamily: 'inherit', fontSize: '0.78rem',
                    letterSpacing: '0.1rem', cursor: 'pointer',
                    marginBottom: '-1px',
                  }}
                >
                  {m === 'policy' ? t('政策', 'Policies') : t('戰法', 'Tactics')}
                </button>
              ))}
            </div>

            <div style={{ overflow: 'auto', maxHeight: '50vh', padding: '0.5rem 1.25rem' }}>
              {mode === 'tactic' && pickedOfficer && (() => {
                const { available: tAvail, locked: tLocked } = eligibleTactics(pickedOfficer);
                const tCost = tacticTrainingCost(pickedOfficer);
                const handleAcadTactic = (tid: TacticId) => {
                  const dur = tacticDurationSeasons(pickedOfficer, city, tid, buildings);
                  const r = startTacticTraining(pickedOfficer.id, cityId, tid);
                  if (r.ok) {
                    setFeedback(dur === 0
                      ? t('書院 lv3,當場習得!', 'Imperial Academy — learned instantly!')
                      : t(`戰法培訓開始,${dur} 季後完成。`, `Tactic training begun — ${dur} season${dur > 1 ? 's' : ''}.`));
                    setTimeout(onClose, 1000);
                  } else setFeedback(r.reason ?? t('無法開始培訓。', 'Cannot start training.'));
                };
                const handleMentTactic = (tid: TacticId, mid: EntityId) => {
                  const m = officers[mid];
                  const dur = tacticMentorDurationSeasons(pickedOfficer, city, tid, m, family);
                  const r = startTacticTraining(pickedOfficer.id, cityId, tid, mid);
                  if (r.ok) {
                    setFeedback(t(`${m?.name.zh ?? '師者'}傳授戰法,${dur} 季後完成。`, `${m?.name.en ?? 'Mentor'} began teaching — ${dur} season${dur > 1 ? 's' : ''}.`));
                    setTimeout(onClose, 1000);
                  } else setFeedback(r.reason ?? t('無法開始培訓。', 'Cannot start training.'));
                };
                return (
                  <>
                    <div style={{ fontSize: '0.72rem', color: '#aab6c0', marginBottom: '0.3rem' }}>
                      {t('戰法費用', 'Tactic cost')}: <strong style={{ color: city.gold >= tCost ? '#e6c473' : '#b8442e' }}>{tCost} {t('金', 'gold')}</strong>
                      {' · '}{t('已通', 'Known')}: {(pickedOfficer.tactics ?? []).length}
                    </div>
                    {tAvail.length === 0 && (
                      <div style={{ color: '#7a8893', fontStyle: 'italic', fontSize: '0.78rem' }}>
                        {t('無可學戰法 — 需先學前置。', 'No tactics available — need to study prerequisites.')}
                      </div>
                    )}
                    {tAvail.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.7rem', color: '#7ed68a', letterSpacing: '0.05rem', margin: '0.3rem 0' }}>
                          {t('可學戰法', 'Available')} ({tAvail.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {tAvail.slice(0, 60).map((tid) => {
                            const td = TACTIC_DEFS[tid];
                            const tier = tacticTier(tid);
                            const tierLabel = tier === 1 ? t('基', 'B') : tier === 2 ? t('進', 'A') : t('簽名', 'Sig');
                            const tierColor = tier === 1 ? '#7a9a5a' : tier === 2 ? '#e6c473' : '#b8442e';
                            const acadDur = tacticDurationSeasons(pickedOfficer, city, tid, buildings);
                            const mentors = eligibleTacticMentors(pickedOfficer, tid, officers, city, pendingTrainings, family);
                            return (
                              <div key={tid} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', borderBottom: '1px dotted #26323e', padding: '0.15rem 0' }}>
                                <span style={{
                                  minWidth: 110, padding: '0.15rem 0.4rem',
                                  border: `1px solid ${tierColor}`, color: tierColor, fontSize: '0.78rem',
                                }}>
                                  {lang === 'en' ? td?.en : td?.zh}
                                  <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>· {tierLabel}</span>
                                </span>
                                {hasAcademy && (
                                  <button
                                    onClick={() => handleAcadTactic(tid)}
                                    disabled={city.gold < tCost}
                                    style={{
                                      background: '#10161e', border: '1px solid #88b7e8', color: '#88b7e8',
                                      padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.72rem',
                                      cursor: city.gold >= tCost ? 'pointer' : 'not-allowed',
                                      opacity: city.gold >= tCost ? 1 : 0.5,
                                    }}
                                  >
                                    📚 {acadDur === 0 ? t('即時', 'now') : `${acadDur}${t('季', 's')}`} · {tCost}g
                                  </button>
                                )}
                                {mentors.slice(0, 2).map((m) => {
                                  const isParent = isParentMentor(m, pickedOfficer, family);
                                  const dur = tacticMentorDurationSeasons(pickedOfficer, city, tid, m, family);
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => handleMentTactic(tid, m.id)}
                                      style={{
                                        background: '#10161e',
                                        border: `1px solid ${isParent ? '#e6c473' : '#7ed68a'}`,
                                        color: isParent ? '#e6c473' : '#7ed68a',
                                        padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.72rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {isParent ? '👪' : '🤝'} {lang === 'en' ? m.name.en : m.name.zh} {dur}{t('季', 's')}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                          {tAvail.length > 60 && (
                            <div style={{ color: '#7a8893', fontSize: '0.7rem' }}>
                              +{tAvail.length - 60} {t('項可學戰法', 'more')}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {tLocked.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#7a8893', margin: '0.6rem 0 0.3rem' }}>
                        🔒 {t('需先學前置', 'Locked')} ({tLocked.length})
                      </div>
                    )}
                  </>
                );
              })()}
              {mode === 'policy' && available.length === 0 && (
                <div style={{ color: '#7a8893', fontStyle: 'italic', fontSize: '0.78rem', padding: '0.5rem 0' }}>
                  {t('此武將已掌握所有基礎政策,先學進階前置才能繼續。', 'Officer already knows all base policies — needs upstream learnings to unlock more.')}
                </div>
              )}
              {mode === 'policy' && available.length > 0 && (
                <>
                  <div style={{ fontSize: '0.7rem', color: '#7ed68a', letterSpacing: '0.05rem', margin: '0.3rem 0' }}>
                    {t('可學', 'Available')} ({available.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {available.map((pid) => {
                      const p = POLICY_DEFS[pid];
                      const tier = policyTier(pid);
                      const acadDur = trainingDurationSeasons(pickedOfficer, city, pid, buildings);
                      const tierLabel = tier === 1
                        ? t('基礎', 'Base') : tier === 2 ? t('進階', 'Adv') : t('高階', 'High');
                      const tierColor = tier === 1 ? '#7a9a5a' : tier === 2 ? '#e6c473' : '#b8442e';
                      const mentors = eligibleMentors(pickedOfficer, pid, officers, city, pendingTrainings, family);
                      const wished = officerWishes.some(
                        (w) => w.officerId === pickedOfficer.id && w.kind === 'learn-policy' && w.targetId === pid,
                      );
                      const discountedCost = wished ? Math.floor(cost / 2) : cost;
                      return (
                        <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.2rem 0', borderBottom: '1px dotted #26323e' }}>
                          <span style={{
                            minWidth: 100, padding: '0.15rem 0.4rem',
                            border: `1px solid ${tierColor}`, color: tierColor,
                            fontSize: '0.8rem',
                          }}>
                            {wished && <span title={t('武將夙願 — 半價學費,完成後忠誠 +14', 'Officer wish — half tuition, +14 loyalty on completion')} style={{ color: '#e6c473', marginRight: 4 }}>★</span>}
                            {lang === 'en' ? p?.en : p?.zh}
                            <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>· {tierLabel}</span>
                          </span>
                          {hasAcademy && (
                            <button
                              onClick={() => handleAcademyPick(pid)}
                              disabled={city.gold < discountedCost}
                              title={t(
                                `書院培訓 — ${discountedCost} 金${wished ? ' (夙願半價)' : ''} · ${acadDur === 0 ? '即時' : `${acadDur} 季後完成`}`,
                                `Academy training — ${discountedCost} gold${wished ? ' (wish discount)' : ''} · ${acadDur === 0 ? 'instant' : `${acadDur} season${acadDur > 1 ? 's' : ''}`}`,
                              )}
                              style={{
                                background: '#10161e', border: '1px solid #88b7e8', color: '#88b7e8',
                                padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.72rem',
                                cursor: city.gold >= discountedCost ? 'pointer' : 'not-allowed',
                                opacity: city.gold >= discountedCost ? 1 : 0.5,
                              }}
                            >
                              📚 {t('書院', 'Acad')} {acadDur === 0 ? t('即時', 'now') : `${acadDur}${t('季', 's')}`} · {discountedCost}g
                            </button>
                          )}
                          {mentors.slice(0, 3).map((m) => {
                            const isParent = isParentMentor(m, pickedOfficer, family);
                            const dur = mentorDurationSeasons(pickedOfficer, city, pid, m, family);
                            const color = isParent ? '#e6c473' : '#7ed68a';
                            return (
                              <button
                                key={m.id}
                                onClick={() => handleMentorPick(pid, m.id)}
                                title={t(
                                  isParent
                                    ? `由親屬 ${m.name.zh} 傳授 — 免費 · ${dur} 季後完成 (親情 −1 季,完成有機率讓家長獲「博學」)`
                                    : `由 ${m.name.zh} 傳授 — 免費 · ${dur} 季後完成`,
                                  isParent
                                    ? `Taught by parent ${m.name.en} — free · ${dur} season${dur > 1 ? 's' : ''} (family bond −1; parent may gain Erudite trait)`
                                    : `Taught by ${m.name.en} — free · ${dur} season${dur > 1 ? 's' : ''}`,
                                )}
                                style={{
                                  background: '#10161e',
                                  border: `1px solid ${color}`,
                                  color,
                                  padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.72rem',
                                  cursor: 'pointer',
                                }}
                              >
                                {isParent ? '👪' : '🤝'} {lang === 'en' ? m.name.en : m.name.zh} {dur}{t('季', 's')}
                              </button>
                            );
                          })}
                          {mentors.length > 3 && (
                            <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>+{mentors.length - 3}</span>
                          )}
                          {!hasAcademy && mentors.length === 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>
                              {t('無師可請', 'No mentor available')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {mode === 'policy' && locked.length > 0 && (
                <>
                  <div style={{ fontSize: '0.7rem', color: '#7a8893', letterSpacing: '0.05rem', margin: '0.6rem 0 0.3rem' }}>
                    🔒 {t('需先學前置', 'Locked — need prerequisite')} ({locked.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {locked.slice(0, 30).map(({ id, missing }) => {
                      const p = POLICY_DEFS[id];
                      const missLabel = missing.map((m) => POLICY_DEFS[m]?.zh ?? m).join('、');
                      const futureDur = trainingDurationSeasons(pickedOfficer, city, id, buildings);
                      const tier = policyTier(id);
                      const tierZh = tier === 1 ? '基礎' : tier === 2 ? '進階' : '高階';
                      const tierEn = tier === 1 ? 'Base' : tier === 2 ? 'Adv' : 'High';
                      return (
                        <span
                          key={id}
                          title={t(
                            `${tierZh}政策 · 解鎖後書院培訓需 ${futureDur === 0 ? '即時' : `${futureDur} 季`}\n需先學:${missLabel}`,
                            `${tierEn} policy — once unlocked: ${futureDur === 0 ? 'instant' : `${futureDur} season${futureDur > 1 ? 's' : ''}`}\nNeeds: ${missing.map((m) => POLICY_DEFS[m]?.en ?? m).join(', ')}`,
                          )}
                          style={{
                            background: 'rgba(90, 70, 60, 0.4)',
                            border: '1px dashed rgba(138, 112, 80, 0.6)',
                            color: '#7a8893',
                            padding: '0.3rem 0.55rem', fontSize: '0.78rem',
                            letterSpacing: '0.1rem',
                          }}
                        >
                          🔒 {lang === 'en' ? p?.en : p?.zh}
                          <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>
                            · {futureDur === 0 ? t('即時', 'now') : `${futureDur}${t('季', 's')}`}
                          </span>
                        </span>
                      );
                    })}
                    {locked.length > 30 && (
                      <span style={{ color: '#7a8893', fontSize: '0.7rem', alignSelf: 'center' }}>
                        +{locked.length - 30} {t('項', 'more')}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {feedback && (
          <div style={{ padding: '0.5rem 1.25rem', color: '#e6c473', fontSize: '0.85rem', textAlign: 'center' }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
