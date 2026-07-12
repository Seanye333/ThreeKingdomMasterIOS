import { useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { Icon } from './Icon';
import { useLanguage, pickName } from '../i18n';

const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

/**
 * In-transit forces overview — lists the player's marching armies (the
 * persistent Army layer) with commander, troops, destination and ETA.
 * A read-only window onto the unit-on-the-map model.
 */
export function ArmiesPanel() {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const armies = useGameStore((s) => s.armies);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const cancelCommand = useGameStore((s) => s.cancelCommand);
  const recallMarch = useGameStore((s) => s.recallMarch);
  const holdArmy = useGameStore((s) => s.holdArmy);
  const setArmyAmbush = useGameStore((s) => s.setArmyAmbush);
  const setArmyEvade = useGameStore((s) => s.setArmyEvade);
  const delayMarch = useGameStore((s) => s.delayMarch);
  const burnBridge = useGameStore((s) => s.burnBridge);
  const besiegeCity = useGameStore((s) => s.besiegeCity);
  const burnBoom = useGameStore((s) => s.burnBoom);
  const notify = useGameStore((s) => s.notify);
  const resupplyArmy = useGameStore((s) => s.resupplyArmy);
  const splitArmy = useGameStore((s) => s.splitArmy);
  const lang = useLanguage();

  // 手機收納 — folded to a chip by default; the list is a tap away.
  const [open, setOpen] = useState(!IS_MOBILE);

  const mine = Object.values(armies).filter((a) => a.forceId === playerForceId);
  if (mine.length === 0) return null;

  if (IS_MOBILE && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(20, 14, 9, 0.88)', border: '1px solid #6a5536',
          color: '#e6edf3', padding: '0.3rem 0.55rem', cursor: 'pointer',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.72rem',
          pointerEvents: 'auto',
        }}
      ><Icon name="war" size={12} /> {lang === 'en' ? 'In transit' : '在途'} {mine.length}</button>
    );
  }

  return (
    <div style={{
      background: 'rgba(20, 14, 9, 0.86)',
      border: '1px solid #6a5536',
      padding: '0.35rem 0.5rem',
      fontFamily: 'var(--tkm-font-body)',
      fontSize: '0.72rem',
      color: '#e6edf3',
      minWidth: 150,
      maxWidth: 210,
      boxShadow: '0 0 10px rgba(0,0,0,0.6)',
      pointerEvents: 'auto',
    }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.05rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
        <span>{lang === 'en' ? 'Armies in transit' : '在途部隊'}</span>
        {IS_MOBILE && (
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#7a8893', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
          >✕</button>
        )}
      </div>
      {selectedArmyId && armies[selectedArmyId]?.routed && (
        <div style={{ marginBottom: 3, fontSize: '0.62rem', color: '#e0707a' }}>
          {lang === 'en'
            ? '⚠ ROUTING — this column answers to no orders; it flees for shelter and can be ridden down.'
            : '⚠ 潰走中 — 此軍不受號令,唯亡命奔還;途中可被敵軍掩殺。'}
        </div>
      )}
      {selectedArmyId && armies[selectedArmyId] && !armies[selectedArmyId].routed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: '0.58rem', color: '#e6c473' }}>{lang === 'en' ? 'Tap city to reroute · field to garrison · ally to merge · enemy to attack · rout to pursue' : '點城改道 · 點野地進駐 · 點友軍合流 · 點近敵親征 · 點敵潰軍追擊'}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => holdArmy(selectedArmyId)}
              style={{
                background: armies[selectedArmyId].holding ? '#2a3a1a' : '#1a2410',
                border: `1px solid ${armies[selectedArmyId].holding ? '#a8c87a' : '#5a7a3a'}`,
                color: armies[selectedArmyId].holding ? '#c8e8a0' : '#a8c87a',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
            >{armies[selectedArmyId].holding ? (lang === 'en' ? 'Release' : '解除') : (lang === 'en' ? 'Hold' : '駐守')}</button>
            {!armies[selectedArmyId].holding && (
              <button
                onClick={() => {
                  const r = setArmyEvade(selectedArmyId);
                  if (!r.ok && r.reason) notify(r.reason, r.reason);
                }}
                style={{
                  background: armies[selectedArmyId].evading ? '#122a30' : '#0e1e24',
                  border: `1px solid ${armies[selectedArmyId].evading ? '#7ac0d8' : '#4a7a90'}`,
                  color: armies[selectedArmyId].evading ? '#b0e0f0' : '#80b0c8',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en'
                  ? 'Evade: take back roads — roll to SLIP hostile contacts and garrison sallies (wits vs wits; cautious pace helps). Claims no territory; caught = fights strung out.'
                  : '避戰迂迴 — 取間道而行:遇敵縱隊/守軍出擊時以智鬥智擲脫離(緩進加成、急行減成);行軍不奪土;被抓住則倉皇接戰(×0.85)。'}
              >{armies[selectedArmyId].evading ? (lang === 'en' ? 'Evading' : '避戰中') : (lang === 'en' ? 'Evade' : '避戰')}</button>
            )}
            {armies[selectedArmyId].holding && (
              <button
                onClick={() => {
                  const r = setArmyAmbush(selectedArmyId);
                  if (!r.ok && r.reason) notify(r.reason, r.reason);
                }}
                style={{
                  background: armies[selectedArmyId].ambush ? '#2a1a30' : '#1c1424',
                  border: `1px solid ${armies[selectedArmyId].ambush ? '#c08ae0' : '#7a5a9a'}`,
                  color: armies[selectedArmyId].ambush ? '#e0c0f0' : '#b090d0',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en'
                  ? 'Go to ground: hidden from enemy view, springs harder on contact. Needs cover (forest/hills/pass).'
                  : '設伏 — 匿於林丘,敵圖上不見此軍;敵縱隊撞入,伏擊加成更烈、識破減半。需有掩蔽之地。'}
              >{armies[selectedArmyId].ambush ? (lang === 'en' ? 'Ambushing' : '伏中') : (lang === 'en' ? 'Ambush' : '設伏')}</button>
            )}
            {armies[selectedArmyId].holding && (
              <button
                onClick={() => {
                  const r = besiegeCity(selectedArmyId);
                  if (!r.ok && r.reason) notify(r.reason, r.reason, 'warn');
                }}
                style={{
                  background: armies[selectedArmyId].besieging ? '#3a2008' : '#241708',
                  border: `1px solid ${armies[selectedArmyId].besieging ? '#e8a040' : '#a07030'}`,
                  color: armies[selectedArmyId].besieging ? '#ffd090' : '#d0a060',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en'
                  ? 'Invest the nearest enemy city: its food and loyalty bleed every turn; dry granaries open the gates without a fight. The garrison may sortie — and relief columns walk into your prepared lines (圍點打援, automatic).'
                  : '長圍 — 兵圍左近敵城:斷其市易耕稼,每旬糧秣民忠俱蹙;糧盡則開城出降。守軍勢眾時或傾城突圍;敵援軍來撲則自動以逸待勞(圍點打援,伏擊級加成)。'}
              >{armies[selectedArmyId].besieging ? (lang === 'en' ? 'Lifting?' : '圍中') : (lang === 'en' ? 'Besiege' : '圍城')}</button>
            )}
            {armies[selectedArmyId].naval && (
              <button
                onClick={() => {
                  const r = burnBoom(selectedArmyId);
                  if (!r.ok && r.reason) notify(r.reason, r.reason, 'warn');
                }}
                style={{
                  background: '#14202e', border: '1px solid #6a8ab8', color: '#a8c8e8',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en'
                  ? 'Torch-rafts: burn a hostile river boom beside this fleet (−300g from capital) — the waterway reopens.'
                  : '火炬燒鎖(王濬故智)— 以火筏熔斷近旁敵之攔江鎖(都城 −300金),航路重開。'}
              >{lang === 'en' ? 'Burn boom' : '燒鎖'}</button>
            )}
            <button
              onClick={() => {
                const r = burnBridge(selectedArmyId);
                if (!r.ok && r.reason) notify(r.reason, r.reason, 'warn');
              }}
              style={{
                background: '#2a1410', border: '1px solid #c46a3a', color: '#e8a87a',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
              title={lang === 'en'
                ? 'Burn the crossing beside this column — battles here open with the span down (~1 year). Needs a riverside position.'
                : '焚橋斷渡 — 焚毀本軍近旁渡口:此地開戰時橋樑已斷(約一年方復)。須臨河。'}
            >{lang === 'en' ? 'Burn bridge' : '焚橋'}</button>
            {!armies[selectedArmyId].holding && (
              <button
                onClick={() => {
                  const r = delayMarch(selectedArmyId);
                  if (!r.ok && r.reason) notify(r.reason, r.reason);
                }}
                style={{
                  background: '#20180e', border: '1px solid #8a7048', color: '#c8b088',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en'
                  ? 'Wait: mark time in place one season before advancing (sync a two-pronged attack; stacks to 3)'
                  : '候期 — 原地待命一旬再進(兩路合擊對錶用;至多疊三旬)'}
              >⏳ {lang === 'en' ? 'Wait' : '候期'}{(armies[selectedArmyId].waitSeasons ?? 0) > 0 ? ` ${armies[selectedArmyId].waitSeasons}` : ''}</button>
            )}
            <button
              onClick={() => resupplyArmy(selectedArmyId)}
              style={{
                background: '#2a2410', border: '1px solid #b89a4a', color: '#e8d09a',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
              title={lang === 'en' ? 'Resupply this army from the nearest friendly city (so it won’t starve and scatter)' : '從最近的友城輸糧補給此軍(免其糧盡逃散)'}
            >{lang === 'en' ? 'Supply' : '補給'}</button>
            {(armies[selectedArmyId].companionIds?.length ?? 0) > 0 && (
              <button
                onClick={() => splitArmy(selectedArmyId)}
                style={{
                  background: '#1a2030', border: '1px solid #5a78a0', color: '#a8c0e8',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en' ? 'Split off half the troops with one lieutenant to hold this tile' : '分出一半兵力與一名副將,駐守當前格'}
              >{lang === 'en' ? 'Split' : '分兵'}</button>
            )}
            <button
              onClick={() => {
                // 召回 — turn a column still on the road home (keeps most troops,
                // streams back over the distance covered). If it's already
                // arriving / can't turn, fall back to disbanding it outright.
                const r = recallMarch(selectedArmyId);
                if (!r.ok) { cancelCommand(selectedArmyId); selectArmy(null); }
              }}
              style={{
                background: '#3a1410', border: '1px solid #b8442e', color: '#e8a890',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
              title={lang === 'en' ? 'Recall — turn the column home (keeps most troops; deeper marches shed more stragglers)' : '召回 — 折返本城(保留大部兵力;行得越深散卒越多)'}
            >{lang === 'en' ? 'Recall' : '召回'}</button>
          </div>
        </div>
      )}
      {mine.map((a) => {
        const cmdr = officers[a.commanderId];
        const target = cities[a.targetCityId];
        const remaining = Math.max(1, Math.round((1 - a.progress) * a.totalSeasons));
        const troopLabel = a.troops >= 1000 ? `${(a.troops / 1000).toFixed(1)}k` : `${a.troops}`;
        const selected = a.id === selectedArmyId;
        const pct = Math.max(0, Math.min(100, Math.round(a.progress * 100)));
        const dest = a.cellTarget ? (lang === 'en' ? 'field' : '野地') : (target ? pickName(target.name, lang) : '?');
        // States: routed · returning home · hold (parked) · marching · arriving.
        const status = a.routed
          ? { icon: '⚠', text: lang === 'en' ? `ROUT · ${remaining}s` : `潰走·${remaining}季`, color: '#e0707a', tip: lang === 'en' ? 'Beaten in the field — fleeing for shelter, shedding stragglers; enemies can ride it down' : '野戰敗北,亡命奔還;沿途散卒,敵可掩殺' }
          : a.returning
          ? { icon: '↩', text: lang === 'en' ? `home · ${remaining}s` : `歸返·${remaining}季`, color: '#c79a6a', tip: lang === 'en' ? 'Recalled — streaming home; merges into its source city on arrival' : '已召回,折返本城,抵達即併入守軍' }
          : a.besieging
          ? { icon: '⭕', text: lang === 'en' ? 'Siege · anvil' : '圍城·打援', color: '#e8a040', tip: lang === 'en' ? 'Investing the city — and meeting any relief column from prepared lines (ambush-grade spring, automatic)' : '長圍斷糧;敵援軍來撲時自動以逸待勞(伏擊級加成,無須設伏)' }
          : a.pursueTargetId
          ? { icon: '⚔', text: lang === 'en' ? 'Pursuing' : '追擊中', color: '#e0907a', tip: lang === 'en' ? 'Hounding an enemy rout — re-aims every season, cuts it down on contact' : '咬住敵潰軍 — 每旬自動追瞄,追上即掩殺' }
          : (a.waitSeasons ?? 0) > 0
          ? { icon: '⏳', text: lang === 'en' ? `wait ${a.waitSeasons}` : `候期·${a.waitSeasons}旬`, color: '#c8b088', tip: lang === 'en' ? 'Marking time in place before advancing (pincer sync)' : '原地待命,期滿再進(兩路合擊對錶)' }
          : a.holding
          ? { icon: '⏸', text: lang === 'en' ? 'Hold' : '駐守', color: '#a8c87a', tip: lang === 'en' ? 'Holding position; won’t advance this season (Release to resume)' : '原地駐守,本季不前進(可「解除」續行)' }
          : remaining <= 1
            ? { icon: a.evading ? '🌫' : '⚑', text: lang === 'en' ? `${dest} · arriving` : `${dest}·抵達在即`, color: '#f2dd9a', tip: lang === 'en' ? 'Arrives next season' : '下季抵達目的地' }
            : a.evading
            ? { icon: '🌫', text: lang === 'en' ? `${dest} · evade · ${remaining}s` : `${dest}·避戰·${remaining}季`, color: '#8ac0d8', tip: lang === 'en' ? 'Evading — slips contacts by back roads; claims no territory' : '避戰迂迴 — 遇敵擲脫離;行軍不奪土' }
            : { icon: '▸', text: lang === 'en' ? `${dest} · ${remaining}s` : `${dest}·${remaining}季`, color: '#aab6c0', tip: lang === 'en' ? `Marching · ${pct}% done` : `行軍中 · 已行 ${pct}%` };
        return (
          <div
            key={a.id}
            onClick={() => selectArmy(selected ? null : a.id)}
            title={status.tip}
            style={{
              lineHeight: 1.4, cursor: 'pointer', padding: '1px 2px',
              background: selected ? 'rgba(212, 168, 74, 0.22)' : 'transparent',
              outline: selected ? '1px solid #e6c473' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#ffe9a8', whiteSpace: 'nowrap' }}>
                {cmdr?.name.zh ?? '？'}
                <span style={{ color: '#7a8893', marginLeft: 4, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>{troopLabel}</span>
                {a.food !== undefined && (() => {
                  const seasons = Math.floor(a.food / Math.max(1, a.troops * 0.25));
                  return (
                    <span style={{ marginLeft: 4, fontSize: '0.58rem', color: seasons <= 1 ? '#e0707a' : seasons <= 3 ? '#e0a070' : '#8a9a6a', display: 'inline-flex', alignItems: 'center', gap: 2 }} title={lang === 'en' ? `Provisions ${a.food.toLocaleString()} — ${seasons} season(s)` : `隨軍糧 ${a.food.toLocaleString()} — 足 ${seasons} 季`}>
                      <Icon name="grain" size={10} />{seasons}
                    </span>
                  );
                })()}
                {(a.fatigue ?? 0) >= 24 && (
                  <span
                    style={{ marginLeft: 4, fontSize: '0.58rem', color: (a.fatigue ?? 0) >= 64 ? '#e0707a' : '#e0a070' }}
                    title={lang === 'en'
                      ? `Campaign fatigue ${a.fatigue} — saps field power & opening morale; camp (not besieging) to rest`
                      : `師老兵疲 ${a.fatigue} — 野戰戰力與開戰士氣俱減;紮營(非圍城)可休整`}
                  >疲{a.fatigue}</span>
                )}
                {a.morale != null && Math.abs(a.morale - 60) >= 8 && (
                  <span
                    style={{ marginLeft: 4, fontSize: '0.58rem', color: a.morale > 60 ? '#8ac88a' : '#e0707a' }}
                    title={lang === 'en'
                      ? `Army morale ${a.morale} (60 = steady) — victories lift it, the realm's lost cities shake it`
                      : `軍心 ${a.morale}(60 為常)— 野戰勝則振,國失城則搖`}
                  >氣{a.morale}</span>
                )}
              </span>
              <span style={{ color: status.color, whiteSpace: 'nowrap' }}>
                {status.icon} {status.text}
              </span>
            </div>
            {/* advancement bar — only for armies actually on the move */}
            {!a.holding && a.totalSeasons > 1 && (
              <div style={{ height: 3, background: '#2a2010', borderRadius: 'var(--tkm-radius-xs)', marginTop: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: status.color, transition: 'width 0.3s' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
