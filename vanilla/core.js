/* بستان التفاحة — scene, camera, particles, sound */
gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, Draggable, SplitText);
document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = s => new Promise(r => gsap.delayedCall(s, r));
const ar = n => n.toLocaleString('ar-EG');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
const APPLES = [[262, 556], [345, 436], [488, 414], [596, 520], [660, 690], [520, 650], [395, 590], [292, 735], [172, 700], [604, 855]];
// basket slots in basket units (260 × 230)
const SLOTS = [[72, 118], [110, 120], [150, 120], [188, 118], [92, 96], [130, 98], [170, 96], [112, 74], [150, 74], [131, 54]];
const APPLE_SVG = '<svg viewBox="-120 -140 240 260" aria-hidden="true"><use href="#apple" x="-120" y="-140" width="240" height="260"/></svg>';

const stage = $('#stage'), world = $('#world'), scene = $('#scene'), far = $('#far');
const overlay = $('#overlay');

/* ---------- layout + camera ---------- */
const view = { vw: 0, vh: 0, s: 1, vbX: 0 };
const cam = { t: 0, lift: 1 };
const par = { x: 0 };
let worldY = 0;

function camTop() {
  const { vh, s } = view;
  return clamp(Math.max(110, 0.15 * vh) - vh + (H - 330) * s, 0, Math.max(0, H * s - vh));
}
function renderCam() {
  const c = cam.t * camTop();
  worldY = c + cam.lift * view.vh * 0.5;
  world.style.transform = `translate3d(${par.x * 0.35}px,${worldY}px,0)`;
  far.style.transform = `translate3d(${par.x}px,${c * 0.2 + cam.lift * view.vh * 0.22}px,0)`;
}
function toScreen(x, y) {
  return { x: (x - view.vbX) * view.s + par.x * 0.35, y: (view.vh - H * view.s) + y * view.s + worldY };
}
const parTo = gsap.quickTo(par, 'x', { duration: 1.4, ease: 'power3', onUpdate: renderCam });

function layout() {
  if (!innerWidth || !innerHeight) return;
  view.vw = innerWidth; view.vh = innerHeight;
  view.s = Math.min(view.vh * 2.1 / H, view.vw * 1.1 / W);
  const vbW = view.vw / view.s;
  view.vbX = -(vbW - W) / 2;
  scene.setAttribute('viewBox', `${view.vbX} 0 ${vbW} ${H}`);
  world.style.width = view.vw + 'px';
  world.style.height = H * view.s + 'px';
  world.style.top = (view.vh - H * view.s) + 'px';
  placeApples();
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

const canopy = [];   // {el, cx, cy}
const speckles = [];
function buildCanopy() {
  const r = rng(11);
  const layers = [
    { n: 40, r0: 58, r1: 92, fill: '#1C5A3A', k: 1, dx: 0, dy: 22, back: true },
    { n: 38, r0: 50, r1: 82, fill: '#267045', k: .92, dx: 0, dy: 4 },
    { n: 32, r0: 42, r1: 70, fill: '#34884D', k: .8, dx: -10, dy: -18 },
    { n: 24, r0: 30, r1: 54, fill: '#52A956', k: .66, dx: -36, dy: -52 },
    { n: 14, r0: 16, r1: 32, fill: '#8CCB6A', k: .5, dx: -70, dy: -96 },
  ];
  const back = $('#canopy-back'), front = $('#canopy-front');
  layers.forEach(L => {
    for (let i = 0; i < L.n; i++) {
      const a = r() * Math.PI * 2;
      const d = L.back ? .45 + .55 * Math.sqrt(r()) : Math.sqrt(r());
      const cx = 400 + L.dx + Math.cos(a) * 300 * L.k * d;
      const cy = 610 + L.dy + Math.sin(a) * 310 * L.k * d;
      const el = svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: (L.r0 + r() * (L.r1 - L.r0)).toFixed(1), fill: L.fill }, L.back ? back : front);
      canopy.push({ el, cx, cy });
    }
  });
  const sg = $('#speckles');
  for (let i = 0; i < 64; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const cx = 370 + Math.cos(a) * 250 * d, cy = 560 + Math.sin(a) * 270 * d;
    const el = svgEl('path', {
      d: `M${cx},${cy - 11} C${cx + 7},${cy - 4} ${cx + 5},${cy + 8} ${cx},${cy + 11} C${cx - 5},${cy + 8} ${cx - 7},${cy - 4} ${cx},${cy - 11}Z`,
      fill: r() > .4 ? '#B9E38C' : '#6FBF5F', opacity: .8,
      transform: `rotate(${(r() * 360) | 0} ${cx} ${cy})`
    }, sg);
    speckles.push(el);
  }
  canopy.sort((a, b) => Math.hypot(a.cx - 400, a.cy - 980) - Math.hypot(b.cx - 400, b.cy - 980));
  gsap.set(canopy.map(c => c.el), { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(speckles, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set('#branches path', { drawSVG: '0%' });
  gsap.set('#trunk', { scaleY: 0, scaleX: .3, svgOrigin: '400 1768' });
}

const rungs = [];
function buildLadder() {
  const g = $('#ladder-rungs');
  for (let k = 1; k <= 16; k++) {
    const y = GROUND - k * RUNG, xc = ladderX(y);
    rungs.push(svgEl('line', { x1: xc - 40, y1: y, x2: xc + 40, y2: y, class: 'rung' }, g));
  }
  gsap.set(rungs, { scaleX: 0, transformOrigin: '50% 50%' });
  gsap.set('#ladder .rail, #ladder .rail-hi', { drawSVG: '0%' });
}

const nodes = [];
function buildApples() {
  const layer = $('#apples');
  APPLES.forEach(([x, y], i) => {
    const el = document.createElement('div');
    el.className = 'apple-node';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `تفاحة ${ar(i + 1)}`);
    el.tabIndex = -1;
    el.innerHTML = `<div class="apple-inner"><span class="ring" style="animation-delay:${(i * .37) % 1.9}s"></span>${APPLE_SVG}</div>`;
    el.querySelector('svg').style.animationDelay = `${-rand(0, 3.2)}s`;
    layer.append(el);
    const n = { el, inner: el.firstElementChild, x, y, i, picked: false };
    gsap.set(n.inner, { scale: 0 });
    nodes.push(n);
  });
}
function placeApples() {
  const size = Math.max(66 * view.s, 48), h = size * 260 / 240;
  for (const n of nodes) {
    Object.assign(n.el.style, {
      width: size + 'px', height: h + 'px',
      left: ((n.x - view.vbX) * view.s - size / 2) + 'px',
      top: (n.y * view.s - h / 2) + 'px'
    });
  }
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
  const tx = rand(120, 680), ty = rand(330, 1300);
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
};
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
gsap.ticker.add((time, deltaMs) => {
  const dt = Math.min(deltaMs / 1000, .05);
  drawBg(time);
  drawFx(dt);
});

/* ---------- sound (synthesised, no files) ---------- */
const Sound = {
  ctx: null, out: null, on: true,
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
  blip() { this.tone(620 + Math.random() * 500, .14, { type: 'triangle', vol: .1, to: 1500 }); },
  pluck() { this.tone(300, .2, { type: 'triangle', vol: .22, to: 680 }); this.noise(.1, { vol: .07, from: 2400, to: 700 }); },
  whoosh() { this.noise(.55, { vol: .1, from: 300, to: 2000 }); },
  thud() { this.tone(170, .28, { vol: .38, to: 55 }); },
  step() { this.tone(190 + Math.random() * 40, .07, { type: 'square', vol: .025, to: 110 }); },
  magic() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 1, { vol: .06, delay: i * .08 })); },
  land() { this.thud(); [880, 1175].forEach((f, i) => this.tone(f, .3, { type: 'triangle', vol: .08, delay: .05 + i * .07 })); },
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, .4, { type: 'triangle', vol: .11, delay: i * .11 })); },
};
