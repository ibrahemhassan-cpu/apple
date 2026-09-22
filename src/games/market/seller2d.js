/* عم البياع comes alive: the drawing in Seller.jsx, moved with GSAP.

   He breathes and blinks on his own, his eyes follow the child's finger, and he answers the cart:
       say('hello')  waves, talking            say('yes')     nods, smiling
       say('no')     shakes his head, a wagging finger          say('give')  points down at the crates
       say('row')    a little hop of joy        say('thanks')  nods and waves      say('bye')  waves on and on
   Everything talks for a moment too (the mouth), so the speech bubble looks like it's his. */
import { gsap } from 'gsap';

export function createSeller(svg) {
  if (!svg) return { say() {}, look() {}, dispose() {} };
  const q = s => svg.querySelector(s);
  const head = q('.s-head'), body = q('.s-body'), mouth = q('.s-mouth'), eyes = q('.s-eyes'), pupils = q('.s-pupils');
  const armL = q('.s-arm-l'), armR = q('.s-arm-r'), handL = q('.s-hand-l'), handR = q('.s-hand-r');
  const browL = q('.s-brow-l'), browR = q('.s-brow-r');

  // his hands at rest on the counter; the arms follow them
  const REST = { lx: 70, ly: 198, rx: 190, ry: 198 };
  const hands = { ...REST };
  const drawArms = () => {
    armL.setAttribute('x2', hands.lx); armL.setAttribute('y2', hands.ly);
    armR.setAttribute('x2', hands.rx); armR.setAttribute('y2', hands.ry);
    handL.setAttribute('cx', hands.lx); handL.setAttribute('cy', hands.ly);
    handR.setAttribute('cx', hands.rx); handR.setAttribute('cy', hands.ry);
  };
  drawArms();

  const ctx = gsap.context(() => {
    gsap.set([head, body], { svgOrigin: '130 274' });
    gsap.set(eyes, { svgOrigin: '130 84' });
    gsap.set(mouth, { svgOrigin: '130 120' });
    // breathing, and a head that never quite keeps still
    gsap.to(body, { scaleY: 1.015, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(head, { y: -2, rotation: 1.5, duration: 2.1, yoyo: true, repeat: -1, ease: 'sine.inOut', svgOrigin: '130 130' });
    // blinking, every few seconds
    const blink = () => gsap.timeline({ onComplete: () => gsap.delayedCall(2 + Math.random() * 3, blink) })
      .to(eyes, { scaleY: .1, duration: .07 }).to(eyes, { scaleY: 1, duration: .1 });
    gsap.delayedCall(1.5, blink);
  });

  const handsTo = (to, opts = {}) => gsap.to(hands, { ...to, duration: .35, ease: 'power2.out', onUpdate: drawArms, overwrite: 'auto', ...opts });
  const rest = (delay = 0) => handsTo(REST, { delay, duration: .5, ease: 'power2.inOut' });

  function talk(seconds = 1.1) {
    ctx.add(() => {
      gsap.killTweensOf(mouth);
      gsap.timeline()
        .to(mouth, { scaleY: 2.6, scaleX: .9, duration: .09, yoyo: true, repeat: Math.round(seconds / .18) * 2 - 1, ease: 'sine.inOut' })
        .to(mouth, { scaleY: 1, scaleX: 1, duration: .1 });
    });
  }

  let waving = null;
  function wave(times = 4) {
    ctx.add(() => {
      waving?.kill();
      // his right hand is on our left: up beside his head, and to and fro
      waving = gsap.timeline({ onComplete: () => rest() })
        .to(hands, { rx: 214, ry: 70, duration: .35, ease: 'back.out(2)', onUpdate: drawArms })
        .to(hands, { rx: 232, duration: .18, yoyo: true, repeat: times * 2 - 1, ease: 'sine.inOut', onUpdate: drawArms });
      if (times === Infinity) waving.eventCallback('onComplete', null);
    });
  }

  function say(what) {
    ctx.add(() => {
      if (what === 'hello') { wave(3); talk(1.4); }
      else if (what === 'bye') { waving?.kill(); waving = gsap.timeline({ repeat: -1 }).to(hands, { rx: 214, ry: 70, duration: .3, onUpdate: drawArms }).to(hands, { rx: 232, duration: .18, yoyo: true, repeat: 5, onUpdate: drawArms }); }
      else if (what === 'thanks') {
        talk(1.4);
        gsap.timeline().to(head, { y: 6, duration: .16, yoyo: true, repeat: 3, ease: 'sine.inOut' });
        gsap.to([browL, browR], { y: -4, duration: .2, yoyo: true, repeat: 1 });
        wave(4);
      } else if (what === 'yes') {
        talk(.8);
        gsap.timeline().to(head, { y: 7, duration: .15, yoyo: true, repeat: 3, ease: 'sine.inOut' });
      } else if (what === 'row') {
        talk(.8);
        gsap.timeline()
          .to([head, body, ...[armL, armR, handL, handR]], { y: -14, duration: .18, ease: 'power2.out' })
          .to([head, body, ...[armL, armR, handL, handR]], { y: 0, duration: .45, ease: 'bounce.out' });
        gsap.to([browL, browR], { y: -5, duration: .2, yoyo: true, repeat: 1 });
      } else if (what === 'no') {
        talk(.9);
        gsap.fromTo(head, { rotation: 0 }, { keyframes: { rotation: [0, -9, 8, -7, 5, 0] }, duration: .8, ease: 'none', svgOrigin: '130 130' });
        gsap.to([browL, browR], { y: 3, duration: .2, yoyo: true, repeat: 3 });
        // a finger that wags
        handsTo({ lx: 58, ly: 110 });
        gsap.to(hands, { lx: 44, duration: .14, yoyo: true, repeat: 5, delay: .35, ease: 'sine.inOut', onUpdate: drawArms });
        rest(1.3);
      } else if (what === 'give') {
        talk(.9);
        // "that one!" — pointing down at the crates
        handsTo({ lx: 40, ly: 258 });
        gsap.to(hands, { ly: 266, duration: .2, yoyo: true, repeat: 3, delay: .35, onUpdate: drawArms });
        rest(1.6);
      }
    });
  }

  /* his eyes follow a point on the screen, then come back to the child */
  let back = null;
  function look(x, y) {
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const cx = r.left + r.width * .5, cy = r.top + r.height * .31;
    const dx = Math.max(-1, Math.min(1, (x - cx) / (r.width * .8)));
    const dy = Math.max(-1, Math.min(1, (y - cy) / (r.height * .9)));
    gsap.to(pupils, { x: dx * 3, y: dy * 3.4, duration: .25, overwrite: 'auto' });
    back?.kill();
    back = gsap.delayedCall(1.6, () => gsap.to(pupils, { x: 0, y: 0, duration: .5 }));
  }

  return { say, look, dispose() { waving?.kill(); back?.kill(); ctx.revert(); } };
}
