/* بيتي — the child's home: their own garden with every tree they've grown (MyGarden). Reached from the
   house beside the start of the road; the arrow at the top takes them back to the map. */
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useRef } from 'react';
import { useProgress } from '../levels/progress.js';
import { useSettings } from '../settings/SettingsContext.jsx';
import { sfx } from '../settings/sfx.js';
import { Icon } from '../ui/icons.jsx';
import MyGarden from './MyGarden.jsx';

export default function MyHome({ onBack }) {
  const { t, sound } = useSettings();
  const progress = useProgress();
  const scope = useRef(null);

  useGSAP(() => {
    gsap.from('.home-title', { autoAlpha: 0, y: -20, duration: .8, ease: 'back.out(2)' });
    gsap.from('.garden', { autoAlpha: 0, scale: .9, duration: .9, ease: 'expo.out', delay: .1 });
  }, { scope });

  return (
    <main className="home-page" ref={scope}>
      <div className="map-sky" aria-hidden="true">
        <div className="orchard-sun" />
        <svg className="orchard-cloud oc1" viewBox="0 0 200 80"><path d="M20,70 C0,70 0,44 22,42 C22,20 52,12 66,30 C74,8 116,6 124,34 C140,20 170,26 170,48 C192,48 196,70 176,70 Z" /></svg>
        <svg className="orchard-cloud oc2" viewBox="0 0 200 80"><path d="M20,70 C0,70 0,44 22,42 C22,20 52,12 66,30 C74,8 116,6 124,34 C140,20 170,26 170,48 C192,48 196,70 176,70 Z" /></svg>
      </div>
      <button type="button" className="round-btn home-back" aria-label={t('back')} onClick={() => { sfx.pop(sound); onBack(); }}>
        <Icon name="back" />
      </button>
      <h1 className="orchard-title home-title">{t('myHome')}</h1>
      <MyGarden progress={progress} tall={innerHeight > innerWidth * 1.25} />
    </main>
  );
}
