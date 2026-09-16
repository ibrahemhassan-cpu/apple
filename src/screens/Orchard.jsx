import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { FRUITS } from '../fruits/registry.js';
import { FruitArt } from '../fruits/art.jsx';
import { useSettings } from '../settings/SettingsContext.jsx';
import { sfx } from '../settings/sfx.js';
import TopBar from './TopBar.jsx';
import SeedCard from './SeedCard.jsx';

gsap.registerPlugin(useGSAP);

export default function Orchard({ onPlay }) {
  const { t, sound } = useSettings();
  const [open, setOpen] = useState(null);
  const scope = useRef(null);

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.orchard-eyebrow', { autoAlpha: 0, y: 16, duration: .8 })
      .from('.orchard-title', { autoAlpha: 0, yPercent: 40, rotationX: -70, transformPerspective: 700, duration: 1.1 }, .08)
      .from('.plot', { autoAlpha: 0, y: 70, scale: .85, duration: 1.1, stagger: .12, ease: 'back.out(1.6)' }, .25)
      .from('.hills path', { yPercent: 40, duration: 1.4, stagger: .1 }, 0);
    // the playable plots breathe; the locked ones stay still
    gsap.to('.plot.is-open .plot-art', { y: -8, rotation: 3, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: .4 });
  }, { scope });

  const choose = (fruit, el) => {
    if (!fruit.playable) {
      sfx.soft(sound);
      gsap.fromTo(el, { rotation: 0 }, { keyframes: { rotation: [0, -4, 4, -2, 0] }, duration: .45, ease: 'none' });
      return;
    }
    sfx.open(sound);
    setOpen(fruit);
  };

  return (
    <main className="orchard" ref={scope}>
      <div className="orchard-sky" aria-hidden="true">
        <div className="orchard-sun" />
        <svg className="orchard-cloud oc1" viewBox="0 0 200 80"><path d="M20,70 C0,70 0,44 22,42 C22,20 52,12 66,30 C74,8 116,6 124,34 C140,20 170,26 170,48 C192,48 196,70 176,70 Z" /></svg>
        <svg className="orchard-cloud oc2" viewBox="0 0 200 80"><path d="M20,70 C0,70 0,44 22,42 C22,20 52,12 66,30 C74,8 116,6 124,34 C140,20 170,26 170,48 C192,48 196,70 176,70 Z" /></svg>
      </div>
      <svg className="hills" viewBox="0 0 1600 360" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,170 C240,90 520,130 780,150 C1060,172 1300,96 1600,130 L1600,360 L0,360 Z" fill="#B5DC8E" />
        <path d="M0,240 C300,180 600,236 900,226 C1200,216 1400,190 1600,214 L1600,360 L0,360 Z" fill="#86C46A" />
        <path d="M0,300 C360,268 760,310 1100,294 C1360,282 1500,296 1600,290 L1600,360 L0,360 Z" fill="#5DAA56" />
      </svg>

      <TopBar />

      <header className="orchard-head">
        <p className="orchard-eyebrow">{t('orchardSub')}</p>
        <h1 className="orchard-title">{t('orchardTitle')}</h1>
      </header>

      <ul className="plots">
        {FRUITS.map(fruit => (
          <li key={fruit.id}>
            <button
              type="button"
              className={`plot ${fruit.playable ? 'is-open' : 'is-locked'}`}
              style={{ '--glow': fruit.glow }}
              aria-disabled={!fruit.playable}
              aria-label={fruit.playable ? t(fruit.text.name) : `${t(fruit.text.name)} — ${t('comingSoon')}`}
              onClick={e => choose(fruit, e.currentTarget)}
              onPointerEnter={() => fruit.playable && sfx.pop(sound)}
            >
              <span className="plot-window">
                <span className="plot-art"><FruitArt id={fruit.id} /></span>
                {!fruit.playable && <span className="plot-ribbon">{t('comingSoon')}</span>}
              </span>
              <span className="plot-sign">{t(fruit.text.name)}</span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <SeedCard
          fruit={open}
          onClose={() => setOpen(null)}
          onPlay={() => onPlay(open.id)}
        />
      )}
    </main>
  );
}
