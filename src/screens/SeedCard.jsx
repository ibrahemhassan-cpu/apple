import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { FruitArt, SeedArt } from '../fruits/art.jsx';
import { useSettings } from '../settings/SettingsContext.jsx';
import { Icon } from '../ui/icons.jsx';
import { sfx } from '../settings/sfx.js';

/* what you're about to grow: the fruit, the seed hiding inside it, how it grows,
   what this level asks the basket for, and the new thing you'll learn in it */
export default function SeedCard({ level, fruit, onClose, onPlay }) {
  const { t, n, sound } = useSettings();
  const scope = useRef(null);
  const playBtn = useRef(null);

  const { contextSafe } = useGSAP(() => {
    gsap.timeline()
      .from('.seed-backdrop', { autoAlpha: 0, duration: .3 })
      .from('.seed-card', { yPercent: 30, autoAlpha: 0, scale: .92, duration: .7, ease: 'back.out(1.5)' }, 0)
      .from('.seed-fruit', { scale: 0, rotation: -30, duration: .8, ease: 'elastic.out(1,.55)' }, .15)
      .from('.seed-arrow', { autoAlpha: 0, scaleX: 0, duration: .4, ease: 'power2.out' }, .45)
      .from('.seed-seed', { scale: 0, y: -30, duration: .7, ease: 'back.out(3)' }, .55)
      .from('.seed-card .reveal', { autoAlpha: 0, y: 12, duration: .5, stagger: .06 }, .35)
      .call(() => playBtn.current?.focus({ preventScroll: true }));   // hidden elements can't take focus, so wait for the reveal
    gsap.to('.seed-seed', { y: -6, duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
  }, { scope });

  const close = contextSafe(() => {
    sfx.soft(sound);
    gsap.timeline({ onComplete: onClose })
      .to('.seed-card', { yPercent: 25, autoAlpha: 0, duration: .3, ease: 'power2.in' })
      .to('.seed-backdrop', { autoAlpha: 0, duration: .25 }, .05);
  });

  const play = contextSafe(() => {
    sfx.open(sound);
    gsap.timeline({ onComplete: onPlay })
      .to('.seed-seed', { scale: 1.5, duration: .25, ease: 'back.out(3)' })
      .to('.seed-card', { scale: 1.06, autoAlpha: 0, duration: .35, ease: 'power2.in' }, .15)
      .to('.seed-backdrop', { autoAlpha: 0, duration: .3 }, .2);
  });

  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closeRef.current(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="seed-layer" ref={scope}>
      <div className="seed-backdrop" onClick={close} />
      <section className="seed-card" role="dialog" aria-modal="true" aria-labelledby="seed-card-title" style={{ '--glow': fruit.glow }}>
        <button type="button" className="round-btn seed-close" aria-label={t('close')} onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
        </button>

        <div className="seed-journey" aria-hidden="true">
          <span className="seed-fruit"><FruitArt id={fruit.id} /></span>
          <svg className="seed-arrow" viewBox="0 0 60 24"><path d="M4 12h46M40 4l10 8-10 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="seed-seed"><SeedArt id={fruit.id} /></span>
        </div>

        <h2 id="seed-card-title" className="seed-name reveal">{t(fruit.text.name)}</h2>
        <p className="seed-kind reveal">{t(fruit.text.seed)}</p>
        <p className="seed-fact reveal">{t(fruit.text.fact)}</p>

        <div className="order reveal">
          <p className="order-head">{t('orderTitle')} <b>{n(level.order)}</b></p>
          <p className="order-icons" aria-hidden="true">
            {Array.from({ length: level.order }, (_, i) => (
              <span key={i} className="order-one"><FruitArt id={fruit.id} /></span>
            ))}
          </p>
        </div>
        <p className="learn reveal"><span aria-hidden="true">✨</span> {t(level.learn)}</p>

        <button type="button" className="play-btn reveal" ref={playBtn} onClick={play}>
          <Icon name="plant" />{t('plantIt')}
        </button>
      </section>
    </div>
  );
}
