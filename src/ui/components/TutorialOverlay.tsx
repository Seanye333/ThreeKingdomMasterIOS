import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';

const TUTORIAL_STEPS: Array<{ titleZh: string; titleEn: string; bodyZh: string; bodyEn: string }> = [
  {
    titleZh: '欢迎来到三国',
    titleEn: 'Welcome to the Three Kingdoms',
    bodyZh: '你是一方势力的君主。目标是统一天下,或选择其他结局。每个季节(春夏秋冬)结束时,系统会处理你的命令。',
    bodyEn: 'You command a force. The goal is to unify the realm — or pursue a different ending. At the end of each season, your orders resolve.',
  },
  {
    titleZh: '地图与城市',
    titleEn: 'The Map & Cities',
    bodyZh: '点击地图上的城市选择它。你的城市会显示金钱，粮食，兵力。点击建筑面板建造兵营，市场，寺院等。',
    bodyEn: 'Click a city to select it. Your cities show gold, food, and troops. Build barracks, markets, and temples in the Buildings panel.',
  },
  {
    titleZh: '武将与命令',
    titleEn: 'Officers & Orders',
    bodyZh: '武将是你的核心资源。每个季节他们可以执行一项命令:征兵，内政，出阵，外交，密谋。统率，武力，知力，政治，魅力决定他们擅长什么。',
    bodyEn: 'Officers are your core resource. Each season they can perform one task: recruit, develop, march, diplomacy, espionage. Leadership/War/Intelligence/Politics/Charisma determine what they\'re good at.',
  },
  {
    titleZh: '战斗',
    titleEn: 'Combat',
    bodyZh: '点击地图上的敌城,在出阵菜单选择「戰術 Tactical」进入战术战斗。布阵，选兵种，用计谋。或者用「March!」即时结算。',
    bodyEn: 'Click an enemy city, choose March, then "Tactical" to launch a hex-grid tactical battle. Pick formations, unit types, and stratagems. Or use "March!" for instant resolution.',
  },
  {
    titleZh: '施設与防御',
    titleEn: 'Facilities & Defence',
    bodyZh: '地图下方「築堡施設」可在城郊修箭樓/投石臺/陣/防壁:它们每季自动轰击/补给/拦阻路过的军队,开战时还会出现在战场上参战。进城邑地图可在 8 个方位布置城防,点防御位还能「守城演習」练兵(不损兵将)。',
    bodyEn: 'The Build button raises towers/catapults/camps/barricades near your cities — they shell, resupply or stall passing columns each season, and join battles fought beside them. Inside the city map, place wall defences on 8 approaches; tap a slot to run a no-loss siege drill.',
  },
  {
    titleZh: '观战与原地指挥',
    titleEn: 'Watch & Command In Place',
    bodyZh: '战斗中点「🌏 大地圖」可缩回世界视角 —— 仗就在大地图那块地上继续打。点棋盘上自己的部队即可移动/攻击/放计谋,点 ⚔ 浮标或 ⤢ 随时回全屏。',
    bodyEn: 'In battle, tap 🌏 to drop back to the world map — the fight keeps playing on the very ground it broke out on. Tap your units on the little board to move/attack/cast, and the ⚔ chip or ⤢ to re-enter fullscreen.',
  },
  {
    titleZh: '棋盘地图',
    titleEn: 'The Hex Map',
    bodyZh: '地图右上「⬡ 棋盤地圖」把整张天下切换成六角地块风格:势力疆域染色、国界描边、道路铺地。随时可切回画卷地图。',
    bodyEn: 'The ⬡ toggle re-renders the whole realm as a hex-tile board — realms tinted, borders deepened, roads paved into the quilt. Switch back to the painted scroll any time.',
  },
  {
    titleZh: '探索',
    titleEn: 'Explore',
    bodyZh: '使用上方按钮探索:武将(全员)，宝物(装备)，密偵(谍报)，朝廷(诏令)，保存。准备好结束本季时点「End Season →」。',
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
        zIndex: 970, // Z.tutorial(見 ui/zIndex.ts 層級表)
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
          fontSize: '0.65rem',
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
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
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
