/* بستان التفاحة — the story */
let state = 'boot';
let landed = 0, reserved = 0, touched = false;
const basketBody = $('.basket-body');

/* ---------- captions (keys, so the language can flip any time) ---------- */
let capSplit = null, capKeys = null;
function setCaptionKeys(titleKey, subKey) {
  capKeys = { titleKey, subKey };
  return setCaption(titleKey ? t(titleKey) : '', subKey ? t(subKey) : '');
}
async function setCaption(text, sub = '') {
  const cap = $('#caption'), subEl = $('#subcaption');
  if (capSplit) {
    gsap.to(subEl, { autoAlpha: 0, y: -6, duration: .25 });
    await gsap.to(capSplit.words, { y: -24, autoAlpha: 0, duration: .3, ease: 'power2.in', stagger: .03 });
    capSplit.revert(); capSplit = null;
  }
  else if (subEl.textContent) await gsap.to(subEl, { autoAlpha: 0, y: -6, duration: .25 });
  cap.textContent = text;
  subEl.textContent = sub;
  if (text) {
    capSplit = new SplitText(cap, { type: 'words', wordsClass: 'word' });
    gsap.from(capSplit.words, { y: 34, autoAlpha: 0, rotation: () => rand(-10, 10), duration: .8, ease: 'back.out(2.4)', stagger: .07 });
  }
  if (sub) gsap.fromTo(subEl, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .6, delay: text ? .35 : 0, ease: 'power3.out' });
}

/* ---------- intro ---------- */
function measureOrbit() {
  const r = $('#apple-btn').getBoundingClientRect();
  sky.orbitX = r.left + r.width / 2; sky.orbitY = r.top + r.height / 2; sky.orbitR = r.width * .78;
}
function intro() {
  state = 'intro';
  measureOrbit();
  const split = titleSplit = new SplitText('#title', { type: 'words', wordsClass: 'word' });
  gsap.set(split.words, { transformPerspective: 700, transformOrigin: '50% 100%' });
  const tl = gsap.timeline({ delay: .15 });
  tl.from('.eyebrow', { autoAlpha: 0, y: 14, duration: .9, ease: 'power3.out' })
    .from(split.words, { yPercent: 60, rotationX: -80, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .14 }, .1)
    .from('#apple-btn', { scale: .3, autoAlpha: 0, rotation: -25, duration: 1.6, ease: 'elastic.out(1,.5)' }, .35)
    .from('#tap-hint', { autoAlpha: 0, y: 12, duration: .7 }, 1.2)
    .from(sky, { orbit: 0, duration: 1.5 }, .4);

  const rx = gsap.quickTo('.apple-tilt', 'rotationX', { duration: .9, ease: 'power3' });
  const ry = gsap.quickTo('.apple-tilt', 'rotationY', { duration: .9, ease: 'power3' });
  addEventListener('pointermove', e => {
    const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
    if (state === 'intro') { ry(nx * 34); rx(-ny * 34); }
    if (!reduceMotion) parTo(-nx * 26);
  });
  $('#apple-btn').addEventListener('mouseenter', () => state === 'intro' && gsap.to('.apple-squash', { scale: 1.06, duration: .5, ease: 'back.out(3)' }));
  $('#apple-btn').addEventListener('mouseleave', () => state === 'intro' && gsap.to('.apple-squash', { scale: 1, duration: .5 }));
  $('#apple-btn').addEventListener('click', () => { if (state === 'intro') story(); });
}

function openApple() {
  state = 'opening';
  Sound.init(); Sound.magic();
  $('.apple-float').style.animationPlayState = 'paused';
  const r = $('#apple-btn').getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height * .52;
  gsap.set('#seed', { x: cx - 17, y: cy - 25, scale: 0, autoAlpha: 0 });
  gsap.set('.flash', { xPercent: -50, yPercent: -50, scale: .2 });
  gsap.set('.crack path', { drawSVG: '0%' });

  const tl = gsap.timeline();
  tl.to(['.eyebrow', '#title', '#tap-hint'], { autoAlpha: 0, y: -40, duration: .6, ease: 'power2.in', stagger: .06 }, 0)
    .to('.apple-shadow', { autoAlpha: 0, duration: .5 }, 0)
    .to('#levels', { autoAlpha: 0, y: -18, duration: .5, ease: 'power2.in' }, 0)   // the level is chosen before we start
    .to('.apple-tilt', { rotationX: 0, rotationY: 0, duration: .5, ease: 'power2.out' }, 0)
    .to('.apple-squash', { scaleX: 1.16, scaleY: .84, duration: .28, ease: 'power2.out' }, 0)
    .to('.apple-squash', { scaleX: 1, scaleY: 1, duration: 1, ease: 'elastic.out(1.2,.3)' }, .28)
    .to('.apple-squash', { keyframes: { rotation: [0, -9, 8, -6, 5, -3, 0] }, duration: .8, ease: 'none' }, .35)
    .to('.apple-glow', { scale: 1.5, opacity: 1, duration: 1.3, ease: 'power2.out' }, 0)
    .to(sky, { orbitR: sky.orbitR * .55, duration: 1.3, ease: 'power2.in' }, 0)
    .set('.crack', { visibility: 'visible' }, 1)
    .to('.crack path', { drawSVG: '100%', duration: .45, ease: 'power2.inOut' }, 1)
    .call(() => Sound.tone(900, .4, { type: 'triangle', vol: .08, to: 1800 }), null, 1)
    .add('split', 1.5)
    .to('.flash', { scale: 5.5, opacity: 1, duration: .16, ease: 'power2.out' }, 'split')
    .to('.flash', { opacity: 0, duration: 1, ease: 'power2.out' }, 'split+=.16')
    .set('.crack', { visibility: 'hidden' }, 'split+=.08')
    .set('.cut', { opacity: 1 }, 'split+=.08')
    .set('.seam', { opacity: 0 }, 'split')
    .set(sky, { orbit: 0 }, 'split+=.08')
    .to('.half-l', { x: -130, rotation: -34, duration: 1.2, ease: 'expo.out' }, 'split')
    .to('.half-r', { x: 130, rotation: 34, duration: 1.2, ease: 'expo.out' }, 'split')
    .call(() => {
      Sound.thud(); Sound.whoosh();
      burst(cx, cy, { n: 140, colors: ['#FFE7A3', '#FFB68A', '#FF8FA3', '#FFFFFF'], speed: [160, 780], life: [.6, 1.6], gravity: 160, size: [1.5, 3.6], drag: .9 });
    }, null, 'split')
    .to('#seed', { scale: 1, autoAlpha: 1, duration: .9, ease: 'back.out(3)' }, 'split+=.1')
    .to('#seed', { y: '-=36', rotation: 12, duration: 1.1, ease: 'sine.inOut' }, 'split+=.5')
    .to('.half-l', { y: () => innerHeight * .9, rotation: -140, autoAlpha: 0, duration: 1.3, ease: 'power2.in' }, 'split+=1.1')
    .to('.half-r', { y: () => innerHeight * .9, rotation: 140, autoAlpha: 0, duration: 1.3, ease: 'power2.in' }, 'split+=1.15')
    .to('.apple-glow', { scale: .2, opacity: 0, duration: 1.1 }, 'split+=1')
    .call(() => armSeed(), null, 'split+=.95')   // the halves are falling — the seed is yours now
    .call(() => markGround(), null, 'dawn+=1.6') // the orchard has slid into place — you can dig now
    // dawn
    .add('dawn', 'split+=1.2')
    .to(sky, { night: 0, duration: 3, ease: 'sine.inOut' }, 'dawn')
    .to('#tint', { opacity: 0, duration: 2.6, ease: 'sine.inOut' }, 'dawn')
    .to('.sky-dawn', { opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 'dawn')
    .to('.sky-day', { opacity: 1, duration: 2.2, ease: 'sine.inOut' }, 'dawn+=1.1')
    .to(cam, { lift: 0, duration: 2.6, ease: 'expo.out', onUpdate: renderCam }, 'dawn+=.2')
    // on the hard level the sun stops low — the player drags it up later
    .fromTo('#sunwrap', { yPercent: 160, opacity: 0 }, { yPercent: () => level === 'high' ? 78 : 0, opacity: 1, duration: 3.2, ease: 'power2.out' }, 'dawn+=.3')
    .to('.cloud', { opacity: .92, duration: 2.5, stagger: .2 }, 'dawn+=1')
    .set('#intro', { display: 'none' });
  return tl;
}

/* the opening timeline pings these when the seed shows up and when the ground has settled */
let armSeed = null, markGround = null;
const seedShown = new Promise(r => (armSeed = r));
const groundReady = new Promise(r => (markGround = r));

/* the seed waits for the player: tap it, or drag it to the ground */
function takeSeed(subKey) {
  const seed = $('#seed');
  setCaptionKeys('seedTitle', subKey);
  seed.classList.add('live');
  seed.tabIndex = 0;
  gsap.to(seed, { y: '+=12', duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut', id: 'seedFloat' });
  gsap.fromTo(seed, { scale: 1 }, { scale: 1.12, duration: .8, yoyo: true, repeat: -1, ease: 'sine.inOut', id: 'seedPulse' });
  gsap.delayedCall(.7, () => { if (seed.classList.contains('live')) pointAt(seed); });

  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      gsap.getById('seedFloat')?.kill();
      gsap.getById('seedPulse')?.kill();
      gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
      seed.classList.remove('live');
      seed.tabIndex = -1;
      gsap.set(seed, { scale: 1 });
      Sound.init(); Sound.pluck();
      resolve();
    };
    const ready = () => !done && seed.classList.contains('live');
    seed.addEventListener('keydown', e => {
      if (ready() && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); finish(); }
    });
    seed.addEventListener('pointerdown', e => {
      if (!ready()) return;
      e.preventDefault();
      gsap.getById('seedFloat')?.kill();
      gsap.getById('seedPulse')?.kill();
      gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
      Sound.init(); Sound.blip();
      const d = Draggable.create(seed, { type: 'x,y', zIndexBoost: false, onRelease() { this.kill(); finish(); } })[0];
      d.startDrag(e);
    });
  });
}

/* ---------- stage: dig the hole (medium + hard) ---------- */
function digHole() {
  const need = level === 'high' ? 6 : 4;
  let hits = 0;
  const hit = $('#dig-hit');
  setCaptionKeys('digTitle', 'digSub');
  gsap.set('#dig', { visibility: 'visible' });
  gsap.fromTo('#dig-ring', { opacity: 0, scale: .5, svgOrigin: '400 1746' }, { opacity: .85, scale: 1, duration: .5, ease: 'back.out(2)' });
  gsap.to('#dig-ring', { rotation: 360, duration: 14, repeat: -1, ease: 'none', svgOrigin: '400 1746', id: 'digSpin' });

  return new Promise(resolve => {
    const tap = () => {
      hits++;
      const k = hits / need;
      Sound.init(); Sound.dig();
      gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
      const p = toScreen(400, 1744);
      burst(p.x, p.y, { n: 16, type: 'dust', colors: ['#7A5836', '#5E432A', '#E8D6A8'], angle: -Math.PI / 2, spread: 2.1, speed: [90, 320], life: [.5, .95], gravity: 520, size: [3, 7] });
      gsap.to('#hole', { attr: { rx: 66 * k, ry: 22 * k }, duration: .35, ease: 'back.out(2)' });
      gsap.to('#mound', { attr: { rx: 44 * k, ry: 15 * k }, duration: .35, ease: 'back.out(2)' });
      gsap.fromTo('#dig', { y: -5 }, { y: 0, duration: .4, ease: 'elastic.out(1,.4)' });
      gsap.to('#dig-ring', { attr: { r: 58 + 6 * k }, duration: .3 });
      if (hits >= need) {
        hit.removeEventListener('pointerdown', tap);
        hit.style.pointerEvents = 'none';
        gsap.getById('digSpin')?.kill();
        gsap.to('#dig-ring', { opacity: 0, scale: 1.4, duration: .4, svgOrigin: '400 1746' });
        Sound.tone(520, .25, { type: 'triangle', vol: .1, to: 880 });
        resolve();
      }
    };
    hit.addEventListener('pointerdown', tap);
    gsap.delayedCall(.9, () => { if (!hits) pointAt(hit); });
  });
}

/* the soil folds back over the planted seed */
function coverSeed() {
  const p = toScreen(400, 1744);
  Sound.dig();
  burst(p.x, p.y, { n: 18, type: 'dust', colors: ['#7A5836', '#5E432A'], angle: -Math.PI / 2, spread: 2.4, speed: [60, 210], life: [.5, .9], gravity: 460, size: [3, 7] });
  return gsap.timeline()
    .to('#mound', { attr: { rx: 0, ry: 0 }, duration: .5, ease: 'power2.in' })
    .to('#hole', { attr: { rx: 46, ry: 15 }, duration: .5, ease: 'power2.out' }, 0)
    .to('#hole', { fill: '#6B4A2A', duration: .5 }, 0);
}

/* ---------- stage: water it (medium + hard) ---------- */
function placeCan() {
  const can = $('#can'), g = toScreen(400, 1744);
  can.style.left = (g.x - can.offsetWidth * 1.02) + 'px';
  can.style.top = (g.y - can.offsetHeight * 1.5) + 'px';
}
function waterSoil() {
  const can = $('#can');
  setCaptionKeys('waterTitle', 'waterSub');
  gsap.set(can, { visibility: 'visible', autoAlpha: 0, scale: .6, rotation: 0 });
  can.removeAttribute('aria-hidden');
  can.tabIndex = 0;
  placeCan();
  gsap.ticker.add(placeCan);
  gsap.to(can, { autoAlpha: 1, scale: 1, duration: .6, ease: 'back.out(2)' });

  let water = 0, pouring = false, done = false;
  return new Promise(resolve => {
    const pour = () => {
      if (done) return;
      pouring = true;
      Sound.init(); Sound.water();
      gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
      gsap.to(can, { rotation: 42, duration: .35, ease: 'power2.out' });   // tip forward so the spout points down
    };
    const stop = () => {
      if (done || !pouring) return;
      pouring = false;
      gsap.to(can, { rotation: 0, duration: .4, ease: 'power2.out' });
    };
    const tick = (time, deltaMs) => {
      if (!pouring || done) return;
      water = Math.min(1, water + Math.min(deltaMs, 60) / 1800);   // about two seconds of pouring
      // water leaves the spout wherever the tilted can has put it
      const r = can.getBoundingClientRect(), w = can.offsetWidth, h = can.offsetHeight;
      const a = gsap.getProperty(can, 'rotation') * Math.PI / 180;
      const lx = (.96 - .5) * w, ly = (.28 - .5) * h;            // spout tip, from the can's centre
      const tipX = r.left + r.width / 2 + lx * Math.cos(a) - ly * Math.sin(a);
      const tipY = r.top + r.height / 2 + lx * Math.sin(a) + ly * Math.cos(a);
      if (Math.random() < .8) {
        burst(tipX, tipY, {
          n: 2, type: 'drop', colors: ['#7FC4E4', '#BFE6F5', '#5BA7CE'],
          angle: a + .35, spread: .35, speed: [70, 150], life: [.7, 1], gravity: 900, size: [2.5, 4.5], drag: 1
        });
      }
      gsap.set('#hole-wet', { attr: { rx: 48, ry: 16 }, opacity: water * .9 });
      if (water >= 1) finish();
    };
    const finish = () => {
      done = true;
      gsap.ticker.remove(tick);
      can.removeEventListener('pointerdown', pour);
      removeEventListener('pointerup', stop);
      removeEventListener('pointercancel', stop);
      can.removeEventListener('keydown', key);
      const p = toScreen(400, 1744);
      burst(p.x, p.y, { n: 26, colors: ['#BFE6F5', '#FFFFFF', '#7FC4E4'], angle: -Math.PI / 2, spread: 2.4, speed: [90, 300], life: [.5, 1], gravity: 420, size: [1.6, 3.4] });
      Sound.tone(620, .3, { type: 'triangle', vol: .1, to: 980 });
      gsap.timeline({ onComplete: () => { gsap.ticker.remove(placeCan); gsap.set(can, { visibility: 'hidden' }); resolve(); } })
        .to(can, { rotation: 0, duration: .3 })
        .to(can, { autoAlpha: 0, scale: .6, y: -30, duration: .45, ease: 'back.in(2)' });
    };
    const key = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      pour();
      gsap.delayedCall(.45, stop);
    };
    can.addEventListener('pointerdown', e => { e.preventDefault(); pour(); });
    addEventListener('pointerup', stop);
    addEventListener('pointercancel', stop);
    can.addEventListener('keydown', key);
    gsap.ticker.add(tick);
    gsap.delayedCall(1.1, () => { if (!water) pointAt(can); });
  });
}

/* ---------- stage: raise the sun (hard) ---------- */
function raiseSun() {
  const sun = $('#sunwrap');
  setCaptionKeys('sunTitle', 'sunSub');
  sun.style.pointerEvents = 'auto';
  sun.style.cursor = 'grab';
  sun.tabIndex = 0;
  sun.setAttribute('role', 'button');
  far.style.zIndex = 6;            // the sky sits above the orchard while you hold the sun
  const span = sun.offsetHeight * .78;                 // how far it still has to climb
  gsap.delayedCall(1.2, () => { if (gsap.getProperty(sun, 'y') > -span * .5) pointAt(sun); });

  return new Promise(resolve => {
    let done = false, dragging = false, y = 0, fromY = 0, fromVal = 0;
    const set = v => {
      y = clamp(v, -span, 20);
      gsap.set(sun, { y });
      if (y <= -span * .8) finish();
    };
    const down = e => {
      if (done) return;
      e.preventDefault();
      dragging = true; fromY = e.clientY; fromVal = y;
      sun.setPointerCapture && sun.setPointerCapture(e.pointerId);
      gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
      Sound.init();
    };
    const move = e => { if (dragging && !done) set(fromVal + (e.clientY - fromY)); };
    const up = e => {
      if (!dragging || done) return;
      dragging = false;
      if (Math.abs(e.clientY - fromY) < 8) { set(y - span / 3); Sound.blip(); }   // a tap nudges it up too
      else if (y > 0) gsap.to(sun, { y: 0, duration: .35, ease: 'power2.out', onUpdate() { y = gsap.getProperty(sun, 'y'); } });
    };
    const finish = () => {
      if (done) return;
      done = true;
      sun.removeEventListener('pointerdown', down);
      sun.removeEventListener('pointermove', move);
      sun.removeEventListener('pointerup', up);
      far.style.zIndex = '';
      sun.style.pointerEvents = '';
      sun.style.cursor = '';
      sun.tabIndex = -1;
      gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
      Sound.shine();
      const r = sun.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { n: 70, colors: ['#FFF1C9', '#FFD36E', '#FFB68A'], speed: [160, 620], life: [.8, 1.6], gravity: -30, size: [1.6, 3.6], drag: .93 });
      gsap.timeline({ onComplete: resolve })
        .to(sun, { y: -span, duration: .5, ease: 'back.out(2)' })
        .fromTo('.rays', { scale: 1 }, { scale: 1.25, duration: .5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0)
        .fromTo('.sun', { scale: 1 }, { scale: 1.15, duration: .4, yoyo: true, repeat: 1, ease: 'power2.out' }, 0)
        .to('#hole-wet', { opacity: .45, duration: .8 }, 0);
    };
    sun.addEventListener('pointerdown', down);
    sun.addEventListener('pointermove', move);
    sun.addEventListener('pointerup', up);
    sun.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); finish(); }
    });
  });
}

/* a hand that points at whatever needs a tap */
function pointAt(el) {
  const r = el.getBoundingClientRect(), hand = $('#hand');
  gsap.set(hand, { x: r.left + r.width * .55, y: r.top + r.height * .6, autoAlpha: 0, scale: 1 });
  gsap.timeline({ id: 'handHint' })
    .to(hand, { autoAlpha: 1, duration: .3 })
    .to(hand, { scale: .8, duration: .18, yoyo: true, repeat: 5, ease: 'power1.inOut' })
    .to(hand, { autoAlpha: 0, duration: .3, delay: .2 });
}

function dropSeed() {
  const seed = $('#seed');
  const sr = seed.getBoundingClientRect();
  const x0 = gsap.getProperty(seed, 'x'), y0 = gsap.getProperty(seed, 'y');
  // the ground may still be sliding into place, so aim at where it is on every frame
  const offX = (sr.left + sr.width / 2) - x0, offY = (sr.top + sr.height * .75) - y0;
  const flight = { t: 0 };
  return gsap.timeline()
    .to(flight, {
      t: 1, duration: 1.05, ease: 'power2.in',
      onUpdate() {
        const g = toScreen(400, 1748);
        const ex = g.x - offX, ey = g.y - offY, k = flight.t, i = 1 - k;
        const mx = (x0 + ex) / 2 + 30, my = Math.min(y0, ey) - 60;
        gsap.set(seed, {
          x: i * i * x0 + 2 * i * k * mx + k * k * ex,
          y: i * i * y0 + 2 * i * k * my + k * k * ey
        });
      }
    })
    .to(seed, { rotation: '+=200', duration: 1.05, ease: 'none' }, 0)
    .to(seed, { scale: .5, duration: .35, ease: 'power1.in' }, '-=.35')
    .call(() => {
      Sound.thud();
      const g = toScreen(400, 1748);
      burst(g.x, g.y, { n: 26, type: 'dust', colors: ['#E8D6A8', '#CDB787'], angle: -Math.PI / 2, spread: 2.6, speed: [40, 170], life: [.6, 1], gravity: 90, size: [4, 9] });
      burst(g.x, g.y, { n: 40, colors: ['#FFE7A3', '#FFFFFF'], angle: -Math.PI / 2, spread: 2, speed: [100, 420], gravity: 280, size: [1.5, 3] });
    })
    .to(seed, { autoAlpha: 0, scale: 0, duration: .25 });
}

function growTree() {
  const circles = canopy.map(c => c.el);
  const tl = gsap.timeline();
  tl.set(['#tree', '#sprout'], { visibility: 'visible' }, 0)
    .fromTo('#ripple', { opacity: 1, scale: .2, svgOrigin: '400 1752' }, { opacity: 0, scale: 4, duration: 1.3, ease: 'expo.out' }, 0)
    .fromTo('#sprout', { scale: 0, svgOrigin: '400 1754' }, { scale: 1.4, duration: .8, ease: 'elastic.out(1,.4)' }, .05)
    .add('grow', .75)
    .to('#trunk', { scaleY: 1, scaleX: 1, duration: 2.1, ease: 'power3.inOut' }, 'grow')
    .to('#sprout', { scale: 0, duration: .4, ease: 'back.in(2)' }, 'grow+=.25')
    .to(cam, { t: 1, duration: 2.5, ease: 'power2.inOut', onUpdate: renderCam }, 'grow+=.15')
    .call(() => Sound.tone(110, 2, { type: 'sine', vol: .12, to: 330 }), null, 'grow')
    .to('#branches path', { drawSVG: '100%', duration: 1, ease: 'power2.out', stagger: .07 }, 'grow+=1.4')
    .to(circles, { scale: 1, duration: .75, ease: 'back.out(2.2)', stagger: .008 }, 'grow+=1.9')
    .call(() => {
      Sound.whoosh();
      for (let i = 0; i < 22; i++) {
        const c = pick(canopy), p = toScreen(c.cx, c.cy);
        burst(p.x, p.y, { n: 2, type: 'leaf', colors: LEAVES, angle: -Math.PI / 2, spread: 3, speed: [60, 260], life: [1.6, 2.8], gravity: 120, size: [5, 9], drag: .95 });
      }
    }, null, 'grow+=2.2')
    .to(speckles, { scale: 1, duration: .5, ease: 'back.out(3)', stagger: { each: .012, from: 'random' } }, 'grow+=2.7')
    .to(nodes.map(n => n.inner), { scale: 1, rotation: 0, duration: 1.1, ease: 'elastic.out(1,.45)', stagger: { each: .1, from: 'random' } }, 'grow+=3.1');
  nodes.forEach((n, i) => {
    gsap.set(n.inner, { rotation: -40 });
    tl.call(() => {
      Sound.blip();
      const p = n.el.getBoundingClientRect();
      burst(p.left + p.width / 2, p.top + p.height / 2, { n: 10, colors: ['#FFE7A3', '#FFFFFF'], speed: [60, 200], life: [.4, .8], gravity: 60, size: [1.2, 2.4] });
    }, null, `grow+=${3.15 + i * .1}`);
  });
  return tl;
}

function ladderIn() {
  const tl = gsap.timeline();
  tl.to(cam, { t: 0, duration: 2.4, ease: 'power2.inOut', onUpdate: renderCam }, 0)
    .set('#ladder', { visibility: 'visible' }, 0)
    .to('#ladder .rail, #ladder .rail-hi', { drawSVG: '100%', duration: 2, ease: 'power2.inOut' }, .1)
    .to(rungs.slice().reverse(), { scaleX: 1, duration: .5, ease: 'back.out(3)', stagger: .11 }, .25)
    .call(() => {
      Sound.thud();
      const p = toScreen(LADDER.bx, GROUND);
      burst(p.x, p.y, { n: 30, type: 'dust', colors: ['#E8D6A8', '#D9C69A'], angle: -Math.PI / 2, spread: 3, speed: [50, 200], life: [.6, 1.1], gravity: 80, size: [5, 10] });
    }, null, 2.1)
    .fromTo('#ladder', { rotation: -3.5, svgOrigin: `${LADDER.bx} ${GROUND}` }, { rotation: 0, duration: 1.2, ease: 'elastic.out(1,.3)' }, 2.05);
  return tl;
}

function kidIn() {
  const x0 = view.vbX - 120, x1 = LADDER.bx, hops = 4, d = .5;
  Object.assign(pose, { x: x0, y: GROUND, shadow: .28 }, POSE.STAND);
  gsap.set(['#kid', '#kidShadow'], { visibility: 'visible' });
  renderPose();
  const tl = gsap.timeline({ defaults: { onUpdate: renderPose } });
  for (let i = 0; i < hops; i++) {
    const t = i * d, last = i === hops - 1;
    tl.to(pose, { x: x0 + (x1 - x0) * (i + 1) / hops, duration: d, ease: 'none' }, t)
      .to(pose, { y: GROUND - (last ? 95 : 70), duration: d / 2, ease: 'power2.out' }, t)
      .to(pose, { y: GROUND, duration: d / 2, ease: 'power2.in' }, t + d / 2)
      .to(pose, { ...POSE.AIR, duration: d * .35, ease: 'power2.out' }, t)
      .to(pose, { ...POSE.STAND, duration: d * .35, ease: 'power2.in' }, t + d * .62)
      .fromTo(pose, { sx: 1.14, sy: .84 }, { sx: 1, sy: 1, duration: .35, ease: 'elastic.out(1,.4)', immediateRender: false }, t + d)
      .call(() => {
        Sound.step(); Sound.tone(300, .08, { type: 'triangle', vol: .05, to: 200 });
        const p = toScreen(pose.x, GROUND);
        burst(p.x, p.y, { n: 8, type: 'dust', colors: ['#E8D6A8'], angle: -Math.PI / 2, spread: 3, speed: [30, 110], life: [.4, .7], gravity: 40, size: [3, 6] });
      }, null, t + d);
  }
  tl.to(pose, { head: -12, duration: .45, ease: 'sine.inOut' }, '+=.1')
    .to(pose, { head: 10, duration: .6, ease: 'sine.inOut' })
    .to(pose, { head: 0, duration: .45, ease: 'sine.inOut' });
  return tl;
}

/* ---------- climbing: arrows, rungs, keyboard, or straight to the top ---------- */
const PHASES = 24, PHASE_DUR = .2;   // 12 rungs, two limb moves per rung
const REACH = 560;                   // how far the picker can stretch, in world units
let phase = 0, climbBusy = false, gripped = false, queued = 0, rushTop = false;

function updateRungs() {
  const el = $('#rungs');
  el.textContent = `${num(phase / 2)} / ${num(PHASES / 2)}`;
  gsap.fromTo(el, { scale: 1.35 }, { scale: 1, duration: .45, ease: 'back.out(3)' });
  $('#btn-up').disabled = phase >= PHASES;
  $('#btn-down').disabled = phase <= 0;
  rungHits.forEach(h => h.classList.toggle('rung-live', +h.dataset.rung * 2 !== phase));
  if (phase < PHASES && state !== 'done' && +gsap.getProperty('#climb-controls', 'opacity') === 0) {
    gsap.set('#climb-controls', { display: '' });
    gsap.to('#climb-controls', { autoAlpha: 1, y: 0, duration: .3 });
  }
}

/* the arrows ride along beside the climber */
function placeSteer() {
  const p = toScreen(ladderX(pose.y), pose.y - 150);
  const x = clamp(p.x + 80, 44, view.vw - 44);
  const y = clamp(p.y, 96, view.vh - 110);
  $('#steer').style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
}

/* an apple is pickable only when the climber can actually reach it */
function updateReach() {
  const hx = pose.x, hy = pose.y - 170;
  for (const n of nodes) {
    if (n.picked) continue;
    const ok = state === 'play' && Math.hypot(n.x - hx, n.y - hy) < REACH;
    if (ok !== n.reach) {
      n.reach = ok;
      n.el.classList.toggle('reachable', ok);
      if (ok) wakeApple(n);              // "you can pick me now" — the cue a child reads instantly
    }
  }
}
/* an apple that just came within reach hops, sparkles and chimes */
function wakeApple(n) {
  gsap.fromTo(n.inner, { scale: 1 }, { scale: 1.22, duration: .26, ease: 'back.out(3.5)', yoyo: true, repeat: 1, overwrite: 'auto' });
  const r = n.el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, {
    n: 12, colors: ['#FFE7A3', '#FFFFFF', '#FFB68A'], speed: [60, 210], life: [.4, .9], gravity: 40, size: [1.4, 2.8]
  });
  Sound.tone(880 + Math.random() * 300, .16, { type: 'triangle', vol: .07, to: 1400 });
}
gsap.ticker.add(() => { placeSteer(); updateReach(); });

async function grip() {
  if (gripped) return;
  gripped = true;
  gsap.getById('idle')?.kill();
  await gsap.to(pose, { ...POSE.B, head: 0, lean: -5.5, shadow: 0, duration: .4, ease: 'back.out(2)', onUpdate: renderPose });
}

async function climbTo(target) {
  target = clamp(target, 0, PHASES);
  if (climbBusy || target === phase) return;
  climbBusy = true;
  const up = target > phase;
  enablePlay();
  Sound.init();
  await grip();
  const n = Math.abs(target - phase), dir = up ? 1 : -1;
  const tl = gsap.timeline({ defaults: { onUpdate: renderPose } });
  tl.to(cam, { t: target / PHASES, duration: n * PHASE_DUR + .5, ease: n > 2 ? 'power2.inOut' : 'power2.out', onUpdate: renderCam }, 0);
  for (let i = 0; i < n; i++) {
    const ph = phase + (i + 1) * dir, y = GROUND - ph * RUNG / 2;
    tl.to(pose, { ...(ph % 2 ? POSE.A : POSE.B), y, x: ladderX(y), head: ph % 2 ? -4 : 4, duration: PHASE_DUR, ease: 'sine.inOut' }, i * PHASE_DUR)
      .call(() => { phase = ph; if (ph % 2 === 0) updateRungs(); Sound.step(); }, null, (i + 1) * PHASE_DUR - .01);
  }
  tl.to(pose, { head: 0, duration: .3 })
    .to(pose, { lean: phase === 0 && !up ? 0 : -5.5, duration: .3 }, '<');
  await tl;
  phase = target;
  climbBusy = false;
  updateRungs();
  if (phase >= PHASES) {
    gsap.to('#climb-controls', { autoAlpha: 0, y: -10, duration: .3, onComplete: () => gsap.set('#climb-controls', { display: 'none' }) });
    if (state === 'play') setCaptionKeys('', 'topSub');
  }
  if (rushTop) { rushTop = false; queued = 0; climbTo(PHASES); }
  else if (queued) { const q = queued; queued = 0; climbTo(clamp(phase + q * 2, 0, PHASES)); }
}

const canSteer = () => state === 'ready' || state === 'play';
function stepUp() {
  if (!canSteer() || phase >= PHASES) return;
  if (climbBusy) { queued = clamp(queued + 1, -3, 3); return; }
  climbTo(phase + 2);
}
function stepDown() {
  if (!canSteer() || phase <= 0) return;
  if (climbBusy) { queued = clamp(queued - 1, -3, 3); return; }
  climbTo(phase - 2);
}
function climbAll() {
  if (!canSteer()) return;
  if (climbBusy) { rushTop = true; return; }
  climbTo(PHASES);
}

/* ---------- picking ---------- */
function bindNode(n) {
  n.el.classList.add('ripe');
  n.el.tabIndex = 0;
  n.el.addEventListener('pointerdown', e => grab(n, e));
  n.el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const f = pluck(n); if (f) flyToBasket(f); }
  });
  n.el.addEventListener('pointerenter', () => { if (state === 'play' && n.reach && !n.picked) gsap.to(n.inner, { scale: 1.16, duration: .4, ease: 'back.out(3)' }); });
  n.el.addEventListener('pointerleave', () => { if (!n.picked) gsap.to(n.inner, { scale: 1, duration: .4 }); });
}

function enablePlay() {
  if (state === 'play') return;
  state = 'play';
  stage.classList.add('picking');
  setCaptionKeys('', 'pickSub');
  gsap.set('#basket', { visibility: 'visible' });
  gsap.fromTo('#basket', { yPercent: 140 }, { yPercent: 0, duration: 1.2, ease: 'elastic.out(1,.55)' });
  gsap.from('.basket-tag', { scale: 0, rotation: -30, duration: .8, ease: 'back.out(3)', delay: .6 });
  nodes.forEach(bindNode);
  gsap.delayedCall(3, handHint);
}

/* tapped an apple that is still out of reach — show them what to do */
function tooHigh(n) {
  gsap.fromTo(n.inner, { rotation: 0 }, { keyframes: { rotation: [0, -9, 7, -4, 0] }, duration: .5, ease: 'none' });
  Sound.tone(220, .16, { type: 'triangle', vol: .09, to: 160 });
  const up = $('#btn-up');
  up.classList.remove('hint-up'); void up.offsetWidth; up.classList.add('hint-up');
  setCaptionKeys('', 'higherSub');
  gsap.delayedCall(2.6, () => { if (state === 'play' && capKeys?.subKey === 'higherSub') setCaptionKeys('', phase >= PHASES ? 'topSub' : 'pickSub'); });
}

function handHint() {
  if (state !== 'play' || touched) return;
  const n = nodes.find(n => !n.picked && n.reach);
  if (!n) return;
  const r = n.el.getBoundingClientRect(), br = basketBody.getBoundingClientRect();
  const hand = $('#hand');
  gsap.set(hand, { x: r.left + r.width * .5, y: r.top + r.height * .55, autoAlpha: 0, scale: 1 });
  gsap.timeline({ onComplete: () => gsap.delayedCall(3.5, handHint) })
    .to(hand, { autoAlpha: 1, duration: .3 })
    .to(hand, { scale: .8, duration: .18, yoyo: true, repeat: 3, ease: 'power1.inOut' })
    .to(hand, { x: br.left + br.width * .45, y: br.top + br.height * .1, duration: 1.1, ease: 'power2.inOut' })
    .to(hand, { autoAlpha: 0, duration: .3 });
}

function shakeNear(x, y) {
  for (const c of canopy) {
    const dist = Math.hypot(c.cx - x, c.cy - y);
    if (dist > 190) continue;
    const k = 1 - dist / 190;
    gsap.fromTo(c.el, { x: 0, y: 0 }, { x: rand(-9, 9) * k, y: rand(-6, 6) * k, duration: .07, repeat: 5, yoyo: true, ease: 'sine.inOut', overwrite: 'auto', onComplete: () => gsap.set(c.el, { x: 0, y: 0 }) });
  }
  for (const n of nodes) {
    if (n.picked || Math.hypot(n.x - x, n.y - y) > 230) continue;
    gsap.fromTo(n.inner, { rotation: 0 }, { keyframes: { rotation: [0, -12, 9, -5, 0] }, duration: .7, ease: 'none' });
  }
}

function pluck(n) {
  if (state !== 'play' || n.picked) return null;
  if (!n.reach) { tooHigh(n); return null; }
  n.picked = true; touched = true;
  gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
  n.el.classList.remove('ripe'); n.el.tabIndex = -1;
  Sound.init(); Sound.pluck();
  const r = n.el.getBoundingClientRect();
  shakeNear(n.x, n.y);
  burst(r.left + r.width / 2, r.top + r.height * .3, { n: 4, type: 'leaf', colors: LEAVES, angle: -Math.PI / 2, spread: 2.4, speed: [40, 160], life: [1.8, 2.8], gravity: 110, size: [5, 8], drag: .95 });
  const f = document.createElement('div');
  f.className = 'flyer';
  f.innerHTML = APPLE_SVG;
  Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  overlay.append(f);
  gsap.set(n.el, { autoAlpha: 0 });
  gsap.fromTo(f, { scale: 1 }, { scale: 1.3, duration: .3, ease: 'back.out(3)' });
  gsap.fromTo(f, { rotation: 0 }, { keyframes: { rotation: [0, -16, 12, -6, 0] }, duration: .45, ease: 'none' });
  return f;
}

function grab(n, e) {
  const f = pluck(n);
  if (!f) return;
  e.preventDefault();
  const tag = $('.basket-tag');
  const d = Draggable.create(f, {
    type: 'x,y',
    zIndexBoost: false,
    onDrag() {
      const over = this.hitTest('#basket', '15%');
      if (over !== f._over) { f._over = over; gsap.to(basketBody, { scale: over ? 1.08 : 1, duration: .3, ease: 'back.out(3)', transformOrigin: '50% 100%' }); }
    },
    onRelease() {
      this.kill();
      if (f._over) gsap.to(basketBody, { scale: 1, duration: .3 });
      flyToBasket(f);
    }
  })[0];
  d.startDrag(e);
}

function flyToBasket(f) {
  const slot = SLOTS[reserved++];
  const br = basketBody.getBoundingClientRect(), k = br.width / 260;
  const mouth = { x: br.left + slot[0] * k, y: br.top + (slot[1] - 70) * k };
  const fr = f.getBoundingClientRect();
  const x0 = gsap.getProperty(f, 'x'), y0 = gsap.getProperty(f, 'y');
  const x1 = x0 + mouth.x - (fr.left + fr.width / 2), y1 = y0 + mouth.y - (fr.top + fr.height / 2);
  const peak = Math.min(y0, y1) - clamp(Math.abs(x1 - x0) * .4, 90, 260);
  const endScale = (58 * k) / (f.offsetWidth * 204 / 240);
  Sound.whoosh();
  gsap.killTweensOf(f);
  gsap.timeline({ onComplete: () => landInBasket(f, slot) })
    .to(f, { motionPath: { path: [{ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: peak }, { x: x1, y: y1 }], curviness: 1.25 }, duration: .9, ease: 'sine.inOut' }, 0)
    .to(f, { rotation: '+=540', scale: endScale, duration: .9, ease: 'power2.inOut' }, 0);
}

function landInBasket(f, slot) {
  const layer = $('.b-apples');
  const br = basketBody.getBoundingClientRect(), k = br.width / 260, local = basketBody.offsetWidth / br.width;
  const fr = f.getBoundingClientRect();
  const slotScreen = { x: br.left + slot[0] * k, y: br.top + slot[1] * k };
  const el = document.createElement('div');
  el.className = 'b-apple';
  el.innerHTML = APPLE_SVG;
  el.style.left = ((slot[0] - 34) / 260 * 100) + '%';
  el.style.top = ((slot[1] - 36.8) / 230 * 100) + '%';
  layer.append(el);
  const rot = gsap.getProperty(f, 'rotation') % 360;
  f.remove();
  gsap.fromTo(el,
    { x: (fr.left + fr.width / 2 - slotScreen.x) * local, y: (fr.top + fr.height / 2 - slotScreen.y) * local, rotation: rot },
    { x: 0, y: 0, rotation: rand(-20, 20), duration: .5, ease: 'bounce.out' });
  gsap.delayedCall(.18, () => {
    landed++;
    Sound.land();
    gsap.fromTo(basketBody, { scaleX: 1.12, scaleY: .86 }, { scaleX: 1, scaleY: 1, scale: 1, duration: .8, ease: 'elastic.out(1,.35)', transformOrigin: '50% 100%', overwrite: 'auto' });
    burst(slotScreen.x, br.top + br.height * .35, { n: 22, colors: ['#FFE7A3', '#FFFFFF', '#FFB68A'], angle: -Math.PI / 2, spread: 2.2, speed: [120, 380], life: [.5, 1], gravity: 380, size: [1.5, 3] });
    const count = $('#count');
    count.textContent = num(landed);
    gsap.fromTo(count, { yPercent: -80, scale: 1.8, rotation: -20 }, { yPercent: 0, scale: 1, rotation: 0, duration: .7, ease: 'elastic.out(1,.4)' });
    gsap.fromTo('.basket-tag', { rotation: 6 }, { rotation: 0, duration: .8, ease: 'elastic.out(1,.3)' });
    if (landed === APPLES.length) gsap.delayedCall(.6, finale);
  });
}

/* ---------- finale ---------- */
function finale() {
  state = 'done';
  stage.classList.remove('picking');
  capKeys = null;
  setCaption('');
  gsap.to('#steer', { autoAlpha: 0, scale: .6, duration: .4, ease: 'back.in(2)' });
  Sound.applause();
  bravoMoment();
  fireworks();
  Sound.fanfare();
  const { vw, vh } = view;
  [0, 1].forEach(side => {
    burst(side ? vw + 10 : -10, vh * .85, { n: 110, type: 'confetti', colors: CONFETTI, angle: side ? -2.1 : -1.04, spread: .9, speed: [600, 1250], life: [2.2, 3.4], gravity: 820, size: [5, 9], drag: .965 });
  });
  gsap.delayedCall(.5, () => burst(vw / 2, -20, { n: 90, type: 'confetti', colors: CONFETTI, angle: Math.PI / 2, spread: 2.6, speed: [50, 300], life: [2.6, 3.6], gravity: 260, size: [5, 8], drag: .97 }));

  celebrate();

  gsap.timeline()
    .to(basketBody, { y: -44, duration: .32, ease: 'power2.out', transformOrigin: '50% 100%' })
    .to(basketBody, { y: 0, duration: .8, ease: 'bounce.out' });
  gsap.to('.b-apple', { y: -18, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out', stagger: .04 });

  canopy.forEach(c => {
    if (Math.random() > .5) return;
    gsap.to(c.el, { y: rand(-8, -3), duration: rand(.2, .35), yoyo: true, repeat: 3, ease: 'sine.inOut', delay: rand(0, .4) });
  });

}

/* one huge word, the way a crowd shouts it */
function bravoMoment() {
  const el = $('#bravo');
  gsap.set(el, { visibility: 'visible', autoAlpha: 1, scale: 0, rotation: -14 });
  return gsap.timeline()
    .to(el, { scale: 1.15, rotation: 4, duration: .8, ease: 'elastic.out(1,.45)' })
    .to(el, { scale: 1, rotation: -2, duration: .5, ease: 'power2.out' })
    .to(el, { keyframes: { scale: [1, 1.07, 1], rotation: [-2, 2, -2] }, duration: .9, repeat: 1, ease: 'sine.inOut' })
    .to(el, { scale: 1.7, autoAlpha: 0, duration: .7, ease: 'power2.in' })
    .set(el, { visibility: 'hidden' });
}

/* fireworks over the orchard */
function fireworks(n = 7) {
  for (let i = 0; i < n; i++) {
    gsap.delayedCall(i * .42 + rand(0, .18), () => {
      const x = rand(view.vw * .12, view.vw * .88), y = rand(view.vh * .1, view.vh * .48);
      burst(x, y, { n: 48, colors: [pick(CONFETTI), '#FFF4DF', '#FFD36E'], speed: [180, 660], life: [.8, 1.7], gravity: 220, size: [1.6, 3.6], drag: .9 });
      Sound.noise(.28, { vol: .05, from: 2800, to: 400 });
      Sound.tone(280, .3, { vol: .06, to: 90 });
    });
  }
}

function hearts(n = 8) {
  const p = toScreen(pose.x, pose.y - 200);
  burst(p.x, p.y, { n, type: 'heart', colors: ['#FF5A7A', '#FF8FA3', '#FFD36E', '#D7263D'], angle: -Math.PI / 2, spread: 1.8, speed: [120, 320], life: [1.2, 2], gravity: -40, size: [7, 13], drag: .94 });
}

async function celebrate() {
  const R = renderPose;
  // happy wiggle on the ladder
  await gsap.timeline({ defaults: { onUpdate: R } })
    .to(pose, { ...POSE.CHEER, y: pose.y - 22, duration: .3, ease: 'power2.out' })
    .call(() => hearts(6))
    .to(pose, { y: pose.y, duration: .4, ease: 'bounce.out' })
    .to(pose, { head: -12, duration: .15, yoyo: true, repeat: 3 }, '<')
    .to(pose, { ...POSE.B, duration: .3, ease: 'back.out(2)' });

  // slide down the ladder while the camera follows
  const slide = { y: pose.y };
  Sound.whoosh();
  await gsap.timeline()
    .to(cam, { t: 0, duration: 1.5, ease: 'power2.inOut', onUpdate: renderCam }, 0)
    .to(slide, { y: GROUND, duration: 1.3, ease: 'power2.in', onUpdate: () => { pose.y = slide.y; pose.x = ladderX(slide.y); R(); } }, .1)
    .to(pose, { ...POSE.AIR, duration: .4, onUpdate: R }, .1);

  // land, turn around to face us
  Sound.thud();
  const feet = toScreen(pose.x, GROUND);
  burst(feet.x, feet.y, { n: 18, type: 'dust', colors: ['#E8D6A8'], angle: -Math.PI / 2, spread: 3, speed: [40, 160], life: [.5, .9], gravity: 60, size: [4, 8] });
  await gsap.timeline({ defaults: { onUpdate: R } })
    .to(pose, { ...POSE.STAND, lean: 0, shadow: .28, sx: 1.18, sy: .8, duration: .12 })
    .to(pose, { sx: 1, sy: 1, duration: .35, ease: 'elastic.out(1,.4)' })
    .to(pose, { x: pose.x + 40, duration: .3, ease: 'power2.out' }, '<')
    .to(pose, { sx: 0, duration: .13, ease: 'power2.in' })
    .call(() => { $('#kidFace').style.display = ''; })
    .to(pose, { sx: 1, duration: .25, ease: 'back.out(3)' });

  // jump for joy
  const jumps = gsap.timeline({ defaults: { onUpdate: R } });
  for (let i = 0; i < 3; i++) {
    jumps.to(pose, { sx: 1.12, sy: .85, duration: .1, ease: 'power2.out' })
      .to(pose, { ...POSE.CHEER, y: GROUND - 110, sx: .92, sy: 1.1, head: i % 2 ? 10 : -10, duration: .32, ease: 'power2.out' })
      .call(() => { hearts(5); Sound.tone(660 + i * 180, .25, { type: 'triangle', vol: .1, to: 990 + i * 180 }); })
      .to(pose, { y: GROUND, sx: 1, sy: 1, head: 0, duration: .3, ease: 'power2.in' })
      .to(pose, { ...POSE.STAND, sx: 1.14, sy: .84, duration: .08 })
      .to(pose, { sx: 1, sy: 1, duration: .25, ease: 'elastic.out(1,.4)' });
  }
  await jumps;

  // keep waving and bouncing while the card is up
  gsap.timeline({ repeat: -1, repeatDelay: 1.4, defaults: { onUpdate: R } })
    .to(pose, { y: GROUND - 40, hLx: -54, hLy: -238, duration: .25, ease: 'power2.out' })
    .to(pose, { y: GROUND, duration: .3, ease: 'bounce.out' })
    .to(pose, { hLx: -70, hLy: -210, duration: .18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<')
    .to(pose, { hLx: -42, hLy: -94, duration: .3 })
    .call(() => hearts(3));

  showFinaleCard();
}

function showFinaleCard() {
  const card = $('#finale');
  gsap.set(card, { visibility: 'visible' });
  const split = new SplitText('#finale-title', { type: 'words', wordsClass: 'word' });
  gsap.timeline()
    .from(card, { scale: .5, rotation: -10, autoAlpha: 0, duration: 1, ease: 'elastic.out(1,.6)' })
    .from(split.words, { y: 40, autoAlpha: 0, rotation: 8, duration: .7, stagger: .1, ease: 'back.out(3)' }, .2)
    .from('#finale p', { autoAlpha: 0, y: 12, duration: .6 }, .55)
    .from('#replay', { scale: 0, duration: .7, ease: 'back.out(3)' }, .75);
  gsap.delayedCall(1.6, () => $('#replay').focus({ preventScroll: true }));
}

/* ---------- the whole story ---------- */
async function story() {
  const opening = openApple();
  await seedShown;                      // the halves are falling and the seed is there
  if (level !== 'easy') {
    await groundReady;                  // wait for the orchard to settle, then dig
    await digHole();
  }
  await takeSeed(level === 'easy' ? 'seedSub' : 'seedHoleSub');
  await dropSeed();
  if (level !== 'easy') {
    await coverSeed();
    await waterSoil();
  }
  if (level === 'high') await raiseSun();
  opening.timeScale(2.4);               // if they were quick, let the sunrise catch up
  await opening;
  await growTree();
  startFlutters();
  await setCaptionKeys('grownTitle', 'grownSub');
  await wait(1.8);
  await ladderIn();
  await kidIn();
  await setCaptionKeys('ladderTitle', 'ladderSub');
  state = 'ready';
  updateRungs();
  gsap.set('#steer', { visibility: 'visible' });
  gsap.fromTo('#steer', { autoAlpha: 0, scale: .5 }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'elastic.out(1,.5)' });
  gsap.fromTo('#climb-controls', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .6, delay: .3, ease: 'power3.out' });
  gsap.fromTo('#climb-controls button', { scale: .6 }, { scale: 1, duration: 1, delay: .3, stagger: .12, ease: 'elastic.out(1,.5)' });
  $('#btn-up').classList.add('hint-up');
  gsap.to(pose, { head: 6, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut', onUpdate: renderPose, id: 'idle' });
}

/* ---------- language ---------- */
let titleSplit = null;
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $('#lang').textContent = lang === 'ar' ? 'EN' : 'ع';
  $('#count').textContent = num(landed);
  $('#count-of').textContent = `${t('of')} ${num(APPLES.length)}`;
  $('#rungs').textContent = `${num(phase / 2)} / ${num(PHASES / 2)}`;
  nodes.forEach((n, i) => n.el.setAttribute('aria-label', `${t('appleAria')} ${num(i + 1)}`));
  if (titleSplit) {                       // re-split the title in the new language
    gsap.killTweensOf(titleSplit.words);
    titleSplit.revert();
    $('#title').textContent = t('title');
    titleSplit = new SplitText('#title', { type: 'words', wordsClass: 'word' });
  }
  if (capKeys) {                          // redraw the running caption without re-animating
    const cap = $('#caption'), sub = $('#subcaption');
    if (capSplit) { capSplit.revert(); capSplit = null; }
    cap.textContent = capKeys.titleKey ? t(capKeys.titleKey) : '';
    sub.textContent = capKeys.subKey ? t(capKeys.subKey) : '';
    if (cap.textContent) capSplit = new SplitText(cap, { type: 'words', wordsClass: 'word' });
  }
}
/* ---------- play level ---------- */
function applyLevel() {
  $$('#levels button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === level)));
}
$$('#levels button').forEach(b => b.addEventListener('click', () => {
  level = b.dataset.level;
  try { localStorage.setItem('orchard-level', level); } catch (e) { /* private mode */ }
  applyLevel();
  Sound.init(); Sound.blip();
  gsap.fromTo(b, { scale: .75 }, { scale: 1, duration: .55, ease: 'back.out(3)' });
}));

$('#lang').addEventListener('click', () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('orchard-lang', lang); } catch (e) { /* private mode */ }
  applyLang();
  Sound.blip();
  gsap.fromTo('#lang', { rotation: -180, scale: .6 }, { rotation: 0, scale: 1, duration: .7, ease: 'back.out(3)' });
});

/* ---------- controls + boot ---------- */
$('#climb-all').addEventListener('click', climbAll);
$('#btn-up').addEventListener('click', stepUp);
$('#btn-down').addEventListener('click', stepDown);

/* the rungs are built at boot, so listen on their container */
$('#ladder-hits').addEventListener('pointerdown', e => {
  const rung = e.target.dataset && e.target.dataset.rung;
  if (!rung || !canSteer()) return;
  Sound.init();
  climbTo(+rung * 2);
});

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  const up = k === 'arrowup' || k === 'w', down = k === 'arrowdown' || k === 's', space = k === ' ';
  if (!up && !down && !space) return;
  if (space && document.activeElement && document.activeElement.tagName === 'BUTTON') return;  // let the button handle it
  if (!canSteer()) return;
  e.preventDefault();
  if (e.repeat) return;
  down ? stepDown() : stepUp();
});

/* ---------- the living scene: everything answers back ---------- */
function tapSun() {
  Sound.init();
  Sound.tone(880, .5, { type: 'sine', vol: .09, to: 1320 });
  const r = $('#sunwrap').getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { n: 46, colors: ['#FFF1C9', '#FFD36E', '#FFB68A'], speed: [160, 520], life: [.7, 1.4], gravity: -20, size: [1.6, 3.4], drag: .93 });
  gsap.fromTo('.sun', { scale: 1 }, { scale: 1.18, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' });
  gsap.fromTo('.rays', { rotation: 0 }, { rotation: 45, duration: 1.4, ease: 'power2.out' });
}
function tapTree(e) {
  Sound.init();
  const w = toWorld(e.clientX, e.clientY);
  shakeNear(w.x, w.y);
  Sound.noise(.35, { vol: .06, from: 1800, to: 600 });
  burst(e.clientX, e.clientY, { n: 7, type: 'leaf', colors: LEAVES, angle: -Math.PI / 2, spread: 3, speed: [40, 190], life: [1.8, 3], gravity: 110, size: [5, 9], drag: .95 });
}
function tapGround(e) {
  Sound.init();
  Sound.tone(150, .12, { vol: .12, to: 80 });
  burst(e.clientX, e.clientY, { n: 12, type: 'dust', colors: ['#E8D6A8', '#CDB787'], angle: -Math.PI / 2, spread: 2.6, speed: [30, 130], life: [.4, .8], gravity: 60, size: [3, 7] });
}
function tapBasket() {
  if (state === 'boot') return;
  Sound.init(); Sound.thud();
  gsap.fromTo(basketBody, { y: 0 }, { y: -26, duration: .22, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
  gsap.fromTo('.b-apple', { y: 0 }, { y: -14, duration: .2, stagger: .03, yoyo: true, repeat: 1, ease: 'power2.out' });
}

/* the kid: a different answer every time you poke him */
let lastReaction = -1;
function tapKid() {
  if (state === 'boot' || state === 'intro' || climbBusy) {
    if (climbBusy) { Sound.blip(); gsap.to(pose, { head: 12, duration: .18, yoyo: true, repeat: 1, onUpdate: renderPose }); }
    return;
  }
  Sound.init();
  const onLadder = phase > 0 && state !== 'done';
  const R = renderPose;
  if (onLadder) {                        // hanging on the ladder: cheeky wiggle
    gsap.timeline({ defaults: { onUpdate: R } })
      .to(pose, { head: -14, sx: 1.06, sy: .95, duration: .16 })
      .to(pose, { head: 12, duration: .2 })
      .to(pose, { head: 0, sx: 1, sy: 1, duration: .25, ease: 'elastic.out(1,.5)' });
    Sound.tone(520, .12, { type: 'triangle', vol: .09, to: 760 });
    hearts(2);
    return;
  }
  let i;                                  // on the ground: pick a fresh trick
  do { i = (Math.random() * 4) | 0; } while (i === lastReaction);
  lastReaction = i;
  const tl = gsap.timeline({ defaults: { onUpdate: R } });
  if (i === 0) {                          // jump with arms up
    tl.to(pose, { sx: 1.16, sy: .84, duration: .1 })
      .to(pose, { ...POSE.CHEER, y: pose.y - 120, sx: .94, sy: 1.1, duration: .32, ease: 'power2.out' })
      .call(() => { hearts(5); Sound.tone(700, .22, { type: 'triangle', vol: .11, to: 1050 }); })
      .to(pose, { y: GROUND, duration: .3, ease: 'power2.in' })
      .to(pose, { ...POSE.STAND, sx: 1.12, sy: .86, duration: .08 })
      .to(pose, { sx: 1, sy: 1, duration: .3, ease: 'elastic.out(1,.4)' });
  } else if (i === 1) {                   // spin on the spot
    tl.to(pose, { sx: 0, duration: .13, ease: 'power2.in' })
      .to(pose, { sx: 1, duration: .13, ease: 'power2.out' })
      .to(pose, { sx: 0, duration: .13, ease: 'power2.in' })
      .to(pose, { sx: 1, duration: .2, ease: 'back.out(3)' })
      .call(() => Sound.whoosh(), null, 0);
  } else if (i === 2) {                   // wave hello
    tl.to(pose, { hLx: -62, hLy: -226, duration: .2, ease: 'power2.out' })
      .to(pose, { hLx: -78, hLy: -206, duration: .16, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to(pose, { hLx: POSE.STAND.hLx, hLy: POSE.STAND.hLy, duration: .3, ease: 'power2.inOut' })
      .call(() => { Sound.tone(600, .18, { type: 'triangle', vol: .09, to: 880 }); hearts(3); }, null, 0);
  } else {                                // wobble like jelly
    tl.to(pose, { lean: -10, sx: 1.1, sy: .92, duration: .12 })
      .to(pose, { lean: 9, sx: .93, sy: 1.07, duration: .16 })
      .to(pose, { lean: -5, duration: .14 })
      .to(pose, { lean: 0, sx: 1, sy: 1, duration: .5, ease: 'elastic.out(1,.35)' })
      .call(() => Sound.tone(300, .3, { type: 'sine', vol: .1, to: 520 }), null, 0);
  }
}

$('#sunwrap').addEventListener('pointerdown', tapSun);
['#trunk', '#canopy-back', '#canopy-front', '#speckles', '#branches'].forEach(sel =>
  $(sel).addEventListener('pointerdown', tapTree));
['#ground-path', '#tufts'].forEach(sel => $(sel).addEventListener('pointerdown', tapGround));
$('#basket').addEventListener('pointerdown', tapBasket);
$('#kid').addEventListener('pointerdown', tapKid);

$('#replay').addEventListener('click', () => location.reload());
$('#sound').addEventListener('click', e => {
  Sound.on = !Sound.on;
  e.currentTarget.setAttribute('aria-pressed', String(Sound.on));
  if (Sound.on) { Sound.init(); Sound.blip(); }
});
stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; });
addEventListener('resize', () => { layout(); if (state === 'intro') measureOrbit(); flutters.forEach(placeFlutter); });

function boot() {
  buildGround(); buildCanopy(); buildLadder(); buildApples();
  applyLang(); applyLevel();
  layout();
  renderPose();
  intro();
}
let booted = false;
const go = () => { if (!booted) { booted = true; boot(); } };
(document.fonts?.ready ?? Promise.resolve()).then(go);
setTimeout(go, 1800);
