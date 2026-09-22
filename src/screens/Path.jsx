import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { FRUITS } from '../fruits/registry.js';
import { FruitArt } from '../fruits/art.jsx';
import { LEVELS, levelFruits } from '../levels/levels.js';
import { useProgress, isUnlocked, isDone, starsOf, currentIndex } from '../levels/progress.js';
import { useSettings } from '../settings/SettingsContext.jsx';
import { sfx } from '../settings/sfx.js';
import TopBar from './TopBar.jsx';
import { freshTrees } from './MyGarden.jsx';
import { HouseArt } from './House.jsx';
import { Icon } from '../ui/icons.jsx';

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

const FRUIT = Object.fromEntries(FRUITS.map(f => [f.id, f]));

/* the map is drawn in its own units: 400 wide, STEP tall per stop. It scales to the screen's width. */
const W = 400, STEP = 225, TOP = 150, BOTTOM = 170;
// the road starts in the middle of the screen, then winds from side to side
const stopAt = i => ({ x: W / 2 + Math.sin(i * 1.15) * 112, y: TOP + i * STEP });
// the child's house, on the grass beside the start of the road
const HOUSE = { x: 74, y: TOP + 20 };

/* a smooth country road through every stop */
function roadPath(points) {
  let d = `M${points[0].x},${points[0].y - 30}`;
  d += ` L${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dy = (b.y - a.y) / 2;
    d += ` C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last.x},${last.y + 110}`;
}

/* little things beside the road, placed the same way every time */
function decorations(points) {
  const out = [];
  points.forEach((p, i) => {
    const side = p.x > W / 2 ? -1 : 1;                    // the open side of the bend
    out.push({ kind: 'tree', x: p.x + side * 118, y: p.y - 40, s: 1 + (i % 3) * .12 });
    out.push({ kind: 'bush', x: p.x - side * 86, y: p.y + 70, s: .9 + (i % 2) * .2 });
    out.push({ kind: 'flowers', x: p.x + side * 70, y: p.y + 92, s: 1 });
    if (i % 2) out.push({ kind: 'fence', x: p.x - side * 130, y: p.y - 60, s: 1 });
    else out.push({ kind: 'rock', x: p.x + side * 150, y: p.y + 40, s: .9 });
  });
  // nothing grows on the child's house, or in front of its door
  return out.filter(d => d.x > 18 && d.x < W - 18 && Math.hypot(d.x - HOUSE.x, d.y - HOUSE.y) > 90);
}

function Decoration({ kind, x, y, s }) {
  const t = `translate(${x} ${y}) scale(${s})`;
  if (kind === 'tree') return (
    <g transform={t}>
      <ellipse cx="0" cy="34" rx="30" ry="7" fill="#2E6B34" opacity=".25" />
      <rect x="-5" y="4" width="10" height="30" rx="4" fill="#7A4A22" />
      <circle cx="0" cy="-12" r="28" fill="#3E8E47" /><circle cx="-16" cy="0" r="18" fill="#4FA356" />
      <circle cx="15" cy="-2" r="20" fill="#5DB45E" /><circle cx="-6" cy="-24" r="14" fill="#7CC66C" />
      <circle cx="-10" cy="-6" r="4" fill="#E23A4B" /><circle cx="12" cy="-16" r="4" fill="#E23A4B" /><circle cx="6" cy="6" r="4" fill="#E23A4B" />
    </g>
  );
  if (kind === 'bush') return (
    <g transform={t}>
      <ellipse cx="0" cy="12" rx="26" ry="5" fill="#2E6B34" opacity=".22" />
      <circle cx="-12" cy="2" r="13" fill="#4FA356" /><circle cx="6" cy="-2" r="16" fill="#5DB45E" /><circle cx="18" cy="5" r="10" fill="#4FA356" />
    </g>
  );
  if (kind === 'flowers') return (
    <g transform={t}>
      {[[-12, 0, '#FFF4DF'], [0, -6, '#F7A1C4'], [12, 2, '#FFD36E'], [5, 8, '#FFF4DF']].map(([fx, fy, c], k) => (
        <g key={k} transform={`translate(${fx} ${fy})`}>
          {[0, 1, 2, 3, 4].map(p => <circle key={p} cx={Math.cos(p * 1.256) * 3.6} cy={Math.sin(p * 1.256) * 3.6} r="3" fill={c} />)}
          <circle r="2.2" fill="#F2A541" />
        </g>
      ))}
    </g>
  );
  if (kind === 'fence') return (
    <g transform={t} stroke="#9C6A38" strokeLinecap="round">
      <path d="M-30,0 H30 M-30,12 H30" strokeWidth="5" />
      <path d="M-24,-10 V22 M0,-10 V22 M24,-10 V22" strokeWidth="6" />
    </g>
  );
  return (
    <g transform={t}>
      <ellipse cx="0" cy="8" rx="18" ry="4" fill="#2E6B34" opacity=".22" />
      <path d="M-16,8 C-18,-4 -6,-12 4,-10 C14,-8 18,0 16,8 Z" fill="#B8B1A3" /><path d="M-6,-6 C0,-10 8,-8 10,-2" fill="none" stroke="#D8D2C5" strokeWidth="3" />
    </g>
  );
}

const Star = ({ on }) => (
  <svg className={`map-star ${on ? 'won' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" />
  </svg>
);
const Lock = () => (
  <svg className="map-lock" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const MiniCart = () => (
  <svg className="map-cart" viewBox="0 0 120 90" aria-hidden="true">
    <path d="M8,26 L112,26 L104,6 L16,6 Z" fill="#D7263D" stroke="#1B1F3B" strokeWidth="4" strokeLinejoin="round" />
    <path d="M8,26 q13,14 26,0 q13,14 26,0 q13,14 26,0 q13,14 26,0" fill="#FFF4DF" stroke="#1B1F3B" strokeWidth="4" strokeLinejoin="round" />
    <rect x="12" y="52" width="96" height="22" rx="6" fill="#C98A4B" stroke="#1B1F3B" strokeWidth="4" />
    <circle cx="34" cy="78" r="9" fill="#5A3418" stroke="#1B1F3B" strokeWidth="4" /><circle cx="86" cy="78" r="9" fill="#5A3418" stroke="#1B1F3B" strokeWidth="4" />
  </svg>
);

/* a fruit as the 3D picture when it's ready, the drawing until then */
function Pic({ id, pics, className }) {
  return pics[id] ? <img className={className} src={pics[id]} alt="" draggable="false" /> : <span className={className}><FruitArt id={id} /></span>;
}

/* ---------------------------------------------------------------------
   the road through the orchard: every stop opens the one after it
   --------------------------------------------------------------------- */
export default function Path({ onPick, onHome }) {
  const { t, n, sound } = useSettings();
  const progress = useProgress();
  const now = currentIndex(progress);
  const scope = useRef(null);
  const [pics, setPics] = useState({});
  const newTree = freshTrees(progress).length > 0;       // a tree is waiting in the garden: the house calls

  const points = useMemo(() => LEVELS.map((_, i) => stopAt(i)), []);
  const H = TOP + (LEVELS.length - 1) * STEP + BOTTOM;
  const road = useMemo(() => roadPath(points), [points]);
  const decor = useMemo(() => decorations(points), [points]);

  // the real 3D fruit for the medallions (a module keeps them, so this is instant after the first time)
  useEffect(() => {
    let alive = true;
    import('../games/plant/front3d.js').then(({ fruitPicture }) => {
      FRUITS.forEach(f => fruitPicture(f.id).then(url => { if (alive && url) setPics(p => ({ ...p, [f.id]: url })); }));
    });
    return () => { alive = false; };
  }, []);

  useGSAP(() => {
    scope.current.querySelector('.map-stop.is-now')?.scrollIntoView({ block: 'center', behavior: 'instant' });
    gsap.from('.map-house', { scale: 0, transformOrigin: '50% 100%', duration: .8, ease: 'back.out(2)', delay: .4 });
    gsap.to('.map-house .house-smoke circle', { keyframes: [{ opacity: .8, y: 0, x: 0, scale: .5, duration: 0 }, { opacity: 0, y: -30, x: 8, scale: 1.6, duration: 2.2 }], stagger: .7, repeat: -1, ease: 'power1.out', transformOrigin: '50% 50%' });
    if (newTree) gsap.to('.map-house-new', { scale: 1.2, duration: .6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.map-title', { autoAlpha: 0, yPercent: 40, duration: 1 })
      .from('.map-road-in', { drawSVG: '0%', duration: 1.6, ease: 'power2.inOut' }, 0)
      .from('.map-stop', { scale: 0, duration: .7, stagger: .06, ease: 'back.out(2)' }, .3)
      .from('.map-deco > g', { scale: 0, transformOrigin: '50% 100%', duration: .5, stagger: .01, ease: 'back.out(2)' }, .5);
    gsap.to('.map-stop.is-now .map-medal', { y: -8, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.map-here', { y: -10, duration: .7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }, { scope });

  const pick = (i, unlocked, el) => {
    if (!unlocked) {
      sfx.soft(sound);
      gsap.fromTo(el, { rotation: 0 }, { keyframes: { rotation: [0, -6, 6, -3, 0] }, duration: .45, ease: 'none' });
      return;
    }
    sfx.open(sound);
    gsap.to(el, { scale: 1.15, duration: .15, yoyo: true, repeat: 1, onComplete: () => onPick(i) });
  };

  return (
    <main className="map" ref={scope}>
      <div className="map-sky" aria-hidden="true">
        <div className="orchard-sun" />
        <svg className="orchard-cloud oc1" viewBox="0 0 200 80"><path d="M20,70 C0,70 0,44 22,42 C22,20 52,12 66,30 C74,8 116,6 124,34 C140,20 170,26 170,48 C192,48 196,70 176,70 Z" /></svg>
        <svg className="orchard-cloud oc2" viewBox="0 0 200 80"><path d="M20,70 C0,70 0,44 22,42 C22,20 52,12 66,30 C74,8 116,6 124,34 C140,20 170,26 170,48 C192,48 196,70 176,70 Z" /></svg>
      </div>

      {/* the meadow runs the whole width of the screen, whatever its size */}
      <svg className="map-horizon" viewBox="0 0 1600 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,90 C240,30 520,70 780,80 C1060,92 1300,30 1600,60 L1600,200 L0,200 Z" fill="#B5DC8E" />
        <path d="M0,140 C300,100 600,136 900,126 C1200,116 1400,100 1600,120 L1600,200 L0,200 Z" fill="#9ED27A" />
      </svg>

      <TopBar />

      <header className="map-head">
        <h1 className="orchard-title map-title">{t('mapTitle')}</h1>
      </header>


      <div className="map-land" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg className="map-ground" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <g className="map-deco">{decor.filter(d => d.y < points[0].y).map((d, k) => <Decoration key={`b${k}`} {...d} />)}</g>
          <path d={road} fill="none" stroke="#B98B55" strokeWidth="50" strokeLinecap="round" />
          <path className="map-road-in" d={road} fill="none" stroke="#E7C893" strokeWidth="38" strokeLinecap="round" />
          <path d={road} fill="none" stroke="#FFF4DF" strokeWidth="4" strokeDasharray="10 16" strokeLinecap="round" opacity=".8" />
          <g className="map-deco">{decor.filter(d => d.y >= points[0].y).map((d, k) => <Decoration key={k} {...d} />)}</g>
        </svg>

        {/* home: the child's house, their garden behind it */}
        <button type="button" className="map-house" aria-label={t('myHome')}
          style={{ left: `${HOUSE.x / W * 100}%`, top: `${HOUSE.y / H * 100}%` }}
          onClick={() => { sfx.open(sound); onHome?.(); }}>
          <svg viewBox="0 0 140 130" aria-hidden="true"><HouseArt /></svg>
          <span className="map-house-label"><Icon name="home" />{t('myHome')}</span>
          {newTree && (
            <span className="map-house-new" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 20v-7" stroke="#2C7A47" strokeWidth="2.6" strokeLinecap="round" /><path d="M12 13C12 8 15 5.2 20 5.2 20 10 17 13 12 13ZM12 14.4C12 10.4 9.4 8.2 4.4 8.2 4.4 12.2 7 14.4 12 14.4Z" fill="#3E8E47" /></svg>
            </span>
          )}
        </button>

        <ol className="map-stops">
          {LEVELS.map((level, i) => {
            const { x, y } = points[i];
            const unlocked = isUnlocked(progress, i);
            const done = isDone(progress, level.id);
            const stars = starsOf(progress, level.id);
            const fruits = levelFruits(level);
            const market = level.kind === 'market';
            const name = market ? t('marketName') : t(FRUIT[level.fruit].text.name);
            return (
              <li key={level.id}
                className={`map-stop ${unlocked ? 'is-open' : 'is-locked'} ${done ? 'is-done' : ''} ${i === now ? 'is-now' : ''} ${market ? 'is-market' : ''}`}
                style={{ left: `${x / W * 100}%`, top: `${y / H * 100}%`, '--glow': market ? '#FFD36E' : FRUIT[level.fruit].glow }}>
                {i === now && <span className="map-here" aria-hidden="true">▼</span>}
                <button type="button"
                  aria-label={`${t('levelNo')} ${n(i + 1)} — ${name}${unlocked ? '' : ` — ${t('locked')}`}`}
                  onClick={e => pick(i, unlocked, e.currentTarget)}
                  onPointerEnter={() => unlocked && sfx.pop(sound)}>
                  <span className="map-medal">
                    {market
                      ? <span className="map-market"><MiniCart />{fruits.slice(0, 3).map(id => <Pic key={id} id={id} pics={pics} className="map-market-fruit" />)}</span>
                      : <Pic id={level.fruit} pics={pics} className="map-fruit" />}
                    {!unlocked && <Lock />}
                    <span className="map-no">{n(i + 1)}</span>
                  </span>
                  <span className="map-stars" aria-hidden="true">{[0, 1, 2].map(k => <Star key={k} on={k < stars} />)}</span>
                  <span className="map-label"><b>{name}</b><small>{t(level.learn)}</small></span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
