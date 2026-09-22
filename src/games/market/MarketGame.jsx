/* عربية السوق — تملا السلة من الصناديق حسب الورقة اللي على العربية.

   The order comes from the level (levels/levels.js): { apple: 5, potato: 2, mango: 3 }. The crates hold exactly
   those kinds and never run out. Tap a crate and a fruit hops into the basket, or drag one in yourself.
   A kind the note doesn't ask for (or one too many) bounces back to its crate — no loss, just "not that one".
   The fruit are pictures of the same 3D models as on the trees. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { FruitArt } from '../../fruits/art.jsx';
import { fruitPicture } from '../plant/front3d.js';
import { createSeller } from './seller2d.js';
import Seller from './Seller.jsx';
import { useSettings } from '../../settings/SettingsContext.jsx';
import { audioContext } from '../../settings/audio.js';
import { STARS } from '../../levels/levels.js';
import { Icon } from '../../ui/icons.jsx';
import './market.css';

gsap.registerPlugin(useGSAP);

// where fruit sits in the basket, in basket units (260 × 230) — same as the game's basket
const SLOTS = [[72, 118], [110, 120], [150, 120], [188, 118], [92, 96], [130, 98], [170, 96], [112, 74], [150, 74], [131, 54]];
const NAME_KEY = { apple: 'appleName', mango: 'mangoName', potato: 'potatoName' };

/* ---------- little synthesised sounds, on the app's one audio context ---------- */
function makeSounds(isOn) {
  const tone = (f, dur, { type = 'triangle', vol = .1, to = null, delay = 0 } = {}) => {
    const ctx = audioContext();
    if (!isOn() || !ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .05);
  };
  return {
    hop: () => tone(520, .14, { vol: .07, to: 880 }),
    // every fruit that lands sings one note higher: the basket counts with you
    land: n => { const f = 440 * Math.pow(2, Math.min(n, 12) / 12 * 1.5); tone(f, .22, { vol: .12 }); tone(f * 1.5, .18, { vol: .05, delay: .05 }); },
    boing: () => { tone(300, .25, { type: 'sine', vol: .12, to: 150 }); tone(200, .2, { type: 'sine', vol: .08, to: 330, delay: .18 }); },
    row: () => [784, 988, 1175].forEach((f, i) => tone(f, .3, { vol: .07, delay: i * .07 })),
    meow: () => { tone(620, .22, { type: 'sawtooth', vol: .04, to: 880 }); tone(880, .3, { type: 'sawtooth', vol: .035, to: 520, delay: .2 }); },
    cheer: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, .35, { vol: .09, delay: i * .1 })),
    roll: () => { for (let i = 0; i < 8; i++) tone(90 + Math.random() * 40, .08, { type: 'square', vol: .02, delay: i * .09 }); },
  };
}

/* ---------- the pieces of the stall ---------- */
function FruitPic({ id, pics, className = '' }) {
  return pics[id]
    ? <img className={`m-pic ${className}`} src={pics[id]} alt="" draggable="false" />
    : <span className={`m-pic ${className}`}><FruitArt id={id} /></span>;
}

/* the back of the stall: its two poles. The seller stands in front of them, behind the counter. */
function CartBack() {
  return (
    <svg className="m-cart-art" viewBox="0 0 520 380" aria-hidden="true">
      <rect x="54" y="60" width="12" height="220" rx="5" fill="#7A4A22" />
      <rect x="454" y="60" width="12" height="220" rx="5" fill="#7A4A22" />
    </svg>
  );
}

function Cart({ children }) {
  return (
    <svg className="m-cart-art" viewBox="0 0 520 380" aria-hidden="true">
      <defs>
        <linearGradient id="m-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C98A4B" /><stop offset="1" stopColor="#8E5526" /></linearGradient>
        <pattern id="m-stripes" width="64" height="10" patternUnits="userSpaceOnUse">
          <rect width="32" height="10" fill="#D7263D" /><rect x="32" width="32" height="10" fill="#FFF4DF" />
        </pattern>
      </defs>
      {/* the striped awning */}
      <path d="M30,70 L490,70 L470,20 L50,20 Z" fill="url(#m-stripes)" stroke="#1B1F3B" strokeWidth="5" strokeLinejoin="round" />
      <path d="M30,70 q28,34 57,0 q28,34 57,0 q28,34 57,0 q28,34 58,0 q28,34 57,0 q28,34 57,0 q28,34 57,0 q28,34 57,0"
        fill="#D7263D" stroke="#1B1F3B" strokeWidth="5" strokeLinejoin="round" />
      {/* the cart body */}
      <rect x="20" y="236" width="480" height="84" rx="14" fill="url(#m-wood)" stroke="#1B1F3B" strokeWidth="5" />
      <path d="M40,262 H480 M40,292 H480" stroke="#7A4A22" strokeWidth="4" opacity=".6" />
      {/* wheels */}
      <g className="m-wheel" style={{ transformOrigin: '120px 330px' }}>
        <circle cx="120" cy="330" r="42" fill="#5A3418" stroke="#1B1F3B" strokeWidth="5" />
        <circle cx="120" cy="330" r="12" fill="#FFD36E" stroke="#1B1F3B" strokeWidth="4" />
        <path d="M120,292 V368 M82,330 H158 M93,303 L147,357 M147,303 L93,357" stroke="#C98A4B" strokeWidth="5" />
      </g>
      <g className="m-wheel" style={{ transformOrigin: '400px 330px' }}>
        <circle cx="400" cy="330" r="42" fill="#5A3418" stroke="#1B1F3B" strokeWidth="5" />
        <circle cx="400" cy="330" r="12" fill="#FFD36E" stroke="#1B1F3B" strokeWidth="4" />
        <path d="M400,292 V368 M362,330 H438 M373,303 L427,357 M427,303 L373,357" stroke="#C98A4B" strokeWidth="5" />
      </g>
      {children}
    </svg>
  );
}

function Crate({ id, pics, label, onPointerDown, hint }) {
  return (
    <button type="button" className={`m-crate ${hint ? 'is-hint' : ''}`} aria-label={label} onPointerDown={onPointerDown}>
      <span className="m-crate-pile" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map(k => <FruitPic key={k} id={id} pics={pics} className={`m-pile m-pile-${k}`} />)}
      </span>
      <svg className="m-crate-front" viewBox="0 0 200 120" aria-hidden="true">
        <rect x="6" y="10" width="188" height="104" rx="10" fill="#D9994F" stroke="#1B1F3B" strokeWidth="5" />
        <path d="M14,44 H186 M14,78 H186" stroke="#8E5526" strokeWidth="6" />
        <path d="M22,16 V110 M178,16 V110" stroke="#B97436" strokeWidth="8" />
        <rect x="64" y="50" width="72" height="22" rx="6" fill="#FFF4DF" stroke="#1B1F3B" strokeWidth="3" />
      </svg>
      <span className="m-crate-tag">{label}</span>
    </button>
  );
}

function Basket({ items, pics, bodyRef }) {
  return (
    <div className="m-basket-body" ref={bodyRef}>
      <svg className="m-b-back" viewBox="0 0 260 230" aria-hidden="true">
        <ellipse cx="130" cy="222" rx="96" ry="8" fill="#000" opacity=".18" />
        <path d="M36,104 C36,8 224,8 224,104" fill="none" stroke="#8E5526" strokeWidth="12" strokeLinecap="round" />
        <path d="M36,104 C36,8 224,8 224,104" fill="none" stroke="#D9994F" strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" />
        <ellipse cx="130" cy="104" rx="112" ry="28" fill="#5A3418" />
        <path d="M18,104 A112,28 0 0 1 242,104" fill="none" stroke="#B97436" strokeWidth="12" />
      </svg>
      <div className="m-b-fruits">
        {items.map((it, i) => (
          <span key={it.key} className="m-b-fruit" data-key={it.key}
            style={{ left: `${(SLOTS[i][0] - 34) / 260 * 100}%`, top: `${(SLOTS[i][1] - 36.8) / 230 * 100}%`, rotate: `${it.tilt}deg` }}>
            <FruitPic id={it.id} pics={pics} />
          </span>
        ))}
      </div>
      <svg className="m-b-front" viewBox="0 0 260 230" aria-hidden="true">
        <defs>
          <linearGradient id="m-wicker" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6A862" /><stop offset="1" stopColor="#9C5E2A" /></linearGradient>
          <clipPath id="m-c-basket"><path d="M18,104 A112,28 0 0 0 242,104 L214,214 Q130,236 46,214 Z" /></clipPath>
        </defs>
        <path d="M18,104 A112,28 0 0 0 242,104 L214,214 Q130,236 46,214 Z" fill="url(#m-wicker)" />
        <g clipPath="url(#m-c-basket)" fill="none">
          <g stroke="#8E5526" strokeWidth="4" opacity=".5">
            <path d="M0,156 Q130,188 260,156" /><path d="M0,182 Q130,212 260,182" /><path d="M0,206 Q130,236 260,206" />
            <path d="M52,120 L64,226" /><path d="M78,126 L86,228" /><path d="M104,130 L108,230" /><path d="M130,132 L130,232" />
            <path d="M156,130 L152,230" /><path d="M182,126 L174,228" /><path d="M208,120 L196,226" />
          </g>
        </g>
        <path d="M18,104 A112,28 0 0 0 242,104" fill="none" stroke="#8E5526" strokeWidth="14" strokeLinecap="round" />
        <path d="M24,108 A106,25 0 0 0 236,108" fill="none" stroke="#DDA15A" strokeWidth="4" strokeDasharray="12 9" />
      </svg>
    </div>
  );
}

function Cat({ onPet, found }) {
  return (
    <button type="button" className={`m-cat ${found ? 'is-found' : ''}`} aria-label="🐱" onPointerDown={onPet}>
      <svg viewBox="0 0 120 90" aria-hidden="true">
        <path d="M22,60 C18,30 36,16 60,16 C84,16 102,30 98,60 Z" fill="#F2A541" stroke="#1B1F3B" strokeWidth="4" />
        <path d="M30,30 L26,4 L48,20 Z M90,30 L94,4 L72,20 Z" fill="#F2A541" stroke="#1B1F3B" strokeWidth="4" strokeLinejoin="round" />
        <path d="M34,20 L32,10 L42,17 Z M86,20 L88,10 L78,17 Z" fill="#FF9FB0" />
        <g className="m-cat-eyes">
          <ellipse cx="46" cy="40" rx="5" ry="7" fill="#1B1F3B" /><ellipse cx="74" cy="40" rx="5" ry="7" fill="#1B1F3B" />
          <circle cx="48" cy="37" r="1.8" fill="#fff" /><circle cx="76" cy="37" r="1.8" fill="#fff" />
        </g>
        <path d="M56,50 L64,50 L60,55 Z" fill="#FF7A8A" />
        <path d="M60,55 Q54,61 50,57 M60,55 Q66,61 70,57" fill="none" stroke="#1B1F3B" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M36,52 H18 M36,56 L20,60 M84,52 H102 M84,56 L100,60" stroke="#1B1F3B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" /></svg>
);

/* =====================================================================
   the scene
   ===================================================================== */
export default function MarketGame({ level, onExit, onReplay, onDone, onNext }) {
  const { t, n, lang, setLang, sound, setSound } = useSettings();
  const order = level.order;
  const kinds = Object.keys(order);
  const total = kinds.reduce((s, k) => s + order[k], 0);

  const [pics, setPics] = useState({});
  const [counts, setCounts] = useState(() => Object.fromEntries(kinds.map(k => [k, 0])));
  const [items, setItems] = useState([]);
  const [phase, setPhase] = useState('arrive');           // arrive → play → done
  const [bubble, setBubble] = useState('marketHello');
  const [friend, setFriend] = useState(false);
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(null);

  const scope = useRef(null), basketRef = useRef(null), flyRef = useRef(null), noteRef = useRef(null);
  const sellerSvg = useRef(null), seller = useRef(null);
  const tell = what => seller.current?.say(what);
  const live = useRef({ counts, mistakes: 0, busy: 0, friend: false, landed: 0, phase: 'arrive', touched: false });
  live.current.counts = counts;
  const soundOn = useRef(sound);
  soundOn.current = sound;
  const sfx = useRef(null);
  if (!sfx.current) sfx.current = makeSounds(() => soundOn.current);

  useEffect(() => {
    const s = createSeller(sellerSvg.current);
    seller.current = s;
    // his eyes follow the child's finger
    const follow = e => s.look(e.clientX, e.clientY);
    addEventListener('pointermove', follow);
    addEventListener('pointerdown', follow);
    return () => { removeEventListener('pointermove', follow); removeEventListener('pointerdown', follow); s.dispose(); seller.current = null; };
  }, []);

  // the fruit pictures come from the 3D models; until they're ready the drawings stand in
  useEffect(() => {
    let alive = true;
    kinds.forEach(id => fruitPicture(id).then(url => { if (alive && url) setPics(p => ({ ...p, [id]: url })); }));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { contextSafe } = useGSAP(() => {
    // the cart rolls in, the crates slide up, the seller says hello
    const tl = gsap.timeline({ onComplete: () => { live.current.phase = 'play'; setPhase('play'); } });
    tl.from('.m-sky, .m-hills path', { autoAlpha: 0, duration: .6, stagger: .08 })
      .from('.m-cart', { xPercent: -130, duration: 1.4, ease: 'power3.out' }, .2)
      .from('.m-wheel', { rotation: -540, duration: 1.4, ease: 'power3.out' }, .2)
      .call(() => sfx.current.roll(), null, .25)
      .from('.m-note', { scale: 0, rotation: -20, duration: .7, ease: 'back.out(2.5)' }, 1.3)
      .from('.m-bubble', { scale: 0, duration: .5, ease: 'back.out(3)' }, 1.5)
      .call(() => tell('hello'), null, 1.4)
      .from('.m-crate', { yPercent: 120, duration: .8, stagger: .12, ease: 'back.out(1.6)' }, .9)
      .from('.m-basket', { scale: 0, duration: .8, ease: 'elastic.out(1,.55)' }, 1.2)
      .from('.m-cat', { yPercent: 100, duration: .6, ease: 'back.out(2)' }, 2.2);
    gsap.to('.m-cat-eyes', { scaleY: .1, transformOrigin: '50% 50%', duration: .08, yoyo: true, repeat: 1, repeatDelay: 3, delay: 3, repeatRefresh: true });
  }, { scope });

  /* if nobody has touched anything for a while, the crate that is still needed wiggles */
  useEffect(() => {
    if (phase !== 'play') return;
    const timer = setInterval(() => {
      if (live.current.touched) return;
      const k = kinds.find(id => live.current.counts[id] < order[id]);
      setHint(k || null);
      if (k) tell('give');
    }, 2600);
    return () => clearInterval(timer);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- a fruit leaves its crate ---------- */
  const grab = contextSafe((id, e) => {
    if (live.current.phase !== 'play') return;
    e.preventDefault();
    live.current.touched = true;
    setHint(null);
    sfx.current.hop();
    const layer = flyRef.current, crate = e.currentTarget, cr = crate.getBoundingClientRect(), lr = layer.getBoundingClientRect();
    const size = Math.min(cr.width * .44, 96);
    const el = document.createElement('div');
    el.className = 'm-fly';
    el.innerHTML = pics[id] ? `<img src="${pics[id]}" alt="" draggable="false">` : crate.querySelector('.m-pile').outerHTML;
    Object.assign(el.style, { width: `${size}px`, height: `${size * 260 / 240}px` });
    layer.append(el);
    const start = { x: cr.left + cr.width / 2 - lr.left - size / 2, y: cr.top + cr.height * .2 - lr.top - size / 2 };
    gsap.set(el, { x: start.x, y: start.y });
    gsap.fromTo(el, { scale: .6 }, { scale: 1.15, duration: .2, ease: 'back.out(3)' });
    gsap.fromTo(crate.querySelector('.m-crate-pile'), { y: 0 }, { y: -8, duration: .1, yoyo: true, repeat: 1 });

    // tap = it hops into the basket by itself; drag = it follows the finger and goes where it's dropped
    const from = { x: e.clientX, y: e.clientY };
    let dragging = false;
    const move = ev => {
      if (!dragging && Math.hypot(ev.clientX - from.x, ev.clientY - from.y) < 10) return;
      dragging = true;
      gsap.set(el, { x: ev.clientX - lr.left - size / 2, y: ev.clientY - lr.top - size / 2 });
      const br = basketRef.current.getBoundingClientRect();
      basketRef.current.classList.toggle('is-over', ev.clientX > br.left && ev.clientX < br.right && ev.clientY > br.top && ev.clientY < br.bottom);
    };
    const up = ev => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      basketRef.current.classList.remove('is-over');
      const br = basketRef.current.getBoundingClientRect();
      const over = !dragging || (ev.clientX > br.left - 20 && ev.clientX < br.right + 20 && ev.clientY > br.top - 40 && ev.clientY < br.bottom);
      if (over) toBasket(el, id, size);
      else backToCrate(el, crate, size, lr);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });

  const backToCrate = (el, crate, size, lr) => {
    const cr = crate.getBoundingClientRect();
    gsap.to(el, {
      x: cr.left + cr.width / 2 - lr.left - size / 2, y: cr.top + cr.height * .25 - lr.top - size / 2,
      scale: .5, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: () => el.remove(),
    });
  };

  /* ---------- into the basket: the note decides if it stays ---------- */
  const toBasket = contextSafe((el, id, size) => {
    const layer = flyRef.current, lr = layer.getBoundingClientRect(), br = basketRef.current.getBoundingClientRect();
    const x0 = gsap.getProperty(el, 'x'), y0 = gsap.getProperty(el, 'y');
    const x1 = br.left + br.width / 2 - lr.left - size / 2, y1 = br.top + br.height * .28 - lr.top - size / 2;
    const peak = Math.min(y0, y1) - 120;
    live.current.busy++;
    gsap.timeline({ onComplete: () => { live.current.busy--; land(el, id); } })
      .to(el, { x: (x0 + x1) / 2, y: peak, duration: .28, ease: 'power2.out' })
      .to(el, { x: x1, y: y1, duration: .3, ease: 'power2.in' })
      .to(el, { rotation: '+=360', duration: .58, ease: 'none' }, 0);
  });

  const land = contextSafe((el, id) => {
    const c = live.current.counts;
    const need = order[id] || 0;
    if ((c[id] || 0) >= need) {                 // not on the note, or already enough of it: back it goes
      live.current.mistakes++;
      sfx.current.boing();
      setBubble(need ? 'marketEnough' : 'marketNotThis');
      tell('no');
      gsap.fromTo(basketRef.current, { x: 0 }, { keyframes: { x: [0, -10, 9, -6, 4, 0] }, duration: .45, ease: 'none' });
      gsap.fromTo(noteRef.current, { rotation: 0 }, { keyframes: { rotation: [0, -3, 3, -2, 0] }, duration: .5, ease: 'none' });
      gsap.to(el, {
        keyframes: [{ y: '-=90', x: '+=60', rotation: '+=120', duration: .3, ease: 'power2.out' },
          { y: '+=260', x: '+=40', rotation: '+=160', autoAlpha: 0, duration: .5, ease: 'power2.in' }],
        onComplete: () => el.remove(),
      });
      return;
    }
    el.remove();
    const next = { ...c, [id]: c[id] + 1 };
    live.current.counts = next;
    live.current.landed++;
    setCounts(next);
    setItems(list => [...list, { key: `${id}-${list.length}-${Date.now()}`, id, tilt: Math.round(Math.random() * 40 - 20) }]);
    sfx.current.land(live.current.landed);
    popNumber(next[id], id);
    gsap.fromTo(basketRef.current, { scaleX: 1.12, scaleY: .88 }, { scaleX: 1, scaleY: 1, duration: .7, ease: 'elastic.out(1,.35)', transformOrigin: '50% 100%' });
    if (next[id] === need) {
      sfx.current.row();
      setBubble('marketRowDone');
      tell('row');
      gsap.fromTo(`.m-row-${id}`, { scale: 1 }, { scale: 1.12, duration: .18, yoyo: true, repeat: 1, ease: 'power2.out' });
    } else setBubble(null);
    if (kinds.every(k => next[k] >= order[k])) finish();
  });

  /* the count floats up over the basket, big: the child counts along */
  const popNumber = (value, id) => {
    const layer = flyRef.current, lr = layer.getBoundingClientRect(), br = basketRef.current.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `m-count m-count-${id}`;
    el.textContent = n(value);
    layer.append(el);
    gsap.set(el, { x: br.left + br.width / 2 - lr.left, y: br.top - lr.top, xPercent: -50, yPercent: -50 });
    gsap.timeline({ onComplete: () => el.remove() })
      .fromTo(el, { scale: .2, autoAlpha: 0 }, { scale: 1.3, autoAlpha: 1, duration: .3, ease: 'back.out(3)' })
      .to(el, { y: '-=60', autoAlpha: 0, duration: .6, ease: 'power1.in' }, .45);
  };

  /* ---------- the hidden friend ---------- */
  const petCat = contextSafe(e => {
    e.preventDefault();
    sfx.current.meow();
    tell('yes');
    live.current.friend = true;
    setFriend(true);
    gsap.fromTo('.m-cat svg', { y: 0 }, { y: -26, duration: .2, yoyo: true, repeat: 1, ease: 'power2.out' });
    hearts(e.currentTarget, 8);
  });

  const hearts = (from, count) => {
    const layer = flyRef.current, lr = layer.getBoundingClientRect(), r = from.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const h = document.createElement('div');
      h.className = 'm-heart';
      h.textContent = i % 3 ? '♥' : '★';
      layer.append(h);
      gsap.set(h, { x: r.left + r.width / 2 - lr.left, y: r.top + r.height / 3 - lr.top });
      gsap.to(h, {
        x: `+=${Math.random() * 160 - 80}`, y: `-=${80 + Math.random() * 120}`, rotation: Math.random() * 60 - 30,
        autoAlpha: 0, duration: 1 + Math.random() * .6, ease: 'power1.out', onComplete: () => h.remove(),
      });
    }
  };

  /* ---------- the order is full ---------- */
  const finish = contextSafe(() => {
    live.current.phase = 'done';
    setPhase('done');
    setBubble('marketThanks');
    tell('thanks');
    const won = { order: true, right: live.current.mistakes === 0, friend: live.current.friend };
    const stars = STARS.market.filter(k => won[k]).length;
    onDone && onDone({ stars, won });
    sfx.current.cheer();
    hearts(noteRef.current, 14);
    const layer = flyRef.current, lr = layer.getBoundingClientRect();
    for (let i = 0; i < 40; i++) {                  // confetti
      const c = document.createElement('div');
      c.className = 'm-confetti';
      c.style.background = ['#D7263D', '#FFD36E', '#2C7A47', '#5BB3E6', '#F7A1C4', '#F2A541'][i % 6];
      layer.append(c);
      gsap.set(c, { x: lr.width / 2, y: lr.height * .45, rotation: Math.random() * 360 });
      gsap.to(c, {
        x: `+=${(Math.random() - .5) * lr.width}`, y: `+=${(Math.random() - .7) * lr.height * .8}`,
        rotation: `+=${Math.random() * 720}`, duration: 1.2 + Math.random(), ease: 'power2.out',
      });
      gsap.to(c, { autoAlpha: 0, duration: .5, delay: 1.4 + Math.random() * .6, onComplete: () => c.remove() });
    }
    // the stamp on the note, the basket hops up onto the cart, and off it rolls
    gsap.timeline({ onComplete: () => setResult({ stars, won }) })
      .fromTo('.m-stamp', { scale: 3, autoAlpha: 0, rotation: -30 }, { scale: 1, autoAlpha: 1, rotation: -12, duration: .45, ease: 'back.out(2)' }, .1)
      .to('.m-basket', { y: () => -(basketRef.current.getBoundingClientRect().top - noteRef.current.getBoundingClientRect().bottom) * .6, scale: .7, duration: .6, ease: 'power2.out' }, 1)
      .to('.m-basket', { autoAlpha: 0, duration: .25 }, 1.55)
      .call(() => { sfx.current.roll(); tell('bye'); }, null, 1.7)
      .to('.m-cart', { xPercent: 140, duration: 1.4, ease: 'power2.in' }, 1.7)
      .to('.m-wheel', { rotation: '+=720', duration: 1.4, ease: 'power2.in' }, 1.7);
  });

  useGSAP(() => {
    if (!result) return;
    gsap.from('.m-finale', { scale: .5, rotation: -8, autoAlpha: 0, duration: .9, ease: 'elastic.out(1,.6)' });
    gsap.from('.m-finale .m-star', { scale: 0, rotation: -40, duration: .7, stagger: .18, ease: 'back.out(3)', delay: .35 });
  }, { scope, dependencies: [result] });

  const left = useCallback(id => order[id] - (counts[id] || 0), [order, counts]);
  const rowDone = id => counts[id] >= order[id];

  return (
    <main className="market" ref={scope}>
      <div className="m-sky" />
      <svg className="m-hills" viewBox="0 0 1600 360" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,170 C240,90 520,130 780,150 C1060,172 1300,96 1600,130 L1600,360 L0,360 Z" fill="#B5DC8E" />
        <path d="M0,240 C300,180 600,236 900,226 C1200,216 1400,190 1600,214 L1600,360 L0,360 Z" fill="#86C46A" />
        <path d="M0,300 C360,268 760,310 1100,294 C1360,282 1500,296 1600,290 L1600,360 L0,360 Z" fill="#5DAA56" />
      </svg>

      <div className="m-hud">
        <button type="button" className="round-btn" aria-label={t('home')} onClick={onExit}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" /><path d="M9 4v13.5M15 6.5V20" fill="none" stroke="currentColor" strokeWidth="2.3" /></svg>
        </button>
        <button type="button" className="round-btn" aria-pressed={sound} aria-label={t('soundAria')} onClick={() => setSound(!sound)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            {sound
              ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              : <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
        <button type="button" className="round-btn lang-btn" aria-label={t('langAria')} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>
      </div>

      <div className="m-stage">
        {/* the cart, with the order pinned to it and the seller's voice in a bubble */}
        <section className="m-cart"><div className="m-cart-box">
          <CartBack />
          <Seller svgRef={sellerSvg} />
          <Cart />
          <div className="m-note" ref={noteRef} role="list" aria-label={t('orderTitle')}>
            <p className="m-note-head">{t('marketNote')}</p>
            {kinds.map(id => (
              <div key={id} role="listitem" className={`m-row m-row-${id} ${rowDone(id) ? 'is-done' : ''}`}
                aria-label={`${n(order[id])} ${t(NAME_KEY[id])}${rowDone(id) ? ' ✓' : ''}`}>
                <FruitPic id={id} pics={pics} className="m-row-pic" />
                <b className="m-row-n">{n(order[id])}</b>
                <span className="m-pips" aria-hidden="true">
                  {Array.from({ length: order[id] }, (_, k) => <i key={k} className={k < counts[id] ? 'on' : ''} />)}
                </span>
                {rowDone(id) && <span className="m-tick" aria-hidden="true">✓</span>}
              </div>
            ))}
            <span className="m-stamp" aria-hidden="true">{t('marketStamp')}</span>
          </div>
          {bubble && <p className="m-bubble" key={bubble}>{t(bubble)}</p>}
          <Cat onPet={petCat} found={friend} />
        </div></section>

        <section className="m-basket">
          <div className="m-basket-box" ref={basketRef} aria-label={`${n(items.length)} / ${n(total)}`}>
            <Basket items={items} pics={pics} />
            <span className="m-basket-tag"><b>{n(items.length)}</b> {t('of')} {n(total)}</span>
          </div>
        </section>

        <section className="m-crates" style={{ '--n': kinds.length }}>
          {kinds.map(id => (
            <Crate key={id} id={id} pics={pics} label={t(NAME_KEY[id])} hint={hint === id && left(id) > 0}
              onPointerDown={e => grab(id, e)} />
          ))}
        </section>
      </div>

      <div className="m-fly-layer" ref={flyRef} aria-hidden="true" />

      {result && (
        <div className="m-finale" role="dialog" aria-labelledby="m-finale-title">
          <h2 id="m-finale-title">{t('marketDone')}</h2>
          <p>{t('marketDoneSub')}</p>
          <div className="m-stars">
            {STARS.market.map(k => (
              <span key={k} className={`m-star ${result.won[k] ? 'won' : ''}`}
                aria-label={`${t('star_' + k)}${result.won[k] ? '' : ` — ${t('starMissed')}`}`}><Star /></span>
            ))}
          </div>
          <div className="m-actions">
            {onNext && <button type="button" className="m-next" onClick={onNext}><Icon name="next" />{t('nextLevel')}</button>}
            <button type="button" className="m-replay" onClick={onReplay}><Icon name="again" />{t('marketAgain')}</button>
            <button type="button" className="m-home" onClick={onExit}><Icon name="map" />{t('home')}</button>
          </div>
        </div>
      )}
    </main>
  );
}
