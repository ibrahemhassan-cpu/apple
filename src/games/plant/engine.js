/* بستان التفاحة — the apple game engine.
   Mount scene.html first, then call createPlantGame(). React owns the screens around it;
   everything that moves in here is GSAP + canvas, exactly as in the standalone version. */
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Draggable } from 'gsap/Draggable';
import { SplitText } from 'gsap/SplitText';
import { translate, formatNumber } from '../../i18n/strings.js';
import { createFlora } from './flora3d.js';
import { createFruits } from './fruit3d.js';

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, Draggable, SplitText);

/**
 * @param {{ lang: 'ar'|'en', level: 'easy'|'mid'|'high', sound: boolean,
 *           onLang?: (lang) => void, onSound?: (on) => void, onReplay?: () => void, onExit?: () => void }} opts
 * @returns {{ destroy: () => void }}
 */
export function createPlantGame(opts) {
  const spec = opts.spec;
  const isGround = spec.kind === 'ground';           // crops that grow in the soil, seen in cross-section
  const BELOW = isGround ? spec.world.below : 0;     // extra world under the lawn
  const DOWN = isGround ? spec.world.down : 0;       // how far the camera can look into the soil
  const lifetime = new AbortController();
  const { signal } = lifetime;
  let destroyed = false;
  const ticker = {
    live: new Set(),
    add(fn) { gsap.ticker.add(fn); this.live.add(fn); },
    remove(fn) { gsap.ticker.remove(fn); this.live.delete(fn); },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = s => new Promise(r => gsap.delayedCall(s, r));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lang = opts.lang === 'en' ? 'en' : 'ar';
  /* play level: 'easy' plants itself, 'mid' adds digging + watering, 'high' adds the sun too */
  let level = ['easy', 'mid', 'high'].includes(opts.level) ? opts.level : 'easy';
  // a fruit can override any line: 'mango.title' wins over 'title'
  const t = key => translate(lang, `${spec.id}.${key}`) || translate(lang, key);
  const num = n => formatNumber(lang, n);
  if (reduceMotion) gsap.globalTimeline.timeScale(1.6);

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- world constants (SVG units) ---------- */
  const W = 800, H = 1800, GROUND = 1756, RUNG = 51.5;
  const LADDER = { bx: 520, by: GROUND, tx: 430, ty: 900 };
  const ladderX = y => LADDER.bx - (LADDER.by - y) * (LADDER.bx - LADDER.tx) / (LADDER.by - LADDER.ty);
  const POSITIONS = spec.positions;
  // basket slots in basket units (260 × 230)
  const SLOTS = [[72, 118], [110, 120], [150, 120], [188, 118], [92, 96], [130, 98], [170, 96], [112, 74], [150, 74], [131, 54]];
  const FRUIT_SVG = '<svg viewBox="-120 -140 240 260" aria-hidden="true"><use href="#fruit" x="-120" y="-140" width="240" height="260"/></svg>';
  // the picture of a fruit off the plant: the 3D fruit's own portrait once it exists, the drawing otherwise
  let fruitPicture = () => FRUIT_SVG;

  const stage = $('#stage'), world = $('#world'), scene = $('#scene'), far = $('#far');
  const overlay = $('#overlay');
  let flora = null;                                   // the 3D tree or plant, made at boot
  let fruit3d = null;                                 // the 3D fruit drawn inside the nodes (null without WebGL)

  /* ---------- layout + camera ---------- */
  const view = { vw: 0, vh: 0, s: 1, vbX: 0 };
  const cam = { t: 0, lift: 1, d: 0 };   // t: up the tree, d: down into the soil
  const par = { x: 0 };
  let worldY = 0;

  function camTop() {
    const { vh, s } = view;
    return clamp(Math.max(110, 0.15 * vh) - vh + (H - 330) * s, 0, Math.max(0, H * s - vh));
  }
  function renderCam() {
    const c = cam.t * camTop();
    const look = c - cam.d * DOWN * view.s;
    worldY = look + cam.lift * view.vh * 0.5;
    world.style.transform = `translate3d(${par.x * 0.35}px,${worldY}px,0)`;
    far.style.transform = `translate3d(${par.x}px,${look * 0.2 + cam.lift * view.vh * 0.22}px,0)`;
    if (flora) {
      // the 3D canvas stays pinned to the screen and looks at exactly the part of the world that is showing
      const a = toWorld(0, 0), b = toWorld(view.vw, view.vh);
      const v = { L: a.x, R: b.x, T: a.y, B: b.y, tx: -par.x * 0.35, ty: -(view.vh - H * view.s + worldY) };
      flora.sync(v);
      fruit3d?.sync(v);
    }
  }
  function toScreen(x, y) {
    return { x: (x - view.vbX) * view.s + par.x * 0.35, y: (view.vh - H * view.s) + y * view.s + worldY };
  }
  function toWorld(sx, sy) {
    return {
      x: (sx - par.x * 0.35) / view.s + view.vbX,
      y: (sy - (view.vh - H * view.s) - worldY) / view.s
    };
  }
  const parTo = gsap.quickTo(par, 'x', { duration: 1.4, ease: 'power3', onUpdate: renderCam });

  function layout() {
    if (!innerWidth || !innerHeight) return;
    view.vw = innerWidth; view.vh = innerHeight;
    view.s = Math.min(view.vh * 2.1 / H, view.vw * 1.1 / W);
    const vbW = view.vw / view.s;
    view.vbX = -(vbW - W) / 2;
    scene.setAttribute('viewBox', `${view.vbX} 0 ${vbW} ${H + BELOW}`);
    $('#scene-back').setAttribute('viewBox', `${view.vbX} 0 ${vbW} ${H + BELOW}`);
    flora?.resize(view.vw, view.vh);
    fruit3d?.resize(view.vw, view.vh);
    world.style.width = view.vw + 'px';
    world.style.height = (H + BELOW) * view.s + 'px';
    world.style.top = (view.vh - H * view.s) + 'px';
    placeFruits();
    renderCam();
    sizeCanvas(bg); sizeCanvas(fx);
  }

  /* ---------- scene building ---------- */
  function buildGround() {
    const path = $('#ground-path'), len = path.getTotalLength(), pts = [];
    for (let i = 0; i <= 1600; i++) pts.push(path.getPointAtLength(len * i / 1600));
    const topAt = x => {
      let best = Infinity;
      for (const p of pts) if (Math.abs(p.x - x) < 8 && p.y < best) best = p.y;
      return best === Infinity ? GROUND : best;
    };
    const g = $('#tufts'), r = rng(3);
    for (let x = -1400; x < 2200; x += 34 + r() * 60) {
      const y = topAt(x) + 7, k = .7 + r() * .6;
      svgEl('path', {
        d: `M${x},${y} q${-7 * k},${-16 * k} ${-12 * k},${-24 * k} M${x},${y} q${1 * k},${-20 * k} ${3 * k},${-32 * k} M${x},${y} q${6 * k},${-14 * k} ${13 * k},${-21 * k}`,
        fill: 'none', stroke: r() > .5 ? '#4F9E4B' : '#63B25A', 'stroke-width': 4, 'stroke-linecap': 'round'
      }, g);
    }
    for (let i = 0; i < 26; i++) {
      const x = -900 + r() * 2600, y = topAt(x) + 12 + r() * 20;
      const fl = svgEl('g', {}, g), c = r() > .5 ? '#FFF4DF' : '#FFC6D3';
      for (let p = 0; p < 5; p++) {
        const a = p / 5 * Math.PI * 2;
        svgEl('circle', { cx: x + Math.cos(a) * 5, cy: y + Math.sin(a) * 5, r: 4, fill: c }, fl);
      }
      svgEl('circle', { cx: x, cy: y, r: 3.4, fill: '#FFC94A' }, fl);
    }
  }

  /* a random point inside the crown, for falling leaves */
  function inCrown() {
    const C = spec.flora.crown, a = rand(0, 6.28), d = Math.sqrt(Math.random());
    return { x: C.cx + Math.cos(a) * C.rx * d, y: C.cy + Math.sin(a) * C.ry * d };
  }

  const rungs = [], rungHits = [];
  const RUNGS_CLIMBABLE = 12;
  function buildLadder() {
    const g = $('#ladder-rungs'), hits = $('#ladder-hits');
    for (let k = 1; k <= 16; k++) {
      const y = GROUND - k * RUNG, xc = ladderX(y);
      rungs.push(svgEl('line', { x1: xc - 40, y1: y, x2: xc + 40, y2: y, class: 'rung' }, g));
      if (k <= RUNGS_CLIMBABLE) {
        const hit = svgEl('line', { x1: xc - 46, y1: y, x2: xc + 46, y2: y, class: 'rung-hit' }, hits);
        hit.dataset.rung = k;
        rungHits.push(hit);
      }
    }
    gsap.set(rungs, { scaleX: 0, transformOrigin: '50% 50%' });
    gsap.set('#ladder .rail, #ladder .rail-hi', { drawSVG: '0%' });
  }

  const nodes = [];
  function buildFruits() {
    const layer = $('#fruits');
    POSITIONS.forEach(([x, y], i) => {
      const el = document.createElement('div');
      el.className = 'fruit-node';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${t('fruitAria')} ${num(i + 1)}`);
      el.tabIndex = -1;
      el.innerHTML = `<div class="fruit-inner"><span class="ring" style="animation-delay:${(i * .37) % 1.9}s"></span>${FRUIT_SVG}</div>`;
      const phase = rand(0, 3.2);
      el.querySelector('svg').style.animationDelay = `${-phase}s`;
      layer.append(el);
      const n = { el, inner: el.firstElementChild, x, y, i, picked: false, phase, dim: .58 };
      gsap.set(n.inner, { scale: 0 });
      nodes.push(n);
    });
  }
  function placeNode(n) {
    const size = Math.max(spec.fruitSize * view.s, 48), h = size * 260 / 240;
    Object.assign(n.el.style, {
      width: size + 'px', height: h + 'px',
      left: ((n.x - view.vbX) * view.s - size / 2) + 'px',
      top: (n.y * view.s - h / 2) + 'px'
    });
  }
  function placeFruits() { nodes.forEach(placeNode); }

  /* each 3D fruit copies its node: where it is, its pop and spin, the gentle sway, and the fade when out of reach */
  function drawFruit3d(time, deltaMs) {
    const k = Math.min(1, deltaMs / 1000 * 6);
    const size = Math.max(spec.fruitSize * view.s, 48) / view.s;
    fruit3d.render(nodes.map(n => {
      n.dim += ((n.el.classList.contains('reachable') ? 1 : .58) - n.dim) * k;
      return {
        x: n.x, y: n.y, size,
        scale: +gsap.getProperty(n.inner, 'scale'),
        rot: +gsap.getProperty(n.inner, 'rotation'),
        sway: isGround || reduceMotion ? 0 : -5 * Math.cos(Math.PI * (time + n.phase) / 3.2),
        alpha: n.el.style.visibility === 'hidden' ? 0 : +gsap.getProperty(n.el, 'opacity') * n.dim,
      };
    }));
  }

  /* ---------- butterflies (world units) ---------- */
  const flutters = [];
  function startFlutters() {
    if (reduceMotion) return;
    ['#FFB547', '#F7A1C4'].forEach((color, i) => {
      const el = document.createElement('div');
      el.className = 'flutter';
      el.innerHTML = `<svg viewBox="-30 -24 60 48"><g class="wing wl"><path d="M-2,0 C-20,-28 -34,-10 -22,2 C-30,16 -12,22 -2,4Z" fill="${color}"/></g><g class="wing wr"><path d="M2,0 C20,-28 34,-10 22,2 C30,16 12,22 2,4Z" fill="${color}"/></g><rect x="-2" y="-11" width="4" height="22" rx="2" fill="#3A2A22"/></svg>`;
      $('#flutters').append(el);
      const b = { el, p: { x: i ? 900 : -100, y: 700 + i * 200 }, tilt: 0 };
      flutters.push(b);
      placeFlutter(b);
      flutter(b);
    });
  }
  function placeFlutter(b) {
    b.el.style.transform = `translate3d(${(b.p.x - view.vbX) * view.s}px,${b.p.y * view.s}px,0) rotate(${b.tilt}deg) scale(${Math.max(view.s, .7)})`;
  }
  function flutter(b) {
    const tx = rand(120, 680), ty = isGround ? rand(1400, 1690) : rand(330, 1300);
    b.tilt = tx > b.p.x ? 14 : -14;
    gsap.to(b.p, {
      motionPath: { path: [{ x: b.p.x, y: b.p.y }, { x: (b.p.x + tx) / 2 + rand(-160, 160), y: (b.p.y + ty) / 2 + rand(-160, 160) }, { x: tx, y: ty }], curviness: 1.6 },
      duration: rand(2.6, 4.6), ease: 'sine.inOut',
      onUpdate: () => placeFlutter(b), onComplete: () => flutter(b)
    });
  }

  /* ---------- kid ---------- */
  const POSE = {
    STAND: { hLx: -42, hLy: -94, hRx: 42, hRy: -94, kLx: -16, kLy: -42, fLx: -15, fLy: -6, kRx: 16, kRy: -42, fRx: 15, fRy: -6 },
    AIR:   { hLx: -56, hLy: -160, hRx: 56, hRy: -160, kLx: -24, kLy: -50, fLx: -18, fLy: -20, kRx: 24, kRy: -50, fRx: 18, fRy: -20 },
    A:     { hLx: -40, hLy: -210, hRx: 40, hRy: -184, kLx: -18, kLy: -42, fLx: -16, fLy: -6, kRx: 30, kRy: -60, fRx: 18, fRy: -32 },
    B:     { hLx: -40, hLy: -184, hRx: 40, hRy: -210, kLx: -30, kLy: -60, fLx: -18, fLy: -32, kRx: 18, kRy: -42, fRx: 16, fRy: -6 },
    CHEER: { hLx: -54, hLy: -238, hRx: 54, hRy: -238 },
    // squatting down in the dirt, knees out, hands low
    CROUCH: { hLx: -30, hLy: -72, hRx: 30, hRy: -68, kLx: -40, kLy: -58, fLx: -28, fLy: -44, kRx: 40, kRy: -58, fRx: 28, fRy: -44 },
  };
  const CROUCH_DROP = 42;   // how far the body sinks when squatting
  const pose = { x: -600, y: GROUND, lean: 0, sx: 1, sy: 1, head: 0, shadow: .28, ...POSE.STAND };
  const K = {};
  ['kid', 'armL', 'armR', 'handL', 'handR', 'thighL', 'thighR', 'shinL', 'shinR', 'shoeL', 'shoeR', 'kidHead', 'kidShadow']
    .forEach(id => (K[id] = document.getElementById(id)));
  const f2 = v => v.toFixed(2);
  function line(el, x1, y1, x2, y2) {
    el.setAttribute('x1', f2(x1)); el.setAttribute('y1', f2(y1));
    el.setAttribute('x2', f2(x2)); el.setAttribute('y2', f2(y2));
  }
  function dot(el, x, y) { el.setAttribute('cx', f2(x)); el.setAttribute('cy', f2(y)); }
  function renderPose() {
    const p = pose;
    K.kid.setAttribute('transform', `translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(p.lean)}) scale(${p.sx.toFixed(3)} ${p.sy.toFixed(3)})`);
    line(K.armL, -24, -142, p.hLx, p.hLy); dot(K.handL, p.hLx, p.hLy);
    line(K.armR, 24, -142, p.hRx, p.hRy); dot(K.handR, p.hRx, p.hRy);
    line(K.thighL, -14, -80, p.kLx, p.kLy); line(K.shinL, p.kLx, p.kLy, p.fLx, p.fLy); dot(K.shoeL, p.fLx, p.fLy);
    line(K.thighR, 14, -80, p.kRx, p.kRy); line(K.shinR, p.kRx, p.kRy, p.fRx, p.fRy); dot(K.shoeR, p.fRx, p.fRy);
    K.kidHead.setAttribute('transform', `rotate(${f2(p.head)} 0 -170)`);
    const air = clamp((GROUND - p.y) / 220, 0, 1);
    K.kidShadow.setAttribute('cx', f2(p.x));
    K.kidShadow.setAttribute('rx', f2(44 * (1 - air * .5)));
    K.kidShadow.setAttribute('opacity', (p.shadow * (1 - air * .8)).toFixed(3));
  }

  /* ---------- particles ---------- */
  function makeCanvas(el) { return { el, ctx: el.getContext('2d'), w: 0, h: 0 }; }
  function sizeCanvas(c) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.w = innerWidth; c.h = innerHeight;
    c.el.width = Math.round(c.w * dpr); c.el.height = Math.round(c.h * dpr);
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const bg = makeCanvas($('#bg'));
  const fx = makeCanvas($('#fx'));
  const sky = { night: 1, orbit: 1, orbitX: 0, orbitY: 0, orbitR: 150 };
  const parts = [];
  let fxDirty = false;

  const stars = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random() * .85, r: rand(.4, 1.6), ph: rand(0, 6.28), sp: rand(.6, 2.4) }));
  const motes = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: rand(1, 2.6), vy: rand(.006, .02), ph: rand(0, 6.28) }));
  const orbiters = Array.from({ length: 16 }, (_, i) => ({ a: i / 16 * 6.28, rr: rand(.75, 1.25), sp: rand(.25, .6) * (i % 2 ? 1 : -1), size: rand(1.2, 2.8), wob: rand(0, 6.28) }));

  function burst(x, y, o = {}) {
    const n = o.n ?? 30, colors = o.colors ?? ['#FFE7A3'];
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? 0) + (Math.random() - .5) * (o.spread ?? Math.PI * 2);
      const sp = rand(...(o.speed ?? [100, 400]));
      const life = rand(...(o.life ?? [.6, 1.2]));
      parts.push({
        type: o.type ?? 'spark', x: x + rand(-(o.jitter ?? 0), o.jitter ?? 0), y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity ?? 300, drag: o.drag ?? .92,
        life, max: life, size: rand(...(o.size ?? [2, 4])), color: pick(colors),
        rot: rand(0, 6.28), vr: rand(-8, 8), seed: rand(0, 6.28)
      });
    }
  }
  const LEAVES = ['#2C7A47', '#52A956', '#8CCB6A', '#34884D'];
  const CONFETTI = ['#D7263D', '#FFD36E', '#2C7A47', '#FFF4DF', '#F7A1C4', '#5BB3E6', '#F2A541'];

  function drawBg(time) {
    const { ctx, w, h } = bg;
    ctx.clearRect(0, 0, w, h);
    if (sky.night > .01) {
      ctx.fillStyle = '#FFF6E0';
      for (const s of stars) {
        ctx.globalAlpha = sky.night * (.35 + .65 * (.5 + .5 * Math.sin(time * s.sp + s.ph)));
        ctx.fillRect(s.x * w, s.y * h, s.r * 1.6, s.r * 1.6);
      }
    }
    if (sky.orbit > .01) {
      ctx.globalCompositeOperation = 'lighter';
      for (const o of orbiters) {
        const a = o.a + time * o.sp;
        const x = sky.orbitX + Math.cos(a) * sky.orbitR * o.rr;
        const y = sky.orbitY + Math.sin(a) * sky.orbitR * o.rr * .45 + Math.sin(time * 2 + o.wob) * 6;
        const front = Math.sin(a) > 0 ? 1 : .5;
        ctx.globalAlpha = sky.orbit * .18 * front; ctx.fillStyle = '#FFB68A';
        ctx.beginPath(); ctx.arc(x, y, o.size * 4, 0, 6.28); ctx.fill();
        ctx.globalAlpha = sky.orbit * front; ctx.fillStyle = '#FFF1C9';
        ctx.beginPath(); ctx.arc(x, y, o.size, 0, 6.28); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    if (sky.night < .99) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#FFF3D0';
      for (const m of motes) {
        m.y -= m.vy * .016; if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); }
        ctx.globalAlpha = (1 - sky.night) * .45;
        ctx.beginPath(); ctx.arc(m.x * w + Math.sin(time * .7 + m.ph) * 14, m.y * h, m.r, 0, 6.28); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function drawFx(dt) {
    if (!parts.length && !fxDirty) return;
    const { ctx, w, h } = fx;
    ctx.clearRect(0, 0, w, h);
    fxDirty = parts.length > 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0 || p.y > h + 60) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d; p.vy *= d; p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const a = p.life / p.max;
      if (p.type === 'spark') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a * .3; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3.2, 0, 6.28); ctx.fill();
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.4 + .6 * a), 0, 6.28); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color; ctx.globalAlpha = a * .5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + (1 - a) * 2.2), 0, 6.28); ctx.fill();
      } else if (p.type === 'drop') {
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * .5, p.size * 1.5, 0, 0, 6.28);
        ctx.fill();
      } else if (p.type === 'heart') {
        ctx.save();
        ctx.translate(p.x + Math.sin(p.life * 5 + p.seed) * 8, p.y);
        const s = p.size / 10 * (a > .85 ? (1 - a) / .15 : 1);
        ctx.scale(s, s); ctx.rotate(Math.sin(p.seed + p.life * 3) * .3);
        ctx.globalAlpha = Math.min(1, a * 2.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-12, -4, -7, -14, 0, -7);
        ctx.bezierCurveTo(7, -14, 12, -4, 0, 4);
        ctx.fill();
        ctx.restore();
      } else {
        if (p.type === 'leaf') p.x += Math.sin(p.life * 3.5 + p.seed) * 45 * dt;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, a * 3);
        ctx.fillStyle = p.color;
        if (p.type === 'leaf') {
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * .45, p.size, 0, 0, 6.28); ctx.fill();
        } else {
          ctx.scale(1, Math.cos(p.rot * 1.7));
          ctx.fillRect(-p.size, -p.size * .5, p.size * 2, p.size);
        }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  ticker.add((time, deltaMs) => {
    const dt = Math.min(deltaMs / 1000, .05);
    drawBg(time);
    drawFx(dt);
  });

  /* ---------- sound (synthesised, no files) ---------- */
  const Sound = {
    ctx: null, out: null, on: opts.sound !== false,
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.out = this.ctx.createGain(); this.out.gain.value = .55;
        this.out.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(f, dur, { type = 'sine', vol = .2, to = null, delay = 0 } = {}) {
      if (!this.on || !this.ctx) return;
      const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .008);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(this.out); o.start(t); o.stop(t + dur + .05);
    },
    noise(dur, { vol = .12, from = 400, to = 2400, delay = 0 } = {}) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, t = c.currentTime + delay;
      const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(from, t); bp.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(bp).connect(g).connect(this.out); src.start(t);
    },
    /* leaves rustling: a scatter of tiny high hisses that swells and fades */
    rustle(dur = .6, vol = .06) {
      if (!this.on || !this.ctx) return;
      for (let t = 0; t < dur; t += .012 + Math.random() * .04) {
        const k = Math.sin(Math.PI * t / dur);
        this.noise(.03 + Math.random() * .07, { vol: .0005 + vol * k * (.35 + Math.random() * .65), from: 2600 + Math.random() * 3400, to: 1600 + Math.random() * 2600, delay: t });
      }
    },
    blip() { this.tone(620 + Math.random() * 500, .14, { type: 'triangle', vol: .1, to: 1500 }); },
    pluck() { this.tone(300, .2, { type: 'triangle', vol: .22, to: 680 }); this.noise(.1, { vol: .07, from: 2400, to: 700 }); },
    whoosh() { this.noise(.55, { vol: .1, from: 300, to: 2000 }); },
    thud() { this.tone(170, .28, { vol: .38, to: 55 }); },
    step() { this.tone(190 + Math.random() * 40, .07, { type: 'square', vol: .025, to: 110 }); },
    dig() { this.noise(.18, { vol: .1, from: 900, to: 220 }); this.tone(120 + Math.random() * 30, .12, { vol: .12, to: 70 }); },
    water() { this.noise(.4, { vol: .05, from: 700, to: 2600 }); },
    shine() { [784, 1047, 1319].forEach((f, i) => this.tone(f, .5, { type: 'sine', vol: .07, delay: i * .1 })); },
    magic() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 1, { vol: .06, delay: i * .08 })); },
    land() { this.thud(); [880, 1175].forEach((f, i) => this.tone(f, .3, { type: 'triangle', vol: .08, delay: .05 + i * .07 })); },
    fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, .4, { type: 'triangle', vol: .11, delay: i * .11 })); },
    /* a room full of hands: dozens of tiny noise claps, densest at the start */
    applause(dur = 3.4) {
      if (!this.on || !this.ctx) return;
      for (let t = 0; t < dur; t += .012 + Math.random() * .045) {
        const swell = t < .35 ? .45 + t / .35 * .55 : Math.max(.25, 1 - (t - .35) / dur);
        this.noise(.05 + Math.random() * .05, {
          vol: (.014 + Math.random() * .03) * swell,
          from: 1100 + Math.random() * 1600, to: 700 + Math.random() * 900, delay: t
        });
      }
      [0, .9, 1.8].forEach((d, i) => this.tone([1320, 1560, 1760][i], .5, { type: 'triangle', vol: .05, delay: d, to: 1980 }));
    },
  };


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
    const r = $('#fruit-btn').getBoundingClientRect();
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
      .from('#fruit-btn', { scale: .3, autoAlpha: 0, rotation: -25, duration: 1.6, ease: 'elastic.out(1,.5)' }, .35)
      .from('#tap-hint', { autoAlpha: 0, y: 12, duration: .7 }, 1.2)
      .from(sky, { orbit: 0, duration: 1.5 }, .4);

    const rx = gsap.quickTo('.fruit-tilt', 'rotationX', { duration: .9, ease: 'power3' });
    const ry = gsap.quickTo('.fruit-tilt', 'rotationY', { duration: .9, ease: 'power3' });
    addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      if (state === 'intro') { ry(nx * 34); rx(-ny * 34); }
      if (!reduceMotion) parTo(-nx * 26);
    }, { signal });
    $('#fruit-btn').addEventListener('mouseenter', () => state === 'intro' && gsap.to('.fruit-squash', { scale: 1.06, duration: .5, ease: 'back.out(3)' }));
    $('#fruit-btn').addEventListener('mouseleave', () => state === 'intro' && gsap.to('.fruit-squash', { scale: 1, duration: .5 }));
    $('#fruit-btn').addEventListener('click', () => { if (state === 'intro') story(); });
  }

  function openFruit() {
    state = 'opening';
    Sound.init(); Sound.magic();
    $('.fruit-float').style.animationPlayState = 'paused';
    const r = $('#fruit-btn').getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * .52;
    const [sw, sh] = spec.seedSize;
    gsap.set('#seed', { x: cx - sw / 2, y: cy - sh / 2, width: sw, height: sh, scale: 0, autoAlpha: 0 });
    gsap.set('.flash', { xPercent: -50, yPercent: -50, scale: .2 });
    gsap.set('.crack path', { drawSVG: '0%' });

    const tl = gsap.timeline();
    tl.to(['.eyebrow', '#title', '#tap-hint'], { autoAlpha: 0, y: -40, duration: .6, ease: 'power2.in', stagger: .06 }, 0)
      .to('.fruit-shadow', { autoAlpha: 0, duration: .5 }, 0)
      .to('.fruit-tilt', { rotationX: 0, rotationY: 0, duration: .5, ease: 'power2.out' }, 0)
      .to('.fruit-squash', { scaleX: 1.16, scaleY: .84, duration: .28, ease: 'power2.out' }, 0)
      .to('.fruit-squash', { scaleX: 1, scaleY: 1, duration: 1, ease: 'elastic.out(1.2,.3)' }, .28)
      .to('.fruit-squash', { keyframes: { rotation: [0, -9, 8, -6, 5, -3, 0] }, duration: .8, ease: 'none' }, .35)
      .to('.fruit-glow', { scale: 1.5, opacity: 1, duration: 1.3, ease: 'power2.out' }, 0)
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
      .to('.fruit-glow', { scale: .2, opacity: 0, duration: 1.1 }, 'split+=1')
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
    ticker.add(placeCan);
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
        ticker.remove(tick);
        can.removeEventListener('pointerdown', pour);
        removeEventListener('pointerup', stop);
        removeEventListener('pointercancel', stop);
        can.removeEventListener('keydown', key);
        const p = toScreen(400, 1744);
        burst(p.x, p.y, { n: 26, colors: ['#BFE6F5', '#FFFFFF', '#7FC4E4'], angle: -Math.PI / 2, spread: 2.4, speed: [90, 300], life: [.5, 1], gravity: 420, size: [1.6, 3.4] });
        Sound.tone(620, .3, { type: 'triangle', vol: .1, to: 980 });
        gsap.timeline({ onComplete: () => { ticker.remove(placeCan); gsap.set(can, { visibility: 'hidden' }); resolve(); } })
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
      addEventListener('pointerup', stop, { signal });
      addEventListener('pointercancel', stop, { signal });
      can.addEventListener('keydown', key);
      ticker.add(tick);
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
    const C = spec.flora.crown;
    const tl = gsap.timeline();
    tl.set('#sprout', { visibility: 'visible' }, 0)
      .call(() => flora.show(), null, 0)
      .fromTo('#ripple', { opacity: 1, scale: .2, svgOrigin: '400 1752' }, { opacity: 0, scale: 4, duration: 1.3, ease: 'expo.out' }, 0)
      .fromTo('#sprout', { scale: 0, svgOrigin: '400 1754' }, { scale: 1.4, duration: .8, ease: 'elastic.out(1,.4)' }, .05)
      .add('grow', .75)
      // the wood grows from the root out to the twigs, thickening as it goes; then the leaves open
      .to(flora.growth, { wood: 1, duration: 3, ease: 'power1.inOut' }, 'grow')
      .to('#plant-shade', { attr: { rx: C.rx * .75, ry: 16 }, duration: 3.2, ease: 'power1.inOut' }, 'grow')
      .to('#sprout', { scale: 0, duration: .4, ease: 'back.in(2)' }, 'grow+=.25')
      .to(cam, { t: 1, duration: 2.5, ease: 'power2.inOut', onUpdate: renderCam }, 'grow+=.15')
      .call(() => Sound.tone(110, 2, { type: 'sine', vol: .12, to: 330 }), null, 'grow')
      .to(flora.growth, { leaves: 1, duration: 1.7, ease: 'power1.out' }, 'grow+=1.5')
      .call(() => {
        Sound.whoosh(); Sound.rustle(1.4, .05);
        for (let i = 0; i < 22; i++) {
          const c = inCrown(), p = toScreen(c.x, c.y);
          burst(p.x, p.y, { n: 2, type: 'leaf', colors: LEAVES, angle: -Math.PI / 2, spread: 3, speed: [60, 260], life: [1.6, 2.8], gravity: 120, size: [5, 9], drag: .95 });
        }
      }, null, 'grow+=2.2')
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
    const x0 = view.vbX - 120, x1 = isGround ? spec.underground.kidX : LADDER.bx, hops = 4, d = .5;
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
  const REACH = spec.reach || 560;     // how far the picker can stretch, in world units
  const POLE_REACH = spec.pole ? spec.poleReach : 0;   // how far the pole can go
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
    if (isGround) return;                // potatoes are all in reach once the plant is pulled
    const hx = pose.x, hy = pose.y - 170;
    for (const n of nodes) {
      if (n.picked) continue;
      const dist = Math.hypot(n.x - hx, n.y - hy);
      const ok = state === 'play' && dist < REACH;
      const byPole = !ok && state === 'play' && gripped && dist < POLE_REACH;
      if (ok !== n.reach || byPole !== n.poleReach) {
        const woke = (ok || byPole) && !(n.reach || n.poleReach);
        n.reach = ok; n.poleReach = byPole;
        n.el.classList.toggle('reachable', ok || byPole);
        n.el.classList.toggle('by-pole', byPole);
        if (woke) wakeFruit(n);            // "you can pick me now" — the cue a child reads instantly
      }
    }
  }
  /* an apple that just came within reach hops, sparkles and chimes */
  function wakeFruit(n) {
    gsap.fromTo(n.inner, { scale: 1 }, { scale: 1.22, duration: .26, ease: 'back.out(3.5)', yoyo: true, repeat: 1, overwrite: 'auto' });
    const r = n.el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, {
      n: 12, colors: ['#FFE7A3', '#FFFFFF', '#FFB68A'], speed: [60, 210], life: [.4, .9], gravity: 40, size: [1.4, 2.8]
    });
    Sound.tone(880 + Math.random() * 300, .16, { type: 'triangle', vol: .07, to: 1400 });
  }
  ticker.add(() => { placeSteer(); updateReach(); });

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

  const canSteer = () => !isGround && (state === 'ready' || state === 'play');
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
    if (!isGround) { Sound.init(); Sound.rustle(.4, .045); }
    flora.shake(x, y, 1, 190);
    for (const n of nodes) {
      if (n.picked || Math.hypot(n.x - x, n.y - y) > 230) continue;
      gsap.fromTo(n.inner, { rotation: 0 }, { keyframes: { rotation: [0, -12, 9, -5, 0] }, duration: .7, ease: 'none' });
    }
  }

  /* ---------- the pole with a net: for fruit the hand can't reach (spec.pole) ---------- */
  let poleBusy = false;
  const poleHand = () => ({ x: pose.x + 40, y: pose.y - 206 });
  function drawPole(tip) {
    const h = poleHand(), stick = $('#pole-stick'), shine = $('#pole-shine');
    for (const el of [stick, shine]) {
      el.setAttribute('x1', h.x.toFixed(1)); el.setAttribute('y1', h.y.toFixed(1));
      el.setAttribute('x2', tip.x.toFixed(1)); el.setAttribute('y2', tip.y.toFixed(1));
    }
    $('#pole-net').setAttribute('transform', `translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)})`);
  }
  function poleCatch(n) {
    if (poleBusy) return;
    poleBusy = true;
    n.picked = true; touched = true;
    gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
    n.el.classList.remove('ripe'); n.el.tabIndex = -1;
    Sound.init(); Sound.whoosh();
    const tip = poleHand(), draw = () => drawPole(tip);
    gsap.set('#pole', { visibility: 'visible' });
    draw();
    gsap.timeline({ onComplete: () => { poleBusy = false; gsap.set('#pole', { visibility: 'hidden' }); } })
      .to(pose, { hRx: 58, hRy: -236, duration: .3, ease: 'power2.out', onUpdate: renderPose }, 0)   // reach up with the pole
      .to(tip, { x: n.x, y: n.y + 34, duration: .55, ease: 'power3.out', onUpdate: draw }, 0)         // net slides under the fruit
      .call(() => { shakeNear(n.x, n.y); Sound.pluck(); })
      .to(tip, { y: '+=12', duration: .07, yoyo: true, repeat: 3, ease: 'sine.inOut', onUpdate: draw })  // a little tug
      .call(() => { const f = detach(n, 1.15); flyToBasket(f); })
      .to(tip, { x: () => poleHand().x, y: () => poleHand().y, duration: .45, ease: 'power2.in', onUpdate: draw })
      .to(pose, { ...(phase % 2 ? POSE.A : POSE.B), duration: .3, onUpdate: renderPose }, '<');
  }

  function pluck(n) {
    if (state !== 'play' || n.picked) return null;
    if (!n.reach) { n.poleReach ? poleCatch(n) : tooHigh(n); return null; }
    n.picked = true; touched = true;
    if (isGround) scoopFor(n);
    gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
    n.el.classList.remove('ripe'); n.el.tabIndex = -1;
    Sound.init(); Sound.pluck();
    return detach(n, 1.3);
  }

  /* the fruit leaves its branch and becomes a free flyer on the overlay */
  function detach(n, pop) {
    const r = n.el.getBoundingClientRect();
    shakeNear(n.x, n.y);
    if (isGround) burst(r.left + r.width / 2, r.top + r.height * .5, { n: 16, type: 'dust', colors: SOIL_DUST, angle: -Math.PI / 2, spread: 2.4, speed: [60, 240], life: [.5, .9], gravity: 420, size: [3, 7] });
    else burst(r.left + r.width / 2, r.top + r.height * .3, { n: 4, type: 'leaf', colors: LEAVES, angle: -Math.PI / 2, spread: 2.4, speed: [40, 160], life: [1.8, 2.8], gravity: 110, size: [5, 8], drag: .95 });
    flora.detach(n.i);                    // its stalk stays on the tree no longer
    const f = document.createElement('div');
    f.className = 'flyer';
    f.innerHTML = fruitPicture();
    Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    overlay.append(f);
    gsap.set(n.el, { autoAlpha: 0 });
    gsap.fromTo(f, { scale: 1 }, { scale: pop, duration: .3, ease: 'back.out(3)' });
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
    const layer = $('.b-fruits');
    const br = basketBody.getBoundingClientRect(), k = br.width / 260, local = basketBody.offsetWidth / br.width;
    const fr = f.getBoundingClientRect();
    const slotScreen = { x: br.left + slot[0] * k, y: br.top + slot[1] * k };
    const el = document.createElement('div');
    el.className = 'b-fruit';
    el.innerHTML = fruitPicture();
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
      if (landed === POSITIONS.length) gsap.delayedCall(.6, finale);
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
    gsap.to('.b-fruit', { y: -18, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out', stagger: .04 });

    if (!isGround) { flora.shake(spec.flora.crown.cx, spec.flora.crown.cy, 1.3, 900); Sound.rustle(1.1, .07); }   // the whole tree cheers

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
    if (!isGround) {
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
    }

    // off the ladder, or up out of the crouch
    if (isGround) {
      scoop?.kill();
      await gsap.to(pose, { ...POSE.STAND, y: GROUND, lean: 0, duration: .45, ease: 'back.out(2)', onUpdate: R });
    }

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

  /* =====================================================================
     kind: 'ground' — crops whose harvest grows in the soil (potato)
     ===================================================================== */
  const SOIL_TOP = 1790;
  const MOTHER = [400, 1814];
  const roots = [];
  const SOIL_DUST = ['#8A6A4F', '#6F5440', '#E8D6A8'];

  function buildUnderground() {
    const U = spec.underground, r = rng(5);
    const ug = $('#underground');
    // plain earth under the lawn, so panning down never shows sky
    svgEl('rect', { x: -2000, y: SOIL_TOP - 4, width: 4800, height: 900, fill: '#5A3A22' }, ug);

    // the detailed cross-section sits behind a lens that opens while the plant grows
    const clip = svgEl('clipPath', { id: 'soil-clip' }, svgEl('defs', {}, ug));
    svgEl('circle', { id: 'soil-lens', cx: MOTHER[0], cy: MOTHER[1], r: 0 }, clip);
    const cross = svgEl('g', { 'clip-path': 'url(#soil-clip)' }, ug);
    U.strata.forEach(([y, fill]) => {
      let d = `M-2000,${y}`;
      for (let x = -2000; x < 2800; x += 200) d += ` Q${x + 100},${(y + r() * 30 - 15).toFixed(1)} ${x + 200},${(y + r() * 16 - 8).toFixed(1)}`;
      svgEl('path', { d: `${d} L2800,2500 L-2000,2500 Z`, fill }, cross);
    });
    for (let i = 0; i < U.pebbles; i++) {
      const x = -300 + r() * 1400, y = SOIL_TOP + 30 + r() * 560;
      if (POSITIONS.some(([px, py]) => Math.hypot(px - x, py - y) < 60) || Math.hypot(x - MOTHER[0], y - MOTHER[1]) < 50) continue;
      svgEl('ellipse', {
        cx: x.toFixed(1), cy: y.toFixed(1), rx: (5 + r() * 12).toFixed(1), ry: (4 + r() * 7).toFixed(1),
        fill: r() > .5 ? '#8A6A4F' : '#6F5440', opacity: .85, transform: `rotate(${(r() * 180) | 0} ${x.toFixed(1)} ${y.toFixed(1)})`
      }, cross);
    }
    const worm = svgEl('path', { d: U.worm, fill: 'none', stroke: '#E98FA0', 'stroke-width': 10, 'stroke-linecap': 'round', style: 'cursor:pointer' }, cross);
    gsap.to(worm, { x: 10, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    worm.addEventListener('pointerdown', () => {
      Sound.init(); Sound.tone(700, .18, { type: 'triangle', vol: .08, to: 1100 });
      gsap.fromTo(worm, { scaleX: 1 }, { scaleX: 1.25, duration: .18, yoyo: true, repeat: 3, transformOrigin: '0% 50%', ease: 'sine.inOut' });
    });

    // pale roots from the planted piece to every tuber, plus a few fine hairs
    const rg = svgEl('g', { fill: 'none', stroke: '#EADBC0', 'stroke-linecap': 'round' }, cross);
    const [mx, my] = MOTHER;
    POSITIONS.forEach(([tx, ty], i) => {
      const d = `M${mx},${my + 6} C${mx + (tx - mx) * .15},${my + 40} ${tx - (tx - mx) * .35},${ty - 60} ${tx},${ty - 14}`;
      roots.push(svgEl('path', { d, 'stroke-width': i < U.shallow ? 4 : 3.2 }, rg));
    });
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * (.15 + .7 * r()), len = 60 + r() * 90, side = r() > .5 ? 1 : -1;
      const x2 = mx + Math.cos(a) * len * side, y2 = my + Math.sin(a) * len;
      roots.push(svgEl('path', { d: `M${mx},${my + 4} Q${((mx + x2) / 2 + r() * 30 - 15).toFixed(1)},${((my + y2) / 2).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, 'stroke-width': 1.6, opacity: .7 }, rg));
    }
    const holder = svgEl('g', { transform: `translate(${mx} ${my})` }, cross);
    const mother = svgEl('g', { id: 'mother', transform: 'scale(.62)' }, holder);
    mother.innerHTML = U.mother;
    gsap.set(roots, { drawSVG: '0%' });

    // above the soil the plant itself is 3D (flora3d.js); here is just the area you grab it by
    const plant = $('#plant');
    svgEl('rect', { id: 'plant-hit', x: 270, y: 1470, width: 260, height: 300, fill: 'transparent' }, plant);
  }

  /* the growth, seen through the soil: the camera goes down, the ground opens like a lens */
  function growPotato() {
    const shrink = { s: .62 };
    const tl = gsap.timeline();
    tl.set(['#plant', '#underground', '#sprout'], { visibility: 'visible' }, 0)
      .call(() => flora.show(), null, 0)
      .fromTo('#ripple', { opacity: 1, scale: .2, svgOrigin: '400 1752' }, { opacity: 0, scale: 4, duration: 1.3, ease: 'expo.out' }, 0)
      .fromTo('#sprout', { scale: 0, svgOrigin: '400 1754' }, { scale: 1.4, duration: .8, ease: 'elastic.out(1,.4)' }, .05)
      .add('look', .8)
      .to(cam, { d: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: renderCam }, 'look')
      .to('#soil-lens', { attr: { r: 1500 }, duration: 2.6, ease: 'power2.inOut' }, 'look+=.5')
      .call(() => { Sound.whoosh(); Sound.tone(220, 1.6, { vol: .08, to: 440 }); }, null, 'look+=.5')
      .to('#sprout', { scale: 0, duration: .4, ease: 'back.in(2)' }, 'look+=1.2')
      .to(flora.growth, { wood: 1, duration: 1.8, ease: 'power2.out' }, 'look+=1.2')
      .to('#plant-shade', { attr: { rx: 120, ry: 10 }, duration: 1.8, ease: 'power2.out' }, 'look+=1.2')
      .to(flora.growth, { leaves: 1, duration: 1.6, ease: 'power1.out' }, 'look+=1.5')
      .to(roots, { drawSVG: '100%', duration: 1.6, ease: 'power2.out', stagger: .06 }, 'look+=2.1')
      // the planted piece feeds the plant, so it shrinks and shrivels
      .to(shrink, { s: .36, duration: 3.2, ease: 'sine.inOut', onUpdate: () => $('#mother').setAttribute('transform', `scale(${shrink.s.toFixed(3)})`) }, 'look+=2.1')
      .to('#mother', { opacity: .7, duration: 3.2 }, 'look+=2.1')
      .to(flora.growth, { flowers: 1, duration: .8, ease: 'back.out(2.5)' }, 'look+=3')
      .to(nodes.map(n => n.inner), { scale: 1, duration: 1, ease: 'elastic.out(1,.5)', stagger: .22 }, 'look+=3.2');
    nodes.forEach((n, i) => tl.call(() => {
      Sound.blip();
      const p = n.el.getBoundingClientRect();
      burst(p.left + p.width / 2, p.top + p.height / 2, { n: 8, type: 'dust', colors: SOIL_DUST, speed: [30, 110], life: [.4, .8], gravity: 80, size: [2, 5] });
    }, null, `look+=${(3.25 + i * .22).toFixed(2)}`));
    return tl;
  }

  /* harvest, part one: the kid grabs the plant and the player pulls it out */
  function pullPlant() {
    const U = spec.underground, R = renderPose, hit = $('#plant-hit');
    setCaptionKeys('pullTitle', 'pullSub');
    gsap.getById('idle')?.kill();
    gsap.to(pose, { x: 468, hLx: -62, hLy: -128, hRx: -44, hRy: -112, kLx: -20, kLy: -40, kRx: 12, kRy: -42, lean: 4, head: -6, duration: .5, ease: 'power2.out', onUpdate: R });

    let done = false, dragging = false, fromY = 0, fromP = 0, progress = 0;
    gsap.delayedCall(1, () => { if (!done && progress === 0) pointAt(hit); });

    return new Promise(resolve => {
      const setProgress = p => {
        progress = clamp(p, 0, 1);
        flora.pose.sy = 1 + progress * .18;           // the plant stretches as you pull
        flora.pose.sx = 1 - progress * .05;
        pose.lean = 4 + progress * 14; R();
        if (Math.random() < .35) {
          const b = toScreen(400 + rand(-40, 40), 1770);
          burst(b.x, b.y, { n: 2, type: 'dust', colors: SOIL_DUST, angle: -Math.PI / 2, spread: 2, speed: [30, 90], life: [.4, .7], gravity: 200, size: [2, 5] });
        }
        if (progress >= 1) uproot();
      };
      const down = e => {
        if (done) return;
        e.preventDefault();
        dragging = true; fromY = e.clientY; fromP = progress;
        hit.setPointerCapture && hit.setPointerCapture(e.pointerId);
        gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
        Sound.init();
      };
      const move = e => {
        if (!dragging || done) return;
        setProgress(fromP + (fromY - e.clientY) / (160 * Math.max(view.s, .6)));
        if (Math.random() < .12) Sound.tone(140 + progress * 120, .1, { type: 'sawtooth', vol: .02, to: 120 });
      };
      const up = e => {
        if (!dragging || done) return;
        dragging = false;
        if (Math.abs(e.clientY - fromY) < 8) {             // a tap tugs it a third of the way
          Sound.tone(180 + progress * 160, .14, { type: 'triangle', vol: .08, to: 120 });
          gsap.fromTo(pose, { lean: pose.lean + 6 }, { lean: 4 + (progress + .34) * 14, duration: .3, ease: 'elastic.out(1,.4)', onUpdate: R });
          setProgress(progress + .34);
        } else if (progress < 1) {                         // let go too early: it springs back a little
          const back = { p: progress };
          gsap.to(back, { p: progress * .7, duration: .4, ease: 'power2.out', onUpdate: () => setProgress(back.p) });
        }
      };
      const uproot = () => {
        if (done) return;
        done = true;
        hit.removeEventListener('pointerdown', down);
        hit.removeEventListener('pointermove', move);
        hit.removeEventListener('pointerup', up);
        hit.style.pointerEvents = 'none';
        gsap.killTweensOf('#hand'); gsap.set('#hand', { autoAlpha: 0 });
        Sound.thud(); Sound.pluck(); Sound.whoosh(); Sound.rustle(.7, .07);
        const base = toScreen(400, 1764);
        burst(base.x, base.y, { n: 44, type: 'dust', colors: SOIL_DUST, angle: -Math.PI / 2, spread: 2.4, speed: [120, 440], life: [.6, 1.1], gravity: 700, size: [4, 9] });
        gsap.to(roots.slice(0, U.shallow), { opacity: 0, duration: .3 });

        const tl = gsap.timeline({ onComplete: resolve });
        tl.to(flora.pose, { sy: 1, sx: 1, duration: .2 }, 0)
          .to(flora.pose, { y: -150, duration: .45, ease: 'power2.out' }, 0)
          .to('#plant-shade', { attr: { rx: 0, ry: 0 }, duration: .4 }, 0)
          .to(flora.pose, { y: 20, x: 250, rot: 82, duration: .7, ease: 'power2.in' }, .45)
          .to(flora.pose, { opacity: 0, duration: .5 }, 1.3)
          // the kid lands on his bottom, then bounces back up
          .to(pose, { ...POSE.AIR, lean: 26, sx: 1.15, sy: .8, y: GROUND + 6, duration: .25, ease: 'power2.out', onUpdate: R }, 0)
          .to(pose, { ...POSE.STAND, lean: 0, sx: 1, sy: 1, y: GROUND, head: 0, duration: .7, ease: 'elastic.out(1,.45)', onUpdate: R }, .55)
          .call(() => hearts(3), null, .9);
        // the shallow potatoes come up with the roots and tumble onto the lawn
        nodes.slice(0, U.shallow).forEach((n, i) => {
          const [sx, sy] = U.surface[i], x0 = n.x, y0 = n.y;
          const peak = Math.min(y0, sy) - 170 - i * 18, arc = { t: 0 };
          tl.to(arc, {
            t: 1, duration: .9, ease: 'power1.inOut',
            onUpdate: () => {
              const k = arc.t, j = 1 - k;
              n.x = j * j * x0 + 2 * j * k * ((x0 + sx) / 2) + k * k * sx;
              n.y = j * j * y0 + 2 * j * k * peak + k * k * sy;
              placeNode(n);
            }
          }, .1 + i * .08)
            .to(n.inner, { rotation: 360 + rand(-25, 25), duration: .9, ease: 'power1.out' }, .1 + i * .08)
            .call(() => {
              Sound.tone(160, .14, { vol: .12, to: 80 });
              const s = toScreen(n.x, n.y + 20);
              burst(s.x, s.y, { n: 10, type: 'dust', colors: ['#E8D6A8'], angle: -Math.PI / 2, spread: 2.6, speed: [30, 120], life: [.4, .7], gravity: 60, size: [3, 6] });
            }, null, 1 + i * .08);
        });
      };
      hit.addEventListener('pointerdown', down);
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerup', up);
      hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProgress(progress + .34); } });
    });
  }

  /* crouched by the soil, the kid shuffles over and scoops each potato out as it comes */
  let scoop = null;
  function scoopFor(n) {
    const side = n.x < pose.x ? -1 : 1, C = POSE.CROUCH;
    scoop?.kill();
    scoop = gsap.timeline({ defaults: { onUpdate: renderPose } })
      // stays between the potatoes lying on the lawn, and leans over toward the one coming out
      .to(pose, { x: clamp(n.x - side * 24, 410, 480), duration: .35, ease: 'power2.out' }, 0)
      .to(pose, { y: GROUND + CROUCH_DROP - 10, duration: .12, yoyo: true, repeat: 1, ease: 'sine.out' }, 0)
      .to(pose, { hLx: -18 + side * 14, hLy: -42, hRx: 18 + side * 14, hRy: -40, kLx: C.kLx, kRx: C.kRx, lean: side * 7, duration: .2, ease: 'power2.in' }, 0)
      .to(pose, { hLx: -46, hLy: -128, hRx: 46, hRy: -128, lean: 0, duration: .22, ease: 'power2.out' })
      .to(pose, { hLx: C.hLx, hLy: C.hLy, hRx: C.hRx, hRy: C.hRy, y: GROUND + CROUCH_DROP, duration: .3, ease: 'power2.inOut' });
  }

  /* harvest, part two: every potato is now yours to dig out and carry to the basket */
  function enableDigging() {
    gsap.to(pose, { ...POSE.CROUCH, y: GROUND + CROUCH_DROP, lean: 0, head: 0, duration: .6, ease: 'power2.inOut', onUpdate: renderPose });
    nodes.forEach((n, i) => {
      n.reach = true;
      n.el.classList.add('reachable');
      gsap.delayedCall(i * .12, () => wakeFruit(n));
    });
    enablePlay();
  }

  /* ---------- the whole story ---------- */
  async function story() {
    const opening = openFruit();
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
    if (isGround) {
      await growPotato();
      startFlutters();
      await setCaptionKeys('grownTitle', 'grownSub');
      await wait(2.6);
      await kidIn();
      await pullPlant();
      enableDigging();
      return;
    }
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
    $('#count-of').textContent = `${t('of')} ${num(POSITIONS.length)}`;
    $('#rungs').textContent = `${num(phase / 2)} / ${num(PHASES / 2)}`;
    nodes.forEach((n, i) => n.el.setAttribute('aria-label', `${t('fruitAria')} ${num(i + 1)}`));
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
  $('#lang').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    opts.onLang && opts.onLang(lang);
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
  }, { signal });

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
    Sound.rustle(.6, .08);
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
    gsap.fromTo('.b-fruit', { y: 0 }, { y: -14, duration: .2, stagger: .03, yoyo: true, repeat: 1, ease: 'power2.out' });
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
    if (isGround && state === 'play') {     // busy digging: a happy wiggle without getting up
      gsap.timeline({ defaults: { onUpdate: R } })
        .to(pose, { head: -12, sx: 1.06, sy: .94, duration: .15 })
        .to(pose, { head: 10, duration: .18 })
        .to(pose, { head: 0, sx: 1, sy: 1, duration: .3, ease: 'elastic.out(1,.5)' });
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
  $('#flora').addEventListener('pointerdown', e => {
    const w = toWorld(e.clientX, e.clientY);
    if (flora && flora.hit(w.x, w.y)) tapTree(e);
  });
  ['#ground-path', '#tufts'].forEach(sel => $(sel).addEventListener('pointerdown', tapGround));
  $('#basket').addEventListener('pointerdown', tapBasket);
  $('#kid').addEventListener('pointerdown', tapKid);

  $('#replay').addEventListener('click', () => opts.onReplay && opts.onReplay());
  $('#to-orchard').addEventListener('click', () => opts.onExit && opts.onExit());
  $('#home').addEventListener('click', () => opts.onExit && opts.onExit());
  $('#sound').addEventListener('click', e => {
    Sound.on = !Sound.on;
    e.currentTarget.setAttribute('aria-pressed', String(Sound.on));
    opts.onSound && opts.onSound(Sound.on);
    if (Sound.on) { Sound.init(); Sound.blip(); }
  });
  stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; });
  addEventListener('resize', () => { layout(); if (state === 'intro') measureOrbit(); flutters.forEach(placeFlutter); }, { signal });

  function boot() {
    stage.classList.toggle('kind-ground', isGround);
    buildGround();
    flora = createFlora({ canvas: $('#flora'), spec, reduceMotion });
    ticker.add(time => flora.render(time));
    fruit3d = createFruits({ canvas: $('#fruit3d'), spec });
    if (fruit3d) {
      stage.classList.add('fruits-3d');
      fruitPicture = () => `<img src="${fruit3d.sprite}" alt="" draggable="false">`;
      ticker.add(drawFruit3d);
    }
    if (import.meta.env.DEV) window.__orchard = { flora, fruit3d };   // poke at it from the console
    if (isGround) buildUnderground(); else buildLadder();
    buildFruits();
    applyLang();
    $('#sound').setAttribute('aria-pressed', String(Sound.on));
    layout();
    renderPose();
    intro();
  }
  let booted = false;
  const go = () => { if (!booted && !destroyed) { booted = true; boot(); } };
  (document.fonts?.ready ?? Promise.resolve()).then(go);
  const bootFallback = setTimeout(go, 1800);


  return {
    destroy() {
      destroyed = true;
      clearTimeout(bootFallback);
      lifetime.abort();
      ticker.live.forEach(fn => gsap.ticker.remove(fn));
      ticker.live.clear();
      gsap.globalTimeline.getChildren(true, true, true).forEach(child => child.kill());
      gsap.globalTimeline.timeScale(1);
      if (Sound.ctx) Sound.ctx.close().catch(() => {});
      flora?.destroy();
      fruit3d?.destroy();
    },
  };
}
