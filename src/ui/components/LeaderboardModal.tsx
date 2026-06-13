import { useEffect, useState } from 'react';
import { fetchLeaderboard, savedPlayerName, submitScore, type LeaderRow } from '../../game/systems/leaderboard';
import { loadDailyResults } from '../../game/systems/dailyChallenge';
import { useT } from '../i18n';

/**
 * 每日排行榜 — today's global board (when the backend KV is attached)
 * plus a one-tap submit of your recorded best. Quietly explains itself
 * when the leaderboard isn't configured yet — the game never depends
 * on it.
 */
export function LeaderboardModal({ date, onClose }: { date: string; onClose: () => void }) {
  const t = useT();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [name, setName] = useState(savedPlayerName());
  const [myRank, setMyRank] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const myResult = loadDailyResults()[date];
  const canSubmit = !!myResult?.victory;

  const load = () => {
    fetchLeaderboard(date).then((r) => {
      if (!r) { setConfigured(false); setRows([]); return; }
      setConfigured(r.kvConfigured);
      setRows(r.rows);
    });
  };
  useEffect(load, [date]);

  const submit = () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    submitScore(date, name, myResult!.seasons).then((r) => {
      setBusy(false);
      if (!r) { setConfigured(false); return; }
      setConfigured(r.kvConfigured);
      setRows(r.rows);
      setMyRank(r.rank ?? null);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 950, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)', border: '1px solid #d4a84a',
          width: 'min(420px,100%)', maxHeight: '82vh', display: 'flex', flexDirection: 'column',
          color: '#e8d9b0', fontFamily: '"Songti SC","Noto Serif SC",serif', padding: '1rem 1.2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '1.15rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>🏆 {t('每日排行', 'Daily Leaderboard')}</div>
            <div style={{ fontSize: '0.7rem', color: '#8a7050' }}>{date} · {t('旬數越少越前', 'fewer ticks ranks higher')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
        </div>

        {configured === false && (
          <div style={{ fontSize: '0.78rem', color: '#8a7050', padding: '0.8rem 0', lineHeight: 1.6 }}>
            {t('排行榜尚未開通(需在 Vercel 掛上 KV 儲存)。你的最佳成績已存在本地。',
               'Leaderboard not enabled yet (attach Vercel KV). Your best run is saved locally.')}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 80 }}>
          {rows == null ? (
            <div style={{ color: '#8a7050', fontSize: '0.8rem', padding: '0.8rem 0' }}>{t('載入中…', 'Loading…')}</div>
          ) : rows.length === 0 && configured ? (
            <div style={{ color: '#8a7050', fontSize: '0.8rem', padding: '0.8rem 0' }}>{t('今日尚無人上榜 — 拔得頭籌吧!', 'No entries yet — be the first!')}</div>
          ) : rows.map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.4rem',
              fontSize: '0.82rem', borderBottom: '1px solid #2a2014',
              background: myRank === i + 1 ? 'rgba(212,168,74,0.15)' : 'transparent',
            }}>
              <span style={{ color: i < 3 ? '#f0d98a' : '#c0a878' }}>{i + 1}. {r.name}</span>
              <span style={{ color: '#9ed68a' }}>{r.seasons} {t('旬', 'ticks')}</span>
            </div>
          ))}
        </div>

        {canSubmit && configured !== false && (
          <div style={{ display: 'flex', gap: 6, marginTop: '0.7rem' }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('你的名號', 'Your name')}
              maxLength={16}
              style={{ flex: 1, background: '#0a0805', border: '1px solid #4a3520', color: '#e8d9b0', padding: '0.35rem 0.5rem', fontFamily: 'inherit' }}
            />
            <button
              onClick={submit}
              disabled={busy}
              style={{ background: 'linear-gradient(180deg,#3a2d18,#2a1f10)', border: '1px solid #d4a84a', color: '#f0d98a', padding: '0.35rem 0.9rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.15rem' }}
            >{t(`上榜(${myResult!.seasons}旬)`, `Submit (${myResult!.seasons})`)}</button>
          </div>
        )}
        {!canSubmit && (
          <div style={{ fontSize: '0.7rem', color: '#6a5a45', marginTop: '0.5rem' }}>
            {t('先在今日挑戰中取勝,方可上榜。', 'Win today\'s challenge to submit a score.')}
          </div>
        )}
      </div>
    </div>
  );
}
