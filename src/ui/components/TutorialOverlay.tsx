import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';
import { Z } from '../zIndex';

const TUTORIAL_STEPS: Array<{ titleZh: string; titleEn: string; bodyZh: string; bodyEn: string }> = [
  {
    // 不寫「三國」—— 同一套教學會出現在戰國、楚漢、隋唐的盤上,在長平之戰
    // 開場說「歡迎來到三國」是當場穿幫(2026-08-01 目視巡檢抓到)。
    titleZh: '歡迎來到千古群英傳',
    titleEn: 'Welcome, warlord',
    bodyZh: '你是一方勢力的君主。目標是統一天下,或選擇其他結局。每個季節(春夏秋冬)結束時,系統會處理你的命令。',
    bodyEn: 'You command a force. The goal is to unify the realm — or pursue a different ending. At the end of each season, your orders resolve.',
  },
  {
    titleZh: '地圖與城市',
    titleEn: 'The Map & Cities',
    bodyZh: '點擊地圖上的城市選擇它。你的城市會顯示金錢，糧食，兵力。點擊建筑面板建造兵營，市場，寺院等。',
    bodyEn: 'Click a city to select it. Your cities show gold, food, and troops. Build barracks, markets, and temples in the Buildings panel.',
  },
  {
    titleZh: '武將與命令',
    titleEn: 'Officers & Orders',
    bodyZh: '武將是你的核心資源。每個季節他們可以執行一項命令:征兵，内政，出陣，外交，密謀。統率，武力，知力，政治，魅力決定他們擅長什么。',
    bodyEn: 'Officers are your core resource. Each season they can perform one task: recruit, develop, march, diplomacy, espionage. Leadership/War/Intelligence/Politics/Charisma determine what they\'re good at.',
  },
  {
    titleZh: '戰斗',
    titleEn: 'Combat',
    bodyZh: '點擊地圖上的敵城,在出陣菜單選擇「戰術 Tactical」進入戰術戰斗。布陣，選兵種，用計謀。或者用「March!」即時結算。',
    bodyEn: 'Click an enemy city, choose March, then "Tactical" to launch a hex-grid tactical battle. Pick formations, unit types, and stratagems. Or use "March!" for instant resolution.',
  },
  {
    titleZh: '施設與防御',
    titleEn: 'Facilities & Defence',
    bodyZh: '地圖下方「築堡施設」可在城郊修箭樓/投石臺/陣/防壁:它們每季自動轟擊/補給/拦阻路過的軍隊,開戰時還會出現在戰場上參戰。進城邑地圖可在 8 個方位布置城防,點防御位還能「守城演習」練兵(不損兵將)。',
    bodyEn: 'The Build button raises towers/catapults/camps/barricades near your cities — they shell, resupply or stall passing columns each season, and join battles fought beside them. Inside the city map, place wall defences on 8 approaches; tap a slot to run a no-loss siege drill.',
  },
  {
    titleZh: '觀戰與原地指揮',
    titleEn: 'Watch & Command In Place',
    bodyZh: '戰斗中點「🌏 大地圖」可縮回世界视角 —— 仗就在大地圖那塊地上繼續打。點棋盤上自己的部隊即可移動/攻擊/放計謀,點 ⚔ 浮標或 ⤢ 隨時回全屏。',
    bodyEn: 'In battle, tap 🌏 to drop back to the world map — the fight keeps playing on the very ground it broke out on. Tap your units on the little board to move/attack/cast, and the ⚔ chip or ⤢ to re-enter fullscreen.',
  },
  {
    titleZh: '棋盤地圖',
    titleEn: 'The Hex Map',
    bodyZh: '地圖右上「⬡ 棋盤地圖」把整張天下切換成六角地塊風格:勢力疆域染色、國界描邊、道路鋪地。隨時可切回画卷地圖。',
    bodyEn: 'The ⬡ toggle re-renders the whole realm as a hex-tile board — realms tinted, borders deepened, roads paved into the quilt. Switch back to the painted scroll any time.',
  },
  {
    titleZh: '軍略進階',
    titleEn: 'Deeper Arts of War',
    bodyZh: '紮營的部隊可「圍城」斷糧迫降、可在林丘「設伏」隱身截擊;遠征三季以上要鋪「兵站」保糧道;临江之城可横「拦江鎖」鎖敵水軍。軍師會在你第一次用得上時點拨提示,完整条目見「記錄→概念」的軍略新篇。',
    bodyEn: 'A camped army can BESIEGE a city into surrender or AMBUSH from cover; long expeditions need supply DEPOTS; riverside cities can chain the water with a BOOM. Your advisor tips each mechanic the first time it matters — full entries live under Records → Concepts.',
  },
  {
    titleZh: '探索',
    titleEn: 'Explore',
    bodyZh: '使用上方按鈕探索:武將(全員)，寶物(裝備)，密偵(諜報)，朝廷(詔令)，保存。准備好結束本季時點「End Season →」。',
    bodyEn: 'Use the top-bar buttons: Officers, Armoury, Espionage, Court, Save. When you\'ve issued all your orders, click "End Season →".',
  },
];

export function TutorialOverlay() {
  const step = useGameStore((s) => s.tutorialStep);
  const setStep = useGameStore((s) => s.setTutorialStep);
  const t = useT();
  const lang = useLanguage();
  if (step === null) return null;
  const safeStep = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, step));
  const cur = TUTORIAL_STEPS[safeStep];
  const isLast = safeStep === TUTORIAL_STEPS.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: Z.tutorial, // 見 ui/zIndex.ts 層級表
        background: 'linear-gradient(160deg,#1b2531 0%,#10161e 100%)',
        border: '2px solid #e6c473',
        width: 'min(400px, 92vw)',
        padding: '1rem 1.25rem',
        color: '#e6edf3',
        fontFamily: 'var(--tkm-font-body)',
        boxShadow: '0 0 24px rgba(212, 168, 74, 0.35)',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.1rem',
          color: '#c9a64e',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
        }}
      >
        {t('教學', 'Tutorial')} {safeStep + 1} / {TUTORIAL_STEPS.length}
      </div>
      <div style={{ fontSize: '1.2rem', color: '#e6c473', letterSpacing: '0.07rem' }}>
        {lang === 'en' ? cur.titleEn : cur.titleZh}
      </div>
      {lang === 'both' && (
        <div style={{ fontSize: '0.78rem', color: '#7a8893', fontStyle: 'italic', marginBottom: '0.5rem' }}>
          {cur.titleEn}
        </div>
      )}
      <hr style={{ border: 'none', height: 1, background: '#2b3845', margin: '0.5rem 0' }} />
      <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#e6c473' }}>
        {lang === 'en' ? cur.bodyEn : cur.bodyZh}
      </div>
      {lang === 'both' && (
        <div
          style={{
            fontSize: '0.78rem',
            color: '#aab6c0',
            fontStyle: 'italic',
            marginTop: '0.4rem',
            lineHeight: 1.5,
          }}
        >
          {cur.bodyEn}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' }}>
        <button
          onClick={() => setStep(null)}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
            color: '#7a8893',
            padding: '0.35rem 0.8rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            fontSize: '0.78rem',
          }}
        >
          {t('略過', 'Skip')}
        </button>
        <button
          onClick={() => {
            if (isLast) setStep(null);
            else setStep(safeStep + 1);
          }}
          style={{
            background: '#26323e',
            border: '1px solid #e6c473',
            color: '#e6c473',
            padding: '0.35rem 1rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '0.05rem',
          }}
        >
          {isLast ? t('完了', 'Done') : t('下一步', 'Next')}
        </button>
      </div>
    </div>
  );
}
