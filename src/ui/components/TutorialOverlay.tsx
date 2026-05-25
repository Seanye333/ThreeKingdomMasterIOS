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
        zIndex: 980,
        background: 'linear-gradient(160deg,#2a1f15 0%,#1a1410 100%)',
        border: '2px solid #d4a84a',
        width: 'min(400px, 92vw)',
        padding: '1rem 1.25rem',
        color: '#e8d9b0',
        fontFamily: '"Songti SC","Noto Serif SC",serif',
        boxShadow: '0 0 24px rgba(212, 168, 74, 0.35)',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.3rem',
          color: '#c19a3b',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
        }}
      >
        {t('教學', 'Tutorial')} {safeStep + 1} / {TUTORIAL_STEPS.length}
      </div>
      <div style={{ fontSize: '1.2rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>
        {lang === 'en' ? cur.titleEn : cur.titleZh}
      </div>
      {lang === 'both' && (
        <div style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic', marginBottom: '0.5rem' }}>
          {cur.titleEn}
        </div>
      )}
      <hr style={{ border: 'none', height: 1, background: '#4a3520', margin: '0.5rem 0' }} />
      <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#d4a84a' }}>
        {lang === 'en' ? cur.bodyEn : cur.bodyZh}
      </div>
      {lang === 'both' && (
        <div
          style={{
            fontSize: '0.78rem',
            color: '#c0a878',
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
            border: '1px solid #5a4530',
            color: '#8a7050',
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
            background: '#3a2d20',
            border: '1px solid #d4a84a',
            color: '#d4a84a',
            padding: '0.35rem 1rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '0.15rem',
          }}
        >
          {isLast ? t('完了', 'Done') : t('下一步', 'Next')}
        </button>
      </div>
    </div>
  );
}
