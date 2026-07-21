import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { usePanelNotice } from './usePanelNotice';
import { useT, useLanguage, pickName } from '../i18n';
import { LAW_NAMES, LAW_SEVERITIES, lawEffects, caseloadTier, type LawSeverity } from '../../game/systems/law';
import {
  CORVEE_LEVELS, CORVEE_NAMES, corveeEffects, hiddenTier, registryYieldMul, type CorveeLevel,
} from '../../game/systems/household';
import { hoardTier, hoardEffects } from '../../game/systems/hoarding';
import {
  GRAIN_POLICIES, GRAIN_POLICY_NAMES, grainPolicyEffects, grainPrice, priceTier,
  PRICE_GAP_TRIGGER, type GrainPolicy,
} from '../../game/systems/grainTrade';
import { buildingBonuses } from '../../game/systems/buildings';
import {
  SELECTION_NAMES, SELECTION_SYSTEMS, selectionEffects, rectifierOf, rectifierIsUpright,
  type SelectionSystem,
} from '../../game/systems/officialSelection';
import {
  GRAND_PROJECTS, PROJECTS_BY_ID, projectEta, projectSeasonProgress, type GrandProjectId,
} from '../../game/systems/grandProjects';

/**
 * 國政 — the realm's institutions in one place: the legal code, the corvée, the
 * way officials are chosen, the great work under way, and a per-city ledger of
 * the four civic meters (§1.11–§1.15, §3.6).
 *
 * These levers used to be scattered across the treasury and the court panel
 * because each was added beside whatever it touched. They belong together: they
 * are the same decision seen from four sides — how hard you press the people.
 */
export function StatecraftModal({ onClose, onSelectCity }: { onClose: () => void; onSelectCity?: (cityId: string) => void }) {
  const t = useT();
  const lang = useLanguage();
  const { notify, noticeUI } = usePanelNotice();

  const playerForceId = useGameStore((s) => s.playerForceId);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const buildings = useGameStore((s) => s.buildings);

  const law: LawSeverity = useGameStore((s) => (playerForceId ? s.lawCode?.[playerForceId] : undefined) ?? 'standard');
  const setLawCode = useGameStore((s) => s.setLawCode);
  const corvee: CorveeLevel = useGameStore((s) => (playerForceId ? s.corvee?.[playerForceId] : undefined) ?? 'none');
  const setCorvee = useGameStore((s) => s.setCorvee);
  const grainPolicy: GrainPolicy = useGameStore((s) => (playerForceId ? s.grainPolicy?.[playerForceId] : undefined) ?? 'guided');
  const setGrainPolicy = useGameStore((s) => s.setGrainPolicy);
  const season = useGameStore((s) => s.date.season);
  const forces = useGameStore((s) => s.forces);
  const selection: SelectionSystem = useGameStore((s) => (playerForceId ? s.selectionSystem?.[playerForceId] : undefined) ?? 'chaju');
  const setSelectionSystem = useGameStore((s) => s.setSelectionSystem);
  const proclaimAmnesty = useGameStore((s) => s.proclaimAmnesty);
  const grandProjects = useGameStore((s) => s.grandProjects ?? []);
  const startGrandProject = useGameStore((s) => s.startGrandProject);
  const abandonGrandProject = useGameStore((s) => s.abandonGrandProject);
  const shrines = useGameStore((s) => s.shrines ?? []);
  const poems = useGameStore((s) => s.poems ?? []);

  const [projectPick, setProjectPick] = useState('');
  const [projectCity, setProjectCity] = useState('');

  const own = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId),
    [cities, playerForceId],
  );
  const rectifier = useMemo(
    () => rectifierOf(Object.values(officers).filter(
      (o) => o.forceId === playerForceId && (o.status === 'idle' || o.status === 'active'))),
    [officers, playerForceId],
  );
  const hasGrandAcademy = buildings.some(
    (b) => b.id === 'grandacademy' && b.level >= 1 && cities[b.cityId]?.ownerForceId === playerForceId);

  const active = grandProjects.find((p) => p.forceId === playerForceId && !p.done) ?? null;
  const doneIds = new Set(grandProjects.filter((p) => p.forceId === playerForceId && p.done).map((p) => p.id));
  const progress = projectSeasonProgress({
    corvee,
    hiddenPercent: active ? cities[active.cityId]?.hiddenHouseholds ?? 0 : 0,
  });

  // 米價 — the dearest and cheapest city in the realm, and whether the gap is
  // wide enough that merchants will bridge it for you next season.
  const grainExtremes = useMemo(() => {
    if (own.length < 2) return null;
    const priced = own.map((c) => ({
      city: c,
      price: grainPrice(c, season, {
        stability: buildingBonuses(c.id, buildings, {
          statecraft: playerForceId ? forces[playerForceId]?.statecraft ?? null : null,
        }).priceStability,
        hoardMul: hoardEffects(c.hoardedGrain ?? 0).marketRateMul,
      }),
    })).sort((a, b) => b.price - a.price);
    const dear = priced[0];
    const cheap = priced[priced.length - 1];
    return {
      dear, cheap,
      dearTier: priceTier(dear.price), cheapTier: priceTier(cheap.price),
      gap: dear.price / Math.max(0.5, cheap.price),
    };
  }, [own, season, buildings, forces, playerForceId]);

  const mean = (pick: (c: (typeof own)[number]) => number) =>
    own.length ? own.reduce((a, c) => a + pick(c), 0) / own.length : 0;

  // Cities worth showing in the ledger: the ones with a meter actually moving.
  const troubled = useMemo(
    () => own
      .map((c) => ({
        c,
        score: (c.caseload ?? 0) / 100 + (c.hiddenHouseholds ?? 0) / 45 + (c.hoardedGrain ?? 0) / 40,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12),
    [own],
  );

  const sect: React.CSSProperties = {
    marginBottom: 10, padding: '0.55rem 0.7rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid #26323e', borderRadius: 'var(--tkm-radius-sm)',
  };
  const head: React.CSSProperties = { fontSize: '0.9rem', color: '#e6c473', marginBottom: 6 };
  const note: React.CSSProperties = { fontSize: '0.72rem', color: '#8a98a4', marginTop: 4, lineHeight: 1.5 };
  const pill = (on: boolean): React.CSSProperties => ({
    background: on ? '#26323e' : 'transparent',
    border: `1px solid ${on ? '#e6c473' : '#2b3845'}`,
    color: on ? '#f2dd9a' : '#7a8893',
    padding: '0.2rem 0.6rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '0.78rem',
  });
  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };

  return (
    <Modal
      onClose={onClose}
      width="min(760px, 100%)"
      icon={<Icon name="scroll" size={18} />}
      title={t('國政', 'Statecraft')}
      badge={t(`${LAW_NAMES[law].zh}·${CORVEE_NAMES[corvee].zh}·${SELECTION_NAMES[selection].zh}`,
               `${LAW_NAMES[law].en} · ${CORVEE_NAMES[corvee].en} · ${SELECTION_NAMES[selection].en}`)}
      scrollBody
    >
      {/* 律令 §1.11 */}
      <div style={sect}>
        <div style={head}>⚖ {t('律令', 'Legal code')}</div>
        <div style={row}>
          {LAW_SEVERITIES.map((sev) => (
            <button key={sev} style={pill(law === sev)} onClick={() => setLawCode(sev)} title={LAW_NAMES[sev].motto}>
              {t(LAW_NAMES[sev].zh, LAW_NAMES[sev].en)}
            </button>
          ))}
          <button style={{ ...pill(false), marginLeft: 'auto' }}
            onClick={() => { const r = proclaimAmnesty(); notify(r.message, r.ok); }}>
            {t('大赦天下', 'Amnesty')}
          </button>
        </div>
        <div style={note}>{t(lawEffects(law).badgeZh, lawEffects(law).badgeEn)}</div>
      </div>

      {/* 徭役 §1.12 */}
      <div style={sect}>
        <div style={head}>⛏ {t('徭役', 'Corvée')}</div>
        <div style={row}>
          {CORVEE_LEVELS.map((lv) => (
            <button key={lv} style={pill(corvee === lv)} onClick={() => setCorvee(lv)}>
              {t(CORVEE_NAMES[lv].zh, CORVEE_NAMES[lv].en)}
            </button>
          ))}
        </div>
        <div style={note}>{t(corveeEffects(corvee).badgeZh, corveeEffects(corvee).badgeEn)}</div>
      </div>

      {/* 糴政 §1.16 */}
      <div style={sect}>
        <div style={head}>🐫 {t('糴政・米市', 'Grain trade')}</div>
        <div style={row}>
          {GRAIN_POLICIES.map((p) => (
            <button key={p} style={pill(grainPolicy === p)} onClick={() => setGrainPolicy(p)}
              title={GRAIN_POLICY_NAMES[p].motto}>
              {t(GRAIN_POLICY_NAMES[p].zh, GRAIN_POLICY_NAMES[p].en)}
            </button>
          ))}
        </div>
        <div style={note}>
          {t(grainPolicyEffects(grainPolicy).badgeZh, grainPolicyEffects(grainPolicy).badgeEn)}
        </div>
        {grainExtremes && (
          <div style={note}>
            {t(
              `米價:${pickName(grainExtremes.dear.city.name, lang)} ${grainExtremes.dear.price.toFixed(1)} 金/百石(${grainExtremes.dearTier.zh})`
                + ` · ${pickName(grainExtremes.cheap.city.name, lang)} ${grainExtremes.cheap.price.toFixed(1)}(${grainExtremes.cheapTier.zh})`
                + (grainExtremes.gap >= PRICE_GAP_TRIGGER ? ' · 商旅將自行轉輸' : ' · 境內價平,商旅無利可圖'),
              `Grain: ${pickName(grainExtremes.dear.city.name, lang)} ${grainExtremes.dear.price.toFixed(1)}g/100`
                + ` · ${pickName(grainExtremes.cheap.city.name, lang)} ${grainExtremes.cheap.price.toFixed(1)}g/100`
                + (grainExtremes.gap >= PRICE_GAP_TRIGGER ? ' · caravans will move on their own' : ' · prices level, no caravans'),
            )}
          </div>
        )}
      </div>

      {/* 選官 §3.6 */}
      <div style={sect}>
        <div style={head}>🏛 {t('選官之制', 'Selection of officials')}</div>
        <div style={row}>
          {SELECTION_SYSTEMS.map((sys) => (
            <button key={sys} style={pill(selection === sys)}
              onClick={() => { const r = setSelectionSystem(sys); notify(r.message, r.ok); }}
              title={SELECTION_NAMES[sys].motto}>
              {t(SELECTION_NAMES[sys].zh, SELECTION_NAMES[sys].en)}
            </button>
          ))}
          {!hasGrandAcademy && (
            <span style={{ ...note, marginTop: 0, color: '#8a7a5a' }}>
              {t('(開科取士須先建太學)', '(open examination needs a 太學)')}
            </span>
          )}
        </div>
        <div style={note}>
          {t(selectionEffects(selection).badgeZh, selectionEffects(selection).badgeEn)}
          {selection === 'jiupin' && (
            <> · {rectifier
              ? t(`中正:${rectifier.name.zh}${rectifierIsUpright(rectifier) ? '(公正 — 寒門猶有一線)' : ''}`,
                   `Rectifier: ${rectifier.name.en}${rectifierIsUpright(rectifier) ? ' (upright)' : ''}`)
              : t('朝中無人可任中正', 'no one fit to be Rectifier')}</>
          )}
        </div>
      </div>

      {/* 大工 §1.15 */}
      <div style={sect}>
        <div style={head}>🏗 {t('大工', 'Great work')}</div>
        {active ? (
          <>
            <div style={row}>
              <span style={{ color: '#f2dd9a', fontSize: '0.82rem' }}>
                {t(PROJECTS_BY_ID[active.id].name.zh, PROJECTS_BY_ID[active.id].name.en)}
              </span>
              <span style={{ color: '#9fb0bd', fontSize: '0.76rem' }}>
                {t(`於${pickName(cities[active.cityId]?.name ?? { zh: '?', en: '?' }, 'zh')} · 起 ${active.startedYear} 年 · 尚需約 ${projectEta(active.seasonsLeft, progress)} 季`,
                   `at ${pickName(cities[active.cityId]?.name ?? { zh: '?', en: '?' }, 'en')} · begun ${active.startedYear} · ~${projectEta(active.seasonsLeft, progress)} seasons left`)}
              </span>
              <button style={{ ...pill(false), marginLeft: 'auto', borderColor: '#6a3a30', color: '#c08070' }}
                onClick={() => { const r = abandonGrandProject(); notify(r.message, r.ok); }}>
                {t('罷役', 'Abandon')}
              </button>
            </div>
            <div style={note}>
              {t(`役夫進度 ×${progress} — 重役加快、隱戶拖慢。`, `Labour rate ×${progress} — heavy corvée speeds it, hidden households slow it.`)}
              {' '}{t(PROJECTS_BY_ID[active.id].effectZh, PROJECTS_BY_ID[active.id].effectEn)}
            </div>
          </>
        ) : (
          <>
            <div style={row}>
              <select value={projectPick} onChange={(e) => setProjectPick(e.target.value)}
                style={{ background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473', fontSize: '0.76rem', borderRadius: 'var(--tkm-radius-xs)', padding: '0.15rem' }}>
                <option value="">{t('— 擇工 —', '— pick —')}</option>
                {GRAND_PROJECTS.filter((d) => !doneIds.has(d.id)).map((d) => (
                  <option key={d.id} value={d.id}>
                    {t(`${d.name.zh}(${d.goldCost}金 · ${d.baseSeasons}季)`, `${d.name.en} (${d.goldCost}g · ${d.baseSeasons}s)`)}
                  </option>
                ))}
              </select>
              <select value={projectCity} onChange={(e) => setProjectCity(e.target.value)}
                style={{ background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473', fontSize: '0.76rem', borderRadius: 'var(--tkm-radius-xs)', padding: '0.15rem' }}>
                <option value="">{t('— 擇地 —', '— where —')}</option>
                {own.map((c) => (
                  <option key={c.id} value={c.id}>{`${pickName(c.name, lang)}(${c.gold})`}</option>
                ))}
              </select>
              <button style={pill(false)} disabled={!projectPick || !projectCity}
                onClick={() => {
                  const r = startGrandProject(projectPick as GrandProjectId, projectCity);
                  notify(r.message, r.ok);
                  if (r.ok) { setProjectPick(''); setProjectCity(''); }
                }}>{t('興工', 'Begin')}</button>
            </div>
            <div style={note}>
              {projectPick
                ? `${t(PROJECTS_BY_ID[projectPick as GrandProjectId].flavourZh, PROJECTS_BY_ID[projectPick as GrandProjectId].flavourEn)} ${t(PROJECTS_BY_ID[projectPick as GrandProjectId].effectZh, PROJECTS_BY_ID[projectPick as GrandProjectId].effectEn)}`
                : t('一國一大工 —— 數年之功,永世之利。重役可倍其速,而民力有時而窮。',
                    'One great work at a time — years of labour for a lasting good. Heavy corvée doubles the pace and the people pay for it.')}
              {doneIds.size > 0 && ` · ${t('已成', 'standing')}: ${[...doneIds].map((id) => t(PROJECTS_BY_ID[id].name.zh, PROJECTS_BY_ID[id].name.en)).join('、')}`}
            </div>
          </>
        )}
      </div>

      {/* 全境民政 §1.11–§1.14 */}
      <div style={sect}>
        <div style={head}>📋 {t('全境民政', 'The realm\'s books')}</div>
        <div style={{ ...note, marginTop: 0, marginBottom: 6 }}>
          {t(`城 ${own.length} · 平均 積案 ${mean((c) => c.caseload ?? 0).toFixed(0)} · 隱戶 ${mean((c) => c.hiddenHouseholds ?? 0).toFixed(1)}%(租賦收 ${(registryYieldMul(mean((c) => c.hiddenHouseholds ?? 0)) * 100).toFixed(0)}%)· 囤積 ${mean((c) => c.hoardedGrain ?? 0).toFixed(1)}% · 文教 ${mean((c) => c.culture ?? 0).toFixed(0)} · 祠 ${shrines.length} · 詩 ${poems.length}`,
             `${own.length} cities · mean docket ${mean((c) => c.caseload ?? 0).toFixed(0)} · off-books ${mean((c) => c.hiddenHouseholds ?? 0).toFixed(1)}% (yield ${(registryYieldMul(mean((c) => c.hiddenHouseholds ?? 0)) * 100).toFixed(0)}%) · hoard ${mean((c) => c.hoardedGrain ?? 0).toFixed(1)}% · culture ${mean((c) => c.culture ?? 0).toFixed(0)} · ${shrines.length} shrines · ${poems.length} poems`)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(4rem,1fr) repeat(4, minmax(3.4rem, auto))', gap: '2px 8px', fontSize: '0.72rem' }}>
          <span style={{ color: '#7a8893' }}>{t('城', 'City')}</span>
          <span style={{ color: '#7a8893' }}>{t('獄訟', 'Docket')}</span>
          <span style={{ color: '#7a8893' }}>{t('隱戶', 'Off-books')}</span>
          <span style={{ color: '#7a8893' }}>{t('囤積', 'Hoard')}</span>
          <span style={{ color: '#7a8893' }}>{t('文教', 'Culture')}</span>
          {troubled.map(({ c }) => (
            <Row key={c.id} onClick={onSelectCity ? () => { onSelectCity(c.id); onClose(); } : undefined}
              name={pickName(c.name, lang)}
              docket={Math.round(c.caseload ?? 0)}
              hidden={c.hiddenHouseholds ?? 0}
              hoard={Math.round(c.hoardedGrain ?? 0)}
              culture={Math.round(c.culture ?? 0)}
              docketTier={caseloadTier(c.caseload ?? 0)}
              hiddenTierName={hiddenTier(c.hiddenHouseholds ?? 0)}
              hoardTierName={hoardTier(c.hoardedGrain ?? 0)}
              lang={lang}
            />
          ))}
        </div>
        {own.length === 0 && <div style={note}>{t('尚無城池。', 'No cities yet.')}</div>}
      </div>

      {noticeUI}
    </Modal>
  );
}

function Row(props: {
  name: string; docket: number; hidden: number; hoard: number; culture: number;
  docketTier: { zh: string; en: string };
  hiddenTierName: { zh: string; en: string };
  hoardTierName: { zh: string; en: string };
  lang: string;
  onClick?: () => void;
}) {
  const cell = (v: number, warn: boolean, title: string) => (
    <span title={title} style={{ color: warn ? '#e0a070' : '#9fb0bd', fontFamily: 'ui-monospace, monospace' }}>{v}</span>
  );
  return (
    <>
      <span
        onClick={props.onClick}
        style={{ color: '#c8d4dc', cursor: props.onClick ? 'pointer' : 'default', textDecoration: props.onClick ? 'underline dotted' : undefined }}
      >{props.name}</span>
      {cell(props.docket, props.docket >= 55, props.lang === 'en' ? props.docketTier.en : props.docketTier.zh)}
      {cell(Math.round(props.hidden), props.hidden >= 18, props.lang === 'en' ? props.hiddenTierName.en : props.hiddenTierName.zh)}
      {cell(props.hoard, props.hoard >= 20, props.lang === 'en' ? props.hoardTierName.en : props.hoardTierName.zh)}
      {cell(props.culture, false, '')}
    </>
  );
}
