/* الحشرات — pests, and the friends who deal with them. No timers and nothing is ever lost: the plant simply
   waits until the child has helped it.

   On a tree:   green caterpillars crawl on the crown. Tap one and a ladybug flies in on a curve, lands on it,
                munches it up in three bites (crunch, crunch, crunch), and flies off in a puff of hearts.
                onTree(n) → resolves when they're all gone. onFruit(node) puts one on a fruit while picking:
                that fruit can't be picked until the ladybug has been.
   In the soil: striped potato beetles (the real pest of potatoes) creep over the leaves. Tap one and a spray
                bottle of soapy water flies over and sprays it in bubbles: the beetle rolls on its back, kicks,
                rights itself and scuttles off. onPlant(n) → resolves when they've all gone.

   Pests live in world units (the same as the SVG scene) in #pests, a layer inside #world, so they ride along
   with the camera. place() puts them back after a resize. */

const CATERPILLAR = `<svg viewBox="-44 -26 88 44" aria-hidden="true">
  <g class="pt-legs" stroke="#2F6B2A" stroke-width="3" stroke-linecap="round">
    <path d="M-26,9 v6 M-13,10 v6 M0,10 v6 M13,10 v6"/></g>
  <g class="pt-body">
    <circle class="pt-seg" cx="-30" cy="2" r="9" fill="#7CC243"/><circle class="pt-seg" cx="-17" cy="0" r="10.5" fill="#8BD04E"/>
    <circle class="pt-seg" cx="-3" cy="-1" r="11" fill="#7CC243"/><circle class="pt-seg" cx="11" cy="-1" r="11" fill="#8BD04E"/>
    <g class="pt-head"><circle cx="27" cy="-5" r="13" fill="#9BDB5A"/>
      <path d="M22,-17 q-4,-8 -1,-11 M32,-17 q4,-8 1,-11" stroke="#2F6B2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="21" cy="-28" r="2.6" fill="#E8483B"/><circle cx="33" cy="-28" r="2.6" fill="#E8483B"/>
      <circle cx="23" cy="-7" r="3.4" fill="#1B1F3B"/><circle cx="32" cy="-7" r="3.4" fill="#1B1F3B"/>
      <circle cx="24" cy="-8.2" r="1.1" fill="#fff"/><circle cx="33" cy="-8.2" r="1.1" fill="#fff"/>
      <path d="M24,0 q4,4 8,0" stroke="#1B1F3B" stroke-width="2" fill="none" stroke-linecap="round"/></g>
    <g fill="#5A9E2F" opacity=".55"><circle cx="-17" cy="-5" r="2.4"/><circle cx="-3" cy="-6" r="2.4"/><circle cx="11" cy="-6" r="2.4"/></g>
  </g></svg>`;

const LADYBUG = `<svg viewBox="-30 -30 60 60" aria-hidden="true">
  <g class="lb-wings" opacity=".75"><ellipse class="lb-wing lb-wl" cx="-15" cy="-4" rx="15" ry="7" fill="#E9F4FF" transform="rotate(-25 -15 -4)"/>
    <ellipse class="lb-wing lb-wr" cx="15" cy="-4" rx="15" ry="7" fill="#E9F4FF" transform="rotate(25 15 -4)"/></g>
  <circle cx="0" cy="-15" r="9" fill="#1B1F3B"/><circle cx="-4" cy="-17" r="2.4" fill="#fff"/><circle cx="4" cy="-17" r="2.4" fill="#fff"/>
  <path d="M-4,-23 q-4,-6 -8,-7 M4,-23 q4,-6 8,-7" stroke="#1B1F3B" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="0" cy="3" rx="17" ry="18" fill="#E5322D"/><path d="M0,-14 V21" stroke="#1B1F3B" stroke-width="2.5"/>
  <g fill="#1B1F3B"><circle cx="-8" cy="-4" r="3.6"/><circle cx="8" cy="-4" r="3.6"/><circle cx="-10" cy="9" r="3.2"/>
    <circle cx="10" cy="9" r="3.2"/><circle cx="-4" cy="16" r="2.4"/><circle cx="4" cy="16" r="2.4"/></g>
  <ellipse cx="-7" cy="-7" rx="4" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-30 -7 -7)"/></svg>`;

const BEETLE = `<svg viewBox="-30 -30 60 60" aria-hidden="true">
  <g class="bt-legs" stroke="#2A2233" stroke-width="3" stroke-linecap="round">
    <path d="M-12,-6 l-10,-6 M-13,2 l-11,0 M-12,10 l-10,6 M12,-6 l10,-6 M13,2 l11,0 M12,10 l10,6"/></g>
  <circle cx="0" cy="-15" r="7.5" fill="#F29A38"/><circle cx="-2.5" cy="-16" r="1.6" fill="#2A2233"/><circle cx="2.5" cy="-16" r="1.6" fill="#2A2233"/>
  <ellipse cx="0" cy="3" rx="14" ry="16" fill="#F6D24A"/>
  <g stroke="#2A2233" stroke-width="2.6" fill="none" stroke-linecap="round">
    <path d="M0,-12 V19"/><path d="M-5,-10 C-7,0 -7,10 -5,17"/><path d="M5,-10 C7,0 7,10 5,17"/><path d="M-10,-6 C-12,2 -12,9 -10,13"/><path d="M10,-6 C12,2 12,9 10,13"/></g>
  <ellipse cx="-5" cy="-5" rx="3" ry="2" fill="#fff" opacity=".45"/></svg>`;

const SPRAY = `<svg viewBox="-30 -46 60 92" aria-hidden="true">
  <path d="M-8,-34 h16 v8 h-16z" fill="#E8483B"/><path d="M8,-32 h14 l2,4 h-16z" fill="#E8483B"/><path d="M-4,-26 q10,6 4,14" stroke="#B72E24" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M-12,-26 h24 v6 h-24z" fill="#F6F0E4"/>
  <path d="M-16,-20 C-18,-10 -18,30 -14,40 C-6,44 6,44 14,40 C18,30 18,-10 16,-20 Z" fill="#9AD3F5" opacity=".92"/>
  <path d="M-16,-2 C-17,20 -16,32 -14,40 C-6,44 6,44 14,40 C16,32 17,20 16,-2 Z" fill="#6BBDEB" opacity=".9"/>
  <rect x="-11" y="4" width="22" height="18" rx="5" fill="#FFFDF6"/>
  <circle cx="-3" cy="12" r="4" fill="none" stroke="#6BBDEB" stroke-width="2"/><circle cx="4" cy="10" r="2.6" fill="none" stroke="#6BBDEB" stroke-width="1.8"/>
  <circle cx="3" cy="17" r="2" fill="none" stroke="#6BBDEB" stroke-width="1.6"/>
  <path d="M-11,-16 C-12,0 -12,14 -11,24" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round" fill="none"/></svg>`;

export function createPests({ gsap, layer, view, toScreen, burst, Sound, onCaption, pointAt, spec }) {
  const live = [];                 // everything on the layer, each { el, p: {x, y}, size, rot, flip }
  let cleaned = 0;

  const place = it => {
    const s = view.s, k = it.size * s / 100;
    it.el.style.transform = `translate3d(${((it.p.x - view.vbX) * s).toFixed(1)}px,${(it.p.y * s).toFixed(1)}px,0) translate(-50%,-50%) rotate(${(it.rot || 0).toFixed(1)}deg) scale(${(it.flip ? -k : k).toFixed(3)},${k.toFixed(3)})`;
  };
  const add = (cls, svg, x, y, size) => {
    const el = document.createElement('div');
    el.className = `pest ${cls}`;
    el.innerHTML = svg;
    layer.append(el);
    const it = { el, p: { x, y }, size, rot: 0, flip: false };
    live.push(it);
    place(it);
    return it;
  };
  const drop = it => { it.el.remove(); live.splice(live.indexOf(it), 1); };
  const screenOf = it => toScreen(it.p.x, it.p.y);
  const crunch = i => Sound.tone(260 - i * 30, .07, { type: 'square', vol: .05, to: 120 });

  /* a caterpillar on the tree, wriggling where it sits */
  function caterpillar(x, y, onTap, { still = false } = {}) {
    const it = add('pest-worm', CATERPILLAR, x, y, 128);
    it.flip = Math.random() < .5;
    place(it);
    const segs = it.el.querySelectorAll('.pt-seg, .pt-head');
    it.wiggle = gsap.to(segs, { y: -3, duration: .35, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: .08, repeat: -1, yoyo: true } });
    // inching to and fro where it sits (started once it has arrived)
    it.startCreep = () => { it.creep = gsap.to(it.p, { x: `+=${it.flip ? -14 : 14}`, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', onUpdate: () => place(it) }); };
    if (!still) it.startCreep();
    gsap.from(it.el, { opacity: 0, duration: .5 });
    it.el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!it.taken) { it.taken = true; onTap(it); } });
    return it;
  }

  /* the ladybug: flies in on a curve, lands on the caterpillar, three bites, off she goes */
  function ladybugFor(worm) {
    return new Promise(resolve => {
      Sound.init();
      Sound.tone(880, .15, { type: 'triangle', vol: .08, to: 1320 });
      worm.creep?.kill();
      const fromLeft = worm.p.x > 400;
      const bug = add('pest-ladybug', LADYBUG, worm.p.x + (fromLeft ? -620 : 620), worm.p.y - 420, 96);
      const wings = bug.el.querySelectorAll('.lb-wing');
      const flap = gsap.to(wings, { scaleY: .2, duration: .06, yoyo: true, repeat: -1, transformOrigin: '50% 50%' });
      const buzz = setInterval(() => Sound.tone(190 + Math.random() * 40, .06, { type: 'sawtooth', vol: .015 }), 90);
      const land = { x: worm.p.x + (worm.flip ? -14 : 14), y: worm.p.y - 18 };
      gsap.timeline({ onComplete: resolve })
        .to(bug.p, {
          motionPath: { path: [{ x: bug.p.x, y: bug.p.y }, { x: (bug.p.x + land.x) / 2, y: land.y - 260 }, { x: land.x + (fromLeft ? 60 : -60), y: land.y - 60 }, land], curviness: 1.4 },
          duration: 1.5, ease: 'sine.inOut',
          onUpdate() { bug.rot = (fromLeft ? 1 : -1) * 25 * Math.sin(this.progress() * Math.PI); place(bug); },
        })
        .call(() => { clearInterval(buzz); flap.kill(); gsap.set(wings, { scaleY: 0 }); Sound.thud(); })
        // three bites: the caterpillar gets smaller each time, crumbs fly
        .call(() => bite(0), null, '+=.12').to(worm, { size: 70, duration: .15, onUpdate: () => place(worm) }).to(bug, { rot: -12, duration: .12, yoyo: true, repeat: 1, onUpdate: () => place(bug) }, '<')
        .call(() => bite(1), null, '+=.18').to(worm, { size: 44, duration: .15, onUpdate: () => place(worm) }).to(bug, { rot: 12, duration: .12, yoyo: true, repeat: 1, onUpdate: () => place(bug) }, '<')
        .call(() => bite(2), null, '+=.18').to(worm, { size: 0, duration: .18, onUpdate: () => place(worm) })
        .call(() => {
          worm.wiggle?.kill(); drop(worm);
          const s = screenOf(bug);
          burst(s.x, s.y, { n: 14, type: 'heart', colors: ['#FF8FA3', '#FFD36E', '#FFF4DF'], angle: -Math.PI / 2, spread: 2.2, speed: [60, 220], life: [.8, 1.4], gravity: -30, size: [6, 10], drag: .94 });
          Sound.shine();
        }, null, '+=.1')
        // a happy hop, then away
        .to(bug.p, { y: '-=24', duration: .18, yoyo: true, repeat: 1, ease: 'power2.out', onUpdate: () => place(bug) }, '+=.1')
        .call(() => { gsap.to(wings, { scaleY: .2, duration: .06, yoyo: true, repeat: 40, transformOrigin: '50% 50%' }); })
        .to(bug.p, { x: `+=${fromLeft ? 700 : -700}`, y: '-=520', duration: 1.3, ease: 'power2.in', onUpdate: () => place(bug) })
        .call(() => drop(bug));
      const bite = i => {
        crunch(i);
        const s = screenOf(worm);
        burst(s.x, s.y, { n: 8, type: 'dust', colors: ['#8BD04E', '#7CC243', '#B7E57F'], angle: -Math.PI / 2, spread: 2.6, speed: [40, 140], life: [.4, .8], gravity: 300, size: [2, 4] });
      };
    });
  }

  /* n caterpillars on the crown: resolves once the ladybug has eaten them all */
  function onTree(n = 3) {
    const C = spec.flora.crown;
    onCaption('pestsTitle', 'pestsSub');
    Sound.tone(300, .3, { type: 'triangle', vol: .08, to: 200 });
    return new Promise(resolve => {
      let left = n;
      const spots = Array.from({ length: n }, (_, i) => {
        const a = -2.4 + i * (1.9 / Math.max(1, n - 1)) + (Math.random() - .5) * .3;
        return { x: C.cx + Math.cos(a) * C.rx * .62, y: C.cy + Math.sin(a) * C.ry * .45 + C.ry * .28 };
      });
      const worms = spots.map((s, i) => {
        const w = caterpillar(s.x, s.y, async it => {
          await ladybugFor(it);
          cleaned++;
          if (--left === 0) {
            onCaption('pestsDoneTitle', '');
            Sound.shine();
            setTimeout(resolve, 900);
          }
        });
        gsap.from(w.p, { y: s.y + 60, duration: .8, delay: i * .25, ease: 'back.out(2)', onUpdate: () => place(w) });
        return w;
      });
      gsap.delayedCall(1.6, () => { const w = worms.find(w => !w.taken); if (w) pointAt(w.el); });
    });
  }

  /* a caterpillar on a fruit while picking: the fruit waits until it's clean */
  function onFruit(node) {
    node.bug = true;
    onCaption('', 'fruitBugSub');
    return new Promise(resolve => {
      const w = caterpillar(node.x + 16, node.y - 26, async it => {
        await ladybugFor(it);
        cleaned++;
        node.bug = false;
        onCaption('', 'fruitCleanSub');
        resolve();
      }, { still: true });
      w.size = 96; place(w);
      node.worm = w;
      w.flip = true;                                   // it comes from the right, head first
      gsap.from(w.p, { x: node.x + 160, duration: 1.4, ease: 'power1.out', onUpdate: () => place(w), onComplete: () => { if (!w.taken) w.startCreep(); } });
      gsap.delayedCall(1.6, () => { if (!w.taken) pointAt(w.el); });
    });
  }

  /* beetles on the potato plant; the soap spray */
  let bottle = null;
  function sprayFor(beetle) {
    return new Promise(resolve => {
      Sound.init();
      beetle.creep?.kill();
      if (!bottle) {
        bottle = add('pest-spray', SPRAY, beetle.p.x + 260, beetle.p.y - 260, 120);
        gsap.from(bottle.el, { opacity: 0, duration: .3 });
      }
      const b = bottle, aim = { x: beetle.p.x + 70, y: beetle.p.y - 70 };
      gsap.timeline({ onComplete: resolve })
        .to(b.p, { x: aim.x, y: aim.y, duration: .6, ease: 'power2.inOut', onUpdate: () => place(b) })
        .to(b, { rot: -35, duration: .2, onUpdate: () => place(b) })
        .call(() => {
          // psshh — soapy bubbles over the beetle
          for (let i = 0; i < 3; i++) setTimeout(() => {
            Sound.tone(1800 + Math.random() * 500, .12, { type: 'sawtooth', vol: .012, to: 900 });
            const s = screenOf(beetle);
            burst(s.x + 10, s.y - 10, { n: 16, colors: ['#FFFFFF', '#CDEBFA', '#9AD3F5'], angle: 2.4, spread: 1.2, speed: [80, 260], life: [.6, 1.2], gravity: 40, size: [2, 5], drag: .93 });
          }, i * 140);
        })
        .to(b, { rot: -28, duration: .08, yoyo: true, repeat: 5, onUpdate: () => place(b) })
        .to(b, { rot: 0, duration: .25, onUpdate: () => place(b) })
        // the beetle rolls on its back, kicks its legs, turns over and runs away
        .to(beetle, { rot: 180, duration: .35, ease: 'back.out(2)', onUpdate: () => place(beetle) }, '-=.5')
        .to(beetle.el.querySelector('.bt-legs'), { rotation: 12, transformOrigin: '50% 50%', duration: .08, yoyo: true, repeat: 7 }, '<')
        .call(() => { Sound.tone(520, .2, { type: 'triangle', vol: .07, to: 820 }); })
        .to(beetle, { rot: 360, duration: .3, onUpdate: () => place(beetle) })
        .to(beetle.p, { x: beetle.p.x < 400 ? -500 : 1300, duration: 1.2, ease: 'power1.in', onUpdate: () => place(beetle) })
        .call(() => drop(beetle));
    });
  }
  function onPlant(n = 3) {
    onCaption('bugsTitle', 'bugsSub');
    Sound.tone(300, .3, { type: 'triangle', vol: .08, to: 200 });
    return new Promise(resolve => {
      let left = n;
      const beetles = Array.from({ length: n }, (_, i) => {
        const x = 400 + (i - (n - 1) / 2) * 92 + (Math.random() - .5) * 20, y = 1650 + (i % 2) * 38;
        const it = add('pest-beetle', BEETLE, x, y, 84);
        it.rot = (Math.random() - .5) * 60;
        place(it);
        it.creep = gsap.to(it, { rot: `+=${(Math.random() < .5 ? -1 : 1) * 30}`, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut', onUpdate: () => place(it) });
        gsap.to(it.el.querySelector('.bt-legs'), { rotation: 8, transformOrigin: '50% 50%', duration: .12, yoyo: true, repeat: -1 });
        gsap.from(it.p, { x: x + (x < 400 ? -300 : 300), duration: 1.2, delay: i * .3, ease: 'power1.out', onUpdate: () => place(it) });
        it.el.addEventListener('pointerdown', async e => {
          e.preventDefault(); e.stopPropagation();
          if (it.taken) return;
          it.taken = true;
          await sprayFor(it);
          cleaned++;
          if (--left === 0) {
            onCaption('bugsDoneTitle', '');
            Sound.shine();
            if (bottle) gsap.to(bottle.p, { y: '-=500', duration: .8, ease: 'back.in(1.5)', onUpdate: () => place(bottle), onComplete: () => { drop(bottle); bottle = null; } });
            setTimeout(resolve, 900);
          }
        });
        return it;
      });
      gsap.delayedCall(2, () => { const b = beetles.find(b => !b.taken); if (b) pointAt(b.el); });
    });
  }

  return {
    onTree, onFruit, onPlant,
    place: () => live.forEach(place),
    get cleaned() { return cleaned; },
    destroy() { live.slice().forEach(drop); },
  };
}
