/* بستاني — the child's own garden, behind their house (the house on the map takes them here). Every planting
   level they finish grows its tree in its own bed: an apple tree, a mango tree, a potato plant. Every market
   level leaves a crate of fruit by the door.

   A tree not seen yet grows in front of them when they come in — the soil bursts, the stem shoots up, the
   crown opens, the fruit pops out one by one. A tap on any tree shakes it and a fruit falls; a tap on the
   house puffs smoke from the chimney. What has been shown is remembered (localStorage 'orchard-garden'), so
   each tree grows only once — and freshTrees() tells the map there's something new to see. */
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { LEVELS } from '../levels/levels.js';
import { isDone } from '../levels/progress.js';
import { useSettings } from '../settings/SettingsContext.jsx';
import { audioContext } from '../settings/audio.js';
import { HouseArt } from './House.jsx';

gsap.registerPlugin(useGSAP, MotionPathPlugin);

const W = 400;
const GROW = LEVELS.filter(l => l.kind === 'grow');
const MARKETS = LEVELS.filter(l => l.kind === 'market');
/* the beds in front of the house: two long rows on a wide screen; on a phone held upright, two columns of
   bigger trees, row after row down the lawn (each row a little nearer, a little bigger) */
function layout(tall) {
  if (!tall) {
    const half = Math.ceil(GROW.length / 2);
    return { H: 300, beds: GROW.map((l, i) => {
      const back = i < half, col = back ? i : i - half;
      return { level: l, x: back ? 52 + col * 78 : 92 + col * 80, y: back ? 196 : 266, s: back ? .84 : 1 };
    }) };
  }
  const rows = Math.ceil(GROW.length / 2);
  return { H: 250 + rows * 104, beds: GROW.map((l, i) => {
    const row = Math.floor(i / 2), col = i % 2;
    return { level: l, x: (col ? 290 : 110) + (row % 2 ? 22 : -22), y: 262 + row * 104, s: 1.3 + row * .08 };
  }) };
}

const SEEN = 'orchard-garden';
const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN)) || []; } catch { return []; } };
/* the planted levels whose tree hasn't been seen growing yet */
export const freshTrees = progress => GROW.filter(l => isDone(progress, l.id) && !readSeen().includes(l.id)).map(l => l.id);
const saveSeen = ids => { try { localStorage.setItem(SEEN, JSON.stringify(ids)); } catch { /* private mode: it grows again next time, that's all */ } };

function chime(on, notes = [784, 1047, 1319]) {
  const ctx = audioContext();
  if (!on || !ctx) return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  notes.forEach((f, i) => {
    const t = ctx.currentTime + i * .09, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .45);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .5);
  });
}

/* ---------- the plants ---------- */
function AppleTree() {
  return (
    <>
      <rect className="g-trunk" x="-5" y="-40" width="10" height="42" rx="4" fill="#7A4A22" />
      <g className="g-crown">
        <circle cx="0" cy="-58" r="30" fill="#3E8E47" /><circle cx="-20" cy="-46" r="19" fill="#4FA356" />
        <circle cx="19" cy="-47" r="21" fill="#5DB45E" /><circle cx="-6" cy="-76" r="16" fill="#7CC66C" />
      </g>
      {[[-14, -52], [12, -64], [4, -40], [-2, -70], [20, -44]].map(([x, y], k) => (
        <g key={k} className="g-fruit" transform={`translate(${x} ${y})`}>
          <circle r="5.5" fill="#E23A4B" /><circle cx="-1.8" cy="-1.8" r="1.6" fill="#fff" opacity=".6" />
        </g>
      ))}
    </>
  );
}
function MangoTree() {
  return (
    <>
      <path className="g-trunk" d="M-6,2 L-4,-38 L4,-38 L6,2 Z" fill="#5E3A1E" />
      <g className="g-crown">
        <ellipse cx="0" cy="-56" rx="40" ry="28" fill="#2F7A3A" /><ellipse cx="-18" cy="-48" rx="22" ry="16" fill="#3B8C44" />
        <ellipse cx="18" cy="-50" rx="22" ry="17" fill="#43964B" /><ellipse cx="0" cy="-72" rx="20" ry="12" fill="#56A85A" />
      </g>
      {[[-22, -36], [-4, -32], [16, -36], [28, -44], [-30, -46]].map(([x, y], k) => (
        <g key={k} className="g-fruit" transform={`translate(${x} ${y})`}>
          <path d="M0,-6 V-1" stroke="#3B6B2A" strokeWidth="1.5" />
          <ellipse cy="4" rx="5" ry="7" fill="#F2A541" transform="rotate(-12)" /><ellipse cx="-1.5" cy="2" rx="2.2" ry="3" fill="#E84E3A" opacity=".55" />
        </g>
      ))}
    </>
  );
}
function PotatoPlant() {
  return (
    <>
      <g className="g-trunk">
        <path d="M0,0 C-2,-12 -1,-20 0,-26 M0,-6 C-8,-12 -14,-14 -20,-14 M0,-8 C8,-14 14,-16 20,-16" stroke="#4B8A3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g className="g-crown">
        {[[-18, -18, -30], [18, -20, 30], [-8, -30, -10], [8, -32, 14], [0, -40, 0], [-24, -8, -50], [24, -10, 50]].map(([x, y, r], k) => (
          <ellipse key={k} cx={x} cy={y} rx="9" ry="5.5" fill={k % 2 ? '#5DB45E' : '#4FA356'} transform={`rotate(${r} ${x} ${y})`} />
        ))}
        {[[-6, -44], [6, -42], [0, -48]].map(([x, y], k) => (
          <g key={k} transform={`translate(${x} ${y})`}>{[0, 1, 2, 3, 4].map(p => <circle key={p} cx={Math.cos(p * 1.256) * 2.4} cy={Math.sin(p * 1.256) * 2.4} r="2" fill="#FFFDF6" />)}<circle r="1.3" fill="#F2C94C" /></g>
        ))}
      </g>
      {[[-12, 4], [10, 5]].map(([x, y], k) => (
        <g key={k} className="g-fruit" transform={`translate(${x} ${y})`}>
          <ellipse rx="8" ry="5.5" fill="#C9955A" /><circle cx="-2" cy="-1" r=".9" fill="#8A5A2E" /><circle cx="3" cy="1" r=".9" fill="#8A5A2E" />
        </g>
      ))}
    </>
  );
}
const PLANTS = { apple: AppleTree, mango: MangoTree, potato: PotatoPlant };

function Crate({ x, y, fruit }) {
  const color = { apple: '#E23A4B', mango: '#F2A541', potato: '#C9955A' }[fruit] || '#E23A4B';
  return (
    <g className="g-crate" transform={`translate(${x} ${y})`}>
      {[-9, 0, 9, -4.5, 4.5].map((cx, k) => <circle key={k} cx={cx} cy={k < 3 ? -12 : -18} r="5.5" fill={color} />)}
      <rect x="-16" y="-10" width="32" height="16" rx="3" fill="#D9994F" stroke="#8E5526" strokeWidth="2" />
      <path d="M-14,-2 H14" stroke="#8E5526" strokeWidth="2" />
    </g>
  );
}

export default function MyGarden({ progress, tall = false }) {
  const { H, beds: BEDS } = layout(tall);
  const { t, n, sound } = useSettings();
  const scope = useRef(null);
  const grownIds = GROW.filter(l => isDone(progress, l.id)).map(l => l.id);
  const cratesDone = MARKETS.filter(l => isDone(progress, l.id));

  useGSAP(() => {
    const seen = readSeen();
    const fresh = grownIds.filter(id => !seen.includes(id));
    const beds = gsap.utils.toArray('.g-bed.is-grown', scope.current);
    // the trees you have: a gentle sway, each in its own time
    beds.forEach((b, i) => gsap.to(b.querySelector('.g-plant'), { rotation: 2.2, transformOrigin: '50% 100%', duration: 2 + (i % 3) * .4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * .3 }));
    gsap.to('.g-butterfly', { motionPath: { path: [{ x: 60, y: 130 }, { x: 170, y: 90 }, { x: 240, y: 170 }, { x: 120, y: 200 }, { x: 60, y: 130 }], curviness: 1.4 }, duration: 12, repeat: -1, ease: 'none' });
    gsap.to('.g-wing', { scaleX: .2, transformOrigin: '50% 50%', duration: .12, yoyo: true, repeat: -1 });

    if (!fresh.length) return;
    // the new ones grow, one after another
    const tl = gsap.timeline({ delay: .7, onComplete: () => saveSeen([...new Set([...seen, ...grownIds])]) });
    fresh.forEach((id, k) => {
      const bed = scope.current.querySelector(`.g-bed[data-id="${id}"]`);
      if (!bed) return;
      const trunk = bed.querySelectorAll('.g-trunk'), crown = bed.querySelectorAll('.g-crown'), fruit = bed.querySelectorAll('.g-fruit');
      const at = k * (fresh.length > 2 ? .45 : 2.4);          // many at once (a first visit): nearly together
      gsap.set(trunk, { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(crown, { scale: 0, transformOrigin: '50% 100%' });
      gsap.set(fruit, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(bed.querySelector('.g-mound'), { opacity: 1 });
      tl.to(bed.querySelector('.g-mound'), { scaleY: .6, transformOrigin: '50% 100%', duration: .15, yoyo: true, repeat: 1 }, at)
        .call(() => chime(sound, [392, 523]), null, at)
        .fromTo(bed.querySelectorAll('.g-dirt'), { opacity: 1, x: 0, y: 0 }, { opacity: 0, x: i => (i - 2) * 9, y: -22, duration: .6, ease: 'power2.out', stagger: .02 }, at)
        .to(bed.querySelector('.g-mound'), { opacity: 0, duration: .3 }, at + .3)
        .to(trunk, { scaleY: 1, duration: .6, ease: 'back.out(1.8)' }, at + .2)
        .to(crown, { scale: 1, duration: .8, ease: 'elastic.out(1,.45)' }, at + .65)
        .call(() => chime(sound), null, at + .7)
        .to(fruit, { scale: 1, duration: .5, ease: 'back.out(3.5)', stagger: .09 }, at + 1.1)
        .fromTo(bed.querySelectorAll('.g-spark'), { scale: 0, opacity: 1 }, { scale: 1.8, opacity: 0, duration: .8, stagger: .06, transformOrigin: '50% 50%' }, at + 1.2)
        .call(() => chime(sound, [1047, 1319, 1568, 2093]), null, at + 1.5);
    });
  }, { scope, dependencies: [grownIds.join(',')] });

  const shake = e => {
    const bed = e.currentTarget;
    chime(sound, [660, 880]);
    gsap.fromTo(bed.querySelector('.g-shake'), { rotation: 0 }, { keyframes: { rotation: [0, -8, 7, -5, 3, 0] }, transformOrigin: '50% 100%', duration: .7, ease: 'none' });
    const fruits = bed.querySelectorAll('.g-fruit');
    const f = fruits[Math.floor(Math.random() * fruits.length)];
    if (f) gsap.timeline()
      .to(f, { y: '+=46', duration: .45, ease: 'bounce.out' })
      .to(f, { opacity: 0, duration: .3, delay: .5 })
      .set(f, { y: 0 }).to(f, { opacity: 1, duration: .4, delay: .6 });
  };
  const puff = () => {
    chime(sound, [523, 440]);
    gsap.fromTo(scope.current.querySelectorAll('.house-smoke circle'), { opacity: .85, y: 0, x: 0, scale: .5 }, { opacity: 0, y: -46, x: 10, scale: 1.7, duration: 1.5, stagger: .22, ease: 'power1.out', transformOrigin: '50% 50%' });
  };

  return (
    <section className="garden" ref={scope} aria-label={`${t('gardenTitle')} — ${n(grownIds.length)} / ${n(GROW.length)}`}>
      <div className="garden-tag" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="ic"><rect x="10.5" y="13" width="3" height="8" rx="1.2" fill="#7A4A22" /><circle cx="12" cy="9" r="7" fill="#4FA356" /><circle cx="9" cy="8" r="1.6" fill="#E23A4B" /><circle cx="14.5" cy="10.5" r="1.6" fill="#E23A4B" /></svg>
        <b>{t('gardenTitle')}</b> <span>{n(grownIds.length)} / {n(GROW.length)}</span>
      </div>
      <svg className="garden-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        {/* the lawn behind the house, a wooden fence round it */}
        <path d="M-400,150 C80,126 320,126 800,150 L800,900 L-400,900 Z" fill="#8FCB6C" />
        <path d="M-400,184 C100,164 300,164 800,184 L800,900 L-400,900 Z" fill="#7DBE5E" />
        <g stroke="#B07A45" strokeLinecap="round">
          <path d="M8,148 C90,124 310,124 392,148" strokeWidth="4" fill="none" />
          <path d="M8,160 C90,136 310,136 392,160" strokeWidth="4" fill="none" />
          {Array.from({ length: 14 }, (_, i) => { const x = 14 + i * 28, y = 146 - Math.sin(i / 13 * Math.PI) * 22; return <path key={i} d={`M${x},${y - 12} V${y + 18}`} strokeWidth="5" />; })}
        </g>
        {/* their house, at the back */}
        <g className="g-house" transform="translate(262 34) scale(.95)" onPointerDown={puff}><HouseArt /></g>
        {cratesDone.map((l, i) => <Crate key={l.id} x={300 - i * 22} y={158} fruit={Object.keys(l.order)[i % Object.keys(l.order).length]} />)}

        {/* the beds */}
        {BEDS.map(({ level, x, y, s }) => {
          const grown = grownIds.includes(level.id);
          const Plant = PLANTS[level.fruit] || AppleTree;
          return (
            <g key={level.id} className={`g-bed ${grown ? 'is-grown' : ''}`} data-id={level.id}
              transform={`translate(${x} ${y}) scale(${s})`} onPointerDown={grown ? shake : undefined}>
              <ellipse cx="0" cy="4" rx="26" ry="7" fill="#5A3A22" />
              <ellipse cx="0" cy="3" rx="22" ry="5" fill="#7A5234" />
              {grown ? (
                <g className="g-plant"><g className="g-shake">
                  <Plant />
                  {[0, 1, 2, 3, 4].map(k => <circle key={k} className="g-spark" cx={Math.cos(k * 1.26) * 30} cy={-50 + Math.sin(k * 1.26) * 26} r="4" fill="#FFE7A3" opacity="0" />)}
                </g></g>
              ) : (
                <g className="g-waiting">
                  <ellipse cx="0" cy="-2" rx="9" ry="6" fill="#6B4A2A" />
                  <text x="0" y="-12" textAnchor="middle" className="g-q">?</text>
                </g>
              )}
              {/* the soil that bursts when it grows */}
              <g className="g-mound-wrap">
                <ellipse className="g-mound" cx="0" cy="-2" rx="10" ry="6" fill="#6B4A2A" opacity="0" />
                {[0, 1, 2, 3, 4].map(k => <circle key={k} className="g-dirt" cx={(k - 2) * 3} cy="-4" r="2.4" fill="#7A5836" opacity="0" />)}
              </g>
            </g>
          );
        })}
        {/* a butterfly that lives here */}
        <g className="g-butterfly">
          <ellipse className="g-wing" cx="-5" cy="0" rx="6" ry="4.5" fill="#F7A1C4" /><ellipse className="g-wing" cx="5" cy="0" rx="6" ry="4.5" fill="#F7A1C4" />
          <rect x="-1" y="-5" width="2" height="10" rx="1" fill="#3A2A22" />
        </g>
      </svg>
    </section>
  );
}
